import React from "react";
import Link from "next/link";
import {
  Archive,
  FileText,
  Landmark,
  ReceiptText,
  ScrollText,
  ShoppingBag,
} from "lucide-react";

/* Contenu de la page /micro-entreprise.

   Auto-entrepreneur et micro-entrepreneur désignent le même statut depuis
   2016 : pour ne pas se cannibaliser, les deux pages ne traitent pas le même
   sujet. /auto-entrepreneur porte sur la facturation et la réforme ; celle-ci
   porte sur les obligations comptables du régime micro. Une question de la
   FAQ fait le lien explicitement entre les deux.

   Les faits viennent de l'article « Obligations comptables micro-entreprise :
   liste et seuils » : livre des recettes chronologique et inaltérable,
   registre des achats réservé aux activités de vente de marchandises,
   conservation 10 ans au titre de l'article L123-22 du Code de commerce,
   compte bancaire dédié au-delà de 10 000 € de chiffre d'affaires sur deux
   années, déclaration URSSAF mensuelle ou trimestrielle, et absence de bilan,
   de compte de résultat et d'expert-comptable imposé. Aucun plafond de
   chiffre d'affaires n'est repris : il est revalorisé. */
const PHOTO = "/lp/statuts/micro-entreprise-hero.jpg";

export const seo = {
  slug: "micro-entreprise",
  titreSeo: "Logiciel pour micro-entreprise | Newbi",
  description:
    "Tenez les obligations comptables de votre micro-entreprise sans tableur : livre des recettes généré depuis vos factures, justificatifs conservés 10 ans, chiffre d'affaires prêt à déclarer. 30 jours offerts.",
  motsCles:
    "logiciel micro-entreprise, obligations comptables micro-entreprise, livre des recettes, registre des achats, compte bancaire dédié micro-entrepreneur, déclaration URSSAF",
};

