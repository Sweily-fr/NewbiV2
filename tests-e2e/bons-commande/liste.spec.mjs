/**
 * Liste des bons de commande et actions, avec le compte de l'organisation
 * « Liste » (un bon par état, voir donnees/bons-commande-liste.mjs). Chaque
 * action a son bon ; les compteurs attendus sont lus en base au moment du test.
 * Cycle : brouillon → en attente → validé → en cours → livré (ou annulé).
 */
import { test, expect, etape, verifierTextesPropres } from "../outils.mjs";
import { cliquer } from "../navigation.mjs";
import { sessionCookie, SESSION_TOKEN_LISTE } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { BONS_COMMANDE_LISTE as BC } from "../donnees/bons-commande-liste.mjs";
import { notifications } from "../editeur.mjs";
import { actionDeLigne, date, rechercher, documentsDe, enBase, euros, ligne, onglet, ouvrirListe, ouvrirPanneau, reference, statutEnBase } from "../liste.mjs";

test.use({ storageState: { cookies: [sessionCookie(SESSION_TOKEN_LISTE)], origins: [] } });

const LISTE = "/dashboard/outils/bons-commande";
const STATUTS = { DRAFT: "Brouillon", CONFIRMED: "En attente", VALIDATED: "Validé", IN_PROGRESS: "En cours", DELIVERED: "Livré", CANCELED: "Annulé" };
const ouvrirBons = (page) => ouvrirListe(page, LISTE, "Bons de commande");
const bonsEnBase = () => documentsDe("purchaseorders", COMPTES.liste.organisation);

test.describe("Bons de commande : liste", () => {
  test("Onglets : compteurs justes", async ({ page }) => {
    await ouvrirBons(page);
    const bons = await bonsEnBase();
    const compter = (statut) => String(bons.filter((b) => b.status === statut).length);
    const attendus = {
      Tous: String(bons.length),
      Brouillons: compter("DRAFT"),
      "En attente": compter("CONFIRMED"),
      Validés: compter("VALIDATED"),
      "En cours": compter("IN_PROGRESS"),
      Livrés: compter("DELIVERED"),
    };
    for (const [nom, nombre] of Object.entries(attendus)) {
      await expect.soft(onglet(page, nom), `Onglet « ${nom} »`).toHaveAccessibleName(`${nom} ${nombre}`);
    }
  });

  for (const role of ["brouillon", "enAttente", "valide", "enCours", "livre", "annule"]) {
    const b = BC[role];
    test(`Ligne du bon ${reference(b)} (${STATUTS[b.status]}) : client, montant, date, statut`, async ({ page }) => {
      await ouvrirBons(page);
      await rechercher(page, b.number);
      const l = ligne(page, b);
      await expect(l).toHaveCount(1);
      for (const texte of [b.client.name, euros(b.finalTotalTTC), date(b.issueDate), STATUTS[b.status]]) {
        await expect.soft(l, texte).toContainText(texte);
      }
      await verifierTextesPropres(page);
    });
  }

  test("Référence du devis affichée sur la ligne", async ({ page }) => {
    await ouvrirBons(page);
    await expect(ligne(page, BC.enAttente)).toContainText(BC.enAttente.purchaseOrderNumber);
  });

  for (const [nom, roles, absents] of [
    ["Brouillons", ["brouillon"], ["enAttente", "livre"]],
    ["En attente", ["enAttente"], ["brouillon", "valide"]],
    ["Livrés", ["livre"], ["enCours", "annule"]],
  ]) {
    test(`Onglet « ${nom} » : seulement les bons concernés`, async ({ page }) => {
      await ouvrirBons(page);
      await cliquer(page, onglet(page, nom));
      await expect(onglet(page, nom)).toHaveAttribute("aria-selected", "true");
      for (const r of roles) await expect.soft(ligne(page, BC[r]), `${r} visible`).toHaveCount(1);
      for (const r of absents) await expect.soft(ligne(page, BC[r]), `${r} absent`).toHaveCount(0);
    });
  }

  test("Recherche par la référence complète affichée dans la liste", async ({ page }) => {
    const cible = BC.livre;
    await ouvrirBons(page);
    await rechercher(page, reference(cible));
    await expect(ligne(page, cible), `« ${reference(cible)} » doit être trouvé`).toHaveCount(1);
    await expect(ligne(page, BC.enCours)).toHaveCount(0);
  });

  test("Recherche par client", async ({ page }) => {
    await ouvrirBons(page);
    await page.getByPlaceholder(/Recherchez par numéro, client ou montant/).fill("Delta");
    await expect(ligne(page, BC.valide)).toHaveCount(1);
    await expect(ligne(page, BC.enCours)).toHaveCount(0);
  });

  test("Clic sur un bon : panneau avec client, articles et total", async ({ page }) => {
    const b = BC.enAttente;
    await ouvrirBons(page);
    await etape(page, "Ouvrir le panneau", () => ouvrirPanneau(page, b, `Bon de commande ${reference(b)}`), { capture: "ecran" });
    for (const texte of [b.client.name, date(b.issueDate), b.items[0].description, euros(b.finalTotalTTC)]) {
      await expect.soft(page.getByText(texte).first(), texte).toBeVisible();
    }
  });
});

