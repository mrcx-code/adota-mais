/**
 * Observatório Patinhas — "Da rua ao lar, ao vivo".
 *
 * A página é uma caminhada: rua → chegada → espera → encontro → lar → rede.
 * Os dados dos capítulos vêm AO VIVO do Supabase (mesmas leituras públicas do
 * mural: pets, perfis de ONGs e a RPC get_public_stats) e se atualizam
 * sozinhos por polling. Os dados nacionais (OMS, IBGE, Instituto Pet Brasil)
 * continuam aqui como contexto — no capítulo "A rua" e no acervo recolhido.
 *
 * Nada aqui acessa dado privado: interessados/feedback seguem bloqueados
 * pela RLS; total_interests é só a contagem agregada da RPC pública.
 */

/* =====================================================================
   Dados nacionais (estáticos, com fonte citada)
   ===================================================================== */

const OBS = {
  ruaChips: [
    { valor: "≈30 milhões", texto: "de cães e gatos vivem abandonados no Brasil", fonte: "OMS" },
    { valor: "≈10 milhões", texto: "em condição de vulnerabilidade", fonte: "Instituto Pet Brasil (2021)" },
    { valor: "185 mil", texto: "acolhidos por ONGs e protetores", fonte: "Instituto Pet Brasil — Censo Pet (2020)" },
  ],

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

  regioes: {
    SE: { nome: "Sudeste", share: 44 },
    NE: { nome: "Nordeste", share: 24 },
    S:  { nome: "Sul", share: 14 },
    CO: { nome: "Centro-Oeste", share: 9 },
    N:  { nome: "Norte", share: 9 },
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

/* =====================================================================
   Helpers
   ===================================================================== */

const OBS_REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const OBS_PAW_SVG =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.5 12.5a2 2 0 100-4 2 2 0 000 4zM8 8a2 2 0 100-4 2 2 0 000 4zM12.5 6a2 2 0 100-4 2 2 0 000 4zM17 8a2 2 0 100-4 2 2 0 000 4zM12 22c-3 0-6-1.6-6-4.3 0-2.2 2.4-3.2 3.3-4.9.6-1.1 1.3-1.9 2.7-1.9s2.1.8 2.7 1.9c.9 1.7 3.3 2.7 3.3 4.9C18 20.4 15 22 12 22z"/></svg>';

function obsFmt(n) {
  return Number(n).toLocaleString("pt-BR");
}

function obsEsc(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

/** Só aceita http(s) — mesma proteção anti-XSS de URL usada no mural. */
function obsSafeUrl(url) {
  const s = String(url == null ? "" : url).trim();
  return /^https?:\/\//i.test(s) ? s : "";
}

function obsDaysSince(iso) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / 86400000));
}

function obsRelDias(n) {
  if (n === null) return "";
  if (n === 0) return "hoje";
  if (n === 1) return "ontem";
  return `há ${n} dias`;
}

function obsEspecieEmoji(sp) {
  return sp === "gato" ? "🐱" : sp === "cachorro" ? "🐶" : "🐾";
}

