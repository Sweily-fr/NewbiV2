import React from "react";
import Link from "next/link";
import {
  CalendarCheck2,
  FileDown,
  FileText,
  ScanLine,
  Users,
} from "lucide-react";

/* Contenu de la page /sas-sarl.

   Elle complète /sasu-eurl, qui traite des sociétés à associé unique : ici,
   c'est le collectif qui structure la page — plusieurs associés, plusieurs
   personnes dans l'outil, des comptes à approuver en assemblée avant d'être
   déposés. Les deux pages se renvoient l'une à l'autre pour ne pas se
   cannibaliser.

   Les faits de droit repris : de deux à cent associés pour la SARL (article
   L223-3 du Code de commerce) et pas de maximum en SAS, parts sociales d'un
   côté et actions de l'autre avec un agrément de principe pour les cessions
   de parts, approbation des comptes en assemblée dans les six mois de la
   clôture puis dépôt au greffe, impôt sur les sociétés par défaut avec une
   option pour l'impôt sur le revenu limitée à cinq exercices — sans limite de
   durée pour une SARL de famille. Les mentions obligatoires d'une facture de
   société : dénomination, forme juridique, capital social, RCS et ville
   d'immatriculation, SIREN et numéro de TVA intracommunautaire.

   Aucun taux de cotisation, aucun barème et aucun seuil de commissaire aux
   comptes ne sont repris : ils bougent. */
const PHOTO = "/lp/statuts/sas-sarl-hero.jpg";

export const seo = {
  slug: "sas-sarl",
  titreSeo: "Logiciel de gestion SAS et SARL | Newbi",
  description:
    "Gérez votre SAS ou votre SARL à plusieurs : factures aux mentions de la société, achats et justificatifs, comptes bancaires rapprochés et dossier d'exercice pour l'expert-comptable. 30 jours offerts.",
  motsCles:
    "logiciel gestion SAS, logiciel SARL, facturation SAS, comptabilité SARL, mentions obligatoires facture société, approbation des comptes, export FEC société",
};

