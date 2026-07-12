/**
 * Observatório Patinhas — dados públicos sobre adoção, abandono e pets no Brasil.
 *
 * A página reúne os levantamentos mais recentes de fontes oficiais e de
 * referência (IBGE, MMA/SinPatinhas, Instituto Pet Brasil/Abempet, Mars
 * Petcare, GoldeN/Opinion Box, Cobasi Cuida, Infodados) — cada número traz a
 * fonte e a data. Onde existe API pública com CORS liberado, os dados são
 * consultados AO VIVO no navegador:
 *   - IBGE / PNS (servicodados.ibge.gov.br) → posse de cães/gatos e vacinação
 *   - Querido Diário (api.queridodiario.ok.org.br) → atos municipais da causa animal
 *
 * As duas únicas coisas que vêm da própria plataforma Patinhas (Supabase) são
 * decorativas e ficam no fim: o mural de reencontros (pets adotados) e as
 * bolhas de fotos no CTA final.
 */

const OBS_REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* =====================================================================
   Dados estáticos (levantamentos com fonte e data)
   ===================================================================== */

const OBS = {
  // Cards que viram — dados de ADOÇÃO 2025/2026 (os mais frescos).
  fatosAdocao: [
    {
      icone: "💚",
      valor: "80%",
      label: "dos pets nos lares brasileiros chegaram por adoção",
      verso: "37% vieram por doação de conhecidos, 29% foram resgatados da rua e 21% adotados em ONGs. E 90% dos tutores adotariam de novo.",
      fonte: "GoldeN / Opinion Box (2025)",
    },
    {
      icone: "🚫",
      valor: "44%",
      label: "dos tutores são contra a compra de animais",
      verso: "A adoção virou consenso: 7 em cada 10 tutores já consideram os pets como filhos da família.",
      fonte: "Opinion Box — Mercado Pet (fev 2026)",
    },
    {
      icone: "🖤",
      valor: "69%",
      label: "das ONGs dizem que pelagem preta dificulta a adoção",
      verso: "Idade avançada é barreira para 86% delas, e deficiência para 75%. O “vira-lata caramelo” é febre, mas cor, idade e porte ainda definem o destino de muitos.",
      fonte: "Panorama da Adoção – ONGs · GoldeN/IMVC (jun 2026)",
    },
    {
      icone: "🐕",
      valor: "26% e 86%",
      label: "dos cães e gatos cadastrados são vira-latas (SRD)",
      verso: "O SRD lidera o ranking de raças desde 2016. O vira-lata é, de longe, o pet favorito do Brasil.",
      fonte: "PetCenso 2025 · Petlove (base de 1,8 mi de animais)",
    },
  ],

  // Split de população (Abempet, ref. 2024).
  populacao: {
    caes: 63.7,
    gatos: 32.2,
    fonte: "Abempet (ex-Abinpet / Instituto Pet Brasil), ref. 2024",
  },

  leis: [
    {
      ano: "1998",
      titulo: "Maus-tratos viram crime",
      texto: "A Lei de Crimes Ambientais (9.605/1998) torna crime praticar abuso ou maus-tratos contra animais.",
      fonte: "Lei nº 9.605/1998 — Planalto",
    },
    {
      ano: "2020",
      titulo: "Lei Sansão endurece a pena",
      texto: "Maus-tratos a cães e gatos passam a dar reclusão de 2 a 5 anos, multa e proibição de guarda.",
      fonte: "Lei nº 14.064/2020 — Planalto",
    },
    {
      ano: "2021",
      titulo: "Fim da eliminação em canis públicos",
      texto: "Órgãos públicos ficam proibidos de eliminar cães e gatos saudáveis — o controle passa por castração e adoção.",
      fonte: "Lei nº 14.228/2021 — Planalto",
    },
  ],

  nomesUF: {
    AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia",
    CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás",
    MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais",
    PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí",
    RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RS: "Rio Grande do Sul",
    RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo",
    SE: "Sergipe", TO: "Tocantins",
  },

  mapaUF: {
    RR: [3, 1], AP: [5, 1],
    AM: [2, 2], PA: [4, 2], MA: [6, 2], CE: [8, 2], RN: [9, 2],
    AC: [1, 3], RO: [3, 3], TO: [5, 3], PI: [7, 3], PB: [9, 3],
    MT: [4, 4], BA: [6, 4], PE: [8, 4], AL: [9, 4],
    GO: [5, 5], DF: [6, 5], MG: [7, 5], SE: [8, 5],
    MS: [4, 6], SP: [5, 6], RJ: [6, 6], ES: [7, 6],
    PR: [5, 7], SC: [6, 7],
    RS: [5, 8],
  },

  // Fonte completa (bloco "todas as fontes").
  fontes: [
    { nome: "IBGE — Pesquisa Nacional de Saúde (PNS 2019), via API de agregados", url: "https://servicodados.ibge.gov.br/api/v3/agregados/4930/metadados" },
    { nome: "Querido Diário — Open Knowledge Brasil (API pública)", url: "https://queridodiario.ok.org.br/" },
    { nome: "Mars Petcare — State of Pet Homelessness Index (2024)", url: "https://www.pedigree.com.br/adocao/acoes-pedigree/relatorio-global-aponta-que-1-em-cada-3-animais-de-estimacao-nao-tem-onde-morar" },
    { nome: "GoldeN / Opinion Box — 80% dos pets são adotados (2025)", url: "https://www.cnnbrasil.com.br/nacional/sudeste/sp/80-dos-pets-nos-lares-brasileiros-foram-adotados-indica-pesquisa/" },
    { nome: "Panorama da Adoção no Brasil – ONGs · GoldeN/IMVC/Opinion Box (jun 2026)", url: "https://www.otempo.com.br/pets/2026/6/30/a-realidade-da-adocao-pesquisa-inedita-revela-como-idade-cor-e-porte-definem-o-destino-de-animais-em-abrigos-no-brasil" },
    { nome: "Opinion Box — Mercado Pet no Brasil (fev 2026)", url: "https://blog.opinionbox.com/pesquisa-mercado-pet-no-brasil/" },
    { nome: "Petlove — PetCenso 2025", url: "https://www.petlove.com.br/dicas/petcenso-2025" },
    { nome: "Instituto Pet Brasil — vulnerabilidade e ONGs (2024)", url: "https://www.cnnbrasil.com.br/nacional/quase-5-milhoes-de-pets-estao-em-situacao-de-vulnerabilidade-no-brasil/" },
    { nome: "Cobasi Cuida — abandono de animais (2025)", url: "https://blog.cobasi.com.br/pesquisa-cobasi-cuida-sobre-abandono-de-animais/" },
    { nome: "Infodados / Medicina de Abrigos Brasil — dinâmica de abrigos (2025)", url: "https://caesegatos.com.br/abandono-animal-abrigos-politicas-publicas/" },
    { nome: "MMA — SinPatinhas / ProPatinhas, balanço de 1 ano (abr 2026)", url: "https://www.folhabv.com.br/cotidiano/programa-sinpatinhas-completa-um-ano-com-mais-de-13-milhao-de-animais-cadastrados-no-brasil" },
    { nome: "Abempet (ex-Abinpet / Instituto Pet Brasil) — população e mercado (2024)", url: "https://abempet.org.br/informacoes-gerais-do-setor/" },
  ],
};