test.describe("Bons de commande : actions", () => {
  for (const [titre, role, action, message, statut] of [
    ["Marquer comme validé : le bon passe en « Validé »", "aValider", "Marquer comme validé", "Bon de commande validé par le client", "VALIDATED"],
    ["Démarrer le traitement : le bon passe en « En cours »", "aDemarrer", "Démarrer le traitement", "Bon de commande en cours de traitement", "IN_PROGRESS"],
    ["Marquer comme livré : le bon passe en « Livré »", "aLivrer", "Marquer comme livré", "Bon de commande marqué comme livré", "DELIVERED"],
    ["Annuler un bon en attente : il passe en « Annulé »", "aAnnuler", "Annuler", "Bon de commande annulé", "CANCELED"],
  ]) {
    test(titre, async ({ page }) => {
      const b = BC[role];
      await ouvrirBons(page);
      await etape(page, action, async () => {
        await actionDeLigne(page, b, action);
        await expect(notifications(page).filter({ hasText: message })).toBeVisible();
        await statutEnBase("purchaseorders", b).toBe(statut);
        await expect(ligne(page, b)).toContainText(STATUTS[statut]);
      }, { capture: "ecran" });
    });
  }

  test("Créer un brouillon depuis le panneau : en attente, numéro suivant", async ({ page }) => {
    const b = BC.brouillonAConfirmer;
    await ouvrirBons(page);
    await ouvrirPanneau(page, b, `Bon de commande ${reference(b)}`);
    await etape(page, "Créer le bon de commande", async () => {
      await cliquer(page, page.getByRole("button", { name: "Créer le bon de commande" }));
      await expect(notifications(page).filter({ hasText: "Bon de commande mis en attente" })).toBeVisible();
      await statutEnBase("purchaseorders", b).toBe("CONFIRMED");
    }, { capture: "ecran" });
    const cree = await enBase("purchaseorders", b);
    const numeros = (await bonsEnBase()).filter((x) => x.status !== "DRAFT" && !x._id.equals(b._id)).map((x) => Number(x.number));
    expect.soft(Number(cree.number), "Le numéro suit le plus grand numéro existant").toBe(Math.max(...numeros) + 1);
  });

  test("Supprimer un brouillon depuis le menu de la ligne", async ({ page }) => {
    const b = BC.brouillonASupprimer;
    await ouvrirBons(page);
    await etape(page, "Supprimer", async () => {
      await actionDeLigne(page, b, "Supprimer");
      await expect(notifications(page).filter({ hasText: "Bon de commande supprimé avec succès" })).toBeVisible();
      await expect.poll(() => enBase("purchaseorders", b), { message: "Le brouillon est supprimé de la base" }).toBeNull();
    }, { capture: "ecran" });
  });
});
