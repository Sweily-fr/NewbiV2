// Envoi d'événements PostHog SANS importer posthog-js : les imports statiques
// (14 fichiers, dont SessionGateProvider dans le layout du dashboard)
// remettaient les ~73 kB gz de posthog dans le JS initial de toutes les pages,
// annulant son chargement différé (instrumentation-client.js).
//
// Tant que posthog n'est pas chargé, les appels attendent dans une file sur
// window (pas d'état de module : un seul exemplaire même si ce module est
// dupliqué entre plusieurs chunks). instrumentation-client.js la vide une fois
// posthog initialisé et le consentement appliqué ; sans consentement,
// posthog les ignore comme avant.
const MAX_QUEUE = 50;

const loadedPosthog = () =>
  typeof window !== "undefined" && window.posthog?.__loaded
    ? window.posthog
    : null;

function run(fn) {
  if (typeof window === "undefined") return;
  const posthog = loadedPosthog();
  if (posthog) {
    try {
      fn(posthog);
    } catch {
      // Analytique au mieux : ne jamais casser l'interface.
    }
    return;
  }
  const queue = (window.__phQueue ||= []);
  if (queue.length < MAX_QUEUE) queue.push(fn);
}

export const capture = (event, properties) =>
  run((posthog) => posthog.capture(event, properties));

export const identify = (distinctId, properties) =>
  run((posthog) => posthog.identify(distinctId, properties));

// Déconnexion : on vide la file (ne pas rejouer l'identify de l'utilisateur
// précédent) et on réinitialise posthog s'il est chargé, sans le télécharger.
export const resetAnalytics = () => {
  if (typeof window === "undefined") return;
  window.__phQueue = [];
  try {
    loadedPosthog()?.reset();
  } catch {
    // Analytique au mieux.
  }
};
