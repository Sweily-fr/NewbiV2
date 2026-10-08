import React from "react";
import Link from "next/link";
import {
  Building2,
  FileDown,
  KeyRound,
  ReceiptText,
  ScanLine,
  Users,
} from "lucide-react";

/* Contenu de la page /sci.

   Elle remplace /micro-entreprise dans le menu « Pour qui » : auto-entrepreneur,
   micro-entreprise et entreprise individuelle désignent des réalités très
   proches, la SCI est au contraire un statut à part, qu'aucune autre page ne
   traitait.

   Les faits de droit repris ici : deux associés au minimum (article 1832 du
   Code civil), immatriculation au RCS, impôt sur le revenu par défaut avec
   option possible pour l'impôt sur les sociétés, déclaration 2072 pour une SCI
   à l'IR et liasse 2065 à l'IS, exonération de TVA sur la location nue
   d'habitation et option possible sur les locaux professionnels, six ans de
   conservation au titre du droit de reprise de l'administration.

   Côté produit, rien n'est avancé que Newbi ne fasse : les appels de loyer et
   de charges sont des factures, les factures de travaux des dépenses avec leur
   justificatif, et l'export comptable sort aux formats de l'offre. Newbi n'est
   pas un logiciel de gestion locative — une question de la FAQ le dit. */
const PHOTO = "/lp/statuts/sci-hero.jpg";

export const seo = {
  slug: "sci",
  titreSeo: "Logiciel de gestion pour SCI | Newbi",
  description:
    "Gérez votre SCI sans tableur : appels de loyer et de charges, factures de travaux avec leur justificatif, comptes rapprochés et dossier prêt pour l'expert-comptable. 30 jours offerts.",
  motsCles:
    "logiciel SCI, gestion SCI, comptabilité SCI, appel de loyer SCI, SCI à l'IR, SCI à l'IS, déclaration 2072, société civile immobilière",
};

