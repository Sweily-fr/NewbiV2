/**
 * Vérification serveur d'un numéro SIRET auprès du registre public des
 * entreprises (API recherche-entreprises, DINUM — adossée à la base Sirene
 * de l'INSEE).
 *
 * Pourquoi côté serveur : le client fait déjà une recherche d'entreprise pour
 * l'autocomplétion, mais un client est modifiable. Tant que la seule
 * validation est un regex \d{14}, n'importe quel utilisateur peut se déclarer
 * professionnel avec 14 chiffres arbitraires. C'est exactement le trou
 * qu'Apple a relevé au titre de la règle 3.1.3(c) : rien ne prouve que l'app
 * est réservée à des entités professionnelles.
 *
 * Choix de l'API : recherche-entreprises.api.gouv.fr est publique, sans clé,
 * sans quota nominatif, et sert les mêmes données que Sirene V3. L'API INSEE
 * directe imposerait de gérer un jeu de credentials supplémentaire en prod
 * pour la même information.
 *
 * Politique d'échec : fail-closed. Si le registre est injoignable, on refuse
 * la validation avec un code distinct (`service_unavailable`) plutôt que de
 * laisser passer un SIRET non vérifié. Un utilisateur légitime réessaie ;
 * laisser passer viderait la garantie de son sens.
 */

const API_URL = "https://recherche-entreprises.api.gouv.fr/search";
const TIMEOUT_MS = 8000;
const MAX_ATTEMPTS = 2;

/**
 * Codes de refus, distincts pour que l'appelant choisisse le bon statut HTTP
 * et le bon message utilisateur.
 */
export const SIRET_VERIFICATION_ERRORS = {
  INVALID_FORMAT: "invalid_format",
  NOT_FOUND: "not_found",
  INACTIVE: "inactive",
  SERVICE_UNAVAILABLE: "service_unavailable",
};

/**
 * Un établissement est considéré actif quand son état administratif vaut "A".
 * "F" = fermé côté établissement, "C" = cessée côté unité légale.
 */
function isActiveState(state) {
  return state === "A";
}

async function fetchRegistry(siret) {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(
        `${API_URL}?q=${encodeURIComponent(siret)}&per_page=5`,
        {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "User-Agent": "Newbi/1.0 (+https://www.newbi.fr)",
          },
        },
      );

      if (!response.ok) {
        // 4xx hors 429 : la requête ne passera pas davantage au second essai.
        if (response.status !== 429 && response.status < 500) {
          throw Object.assign(new Error(`Registre HTTP ${response.status}`), {
            fatal: true,
          });
        }
        throw new Error(`Registre HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;
      if (error.fatal || attempt === MAX_ATTEMPTS) break;
      await new Promise((resolve) => setTimeout(resolve, 400));
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError ?? new Error("Registre injoignable");
}

/**
 * Retrouve, dans une réponse du registre, l'établissement dont le SIRET
 * correspond exactement. La recherche plein texte peut renvoyer des voisins :
 * on n'accepte qu'une correspondance stricte, et on regarde à la fois le
 * siège et les établissements secondaires remontés.
 */
function findEstablishment(results, siret) {
  for (const company of results) {
    if (company?.siege?.siret === siret) {
      return { company, establishment: company.siege };
    }

    const matched = (company?.matching_etablissements || []).find(
      (etab) => etab?.siret === siret,
    );
    if (matched) {
      return { company, establishment: matched };
    }
  }
  return null;
}

/**
 * Vérifie un SIRET auprès du registre.
 *
 * @param {string} siret - 14 chiffres
 * @returns {Promise<{ok: true, company: Object} | {ok: false, reason: string}>}
 *   En cas de succès, `company` porte les données à archiver comme preuve de
 *   la vérification (dénomination, code APE, date de création).
 */
export async function verifySiret(siret) {
  const normalized = String(siret ?? "").replace(/\s/g, "");

  if (!/^\d{14}$/.test(normalized)) {
    return { ok: false, reason: SIRET_VERIFICATION_ERRORS.INVALID_FORMAT };
  }

  let payload;
  try {
    payload = await fetchRegistry(normalized);
  } catch (error) {
    console.error(
      `❌ [SIRET-VERIFY] Registre injoignable pour ${normalized}:`,
      error.message,
    );
    return { ok: false, reason: SIRET_VERIFICATION_ERRORS.SERVICE_UNAVAILABLE };
  }

  const results = Array.isArray(payload?.results) ? payload.results : [];
  const match = findEstablishment(results, normalized);

  if (!match) {
    return { ok: false, reason: SIRET_VERIFICATION_ERRORS.NOT_FOUND };
  }

  const { company, establishment } = match;

  // L'établissement ET l'unité légale doivent être actifs : un établissement
  // encore ouvert dans une unité légale cessée n'est pas une entreprise en
  // activité.
  const establishmentActive = isActiveState(establishment.etat_administratif);
  const legalUnitActive = isActiveState(company.etat_administratif);

  if (!establishmentActive || !legalUnitActive) {
    return { ok: false, reason: SIRET_VERIFICATION_ERRORS.INACTIVE };
  }

  return {
    ok: true,
    company: {
      siret: normalized,
      siren: company.siren || normalized.slice(0, 9),
      denominationUniteLegale:
        company.nom_complet || company.nom_raison_sociale || "",
      activitePrincipale:
        establishment.activite_principale || company.activite_principale || "",
      natureJuridique: company.nature_juridique || "",
      dateCreation: company.date_creation || "",
      addressStreet: establishment.adresse || "",
      addressCity: establishment.libelle_commune || establishment.commune || "",
      addressZipCode: establishment.code_postal || "",
      addressCountry: "France",
    },
  };
}

/**
 * Message utilisateur associé à un code de refus. Centralisé ici pour que le
 * web et le mobile affichent exactement la même chose.
 */
export function siretVerificationMessage(reason) {
  switch (reason) {
    case SIRET_VERIFICATION_ERRORS.INVALID_FORMAT:
      return "Le numéro SIRET doit contenir exactement 14 chiffres.";
    case SIRET_VERIFICATION_ERRORS.NOT_FOUND:
      return "Ce numéro SIRET est introuvable au registre des entreprises.";
    case SIRET_VERIFICATION_ERRORS.INACTIVE:
      return "Cet établissement est radié ou fermé au registre des entreprises.";
    case SIRET_VERIFICATION_ERRORS.SERVICE_UNAVAILABLE:
      return "Le registre des entreprises est momentanément indisponible. Merci de réessayer dans quelques instants.";
    default:
      return "La vérification du numéro SIRET a échoué.";
  }
}
