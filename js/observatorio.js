/**
 * Observatório Patinhas — dados públicos sobre adoção, abandono e pets no Brasil.
 *
 * Reúne os levantamentos mais recentes de fontes oficiais e de referência
 * (MMA/SinPatinhas, Mars Petcare, GoldeN/Opinion Box, Instituto Pet Brasil,
 * Cobasi Cuida, Infodados, PetCenso/Petlove, Abempet, IBGE) — cada número com
 * fonte e data. O mapa por estado é alimentado ao vivo pela API pública do
 * IBGE (com fallback embutido). O mural de reencontros e as bolhas do CTA
 * final vêm do Supabase (decorativos).
 */

const OBS_REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* =====================================================================
   Dados
   ===================================================================== */

const OBS = {
  // Carrossel do hero — os grandes números, cada um com fonte e data.
  numeros: [
    { valor: "30,2", unidade: "mi", label: "de cães e gatos em situação de <strong>abandono</strong> — 1 em cada 4", fonte: "Mars · State of Pet Homelessness (2024)", cor: "danger" },
    { valor: "80", unidade: "%", label: "dos pets nos lares brasileiros chegaram por <strong>adoção</strong>", fonte: "GoldeN / Opinion Box (2025)", cor: "brand" },
    { valor: "1,3", unidade: "mi", label: "de animais ganharam “RG” no 1º ano do <strong>SinPatinhas</strong>", fonte: "MMA / Gov. Federal (abr 2026)", cor: "brand" },
    { valor: "675", unidade: "mil", label: "<strong>castrações gratuitas</strong> pelo programa ProPatinhas", fonte: "MMA / ProPatinhas (2026)", cor: "brand" },
    { valor: "4,8", unidade: "mi", label: "de cães e gatos em condição de <strong>vulnerabilidade</strong>", fonte: "Instituto Pet Brasil (2024)", cor: "amber" },
    { valor: "44", unidade: "%", label: "dos tutores são <strong>contra comprar</strong> animais — preferem adotar", fonte: "Opinion Box · Mercado Pet (fev 2026)", cor: "brand" },
    { valor: "201", unidade: "mil", label: "animais acolhidos por cerca de <strong>400 ONGs</strong> e protetores", fonte: "Instituto Pet Brasil (2024)", cor: "amber" },
    { valor: "160,9", unidade: "mi", label: "de pets no Brasil — a <strong>3ª maior população</strong> do mundo", fonte: "Abempet (ref. 2023)", cor: "brand" },
    { valor: "1,35", unidade: "→1", label: "entram no abrigo para cada <strong>1 que sai</strong> — a conta não fecha", fonte: "Infodados / Medicina de Abrigos (2025)", cor: "danger" },
  ],

  fatosAdocao: [
    {
      icone: "💚", valor: "80%",
      label: "dos pets nos lares brasileiros chegaram por adoção",
      verso: "37% vieram por doação de conhecidos, 29% foram resgatados da rua e 21% adotados em ONGs. E 90% dos tutores adotariam de novo.",
      fonte: "GoldeN / Opinion Box (2025)",
    },
    {
      icone: "🚫", valor: "44%",
      label: "dos tutores são contra a compra de animais",
      verso: "A adoção virou consenso: 7 em cada 10 tutores já consideram os pets como filhos da família.",
      fonte: "Opinion Box — Mercado Pet (fev 2026)",
    },
    {
      icone: "🖤", valor: "69%",
      label: "das ONGs dizem que pelagem preta dificulta a adoção",
      verso: "Idade avançada é barreira para 86% delas, e deficiência para 75%. Cor, idade e porte ainda definem o destino de muitos animais.",
      fonte: "Panorama da Adoção – ONGs · GoldeN/IMVC (jun 2026)",
    },
    {
      icone: "🐕", valor: "26% e 86%",
      label: "dos cães e gatos cadastrados são vira-latas (SRD)",
      verso: "O SRD lidera o ranking de raças desde 2016. O vira-lata é, de longe, o pet favorito do Brasil.",
      fonte: "PetCenso 2025 · Petlove (base de 1,8 mi de animais)",
    },
  ],

  populacao: { caes: 63.7, gatos: 32.2, fonte: "Abempet (ex-Abinpet / Instituto Pet Brasil), ref. 2024" },

  leis: [
    { ano: "1998", titulo: "Maus-tratos viram crime", texto: "A Lei de Crimes Ambientais (9.605/1998) torna crime praticar abuso ou maus-tratos contra animais.", fonte: "Lei nº 9.605/1998 — Planalto" },
    { ano: "2020", titulo: "Lei Sansão endurece a pena", texto: "Maus-tratos a cães e gatos passam a dar reclusão de 2 a 5 anos, multa e proibição de guarda.", fonte: "Lei nº 14.064/2020 — Planalto" },
    { ano: "2021", titulo: "Fim da eliminação em canis públicos", texto: "Órgãos públicos ficam proibidos de eliminar cães e gatos saudáveis — o controle passa por castração e adoção.", fonte: "Lei nº 14.228/2021 — Planalto" },
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

  fontes: [
    { nome: "IBGE", tipo: "Instituto oficial · PNS", url: "https://www.ibge.gov.br/", dominio: "ibge.gov.br", emoji: "📊" },
    { nome: "Gov. Federal · MMA", tipo: "SinPatinhas / ProPatinhas", url: "https://www.gov.br/mma/pt-br", dominio: "gov.br", emoji: "🏛️" },
    { nome: "Mars Petcare", tipo: "State of Pet Homelessness", url: "https://www.pedigree.com.br/adocao/acoes-pedigree/relatorio-global-aponta-que-1-em-cada-3-animais-de-estimacao-nao-tem-onde-morar", dominio: "pedigree.com.br", emoji: "🌎" },
    { nome: "Instituto Pet Brasil / Abempet", tipo: "Entidade do setor", url: "https://abempet.org.br/informacoes-gerais-do-setor/", dominio: "abempet.org.br", emoji: "🏢" },
    { nome: "Opinion Box", tipo: "Instituto de pesquisa", url: "https://blog.opinionbox.com/pesquisa-mercado-pet-no-brasil/", dominio: "opinionbox.com", emoji: "📈" },
    { nome: "Petlove", tipo: "PetCenso 2025", url: "https://www.petlove.com.br/dicas/petcenso-2025", dominio: "petlove.com.br", emoji: "🛒" },
    { nome: "Cobasi", tipo: "Pesquisa Cobasi Cuida", url: "https://blog.cobasi.com.br/pesquisa-cobasi-cuida-sobre-abandono-de-animais/", dominio: "cobasi.com.br", emoji: "🐾" },
    { nome: "Medicina de Abrigos", tipo: "Infodados de Abrigos", url: "https://caesegatos.com.br/abandono-animal-abrigos-politicas-publicas/", dominio: "caesegatos.com.br", emoji: "🏥" },
    { nome: "GoldeN / IMVC", tipo: "Panorama da Adoção", url: "https://www.otempo.com.br/pets/2026/6/30/a-realidade-da-adocao-pesquisa-inedita-revela-como-idade-cor-e-porte-definem-o-destino-de-animais-em-abrigos-no-brasil", dominio: "otempo.com.br", emoji: "📰" },
    { nome: "CNN Brasil", tipo: "Cobertura jornalística", url: "https://www.cnnbrasil.com.br/nacional/sudeste/sp/80-dos-pets-nos-lares-brasileiros-foram-adotados-indica-pesquisa/", dominio: "cnnbrasil.com.br", emoji: "📺" },
  ],
};

/* =====================================================================
   Helpers
   ===================================================================== */

function obsEsc(s) {
  if (s === null || s === undefined) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function obsSafeUrl(url) {
  const s = String(url == null ? "" : url).trim();
  return /^https?:\/\//i.test(s) ? s : "";
}
function obsFmtPct(n, dec = 1) {
  return Number(n).toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + "%";
}
function obsEspecieEmoji(sp) { return sp === "gato" ? "🐱" : sp === "cachorro" ? "🐶" : "🐾"; }

const OBS_PAW =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.5 12.5a2 2 0 100-4 2 2 0 000 4zM8 8a2 2 0 100-4 2 2 0 000 4zM12.5 6a2 2 0 100-4 2 2 0 000 4zM17 8a2 2 0 100-4 2 2 0 000 4zM12 22c-3 0-6-1.6-6-4.3 0-2.2 2.4-3.2 3.3-4.9.6-1.1 1.3-1.9 2.7-1.9s2.1.8 2.7 1.9c.9 1.7 3.3 2.7 3.3 4.9C18 20.4 15 22 12 22z"/></svg>';

/* =====================================================================
   Hero — carrossel de números
   ===================================================================== */

function obsRenderCarrossel() {
  const track = document.getElementById("obs-hero-track");
  const dotsWrap = document.getElementById("obs-hero-dots");
  if (!track) return;

  track.innerHTML = OBS.numeros.map((n) => `
    <article class="obs-num-card cor-${n.cor}">
      <div class="obs-num-value"><span class="obs-num-n">${obsEsc(n.valor)}</span><span class="obs-num-u">${obsEsc(n.unidade)}</span></div>
      <p class="obs-num-label">${n.label}</p>
      <span class="obs-num-fonte">📌 ${obsEsc(n.fonte)}</span>
    </article>`).join("");

  if (dotsWrap) {
    dotsWrap.innerHTML = OBS.numeros.map((_, i) => `<button type="button" class="obs-dot" data-i="${i}" aria-label="Ir para o número ${i + 1}"></button>`).join("");
  }

  const cards = [...track.querySelectorAll(".obs-num-card")];
  const scrollToCard = (i) => {
    const card = cards[Math.max(0, Math.min(i, cards.length - 1))];
    if (card) track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: OBS_REDUCED ? "auto" : "smooth" });
  };

  document.querySelectorAll(".obs-carousel-arrow").forEach((btn) => {
    btn.addEventListener("click", () => {
      const dir = Number(btn.dataset.dir);
      const cur = obsCardAtual(track, cards);
      scrollToCard(cur + dir);
    });
  });
  if (dotsWrap) {
    dotsWrap.addEventListener("click", (e) => {
      const dot = e.target.closest(".obs-dot");
      if (dot) scrollToCard(Number(dot.dataset.i));
    });
  }

  // Atualiza dots ativos + estado das setas conforme rola.
  const sync = () => {
    const cur = obsCardAtual(track, cards);
    if (dotsWrap) dotsWrap.querySelectorAll(".obs-dot").forEach((d, i) => d.classList.toggle("on", i === cur));
    const prev = document.querySelector(".obs-carousel-arrow.prev");
    const next = document.querySelector(".obs-carousel-arrow.next");
    if (prev) prev.disabled = track.scrollLeft <= 2;
    if (next) next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
  };
  track.addEventListener("scroll", () => { window.requestAnimationFrame(sync); }, { passive: true });
  sync();
}