/** Anima um número de `from` até `to` dentro do elemento. */
function obsAnimateNumber(el, from, to, dur = 1200) {
  if (OBS_REDUCED || from === to) {
    el.textContent = obsFmt(to);
    return;
  }
  const t0 = performance.now();
  const tick = (t) => {
    const p = Math.min((t - t0) / dur, 1);
    el.textContent = obsFmt(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/** Brilho âmbar rápido num card cujo valor mudou. */
function obsGlow(el) {
  const alvo = el.closest(".obs-hero-stat, .obs-encontro-card") || el;
  alvo.classList.remove("glow");
  void alvo.offsetWidth; // reinicia a animação
  alvo.classList.add("glow");
}

/* =====================================================================
   Toasts (um por vez, fila curta)
   ===================================================================== */

const OBS_TOAST_QUEUE = [];
let OBS_TOAST_BUSY = false;

function obsToast(msg) {
  if (OBS_TOAST_QUEUE.length >= 3) return; // cap de recuperação
  OBS_TOAST_QUEUE.push(msg);
  obsToastNext();
}

function obsToastNext() {
  if (OBS_TOAST_BUSY) return;
  const msg = OBS_TOAST_QUEUE.shift();
  if (!msg) return;
  OBS_TOAST_BUSY = true;
  const el = document.getElementById("obs-toast");
  el.textContent = msg;
  el.classList.add("on");
  setTimeout(() => {
    el.classList.remove("on");
    setTimeout(() => { OBS_TOAST_BUSY = false; obsToastNext(); }, 350);
  }, 5200);
}

/* =====================================================================
   Motor ao vivo — fetch, snapshot, diff e polling
   ===================================================================== */

const OBS_LIVE = {
  pollMs: 45000,
  snap: null,       // { stats, pets, orgs, fetchedAt, sample }
  prev: null,
  timer: null,
  tickTimer: null,
  erro: false,
};

/** Amostra usada só se o Supabase não estiver disponível (demo/offline). */
const OBS_AMOSTRA = {
  stats: { total_orgs: 3, total_pets: 7, total_adopted: 2, total_interests: 5 },
  pets: [
    { id: "d1", name: "Caramelo", species: "cachorro", status: "disponivel", created_at: new Date(Date.now() - 5 * 864e5).toISOString(), updated_at: new Date().toISOString(), photo_url: "" },
    { id: "d2", name: "Mia", species: "gato", status: "disponivel", created_at: new Date(Date.now() - 9 * 864e5).toISOString(), updated_at: new Date().toISOString(), photo_url: "" },
    { id: "d3", name: "Rex", species: "cachorro", status: "em_processo", created_at: new Date(Date.now() - 12 * 864e5).toISOString(), updated_at: new Date().toISOString(), photo_url: "" },
    { id: "d4", name: "Luna", species: "gato", status: "disponivel", created_at: new Date(Date.now() - 2 * 864e5).toISOString(), updated_at: new Date().toISOString(), photo_url: "" },
    { id: "d5", name: "Thor", species: "cachorro", status: "adotado", created_at: new Date(Date.now() - 20 * 864e5).toISOString(), updated_at: new Date(Date.now() - 6 * 864e5).toISOString(), photo_url: "" },
    { id: "d6", name: "Amora", species: "gato", status: "adotado", created_at: new Date(Date.now() - 30 * 864e5).toISOString(), updated_at: new Date(Date.now() - 12 * 864e5).toISOString(), photo_url: "" },
    { id: "d7", name: "Bidu", species: "cachorro", status: "disponivel", created_at: new Date(Date.now() - 1 * 864e5).toISOString(), updated_at: new Date().toISOString(), photo_url: "" },
  ],
  orgs: [
    { id: "o1", org_name: "Abrigo Amigo Fiel (exemplo)", city: "São Paulo", state: "SP" },
    { id: "o2", org_name: "Patas do Cerrado (exemplo)", city: "Goiânia", state: "GO" },
    { id: "o3", org_name: "Recanto Feliz (exemplo)", city: "Recife", state: "PE" },
  ],
  sample: true,
};

async function obsFetchLive() {
  if (!window.sb || window.DEMO_MODE) throw new Error("sem-supabase");
  const [stats, pets, orgs] = await Promise.all([
    window.sb.rpc("get_public_stats"),
    window.sb.from("pets").select("id,name,species,status,gender,photo_url,created_at,updated_at"),
    window.sb.from("profiles").select("id,org_name,city,state"),
  ]);
  if (stats.error || pets.error || orgs.error) {
    throw stats.error || pets.error || orgs.error;
  }
  const s = Array.isArray(stats.data) ? stats.data[0] : stats.data;
  return {
    stats: s || { total_orgs: 0, total_pets: 0, total_adopted: 0, total_interests: 0 },
    pets: pets.data || [],
    orgs: orgs.data || [],
    fetchedAt: Date.now(),
    sample: false,
  };
}

/** Compara o snapshot novo com o anterior e devolve eventos amigáveis. */
function obsDiff(prev, next) {
  const eventos = [];
  if (!prev || prev.sample || next.sample) return eventos;
  const antes = new Map(prev.pets.map((p) => [p.id, p]));
  next.pets.forEach((p) => {
    const velho = antes.get(p.id);
    if (!velho) {
      eventos.push({ tipo: "chegada", pet: p, msg: `🐾 ${p.name} acabou de chegar (${obsEspecieEmoji(p.species)})` });
    } else if (velho.status !== p.status && p.status === "adotado") {
      eventos.push({ tipo: "adocao", pet: p, msg: `🎉 Agora mesmo: ${p.name} encontrou um lar!` });
    }
  });
  return eventos;
}

function obsBadge(texto, erro) {
  const badge = document.getElementById("obs-live-badge");
  const label = document.getElementById("obs-live-text");
  if (!badge || !label) return;
  badge.classList.toggle("erro", !!erro);
  label.textContent = texto;
}

/** Relógio do selo: "atualizado há Xs", a cada segundo. */
function obsStartTicker() {
  clearInterval(OBS_LIVE.tickTimer);
  OBS_LIVE.tickTimer = setInterval(() => {
    if (!OBS_LIVE.snap) return;
    if (OBS_LIVE.snap.sample) {
      obsBadge("amostra de demonstração — sem conexão com o mural", true);
      return;
    }
    const s = Math.max(0, Math.round((Date.now() - OBS_LIVE.snap.fetchedAt) / 1000));
    const quando = s < 3 ? "agora" : s < 60 ? `há ${s}s` : `há ${Math.floor(s / 60)}min`;
    obsBadge(OBS_LIVE.erro ? `reconectando… · última leitura ${quando}` : `ao vivo · atualizado ${quando}`, OBS_LIVE.erro);
  }, 1000);
}

async function obsRefresh(inicial = false) {
  try {
    const next = await obsFetchLive();
    const eventos = obsDiff(OBS_LIVE.snap, next);
    OBS_LIVE.prev = OBS_LIVE.snap;
    OBS_LIVE.snap = next;
    OBS_LIVE.erro = false;
    obsRenderLive(inicial);
    eventos.slice(0, 3).forEach((ev) => obsToast(ev.msg));
    if (eventos.length) obsMarcarMudancas(eventos);
  } catch (err) {
    if (!OBS_LIVE.snap) {
      // Sem nenhuma leitura ainda: usa a amostra pra página não ficar vazia.
      OBS_LIVE.snap = { ...OBS_AMOSTRA, fetchedAt: Date.now() };
      obsRenderLive(true);
    }
    OBS_LIVE.erro = true;
  }
}

function obsStartPolling() {
  clearInterval(OBS_LIVE.timer);
  OBS_LIVE.timer = setInterval(() => obsRefresh(false), OBS_LIVE.pollMs);
}

/* =====================================================================
   Renderização ao vivo — capítulos
   ===================================================================== */

function obsRenderLive(inicial) {
  const snap = OBS_LIVE.snap;
  if (!snap) return;
  obsRenderHero(snap, inicial);
  obsRenderChegadas(snap);
  obsRenderCenso(snap);
  obsRenderEncontro(snap, inicial);
  obsRenderReencontros(snap);
  obsRenderMapa(snap);
  obsRenderConquistas(snap);
}

/* ----- §0 Hero: contadores ----- */

function obsRenderHero(snap, inicial) {
  const alvos = [
    ["live-pets", snap.stats.total_pets],
    ["live-adopted", snap.stats.total_adopted],
    ["live-orgs", snap.stats.total_orgs],
  ];
  alvos.forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (!el) return;
    const atual = parseInt(String(el.textContent).replace(/\D/g, ""), 10);
    const de = Number.isNaN(atual) ? 0 : atual;
    if (!inicial && de === val) return;
    obsAnimateNumber(el, inicial ? 0 : de, val, inicial ? 1300 : 700);
    if (!inicial && de !== val) obsGlow(el);
  });
}

/* ----- §2 A chegada ----- */

function obsRenderChegadas(snap) {
  const wrap = document.getElementById("obs-chegadas");
  const sub = document.getElementById("obs-chegada-sub");
  if (!wrap) return;
  const recentes = snap.pets
    .filter((p) => (obsDaysSince(p.created_at) ?? 99) <= 30)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10);

  if (sub) {
    sub.textContent = recentes.length
      ? `${recentes.length} patinha${recentes.length > 1 ? "s" : ""} chegara${recentes.length > 1 ? "m" : ""} à trilha nos últimos 30 dias.`
      : "A trilha está pronta para as próximas chegadas.";
  }

  wrap.innerHTML = recentes.length
    ? recentes.map((p) => {
        const foto = obsSafeUrl(p.photo_url);
        const dias = obsDaysSince(p.created_at);
        return `
          <a class="obs-chegada" href="../index.html#pet-${obsEsc(p.id)}" aria-label="${obsEsc(p.name)}, chegou ${obsRelDias(dias)}">
            <span class="obs-chegada-foto">${foto
              ? `<img src="${obsEsc(foto)}" alt="" loading="lazy" decoding="async" />`
              : `<span class="obs-chegada-paw">${obsEspecieEmoji(p.species)}</span>`}</span>
            <span class="obs-chegada-nome">${obsEsc(p.name)}</span>
            <span class="obs-chegada-quando">${obsRelDias(dias)}</span>
          </a>`;
      }).join("")
    : `<p class="obs-vazio">Nenhuma chegada nos últimos 30 dias — mas a trilha nunca fica vazia por muito tempo. 🐾</p>`;
}

