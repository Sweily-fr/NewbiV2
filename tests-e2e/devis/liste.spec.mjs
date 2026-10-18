/**
 * Liste des devis et actions, avec le compte de l'organisation « Liste »
 * (devis pré-remplis dans chaque état, voir donnees/devis-liste.mjs). Les
 * tests qui modifient un devis ont chacun le leur ; les compteurs attendus
 * sont calculés à partir de la base au moment du test.
 */
import { test, expect, etape, verifierTextesPropres } from "../outils.mjs";
import { cliquer } from "../navigation.mjs";
import { sessionCookie, SESSION_TOKEN_LISTE } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { DEVIS_LISTE } from "../donnees/devis-liste.mjs";
import { notifications } from "../editeur.mjs";
import { actionDeLigne, date, rechercher, documentsDe, enBase, euros, ligne, onglet, ouvrirListe, ouvrirPanneau, reference, statutEnBase } from "../liste.mjs";

test.use({ storageState: { cookies: [sessionCookie(SESSION_TOKEN_LISTE)], origins: [] } });

const LISTE = "/dashboard/outils/devis";
const STATUTS = { DRAFT: "Brouillon", PENDING: "En attente", COMPLETED: "Accepté", CANCELED: "Annulé" };
const ouvrirDevis = (page) => ouvrirListe(page, LISTE, "Devis clients");
const devisEnBase = () => documentsDe("quotes", COMPTES.liste.organisation);

test.describe("Devis : liste", () => {
  test("Onglets : compteurs justes", async ({ page }) => {
    await ouvrirDevis(page);
    const devis = await devisEnBase();
    const compter = (statut) => String(devis.filter((d) => d.status === statut).length);
    const attendus = { "Tous les devis": String(devis.length), Brouillons: compter("DRAFT"), Envoyés: compter("PENDING"), Acceptés: compter("COMPLETED") };
    for (const [nom, nombre] of Object.entries(attendus)) {
      await expect.soft(onglet(page, nom), `Onglet « ${nom} »`).toHaveAccessibleName(`${nom} ${nombre}`);
    }
  });

  for (const role of ["brouillon", "envoye", "accepte", "annule"]) {
    const d = DEVIS_LISTE[role];
    test(`Ligne du devis ${reference(d)} (${STATUTS[d.status]}) : client, montant, dates, statut`, async ({ page }) => {
      await ouvrirDevis(page);
      await rechercher(page, d.number);
      const l = ligne(page, d);
      await expect(l).toHaveCount(1);
      for (const texte of [d.client.name, euros(d.finalTotalTTC), date(d.issueDate), date(d.validUntil), STATUTS[d.status]]) {
        await expect.soft(l, texte).toContainText(texte);
      }
      await verifierTextesPropres(page);
    });
  }

  test("Devis dont la validité est dépassée : date en rouge et mention « Expiré »", async ({ page }) => {
    const d = DEVIS_LISTE.expire;
    await ouvrirDevis(page);
    // La date passe en rouge, suivie d'une icône dont l'info-bulle dit « Expiré ».
    const validite = ligne(page, d).locator(".text-destructive").filter({ hasText: date(d.validUntil) });
    await expect(validite).toBeVisible();
    await validite.locator("span").first().hover();
    await expect(page.getByRole("tooltip")).toHaveText("Expiré");
    await expect(ligne(page, DEVIS_LISTE.envoye).locator(".text-destructive"), "Un devis encore valable n'est pas signalé").toHaveCount(0);
  });

  for (const [nom, roles, absents] of [
    ["Brouillons", ["brouillon"], ["envoye", "accepte"]],
    ["Envoyés", ["envoye", "expire"], ["brouillon", "accepte"]],
    ["Acceptés", ["accepte"], ["envoye", "annule"]],
  ]) {
    test(`Onglet « ${nom} » : seulement les devis concernés`, async ({ page }) => {
      await ouvrirDevis(page);
      await cliquer(page, onglet(page, nom));
      await expect(onglet(page, nom)).toHaveAttribute("aria-selected", "true");
      for (const r of roles) await expect.soft(ligne(page, DEVIS_LISTE[r]), `${r} visible`).toHaveCount(1);
      for (const r of absents) await expect.soft(ligne(page, DEVIS_LISTE[r]), `${r} absent`).toHaveCount(0);
    });
  }

  test("Recherche par la référence complète affichée dans la liste", async ({ page }) => {
    const cible = DEVIS_LISTE.accepte;
    await ouvrirDevis(page);
    await rechercher(page, reference(cible));
    await expect(ligne(page, cible), `« ${reference(cible)} » doit être trouvé`).toHaveCount(1);
    await expect(ligne(page, DEVIS_LISTE.envoye)).toHaveCount(0);
  });

  test("Recherche par client", async ({ page }) => {
    await ouvrirDevis(page);
    await page.getByPlaceholder(/Recherchez par numéro, client ou montant/).fill("Delta");
    await expect(ligne(page, DEVIS_LISTE.expire)).toHaveCount(1);
    await expect(ligne(page, DEVIS_LISTE.envoye)).toHaveCount(0);
  });

  test("Recherche par numéro", async ({ page }) => {
    await ouvrirDevis(page);
    await page.getByPlaceholder(/Recherchez par numéro, client ou montant/).fill("0003");
    await expect(ligne(page, DEVIS_LISTE.accepte)).toHaveCount(1);
    await expect(ligne(page, DEVIS_LISTE.envoye)).toHaveCount(0);
  });

  test("Clic sur un devis : panneau avec client, dates, articles et total", async ({ page }) => {
    const d = DEVIS_LISTE.envoye;
    await ouvrirDevis(page);
    await etape(page, "Ouvrir le panneau", () => ouvrirPanneau(page, d, `Devis ${reference(d)}`), { capture: "ecran" });
    for (const texte of [d.client.name, date(d.issueDate), date(d.validUntil), d.items[0].description, euros(d.finalTotalTTC)]) {
      await expect.soft(page.getByText(texte).first(), texte).toBeVisible();
    }
  });
});

