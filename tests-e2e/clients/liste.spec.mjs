/**
 * Page Contacts : ce qu'elle affiche comparé à la base (ordre, compteur,
 * pagination), recherche, filtres, colonnes, export, copie de l'e-mail, et
 * chaque action, unitaire ou groupée, vérifiée en base. Organisation
 * « Clients » ; chaque action a son contact (donnees/clients.mjs).
 */
import { readFileSync } from "node:fs";
import { test, expect, etape, fenetre } from "../outils.mjs";
import { ouvrir, cliquer, attendreCalme } from "../navigation.mjs";
import { base } from "../base.mjs";
import { connecte, SESSION_TOKEN_CLIENTS } from "../config.mjs";
import { COMPTES, MEMBRES } from "../donnees/base.mjs";
import { CONTACTS, LISTES_CLIENTS } from "../donnees/clients.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_CLIENTS) });

const ORG = COMPTES.clients.organisation._id;
const RECHERCHE = "Recherchez par nom, email ou SIRET...";
const notification = (page, texte) => page.locator("[data-sonner-toast]").filter({ hasText: texte });
const rangee = (page, contact) => page.getByRole("row").filter({ hasText: contact.name });
const enBase = async (contact) => (await base()).collection("clients").findOne({ _id: contact._id });

async function ouvrirContacts(page) {
  await ouvrir(page, "/dashboard/clients", { pret: rangee(page, CONTACTS.complet) });
}

async function rechercher(page, texte) {
  await page.getByPlaceholder(RECHERCHE).fill(texte);
  await attendreCalme(page);
}