/* =====================================================================
   Helpers
   ===================================================================== */

const OBS_PAW =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.5 12.5a2 2 0 100-4 2 2 0 000 4zM8 8a2 2 0 100-4 2 2 0 000 4zM12.5 6a2 2 0 100-4 2 2 0 000 4zM17 8a2 2 0 100-4 2 2 0 000 4zM12 22c-3 0-6-1.6-6-4.3 0-2.2 2.4-3.2 3.3-4.9.6-1.1 1.3-1.9 2.7-1.9s2.1.8 2.7 1.9c.9 1.7 3.3 2.7 3.3 4.9C18 20.4 15 22 12 22z"/></svg>';

function obsEsc(s) {
  if (s === null || s === undefined) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function obsSafeUrl(url) {
  const s = String(url == null ? "" : url).trim();
  return /^https?:\/\//i.test(s) ? s : "";
}
function obsFmtNum(n) {
  return Number(n).toLocaleString("pt-BR");
}
function obsFmtPct(n, dec = 1) {
  return Number(n).toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + "%";
}
function obsEspecieEmoji(sp) {
  return sp === "gato" ? "🐱" : sp === "cachorro" ? "🐶" : "🐾";
}

/** Count-up dos números com data-count quando entram na tela. */
function obsCountUp() {
  const els = document.querySelectorAll("[data-count]");
  if (!els.length) return;
  if (OBS_REDUCED) return;
  els.forEach((el) => { el.dataset.final = el.textContent; el.textContent = "0"; });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      const el = entry.target;
      const target = Number(el.dataset.count);
      const dec = Number(el.dataset.decimals || 0);
      const dur = 1300;
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        const val = target * (1 - Math.pow(1 - p, 3));
        el.textContent = dec
          ? val.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec })
          : obsFmtNum(Math.round(val));
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = el.dataset.final;
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.5 });
  els.forEach((el) => io.observe(el));
}

