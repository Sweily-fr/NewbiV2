// posthog-js (~430 KB) est chargé dynamiquement à l'idle : il sort du chemin
// critique de toutes les pages (notamment les pages marketing/SEO qui n'ont
// aucun autre lien avec PostHog). L'event $pageview initial est capturé à
// l'init, donc rien n'est perdu, juste différé de quelques centaines de ms.

// development | staging | production — distingue les envs dans PostHog.
// Seule la production track. Dev et staging sont opt-out par défaut pour
// ne pas polluer les stats. Override possible avec
// NEXT_PUBLIC_POSTHOG_FORCE_ENABLE=true (utile pour tester ponctuellement).
const appEnv = process.env.NEXT_PUBLIC_APP_ENV || "development";
const isProduction = appEnv === "production";
const forceEnable = process.env.NEXT_PUBLIC_POSTHOG_FORCE_ENABLE === "true";

const posthogToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

function setupPostHog(posthog) {
  posthog.init(posthogToken, {
    api_host: "/ingest",
    ui_host: "https://eu.posthog.com",
    defaults: "2026-01-30",
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
    // RGPD: pas de capture tant que l'user n'a pas donné son consentement
    // analytics dans le CookieManager. L'opt-in se fait via applyConsent() ci-dessous.
    opt_out_capturing_by_default: true,
    loaded: (ph) => {
      if (typeof window !== "undefined") {
        window.posthog = ph;
      }
    },
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
        posthog.startSessionRecording();
      } else {
        posthog.opt_out_capturing();
      }
    } catch {
      posthog.opt_out_capturing();
    }
  }

  applyConsent();
  window.addEventListener("cookieConsentUpdated", applyConsent);
  window.addEventListener("storage", (e) => {
    if (e.key === "cookie_consent") applyConsent();
  });

  // Événements émis avant le chargement (src/lib/analytics.js) : rejoués
  // maintenant, après register({ environment }) et le consentement.
  const queued = window.__phQueue || [];
  window.__phQueue = [];
  queued.forEach((fn) => {
    try {
      fn(posthog);
    } catch {
      // Analytique au mieux.
    }
  });
}

// Sans token (env local sans NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN), ne rien
// charger du tout : ça évite le warning "initialized without a token" et
// 430 KB de JS inutiles.
//
// Même chose sans consentement analytics (ou hors production) : posthog
// resterait en opt-out et n'enverrait rien, inutile de le télécharger. Il est
// chargé dès que le consentement est donné (événement cookieConsentUpdated ou
// autre onglet) ; les événements émis entre-temps attendent dans la file de
// src/lib/analytics.
function hasAnalyticsConsent() {
  if (!isProduction && !forceEnable) return false;
  try {
    return (
      JSON.parse(localStorage.getItem("cookie_consent") || "null")
        ?.analytics === true
    );
  } catch {
    return false;
  }
}

if (typeof window !== "undefined" && posthogToken) {
  let started = false;
  const load = () => {
    if (started) return;
    started = true;
    import("posthog-js").then((m) => setupPostHog(m.default)).catch(() => {});
  };
  const loadWhenIdle = () => {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => load(), { timeout: 1500 });
    } else {
      setTimeout(load, 1000);
    }
  };

  if (hasAnalyticsConsent()) {
    loadWhenIdle();
  } else {
    const onConsentChange = () => {
      if (hasAnalyticsConsent()) loadWhenIdle();
    };
    window.addEventListener("cookieConsentUpdated", onConsentChange);
    window.addEventListener("storage", (e) => {
      if (e.key === "cookie_consent") onConsentChange();
    });
  }
}
