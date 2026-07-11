/** Lógica da Central de Interessados (admin-interessados.html). */

let MY_PETS_LOOKUP = []; // [{id, name}] — só para o filtro e exibir o nome do pet
let ALL_INTERESTS = []; // normalizado: {id, pet_id, pet_name, name, email, phone, status, created_at}
let CURRENT_STATUS_TAB = ""; // "" = Todos (que já exclui arquivados — ver renderInterestList)

function renderStatusTabs() {
  const tabsHtml = [{ value: "", label: "Todos" }, ...INTEREST_STATUSES]
    .map(
      (s) =>
        `<button type="button" class="status-tab${s.value === "" ? " active" : ""}" data-status="${s.value}">${s.label}</button>`
    )
    .join("");
  const container = document.getElementById("status-tabs");
  container.innerHTML = tabsHtml;
  container.querySelectorAll(".status-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      CURRENT_STATUS_TAB = tab.dataset.status;
      container.querySelectorAll(".status-tab").forEach((t) => t.classList.toggle("active", t === tab));
      renderInterestList();
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const session = await requireOngSession();
  if (!session) return; // requireOngSession já redirecionou para admin.html

  renderStatusTabs();
  document.getElementById("filter-pet").addEventListener("change", renderInterestList);
  document.getElementById("filter-date").addEventListener("change", renderInterestList);

  await loadInterestsData(session.orgId);
  applyPetFilterFromQueryString();
  renderInterestList();
});

/** Pré-seleciona o filtro de pet quando a página é aberta via
 * admin-interessados.html?pet=<id> (clique no contador do card). */
function applyPetFilterFromQueryString() {
  const petId = new URLSearchParams(window.location.search).get("pet");
  if (!petId) return;
  const select = document.getElementById("filter-pet");
  if (select.querySelector(`option[value="${petId}"]`)) {
    select.value = petId;
  }
}

async function loadInterestsData(orgId) {
  if (window.DEMO_MODE) {
    MY_PETS_LOOKUP = window.DEMO_PETS.map((p) => ({ id: p.id, name: p.name }));
    const petNameById = Object.fromEntries(MY_PETS_LOOKUP.map((p) => [p.id, p.name]));
    ALL_INTERESTS = Object.values(window.DEMO_INTERESTS || {})
      .flat()
      .map((i) => ({ ...i, pet_name: petNameById[i.pet_id] || "", status: i.status || "novo" }));
  } else {
    const { data: pets } = await window.sb
      .from("pets")
      .select("id, name")
      .eq("org_id", orgId)
      .order("name");
    MY_PETS_LOOKUP = pets || [];

    // RLS já restringe o resultado aos interesses de pets desta ONG —
    // não precisa filtrar por pet_id explicitamente aqui.
    const { data, error } = await window.sb
      .from("interests")
      .select("*, pet:pets(id, name)")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[Patinhas] Erro ao carregar interessados:", error);
      ALL_INTERESTS = [];
    } else {
      ALL_INTERESTS = (data || []).map((i) => ({
        ...i,
        pet_name: i.pet ? i.pet.name : "",
      }));
    }
  }

  const petSelect = document.getElementById("filter-pet");
  MY_PETS_LOOKUP.forEach((pet) => {
    const opt = document.createElement("option");
    opt.value = pet.id;
    opt.textContent = pet.name;
    petSelect.appendChild(opt);
  });

  document.getElementById("interessados-loading").classList.add("hidden");
}

function clearInterestFilters() {
  document.getElementById("filter-pet").value = "";
  document.getElementById("filter-date").value = "";
  CURRENT_STATUS_TAB = "";
  document.querySelectorAll(".status-tab").forEach((t) => t.classList.toggle("active", t.dataset.status === ""));
  renderInterestList();
}

function renderInterestList() {
  const petFilter = document.getElementById("filter-pet").value;
  const dateFilter = document.getElementById("filter-date").value; // yyyy-mm-dd

  let items = ALL_INTERESTS.slice();
  if (petFilter) items = items.filter((i) => i.pet_id === petFilter);
  // A aba "Todos" esconde os arquivados por padrão — quem quiser vê-los
  // clica na aba "Arquivado" especificamente.
  items = CURRENT_STATUS_TAB
    ? items.filter((i) => i.status === CURRENT_STATUS_TAB)
    : items.filter((i) => i.status !== "arquivado");
  if (dateFilter) {
    const from = new Date(dateFilter + "T00:00:00");
    items = items.filter((i) => new Date(i.created_at) >= from);
  }

  const empty = document.getElementById("interessados-empty");
  const list = document.getElementById("interessados-list");

  if (items.length === 0) {
    document.getElementById("interessados-empty-text").textContent =
      ALL_INTERESTS.length === 0
        ? "Você ainda não recebeu nenhum interesse."
        : "Nenhum interessado encontrado com esses filtros.";
    empty.classList.remove("hidden");
    list.innerHTML = "";
    return;
  }

  empty.classList.add("hidden");
  list.innerHTML = items.map((i) => interestRowHtml(i)).join("");
}

async function updateInterestStatus(interestId, newStatus) {
  const item = ALL_INTERESTS.find((i) => i.id === interestId);
  if (!item) return;
  const previous = item.status;
  item.status = newStatus; // otimista

  if (!window.DEMO_MODE) {
    const { error } = await window.sb.from("interests").update({ status: newStatus }).eq("id", interestId);
    if (error) {
      console.error("[Patinhas] Erro ao atualizar status:", error);
      item.status = previous;
      renderInterestList();
      return;
    }
  }
  renderInterestList();
}

async function handleLogoutInteressados() {
  if (!window.DEMO_MODE) {
    await window.sb.auth.signOut();
  }
  window.location.href = "admin.html";
}