/* ----- §3 O censo de patinhas (1 patinha = 1 pet real) ----- */

const OBS_CENSO = { petted: new Set(), total: 0, eggShown: false };

function obsRenderCenso(snap) {
  const wrap = document.getElementById("obs-censo");
  const sub = document.getElementById("obs-espera-sub");
  if (!wrap) return;

  const ordem = { disponivel: 0, em_processo: 1, adotado: 2 };
  const pets = [...snap.pets].sort((a, b) => (ordem[a.status] ?? 9) - (ordem[b.status] ?? 9));
  const esperando = pets.filter((p) => p.status === "disponivel").length;

  if (sub) {
    sub.textContent = snap.sample
      ? "Cada patinha abaixo representa um animal (amostra de demonstração)."
      : `${esperando} esperando agora — cada patinha abaixo é um animal de verdade, com nome e história. Sem estimativas.`;
  }

  OBS_CENSO.total = pets.length;
  OBS_CENSO.petted = new Set();
  OBS_CENSO.eggShown = false;

  wrap.innerHTML =
    `<div class="obs-censo-grid" id="obs-censo-grid">` +
    pets.map((p, i) => {
      const dias = obsDaysSince(p.created_at);
      const statusTxt = p.status === "disponivel" ? `esperando um lar ${obsRelDias(dias)}`
        : p.status === "em_processo" ? "em processo de adoção"
        : "já está em casa";
      return `<button type="button" class="obs-censo-paw st-${obsEsc(p.status)} sp-${obsEsc(p.species || "outro")}"
        data-i="${i}" aria-label="${obsEsc(p.name)}: ${statusTxt}">${OBS_PAW_SVG}</button>`;
    }).join("") +
    `</div><div id="obs-censo-pop" class="obs-censo-pop" hidden></div>`;

  const grid = document.getElementById("obs-censo-grid");
  const pop = document.getElementById("obs-censo-pop");

  // Popover: toque numa patinha → quem é ela.
  grid.addEventListener("click", (e) => {
    const paw = e.target.closest(".obs-censo-paw");
    if (!paw) return;
    const p = pets[Number(paw.dataset.i)];
    if (!p) return;
    const foto = obsSafeUrl(p.photo_url);
    const dias = obsDaysSince(p.created_at);
    const statusTxt = p.status === "disponivel" ? `esperando um lar ${obsRelDias(dias)}`
      : p.status === "em_processo" ? "a um passo do lar 🤝"
      : "já encontrou a família 🏡";
    pop.innerHTML = `
      ${foto ? `<img src="${obsEsc(foto)}" alt="" loading="lazy" />` : `<span class="obs-censo-pop-emoji">${obsEspecieEmoji(p.species)}</span>`}
      <div class="obs-censo-pop-body">
        <strong>${obsEsc(p.name)}</strong>
        <span>${statusTxt}</span>
        ${p.status === "disponivel" && !snap.sample ? `<a href="../index.html#pet-${obsEsc(p.id)}">conhecer no mural →</a>` : ""}
      </div>
      <button type="button" class="obs-censo-pop-x" aria-label="Fechar">×</button>`;
    pop.hidden = false;
    // Posiciona perto da patinha, sem sair do painel.
    const wr = wrap.getBoundingClientRect();
    const pr = paw.getBoundingClientRect();
    const left = Math.max(8, Math.min(pr.left - wr.left - 60, wr.width - 240));
    pop.style.left = left + "px";
    pop.style.top = pr.bottom - wr.top + 10 + "px";
    pop.querySelector(".obs-censo-pop-x").addEventListener("click", () => { pop.hidden = true; });
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".obs-censo-paw") && !e.target.closest(".obs-censo-pop")) pop.hidden = true;
  });

  // Carinho: varrer o dedo/mouse acende as patinhas. Todas = easter egg.
  const carinho = (x, y) => {
    const el = document.elementFromPoint(x, y);
    const paw = el && el.closest ? el.closest(".obs-censo-paw") : null;
    if (!paw) return;
    paw.classList.remove("carinho");
    void paw.offsetWidth;
    paw.classList.add("carinho");
    OBS_CENSO.petted.add(paw.dataset.i);
    if (!OBS_CENSO.eggShown && OBS_CENSO.petted.size >= OBS_CENSO.total && OBS_CENSO.total > 0) {
      OBS_CENSO.eggShown = true;
      const egg = document.getElementById("obs-censo-egg");
      if (egg) {
        egg.textContent = "✨ Você fez carinho em todo mundo 🐾💚";
        egg.classList.add("on");
      }
    }
  };
  grid.addEventListener("pointermove", (e) => {
    if (e.pointerType === "mouse" || e.buttons > 0) carinho(e.clientX, e.clientY);
  });
}

