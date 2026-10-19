/**
 * Contacts : tous les boutons de chaque page, pour chaque rôle de
 * l'organisation « Clients ». Chaque bouton, onglet, case, liste et élément
 * de menu est essayé sur une page neuve, avec son effet attendu ; un élément
 * présent sans description (nouveau bouton, ou bouton qu'un rôle ne devrait
 * pas voir) fait échouer « Chaque élément de la page est décrit et testé ».
 *
 * Les actions qui modifient les données dès le clic (retirer d'une liste,
 * débloquer depuis la fiche) ne sont pas cliquées ici : `parcours` renvoie au
 * test qui les vérifie en entier, avec des contacts dédiés.
 */
import { test, expect } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { verifierBoutons } from "../exploration.mjs";
import { connecte, SESSION_TOKEN_CLIENTS, SESSION_TOKEN_EDITEUR, SESSION_TOKEN_LECTEUR } from "../config.mjs";
import { CONTACTS, LISTES_CLIENTS } from "../donnees/clients.mjs";

const id = (doc) => doc._id.toHexString();
const FICHE = /^\/dashboard\/clients\/[0-9a-f]{24}$/;
const surDocuments = (champ) => new RegExp(`« ${champ} » (ne )?s'affichera( plus)? sur vos documents`);

const ouvrirContacts = (page) =>
  ouvrir(page, "/dashboard/clients", { pret: page.getByRole("row").filter({ hasText: CONTACTS.complet.name }) });
const ouvrirFiche = (contact) => (page) => ouvrir(page, `/dashboard/clients/${id(contact)}`, { pret: page.getByText(contact.email).first() });
const ouvrirListes = (page) => ouvrir(page, "/dashboard/clients/listes", { pret: page.getByText(LISTES_CLIENTS.prospects.name).first() });
const ouvrirListe = (page) =>
  ouvrir(page, `/dashboard/clients/listes?listId=${id(LISTES_CLIENTS.prospects)}`, { pret: page.getByRole("row").filter({ hasText: CONTACTS.complet.name }) });
const ouvrirSegments = (page) => ouvrir(page, "/dashboard/clients/segments", { pret: page.getByText("Clients lyonnais").first() });
const ouvrirBloques = (page) => ouvrir(page, "/dashboard/clients/blocked", { pret: page.getByText(CONTACTS.bloque.name).first() });

