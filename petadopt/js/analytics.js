/**
 * Analytics leve de marketing, sem cookies de terceiros e sem dados pessoais.
 *
 * Toda vez que a pagina publica carrega (e o site esta conectado a um
 * projeto Supabase real, nao em modo demonstracao), registramos uma linha
 * anonima na tabela `site_visits`:
 *   - de onde a pessoa veio (referrer, utm_source/medium/campaign)
 *   - que tipo de aparelho usou (mobile/tablet/desktop)
 *   - um ID aleatorio salvo so no navegador dela, para estimar visitantes
 *     unicos (nao e vinculado a nome, e-mail, IP ou qualquer conta).
 *
 * A tabela so aceita INSERT pela chave publica (anon) - ninguem consegue
 * ler os dados de visita por ela; a leitura so acontece direto no banco.
 */
(function trackVisit() {
    if (window.DEMO_MODE || !window.sb) return;

   function getVisitorId() {
         try {
                 const KEY = "patinhas_visitor_id";
                 let id = localStorage.getItem(KEY);
                 if (!id) {
                           id =
                                       (window.crypto && crypto.randomUUID && crypto.randomUUID()) ||
                                       `${Date.now()}-${Math.random().toString(16).slice(2)}`;
                           localStorage.setItem(KEY, id);
                 }
                 return id;
         } catch (err) {
                 // localStorage indisponivel (modo privado, navegador antigo, etc.)
           return null;
         }
   }

   function getDeviceType() {
         const ua = (navigator.userAgent || "").toLowerCase();
         if (/ipad|tablet|(android(?!.*mobile))/.test(ua)) return "tablet";
         if (/mobile|iphone|ipod|android/.test(ua)) return "mobile";
         return "desktop";
   }

   const params = new URLSearchParams(window.location.search);

   const payload = {
         path: window.location.pathname || "/",
         referrer: document.referrer || null,
         utm_source: params.get("utm_source"),
         utm_medium: params.get("utm_medium"),
         utm_campaign: params.get("utm_campaign"),
         device_type: getDeviceType(),
         visitor_id: getVisitorId(),
   };

   window.sb
      .from("site_visits")
      .insert(payload)
      .then(({ error }) => {
              if (error) {
                        console.warn("[Patinhas] Nao foi possivel registrar a visita.", error);
              }
      });
})();
