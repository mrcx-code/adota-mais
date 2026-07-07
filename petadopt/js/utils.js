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
