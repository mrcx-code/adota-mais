/** Lógica da área de admin (admin.html) — login, cadastro e gestão dos pets. */

let CURRENT_ORG_ID = null;
let CURRENT_ORG_PROFILE = null;
let MY_PETS = [];
let MY_INTERESTS = [];
let SELECTED_PET_PHOTO_FILE = null;
let SELECTED_LOGO_FILE = null;

/* ======================================================================
   Inicialização / autenticação
   ====================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("login-form").addEventListener("submit", handleLogin);
  document.getElementById("signup-form").addEventListener("submit", handleSignup);
  document.getElementById("pet-form").addEventListener("submit", handlePetFormSubmit);
  document.getElementById("profile-form").addEventListener("submit", handleProfileFormSubmit);
  document.getElementById("pet-photo").addEventListener("change", handlePhotoInputChange);
  document.getElementById("profile-logo").addEventListener("change", handleLogoInputChange);
  // Recalcula a prévia da descrição automática a qualquer mudança no formulário
  // (saúde, convivência, personalidade, brinquedo favorito).
  document.getElementById("pet-form").addEventListener("input", updatePetDescriptionPreview);
  attachPhoneMask(document.getElementById("signup-whatsapp"));
  attachPhoneMask(document.getElementById("profile-whatsapp"));

  populateStateSelect(document.getElementById("signup-state"));
  populateStateSelect(document.getElementById("profile-state"));
  document.getElementById("signup-state").addEventListener("change", (e) => {
    populateCitySelect(document.getElementById("signup-city"), e.target.value);
  });
  document.getElementById("profile-state").addEventListener("change", (e) => {
    populateCitySelect(document.getElementById("profile-city"), e.target.value);
  });

  if (window.DEMO_MODE) {
    CURRENT_ORG_ID = window.DEMO_ORG.id;
    CURRENT_ORG_PROFILE = Object.assign({}, window.DEMO_ORG);
    MY_PETS = window.DEMO_PETS.slice();
    MY_INTERESTS = Object.values(window.DEMO_INTERESTS || {}).flat();
    showDashboard();
    return;
  }

  const { data } = await window.sb.auth.getSession();
  if (data && data.session) {
    await enterDashboardWithSession(data.session);
  } else {
    showAuthView();
  }
});

function showAuthView() {
  document.getElementById("auth-view").classList.remove("hidden");
  document.getElementById("dashboard-view").classList.add("hidden");
  document.getElementById("account-menu").classList.add("hidden");
  document.getElementById("admin-org-badge").classList.add("hidden");
  document.getElementById("new-pet-header-btn").classList.add("hidden");
  document.getElementById("bulk-import-header-btn").classList.add("hidden");
}

function showDashboard() {
  document.getElementById("auth-view").classList.add("hidden");
  document.getElementById("dashboard-view").classList.remove("hidden");
  document.getElementById("account-menu").classList.remove("hidden");
  document.getElementById("new-pet-header-btn").classList.remove("hidden");
  document.getElementById("bulk-import-header-btn").classList.remove("hidden");
  document.getElementById("org-name-label").textContent = CURRENT_ORG_PROFILE ? CURRENT_ORG_PROFILE.org_name : "";
  document.getElementById("admin-org-badge").classList.remove("hidden");
  renderAdminBoard();
}

function toggleAccountMenu() {
  document.getElementById("account-menu-panel").classList.toggle("hidden");
}

function closeAccountMenu() {
  document.getElementById("account-menu-panel").classList.add("hidden");
}

// Fecha o menu de conta ao clicar fora dele. Usa composedPath() em vez de
// menu.contains(event.target): o clique em "Sair" troca o botão original
// pelo par Sim/Cancelar (confirmInlineAction) antes do evento terminar de
// borbulhar, então event.target já não está mais no DOM e .contains()
// devolveria false mesmo o clique tendo sido dentro do menu — fechando o
// painel bem na hora que a confirmação deveria aparecer.
document.addEventListener("click", (event) => {
  const menu = document.getElementById("account-menu");
  if (menu && !event.composedPath().includes(menu)) {
    closeAccountMenu();
  }
});

function showLogin() {
  document.getElementById("signup-panel").classList.add("hidden");
  document.getElementById("login-panel").classList.remove("hidden");
}

function showSignup() {
  document.getElementById("login-panel").classList.add("hidden");
  document.getElementById("signup-panel").classList.remove("hidden");
}

async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const errorBox = document.getElementById("login-error");
  errorBox.classList.remove("visible");

  const btn = document.getElementById("login-submit-btn");
  btn.disabled = true;
  btn.innerHTML = `<span class="paw-spinner">🐾</span> Entrando...`;

  try {
    const { data, error } = await window.sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await enterDashboardWithSession(data.session);
  } catch (err) {
    console.error("[Patinhas] Erro no login:", err);
    errorBox.textContent = "E-mail ou senha incorretos.";
    errorBox.classList.add("visible");
  } finally {
    btn.disabled = false;
    btn.textContent = "Entrar";
  }
}

async function handleSignup(event) {
  event.preventDefault();
  const orgName = document.getElementById("signup-org-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;
  const whatsapp = document.getElementById("signup-whatsapp").value.trim();
  const state = document.getElementById("signup-state").value;
  const city = document.getElementById("signup-city").value;
  const errorBox = document.getElementById("signup-error");
  const successBox = document.getElementById("signup-success");
  errorBox.classList.remove("visible");
  successBox.classList.remove("visible");

  if (!state || !city) {
    errorBox.textContent = "Selecione o estado e a cidade do abrigo.";
    errorBox.classList.add("visible");
    return;
  }

  const btn = document.getElementById("signup-submit-btn");
  btn.disabled = true;
  btn.innerHTML = `<span class="paw-spinner">🐾</span> Criando conta...`;

  try {
    const { data, error } = await window.sb.auth.signUp({
      email,
      password,
      options: {
        data: {
          org_name: orgName,
          contact_email: email,
          contact_whatsapp: whatsapp || null,
          state,
          city,
        },
      },
    });
    if (error) throw error;

    if (data.session) {
      await enterDashboardWithSession(data.session);
    } else {
      successBox.textContent = "Conta criada! Verifique seu e-mail para confirmar antes de entrar.";
      successBox.classList.add("visible");
      document.getElementById("signup-form").reset();
    }
  } catch (err) {
    console.error("[Patinhas] Erro no cadastro:", err);
    errorBox.textContent = err.message || "Não foi possível criar a conta agora.";
    errorBox.classList.add("visible");
  } finally {
    btn.disabled = false;
    btn.textContent = "Criar conta";
  }
}

async function enterDashboardWithSession(session) {
  CURRENT_ORG_ID = session.user.id;
  const { data: profile, error } = await window.sb
    .from("profiles")
    .select("*")
    .eq("id", CURRENT_ORG_ID)
    .single();
  if (error) {
    console.error("[Patinhas] Erro ao carregar perfil:", error);
  }
  CURRENT_ORG_PROFILE = profile || { id: CURRENT_ORG_ID, org_name: session.user.email };
  await loadMyPets();
  await loadMyInterests();
  showDashboard();
}

async function handleGoogleAuth() {
  if (window.DEMO_MODE) return;
  const { error } = await window.sb.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin + window.location.pathname },
  });
  if (error) {
    console.error("[Patinhas] Erro no login com Google:", error);
    alertInline("Não foi possível iniciar o login com Google.");
  }
}

async function handleLogout() {
  if (!window.DEMO_MODE) {
    await window.sb.auth.signOut();
  }
  CURRENT_ORG_ID = null;
  CURRENT_ORG_PROFILE = null;
  MY_PETS = [];
  showAuthView();
}

/* ======================================================================
   Carregar / renderizar pets
   ====================================================================== */