function obsCardAtual(track, cards) {
  const x = track.scrollLeft + track.clientWidth / 2;
  let best = 0, bestD = Infinity;
  cards.forEach((c, i) => {
    const center = c.offsetLeft - track.offsetLeft + c.offsetWidth / 2;
    const d = Math.abs(center - x);
    if (d < bestD) { bestD = d; best = i; }
  });
  return best;
}

/* =====================================================================
   Mapa por estado + lista rolável (dado IBGE, ao vivo com fallback)
   ===================================================================== */

const IBGE_BASE = "https://servicodados.ibge.gov.br/api/v3/agregados";
const UF_POR_ID = {
  "11": "RO", "12": "AC", "13": "AM", "14": "RR", "15": "PA", "16": "AP", "17": "TO",
  "21": "MA", "22": "PI", "23": "CE", "24": "RN", "25": "PB", "26": "PE", "27": "AL", "28": "SE", "29": "BA",
  "31": "MG", "32": "ES", "33": "RJ", "35": "SP", "41": "PR", "42": "SC", "43": "RS",
  "50": "MS", "51": "MT", "52": "GO", "53": "DF",
};

const OBS_PNS2019 = {
  RO: 64.8, MS: 61.5, MT: 61.2, AC: 60.0, RR: 58.9, PR: 58.7, TO: 57.9, GO: 56.4,
  SC: 55.8, RS: 54.6, MG: 52.0, ES: 51.2, AP: 50.8, PA: 49.6, AM: 48.7, DF: 47.9,
  SP: 45.1, RJ: 41.9, MA: 41.0, BA: 39.5, CE: 38.8, PI: 38.2, RN: 37.4, PB: 36.1,
  SE: 34.7, PE: 34.2, AL: 34.0,
};

