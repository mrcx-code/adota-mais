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

// Controle da "leitura ao vivo" exposto p/ o hero (preenchido em obsLeituraRotativa).
const OBS_LEITURA = { next: null };

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

  // Números-chave que giram na "leitura ao vivo" do hero (um por vez).
  destaques: [
    { valor: "30,2", unidade: "mi", label: "de cães e gatos em situação de <strong>abandono</strong> — 1 em cada 4", fonte: "Mars · State of Pet Homelessness (2024)" },
    { valor: "80", unidade: "%", label: "dos pets nos lares brasileiros chegaram por <strong>adoção</strong>", fonte: "GoldeN / Opinion Box (2025)" },
    { valor: "1,3", unidade: "mi", label: "de animais ganharam “RG” no <strong>SinPatinhas</strong> em 1 ano", fonte: "MMA · Gov. Federal (abr 2026)" },
    { valor: "4,8", unidade: "mi", label: "de cães e gatos em condição de <strong>vulnerabilidade</strong>", fonte: "Instituto Pet Brasil (2024)" },
    { valor: "675", unidade: "mil", label: "<strong>castrações gratuitas</strong> pelo programa ProPatinhas", fonte: "MMA / ProPatinhas (2026)" },
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

  // Projetos em tramitação no Congresso em 2026 (o que está acontecendo agora).
  tramitacao: [
    {
      pl: "PL 6.191/2025", status: "em análise na CCJ do Senado",
      titulo: "Estatuto dos Cães e Gatos",
      texto: "Cria um estatuto próprio e prevê reclusão de 6 meses a 10 anos para quem matar ou torturar cães e gatos. Já aprovado por unanimidade na CDH.",
      url: "https://agenciabrasil.ebc.com.br/politica/noticia/2026-02/estatuto-dos-caes-e-gatos-pode-ampliar-pena-para-quem-maltrata-animais",
    },
    {
      pl: "PL 172/2026", status: "apresentado em 2026",
      titulo: "Cadastro nacional de agressores",
      texto: "Cria um “nada consta” de maus-tratos: consulta obrigatória antes de transferir a guarda, posse ou propriedade de um animal.",
      url: "https://www12.senado.leg.br/noticias/materias/2026/02/06/senadores-querem-endurecer-punicao-para-maus-tratos-a-animais",
    },
    {
      pl: "PL 6.205/2019", status: "aguarda votação na Câmara",
      titulo: "Dia Nacional da Castração",
      texto: "Institui uma data nacional para incentivar a castração e reduzir a superpopulação de cães e gatos. Já aprovado no Senado.",
      url: "https://www12.senado.leg.br/noticias/materias/2026/02/03/presidente-do-senado-anuncia-prioridade-para-projetos-sobre-maus-tratos-a-animais",
    },
  ],

  // Formas de engajar hoje.
  engaje: [
    { icone: "✍️", titulo: "Assine petições", texto: "Some sua voz às campanhas por leis mais duras contra maus-tratos e abandono.", cta: "Ver petições ↗", url: "https://www.change.org/t/direito-dos-animais-pt-br" },
    { icone: "🪪", titulo: "Dê um RG ao seu pet", texto: "Cadastre seu animal no SinPatinhas, o registro nacional gratuito do governo.", cta: "Cadastrar ↗", url: "https://sinpatinhas.mma.gov.br/" },
    { icone: "🐾", titulo: "Adote, não compre", texto: "Cada adoção tira um número dessa estatística. Conheça quem está esperando.", cta: "Ver pets", url: "../index.html" },
    { icone: "🏛️", titulo: "Cobre quem legisla", texto: "Acompanhe os projetos e pressione deputados e senadores a votarem.", cta: "Acompanhar ↗", url: "https://www.congressonacional.leg.br/" },
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

/** Céu estrelado bem sutil no fundo de TODA a página (camada fixa, atrás do
 * conteúdo). Pontinhos com opacidade baixíssima — só textura, sem atrapalhar. */
function obsCeuFundo() {
  if (document.querySelector(".obs-starfield")) return;
  const layer = document.createElement("div");
  layer.className = "obs-starfield";
  layer.setAttribute("aria-hidden", "true");
  const N = OBS_REDUCED ? 70 : 150;
  const frag = [];
  for (let k = 0; k < N; k++) {
    const x = (Math.random() * 100).toFixed(2);
    const y = (Math.random() * 100).toFixed(2);
    const big = Math.random() < 0.16;
    const size = big ? (2 + Math.random() * 1.4) : (1 + Math.random() * 0.8);
    const o = (big ? 0.08 : 0.045) + Math.random() * 0.04; // ~0,045–0,12 (bem baixinho)
    const d = Math.round(Math.random() * 4200);
    const t = 3200 + Math.round(Math.random() * 3200);
    frag.push(`<span class="obs-fstar" style="left:${x}%;top:${y}%;width:${size.toFixed(1)}px;height:${size.toFixed(1)}px;--o:${o.toFixed(3)};--d:${d}ms;--t:${t}ms"></span>`);
  }
  layer.innerHTML = frag.join("");
  document.body.appendChild(layer);
}

/** Céu estrelado do hero (estrelas espalhadas que piscam). */
function obsCeu() {
  const sky = document.getElementById("obs-sky");
  if (!sky) return;
  const N = OBS_REDUCED ? 24 : 46;
  const frag = [];
  for (let k = 0; k < N; k++) {
    const x = (Math.random() * 100).toFixed(1);
    const y = (Math.random() * 82).toFixed(1);
    const big = Math.random() < 0.12;
    const size = big ? 4 : 1 + Math.round(Math.random() * 2);
    const delay = Math.round(Math.random() * 3200);
    const dur = 2000 + Math.round(Math.random() * 2800);
    frag.push(`<span class="obs-star${big ? " big" : ""}" style="left:${x}%;top:${y}%;width:${size}px;height:${size}px;--d:${delay}ms;--t:${dur}ms"></span>`);
  }
  sky.insertAdjacentHTML("afterbegin", frag.join(""));
}

/** Leitura ao vivo: gira entre os números-chave, um por vez, com count-up. */
function obsLeituraRotativa() {
  const box = document.getElementById("obs-leitura");
  if (!box) return;
  const items = OBS.destaques;
  const nEl = document.getElementById("obs-leitura-n");
  const uEl = document.getElementById("obs-leitura-u");
  const labelEl = document.getElementById("obs-leitura-label");
  const fonteEl = document.getElementById("obs-leitura-fonte");
  const dotsEl = document.getElementById("obs-leitura-dots");
  dotsEl.innerHTML = items.map((_, k) => `<button type="button" class="obs-leitura-dot" data-k="${k}" aria-label="Número ${k + 1}"></button>`).join("");

  let i = 0, timer = 0;

  function countTo(str) {
    if (OBS_REDUCED) { nEl.textContent = str; return; }
    const dec = (str.split(",")[1] || "").length;
    const target = parseFloat(str.replace(".", "").replace(",", "."));
    const dur = 850, t0 = performance.now();
    const tick = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      const v = target * (1 - Math.pow(1 - p, 3));
      nEl.textContent = v.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function show(k) {
    i = k;
    const it = items[k];
    uEl.textContent = it.unidade;
    labelEl.innerHTML = it.label;
    fonteEl.textContent = "📌 " + it.fonte;
    dotsEl.querySelectorAll(".obs-leitura-dot").forEach((d, di) => d.classList.toggle("on", di === k));
    box.classList.remove("swap"); void box.offsetWidth; box.classList.add("swap");
    countTo(it.valor);
  }

  function agenda() {
    clearInterval(timer);
    if (!OBS_REDUCED) timer = setInterval(() => show((i + 1) % items.length), 7500);
  }

  dotsEl.addEventListener("click", (e) => {
    const d = e.target.closest(".obs-leitura-dot");
    if (d) { show(Number(d.dataset.k)); agenda(); }
  });

  // Controle exposto p/ o hero avançar os dados no clique (e reiniciar o timer).
  OBS_LEITURA.next = () => { show((i + 1) % items.length); agenda(); };

  show(0);
  agenda();
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

const OBS_PNS2019 = { // % de lares com CACHORRO, por UF (fallback)
  RO: 64.8, MS: 61.5, MT: 61.2, AC: 60.0, RR: 58.9, PR: 58.7, TO: 57.9, GO: 56.4,
  SC: 55.8, RS: 54.6, MG: 52.0, ES: 51.2, AP: 50.8, PA: 49.6, AM: 48.7, DF: 47.9,
  SP: 45.1, RJ: 41.9, MA: 41.0, BA: 39.5, CE: 38.8, PI: 38.2, RN: 37.4, PB: 36.1,
  SE: 34.7, PE: 34.2, AL: 34.0,
};
const OBS_PNS2019_GATOS = { // % de lares com GATO, por UF (fallback)
  PI: 32.6, MA: 31.5, CE: 29.3, TO: 27.2, RO: 26.9, AC: 26.4, PA: 26.4, RS: 25.2,
  AL: 24.8, SE: 24.4, RR: 23.5, AP: 22.8, MT: 22.6, AM: 21.8, PB: 21.7, MS: 21.1,
  RN: 20.6, BA: 20.2, PE: 20.1, SC: 19.5, PR: 18.2, SP: 16.0, GO: 14.7, RJ: 14.6,
  MG: 14.5, ES: 13.2, DF: 10.3,
};

const MALHA_URL = "https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=image/svg+xml&qualidade=minima&intrarregiao=UF";
const HEAT_COR = { "heat-1": "#E3EBDC", "heat-2": "#C4D6B8", "heat-3": "#9FBA99", "heat-4": "#527353" };

// Estado do mapa por espécie (cães/gatos).
const OBS_MAPA = { caes: null, gatos: null, atual: "caes" };
const OBS_ESPECIE_INFO = {
  caes: { emoji: "🐶", nome: "cachorro" },
  gatos: { emoji: "🐱", nome: "gato" },
};

async function obsFetchPosseUF(tabela, variavel) {
  const resp = await fetch(`${IBGE_BASE}/${tabela}/periodos/-1/variaveis/${variavel}?localidades=N3[all]`);
  const data = await resp.json();
  const porUF = {}; let ano = "";
  data[0].resultados[0].series.forEach((s) => {
    const uf = UF_POR_ID[String(s.localidade.id)];
    const k = Object.keys(s.serie)[0];
    ano = k;
    if (uf) porUF[uf] = Number(s.serie[k]);
  });
  if (!Object.keys(porUF).length) throw new Error("vazio");
  return { porUF, ano };
}

async function obsCarregaMapa() {
  try { OBS_MAPA.caes = await obsFetchPosseUF(4930, 5180); }
  catch (e) { OBS_MAPA.caes = { porUF: OBS_PNS2019, ano: "2019" }; }
  try { OBS_MAPA.gatos = await obsFetchPosseUF(4931, 5188); }
  catch (e) { OBS_MAPA.gatos = { porUF: OBS_PNS2019_GATOS, ano: "2019" }; }

  await obsMontaMapaReal();       // injeta o SVG uma vez
  obsAplicarEspecie("caes");

  document.querySelectorAll(".obs-especie-btn").forEach((b) =>
    b.addEventListener("click", () => obsAplicarEspecie(b.dataset.especie))
  );
}

/** Cor por posição no ranking (quartis) — funciona para cães e gatos. */
function obsHeatRank(pos, total) {
  const q = pos / total;
  if (q < 0.26) return "heat-4";
  if (q < 0.52) return "heat-3";
  if (q < 0.78) return "heat-2";
  return "heat-1";
}

/** Troca a espécie exibida no mapa e no ranking. */
function obsAplicarEspecie(especie) {
  if (!OBS_MAPA[especie]) return;
  OBS_MAPA.atual = especie;
  const { porUF, ano } = OBS_MAPA[especie];
  const ranked = Object.entries(porUF).sort((a, b) => b[1] - a[1]);
  const pos = {}; ranked.forEach(([uf], i) => (pos[uf] = i));

  document.querySelectorAll(".obs-uf-path").forEach((path) => {
    const uf = path.getAttribute("data-uf");
    path.style.fill = uf in porUF ? HEAT_COR[obsHeatRank(pos[uf], ranked.length)] : "#EFEBE0";
  });

  obsRenderListaUF(ranked);

  document.querySelectorAll(".obs-especie-btn").forEach((b) => b.classList.toggle("active", b.dataset.especie === especie));
  const fonteEl = document.getElementById("obs-uf-fonte");
  if (fonteEl) fonteEl.textContent = `📌 IBGE · PNS ${ano || "2019"}`;
  const tituloEl = document.getElementById("obs-mapa-titulo");
  if (tituloEl) tituloEl.textContent = `Onde vivem os ${especie === "gatos" ? "gatos" : "cães"} do Brasil`;

  obsSelecionarUF(ranked[0]?.[0], false);
}

/** Lista/ranking rolável de estados (recebe já ordenado). */
function obsRenderListaUF(ranked) {
  const list = document.getElementById("obs-uf-list");
  if (!list) return;
  const maxPct = ranked.length ? ranked[0][1] : 100;
  const medalha = ["🥇", "🥈", "🥉"];
  list.innerHTML = ranked.map(([uf, pct], i) => `
    <li class="obs-uf-item ${i < 3 ? "top" : ""}" data-uf="${uf}">
      <span class="obs-uf-rank">${i < 3 ? medalha[i] : (i + 1) + "º"}</span>
      <span class="obs-uf-nome">${obsEsc(OBS.nomesUF[uf])}</span>
      <span class="obs-uf-bar"><span class="obs-uf-bar-fill" style="width:${Math.round((pct / maxPct) * 100)}%"></span></span>
      <span class="obs-uf-pct">${obsFmtPct(pct)}</span>
    </li>`).join("");
  list.onclick = (e) => {
    const item = e.target.closest(".obs-uf-item");
    if (item) obsSelecionarUF(item.dataset.uf, false);
  };
}

/** Injeta o mapa real do Brasil (malha oficial do IBGE) uma única vez. */
async function obsMontaMapaReal() {
  const host = document.getElementById("obs-map-real");
  if (!host) return;
  let tip = document.querySelector(".obs-tooltip");
  if (!tip) { tip = document.createElement("div"); tip.className = "obs-tooltip"; document.body.appendChild(tip); }

  try {
    const svgText = await (await fetch(MALHA_URL)).text();
    host.innerHTML = svgText;
    const svg = host.querySelector("svg");
    if (!svg) throw new Error("sem svg");
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    svg.querySelectorAll("path[id]").forEach((path) => {
      const uf = UF_POR_ID[String(path.id)];
      if (!uf) return;
      path.setAttribute("data-uf", uf);
      path.classList.add("obs-uf-path");
    });

    host.onmousemove = (e) => {
      const path = e.target.closest(".obs-uf-path");
      if (!path) { tip.classList.remove("visible"); return; }
      const uf = path.getAttribute("data-uf");
      const info = OBS_ESPECIE_INFO[OBS_MAPA.atual];
      const pct = OBS_MAPA[OBS_MAPA.atual].porUF[uf];
      tip.innerHTML = `<strong>${OBS.nomesUF[uf]}</strong><br />${pct != null ? obsFmtPct(pct) + ` dos lares têm ${info.nome}` : "sem dado"}`;
      tip.style.left = e.clientX + 14 + "px"; tip.style.top = e.clientY + 14 + "px";
      tip.classList.add("visible");
    };
    host.onmouseleave = () => tip.classList.remove("visible");
    host.onclick = (e) => {
      const path = e.target.closest(".obs-uf-path");
      if (path) obsSelecionarUF(path.getAttribute("data-uf"), true);
    };
  } catch (err) {
    host.classList.add("obs-map-fail");
    host.innerHTML = '<p class="obs-vazio">Não foi possível carregar o mapa agora — veja o ranking ao lado.</p>';
  }
}

/** Destaca uma UF no mapa e na lista (e rola a lista até ela). */
function obsSelecionarUF(uf, rolarLista) {
  if (!uf) return;
  document.querySelectorAll(".obs-uf-path").forEach((p) => p.classList.toggle("sel", p.getAttribute("data-uf") === uf));
  const list = document.getElementById("obs-uf-list");
  if (!list) return;
  list.querySelectorAll(".obs-uf-item").forEach((it) => it.classList.toggle("active", it.dataset.uf === uf));
  if (rolarLista) {
    const item = list.querySelector(`.obs-uf-item[data-uf="${uf}"]`);
    if (item) list.scrollTo({ top: item.offsetTop - list.clientHeight / 2 + item.offsetHeight / 2, behavior: OBS_REDUCED ? "auto" : "smooth" });
  }
}

/* =====================================================================
   Pictograma vivo (retrato do abandono)
   ===================================================================== */

function obsRenderAbandono(el) {
  const PCT = 25;               // 1 em cada 4
  const R = 84, SW = 18;        // anel maior e mais fino → sobra espaço p/ o número
  const C = 2 * Math.PI * R;    // circunferência
  const arco = C * (PCT / 100); // trecho visível do abandono

  el.innerHTML = `
    <div class="obs-abandono-graf">
      <svg class="obs-donut" viewBox="0 0 200 200" role="img" aria-label="Cerca de 25% dos cães e gatos do Brasil estão em situação de abandono.">
        <defs>
          <linearGradient id="obsDonutGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#E7C889" />
            <stop offset="1" stop-color="#C97A2C" />
          </linearGradient>
        </defs>
        <circle class="obs-donut-track" cx="100" cy="100" r="${R}" fill="none" stroke-width="${SW}" />
        <circle class="obs-donut-arc" cx="100" cy="100" r="${R}" fill="none" stroke-width="${SW}"
          stroke-linecap="round" transform="rotate(-90 100 100)"
          stroke-dasharray="${arco.toFixed(1)} ${(C - arco).toFixed(1)}" stroke-dashoffset="${arco.toFixed(1)}" />
      </svg>
      <div class="obs-donut-center">
        <div class="obs-donut-num"><span data-abandono-num>0</span><span class="obs-donut-u">mi</span></div>
        <span class="obs-donut-cap">em abandono</span>
      </div>
    </div>
    <div class="obs-abandono-texto">
      <div class="obs-abandono-big" aria-hidden="true"><span>1</span> em cada <span>4</span></div>
      <div class="obs-abandono-paws" aria-hidden="true">
        ${Array.from({ length: 4 }, (_, i) => `<span class="obs-abandono-paw ${i === 0 ? "ab" : ""}" style="--d:${i * 110}ms">${OBS_PAW}</span>`).join("")}
      </div>
      <p>cães e gatos do Brasil está em situação de <strong>abandono</strong> — cerca de <strong>30,2 milhões</strong> de animais sem um lar.</p>
      <span class="obs-fonte">📌 Mars Petcare — State of Pet Homelessness Index (2024); corrobora a estimativa de 30 mi da OMS</span>
    </div>`;

  const numEl = el.querySelector("[data-abandono-num]");
  const setNum = (v) => { numEl.textContent = v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }); };

  if (OBS_REDUCED) { el.classList.add("revelado"); setNum(30.2); return; }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      el.classList.add("revelado"); // dispara o desenho do arco + as patinhas (CSS)
      // count-up do número central
      const alvo = 30.2, dur = 1400, t0 = performance.now();
      const tick = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        setNum(alvo * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.35 });
  io.observe(el);
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

function obsRenderTramitacao(el) {
  el.innerHTML = OBS.tramitacao.map((t) => {
    const url = obsSafeUrl(t.url);
    return `
      <a class="obs-tramita-card" ${url ? `href="${obsEsc(url)}" target="_blank" rel="noopener"` : ""}>
        <span class="obs-tramita-status">🟢 ${obsEsc(t.status)}</span>
        <span class="obs-tramita-pl">${obsEsc(t.pl)}</span>
        <strong>${obsEsc(t.titulo)}</strong>
        <p>${obsEsc(t.texto)}</p>
        <span class="obs-tramita-link">acompanhar ↗</span>
      </a>`;
  }).join("");
}

/** Aceita http(s) OU links internos relativos (../, ./, /, #). As URLs aqui
 * são fixas no código (não vêm do usuário), então links internos são seguros. */
function obsHref(url) {
  const s = String(url == null ? "" : url).trim();
  if (/^https?:\/\//i.test(s)) return s;
  if (/^(\.{1,2}\/|\/|#)/.test(s)) return s;
  return "";
}

function obsRenderEngaje(el) {
  el.innerHTML = OBS.engaje.map((e) => {
    const url = obsHref(e.url);
    const ext = /^https?:/i.test(url) ? ' target="_blank" rel="noopener"' : "";
    return `
      <a class="obs-engaje-card" ${url ? `href="${obsEsc(url)}"${ext}` : ""}>
        <span class="obs-engaje-ic" aria-hidden="true">${e.icone}</span>
        <strong>${obsEsc(e.titulo)}</strong>
        <p>${obsEsc(e.texto)}</p>
        <span class="obs-engaje-cta">${obsEsc(e.cta)}</span>
      </a>`;
  }).join("");
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
      <div class="obs-ref-chip" title="${obsEsc(f.nome)} — ${obsEsc(f.tipo || "")}">
        <span class="obs-ref-logo-wrap">${logo}${fallback}</span>
        <span class="obs-ref-txt">
          <strong>${obsEsc(f.nome)}</strong>
          <span>${obsEsc(f.tipo || "")}</span>
        </span>
      </div>`;
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

/* As bolhas do CTA final agora vêm do componente compartilhado js/bolhas-cta.js
   (mesma coisa na página Sobre). Ver o boot mais abaixo: PetBolhasCTA.mount(). */

/* =====================================================================
   Boot
   ===================================================================== */

/**
 * Cena interativa do hero (observatório 3D):
 *  - a lente/olho segue o cursor (e o radar pausa);
 *  - o cursor vira uma estrela cadente (cometa) com cauda apontando o movimento;
 *  - o fundo ganha parallax de profundidade conforme o mouse anda (sensação de espaço);
 *  - clicar troca o dado da "leitura ao vivo" (que também roda sozinha se ninguém mexer).
 * Sem cursor (toque), a cena segue no automático.
 */
function obsHeroScanner() {
  const hero = document.getElementById("obs-hero");
  const comet = document.getElementById("obs-comet");
  if (!hero) return;

  // Clique sempre avança o dado — funciona inclusive no toque/reduced-motion.
  hero.addEventListener("click", (e) => {
    if (e.target.closest("a, button")) return; // não rouba cliques dos botões/dots
    if (OBS_LEITURA.next) OBS_LEITURA.next();
  });

  if (OBS_REDUCED || !comet) return;

  const canvas = document.getElementById("obs-trail");
  const ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const pts = [];          // pontos recentes do rastro (a cabeça fica no fim)
  const MAX = 64;          // comprimento máximo do rastro
  let x = 0, y = 0, px = 0, py = 0, loop = 0;

  function sizeCanvas() {
    if (!canvas) return;
    const r = hero.getBoundingClientRect();
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
  }
  if (canvas) { sizeCanvas(); new ResizeObserver(sizeCanvas).observe(hero); }

  hero.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return; // sem hover no toque
    const r = hero.getBoundingClientRect();
    x = e.clientX - r.left;
    y = e.clientY - r.top;
    // deslocamento do centro, normalizado -1..1 → alimenta o parallax (CSS vars)
    px = (x / r.width) * 2 - 1;
    py = (y / r.height) * 2 - 1;
    hero.style.setProperty("--px", px.toFixed(3));
    hero.style.setProperty("--py", py.toFixed(3));
    hero.classList.add("scanning", "par");
    if (!loop) loop = requestAnimationFrame(tick);
  });
  hero.addEventListener("pointerleave", () => {
    hero.classList.remove("scanning", "par");
    hero.style.removeProperty("--px");
    hero.style.removeProperty("--py");
    cancelAnimationFrame(loop); loop = 0;
    pts.length = 0;
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  function tick() {
    comet.style.transform = `translate(${x - 8}px, ${y - 8}px)`;
    const last = pts[pts.length - 1];
    const moved = !last || Math.hypot(x - last.x, y - last.y) > 1.2;
    // enquanto o mouse anda, o rastro cresce; parado, ele recua suavemente.
    if (moved) pts.push({ x, y });
    else if (pts.length) pts.shift();
    while (pts.length > MAX) pts.shift();
    if (ctx) drawTrail();
    loop = requestAnimationFrame(tick);
  }

  /** Desenha um rastro âmbar fluido e brilhante que afina/apaga na cauda. */
  function drawTrail() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const n = pts.length;
    if (n < 2) return;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowColor = "rgba(231, 200, 137, 0.55)";
    ctx.shadowBlur = 8;
    for (let i = 1; i < n; i++) {
      const t = i / (n - 1);                    // 0 = cauda, 1 = cabeça
      const a = pts[i - 1], b = pts[i];
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const prev = pts[i - 2] || a;
      ctx.beginPath();
      ctx.moveTo((prev.x + a.x) / 2, (prev.y + a.y) / 2);
      ctx.quadraticCurveTo(a.x, a.y, mx, my); // suaviza a curva pelos pontos médios
      ctx.lineWidth = 0.6 + t * 7.5;
      ctx.strokeStyle = "rgba(231, 200, 137, " + (0.04 + t * 0.5).toFixed(3) + ")";
      ctx.stroke();
    }
    ctx.restore();
  }
}

/**
 * "Mapa do Maroto": patinhas surgem em trilhas que caminham pelo fundo da
 * página (atrás do conteúdo), aparecem e somem sozinhas. Decorativo, respeita
 * prefers-reduced-motion.
 */
function obsMarauder() {
  if (OBS_REDUCED) return;
  const layer = document.createElement("div");
  layer.className = "obs-paw-map";
  layer.setAttribute("aria-hidden", "true");
  document.body.appendChild(layer);

  const W = () => window.innerWidth;
  const H = () => document.documentElement.clientHeight;

  function spawnPaw(cx, cy, angRad, delay) {
    const el = document.createElement("span");
    el.className = "obs-paw-print";
    el.innerHTML = OBS_PAW;
    const size = 18 + Math.round(Math.random() * 12);
    el.style.width = el.style.height = size + "px";
    el.style.left = cx + "px";
    el.style.top = cy + "px";
    // a patinha "aponta" para a direção da caminhada (SVG aponta p/ cima).
    const rot = `rotate(${angRad + Math.PI / 2}rad)`;
    el.style.transform = `translate(-50%,-50%) ${rot}`;
    layer.appendChild(el);
    setTimeout(() => {
      el.classList.add("show");
      // desliza um pouco na direção da caminhada → parece que anda.
      const dx = Math.cos(angRad) * 12, dy = Math.sin(angRad) * 12;
      el.style.transform = `translate(calc(-50% + ${dx.toFixed(1)}px), calc(-50% + ${dy.toFixed(1)}px)) ${rot}`;
      setTimeout(() => {
        el.classList.remove("show");
        setTimeout(() => el.remove(), 800);
      }, 1300 + Math.random() * 800);
    }, delay);
  }

  function trail() {
    let x = Math.random() * W();
    let y = Math.random() * H();
    let ang = Math.random() * Math.PI * 2;
    const steps = 7 + Math.floor(Math.random() * 7);
    const stride = 34 + Math.random() * 16;
    for (let i = 0; i < steps; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      const perp = ang + Math.PI / 2;
      spawnPaw(x + Math.cos(perp) * 8 * side, y + Math.sin(perp) * 8 * side, ang, i * 150);
      x += Math.cos(ang) * stride;
      y += Math.sin(ang) * stride;
      ang += (Math.random() - 0.5) * 0.6; // vagueia
      if (x < -50 || x > W() + 50 || y < -50 || y > H() + 50) break;
    }
    setTimeout(trail, 800 + Math.random() * 1400); // mais frequente → mais vivo
  }
  // Duas trilhas simultâneas p/ dar densidade e movimento constante.
  trail();
  setTimeout(trail, 1200);
}

document.addEventListener("DOMContentLoaded", () => {
  obsCeuFundo();
  obsCeu();
  obsLeituraRotativa();
  obsHeroScanner();
  obsMarauder();

  const abandono = document.getElementById("obs-abandono");
  if (abandono) obsRenderAbandono(abandono);
  const fatos = document.getElementById("obs-fatos");
  if (fatos) obsRenderFatos(fatos);
  const split = document.getElementById("obs-split");
  if (split) obsRenderSplit(split);
  const leis = document.getElementById("obs-leis");
  if (leis) obsRenderLeis(leis);
  const tramita = document.getElementById("obs-tramitacao");
  if (tramita) obsRenderTramitacao(tramita);
  const engaje = document.getElementById("obs-engaje-grid");
  if (engaje) obsRenderEngaje(engaje);
  const refs = document.getElementById("obs-ref-grid");
  if (refs) obsRenderReferencias(refs);

  obsCarregaMapa();

  obsFetchPets().then((pets) => {
    obsRenderReencontros(pets);
  });

  // CTA final com as bolhas: componente compartilhado com a página Sobre
  // (js/bolhas-cta.js + css/bolhas-cta.css). Fonte única para os dois.
  if (window.PetBolhasCTA) PetBolhasCTA.mount(document.querySelector("[data-petbolhas]"));
});
