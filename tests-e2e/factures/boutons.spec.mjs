/**
 * Factures : tous les boutons de chaque page, pour chaque rôle de
 * l'organisation « Factures » (propriétaire, « Éditeur », « Membre »).
 * Chaque bouton, onglet, case, liste et élément de menu est essayé sur une
 * page neuve, avec son effet attendu ; un élément présent sans description
 * fait échouer « Chaque élément de la page est décrit et testé ».
 *
 * Les compteurs des onglets (« Brouillons 11 ») changent avec les autres
 * tests : les onglets sont décrits sans eux (nomsVariables). Les actions qui
 * modifient une facture dès le clic (supprimer, valider, marquer payée,
 * enregistrer) renvoient au test qui les vérifie en entier (parcours).
 */
import { test, expect } from "../outils.mjs";
import { verifierBoutons } from "../exploration.mjs";
import { connecte, SESSION_TOKEN_FACTURES, SESSION_TOKEN_FACTURES_EDITEUR, SESSION_TOKEN_FACTURES_LECTEUR } from "../config.mjs";
import { AVOIRS_FACTURES, F } from "../donnees/lot-factures.mjs";
import {
  boutonEnTete,
  dansJours,
  etapeArticles,
  fenetreTitree,
  jourLong,
  LISTE,
  ouvrirAvoirExistant,
  ouvrirAvoirNouveau,
  ouvrirConsultation,
  ouvrirEdition,
  ouvrirListe,
  ouvrirNouvelle,
  ouvrirPanneau,
  ouvrirParametres,
  ouvrirRelances,
  panneau,
  zoneParametres,
} from "./pages.mjs";

const EDITEUR_URL = /\/dashboard\/outils\/factures\/[0-9a-f]{24}\/editer$/;
const AVOIR_URL = /\/dashboard\/outils\/factures\/[0-9a-f]{24}\/avoir\/nouveau$/;
const PDF = { telechargement: /^facture_F-092026-\d{4}\.pdf$/ };
const DEFAUT_EN_TETE = "consultation.spec.mjs : boutons de l'en-tête de la consultation";

const FILTRES = {
  "button Filtres": { menu: ["Effacer tous les filtres", "Date d'émission", "Filtrer par client", "Type de facture", "Filtrer par statut", "Colonnes visibles"] },
  "button Filtres > Effacer tous les filtres": { sansEffet: "aucun filtre n'est actif" },
  // Sous-menus de cases à cocher : voir filtres.spec.mjs pour leur effet.
  "button Filtres > Date d'émission": { menu: [] },
  "button Filtres > Filtrer par client": { menu: [] },
  "button Filtres > Type de facture": { menu: [] },
  "button Filtres > Filtrer par statut": { menu: [] },
  "button Filtres > Colonnes visibles": { menu: [] },
};
const ONGLETS = {
  "tab Toutes les factures": { sansEffet: "onglet déjà affiché" },
  "tab Brouillons": { etat: /\[selected\]/ },
  "tab À encaisser": { etat: /\[selected\]/ },
  "tab En retard": { etat: /\[selected\]/ },
  "tab Terminées": { etat: /\[selected\]/ },
  "tab Avoirs": { etat: /\[selected\]/ },
  "tab Récurrentes": { etat: /\[selected\]/ },
};
// Plus de 50 lignes (factures et factures importées) : deux pages.
const PAGINATION = {
  "button Go to first page": { desactive: "première page affichée" },
  "button Go to previous page": { desactive: "première page affichée" },
  "button Go to next page": { contenu: true },
  "button Go to last page": { contenu: true },
  "combobox icône chevron-down": { options: ["10", "20", "30", "40", "50"] },
};
const EXPORT = {
  "button Exporter": { menu: ["CSV", "Excel", "FEC (Format légal)", "Sage Compta", "Cegid Expert"] },
  "button Exporter > CSV": { fenetre: "Exporter en CSV" },
  "button Exporter > Excel": { fenetre: "Exporter en Excel" },
  "button Exporter > FEC (Format légal)": { fenetre: "Exporter en FEC (Format légal)" },
  // Réservés à l'offre Entreprise : grisés (voir exports.spec.mjs).
  "button Exporter > Sage Compta": { desactive: "offre Entreprise" },
  "button Exporter > Cegid Expert": { desactive: "offre Entreprise" },
};
const SELECTION = {
  "checkbox Sélectionner tout": { etat: /\[checked\]/ },
  "checkbox Sélectionner la ligne": { etat: /\[checked\]/ },
};
// Première ligne : le brouillon daté d'après-demain (F.brouillon).
const MENU_BROUILLON_PROPRIETAIRE = {
  "button Ouvrir le menu": { menu: ["Voir", "Sauv. modèle", "Éditer", "Créer la facture", "Supprimer"] },
  "button Ouvrir le menu > Voir": { contenu: true },
  "button Ouvrir le menu > Sauv. modèle": { fenetre: "Sauvegarder comme modèle" },
  "button Ouvrir le menu > Éditer": { navigation: EDITEUR_URL },
  // Ouvre le panneau de la facture (la validation s'y fait) : voir parcours.spec.mjs.
  "button Ouvrir le menu > Créer la facture": { contenu: true },
  "button Ouvrir le menu > Supprimer": { parcours: "parcours.spec.mjs : supprimer un brouillon depuis le menu de la ligne" },
};

