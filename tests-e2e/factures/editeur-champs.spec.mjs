/**
 * Éditeur de factures : tous les champs d'un article (nom, détails,
 * quantité, prix), un client créé à la volée, les paramètres propres à une
 * facture (préfixe, notes, conditions) et ce que l'aperçu doit montrer
 * (franchise de TVA, champs du client). Créations dans « Atelier », comme
 * le catalogue de création ; un cas = une facture, retrouvée en base par le
 * nom de son article.
 *
 * Valeurs acceptées : de vrais noms d'articles (« œ », apostrophe
 * typographique insérée par la correction automatique, « n° », « m² »,
 * guillemets français…) et de vraies quantités (une demi-journée).
 */
import { test, expect, etape, notificationsErreur } from "../outils.mjs";
import { attendreCalme } from "../navigation.mjs";
import { base } from "../base.mjs";
import { verifierFormulaire, marque } from "../champs.mjs";
import { connecte, SESSION_TOKEN_FACTURES_OFFRE, SESSION_TOKEN_FACTURES_REGLAGES } from "../config.mjs";
import { CLIENTS, COMPTES } from "../donnees/base.mjs";
import { CHAMP_DOCUMENTS, CLIENTS_FACTURES } from "../donnees/lot-factures.mjs";
import { ajouterLigne, etapeArticles, LISTE, notifications, ouvrirNouvelle } from "./pages.mjs";

const ATELIER = COMPTES.atelier.organisation._id;
const ALPHA = CLIENTS.alpha.name;
const factureAvecArticle = async (nom, organisation = ATELIER) => (await base()).collection("invoices").findOne({ workspaceId: organisation, "items.description": nom });

async function ouvrirArticle(page) {
  await etapeArticles(page, ALPHA);
  await ajouterLigne(page);
  return page.locator("main");
}

const CHAMPS_ARTICLE = { nom: "#item-description-0", details: "#item-details-0", quantite: "#item-quantity-0", prix: "#item-price-0" };

verifierFormulaire({
  nom: "Article d'une facture",
  ouvrir: ouvrirArticle,
  remplir: async (zone, v) => {
    for (const [cle, selecteur] of Object.entries(CHAMPS_ARTICLE)) {
      if (v[cle] === undefined) continue;
      await zone.locator(selecteur).fill(v[cle]);
    }
  },
  valider: (zone) => zone.getByRole("button", { name: "Créer la facture" }).click(),
  // Création réussie : retour à la liste des factures.
  ferme: (_zone, page, timeout = 15_000) => expect(page).toHaveURL(new RegExp(`${LISTE}(\\?|$)`), { timeout }),
  valeurs: (cas) => ({ nom: `Prestation ${marque(cas)}`, details: "", quantite: "2", prix: "150" }),
  enregistre: (v) => factureAvecArticle((v.nom || "").trim() || "__aucun__"),
  champs: {
    "Prix unitaire": {
      cle: "prix",
      lu: (doc) => doc.items[0].unitPrice,
      normaliser: (v) => Number(v.replace(",", ".")),
      refuses: { "en lettres": "abc" },
      acceptes: { "avec virgule (1234,56)": "1234,56", "à zéro (ligne offerte)": "0" },
    },
    "Nom de l'article": {
      cle: "nom",
      obligatoire: true,
      lu: (doc) => doc.items[0].description,
      refuses: { "d'un seul caractère": "A" },
      acceptes: {
        "avec ligature œ (bœuf)": "Côte de bœuf maturée",
        "avec apostrophe typographique": "L’atelier du bois massif",
        "avec « n° »": "Lot n° 12 de pavés",
        "avec des guillemets français": "Formule « Sérénité » annuelle",
        "avec « m² »": "Pose de 25 m² de parquet",
        "avec un nom polonais (Łódź)": "Mission à Łódź",
        "avec « & » et chiffres": "Conseil & audit 2026 (x2)",
      },
    },
    "Détails supplémentaires": {
      cle: "details",
      lu: (doc) => doc.items[0].details,
      refuses: { "de 501 caractères": "d".repeat(501) },
      acceptes: { "sur deux lignes": "Ligne un\nLigne deux", "avec des signes < et > (texte, pas du code)": "Prix < 100 € et délai > 3 jours" },
    },
    Quantité: {
      cle: "quantite",
      lu: (doc) => doc.items[0].quantity,
      normaliser: (v) => Number(v.replace(",", ".")),
      acceptes: { "décimale avec virgule (1,5)": "1,5", "une demi-journée (0,5)": "0,5", "un quart d'heure (0,25)": "0,25" },
    },
  },
});

