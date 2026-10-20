/**
 * Invitation d'un cabinet vue par le client (page /invitation-gestionnaire/[id]) :
 * espaces proposés (ceux dont il est super admin et qu'aucun cabinet ne suit),
 * acceptation d'un seul des deux espaces, refus, invitation expirée. Chaque
 * réponse est vérifiée en base (fiche, membre Comptable du cabinet, preuve du
 * consentement). Une invitation par action (donnees/lot-pilotage.mjs).
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir, cliquer } from "../navigation.mjs";
import { base } from "../base.mjs";
import { id } from "../securite.mjs";
import { SESSION_TOKEN_CLIENT_CABINET, SESSION_TOKEN_PILOTAGE_EDITEUR } from "../config.mjs";
import { connecteAvecConsentement } from "../pages-publiques/consentement.mjs";
import { COMPTES, MEMBRES } from "../donnees/base.mjs";
import { CABINET, CABINET_FANTOME, ESPACES_LIBRES, INVITATIONS } from "../donnees/lot-pilotage.mjs";
import { fiche, photoGestion } from "./outils-gestionnaire.mjs";

const page_ = (invitation) => `/invitation-gestionnaire/${id(invitation)}`;
const espaceCoche = (page, nom) => page.getByRole("checkbox", { name: nom });

/** Espaces que le client peut confier : super admin, aucun cabinet actif dessus (règle de la page). */
async function espacesAConfier(utilisateurId) {
  const db = await base();
  const proprietaire = await db.collection("member").find({ userId: utilisateurId, role: "owner" }).toArray();
  const suivis = new Set((await db.collection("managedclients").find({ status: "active" }).toArray()).map((l) => String(l.organizationId)));
  const ids = proprietaire.map((m) => m.organizationId).filter((o) => !suivis.has(String(o)));
  return (await db.collection("organization").find({ _id: { $in: ids } }).toArray()).map((o) => o.companyName || o.name).sort();
}

test.describe("Invitation d'un cabinet : le client répond", () => {
  test.use({ storageState: connecteAvecConsentement(SESSION_TOKEN_CLIENT_CABINET) });

  test("La page présente le cabinet et propose ses espaces libres, pas ceux déjà suivis", async ({ page }) => {
    const attendus = await espacesAConfier(COMPTES.clientCabinet.utilisateur._id);
    await ouvrir(page, page_(INVITATIONS.fantome), { pret: page.getByRole("heading", { name: new RegExp(`^${CABINET_FANTOME.name} souhaite gérer`) }) });
    const proposes = (await page.getByRole("group").getByRole("checkbox").allInnerTexts()).map((t) => t.trim()).sort();
    expect(proposes, "Espaces proposés").toEqual(attendus);
    expect(proposes, "Un espace déjà suivi par un cabinet est proposé").not.toContain(COMPTES.clientCabinet.organisation.name);
  });

  test("Accepter sans espace coché : refusé avec un message, rien ne change", async ({ page }) => {
    await ouvrir(page, page_(INVITATIONS.fantome), { pret: page.getByRole("button", { name: /^(Accepter|Confier)/ }) });
    for (const caseCochee of await page.getByRole("checkbox", { checked: true }).all()) await caseCochee.click();
    const avant = await photoGestion();
    await cliquer(page, page.getByRole("button", { name: /^(Accepter|Confier)/ }));
    await expect(page.locator("[data-sonner-toast]").filter({ hasText: "Choisissez au moins un espace à confier" })).toBeVisible();
    expect(await photoGestion(), "La base a changé").toBe(avant);
  });

  test("Accepter en confiant un seul de ses deux espaces : fiche active, Comptable ajouté, consentement gardé", async ({ page }) => {
    const choisi = ESPACES_LIBRES.epicerie;
    await ouvrir(page, page_(INVITATIONS.aAccepter), { pret: espaceCoche(page, choisi.name) });
    // Un seul espace coché, l'autre laissé de côté
    for (const caseCochee of await page.getByRole("checkbox", { checked: true }).all()) await caseCochee.click();
    await espaceCoche(page, choisi.name).click();
    await expect(espaceCoche(page, choisi.name)).toBeChecked();
    await cliquer(page, page.getByRole("button", { name: "Accepter", exact: true }));
    await etape(page, "Confirmation affichée", () => expect(page.getByRole("heading", { name: "C'est fait" })).toBeVisible(), { capture: "ecran" });
    await etape(page, "Enregistré en base", async () => {
      const f = await fiche(INVITATIONS.aAccepter._id);
      expect(f.status).toBe("active");
      expect(String(f.organizationId)).toBe(id(choisi));
      expect(String(f.consent?.acceptedByUserId), "Preuve du consentement : qui a accepté").toBe(id(COMPTES.clientCabinet.utilisateur));
      expect(f.consent?.acceptedAt, "Preuve du consentement : quand").toBeTruthy();
      const membre = await (await base()).collection("member").findOne({ userId: MEMBRES.cabinet.utilisateur._id, organizationId: choisi._id });
      expect(membre?.role, "Le cabinet entre avec les droits Comptable").toBe("accountant");
      const autre = await (await base()).collection("member").findOne({ userId: MEMBRES.cabinet.utilisateur._id, organizationId: ESPACES_LIBRES.traiteur._id });
      expect(autre, "L'espace non coché a été confié quand même").toBeNull();
    });
  });

  test("Refuser : l'invitation est refusée, aucun accès donné", async ({ page }) => {
    await ouvrir(page, page_(INVITATIONS.aRefuser), { pret: page.getByRole("button", { name: "Refuser", exact: true }) });
    const membresAvant = await (await base()).collection("member").countDocuments({ userId: MEMBRES.cabinet.utilisateur._id });
    await cliquer(page, page.getByRole("button", { name: "Refuser", exact: true }));
    await etape(page, "Refus affiché", () => expect(page.getByRole("heading", { name: "Invitation refusée" })).toBeVisible(), { capture: "ecran" });
    const f = await fiche(INVITATIONS.aRefuser._id);
    expect(f.status).toBe("declined");
    expect(f.respondedAt).toBeTruthy();
    expect(await (await base()).collection("member").countDocuments({ userId: MEMBRES.cabinet.utilisateur._id }), "Un accès a été donné malgré le refus").toBe(membresAvant);
  });
});

test.describe("Invitation d'un cabinet : expirée", () => {
  test.use({ storageState: connecteAvecConsentement(SESSION_TOKEN_PILOTAGE_EDITEUR) });

  test("Une invitation expirée l'annonce et ne propose plus de répondre", async ({ page }) => {
    await ouvrir(page, page_(INVITATIONS.expireeAffichee), { pret: page.getByRole("heading", { name: "Invitation expirée" }) });
    await expect(page.getByText(`Demandez à ${CABINET.name} de vous envoyer une nouvelle invitation.`)).toBeVisible();
    await expect(page.getByRole("button", { name: /^(Accepter|Refuser)$/ })).toHaveCount(0);
  });
});