async function loadMyPets() {
  if (window.DEMO_MODE) return; // já carregado no boot
  const { data, error } = await window.sb
    .from("pets")
    .select("*")
    .eq("org_id", CURRENT_ORG_ID)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[Patinhas] Erro ao carregar pets:", error);
    MY_PETS = [];
    return;
  }
  MY_PETS = data || [];
}

/** Carrega, de uma vez só, todos os interesses recebidos pelos pets da ONG
 * — alimenta os cards de resumo do dashboard e o contador de cada card. */
async function loadMyInterests() {
  if (window.DEMO_MODE) return; // já carregado no boot
  const petIds = MY_PETS.map((p) => p.id);
  if (!petIds.length) {
    MY_INTERESTS = [];
    return;
  }
  const { data, error } = await window.sb
    .from("interests")
    .select("*")
    .in("pet_id", petIds)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[Patinhas] Erro ao carregar interesses:", error);
    MY_INTERESTS = [];
    return;
  }
  MY_INTERESTS = data || [];
}

/** Conta quantos interesses cada pet recebeu, a partir do MY_INTERESTS já carregado. */
function countInterestsByPet() {
  const counts = {};
  MY_INTERESTS.forEach((i) => {
    counts[i.pet_id] = (counts[i.pet_id] || 0) + 1;
  });
  return counts;
}

function renderOngStats() {
  const groups = groupByStatus(MY_PETS);
  document.getElementById("stat-count-disponivel").textContent = (groups.disponivel || []).length;
  document.getElementById("stat-count-em_processo").textContent = (groups.em_processo || []).length;
  document.getElementById("stat-count-adotado").textContent = (groups.adotado || []).length;
  document.getElementById("stat-count-total-interesses").textContent = MY_INTERESTS.length;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const today = MY_INTERESTS.filter((i) => new Date(i.created_at) >= startOfToday).length;
  document.getElementById("stat-count-hoje").textContent = today;
}

function renderAdminBoard() {
  renderOngStats();

  const loading = document.getElementById("dash-loading");
  const empty = document.getElementById("dash-empty");
  const board = document.getElementById("admin-board");
  loading.classList.add("hidden");

  if (MY_PETS.length === 0) {
    empty.classList.remove("hidden");
    board.classList.add("hidden");
    return;
  }
  empty.classList.add("hidden");
  board.classList.remove("hidden");

  const interestCounts = countInterestsByPet();
  const groups = groupByStatus(MY_PETS);
  STATUS_ORDER.forEach((status) => {
    const list = document.getElementById(`admin-column-${status}-cards`);
    const count = document.getElementById(`admin-column-${status}-count`);
    const pets = groups[status] || [];
    count.textContent = pets.length;
    list.innerHTML = pets.length
      ? pets.map((pet) => adminPetCardHtml(pet, interestCounts[pet.id] || 0)).join("")
      : `<div class="kanban-empty">Nenhum pet aqui.</div>`;
  });

  setupDragAndDrop();
}