test.describe("Éditeur de factures : client créé à la volée", () => {
  async function nouveauClient(page) {
    await page.getByRole("tab", { name: "Nouveau client" }).click();
    await page.getByRole("button", { name: "Créer un client manuellement" }).click();
    const tiroir = page.getByRole("dialog").filter({ has: page.getByText("Ajoutez un nouveau client") });
    await expect(tiroir).toBeVisible();
    return tiroir;
  }

  for (const [cas, client] of [
    ["particulier", { type: "Particulier", prenom: "Hélène", nom: "Brémond", email: "helene.bremond@e2e.test" }],
    ["entreprise avec « œ » (Cœur de Lion SARL)", { type: "Entreprise", raison: "Cœur de Lion SARL", email: "contact@coeur-de-lion-factures.test" }],
  ]) {
    test(`Client ${cas} créé depuis l'éditeur : enregistré et choisi pour la facture`, async ({ page }) => {
      await ouvrirNouvelle(page);
      const tiroir = await nouveauClient(page);
      await tiroir.getByRole("tab", { name: client.type }).click();
      if (client.raison) await tiroir.getByPlaceholder("Nom de l'entreprise").fill(client.raison);
      if (client.prenom) {
        await tiroir.getByPlaceholder("Prénom").fill(client.prenom);
        await tiroir.getByPlaceholder("Nom", { exact: true }).fill(client.nom);
      }
      await tiroir.getByPlaceholder("contact@exemple.com").fill(client.email);
      await tiroir.getByPlaceholder("1 rue de l'exemple").fill("18 rue des Écoles");
      await tiroir.getByPlaceholder("Paris").first().fill("Rennes");
      const codePostal = tiroir.getByPlaceholder(/^\d{5}$|Code postal|75001/).first();
      if (await codePostal.isVisible().catch(() => false)) await codePostal.fill("35000");
      await etape(page, "Créer et appliquer", async () => {
        await tiroir.getByRole("button", { name: "Créer et appliquer" }).click();
        // Une réponse en 15 s : succès ou message d'erreur, jamais une attente sans fin.
        await expect(notifications(page).first(), "Aucune réponse à la création du client (l'écran attend sans fin)").toBeVisible({ timeout: 15_000 });
        expect(await notificationsErreur(page).allInnerTexts(), "Client refusé").toEqual([]);
      }, { capture: "ecran" });
      await expect.poll(async () => (await base()).collection("clients").countDocuments({ workspaceId: ATELIER, email: client.email }), { message: "Client absent de la base", timeout: 10_000 }).toBe(1);
      await expect(page.getByRole("combobox").filter({ hasText: client.raison || client.prenom }).first(), "Le client créé n'est pas choisi pour la facture").toBeVisible();
    });
  }
});