async function obsCarregaMapa() {
  const mapEl = document.getElementById("obs-map");
  if (!mapEl) return;
  try {
    const url = `${IBGE_BASE}/4930/periodos/-1/variaveis/5180?localidades=N3[all]`;
    const resp = await fetch(url);
    const data = await resp.json();
    const porUF = {};
    let ano = "";
    data[0].resultados[0].series.forEach((s) => {
      const uf = UF_POR_ID[String(s.localidade.id)];
      const anoK = Object.keys(s.serie)[0];
      ano = anoK;
      if (uf) porUF[uf] = Number(s.serie[anoK]);
    });
    obsRenderMapa(porUF, ano);
  } catch (err) {
    obsRenderMapa(OBS_PNS2019, "2019");
  }
}

function obsHeat(pct) {
  if (pct >= 56) return "heat-4";
  if (pct >= 48) return "heat-3";
  if (pct >= 40) return "heat-2";
  return "heat-1";
}

function obsRenderMapa(porUF, ano) {
  const mapEl = document.getElementById("obs-map");
  const list = document.getElementById("obs-uf-list");
  const fonteEl = document.getElementById("obs-uf-fonte");
  if (!mapEl) return;
  if (fonteEl) fonteEl.textContent = `📌 IBGE · PNS ${ano || "2019"}`;

  // Mapa
  mapEl.innerHTML = Object.keys(OBS.mapaUF).map((uf) => {
    const [col, row] = OBS.mapaUF[uf];
    const pct = porUF[uf];
    return `<button type="button" class="obs-map-tile ${pct != null ? obsHeat(pct) : "heat-1"}" data-uf="${uf}"
      style="grid-column:${col};grid-row:${row};"
      aria-label="${OBS.nomesUF[uf]}: ${pct != null ? obsFmtPct(pct) + " dos lares com cachorro" : "sem dado"}">${uf}</button>`;
  }).join("");

  // Lista rolável (ranking)
  const ranked = Object.entries(porUF).sort((a, b) => b[1] - a[1]);
  const maxPct = ranked.length ? ranked[0][1] : 100;
  if (list) {
    list.innerHTML = ranked.map(([uf, pct], i) => `
      <li class="obs-uf-item" data-uf="${uf}">
        <span class="obs-uf-rank">${i + 1}º</span>
        <span class="obs-uf-nome">${obsEsc(OBS.nomesUF[uf])}</span>
        <span class="obs-uf-bar"><span class="obs-uf-bar-fill" style="width:${Math.round((pct / maxPct) * 100)}%"></span></span>
        <span class="obs-uf-pct">${obsFmtPct(pct)}</span>
      </li>`).join("");
  }

  // Tooltip
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

  const selecionar = (uf, rolarLista) => {
    mapEl.querySelectorAll(".obs-map-tile").forEach((t) => t.classList.toggle("selected", t.dataset.uf === uf));
    if (list) {
      const items = list.querySelectorAll(".obs-uf-item");
      items.forEach((it) => it.classList.toggle("active", it.dataset.uf === uf));
      if (rolarLista) {
        const item = list.querySelector(`.obs-uf-item[data-uf="${uf}"]`);
        if (item) {
          // rola DENTRO da lista, sem mexer na página
          list.scrollTo({ top: item.offsetTop - list.clientHeight / 2 + item.offsetHeight / 2, behavior: OBS_REDUCED ? "auto" : "smooth" });
        }
      }
    }
  };

  mapEl.onclick = (e) => {
    const tile = e.target.closest(".obs-map-tile");
    if (tile) selecionar(tile.dataset.uf, true);
  };
  if (list) {
    list.onclick = (e) => {
      const item = e.target.closest(".obs-uf-item");
      if (item) selecionar(item.dataset.uf, false);
    };
  }

  // Começa destacando o campeão.
  if (ranked.length) selecionar(ranked[0][0], false);
}