function adminPetCardHtml(pet, interestCount) {
  const photoStyle = pet.photo_url
    ? `style="background-image:url('${escapeHtml(pet.photo_url)}');background-size:cover;background-position:center;"`
    : "";
  const metaParts = [speciesLabel(pet.species), pet.size, ageLabelWithRange(pet.age_label)].filter(Boolean);
  const moveButtons = STATUS_ORDER.map((status) => {
    const isCurrent = status === pet.status;
    return `<button class="btn btn-sm ${isCurrent ? "btn-primary" : "btn-secondary"}"
      ${isCurrent ? "disabled" : ""}
      onclick="changeStatus('${pet.id}', '${status}')">${shortStatusLabel(status)}</button>`;
  }).join("");

  const staleDays = daysSince(pet.updated_at);
  const isStale = isPetStale(pet);
  const staleBanner = isStale
    ? `<div class="stale-banner">
         <span>⏳ Este pet ainda está disponível? Sem atualização há ${staleDays} dias.</span>
         <button type="button" class="btn btn-secondary btn-sm" onclick="confirmAvailability('${pet.id}')">Confirmar disponibilidade</button>
       </div>`
    : "";

  return `
    <article class="pet-card" draggable="true" data-pet-id="${pet.id}">
      <div class="pet-card-photo" ${photoStyle}>
        <div class="pet-card-quick-actions">
          <button class="pet-card-icon-btn" data-tooltip="Ver interessados (${interestCount})" aria-label="Ver interessados" onclick="openPetInterestsDrawer('${pet.id}')">
            💬${interestCount > 0 ? `<span class="pet-card-icon-badge">${interestCount}</span>` : ""}
          </button>
          <button class="pet-card-icon-btn" data-tooltip="Editar pet" aria-label="Editar pet" onclick="openPetModal('${pet.id}')">✏️</button>
          <button class="pet-card-icon-btn pet-card-icon-btn--danger" data-tooltip="Excluir pet" aria-label="Excluir pet" onclick="confirmDeletePetIcon(this, '${pet.id}')">🗑️</button>
        </div>
      </div>
      <div class="pet-card-body">
        <div class="pet-card-top">
          <h3 class="pet-card-name">${escapeHtml(pet.name)} ${genderSymbolHtml(pet.gender, pet.name)}</h3>
        </div>
        <p class="pet-card-meta">${metaParts.map(escapeHtml).join(" · ")}</p>
        ${petHealthBadgesHtml(pet)}
        <p class="pet-card-desc">${escapeHtml(petDescriptionOrFallback(pet))}</p>
        ${staleBanner}
        <div class="pet-card-move">${moveButtons}</div>
        <div class="pet-card-dates">
          <span>Atualizado: ${relativeDateLabel(pet.updated_at)}</span>
          <span>Criado em: ${formatDate(pet.created_at)}</span>
        </div>
      </div>
    </article>
  `;
}

/** Botão "Confirmar disponibilidade" no aviso de anúncio desatualizado —
 * reafirma o status atual só para tocar o updated_at (via trigger no banco). */
async function confirmAvailability(petId) {
  if (window.DEMO_MODE) {
    const pet = MY_PETS.find((p) => p.id === petId);
    if (pet) pet.updated_at = new Date().toISOString();
    renderAdminBoard();
    return;
  }
  const { error } = await window.sb.from("pets").update({ status: "disponivel" }).eq("id", petId);
  if (error) {
    console.error("[Patinhas] Erro ao confirmar disponibilidade:", error);
    alertInline("Não foi possível confirmar agora. Tente novamente.");
    return;
  }
  await loadMyPets();
  renderAdminBoard();
}

/* ======================================================================
   Drawer: interessados de um pet específico
   ====================================================================== */

let CURRENT_INTERESTS_PET_ID = null;

function openPetInterestsDrawer(petId) {
  CURRENT_INTERESTS_PET_ID = petId;
  const pet = MY_PETS.find((p) => p.id === petId);
  const count = MY_INTERESTS.filter((i) => i.pet_id === petId).length;
  document.getElementById("pet-interests-title").textContent = pet ? pet.name : "";
  document.getElementById("pet-interests-count").textContent = count;
  renderPetInterestsList();
  document.getElementById("pet-interests-modal").classList.add("open");
}

function closePetInterestsDrawer() {
  document.getElementById("pet-interests-modal").classList.remove("open");
  CURRENT_INTERESTS_PET_ID = null;
}

function renderPetInterestsList() {
  const pet = MY_PETS.find((p) => p.id === CURRENT_INTERESTS_PET_ID);
  const items = MY_INTERESTS.filter((i) => i.pet_id === CURRENT_INTERESTS_PET_ID).map((i) =>
    Object.assign({}, i, { pet_name: pet ? pet.name : "" })
  );
  const empty = document.getElementById("pet-interests-empty");
  const list = document.getElementById("pet-interests-list");
  if (!items.length) {
    empty.classList.remove("hidden");
    list.innerHTML = "";
    return;
  }
  empty.classList.add("hidden");
  list.innerHTML = items.map((i) => interestRowHtml(i)).join("");
}