/* =====================================================================
   IBGE ao vivo (PNS — posse de cães/gatos e vacinação antirrábica)
   ===================================================================== */

const IBGE_BASE = "https://servicodados.ibge.gov.br/api/v3/agregados";

/** Busca a série mais recente (periodo -1) de uma variável no nível Brasil. */
async function ibgeSerieBR(tabela, variavel) {
  const url = `${IBGE_BASE}/${tabela}/periodos/-1/variaveis/${variavel}?localidades=N1[all]`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("IBGE " + resp.status);
  const data = await resp.json();
  const serie = data[0].resultados[0].series[0].serie;
  const ano = Object.keys(serie)[0];
  return { ano, valor: Number(serie[ano]) };
}

async function obsCarregaIBGE() {
  const selo = document.getElementById("obs-ibge-selo");
  const cards = document.getElementById("obs-ibge-cards");
  const banner = document.getElementById("obs-pns-banner");
  if (!cards) return;
  try {
    // 5180 = % lares com cachorro; 5188 = % lares com gato; 5200 = % vacinação antirrábica.
    const [caes, gatos, vacina] = await Promise.all([
      ibgeSerieBR(4930, 5180),
      ibgeSerieBR(4931, 5188),
      ibgeSerieBR(4932, 5200),
    ]);
    const ano = caes.ano;
    cards.innerHTML = [
      { icone: "🐶", valor: obsFmtPct(caes.valor), label: `dos lares brasileiros têm pelo menos um <strong>cachorro</strong>` },
      { icone: "🐱", valor: obsFmtPct(gatos.valor), label: `têm pelo menos um <strong>gato</strong>` },
      { icone: "💉", valor: obsFmtPct(vacina.valor), label: `vacinaram todos os seus cães e gatos contra a <strong>raiva</strong> no último ano` },
    ].map((c) => `
      <div class="obs-stat-card obs-stat-card--live">
        <span class="obs-stat-icon">${c.icone}</span>
        <div class="obs-stat-value">${c.valor}</div>
        <p>${c.label}</p>
        <span class="obs-fonte">📌 IBGE · PNS ${obsEsc(ano)} (ao vivo)</span>
      </div>`).join("");

    if (selo) { selo.textContent = `🛰️ conectado à API do IBGE · última edição: PNS ${ano}`; selo.classList.add("ok"); }

    // Sentinela: se um dia a PNS 2026 entrar na API, avisa que há dado novo.
    if (banner && Number(ano) < 2026) {
      banner.classList.remove("hidden");
      banner.innerHTML = `ℹ️ A <strong>PNS 2026</strong> está em coleta pelo IBGE (140 mil domicílios). Assim que os resultados entrarem na API, estes números se atualizam sozinhos. Hoje, a edição mais recente disponível é a de ${ano}.`;
    }

    // Mapa por UF (mesma variável de cachorro).
    obsCarregaMapaUF();
  } catch (err) {
    if (selo) { selo.textContent = "⚠️ não foi possível falar com a API do IBGE agora — mostrando a última edição conhecida (PNS 2019)."; selo.classList.add("erro"); }
    // Fallback com os últimos valores oficiais conhecidos.
    cards.innerHTML = [
      { icone: "🐶", valor: "46,1%", label: "dos lares brasileiros têm pelo menos um <strong>cachorro</strong>" },
      { icone: "🐱", valor: "19,3%", label: "têm pelo menos um <strong>gato</strong>" },
      { icone: "💉", valor: "72,0%", label: "vacinaram todos os seus cães e gatos contra a <strong>raiva</strong> no último ano" },
    ].map((c) => `
      <div class="obs-stat-card">
        <span class="obs-stat-icon">${c.icone}</span>
        <div class="obs-stat-value">${c.valor}</div>
        <p>${c.label}</p>
        <span class="obs-fonte">📌 IBGE · PNS 2019</span>
      </div>`).join("");
    obsRenderMapaFallback();
  }
}

