/**
 * Bons de commande : tous les boutons de chaque page, pour le propriétaire,
 * l'Éditeur et le Membre de l'organisation « Ventes » (d'après les relevés).
 * Chaque liste est ouverte avec un seul bon affiché (un bon stable par
 * statut). Les actions qui modifient dès le clic renvoient à leur parcours.
 */
import { test, expect } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { contenu, verifierBoutons } from "../exploration.mjs";
import { connecte, SESSION_TOKEN_VENTES, SESSION_TOKEN_VENTES_EDITEUR, SESSION_TOKEN_VENTES_LECTEUR } from "../config.mjs";
import { BC_VENTES as B } from "../donnees/lot-devis-bc-bl.mjs";
import { choisirClient, continuer, ouvrirEditeur } from "../editeur.mjs";
import { dejaEssayes, epingler, idDe, ouvrirPanneau, panneau } from "../devis/ventes.mjs";

const EDITION = /\/dashboard\/outils\/bons-commande\/[0-9a-f]{24}\/editer$/;
const UN_SEUL = "un seul bon affiché";

const EXPORT = {
  "button Exporter": { menu: ["CSV", "Excel", "FEC (Format légal)", "Sage Compta", "Cegid Expert"] },
  "button Exporter > CSV": { fenetre: "Exporter en CSV" },
  "button Exporter > Excel": { fenetre: "Exporter en Excel" },
  "button Exporter > FEC (Format légal)": { fenetre: "Exporter en FEC" },
  "button Exporter > Sage Compta": { fenetre: "Exporter en Sage Compta" },
  "button Exporter > Cegid Expert": { fenetre: "Exporter en Cegid Expert" },
};
const ENTETE_EDITEUR = {
  "button Importer": { fenetre: "Importer des bons de commande" },
  ...EXPORT,
  "button Nouveau bon de commande": { navigation: "/dashboard/outils/bons-commande/new" },
};
// Paramètres des bons de commande : bouton sans nom (propriétaire seulement).
const ENTETE = { "button ": { contenu: true }, ...ENTETE_EDITEUR };
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
  "button Go to first page": { desactive: UN_SEUL },
  "button Go to previous page": { desactive: UN_SEUL },
  "button Go to next page": { desactive: UN_SEUL },
  "button Go to last page": { desactive: UN_SEUL },
  "tab Tous #": { sansEffet: "onglet déjà affiché" },
  "tab Brouillons #": { etat: /\[selected\]/ },
  "tab En attente #": { etat: /\[selected\]/ },
  "tab Validés #": { etat: /\[selected\]/ },
  "tab En cours #": { etat: /\[selected\]/ },
  "tab Livrés #": { etat: /\[selected\]/ },
  // Libellés sans accent dans le site (« Selectionner »).
  "checkbox Selectionner tout": { etat: /\[checked\]/ },
  "checkbox Selectionner la ligne": { etat: /\[checked\]/ },
  "combobox icône chevron-down": { options: ["10", "20", "30", "40", "50"] },
};
const VOIR = {
  "button Ouvrir le menu > Voir": { contenu: true },
  "button Ouvrir le menu > Sauv. modèle": { fenetre: "Sauvegarder comme modèle" },
};
const ENVOYER = { "button icône mail": { fenetre: "Envoyer le bon de commande" } };
const CONVERTIR = { "button Ouvrir le menu > Convertir en facture": { navigation: "/dashboard/outils/factures/new" } };

