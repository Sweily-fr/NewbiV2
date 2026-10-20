/**
 * Bons de livraison : tous les boutons de chaque page, pour le propriétaire,
 * l'Éditeur et le Membre de l'organisation « Ventes » (d'après les relevés).
 * Chaque liste est ouverte avec un seul bon affiché (un bon stable par
 * statut ; un brouillon se retrouve par son transporteur). Les actions qui
 * modifient dès le clic renvoient à leur parcours.
 */
import { test, expect } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { contenu, verifierBoutons } from "../exploration.mjs";
import { connecte, SESSION_TOKEN_VENTES, SESSION_TOKEN_VENTES_EDITEUR, SESSION_TOKEN_VENTES_LECTEUR } from "../config.mjs";
import { BL_VENTES as B } from "../donnees/lot-devis-bc-bl.mjs";
import { choisirClient, continuer, ouvrirEditeur } from "../editeur.mjs";
import { dejaEssayes, epingler, idDe, ouvrirPanneau, panneau } from "../devis/ventes.mjs";

const EDITION = /\/dashboard\/outils\/bons-de-livraison\/[0-9a-f]{24}\/editer$/;
const UN_SEUL = "un seul bon affiché";

const ENTETE = { "button Nouveau bon de livraison": { navigation: "/dashboard/outils/bons-de-livraison/new" } };
const RECHERCHE = {
  "button Effacer la recherche": { contenu: true },
  "button Respecter les majuscules et les accents": { etat: /\[pressed\]/ },
  "button Filtres": { menu: ["Effacer tous les filtres", "Date d'émission", "Filtrer par client", "Filtrer par statut", "Colonnes visibles"] },
  "button Filtres > Effacer tous les filtres": { sansEffet: "aucun filtre n'est actif" },
  "button Filtres > Date d'émission": { menu: [] },
  "button Filtres > Filtrer par client": { menu: [] },
  "button Filtres > Filtrer par statut": { menu: [] },
  "button Filtres > Colonnes visibles": { menu: [] },
};
const BAS_DE_LISTE = {
  "button Première page": { desactive: UN_SEUL },
  "button Page précédente": { desactive: UN_SEUL },
  "button Page suivante": { desactive: UN_SEUL },
  "button Dernière page": { desactive: UN_SEUL },
  "tab Tous #": { sansEffet: "onglet déjà affiché" },
  "tab Brouillons #": { etat: /\[selected\]/ },
  "tab À expédier #": { etat: /\[selected\]/ },
  "tab Expédiés #": { etat: /\[selected\]/ },
  "tab Livrés #": { etat: /\[selected\]/ },
  "checkbox Sélectionner tout": { etat: /\[checked\]/ },
  "checkbox Sélectionner la ligne": { etat: /\[checked\]/ },
  "combobox icône chevron-down": { options: ["10", "20", "30", "40", "50"] },
};
const ENVOYER = { "button icône mail": { fenetre: "Envoyer le bon de livraison" } };
const VOIR = { "button Ouvrir le menu > Voir": { contenu: true } };
const MODIFIER = { "button Ouvrir le menu > Modifier": { navigation: EDITION } };
const LIVRER = { "button Ouvrir le menu > Marquer comme livré": { fenetre: "Confirmer la livraison" } };
const FACTURER = { "button Ouvrir le menu > Facturer": { parcours: "liste.spec.mjs : facturer un bon livré" } };

