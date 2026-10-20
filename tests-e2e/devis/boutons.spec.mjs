/**
 * Devis : tous les boutons de chaque page, pour le propriétaire, l'Éditeur et
 * le Membre de l'organisation « Ventes » (d'après les relevés des pages).
 * Chaque liste est ouverte avec un seul devis affiché (recherché par sa
 * référence) : un devis stable par statut, jamais modifié. Les compteurs des
 * onglets changent avec les données : « tab Brouillons # ». Les actions qui
 * modifient dès le clic renvoient à leur parcours.
 */
import { test, expect } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { contenu, verifierBoutons } from "../exploration.mjs";
import { connecte, SESSION_TOKEN_VENTES, SESSION_TOKEN_VENTES_EDITEUR, SESSION_TOKEN_VENTES_LECTEUR } from "../config.mjs";
import { DEVIS_VENTES as D } from "../donnees/lot-devis-bc-bl.mjs";
import { choisirClient, continuer, ouvrirEditeur } from "../editeur.mjs";
import { dejaEssayes, epingler, idDe, ouvrirPanneau, panneau } from "./ventes.mjs";

const EDITION = /\/dashboard\/outils\/devis\/[0-9a-f]{24}\/editer$/;
const RIEN_A_FILTRER = "aucun filtre n'est actif";
const UN_SEUL = "un seul devis affiché";

const EXPORT = {
  "button Exporter": { menu: ["CSV", "Excel", "FEC (Format légal)", "Sage Compta", "Cegid Expert"] },
  "button Exporter > CSV": { fenetre: "Exporter en CSV" },
  "button Exporter > Excel": { fenetre: "Exporter en Excel" },
  "button Exporter > FEC (Format légal)": { fenetre: "Exporter en FEC" },
  "button Exporter > Sage Compta": { fenetre: "Exporter en Sage Compta" },
  "button Exporter > Cegid Expert": { fenetre: "Exporter en Cegid Expert" },
};
const ENTETE = {
  // Paramètres des devis : bouton sans nom (voir « accessibilité » plus bas).
  "button ": { contenu: true },
  "button Importer": { fenetre: "Importer des devis" },
  ...EXPORT,
  "button Nouveau devis": { navigation: "/dashboard/outils/devis/new" },
};
const ENTETE_EDITEUR = {
  "button Importer": { fenetre: "Importer des devis" },
  ...EXPORT,
  "button Nouveau devis": { navigation: "/dashboard/outils/devis/new" },
};
const RECHERCHE = {
  "button Effacer la recherche": { contenu: true },
  "button Respecter les majuscules et les accents": { etat: /\[pressed\]/ },
};
const FILTRES = {
  "button Filtres": { menu: ["Effacer tous les filtres", "Date d'émission", "Filtrer par client", "Filtrer par statut", "Colonnes visibles"] },
  "button Filtres > Effacer tous les filtres": { sansEffet: RIEN_A_FILTRER },
  // Sous-menus de cases à cocher : leur effet est vérifié par liste-ventes.spec.mjs.
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
  "tab Tous les devis #": { sansEffet: "onglet déjà affiché" },
  "tab Brouillons #": { etat: /\[selected\]/ },
  "tab Envoyés #": { etat: /\[selected\]/ },
  "tab Acceptés #": { etat: /\[selected\]/ },
  "checkbox Sélectionner tout": { etat: /\[checked\]/ },
  "checkbox Sélectionner la ligne": { etat: /\[checked\]/ },
  "combobox icône chevron-down": { options: ["10", "20", "30", "40", "50"] },
};
const ENVOYER = { "button icône mail": { fenetre: "Envoyer le devis" } };
const VOIR = {
  "button Ouvrir le menu > Voir": { contenu: true },
  "button Ouvrir le menu > Sauv. modèle": { fenetre: "Sauvegarder comme modèle" },
};