async function obsCarregaMapaUF() {
  const mapEl = document.getElementById("obs-map");
  if (!mapEl) return;
  try {
    const url = `${IBGE_BASE}/4930/periodos/-1/variaveis/5180?localidades=N3[all]`;
    const resp = await fetch(url);
    const data = await resp.json();
    const porUF = {};
    let ano = "";
    data[0].resultados[0].series.forEach((s) => {
      const sigla = s.localidade.id ? ufSiglaPorId(s.localidade.id) : null;
      const nome = s.localidade.nome;
      const anoK = Object.keys(s.serie)[0];
      ano = anoK;
      const val = Number(s.serie[anoK]);
      const uf = sigla || nomeParaUF(nome);
      if (uf) porUF[uf] = val;
    });
    obsRenderMapa(porUF, ano);
  } catch (err) {
    obsRenderMapaFallback();
  }
}

// Mapeia código IBGE de UF → sigla.
const UF_POR_ID = {
  "11": "RO", "12": "AC", "13": "AM", "14": "RR", "15": "PA", "16": "AP", "17": "TO",
  "21": "MA", "22": "PI", "23": "CE", "24": "RN", "25": "PB", "26": "PE", "27": "AL", "28": "SE", "29": "BA",
  "31": "MG", "32": "ES", "33": "RJ", "35": "SP",
  "41": "PR", "42": "SC", "43": "RS",
  "50": "MS", "51": "MT", "52": "GO", "53": "DF",
};
function ufSiglaPorId(id) { return UF_POR_ID[String(id)] || null; }
function nomeParaUF(nome) {
  const e = Object.entries(OBS.nomesUF).find(([, n]) => n === nome);
  return e ? e[0] : null;
}

function obsHeatClasse(pct) {
  if (pct >= 56) return "heat-4";
  if (pct >= 48) return "heat-3";
  if (pct >= 40) return "heat-2";
  return "heat-1";
}