/** Contacts de l'organisation, dans l'ordre de la liste (nom, ordre binaire comme MongoDB). */
async function contactsTries() {
  const docs = await (await base()).collection("clients").find({ workspaceId: ORG }).toArray();
  return docs.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

/** Noms des contacts affichés, dans l'ordre. */
async function nomsAffiches(page) {
  const lignes = page.getByRole("row").filter({ has: page.getByRole("checkbox", { name: "Select row" }) });
  const noms = [];
  for (const l of await lignes.all()) noms.push((await l.innerText()).replace(/\s+/g, " ").trim());
  return noms;
}

async function actionDeContact(page, contact, action) {
  await rechercher(page, contact.name);
  await cliquer(page, rangee(page, contact).getByRole("button", { name: "Actions du client" }));
  await page.getByRole("menuitem", { name: action, exact: true }).click();
}

test.describe("Contacts : ce que la liste affiche", () => {
  test("Première page : les 10 premiers contacts par ordre alphabétique, compteur juste", async ({ page }) => {
    await ouvrirContacts(page);
    const tous = await contactsTries();
    const affiches = await nomsAffiches(page);
    expect(affiches.length, "10 contacts par page").toBe(Math.min(10, tous.length));
    tous.slice(0, 10).forEach((c, i) => expect.soft((affiches[i] ?? "").toLowerCase(), `Ligne ${i + 1}`).toContain(c.name.toLowerCase()));
    await expect(page.getByText(`1-${Math.min(10, tous.length)} sur ${tous.length}`)).toBeVisible();
  });

  test("Page suivante et dernière page : la suite, sans trou ni doublon", async ({ page }) => {
    await ouvrirContacts(page);
    const tous = await contactsTries();
    await cliquer(page, page.getByRole("button", { name: "Go to next page" }));
    await attendreCalme(page);
    const page2 = await nomsAffiches(page);
    tous.slice(10, 20).forEach((c, i) => expect.soft((page2[i] ?? "").toLowerCase(), `Page 2, ligne ${i + 1}`).toContain(c.name.toLowerCase()));
    await cliquer(page, page.getByRole("button", { name: "Go to last page" }));
    await attendreCalme(page);
    const derniere = await nomsAffiches(page);
    const debut = Math.floor((tous.length - 1) / 10) * 10;
    tous.slice(debut).forEach((c, i) => expect.soft((derniere[i] ?? "").toLowerCase(), `Dernière page, ligne ${i + 1}`).toContain(c.name.toLowerCase()));
    await expect(page.getByText(`${debut + 1}-${tous.length} sur ${tous.length}`)).toBeVisible();
    await expect(page.getByRole("button", { name: "Go to next page" })).toBeDisabled();
  });

  test("25 contacts par page", async ({ page }) => {
    await ouvrirContacts(page);
    await page.getByRole("combobox").last().click();
    await page.getByRole("option", { name: "25" }).click();
    await attendreCalme(page);
    const tous = await contactsTries();
    expect((await nomsAffiches(page)).length).toBe(Math.min(25, tous.length));
  });

  test("Les noms s'affichent tels qu'enregistrés (majuscules comprises)", async ({ page }) => {
    await ouvrirContacts(page);
    for (const c of [CONTACTS.complet, CONTACTS.international, CONTACTS.particulier]) {
      await rechercher(page, c.email);
      await expect.soft(rangee(page, c), `« ${c.name} » affiché autrement (majuscules réécrites)`).toBeVisible();
    }
  });

  test("Un contact bloqué est marqué « bloqué » dans la liste, avec sa raison", async ({ page }) => {
    await ouvrirContacts(page);
    await rechercher(page, CONTACTS.bloque.name);
    const marque = rangee(page, CONTACTS.bloque).locator(`[title="Bloqué : ${CONTACTS.bloque.blockedReason}"]`);
    await expect(marque).toBeVisible();
  });

  test("Les contacts d'une autre organisation n'apparaissent jamais", async ({ page }) => {
    await ouvrirContacts(page);
    await rechercher(page, "intrus");
    await expect(rangee(page, CONTACTS.intrus)).toHaveCount(0);
  });
});

test.describe("Contacts : recherche", () => {
  for (const [nom, saisie, contact] of [
    ["par une partie du nom, sans accent", "lumiere", CONTACTS.complet],
    ["par l'e-mail", "orders@global", CONTACTS.international],
    ["par le SIRET", CONTACTS.complet.siret, CONTACTS.complet],
    ["par la ville", "Nantes", CONTACTS.particulier],
    ["par le prénom d'un particulier", "Sophie", CONTACTS.particulier],
  ]) {
    test(`Recherche ${nom}`, async ({ page }) => {
      await ouvrirContacts(page);
      await rechercher(page, saisie);
      await expect(rangee(page, contact), `« ${contact.name} » doit être trouvé`).toBeVisible();
      await expect(rangee(page, CONTACTS.aBloquer), "Un contact sans rapport est affiché").toHaveCount(0);
    });
  }

  test("Recherche sans résultat : message clair, compteur à zéro", async ({ page }) => {
    await ouvrirContacts(page);
    await rechercher(page, "zzz-aucun-contact");
    await expect(page.getByRole("row").filter({ has: page.getByRole("checkbox", { name: "Select row" }) })).toHaveCount(0);
    await expect(page.getByText(/aucun/i).first()).toBeVisible();
  });

  test("« Respecter les majuscules et les accents » : « lumiere » ne trouve plus « Lumière »", async ({ page }) => {
    await ouvrirContacts(page);
    await page.getByRole("button", { name: "Respecter les majuscules et les accents" }).click();
    await rechercher(page, "lumiere");
    await expect(rangee(page, CONTACTS.complet)).toHaveCount(0);
    await rechercher(page, "Lumière");
    await expect(rangee(page, CONTACTS.complet)).toBeVisible();
  });

  test("Un texte piégé dans la recherche ne s'exécute pas", async ({ page }) => {
    await ouvrirContacts(page);
    await rechercher(page, `<img src=x onerror="window.__piege=1">`);
    expect(await page.evaluate(() => window.__piege ?? null)).toBeNull();
  });
});

test.describe("Contacts : filtres et colonnes", () => {
  test("Filtrer par type « Particulier » : tous les particuliers, quelle que soit leur page", async ({ page }) => {
    await ouvrirContacts(page);
    await page.getByRole("button", { name: "Filtres" }).click();
    await page.getByRole("menuitem", { name: "Filtrer par type" }).click();
    await page.getByRole("menu").last().getByText("Particulier", { exact: true }).click();
    await page.keyboard.press("Escape");
    await attendreCalme(page);
    const particuliers = await (await base()).collection("clients").find({ workspaceId: ORG, type: "INDIVIDUAL" }).toArray();
    await etape(page, "Résultat du filtre", async () => {
      for (const p of particuliers) await expect.soft(rangee(page, p), `« ${p.name} » (particulier) doit être affiché`).toBeVisible();
      await expect(rangee(page, CONTACTS.complet), "Une entreprise est affichée").toHaveCount(0);
    }, { capture: "ecran" });
  });

  test("Masquer la colonne Email puis la réafficher", async ({ page }) => {
    await ouvrirContacts(page);
    await expect(page.getByRole("columnheader", { name: /Email/i })).toBeVisible();
    await page.getByRole("button", { name: "Filtres" }).click();
    await page.getByRole("menuitem", { name: /^Colonnes visibles/ }).click();
    await page.getByRole("menu").last().getByText(/^Email$/i).click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("columnheader", { name: /Email/i })).toHaveCount(0);
    await expect(rangee(page, CONTACTS.complet).getByText(CONTACTS.complet.email)).toHaveCount(0);
  });
});