/** Menu de ligne par statut (propriétaire ; l'Éditeur n'a pas « Supprimer »). */
const MENU = {
  brouillon: (supprimer) => ({
    "button Ouvrir le menu": { menu: ["Voir", "Sauv. modèle", "Éditer", "Envoyer le devis", ...(supprimer ? ["Supprimer"] : [])] },
    ...VOIR,
    "button Ouvrir le menu > Éditer": { navigation: EDITION },
    // Le libellé dit « Envoyer » mais l'action ouvre le panneau du brouillon (bouton « Créer le devis »).
    "button Ouvrir le menu > Envoyer le devis": { contenu: true },
    ...(supprimer ? { "button Ouvrir le menu > Supprimer": { parcours: "parcours.spec.mjs : supprimer des brouillons" } } : {}),
  }),
  enAttente: {
    ...ENVOYER,
    "button Ouvrir le menu": { menu: ["Voir", "Sauv. modèle", "Éditer", "Accepter le devis", "Créer un bon de livraison", "Faire signer", "Rejeter le devis"] },
    ...VOIR,
    "button Ouvrir le menu > Éditer": { navigation: EDITION },
    "button Ouvrir le menu > Accepter le devis": { parcours: "liste.spec.mjs : accepter un devis" },
    "button Ouvrir le menu > Créer un bon de livraison": { parcours: "parcours.spec.mjs : bon de livraison depuis un devis" },
    "button Ouvrir le menu > Faire signer": { fenetre: /^Faire signer/ },
    "button Ouvrir le menu > Rejeter le devis": { parcours: "liste.spec.mjs : rejeter un devis" },
  },
  accepte: {
    ...ENVOYER,
    "button Ouvrir le menu": { menu: ["Voir", "Sauv. modèle", "Convertir en facture", "Convertir en bon de commande", "Créer un bon de livraison"] },
    ...VOIR,
    "button Ouvrir le menu > Convertir en facture": { navigation: "/dashboard/outils/factures/new" },
    "button Ouvrir le menu > Convertir en bon de commande": { navigation: "/dashboard/outils/bons-commande/new" },
    "button Ouvrir le menu > Créer un bon de livraison": { parcours: "parcours.spec.mjs : bon de livraison depuis un devis" },
  },
  refuse: {
    ...ENVOYER,
    "button Ouvrir le menu": { menu: ["Voir", "Sauv. modèle"] },
    ...VOIR,
  },
};

const LIGNES = [
  ["brouillon", D.brouillon],
  ["en attente", D.enAttente],
  ["accepté", D.accepte],
  ["refusé", D.refuse],
];
const LISTE_COMPLETE = "Liste des devis, devis en attente (propriétaire)";
const menuDe = (statut, supprimer = true) => (statut === "brouillon" ? MENU.brouillon(supprimer) : MENU[{ "en attente": "enAttente", accepté: "accepte", refusé: "refuse" }[statut]]);

/** Panneau d'un devis, par statut. */
const PANNEAU = {
  brouillon: {
    "button icône x": { contenu: true },
    "button Éditer": { navigation: EDITION },
    "button Créer le devis": { parcours: "liste.spec.mjs : créer un brouillon depuis le panneau" },
  },
  enAttente: (doc) => ({
    "button Télécharger PDF": { telechargement: new RegExp(`^devis_${doc.prefix}-${doc.number}\\.pdf$`) },
    "button icône x": { contenu: true },
    "button Annuler le devis": { parcours: "parcours.spec.mjs : refuser depuis le panneau" },
    "button Accepter le devis": { parcours: "parcours.spec.mjs : accepter depuis le panneau" },
  }),
  accepte: (doc) => ({
    "button Télécharger PDF": { telechargement: new RegExp(`^devis_${doc.prefix}-${doc.number}\\.pdf$`) },
    "button icône x": { contenu: true },
    "button Créer une facture liée": { fenetre: "Créer une facture liée au devis" },
    "button Conversion complète": { navigation: "/dashboard/outils/factures/new" },
    "button Convertir en bon de commande": { navigation: "/dashboard/outils/bons-commande/new" },
  }),
  refuse: (doc) => ({
    "button Télécharger PDF": { telechargement: new RegExp(`^devis_${doc.prefix}-${doc.number}\\.pdf$`) },
    "button icône x": { contenu: true },
  }),
};