function obsRenderMapa(porUF, ano) {
  const mapEl = document.getElementById("obs-map");
  const detail = document.getElementById("obs-uf-detail");
  if (!mapEl) return;

  mapEl.innerHTML = Object.keys(OBS.mapaUF).map((uf) => {
    const [col, row] = OBS.mapaUF[uf];
    const pct = porUF[uf];
    const heat = pct != null ? obsHeatClasse(pct) : "heat-1";
    return `<button type="button" class="obs-map-tile ${heat}" data-uf="${uf}"
      style="grid-column:${col};grid-row:${row};"
      aria-label="${OBS.nomesUF[uf]}: ${pct != null ? obsFmtPct(pct) + " dos lares com cachorro" : "sem dado"}">${uf}</button>`;
  }).join("");

  let tip = document.querySelector(".obs-tooltip");
  if (!tip) { tip = document.createElement("div"); tip.className = "obs-tooltip"; document.body.appendChild(tip); }
  mapEl.onmousemove = (e) => {
    const tile = e.target.closest(".obs-map-tile");
    if (!tile) { tip.classList.remove("visible"); return; }
    const uf = tile.dataset.uf; const pct = porUF[uf];
    tip.innerHTML = `<strong>${OBS.nomesUF[uf]}</strong><br />${pct != null ? obsFmtPct(pct) + " dos lares têm cachorro" : "sem dado"}`;
    tip.style.left = e.clientX + 14 + "px"; tip.style.top = e.clientY + 14 + "px";
    tip.classList.add("visible");
  };
  mapEl.onmouseleave = () => tip.classList.remove("visible");
  mapEl.onclick = (e) => {
    const tile = e.target.closest(".obs-map-tile");
    if (!tile || !detail) return;
    mapEl.querySelectorAll(".obs-map-tile").forEach((t) => t.classList.remove("selected"));
    tile.classList.add("selected");
    obsRenderUfDetail(detail, tile.dataset.uf, porUF, ano);
  };

  if (detail) {
    // Começa destacando o campeão.
    let top = null, topPct = -1;
    Object.entries(porUF).forEach(([uf, pct]) => { if (pct > topPct) { topPct = pct; top = uf; } });
    top = top || "SP";
    const tile = mapEl.querySelector(`[data-uf="${top}"]`);
    if (tile) tile.classList.add("selected");
    obsRenderUfDetail(detail, top, porUF, ano);
  }
}

function obsRenderUfDetail(el, uf, porUF, ano) {
  const pct = porUF[uf];
  const ranked = Object.entries(porUF).sort((a, b) => b[1] - a[1]);
  const pos = ranked.findIndex(([u]) => u === uf) + 1;
  el.innerHTML = `
    <h3>📍 ${OBS.nomesUF[uf]}</h3>
    <div class="obs-regiao-share">${pct != null ? obsFmtPct(pct) : "—"}</div>
    <p class="obs-regiao-desc">dos lares em ${OBS.nomesUF[uf]} têm pelo menos um cachorro${pos ? ` — <strong>${pos}º</strong> entre as 27 unidades federativas` : ""}.</p>
    <span class="obs-fonte">📌 IBGE · PNS ${obsEsc(ano || "2019")}</span>`;
}

function obsRenderMapaFallback() {
  // Percentuais oficiais PNS 2019 por UF (fallback quando a API não responde).
  const pns2019 = {
    RO: 64.8, MS: 61.5, MT: 61.2, AC: 60.0, RR: 58.9, PR: 58.7, TO: 57.9, GO: 56.4,
    SC: 55.8, RS: 54.6, MG: 52.0, ES: 51.2, AP: 50.8, PA: 49.6, AM: 48.7, DF: 47.9,
    SP: 45.1, RJ: 41.9, MA: 41.0, BA: 39.5, CE: 38.8, PI: 38.2, RN: 37.4, PB: 36.1,
    SE: 34.7, PE: 34.2, AL: 34.0,
  };
  obsRenderMapa(pns2019, "2019");
}

/* =====================================================================
   Querido Diário ao vivo (atos municipais da causa animal)
   ===================================================================== */