// --- Propriétaire ---------------------------------------------------------------

test.describe("Factures (propriétaire)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FACTURES) });

  verifierBoutons({
    test,
    titre: "Liste des factures",
    ouvrir: ouvrirListe,
    nomsVariables: true,
    boutons: {
      // Deux boutons à icône seule, sans nom : relances (le premier) et paramètres (voir parametres.spec.mjs).
      "button ": { fenetre: "Relances automatiques" },
      "button Importer": { fenetre: "Importer des factures" },
      ...EXPORT,
      "button Nouvelle facture": { navigation: `${LISTE}/new` },
      "button Respecter les majuscules et les accents": { etat: /\[pressed\]/ },
      ...FILTRES,
      ...MENU_BROUILLON_PROPRIETAIRE,
      ...PAGINATION,
      ...ONGLETS,
      ...SELECTION,
    },
  });

  verifierBoutons({
    test,
    titre: "Liste des factures, une ligne sélectionnée",
    ouvrir: async (page) => {
      await ouvrirListe(page);
      await page.getByRole("checkbox", { name: "Sélectionner la ligne" }).first().check();
      await expect(page.getByRole("button", { name: /^Supprimer \(1\)$/ })).toBeVisible();
    },
    nomsVariables: true,
    boutons: {
      "button ": { fenetre: "Relances automatiques" },
      "button Importer": { fenetre: "Importer des factures" },
      ...EXPORT,
      "button Nouvelle facture": { navigation: `${LISTE}/new` },
      "button Respecter les majuscules et les accents": { etat: /\[pressed\]/ },
      ...FILTRES,
      "button Supprimer (1)": { fenetre: "Confirmer la suppression" },
      ...MENU_BROUILLON_PROPRIETAIRE,
      ...PAGINATION,
      ...ONGLETS,
      "checkbox Sélectionner tout": { etat: /\[checked\]/ },
      "checkbox Sélectionner la ligne": { etat: /→ \(aucun\)$/ },
    },
  });

  const zone = panneau;
  const PANNEAU_EMISE = (avecAvoirs = true) => ({
    "button Télécharger PDF": PDF,
    "button icône x": { contenu: true },
    ...(avecAvoirs ? { "button Créer": { navigation: AVOIR_URL } } : {}),
  });
  const ACTIONS_EN_ATTENTE = {
    // Aucune transaction en base : le sélecteur s'ouvre, vide.
    "button Rattacher": { contenu: true },
    "button Annuler la facture": { fenetre: "Annuler la facture ?" },
    "button Marquer comme payée": { parcours: "parcours.spec.mjs : marquer comme payée depuis le panneau" },
  };

  verifierBoutons({
    test,
    titre: "Panneau d'un brouillon",
    ouvrir: (page) => ouvrirPanneau(page, F.brouillon),
    zone,
    boutons: {
      "button icône x": { contenu: true },
      "button Éditer": { navigation: EDITEUR_URL },
      "button Créer la facture": { parcours: "parcours.spec.mjs : valider un brouillon depuis le panneau" },
    },
  });

  verifierBoutons({ test, titre: "Panneau d'une facture en attente", ouvrir: (page) => ouvrirPanneau(page, F.attente), zone, boutons: { ...PANNEAU_EMISE(), ...ACTIONS_EN_ATTENTE } });
  verifierBoutons({ test, titre: "Panneau d'une facture en retard", ouvrir: (page) => ouvrirPanneau(page, F.retard), zone, boutons: { ...PANNEAU_EMISE(), ...ACTIONS_EN_ATTENTE } });
  verifierBoutons({ test, titre: "Panneau d'une facture d'acompte", ouvrir: (page) => ouvrirPanneau(page, F.acompte), zone, boutons: { ...PANNEAU_EMISE(), ...ACTIONS_EN_ATTENTE } });
  verifierBoutons({ test, titre: "Panneau d'une facture payée", ouvrir: (page) => ouvrirPanneau(page, F.payee), zone, boutons: PANNEAU_EMISE() });
  verifierBoutons({ test, titre: "Panneau d'une facture annulée", ouvrir: (page) => ouvrirPanneau(page, F.annulee), zone, boutons: PANNEAU_EMISE() });
  verifierBoutons({
    test,
    titre: "Panneau d'une facture avec un avoir",
    ouvrir: (page) => ouvrirPanneau(page, F.avecAvoir),
    zone,
    // Deux « Télécharger PDF » : la facture, puis l'avoir (avoir-0001.pdf).
    boutons: { ...PANNEAU_EMISE(), ...ACTIONS_EN_ATTENTE },
  });

  const CONSULTATION_EMISE = (f) => ({
    "button icône arrow-left": { parcours: DEFAUT_EN_TETE },
    "button Envoyer": { parcours: DEFAUT_EN_TETE },
    "button icône ellipsis": { parcours: DEFAUT_EN_TETE },
    "button Modèles": { menu: ["Sauvegarder comme modèle"] },
    "button Modèles > Sauvegarder comme modèle": { fenetre: "Sauvegarder comme modèle" },
    "button icône settings": { contenu: true },
    "button Supprimer la sélection": { parcours: "consultation.spec.mjs : rien ne se modifie en consultation" },
    [`button ${jourLong(f.issueDate)}`]: { desactive: "facture émise" },
    [`button ${jourLong(f.dueDate)}`]: { desactive: "facture émise" },
    "button Annuler": { parcours: "consultation.spec.mjs : quitter la consultation" },
    "button Continuer": { contenu: true },
    "tab Client existant": { sansEffet: "onglet déjà affiché" },
    "tab Nouveau client": { parcours: "consultation.spec.mjs : rien ne se modifie en consultation" },
    "combobox icône chevron-down": { desactive: "facture émise" },
  });
  verifierBoutons({ test, titre: "Consultation d'une facture en attente", ouvrir: ouvrirConsultation(F.attente), boutons: CONSULTATION_EMISE(F.attente) });
  verifierBoutons({ test, titre: "Consultation d'une facture payée", ouvrir: ouvrirConsultation(F.payee), boutons: CONSULTATION_EMISE(F.payee) });

  const EDITEUR_ETAPE_1 = {
    "button icône settings": { contenu: true },
    [`button ${jourLong(new Date())}`]: { etat: /\[expanded\]/ },
    [`button ${jourLong(dansJours(30))}`]: { etat: /\[expanded\]/ },
    "button Annuler": { navigation: LISTE },
    "button Enregistrer brouillon": { notification: /Veuillez sélectionner un client/ },
    "button Continuer": { notification: /Veuillez sélectionner un client pour continuer/ },
    "tab Client existant": { sansEffet: "onglet déjà affiché" },
    "tab Nouveau client": { etat: /\[selected\]/ },
    // Recherche du client (la première des listes ; les autres : voir editeur-champs.spec.mjs).
    "combobox icône chevron-down": { etat: /\[expanded\]/ },
  };
  const MODELES_CREATION = (avecGestion) => ({
    "button Modèles": { menuContient: ["Aucun modèle", "Modèle maintenance mensuelle 2 articles", ...(avecGestion ? ["Gérer les modèles"] : [])] },
    "button Modèles > Aucun modèle": { notification: /Modèle retiré/ },
    "button Modèles > Modèle maintenance mensuelle 2 articles": { notification: /Modèle "Modèle maintenance mensuelle" appliqué/ },
    ...(avecGestion ? { "button Modèles > Gérer les modèles": { fenetre: "Gérer les modèles" } } : {}),
  });

  verifierBoutons({ test, titre: "Nouvelle facture, étape « client et informations »", ouvrir: ouvrirNouvelle, boutons: { ...MODELES_CREATION(true), ...EDITEUR_ETAPE_1 } });

  verifierBoutons({
    test,
    titre: "Nouvelle facture, étape « articles »",
    ouvrir: (page) => etapeArticles(page),
    boutons: {
      ...MODELES_CREATION(true),
      "button icône settings": { contenu: true },
      "button Ajouter un article": { contenu: true },
      "button Options avancées": { etat: /\[expanded\]/ },
      "button Ajouter un champ personnalisé": { contenu: true },
      "button Annuler": { navigation: LISTE },
      // Retour à l'étape « client et informations ».
      "button icône chevron-left": { contenu: true },
      "button Enregistrer brouillon": { notification: /Veuillez ajouter au moins un article/ },
      "button Créer la facture": { notification: /Veuillez ajouter au moins un article à la facture/ },
      "checkbox Auto-liquidation (TVA non applicable - Article 283 du CGI)": { etat: /\[checked\]/ },
      "checkbox Exonéré de TVA global (TVA à 0% par défaut sur tous les articles)": { etat: /\[checked\]/ },
      // Recherche dans le catalogue (vide) ; type de remise : voir editeur-champs.spec.mjs.
      "combobox icône chevron-down": { etat: /\[expanded\]/ },
    },
  });

  verifierBoutons({
    test,
    titre: "Édition d'un brouillon",
    ouvrir: ouvrirEdition(F.brouillon),
    boutons: {
      "button Modèles": { menu: ["Sauvegarder comme modèle"] },
      "button Modèles > Sauvegarder comme modèle": { fenetre: "Sauvegarder comme modèle" },
      "button icône settings": { contenu: true },
      // Retire le client choisi (rien n'est enregistré tant qu'on ne valide pas).
      "button Supprimer la sélection": { contenu: true },
      [`button ${jourLong(F.brouillon.issueDate)}`]: { etat: /\[expanded\]/ },
      [`button ${jourLong(F.brouillon.dueDate)}`]: { etat: /\[expanded\]/ },
      "button Annuler": { fenetre: "Quitter l'éditeur ?" },
      "button Enregistrer brouillon": { parcours: "parcours.spec.mjs : modifier un brouillon dans l'éditeur" },
      "button Continuer": { contenu: true },
      "tab Client existant": { sansEffet: "onglet déjà affiché" },
      "tab Nouveau client": { etat: /\[selected\]/ },
      "combobox icône chevron-down": { etat: /\[expanded\]/ },
    },
  });

  verifierBoutons({
    test,
    titre: "Paramètres des factures",
    ouvrir: ouvrirParametres,
    zone: zoneParametres,
    boutons: {
      "button icône x": { contenu: true },
      "button Modifier vos informations entreprise": { fenetre: "Informations de l'entreprise" },
      "button Modifier vos informations légales": { fenetre: "Informations légales" },
      "button Configurer les coordonnées bancaires": { fenetre: "Coordonnées bancaires" },
      // Couleurs : texte (sans nom, voir accessibilite), texte de l'en-tête, fond de l'en-tête.
      "button ": { etat: /\[expanded\]/ },
      "button FFFFFF": { etat: /\[expanded\]/ },
      "button 5B4FFF": { etat: /\[expanded\]/ },
      "button Au centre": { sansEffet: "position du client sur l'aperçu, aucun texte ne change" },
      "button À droite": { sansEffet: "position du client sur l'aperçu, aucun texte ne change" },
      "button Suggestions": { menuContient: [/^Remerciement standard/, /^CGV B2B standard/] },
      "button Ajouter une annexe PDF": { selecteurDeFichier: true },
      "button Annuler": { parcours: "parametres.spec.mjs : annuler sans rien changer" },
      "button Enregistrer les modifications": { parcours: "parametres.spec.mjs : enregistrer les paramètres" },
      // Numérotation séquentielle continue (interrupteur sans nom) : test dédié ci-dessous.
      "switch ": { parcours: "boutons.spec.mjs : interrupteur de la numérotation continue" },
    },
  });

  test("Paramètres des factures : l'interrupteur de la numérotation continue demande confirmation, « Annuler » ne change rien", async ({ page }) => {
    const zone = await ouvrirParametres(page);
    await zone.getByRole("switch").first().click();
    const confirmation = page.getByRole("alertdialog", { name: "Activer la numérotation séquentielle continue ?" }).or(page.getByRole("dialog", { name: "Activer la numérotation séquentielle continue ?" }));
    await expect(confirmation).toBeVisible();
    await confirmation.getByRole("button", { name: "Annuler" }).click();
    await expect(zone.getByRole("switch").first()).toHaveAttribute("aria-checked", "false");
  });

  verifierBoutons({
    test,
    titre: "Relances automatiques",
    ouvrir: ouvrirRelances,
    zone: (page) => fenetreTitree(page, "Relances automatiques"),
    boutons: {
      "button icône x": { parcours: "parametres.spec.mjs : fermer les relances sans enregistrer" },
      "button Annuler": { parcours: "parametres.spec.mjs : fermer les relances sans enregistrer" },
      "button Enregistrer": { parcours: "parametres.spec.mjs : régler les relances" },
      "tab Paramètres": { sansEffet: "onglet déjà affiché" },
      "tab Clients concernés": { etat: /\[selected\]/ },
      // Activer les relances (interrupteur sans nom).
      "switch ": { etat: /\[checked\]/ },
    },
  });

  const AVOIR_ETAPE_1 = (date) => ({
    [`button ${jourLong(date)}`]: { etat: /\[expanded\]/ },
    "button Annuler": { navigation: LISTE },
    "button Suivant": { contenu: true },
    // Type d'avoir (la première des listes) ; remboursement et nature : voir avoirs/.
    "combobox icône chevron-down": { options: ["Correction d'erreur", "Geste commercial", "Remboursement", "Rupture de stock"] },
  });
  verifierBoutons({ test, titre: "Nouvel avoir", ouvrir: ouvrirAvoirNouveau(F.attente), boutons: AVOIR_ETAPE_1(new Date()) });
  verifierBoutons({ test, titre: "Avoir existant", ouvrir: ouvrirAvoirExistant(F.avecAvoir, AVOIRS_FACTURES.existant), boutons: AVOIR_ETAPE_1(AVOIRS_FACTURES.existant.issueDate) });
});