/* =====================================================================
   Pictograma vivo (retrato do abandono)
   ===================================================================== */

function obsRenderPictograma(el) {
  const abandonados = 25; // 1 em cada 4
  el.innerHTML =
    `<div class="obs-picto" role="img" aria-label="De cada 100 cães e gatos no Brasil, cerca de 25 estão em situação de abandono.">` +
    Array.from({ length: 100 }, (_, i) => {
      const ab = i < abandonados;
      // Onda diagonal na entrada + flutuação contínua só nos abandonados.
      const delay = ((i % 10) + Math.floor(i / 10)) * 45;
      const floatDelay = (i * 137) % 2000;
      return `<span class="obs-picto-paw ${ab ? "abandonada" : ""}" style="--in:${delay}ms;--fl:${floatDelay}ms">${OBS_PAW}</span>`;
    }).join("") +
    `</div>
    <p class="obs-picto-legenda">
      <span><strong>1 em cada 4</strong> cães e gatos do Brasil está em situação de abandono — cerca de <strong>30,2 milhões</strong> de animais.</span>
      <span class="obs-picto-key abandono">Em abandono</span>
      <span class="obs-picto-key familia">Com família</span>
    </p>
    <span class="obs-fonte">📌 Mars Petcare — State of Pet Homelessness Index (coleta 2022–23, divulgado 2024); corrobora a estimativa de 30 mi da OMS</span>`;

  const picto = el.querySelector(".obs-picto");
  if (OBS_REDUCED) { picto.classList.add("revelado"); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      entry.target.classList.add("revelado");
    });
  }, { threshold: 0.25 });
  io.observe(picto);
}

