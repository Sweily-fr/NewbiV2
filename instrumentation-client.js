import posthog from "posthog-js";

// development | staging | production — distingue les envs dans PostHog.
// Seule la production track. Dev et staging sont opt-out par défaut pour
// ne pas polluer les stats. Override possible avec
// NEXT_PUBLIC_POSTHOG_FORCE_ENABLE=true (utile pour tester ponctuellement).
const appEnv = process.env.NEXT_PUBLIC_APP_ENV || "development";
const isProduction = appEnv === "production";
const forceEnable = process.env.NEXT_PUBLIC_POSTHOG_FORCE_ENABLE === "true";

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN, {
  api_host: "/ingest",
  ui_host: "https://eu.posthog.com",
  defaults: "2026-01-30",
  capture_exceptions: true,
  debug: process.env.NODE_ENV === "development",
  // RGPD: pas de capture tant que l'user n'a pas donné son consentement
  // analytics dans le CookieManager. L'opt-in se fait via applyConsent() ci-dessous.
  opt_out_capturing_by_default: true,
});

// Super property: tagge tous les events avec l'environnement.
// Dans PostHog, filtre par `environment = production` pour exclure dev/staging.
posthog.register({
  environment: appEnv,
});

function applyConsent() {
  // Seule la prod track. Dev + staging = opt-out forcé, sauf flag d'override.
  if (!isProduction && !forceEnable) {
    posthog.opt_out_capturing();
    return;
  }
  try {
    const raw = localStorage.getItem("cookie_consent");
    if (!raw) {
      posthog.opt_out_capturing();
      return;
    }
    const parsed = JSON.parse(raw);
    if (parsed?.analytics === true) {
      posthog.opt_in_capturing();
    } else {
      posthog.opt_out_capturing();
    }
  } catch {
    posthog.opt_out_capturing();
  }
}

if (typeof window !== "undefined") {
  applyConsent();
  window.addEventListener("cookieConsentUpdated", applyConsent);
  window.addEventListener("storage", (e) => {
    if (e.key === "cookie_consent") applyConsent();
  });
}