test.describe("Contacts : export et copie", () => {
  test("Export CSV : un en-tête, une ligne par contact, les valeurs justes", async ({ page }) => {
    await ouvrirContacts(page);
    await page.getByRole("button", { name: "Exporter" }).click();
    const [telechargement] = await Promise.all([page.waitForEvent("download"), page.getByRole("menuitem", { name: "CSV" }).click()]);
    const texte = readFileSync(await telechargement.path(), "utf8").replace(/^\uFEFF/, "");
    const lignes = texte.split(/\r?\n/).filter((l) => l.trim());
    const tous = await contactsTries();
    await etape(page, "Contenu du fichier", async () => {
      expect(lignes.length - 1, "Une ligne par contact de l'organisation").toBe(tous.length);
      const atelier = lignes.find((l) => l.includes(CONTACTS.complet.name));
      expect(atelier, "Ligne du contact complet").toBeTruthy();
      for (const valeur of [CONTACTS.complet.email, CONTACTS.complet.siret, CONTACTS.complet.address.city]) expect(atelier).toContain(valeur);
      expect(texte, "Un contact d'une autre organisation est exporté").not.toContain(CONTACTS.intrus.email);
    });
  });

  test("Copier l'e-mail : le presse-papiers contient l'e-mail du contact", async ({ page }) => {
    await ouvrirContacts(page);
    await actionDeContact(page, CONTACTS.international, "Copier email");
    await expect(notification(page, "Email copié dans le presse-papiers")).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(CONTACTS.international.email);
  });
});