// --- Éditeur : crée, modifie, envoie et encaisse ; ni suppression, ni annulation ---------

test.describe("Factures (éditeur)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FACTURES_EDITEUR) });

  verifierBoutons({
    test,
    titre: "Liste des factures",
    ouvrir: ouvrirListe,
    nomsVariables: true,
    boutons: {
      "button Importer": { fenetre: "Importer des factures" },
      ...EXPORT,
      "button Nouvelle facture": { navigation: `${LISTE}/new` },
      "button Respecter les majuscules et les accents": { etat: /\[pressed\]/ },
      ...FILTRES,
      "button Ouvrir le menu": { menu: ["Voir", "Sauv. modèle", "Éditer", "Créer la facture"] },
      "button Ouvrir le menu > Voir": { contenu: true },
      "button Ouvrir le menu > Sauv. modèle": { fenetre: "Sauvegarder comme modèle" },
      "button Ouvrir le menu > Éditer": { navigation: EDITEUR_URL },
      "button Ouvrir le menu > Créer la facture": { contenu: true },
      ...PAGINATION,
      ...ONGLETS,
      ...SELECTION,
    },
  });

  verifierBoutons({
    test,
    titre: "Panneau d'un brouillon",
    ouvrir: (page) => ouvrirPanneau(page, F.brouillon),
    zone: panneau,
    boutons: {
      "button icône x": { contenu: true },
      "button Éditer": { navigation: EDITEUR_URL },
      "button Créer la facture": { parcours: "parcours.spec.mjs : l'Éditeur valide un brouillon" },
    },
  });

  verifierBoutons({
    test,
    titre: "Panneau d'une facture en attente",
    ouvrir: (page) => ouvrirPanneau(page, F.attente),
    zone: panneau,
    boutons: {
      "button Télécharger PDF": PDF,
      "button icône x": { contenu: true },
      "button Créer": { navigation: AVOIR_URL },
      "button Rattacher": { contenu: true },
      "button Marquer comme payée": { parcours: "parcours.spec.mjs : l'Éditeur marque une facture payée" },
    },
  });

  verifierBoutons({
    test,
    titre: "Nouvelle facture, étape « client et informations »",
    ouvrir: ouvrirNouvelle,
    boutons: {
      "button Modèles": { menuContient: ["Aucun modèle", "Modèle maintenance mensuelle 2 articles"] },
      "button Modèles > Aucun modèle": { notification: /Modèle retiré/ },
      "button icône settings": { contenu: true },
      [`button ${jourLong(new Date())}`]: { etat: /\[expanded\]/ },
      [`button ${jourLong(dansJours(30))}`]: { etat: /\[expanded\]/ },
      "button Annuler": { navigation: LISTE },
      "button Enregistrer brouillon": { notification: /Veuillez sélectionner un client/ },
      "button Continuer": { notification: /Veuillez sélectionner un client pour continuer/ },
      "tab Client existant": { sansEffet: "onglet déjà affiché" },
      "tab Nouveau client": { etat: /\[selected\]/ },
      "combobox icône chevron-down": { etat: /\[expanded\]/ },
    },
  });

  verifierBoutons({
    test,
    titre: "Édition d'un brouillon",
    ouvrir: ouvrirEdition(F.editeurBrouillon),
    boutons: {
      "button Modèles": { menu: ["Sauvegarder comme modèle"] },
      "button Modèles > Sauvegarder comme modèle": { fenetre: "Sauvegarder comme modèle" },
      "button icône settings": { contenu: true },
      "button Supprimer la sélection": { contenu: true },
      [`button ${jourLong(F.editeurBrouillon.issueDate)}`]: { etat: /\[expanded\]/ },
      [`button ${jourLong(F.editeurBrouillon.dueDate)}`]: { etat: /\[expanded\]/ },
      "button Annuler": { fenetre: "Quitter l'éditeur ?" },
      "button Enregistrer brouillon": { parcours: "parcours.spec.mjs : l'Éditeur modifie un brouillon" },
      "button Continuer": { contenu: true },
      "tab Client existant": { sansEffet: "onglet déjà affiché" },
      "tab Nouveau client": { etat: /\[selected\]/ },
      "combobox icône chevron-down": { etat: /\[expanded\]/ },
    },
  });

  verifierBoutons({
    test,
    titre: "Nouvel avoir",
    ouvrir: ouvrirAvoirNouveau(F.attente),
    boutons: {
      [`button ${jourLong(new Date())}`]: { etat: /\[expanded\]/ },
      "button Annuler": { navigation: LISTE },
      "button Suivant": { contenu: true },
      "combobox icône chevron-down": { options: ["Correction d'erreur", "Geste commercial", "Remboursement", "Rupture de stock"] },
    },
  });

  test("La liste ne propose ni relances automatiques ni paramètres (réservés aux réglages de l'entreprise)", async ({ page }) => {
    await ouvrirListe(page);
    const enTete = page.getByRole("heading", { name: "Factures clients" }).locator("xpath=../..");
    // Les deux boutons à icône seule (relances, paramètres) sont absents ; restent Importer, Exporter, Nouvelle facture.
    const icones = await enTete.getByRole("button").evaluateAll((bs) => bs.filter((b) => !b.innerText.trim()).length);
    expect(icones, "Boutons des relances ou des paramètres visibles pour l'Éditeur").toBe(0);
  });
});

