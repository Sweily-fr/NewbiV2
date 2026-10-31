/**
 * Mise en page : tous les boutons de la barre latérale et de l'en-tête, pour
 * le propriétaire de « Pilotage » et pour le cabinet dans son espace
 * gestionnaire. « Déconnexion » n'est jamais cliquée (session de test).
 * Les éléments qui ouvrent un autre site (documentation, e-mail) ne sont pas
 * décrits au-delà de leur présence dans le menu.
 */
import { test } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { verifierBoutons } from "../exploration.mjs";
import { connecte, SESSION_TOKEN_CABINET, SESSION_TOKEN_PILOTAGE } from "../config.mjs";

const barreLaterale = (p) => p.locator("[data-slot=sidebar]").first();
const enTete = (p) => p.locator("main > header").first();
const PARAMETRES = "Paramètres de l'application";
const AIDE = ["Aide Besoin d'aide ? Contactez-nous", "Communauté Rejoignez notre communauté", "Documentation Formations et tutoriels"];
const AIDE_DETAIL = {
  "button Aide et support": { menu: AIDE },
  "button Aide et support > Aide Besoin d'aide ? Contactez-nous": { sansEffet: "ouvre la messagerie (lien mailto:)" },
  "button Aide et support > Communauté Rejoignez notre communauté": { fenetre: "Communauté" },
};
const COMPTE = (initiales) => ({
  [`button ${initiales}`]: { menu: ["Compte", "Gérer l'abonnement", "Thème", "Mode daltonien", "Se déconnecter"] },
  [`button ${initiales} > Compte`]: { fenetre: PARAMETRES },
  [`button ${initiales} > Gérer l'abonnement`]: { fenetre: PARAMETRES },
  [`button ${initiales} > Thème`]: { menu: ["Clair", "Sombre", "Système"] },
  [`button ${initiales} > Mode daltonien`]: { menu: ["Standard", "Daltonien"] },
});