const MENU = {
  brouillon: (supprimer) => ({
    "button Ouvrir le menu": { menu: ["Voir", "Sauv. modèle", "Modifier", "Confirmer", ...(supprimer ? ["Supprimer"] : [])] },
    ...VOIR,
    "button Ouvrir le menu > Modifier": { navigation: EDITION },
    // Ouvre le panneau du brouillon (bouton « Créer le bon de commande »).
    "button Ouvrir le menu > Confirmer": { contenu: true },
    ...(supprimer ? { "button Ouvrir le menu > Supprimer": { parcours: "liste.spec.mjs : supprimer un brouillon" } } : {}),
  }),
  enAttente: {
    ...ENVOYER,
    "button Ouvrir le menu": { menu: ["Voir", "Sauv. modèle", "Modifier", "Marquer comme validé", "Repasser en brouillon", "Annuler"] },
    ...VOIR,
    "button Ouvrir le menu > Modifier": { navigation: EDITION },
    "button Ouvrir le menu > Marquer comme validé": { parcours: "liste.spec.mjs : marquer comme validé" },
    "button Ouvrir le menu > Repasser en brouillon": { parcours: "parcours.spec.mjs : repasser en brouillon" },
    "button Ouvrir le menu > Annuler": { parcours: "liste.spec.mjs : annuler un bon en attente" },
  },
  valide: {
    ...ENVOYER,
    "button Ouvrir le menu": { menu: ["Voir", "Sauv. modèle", "Démarrer le traitement", "Convertir en facture"] },
    ...VOIR,
    "button Ouvrir le menu > Démarrer le traitement": { parcours: "liste.spec.mjs : démarrer le traitement" },
    ...CONVERTIR,
  },
  enCours: {
    ...ENVOYER,
    "button Ouvrir le menu": { menu: ["Voir", "Sauv. modèle", "Marquer comme livré", "Convertir en facture"] },
    ...VOIR,
    "button Ouvrir le menu > Marquer comme livré": { parcours: "liste.spec.mjs : marquer comme livré" },
    ...CONVERTIR,
  },
  livre: {
    ...ENVOYER,
    "button Ouvrir le menu": { menu: ["Voir", "Sauv. modèle", "Convertir en facture"] },
    ...VOIR,
    ...CONVERTIR,
  },
  annule: {
    ...ENVOYER,
    "button Ouvrir le menu": { menu: ["Voir", "Sauv. modèle"] },
    ...VOIR,
  },
};
const LIGNES = [
  ["brouillon", B.brouillon, (s) => MENU.brouillon(s)],
  ["en attente", B.enAttente, () => MENU.enAttente],
  ["validé", B.valide, () => MENU.valide],
  ["en cours", B.enCours, () => MENU.enCours],
  ["livré", B.livre, () => MENU.livre],
  ["annulé", B.annule, () => MENU.annule],
];

const pdf = (doc) => ({ "button Télécharger PDF": { telechargement: new RegExp(`^bon-de-commande_${doc.prefix}-${doc.number}\\.pdf$`) } });
const FERMER = { "button icône x": { contenu: true } };
const PANNEAU = {
  brouillon: { ...FERMER, "button Éditer": { navigation: EDITION }, "button Créer le bon de commande": { parcours: "liste.spec.mjs : créer un brouillon depuis le panneau" } },
  enAttente: (d) => ({
    ...pdf(d),
    ...FERMER,
    "button Repasser brouillon": { parcours: "parcours.spec.mjs : repasser en brouillon" },
    "button Valider": { parcours: "parcours.spec.mjs : valider depuis le panneau" },
    "button Annuler le bon de commande": { parcours: "liste.spec.mjs : annuler un bon en attente" },
  }),
  valide: (d) => ({ ...pdf(d), ...FERMER, "button Démarrer le traitement": { parcours: "liste.spec.mjs : démarrer le traitement" }, "button Convertir en facture": { navigation: "/dashboard/outils/factures/new" } }),
  enCours: (d) => ({
    ...pdf(d),
    ...FERMER,
    "button Marquer comme livré": { parcours: "liste.spec.mjs : marquer comme livré" },
    "button Convertir en facture": { navigation: "/dashboard/outils/factures/new" },
  }),
  livre: (d) => ({ ...pdf(d), ...FERMER, "button Convertir en facture": { navigation: "/dashboard/outils/factures/new" } }),
  annule: (d) => ({ ...pdf(d), ...FERMER }),
};

