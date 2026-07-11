/**
 * Observatório Patinhas — dados públicos sobre adoção e abandono no Brasil.
 *
 * Todos os números vêm de fontes públicas amplamente publicadas (OMS,
 * Instituto Pet Brasil, Abinpet, IBGE, legislação federal) e cada bloco
 * exibe a própria fonte. Valores são aproximados, conforme divulgados
 * pelas fontes — nada aqui é dado interno do Patinhas.
 */

const OBS = {
  // Fatos com frente (número) e verso (contexto + fonte) — cards que viram no hover.
  fatos: [
    {
      icone: "🏠",
      valor: "185 mil",
      label: "animais acolhidos por ONGs e protetores",
      verso: "É o retrato dos abrigos brasileiros: superlotados e sustentados por doações. A adoção é o que abre espaço para o próximo resgate.",
      fonte: "Instituto Pet Brasil — Censo Pet (2020)",
    },
    {
      icone: "⚠️",
      valor: "≈10 mi",
      label: "de cães e gatos em condição de vulnerabilidade",
      verso: "Animais nas ruas ou em famílias sem condições de cuidá-los. Castração, adoção e guarda responsável são os caminhos apontados pelas entidades.",
      fonte: "Instituto Pet Brasil (2021)",
    },
    {
      icone: "🐶",
      valor: "44,3%",
      label: "dos lares brasileiros têm pelo menos um cachorro",
      verso: "São mais lares com cães do que com crianças. O Brasil ama pets — e é essa força que pode virar o jogo do abandono.",
      fonte: "IBGE — Pesquisa Nacional de Saúde (PNS 2013)",
    },
    {
      icone: "💚",
      valor: "85 mi",
      label: "de cães e gatos vivem em lares brasileiros",
      verso: "Uma das maiores populações de pets do planeta: cerca de 58 milhões de cães e 27 milhões de gatos com família.",
      fonte: "Abinpet / Instituto Pet Brasil (2021)",
    },
  ],

  populacao: {
    caes: { valor: 58.1, label: "milhões de cães" },
    gatos: { valor: 27.1, label: "milhões de gatos" },
    fonte: "Abinpet / Instituto Pet Brasil (2021)",
  },

  // Distribuição aproximada da população de pets por região.
  regioes: {
    SE: { nome: "Sudeste", share: 44, ufs: ["SP", "RJ", "MG", "ES"] },
    NE: { nome: "Nordeste", share: 24, ufs: ["BA", "PE", "CE", "MA", "PB", "RN", "AL", "PI", "SE"] },
    S:  { nome: "Sul", share: 14, ufs: ["PR", "SC", "RS"] },
    CO: { nome: "Centro-Oeste", share: 9, ufs: ["GO", "MT", "MS", "DF"] },
    N:  { nome: "Norte", share: 9, ufs: ["AM", "PA", "TO", "RO", "AC", "AP", "RR"] },
  },
  regiaoFonte: "Distribuição aproximada — Instituto Pet Brasil",

  nomesUF: {
    AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia",
    CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás",
    MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais",
    PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí",
    RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RS: "Rio Grande do Sul",
    RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo",
    SE: "Sergipe", TO: "Tocantins",
  },

  // Posição [coluna, linha] de cada UF no mapa de blocos (geografia estilizada).
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

  // Marcos legais reais da proteção animal no Brasil.
  leis: [
    {
      ano: "1998",
      titulo: "Maus-tratos viram crime",
      texto: "A Lei de Crimes Ambientais (Lei 9.605/1998) torna crime praticar abuso ou maus-tratos contra animais.",
      fonte: "Lei nº 9.605/1998 — Planalto",
    },
    {
      ano: "2020",
      titulo: "Lei Sansão endurece a pena",
      texto: "Maus-tratos a cães e gatos passam a dar reclusão de 2 a 5 anos, multa e proibição de guarda (Lei 14.064/2020).",
      fonte: "Lei nº 14.064/2020 — Planalto",
    },
    {
      ano: "2022",
      titulo: "Fim da eliminação em canis públicos",
      texto: "Órgãos públicos ficam proibidos de eliminar cães e gatos saudáveis — controle passa por castração e adoção (Lei 14.228/2021).",
      fonte: "Lei nº 14.228/2021 — Planalto",
    },
  ],

};

/* ---------------- Helpers ---------------- */

function obsFmt(n) {
  return n.toLocaleString("pt-BR");
}

function obsRegiaoDaUF(uf) {
  return Object.entries(OBS.regioes).find(([, r]) => r.ufs.includes(uf))?.[0];
}

/** Anima números com data-count quando entram na tela. */
function obsCountUp() {
  const els = document.querySelectorAll("[data-count]");
  if (!els.length) return;
  // O HTML já traz o valor final (pra quem não roda JS). Só aqui, com JS
  // disponível, zeramos para animar a contagem.
  els.forEach((el) => { el.textContent = "0"; });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      const el = entry.target;
      const target = Number(el.dataset.count);
      const dur = 1400;
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = obsFmt(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.4 });
  els.forEach((el) => io.observe(el));
}

