/**
 * Espace gestionnaire : tous les boutons de chaque page du cabinet. Les
 * actions qui modifient les fiches ont leur parcours (clients.spec.mjs) ; la
 * prise en charge de l'abonnement passe par Stripe (injoignable en CI) : seule
 * l'ouverture de sa fenêtre est vérifiée.
 */
import { test } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { verifierBoutons } from "../exploration.mjs";
import { connecte, SESSION_TOKEN_CABINET } from "../config.mjs";
import { COMPTES, MEMBRES } from "../donnees/base.mjs";
import { CABINET } from "../donnees/lot-pilotage.mjs";
import { base } from "../base.mjs";
import { ouvrirListe } from "./outils-gestionnaire.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_CABINET) });

const G = "/dashboard/gestionnaire";
const CLIENTS_DU_CABINET = ["Tous les clients", COMPTES.clientCabinet.organisation.name, COMPTES.pilotage.organisation.name];

verifierBoutons({
  test,
  titre: "Gestionnaire : clients",
  ouvrir: (page) => ouvrir(page, G, { pret: page.getByRole("heading", { name: "Clients" }) }),
  boutons: {
    "button Respecter les majuscules et les accents": { etat: /\[pressed\]/ },
    "button Ouvrir": { parcours: "clients.spec.mjs : ouvrir l'espace d'un client (change l'espace de la session)" },
    [`button Autres actions pour ${COMPTES.clientCabinet.organisation.name}`]: { menu: ["Prendre en charge l'abonnement"] },
    [`button Autres actions pour ${COMPTES.clientCabinet.organisation.name} > Prendre en charge l'abonnement`]: { fenetre: `Prendre en charge l'abonnement de ${COMPTES.clientCabinet.organisation.name}` },
    "link /dashboard/gestionnaire/clients/inviter": { navigation: `${G}/clients/inviter` },
    "link /dashboard/gestionnaire/clients/nouveau": { navigation: `${G}/clients/nouveau` },
  },
});

const LISTES = {
  factures: {
    titre: "Factures clients",
    onglets: { "tab Toutes": null, "tab Brouillons": "DRAFT", "tab À encaisser": "PENDING", "tab En retard": "overdue", "tab Terminées": "COMPLETED" },
    pagination: true,
  },
  devis: { titre: "Devis", onglets: { "tab Tous": null, "tab Brouillons": "DRAFT", "tab Envoyés": "PENDING", "tab Acceptés": "COMPLETED" } },
  "bons-commande": { titre: "Bons de commande", onglets: { "tab Tous": null, "tab Brouillons": "DRAFT", "tab En attente": "CONFIRMED", "tab Validés": "VALIDATED", "tab Livrés": "DELIVERED" } },
  "bons-de-livraison": { titre: "Bons de livraison", onglets: { "tab Tous": null, "tab Brouillons": "DRAFT", "tab À expédier": "PENDING", "tab Expédiés": "SHIPPED", "tab Livrés": "DELIVERED" } },
  avoirs: { titre: "Avoirs", onglets: { "tab Tous": null } },
};

/**
 * Les onglets portent leur compteur dans leur nom (« Toutes 69 ») : la
 * description les nomme sans compteur, la page relevée est comparée sur la
 * partie fixe. Les compteurs eux-mêmes sont vérifiés par documents.spec.mjs.
 */
for (const [chemin, { titre, onglets, pagination }] of Object.entries(LISTES)) {
  test.describe(`Gestionnaire : ${titre}`, () => {
    test(`« ${titre} » : chaque onglet ouvre son statut`, async ({ page }) => {
      for (const [onglet, statut] of Object.entries(onglets)) {
        await ouvrirListe(page, `${G}/${chemin}`);
        const nom = onglet.replace(/^tab /, "");
        const element = page.getByRole("tab", { name: new RegExp(`^${nom}\\s*\\d+$`) });
        await element.click();
        if (statut) await test.expect(page).toHaveURL(new RegExp(`statut=${statut}`));
      }
    });

    test(`« ${titre} » : filtre « Client » propose les clients du cabinet`, async ({ page }) => {
      await ouvrirListe(page, `${G}/${chemin}`);
      await page.getByRole("combobox", { name: "Client" }).click();
      const options = (await page.getByRole("option").allInnerTexts()).map((t) => t.trim());
      const db = await base();
      const liens = await db.collection("managedclients").find({ managerId: CABINET._id, status: "active" }).toArray();
      const membres = await db.collection("member").find({ userId: MEMBRES.cabinet.utilisateur._id, organizationId: { $in: liens.map((l) => l.organizationId) } }).toArray();
      const noms = (await db.collection("organization").find({ _id: { $in: membres.map((m) => m.organizationId) } }).toArray()).map((o) => o.companyName || o.name);
      test.expect(options.sort()).toEqual(["Tous les clients", ...noms].sort());
      test.expect(options, "Les deux clients de départ sont proposés").toEqual(test.expect.arrayContaining(CLIENTS_DU_CABINET));
    });

    test(`« ${titre} » : recherche exacte (« Aa ») gardée dans l'adresse`, async ({ page }) => {
      await ouvrirListe(page, `${G}/${chemin}`);
      await page.getByRole("button", { name: "Respecter les majuscules et les accents" }).click();
      await test.expect(page).toHaveURL(new RegExp(`${chemin}\\?exact=1`));
    });

    if (pagination) {
      test(`« ${titre} » : « Page précédente » grisée sur la première page`, async ({ page }) => {
        await ouvrirListe(page, `${G}/${chemin}`);
        await test.expect(page.getByRole("button", { name: "Page précédente" })).toBeDisabled();
      });
    }
  });
}

verifierBoutons({
  test,
  titre: "Gestionnaire : inviter un client",
  ouvrir: (page) => ouvrir(page, `${G}/clients/inviter`, { pret: page.getByRole("button", { name: "Envoyer l'invitation" }) }),
  boutons: {
    "button Envoyer l'invitation": { parcours: "formulaires.spec.mjs : inviter un client" },
    "button Annuler": { navigation: G },
    "link /dashboard/gestionnaire": { navigation: G },
  },
});

verifierBoutons({
  test,
  titre: "Gestionnaire : nouveau client",
  ouvrir: (page) => ouvrir(page, `${G}/clients/nouveau`, { pret: page.getByRole("button", { name: "Créer le client" }) }),
  boutons: {
    "button Créer le client": { parcours: "formulaires.spec.mjs : nouveau client" },
    "button Annuler": { navigation: G },
    "checkbox Je paierai l'abonnement de ce client Le client démarre avec 30 jours d'essai gratuit. À la fin de l'essai, c'est vous qui choisirez et paierez son offre ; sinon, il le fera lui-même.": {
      etat: /\[checked\]/,
    },
    "link /dashboard/gestionnaire": { navigation: G },
  },
});
