/** Lógica da área de admin (admin.html) — login, cadastro e gestão dos pets. */

let CURRENT_ORG_ID = null;
let CURRENT_ORG_PROFILE = null;
let MY_PETS = [];
let SELECTED_PET_PHOTO_FILE = null;
let INTERESTS_MODAL_PET_ID = null;

/* ======================================================================
   Inicialização / autenticação
   ====================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("login-form").addEventListener("submit", handleLogin);
  document.getElementById("signup-form").addEventListener("submit", handleSignup);
  document.getElementById("pet-form").addEventListener("submit", handlePetFormSubmit);
  document.getElementById("profile-form").addEventListener("submit", handleProfileFormSubmit);
  document.getElementById("pet-photo").addEventListener("change", handlePhotoInputChange);

  if (window.DEMO_MODE) {
    CURRENT_ORG_ID = window.DEMO_ORG.id;
    CURRENT_ORG_PROFILE = Object.assign({}, window.DEMO_ORG);
    MY_PETS = window.DEMO_PETS.slice();
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
  document.getElementById("profile-btn").classList.add("hidden");
  document.getElementById("logout-btn").classList.add("hidden");
  document.getElementById("org-name-label").classList.add("hidden");
}

function showDashboard() {
  document.getElementById("auth-view").classList.add("hidden");
  document.getElementById("dashboard-view").classList.remove("hidden");
  document.getElementById("profile-btn").classList.remove("hidden");
  document.getElementById("logout-btn").classList.remove("hidden");
  const label = document.getElementById("org-name-label");
  label.textContent = CURRENT_ORG_PROFILE ? CURRENT_ORG_PROFILE.org_name : "";
  label.classList.remove("hidden");
  renderAdminBoard();
}

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
  btn.innerHTML = `<span class="spinner"></span> Entrando...`;

  try {
    const { data, error } = await window.sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await enterDashboardWithSession(data.session);
  } catch (err) {
    console.error("[Adota+] Erro no login:", err);
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
  const errorBox = document.getElementById("signup-error");
  const successBox = document.getElementById("signup-success");
  errorBox.classList.remove("visible");
  successBox.classList.remove("visible");

  const btn = document.getElementById("signup-submit-btn");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Criando conta...`;

  try {
    const { data, error } = await window.sb.auth.signUp({
      email,
      password,
      options: {
        data: {
          org_name: orgName,
          contact_email: email,
          contact_whatsapp: whatsapp || null,
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
    console.error("[Adota+] Erro no cadastro:", err);
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
    console.error("[Adota+] Erro ao carregar perfil:", error);
  }
  CURRENT_ORG_PROFILE = profile || { id: CURRENT_ORG_ID, org_name: session.user.email };
  await loadMyPets();
  showDashboard();
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
    console.error("[Adota+] Erro ao carregar pets:", error);
    MY_PETS = [];
    return;
  }
  MY_PETS = data || [];
}

function renderAdminBoard() {
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

  const groups = groupByStatus(MY_PETS);
  STATUS_ORDER.forEach((status) => {
    const list = document.getElementById(`admin-column-${status}-cards`);
    const count = document.getElementById(`admin-column-${status}-count`);
    const pets = groups[status] || [];
    count.textContent = pets.length;
    list.innerHTML = pets.length
      ? pets.map((pet) => adminPetCardHtml(pet)).join("")
      : `<div class="kanban-empty">Nenhum pet aqui.</div>`;
  });

  setupDragAndDrop();
}

function adminPetCardHtml(pet) {
  const photoStyle = pet.photo_url
    ? `style="background-image:url('${escapeHtml(pet.photo_url)}');background-size:cover;background-position:center;"`
    : "";
  const interestCount = countInterestsFor(pet.id);
  const metaParts = [speciesLabel(pet.species), pet.size, pet.age_label].filter(Boolean);
  const moveButtons = STATUS_ORDER.map((status) => {
    const isCurrent = status === pet.status;
    return `<button class="btn btn-sm ${isCurrent ? "btn-primary" : "btn-secondary"}"
      ${isCurrent ? "disabled" : ""}
      onclick="changeStatus('${pet.id}', '${status}')">${shortStatusLabel(status)}</button>`;
  }).join("");

  return `
    <article class="pet-card" draggable="true" data-pet-id="${pet.id}">
      <div class="pet-card-photo" ${photoStyle}></div>
      <div class="pet-card-body">
        <div class="pet-card-top">
          <h3 class="pet-card-name">${escapeHtml(pet.name)}</h3>
        </div>
        <p class="pet-card-meta">${metaParts.map(escapeHtml).join(" · ")}</p>
        ${pet.description ? `<p class="pet-card-desc">${escapeHtml(pet.description)}</p>` : ""}
        <div class="pet-card-actions">
          <button class="btn btn-secondary btn-sm" onclick="openPetModal('${pet.id}')">Editar</button>
          <button class="btn btn-secondary btn-sm" onclick="openInterestsModal('${pet.id}')">💬 ${interestCount}</button>
          <button class="btn btn-danger btn-sm" onclick="confirmDeletePet(this, '${pet.id}')">Excluir</button>
        </div>
        <div class="pet-card-move">${moveButtons}</div>
      </div>
    </article>
  `;
}

function countInterestsFor(petId) {
  if (window.DEMO_MODE) {
    return (window.DEMO_INTERESTS[petId] || []).length;
  }
  return typeof PET_INTEREST_COUNTS !== "undefined" && PET_INTEREST_COUNTS[petId]
    ? PET_INTEREST_COUNTS[petId]
    : 0;
}

/* ======================================================================
   Excluir pet (confirmação inline, sem usar window.confirm)
   ====================================================================== */

