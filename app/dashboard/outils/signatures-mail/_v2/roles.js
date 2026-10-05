/**
 * Droits sur les signatures selon le rôle dans l'espace. Un lecteur consulte
 * sans rien créer ; un refus de l'API dû au rôle (FORBIDDEN) est dit en
 * clair, le détail technique restant dans le journal du serveur.
 */

const ASK_ADMIN = "Demandez à un administrateur de l'espace.";

/** Lecteur : pourquoi la création lui est fermée (titre, puis la suite). */
export const VIEWER_TITLE =
  "Votre rôle Lecteur permet de consulter, pas de créer de signature";
export const VIEWER_HINT = ASK_ADMIN;
export const VIEWER_CANNOT_CREATE = `${VIEWER_TITLE}. ${ASK_ADMIN}`;

/** Refus de l'API dû au rôle, quelle que soit l'action. */
export const ROLE_REFUSAL = `Votre rôle ne permet pas cette action. ${ASK_ADMIN}`;

/**
 * Phrase à afficher quand l'API a refusé une action pour cause de rôle,
 * sinon null : les autres refus gardent leur propre message.
 */
export function roleRefusal(err) {
  const extensions = err?.graphQLErrors?.[0]?.extensions;
  const code =
    extensions?.code === "INTERNAL_SERVER_ERROR"
      ? extensions.exception?.code
      : extensions?.code;
  return code === "FORBIDDEN" ? ROLE_REFUSAL : null;
}
