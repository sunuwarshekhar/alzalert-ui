/**
 * API base URL resolution (dev → Vite proxy, prod → env or runtime config).
 *
 * Priority:
 * 1. window.__ALZALERT_CONFIG__.apiBaseUrl (public/config.js, editable after deploy)
 * 2. VITE_API_BASE_URL (baked in at build time via .env.production)
 * 3. '' — only valid when a reverse proxy serves /api on the same origin
 */
export const getApiBaseUrl = () => {
  if (typeof window !== "undefined") {
    const runtimeUrl = window.__ALZALERT_CONFIG__?.apiBaseUrl;
    if (runtimeUrl) return runtimeUrl.replace(/\/$/, "");
  }

  const buildUrl = import.meta.env.VITE_API_BASE_URL;
  if (buildUrl) return buildUrl.replace(/\/$/, "");

  return "";
};