/** Destaca no censo as patinhas que mudaram de vida entre uma leitura e outra. */
function obsMarcarMudancas(eventos) {
  const snap = OBS_LIVE.snap;
  const grid = document.getElementById("obs-censo-grid");
  if (!grid || !snap) return;
  const ordem = { disponivel: 0, em_processo: 1, adotado: 2 };
  const pets = [...snap.pets].sort((a, b) => (ordem[a.status] ?? 9) - (ordem[b.status] ?? 9));
  eventos.forEach((ev) => {
    const idx = pets.findIndex((p) => p.id === ev.pet.id);
    const paw = grid.querySelector(`[data-i="${idx}"]`);
    if (paw) paw.classList.add("mudou");
  });
}

/* ----- §4 O encontro ----- */

function obsRenderEncontro(snap, inicial) {
  const interesses = document.getElementById("obs-interesses");
  const processo = document.getElementById("obs-processo");
  const desc = document.getElementById("obs-processo-desc");
  if (interesses) {
    const de = parseInt(String(interesses.textContent).replace(/\D/g, ""), 10) || 0;
    obsAnimateNumber(interesses, inicial ? 0 : de, snap.stats.total_interests, inicial ? 1300 : 700);
  }
  const emProcesso = snap.pets.filter((p) => p.status === "em_processo");
  if (processo) {
    const de = parseInt(String(processo.textContent).replace(/\D/g, ""), 10) || 0;
    obsAnimateNumber(processo, inicial ? 0 : de, emProcesso.length, inicial ? 1300 : 700);
  }
  if (desc) {
    if (emProcesso.length === 0) {
      desc.textContent = "patinhas a um passo do lar — a próxima pode ser graças a você";
    } else {
      const nomes = emProcesso.slice(0, 3).map((p) => p.name);
      const resto = emProcesso.length - nomes.length;
      const lista = nomes.join(", ") + (resto > 0 ? ` e mais ${resto}` : "");
      desc.textContent = `a um passo do lar agora: ${lista} 🤞`;
    }
  }
}

