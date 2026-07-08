/** Funções auxiliares compartilhadas entre index.html e admin.html */

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

/**
 * Liga o carrossel do Kanban no mobile: clicar numa bolinha rola até a
 * coluna correspondente, e rolar o board atualiza qual bolinha está ativa.
 * Chame de novo sempre que os pets forem (re)renderizados.
 */
function setupKanbanCarousel(boardEl, dotsEl) {
  if (!boardEl || !dotsEl) return;
  const columns = Array.from(boardEl.querySelectorAll(".kanban-column"));
  const dots = Array.from(dotsEl.querySelectorAll(".kanban-dot"));
  if (!columns.length || !dots.length) return;

  dots.forEach((dot) => {
    if (dot.dataset.kanbanDotBound) return;
    dot.dataset.kanbanDotBound = "1";
    dot.addEventListener("click", () => {
      const target = columns.find((col) => col.dataset.status === dot.dataset.status);
      if (target) target.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    });
  });

  if (boardEl.dataset.kanbanScrollBound) return;
  boardEl.dataset.kanbanScrollBound = "1";

  let ticking = false;
  boardEl.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const boardRect = boardEl.getBoundingClientRect();
      const boardCenter = boardRect.left + boardRect.width / 2;
      let closest = null;
      let closestDist = Infinity;
      columns.forEach((col) => {
        const rect = col.getBoundingClientRect();
        const dist = Math.abs(rect.left + rect.width / 2 - boardCenter);
        if (dist < closestDist) {
          closestDist = dist;
          closest = col;
        }
      });
      if (closest) {
        dots.forEach((dot) => dot.classList.toggle("active", dot.dataset.status === closest.dataset.status));
      }
      ticking = false;
    });
  });
}