// « Modèles » : la liste des modèles de bons de commande de l'espace (un modèle est semé).
const MODELES = { "button Modèles": { menuContient: ["Aucun modèle"] } };
const ETAPE_CLIENT = {
  "button icône settings": { contenu: true },
  "button (date)": { fenetre: "(fenêtre sans titre)" },
  "tab Client existant": { sansEffet: "onglet déjà affiché" },
  "tab Nouveau client": { etat: /\[selected\]/ },
  "combobox icône chevron-down": { fenetre: "(fenêtre sans titre)" },
};
const NOUVEAU = {
  ...ETAPE_CLIENT,
  ...MODELES,
  "button Annuler": { navigation: "/dashboard/outils/bons-commande" },
  "button Enregistrer brouillon": { notification: /Veuillez sélectionner un client/ },
  "button Continuer": { notification: /Veuillez sélectionner un client pour continuer/ },
};
const EDITION_ETAPE_CLIENT = {
  ...ETAPE_CLIENT,
  "button Modèles": { menu: ["Sauvegarder comme modèle"] },
  "button Modèles > Sauvegarder comme modèle": { fenetre: "Sauvegarder comme modèle" },
  "button Supprimer la sélection": { contenu: true },
  "button Annuler": { fenetre: "Quitter l'éditeur ?" },
  "button Enregistrer brouillon": { parcours: "edition.spec.mjs : enregistrer un bon modifié" },
  "button Continuer": { contenu: true },
};
const ARTICLES = {
  ...MODELES,
  "button icône settings": { contenu: true },
  "button Ajouter un article": { contenu: true },
  "button Options avancées": { etat: /\[expanded\]/ },
  "button Ajouter un champ personnalisé": { contenu: true },
  "button Annuler": { navigation: "/dashboard/outils/bons-commande" },
  "button icône chevron-left": { contenu: true },
  "button Enregistrer brouillon": { notification: /Veuillez ajouter au moins un article au bon de commande/ },
  "button Créer le bon de commande": { notification: /Veuillez ajouter au moins un article au bon de commande/ },
  "checkbox Auto-liquidation (TVA non applicable - Article 283 du CGI)": { etat: /\[checked\]/ },
  "checkbox Exonéré de TVA global (TVA à 0% par défaut sur tous les articles)": { etat: /\[checked\]/ },
  "combobox icône chevron-down": { fenetre: "(fenêtre sans titre)" },
};

const ouvrirNouveau = (page) => ouvrirEditeur(page, "/dashboard/outils/bons-commande/new");
const ouvrirEdition = (doc) => (page) => ouvrir(page, `/dashboard/outils/bons-commande/${idDe(doc)}/editer`, { pret: page.getByText("Sélection d'un client").first() });

test.describe("Bons de commande (propriétaire)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_VENTES) });

  const COMPLETE = "Liste des bons de commande, bon en attente (propriétaire)";
  for (const [statut, doc, menu] of LIGNES) {
    const communs = { ...ENTETE, ...RECHERCHE, ...BAS_DE_LISTE };
    verifierBoutons({
      test,
      titre: `Liste des bons de commande, bon ${statut}`,
      ouvrir: (page) => epingler(page, "bc", doc),
      boutons: { ...(statut === "en attente" ? communs : dejaEssayes(communs, COMPLETE)), ...menu(true) },
    });
  }
  verifierBoutons({
    test,
    titre: "Liste des bons de commande, brouillon sélectionné",
    ouvrir: async (page) => {
      await epingler(page, "bc", B.brouillon);
      await page.getByRole("checkbox", { name: "Selectionner la ligne" }).first().check();
    },
    boutons: { ...dejaEssayes({ ...ENTETE, ...RECHERCHE, ...MENU.brouillon(true), ...BAS_DE_LISTE }, COMPLETE), "button Supprimer (1)": { fenetre: "Confirmer la suppression" } },
  });

  verifierBoutons({ test, titre: "Panneau d'un brouillon", ouvrir: (page) => ouvrirPanneau(page, "bc", B.brouillon), zone: panneau, boutons: PANNEAU.brouillon });
  for (const [titre, cle, doc] of [
    ["en attente", "enAttente", B.enAttente],
    ["validé", "valide", B.valide],
    ["en cours", "enCours", B.enCours],
    ["livré", "livre", B.livre],
    ["annulé", "annule", B.annule],
  ]) {
    verifierBoutons({ test, titre: `Panneau d'un bon ${titre}`, ouvrir: (page) => ouvrirPanneau(page, "bc", doc), zone: panneau, boutons: PANNEAU[cle](doc) });
  }

  verifierBoutons({ test, titre: "Nouveau bon de commande, client et informations", ouvrir: ouvrirNouveau, boutons: NOUVEAU });
  verifierBoutons({
    test,
    titre: "Nouveau bon de commande, articles",
    ouvrir: async (page) => {
      await ouvrirNouveau(page);
      await choisirClient(page, "Boulangerie Lumière SARL");
      await continuer(page);
    },
    boutons: ARTICLES,
  });
  const PROPRES_EDITION = ["button Modèles", "button Modèles > Sauvegarder comme modèle", "button Supprimer la sélection", "button Annuler", "button Continuer"];
  verifierBoutons({ test, titre: "Modifier un brouillon, client et informations", ouvrir: ouvrirEdition(B.brouillon), boutons: dejaEssayes(EDITION_ETAPE_CLIENT, "Nouveau bon de commande, client et informations", PROPRES_EDITION) });
  verifierBoutons({
    test,
    titre: "Modifier un bon en attente, client et informations",
    ouvrir: ouvrirEdition(B.enAttente),
    // Ce bon porte la référence d'un devis : elle peut être effacée.
    boutons: { ...dejaEssayes(EDITION_ETAPE_CLIENT, "Modifier un brouillon, client et informations"), "button Effacer la référence": { contenu: true } },
  });
});