async function updateInterestStatus(interestId, newStatus) {
  const item = MY_INTERESTS.find((i) => i.id === interestId);
  if (!item) return;
  const previous = item.status;
  item.status = newStatus; // otimista

  if (!window.DEMO_MODE) {
    const { error } = await window.sb.from("interests").update({ status: newStatus }).eq("id", interestId);
    if (error) {
      console.error("[Patinhas] Erro ao atualizar status:", error);
      item.status = previous;
      renderPetInterestsList();
      return;
    }
  }
  renderPetInterestsList();
}

/* ======================================================================
   Importação em lote de pets (CSV)
   ====================================================================== */

const BULK_IMPORT_COLUMNS = [
  "nome",
  "especie",
  "porte",
  "idade",
  "sexo",
  "status",
  "vacinado",
  "vermifugado",
  "castrado",
  "brinquedo_favorito",
];

let BULK_IMPORT_ROWS = [];

function openBulkImportDrawer() {
  document.getElementById("bulk-import-file").value = "";
  document.getElementById("bulk-import-textarea").value = "";
  document.getElementById("bulk-import-error").classList.remove("visible");
  document.getElementById("bulk-import-preview").innerHTML = "";
  document.getElementById("bulk-import-submit-btn").classList.add("hidden");
  BULK_IMPORT_ROWS = [];
  document.getElementById("bulk-import-modal").classList.add("open");
}

function closeBulkImportDrawer() {
  document.getElementById("bulk-import-modal").classList.remove("open");
}

function downloadBulkImportTemplate() {
  const header = BULK_IMPORT_COLUMNS.join(",");
  const example = "Caramelo,cachorro,Médio,Jovem,macho,disponivel,sim,sim,nao,São Paulo,bolinha de tênis";
  const csv = `${header}\n${example}\n`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "modelo-importacao-pets.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function handleBulkImportFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    document.getElementById("bulk-import-textarea").value = String(reader.result || "");
  };
  reader.readAsText(file, "utf-8");
}

/** Parser simples de CSV — lida com campos entre aspas (vírgulas e aspas
 * duplas escapadas como "" dentro do campo), suficiente pro nosso template. */
function parseCsvSimple(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      pushField();
    } else if (char === "\n") {
      pushRow();
    } else if (char === "\r") {
      // ignora — trata \r\n como \n
    } else {
      field += char;
    }
  }
  if (field || row.length) pushRow();
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

const BULK_IMPORT_YES_VALUES = ["sim", "yes", "true", "1", "x"];

function parseBulkImportRows() {
  const text = document.getElementById("bulk-import-textarea").value.trim();
  if (!text) return { error: "Cole o CSV ou escolha um arquivo antes de pré-visualizar." };

  const rows = parseCsvSimple(text);
  if (!rows.length) return { error: "Não encontrei nenhuma linha nesse CSV." };

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const dataRows = rows.slice(1);
  if (!dataRows.length) return { error: "O CSV só tem o cabeçalho — inclua ao menos uma linha de pet." };

  const nameIdx = header.indexOf("nome");
  if (nameIdx === -1) {
    return { error: `Não encontrei a coluna "nome". Colunas esperadas: ${BULK_IMPORT_COLUMNS.join(", ")}.` };
  }

  const pets = [];
  const errors = [];
  dataRows.forEach((cells, i) => {
    const get = (col) => {
      const idx = header.indexOf(col);
      return idx === -1 ? "" : (cells[idx] || "").trim();
    };
    const name = get("nome");
    if (!name) {
      errors.push(`Linha ${i + 2}: sem nome, pulei essa linha.`);
      return;
    }
    const species = get("especie").toLowerCase() === "gato" ? "gato" : "cachorro";
    const sizeRaw = get("porte");
    const size = ["Pequeno", "Médio", "Grande"].includes(sizeRaw) ? sizeRaw : "Médio";
    const ageRaw = get("idade");
    const age_label = ["Filhote", "Jovem", "Adulto", "Idoso"].includes(ageRaw) ? ageRaw : "Adulto";
    const genderRaw = get("sexo").toLowerCase();
    const gender = genderRaw === "macho" || genderRaw === "femea" ? genderRaw : null;
    const statusRaw = get("status").toLowerCase();
    const status = ["disponivel", "em_processo", "adotado"].includes(statusRaw) ? statusRaw : "disponivel";
    const yes = (col) => BULK_IMPORT_YES_VALUES.includes(get(col).toLowerCase());

    pets.push({
      name,
      species,
      size,
      age_label,
      gender,
      status,
      vaccinated: yes("vacinado"),
      dewormed: yes("vermifugado"),
      neutered: yes("castrado"),
      favorite_toy: get("brinquedo_favorito") || null,
      personality: [],
    });
  });

  return { pets, errors };
}