const RECHERCHE_EXACTE = { "button Respecter les majuscules et les accents": { etat: /\[pressed\]/ } };
const FILTRES = (colonnes) => ({
  "button Filtres": { menu: ["Effacer tous les filtres", "Filtrer par type", `Colonnes visibles ${colonnes}`] },
  "button Filtres > Effacer tous les filtres": { sansEffet: "aucun filtre n'est actif" },
  // Sous-menus de cases à cocher (pas d'éléments de menu) : voir liste.spec.mjs pour leur effet.
  "button Filtres > Filtrer par type": { menu: [] },
  [`button Filtres > Colonnes visibles ${colonnes}`]: { menu: [] },
});
const PAGINATION_CONTACTS = {
  "button Go to first page": { desactive: "première page affichée" },
  "button Go to previous page": { desactive: "première page affichée" },
  "button Go to next page": { contenu: true },
  "button Go to last page": { contenu: true },
  "combobox icône chevron-down": { options: ["5", "10", "25", "50"] },
};
const PAGINATION_UNE_PAGE = (premiere, precedente, suivante, derniere) => ({
  [`button ${premiere}`]: { desactive: "une seule page" },
  [`button ${precedente}`]: { desactive: "une seule page" },
  [`button ${suivante}`]: { desactive: "une seule page" },
  [`button ${derniere}`]: { desactive: "une seule page" },
});
const EXPORT = {
  "button Exporter": { menu: ["CSV", "Excel"] },
  "button Exporter > CSV": { telechargement: /^Contacts_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.csv$/, notification: /\d+ contact\(s\) exporté\(s\)/ },
  "button Exporter > Excel": { telechargement: /^Contacts_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.xls$/, notification: /\d+ contact\(s\) exporté\(s\)/ },
};
const SELECTION = {
  "checkbox Sélectionner tout": { etat: /\[checked\]/ },
  "checkbox Select row": { etat: /\[checked\]/ },
};
const ACTIVITE = {
  "button Tout": { menu: ["Tout", "Factures", "Devis", "Emails", "Notes", "Rappels", "Listes"] },
  "button Tout > Tout": { sansEffet: "le filtre est déjà sur « Tout »" },
  ...Object.fromEntries(["Factures", "Devis", "Emails", "Notes", "Rappels", "Listes"].map((f) => [`button Tout > ${f}`, { contenu: true }])),
  "tab Activité": { sansEffet: "onglet déjà affiché" },
  "tab Devis": { navigation: /\?tab=quotes$/ },
  "tab Bons de commande": { navigation: /\?tab=purchaseorders$/ },
};
/** Onglet des factures : son nom porte le nombre de factures quand il y en a (« Factures 2 »). */
const ONGLET_FACTURES = (nombre) => ({ [`tab Factures${nombre ? ` ${nombre}` : ""}`]: { navigation: /\?tab=invoices$/ } });
const SECTIONS = (...noms) => Object.fromEntries(noms.map((n) => [`button ${n}`, { contenu: true }]));
const NAVIGATION_FICHE = (premier) => ({
  "button icône arrow-left": { navigation: "/dashboard/clients" },
  "button icône chevron-left": premier ? { desactive: "premier contact par ordre alphabétique" } : { navigation: FICHE },
  "button icône chevron-right": { navigation: FICHE },
  // window.location = « mailto: » : ouvre la messagerie de l'ordinateur, rien d'observable ici.
  "button icône mail": { sansEffet: "ouvre la messagerie (lien mailto:)" },
});
const CHAMPS_SUR_DOCUMENTS = (valeurSecteur) => ({
  [`checkbox Secteur d'activité ${valeurSecteur}`]: { notification: surDocuments("Secteur d'activité") },
  "checkbox Date de premier contact Non renseigné": { notification: surDocuments("Date de premier contact") },
  "checkbox Champ à supprimer Non renseigné": { notification: surDocuments("Champ à supprimer") },
});
// Copier le numéro n'affiche aucune confirmation aujourd'hui : attendu, une confirmation
// (vérifié sur la fiche du propriétaire ; pour les autres rôles, voir fiche.spec.mjs).
const WHATSAPP = { notification: /copi/i };
const WHATSAPP_AUTRES_ROLES = { parcours: "fiche.spec.mjs : copier le numéro (WhatsApp)" };

// --- Propriétaire -------------------------------------------------------------