test.describe("Éditeur de factures : paramètres de la facture", () => {
  async function parametresDeLaFacture(page) {
    await page.locator("main button:has(svg.lucide-settings)").first().click();
    await expect(page.getByText("Paramètres de la facture").first()).toBeVisible();
  }

  test("Notes d'en-tête, notes de bas de page et conditions : appliquées à la facture et enregistrées", async ({ page }) => {
    const nom = "Prestation avec notes et conditions";
    await etapeArticles(page, ALPHA);
    await ajouterLigne(page);
    await page.locator("#item-description-0").fill(nom);
    await page.locator("#item-price-0").fill("300");
    await parametresDeLaFacture(page);
    await page.getByRole("textbox", { name: "Notes d'en-tête" }).fill("Commande n° 2026-42 du 3 octobre");
    await page.getByRole("textbox", { name: "Notes de bas de page" }).fill("Merci de rappeler le numéro de facture lors du virement.");
    await page.getByRole("textbox", { name: "Conditions générales" }).fill("Paiement à 30 jours. Indemnité forfaitaire de recouvrement : 40 €.");
    await page.getByRole("button", { name: "Appliquer à cette facture" }).click();
    await expect(notifications(page).filter({ hasText: "Paramètres appliqués" }).first()).toBeVisible();
    await page.getByRole("button", { name: "Créer la facture" }).click();
    await expect(notifications(page).filter({ hasText: "Facture créée avec succès" }).first()).toBeVisible();
    const f = await factureAvecArticle(nom);
    expect(f, "Facture enregistrée").not.toBeNull();
    expect.soft(f.headerNotes).toBe("Commande n° 2026-42 du 3 octobre");
    expect.soft(f.footerNotes).toBe("Merci de rappeler le numéro de facture lors du virement.");
    expect.soft(f.termsAndConditions).toBe("Paiement à 30 jours. Indemnité forfaitaire de recouvrement : 40 €.");
  });

  test("Préfixe de 13 caractères accepté par les paramètres : la facture est créée avec ce préfixe", async ({ page }) => {
    const nom = "Prestation au préfixe long";
    await etapeArticles(page, ALPHA);
    await ajouterLigne(page);
    await page.locator("#item-description-0").fill(nom);
    await page.locator("#item-price-0").fill("120");
    await parametresDeLaFacture(page);
    // Le site accepte jusqu'à 20 caractères ; l'API en refuse plus de 10.
    await page.getByRole("textbox", { name: "Préfixe de facture" }).fill("FACTURES-2026");
    await page.getByRole("button", { name: "Appliquer à cette facture" }).click();
    await expect(notifications(page).filter({ hasText: "Paramètres appliqués" }).first(), "Préfixe refusé par les paramètres").toBeVisible();
    await page.getByRole("button", { name: "Créer la facture" }).click();
    await etape(page, "Création", async () => {
      await page.waitForTimeout(2_500);
      const erreurs = (await notificationsErreur(page).allInnerTexts()).map((t) => t.replace(/\s+/g, " "));
      expect(erreurs, "Le préfixe accepté par les paramètres est refusé à la création de la facture").toEqual([]);
    }, { capture: "ecran" });
    const f = await factureAvecArticle(nom);
    expect(f?.prefix, "Facture enregistrée avec le préfixe choisi").toBe("FACTURES-2026");
  });
});

test.describe("Éditeur de factures : franchise en base de TVA", () => {
  // Organisation « Offre Factures » : en franchise en base de TVA.
  test.use({ storageState: connecte(SESSION_TOKEN_FACTURES_OFFRE) });

  test("Entreprise en franchise : l'aperçu porte « TVA non applicable, art. 293 B du CGI »", async ({ page }) => {
    await etapeArticles(page, CLIENTS_FACTURES.offre.name);
    await ajouterLigne(page);
    await page.locator("#item-description-0").fill("Prestation en franchise");
    await page.locator("#item-price-0").fill("500");
    await page.waitForTimeout(1_000);
    const texte = await page.locator("main").innerText();
    expect.soft(texte, "Mention de franchise absente de l'aperçu").toMatch(/TVA non applicable,? art(icle|\.) 293 B du CGI/);
    expect.soft(texte, "Référence erronée (L. 223-3 du CIBS n'existe pas pour la franchise)").not.toMatch(/223-3/);
  });
});

test.describe("Éditeur de factures : champs du client sur les documents", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FACTURES_REGLAGES) });

  test("Champ du client « Sur les documents » : visible dans l'aperçu et figé sur la facture émise", async ({ page }) => {
    const nom = "Entretien avec numéro de dossier";
    await etapeArticles(page, CLIENTS_FACTURES.volume.name);
    await ajouterLigne(page);
    await page.locator("#item-description-0").fill(nom);
    await page.locator("#item-price-0").fill("80");
    await page.waitForTimeout(1_000);
    await expect.soft(page.locator("main").getByText(CHAMP_DOCUMENTS.valeur).first(), "Valeur du champ du client absente de l'aperçu").toBeVisible();
    await page.getByRole("button", { name: "Créer la facture" }).click();
    await expect(notifications(page).filter({ hasText: "Facture créée avec succès" }).first()).toBeVisible();
    const f = await factureAvecArticle(nom, COMPTES.facturesReglages.organisation._id);
    expect(f?.client?.documentFields, "Champs du client figés sur la facture").toEqual(expect.arrayContaining([expect.objectContaining({ label: CHAMP_DOCUMENTS.nom, value: CHAMP_DOCUMENTS.valeur })]));
  });
});