export const contenu = {
  jsonLd: {
    slug: "sas-sarl",
    nom: "les SAS et SARL",
    description:
      "Logiciel de gestion pour société à plusieurs associés : factures aux mentions de la société, achats et justificatifs rattachés, comptes bancaires rapprochés et dossier d'exercice partagé avec l'expert-comptable.",
    fonctionnalites: [
      "Mentions de la société reprises en pied de document",
      "Jusqu'à 25 utilisateurs et 5 accès comptables",
      "Devis, factures et avoirs de la société",
      "Achats et justificatifs rattachés à leur dépense",
      "Jusqu'à 5 comptes bancaires connectés",
      "Export comptable CSV, Excel ou FEC",
      "Facturation électronique incluse",
    ],
  },

  hero: {
    titre: "Le logiciel de gestion des SAS et SARL",
    chapo: (
      <>
        Quand on est plusieurs, chacun doit voir la même chose —{" "}
        <strong className="font-medium text-gray-900">
          les factures, les achats et les comptes de la société
        </strong>
        , dans un espace où l&apos;expert-comptable entre aussi.
      </>
    ),
    image: PHOTO,
    imageAlt:
      "Deux associées d'une société font le point autour d'une table de réunion",
    cartes: [
      {
        icon: Users,
        titre: "Toute l'équipe",
        texte: "Jusqu'à 25 utilisateurs",
      },
      {
        icon: FileText,
        titre: "Mentions de la société",
        texte: "Capital, RCS et SIREN en pied",
      },
      {
        icon: FileDown,
        titre: "Dossier d'exercice",
        texte: "CSV, Excel ou FEC",
      },
    ],
  },

  bento: {
    titre: "Ce qu'une société à plusieurs associés doit tenir",
    chapo:
      "Les obligations d'une SAS et d'une SARL sont les mêmes : une comptabilité complète, des comptes approuvés puis déposés, et des documents qui portent l'identité de la société.",
    photo: {
      src: PHOTO,
      titre: "Tout le monde au même endroit",
      texte:
        "Associés, salariés, expert-comptable : chacun entre dans le même espace avec ce qui le concerne. Plus de version de tableur qui circule par e-mail.",
    },
    cartes: [
      {
        titre: "Des factures aux mentions de la société",
        texte:
          "Dénomination et forme juridique, capital social, numéro RCS et ville d'immatriculation, SIREN, numéro de TVA intracommunautaire : vous les renseignez une fois, elles sont reprises en pied de chaque document.",
        visuel: {
          titre: "Mentions de la facture",
          lignes: [
            "Dénomination et forme juridique",
            "Capital social",
            "RCS, ville et SIREN",
          ],
          chip: "TVA intracommunautaire",
        },
      },
      {
        titre: "Les comptes annuels, approuvés puis déposés",
        texte:
          "Ventes, achats et TVA s'exportent au format CSV, Excel ou FEC selon votre formule, et les pièces restent accessibles. Votre expert-comptable prépare les comptes sur des données déjà à jour, pas sur un dossier reconstitué en fin d'exercice.",
        image: {
          src: "/lp/statuts/sas-sarl-bento.jpg",
          alt: "Deux associés passent en revue les pièces de l'exercice",
          cartes: [
            {
              icon: CalendarCheck2,
              titre: "Six mois après la clôture",
              texte: "L'assemblée d'approbation",
            },
            {
              icon: ScanLine,
              titre: "Pièces rattachées",
              texte: "À leur dépense",
            },
          ],
        },
      },
      {
        titre: "Chacun à sa place dans l'espace",
        texte:
          "Jusqu'à 25 utilisateurs et 5 accès comptables selon votre formule. L'accès de l'expert-comptable est gratuit : il n'occupe pas une place de votre équipe.",
      },
    ],
  },

  sombre: {
    titre: "Ce que la société à plusieurs change",
    chapo:
      "SAS et SARL partagent l'essentiel de leurs obligations, mais pas leurs règles de fonctionnement. Quatre repères avant de choisir.",
    reperes: [
      {
        chiffre: "2 à 100",
        titre: "Les associés d'une SARL",
        texte:
          "L'article L223-3 du Code de commerce plafonne la SARL à cent associés. La SAS n'a pas de maximum, et sa variante à associé unique s'appelle la SASU.",
      },
      {
        chiffre: "Parts ou actions",
        titre: "Ce qui circule entre associés",
        texte:
          "La SARL est découpée en parts sociales, dont la cession à un tiers est soumise à l'agrément des associés. La SAS est découpée en actions, plus librement cessibles — sauf si les statuts en décident autrement.",
      },
      {
        chiffre: "6 mois",
        titre: "L'approbation des comptes",
        texte:
          "Les comptes annuels sont soumis à l'assemblée des associés dans les six mois de la clôture de l'exercice, puis déposés au greffe du tribunal de commerce.",
      },
      {
        chiffre: "IS",
        titre: "Le régime fiscal par défaut",
        texte:
          "SAS comme SARL relèvent de l'impôt sur les sociétés. Une option pour l'impôt sur le revenu existe, limitée à cinq exercices — sans limite de durée pour une SARL de famille.",
      },
    ],
    conclusion: (
      <>
        Si votre société n&apos;a qu&apos;un seul associé, c&apos;est une SASU
        ou une EURL : notre page{" "}
        <Link
          href="/sasu-eurl"
          className="text-white underline underline-offset-4 hover:text-white/80"
        >
          SASU et EURL
        </Link>{" "}
        traite de ce cas. Et si votre objet est la détention d&apos;un
        patrimoine immobilier, voyez plutôt la{" "}
        <Link
          href="/sci"
          className="text-white underline underline-offset-4 hover:text-white/80"
        >
          société civile immobilière
        </Link>
        .
      </>
    ),
  },

  cta: {
    titre: (
      <>
        Les comptes de votre société,
        <br className="hidden md:block" /> tenus à plusieurs
      </>
    ),
    sousTitre:
      "Créez votre compte, invitez vos associés et votre expert-comptable, émettez votre première facture. 30 jours pour tester, sans carte bancaire.",
    imageAlt:
      "Les associés d'une société consultent leurs comptes dans Newbi sur un ordinateur portable",
  },

  faq: {
    chapo:
      "Les questions que se posent les dirigeants de SAS et de SARL sur leur gestion courante. Si vous ne trouvez pas la vôtre,",
    questions: [
      {
        title: "Quelle différence entre une SAS et une SARL ?",
        content:
          "La SARL est encadrée par la loi : ses règles de fonctionnement sont largement fixées, elle compte de deux à cent associés et son capital est découpé en parts sociales, dont la cession à un tiers est soumise à agrément. La SAS laisse les statuts organiser la gouvernance, n'a pas de maximum d'associés et son capital est découpé en actions, plus librement cessibles. Les obligations comptables, elles, sont les mêmes.",
      },
      {
        title: "Quelles mentions doivent figurer sur mes factures ?",
        content:
          "Celles de toute facture, plus celles propres aux sociétés : la dénomination sociale, la forme juridique, l'adresse du siège, le montant du capital social, le numéro RCS suivi de la ville d'immatriculation, le SIREN et, le cas échéant, le numéro de TVA intracommunautaire. Dans Newbi, vous les renseignez une fois et elles sont reprises en pied de chaque document.",
      },
      {
        title: "Puis-je inviter mes associés et mon expert-comptable ?",
        content:
          "Oui. Votre formule détermine le nombre de places : jusqu'à 25 utilisateurs et 5 accès comptables sur l'offre la plus complète. L'accès de l'expert-comptable est gratuit et n'occupe pas une place de votre équipe.",
      },
      {
        title: "Quand faut-il approuver et déposer les comptes ?",
        content:
          "Les comptes annuels sont soumis à l'assemblée des associés dans les six mois qui suivent la clôture de l'exercice. Ils sont ensuite déposés au greffe du tribunal de commerce. Newbi ne dépose pas les comptes à votre place : il fournit à votre expert-comptable les données et les pièces sur lesquelles il les établit.",
      },
      {
        title: "Newbi gère-t-il la TVA de ma société ?",
        content:
          "Le taux s'applique à la ligne sur chaque document, et la TVA se totalise par période. Les ventes, les achats et la TVA s'exportent au format CSV, Excel ou FEC selon votre formule, pour que votre expert-comptable établisse la déclaration. Newbi ne télétransmet pas la déclaration à l'administration.",
      },
      {
        title: "Combien de comptes bancaires puis-je connecter ?",
        content:
          "Jusqu'à cinq selon votre formule. Les mouvements de la société sont rapprochés de vos documents : un encaissement se rattache à sa facture, une dépense à son justificatif. Les comptes de la société restent suivis pour eux-mêmes.",
      },
      {
        title:
          "Ma société est-elle concernée par la facturation électronique ?",
        content:
          "Oui, comme toutes les entreprises assujetties à la TVA. La réception des factures fournisseurs au format électronique devient obligatoire pour tous au 1ᵉʳ septembre 2026 ; l'émission suit, en 2026 ou en 2027 selon la taille de l'entreprise. La facturation électronique est incluse dans toutes les offres Newbi, sans supplément.",
      },
      {
        title: "Que se passe-t-il pendant les 30 jours offerts ?",
        content:
          "Vous avez accès à toutes les fonctionnalités pendant 30 jours, sans carte bancaire, et vous pouvez émettre de vrais documents dès le premier jour. À la fin de l'essai, vous choisissez votre formule ; si vous ne faites rien, rien n'est prélevé.",
      },
    ],
  },
};
