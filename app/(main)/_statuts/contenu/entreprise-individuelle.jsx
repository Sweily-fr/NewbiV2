import React from "react";
import {
  FileCheck2,
  FileDown,
  FileSpreadsheet,
  ScanLine,
  Users,
} from "lucide-react";

/* Contenu de la page /entreprise-individuelle.

   Les affirmations fiscales reprennent celles déjà publiées sur le site :
   le calendrier de la facturation électronique vient de la LP et de la page
   produit « facturation électronique » ; les conditions de déduction des
   charges viennent de l'article « Frais professionnels déductibles » et
   l'absence de liasse en micro de l'article « Obligations comptables
   micro-entreprise ». Aucun seuil ni barème n'est avancé ici. */
const PHOTO = "/lp/statuts/entreprise-individuelle-hero.jpg";

export const seo = {
  slug: "entreprise-individuelle",
  titreSeo: "Logiciel de gestion entreprise individuelle | Newbi",
  description:
    "Gérez votre entreprise individuelle au même endroit : devis et factures, achats et justificatifs, TVA, trésorerie et export comptable. Facturation électronique incluse, 30 jours offerts.",
  motsCles:
    "logiciel entreprise individuelle, gestion entreprise individuelle, facturation EI, comptabilité entreprise individuelle, régime réel, export FEC, charges déductibles indépendant",
};

