/**
 * Logger de performance pour le kanban — utilisé pour mesurer l'ouverture
 * d'une tâche (du clic à l'affichage complet du modal).
 *
 * Activation côté utilisateur (en prod, dans la console DevTools) :
 *   localStorage.setItem('kanban-perf', '1'); location.reload();
 * Désactivation :
 *   localStorage.removeItem('kanban-perf'); location.reload();
 *
 * Ou via URL : ?perf=1
 */

let enabled = null;
let lastMark = null;
let sessionStart = null;

function isEnabled() {
  if (enabled !== null) return enabled;
  if (typeof window === "undefined") {
    enabled = false;
    return false;
  }
  try {
    enabled =
      window.localStorage?.getItem("kanban-perf") === "1" ||
      window.location?.search?.includes("perf=1");
  } catch {
    enabled = false;
  }
  return enabled;
}

export function perfMark(label, data) {
  if (!isEnabled()) return;
  const now =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  if (sessionStart === null) {
    sessionStart = now;
    lastMark = now;

    console.log(
      "%c[KANBAN-PERF] === Session start ===",
      "color:#5A50FF;font-weight:bold",
    );
  }
  const sinceStart = (now - sessionStart).toFixed(1);
  const sinceLast = (now - lastMark).toFixed(1);
  const dataStr = data ? ` ${JSON.stringify(data)}` : "";

  console.log(
    `%c[KANBAN-PERF] %c${label}%c +${sinceLast}ms · total ${sinceStart}ms${dataStr}`,
    "color:#5A50FF;font-weight:bold",
    "color:#0a7;font-weight:bold",
    "color:#888",
  );
  lastMark = now;
}

/**
 * Réinitialise la session de mesure. Appelée automatiquement quand on
 * démarre un nouveau cycle (clic sur une nouvelle tâche).
 */
export function perfReset() {
  if (!isEnabled()) return;
  sessionStart = null;
  lastMark = null;
}

/**
 * Mesure un callback synchrone et log sa durée.
 */
export function perfMeasure(label, fn) {
  if (!isEnabled()) return fn();
  const start =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  const result = fn();
  const end =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  perfMark(`${label} (${(end - start).toFixed(1)}ms)`);
  return result;
}