const MENU = {
  brouillon: (supprimer) => ({
    "button Ouvrir le menu": { menu: ["Voir", "Modifier", "Émettre le bon de livraison", ...(supprimer ? ["Supprimer"] : [])] },
    ...VOIR,
    ...MODIFIER,
    // Ouvre le panneau du brouillon (bouton « Émettre le bon de livraison »).
    "button Ouvrir le menu > Émettre le bon de livraison": { contenu: true },
    ...(supprimer ? { "button Ouvrir le menu > Supprimer": { parcours: "liste.spec.mjs : supprimer un brouillon" } } : {}),
  }),
  aExpedier: {
    ...ENVOYER,
    "button Ouvrir le menu": { menu: ["Voir", "Modifier", "Marquer comme expédié", "Marquer comme livré", "Repasser en brouillon", "Facturer", "Annuler"] },
    ...VOIR,
    ...MODIFIER,
    "button Ouvrir le menu > Marquer comme expédié": { parcours: "liste.spec.mjs : marquer comme expédié" },
    ...LIVRER,
    "button Ouvrir le menu > Repasser en brouillon": { parcours: "parcours.spec.mjs : repasser en brouillon" },
    ...FACTURER,
    "button Ouvrir le menu > Annuler": { parcours: "liste.spec.mjs : annuler un bon à expédier" },
  },
  expedie: {
    ...ENVOYER,
    "button Ouvrir le menu": { menu: ["Voir", "Modifier", "Marquer comme livré", "Facturer", "Annuler"] },
    ...VOIR,
    ...MODIFIER,
    ...LIVRER,
    ...FACTURER,
    "button Ouvrir le menu > Annuler": { parcours: "parcours.spec.mjs : annuler un bon expédié" },
  },
  livre: {
    ...ENVOYER,
    "button Ouvrir le menu": { menu: ["Voir", "Facturer"] },
    ...VOIR,
    ...FACTURER,
  },
  annule: {
    ...ENVOYER,
    "button Ouvrir le menu": { menu: ["Voir"] },
    ...VOIR,
  },
};
const LIGNES = [
  ["brouillon", B.brouillon, (s) => MENU.brouillon(s)],
  ["à expédier", B.aExpedier, () => MENU.aExpedier],
  ["expédié", B.expedie, () => MENU.expedie],
  ["livré", B.livre, () => MENU.livre],
  ["annulé", B.annule, () => MENU.annule],
];

const FERMER = { "button icône x": { contenu: true } };
// « PDF » : génération côté serveur, testée avec le fichier dans parcours.spec.mjs.
const PDF = { "button PDF": { parcours: "parcours.spec.mjs : télécharger le PDF" } };
const PANNEAU = {
  brouillon: { ...FERMER, "button Éditer": { navigation: EDITION }, "button Émettre le bon de livraison": { parcours: "liste.spec.mjs : émettre un brouillon" } },
  aExpedier: {
    ...PDF,
    ...FERMER,
    "button Repasser brouillon": { parcours: "parcours.spec.mjs : repasser en brouillon" },
    "button Marquer expédié": { parcours: "parcours.spec.mjs : expédier depuis le panneau" },
    "button Marquer comme livré": { fenetre: "Confirmer la livraison" },
    "button Envoyer": { fenetre: "Envoyer le bon de livraison" },
    "button Facturer": { parcours: "liste.spec.mjs : facturer un bon livré" },
    "button Annuler le bon de livraison": { parcours: "liste.spec.mjs : annuler un bon à expédier" },
  },
  expedie: {
    ...PDF,
    ...FERMER,
    "button Marquer comme livré": { fenetre: "Confirmer la livraison" },
    "button Envoyer": { fenetre: "Envoyer le bon de livraison" },
    "button Facturer": { parcours: "liste.spec.mjs : facturer un bon livré" },
    "button Annuler le bon de livraison": { parcours: "parcours.spec.mjs : annuler un bon expédié" },
  },
  livre: { ...PDF, ...FERMER, "button Envoyer": { fenetre: "Envoyer le bon de livraison" }, "button Facturer": { parcours: "liste.spec.mjs : facturer un bon livré" } },
  annule: { ...PDF, ...FERMER },
};

const ETAPE_CLIENT = {
  "button Paramètres": { contenu: true },
  // Dates d'émission et de livraison prévue.
  "button (date)": { fenetre: "(fenêtre sans titre)" },
  "tab Client existant": { sansEffet: "onglet déjà affiché" },
  "tab Nouveau client": { etat: /\[selected\]/ },
  "combobox icône chevron-down": { fenetre: "(fenêtre sans titre)" },
};