test.describe("Contacts (propriétaire)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_CLIENTS) });

  verifierBoutons({
    test,
    titre: "Contacts",
    ouvrir: ouvrirContacts,
    boutons: {
      "button icône zap": { fenetre: "Automatisations" },
      "button Champs": { fenetre: "Champs personnalisés clients" },
      "button Importer": { fenetre: "Importer des contacts" },
      ...EXPORT,
      "button Nouveau contact": { fenetre: "Ajouter un client" },
      ...RECHERCHE_EXACTE,
      ...FILTRES(6),
      "button Actions du client": { menu: ["Modifier", "Copier email", "Ajouter à une liste", "Assigner", "Bloquer", "Listes liées", "Supprimer"] },
      "button Actions du client > Modifier": { fenetre: "Modifier le client" },
      "button Actions du client > Copier email": { notification: /Email copié dans le presse-papiers/ },
      "button Actions du client > Ajouter à une liste": { menuContient: [LISTES_CLIENTS.droits.name, "Créer une liste"] },
      "button Actions du client > Assigner": { fenetre: "Assigner des membres" },
      "button Actions du client > Bloquer": { fenetre: `Bloquer ${CONTACTS.complet.name} ?` },
      "button Actions du client > Listes liées": { menu: [LISTES_CLIENTS.prospects.name] },
      "button Actions du client > Supprimer": { fenetre: "Êtes-vous sûr de vouloir supprimer ce client ?" },
      ...PAGINATION_CONTACTS,
      ...SELECTION,
    },
  });

  verifierBoutons({
    test,
    titre: "Fiche d'un contact",
    ouvrir: ouvrirFiche(CONTACTS.complet),
    boutons: {
      ...NAVIGATION_FICHE(true),
      "button Créer un rappel": { fenetre: "Nouvel événement" },
      "button icône settings2": { menu: ["Modifier", "Bloquer le contact", "Assigner", "Copier le numéro sur WhatsApp", "Supprimer définitivement"] },
      "button icône settings2 > Modifier": { fenetre: "Modifier le client" },
      "button icône settings2 > Bloquer le contact": { fenetre: "Bloquer ce contact ?" },
      "button icône settings2 > Assigner": { fenetre: "Assigner des membres" },
      "button icône settings2 > Copier le numéro sur WhatsApp": WHATSAPP,
      "button icône settings2 > Supprimer définitivement": { fenetre: "Supprimer ce contact ?" },
      "button Modifier": { fenetre: "Modifier le client" },
      ...ACTIVITE,
      ...ONGLET_FACTURES(0),
      "tab Notes 1": { navigation: /\?tab=notes$/ },
      ...SECTIONS("Informations de contact", "Voir plus ↓", "Sur les documents", "Facturation", "Détails"),
      ...CHAMPS_SUR_DOCUMENTS("Industrie"),
    },
  });

  verifierBoutons({
    test,
    titre: "Fiche d'un contact bloqué",
    ouvrir: ouvrirFiche(CONTACTS.bloque),
    boutons: {
      ...NAVIGATION_FICHE(false),
      "button Créer un rappel": { fenetre: "Nouvel événement" },
      "button icône settings2": { menu: ["Modifier", "Débloquer le contact", "Assigner", "Supprimer définitivement"] },
      "button icône settings2 > Modifier": { fenetre: "Modifier le client" },
      "button icône settings2 > Débloquer le contact": { parcours: "fiche.spec.mjs : débloquer depuis la fiche" },
      "button icône settings2 > Assigner": { fenetre: "Assigner des membres" },
      "button icône settings2 > Supprimer définitivement": { fenetre: "Supprimer ce contact ?" },
      "button Modifier": { fenetre: "Modifier le client" },
      ...ACTIVITE,
      ...ONGLET_FACTURES(0),
      "tab Notes": { navigation: /\?tab=notes$/ },
      ...SECTIONS("Informations de contact", "Voir plus ↓", "Sur les documents", "Blocage", "Facturation", "Détails"),
      ...CHAMPS_SUR_DOCUMENTS("Non renseigné"),
    },
  });

  verifierBoutons({
    test,
    titre: "Fiche d'un contact avec factures",
    ouvrir: ouvrirFiche(CONTACTS.avecFactures),
    boutons: {
      ...NAVIGATION_FICHE(false),
      "button Créer un rappel": { fenetre: "Nouvel événement" },
      "button icône settings2": { menu: ["Modifier", "Bloquer le contact", "Assigner", "Supprimer définitivement"] },
      "button icône settings2 > Modifier": { fenetre: "Modifier le client" },
      "button icône settings2 > Bloquer le contact": { fenetre: "Bloquer ce contact ?" },
      "button icône settings2 > Assigner": { fenetre: "Assigner des membres" },
      // Un contact facturé ne peut pas être supprimé : le menu doit le dire
      // (aujourd'hui, le clic ne fait rien, sans explication).
      "button icône settings2 > Supprimer définitivement": { notification: /impossible|documents|factur/i },
      "button Modifier": { fenetre: "Modifier le client" },
      ...ACTIVITE,
      "tab Notes": { navigation: /\?tab=notes$/ },
      ...ONGLET_FACTURES(2),
      ...SECTIONS("Informations de contact", "Voir plus ↓", "Sur les documents", "Facturation", "Détails"),
      ...CHAMPS_SUR_DOCUMENTS("Non renseigné"),
    },
  });

  verifierBoutons({
    test,
    titre: "Listes de contacts",
    ouvrir: ouvrirListes,
    boutons: {
      "button Nouvelle liste": { fenetre: "Créer une nouvelle liste" },
      ...RECHERCHE_EXACTE,
      "button icône ellipsis": { menu: ["Ajouter des contacts", "Modifier", "Supprimer"] },
      "button icône ellipsis > Ajouter des contacts": { fenetre: /^Ajouter des contacts à « .+ »$/ },
      "button icône ellipsis > Modifier": { fenetre: "Modifier la liste" },
      "button icône ellipsis > Supprimer": { fenetre: "Supprimer la liste" },
      ...PAGINATION_UNE_PAGE("Première page", "Page précédente", "Page suivante", "Dernière page"),
      "checkbox Sélectionner tout": { etat: /\[checked\]/ },
      "checkbox Sélectionner la ligne": { etat: /\[checked\]/ },
      "combobox icône chevron-down": { options: ["10", "20", "30", "40", "50"] },
    },
  });

  verifierBoutons({
    test,
    titre: "Contacts d'une liste",
    ouvrir: ouvrirListe,
    boutons: {
      "button Retour aux listes": { contenu: true },
      "button Ajouter des contacts": { fenetre: `Ajouter des contacts à « ${LISTES_CLIENTS.prospects.name} »` },
      ...RECHERCHE_EXACTE,
      ...FILTRES(5),
      "button Actions du client": { menu: ["Modifier", "Copier email", "Ajouter à une liste", "Retirer de la liste", "Assigner", "Bloquer", "Listes liées", "Supprimer"] },
      "button Actions du client > Modifier": { fenetre: "Modifier le client" },
      "button Actions du client > Copier email": { notification: /Email copié dans le presse-papiers/ },
      // Les autres listes doivent être proposées (aujourd'hui : « Aucune liste disponible »).
      "button Actions du client > Ajouter à une liste": { menuContient: [LISTES_CLIENTS.droits.name, "Créer une liste"] },
      "button Actions du client > Retirer de la liste": { parcours: "listes.spec.mjs : retirer un contact d'une liste" },
      "button Actions du client > Assigner": { fenetre: "Assigner des membres" },
      "button Actions du client > Bloquer": { fenetre: `Bloquer ${CONTACTS.complet.name} ?` },
      "button Actions du client > Listes liées": { menu: [LISTES_CLIENTS.prospects.name] },
      "button Actions du client > Supprimer": { fenetre: "Êtes-vous sûr de vouloir supprimer ce client ?" },
      ...PAGINATION_UNE_PAGE("Go to first page", "Go to previous page", "Go to next page", "Go to last page"),
      "combobox icône chevron-down": { options: ["5", "10", "25", "50"] },
      ...SELECTION,
    },
  });

  verifierBoutons({
    test,
    titre: "Segments",
    ouvrir: ouvrirSegments,
    boutons: {
      "button Nouveau segment": { fenetre: "Nouveau segment" },
      "button icône ellipsis": { menu: ["Modifier", "Supprimer"] },
      "button icône ellipsis > Modifier": { fenetre: "Modifier le segment" },
      "button icône ellipsis > Supprimer": { fenetre: "Supprimer ce segment ?" },
    },
  });

  verifierBoutons({
    test,
    titre: "Contacts bloqués",
    ouvrir: ouvrirBloques,
    boutons: {
      ...RECHERCHE_EXACTE,
      "button Débloquer": { fenetre: "Débloquer ce contact ?" },
      ...PAGINATION_UNE_PAGE("Première page", "Page précédente", "Page suivante", "Dernière page"),
      "checkbox Tout sélectionner": { etat: /\[checked\]/ },
      [`checkbox Sélectionner ${CONTACTS.bloque.name}`]: { etat: /\[checked\]/ },
      "combobox icône chevron-down": { options: ["5", "10", "25", "50"] },
    },
  });
});

