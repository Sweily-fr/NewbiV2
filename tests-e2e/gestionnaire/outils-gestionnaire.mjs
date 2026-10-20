/**
 * Outils des tests de l'espace gestionnaire : appels directs aux routes du
 * site (/api/gestionnaire/…, /api/invitations-gestionnaire/…) avec la
 * session du navigateur, état des fiches en base, retour d'une session sur
 * son espace de départ.
 */
import { base } from "../base.mjs";
import { ouvrir } from "../navigation.mjs";

/** Route du site appelée depuis la page (même origine, cookie de session). Renvoie { statut, corps }. */
export async function routeSite(page, chemin, { method = "GET", corps } = {}) {
  return page.evaluate(
    async ({ chemin, method, corps }) => {
      const res = await fetch(chemin, {
        method,
        credentials: "include",
        headers: corps === undefined ? {} : { "Content-Type": "application/json" },
        body: corps === undefined ? undefined : JSON.stringify(corps),
      });
      const texte = await res.text();
      let json = null;
      try {
        json = JSON.parse(texte);
      } catch {
        json = null;
      }
      return { statut: res.status, corps: json, texte: texte.slice(0, 300) };
    },
    { chemin, method, corps },
  );
}

/** Refus attendus des routes : le navigateur les écrit dans la console (« Failed to load resource »). */
export const REFUS_ROUTES = /the server responded with a status of 40\d/;

export const fiches = async () => (await base()).collection("managedclients");
export const fiche = async (id) => (await fiches()).findOne({ _id: id });
/** Toutes les fiches gestionnaire/client et les membres : un refus ne doit rien changer. */
export async function photoGestion() {
  const db = await base();
  const [liens, membres, utilisateurs, verifications] = await Promise.all([
    db.collection("managedclients").find({}).sort({ _id: 1 }).toArray(),
    db.collection("member").find({}).sort({ _id: 1 }).toArray(),
    db.collection("user").countDocuments(),
    db.collection("verification").countDocuments(),
  ]);
  return JSON.stringify({ liens: liens.map(({ updatedAt, ...l }) => l), membres, utilisateurs, verifications });
}

/** Remet la session sur un espace : un test qui change d'espace ne doit pas déplacer les suivants. */
export async function remettreEspace(token, organisationId) {
  await (await base()).collection("session").updateOne({ token }, { $set: { activeOrganizationId: organisationId.toHexString() } });
}

/** Page d'une liste de l'espace gestionnaire, une fois son tableau affiché. */
export async function ouvrirListe(page, chemin) {
  await ouvrir(page, chemin, { pret: page.locator("main table") });
}

/** Lignes du tableau d'une liste (texte de chaque ligne du corps). */
export async function lignes(page) {
  return (await page.locator("main table tbody tr").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
}
