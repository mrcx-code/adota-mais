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

/**
 * Transforma a tira de fotos do hero em balões flutuantes e interativos —
 * mesma ideia das bolhas do Observatório: caem com gravidade leve, assentam no
 * fundo e sobem ("enchem de ar") quando o ponteiro passa perto.
 */
function setupHeroBolhas() {
  const host = document.querySelector(".about-hero-photos");
  if (!host) return;
  const imgs = [...host.querySelectorAll("img")];
  if (!imgs.length) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Embrulha cada foto num balão circular clicável (leva ao mural de pets).
  const bolhas = imgs.map((img) => {
    const a = document.createElement("a");
    a.className = "about-bolha";
    a.href = "index.html";
    a.setAttribute("aria-label", "Ver pets para adoção");
    img.removeAttribute("aria-hidden");
    a.appendChild(img);
    host.appendChild(a);
    return a;
  });
  host.classList.add("about-bolhas");

  let W = host.clientWidth, H = host.clientHeight || 260;
  const state = bolhas.map((el, i) => {
    const r = 42 + Math.round(Math.random() * 16);
    el.style.width = el.style.height = 2 * r + "px";
    return {
      el, r,
      x: Math.random() * Math.max(1, W - 2 * r),
      y: -r - Math.random() * 160 - i * 30,
      vx: (Math.random() - 0.5) * 0.6,
      vy: 0,
    };
  });
  const place = (b) => { b.el.style.transform = `translate(${b.x}px, ${b.y}px)`; };
  state.forEach(place);

  if (reduced) {
    let cx = 4;
    state.forEach((b) => { b.x = Math.min(cx, Math.max(0, W - 2 * b.r)); b.y = H - 2 * b.r; cx += 2 * b.r + 8; place(b); });
    return;
  }

  const G = 0.11, AIR = 0.975, FLOOR = 0.12, WALL = 0.4;
  let mouse = null;
  host.addEventListener("pointermove", (e) => { const r = host.getBoundingClientRect(); mouse = { x: e.clientX - r.left, y: e.clientY - r.top }; });
  host.addEventListener("pointerleave", () => { mouse = null; });
  const ro = new ResizeObserver(() => { W = host.clientWidth; H = host.clientHeight || H; });
  ro.observe(host);

  let raf = 0, running = false;
  const step = () => {
    if (!running) return;
    state.forEach((b) => {
      b.vy += G; b.vx *= AIR;
      if (mouse) {
        const cx = b.x + b.r, cy = b.y + b.r, dx = cx - mouse.x, dy = cy - mouse.y;
        const reach = b.r + 60, d = Math.hypot(dx, dy);
        if (d < reach) {
          const f = (reach - Math.max(d, 0.001)) / reach;
          if (d > 0.5) { b.vx += (dx / d) * f * 0.35; b.vy += (dy / d) * f * 0.2; }
          b.vy -= f * 0.9;
        }
      }
    });
    for (let i = 0; i < state.length; i++) {
      for (let j = i + 1; j < state.length; j++) {
        const a = state[i], b = state[j];
        const dx = (b.x + b.r) - (a.x + a.r), dy = (b.y + b.r) - (a.y + a.r);
        const d = Math.hypot(dx, dy), min = a.r + b.r;
        if (d < min && d > 0.01) {
          const nx = dx / d, ny = dy / d, ov = (min - d) / 2;
          a.x -= nx * ov; a.y -= ny * ov; b.x += nx * ov; b.y += ny * ov;
          const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rel < 0) { const imp = rel * 0.5; a.vx += nx * imp; a.vy += ny * imp; b.vx -= nx * imp; b.vy -= ny * imp; }
        }
      }
    }
    state.forEach((b) => {
      const sp = Math.hypot(b.vx, b.vy), max = 2.4;
      if (sp > max) { b.vx = b.vx / sp * max; b.vy = b.vy / sp * max; }
      b.x += b.vx; b.y += b.vy;
      if (b.x < 0) { b.x = 0; b.vx = -b.vx * WALL; }
      if (b.x > W - 2 * b.r) { b.x = W - 2 * b.r; b.vx = -b.vx * WALL; }
      if (b.y < 0) { b.y = 0; b.vy = -b.vy * WALL; }
      if (b.y > H - 2 * b.r) { b.y = H - 2 * b.r; b.vy = -b.vy * FLOOR; b.vx *= 0.9; if (Math.abs(b.vy) < 0.4) b.vy = 0; }
      place(b);
    });
    raf = requestAnimationFrame(step);
  };

  const vis = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !raf) { running = true; raf = requestAnimationFrame(step); }
      else if (!entry.isIntersecting) { running = false; cancelAnimationFrame(raf); raf = 0; }
    });
  }, { threshold: 0.05 });
  vis.observe(host);
}

document.addEventListener("DOMContentLoaded", async () => {
  setupScrollReveal();
  setupBackToTop();
  setupHeroBolhas();
  await loadImpactStats();
  // Os cards de impacto já podem estar visíveis (hero curto) — garante que
  // a contagem apareça mesmo se o IntersectionObserver já tiver disparado
  // antes dos números reais chegarem.
  document.querySelectorAll(".stat-card-value[data-count]").forEach((el) => {
    if (el.textContent === "0" && el.dataset.count !== "0") animateCountUp(el);
  });
});
