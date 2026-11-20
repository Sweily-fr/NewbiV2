/**
 * Comptage des documents créés avec les générateurs gratuits (/outils).
 *
 * Décidé le 20/11/2026 : avant toute limite d'utilisation, mesurer combien de
 * documents sont téléchargés et combien de visiteurs en font plusieurs, et
 * pousser l'inscription des habitués sans jamais bloquer le téléchargement.
 *
 * Sans donnée personnelle :
 * - le rang (« 3e document ») est retenu d'une visite à l'autre dans le
 *   navigateur SEULEMENT si le visiteur a accepté les cookies fonctionnels
 *   (stockage local, 13 mois au plus, déclaré dans les préférences cookies).
 *   Sinon, il ne vaut que pour la visite en cours, en mémoire ;
 * - le serveur ne reçoit que l'outil, le rang plafonné et la portée du
 *   comptage : ni la saisie, ni identifiant, ni cookie.
 */

export const CLE_COMPTEUR = "newbi-outils-documents";

/** Au-delà, le rang envoyé au serveur vaut « 10 ou plus ». */
export const RANG_MAX = 10;

/** Rang à partir duquel l'encart des habitués remplace l'encart habituel. */
export const SEUIL_HABITUE = 3;

// Durée de vie du compteur dans le navigateur : 13 mois depuis son dépôt.
const DUREE_MAX_MS = 395 * 24 * 60 * 60 * 1000;

// Documents créés pendant la visite (onglet ouvert), sans rien stocker.
let documentsDeLaVisite = 0;

function stockageLocal() {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function cookiesFonctionnelsAcceptes(local) {
  try {
    return JSON.parse(local.getItem("cookie_consent"))?.functional === true;
  } catch {
    return false;
  }
}

/**
 * Compte un document qui vient d'être téléchargé.
 *
 * @returns {{ rang: number, portee: "navigateur" | "visite" }} combien de
 *   documents ce navigateur a créés (portée « navigateur », cookies
 *   fonctionnels acceptés) ou cette visite (portée « visite »).
 */
export function compterDocument(maintenant = Date.now()) {
  documentsDeLaVisite += 1;
  const visite = { rang: documentsDeLaVisite, portee: "visite" };

  const local = stockageLocal();
  if (!local) return visite;

  try {
    if (!cookiesFonctionnelsAcceptes(local)) {
      // Consentement absent ou retiré : rien ne doit rester stocké.
      local.removeItem(CLE_COMPTEUR);
      return visite;
    }

    let lu = null;
    try {
      lu = JSON.parse(local.getItem(CLE_COMPTEUR) || "null");
    } catch {
      // Compteur abîmé : on repart de zéro
    }
    const valide =
      Number.isInteger(lu?.n) &&
      lu.n > 0 &&
      Number.isFinite(lu?.depuis) &&
      maintenant - lu.depuis >= 0 &&
      maintenant - lu.depuis < DUREE_MAX_MS;
    const compteur = valide
      ? { n: lu.n + 1, depuis: lu.depuis }
      : { n: 1, depuis: maintenant };

    local.setItem(CLE_COMPTEUR, JSON.stringify(compteur));
    return { rang: compteur.n, portee: "navigateur" };
  } catch {
    return visite;
  }
}

/**
 * Envoie le comptage au serveur, sans attendre la réponse ni jamais gêner le
 * téléchargement. `credentials: "omit"` : aucun cookie, donc aucun lien avec
 * un compte connecté sur le même navigateur.
 */
export function envoyerComptage({ outil, rang, portee }) {
  try {
    fetch("/api/outils/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outil, rang: Math.min(rang, RANG_MAX), portee }),
      credentials: "omit",
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Mesure au mieux : ne jamais casser l'outil.
  }
}

/** Pour les tests : repartir d'une visite neuve. */
export function _reinitialiserVisite() {
  documentsDeLaVisite = 0;
}
