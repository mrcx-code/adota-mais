/**
 * Inicializa a conexão com o Supabase.
 *
 * Se as chaves em config.js ainda não foram preenchidas (ou se o
 * script do Supabase não pôde ser carregado), o app entra
 * automaticamente em DEMO_MODE: usa dados de exemplo (js/mockData.js)
 * e nada é salvo de verdade. Isso permite navegar e testar o visual
 * antes de conectar um projeto Supabase real.
 */
window.DEMO_MODE = true;
window.sb = null;

(function initSupabase() {
  const url = window.SUPABASE_URL || "";
  const key = window.SUPABASE_ANON_KEY || "";
  const isPlaceholder =
    !url || !key || url.indexOf("COLE_AQUI") !== -1 || key.indexOf("COLE_AQUI") !== -1;
  const libAvailable =
    window.supabase && typeof window.supabase.createClient === "function";

  if (!isPlaceholder && libAvailable) {
    try {
      window.sb = window.supabase.createClient(url, key);
      window.DEMO_MODE = false;
    } catch (err) {
      console.error("[Adota+] Não foi possível iniciar o Supabase, usando modo demonstração.", err);
      window.DEMO_MODE = true;
    }
  } else {
    if (!libAvailable) {
      console.warn("[Adota+] Biblioteca do Supabase não carregou — modo demonstração ativo.");
    } else {
      console.info("[Adota+] Chaves do Supabase não configuradas em js/config.js — modo demonstração ativo.");
    }
    window.DEMO_MODE = true;
  }
})();

/** Mostra o aviso de "modo demonstração" quando aplicável. */
function initDemoBanner() {
  const banner = document.getElementById("demo-banner");
  if (banner && window.DEMO_MODE) {
    banner.classList.add("visible");
  }
}
document.addEventListener("DOMContentLoaded", initDemoBanner);
