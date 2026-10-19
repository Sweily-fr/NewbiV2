/**
 * Création de bons de commande dans l'éditeur (même formulaire que les
 * devis) : saisie, notification, retour à la liste et ce qui est enregistré
 * en base. Pour ajouter un cas : une entrée dans CAS.
 */
import { expect } from "../outils.mjs";
import { article, catalogueDeCreation } from "../creation.mjs";
import { remiseGlobale } from "../editeur.mjs";

/** Référence de devis libre : on la tape, puis « Utiliser "…" ». */
async function referenceDevis(page, reference) {
  await page.getByRole("combobox").filter({ hasText: "Rechercher un devis" }).click();
  await page.getByPlaceholder("Rechercher un devis...").fill(reference);
  await page.getByRole("option", { name: `Utiliser "${reference}"` }).click();
  await expect(page.getByRole("combobox").filter({ hasText: reference })).toBeVisible();
}

const CAS = [
  {
    id: "complet",
    titre: "Bon de commande complet : en attente, numéroté, bons totaux",
    articles: [article("complet", "Postes de travail", { quantite: 3, prix: 400 }), article("complet", "Installation sur site", { quantite: 1, prix: 300 })],
    attendu: { status: "CONFIRMED", totalHT: 1500, totalVAT: 300, totalTTC: 1800, numero: /^\d+$/ },
  },
  {
    id: "brouillon",
    titre: "Brouillon : enregistré sans numéro définitif",
    action: "brouillon",
    articles: [article("brouillon", "Papeterie", { quantite: 10, prix: 8 })],
    attendu: { status: "DRAFT", totalHT: 80, totalTTC: 96, numero: /^DRAFT-/ },
  },
  {
    id: "reference-devis",
    titre: "Référence du devis client enregistrée",
    avantContinuer: (page) => referenceDevis(page, "D-CLIENT-0042"),
    articles: [article("reference-devis", "Commande liée à un devis", { quantite: 1, prix: 650 })],
    attendu: { status: "CONFIRMED", purchaseOrderNumber: "D-CLIENT-0042" },
  },
  {
    id: "remise-globale",
    titre: "Remise globale de 100 €",
    articles: [article("remise-globale", "Matériel", { quantite: 2, prix: 600 })],
    avantCreation: (page) => remiseGlobale(page, { valeur: 100, type: "Montant" }),
    attendu: { status: "CONFIRMED", totalHT: 1200, discount: 100, discountType: "FIXED", finalTotalHT: 1100, finalTotalTTC: 1320 },
  },
  {
    id: "tva-multiple",
    titre: "Deux taux de TVA (20 % et 10 %)",
    articles: [article("tva-multiple", "Équipement", { quantite: 1, prix: 1000 }), article("tva-multiple", "Travaux de rénovation", { quantite: 1, prix: 500, tva: /^10%/ })],
    attendu: { status: "CONFIRMED", totalHT: 1500, totalVAT: 250, totalTTC: 1750 },
  },
];

catalogueDeCreation(
  {
    describe: "Bons de commande : création",
    editeur: "/dashboard/outils/bons-commande/new",
    liste: "/dashboard/outils/bons-commande",
    collection: "purchaseorders",
    boutonCreer: "Créer le bon de commande",
    messageCree: "Bon de commande créé avec succès",
  },
  CAS,
);
