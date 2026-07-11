/** Lógica da página pública (index.html) — quadro de adoção em formato Kanban. */

let ALL_PETS = [];
let ORG_BY_ID = {};
let CURRENT_INTEREST_PET = null;
let INTEREST_MODAL_OPENED_AT = 0;

async function loadPets() {
  const board = document.getElementById("kanban-board");
  const loading = document.getElementById("board-loading");
  const errorBox = document.getElementById("board-error");

  loading.classList.remove("hidden");
  errorBox.classList.add("hidden");
  board.classList.add("hidden");

  try {
    if (window.DEMO_MODE) {
      ALL_PETS = window.DEMO_PETS.slice();
      ORG_BY_ID = { [window.DEMO_ORG.id]: window.DEMO_ORG };
    } else {
      const { data, error } = await window.sb
        .from("pets")
        .select("*, org:profiles(id, org_name, contact_whatsapp, contact_email, city, state)")
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      ALL_PETS = data || [];
      ORG_BY_ID = {};
      ALL_PETS.forEach((pet) => {
        if (pet.org) ORG_BY_ID[pet.org.id] = pet.org;
      });
    }
    populateMuralFilters();
    renderBoard();
    loading.classList.add("hidden");
    board.classList.remove("hidden");
    // Rola até o alvo do hash só depois que o mural renderizou — se rolasse
    // no load do navegador, as imagens do topo ainda estavam carregando e
    // empurravam o conteúdo, fazendo o #faq (vindo de outra página) parar no
    // meio. Aqui a altura já está estável.
    if (window.location.hash.startsWith("#pet-")) {
      document.querySelector(window.location.hash)?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (window.location.hash === "#faq") {
      document.getElementById("faq")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } catch (err) {
    console.error("[Patinhas] Erro ao carregar pets:", err);
    loading.classList.add("hidden");
    errorBox.classList.remove("hidden");
  }
}

/* ---------------- Filtros do mural ---------------- */

/** Valores dos chips ativos de um grupo (espécie, porte ou saúde). */
function selectedChipValues(groupId) {
  return Array.from(document.querySelectorAll(`#${groupId} .filter-chip.active`)).map((c) => c.dataset.value);
}

/** Marca como ativos só os chips cujos valores estão na lista. */
function setChipValues(groupId, values) {
  document.querySelectorAll(`#${groupId} .filter-chip`).forEach((chip) => {
    const on = values.includes(chip.dataset.value);
    chip.classList.toggle("active", on);
    chip.setAttribute("aria-pressed", String(on));
  });
}

/** Estado/cidade e a lista de ONGs vêm só de onde já existe pet cadastrado —
 * evita deixar escolher uma combinação que nunca vai dar resultado. */
function populateMuralFilters() {
  const states = Array.from(
    new Set(ALL_PETS.map((pet) => (ORG_BY_ID[pet.org_id] || pet.org)?.state).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));

  const stateSelect = document.getElementById("filter-state");
  stateSelect.innerHTML =
    `<option value="">Todos</option>` +
    states.map((uf) => `<option value="${uf}">${uf}</option>`).join("");

  // Lista de abrigos/ONGs (valor = id, rótulo = nome) — usado no filtro e no
  // link compartilhável (?ong=<id>).
  const orgs = [];
  const seen = new Set();
  ALL_PETS.forEach((pet) => {
    const o = ORG_BY_ID[pet.org_id] || pet.org;
    if (o && o.id && !seen.has(o.id)) {
      seen.add(o.id);
      orgs.push(o);
    }
  });
  orgs.sort((a, b) => (a.org_name || "").localeCompare(b.org_name || "", "pt-BR"));
  document.getElementById("filter-org").innerHTML =
    `<option value="">Todos</option>` +
    orgs.map((o) => `<option value="${escapeHtml(o.id)}">${escapeHtml(o.org_name)}</option>`).join("");

  // Chips (espécie, porte, saúde): um clique alterna; multi-seleção.
  document.getElementById("mural-filters").addEventListener("click", (e) => {
    const chip = e.target.closest(".filter-chip");
    if (!chip) return;
    const active = chip.classList.toggle("active");
    chip.setAttribute("aria-pressed", String(active));
    applyAndRenderFilters();
  });

  const onSelectChange = () => {
    applyAndRenderFilters();
    collapseMuralFiltersOnMobile();
  };
  stateSelect.addEventListener("change", () => {
    updateMuralCityOptions();
    onSelectChange();
  });
  document.getElementById("filter-city").addEventListener("change", onSelectChange);
  document.getElementById("filter-org").addEventListener("change", onSelectChange);

  // Aplica os filtros que vierem na URL (link compartilhado) antes do 1º render.
  applyFiltersFromURL();
}

/** Reflete os filtros atuais na URL (sem recarregar) pra o link ser
 * compartilhável — ex.: um abrigo manda ?ong=<id> e o mural já abre só com
 * os pets dele. */
function updateURLFromFilters() {
  const p = new URLSearchParams();
  const sp = selectedChipValues("filter-species-chips");
  if (sp.length) p.set("especie", sp.join(","));
  const sz = selectedChipValues("filter-size-chips");
  if (sz.length) p.set("porte", sz.join(","));
  const he = selectedChipValues("filter-health-chips");
  if (he.length) p.set("saude", he.join(","));
  const st = document.getElementById("filter-state").value;
  if (st) p.set("estado", st);
  const ci = document.getElementById("filter-city").value;
  if (ci) p.set("cidade", ci);
  const og = document.getElementById("filter-org").value;
  if (og) p.set("ong", og);
  const qs = p.toString();
  history.replaceState(null, "", location.pathname + (qs ? "?" + qs : ""));
}

function applyAndRenderFilters() {
  updateURLFromFilters();
  renderBoard();
}

/** Lê os filtros da query string e aplica nos controles (só valores válidos). */
function applyFiltersFromURL() {
  const p = new URLSearchParams(location.search);
  setChipValues("filter-species-chips", (p.get("especie") || "").split(",").filter(Boolean));
  setChipValues("filter-size-chips", (p.get("porte") || "").split(",").filter(Boolean));
  setChipValues("filter-health-chips", (p.get("saude") || "").split(",").filter(Boolean));

  const st = p.get("estado");
  const stateSelect = document.getElementById("filter-state");
  if (st && Array.from(stateSelect.options).some((o) => o.value === st)) {
    stateSelect.value = st;
    updateMuralCityOptions();
  }
  const ci = p.get("cidade");
  const citySelect = document.getElementById("filter-city");
  if (ci && Array.from(citySelect.options).some((o) => o.value === ci)) citySelect.value = ci;

  const og = p.get("ong");
  const orgSelect = document.getElementById("filter-org");
  if (og && Array.from(orgSelect.options).some((o) => o.value === og)) orgSelect.value = og;
}

function updateMuralCityOptions() {
  const state = document.getElementById("filter-state").value;
  const citySelect = document.getElementById("filter-city");

  if (!state) {
    citySelect.innerHTML = `<option value="">Todos os estados</option>`;
    citySelect.disabled = true;
    return;
  }

  const cities = Array.from(
    new Set(
      ALL_PETS.filter((pet) => (ORG_BY_ID[pet.org_id] || pet.org)?.state === state)
        .map((pet) => (ORG_BY_ID[pet.org_id] || pet.org)?.city)
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));

  citySelect.disabled = false;
  citySelect.innerHTML =
    `<option value="">Todas</option>` + cities.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
}

/** Mobile: mostra/esconde o painel de filtros do mural. */
function toggleMuralFilters(force) {
  const panel = document.getElementById("mural-filters");
  const toggle = document.getElementById("mural-filters-toggle");
  if (!panel || !toggle) return;
  const open = typeof force === "boolean" ? force : !panel.classList.contains("filters-open");
  panel.classList.toggle("filters-open", open);
  toggle.setAttribute("aria-expanded", String(open));
}

/** No mobile, recolhe os filtros de volta depois que a pessoa aplica um —
 * no desktop o painel fica sempre visível, então não faz nada. */
function collapseMuralFiltersOnMobile() {
  if (window.matchMedia("(max-width: 700px)").matches) toggleMuralFilters(false);
}

function clearMuralFilters() {
  setChipValues("filter-species-chips", []);
  setChipValues("filter-size-chips", []);
  setChipValues("filter-health-chips", []);
  document.getElementById("filter-state").value = "";
  document.getElementById("filter-org").value = "";
  updateMuralCityOptions();
  applyAndRenderFilters();
}

function getFilteredPets() {
  const species = selectedChipValues("filter-species-chips");
  const sizes = selectedChipValues("filter-size-chips");
  const health = selectedChipValues("filter-health-chips");
  const state = document.getElementById("filter-state").value;
  const city = document.getElementById("filter-city").value;
  const orgId = document.getElementById("filter-org").value;

  return ALL_PETS.filter((pet) => {
    // Anúncio "disponível" sem atualização há muito tempo some do mural até
    // a ONG confirmar que o pet ainda está disponível (ver isPetStale).
    if (isPetStale(pet)) return false;
    if (species.length && !species.includes(pet.species)) return false;
    if (sizes.length && !sizes.includes(pet.size)) return false;
    if (health.some((key) => !pet[key])) return false;
    const org = ORG_BY_ID[pet.org_id] || pet.org;
    if (state && org?.state !== state) return false;
    if (city && org?.city !== city) return false;
    if (orgId && String(pet.org_id) !== orgId) return false;
    return true;
  });
}

function renderBoard() {
  const groups = groupByStatus(getFilteredPets());

  STATUS_ORDER.forEach((status) => {
    const list = document.getElementById(`column-${status}-cards`);
    const count = document.getElementById(`column-${status}-count`);
    const pets = groups[status] || [];
    count.textContent = pets.length;

    if (pets.length === 0) {
      list.innerHTML = `<div class="kanban-empty">Nenhum pet por aqui no momento.</div>`;
      return;
    }

    list.innerHTML = pets.map((pet) => petCardHtml(pet)).join("");
  });

  const statDisponivel = document.getElementById("stat-disponivel");
  const statAdotado = document.getElementById("stat-adotado");
  if (statDisponivel) statDisponivel.textContent = (groups.disponivel || []).length;
  if (statAdotado) statAdotado.textContent = (groups.adotado || []).length;
}

function petCardHtml(pet) {
  const org = ORG_BY_ID[pet.org_id] || pet.org || null;
  // Foto renderizada como <img> (não background-image) para ganhar
  // lazy-loading e decodificação assíncrona nativos do navegador — essencial
  // para a performance mobile quando há muitos pets no mural.
  const photoSrc = safeHttpUrl(pet.photo_url);
  const photoImg = photoSrc
    ? `<img class="pet-card-photo-img" src="${escapeHtml(photoSrc)}" alt="Foto de ${escapeHtml(pet.name)}, ${escapeHtml(speciesLabel(pet.species).replace(/[^\p{L}\s]/gu, "").trim().toLowerCase())} para adoção" loading="lazy" decoding="async" />`
    : "";
  const interestBtn =
    pet.status === "disponivel"
      ? `<button class="btn btn-primary btn-cta btn-block" onclick="openInterestModal('${pet.id}')">Quero adotar! 🐾</button>`
      : "";
  const metaParts = [speciesLabel(pet.species), pet.size, ageLabelWithRange(pet.age_label)].filter(Boolean);
  // No site público, a descrição só aparece para pets ainda disponíveis —
  // uma vez em processo ou adotado, o texto de "procurando um lar" perde o
  // sentido. Sempre mostra algo (ver petDescriptionOrFallback) mesmo que a
  // ONG não tenha marcado nenhuma característica.
  const showDescription = pet.status === "disponivel";
  // Compartilhar só faz sentido enquanto o pet está disponível para adoção —
  // em processo ou já adotado, não há para onde encaminhar interessados.
  const shareBtn =
    pet.status === "disponivel"
      ? `<button type="button" class="pet-card-share-btn" title="Compartilhar" onclick="sharePet(this, '${pet.id}', '${escapeHtml(pet.name)}')">🔗</button>`
      : "";

  return `
    <article class="pet-card" id="pet-${pet.id}">
      <div class="pet-card-photo">
        ${photoImg}
        ${shareBtn}
        ${org ? `<span class="pet-card-org-pin">📍 ${escapeHtml(org.org_name)}</span>` : ""}
      </div>
      <div class="pet-card-body">
        <div class="pet-card-top">
          <h3 class="pet-card-name">${escapeHtml(pet.name)} ${genderSymbolHtml(pet.gender, pet.name)}</h3>
        </div>
        <p class="pet-card-meta">${metaParts.map(escapeHtml).join(" · ")}</p>
        ${petHealthBadgesHtml(pet)}
        ${showDescription ? `<p class="pet-card-desc">${escapeHtml(petDescriptionOrFallback(pet))}</p>` : ""}
        <div class="pet-card-actions">${interestBtn}</div>
      </div>
    </article>
  `;
}

/** Compartilha o link direto do pet — usa a Web Share API nativa quando
 * disponível (mobile), senão copia o link e avisa no próprio botão. */
async function sharePet(button, petId, petName) {
  const url = `${window.location.origin}${window.location.pathname}#pet-${petId}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: `Conheça ${petName} no Patinhas 🐾`, url });
    } catch (err) {
      // usuário cancelou o compartilhamento — não é um erro real
    }
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    const original = button.textContent;
    button.textContent = "✅";
    button.disabled = true;
    setTimeout(() => {
      button.textContent = original;
      button.disabled = false;
    }, 1500);
  } catch (err) {
    console.error("[Patinhas] Não foi possível copiar o link:", err);
  }
}

/* ---------------- Modal "Tenho interesse" ---------------- */

function openInterestModal(petId) {
  const pet = ALL_PETS.find((p) => p.id === petId);
  if (!pet) return;
  CURRENT_INTEREST_PET = pet;

  const org = ORG_BY_ID[pet.org_id] || pet.org || null;

  document.getElementById("interest-pet-name").textContent = pet.name;
  // Horário de abertura — usado no anti-spam (envio instantâneo = bot).
  INTEREST_MODAL_OPENED_AT = Date.now();
  const contextPhoto = document.getElementById("interest-pet-photo");
  const ctxPhotoUrl = safeHttpUrl(pet.photo_url);
  contextPhoto.style.backgroundImage = ctxPhotoUrl ? `url('${ctxPhotoUrl}')` : "";
  contextPhoto.style.backgroundSize = pet.photo_url ? "cover" : "";
  contextPhoto.classList.toggle("interest-pet-context-photo--empty", !pet.photo_url);

  document.getElementById("interest-pet-headline").innerHTML =
    `${escapeHtml(pet.name)} ${genderSymbolHtml(pet.gender, pet.name)}`;
  const metaParts = [speciesLabel(pet.species), pet.size, ageLabelWithRange(pet.age_label)].filter(Boolean);
  document.getElementById("interest-pet-meta").textContent = metaParts.join(" · ");
  document.getElementById("interest-pet-badges").innerHTML =
    petHealthBadgesHtml(pet);
  document.getElementById("interest-pet-description").textContent = petDescriptionOrFallback(pet);
  const orgEl = document.getElementById("interest-pet-org");
  orgEl.textContent = org ? `📍 ${org.org_name}` : "";
  orgEl.classList.toggle("hidden", !org);
  document.getElementById("interest-form").reset();
  document.getElementById("interest-error").classList.remove("visible");
  document.getElementById("interest-success").classList.remove("visible");
  document.getElementById("interest-form").classList.remove("hidden");
  document.getElementById("interest-whatsapp-cta").classList.add("hidden");
  document.getElementById("interest-close-confirm").classList.add("hidden");

  // Abrigo com formulário próprio: mostra primeiro a escolha entre os dois
  // caminhos, em vez de ir direto pro formulário do Patinhas.
  const orgFormUrl = safeHttpUrl(pet.adoption_form_url);
  if (orgFormUrl) {
    document.getElementById("interest-org-form-link").href = orgFormUrl;
    document.getElementById("interest-choice-step").classList.remove("hidden");
    document.getElementById("interest-form-step").classList.add("hidden");
  } else {
    document.getElementById("interest-choice-step").classList.add("hidden");
    document.getElementById("interest-form-step").classList.remove("hidden");
  }

  document.getElementById("interest-modal").classList.add("open");
}

/** CTA principal do passo de escolha — o Patinhas continua sendo o fluxo
 * principal, então "ir pro formulário do abrigo" nunca é o único caminho. */
function showInterestFormStep() {
  document.getElementById("interest-choice-step").classList.add("hidden");
  document.getElementById("interest-form-step").classList.remove("hidden");
}

/** Só confirma a saída se a pessoa já preencheu alguma coisa — evitar
 * perguntar à toa quando não há nada a perder. */
function attemptCloseInterestModal() {
  const hasInput = ["interest-name", "interest-phone", "interest-email", "interest-message"].some(
    (id) => document.getElementById(id).value.trim()
  );
  const alreadySubmitted = document.getElementById("interest-success").classList.contains("visible");
  if (!hasInput || alreadySubmitted) {
    closeInterestModal();
    return;
  }
  document.getElementById("interest-close-confirm").classList.remove("hidden");
}

function cancelCloseInterestModal() {
  document.getElementById("interest-close-confirm").classList.add("hidden");
}

function closeInterestModal() {
  document.getElementById("interest-modal").classList.remove("open");
  CURRENT_INTEREST_PET = null;
}

/** Mostra o passo de sucesso do formulário (sem inserir nada). */
function showInterestSuccess() {
  document.getElementById("interest-form").classList.add("hidden");
  const box = document.getElementById("interest-success");
  box.textContent = "Interesse enviado! O abrigo vai entrar em contato em breve. 🎉";
  box.classList.add("visible");
}

/* Cooldown anti-spam por pet, guardado no navegador: no máx. 1 envio a cada 30s
   por pet e 6 no total por hora. Não substitui o trigger do banco — só evita
   floods acidentais e reduz spam casual. */
const INTEREST_SEND_KEY = "patinhas_interest_sends";
function readInterestSends() {
  try {
    const arr = JSON.parse(localStorage.getItem(INTEREST_SEND_KEY) || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch (_) {
    return [];
  }
}
function interestRateLimited(petId) {
  const now = Date.now();
  const sends = readInterestSends().filter((s) => now - s.t < 3600000);
  const samePetRecent = sends.filter((s) => s.pet === petId && now - s.t < 30000);
  return samePetRecent.length > 0 || sends.length >= 6;
}
function recordInterestSend(petId) {
  const now = Date.now();
  const sends = readInterestSends().filter((s) => now - s.t < 3600000);
  sends.push({ pet: petId, t: now });
  try {
    localStorage.setItem(INTEREST_SEND_KEY, JSON.stringify(sends));
  } catch (_) {}
}

async function submitInterest(event) {
  event.preventDefault();
  if (!CURRENT_INTEREST_PET) return;

  const name = document.getElementById("interest-name").value.trim();
  const email = document.getElementById("interest-email").value.trim();
  const phone = document.getElementById("interest-phone").value.trim();
  const message = document.getElementById("interest-message").value.trim();
  const errorBox = document.getElementById("interest-error");
  errorBox.classList.remove("visible");

  if (!name || (!email && !phone)) {
    errorBox.textContent = "Preencha seu nome e pelo menos um contato (telefone ou e-mail).";
    errorBox.classList.add("visible");
    return;
  }

  // --- Anti-spam (camadas leves no cliente; a proteção real é o trigger no
  //     banco). Em todos os casos de bot, fingimos sucesso para não dar pista. ---
  const honeypot = document.getElementById("interest-hp");
  const looksLikeBot =
    (honeypot && honeypot.value.trim() !== "") || // honeypot preenchido
    Date.now() - INTEREST_MODAL_OPENED_AT < 1500;  // enviado rápido demais
  if (looksLikeBot) {
    showInterestSuccess();
    return;
  }
  if (interestRateLimited(CURRENT_INTEREST_PET.id)) {
    errorBox.textContent = "Você já enviou interesse agora há pouco. Aguarde um instante antes de tentar de novo.";
    errorBox.classList.add("visible");
    return;
  }

  const submitBtn = document.getElementById("interest-submit-btn");
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="paw-spinner">🐾</span> Enviando...`;

  try {
    if (!window.DEMO_MODE) {
      const { error } = await window.sb.from("interests").insert([
        {
          pet_id: CURRENT_INTEREST_PET.id,
          name,
          email: email || null,
          phone: phone || null,
          message: message || null,
        },
      ]);
      if (error) throw error;
    }

    document.getElementById("interest-form").classList.add("hidden");
    const successBox = document.getElementById("interest-success");
    successBox.textContent = window.DEMO_MODE
      ? "Modo demonstração: seu interesse não foi salvo de verdade, mas é assim que vai funcionar! 🎉"
      : "Interesse enviado! O abrigo vai entrar em contato em breve. 🎉";
    successBox.classList.add("visible");

    const org = ORG_BY_ID[CURRENT_INTEREST_PET.org_id];
    if (org && org.contact_whatsapp) {
      const link = whatsappLink(
        org.contact_whatsapp,
        `Olá! Tenho interesse em adotar o(a) ${CURRENT_INTEREST_PET.name} 🐾`
      );
      const cta = document.getElementById("interest-whatsapp-cta");
      cta.href = link;
      cta.classList.remove("hidden");
    }
    recordInterestSend(CURRENT_INTEREST_PET.id);
  } catch (err) {
    console.error("[Patinhas] Erro ao registrar interesse:", err);
    errorBox.textContent = "Não foi possível enviar agora. Tente novamente em instantes.";
    errorBox.classList.add("visible");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Enviar";
  }
}

/* ---------------- Efeito de tilt nas fotos do hero ---------------- */

/** Leve inclinação 3D que segue o mouse dentro de cada foto do hero — só
 * decorativo, some suavemente quando o mouse sai. */
function setupHeroTilt() {
  const tiles = document.querySelectorAll(".hero-tile");
  tiles.forEach((tile) => {
    tile.addEventListener("mousemove", (event) => {
      const rect = tile.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      const rotateY = x * 16;
      const rotateX = y * -16;
      tile.classList.add("tilting");
      tile.style.transition = "none";
      tile.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
    });
    tile.addEventListener("mouseleave", () => {
      tile.classList.remove("tilting");
      tile.style.transition = "";
      tile.style.transform = "";
    });
  });
}

/* ---------------- Carrossel mobile (indicador de bolinhas) ---------------- */

function setupKanbanDots() {
  const board = document.getElementById("kanban-board");
  const dots = Array.from(document.querySelectorAll(".kanban-dot"));
  if (!board || !dots.length) return;

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const target = document.getElementById(dot.dataset.target);
      if (target) target.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    });
  });

  setupDragToScroll(board);

  const columns = STATUS_ORDER.map((status) => document.getElementById(`kanban-column-${status}`)).filter(Boolean);
  if (!columns.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.5) return;
        const idx = columns.indexOf(entry.target);
        dots.forEach((dot, i) => dot.classList.toggle("active", i === idx));
      });
    },
    { root: board, threshold: [0.5] }
  );
  columns.forEach((col) => observer.observe(col));
}