/* ----- §5 O lar (mural de reencontros) ----- */

function obsRenderReencontros(snap) {
  const wrap = document.getElementById("obs-reencontros");
  const metrica = document.getElementById("obs-lar-metrica");
  const sub = document.getElementById("obs-lar-sub");
  if (!wrap) return;

  const adotados = snap.pets
    .filter((p) => p.status === "adotado")
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

  if (sub) {
    sub.textContent = adotados.length
      ? `Onde toda trilha quer chegar — ${adotados.length} já chegara${adotados.length > 1 ? "m" : "m"}.`
      : "Onde toda trilha quer chegar.";
  }

  wrap.innerHTML = adotados.length
    ? adotados.map((p) => {
        const foto = obsSafeUrl(p.photo_url);
        const espera = Math.max(0, Math.round((new Date(p.updated_at) - new Date(p.created_at)) / 86400000));
        const quando = obsRelDias(obsDaysSince(p.updated_at));
        return `
          <article class="obs-reencontro">
            <div class="obs-reencontro-foto">
              ${foto ? `<img src="${obsEsc(foto)}" alt="Foto de ${obsEsc(p.name)}" loading="lazy" decoding="async" />`
                     : `<span>${obsEspecieEmoji(p.species)}</span>`}
              <span class="obs-carimbo" aria-hidden="true">ADOTADO</span>
            </div>
            <div class="obs-reencontro-body">
              <strong>${obsEsc(p.name)}</strong>
              <span>encontrou um lar ${quando}</span>
              <span class="obs-reencontro-espera">esperou ${espera === 0 ? "menos de um dia" : espera === 1 ? "1 dia" : espera + " dias"} até o abraço</span>
            </div>
          </article>`;
      }).join("")
    : `<p class="obs-vazio">O primeiro reencontro ainda vai acontecer. Talvez comece com você. 💚</p>`;

  if (metrica) {
    if (adotados.length >= 5) {
      const media = Math.round(
        adotados.reduce((acc, p) => acc + Math.max(0, (new Date(p.updated_at) - new Date(p.created_at)) / 86400000), 0) / adotados.length
      );
      metrica.textContent = `⏱️ Da chegada ao abraço: em média ${media} dia${media === 1 ? "" : "s"}.`;
    } else {
      metrica.textContent = "✍️ As primeiras histórias estão sendo escritas.";
    }
  }
}

