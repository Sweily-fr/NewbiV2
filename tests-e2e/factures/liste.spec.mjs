/**
 * Liste des factures et actions, avec le compte de l'organisation « Liste »
 * (factures pré-remplies dans chaque état, voir donnees/factures-liste.mjs).
 * Les tests qui modifient une facture ont chacun la leur ; les compteurs
 * attendus sont calculés à partir de la base au moment du test.
 */
import { test, expect, etape, verifierTextesPropres } from "../outils.mjs";
import { base } from "../base.mjs";
import { ouvrir, cliquer, attendreCalme } from "../navigation.mjs";
import { sessionCookie, SESSION_TOKEN_LISTE } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { FACTURES_LISTE } from "../donnees/factures-liste.mjs";

test.use({ storageState: { cookies: [sessionCookie(SESSION_TOKEN_LISTE)], origins: [] } });

const LISTE = "/dashboard/outils/factures";
const euros = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n).replace(/\s/g, " ");
const date = (d) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Paris" }).format(d);
/** Numéro affiché dans la liste : préfixe + numéro, brouillons compris (« F-092026-DRAFT-0001 »). */
const numeroListe = (f) => `${f.prefix}-${f.number}`;
const STATUTS = { DRAFT: "Brouillon", PENDING: "En attente", COMPLETED: "Terminée", CANCELED: "Annulée" };

async function ouvrirListe(page) {
  await ouvrir(page, LISTE, { pret: page.getByRole("heading", { name: "Factures clients" }) });
}
const ligne = (page, f) => page.getByRole("row", { name: new RegExp(`${numeroListe(f)}\\b`) });

async function facturesEnBase() {
  return (await base()).collection("invoices").find({ workspaceId: COMPTES.liste.organisation._id }).toArray();
}
async function factureEnBase(f) {
  return (await base()).collection("invoices").findOne({ _id: f._id });
}

/** Ouvre le panneau latéral d'une facture en cliquant sur sa ligne. */
async function ouvrirPanneau(page, f, titre) {
  await cliquer(page, ligne(page, f).getByText(f.client.name));
  await expect(page.getByText(titre, { exact: true })).toBeVisible();
  await attendreCalme(page);
}

test.describe("Factures : liste", () => {
  test("Onglets : compteurs justes", async ({ page }) => {
    await ouvrirListe(page);
    const factures = await facturesEnBase();
    const aujourdhui = new Date(new Date().toDateString());
    const compter = (filtre) => String(factures.filter(filtre).length);
    const attendus = {
      "Toutes les factures": String(factures.length),
      Brouillons: compter((f) => f.status === "DRAFT"),
      "À encaisser": compter((f) => f.status === "PENDING"),
      "En retard": compter((f) => f.status === "PENDING" && new Date(f.dueDate) < aujourdhui),
      Terminées: compter((f) => f.status === "COMPLETED"),
    };
    for (const [onglet, nombre] of Object.entries(attendus)) {
      await expect.soft(page.getByRole("tab", { name: new RegExp(`^${onglet} \\d+$`) }), `Onglet « ${onglet} »`).toHaveAccessibleName(`${onglet} ${nombre}`);
    }
  });

  for (const role of ["brouillon", "aEncaisser", "enRetard", "payee", "annulee"]) {
    const f = FACTURES_LISTE[role];
    test(`Ligne de la facture ${numeroListe(f)} (${STATUTS[f.status]}) : client, montant, dates, statut`, async ({ page }) => {
      await ouvrirListe(page);
      const l = ligne(page, f);
      await expect(l).toHaveCount(1);
      for (const texte of [f.client.name, euros(f.finalTotalTTC), date(f.issueDate), date(f.dueDate), STATUTS[f.status]]) {
        await expect.soft(l, texte).toContainText(texte);
      }
      await verifierTextesPropres(page);
    });
  }

  for (const [onglet, roles, absents] of [
    ["Brouillons", ["brouillon"], ["aEncaisser", "payee"]],
    ["En retard", ["enRetard"], ["aEncaisser", "brouillon", "payee"]],
    ["Terminées", ["payee"], ["aEncaisser", "annulee"]],
  ]) {
    test(`Onglet « ${onglet} » : seulement les factures concernées`, async ({ page }) => {
      await ouvrirListe(page);
      await cliquer(page, page.getByRole("tab", { name: new RegExp(`^${onglet} \\d+$`) }));
      await expect(page.getByRole("tab", { name: new RegExp(`^${onglet} \\d+$`) })).toHaveAttribute("aria-selected", "true");
      for (const r of roles) await expect.soft(ligne(page, FACTURES_LISTE[r]), `${r} visible`).toHaveCount(1);
      for (const r of absents) await expect.soft(ligne(page, FACTURES_LISTE[r]), `${r} absente`).toHaveCount(0);
    });
  }

  test("Recherche par client", async ({ page }) => {
    await ouvrirListe(page);
    await page.getByPlaceholder(/Recherchez par numéro, client ou montant/).fill("Delta");
    await expect(ligne(page, FACTURES_LISTE.enRetard)).toHaveCount(1);
    await expect(ligne(page, FACTURES_LISTE.aEncaisser)).toHaveCount(0);
  });

  test("Recherche par numéro", async ({ page }) => {
    await ouvrirListe(page);
    await page.getByPlaceholder(/Recherchez par numéro, client ou montant/).fill("0003");
    await expect(ligne(page, FACTURES_LISTE.payee)).toHaveCount(1);
    await expect(ligne(page, FACTURES_LISTE.aEncaisser)).toHaveCount(0);
  });

  test("Clic sur une facture : panneau avec client, dates, articles et totaux", async ({ page }) => {
    const f = FACTURES_LISTE.aEncaisser;
    await ouvrirListe(page);
    await etape(page, "Ouvrir le panneau", () => ouvrirPanneau(page, f, `Facture ${numeroListe(f)}`), { capture: "ecran" });
    for (const texte of [f.client.name, f.client.email, date(f.issueDate), date(f.dueDate), f.items[0].description, euros(f.finalTotalTTC)]) {
      await expect.soft(page.getByText(texte).first(), texte).toBeVisible();
    }
  });
});

