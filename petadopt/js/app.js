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
        .select("*, org:profiles(id, org_name, contact_whatsapp, contact_email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      ALL_PETS = data || [];
      ORG_BY_ID = {};
      ALL_PETS.forEach((pet) => {
        if (pet.org) ORG_BY_ID[pet.org.id] = pet.org;
      });
    }
    renderBoard();
    loading.classList.add("hidden");
    board.classList.remove("hidden");
  } catch (err) {
    console.error("[Patinhas] Erro ao carregar pets:", err);
    loading.classList.add("hidden");
    errorBox.classList.remove("hidden");
  }
}

function renderBoard() {
  const groups = groupByStatus(ALL_PETS);

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
      ? `<button class="btn btn-primary btn-sm" onclick="openInterestModal('${pet.id}')">Tenho interesse 🐾</button>`
      : "";
  const metaParts = [speciesLabel(pet.species), pet.size, pet.age_label].filter(Boolean);

  return `
    <article class="pet-card">
      <div class="pet-card-photo" ${photoStyle}></div>
      <div class="pet-card-body">
        <div class="pet-card-top">
          <h3 class="pet-card-name">${escapeHtml(pet.name)}</h3>
        </div>
        <p class="pet-card-meta">${metaParts.map(escapeHtml).join(" · ")}</p>
        ${pet.description ? `<p class="pet-card-desc">${escapeHtml(pet.description)}</p>` : ""}
        ${org ? `<p class="pet-card-org">📍 ${escapeHtml(org.org_name)}</p>` : ""}
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
  document.getElementById("interest-modal").classList.add("open");
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

document.addEventListener("DOMContentLoaded", () => {
  loadPets();
  document.getElementById("interest-form").addEventListener("submit", submitInterest);
});