async function obsCarregaQueridoDiario() {
  const num = document.getElementById("obs-qd-num");
  const selo = document.getElementById("obs-qd-selo");
  const lista = document.getElementById("obs-qd-lista");
  if (!num) return;
  const termo = "castração de animais";
  try {
    const url = `https://api.queridodiario.ok.org.br/gazettes?querystring=${encodeURIComponent('"' + termo + '"')}&size=5&sort_by=descending_date`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("QD " + resp.status);
    const data = await resp.json();
    num.textContent = obsFmtNum(data.total_gazettes || 0);
    if (selo) { selo.textContent = "🟢 consultado ao vivo no Querido Diário"; selo.classList.add("ok"); }
    const items = (data.gazettes || []).slice(0, 4);
    if (lista && items.length) {
      lista.innerHTML = items.map((g) => {
        const url = obsSafeUrl(g.url || g.txt_url);
        const data = g.date ? g.date.split("-").reverse().join("/") : "";
        const local = `${obsEsc(g.territory_name || "")}${g.state_code ? " · " + obsEsc(g.state_code) : ""}`;
        return `<a class="obs-qd-item" ${url ? `href="${obsEsc(url)}" target="_blank" rel="noopener"` : ""}>
          <span class="obs-qd-item-local">📍 ${local}</span>
          <span class="obs-qd-item-data">${obsEsc(data)}</span>
        </a>`;
      }).join("");
    }
  } catch (err) {
    num.textContent = "1.000+";
    if (selo) { selo.textContent = "⚠️ Querido Diário indisponível agora — mostrando o último total conhecido."; selo.classList.add("erro"); }
  }
}

/* =====================================================================
   Componentes estáticos
   ===================================================================== */

function obsRenderPictograma(el) {
  const abandonados = 25; // 1 em cada 4
  el.innerHTML =
    `<div class="obs-picto" role="img" aria-label="De cada 100 cães e gatos no Brasil, cerca de 25 estão em situação de abandono.">` +
    Array.from({ length: 100 }, (_, i) => `<span class="obs-picto-paw ${i < abandonados ? "abandonada" : ""}">🐾</span>`).join("") +
    `</div>
    <p class="obs-picto-legenda">
      <span><strong>1 em cada 4</strong> cães e gatos do Brasil está em situação de abandono — cerca de <strong>30,2 milhões</strong> de animais.</span>
      <span class="obs-picto-key abandono">Em abandono</span>
      <span class="obs-picto-key familia">Com família</span>
    </p>
    <span class="obs-fonte">📌 Mars Petcare — State of Pet Homelessness Index (coleta 2022–23, divulgado 2024); corrobora a estimativa de 30 mi da OMS</span>`;
}

function obsRenderFatos(el) {
  el.innerHTML = OBS.fatosAdocao.map((f) => `
      <button type="button" class="obs-flip" aria-label="${obsEsc(f.valor)} ${obsEsc(f.label)}. ${obsEsc(f.verso)} Fonte: ${obsEsc(f.fonte)}">
        <div class="obs-flip-inner">
          <div class="obs-flip-front">
            <span class="obs-flip-icon">${f.icone}</span>
            <span class="obs-flip-value">${obsEsc(f.valor)}</span>
            <span class="obs-flip-label">${f.label}</span>
            <span class="obs-flip-hint">toque para ver ✨</span>
          </div>
          <div class="obs-flip-back">
            <p>${obsEsc(f.verso)}</p>
            <span class="obs-fonte">📌 ${obsEsc(f.fonte)}</span>
          </div>
        </div>
      </button>`).join("");
  el.querySelectorAll(".obs-flip").forEach((card) => {
    card.addEventListener("click", () => card.classList.toggle("flipped"));
  });
}

function obsRenderSplit(el) {
  const { caes, gatos, fonte } = OBS.populacao;
  const total = caes + gatos;
  const pctCaes = Math.round((caes / total) * 100);
  el.innerHTML = `
    <div class="obs-split-bar" role="img" aria-label="Cães: ${caes} milhões. Gatos: ${gatos} milhões.">
      <div class="obs-split-a" style="width:${pctCaes}%"><span>🐶 ${String(caes).replace(".", ",")} mi</span></div>
      <div class="obs-split-b" style="width:${100 - pctCaes}%"><span>🐱 ${String(gatos).replace(".", ",")} mi</span></div>
    </div>
    <div class="obs-split-caption"><span>Cães</span><span>Gatos</span></div>
    <span class="obs-fonte">📌 ${obsEsc(fonte)} · o Brasil tem a 3ª maior população pet do mundo (160,9 mi, ref. 2023)</span>`;
}