test.describe("Devis : actions", () => {
  test("Accepter un devis : il passe en « Accepté »", async ({ page }) => {
    const d = DEVIS_LISTE.aAccepter;
    await ouvrirDevis(page);
    await etape(page, "Accepter le devis", async () => {
      await actionDeLigne(page, d, "Accepter le devis");
      await expect(notifications(page).filter({ hasText: "Devis accepté" })).toBeVisible();
      await statutEnBase("quotes", d).toBe("COMPLETED");
      await expect(ligne(page, d)).toContainText("Accepté");
    }, { capture: "ecran" });
  });

  test("Rejeter un devis : il passe en « Annulé »", async ({ page }) => {
    const d = DEVIS_LISTE.aRejeter;
    await ouvrirDevis(page);
    await etape(page, "Rejeter le devis", async () => {
      await actionDeLigne(page, d, "Rejeter le devis");
      await expect(notifications(page).filter({ hasText: "Devis rejeté" })).toBeVisible();
      await statutEnBase("quotes", d).toBe("CANCELED");
    }, { capture: "ecran" });
  });

  test("Créer un brouillon depuis le panneau : numéro suivant de la séquence", async ({ page }) => {
    const d = DEVIS_LISTE.brouillonAEnvoyer;
    await ouvrirDevis(page);
    await ouvrirPanneau(page, d, `Devis ${reference(d)}`);
    await etape(page, "Créer le devis", async () => {
      await cliquer(page, page.getByRole("button", { name: "Créer le devis" }));
      await expect(notifications(page).filter({ hasText: "Devis créé" })).toBeVisible();
      await statutEnBase("quotes", d).toBe("PENDING");
    }, { capture: "ecran" });
    const cree = await enBase("quotes", d);
    expect.soft(cree.number, "Numéro définitif").toMatch(/^\d+$/);
    const numeros = (await devisEnBase()).filter((x) => x.status !== "DRAFT" && !x._id.equals(d._id)).map((x) => Number(x.number));
    expect.soft(Number(cree.number), "Le numéro suit le plus grand numéro existant").toBe(Math.max(...numeros) + 1);
  });

  test("Supprimer un brouillon depuis le menu de la ligne", async ({ page }) => {
    const d = DEVIS_LISTE.brouillonASupprimer;
    await ouvrirDevis(page);
    await etape(page, "Supprimer", async () => {
      await actionDeLigne(page, d, "Supprimer");
      await expect(notifications(page).filter({ hasText: "Devis supprimé avec succès" })).toBeVisible();
      await expect.poll(() => enBase("quotes", d), { message: "Le brouillon est supprimé de la base" }).toBeNull();
      await expect(ligne(page, d)).toHaveCount(0);
    }, { capture: "ecran" });
  });

  test("Convertir un devis accepté en facture : l'éditeur de factures est pré-rempli", async ({ page }) => {
    const d = DEVIS_LISTE.accepte;
    await ouvrirDevis(page);
    await etape(page, "Convertir en facture", async () => {
      await actionDeLigne(page, d, "Convertir en facture");
      await expect(page).toHaveURL(/\/dashboard\/outils\/factures\/new/);
      await expect(page.getByRole("combobox").filter({ hasText: d.client.name })).toBeVisible();
    }, { capture: "ecran" });
    await etape(page, "Articles repris du devis", async () => {
      await page.getByRole("button", { name: /Continuer/ }).click();
      // Articles repliés : l'en-tête porte le nom de l'article.
      const nom = page.locator("#item-description-0");
      if (!(await nom.isVisible())) await page.getByRole("button", { name: new RegExp(d.items[0].description) }).first().click();
      await expect(nom).toHaveValue(d.items[0].description);
      await expect(page.locator("#item-price-0")).toHaveValue(String(d.items[0].unitPrice));
    }, { capture: "ecran" });
  });
});
