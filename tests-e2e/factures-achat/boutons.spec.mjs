/**
 * Factures d'achat : tous les boutons de la liste et de la fiche (tiroir)
 * d'une facture à payer et d'une facture payée rapprochée, pour le
 * propriétaire, l'Éditeur et le Membre de l'organisation « Achats » (jamais
 * modifiée). Les actions qui modifient dès le clic renvoient à leur parcours
 * (liste.spec.mjs).
 */
import { test, expect } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { verifierBoutons } from "../exploration.mjs";
import { SESSION_TOKEN_ACHATS, SESSION_TOKEN_EDITEUR_ACHATS, SESSION_TOKEN_LECTEUR_ACHATS } from "../config.mjs";
import { FACTURES_ACHAT, FACTURES_ACHAT_REMPLISSAGE } from "../donnees/lot-achats-banque.mjs";
import { connecteAchats } from "../achats-banque.mjs";

const URL = "/dashboard/outils/factures-achat";
const ouvrirListe = (page) => ouvrir(page, URL, { pret: page.getByRole("row").filter({ hasText: FACTURES_ACHAT.adobe.invoiceNumber }) });
const tiroir = (f) => (page) => page.getByRole("dialog").filter({ hasText: f.supplierName }).first();
const ouvrirFiche = (f) => async (page) => {
  await ouvrir(page, `${URL}?id=${f._id.toHexString()}`, { pret: tiroir(f)(page) });
  await page.waitForTimeout(800);
};

// Compteurs des onglets, depuis les données de « Achats ».
const factures = [...Object.values(FACTURES_ACHAT), ...FACTURES_ACHAT_REMPLISSAGE];
const nb = (statut) => factures.filter((f) => f.status === statut).length;
const ONGLETS = {
  [`tab Toutes ${factures.length}`]: { sansEffet: "onglet déjà affiché" },
  [`tab À payer ${nb("TO_PAY")}`]: { etat: /\[selected\]/ },
  [`tab En retard ${nb("OVERDUE")}`]: { etat: /\[selected\]/ },
  [`tab Payées ${nb("PAID")}`]: { etat: /\[selected\]/ },
};
const COMMUNS = {
  "button Respecter les majuscules et les accents": { etat: /\[pressed\]/ },
  "button Filtres": { menu: ["Effacer tous les filtres", "Date d'émission", "Statut", "Catégorie", "Colonnes visibles"] },
  "button Filtres > Effacer tous les filtres": { sansEffet: "aucun filtre n'est actif" },
  // Sous-menus de cases à cocher et de dates : voir liste.spec.mjs pour leur effet.
  "button Filtres > Date d'émission": { menu: [] },
  "button Filtres > Statut": { menu: [] },
  "button Filtres > Catégorie": { menu: [] },
  "button Filtres > Colonnes visibles": { menu: [] },
  "button Fournisseur": { contenu: true },
  "button Montant TTC": { contenu: true },
  "button Date d'émission": { contenu: true },
  "button Date d'échéance": { contenu: true },
  "button Date de paiement": { contenu: true },
  "button Première page": { desactive: "première page affichée" },
  "button Page précédente": { desactive: "première page affichée" },
  "button Page suivante": { contenu: true },
  "button Dernière page": { contenu: true },
  "combobox icône chevron-down": { options: ["10", "25", "50", "100"] },
  ...ONGLETS,
};
const CREATION = {
  "button Exporter": { fenetre: "Exporter les factures" },
  "button Nouvelle facture": { menu: ["Saisie manuelle", "Importer (scan/OCR)", "Automatiser (Gmail)"] },
  "button Nouvelle facture > Saisie manuelle": { fenetre: "Nouvelle facture d'achat" },
  "button Nouvelle facture > Importer (scan/OCR)": { fenetre: "Nouvelle facture d'achat" },
  "button Nouvelle facture > Automatiser (Gmail)": { fenetre: "Automatisation Gmail" },
  "button Actions groupées": { desactive: "aucune facture cochée" },
  "checkbox Tout sélectionner": { etat: /\[checked\]/ },
  "checkbox Sélectionner": { etat: /\[checked\]/ },
};
// Menu de la première ligne : la facture la plus récente, payée (pas de « Marquer payée »).
const MENU_LIGNE = (avecSuppression) => ({
  "button icône ellipsis": { menu: ["Voir", "Archiver", "Catégoriser", ...(avecSuppression ? ["Supprimer"] : [])] },
  "button icône ellipsis > Voir": { fenetre: "Détail de la facture" },
  "button icône ellipsis > Archiver": { parcours: "liste.spec.mjs : menu d'une ligne « Archiver »" },
  "button icône ellipsis > Catégoriser": { menuContient: ["Fournitures de bureau", "Logiciels"] },
  ...(avecSuppression ? { "button icône ellipsis > Supprimer": { fenetre: "Confirmer la suppression" } } : {}),
});

