import React from "react";
import { Archive, FileCheck2, FileDown, Landmark, Users } from "lucide-react";

/* Contenu de la page /sasu-eurl.

   Les affirmations juridiques reprennent celles de l'article « Micro-entreprise,
   EURL ou SASU : quel statut choisir pour se lancer ? » déjà publié sur le
   blog : personnalité morale distincte, comptabilité complète avec bilan et
   compte de résultat, responsabilité limitée aux apports sauf faute de
   gestion, régime TNS du gérant d'EURL et assimilé salarié du président de
   SASU, et nouvelle séquence de numérotation à la création de la société.
   Le calendrier de la facturation électronique vient de la page produit.
   Aucun taux de cotisation ni barème n'est repris ici. */
const PHOTO = "/lp/statuts/sasu-eurl-hero.jpg";

export const seo = {
  slug: "sasu-eurl",
  titreSeo: "Logiciel de gestion SASU et EURL | Newbi",
  description:
    "Gérez votre SASU ou votre EURL au même endroit : devis et factures, achats et justificatifs, TVA, trésorerie et accès comptable inclus. Facturation électronique comprise, 30 jours offerts.",
  motsCles:
    "logiciel gestion SASU, logiciel EURL, facturation SASU, comptabilité EURL, société associé unique, accès expert-comptable, export FEC société",
};