/* ----- §6 A rede (mapa por UF, aceso onde tem ONG) ----- */

function obsRenderMapa(snap) {
  const mapEl = document.getElementById("obs-map");
  const detail = document.getElementById("obs-uf-detail");
  if (!mapEl) return;

  const porUF = {};
  snap.orgs.forEach((o) => {
    const uf = (o.state || "").toUpperCase();
    if (!OBS.nomesUF[uf]) return;
    (porUF[uf] = porUF[uf] || []).push(o);
  });
  const acesos = Object.keys(porUF);

  mapEl.innerHTML = Object.keys(OBS.mapaUF).map((uf) => {
    const [col, row] = OBS.mapaUF[uf];
    const n = (porUF[uf] || []).length;
    return `<button type="button" class="obs-map-tile ${n ? "lit" : "apagado"}" data-uf="${uf}"
      style="grid-column:${col};grid-row:${row};"
      aria-label="${OBS.nomesUF[uf]}${n ? `: ${n} ONG${n > 1 ? "s" : ""} na rede` : ": ainda sem ONGs na rede"}">
      ${uf}${n ? `<span class="obs-map-badge">${n}</span>` : ""}</button>`;
  }).join("");

  // Tooltip flutuante (reuso do padrão da página).
  let tip = document.querySelector(".obs-tooltip");
  if (!tip) {
    tip = document.createElement("div");
    tip.className = "obs-tooltip";
    document.body.appendChild(tip);
  }
  mapEl.onmousemove = (e) => {
    const tile = e.target.closest(".obs-map-tile");
    if (!tile) { tip.classList.remove("visible"); return; }
    const uf = tile.dataset.uf;
    const orgs = porUF[uf] || [];
    tip.innerHTML = orgs.length
      ? `<strong>${OBS.nomesUF[uf]}</strong><br />🐾 ${orgs.length} ONG${orgs.length > 1 ? "s" : ""} na rede`
      : `<strong>${OBS.nomesUF[uf]}</strong><br />Ainda sem patinhas por aqui.<br />Conhece uma ONG? Chame ela pra trilha!`;
    tip.style.left = e.clientX + 14 + "px";
    tip.style.top = e.clientY + 14 + "px";
    tip.classList.add("visible");
  };
  mapEl.onmouseleave = () => tip.classList.remove("visible");

  mapEl.onclick = (e) => {
    const tile = e.target.closest(".obs-map-tile");
    if (!tile || !detail) return;
    mapEl.querySelectorAll(".obs-map-tile").forEach((t) => t.classList.remove("selected"));
    tile.classList.add("selected");
    obsRenderUfDetail(detail, tile.dataset.uf, porUF, snap.sample);
  };

  // Barra-osso: progresso de estados com rede.
  const fill = document.getElementById("obs-osso-fill");
  const label = document.getElementById("obs-osso-label");
  const osso = document.getElementById("obs-osso");
  if (fill && label) {
    const pct = Math.round((acesos.length / 27) * 100);
    requestAnimationFrame(() => { fill.style.width = Math.max(pct, acesos.length ? 6 : 0) + "%"; });
    label.textContent = `${acesos.length} de 27 estados já têm patinhas na rede`;
    if (osso) osso.setAttribute("aria-label", `${acesos.length} de 27 estados com ONGs na rede`);
  }

  if (detail) {
    const inicial = acesos[0] || "SP";
    const tileInicial = mapEl.querySelector(`[data-uf="${inicial}"]`);
    if (tileInicial) tileInicial.classList.add("selected");
    obsRenderUfDetail(detail, inicial, porUF, snap.sample);
  }
}