/** Éditeur : première étape (client et informations). */
const ETAPE_CLIENT = (modeles) => ({
  "button Modèles": modeles,
  "button icône settings": { contenu: true },
  // Dates d'émission et de validité : un calendrier s'ouvre (nom = la date du jour).
  "button (date)": { fenetre: "(fenêtre sans titre)" },
  "tab Client existant": { sansEffet: "onglet déjà affiché" },
  "tab Nouveau client": { etat: /\[selected\]/ },
  // Premier choix : le client (une liste avec recherche s'ouvre).
  "combobox icône chevron-down": { fenetre: "(fenêtre sans titre)" },
});
const MODELES_CREATION = (gerer) => ({ menuContient: ["Aucun modèle", "Modèle Ventes stable 1 article", ...(gerer ? ["Gérer les modèles"] : [])] });
const NOUVEAU_ETAPE_CLIENT = (gerer) => ({
  ...ETAPE_CLIENT(MODELES_CREATION(gerer)),
  "button Modèles > Aucun modèle": { notification: /Modèle retiré/ },
  "button Modèles > Modèle Ventes stable 1 article": { notification: /Modèle "Modèle Ventes stable" appliqué/ },
  ...(gerer ? { "button Modèles > Gérer les modèles": { fenetre: "Gérer les modèles" } } : {}),
  "button Annuler": { navigation: "/dashboard/outils/devis" },
  "button Enregistrer brouillon": { notification: /Veuillez sélectionner un client/ },
  "button Continuer": { notification: /Veuillez sélectionner un client pour continuer/ },
});
const EDITION_ETAPE_CLIENT = {
  ...ETAPE_CLIENT({ menu: ["Sauvegarder comme modèle"] }),
  "button Modèles > Sauvegarder comme modèle": { fenetre: "Sauvegarder comme modèle" },
  "button Supprimer la sélection": { contenu: true },
  "button Annuler": { fenetre: "Quitter l'éditeur ?" },
  "button Enregistrer brouillon": { parcours: "edition.spec.mjs : enregistrer un devis modifié" },
  "button Continuer": { contenu: true },
};
const ETAPE_ARTICLES = {
  "button icône settings": { contenu: true },
  "button Ajouter un article": { contenu: true },
  "button Options avancées": { etat: /\[expanded\]/ },
  "button Ajouter un champ personnalisé": { contenu: true },
  "button icône chevron-left": { contenu: true },
  "checkbox Auto-liquidation (TVA non applicable - Article 283 du CGI)": { etat: /\[checked\]/ },
  "checkbox Exonéré de TVA global (TVA à 0% par défaut sur tous les articles)": { etat: /\[checked\]/ },
  // Recherche d'un produit du catalogue, puis type de remise globale.
  "combobox icône chevron-down": { fenetre: "(fenêtre sans titre)" },
};

const ouvrirNouveau = (page) => ouvrirEditeur(page, "/dashboard/outils/devis/new");
async function ouvrirArticles(page) {
  await ouvrirNouveau(page);
  await choisirClient(page, "Boulangerie Lumière SARL");
  await continuer(page);
}
const ouvrirEdition = (doc) => (page) => ouvrir(page, `/dashboard/outils/devis/${idDe(doc)}/editer`, { pret: page.getByText("Sélection d'un client").first() });
async function ouvrirParametres(page) {
  await ouvrirNouveau(page);
  await page.locator("main button:has(svg.lucide-settings)").first().click();
  await expect(page.getByRole("button", { name: "Appliquer à ce devis" })).toBeVisible();
}

// --- Propriétaire ---------------------------------------------------------------

