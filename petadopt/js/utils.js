/** Funções auxiliares compartilhadas entre index.html e admin.html */

/**
 * Estados e cidades do Brasil, usados nos dropdowns de localização (cadastro
 * de ONG e filtros do mural). Estados são uma lista fixa; cidades vêm da API
 * pública do IBGE (só quando o estado é escolhido, e com cache em memória
 * pra não repetir a mesma requisição).
 */
const BR_STATES = [
  { uf: "AC", nome: "Acre" },
  { uf: "AL", nome: "Alagoas" },
  { uf: "AP", nome: "Amapá" },
  { uf: "AM", nome: "Amazonas" },
  { uf: "BA", nome: "Bahia" },
  { uf: "CE", nome: "Ceará" },
  { uf: "DF", nome: "Distrito Federal" },
  { uf: "ES", nome: "Espírito Santo" },
  { uf: "GO", nome: "Goiás" },
  { uf: "MA", nome: "Maranhão" },
  { uf: "MT", nome: "Mato Grosso" },
  { uf: "MS", nome: "Mato Grosso do Sul" },
  { uf: "MG", nome: "Minas Gerais" },
  { uf: "PA", nome: "Pará" },
  { uf: "PB", nome: "Paraíba" },
  { uf: "PR", nome: "Paraná" },
  { uf: "PE", nome: "Pernambuco" },
  { uf: "PI", nome: "Piauí" },
  { uf: "RJ", nome: "Rio de Janeiro" },
  { uf: "RN", nome: "Rio Grande do Norte" },
  { uf: "RS", nome: "Rio Grande do Sul" },
  { uf: "RO", nome: "Rondônia" },
  { uf: "RR", nome: "Roraima" },
  { uf: "SC", nome: "Santa Catarina" },
  { uf: "SP", nome: "São Paulo" },
  { uf: "SE", nome: "Sergipe" },
  { uf: "TO", nome: "Tocantins" },
];

const BR_CITIES_CACHE = {};

/** Busca as cidades de um estado na API do IBGE (com cache em memória). */
async function fetchCitiesForState(uf) {
  if (!uf) return [];
  if (BR_CITIES_CACHE[uf]) return BR_CITIES_CACHE[uf];
  try {
    const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
    if (!res.ok) throw new Error(`IBGE respondeu ${res.status}`);
    const data = await res.json();
    const cities = data.map((c) => c.nome).sort((a, b) => a.localeCompare(b, "pt-BR"));
    BR_CITIES_CACHE[uf] = cities;
    return cities;
  } catch (err) {
    console.error("[Patinhas] Erro ao carregar cidades do IBGE:", err);
    return [];
  }
}

/** Preenche um <select> com as 27 UFs brasileiras. */
function populateStateSelect(select, placeholder) {
  select.innerHTML =
    `<option value="">${placeholder || "Selecione o estado"}</option>` +
    BR_STATES.map((s) => `<option value="${s.uf}">${s.nome}</option>`).join("");
}

/** Preenche o <select> de cidade a partir do estado escolhido, selecionando
 * `selectedCity` se ela existir na lista retornada pelo IBGE. */