function previewBulkImport() {
  const errorBox = document.getElementById("bulk-import-error");
  const previewBox = document.getElementById("bulk-import-preview");
  const submitBtn = document.getElementById("bulk-import-submit-btn");
  errorBox.classList.remove("visible");
  previewBox.innerHTML = "";
  submitBtn.classList.add("hidden");

  const { error, pets, errors } = parseBulkImportRows();
  if (error) {
    errorBox.textContent = error;
    errorBox.classList.add("visible");
    return;
  }

  BULK_IMPORT_ROWS = pets;

  const rowsHtml = pets
    .map(
      (p) => `
        <tr>
          <td>${escapeHtml(p.name)}</td>
          <td>${escapeHtml(speciesLabel(p.species))}</td>
          <td>${escapeHtml(p.size)}</td>
          <td>${escapeHtml(ageLabelWithRange(p.age_label))}</td>
          <td>${escapeHtml(shortStatusLabel(p.status))}</td>
        </tr>`
    )
    .join("");

  previewBox.innerHTML = `
    <p class="hint">${pets.length} pet(s) prontos pra importar${errors.length ? `, ${errors.length} linha(s) ignorada(s)` : ""}.</p>
    ${errors.length ? `<p class="form-error visible">${errors.map(escapeHtml).join("<br />")}</p>` : ""}
    <div class="bulk-import-preview-table-wrap">
      <table class="bulk-import-preview-table">
        <thead><tr><th>Nome</th><th>Espécie</th><th>Porte</th><th>Idade</th><th>Status</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
  `;

  if (pets.length) {
    submitBtn.textContent = `Importar ${pets.length} pet(s)`;
    submitBtn.classList.remove("hidden");
  }
}

async function submitBulkImport() {
  if (!BULK_IMPORT_ROWS.length) return;
  const submitBtn = document.getElementById("bulk-import-submit-btn");
  const errorBox = document.getElementById("bulk-import-error");
  submitBtn.disabled = true;
  submitBtn.textContent = "Importando...";

  try {
    if (window.DEMO_MODE) {
      const now = new Date().toISOString();
      BULK_IMPORT_ROWS.forEach((pet) => {
        MY_PETS.unshift(
          Object.assign({ id: `demo-bulk-${Date.now()}-${Math.random().toString(36).slice(2)}` }, pet, {
            created_at: now,
            updated_at: now,
          })
        );
      });
    } else {
      const payload = BULK_IMPORT_ROWS.map((pet) => Object.assign({}, pet, { org_id: CURRENT_ORG_ID }));
      const { error } = await window.sb.from("pets").insert(payload);
      if (error) throw error;
      await loadMyPets();
    }
    closeBulkImportDrawer();
    renderAdminBoard();
  } catch (err) {
    console.error("[Patinhas] Erro na importação em lote:", err);
    errorBox.textContent = `Não foi possível importar agora${err?.message ? ` (${err.message})` : ""}.`;
    errorBox.classList.add("visible");
  } finally {
    submitBtn.disabled = false;
  }
}

/* ======================================================================
   Excluir pet (confirmação inline, sem usar window.confirm)
   ====================================================================== */

function confirmDeletePetIcon(button, petId) {
  if (button.dataset.confirming === "true") return;
  button.dataset.confirming = "true";

  // "display: contents" faz os dois botões ocuparem o lugar do original
  // na coluna de ícones, sem criar uma caixa extra que quebraria o layout.
  const wrapper = document.createElement("span");
  wrapper.style.display = "contents";

  const yesBtn = document.createElement("button");
  yesBtn.className = "pet-card-icon-btn pet-card-icon-btn--danger";
  yesBtn.setAttribute("data-tooltip", "Confirmar exclusão");
  yesBtn.setAttribute("aria-label", "Confirmar exclusão");
  yesBtn.textContent = "✓";
  yesBtn.onclick = () => deletePet(petId);

  const noBtn = document.createElement("button");
  noBtn.className = "pet-card-icon-btn";
  noBtn.setAttribute("data-tooltip", "Cancelar");
  noBtn.setAttribute("aria-label", "Cancelar");
  noBtn.textContent = "✕";
  noBtn.onclick = () => renderAdminBoard();

  button.replaceWith(wrapper);
  wrapper.appendChild(yesBtn);
  wrapper.appendChild(noBtn);
}

async function deletePet(petId) {
  if (window.DEMO_MODE) {
    MY_PETS = MY_PETS.filter((p) => p.id !== petId);
    MY_INTERESTS = MY_INTERESTS.filter((i) => i.pet_id !== petId);
    renderAdminBoard();
    return;
  }
  const { error } = await window.sb.from("pets").delete().eq("id", petId);
  if (error) {
    console.error("[Patinhas] Erro ao excluir pet:", error);
    alertInline("Não foi possível excluir agora. Tente novamente.");
    return;
  }
  await loadMyPets();
  // Os interesses do pet excluído são apagados em cascata no banco — recarrega
  // pra não deixar as estatísticas do dashboard contando algo que não existe mais.
  await loadMyInterests();
  renderAdminBoard();
}

