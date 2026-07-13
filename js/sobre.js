/** Lógica da página institucional "Sobre Nós" (sobre.html). */

async function loadImpactStats() {
  let stats = { total_orgs: 0, total_pets: 0, total_adopted: 0, total_interests: 0 };

  if (window.DEMO_MODE) {
    stats = {
      total_orgs: new Set(window.DEMO_PETS.map((p) => p.org_id)).size,
      total_pets: window.DEMO_PETS.length,
      total_adopted: window.DEMO_PETS.filter((p) => p.status === "adotado").length,
      total_interests: Object.values(window.DEMO_INTERESTS || {}).flat().length,
    };
  } else {
    const { data, error } = await window.sb.rpc("get_public_stats");
    if (error) {
      console.error("[Patinhas] Erro ao carregar estatísticas de impacto:", error);
    } else if (data && data[0]) {
      stats = data[0];
    }
  }

  setCountTarget("impact-orgs", stats.total_orgs);
  setCountTarget("impact-pets", stats.total_pets);
  setCountTarget("impact-adopted", stats.total_adopted);
  setCountTarget("impact-interests", stats.total_interests);
}

function setCountTarget(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.dataset.count = String(value || 0);
}

/** Anima um número de 0 até o valor-alvo quando o card entra na tela. */
function animateCountUp(el) {
  const target = Number(el.dataset.count || 0);
  if (!target) {
    el.textContent = "0";
    return;
  }
  const duration = 900;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out
    el.textContent = Math.round(target * eased);
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function setupScrollReveal() {
  const revealEls = document.querySelectorAll(".reveal");
  const countEls = document.querySelectorAll(".stat-card-value[data-count]");

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealEls.forEach((el) => revealObserver.observe(el));

  const countObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCountUp(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );
  countEls.forEach((el) => countObserver.observe(el));
}


document.addEventListener("DOMContentLoaded", async () => {
  setupScrollReveal();
  setupBackToTop();
  // CTA final com as bolhas: componente compartilhado com o Observatório
  // (js/bolhas-cta.js + css/bolhas-cta.css). Fonte única para os dois.
  if (window.PetBolhasCTA) PetBolhasCTA.mount(document.querySelector("[data-petbolhas]"));
  if (typeof pawMarauder === "function") pawMarauder();
  await loadImpactStats();
  // Os cards de impacto já podem estar visíveis (hero curto) — garante que
  // a contagem apareça mesmo se o IntersectionObserver já tiver disparado
  // antes dos números reais chegarem.
  document.querySelectorAll(".stat-card-value[data-count]").forEach((el) => {
    if (el.textContent === "0" && el.dataset.count !== "0") animateCountUp(el);
  });
});
