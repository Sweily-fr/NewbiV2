/**
 * Plafonds de l'offre pour les membres et les espaces (src/lib/plan-limits.js) :
 *   - offre d'entrée (« freelance ») : rôles Membre, Éditeur, Comptable
 *     seulement (pas d'Administrateur), un siège payant au plus, un espace ;
 *   - essai en cours (aucun abonnement) : inviter est réservé aux offres payantes.
 * L'interface les applique (liste des rôles, /api/billing/check-user-limit) ;
 * le serveur doit les appliquer aussi, sinon un appel direct à Better Auth
 * les contourne.
 */
import { test, expect } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { base } from "../base.mjs";
import { connecte } from "../config.mjs";
import { COMPTES_AUTH } from "../donnees/lot-parametres-auth.mjs";
import { appelAuth } from "../authentification/outils-auth.mjs";

const REFUS_CONSOLE = /status of 4\d\d.*\/api\/auth\//;
const invitations = async (orgId, filtre = {}) => (await base()).collection("invitation").find({ organizationId: orgId, ...filtre }).toArray();

test.describe("Offre d'entrée : membres et espaces", () => {
  test.use({ storageState: connecte(COMPTES_AUTH.offreFreelance.token), erreursConsoleAutorisees: REFUS_CONSOLE });
  const compte = COMPTES_AUTH.offreFreelance;
  const ORG = compte.organisation._id;
  test.beforeEach(async ({ page }) => {
    await ouvrir(page, "/mentions-legales");
  });

  test("Inviter un Administrateur (absent de l'offre) : refusé par le serveur", async ({ page }) => {
    const r = await appelAuth(page, "/organization/invite-member", { corps: { email: "admin-hors-offre@e2e.test", role: "admin", organizationId: ORG.toHexString() } });
    const creees = await invitations(ORG, { email: "admin-hors-offre@e2e.test" });
    expect(creees, `Invitation comme Administrateur acceptée sur l'offre d'entrée (statut ${r.statut})`).toEqual([]);
  });

  test("Inviter deux Éditeurs (un seul siège payant possible) : le second est refusé", async ({ page }) => {
    for (const email of ["editeur-un-offre@e2e.test", "editeur-deux-offre@e2e.test"]) {
      await appelAuth(page, "/organization/invite-member", { corps: { email, role: "member", organizationId: ORG.toHexString() } });
    }
    const creees = await invitations(ORG, { role: "member", status: "pending" });
    expect(creees.length, `${creees.length} invitations d'Éditeur acceptées pour un seul siège payant possible`).toBeLessThanOrEqual(1);
  });

  test("Créer un second espace (un seul compris dans l'offre) : refusé par le serveur", async ({ page }) => {
    const r = await appelAuth(page, "/organization/create", { corps: { name: "Second espace hors offre", slug: "second-espace-hors-offre-e2e" } });
    const cree = await (await base()).collection("organization").findOne({ slug: "second-espace-hors-offre-e2e" });
    expect(cree, `Second espace créé sur l'offre d'entrée (statut ${r.statut})`).toBeNull();
  });
});

test.describe("Essai en cours : inviter est réservé aux offres payantes", () => {
  test.use({ storageState: connecte(COMPTES_AUTH.essaiEnCours.token), erreursConsoleAutorisees: REFUS_CONSOLE });
  test("Inviter pendant l'essai : refusé par le serveur, avec une explication", async ({ page }) => {
    await ouvrir(page, "/mentions-legales");
    const ORG = COMPTES_AUTH.essaiEnCours.organisation._id;
    const r = await appelAuth(page, "/organization/invite-member", { corps: { email: "invite-pendant-essai@e2e.test", role: "viewer", organizationId: ORG.toHexString() } });
    expect(r.statut).toBeGreaterThanOrEqual(400);
    expect(JSON.stringify(r.corps)).toMatch(/abonnement payant/);
    expect(await invitations(ORG)).toEqual([]);
  });
});
