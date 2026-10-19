/**
 * Création de factures dans l'éditeur, de bout en bout : ce que l'utilisateur
 * saisit, la notification, la ligne dans la liste, et ce qui est enregistré
 * en base (statut, numéro, totaux, articles).
 *
 * Catalogue : pour ajouter un cas, une entrée dans CAS. Chaque cas nomme ses
 * articles de façon unique (suffixe « (cas …) ») pour retrouver sa facture.
 */
import { test, expect, etape } from "../outils.mjs";
import { facturesAvecArticle } from "../base.mjs";
import {
  ajouterArticle,
  choisirClient,
  choisirType,
  continuer,
  creerFacture,
  enregistrerBrouillon,
  notifications,
  nouvelleFacture,
  remiseGlobale,
} from "./editeur.mjs";

const ALPHA = "Entreprise Alpha SAS";
const article = (cas, nom, champs = {}) => ({ nom: `${nom} (cas ${cas})`, ...champs });

const CAS = [
  {
    id: "complete",
    titre: "Facture complète validée : en attente, numérotée, bons totaux",
    articles: [article("complete", "Développement du site vitrine", { quantite: 2, prix: 500 }), article("complete", "Hébergement annuel", { quantite: 1, prix: 200 })],
    attendu: { status: "PENDING", totalHT: 1200, totalVAT: 240, totalTTC: 1440, numero: /^\d+$/ },
  },
  {
    id: "brouillon",
    titre: "Brouillon : enregistré sans numéro définitif",
    action: "brouillon",
    articles: [article("brouillon", "Audit SEO", { quantite: 1, prix: 800 })],
    attendu: { status: "DRAFT", totalHT: 800, totalTTC: 960, numero: /^DRAFT-/ },
  },
  {
    id: "particulier",
    titre: "Client particulier",
    client: "Paul Durand",
    articles: [article("particulier", "Cours particulier", { quantite: 3, prix: 40 })],
    attendu: { status: "PENDING", totalHT: 120, totalTTC: 144, client: { name: "Paul Durand", type: "INDIVIDUAL" } },
  },
  {
    id: "remise-globale-pourcentage",
    titre: "Remise globale de 10 %",
    articles: [article("remise-globale-pourcentage", "Formation", { quantite: 2, prix: 600 })],
    avantCreation: (page) => remiseGlobale(page, { valeur: 10 }),
    attendu: { status: "PENDING", totalHT: 1200, discount: 10, discountType: "PERCENTAGE", finalTotalHT: 1080, finalTotalTTC: 1296 },
  },
  {
    id: "remise-globale-montant",
    titre: "Remise globale de 100 €",
    articles: [article("remise-globale-montant", "Formation", { quantite: 2, prix: 600 })],
    avantCreation: (page) => remiseGlobale(page, { valeur: 100, type: "Montant" }),
    attendu: { status: "PENDING", totalHT: 1200, discount: 100, discountType: "FIXED", finalTotalHT: 1100, finalTotalTTC: 1320 },
  },
  {
    id: "remise-article",
    titre: "Remise de 10 % sur un article",
    articles: [article("remise-article", "Maintenance", { quantite: 2, prix: 500, remise: { valeur: 10 } })],
    attendu: { status: "PENDING", finalTotalHT: 900, finalTotalTTC: 1080, article: { discount: 10, discountType: "PERCENTAGE" } },
  },
  {
    id: "tva-zero-mention",
    titre: "TVA à 0 % avec mention d'exonération",
    articles: [article("tva-zero-mention", "Formation exonérée", { quantite: 1, prix: 900, tva: /^0%/, mention: /293 B/ })],
    attendu: { status: "PENDING", totalHT: 900, totalVAT: 0, totalTTC: 900, article: { vatRate: 0, vatExemptionText: expect.stringMatching(/293 B/) } },
  },
  {
    id: "tva-multiple",
    titre: "Deux taux de TVA (20 % et 5,5 %)",
    articles: [article("tva-multiple", "Prestation", { quantite: 1, prix: 1000 }), article("tva-multiple", "Livre", { quantite: 1, prix: 100, tva: /^5,5%/ })],
    attendu: { status: "PENDING", totalHT: 1100, totalVAT: 205.5, totalTTC: 1305.5 },
  },
  {
    id: "autoliquidation",
    titre: "Autoliquidation de TVA",
    articles: [article("autoliquidation", "Sous-traitance BTP", { quantite: 1, prix: 2000 })],
    avantArticles: (page) => page.getByRole("checkbox", { name: /Auto-liquidation/ }).check(),
    attendu: { status: "PENDING", isReverseCharge: true, totalHT: 2000, totalVAT: 0, totalTTC: 2000 },
  },
  {
    // Comportement actuel, à confirmer : une facture à 0 € est validée et
    // prend un numéro de la séquence.
    id: "zero-euro",
    titre: "Article à 0 € : facture validée à 0 €",
    articles: [article("zero-euro", "Prestation offerte", { quantite: 1, prix: 0 })],
    attendu: { status: "PENDING", totalHT: 0, totalTTC: 0, numero: /^\d+$/ },
  },
  {
    id: "acompte",
    titre: "Facture d'acompte",
    type: "Facture d'acompte",
    articles: [article("acompte", "Acompte sur projet", { quantite: 1, prix: 300 })],
    attendu: { status: "PENDING", invoiceType: "deposit", totalHT: 300, totalTTC: 360 },
  },
];

test.describe("Factures : création", () => {
  for (const cas of CAS) {
    test(cas.titre, async ({ page }) => {
      const { numero, client, article: attenduArticle, ...attenduFacture } = cas.attendu;

      await etape(page, "Client et informations", async () => {
        await nouvelleFacture(page);
        await choisirClient(page, cas.client || ALPHA);
        if (cas.type) await choisirType(page, cas.type);
        await continuer(page);
      }, { capture: "ecran" });

      await etape(page, "Articles", async () => {
        if (cas.avantArticles) await cas.avantArticles(page);
        for (const [i, a] of cas.articles.entries()) await ajouterArticle(page, i + 1, a);
        if (cas.avantCreation) await cas.avantCreation(page);
      }, { capture: "ecran" });

      await etape(page, cas.action === "brouillon" ? "Enregistrement du brouillon" : "Création", async () => {
        if (cas.action === "brouillon") {
          await enregistrerBrouillon(page);
          await expect(notifications(page).filter({ hasText: "Brouillon sauvegardé" })).toBeVisible();
        } else {
          await creerFacture(page);
          await expect(notifications(page).filter({ hasText: "Facture créée avec succès" })).toBeVisible();
        }
        await expect(page).toHaveURL(/\/dashboard\/outils\/factures(\?|$)/);
      }, { capture: "ecran" });

      await etape(page, "Enregistrement en base", async () => {
        const factures = await facturesAvecArticle(cas.articles[0].nom);
        expect(factures, "Une et une seule facture enregistrée pour ce cas").toHaveLength(1);
        const [facture] = factures;
        expect.soft(facture, "Facture enregistrée").toMatchObject(attenduFacture);
        expect.soft(facture.client, "Client de la facture").toMatchObject(client || { name: ALPHA });
        if (numero) expect.soft(String(facture.number), "Numéro").toMatch(numero);
        expect.soft(facture.items, "Articles").toHaveLength(cas.articles.length);
        if (attenduArticle) expect.soft(facture.items[0], "Premier article").toMatchObject(attenduArticle);
      });
    });
  }
});