const FICHE_A_PAYER = (avecSuppression) => ({
  "button icône x": { sansEffet: "ferme la fiche" },
  "button Ajouter": { selecteurDeFichier: true },
  "button icône upload": { selecteurDeFichier: true },
  "button Rechercher une transaction": { parcours: "liste.spec.mjs : rapprocher avec une transaction" },
  "button Modifier": { fenetre: "Modifier la facture" },
  "button Payée": { parcours: "liste.spec.mjs : « Payée » dans la fiche" },
  ...(avecSuppression ? { "button icône trash2": { fenetre: "Supprimer cette facture ?" } } : {}),
});
const FICHE_RAPPROCHEE = (avecSuppression) => ({
  "button icône x": { sansEffet: "ferme la fiche" },
  "button Ajouter": { selecteurDeFichier: true },
  "button icône upload": { selecteurDeFichier: true },
  "button Détacher cette transaction": { parcours: "liste.spec.mjs : détacher la transaction" },
  "button Rattacher une autre transaction": { parcours: "liste.spec.mjs : rapprocher de deux virements" },
  "button Modifier": { fenetre: "Modifier la facture" },
  ...(avecSuppression ? { "button icône trash2": { fenetre: "Supprimer cette facture ?" } } : {}),
  "link /dashboard/outils/transactions": { navigation: /\/dashboard\/outils\/transactions\?transactionId=/ },
});

test.describe("Factures d'achat (propriétaire)", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_ACHATS) });
  verifierBoutons({ test, titre: "Factures d'achat", ouvrir: ouvrirListe, boutons: { ...CREATION, "button Supprimer": { desactive: "aucune facture cochée" }, ...COMMUNS, ...MENU_LIGNE(true) } });
  verifierBoutons({ test, titre: "Fiche d'une facture à payer", ouvrir: ouvrirFiche(FACTURES_ACHAT.hotel), zone: tiroir(FACTURES_ACHAT.hotel), boutons: FICHE_A_PAYER(true) });
  verifierBoutons({ test, titre: "Fiche d'une facture payée et rapprochée", ouvrir: ouvrirFiche(FACTURES_ACHAT.adobe), zone: tiroir(FACTURES_ACHAT.adobe), boutons: FICHE_RAPPROCHEE(true) });
});

test.describe("Factures d'achat (éditeur)", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_EDITEUR_ACHATS) });
  verifierBoutons({ test, titre: "Factures d'achat", ouvrir: ouvrirListe, boutons: { ...CREATION, ...COMMUNS, ...MENU_LIGNE(false) } });
  verifierBoutons({ test, titre: "Fiche d'une facture à payer", ouvrir: ouvrirFiche(FACTURES_ACHAT.hotel), zone: tiroir(FACTURES_ACHAT.hotel), boutons: FICHE_A_PAYER(false) });
  verifierBoutons({ test, titre: "Fiche d'une facture payée et rapprochée", ouvrir: ouvrirFiche(FACTURES_ACHAT.adobe), zone: tiroir(FACTURES_ACHAT.adobe), boutons: FICHE_RAPPROCHEE(false) });
});

test.describe("Factures d'achat (membre, lecture seule)", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_LECTEUR_ACHATS) });
  verifierBoutons({
    test,
    titre: "Factures d'achat",
    ouvrir: ouvrirListe,
    boutons: { ...COMMUNS, "button icône ellipsis": { menu: ["Voir"] }, "button icône ellipsis > Voir": { fenetre: "Détail de la facture" } },
  });
  verifierBoutons({ test, titre: "Fiche d'une facture à payer", ouvrir: ouvrirFiche(FACTURES_ACHAT.hotel), zone: tiroir(FACTURES_ACHAT.hotel), boutons: { "button icône x": { sansEffet: "ferme la fiche" } } });
  verifierBoutons({
    test,
    titre: "Fiche d'une facture payée et rapprochée",
    ouvrir: ouvrirFiche(FACTURES_ACHAT.adobe),
    zone: tiroir(FACTURES_ACHAT.adobe),
    boutons: { "button icône x": { sansEffet: "ferme la fiche" }, "link /dashboard/outils/transactions": { navigation: /\/dashboard\/outils\/transactions\?transactionId=/ } },
  });

  test("Aucune case à cocher ni action groupée", async ({ page }) => {
    await ouvrirListe(page);
    await expect(page.getByRole("checkbox")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Actions groupées" })).toHaveCount(0);
  });
});