/** Preenche as barras (largura via data-pct) quando entram na tela. */
function obsAnimateBars() {
  const bars = document.querySelectorAll(".obs-bar-fill[data-pct]");
  if (!bars.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      entry.target.style.width = entry.target.dataset.pct + "%";
    });
  }, { threshold: 0.3 });
  bars.forEach((b) => io.observe(b));
}

/* ---------------- Componentes ---------------- */

/** Cards que viram: número na frente, contexto + fonte no verso. Vira no
 * hover (desktop) e no toque (mobile) — o toque alterna a classe .flipped,
 * então tocar de novo desvira. */
function obsRenderFatos(el) {
  el.innerHTML = OBS.fatos
    .map((f) => `
      <button type="button" class="obs-flip" aria-label="${f.valor} ${f.label}. ${f.verso} Fonte: ${f.fonte}">
        <div class="obs-flip-inner">
          <div class="obs-flip-front">
            <span class="obs-flip-icon">${f.icone}</span>
            <span class="obs-flip-value">${f.valor}</span>
            <span class="obs-flip-label">${f.label}</span>
            <span class="obs-flip-hint">toque para ver ✨</span>
          </div>
          <div class="obs-flip-back">
            <p>${f.verso}</p>
            <span class="obs-fonte">📌 ${f.fonte}</span>
          </div>
        </div>
      </button>`)
    .join("");

  el.querySelectorAll(".obs-flip").forEach((card) => {
    card.addEventListener("click", () => card.classList.toggle("flipped"));
  });
}

/** Curiosidades que dão escala ao número do abandono — o texto do hero
 * troca a cada toque/hover, pra ter variedade em vez de uma só. */
const OBS_CURIOSIDADES = [
  "É mais do que a população inteira da Austrália. 🇦🇺",
  "Daria para lotar o Maracanã quase 400 vezes. 🏟️",
  "É como abandonar a cidade de São Paulo inteira duas vezes. 🏙️",
  "São cerca de 82 mil animais sem lar por dia ao longo de um ano. 📆",
  "Um para cada 7 brasileiros — dá quase um por família. 👨‍👩‍👧",
  "Enfileirados, dariam mais de uma volta ao mundo. 🌎",
];

function obsSetupCuriosidades() {
  const alt = document.querySelector(".obs-big-alt");
  const wrap = document.querySelector(".obs-big-wrap");
  if (!alt || !wrap) return;
  let i = 0;
  alt.textContent = OBS_CURIOSIDADES[0];
  const proxima = () => {
    i = (i + 1) % OBS_CURIOSIDADES.length;
    alt.textContent = OBS_CURIOSIDADES[i];
  };
  wrap.addEventListener("mouseenter", proxima);
  wrap.addEventListener("click", proxima);
}

/** Mapa do Brasil em blocos, colorido por região, com tooltip que segue o mouse. */
function obsRenderMapa(mapEl, detailEl) {
  mapEl.innerHTML = Object.keys(OBS.mapaUF)
    .map((uf) => {
      const [col, row] = OBS.mapaUF[uf];
      const reg = obsRegiaoDaUF(uf);
      return `<button type="button" class="obs-map-tile reg-${reg}" data-uf="${uf}" data-reg="${reg}"
        style="grid-column:${col};grid-row:${row};"
        aria-label="${OBS.nomesUF[uf]}, região ${OBS.regioes[reg].nome}">${uf}</button>`;
    })
    .join("");

  // Tooltip flutuante
  const tip = document.createElement("div");
  tip.className = "obs-tooltip";
  document.body.appendChild(tip);

  mapEl.addEventListener("mousemove", (e) => {
    const tile = e.target.closest(".obs-map-tile");
    if (!tile) { tip.classList.remove("visible"); return; }
    const reg = OBS.regioes[tile.dataset.reg];
    tip.innerHTML = `<strong>${OBS.nomesUF[tile.dataset.uf]}</strong><br />${reg.nome} · ~${reg.share}% dos pets do país`;
    tip.style.left = e.clientX + 14 + "px";
    tip.style.top = e.clientY + 14 + "px";
    tip.classList.add("visible");
  });
  mapEl.addEventListener("mouseleave", () => tip.classList.remove("visible"));

  // Hover/clique acende a região inteira e mostra o painel dela.
  mapEl.addEventListener("mouseover", (e) => {
    const tile = e.target.closest(".obs-map-tile");
    if (!tile) return;
    mapEl.querySelectorAll(".obs-map-tile").forEach((t) =>
      t.classList.toggle("dim", t.dataset.reg !== tile.dataset.reg)
    );
  });
  mapEl.addEventListener("mouseout", () => {
    mapEl.querySelectorAll(".obs-map-tile").forEach((t) => t.classList.remove("dim"));
  });
  mapEl.addEventListener("click", (e) => {
    const tile = e.target.closest(".obs-map-tile");
    if (!tile || !detailEl) return;
    obsRenderRegiaoDetalhe(detailEl, tile.dataset.reg);
  });

  if (detailEl) obsRenderRegiaoDetalhe(detailEl, "SE");
}