const ouvrirNouveau = (page) => ouvrirEditeur(page, "/dashboard/outils/bons-de-livraison/new");
const ouvrirEdition = (doc) => (page) => ouvrir(page, `/dashboard/outils/bons-de-livraison/${idDe(doc)}/editer`, { pret: page.getByText("Sélection d'un client").first() });

test.describe("Bons de livraison (propriétaire)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_VENTES) });

  const COMPLETE = "Liste des bons de livraison, bon à expédier (propriétaire)";
  for (const [statut, doc, menu] of LIGNES) {
    const communs = { ...ENTETE, ...RECHERCHE, ...BAS_DE_LISTE };
    verifierBoutons({
      test,
      titre: `Liste des bons de livraison, bon ${statut}`,
      ouvrir: (page) => epingler(page, "bl", doc),
      boutons: { ...(statut === "à expédier" ? communs : dejaEssayes(communs, COMPLETE)), ...menu(true) },
    });
  }
  verifierBoutons({
    test,
    titre: "Liste des bons de livraison, brouillon sélectionné",
    ouvrir: async (page) => {
      await epingler(page, "bl", B.brouillon);
      await page.getByRole("checkbox", { name: "Sélectionner la ligne" }).first().check();
    },
    boutons: { ...dejaEssayes({ ...ENTETE, ...RECHERCHE, ...MENU.brouillon(true), ...BAS_DE_LISTE }, COMPLETE), "button Supprimer (1)": { fenetre: "Confirmer la suppression" } },
  });

  for (const [titre, cle, doc] of [
    ["d'un brouillon", "brouillon", B.brouillon],
    ["d'un bon à expédier", "aExpedier", B.aExpedier],
    ["d'un bon expédié", "expedie", B.expedie],
    ["d'un bon livré", "livre", B.livre],
    ["d'un bon annulé", "annule", B.annule],
  ]) {
    verifierBoutons({ test, titre: `Panneau ${titre}`, ouvrir: (page) => ouvrirPanneau(page, "bl", doc), zone: panneau, boutons: PANNEAU[cle] });
  }

  verifierBoutons({
    test,
    titre: "Nouveau bon de livraison, client et livraison",
    ouvrir: ouvrirNouveau,
    boutons: {
      ...ETAPE_CLIENT,
      // « Choisir une date » : la date de livraison prévue, vide à la création.
      "button Choisir une date": { fenetre: "(fenêtre sans titre)" },
      "button Annuler": { navigation: "/dashboard/outils/bons-de-livraison" },
      "button Enregistrer brouillon": { notification: /Sélectionnez un client avant d'enregistrer/ },
      "button Continuer": { notification: /Veuillez sélectionner un client pour continuer/ },
      "checkbox Utiliser l'adresse du client": { desactive: "aucun client choisi" },
    },
  });
  verifierBoutons({
    test,
    titre: "Nouveau bon de livraison, articles",
    ouvrir: async (page) => {
      await ouvrirNouveau(page);
      await choisirClient(page, "Boulangerie Lumière SARL");
      await continuer(page);
    },
    boutons: {
      "button Paramètres": { contenu: true },
      "button Ajouter un article": { contenu: true },
      "button Options avancées": { etat: /\[expanded\]/ },
      "button Ajouter un champ personnalisé": { contenu: true },
      "button Annuler": { navigation: "/dashboard/outils/bons-de-livraison" },
      "button icône chevron-left": { contenu: true },
      "button Enregistrer brouillon": { notification: /Ajoutez au moins un article avant d'enregistrer/ },
      "button Créer le bon de livraison": { notification: /Ajoutez au moins un article/ },
      "combobox icône chevron-down": { fenetre: "(fenêtre sans titre)" },
    },
  });
  verifierBoutons({
    test,
    titre: "Modifier un brouillon, client et livraison",
    ouvrir: ouvrirEdition(B.brouillon),
    boutons: {
      ...dejaEssayes(ETAPE_CLIENT, "Nouveau bon de livraison, client et livraison"),
      "button Supprimer la sélection": { contenu: true },
      "button Annuler": { navigation: "/dashboard/outils/bons-de-livraison" },
      "button Enregistrer brouillon": { parcours: "edition.spec.mjs : enregistrer un bon modifié" },
      "button Continuer": { contenu: true },
      "checkbox Utiliser l'adresse du client": { etat: /\[checked\]|\(aucun\)/ },
    },
  });
  verifierBoutons({
    test,
    titre: "Modifier un bon à expédier, client et livraison",
    ouvrir: ouvrirEdition(B.aExpedier),
    boutons: {
      ...dejaEssayes(ETAPE_CLIENT, "Nouveau bon de livraison, client et livraison"),
      "button Supprimer la sélection": { contenu: true },
      "button Annuler": { navigation: "/dashboard/outils/bons-de-livraison" },
      "button Continuer": { contenu: true },
      "checkbox Utiliser l'adresse du client": { etat: /\[checked\]|\(aucun\)/ },
    },
  });
});

test.describe("Bons de livraison (éditeur)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_VENTES_EDITEUR) });

  for (const [statut, doc, menu] of LIGNES.filter(([s]) => ["brouillon", "à expédier", "livré"].includes(s))) {
    verifierBoutons({
      test,
      titre: `Liste des bons de livraison, bon ${statut}`,
      ouvrir: (page) => epingler(page, "bl", doc),
      boutons: dejaEssayes({ ...ENTETE, ...RECHERCHE, ...menu(false), ...BAS_DE_LISTE }, "propriétaire", ["button Ouvrir le menu"]),
    });
  }
  verifierBoutons({ test, titre: "Panneau d'un bon à expédier", ouvrir: (page) => ouvrirPanneau(page, "bl", B.aExpedier), zone: panneau, boutons: dejaEssayes(PANNEAU.aExpedier, "propriétaire") });
});