function alertInline(message) {
  // Evita usar window.alert(); mostra um aviso simples e temporário no topo.
  const el = document.createElement("div");
  el.className = "form-error visible";
  el.style.position = "fixed";
  el.style.top = "14px";
  el.style.left = "50%";
  el.style.transform = "translateX(-50%)";
  el.style.zIndex = "200";
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/* ======================================================================
   Mover pet entre colunas (botões + drag and drop)
   ====================================================================== */

async function changeStatus(petId, newStatus) {
  if (window.DEMO_MODE) {
    const pet = MY_PETS.find((p) => p.id === petId);
    if (pet) {
      pet.status = newStatus;
      pet.updated_at = new Date().toISOString();
    }
    renderAdminBoard();
    return;
  }
  // updated_at não precisa ser setado aqui — o trigger pets_touch_updated_at
  // no banco toca o campo automaticamente em qualquer UPDATE.
  const { error } = await window.sb.from("pets").update({ status: newStatus }).eq("id", petId);
  if (error) {
    console.error("[Patinhas] Erro ao mover pet:", error);
    alertInline("Não foi possível mover o pet agora.");
    return;
  }
  await loadMyPets();
  renderAdminBoard();
}

function setupDragAndDrop() {
  document.querySelectorAll(".pet-card[draggable='true']").forEach((card) => {
    card.addEventListener("dragstart", (e) => {
      card.classList.add("dragging");
      e.dataTransfer.setData("text/plain", card.dataset.petId);
    });
    card.addEventListener("dragend", () => card.classList.remove("dragging"));

    // Sem isto, soltar exatamente em cima de outro card (em vez do espaço
    // vazio da coluna) não disparava o "drop" — o navegador só libera o
    // drop num elemento que tenha seu próprio "dragover" com preventDefault.
    card.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    });
    card.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const column = card.closest(".kanban-column");
      if (!column) return;
      column.classList.remove("drag-over");
      const petId = e.dataTransfer.getData("text/plain");
      if (petId) changeStatus(petId, column.dataset.status);
    });
  });

  document.querySelectorAll(".kanban-column").forEach((column) => {
    const status = column.dataset.status;
    column.addEventListener("dragover", (e) => {
      e.preventDefault();
      column.classList.add("drag-over");
    });
    column.addEventListener("dragleave", () => column.classList.remove("drag-over"));
    column.addEventListener("drop", (e) => {
      e.preventDefault();
      column.classList.remove("drag-over");
      const petId = e.dataTransfer.getData("text/plain");
      if (petId) changeStatus(petId, status);
    });
  });
}

/* ======================================================================
   Modal: novo pet / editar pet
   ====================================================================== */

const PET_AGE_STANDARD_VALUES = ["Filhote", "Jovem", "Adulto", "Idoso"];

// Pets cadastrados antes do campo virar dropdown podem ter um texto livre
// (ex: "3 anos") que não bate com nenhuma opção padrão — em vez de descartar
// esse valor ao editar, injetamos ele como uma opção extra pra não perder
// o dado já cadastrado.
function setPetAgeValue(ageValue) {
  const select = document.getElementById("pet-age");
  const existingCustom = select.querySelector('option[data-custom="true"]');
  if (existingCustom) existingCustom.remove();

  if (ageValue && !PET_AGE_STANDARD_VALUES.includes(ageValue)) {
    const opt = document.createElement("option");
    opt.value = ageValue;
    opt.textContent = `${ageValue} (valor antigo)`;
    opt.dataset.custom = "true";
    select.appendChild(opt);
  }
  select.value = ageValue || "Filhote";
}

function openPetModal(petId) {
  const isEdit = Boolean(petId);
  document.getElementById("pet-modal-title").textContent = isEdit ? "Editar pet" : "Novo pet";
  document.getElementById("pet-form-error").classList.remove("visible");
  document.getElementById("pet-form").reset();
  document.getElementById("pet-photo-preview").classList.add("hidden");
  SELECTED_PET_PHOTO_FILE = null;

  const pet = isEdit ? MY_PETS.find((p) => p.id === petId) : null;
  document.getElementById("pet-id").value = pet ? pet.id : "";
  document.getElementById("pet-name").value = pet ? pet.name : "";
  document.getElementById("pet-species").value = pet ? pet.species : "cachorro";
  document.getElementById("pet-size").value = pet ? pet.size || "Médio" : "Médio";
  document.getElementById("pet-gender").value = pet ? pet.gender || "" : "";
  setPetAgeValue(pet ? pet.age_label || "" : "");
  document.getElementById("pet-status").value = pet ? pet.status : "disponivel";
  document.getElementById("pet-vaccinated").checked = pet ? Boolean(pet.vaccinated) : false;
  document.getElementById("pet-dewormed").checked = pet ? Boolean(pet.dewormed) : false;
  document.getElementById("pet-neutered").checked = pet ? Boolean(pet.neutered) : false;
  document.getElementById("pet-adoption-form-url").value = pet ? pet.adoption_form_url || "" : "";
  document.getElementById("pet-lives-with-dogs").checked = pet ? Boolean(pet.lives_with_dogs) : false;
  document.getElementById("pet-lives-with-cats").checked = pet ? Boolean(pet.lives_with_cats) : false;
  document.getElementById("pet-lives-with-kids").checked = pet ? Boolean(pet.lives_with_kids) : false;
  document.getElementById("pet-apartment-friendly").checked = pet ? Boolean(pet.apartment_friendly) : false;
  document.getElementById("pet-favorite-toy").value = pet ? pet.favorite_toy || "" : "";
  const personality = pet ? pet.personality || [] : [];
  document.querySelectorAll(".pet-personality-check").forEach((checkbox) => {
    checkbox.checked = personality.includes(checkbox.value);
  });

  if (pet && pet.photo_url) {
    const preview = document.getElementById("pet-photo-preview");
    preview.src = pet.photo_url;
    preview.classList.remove("hidden");
  }

  updatePetDescriptionPreview();
  document.getElementById("pet-modal").classList.add("open");
}

/** Recalcula a prévia da descrição automática a partir do estado atual do
 * formulário — chamada a cada mudança nos campos que alimentam a frase. */
