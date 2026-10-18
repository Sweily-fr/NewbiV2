/**
 * Création de bons de livraison, de bout en bout : client, transport,
 * adresse de livraison, articles (sans prix), puis ce qui est enregistré en
 * base. Pour ajouter un cas : une entrée dans CAS.
 */
import { test, expect, etape } from "../outils.mjs";
import { documentsAvecArticle } from "../base.mjs";
import { ajouterArticle, choisirClient, continuer, enregistrerBrouillon, notifications } from "../editeur.mjs";
import { ALPHA, article } from "../creation.mjs";
import { CLIENTS } from "../donnees/base.mjs";
import { adresseSaisie, creerBonLivraison, LISTE, messageCree, nouveauBonLivraison, transport } from "./editeur.mjs";

const ADRESSE_ALPHA = { street: CLIENTS.alpha.address.street, postalCode: CLIENTS.alpha.address.postalCode, city: CLIENTS.alpha.address.city };

const CAS = [
  {
    id: "complet",
    titre: "Bon de livraison complet : à expédier, numéroté, transporteur et adresse du client",
    avantContinuer: (page) => transport(page, { transporteur: "Chronopost", suivi: "XY123456789FR" }),
    articles: [article("complet", "Imprimante laser", { quantite: 2 }), article("complet", "Cartouches d'encre", { quantite: 6 })],
    attendu: { status: "PENDING", carrier: "Chronopost", trackingNumber: "XY123456789FR", deliveryAddress: ADRESSE_ALPHA, numero: /^\d+$/ },
  },
  {
    id: "brouillon",
    titre: "Brouillon : enregistré sans numéro définitif",
    action: "brouillon",
    articles: [article("brouillon", "Cartons de déménagement", { quantite: 30 })],
    attendu: { status: "DRAFT", numero: /^DRAFT-/ },
  },
  {
    id: "adresse-saisie",
    titre: "Adresse de livraison saisie à la main",
    avantContinuer: (page) => adresseSaisie(page, { destinataire: "Entrepôt Alpha", rue: "12 rue des Entrepôts", codePostal: "93200", ville: "Saint-Denis" }),
    articles: [article("adresse-saisie", "Palette de matériel", { quantite: 1 })],
    attendu: { status: "PENDING", deliveryAddress: { street: "12 rue des Entrepôts", postalCode: "93200", city: "Saint-Denis" } },
  },
  {
    id: "particulier",
    titre: "Client particulier",
    client: "Paul Durand",
    articles: [article("particulier", "Colis de livres", { quantite: 3 })],
    attendu: { status: "PENDING", client: { name: "Paul Durand", type: "INDIVIDUAL" } },
  },
];

test.describe("Bons de livraison : création", () => {
  for (const c of CAS) {
    test(c.titre, async ({ page }) => {
      const { numero, client, ...attendu } = c.attendu;

      await etape(page, "Client et informations de livraison", async () => {
        await nouveauBonLivraison(page);
        await choisirClient(page, c.client || ALPHA);
        if (c.avantContinuer) await c.avantContinuer(page);
        await continuer(page);
      }, { capture: "ecran" });

      await etape(page, "Articles", async () => {
        for (const [i, a] of c.articles.entries()) await ajouterArticle(page, i + 1, a);
      }, { capture: "ecran" });

      await etape(page, c.action === "brouillon" ? "Enregistrement du brouillon" : "Création", async () => {
        if (c.action === "brouillon") {
          await enregistrerBrouillon(page);
          await expect(notifications(page).filter({ hasText: "Brouillon enregistré" })).toBeVisible();
          await expect(page).toHaveURL(new RegExp(`${LISTE}(\\?|$)`));
        } else {
          await creerBonLivraison(page);
          await messageCree(page);
        }
      }, { capture: "ecran" });

      await etape(page, "Enregistrement en base", async () => {
        const bons = await documentsAvecArticle("deliverynotes", c.articles[0].nom);
        expect(bons, "Un et un seul bon enregistré pour ce cas").toHaveLength(1);
        const [bon] = bons;
        expect.soft(bon, "Bon enregistré").toMatchObject(attendu);
        expect.soft(bon.client, "Client du bon").toMatchObject(client || { name: ALPHA });
        if (numero) expect.soft(String(bon.number), "Numéro").toMatch(numero);
        expect.soft(
          bon.items.map((a) => [a.description, a.quantity]),
          "Articles et quantités",
        ).toEqual(c.articles.map((a) => [a.nom, a.quantite]));
      });
    });
  }
});
