/* =======================================================================
   Assistente do abrigo (área de admin)
   =======================================================================
   Chatbot de base de conhecimento — 100% no navegador, sem IA externa, sem
   chave, sem custo e sem risco de perder acesso. Responde as dúvidas comuns
   por correspondência de palavras/sinônimos. O que não souber com confiança
   vira um TICKET no Supabase (tabela suporte_tickets) que a equipe responde
   uma a uma. Staff (profiles.is_staff = true) enxerga a caixa de suporte de
   todas as ONGs. A ONG vê suas próprias dúvidas e as respostas.

   Só aparece na área logada (sessão real do Supabase). Injeta a própria UI.
   ======================================================================= */
(function () {
  "use strict";

  // --------------------------- Base de conhecimento ---------------------------
  // kw = palavras-chave (já sem acento) que puxam a resposta. a = HTML da resposta.
  const KB = [
    {
      id: "cadastrar",
      q: "Como cadastro um pet?",
      kw: ["cadastrar", "cadastro", "cadastra", "adicionar", "novo", "incluir", "registrar", "criar", "pet", "animal", "bichinho", "colocar", "publicar", "anunciar"],
      a: "Clique em <strong>+ Novo pet</strong> no topo da página, preencha os dados (nome, espécie, porte, idade, foto e saúde) e clique em <strong>Salvar</strong>. Ele entra na coluna <em>À espera de um lar</em>. Tem também um vídeo rapidinho na seção de perguntas frequentes.",
    },
    {
      id: "foto",
      q: "Como adiciono ou troco a foto do pet?",
      kw: ["foto", "fotos", "imagem", "imagens", "trocar", "mudar", "adicionar", "upload", "enviar", "camera"],
      a: "No formulário do pet (ao cadastrar ou editar), clique no campo de foto e selecione a imagem do dispositivo. Prefira uma foto nítida, de frente e bem iluminada — é o que mais chama atenção de quem adota.",
    },
    {
      id: "mover-status",
      q: "Como movo um pet entre as colunas (status)?",
      kw: ["mover", "mudar", "arrastar", "coluna", "colunas", "status", "kanban", "processo", "adotado", "disponivel", "etapa", "passar"],
      a: "Você pode <strong>arrastar</strong> o card para outra coluna, ou usar os <strong>botões de status</strong> dentro do próprio card: <em>À espera de um lar</em> → <em>Rumo ao lar</em> → <em>Família formada</em>. Ao marcar como adotado, rola uma comemoração 🎉.",
    },
    {
      id: "interessados",
      q: "Como vejo quem demonstrou interesse em um pet?",
      kw: ["interessados", "interesse", "contato", "contatos", "quem", "demonstrou", "adotante", "adotantes", "mensagem", "central", "leads"],
      a: "Clique no botão com o ícone <strong>💬</strong> no card do pet — ele mostra quantas pessoas se interessaram e abre a lista com nome e contato de cada uma. Você também acha tudo reunido na <strong>Central de Interessados</strong> (menu ⚙️ Conta → 💬 Interessados).",
    },
    {
      id: "editar-excluir",
      q: "Como edito ou removo um pet?",
      kw: ["editar", "edito", "alterar", "corrigir", "excluir", "remover", "apagar", "deletar", "tirar", "excluo"],
      a: "Passe o mouse no card do pet e use os botões de <strong>editar</strong> (lápis) ou <strong>excluir</strong> (lixeira). Ao excluir, confirmamos antes — a ação não pode ser desfeita.",
    },
    {
      id: "formulario-proprio",
      q: "Posso usar o formulário de adoção do meu abrigo?",
      kw: ["formulario", "form", "proprio", "link", "adocao", "meu", "externo", "google", "forms"],
      a: "Sim. Ao editar um pet, cole o link do seu formulário no campo <strong>Link do formulário de adoção</strong>. Quem se interessar poderá escolher entre o formulário do Patinhas e o seu.",
    },
    {
      id: "perfil",
      q: "Como atualizo o nome e o WhatsApp do abrigo?",
      kw: ["perfil", "nome", "whatsapp", "telefone", "contato", "email", "atualizar", "editar", "abrigo", "ong", "cidade", "estado", "dados"],
      a: "Clique em <strong>⚙️ Conta → Meu perfil</strong> no topo. Lá você edita o nome do abrigo, e-mail, WhatsApp e cidade/estado usados nas mensagens de interesse.",
    },
    {
      id: "senha",
      q: "Esqueci minha senha, e agora?",
      kw: ["senha", "esqueci", "recuperar", "recuperacao", "redefinir", "acesso", "entrar", "login", "password", "trocar"],
      a: "Por enquanto a recuperação de senha é manual: use o botão <strong>Falar com a equipe</strong> aqui embaixo que a gente redefine seu acesso rapidinho.",
    },
    {
      id: "importar",
      q: "Como cadastro vários pets de uma vez?",
      kw: ["importar", "lote", "varios", "planilha", "massa", "muitos", "csv", "importacao", "vez"],
      a: "Use o botão <strong>📥 Importar em lote</strong> no topo. Você cola/insere a lista de pets seguindo o modelo e cadastramos todos de uma vez.",
    },
    {
      id: "familia-foto",
      q: "Como mostro a foto da família que adotou?",
      kw: ["familia", "foto", "adotado", "adotou", "reencontro", "prova", "social", "final", "feliz"],
      a: "Ao editar um pet que está como <em>Família formada</em>, envie a <strong>foto da família com o pet</strong>. Ela aparece no card de adotado como uma prova social linda do trabalho de vocês. 💚",
    },
    {
      id: "taxa",
      q: "Existe taxa? O Patinhas cobra algo?",
      kw: ["taxa", "custo", "preco", "pagar", "gratis", "gratuito", "cobra", "dinheiro", "valor", "cobranca"],
      a: "O Patinhas é <strong>gratuito</strong> para os abrigos. Qualquer taxa de adoção (quando existir) é definida e cobrada diretamente por vocês, nunca por nós.",
    },
    {
      id: "termo-lgpd",
      q: "Como funcionam os dados dos interessados e o termo de adoção?",
      kw: ["lgpd", "dados", "privacidade", "termo", "responsabilidade", "juridico", "consentimento", "adocao"],
      a: "Encaminhamos a vocês o contato de quem demonstra interesse; o <strong>termo de adoção/responsabilidade é competência de cada abrigo</strong>. Tratamos os dados conforme a <a href=\"/politica-de-privacidade/\" target=\"_blank\" rel=\"noopener\">Política de Privacidade</a> e a LGPD.",
    },
    {
      id: "como-funciona",
      q: "Como funciona o mural / o Patinhas?",
      kw: ["funciona", "mural", "patinhas", "plataforma", "site", "serve", "como"],
      a: "Você cadastra seus pets e acompanha cada um pelas etapas <em>À espera de um lar</em> → <em>Rumo ao lar</em> → <em>Família formada</em>. Quem visita o site vê os disponíveis e manda o interesse direto pra você. Simples assim. 🐾",
    },
  ];

  const GREETING_SUGGESTIONS = ["Como cadastro um pet?", "Como vejo os interessados?", "Como movo um pet de coluna?", "Esqueci minha senha"];

  // Barra de respostas rápidas (estilo Uber/99): sempre visível acima do input.
  const QUICK = [
    { label: "🐾 Cadastrar um pet", q: "Como cadastro um pet?" },
    { label: "💬 Ver interessados", q: "Como vejo quem demonstrou interesse?" },
    { label: "↔️ Mover de coluna", q: "Como movo um pet entre as colunas?" },
    { label: "📸 Trocar a foto", q: "Como adiciono ou troco a foto do pet?" },
    { label: "⚙️ Meu perfil", q: "Como atualizo o nome e o WhatsApp do abrigo?" },
    { label: "🔑 Esqueci a senha", q: "Esqueci minha senha" },
    { label: "✉️ Falar com a equipe", escalate: true },
  ];

  // --------------------------- Correspondência ---------------------------
  const STOP = new Set(("a o as os um uma de do da das dos e ou que qual quais como onde quando porque pra para por com no na nos nas " +
    "em meu minha meus minhas eu voce vc se sobre tem ter posso pode consigo quero preciso um uma isso isto ao aos").split(" "));

  function norm(s) {
    return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  }
  function toks(s) { return norm(s).split(" ").filter((t) => t && !STOP.has(t)); }

  function rank(text) {
    const set = new Set(toks(text));
    if (!set.size) return [];
    return KB.map((e) => {
      let sc = 0;
      for (const k of e.kw) if (set.has(k)) sc += 2;
      for (const t of toks(e.q)) if (set.has(t)) sc += 1;
      return { e, sc };
    }).filter((r) => r.sc > 0).sort((a, b) => b.sc - a.sc);
  }
  const THRESHOLD = 3; // pontuação mínima pra considerar que "sabe" responder

  // --------------------------- Estado / contexto ---------------------------
  let CTX = null;           // { orgId, orgName, email, isStaff }
  let lastUserQuestion = "";
  let root = null, launcher = null, panel = null, elMsgs = null, elInput = null;

  const esc = (s) => (s == null ? "" : String(s)).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  // --------------------------- UI: construção ---------------------------
  function build() {
    if (root) return;
    root = document.createElement("div");
    root.id = "pchat";
    root.innerHTML = `
      <button type="button" id="pchat-launcher" class="pchat-launcher" aria-label="Abrir assistente do abrigo" hidden>
        <span class="pchat-launcher-ico" aria-hidden="true">💬</span>
        <span class="pchat-launcher-txt">Precisa de ajuda?</span>
      </button>
      <section id="pchat-panel" class="pchat-panel" role="dialog" aria-label="Assistente do abrigo" hidden>
        <header class="pchat-head">
          <div class="pchat-head-title">
            <span class="pchat-dot" aria-hidden="true"></span>
            <div>
              <strong>Assistente do abrigo</strong>
              <span class="pchat-head-sub">Tire dúvidas na hora</span>
            </div>
          </div>
          <div class="pchat-head-actions">
            <button type="button" id="pchat-inbox-btn" class="pchat-icon-btn" title="Caixa de suporte" hidden>📥<span id="pchat-inbox-badge" class="pchat-badge" hidden>0</span></button>
            <button type="button" id="pchat-close" class="pchat-icon-btn" aria-label="Fechar">✕</button>
          </div>
        </header>
        <div id="pchat-body" class="pchat-body"></div>
        <div id="pchat-msgs" class="pchat-msgs" hidden></div>
        <div id="pchat-quick" class="pchat-quick" hidden></div>
        <form id="pchat-form" class="pchat-inputrow" hidden>
          <input id="pchat-input" type="text" autocomplete="off" placeholder="Escreva sua dúvida..." />
          <button type="submit" class="pchat-send" aria-label="Enviar">➤</button>
        </form>
      </section>`;
    document.body.appendChild(root);

    launcher = root.querySelector("#pchat-launcher");
    panel = root.querySelector("#pchat-panel");
    elMsgs = root.querySelector("#pchat-msgs");
    elInput = root.querySelector("#pchat-input");

    launcher.addEventListener("click", openChat);
    root.querySelector("#pchat-close").addEventListener("click", closeChat);
    root.querySelector("#pchat-inbox-btn").addEventListener("click", openInbox);
    root.querySelector("#pchat-form").addEventListener("submit", (e) => { e.preventDefault(); const v = elInput.value.trim(); if (v) handleUserText(v); });
    buildQuickBar();
  }

  // Barra de respostas rápidas (chips prontos acima do input, tipo Uber/99).
  function buildQuickBar() {
    const bar = root.querySelector("#pchat-quick");
    bar.innerHTML = "";
    QUICK.forEach((item) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "pchat-quick-chip" + (item.escalate ? " escalate" : "");
      b.textContent = item.label;
      b.addEventListener("click", () => { if (item.escalate) showEscalateForm(); else handleUserText(item.q); });
      bar.appendChild(b);
    });
  }
  function showQuick(on) {
    const bar = root && root.querySelector("#pchat-quick");
    if (bar) bar.hidden = !on;
  }

  function toggleLauncher(show) {
    if (!launcher) return;
    launcher.hidden = !show;
    if (!show) closeChat();
  }

  function openChat() {
    panel.hidden = false;
    launcher.hidden = true;
    showChatView();
  }
  function closeChat() {
    if (panel) panel.hidden = true;
    if (launcher && CTX) launcher.hidden = false;
  }

  // --------------------------- View: conversa ---------------------------
  function showChatView() {
    root.querySelector("#pchat-body").hidden = true;
    elMsgs.hidden = false;
    root.querySelector("#pchat-form").hidden = false;
    showQuick(true);
    root.querySelector("#pchat-inbox-btn").hidden = !(CTX && CTX.isStaff);
    if (!elMsgs.dataset.greeted) {
      elMsgs.dataset.greeted = "1";
      const oi = CTX ? `Oi! Sou o assistente do Patinhas 🐾 Como posso ajudar${CTX.orgName ? ", " + esc(CTX.orgName) : ""}?` : "Oi! Como posso ajudar? 🐾";
      addBot(oi);
      addSuggestions(GREETING_SUGGESTIONS);
      addSmallLink("Ver minhas dúvidas enviadas", showMyTickets);
    }
    elInput.focus();
  }

  function addMsg(who, html) {
    const d = document.createElement("div");
    d.className = "pchat-msg pchat-" + who;
    d.innerHTML = `<div class="pchat-bubble">${html}</div>`;
    elMsgs.appendChild(d);
    elMsgs.scrollTop = elMsgs.scrollHeight;
    return d;
  }
  const addBot = (html) => addMsg("bot", html);
  const addUser = (text) => addMsg("user", esc(text));

  function addSuggestions(list) {
    const wrap = document.createElement("div");
    wrap.className = "pchat-suggs";
    list.forEach((q) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "pchat-sugg";
      b.textContent = q;
      b.addEventListener("click", () => handleUserText(q));
      wrap.appendChild(b);
    });
    elMsgs.appendChild(wrap);
    elMsgs.scrollTop = elMsgs.scrollHeight;
  }
  function addSmallLink(label, fn) {
    const a = document.createElement("button");
    a.type = "button";
    a.className = "pchat-smalllink";
    a.textContent = label;
    a.addEventListener("click", fn);
    elMsgs.appendChild(a);
  }

  function handleUserText(text) {
    elInput.value = "";
    addUser(text);
    lastUserQuestion = text;
    const results = rank(text);
    const top = results[0];
    if (top && top.sc >= THRESHOLD) {
      setTimeout(() => {
        addBot(top.e.a);
        const related = results.slice(1, 3).filter((r) => r.sc >= 2).map((r) => r.e.q);
        if (related.length) addSuggestions(related);
        addBot('Isso ajudou? Se precisar, <strong>fale com a equipe</strong> que respondemos pessoalmente.');
        addEscalateButton();
      }, 220);
    } else {
      setTimeout(() => {
        addBot("Hmm, não tenho certeza sobre isso. 🤔 Posso encaminhar sua dúvida pra nossa equipe responder pessoalmente.");
        if (results.length) { addBot("Ou talvez uma destas ajude:"); addSuggestions(results.slice(0, 3).map((r) => r.e.q)); }
        addEscalateButton(true);
      }, 220);
    }
  }

  function addEscalateButton(primary) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "pchat-escalate" + (primary ? " primary" : "");
    b.innerHTML = "✉️ Falar com a equipe";
    b.addEventListener("click", showEscalateForm);
    elMsgs.appendChild(b);
    elMsgs.scrollTop = elMsgs.scrollHeight;
  }

  // --------------------------- View: falar com a equipe ---------------------------
  function showEscalateForm() {
    if (!CTX) { addBot("Entre na sua conta para falar com a equipe."); return; }
    const body = root.querySelector("#pchat-body");
    elMsgs.hidden = true;
    root.querySelector("#pchat-form").hidden = true;
    showQuick(false);
    body.hidden = false;
    body.innerHTML = `
      <div class="pchat-view">
        <button type="button" class="pchat-back">← Voltar</button>
        <h3>Falar com a equipe</h3>
        <p class="pchat-view-sub">Escreva sua dúvida que a gente responde por aqui e pelo seu e-mail (${esc(CTX.email || "")}).</p>
        <textarea id="pchat-ticket-text" rows="5" placeholder="Sua dúvida...">${esc(lastUserQuestion)}</textarea>
        <div id="pchat-ticket-err" class="pchat-err" hidden></div>
        <button type="button" id="pchat-ticket-send" class="pchat-primary-btn">Enviar para a equipe</button>
      </div>`;
    body.querySelector(".pchat-back").addEventListener("click", showChatView);
    body.querySelector("#pchat-ticket-send").addEventListener("click", submitTicket);
    body.querySelector("#pchat-ticket-text").focus();
  }

  async function submitTicket() {
    const ta = root.querySelector("#pchat-ticket-text");
    const err = root.querySelector("#pchat-ticket-err");
    const btn = root.querySelector("#pchat-ticket-send");
    const pergunta = (ta.value || "").trim();
    err.hidden = true;
    if (pergunta.length < 5) { err.textContent = "Escreva um pouquinho mais sobre sua dúvida."; err.hidden = false; return; }
    btn.disabled = true; btn.textContent = "Enviando...";
    try {
      const { error } = await window.sb.from("suporte_tickets").insert([{
        org_id: CTX.orgId, org_name: CTX.orgName, pergunta, contexto: lastUserQuestion || null,
      }]);
      if (error) throw error;
      const body = root.querySelector("#pchat-body");
      body.innerHTML = `
        <div class="pchat-view pchat-center">
          <div class="pchat-ok-ico">💚</div>
          <h3>Recebemos sua dúvida!</h3>
          <p class="pchat-view-sub">A equipe responde por aqui e pelo seu e-mail em breve.</p>
          <button type="button" id="pchat-after-ok" class="pchat-primary-btn">Voltar ao assistente</button>
          <button type="button" id="pchat-after-mine" class="pchat-smalllink">Ver minhas dúvidas</button>
        </div>`;
      body.querySelector("#pchat-after-ok").addEventListener("click", showChatView);
      body.querySelector("#pchat-after-mine").addEventListener("click", showMyTickets);
    } catch (e) {
      console.error("[Patinhas] Erro ao enviar ticket:", e);
      err.textContent = "Não deu para enviar agora. Tente de novo em instantes.";
      err.hidden = false;
      btn.disabled = false; btn.textContent = "Enviar para a equipe";
    }
  }

  // --------------------------- View: minhas dúvidas (ONG) ---------------------------
  async function showMyTickets() {
    if (!CTX) return;
    const body = root.querySelector("#pchat-body");
    elMsgs.hidden = true;
    root.querySelector("#pchat-form").hidden = true;
    showQuick(false);
    body.hidden = false;
    body.innerHTML = `<div class="pchat-view"><button type="button" class="pchat-back">← Voltar</button><h3>Minhas dúvidas</h3><p class="pchat-view-sub">Carregando...</p></div>`;
    body.querySelector(".pchat-back").addEventListener("click", showChatView);
    try {
      const { data, error } = await window.sb.from("suporte_tickets")
        .select("pergunta,resposta,status,created_at,respondido_em")
        .eq("org_id", CTX.orgId).order("created_at", { ascending: false }).limit(30);
      if (error) throw error;
      const view = body.querySelector(".pchat-view");
      view.querySelector(".pchat-view-sub").remove();
      if (!data || !data.length) {
        const p = document.createElement("p"); p.className = "pchat-view-sub"; p.textContent = "Você ainda não enviou nenhuma dúvida pra equipe.";
        view.appendChild(p); return;
      }
      data.forEach((t) => view.appendChild(ticketCard(t, false)));
    } catch (e) {
      console.error(e);
      body.querySelector(".pchat-view").insertAdjacentHTML("beforeend", `<p class="pchat-err">Não deu para carregar agora.</p>`);
    }
  }

  // --------------------------- View: caixa de suporte (equipe) ---------------------------
  async function openInbox() {
    const body = root.querySelector("#pchat-body");
    elMsgs.hidden = true;
    root.querySelector("#pchat-form").hidden = true;
    showQuick(false);
    body.hidden = false;
    body.innerHTML = `<div class="pchat-view"><button type="button" class="pchat-back">← Voltar</button><h3>Caixa de suporte</h3><p class="pchat-view-sub">Carregando...</p></div>`;
    body.querySelector(".pchat-back").addEventListener("click", showChatView);
    try {
      const { data, error } = await window.sb.from("suporte_tickets")
        .select("id,org_name,pergunta,contexto,resposta,status,created_at")
        .order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      const view = body.querySelector(".pchat-view");
      const abertos = (data || []).filter((t) => t.status === "aberto").length;
      updateInboxBadge(abertos);
      view.querySelector(".pchat-view-sub").textContent = data && data.length ? `${abertos} em aberto · ${data.length} no total` : "Nenhuma dúvida recebida ainda.";
      (data || []).forEach((t) => view.appendChild(ticketCard(t, true)));
    } catch (e) {
      console.error(e);
      body.querySelector(".pchat-view").insertAdjacentHTML("beforeend", `<p class="pchat-err">Não deu para carregar agora.</p>`);
    }
  }

  function ticketCard(t, staff) {
    const card = document.createElement("div");
    card.className = "pchat-ticket status-" + (t.status || "aberto");
    const when = t.created_at ? new Date(t.created_at).toLocaleDateString("pt-BR") : "";
    card.innerHTML = `
      <div class="pchat-ticket-top">
        ${staff ? `<strong>${esc(t.org_name || "Abrigo")}</strong>` : `<strong>Sua dúvida</strong>`}
        <span class="pchat-ticket-status">${esc(statusLabel(t.status))}</span>
      </div>
      <p class="pchat-ticket-q">${esc(t.pergunta)}</p>
      <span class="pchat-ticket-when">${esc(when)}</span>
      ${t.resposta ? `<div class="pchat-ticket-answer"><span>Resposta da equipe:</span>${esc(t.resposta)}</div>` : ""}`;
    if (staff) {
      const box = document.createElement("div");
      box.className = "pchat-ticket-reply";
      box.innerHTML = `
        <textarea rows="2" placeholder="Escreva a resposta...">${esc(t.resposta || "")}</textarea>
        <div class="pchat-ticket-actions">
          <button type="button" class="pchat-primary-btn sm">${t.status === "aberto" ? "Responder" : "Atualizar"}</button>
          ${t.status !== "fechado" ? `<button type="button" class="pchat-smalllink">Fechar</button>` : ""}
        </div>
        <div class="pchat-err" hidden></div>`;
      const ta = box.querySelector("textarea");
      const send = box.querySelector(".pchat-primary-btn");
      const err = box.querySelector(".pchat-err");
      send.addEventListener("click", () => replyTicket(t.id, ta.value.trim(), "respondido", card, err, send));
      const closeBtn = box.querySelector(".pchat-smalllink");
      if (closeBtn) closeBtn.addEventListener("click", () => replyTicket(t.id, ta.value.trim() || t.resposta || "", "fechado", card, err, send));
      card.appendChild(box);
    }
    return card;
  }

  async function replyTicket(id, resposta, status, card, err, btn) {
    if (err) err.hidden = true;
    if (status === "respondido" && (!resposta || resposta.length < 2)) { if (err) { err.textContent = "Escreva a resposta."; err.hidden = false; } return; }
    if (btn) { btn.disabled = true; }
    try {
      const { error } = await window.sb.from("suporte_tickets")
        .update({ resposta: resposta || null, status, respondido_em: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      openInbox(); // recarrega a lista
    } catch (e) {
      console.error(e);
      if (err) { err.textContent = "Não deu para salvar."; err.hidden = false; }
      if (btn) btn.disabled = false;
    }
  }

  function statusLabel(s) { return s === "respondido" ? "Respondido" : s === "fechado" ? "Fechado" : "Aberto"; }

  async function updateInboxBadge(count) {
    const badge = root && root.querySelector("#pchat-inbox-badge");
    if (!badge) return;
    if (count > 0) { badge.textContent = String(count); badge.hidden = false; }
    else badge.hidden = true;
  }

  async function refreshInboxBadge() {
    if (!CTX || !CTX.isStaff || !window.sb) return;
    try {
      const { count } = await window.sb.from("suporte_tickets")
        .select("id", { count: "exact", head: true }).eq("status", "aberto");
      updateInboxBadge(count || 0);
    } catch (e) { /* silencioso */ }
  }

  // --------------------------- Contexto / sessão ---------------------------
  async function refreshContext() {
    if (!window.sb || window.DEMO_MODE) { CTX = null; toggleLauncher(false); return; }
    try {
      const { data: { session } } = await window.sb.auth.getSession();
      if (!session) { CTX = null; toggleLauncher(false); return; }
      let prof = null;
      try {
        const r = await window.sb.from("profiles").select("org_name,is_staff").eq("id", session.user.id).single();
        prof = r.data;
      } catch (e) { /* usa fallback */ }
      CTX = { orgId: session.user.id, orgName: (prof && prof.org_name) || "seu abrigo", email: session.user.email, isStaff: !!(prof && prof.is_staff) };
      toggleLauncher(true);
      refreshInboxBadge();
    } catch (e) {
      CTX = null; toggleLauncher(false);
    }
  }

  function init() {
    build();
    refreshContext();
    if (window.sb && window.sb.auth && window.sb.auth.onAuthStateChange) {
      window.sb.auth.onAuthStateChange(() => refreshContext());
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.PatinhasChat = { refresh: refreshContext };
})();