async function populateCitySelect(citySelect, uf, selectedCity) {
  if (!uf) {
    citySelect.innerHTML = `<option value="">Selecione o estado primeiro</option>`;
    citySelect.disabled = true;
    return;
  }
  citySelect.innerHTML = `<option value="">Carregando cidades...</option>`;
  citySelect.disabled = true;
  const cities = await fetchCitiesForState(uf);
  citySelect.disabled = false;
  if (!cities.length) {
    citySelect.innerHTML = `<option value="">Não foi possível carregar as cidades</option>`;
    return;
  }
  citySelect.innerHTML =
    `<option value="">Selecione a cidade</option>` +
    cities.map((c) => `<option value="${escapeHtml(c)}" ${c === selectedCity ? "selected" : ""}>${escapeHtml(c)}</option>`).join("");
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const STATUS_LABELS = {
  disponivel: "Disponível para adoção",
  em_processo: "Em processo de adoção",
  adotado: "Adoção finalizada",
};

const STATUS_ORDER = ["disponivel", "em_processo", "adotado"];

const SPECIES_LABELS = {
  cachorro: "🐶 Cachorro",
  gato: "🐱 Gato",
  outro: "🐾 Outro",
};

function speciesLabel(species) {
  return SPECIES_LABELS[species] || SPECIES_LABELS.outro;
}

function statusLabel(status) {
  return STATUS_LABELS[status] || status;
}

const STATUS_SHORT_LABELS = {
  disponivel: "Disponível",
  em_processo: "Em processo",
  adotado: "Adotado",
};

function shortStatusLabel(status) {
  return STATUS_SHORT_LABELS[status] || status;
}

/** Agrupa uma lista de pets pelas 3 colunas do Kanban. */
function groupByStatus(pets) {
  const groups = { disponivel: [], em_processo: [], adotado: [] };
  (pets || []).forEach((pet) => {
    if (!groups[pet.status]) groups[pet.status] = [];
    groups[pet.status].push(pet);
  });
  return groups;
}

/** Monta um link de WhatsApp a partir de um número (aceita formatos livres). */
function whatsappLink(rawNumber, message) {
  const digits = String(rawNumber || "").replace(/\D/g, "");
  if (!digits) return null;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${text}`;
}

/** Monta as badges de saúde do pet (vacinado / vermifugado / castrado). */
function petHealthBadgesHtml(pet) {
  const badges = [];
  if (pet.vaccinated) badges.push(`<span class="pet-health-badge">💉 Vacinado</span>`);
  if (pet.dewormed) badges.push(`<span class="pet-health-badge">🪱 Vermifugado</span>`);
  if (pet.neutered) badges.push(`<span class="pet-health-badge">✂️ Castrado</span>`);
  if (!badges.length) return "";
  return `<div class="pet-health-badges">${badges.join("")}</div>`;
}

/**
 * Monta as badges de informações extras do pet (só cidade — convivência
 * virou parte do texto da descrição automática pra não repetir a mesma
 * informação duas vezes no card).
 */
function petTraitsBadgesHtml(pet) {
  const badges = [];
  if (pet.city) badges.push(`<span class="pet-trait-badge">📍 ${escapeHtml(pet.city)}</span>`);
  if (!badges.length) return "";
  return `<div class="pet-trait-badges">${badges.join("")}</div>`;
}

/** ♂/♀ ao lado do nome do pet no card — só aparece quando o gênero foi
 * informado no cadastro. */
function genderSymbolHtml(gender) {
  if (gender === "macho") return `<span class="pet-gender pet-gender--macho" title="Macho">♂</span>`;
  if (gender === "femea") return `<span class="pet-gender pet-gender--femea" title="Fêmea">♀</span>`;
  return "";
}

/** Opções fixas de personalidade — mesmas chaves usadas no checkbox do
 * formulário e no banco (pets.personality). Cada uma tem forma masculina e
 * feminina pra descrição concordar com o gênero cadastrado do pet. */
const PERSONALITY_LABELS = {
  carinhoso: { m: "carinhoso", f: "carinhosa" },
  brincalhao: { m: "brincalhão", f: "brincalhona" },
  calmo: { m: "calmo", f: "calma" },
  independente: { m: "independente", f: "independente" },
  protetor: { m: "protetor", f: "protetora" },
  sociavel: { m: "sociável com pessoas", f: "sociável com pessoas" },
  timido: { m: "tímido no início", f: "tímida no início" },
};

/** Forma da personalidade de acordo com o gênero do pet (default masculino,
 * já que é a forma mais neutra em português quando o gênero não foi informado). */
function personalityLabel(key, gender) {
  const entry = PERSONALITY_LABELS[key];
  if (!entry) return "";
  return gender === "femea" ? entry.f : entry.m;
}

/** Junta uma lista em texto natural: "a", "a e b", "a, b e c". */
function joinWithE(items) {
  if (!items.length) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
}

/**
 * Monta a descrição do pet a partir das características cadastradas —
 * substitui o texto livre por uma frase padronizada, montada só com o que
 * foi de fato preenchido (idade, personalidade, saúde, convivência).
 */
const AGE_LABEL_RANGES = {
  Filhote: "até 1 ano",
  Jovem: "1 a 3 anos",
  Adulto: "3 a 7 anos",
  Idoso: "mais de 7 anos",
};

/** "Adulto (3 a 7 anos)" — usado na linha de meta do card (espécie · porte ·
 * idade) pra deixar a faixa etária clara sem precisar repetir na descrição. */
function ageLabelWithRange(ageLabel) {
  const range = AGE_LABEL_RANGES[ageLabel];
  return range ? `${ageLabel} (${range})` : ageLabel;
}

// Saúde, cidade e faixa etária já aparecem na linha de meta / badges do card
// (ver ageLabelWithRange, petHealthBadgesHtml, petTraitsBadgesHtml) — a
// descrição cobre só comportamento: personalidade, convivência e brinquedo/
// hobby favorito.
function buildPetDescription(pet) {
  const parts = [];

  const personality = (pet.personality || []).map((key) => personalityLabel(key, pet.gender)).filter(Boolean);
  if (personality.length) {
    parts.push(`É ${joinWithE(personality)}`);
  }

  const convivencia = [];
  if (pet.lives_with_dogs === true) convivencia.push("cães");
  if (pet.lives_with_cats === true) convivencia.push("gatos");
  if (pet.lives_with_kids === true) convivencia.push("crianças");
  if (convivencia.length) {
    parts.push(`Convive bem com ${joinWithE(convivencia)}`);
  }
  if (pet.apartment_friendly === true) {
    parts.push("Vive bem em apartamento");
  }

  if (pet.favorite_toy) {
    parts.push(`Adora ${pet.favorite_toy}`);
  }

  if (!parts.length) return "";
  return parts.join(". ") + ".";
}

/** Sempre devolve uma descrição pra exibir — quando nenhuma característica
 * foi marcada, usa uma frase genérica em vez de deixar o card sem texto. */
function petDescriptionOrFallback(pet) {
  const description = buildPetDescription(pet);
  if (description) return description;
  const pronoun = pet.gender === "femea" ? "Ela" : "Ele";
  return `${pronoun} está esperando por uma família especial para chamar de sua.`;
}

/** Depois de quantos dias sem atualização um anúncio "disponível" vira suspeito
 * de estar desatualizado (pet já pode ter sido adotado em outro canal). */
const STALE_LISTING_DAYS = 30;

/** Um pet "disponível" sem atualização há mais de STALE_LISTING_DAYS dias
 * precisa que a ONG confirme se ainda está disponível — até lá, some do
 * mural público (ver getFilteredPets em app.js) mas continua visível pra
 * própria ONG no admin, com o aviso de confirmação. */
function isPetStale(pet) {
  if (pet.status !== "disponivel") return false;
  const staleDays = daysSince(pet.updated_at);
  return staleDays !== null && staleDays > STALE_LISTING_DAYS;
}

// Pipeline de acompanhamento dos interessados, em ordem lógica do processo
// de adoção. Única fonte da verdade — usada pelas abas de filtro e pelo
// select de status de cada interessado, tanto na Central de Interessados
// quanto no drawer de interessados de um pet específico (admin.html).
const INTEREST_STATUSES = [
  { value: "novo", label: "Novo" },
  { value: "em_contato", label: "Em contato" },
  { value: "em_triagem", label: "Em triagem" },
  { value: "aprovado", label: "Aprovado" },
  { value: "adocao_concluida", label: "Adoção concluída" },
  { value: "reprovado", label: "Reprovado" },
  { value: "arquivado", label: "Arquivado" },
];

function statusLabel(value) {
  return INTEREST_STATUSES.find((s) => s.value === value)?.label || value;
}

/** Card de um interessado — usado na Central de Interessados e no drawer de
 * interessados de um pet específico (admin.html). Espera onchange chamando
 * uma função global `updateInterestStatus(id, novoStatus)` definida por
 * quem renderiza (cada página decide como persistir e re-renderizar). */
function interestRowHtml(i) {
  const wa = whatsappLink(i.phone, `Olá, ${i.name}! Vi seu interesse pelo(a) ${i.pet_name} no Patinhas.`);
  return `
    <article class="interest-row" data-status="${i.status}">
      <div class="interest-row-main">
        <strong>${escapeHtml(i.name)}</strong>
        <span class="interest-row-pet">🐾 ${escapeHtml(i.pet_name || "—")}</span>
      </div>
      <div class="interest-row-contact">
        ${i.email ? `<span>✉️ ${escapeHtml(i.email)}</span>` : ""}
        ${
          i.phone
            ? wa
              ? `<a href="${wa}" target="_blank" rel="noopener">📞 ${escapeHtml(i.phone)}</a>`
              : `<span>📞 ${escapeHtml(i.phone)}</span>`
            : ""
        }
      </div>
      ${i.message ? `<p class="interest-row-message">${escapeHtml(i.message)}</p>` : ""}
      <div class="interest-row-foot">
        <span class="hint">${formatDate(i.created_at)}</span>
        <select class="interest-status-select" data-status="${i.status}" onchange="updateInterestStatus('${i.id}', this.value)">
          ${INTEREST_STATUSES.map(
            (s) => `<option value="${s.value}" ${i.status === s.value ? "selected" : ""}>${s.label}</option>`
          ).join("")}
        </select>
      </div>
    </article>
  `;
}

/** ESC fecha o drawer/modal aberto no momento, em qualquer página — clica no
 * próprio botão "X" dele pra reaproveitar a função de fechar já ligada ali. */
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  const open = document.querySelector(".modal-overlay.open");
  if (open) open.querySelector(".modal-close")?.click();
});

/** Botão flutuante "voltar ao topo" — aparece depois de rolar a página e some
 * de volta perto do topo. Usado nas páginas públicas mais longas. */
function setupBackToTop() {
  const btn = document.getElementById("back-to-top");
  if (!btn) return;
  window.addEventListener("scroll", () => {
    btn.classList.toggle("visible", window.scrollY > 500);
  });
  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/** Quantos dias inteiros já se passaram desde uma data ISO. */
function daysSince(isoString) {
  if (!isoString) return null;
  const then = new Date(isoString).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24));
}

const INTEREST_STATUS_LABELS = {
  novo: "Novo",
  contatado: "Contatado",
  arquivado: "Arquivado",
};

/**
 * Troca um botão pelo par "Confirmar?" + Sim/Cancelar, sem usar
 * window.confirm() — pro mesmo padrão já usado ao excluir um pet, agora
 * reaproveitado em qualquer ação que mereça uma segunda confirmação (ex:
 * sair da conta).
 */
function confirmInlineAction(button, confirmLabel, onConfirm) {
  if (button.dataset.confirming === "true") return;
  const original = button.cloneNode(true);
  original.removeAttribute("data-confirming");

  const wrapper = document.createElement("span");
  wrapper.style.display = "inline-flex";
  wrapper.style.gap = "6px";

  const sizeClass = button.className.includes("btn-sm") ? " btn-sm" : "";

  const yesBtn = document.createElement("button");
  yesBtn.type = "button";
  yesBtn.className = `btn btn-danger${sizeClass}`;
  yesBtn.textContent = confirmLabel;
  yesBtn.onclick = onConfirm;

  const noBtn = document.createElement("button");
  noBtn.type = "button";
  noBtn.className = `btn btn-secondary${sizeClass}`;
  noBtn.textContent = "Cancelar";
  noBtn.onclick = () => wrapper.replaceWith(original);

  button.dataset.confirming = "true";
  button.replaceWith(wrapper);
  wrapper.appendChild(yesBtn);
  wrapper.appendChild(noBtn);
}

function interestStatusLabel(status) {
  return INTEREST_STATUS_LABELS[status] || status || "Novo";
}

/** "Hoje" / "Ontem" / dd/mm/aaaa a partir de uma data ISO — usado nos cards
 * de pet e no resumo do dashboard pra indicar a última atualização. */
function formatTime(isoString) {
  if (!isoString) return "";
  try {
    return new Date(isoString).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return "";
  }
}

function relativeDateLabel(isoString) {
  if (!isoString) return "—";
  const days = daysSince(isoString);
  if (days === null) return "—";
  const time = formatTime(isoString);
  if (days === 0) return `Hoje às ${time}`;
  if (days === 1) return `Ontem às ${time}`;
  return `${formatDate(isoString)} às ${time}`;
}

/**
 * Confirma que existe uma sessão de ONG ativa e devolve {orgId, profile}.
 * Sem sessão, manda de volta para admin.html. Usada por qualquer página da
 * área logada além do dashboard principal (ex: Central de Interessados),
 * pra não duplicar a lógica de autenticação em cada uma.
 */
async function requireOngSession() {
  if (window.DEMO_MODE) {
    return { orgId: window.DEMO_ORG.id, profile: Object.assign({}, window.DEMO_ORG) };
  }
  const { data } = await window.sb.auth.getSession();
  if (!data || !data.session) {
    window.location.href = "admin.html";
    return null;
  }
  const orgId = data.session.user.id;
  const { data: profile } = await window.sb.from("profiles").select("*").eq("id", orgId).single();
  return { orgId, profile: profile || { id: orgId, org_name: data.session.user.email } };
}

/**
 * Formata um telefone brasileiro progressivamente enquanto a pessoa digita:
 * descarta tudo que não for dígito e aplica (DD) NNNNN-NNNN (celular, 11
 * dígitos) ou (DD) NNNN-NNNN (fixo, 10 dígitos).
 */
function formatBrPhone(value) {
  const d = String(value || "").replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Liga o mask de telefone a um <input>: só aceita números e formata ao vivo. */
function attachPhoneMask(input) {
  if (!input) return;
  input.setAttribute("inputmode", "numeric");
  input.addEventListener("input", () => {
    input.value = formatBrPhone(input.value);
  });
}

function formatDate(isoString) {
  if (!isoString) return "";
  try {
    return new Date(isoString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (e) {
    return "";
  }
}