// --- Éditeur : comme le propriétaire, sans rien supprimer ----------------------

test.describe("Contacts (éditeur)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_EDITEUR) });

  verifierBoutons({
    test,
    titre: "Contacts",
    ouvrir: ouvrirContacts,
    boutons: {
      "button icône zap": { fenetre: "Automatisations" },
      "button Champs": { fenetre: "Champs personnalisés clients" },
      "button Importer": { fenetre: "Importer des contacts" },
      ...EXPORT,
      "button Nouveau contact": { fenetre: "Ajouter un client" },
      ...RECHERCHE_EXACTE,
      ...FILTRES(6),
      "button Actions du client": { menu: ["Modifier", "Copier email", "Ajouter à une liste", "Assigner", "Bloquer", "Listes liées"] },
      "button Actions du client > Modifier": { fenetre: "Modifier le client" },
      "button Actions du client > Copier email": { notification: /Email copié dans le presse-papiers/ },
      "button Actions du client > Ajouter à une liste": { menuContient: [LISTES_CLIENTS.droits.name, "Créer une liste"] },
      "button Actions du client > Assigner": { fenetre: "Assigner des membres" },
      "button Actions du client > Bloquer": { fenetre: `Bloquer ${CONTACTS.complet.name} ?` },
      "button Actions du client > Listes liées": { menu: [LISTES_CLIENTS.prospects.name] },
      ...PAGINATION_CONTACTS,
      ...SELECTION,
    },
  });

  verifierBoutons({
    test,
    titre: "Fiche d'un contact",
    ouvrir: ouvrirFiche(CONTACTS.complet),
    boutons: {
      ...NAVIGATION_FICHE(true),
      "button Créer un rappel": { fenetre: "Nouvel événement" },
      "button icône settings2": { menu: ["Modifier", "Bloquer le contact", "Assigner", "Copier le numéro sur WhatsApp"] },
      "button icône settings2 > Modifier": { fenetre: "Modifier le client" },
      "button icône settings2 > Bloquer le contact": { fenetre: "Bloquer ce contact ?" },
      "button icône settings2 > Assigner": { fenetre: "Assigner des membres" },
      "button icône settings2 > Copier le numéro sur WhatsApp": WHATSAPP_AUTRES_ROLES,
      "button Modifier": { fenetre: "Modifier le client" },
      ...ACTIVITE,
      ...ONGLET_FACTURES(0),
      "tab Notes 1": { navigation: /\?tab=notes$/ },
      ...SECTIONS("Informations de contact", "Voir plus ↓", "Facturation", "Détails"),
    },
  });

  verifierBoutons({
    test,
    titre: "Listes de contacts",
    ouvrir: ouvrirListes,
    boutons: {
      "button Nouvelle liste": { fenetre: "Créer une nouvelle liste" },
      ...RECHERCHE_EXACTE,
      "button icône ellipsis": { menu: ["Ajouter des contacts", "Modifier"] },
      "button icône ellipsis > Ajouter des contacts": { fenetre: /^Ajouter des contacts à « .+ »$/ },
      "button icône ellipsis > Modifier": { fenetre: "Modifier la liste" },
      ...PAGINATION_UNE_PAGE("Première page", "Page précédente", "Page suivante", "Dernière page"),
      "combobox icône chevron-down": { options: ["10", "20", "30", "40", "50"] },
    },
  });

  verifierBoutons({
    test,
    titre: "Segments",
    ouvrir: ouvrirSegments,
    boutons: {
      "button Nouveau segment": { fenetre: "Nouveau segment" },
      "button icône ellipsis": { menu: ["Modifier"] },
      "button icône ellipsis > Modifier": { fenetre: "Modifier le segment" },
    },
  });
});