/* =====================================================================
   Componentes estáticos
   ===================================================================== */

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
    <span class="obs-fonte">📌 ${obsEsc(fonte)} · o Brasil tem 160,9 mi de pets (ref. 2023), a 3ª maior população do mundo</span>`;
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

function obsRenderReferencias(el) {
  el.innerHTML = OBS.fontes.map((f) => {
    const url = obsSafeUrl(f.url);
    // Logo = favicon do domínio (serviço público do Google). Se falhar, cai no emoji.
    const logo = f.dominio
      ? `<img class="obs-ref-logo" src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(f.dominio)}&sz=64" alt="" loading="lazy" decoding="async"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />`
      : "";
    const fallback = `<span class="obs-ref-logo obs-ref-logo--emoji" ${f.dominio ? 'style="display:none;"' : ""}>${f.emoji || "🔗"}</span>`;
    return `
      <a class="obs-ref-chip" ${url ? `href="${obsEsc(url)}" target="_blank" rel="noopener"` : ""} title="${obsEsc(f.nome)} — ${obsEsc(f.tipo || "")}">
        <span class="obs-ref-logo-wrap">${logo}${fallback}</span>
        <span class="obs-ref-txt">
          <strong>${obsEsc(f.nome)}</strong>
          <span>${obsEsc(f.tipo || "")}</span>
        </span>
      </a>`;
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

function obsRenderBolhas(pets) {
  const host = document.getElementById("obs-bolhas");
  if (!host) return;
  const comFoto = (pets || []).filter((p) => obsSafeUrl(p.photo_url));
  const fontes = comFoto.map((p) => ({ foto: obsSafeUrl(p.photo_url), id: p.id }));
  // Poucos pets no começo → completa com emojis de cachorro (mínimo 12 bolhas).
  const emojis = ["🐶", "🐕", "🦴", "🐾", "🐩", "🐕", "🦮", "🐶"];
  let i = 0;
  while (fontes.length < 12) fontes.push({ emoji: emojis[i++ % emojis.length] });
  const usadas = fontes.slice(0, 15);

  host.innerHTML = usadas.map((s) => {
    const r = 26 + Math.round(Math.random() * 20);
    const inner = s.foto
      ? `<img src="${obsEsc(s.foto)}" alt="" loading="lazy" decoding="async" />`
      : `<span class="obs-bolha-emoji">${s.emoji}</span>`;
    const href = s.id ? `../index.html#pet-${obsEsc(s.id)}` : "../index.html";
    return `<a class="obs-bolha" href="${href}" tabindex="-1" style="--r:${r}px" data-r="${r}">${inner}</a>`;
  }).join("");

  obsFisicaBolhas(host);
}

/**
 * Física de "balões com gravidade": as bolhas caem e descansam no fundo,
 * empilhando (com colisão simples entre elas). Ao passar o ponteiro perto, elas
 * são empurradas para cima — como se enchessem de ar — e depois caem de novo.
 */