test.describe("Mise en page (propriétaire de « Pilotage »)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE) });
  const ouvrirAccueil = (page) => ouvrir(page, "/dashboard", { pret: page.getByRole("heading", { name: "À traiter" }) });

  verifierBoutons({
    test,
    titre: "Barre latérale",
    ouvrir: ouvrirAccueil,
    zone: barreLaterale,
    // « Notifications 2 » : le nombre de non lues fait partie du nom du bouton.
    nomsVariables: true,
    boutons: {
      "button NewBi Logo": { menu: ["Pilotage Test SASU", "Paramètres du compte", "Paramètres de l'espace", "Inviter des membres", "Collaborateurs", "Nouvel espace", "Déconnexion"] },
      "button NewBi Logo > Paramètres du compte": { fenetre: PARAMETRES },
      "button NewBi Logo > Paramètres de l'espace": { fenetre: PARAMETRES },
      "button NewBi Logo > Inviter des membres": { fenetre: "Inviter des membres" },
      "button NewBi Logo > Collaborateurs": { fenetre: PARAMETRES },
      "button NewBi Logo > Nouvel espace": { navigation: "/create-workspace" },
      "button Accueil": { sansEffet: "accueil déjà affiché" },
      "button Transactions": { navigation: "/dashboard/outils/transactions" },
      "button Ventes": { menu: ["Nouvelle facture", "Nouveau devis", "Nouveau bon de commande", "Nouveau bon de livraison", "Factures clients", "Devis", "Bons de commande", "Bons de livraison", "Catalogues"] },
      "button Ventes > Nouvelle facture": { navigation: "/dashboard/outils/factures/new" },
      "button Ventes > Factures clients": { navigation: "/dashboard/outils/factures" },
      "button Ventes > Catalogues": { navigation: "/dashboard/catalogues" },
      "button Pilotage": { menu: ["Vue d'ensemble", "Prévision", "Analytiques"] },
      "button Pilotage > Vue d'ensemble": { navigation: "/dashboard/outils/analytiques/vue-densemble" },
      "button Pilotage > Prévision": { navigation: "/dashboard/outils/prevision" },
      "button Pilotage > Analytiques": { navigation: "/dashboard/outils/analytiques" },
      "button Clients": { menu: ["Nouveau client", "Mes clients", "Listes", "Segments", "Bloqués"] },
      "button Clients > Mes clients": { navigation: "/dashboard/clients" },
      "button Clients > Listes": { navigation: "/dashboard/clients/listes" },
      "button Factures d'achat": { navigation: "/dashboard/outils/factures-achat" },
      "button Calendrier": { navigation: "/dashboard/calendar" },
      "button Tâches": { menu: ["Toutes les listes", "Nouvelle liste"] },
      "button Tâches > Toutes les listes": { navigation: "/dashboard/outils/kanban" },
      "button Documents": { menu: ["Transfert de fichiers", "Documents partagés"] },
      "button Documents > Transfert de fichiers": { navigation: "/dashboard/outils/transferts-fichiers" },
      "button Communication": { menu: ["Signature de mail"] },
      "button Facturation électronique": { fenetre: "Facturation électronique" },
      "button Notifications": { fenetre: PARAMETRES },
      "button Paramètres": { menu: ["Paramètres entreprise", "Collaborateurs"] },
      "button Paramètres > Paramètres entreprise": { fenetre: PARAMETRES },
      ...AIDE_DETAIL,
      ...COMPTE("NP"),
      "link /dashboard": { sansEffet: "accueil déjà affiché" },
      "link /dashboard/outils/transactions": { navigation: "/dashboard/outils/transactions" },
      "link /dashboard/outils/factures-achat": { navigation: "/dashboard/outils/factures-achat" },
      "link /dashboard/calendar": { navigation: "/dashboard/calendar" },
      "link /": { fenetre: "Rechercher" },
    },
  });

  verifierBoutons({
    test,
    titre: "En-tête",
    ouvrir: ouvrirAccueil,
    zone: enTete,
    boutons: {
      "button Toggle Sidebar": { sansEffet: "replie ou déplie la barre latérale" },
      "button icône boxes": { menu: ["Pilotage Test SASU PRO", "Tous les espaces", "Nouvel espace"] },
      "button icône boxes > Pilotage Test SASU PRO": { sansEffet: "espace déjà actif" },
      "button icône boxes > Tous les espaces": { fenetre: PARAMETRES },
      "button icône boxes > Nouvel espace": { navigation: "/create-workspace" },
    },
  });
});

test.describe("Mise en page (cabinet, espace gestionnaire)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_CABINET) });
  const G = "/dashboard/gestionnaire";
  const ouvrirEspace = (page) => ouvrir(page, G, { pret: page.getByRole("heading", { name: "Clients" }) });

  verifierBoutons({
    test,
    titre: "Barre latérale",
    ouvrir: ouvrirEspace,
    zone: barreLaterale,
    boutons: {
      "button Clients": { sansEffet: "page déjà affichée" },
      "button Factures clients": { navigation: `${G}/factures` },
      "button Devis": { navigation: `${G}/devis` },
      "button Bons de commande": { navigation: `${G}/bons-commande` },
      "button Bons de livraison": { navigation: `${G}/bons-de-livraison` },
      "button Avoirs": { navigation: `${G}/avoirs` },
      "button Notifications": { fenetre: PARAMETRES },
      "button Paramètres": { menu: ["Dépenses clients", "Paramètres de l'espace actif", "Collaborateurs"] },
      "button Paramètres > Dépenses clients": { fenetre: PARAMETRES },
      ...AIDE_DETAIL,
      ...COMPTE("CC"),
      "link /dashboard/gestionnaire": { sansEffet: "page déjà affichée" },
      "link /dashboard/gestionnaire/factures": { navigation: `${G}/factures` },
      "link /dashboard/gestionnaire/devis": { navigation: `${G}/devis` },
      "link /dashboard/gestionnaire/bons-commande": { navigation: `${G}/bons-commande` },
      "link /dashboard/gestionnaire/bons-de-livraison": { navigation: `${G}/bons-de-livraison` },
      "link /dashboard/gestionnaire/avoirs": { navigation: `${G}/avoirs` },
      "link /": { fenetre: "Rechercher" },
    },
  });
});