function updatePetDescriptionPreview() {
  const draftPet = {
    vaccinated: document.getElementById("pet-vaccinated").checked,
    dewormed: document.getElementById("pet-dewormed").checked,
    neutered: document.getElementById("pet-neutered").checked,
    lives_with_dogs: document.getElementById("pet-lives-with-dogs").checked,
    lives_with_cats: document.getElementById("pet-lives-with-cats").checked,
    lives_with_kids: document.getElementById("pet-lives-with-kids").checked,
    apartment_friendly: document.getElementById("pet-apartment-friendly").checked,
    favorite_toy: document.getElementById("pet-favorite-toy").value.trim(),
    personality: Array.from(document.querySelectorAll(".pet-personality-check:checked")).map((c) => c.value),
    gender: document.getElementById("pet-gender").value,
  };
  const preview = document.getElementById("pet-description-preview");
  const box = document.getElementById("pet-description-preview-box");
  const description = buildPetDescription(draftPet);
  preview.textContent = description || "Marque as características acima para gerar a descrição automaticamente.";
  box.classList.toggle("description-preview--filled", Boolean(description));
}

function closePetModal() {
  document.getElementById("pet-modal").classList.remove("open");
}

function handlePhotoInputChange(event) {
  const file = event.target.files && event.target.files[0];
  SELECTED_PET_PHOTO_FILE = file || null;
  const preview = document.getElementById("pet-photo-preview");
  if (file) {
    preview.src = URL.createObjectURL(file);
    preview.classList.remove("hidden");
  }
}

async function handlePetFormSubmit(event) {
  event.preventDefault();
  const errorBox = document.getElementById("pet-form-error");
  errorBox.classList.remove("visible");

  const petId = document.getElementById("pet-id").value;
  const payload = {
    name: document.getElementById("pet-name").value.trim(),
    species: document.getElementById("pet-species").value,
    size: document.getElementById("pet-size").value,
    gender: document.getElementById("pet-gender").value || null,
    age_label: document.getElementById("pet-age").value.trim(),
    status: document.getElementById("pet-status").value,
    vaccinated: document.getElementById("pet-vaccinated").checked,
    dewormed: document.getElementById("pet-dewormed").checked,
    neutered: document.getElementById("pet-neutered").checked,
    adoption_form_url: document.getElementById("pet-adoption-form-url").value.trim() || null,
    lives_with_dogs: document.getElementById("pet-lives-with-dogs").checked,
    lives_with_cats: document.getElementById("pet-lives-with-cats").checked,
    lives_with_kids: document.getElementById("pet-lives-with-kids").checked,
    apartment_friendly: document.getElementById("pet-apartment-friendly").checked,
    favorite_toy: document.getElementById("pet-favorite-toy").value.trim() || null,
    personality: Array.from(document.querySelectorAll(".pet-personality-check:checked")).map((c) => c.value),
  };

  if (!payload.name) {
    errorBox.textContent = "Dê um nome para o pet.";
    errorBox.classList.add("visible");
    return;
  }

  const btn = document.getElementById("pet-submit-btn");
  btn.disabled = true;
  btn.innerHTML = `<span class="paw-spinner">🐾</span> Salvando...`;

  try {
    if (window.DEMO_MODE) {
      if (SELECTED_PET_PHOTO_FILE) {
        payload.photo_url = URL.createObjectURL(SELECTED_PET_PHOTO_FILE);
      }
      if (petId) {
        const pet = MY_PETS.find((p) => p.id === petId);
        Object.assign(pet, payload);
      } else {
        MY_PETS.unshift(
          Object.assign(
            {
              id: "demo-" + Math.random().toString(36).slice(2, 9),
              org_id: CURRENT_ORG_ID,
              created_at: new Date().toISOString(),
              photo_url: "",
            },
            payload
          )
        );
      }
    } else {
      if (SELECTED_PET_PHOTO_FILE) {
        payload.photo_url = await uploadPetPhoto(SELECTED_PET_PHOTO_FILE);
      }
      if (petId) {
        const { error } = await window.sb.from("pets").update(payload).eq("id", petId);
        if (error) throw error;
      } else {
        payload.org_id = CURRENT_ORG_ID;
        const { error } = await window.sb.from("pets").insert([payload]);
        if (error) throw error;
      }
      await loadMyPets();
    }

    closePetModal();
    renderAdminBoard();
  } catch (err) {
    console.error("[Patinhas] Erro ao salvar pet:", err);
    errorBox.textContent = "Não foi possível salvar agora. Tente novamente.";
    errorBox.classList.add("visible");
  } finally {
    btn.disabled = false;
    btn.textContent = "Salvar";
  }
}

async function uploadPetPhoto(file) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const uid = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());
  const path = `${CURRENT_ORG_ID}/${uid}.${ext}`;
  const { error: uploadError } = await window.sb.storage.from("pet-photos").upload(path, file, {
    upsert: false,
    cacheControl: "3600",
  });
  if (uploadError) throw uploadError;
  const { data } = window.sb.storage.from("pet-photos").getPublicUrl(path);
  return data.publicUrl;
}

/* ======================================================================
   Modal: meu perfil
   ====================================================================== */

