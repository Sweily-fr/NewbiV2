/**
 * Liste des bons de livraison et actions, avec le compte de l'organisation
 * « Liste » (un bon par état, voir donnees/bons-livraison-liste.mjs). Chaque
 * action a son bon ; les compteurs attendus sont lus en base au moment du test.
 * Cycle : brouillon → à expédier → expédié → livré (ou annulé), puis facturé.
 */
import { test, expect, etape, verifierTextesPropres } from "../outils.mjs";
import { cliquer, attendreCalme } from "../navigation.mjs";
import { sessionCookie, SESSION_TOKEN_LISTE } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { BONS_LIVRAISON_LISTE as BL, referenceBonLivraison } from "../donnees/bons-livraison-liste.mjs";
import { notifications } from "../editeur.mjs";
import { date, documentsDe, rechercher, enBase, onglet, ouvrirListe, statutEnBase } from "../liste.mjs";
import { LISTE } from "./editeur.mjs";

test.use({ storageState: { cookies: [sessionCookie(SESSION_TOKEN_LISTE)], origins: [] } });

const STATUTS = { DRAFT: "Brouillon", PENDING: "À expédier", SHIPPED: "Expédié", DELIVERED: "Livré", CANCELED: "Annulé" };
const ouvrirBons = (page) => ouvrirListe(page, LISTE, "Bons de livraison");
const bonsEnBase = () => documentsDe("deliverynotes", COMPTES.liste.organisation);

/** Ligne d'un bon : par sa référence, ou par son transporteur pour un brouillon (affiché « Brouillon »). */
const ligne = (page, b) =>
  b.status === "DRAFT"
    ? page.getByRole("row").filter({ hasText: b.carrier })
    : page.getByRole("row", { name: new RegExp(`${referenceBonLivraison(b)}\\b`) });

async function actionDeLigne(page, b, action) {
  await cliquer(page, ligne(page, b).getByRole("button", { name: "Ouvrir le menu" }));
  await page.getByRole("menuitem", { name: action }).click();
}

async function ouvrirPanneau(page, b) {
  await cliquer(page, ligne(page, b).getByText(b.client.name));
  await expect(page.getByRole("heading", { name: `Bon de livraison ${referenceBonLivraison(b)}` })).toBeVisible();
  await attendreCalme(page);
}

test.describe("Bons de livraison : liste", () => {
  test("Onglets : compteurs justes", async ({ page }) => {
    await ouvrirBons(page);
    const bons = await bonsEnBase();
    const compter = (statut) => String(bons.filter((b) => b.status === statut).length);
    const attendus = { Tous: String(bons.length), Brouillons: compter("DRAFT"), "À expédier": compter("PENDING"), Expédiés: compter("SHIPPED"), Livrés: compter("DELIVERED") };
    for (const [nom, nombre] of Object.entries(attendus)) {
      await expect.soft(onglet(page, nom), `Onglet « ${nom} »`).toHaveAccessibleName(`${nom} ${nombre}`);
    }
  });

  for (const role of ["brouillon", "aExpedier", "expedie", "livre", "annule"]) {
    const b = BL[role];
    test(`Ligne du bon ${referenceBonLivraison(b)} (${STATUTS[b.status]}) : client, dates, transport, statut`, async ({ page }) => {
      await ouvrirBons(page);
      await rechercher(page, b.status === "DRAFT" ? b.carrier : referenceBonLivraison(b));
      const l = ligne(page, b);
      await expect(l).toHaveCount(1);
      // Le numéro de suivi est une colonne masquée par défaut : il se cherche, il ne s'affiche pas.
      for (const texte of [b.client.name, date(b.issueDate), date(b.deliveryDate), b.carrier, STATUTS[b.status]].filter(Boolean)) {
        await expect.soft(l, texte).toContainText(texte);
      }
      await verifierTextesPropres(page);
    });
  }

  for (const [nom, roles, absents] of [
    ["Brouillons", ["brouillon"], ["aExpedier", "livre"]],
    ["À expédier", ["aExpedier"], ["expedie", "brouillon"]],
    ["Livrés", ["livre"], ["expedie", "annule"]],
  ]) {
    test(`Onglet « ${nom} » : seulement les bons concernés`, async ({ page }) => {
      await ouvrirBons(page);
      await cliquer(page, onglet(page, nom));
      await expect(onglet(page, nom)).toHaveAttribute("aria-selected", "true");
      for (const r of roles) await expect.soft(ligne(page, BL[r]), `${r} visible`).toHaveCount(1);
      for (const r of absents) await expect.soft(ligne(page, BL[r]), `${r} absent`).toHaveCount(0);
    });
  }

  test("Recherche par transporteur", async ({ page }) => {
    await ouvrirBons(page);
    await page.getByPlaceholder(/Recherchez par numéro, client, transporteur ou suivi/).fill("DHL");
    await expect(ligne(page, BL.expedie)).toHaveCount(1);
    await expect(ligne(page, BL.aExpedier)).toHaveCount(0);
  });

  test("Recherche par numéro de suivi", async ({ page }) => {
    await ouvrirBons(page);
    await page.getByPlaceholder(/Recherchez par numéro, client, transporteur ou suivi/).fill(BL.aMarquerLivre.trackingNumber);
    await expect(ligne(page, BL.aMarquerLivre)).toHaveCount(1);
    await expect(ligne(page, BL.expedie)).toHaveCount(0);
  });

  test("Clic sur un bon : panneau avec client, articles et transporteur", async ({ page }) => {
    const b = BL.aExpedier;
    await ouvrirBons(page);
    await etape(page, "Ouvrir le panneau", () => ouvrirPanneau(page, b), { capture: "ecran" });
    for (const texte of [b.client.name, b.carrier, ...b.items.map((a) => a.description)]) {
      await expect.soft(page.getByText(texte).first(), texte).toBeVisible();
    }
  });
});