export const contenu = {
  jsonLd: {
    slug: "entreprise-individuelle",
    nom: "les entreprises individuelles",
    description:
      "Logiciel de gestion pour entreprise individuelle au régime réel : ventes, achats et justificatifs rattachés, TVA calculée à la ligne et export comptable CSV, Excel ou FEC.",
    fonctionnalites: [
      "Devis et factures avec mentions obligatoires",
      "Achats et justificatifs rattachés à chaque dépense",
      "Lecture automatique des reçus et rapprochement bancaire",
      "TVA calculée à la ligne, franchise en base ou régime réel",
      "Export comptable CSV, Excel ou FEC",
      "Accès expert-comptable gratuit",
      "Facturation électronique incluse",
    ],
  },

  hero: {
    titre: "Le logiciel de gestion des entreprises individuelles",
    chapo: (
      <>
        Devis et factures, achats, TVA et trésorerie au même endroit, avec{" "}
        <strong className="font-medium text-gray-900">
          chaque justificatif rattaché à sa dépense
        </strong>
        . Votre comptable récupère un export propre, vous gardez la main.
      </>
    ),
    image: PHOTO,
    imageAlt:
      "Un artisan tourneur sur bois dans son atelier, en entreprise individuelle",
    cartes: [
      {
        icon: ScanLine,
        titre: "Justificatifs scannés",
        texte: "Une photo, la dépense est classée",
      },
      {
        icon: FileSpreadsheet,
        titre: "Export comptable",
        texte: "CSV, Excel ou FEC pour votre comptable",
      },
      {
        icon: FileCheck2,
        titre: "Conforme 2027",
        texte: "Facturation électronique incluse",
      },
    ],
  },

  bento: {
    titre: "Tout ce qu'une entreprise individuelle doit tenir",
    chapo:
      "En entreprise individuelle au régime réel, votre résultat se calcule à partir de vos pièces. Factures émises, achats, justificatifs et TVA sont donc traités au même endroit, au fil de l'eau — sans ressaisie en fin d'exercice.",
    photo: {
      src: PHOTO,
      titre: "Votre entreprise individuelle vous suit partout",
      texte:
        "Un devis signé sur place, une facture envoyée dans la foulée, un reçu photographié avant de le perdre. Votre dossier reste à jour sans retour au bureau.",
    },
    cartes: [
      {
        titre: "Vos achats et vos justificatifs, rattachés",
        texte:
          "Photographiez un reçu : la dépense est lue, classée et rapprochée de la ligne bancaire correspondante. Chaque charge garde sa pièce, et vos justificatifs restent accessibles dix ans.",
        visuel: {
          titre: "Dépense enregistrée",
          lignes: [
            "Reçu photographié et lu",
            "Classé sur la bonne charge",
            "Rapproché de la ligne bancaire",
          ],
          chip: "Accessible dix ans",
        },
      },
      {
        titre: "Un export propre pour l'expert-comptable de votre EI",
        texte:
          "Ventes, achats et TVA sortent au format CSV, Excel ou FEC selon votre formule. L'accès de votre comptable est inclus gratuitement : il travaille sur vos données sans que vous ayez à les lui envoyer.",
        image: {
          src: "/lp/statuts/entreprise-individuelle-bento.jpg",
          alt: "Un indépendant fait le point avec son expert-comptable",
          cartes: [
            {
              icon: FileDown,
              titre: "CSV, Excel ou FEC",
              texte: "Selon votre formule",
            },
            {
              icon: Users,
              titre: "Accès comptable",
              texte: "Inclus, gratuit",
            },
          ],
        },
      },
      {
        titre: "Votre TVA calculée à la ligne",
        texte:
          "Que vous soyez en franchise en base ou redevable, le bon régime s'applique sur chaque document et la TVA se totalise toute seule.",
      },
    ],
  },

  sombre: {
    titre: "Au régime réel, chaque justificatif pèse sur votre résultat",
    chapo:
      "Contrairement à la micro-entreprise, une entreprise individuelle au régime réel calcule son bénéfice imposable en retranchant ses charges du chiffre d'affaires. Une pièce manquante, c'est une charge que vous ne pourrez pas déduire.",
    reperes: [
      {
        chiffre: "Art. 39",
        titre: "Le principe de déduction",
        texte:
          "L'article 39 du Code général des impôts pose la déductibilité des charges nécessaires à l'exploitation : votre résultat imposable se calcule sur ce qu'il reste une fois ces charges retranchées.",
      },
      {
        chiffre: "3",
        titre: "Les conditions cumulatives",
        texte:
          "Une charge n'est déductible que si elle est engagée dans l'intérêt direct de l'activité, appuyée par un justificatif probant, et correspond à une dépense réelle.",
      },
      {
        chiffre: "Au prorata",
        titre: "Les dépenses mixtes",
        texte:
          "Un téléphone ou un véhicule servant aussi à titre personnel ne se déduit qu'à hauteur de son usage professionnel réel. Encore faut-il pouvoir le retracer.",
      },
      {
        chiffre: "10 ans",
        titre: "La durée de conservation",
        texte:
          "Vos factures et vos pièces doivent rester accessibles dix ans. Dans Newbi elles sont archivées automatiquement, dépense par dépense.",
      },
    ],
    conclusion:
      "C'est tout l'intérêt de saisir au fil de l'eau plutôt qu'en fin d'exercice : la pièce est rattachée au moment où la dépense est faite, et il ne reste rien à reconstituer au printemps.",
  },

  cta: {
    titre: (
      <>
        Vos pièces à jour,
        <br className="hidden md:block" /> votre comptable tranquille
      </>
    ),
    sousTitre:
      "Créez votre compte, connectez votre compte bancaire et photographiez votre premier justificatif. 30 jours pour tester, sans carte bancaire.",
    imageAlt:
      "Un indépendant en entreprise individuelle consulte ses factures dans Newbi sur son ordinateur portable",
  },

  faq: {
    chapo:
      "Les questions que se posent les entrepreneurs individuels sur la gestion de leur EI. Si vous ne trouvez pas la vôtre,",
    questions: [
      {
        title:
          "Newbi convient-il à une entreprise individuelle au régime réel ?",
        content:
          "Oui. Vos ventes, vos achats et vos justificatifs sont saisis au même endroit, la TVA est calculée à la ligne et l'ensemble s'exporte au format attendu par votre expert-comptable (CSV, Excel ou FEC selon votre formule). Newbi ne remplace pas votre comptable : il lui prépare un dossier propre.",
      },
      {
        title: "Quelle différence avec une micro-entreprise ?",
        content:
          "La micro-entreprise est un régime simplifié de l'entreprise individuelle : vous n'y avez ni bilan, ni compte de résultat, ni liasse fiscale à produire, l'abattement forfaitaire tenant lieu de charges. Une entreprise individuelle au régime réel calcule au contraire son bénéfice à partir de ses pièces, ce qui change tout dans la façon de suivre ses dépenses au quotidien. C'est pour cette raison que la gestion des achats et des justificatifs est au centre de cette page.",
      },
      {
        title: "Comment mes justificatifs sont-ils rattachés à mes dépenses ?",
        content:
          "Vous photographiez le reçu depuis votre téléphone : son contenu est lu automatiquement, la dépense est classée et rapprochée de la ligne bancaire correspondante si votre compte est connecté. La pièce reste attachée à la dépense, consultable à tout moment.",
      },
      {
        title: "Mon expert-comptable peut-il accéder à mes données ?",
        content:
          "Oui, et son accès est inclus gratuitement : un en formule Freelance, trois en TPE, cinq en Entreprise. Il consulte vos documents et lance ses exports sans occuper une place d'utilisateur et sans que vous ayez à lui envoyer quoi que ce soit.",
      },
      {
        title: "Et la TVA, si je suis redevable ?",
        content:
          "Vous activez la TVA dans vos réglages et le bon taux s'applique sur chaque ligne de vos documents. Si vous êtes en franchise en base, la mention correspondante est ajoutée à la place et vos montants restent hors taxe.",
      },
      {
        title:
          "Suis-je concerné par la facturation électronique en entreprise individuelle ?",
        content:
          "Oui. Depuis le 1ᵉʳ septembre 2026, toutes les entreprises doivent pouvoir recevoir une facture électronique par une plateforme agréée. L'obligation d'émettre suit la taille de l'entreprise : grandes entreprises et ETI depuis cette même date, TPE, PME et micro-entreprises à partir du 1ᵉʳ septembre 2027. L'émission comme la réception sont incluses dans Newbi, sans surcoût.",
      },
      {
        title: "Puis-je reprendre un exercice déjà commencé ?",
        content:
          "Oui. Vous reprenez votre numérotation de factures là où vous en étiez et vous importez vos clients. Vos documents antérieurs restent chez vous : Newbi prend la suite à partir de la date que vous choisissez.",
      },
      {
        title: "Que se passe-t-il pendant les 30 jours offerts ?",
        content:
          "Vous avez accès à toutes les fonctionnalités pendant 30 jours, sans carte bancaire, et vous pouvez émettre de vraies factures dès le premier jour. À la fin de l'essai, vous choisissez votre formule ; si vous ne faites rien, rien n'est prélevé.",
      },
    ],
  },
};