function obsRenderUfDetail(el, uf, porUF, sample) {
  const orgs = porUF[uf] || [];
  if (orgs.length) {
    el.innerHTML = `
      <h3>📍 ${OBS.nomesUF[uf]}</h3>
      <p class="obs-regiao-desc">A rede está acesa por aqui — ${orgs.length} ONG${orgs.length > 1 ? "s" : ""} caminhando junto${sample ? " (amostra)" : ""}:</p>
      <ul class="obs-uf-orgs">${orgs.map((o) => `<li>🐾 <strong>${obsEsc(o.org_name)}</strong>${o.city ? ` · ${obsEsc(o.city)}` : ""}</li>`).join("")}</ul>
      <a class="btn btn-secondary btn-sm" href="../index.html">ver os pets do mural →</a>`;
  } else {
    el.innerHTML = `
      <h3>📍 ${OBS.nomesUF[uf]}</h3>
      <p class="obs-regiao-desc">Ainda sem patinhas por aqui. É o próximo estado a acender?</p>
      <p class="obs-regiao-ufs">Se você conhece uma ONG ou protetor em ${OBS.nomesUF[uf]}, chame pra trilha — cadastrar leva minutos e é de graça.</p>
      <a class="btn btn-primary btn-sm" href="../admin.html">convidar uma ONG 🐾</a>`;
  }
}

/* ----- §7 Conquistas ----- */

function obsRenderConquistas(snap) {
  const wrap = document.getElementById("obs-conquistas");
  if (!wrap) return;
  const estados = new Set(snap.orgs.map((o) => (o.state || "").toUpperCase()).filter((uf) => OBS.nomesUF[uf])).size;
  const s = snap.stats;
  const lista = [
    { icone: "🌟", titulo: "Primeira patinha na trilha", cur: s.total_pets, meta: 1 },
    { icone: "🏡", titulo: "Primeira adoção", cur: s.total_adopted, meta: 1 },
    { icone: "🐾", titulo: "10 patinhas cadastradas", cur: s.total_pets, meta: 10 },
    { icone: "💚", titulo: "5 ONGs na rede", cur: s.total_orgs, meta: 5 },
    { icone: "💌", titulo: "10 corações demonstrados", cur: s.total_interests, meta: 10 },
    { icone: "🗺️", titulo: "3 estados no mapa", cur: estados, meta: 3 },
  ];
  wrap.innerHTML = lista.map((c) => {
    const ok = c.cur >= c.meta;
    return `<div class="obs-conquista ${ok ? "ok" : ""}">
      <span class="obs-conquista-icone" aria-hidden="true">${c.icone}</span>
      <div>
        <strong>${c.titulo}</strong>
        <span>${ok ? "desbloqueada! 🎉" : `falta pouco: ${obsFmt(c.cur)}/${obsFmt(c.meta)}`}</span>
      </div>
    </div>`;
  }).join("");
}