function obsFisicaBolhas(host) {
  const bolhas = [...host.querySelectorAll(".obs-bolha")];
  const rect0 = host.getBoundingClientRect();
  let W = rect0.width, H = rect0.height || 360;

  const G = 0.42;          // gravidade
  const AIR = 0.992;       // arrasto do ar
  const FLOOR_BOUNCE = 0.28; // quicada ao tocar o chão (balão murcho)
  const WALL_BOUNCE = 0.5;

  const state = bolhas.map((el, idx) => {
    const r = Number(el.dataset.r);
    return {
      el, r,
      x: Math.random() * Math.max(1, W - 2 * r),
      y: -r - Math.random() * 200 - idx * 20, // caem do topo, escalonado
      vx: (Math.random() - 0.5) * 0.6,
      vy: 0,
    };
  });
  const place = (b) => { b.el.style.transform = `translate(${b.x}px, ${b.y}px)`; };
  state.forEach(place);

  if (OBS_REDUCED) {
    // Estático: assenta todas no fundo, lado a lado.
    let cx = 8;
    state.forEach((b) => { b.x = Math.min(cx, W - 2 * b.r); b.y = H - 2 * b.r; cx += 2 * b.r + 6; place(b); });
    return;
  }

  let mouse = null;
  host.addEventListener("pointermove", (e) => { const r = host.getBoundingClientRect(); mouse = { x: e.clientX - r.left, y: e.clientY - r.top }; });
  host.addEventListener("pointerleave", () => { mouse = null; });
  const ro = new ResizeObserver(() => { const r = host.getBoundingClientRect(); W = r.width; H = r.height || H; });
  ro.observe(host);

  let raf = 0, running = false;
  const step = () => {
    if (!running) return;

    state.forEach((b) => {
      b.vy += G;               // gravidade
      b.vx *= AIR;

      // Ponteiro perto → "sopro de ar": empurra pra longe, com forte viés pra cima.
      if (mouse) {
        const cx = b.x + b.r, cy = b.y + b.r;
        const dx = cx - mouse.x, dy = cy - mouse.y;
        const reach = b.r + 70;
        const d = Math.hypot(dx, dy);
        if (d < reach) {
          const f = (reach - Math.max(d, 0.001)) / reach;
          if (d > 0.5) {
            b.vx += (dx / d) * f * 2.2;
            b.vy += (dy / d) * f * 1.6;
          }
          b.vy -= f * 6.5; // levanta como se enchesse de ar (mesmo bem no centro)
        }
      }
    });

    // Colisão simples entre bolhas (separa + troca um pouco de velocidade).
    for (let i = 0; i < state.length; i++) {
      for (let j = i + 1; j < state.length; j++) {
        const a = state[i], b = state[j];
        const ax = a.x + a.r, ay = a.y + a.r, bx = b.x + b.r, by = b.y + b.r;
        let dx = bx - ax, dy = by - ay;
        let d = Math.hypot(dx, dy);
        const min = a.r + b.r;
        if (d < min && d > 0.01) {
          const nx = dx / d, ny = dy / d;
          const overlap = (min - d) / 2;
          a.x -= nx * overlap; a.y -= ny * overlap;
          b.x += nx * overlap; b.y += ny * overlap;
          // amortece a componente normal (empilha em vez de saltar)
          const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rel < 0) {
            const imp = rel * 0.5;
            a.vx += nx * imp; a.vy += ny * imp;
            b.vx -= nx * imp; b.vy -= ny * imp;
          }
        }
      }
    }

    // Velocidade máxima + integra + paredes/chão.
    state.forEach((b) => {
      const sp = Math.hypot(b.vx, b.vy), max = 12;
      if (sp > max) { b.vx = b.vx / sp * max; b.vy = b.vy / sp * max; }
      b.x += b.vx; b.y += b.vy;

      if (b.x < 0) { b.x = 0; b.vx = -b.vx * WALL_BOUNCE; }
      if (b.x > W - 2 * b.r) { b.x = W - 2 * b.r; b.vx = -b.vx * WALL_BOUNCE; }
      if (b.y < 0) { b.y = 0; b.vy = -b.vy * WALL_BOUNCE; }
      if (b.y > H - 2 * b.r) {           // chão
        b.y = H - 2 * b.r;
        b.vy = -b.vy * FLOOR_BOUNCE;
        b.vx *= 0.88;                    // atrito no chão
        if (Math.abs(b.vy) < 0.6) b.vy = 0; // assenta
      }
      place(b);
    });

    raf = requestAnimationFrame(step);
  };

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
  obsRenderCarrossel();

  const picto = document.getElementById("obs-pictograma");
  if (picto) obsRenderPictograma(picto);
  const fatos = document.getElementById("obs-fatos");
  if (fatos) obsRenderFatos(fatos);
  const split = document.getElementById("obs-split");
  if (split) obsRenderSplit(split);
  const leis = document.getElementById("obs-leis");
  if (leis) obsRenderLeis(leis);
  const refs = document.getElementById("obs-ref-grid");
  if (refs) obsRenderReferencias(refs);

  obsCarregaMapa();

  obsFetchPets().then((pets) => {
    obsRenderReencontros(pets);
    obsRenderBolhas(pets);
  });
});