test.describe("Bons de livraison (membre, lecture seule)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_VENTES_LECTEUR) });
  const LECTURE = { ...RECHERCHE, "button Ouvrir le menu": { menu: ["Voir"] }, ...VOIR, ...BAS_DE_LISTE };

  for (const [statut, doc] of LIGNES.filter(([s]) => ["brouillon", "à expédier"].includes(s))) {
    verifierBoutons({ test, titre: `Liste des bons de livraison, bon ${statut}`, ouvrir: (page) => epingler(page, "bl", doc), boutons: dejaEssayes(LECTURE, "propriétaire", ["button Ouvrir le menu"]) });
  }
  verifierBoutons({ test, titre: "Panneau d'un bon à expédier", ouvrir: (page) => ouvrirPanneau(page, "bl", B.aExpedier), zone: panneau, boutons: dejaEssayes({ ...PDF, ...FERMER }, "propriétaire") });
  verifierBoutons({ test, titre: "Panneau d'un brouillon", ouvrir: (page) => ouvrirPanneau(page, "bl", B.brouillon), zone: panneau, boutons: dejaEssayes(FERMER, "propriétaire") });
  verifierBoutons({
    test,
    titre: "Nouveau bon de livraison : accès refusé",
    ouvrir: (page) => ouvrir(page, "/dashboard/outils/bons-de-livraison/new", { pret: page.getByRole("button", { name: "Demander l'accès" }) }),
    zone: contenu,
    boutons: {
      "button Demander l'accès": { parcours: "envoie une demande d'accès au propriétaire (notification et e-mail)" },
      "button Page précédente": { navigation: /.*/ },
      "link /dashboard/outils/bons-de-livraison": { navigation: "/dashboard/outils/bons-de-livraison" },
    },
  });

  test("Sélection d'un bon : aucune action groupée proposée", async ({ page }) => {
    await epingler(page, "bl", B.brouillon);
    await page.getByRole("checkbox", { name: "Sélectionner la ligne" }).first().check();
    await expect(page.getByRole("button", { name: /^Supprimer/ })).toHaveCount(0);
  });
});