function openProfileModal() {
  document.getElementById("profile-form-error").classList.remove("visible");
  document.getElementById("profile-form-success").classList.remove("visible");
  document.getElementById("profile-org-name").value = CURRENT_ORG_PROFILE.org_name || "";
  document.getElementById("profile-contact-email").value = CURRENT_ORG_PROFILE.contact_email || "";
  document.getElementById("profile-whatsapp").value = CURRENT_ORG_PROFILE.contact_whatsapp || "";
  document.getElementById("profile-state").value = CURRENT_ORG_PROFILE.state || "";
  populateCitySelect(document.getElementById("profile-city"), CURRENT_ORG_PROFILE.state, CURRENT_ORG_PROFILE.city);
  document.getElementById("profile-instagram").value = CURRENT_ORG_PROFILE.instagram || "";
  document.getElementById("profile-website").value = CURRENT_ORG_PROFILE.website || "";
  document.getElementById("profile-description").value = CURRENT_ORG_PROFILE.description || "";
  SELECTED_LOGO_FILE = null;
  const preview = document.getElementById("profile-logo-preview");
  document.getElementById("profile-logo").value = "";
  if (CURRENT_ORG_PROFILE.logo_url) {
    preview.src = CURRENT_ORG_PROFILE.logo_url;
    preview.classList.remove("hidden");
  } else {
    preview.classList.add("hidden");
  }
  document.getElementById("profile-modal").classList.add("open");
}

function closeProfileModal() {
  document.getElementById("profile-modal").classList.remove("open");
}

const LOGO_MAX_SIZE_MB = 5;

function handleLogoInputChange(event) {
  const file = event.target.files && event.target.files[0];
  const errorBox = document.getElementById("profile-form-error");
  errorBox.classList.remove("visible");

  if (file && !file.type.startsWith("image/")) {
    errorBox.textContent = "Esse arquivo não é uma imagem. Envie um JPG, PNG ou WEBP.";
    errorBox.classList.add("visible");
    event.target.value = "";
    SELECTED_LOGO_FILE = null;
    return;
  }
  if (file && file.size > LOGO_MAX_SIZE_MB * 1024 * 1024) {
    errorBox.textContent = `Essa imagem tem mais de ${LOGO_MAX_SIZE_MB}MB. Tente uma versão menor ou mais comprimida.`;
    errorBox.classList.add("visible");
    event.target.value = "";
    SELECTED_LOGO_FILE = null;
    return;
  }

  SELECTED_LOGO_FILE = file || null;
  const preview = document.getElementById("profile-logo-preview");
  if (file) {
    preview.src = URL.createObjectURL(file);
    preview.classList.remove("hidden");
  }
}

async function uploadOrgLogo(file) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `logos/${CURRENT_ORG_ID}.${ext}`;
  const { error: uploadError } = await window.sb.storage.from("pet-photos").upload(path, file, {
    upsert: true,
    cacheControl: "3600",
  });
  if (uploadError) throw uploadError;
  const { data } = window.sb.storage.from("pet-photos").getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`; // cache-bust: mesmo path pode ser sobrescrito
}

async function handleProfileFormSubmit(event) {
  event.preventDefault();
  const errorBox = document.getElementById("profile-form-error");
  const successBox = document.getElementById("profile-form-success");
  errorBox.classList.remove("visible");
  successBox.classList.remove("visible");

  const payload = {
    org_name: document.getElementById("profile-org-name").value.trim(),
    contact_email: document.getElementById("profile-contact-email").value.trim(),
    contact_whatsapp: document.getElementById("profile-whatsapp").value.trim(),
    city: document.getElementById("profile-city").value.trim(),
    state: document.getElementById("profile-state").value.trim().toUpperCase(),
    instagram: document.getElementById("profile-instagram").value.trim(),
    website: document.getElementById("profile-website").value.trim(),
    description: document.getElementById("profile-description").value.trim(),
  };

  if (!payload.city || !payload.state) {
    errorBox.textContent = "Cidade e estado são obrigatórios.";
    errorBox.classList.add("visible");
    return;
  }

  const submitBtn = document.getElementById("profile-submit-btn");
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="paw-spinner">🐾</span> Salvando...`;

  try {
    if (window.DEMO_MODE) {
      if (SELECTED_LOGO_FILE) payload.logo_url = URL.createObjectURL(SELECTED_LOGO_FILE);
    } else if (SELECTED_LOGO_FILE) {
      try {
        payload.logo_url = await uploadOrgLogo(SELECTED_LOGO_FILE);
      } catch (uploadErr) {
        console.error("[Patinhas] Erro ao enviar logo:", uploadErr);
        errorBox.textContent = `Não foi possível enviar a imagem (${
          uploadErr?.message || "erro desconhecido"
        }). O resto do perfil ainda não foi salvo — tente de novo ou salve sem trocar a logo.`;
        errorBox.classList.add("visible");
        return;
      }
    }

    if (!window.DEMO_MODE) {
      const { error } = await window.sb.from("profiles").update(payload).eq("id", CURRENT_ORG_ID);
      if (error) throw error;
    }
    Object.assign(CURRENT_ORG_PROFILE, payload);
    document.getElementById("org-name-label").textContent = CURRENT_ORG_PROFILE.org_name;
    successBox.textContent = "Perfil atualizado!";
    successBox.classList.add("visible");
  } catch (err) {
    console.error("[Patinhas] Erro ao salvar perfil:", err);
    errorBox.textContent = `Não foi possível salvar agora${err?.message ? ` (${err.message})` : ""}. Tente novamente.`;
    errorBox.classList.add("visible");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Salvar";
  }
}