export const contenu = {
  jsonLd: {
    slug: "micro-entreprise",
    nom: "les micro-entreprises",
    description:
      "Logiciel de gestion pour micro-entreprise : livre des recettes généré depuis les factures, justificatifs conservés 10 ans et chiffre d'affaires prêt à déclarer.",
    fonctionnalites: [
      "Livre des recettes généré depuis les factures, téléchargeable en PDF",
      "Suivi du chiffre d'affaires encaissé par période",
      "Justificatifs scannés et rattachés à leur opération",
      "Archivage des pièces pendant 10 ans",
      "Connexion du compte bancaire dédié",
      "Devis et factures illimités",
      "Accès expert-comptable gratuit",
    ],
  },

  hero: {
    titre: "Le logiciel de gestion des micro-entreprises",
    chapo: (
      <>
        Vos factures, vos encaissements et vos justificatifs au même endroit —
        et{" "}
        <strong className="font-medium text-gray-900">
          votre livre des recettes qui se tient tout seul
        </strong>
        , à partir de ce que vous facturez.
      </>
    ),
    image: PHOTO,
    imageAlt:
      "Une commerçante en micro-entreprise derrière le comptoir de sa boutique",
    cartes: [
      {
        icon: ScrollText,
        titre: "Livre des recettes",
        texte: "Généré depuis vos factures, en PDF",
      },
      {
        icon: Landmark,
        titre: "Déclaration URSSAF",
        texte: "Votre CA encaissé, prêt à déclarer",
      },
      {
        icon: Archive,
        titre: "Pièces gardées 10 ans",
        texte: "Justificatifs archivés automatiquement",
      },
    ],
  },

  bento: {
    titre: "Les obligations du régime micro, tenues pour vous",
    chapo:
      "Pas de bilan, pas de compte de résultat, pas d'expert-comptable imposé. Restent trois choses à tenir sans faute — et c'est précisément ce que Newbi fait à partir de vos documents.",
    photo: {
      src: PHOTO,
      titre: "Vous facturez, le reste suit",
      texte:
        "Chaque paiement enregistré alimente votre livre des recettes. Vous ne saisissez pas deux fois : la vente et la comptabilité, c'est le même geste.",
    },
    cartes: [
      {
        titre: "Un livre des recettes qui se tient tout seul",
        texte:
          "Il doit être chronologique et inaltérable. Dans Newbi, il se génère à partir de vos factures et de leurs paiements, et se télécharge en PDF à tout moment — sans recopier une ligne.",
        visuel: {
          titre: "Livre des recettes",
          lignes: [
            "Chronologique",
            "Inaltérable",
            "Généré depuis vos factures",
          ],
          chip: "Téléchargeable en PDF",
        },
      },
      {
        titre: "Vos justificatifs conservés dix ans",
        texte:
          "Factures émises, achats et reçus sont archivés dès leur enregistrement. Photographiez un ticket : il est lu, classé et rattaché à sa dépense, prêt à ressortir en cas de contrôle.",
        archive: {
          titre: "Pièces archivées",
          duree: 10,
          lignes: [
            { icon: FileText, label: "Factures émises", nb: 128 },
            { icon: ShoppingBag, label: "Achats", nb: 64 },
            { icon: ReceiptText, label: "Reçus", nb: 37 },
          ],
        },
      },
      {
        titre: "Le compte dédié, suivi en direct",
        texte:
          "Connectez le compte réservé à votre activité : les encaissements sont rapprochés de vos factures, et vous savez ce que vous avez réellement encaissé sur la période à déclarer.",
      },
    ],
  },

  sombre: {
    titre: "Ce que le régime micro demande vraiment",
    chapo:
      "La comptabilité d'une micro-entreprise est allégée, pas inexistante. Quatre obligations à connaître — la deuxième ne concerne pas tout le monde, la quatrième surprend souvent.",
    reperes: [
      {
        chiffre: "Recettes",
        titre: "Le livre à tenir sans faute",
        texte:
          "Le livre des recettes enregistre chronologiquement toutes les sommes encaissées dans l'année. Il doit être inaltérable : pas de ligne effacée ni réécrite après coup.",
      },
      {
        chiffre: "Achats",
        titre: "Un second registre, parfois",
        texte:
          "Si vous vendez des marchandises, des objets, des fournitures ou des denrées, un registre des achats s'ajoute. Les prestataires de services n'y sont pas soumis.",
      },
      {
        chiffre: "10 ans",
        titre: "La conservation des pièces",
        texte:
          "C'est le délai prévu par l'article L123-22 du Code de commerce pour les documents comptables. C'est l'obligation la plus sous-estimée des micro-entrepreneurs.",
      },
      {
        chiffre: "10 000 €",
        titre: "Le compte bancaire dédié",
        texte:
          "Au-delà de 10 000 € de chiffre d'affaires sur deux années consécutives, un compte réservé à l'activité devient obligatoire. Il n'a pas à être un compte professionnel.",
      },
    ],
    conclusion: (
      <>
        Reste la déclaration de chiffre d&apos;affaires à l&apos;URSSAF,
        mensuelle ou trimestrielle selon ce que vous avez choisi. Vos factures
        portant leur statut de paiement, le montant encaissé sur la période se
        lit sans calcul. Pour les règles de facturation et la réforme de la
        facturation électronique, voyez notre page{" "}
        <Link
          href="/auto-entrepreneur"
          className="text-white underline underline-offset-4 hover:text-white/80"
        >
          auto-entrepreneur
        </Link>
        .
      </>
    ),
  },

  cta: {
    titre: (
      <>
        Votre livre des recettes,
        <br className="hidden md:block" /> à jour sans y penser
      </>
    ),
    sousTitre:
      "Créez votre compte, envoyez votre première facture et marquez-la payée. Votre livre des recettes se remplit tout seul. 30 jours pour tester, sans carte bancaire.",
    imageAlt:
      "Une micro-entrepreneuse consulte son livre des recettes dans Newbi sur son ordinateur portable",
  },

  faq: {
    chapo:
      "Les questions que se posent les micro-entrepreneurs sur leurs obligations. Si vous ne trouvez pas la vôtre,",
    questions: [
      {
        title: "Micro-entreprise et auto-entreprise, est-ce la même chose ?",
        content:
          "Oui. Depuis 2016, les deux appellations désignent le même régime : la micro-entreprise, qui est un régime simplifié de l'entreprise individuelle. « Auto-entrepreneur » est resté dans le langage courant. Cette page traite des obligations comptables du régime ; si vous cherchez plutôt les règles de facturation et la réforme de la facturation électronique, notre page auto-entrepreneur les détaille.",
      },
      {
        title: "Quelles sont mes obligations comptables en micro-entreprise ?",
        content:
          "Trois : tenir un livre des recettes, tenir un registre des achats si vous vendez des marchandises, et conserver vos justificatifs dix ans. Il n'y a ni bilan, ni compte de résultat, ni liasse fiscale à produire, et aucun expert-comptable n'est imposé. S'y ajoutent la déclaration de chiffre d'affaires à l'URSSAF et, au-delà d'un certain chiffre d'affaires, un compte bancaire dédié.",
      },
      {
        title: "Comment Newbi tient-il mon livre des recettes ?",
        content:
          "Il se génère à partir de vos factures : chaque paiement que vous enregistrez est reporté dans un livre des recettes conforme, chronologique, que vous téléchargez en PDF quand vous en avez besoin. Vous n'avez aucune ligne à saisir à la main.",
      },
      {
        title: "Dois-je tenir un registre des achats ?",
        content:
          "Seulement si votre activité consiste à vendre des marchandises, des objets, des fournitures ou des denrées — à consommer sur place ou à emporter. Les prestataires de services n'y sont pas soumis, même s'il reste recommandé de suivre ses dépenses pour piloter son activité.",
      },
      {
        title: "Suis-je obligé d'ouvrir un compte bancaire professionnel ?",
        content:
          "Un compte dédié à votre activité devient obligatoire au-delà de 10 000 € de chiffre d'affaires sur deux années consécutives. Il n'a pas à être un compte professionnel au sens bancaire : un second compte courant réservé à l'activité suffit. Vous pouvez le connecter à Newbi pour rapprocher vos encaissements de vos factures.",
      },
      {
        title: "Combien de temps dois-je garder mes justificatifs ?",
        content:
          "Dix ans à compter de la clôture de l'exercice, conformément à l'article L123-22 du Code de commerce. Cela vaut pour vos factures émises comme pour vos achats et vos reçus. Dans Newbi, l'archivage est automatique et chaque pièce reste rattachée à son opération.",
      },
      {
        title: "Comment préparer ma déclaration de chiffre d'affaires ?",
        content:
          "Chaque facture porte un statut — émise, envoyée, payée. Vous filtrez sur la période à déclarer et vous lisez le montant encaissé, sans additionner vos relevés. La déclaration est mensuelle ou trimestrielle selon l'option que vous avez retenue auprès de l'URSSAF.",
      },
      {
        title: "Que se passe-t-il pendant les 30 jours offerts ?",
        content:
          "Vous avez accès à toutes les fonctionnalités pendant 30 jours, sans carte bancaire, et vous pouvez émettre de vraies factures dès le premier jour. À la fin de l'essai, vous choisissez votre formule ; si vous ne faites rien, rien n'est prélevé.",
      },
    ],
  },
};
