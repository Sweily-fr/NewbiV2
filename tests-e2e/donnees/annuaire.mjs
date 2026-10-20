/**
 * Annuaire des entreprises simulé (à la place de recherche-entreprises.api.gouv.fr,
 * que le site interroge via /api/search-companies) : mêmes champs que la vraie
 * réponse, résultats toujours identiques, aucun appel à Internet.
 * « erreur annuaire » simule une panne de l'annuaire.
 */
export const ENTREPRISES = [
  {
    siren: "552100554",
    nom_raison_sociale: "BOULANGERIE DU MARCHE",
    nom_complet: "BOULANGERIE DU MARCHE",
    activite_principale: "10.71C",
    forme_juridique: "SARL",
    forme_juridique_code: "5499",
    etat_administratif: "A",
    date_creation: "2010-03-01",
    siege: { siret: "55210055400013", adresse: "12 PLACE DU MARCHE 69002 LYON", code_postal: "69002", libelle_commune: "LYON" },
  },
  {
    siren: "823456789",
    nom_raison_sociale: "STUDIO GRAPHIQUE ORION",
    nom_complet: "STUDIO GRAPHIQUE ORION",
    activite_principale: "74.10Z",
    forme_juridique: "SAS",
    forme_juridique_code: "5710",
    etat_administratif: "A",
    date_creation: "2017-09-12",
    siege: { siret: "82345678900021", adresse: "5 RUE DES ARTISTES 75011 PARIS", code_postal: "75011", libelle_commune: "PARIS" },
  },
  {
    siren: "401234567",
    nom_raison_sociale: "ANCIENNE SOCIETE FERMEE",
    nom_complet: "ANCIENNE SOCIETE FERMEE",
    activite_principale: "47.11B",
    forme_juridique: "SA",
    forme_juridique_code: "5599",
    etat_administratif: "F",
    date_creation: "1995-01-01",
    siege: { siret: "40123456700019", adresse: "1 AVENUE DU PASSE 33000 BORDEAUX", code_postal: "33000", libelle_commune: "BORDEAUX" },
  },
];

const sansAccents = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Réponse de l'annuaire pour une recherche (nom, SIREN ou SIRET). */
export function rechercherAnnuaire(q) {
  const terme = sansAccents(q || "").replace(/\s+/g, "");
  const results = ENTREPRISES.filter(
    (e) => sansAccents(e.nom_raison_sociale).replace(/\s+/g, "").includes(terme) || e.siren.startsWith(terme) || e.siege.siret.startsWith(terme),
  );
  return { results, total_results: results.length, page: 1, per_page: 10, total_pages: 1 };
}

/** Branche l'annuaire simulé sur une page (fixture de outils.mjs). */
export async function brancherAnnuaire(page) {
  await page.route("**/api/search-companies?**", async (route) => {
    const q = new URL(route.request().url()).searchParams.get("q") || "";
    if (q.trim().length < 2) {
      return route.fulfill({ status: 400, json: { error: "Le terme de recherche doit contenir au moins 2 caractères" } });
    }
    if (/erreur annuaire/i.test(q)) {
      return route.fulfill({ status: 500, json: { error: "Impossible de rechercher les entreprises. Veuillez réessayer." } });
    }
    return route.fulfill({ status: 200, json: rechercherAnnuaire(q) });
  });
}