// --- Membre (lecture seule) : consulter, jamais modifier ---------------------------------

test.describe("Factures (membre, lecture seule)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FACTURES_LECTEUR) });

  verifierBoutons({
    test,
    titre: "Liste des factures",
    ouvrir: ouvrirListe,
    nomsVariables: true,
    boutons: {
      "button Respecter les majuscules et les accents": { etat: /\[pressed\]/ },
      ...FILTRES,
      "button Ouvrir le menu": { menu: ["Voir"] },
      "button Ouvrir le menu > Voir": { contenu: true },
      ...PAGINATION,
      ...ONGLETS,
      ...SELECTION,
    },
  });

  verifierBoutons({ test, titre: "Panneau d'un brouillon", ouvrir: (page) => ouvrirPanneau(page, F.brouillon), zone: panneau, boutons: { "button icône x": { contenu: true } } });
  verifierBoutons({
    test,
    titre: "Panneau d'une facture en attente",
    ouvrir: (page) => ouvrirPanneau(page, F.attente),
    zone: panneau,
    boutons: { "button Télécharger PDF": PDF, "button icône x": { contenu: true } },
  });

  verifierBoutons({
    test,
    titre: "Consultation d'une facture en attente",
    ouvrir: ouvrirConsultation(F.attente),
    boutons: {
      "button icône arrow-left": { parcours: DEFAUT_EN_TETE },
      "button icône settings": { contenu: true },
      "button Supprimer la sélection": { parcours: "consultation.spec.mjs : rien ne se modifie en consultation" },
      [`button ${jourLong(F.attente.issueDate)}`]: { desactive: "lecture seule" },
      [`button ${jourLong(F.attente.dueDate)}`]: { desactive: "lecture seule" },
      "button Annuler": { parcours: "consultation.spec.mjs : quitter la consultation" },
      "button Continuer": { contenu: true },
      "tab Client existant": { sansEffet: "onglet déjà affiché" },
      "combobox icône chevron-down": { desactive: "lecture seule" },
    },
  });

  verifierBoutons({
    test,
    titre: "Avoir existant",
    ouvrir: ouvrirAvoirExistant(F.avecAvoir, AVOIRS_FACTURES.existant),
    boutons: {
      [`button ${jourLong(AVOIRS_FACTURES.existant.issueDate)}`]: { desactive: "lecture seule" },
      "button Annuler": { navigation: LISTE },
      "button Suivant": { contenu: true },
      "combobox icône chevron-down": { desactive: "lecture seule" },
    },
  });

  for (const [nom, url] of [
    ["L'édition d'un brouillon", `${LISTE}/${F.brouillon._id.toHexString()}/editer`],
    ["La création d'un avoir", `${LISTE}/${F.attente._id.toHexString()}/avoir/nouveau`],
    ["La création d'une facture", `${LISTE}/new`],
  ]) {
    test(`${nom} : page refusée, avec une demande d'accès possible`, async ({ page }) => {
      await page.goto(url);
      await expect(page.getByRole("button", { name: "Demander l'accès" })).toBeVisible({ timeout: 30_000 });
      await expect(page.getByRole("button", { name: /Enregistrer brouillon|Créer la facture|Créer l'avoir/ })).toHaveCount(0);
    });
  }
});

// --- Accessibilité --------------------------------------------------------------------------

test.describe("Factures : boutons sans nom", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FACTURES) });

  test("Les boutons à icône seule de la liste (relances, paramètres) ont un nom pour les lecteurs d'écran", async ({ page }) => {
    await ouvrirListe(page);
    for (const rang of [0, 1]) {
      const bouton = boutonEnTete(page, rang);
      const nom = await bouton.evaluate((b) => (b.getAttribute("aria-label") || b.getAttribute("title") || b.innerText || "").trim());
      expect.soft(nom, `Le ${rang === 0 ? "bouton des relances automatiques" : "bouton des paramètres"} n'a aucun nom : un lecteur d'écran annonce seulement « bouton »`).not.toBe("");
    }
  });

  test("L'interrupteur de la numérotation continue et la couleur du texte ont un nom (paramètres)", async ({ page }) => {
    const zone = await ouvrirParametres(page);
    const sansNom = await zone.evaluate((z) =>
      [...z.querySelectorAll("button[role=switch], button")]
        .filter((b) => b.offsetParent !== null)
        .filter((b) => !(b.getAttribute("aria-label") || b.getAttribute("title") || b.innerText.trim() || b.getAttribute("aria-labelledby")))
        .map((b) => b.outerHTML.slice(0, 80)),
    );
    expect(sansNom, "Commandes sans nom dans les paramètres des factures").toEqual([]);
  });
});

