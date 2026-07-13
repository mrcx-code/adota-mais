/* =========================================================
   Componente compartilhado: CTA final com "bolhas" dos pets
   =========================================================
   Comportamento IGUAL na home/Sobre e no Observatório. As bolhas
   trazem as fotos reais dos pets (Supabase) e boiam como balões;
   ao deixar o cursor um instante perto de uma, ela é "capturada"
   (para no ponteiro, fácil de clicar). Só o TEXTO muda por página.

   ⚠️ Fonte única: qualquer mudança de comportamento deve ser feita
   AQUI — reflete nos dois lugares. O visual fica em css/bolhas-cta.css.

   Uso: <div class="petcta-bolhas" data-petbolhas data-pet-href="index.html"></div>
   e chamar PetBolhasCTA.mount(document.querySelector("[data-petbolhas]")).
   ========================================================= */

(function () {
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function esc(s) {
    if (s === null || s === undefined) return "";
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  function safeUrl(url) {
    const s = String(url == null ? "" : url).trim();
    return /^https?:\/\//i.test(s) ? s : "";
  }
  function especieEmoji(sp) { return sp === "gato" ? "🐱" : sp === "cachorro" ? "🐶" : "🐾"; }

  async function fetchPets() {
    if (!window.sb || window.DEMO_MODE) return null;
    const { data, error } = await window.sb
      .from("pets")
      .select("id,name,species,status,photo_url");
    if (error) return null;
    return data || [];
  }

  function render(host, pets) {
    const base = host.dataset.petHref || "index.html";
    const comFoto = (pets || []).filter((p) => safeUrl(p.photo_url));
    const fontes = comFoto.map((p) => ({ foto: safeUrl(p.photo_url), id: p.id }));
    // Poucos pets no começo → completa com emojis (mínimo 12 bolhas).
    const emojis = ["🐶", "🐕", "🦴", "🐾", "🐩", "🐕", "🦮", "🐶"];
    let i = 0;
    while (fontes.length < 12) fontes.push({ emoji: emojis[i++ % emojis.length] });
    const usadas = fontes.slice(0, 15);

    host.innerHTML = usadas.map((s) => {
      const r = 26 + Math.round(Math.random() * 20);
      const inner = s.foto
        ? `<img src="${esc(s.foto)}" alt="" loading="lazy" decoding="async" />`
        : `<span class="petbolha-emoji">${s.emoji}</span>`;
      const href = s.id ? `${base}#pet-${esc(s.id)}` : base;
      return `<a class="petbolha" href="${href}" tabindex="-1" style="--r:${r}px" data-r="${r}">${inner}</a>`;
    }).join("");

    fisica(host);
  }

  /**
   * Física de "balões": caem com gravidade leve, assentam no fundo e colidem.
   * Usabilidade: ao deixar o cursor um instante perto de uma bolha, ela é
   * capturada (para no ponteiro, destaca e fica fácil de clicar); as demais
   * levam só um empurrãozinho leve — nada foge do cursor.
   */
  function fisica(host) {
    const bolhas = [...host.querySelectorAll(".petbolha")];
    const rect0 = host.getBoundingClientRect();
    let W = rect0.width, H = rect0.height || 360;

    const G = 0.11, AIR = 0.975, FLOOR_BOUNCE = 0.12, WALL_BOUNCE = 0.4;

    const state = bolhas.map((el, idx) => {
      const r = Number(el.dataset.r);
      return {
        el, r,
        x: Math.random() * Math.max(1, W - 2 * r),
        y: -r - Math.random() * 200 - idx * 20,
        vx: (Math.random() - 0.5) * 0.6,
        vy: 0,
      };
    });
    const place = (b) => { b.el.style.transform = `translate(${b.x}px, ${b.y}px)`; };
    state.forEach(place);

    if (REDUCED) {
      let cx = 8;
      state.forEach((b) => { b.x = Math.min(cx, W - 2 * b.r); b.y = H - 2 * b.r; cx += 2 * b.r + 6; place(b); });
      return;
    }

    let mouse = null, near = null, dwell = 0, held = null;
    host.addEventListener("pointermove", (e) => { const r = host.getBoundingClientRect(); mouse = { x: e.clientX - r.left, y: e.clientY - r.top }; });
    host.addEventListener("pointerleave", () => {
      mouse = null; near = null; dwell = 0;
      if (held) { held.el.classList.remove("held"); held = null; }
    });
    const ro = new ResizeObserver(() => { const r = host.getBoundingClientRect(); W = r.width; H = r.height || H; });
    ro.observe(host);

    let raf = 0, running = false;
    const step = () => {
      if (!running) return;

      // Bolha sob o cursor; se ele fica parado nela um instante, ela é "capturada".
      let nearest = null, best = Infinity;
      if (mouse) {
        for (const b of state) {
          const cx = b.x + b.r, cy = b.y + b.r, d = Math.hypot(cx - mouse.x, cy - mouse.y);
          if (d < b.r + 24 && d < best) { best = d; nearest = b; }
        }
      }
      if (nearest && nearest === near) dwell++; else { near = nearest; dwell = 0; }
      const wantHeld = nearest && dwell > 22 ? nearest : null; // ~0,35s parado perto
      if (held !== wantHeld) {
        if (held) held.el.classList.remove("held");
        held = wantHeld;
        if (held) held.el.classList.add("held");
      }

      state.forEach((b) => {
        if (b === held) {
          // capturada: sem gravidade — para no cursor (fácil de clicar).
          const cx = b.x + b.r, cy = b.y + b.r;
          b.vx = (b.vx + (mouse.x - cx) * 0.16) * 0.5;
          b.vy = (b.vy + (mouse.y - cy) * 0.16) * 0.5;
          return;
        }
        b.vy += G;
        b.vx *= AIR;
        if (mouse) {
          const cx = b.x + b.r, cy = b.y + b.r;
          const dx = cx - mouse.x, dy = cy - mouse.y;
          const reach = b.r + 46;
          const d = Math.hypot(dx, dy);
          if (d < reach) {
            const f = (reach - Math.max(d, 0.001)) / reach;
            if (d > 0.5) {
              b.vx += (dx / d) * f * 0.12;
              b.vy += (dy / d) * f * 0.07;
            }
            b.vy -= f * 0.34;
          }
        }
      });

      for (let i = 0; i < state.length; i++) {
        for (let j = i + 1; j < state.length; j++) {
          const a = state[i], b = state[j];
          const ax = a.x + a.r, ay = a.y + a.r, bx = b.x + b.r, by = b.y + b.r;
          let dx = bx - ax, dy = by - ay;
          let d = Math.hypot(dx, dy);
          const min = a.r + b.r;
          if (d < min && d > 0.01) {
            const nx = dx / d, ny = dy / d;
            const overlap = (min - d) / 2;
            if (a !== held) { a.x -= nx * overlap; a.y -= ny * overlap; }
            if (b !== held) { b.x += nx * overlap; b.y += ny * overlap; }
            const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
            if (rel < 0) {
              const imp = rel * 0.5;
              a.vx += nx * imp; a.vy += ny * imp;
              b.vx -= nx * imp; b.vy -= ny * imp;
            }
          }
        }
      }

      state.forEach((b) => {
        const sp = Math.hypot(b.vx, b.vy), max = 2.4;
        if (sp > max) { b.vx = b.vx / sp * max; b.vy = b.vy / sp * max; }
        b.x += b.vx; b.y += b.vy;
        if (b.x < 0) { b.x = 0; b.vx = -b.vx * WALL_BOUNCE; }
        if (b.x > W - 2 * b.r) { b.x = W - 2 * b.r; b.vx = -b.vx * WALL_BOUNCE; }
        if (b.y < 0) { b.y = 0; b.vy = -b.vy * WALL_BOUNCE; }
        if (b.y > H - 2 * b.r) {
          b.y = H - 2 * b.r;
          b.vy = -b.vy * FLOOR_BOUNCE;
          b.vx *= 0.9;
          if (Math.abs(b.vy) < 0.4) b.vy = 0;
        }
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

  async function mount(host) {
    if (!host) return;
    const pets = await fetchPets();
    render(host, pets);
  }

  window.PetBolhasCTA = { mount };
})();