function obsRenderLeis(el) {
  el.innerHTML = OBS.leis.map((l) => `
      <div class="obs-timeline-item">
        <span class="obs-timeline-year">${l.ano}</span>
        <h3>${obsEsc(l.titulo)}</h3>
        <p>${obsEsc(l.texto)}</p>
        <span class="obs-fonte">📌 ${obsEsc(l.fonte)}</span>
      </div>`).join("");
}

function obsRenderFontes(el) {
  el.innerHTML = OBS.fontes.map((f) => {
    const url = obsSafeUrl(f.url);
    return `<li>${url ? `<a href="${obsEsc(url)}" target="_blank" rel="noopener">${obsEsc(f.nome)} ↗</a>` : obsEsc(f.nome)}</li>`;
  }).join("");
}

/* =====================================================================
   Supabase (decorativo) — reencontros + bolhas
   ===================================================================== */

async function obsFetchPets() {
  if (!window.sb || window.DEMO_MODE) return null;
  const { data, error } = await window.sb
    .from("pets")
    .select("id,name,species,status,photo_url,created_at,updated_at");
  if (error) return null;
  return data || [];
}

function obsRenderReencontros(pets) {
  const wrap = document.getElementById("obs-reencontros");
  if (!wrap) return;
  const adotados = (pets || [])
    .filter((p) => p.status === "adotado")
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

  if (!adotados.length) {
    wrap.innerHTML = `<p class="obs-vazio">Os primeiros reencontros do Patinhas ainda vão acontecer — e podem começar com você. 💚</p>`;
    return;
  }
  wrap.innerHTML = adotados.map((p) => {
    const foto = obsSafeUrl(p.photo_url);
    const espera = Math.max(0, Math.round((new Date(p.updated_at) - new Date(p.created_at)) / 86400000));
    return `
      <article class="obs-reencontro">
        <div class="obs-reencontro-foto">
          ${foto ? `<img src="${obsEsc(foto)}" alt="Foto de ${obsEsc(p.name)}" loading="lazy" decoding="async" />`
                 : `<span>${obsEspecieEmoji(p.species)}</span>`}
          <span class="obs-carimbo" aria-hidden="true">ADOTADO</span>
        </div>
        <div class="obs-reencontro-body">
          <strong>${obsEsc(p.name)}</strong>
          <span class="obs-reencontro-espera">${espera === 0 ? "encontrou um lar rapidinho" : `esperou ${espera} dia${espera === 1 ? "" : "s"} até o abraço`}</span>
        </div>
      </article>`;
  }).join("");
}

/**
 * Bolhas líquidas no CTA: fotos dos pets flutuando como um líquido, com leve
 * repulsão do mouse. É decorativo (aria-hidden) — o CTA de verdade são os
 * botões. Clicar numa bolha leva ao mural.
 */
function obsRenderBolhas(pets) {
  const host = document.getElementById("obs-bolhas");
  if (!host) return;

  // Fontes das bolhas: fotos reais; se faltarem, completa com emojis fofos.
  const comFoto = (pets || []).filter((p) => obsSafeUrl(p.photo_url));
  const fontes = [];
  comFoto.forEach((p) => fontes.push({ foto: obsSafeUrl(p.photo_url), id: p.id, sp: p.species }));
  const emojis = ["🐶", "🐱", "🐾", "🦴", "🐕", "🐈"];
  while (fontes.length < 12) fontes.push({ emoji: emojis[fontes.length % emojis.length], sp: fontes.length % 2 ? "gato" : "cachorro" });
  const usadas = fontes.slice(0, 14);

  host.innerHTML = usadas.map((s) => {
    const r = 24 + Math.round(Math.random() * 22); // raio 24–46
    const inner = s.foto
      ? `<img src="${obsEsc(s.foto)}" alt="" loading="lazy" decoding="async" />`
      : `<span class="obs-bolha-emoji">${s.emoji}</span>`;
    const href = s.id ? `../index.html#pet-${obsEsc(s.id)}` : "../index.html";
    return `<a class="obs-bolha" href="${href}" tabindex="-1" style="--r:${r}px" data-r="${r}">${inner}</a>`;
  }).join("");

  obsFisicaBolhas(host);
}

