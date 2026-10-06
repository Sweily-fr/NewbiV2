/**
 * Refus de l'API des signatures v2, pour l'utilisateur.
 *
 * Les mutations de l'éditeur partent en errorPolicy « none » (le client
 * Apollo est en « all » pour tout le site) : un refus de l'API (signature
 * supprimée, rôle, abonnement, nom déjà pris…) fait échouer la promesse au
 * lieu de passer pour une réussite.
 */

/** Fragments qui trahissent un message technique, jamais affichés. */
const TECHNICAL =
  /ValidationError|Path `|Cast to |Cannot read propert|is not a function|\bundefined\b|\bnull\b|Error:/;

/** Codes dont l'API des signatures rédige le message pour l'utilisateur. */
const WRITTEN = new Set(["VALIDATION_ERROR", "INTERNAL_ERROR"]);

/** Code applicatif d'un refus (extensions.code), sinon null. */
export function errorCode(err) {
  const extensions = err?.graphQLErrors?.[0]?.extensions;
  if (!extensions) return null;
  return (
    (extensions.code === "INTERNAL_SERVER_ERROR"
      ? extensions.exception?.code
      : extensions.code) || null
  );
}

/**
 * Raison d'un refus en une phrase, à afficher sous le titre du message
 * (« Suppression impossible »…), ou null si elle n'apprendrait rien. Les
 * refus de droits et d'abonnement sont rédigés ici : le message du serveur
 * est partagé avec les autres outils et porte un suffixe technique.
 */
export function refusalReason(err) {
  const code = errorCode(err);
  if (code === "NOT_FOUND") {
    return "Cette signature n'existe plus (supprimée depuis un autre onglet ?).";
  }
  if (code === "FORBIDDEN") {
    return "Votre rôle ne permet pas cette action. Demandez à un administrateur de l'espace.";
  }
  if (code === "SUBSCRIPTION_READ_ONLY") {
    return "Votre abonnement est inactif : renouvelez-le pour continuer.";
  }
  const message = String(err?.graphQLErrors?.[0]?.message || "").trim();
  if (WRITTEN.has(code) && message && message.length <= 300 && !TECHNICAL.test(message)) {
    return message;
  }
  if (err?.networkError) {
    return "Le serveur ne répond pas : vérifiez votre connexion internet.";
  }
  return null;
}

/** Options du toast d'un refus : sa raison, s'il y en a une. */
export function refusalToast(err) {
  const description = refusalReason(err);
  return description ? { description } : undefined;
}
