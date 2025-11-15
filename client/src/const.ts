export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "FineAccess";
export const APP_LOGO =
  import.meta.env.VITE_APP_LOGO ||
  "/fineaccess-logo.svg?v=2";
export function getLogoUrl(): string {
  const src = APP_LOGO;
  try {
    const url = new URL(src, window.location.origin);
    if (!url.search) {
      url.searchParams.set("v", "2");
    }
    return url.toString();
  } catch {
    return src.includes("?") ? src : `${src}?v=2`;
  }
}
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  if (!oauthPortalUrl || !appId) {
    return "/login";
  }
  try {
    const redirectUri = `${window.location.origin}/api/oauth/callback`;
    const state = btoa(redirectUri);
    const url = new URL(`${oauthPortalUrl.replace(/\/$/, "")}/app-auth`);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");
    return url.toString();
  } catch (e) {
    console.warn("[Login] Falling back to /login due to invalid OAuth URL", e);
    return "/login";
  }
};