// Arrastar as colunas com o cursor (clicar-e-segurar), além do scroll normal.
// Só faz sentido quando o board vira carrossel horizontal (mobile/telas
// estreitas); em telas largas ele é um grid e scrollWidth == clientWidth,
// então o arrasto simplesmente não tem para onde mover.
function setupDragToScroll(board) {
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  board.addEventListener("pointerdown", (e) => {
    // Todo novo toque começa "limpo": zera o flag de arrasto mesmo quando o
    // alvo é um botão/link (senão um arrasto anterior deixaria `moved=true` e
    // engoliria o próximo clique num card).
    moved = false;
    // Cliques em botões/links dentro dos cards devem funcionar normalmente,
    // sem serem interpretados como arrasto do board.
    if (e.target.closest("button, a")) return;
    isDown = true;
    startX = e.clientX;
    startScroll = board.scrollLeft;
  });

  board.addEventListener("pointermove", (e) => {
    if (!isDown) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 4) {
      moved = true;
      board.classList.add("dragging");
      board.setPointerCapture(e.pointerId);
    }
    if (moved) board.scrollLeft = startScroll - dx;
  });

  const end = () => {
    isDown = false;
    board.classList.remove("dragging");
  };
  board.addEventListener("pointerup", end);
  board.addEventListener("pointercancel", end);

  // Se houve arrasto, cancela o clique que dispararia logo em seguida
  // (evita abrir um modal sem querer ao terminar de arrastar sobre um card).
  board.addEventListener(
    "click",
    (e) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    },
    true
  );
}

document.addEventListener("DOMContentLoaded", () => {
  loadPets();
  document.getElementById("interest-form").addEventListener("submit", submitInterest);
  attachPhoneMask(document.getElementById("interest-phone"));
  setupKanbanDots();
  setupBackToTop();
  setupHeroTilt();
});