function confirmDeletePet(button, petId) {
  if (button.dataset.confirming === "true") return;
  button.dataset.confirming = "true";
  const original = button.textContent;
  button.innerHTML = "Confirmar?";
  const wrapper = document.createElement("span");
  wrapper.style.display = "inline-flex";
  wrapper.style.gap = "6px";

  const yesBtn = document.createElement("button");
  yesBtn.className = "btn btn-danger btn-sm";
  yesBtn.textContent = "Sim, excluir";
  yesBtn.onclick = () => deletePet(petId);

  const noBtn = document.createElement("button");
  noBtn.className = "btn btn-secondary btn-sm";
  noBtn.textContent = "Cancelar";
  noBtn.onclick = () => renderAdminBoard();

  button.replaceWith(wrapper);
  wrapper.appendChild(yesBtn);
  wrapper.appendChild(noBtn);
}

async function deletePet(petId) {
  if (window.DEMO_MODE) {
    MY_PETS = MY_PETS.filter((p) => p.id !== petId);
    renderAdminBoard();
    return;
  }
  const { error } = await window.sb.from("pets").delete().eq("id", petId);
  if (error) {
    console.error("[Adota+] Erro ao excluir pet:", error);
    alertInline("Não foi possível excluir agora. Tente novamente.");
    return;
  }
  await loadMyPets();
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
    if (pet) pet.status = newStatus;
    renderAdminBoard();
    return;
  }
  const { error } = await window.sb
    .from("pets")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", petId);
  if (error) {
    console.error("[Adota+] Erro ao mover pet:", error);
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
  document.getElementById("pet-age").value = pet ? pet.age_label || "" : "";
  document.getElementById("pet-description").value = pet ? pet.description || "" : "";
  document.getElementById("pet-status").value = pet ? pet.status : "disponivel";

  if (pet && pet.photo_url) {
    const preview = document.getElementById("pet-photo-preview");
    preview.src = pet.photo_url;
    preview.classList.remove("hidden");
  }

  document.getElementById("pet-modal").classList.add("open");
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
    age_label: document.getElementById("pet-age").value.trim(),
    description: document.getElementById("pet-description").value.trim(),
    status: document.getElementById("pet-status").value,
  };

  if (!payload.name) {
    errorBox.textContent = "Dê um nome para o pet.";
    errorBox.classList.add("visible");
    return;
  }

  const btn = document.getElementById("pet-submit-btn");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Salvando...`;

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
    console.error("[Adota+] Erro ao salvar pet:", err);
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
   Modal: interesses recebidos
   ====================================================================== */

let PET_INTEREST_COUNTS = {};

async function openInterestsModal(petId) {
  INTERESTS_MODAL_PET_ID = petId;
  const pet = MY_PETS.find((p) => p.id === petId);
  document.getElementById("interests-pet-name").textContent = pet ? pet.name : "";
  const list = document.getElementById("interests-list");
  list.innerHTML = `<p class="hint">Carregando...</p>`;
  document.getElementById("interests-modal").classList.add("open");

  let interests = [];
  if (window.DEMO_MODE) {
    interests = window.DEMO_INTERESTS[petId] || [];
  } else {
    const { data, error } = await window.sb
      .from("interests")
      .select("*")
      .eq("pet_id", petId)
      .order("created_at", { ascending: false });
    if (!error) interests = data || [];
  }

  PET_INTEREST_COUNTS[petId] = interests.length;

  if (interests.length === 0) {
    list.innerHTML = `<p class="hint">Ainda não há interessados neste pet.</p>`;
    return;
  }

  list.innerHTML = interests
    .map(
      (i) => `
      <div style="padding:12px 0; border-bottom:1px solid var(--color-border);">
        <strong>${escapeHtml(i.name)}</strong>
        <span class="hint" style="display:block;">
          ${i.phone ? `📞 ${escapeHtml(i.phone)} &nbsp;` : ""}
          ${i.email ? `✉️ ${escapeHtml(i.email)}` : ""}
        </span>
        ${i.message ? `<p style="margin:6px 0 0; font-size:13.5px;">${escapeHtml(i.message)}</p>` : ""}
        <span class="hint" style="display:block; margin-top:4px;">${formatDate(i.created_at)}</span>
      </div>
    `
    )
    .join("");
}

function closeInterestsModal() {
  document.getElementById("interests-modal").classList.remove("open");
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
  document.getElementById("profile-modal").classList.add("open");
}

function closeProfileModal() {
  document.getElementById("profile-modal").classList.remove("open");
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
  };

  try {
    if (window.DEMO_MODE) {
      Object.assign(CURRENT_ORG_PROFILE, payload);
    } else {
      const { error } = await window.sb.from("profiles").update(payload).eq("id", CURRENT_ORG_ID);
      if (error) throw error;
      Object.assign(CURRENT_ORG_PROFILE, payload);
    }
    document.getElementById("org-name-label").textContent = CURRENT_ORG_PROFILE.org_name;
    successBox.textContent = "Perfil atualizado!";
    successBox.classList.add("visible");
  } catch (err) {
    console.error("[Adota+] Erro ao salvar perfil:", err);
    errorBox.textContent = "Não foi possível salvar agora.";
    errorBox.classList.add("visible");
  }
}