export const contenu = {
  jsonLd: {
    slug: "sasu-eurl",
    nom: "les SASU et EURL",
    description:
      "Logiciel de gestion pour société à associé unique : ventes, achats et TVA dans un espace partagé avec l'expert-comptable, comptes bancaires de la société connectés.",
    fonctionnalites: [
      "Espace partagé avec l'expert-comptable",
      "Devis, factures et avoirs de la société",
      "Achats et justificatifs rattachés",
      "Jusqu'à 5 comptes bancaires connectés",
      "Export comptable CSV, Excel ou FEC",
      "Jusqu'à 25 utilisateurs et 5 accès comptables",
      "Facturation électronique incluse",
    ],
  },

  hero: {
    titre: "Le logiciel de gestion des SASU et EURL",
    chapo: (
      <>
        Factures, achats, TVA et trésorerie dans{" "}
        <strong className="font-medium text-gray-900">
          un espace partagé avec votre expert-comptable
        </strong>
        . Les flux de la société restent les siens, et les pièces de
        l&apos;exercice sont prêtes quand il les demande.
      </>
    ),
    image: PHOTO,
    imageAlt:
      "Un dirigeant de société passe ses chiffres en revue avec son expert-comptable",
    cartes: [
      {
        icon: Users,
        titre: "Accès comptable inclus",
        texte: "Sans occuper de place d'utilisateur",
      },
      {
        icon: Landmark,
        titre: "Jusqu'à 5 comptes",
        texte: "Les comptes de la société, connectés",
      },
      {
        icon: FileCheck2,
        titre: "Conforme 2027",
        texte: "Facturation électronique incluse",
      },
    ],
  },

  bento: {
    titre: "Tout ce qu'une société à associé unique doit tenir",
    chapo:
      "Une société est une personne morale distincte : ses flux, ses pièces et ses comptes doivent pouvoir être présentés séparément des vôtres. C'est ce que Newbi organise au quotidien.",
    photo: {
      src: PHOTO,
      titre: "Votre comptable travaille dans le même espace",
      texte:
        "Plus d'envois de pièces en fin d'exercice : il consulte vos documents et lance ses exports quand il en a besoin, sur des données déjà à jour.",
    },
    cartes: [
      {
        titre: "Vos ventes, vos achats et votre TVA au même endroit",
        texte:
          "Factures émises, dépenses et justificatifs rattachés, TVA calculée à la ligne. Vous photographiez un reçu, il est lu, classé et rapproché de la ligne bancaire correspondante.",
        visuel: {
          titre: "L'écriture du jour",
          lignes: [
            "Facture émise",
            "Dépense et justificatif rattachés",
            "TVA calculée à la ligne",
          ],
          chip: "Rapprochée en banque",
        },
      },
      {
        titre: "Un dossier d'exercice prêt à remettre",
        texte:
          "Ventes, achats et TVA s'exportent au format CSV, Excel ou FEC selon votre formule, et vos pièces restent accessibles dix ans. Votre expert-comptable récupère un dossier propre, sans relance.",
        image: {
          src: "/lp/statuts/sasu-eurl-bento.jpg",
          alt: "Une petite équipe travaille autour d'un même écran",
          cartes: [
            {
              icon: FileDown,
              titre: "CSV, Excel ou FEC",
              texte: "Selon votre formule",
            },
            {
              icon: Archive,
              titre: "Pièces conservées",
              texte: "Dix ans, accessibles",
            },
          ],
        },
      },
      {
        titre: "Les comptes de la société, séparés des vôtres",
        texte:
          "Connectez jusqu'à cinq comptes bancaires selon votre formule : les mouvements de la société sont suivis pour eux-mêmes, et votre trésorerie se lit en temps réel.",
      },
    ],
  },

  sombre: {
    titre: "Ce qu'une société demande de plus",
    chapo:
      "Créer une EURL ou une SASU, c'est créer une personne morale distincte de vous. Quatre conséquences très concrètes sur votre gestion au quotidien.",
    reperes: [
      {
        chiffre: "Comptes annuels",
        titre: "Une comptabilité complète",
        texte:
          "L'EURL comme la SASU imposent un bilan et un compte de résultat annuels, ce qui suppose le plus souvent de travailler avec un expert-comptable.",
      },
      {
        chiffre: "Aux apports",
        titre: "La responsabilité de l'associé",
        texte:
          "La responsabilité de l'associé unique est limitée à ses apports, sauf faute de gestion. La société répond de ses engagements sur son propre patrimoine.",
      },
      {
        chiffre: "TNS ou salarié",
        titre: "Le régime du dirigeant",
        texte:
          "En EURL, le gérant associé unique relève du régime des travailleurs non salariés. En SASU, le président relève des assimilés salariés : une couverture proche du salariat, hors assurance chômage, mais des cotisations plus élevées.",
      },
      {
        chiffre: "Nouvelle",
        titre: "La numérotation repart",
        texte:
          "À la création de la société, vous ouvrez une séquence de numérotation propre à cette nouvelle entité, même si l'activité exercée ne change pas. C'est l'oubli le plus fréquent au moment du passage.",
      },
    ],
    conclusion:
      "Vous venez de la micro-entreprise ? Vous conservez votre historique de facturation et adaptez simplement vos informations légales — SIRET, forme juridique, régime de TVA — sans repartir de zéro.",
  },

  cta: {
    titre: (
      <>
        Votre exercice au propre,
        <br className="hidden md:block" /> dès la première facture
      </>
    ),
    sousTitre:
      "Créez votre compte, connectez les comptes de la société et invitez votre expert-comptable. 30 jours pour tester, sans carte bancaire.",
    imageAlt:
      "Un dirigeant de SASU consulte les factures de sa société dans Newbi sur son ordinateur portable",
  },

  faq: {
    chapo:
      "Les questions que se posent les dirigeants de SASU et d'EURL avant de commencer. Si vous ne trouvez pas la vôtre,",
    questions: [
      {
        title: "Newbi remplace-t-il mon expert-comptable ?",
        content:
          "Non, et ce n'est pas son rôle. L'EURL comme la SASU imposent une comptabilité complète avec bilan et compte de résultat annuels. Newbi tient vos ventes, vos achats, vos justificatifs et votre TVA au fil de l'eau, puis les exporte au format attendu : votre comptable part d'un dossier propre au lieu de reconstituer l'exercice.",
      },
      {
        title: "Comment mon expert-comptable accède-t-il à mes données ?",
        content:
          "Vous l'invitez depuis votre espace : son accès est gratuit et n'occupe pas de place d'utilisateur — un en formule Freelance, trois en TPE, cinq en Entreprise. Il consulte vos documents et lance ses exports (CSV, Excel ou FEC selon votre formule) sans que vous ayez à lui envoyer quoi que ce soit.",
      },
      {
        title: "Quelle différence de gestion entre une EURL et une SASU ?",
        content:
          "Du point de vue des documents et des pièces, aucune : les deux sont des sociétés à associé unique soumises à une comptabilité complète. La différence porte sur le régime du dirigeant — travailleur non salarié pour le gérant d'EURL, assimilé salarié pour le président de SASU, avec une couverture proche du salariat hors chômage et des cotisations plus élevées. Cette page couvre les deux de la même façon.",
      },
      {
        title: "Puis-je connecter les comptes bancaires de ma société ?",
        content:
          "Oui, un compte en formule Freelance, trois en TPE et cinq en Entreprise. Les mouvements sont rapprochés de vos factures et de vos dépenses, ce qui permet de suivre la trésorerie de la société pour elle-même, sans la mélanger à vos comptes personnels.",
      },
      {
        title: "Puis-je travailler à plusieurs sur le même espace ?",
        content:
          "Oui. La formule Freelance couvre un utilisateur, TPE jusqu'à dix et Entreprise jusqu'à vingt-cinq, en plus des accès comptables. Vous ajoutez un collaborateur au-delà de votre limite sans changer de formule, pour un supplément mensuel par utilisateur.",
      },
      {
        title:
          "Ma société est-elle concernée par la facturation électronique ?",
        content:
          "Oui. Depuis le 1ᵉʳ septembre 2026, toutes les entreprises doivent pouvoir recevoir une facture électronique par une plateforme agréée. L'obligation d'émettre suit la taille : grandes entreprises et ETI depuis cette même date, TPE et PME à partir du 1ᵉʳ septembre 2027. L'émission comme la réception sont incluses dans Newbi, sans surcoût.",
      },
      {
        title:
          "Je passe de la micro-entreprise à une société : que dois-je faire ?",
        content:
          "Vous conservez votre historique de facturation et vous adaptez vos informations légales — SIRET, forme juridique, régime de TVA. Un point à ne pas oublier : la société étant une nouvelle entité juridique, vous devez ouvrir une séquence de numérotation distincte, même si l'activité exercée reste la même.",
      },
      {
        title: "Que se passe-t-il pendant les 30 jours offerts ?",
        content:
          "Vous avez accès à toutes les fonctionnalités pendant 30 jours, sans carte bancaire, et vous pouvez émettre de vraies factures dès le premier jour. À la fin de l'essai, vous choisissez votre formule ; si vous ne faites rien, rien n'est prélevé.",
      },
    ],
  },
};