test.describe("Devis (propriétaire)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_VENTES) });

  for (const [statut, doc] of LIGNES) {
    // Boutons communs essayés une fois (devis en attente) ; chaque statut essaie sa ligne.
    const communs = { ...ENTETE, ...RECHERCHE, ...FILTRES, ...BAS_DE_LISTE };
    verifierBoutons({
      test,
      titre: `Liste des devis, devis ${statut}`,
      ouvrir: (page) => epingler(page, "devis", doc),
      boutons: { ...(statut === "en attente" ? communs : dejaEssayes(communs, LISTE_COMPLETE)), ...menuDe(statut) },
    });
  }

  verifierBoutons({
    test,
    titre: "Liste des devis, brouillon sélectionné",
    ouvrir: async (page) => {
      await epingler(page, "devis", D.brouillon);
      await page.getByRole("checkbox", { name: "Sélectionner la ligne" }).first().check();
    },
    boutons: {
      ...dejaEssayes({ ...ENTETE, ...RECHERCHE, ...FILTRES, ...MENU.brouillon(true), ...BAS_DE_LISTE }, LISTE_COMPLETE),
      "button Supprimer (1)": { fenetre: "Confirmer la suppression" },
    },
  });

  verifierBoutons({ test, titre: "Panneau d'un brouillon", ouvrir: (page) => ouvrirPanneau(page, "devis", D.brouillon), zone: panneau, boutons: PANNEAU.brouillon });
  verifierBoutons({ test, titre: "Panneau d'un devis en attente", ouvrir: (page) => ouvrirPanneau(page, "devis", D.enAttente), zone: panneau, boutons: PANNEAU.enAttente(D.enAttente) });
  verifierBoutons({ test, titre: "Panneau d'un devis accepté", ouvrir: (page) => ouvrirPanneau(page, "devis", D.accepte), zone: panneau, boutons: PANNEAU.accepte(D.accepte) });
  verifierBoutons({ test, titre: "Panneau d'un devis refusé", ouvrir: (page) => ouvrirPanneau(page, "devis", D.refuse), zone: panneau, boutons: PANNEAU.refuse(D.refuse) });

  verifierBoutons({ test, titre: "Nouveau devis, client et informations", ouvrir: ouvrirNouveau, boutons: NOUVEAU_ETAPE_CLIENT(true) });

  verifierBoutons({
    test,
    titre: "Nouveau devis, articles",
    ouvrir: ouvrirArticles,
    boutons: {
      "button Modèles": MODELES_CREATION(true),
      "button Modèles > Gérer les modèles": { fenetre: "Gérer les modèles" },
      ...ETAPE_ARTICLES,
      "button Annuler": { navigation: "/dashboard/outils/devis" },
      "button Enregistrer brouillon": { notification: /Veuillez ajouter au moins un article au devis/ },
      "button Créer le devis": { notification: /Veuillez ajouter au moins un article au devis/ },
    },
  });

  verifierBoutons({
    test,
    titre: "Paramètres d'un nouveau devis",
    ouvrir: ouvrirParametres,
    boutons: {
      "button icône x": { contenu: true },
      "button Modifier vos informations entreprise": { fenetre: "Informations de l'entreprise" },
      "button Modifier vos informations légales": { fenetre: "Informations légales" },
      "button Configurer les coordonnées bancaires": { fenetre: "Coordonnées bancaires" },
      // Couleur du texte : bouton sans nom (voir « accessibilité »), puis couleurs de l'en-tête.
      "button ": { fenetre: "(fenêtre sans titre)" },
      "button FFFFFF": { fenetre: "(fenêtre sans titre)" },
      "button 5C50FF": { fenetre: "(fenêtre sans titre)" },
      "button Au centre": { sansEffet: "position du client, visible sur l'aperçu seulement" },
      "button À droite": { sansEffet: "position du client, visible sur l'aperçu seulement" },
      // Trois listes de suggestions (en-tête, conditions, bas de page) : la première est essayée.
      "button Suggestions": { menuContient: [/^Remerciement standard/] },
      "button Ajouter une annexe PDF": { selecteurDeFichier: true },
      "button Annuler": { contenu: true },
      "button Appliquer à ce devis": { notification: /Paramètres appliqués/ },
      // Interrupteur de numérotation continue : sans nom (voir « accessibilité ») ; il ouvre
      // « Activer la numérotation séquentielle continue ? » (même titre de test que la couleur : non cliqué ici).
      "switch ": { parcours: "edition.spec.mjs : numérotation continue d'un brouillon" },
    },
  });

  const PROPRES_EDITION = ["button Modèles", "button Modèles > Sauvegarder comme modèle", "button Supprimer la sélection", "button Annuler", "button Continuer"];
  verifierBoutons({ test, titre: "Modifier un brouillon, client et informations", ouvrir: ouvrirEdition(D.brouillon), boutons: dejaEssayes(EDITION_ETAPE_CLIENT, "Nouveau devis, client et informations", PROPRES_EDITION) });

  verifierBoutons({
    test,
    titre: "Modifier un brouillon, articles",
    ouvrir: async (page) => {
      await ouvrirEdition(D.brouillon)(page);
      await continuer(page);
    },
    boutons: {
      "button Modèles": { parcours: "essayé sur « Modifier un brouillon, client et informations »" },
      "button Modèles > Sauvegarder comme modèle": { parcours: "essayé sur « Modifier un brouillon, client et informations »" },
      ...dejaEssayes(ETAPE_ARTICLES, "Nouveau devis, articles"),
      // En-tête de l'article (accordéon) et sa corbeille.
      [`button ${D.brouillon.items[0].description} 1 200,00 € HT • 20% TVA • 1 440,00 € TTC`]: { etat: /\[expanded\]/ },
      "button icône trash2": { contenu: true },
      "button Annuler": { fenetre: "Quitter l'éditeur ?" },
      "button Enregistrer brouillon": { parcours: "edition.spec.mjs : enregistrer un devis modifié" },
      "button Modifier le devis": { parcours: "edition.spec.mjs : finaliser un brouillon" },
    },
  });

  verifierBoutons({ test, titre: "Modifier un devis en attente, client et informations", ouvrir: ouvrirEdition(D.enAttente), boutons: dejaEssayes(EDITION_ETAPE_CLIENT, "Modifier un brouillon, client et informations") });
});