test.describe("Contacts : actions sur un contact", () => {
  test("Modifier un contact : aucune erreur dans la console (cache du site à jour)", async ({ page }) => {
    await ouvrirContacts(page);
    await actionDeContact(page, CONTACTS.aModifier, "Modifier");
    const fiche = page.getByRole("dialog", { name: "Modifier le client" });
    await fiche.getByPlaceholder("Ex: Direction commerciale").fill("Finances");
    await fiche.getByRole("button", { name: "Modifier", exact: true }).click();
    await expect(fiche).toBeHidden({ timeout: 15_000 });
    await page.waitForTimeout(1_000);
  });

  test.describe(() => {
    // Erreur du cache Apollo (champ invoiceCount manquant) : vérifiée par le test précédent.
    test.use({ erreursConsoleAutorisees: /go\.apollo\.dev\/c\/err/ });
  test("Modifier : la nouvelle valeur est enregistrée", async ({ page }) => {
    await ouvrirContacts(page);
    await actionDeContact(page, CONTACTS.aModifier, "Modifier");
    const fenetre = page.getByRole("dialog", { name: "Modifier le client" });
    await expect(fenetre.getByPlaceholder("Nom de l'entreprise")).toHaveValue(CONTACTS.aModifier.name);
    await fenetre.getByPlaceholder("Ex: Directeur commercial").fill("Directrice financière");
    await etape(page, "Enregistrer", async () => {
      await fenetre.getByRole("button", { name: "Modifier", exact: true }).click();
      await expect(fenetre).toBeHidden({ timeout: 15_000 });
    }, { capture: "ecran" });
    await expect.poll(async () => (await enBase(CONTACTS.aModifier)).contactFunction).toBe("Directrice financière");
    const doc = await enBase(CONTACTS.aModifier);
    expect(doc.name, "Le reste ne change pas").toBe(CONTACTS.aModifier.name);
    expect(doc.email).toBe(CONTACTS.aModifier.email);
  });
  });

  test("Supprimer un contact sans document : confirmé, supprimé", async ({ page }) => {
    await ouvrirContacts(page);
    await actionDeContact(page, CONTACTS.aSupprimer, "Supprimer");
    const alerte = page.getByRole("alertdialog", { name: "Êtes-vous sûr de vouloir supprimer ce client ?" });
    await etape(page, "Confirmer", async () => {
      await alerte.getByRole("button", { name: "Supprimer" }).click();
      await expect(alerte).toBeHidden();
    }, { capture: "ecran" });
    await expect.poll(() => enBase(CONTACTS.aSupprimer), { message: "Contact encore en base" }).toBeNull();
    await expect(rangee(page, CONTACTS.aSupprimer)).toHaveCount(0);
  });

  test("Supprimer un contact facturé : impossible, et l'interface explique pourquoi", async ({ page }) => {
    await ouvrirContacts(page);
    await rechercher(page, CONTACTS.avecFactures.name);
    await cliquer(page, rangee(page, CONTACTS.avecFactures).getByRole("button", { name: "Actions du client" }));
    const supprimer = page.getByRole("menuitem", { name: "Supprimer", exact: true });
    await supprimer.hover();
    await expect(page.getByText("Ce contact est lié à des factures, devis ou bons de commande.")).toBeVisible();
    await supprimer.click();
    await page.waitForTimeout(800);
    expect(await enBase(CONTACTS.avecFactures), "Le contact facturé a été supprimé").not.toBeNull();
    expect(await (await base()).collection("invoices").countDocuments({ "client.id": CONTACTS.avecFactures._id.toHexString() })).toBe(2);
  });

  test("Supprimer un contact facturé : l'action est annoncée indisponible (clavier, lecteur d'écran)", async ({ page }) => {
    await ouvrirContacts(page);
    await rechercher(page, CONTACTS.avecFactures.name);
    await cliquer(page, rangee(page, CONTACTS.avecFactures).getByRole("button", { name: "Actions du client" }));
    await expect(page.getByRole("menuitem", { name: "Supprimer", exact: true }), "« Supprimer » doit être marqué indisponible (aria-disabled), pas seulement grisé à l'œil").toHaveAttribute("aria-disabled", "true");
  });

  test("Assigner un membre : enregistré", async ({ page }) => {
    await ouvrirContacts(page);
    await actionDeContact(page, CONTACTS.aAssigner, "Assigner");
    const fenetre = page.getByRole("dialog", { name: "Assigner des membres" });
    await fenetre.getByRole("button", { name: new RegExp(MEMBRES.editeur.utilisateur.email) }).click();
    await etape(page, "Enregistrer", async () => {
      await fenetre.getByRole("button", { name: "Enregistrer" }).click();
      await expect(fenetre).toBeHidden();
    }, { capture: "ecran" });
    await expect.poll(async () => (await enBase(CONTACTS.aAssigner)).assignedMembers).toContain(MEMBRES.editeur.utilisateur._id.toHexString());
  });

  test("Ajouter à une liste depuis la ligne : le contact est dans la liste", async ({ page }) => {
    await ouvrirContacts(page);
    await rechercher(page, CONTACTS.lotLister.name);
    await cliquer(page, rangee(page, CONTACTS.lotLister).getByRole("button", { name: "Actions du client" }));
    await page.getByRole("menuitem", { name: "Ajouter à une liste" }).click();
    await page.getByRole("menuitem", { name: LISTES_CLIENTS.droits.name }).click();
    await expect.poll(async () => ((await (await base()).collection("clientlists").findOne({ _id: LISTES_CLIENTS.droits._id })).clients || []).map(String)).toContain(
      CONTACTS.lotLister._id.toHexString(),
    );
  });
});

