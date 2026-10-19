/**
 * Création de devis dans l'éditeur, de bout en bout : saisie, notification,
 * retour à la liste et ce qui est enregistré en base (statut, numéro,
 * validité, totaux, articles). Pour ajouter un cas : une entrée dans CAS.
 */
import { expect } from "../outils.mjs";
import { article, catalogueDeCreation } from "../creation.mjs";
import { remiseGlobale } from "../editeur.mjs";

const JOUR = 86_400_000;

const CAS = [
  {
    id: "complet",
    titre: "Devis complet validé : en attente, numéroté, valable 30 jours",
    articles: [article("complet", "Développement d'une boutique", { quantite: 2, prix: 500 }), article("complet", "Maintenance annuelle", { quantite: 1, prix: 200 })],
    attendu: { status: "PENDING", totalHT: 1200, totalVAT: 240, totalTTC: 1440, numero: /^\d+$/ },
    verifier: (devis) => {
      const jours = Math.round((new Date(devis.validUntil) - new Date(devis.issueDate)) / JOUR);
      expect.soft(jours, "Validité par défaut : 30 jours après l'émission").toBe(30);
    },
  },
  {
    id: "brouillon",
    titre: "Brouillon : enregistré sans numéro définitif",
    action: "brouillon",
    articles: [article("brouillon", "Audit d'accessibilité", { quantite: 1, prix: 800 })],
    attendu: { status: "DRAFT", totalHT: 800, totalTTC: 960, numero: /^DRAFT-/ },
  },
  {
    id: "particulier",
    titre: "Client particulier",
    client: "Paul Durand",
    articles: [article("particulier", "Cours de guitare", { quantite: 4, prix: 35 })],
    attendu: { status: "PENDING", totalHT: 140, totalTTC: 168, client: { name: "Paul Durand", type: "INDIVIDUAL" } },
  },
  {
    id: "reference",
    titre: "Référence de projet enregistrée",
    avantContinuer: (page) => page.locator("#project-reference").fill("PROJ-E2E-042"),
    articles: [article("reference", "Prestation référencée", { quantite: 1, prix: 400 })],
    attendu: { status: "PENDING", projectReference: "PROJ-E2E-042" },
  },
  {
    id: "remise-globale",
    titre: "Remise globale de 10 %",
    articles: [article("remise-globale", "Accompagnement", { quantite: 2, prix: 600 })],
    avantCreation: (page) => remiseGlobale(page, { valeur: 10 }),
    attendu: { status: "PENDING", totalHT: 1200, discount: 10, discountType: "PERCENTAGE", finalTotalHT: 1080, finalTotalTTC: 1296 },
  },
  {
    id: "remise-article",
    titre: "Remise de 10 % sur un article",
    articles: [article("remise-article", "Hébergement", { quantite: 2, prix: 500, remise: { valeur: 10 } })],
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
];

catalogueDeCreation(
  {
    describe: "Devis : création",
    editeur: "/dashboard/outils/devis/new",
    liste: "/dashboard/outils/devis",
    collection: "quotes",
    boutonCreer: "Créer le devis",
    messageCree: "Devis créé avec succès",
  },
  CAS,
);