/* =====================================================================
   Trilha de patinhas + medalhões dos capítulos (reveal no scroll)
   ===================================================================== */

function obsSetupTrilha() {
  const trilhas = document.querySelectorAll(".obs-trilha");
  trilhas.forEach((t) => {
    t.innerHTML = Array.from({ length: 5 }, (_, i) =>
      `<span class="obs-trilha-paw ${i % 2 ? "dir" : "esq"}" style="transition-delay:${i * 90}ms">${OBS_PAW_SVG}</span>`
    ).join("");
  });
  const medals = document.querySelectorAll(".obs-cap-medal");
  if (OBS_REDUCED) {
    trilhas.forEach((t) => t.classList.add("pisada"));
    medals.forEach((m) => m.classList.add("stamped"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add(entry.target.classList.contains("obs-trilha") ? "pisada" : "stamped");
      io.unobserve(entry.target);
    });
  }, { threshold: 0.35 });
  trilhas.forEach((t) => io.observe(t));
  medals.forEach((m) => io.observe(m));
}

/* =====================================================================
   Acervo nacional (componentes estáticos preservados)
   ===================================================================== */

function obsRenderRuaChips(el) {
  el.innerHTML = OBS.ruaChips.map((c) => `
    <div class="obs-rua-chip">
      <strong>${c.valor}</strong>
      <span>${c.texto}</span>
      <span class="obs-fonte">📌 ${c.fonte}</span>
    </div>`).join("");
}

function obsRenderFatos(el) {
  el.innerHTML = OBS.fatos.map((f) => `
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
      </button>`).join("");
  el.querySelectorAll(".obs-flip").forEach((card) => {
    card.addEventListener("click", () => card.classList.toggle("flipped"));
  });
}

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

function obsRenderRegioesBarras(el) {
  const regs = Object.values(OBS.regioes).sort((a, b) => b.share - a.share);
  const max = regs[0].share;
  el.innerHTML =
    regs.map((r) => `
        <div class="obs-dist-row">
          <span>${r.nome}</span>
          <div class="obs-bar-track"><div class="obs-bar-fill" data-pct="${Math.round((r.share / max) * 100)}"></div></div>
          <span class="obs-ranking-value">~${r.share}%</span>
        </div>`).join("") +
    `<span class="obs-fonte" style="margin-top:10px;display:inline-block;">📌 ${OBS.regiaoFonte}</span>`;
}

function obsRenderLeis(el) {
  el.innerHTML = OBS.leis.map((l) => `
      <div class="obs-timeline-item">
        <span class="obs-timeline-year">${l.ano}</span>
        <h3>${l.titulo}</h3>
        <p>${l.texto}</p>
        <span class="obs-fonte">📌 ${l.fonte}</span>
      </div>`).join("");
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

/* =====================================================================
   Boot
   ===================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // Capítulo 1 + acervo nacional (estáticos).
  const chips = document.getElementById("obs-rua-chips");
  if (chips) obsRenderRuaChips(chips);
  const fatos = document.getElementById("obs-fatos");
  if (fatos) obsRenderFatos(fatos);
  const picto = document.getElementById("obs-pictograma");
  if (picto) obsRenderPictograma(picto);
  const split = document.getElementById("obs-split");
  if (split) obsRenderSplit(split);
  const regioes = document.getElementById("obs-regioes");
  if (regioes) obsRenderRegioesBarras(regioes);
  const leis = document.getElementById("obs-leis");
  if (leis) obsRenderLeis(leis);
  obsAnimateBars();

  obsSetupTrilha();

  // Motor ao vivo.
  obsRefresh(true).then(() => {
    obsStartPolling();
    obsStartTicker();
  });

  // Aba escondida não gasta rede; ao voltar, atualiza na hora.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearInterval(OBS_LIVE.timer);
    } else {
      obsRefresh(false);
      obsStartPolling();
    }
  });
});
