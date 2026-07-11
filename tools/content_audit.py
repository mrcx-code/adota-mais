#!/usr/bin/env python3
"""
Auditoria diária de conteúdo do Patinhas.

Busca o conteúdo PÚBLICO do Supabase (pets e perfis de ONGs) usando a chave
anon (a mesma do site) e roda checagens determinísticas de segurança sobre as
URLs e textos. Não acessa dados privados (interessados/feedback continuam
bloqueados pela RLS).

Saída: um relatório JSON no stdout com a lista de itens sinalizados. A parte de
julgamento fino (texto/imagem antiético ou "não amigável") fica para o agente
que roda este script — ele lê os textos retornados e avalia.

Uso:
    python tools/content_audit.py            # relatório humano + resumo
    python tools/content_audit.py --json     # só JSON (para a rotina/agent)
"""

import json
import re
import sys
import urllib.request
import urllib.error
from pathlib import Path

CONFIG = Path(__file__).resolve().parent.parent / "js" / "config.js"

# Domínios encurtadores — escondem o destino real, risco em link público.
URL_SHORTENERS = {
    "bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly", "is.gd", "buff.ly",
    "rebrand.ly", "cutt.ly", "shorturl.at", "rb.gy", "t.ly", "encurtador.com.br",
}
# TLDs frequentemente associados a abuso/phishing (só um sinal, não veredito).
SUSPICIOUS_TLDS = {
    ".zip", ".mov", ".xyz", ".top", ".click", ".country", ".gq", ".tk", ".ml",
    ".cf", ".ga", ".work", ".loan", ".men", ".date",
}
# Palavras que merecem revisão humana/LLM (pré-triagem, PT/EN). Propositalmente
# curto e conservador — o agente faz o julgamento real de contexto.
TEXT_FLAGS = [
    r"\bvend[oe]\b", r"\bà venda\b", r"\bpreço\b", r"\bR\$\s*\d", r"\bpix\b",
    r"\bwhats(app)?\b.*\d{4}", r"\bhttps?://", r"\bwww\.",
    r"\bcompr[ae]\b", r"\bdinheiro\b", r"\btransfer[êe]ncia\b",
]

URL_FIELDS_PET = ["photo_url", "adoption_form_url"]
URL_FIELDS_ORG = ["website", "logo_url", "instagram"]
TEXT_FIELDS_PET = ["name", "description", "favorite_toy"]
TEXT_FIELDS_ORG = ["org_name", "description"]


def read_config():
    txt = CONFIG.read_text(encoding="utf-8")
    url = re.search(r'SUPABASE_URL\s*=\s*"([^"]+)"', txt)
    key = re.search(r'SUPABASE_ANON_KEY\s*=\s*"([^"]+)"', txt)
    if not url or not key:
        raise SystemExit("Não achei SUPABASE_URL/ANON_KEY em js/config.js")
    return url.group(1).rstrip("/"), key.group(1)


def fetch(base, key, table, select):
    req = urllib.request.Request(
        f"{base}/rest/v1/{table}?select={select}",
        headers={"apikey": key, "Authorization": f"Bearer {key}"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def check_url(value):
    """Retorna lista de problemas para uma URL (string vazia => sem problema)."""
    problems = []
    if not value:
        return problems
    s = str(value).strip()
    low = s.lower()
    if not re.match(r"^https?://", low):
        # Instagram às vezes é salvo como "@handle" — não é URL, ignore.
        if not low.startswith("@"):
            problems.append(f"esquema não-http: {s[:60]}")
        return problems
    if low.startswith("http://"):
        problems.append("http sem TLS")
    m = re.match(r"^https?://([^/]+)", low)
    host = m.group(1) if m else ""
    host = host.split("@")[-1].split(":")[0]  # tira user:pass@ e :porta
    if host in URL_SHORTENERS:
        problems.append(f"encurtador de link: {host}")
    for tld in SUSPICIOUS_TLDS:
        if host.endswith(tld):
            problems.append(f"TLD suspeito: {host}")
            break
    if re.match(r"^\d{1,3}(\.\d{1,3}){3}$", host):
        problems.append(f"IP em vez de domínio: {host}")
    return problems


def check_text(value):
    problems = []
    if not value:
        return problems
    s = str(value)
    for pat in TEXT_FLAGS:
        if re.search(pat, s, re.IGNORECASE):
            problems.append(f"padrão a revisar: /{pat}/")
    return problems


def audit():
    base, key = read_config()
    findings = []

    pets = fetch(base, key, "pets",
                 "id,name,description,favorite_toy,photo_url,adoption_form_url,org_id,status")
    orgs = fetch(base, key, "profiles",
                 "id,org_name,description,website,logo_url,instagram")

    for p in pets:
        item = {"type": "pet", "id": p.get("id"), "name": p.get("name"), "issues": [], "review_text": {}}
        for f in URL_FIELDS_PET:
            for prob in check_url(p.get(f)):
                item["issues"].append({"field": f, "problem": prob, "value": p.get(f)})
        for f in TEXT_FIELDS_PET:
            item["review_text"][f] = p.get(f)
            for prob in check_text(p.get(f)):
                item["issues"].append({"field": f, "problem": prob, "value": p.get(f)})
        if item["issues"]:
            findings.append(item)

    for o in orgs:
        item = {"type": "org", "id": o.get("id"), "name": o.get("org_name"), "issues": [], "review_text": {}}
        for f in URL_FIELDS_ORG:
            for prob in check_url(o.get(f)):
                item["issues"].append({"field": f, "problem": prob, "value": o.get(f)})
        for f in TEXT_FIELDS_ORG:
            item["review_text"][f] = o.get(f)
            for prob in check_text(o.get(f)):
                item["issues"].append({"field": f, "problem": prob, "value": o.get(f)})
        if item["issues"]:
            findings.append(item)

    # Também devolve TODO o texto/imagens para o agente julgar ética/amigabilidade,
    # mesmo sem flag determinística.
    corpus = {
        "pets": [{"id": p.get("id"), "name": p.get("name"),
                  "description": p.get("description"),
                  "favorite_toy": p.get("favorite_toy"),
                  "photo_url": p.get("photo_url")} for p in pets],
        "orgs": [{"id": o.get("id"), "org_name": o.get("org_name"),
                  "description": o.get("description"),
                  "website": o.get("website"), "logo_url": o.get("logo_url")} for o in orgs],
    }

    return {
        "counts": {"pets": len(pets), "orgs": len(orgs), "flagged": len(findings)},
        "flagged": findings,
        "corpus_for_review": corpus,
    }


def main():
    try:
        report = audit()
    except urllib.error.URLError as e:
        raise SystemExit(f"Erro de rede ao consultar o Supabase: {e}")

    if "--json" in sys.argv:
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return

    c = report["counts"]
    print(f"Auditoria de conteúdo Patinhas — {c['pets']} pets, {c['orgs']} ONGs, "
          f"{c['flagged']} item(ns) sinalizado(s) pelas checagens automáticas.\n")
    if not report["flagged"]:
        print("Nenhum problema determinístico de URL/texto encontrado.")
    for item in report["flagged"]:
        print(f"- [{item['type']}] {item['name']} ({item['id']})")
        for iss in item["issues"]:
            print(f"    • {iss['field']}: {iss['problem']}")
    print("\n(Revisão de ética/amigabilidade de textos e imagens: ver "
          "corpus_for_review no modo --json.)")


if __name__ == "__main__":
    main()