test.describe("Bons de commande (éditeur)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_VENTES_EDITEUR) });

  for (const [statut, doc, menu] of LIGNES.filter(([s]) => ["brouillon", "en attente", "livré"].includes(s))) {
    verifierBoutons({
      test,
      titre: `Liste des bons de commande, bon ${statut}`,
      ouvrir: (page) => epingler(page, "bc", doc),
      boutons: dejaEssayes({ ...ENTETE_EDITEUR, ...RECHERCHE, ...menu(false), ...BAS_DE_LISTE }, "propriétaire", ["button Ouvrir le menu"]),
    });
  }
  verifierBoutons({ test, titre: "Panneau d'un bon en attente", ouvrir: (page) => ouvrirPanneau(page, "bc", B.enAttente), zone: panneau, boutons: dejaEssayes(PANNEAU.enAttente(B.enAttente), "propriétaire") });
  verifierBoutons({ test, titre: "Nouveau bon de commande, client et informations", ouvrir: ouvrirNouveau, boutons: dejaEssayes(NOUVEAU, "propriétaire") });
});

test.describe("Bons de commande (membre, lecture seule)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_VENTES_LECTEUR) });
  const LECTURE = { ...RECHERCHE, "button Ouvrir le menu": { menu: ["Voir"] }, "button Ouvrir le menu > Voir": { contenu: true }, ...BAS_DE_LISTE };

  for (const [statut, doc] of LIGNES.filter(([s]) => ["brouillon", "en attente"].includes(s))) {
    verifierBoutons({ test, titre: `Liste des bons de commande, bon ${statut}`, ouvrir: (page) => epingler(page, "bc", doc), boutons: dejaEssayes(LECTURE, "propriétaire", ["button Ouvrir le menu"]) });
  }
  verifierBoutons({ test, titre: "Panneau d'un bon en attente", ouvrir: (page) => ouvrirPanneau(page, "bc", B.enAttente), zone: panneau, boutons: dejaEssayes({ ...pdf(B.enAttente), ...FERMER }, "propriétaire") });
  verifierBoutons({
    test,
    titre: "Nouveau bon de commande : accès refusé",
    ouvrir: (page) => ouvrir(page, "/dashboard/outils/bons-commande/new", { pret: page.getByRole("button", { name: "Demander l'accès" }) }),
    zone: contenu,
    boutons: {
      "button Demander l'accès": { parcours: "envoie une demande d'accès au propriétaire (notification et e-mail)" },
      "button Page précédente": { navigation: /.*/ },
      "link /dashboard/outils/bons-commande": { navigation: "/dashboard/outils/bons-commande" },
    },
  });

  test("Sélection d'un bon : aucune action groupée proposée", async ({ page }) => {
    await epingler(page, "bc", B.brouillon);
    await page.getByRole("checkbox", { name: "Selectionner la ligne" }).first().check();
    await expect(page.getByRole("button", { name: /^Supprimer/ })).toHaveCount(0);
  });
});
