/**
 * Applications qui ont leur propre bloc de connexion dans leur fiche
 * (Paramètres > Applications). Les autres fiches montrent un bloc générique
 * (« Cette application nécessite une connexion », bouton sans action) : il
 * ne doit jamais s'ajouter à un bloc dédié, sinon la fiche affiche deux
 * boutons « Connecter », dont un qui ne fait rien.
 */
export const APPS_WITH_OWN_CONNECTION_PANEL = Object.freeze([
  "stripe",
  "bridge",
  "pennylane",
  "qonto",
  "abby",
  "paypal",
  "sumup",
]);

/** La fiche de cette application montre-t-elle le bloc générique ? */
export function showsGenericConnectionPanel(appId) {
  return !APPS_WITH_OWN_CONNECTION_PANEL.includes(appId);
}