function obsFisicaBolhas(host) {
  const bolhas = [...host.querySelectorAll(".obs-bolha")];
  const rect0 = host.getBoundingClientRect();
  let W = rect0.width, H = rect0.height || 320;

  const state = bolhas.map((el) => {
    const r = Number(el.dataset.r);
    return {
      el, r,
      x: Math.random() * Math.max(1, W - 2 * r),
      y: Math.random() * Math.max(1, H - 2 * r),
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
    };
  });

  const place = (b) => { b.el.style.transform = `translate(${b.x}px, ${b.y}px)`; };
  state.forEach(place);

  if (OBS_REDUCED) return; // estático: já posicionadas espalhadas

  let mouse = null;
  host.addEventListener("pointermove", (e) => {
    const r = host.getBoundingClientRect();
    mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
  });
  host.addEventListener("pointerleave", () => { mouse = null; });

  const ro = new ResizeObserver(() => {
    const r = host.getBoundingClientRect();
    W = r.width; H = r.height || H;
  });
  ro.observe(host);

  let raf = 0, running = true;
  const step = () => {
    if (!running) return;
    state.forEach((b) => {
      // deriva suave
      b.vx += (Math.random() - 0.5) * 0.03;
      b.vy += (Math.random() - 0.5) * 0.03;
      // repulsão gentil do mouse
      if (mouse) {
        const cx = b.x + b.r, cy = b.y + b.r;
        const dx = cx - mouse.x, dy = cy - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 120 * 120 && d2 > 1) {
          const d = Math.sqrt(d2);
          const f = (120 - d) / 120 * 0.6;
          b.vx += (dx / d) * f; b.vy += (dy / d) * f;
        }
      }
      // limita velocidade (sensação de líquido)
      const sp = Math.hypot(b.vx, b.vy), max = 0.9;
      if (sp > max) { b.vx = b.vx / sp * max; b.vy = b.vy / sp * max; }
      b.x += b.vx; b.y += b.vy;
      // paredes
      if (b.x < 0) { b.x = 0; b.vx = Math.abs(b.vx); }
      if (b.x > W - 2 * b.r) { b.x = W - 2 * b.r; b.vx = -Math.abs(b.vx); }
      if (b.y < 0) { b.y = 0; b.vy = Math.abs(b.vy); }
      if (b.y > H - 2 * b.r) { b.y = H - 2 * b.r; b.vy = -Math.abs(b.vy); }
      place(b);
    });
    raf = requestAnimationFrame(step);
  };

  // Só anima quando a seção está visível (economia).
  const vis = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !raf) { running = true; raf = requestAnimationFrame(step); }
      else if (!entry.isIntersecting) { running = false; cancelAnimationFrame(raf); raf = 0; }
    });
  }, { threshold: 0.05 });
  vis.observe(host);
}

/* =====================================================================
   Boot
   ===================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  obsCountUp();

  const picto = document.getElementById("obs-pictograma");
  if (picto) obsRenderPictograma(picto);
  const fatos = document.getElementById("obs-fatos");
  if (fatos) obsRenderFatos(fatos);
  const split = document.getElementById("obs-split");
  if (split) obsRenderSplit(split);
  const leis = document.getElementById("obs-leis");
  if (leis) obsRenderLeis(leis);
  const fontes = document.getElementById("obs-fontes-lista");
  if (fontes) obsRenderFontes(fontes);

  obsCarregaIBGE();
  obsCarregaQueridoDiario();

  obsFetchPets().then((pets) => {
    obsRenderReencontros(pets);
    obsRenderBolhas(pets);
  });
});