// --- Éditeur : comme le propriétaire, sans supprimer ni régler l'espace ----------

test.describe("Devis (éditeur)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_VENTES_EDITEUR) });

  // Mêmes composants que pour le propriétaire : ici, ce que l'Éditeur voit (et ne voit pas).
  for (const [statut, doc] of LIGNES.slice(0, 3)) {
    verifierBoutons({
      test,
      titre: `Liste des devis, devis ${statut}`,
      ouvrir: (page) => epingler(page, "devis", doc),
      boutons: dejaEssayes({ ...ENTETE_EDITEUR, ...RECHERCHE, ...FILTRES, ...menuDe(statut, false), ...BAS_DE_LISTE }, "propriétaire", ["button Ouvrir le menu"]),
    });
  }

  verifierBoutons({ test, titre: "Panneau d'un devis en attente", ouvrir: (page) => ouvrirPanneau(page, "devis", D.enAttente), zone: panneau, boutons: dejaEssayes(PANNEAU.enAttente(D.enAttente), "propriétaire") });
  verifierBoutons({ test, titre: "Nouveau devis, client et informations", ouvrir: ouvrirNouveau, boutons: dejaEssayes(NOUVEAU_ETAPE_CLIENT(false), "propriétaire", ["button Modèles"]) });
  verifierBoutons({ test, titre: "Modifier un devis en attente, client et informations", ouvrir: ouvrirEdition(D.enAttente), boutons: dejaEssayes(EDITION_ETAPE_CLIENT, "propriétaire") });

  test("Sélection d'un brouillon : pas de suppression groupée", async ({ page }) => {
    await epingler(page, "devis", D.brouillon);
    await page.getByRole("checkbox", { name: "Sélectionner la ligne" }).first().check();
    await expect(page.getByRole("button", { name: /^Supprimer/ })).toHaveCount(0);
  });
});