test.describe("Bons de livraison : actions", () => {
  test("Émettre un brouillon depuis le panneau : à expédier, numéroté", async ({ page }) => {
    const b = BL.brouillonAEmettre;
    await ouvrirBons(page);
    await ouvrirPanneau(page, b);
    await etape(page, "Émettre le bon de livraison", async () => {
      await cliquer(page, page.getByRole("button", { name: "Émettre le bon de livraison" }));
      await expect(notifications(page).filter({ hasText: "Bon de livraison émis, à expédier" })).toBeVisible();
      await statutEnBase("deliverynotes", b).toBe("PENDING");
    }, { capture: "ecran" });
    expect((await enBase("deliverynotes", b)).number, "Numéro définitif").toMatch(/^\d+$/);
  });

  test("Marquer comme expédié : le bon passe en « Expédié »", async ({ page }) => {
    const b = BL.aMarquerExpedie;
    await ouvrirBons(page);
    await etape(page, "Marquer comme expédié", async () => {
      await actionDeLigne(page, b, "Marquer comme expédié");
      await expect(notifications(page).filter({ hasText: "Bon de livraison marqué comme expédié" })).toBeVisible();
      await statutEnBase("deliverynotes", b).toBe("SHIPPED");
    }, { capture: "ecran" });
  });

  test("Marquer comme livré : confirmation de réception, puis « Livré »", async ({ page }) => {
    const b = BL.aMarquerLivre;
    await ouvrirBons(page);
    await etape(page, "Confirmer la livraison", async () => {
      await actionDeLigne(page, b, "Marquer comme livré");
      const fenetre = page.getByRole("dialog").filter({ hasText: "Confirmer la livraison" });
      await expect(fenetre).toBeVisible();
      await fenetre.locator("#reception-received-by").fill("Claire Martin");
      await fenetre.getByRole("button", { name: "Marquer comme livré" }).click();
      await expect(notifications(page).filter({ hasText: "Bon de livraison marqué comme livré" })).toBeVisible();
      await statutEnBase("deliverynotes", b).toBe("DELIVERED");
    }, { capture: "ecran" });
    expect((await enBase("deliverynotes", b)).receivedBy, "Réceptionnaire enregistré").toBe("Claire Martin");
  });

  test("Annuler un bon à expédier : il passe en « Annulé »", async ({ page }) => {
    const b = BL.aAnnuler;
    await ouvrirBons(page);
    await etape(page, "Annuler", async () => {
      await actionDeLigne(page, b, "Annuler");
      await expect(notifications(page).filter({ hasText: "Bon de livraison annulé" })).toBeVisible();
      await statutEnBase("deliverynotes", b).toBe("CANCELED");
    }, { capture: "ecran" });
  });

  test("Facturer un bon livré : facture brouillon créée et liée", async ({ page }) => {
    const b = BL.aFacturer;
    await ouvrirBons(page);
    await etape(page, "Facturer", async () => {
      await actionDeLigne(page, b, "Facturer");
      await expect(notifications(page).filter({ hasText: "Facture brouillon créée à partir du bon de livraison" })).toBeVisible();
      await expect(page).toHaveURL(/\/dashboard\/outils\/factures\/[0-9a-f]{24}\/editer/);
    }, { capture: "ecran" });
    const factureId = page.url().match(/factures\/([0-9a-f]{24})\//)[1];
    const lie = await enBase("deliverynotes", b);
    // Identifiants Mongo (ObjectId) ou objets { _id } selon la forme enregistrée.
    const liees = (lie.linkedInvoices || []).map((x) => (typeof x?.toHexString === "function" ? x.toHexString() : String(x?._id ?? x)));
    expect(liees, "Facture liée au bon de livraison").toContain(factureId);
  });

  test("Supprimer un brouillon depuis le menu de la ligne", async ({ page }) => {
    const b = BL.brouillonASupprimer;
    await ouvrirBons(page);
    await etape(page, "Supprimer", async () => {
      await actionDeLigne(page, b, "Supprimer");
      await expect(notifications(page).filter({ hasText: "Bon de livraison supprimé" })).toBeVisible();
      await expect.poll(() => enBase("deliverynotes", b), { message: "Le brouillon est supprimé de la base" }).toBeNull();
    }, { capture: "ecran" });
  });
});