test.describe("Factures : actions", () => {
  test("Marquer comme payée : la facture passe en « Terminée »", async ({ page }) => {
    const f = FACTURES_LISTE.aMarquerPayee;
    await ouvrirListe(page);
    await ouvrirPanneau(page, f, `Facture ${numeroListe(f)}`);
    await etape(page, "Marquer comme payée", async () => {
      await cliquer(page, page.getByRole("button", { name: "Marquer comme payée" }));
      await expect(page.locator("[data-sonner-toast]").filter({ hasText: "Facture marquée comme payée" })).toBeVisible();
      await expect(page.getByText("Terminée").first()).toBeVisible();
      await expect.poll(async () => (await factureEnBase(f)).status, { message: "Statut en base" }).toBe("COMPLETED");
    }, { capture: "ecran" });
    expect((await factureEnBase(f)).paymentDate, "Date de paiement enregistrée").toBeTruthy();
  });

  test("Annuler une facture : demande confirmation, puis « Annulée »", async ({ page }) => {
    const f = FACTURES_LISTE.aAnnuler;
    await ouvrirListe(page);
    await ouvrirPanneau(page, f, `Facture ${numeroListe(f)}`);
    await etape(page, "Annuler la facture", async () => {
      await cliquer(page, page.getByRole("button", { name: "Annuler la facture" }));
      await page.getByRole("button", { name: "Confirmer l'annulation" }).click();
      await expect.poll(async () => (await factureEnBase(f)).status, { message: "Statut en base" }).toBe("CANCELED");
    }, { capture: "ecran" });
  });

  test("Valider un brouillon depuis le panneau : numéro suivant de la séquence", async ({ page }) => {
    const f = FACTURES_LISTE.brouillonAValider;
    await ouvrirListe(page);
    await ouvrirPanneau(page, f, `Facture ${numeroListe(f)}`);
    await etape(page, "Créer la facture", async () => {
      await cliquer(page, page.getByRole("button", { name: "Créer la facture" }));
      await expect.poll(async () => (await factureEnBase(f)).status, { message: "Statut en base" }).toBe("PENDING");
    }, { capture: "ecran" });
    const validee = await factureEnBase(f);
    expect.soft(validee.number, "Numéro définitif, à la suite des factures existantes").toMatch(/^\d+$/);
    const numeros = (await facturesEnBase()).filter((x) => x.status !== "DRAFT" && x._id.toString() !== f._id.toString()).map((x) => Number(x.number));
    expect.soft(Number(validee.number), "Le numéro suit le plus grand numéro existant").toBe(Math.max(...numeros) + 1);
  });

  test("Supprimer un brouillon depuis le menu de la ligne", async ({ page }) => {
    const f = FACTURES_LISTE.brouillonASupprimer;
    await ouvrirListe(page);
    await etape(page, "Supprimer", async () => {
      await cliquer(page, ligne(page, f).getByRole("button", { name: "Ouvrir le menu" }));
      await page.getByRole("menuitem", { name: "Supprimer" }).click();
      const confirmer = page.getByRole("button", { name: /^(Supprimer|Confirmer)/ }).last();
      if (await confirmer.isVisible().catch(() => false)) await confirmer.click();
      await expect.poll(async () => factureEnBase(f), { message: "Le brouillon est supprimé de la base" }).toBeNull();
      await expect(ligne(page, f)).toHaveCount(0);
    }, { capture: "ecran" });
  });
});