// --- Membre (lecture seule) : consulter, jamais modifier ---------------------------

test.describe("Devis (membre, lecture seule)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_VENTES_LECTEUR) });
  const LECTURE = {
    ...RECHERCHE,
    ...FILTRES,
    "button Ouvrir le menu": { menu: ["Voir"] },
    "button Ouvrir le menu > Voir": { contenu: true },
    ...BAS_DE_LISTE,
  };

  for (const [statut, doc] of LIGNES.slice(0, 2)) {
    verifierBoutons({ test, titre: `Liste des devis, devis ${statut}`, ouvrir: (page) => epingler(page, "devis", doc), boutons: dejaEssayes(LECTURE, "propriétaire", ["button Ouvrir le menu"]) });
  }

  verifierBoutons({
    test,
    titre: "Panneau d'un devis en attente",
    ouvrir: (page) => ouvrirPanneau(page, "devis", D.enAttente),
    zone: panneau,
    boutons: dejaEssayes(
      {
        "button Télécharger PDF": { telechargement: new RegExp(`^devis_${D.enAttente.prefix}-${D.enAttente.number}\\.pdf$`) },
        "button icône x": { contenu: true },
      },
      "propriétaire",
    ),
  });
  verifierBoutons({
    test,
    titre: "Panneau d'un brouillon",
    ouvrir: (page) => ouvrirPanneau(page, "devis", D.brouillon),
    zone: panneau,
    boutons: { "button icône x": { contenu: true } },
  });

  for (const [titre, chemin] of [
    ["Nouveau devis", "/dashboard/outils/devis/new"],
    ["Modifier un devis", `/dashboard/outils/devis/${idDe(D.brouillon)}/editer`],
  ]) {
    verifierBoutons({
      test,
      titre: `${titre} : accès refusé`,
      ouvrir: (page) => ouvrir(page, chemin, { pret: page.getByRole("button", { name: "Demander l'accès" }) }),
      zone: contenu,
      boutons: {
        "button Demander l'accès": { parcours: "envoie une demande d'accès au propriétaire (notification et e-mail)" },
        "button Page précédente": { navigation: /.*/ },
        "link /dashboard/outils/devis": { navigation: "/dashboard/outils/devis" },
      },
    });
  }

  test("Sélection d'un devis : aucune action groupée proposée", async ({ page }) => {
    await epingler(page, "devis", D.brouillon);
    await page.getByRole("checkbox", { name: "Sélectionner la ligne" }).first().check();
    await expect(page.getByRole("button", { name: /^Supprimer/ })).toHaveCount(0);
  });
});

// --- Accessibilité ---------------------------------------------------------------

test.describe("Devis : chaque commande a un nom pour les lecteurs d'écran", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_VENTES) });

  test("Liste des devis : le bouton des paramètres est nommé", async ({ page }) => {
    await epingler(page, "devis", D.enAttente);
    const sansNom = await page.locator("main button").evaluateAll((boutons) =>
      boutons.filter((b) => b.offsetParent !== null && !(b.getAttribute("aria-label") || b.textContent.trim() || b.getAttribute("title"))).length,
    );
    expect(sansNom, "Boutons visibles sans nom (un lecteur d'écran annonce seulement « bouton »)").toBe(0);
  });

  test("Paramètres d'un devis : l'interrupteur de numérotation et la couleur du texte sont nommés", async ({ page }) => {
    await ouvrirParametres(page);
    const sansNom = await page.locator("main").getByRole("switch").or(page.locator("main button")).evaluateAll((elements) =>
      elements
        .filter((b) => b.offsetParent !== null)
        .filter((b) => {
          const libelle = b.id && document.querySelector(`label[for="${b.id}"]`);
          return !(b.getAttribute("aria-label") || b.getAttribute("aria-labelledby") || b.textContent.trim() || b.getAttribute("title") || libelle);
        }).length,
    );
    expect(sansNom, "Commandes visibles sans nom dans les paramètres du devis").toBe(0);
  });
});
