/** Lógica da página pública (index.html) — quadro de adoção em formato Kanban. */

let ALL_PETS = [];
let ORG_BY_ID = {};
let CURRENT_INTEREST_PET = null;

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
  } catch (err) {
    console.error("[Patinhas] Erro ao carregar pets:", err);
    loading.classList.add("hidden");
    errorBox.classList.remove("hidden");
  }
}

/* ---------------- Filtros do mural ---------------- */

/** Estado/cidade dos filtros vêm só de onde já existe pet cadastrado — evita
 * deixar escolher uma combinação que nunca vai dar resultado. */
function populateMuralFilters() {
  const states = Array.from(
    new Set(ALL_PETS.map((pet) => (ORG_BY_ID[pet.org_id] || pet.org)?.state).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));

  const stateSelect = document.getElementById("filter-state");
  stateSelect.innerHTML =
    `<option value="">Todos</option>` +
    states.map((uf) => `<option value="${uf}">${uf}</option>`).join("");

  document.getElementById("filter-species").addEventListener("change", renderBoard);
  document.getElementById("filter-size").addEventListener("change", renderBoard);
  stateSelect.addEventListener("change", () => {
    updateMuralCityOptions();
    renderBoard();
  });
  document.getElementById("filter-city").addEventListener("change", renderBoard);
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

function clearMuralFilters() {
  document.getElementById("filter-species").value = "";
  document.getElementById("filter-size").value = "";
  document.getElementById("filter-state").value = "";
  document.querySelectorAll(".filter-health-check").forEach((checkbox) => {
    checkbox.checked = false;
  });
  updateHealthFilterLabel();
  updateMuralCityOptions();
  renderBoard();
}

const HEALTH_FILTER_LABELS = { vaccinated: "Vacinado", dewormed: "Vermifugado", neutered: "Castrado" };

function toggleHealthFilterDropdown() {
  document.getElementById("health-filter-panel").classList.toggle("hidden");
}

function onHealthFilterChange() {
  updateHealthFilterLabel();
  renderBoard();
}

function updateHealthFilterLabel() {
  const checked = Array.from(document.querySelectorAll(".filter-health-check:checked")).map(
    (checkbox) => HEALTH_FILTER_LABELS[checkbox.value]
  );
  document.getElementById("health-filter-label").textContent = checked.length ? checked.join(", ") : "Todos";
}

// Fecha o dropdown de saúde ao clicar fora dele.
document.addEventListener("click", (event) => {
  const dropdown = document.getElementById("health-filter-dropdown");
  if (dropdown && !dropdown.contains(event.target)) {
    document.getElementById("health-filter-panel")?.classList.add("hidden");
  }
});

function getFilteredPets() {
  const species = document.getElementById("filter-species").value;
  const size = document.getElementById("filter-size").value;
  const state = document.getElementById("filter-state").value;
  const city = document.getElementById("filter-city").value;
  const healthFilters = Array.from(document.querySelectorAll(".filter-health-check:checked")).map(
    (checkbox) => checkbox.value
  );

  return ALL_PETS.filter((pet) => {
    // Anúncio "disponível" sem atualização há muito tempo some do mural até
    // a ONG confirmar que o pet ainda está disponível (ver isPetStale).
    if (isPetStale(pet)) return false;
    if (species && pet.species !== species) return false;
    if (size && pet.size !== size) return false;
    if (healthFilters.some((key) => !pet[key])) return false;
    const org = ORG_BY_ID[pet.org_id] || pet.org;
    if (state && org?.state !== state) return false;
    if (city && org?.city !== city) return false;
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
  const photoStyle = pet.photo_url
    ? `style="background-image:url('${escapeHtml(pet.photo_url)}');background-size:cover;background-position:center;"`
    : "";
  const interestBtn =
    pet.status === "disponivel"
      ? `<button class="btn btn-primary btn-cta btn-block" onclick="openInterestModal('${pet.id}')">Quero adotar! 🐾</button>`
      : "";
  const metaParts = [speciesLabel(pet.species), pet.size, ageLabelWithRange(pet.age_label)].filter(Boolean);
  // No site público, a descrição só aparece para pets ainda disponíveis —
  // uma vez em processo ou adotado, o texto de "procurando um lar" perde o sentido.
  const autoDescription = buildPetDescription(pet);
  const showDescription = pet.status === "disponivel" && autoDescription;

  return `
    <article class="pet-card">
      <div class="pet-card-photo" ${photoStyle}>
        ${org ? `<span class="pet-card-org-pin">📍 ${escapeHtml(org.org_name)}</span>` : ""}
      </div>
      <div class="pet-card-body">
        <div class="pet-card-top">
          <h3 class="pet-card-name">${escapeHtml(pet.name)}</h3>
        </div>
        <p class="pet-card-meta">${metaParts.map(escapeHtml).join(" · ")}</p>
        ${petHealthBadgesHtml(pet)}
        ${petTraitsBadgesHtml(pet)}
        ${showDescription ? `<p class="pet-card-desc">${escapeHtml(autoDescription)}</p>` : ""}
        <div class="pet-card-actions">${interestBtn}</div>
      </div>
    </article>
  `;
}

/* ---------------- Modal "Tenho interesse" ---------------- */

function openInterestModal(petId) {
  const pet = ALL_PETS.find((p) => p.id === petId);
  if (!pet) return;
  CURRENT_INTEREST_PET = pet;

  document.getElementById("interest-pet-name").textContent = pet.name;
  document.getElementById("interest-form").reset();
  document.getElementById("interest-error").classList.remove("visible");
  document.getElementById("interest-success").classList.remove("visible");
  document.getElementById("interest-form").classList.remove("hidden");
  document.getElementById("interest-whatsapp-cta").classList.add("hidden");
  document.getElementById("interest-close-confirm").classList.add("hidden");

  // Abrigo com formulário próprio: mostra primeiro a escolha entre os dois
  // caminhos, em vez de ir direto pro formulário do Patinhas.
  if (pet.adoption_form_url) {
    document.getElementById("interest-org-form-link").href = pet.adoption_form_url;
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
