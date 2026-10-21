/**
 * Transactions : tous les boutons de la liste, pour le propriétaire,
 * l'Éditeur et le Membre de l'organisation « Achats » (jamais modifiée), et
 * ce que chaque rôle peut faire dans le tiroir d'une transaction.
 */
import { test, expect } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { verifierBoutons } from "../exploration.mjs";
import { SESSION_TOKEN_ACHATS, SESSION_TOKEN_EDITEUR_ACHATS, SESSION_TOKEN_LECTEUR_ACHATS } from "../config.mjs";
import { TRANSACTIONS } from "../donnees/lot-achats-banque.mjs";
import { connecteAchats } from "../achats-banque.mjs";

const URL = "/dashboard/outils/transactions";
const ouvrirListe = (page) => ouvrir(page, URL, { pret: page.getByRole("row").filter({ hasText: "Spotify" }) });
const tiroirDe = (page) => page.locator("div.fixed.right-0").filter({ has: page.getByRole("heading", { level: 2 }) }).last();

// Compteurs des onglets, calculés comme l'API (transaction-page-query.js) sur les données d'« Achats ».
const tx = Object.values(TRANSACTIONS);
const maintenant = new Date();
const ilYaUnMois = new Date(maintenant.getFullYear(), maintenant.getMonth() - 1, maintenant.getDate());
const sansPiece = (t) => !t.receiptFiles.length && !t.linkedInvoiceIds.length && !t.linkedPurchaseInvoiceIds.length;
const ONGLETS = {
  [`tab Toutes ${tx.length}`]: { sansEffet: "onglet déjà affiché" },
  [`tab Régler le dernier mois ${tx.filter((t) => t.date >= ilYaUnMois).length}`]: { etat: /\[selected\]/ },
  [`tab À rapprocher ${tx.filter((t) => t.amount > 0 && !["matched", "ignored"].includes(t.reconciliationStatus) && sansPiece(t)).length}`]: { etat: /\[selected\]/ },
  [`tab Justificatif manquant ${tx.filter((t) => t.amount < 0 && sansPiece(t)).length}`]: { etat: /\[selected\]/ },
};
const COMMUNS = {
  "button Masquer le solde": { parcours: "liste.spec.mjs : « Masquer le solde » le cache" },
  "button Tous les comptes": { menu: ["Tous les comptes", "Compte courant pro ···0189 12 345,67 €", "Livret pro ···0123 5 000,00 €"] },
  "button Tous les comptes > Tous les comptes": { sansEffet: "tous les comptes déjà affichés" },
  "button Tous les comptes > Compte courant pro ···0189 12 345,67 €": { contenu: true },
  "button Tous les comptes > Livret pro ···0123 5 000,00 €": { contenu: true },
  "button Respecter les majuscules et les accents": { etat: /\[pressed\]/ },
  // Sous-menu de cases à cocher : colonnes affichées.
  "button Colonnes visibles": { menu: [] },
  "button Filtres": { fenetre: "Filtres" },
  "button Go to first page": { desactive: "première page affichée" },
  "button Go to previous page": { desactive: "première page affichée" },
  "button Go to next page": { contenu: true },
  "button Go to last page": { contenu: true },
  "combobox icône chevron-down": { options: ["10", "20", "30", "40", "50"] },
  "checkbox Select all": { etat: /\[checked\]/ },
  "checkbox Select row": { etat: /\[checked\]/ },
  ...ONGLETS,
};
const ECRITURE = {
  "button Exporter": { menu: ["Excel (.xlsx)", "CSV (.csv)"] },
  "button Exporter > Excel (.xlsx)": { telechargement: /^transactions_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.xlsx$/ },
  "button Exporter > CSV (.csv)": { telechargement: /^transactions_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.csv$/ },
  "button Actions de la transaction": { menu: ["Modifier ⌘E", "Copier description ⌘C"] },
  // Ouvre le tiroir de la transaction, annoncé comme une fenêtre titrée par
  // son type (première ligne : Spotify, paiement par carte)
  "button Actions de la transaction > Modifier ⌘E": { fenetre: "Paiement par carte" },
  "button Actions de la transaction > Copier description ⌘C": { notification: /Description copiée dans le presse-papier/ },
};

test.describe("Transactions (propriétaire)", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_ACHATS) });
  verifierBoutons({ test, titre: "Transactions", ouvrir: ouvrirListe, boutons: { ...ECRITURE, ...COMMUNS } });
});

test.describe("Transactions (éditeur)", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_EDITEUR_ACHATS) });
  verifierBoutons({ test, titre: "Transactions", ouvrir: ouvrirListe, boutons: { ...ECRITURE, ...COMMUNS } });
});

test.describe("Transactions (membre, lecture seule)", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_LECTEUR_ACHATS) });
  verifierBoutons({
    test,
    titre: "Transactions",
    ouvrir: ouvrirListe,
    boutons: {
      ...COMMUNS,
      "button Actions de la transaction": { menu: ["Copier description ⌘C"] },
      "button Actions de la transaction > Copier description ⌘C": { notification: /Description copiée dans le presse-papier/ },
    },
  });
});

/** Tiroir d'une dépense sans justificatif : ce que chaque rôle peut y faire. */
for (const [role, token, peutEcrire] of [
  ["propriétaire", SESSION_TOKEN_ACHATS, true],
  ["éditeur", SESSION_TOKEN_EDITEUR_ACHATS, true],
  ["membre", SESSION_TOKEN_LECTEUR_ACHATS, false],
]) {
  test.describe(`Tiroir d'une transaction (${role})`, () => {
    test.use({ storageState: connecteAchats(token) });

    test(peutEcrire ? "Catégorie, libellé, justificatif et rattachement proposés" : "Consultation seule : ni catégorie, ni libellé, ni justificatif, ni rattachement", async ({ page }) => {
      await ouvrir(page, `${URL}?transactionId=${TRANSACTIONS.carburant._id.toHexString()}`, { pret: tiroirDe(page) });
      const tiroir = tiroirDe(page);
      await expect(tiroir.getByText(TRANSACTIONS.carburant.description).first()).toBeVisible();
      const n = peutEcrire ? 1 : 0;
      await expect(tiroir.getByRole("combobox"), "Sélecteur de catégorie").toHaveCount(n);
      await expect(tiroir.getByRole("button", { name: "Rattacher" }), "Rattacher une facture d'achat").toHaveCount(n);
      await expect(tiroir.getByText("Glissez vos justificatifs ici"), "Dépôt de justificatif").toHaveCount(n);
      const libelle = tiroir.getByPlaceholder("Description de la transaction");
      if (peutEcrire) await expect(libelle).toBeEditable();
      else expect((await libelle.count()) === 0 || !(await libelle.isEditable({ timeout: 2_000 }).catch(() => false)), "Le Membre peut modifier le libellé").toBe(true);
    });
  });
}