function obsRenderRegiaoDetalhe(el, regId) {
  const reg = OBS.regioes[regId];
  const totalPets = OBS.populacao.caes.valor + OBS.populacao.gatos.valor; // milhões
  const estimativa = ((reg.share / 100) * totalPets).toFixed(1).replace(".", ",");
  el.innerHTML = `
    <h3>📍 Região ${reg.nome}</h3>
    <div class="obs-regiao-share">~${reg.share}%</div>
    <p class="obs-regiao-desc">da população de pets do Brasil vive aqui — cerca de <strong>${estimativa} milhões</strong> de cães e gatos.</p>
    <p class="obs-regiao-ufs">${reg.ufs.map((uf) => OBS.nomesUF[uf]).join(" · ")}</p>
    <span class="obs-fonte">📌 ${OBS.regiaoFonte}</span>`;
}

/** Barras de distribuição regional. */
function obsRenderRegioesBarras(el) {
  const regs = Object.values(OBS.regioes).sort((a, b) => b.share - a.share);
  const max = regs[0].share;
  el.innerHTML =
    regs
      .map((r) => `
        <div class="obs-dist-row">
          <span>${r.nome}</span>
          <div class="obs-bar-track"><div class="obs-bar-fill" data-pct="${Math.round((r.share / max) * 100)}"></div></div>
          <span class="obs-ranking-value">~${r.share}%</span>
        </div>`)
      .join("") +
    `<span class="obs-fonte" style="margin-top:10px;display:inline-block;">📌 ${OBS.regiaoFonte}</span>`;
}

/** Cães vs. gatos com números reais e hover que destaca cada lado. */
function obsRenderSplit(el) {
  const { caes, gatos, fonte } = OBS.populacao;
  const total = caes.valor + gatos.valor;
  const pctCaes = Math.round((caes.valor / total) * 100);
  el.innerHTML = `
    <div class="obs-split-bar" role="img" aria-label="Cães: ${caes.valor} milhões. Gatos: ${gatos.valor} milhões.">
      <div class="obs-split-a" style="width:${pctCaes}%"><span>🐶 ${String(caes.valor).replace(".", ",")} mi</span></div>
      <div class="obs-split-b" style="width:${100 - pctCaes}%"><span>🐱 ${String(gatos.valor).replace(".", ",")} mi</span></div>
    </div>
    <div class="obs-split-caption"><span>Cães</span><span>Gatos</span></div>
    <span class="obs-fonte">📌 ${fonte}</span>`;
}

/**
 * Pictograma: 100 patinhas representando os cães e gatos do Brasil.
 * ~26 delas estão abandonadas (30 mi abandonados / 115 mi no total).
 * Passar o mouse em qualquer patinha destaca todas as abandonadas.
 */
function obsRenderPictograma(el) {
  const abandonadas = 26;
  el.innerHTML =
    `<div class="obs-picto" role="img" aria-label="De cada 100 cães e gatos no Brasil, cerca de 26 vivem abandonados.">` +
    Array.from({ length: 100 }, (_, i) => `<span class="obs-picto-paw ${i < abandonadas ? "abandonada" : ""}">🐾</span>`).join("") +
    `</div>
    <p class="obs-picto-legenda">
      <span><strong>Cerca de 26 em cada 100</strong> cães e gatos do Brasil vivem abandonados.</span>
      <span class="obs-picto-key abandono">Abandonados</span>
      <span class="obs-picto-key familia">Com família</span>
    </p>
    <span class="obs-fonte">📌 Cálculo sobre estimativas da OMS (30 mi abandonados) e Abinpet / Instituto Pet Brasil (85 mi com família)</span>`;
}

/** Linha do tempo das leis de proteção animal. */
function obsRenderLeis(el) {
  el.innerHTML = OBS.leis
    .map((l) => `
      <div class="obs-timeline-item">
        <span class="obs-timeline-year">${l.ano}</span>
        <h3>${l.titulo}</h3>
        <p>${l.texto}</p>
        <span class="obs-fonte">📌 ${l.fonte}</span>
      </div>`)
    .join("");
}

/* ---------------- Boot ---------------- */

document.addEventListener("DOMContentLoaded", () => {
  const fatos = document.getElementById("obs-fatos");
  if (fatos) obsRenderFatos(fatos);

  const map = document.getElementById("obs-map");
  if (map) obsRenderMapa(map, document.getElementById("obs-regiao-detail"));

  const regioes = document.getElementById("obs-regioes");
  if (regioes) obsRenderRegioesBarras(regioes);

  const split = document.getElementById("obs-split");
  if (split) obsRenderSplit(split);

  const picto = document.getElementById("obs-pictograma");
  if (picto) obsRenderPictograma(picto);

  const leis = document.getElementById("obs-leis");
  if (leis) obsRenderLeis(leis);

  obsSetupCuriosidades();
  obsCountUp();
  obsAnimateBars();
});