// --- Membre (lecture seule) : consulter, jamais modifier ----------------------

test.describe("Contacts (membre, lecture seule)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_LECTEUR) });

  verifierBoutons({
    test,
    titre: "Contacts",
    ouvrir: ouvrirContacts,
    boutons: {
      "button icône zap": { fenetre: "Automatisations" },
      "button Champs": { fenetre: "Champs personnalisés clients" },
      ...RECHERCHE_EXACTE,
      ...FILTRES(6),
      "button Actions du client": { menu: ["Copier email", "Listes liées"] },
      "button Actions du client > Copier email": { notification: /Email copié dans le presse-papiers/ },
      "button Actions du client > Listes liées": { menu: [LISTES_CLIENTS.prospects.name] },
      ...PAGINATION_CONTACTS,
    },
  });

  verifierBoutons({
    test,
    titre: "Fiche d'un contact",
    ouvrir: ouvrirFiche(CONTACTS.complet),
    boutons: {
      ...NAVIGATION_FICHE(true),
      "button icône settings2": { menu: ["Copier le numéro sur WhatsApp"] },
      "button icône settings2 > Copier le numéro sur WhatsApp": WHATSAPP_AUTRES_ROLES,
      ...ACTIVITE,
      ...ONGLET_FACTURES(0),
      "tab Notes 1": { navigation: /\?tab=notes$/ },
      ...SECTIONS("Informations de contact", "Voir plus ↓", "Facturation", "Détails"),
    },
  });

  verifierBoutons({
    test,
    titre: "Listes de contacts",
    ouvrir: ouvrirListes,
    boutons: {
      ...RECHERCHE_EXACTE,
      ...PAGINATION_UNE_PAGE("Première page", "Page précédente", "Page suivante", "Dernière page"),
      "combobox icône chevron-down": { options: ["10", "20", "30", "40", "50"] },
    },
  });

  verifierBoutons({ test, titre: "Segments", ouvrir: ouvrirSegments, boutons: {} });

  verifierBoutons({
    test,
    titre: "Contacts bloqués",
    ouvrir: ouvrirBloques,
    boutons: {
      ...RECHERCHE_EXACTE,
      ...PAGINATION_UNE_PAGE("Première page", "Page précédente", "Page suivante", "Dernière page"),
      "combobox icône chevron-down": { options: ["5", "10", "25", "50"] },
    },
  });

  test.describe("Rien à modifier dans les fenêtres ouvertes", () => {
    test("Automatisations : consultables, pas d'ajout", async ({ page }) => {
      await ouvrirContacts(page);
      await page.locator("main button:has(svg.lucide-zap)").first().click();
      await expect(page.getByRole("dialog", { name: "Automatisations" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Ajouter une automatisation" })).toHaveCount(0);
    });

    test("Champs personnalisés : consultables, ni création ni modification", async ({ page }) => {
      await ouvrirContacts(page);
      await page.getByRole("button", { name: "Champs" }).click();
      const panneau = page.getByRole("dialog", { name: "Champs personnalisés clients" });
      await expect(panneau).toBeVisible();
      await expect(panneau.getByRole("button", { name: /Nouveau champ|Créer un champ/ })).toHaveCount(0);
      await expect(panneau.locator("button:has(svg.lucide-pen), button:has(svg.lucide-trash2)")).toHaveCount(0);
      await expect(panneau.getByRole("switch")).toHaveCount(0);
    });

    test("Notes d'un contact : lisibles, pas d'ajout", async ({ page }) => {
      await ouvrir(page, `/dashboard/clients/${id(CONTACTS.complet)}?tab=notes`, { pret: page.getByText(CONTACTS.complet.notes[0].content) });
      const contenuFiche = page.locator("main > div").last();
      await expect(contenuFiche.getByRole("textbox")).toHaveCount(0);
      await expect(contenuFiche.getByRole("button", { name: /Ajouter|Envoyer|Publier/ })).toHaveCount(0);
    });
  });
});