export const contenu = {
  jsonLd: {
    slug: "sci",
    nom: "les sociétés civiles immobilières",
    description:
      "Logiciel de gestion pour SCI : appels de loyer et de charges, factures de travaux rattachées à leur justificatif, comptes bancaires rapprochés et export pour l'expert-comptable.",
    fonctionnalites: [
      "Appels de loyer et de charges émis depuis le même écran",
      "Numérotation continue des documents de la société",
      "Champs personnalisés pour le lot et la période",
      "Justificatifs de travaux scannés et rattachés à leur dépense",
      "Connexion des comptes bancaires de la SCI",
      "Export comptable CSV, Excel ou FEC selon la formule",
      "Accès expert-comptable gratuit",
    ],
  },

  hero: {
    titre: "Le logiciel de gestion des SCI",
    chapo: (
      <>
        Les loyers appelés, les charges refacturées, les factures de travaux
        rangées avec leur justificatif —{" "}
        <strong className="font-medium text-gray-900">
          et un dossier que votre comptable ouvre sans vous relancer
        </strong>
        .
      </>
    ),
    image: PHOTO,
    imageAlt:
      "Façades d'immeubles haussmanniens détenus par une société civile immobilière",
    cartes: [
      {
        icon: Building2,
        titre: "Loyers et charges",
        texte: "Appelés depuis vos factures",
      },
      {
        icon: ReceiptText,
        titre: "Factures de travaux",
        texte: "Photographiées et classées",
      },
      {
        icon: Users,
        titre: "Accès expert-comptable",
        texte: "Inclus, gratuit",
      },
    ],
  },

  bento: {
    titre: "Ce qu'une SCI doit tenir, au fil de l'année",
    chapo:
      "Une SCI n'a pas de clients au sens commercial, mais elle émet des documents, engage des dépenses et doit en rendre compte — à ses associés comme à l'administration.",
    photo: {
      src: PHOTO,
      titre: "Les comptes de la société, pas les vôtres",
      texte:
        "Connectez les comptes de la SCI : ce qui entre et ce qui sort se lit pour la société elle-même, sans se mélanger à votre patrimoine personnel.",
    },
    cartes: [
      {
        titre: "Les appels de loyer et de charges",
        texte:
          "Loyer, provision pour charges, régularisation : chaque ligne porte son libellé et son montant, et le lot comme la période se renseignent en champs personnalisés. La numérotation reste continue, document après document.",
        visuel: {
          titre: "Appel du mois",
          lignes: [
            "Loyer et provision sur charges",
            "Lot et période en champs personnalisés",
            "Numérotation continue",
          ],
          chip: "Un document par locataire",
        },
      },
      {
        titre: "Les travaux, avec leur justificatif",
        texte:
          "Ravalement, chaudière, honoraires de syndic : photographiez la facture, elle est lue, classée et rapprochée de la ligne bancaire correspondante. Chaque dépense garde la pièce qui la justifie.",
        image: {
          src: "/lp/statuts/sci-bento.jpg",
          alt: "Remise des clés d'un logement détenu par une SCI",
          cartes: [
            {
              icon: ScanLine,
              titre: "Facture photographiée",
              texte: "Lue et classée",
            },
            {
              icon: KeyRound,
              titre: "Rattachée au bien",
              texte: "En champ personnalisé",
            },
          ],
        },
      },
      {
        titre: "Le dossier annuel, prêt à remettre",
        texte:
          "Recettes, dépenses et pièces s'exportent au format CSV, Excel ou FEC selon votre formule. L'accès de votre expert-comptable est gratuit : il prépare la déclaration de la SCI sur des données déjà à jour.",
      },
    ],
  },

  sombre: {
    titre: "Ce qu'une SCI implique vraiment",
    chapo:
      "La société civile immobilière est une société à part entière : elle a ses associés, son régime fiscal et ses échéances. Quatre repères avant de se lancer.",
    reperes: [
      {
        chiffre: "2",
        titre: "Associés au minimum",
        texte:
          "L'article 1832 du Code civil impose au moins deux associés. La SCI est immatriculée au registre du commerce et des sociétés, avec ses statuts, son gérant et son numéro SIREN.",
      },
      {
        chiffre: "IR ou IS",
        titre: "Deux régimes, deux comptabilités",
        texte:
          "Par défaut, la SCI est à l'impôt sur le revenu : chaque associé déclare sa quote-part de résultat foncier. Sur option, elle passe à l'impôt sur les sociétés, avec une comptabilité d'engagement et des amortissements.",
      },
      {
        chiffre: "2072",
        titre: "La déclaration annuelle",
        texte:
          "Une SCI à l'IR dépose chaque année une déclaration 2072, qui ventile le résultat entre les associés. À l'IS, c'est une liasse 2065 qui est déposée à la place.",
      },
      {
        chiffre: "6 ans",
        titre: "La conservation des pièces",
        texte:
          "C'est le délai de reprise de l'administration fiscale. Une SCI à l'IS, qui tient une comptabilité complète, conserve ses documents comptables dix ans.",
      },
    ],
    conclusion: (
      <>
        Sur la TVA, la règle tient en deux lignes : la location nue à usage
        d&apos;habitation en est exonérée, tandis que la location de locaux
        professionnels nus peut y être soumise sur option. Dans les deux cas,
        les montants et les mentions de vos documents suivent ce que vous avez
        paramétré. Si votre activité relève plutôt d&apos;une société
        commerciale, voyez notre page{" "}
        <Link
          href="/sasu-eurl"
          className="text-white underline underline-offset-4 hover:text-white/80"
        >
          SASU et EURL
        </Link>
        .
      </>
    ),
  },

  cta: {
    titre: (
      <>
        Les comptes de votre SCI,
        <br className="hidden md:block" /> tenus au fil de l&apos;eau
      </>
    ),
    sousTitre:
      "Créez votre compte, émettez votre premier appel de loyer et rattachez une facture de travaux. 30 jours pour tester, sans carte bancaire.",
    imageAlt:
      "Un gérant de SCI consulte les comptes de la société dans Newbi sur son ordinateur portable",
  },

  faq: {
    chapo:
      "Les questions que se posent les gérants de SCI sur leur gestion courante. Si vous ne trouvez pas la vôtre,",
    questions: [
      {
        title: "Newbi est-il un logiciel de gestion locative ?",
        content:
          "Non, et c'est une distinction utile. Newbi ne gère ni les baux, ni l'indexation des loyers, ni les états des lieux. Il prend en charge le versant documentaire et comptable : émettre les appels de loyer et de charges, enregistrer les dépenses avec leur justificatif, rapprocher les mouvements bancaires et sortir un export pour l'expert-comptable.",
      },
      {
        title: "Comment émettre un appel de loyer dans Newbi ?",
        content:
          "C'est une facture, avec le locataire en destinataire et une ligne par poste : le loyer, la provision sur charges, et la régularisation le cas échéant. Le lot concerné et la période se renseignent en champs personnalisés, et la numérotation reste continue d'un document à l'autre.",
      },
      {
        title: "Quelles sont les obligations comptables d'une SCI ?",
        content:
          "Elles dépendent du régime fiscal. À l'impôt sur le revenu, une comptabilité de trésorerie — ce qui est encaissé, ce qui est décaissé — suffit à établir la déclaration 2072 et à rendre compte aux associés. À l'impôt sur les sociétés, la SCI tient une comptabilité d'engagement complète, avec bilan, compte de résultat et amortissements.",
      },
      {
        title: "Une SCI doit-elle facturer la TVA ?",
        content:
          "La location nue à usage d'habitation est exonérée de TVA. La location de locaux professionnels nus peut en revanche y être soumise, sur option formulée auprès de l'administration. Dans Newbi, le taux s'applique à la ligne : un document peut donc porter des postes à des régimes différents.",
      },
      {
        title: "Combien de temps conserver les pièces de la SCI ?",
        content:
          "Six ans au titre du droit de reprise de l'administration fiscale. Une SCI à l'impôt sur les sociétés, qui tient une comptabilité complète, conserve ses documents comptables dix ans. Dans Newbi, l'archivage est automatique et chaque pièce reste rattachée à son opération.",
      },
      {
        title: "Mon expert-comptable peut-il accéder aux comptes de la SCI ?",
        content:
          "Oui, et son accès est gratuit : il n'occupe pas une place d'utilisateur de votre formule. Il consulte les documents, lance ses exports au format CSV, Excel ou FEC selon l'offre, et travaille sur des données déjà à jour plutôt que sur un dossier reconstitué en fin d'exercice.",
      },
      {
        title: "Puis-je connecter les comptes bancaires de la SCI ?",
        content:
          "Oui. Les comptes de la société se connectent et leurs mouvements sont rapprochés de vos documents : un loyer encaissé se rattache à son appel, une facture de travaux à son débit. Les comptes de la SCI restent suivis pour eux-mêmes, sans se mélanger à vos comptes personnels.",
      },
      {
        title: "Que se passe-t-il pendant les 30 jours offerts ?",
        content:
          "Vous avez accès à toutes les fonctionnalités pendant 30 jours, sans carte bancaire, et vous pouvez émettre de vrais documents dès le premier jour. À la fin de l'essai, vous choisissez votre formule ; si vous ne faites rien, rien n'est prélevé.",
      },
    ],
  },
};