test.describe("Contacts : actions groupées", () => {
  async function selectionner(page, recherche) {
    await ouvrirContacts(page);
    await rechercher(page, recherche);
    await page.getByRole("checkbox", { name: "Sélectionner tout" }).check();
  }

  test("Bloquer plusieurs contacts avec une raison", async ({ page }) => {
    await selectionner(page, "Lot à bloquer");
    await page.getByRole("button", { name: "Plus d'actions" }).click();
    await page.getByRole("menuitem", { name: /^Bloquer/ }).click();
    const alerte = page.getByRole("alertdialog").or(page.getByRole("dialog")).filter({ has: page.getByLabel("Raison du blocage (optionnel)") });
    await alerte.getByLabel("Raison du blocage (optionnel)").fill("Audit en cours");
    await alerte.getByRole("button", { name: "Bloquer" }).click();
    await expect(alerte).toBeHidden();
    for (const c of [CONTACTS.lotBloquer1, CONTACTS.lotBloquer2]) {
      await expect.poll(async () => (await enBase(c)).isBlocked, { message: `« ${c.name} » non bloqué` }).toBe(true);
      expect((await enBase(c)).blockedReason).toBe("Audit en cours");
    }
  });

  test("Supprimer plusieurs contacts sans document : tous supprimés", async ({ page }) => {
    await selectionner(page, "Lot à supprimer");
    await page.getByRole("button", { name: "Plus d'actions" }).click();
    await page.getByRole("menuitem", { name: "Supprimer définitivement" }).click();
    const alerte = page.getByRole("alertdialog", { name: "Supprimer définitivement ?" });
    await alerte.getByRole("button", { name: "Supprimer" }).click();
    await expect(alerte).toBeHidden();
    for (const c of [CONTACTS.lotSupprimer1, CONTACTS.lotSupprimer2]) await expect.poll(() => enBase(c), { message: `« ${c.name} » encore en base` }).toBeNull();
  });

  test("Supprimer en groupe un contact facturé : refusé pour lui, avec un message qui le nomme", async ({ page }) => {
    await selectionner(page, CONTACTS.avecFactures.name);
    await page.getByRole("button", { name: "Plus d'actions" }).click();
    await page.getByRole("menuitem", { name: "Supprimer définitivement" }).click();
    const alerte = page.getByRole("alertdialog", { name: "Supprimer définitivement ?" });
    await alerte.getByRole("button", { name: "Supprimer" }).click();
    await expect(notification(page, `${CONTACTS.avecFactures.name} ne peut pas être supprimé`)).toBeVisible();
    expect(await enBase(CONTACTS.avecFactures)).not.toBeNull();
  });

  test("Assigner un membre à plusieurs contacts", async ({ page }) => {
    await selectionner(page, CONTACTS.lotAssigner.name);
    await page.getByRole("button", { name: "Plus d'actions" }).click();
    await page.getByRole("menuitem", { name: "Assigner" }).click();
    const fenetre = page.getByRole("dialog", { name: /^Assigner \d+ contact/ });
    await fenetre.getByRole("button", { name: new RegExp(MEMBRES.lecteur.utilisateur.email) }).click();
    await fenetre.getByRole("button", { name: "Enregistrer" }).click();
    await expect(fenetre).toBeHidden();
    await expect.poll(async () => (await enBase(CONTACTS.lotAssigner)).assignedMembers).toContain(MEMBRES.lecteur.utilisateur._id.toHexString());
  });

  test("Ajouter des contacts sélectionnés à une liste", async ({ page }) => {
    await selectionner(page, CONTACTS.lotLister.name);
    await page.getByRole("button", { name: "Ajouter à une liste" }).click();
    await page.getByRole("menuitem", { name: LISTES_CLIENTS.prospects.name }).click();
    await expect(notification(page, /contact\(s\) ajouté\(s\) à la liste/)).toBeVisible();
    const liste = await (await base()).collection("clientlists").findOne({ _id: LISTES_CLIENTS.prospects._id });
    expect(liste.clients.map(String)).toContain(CONTACTS.lotLister._id.toHexString());
  });
});
