import React from "react";
import Link from "next/link";
import { Archive, BadgePercent, Clock3, FileCheck2, Users } from "lucide-react";

/* Contenu de la page /auto-entrepreneur. Les faits repris ici sont ceux déjà
   publiés sur la LP facturation auto-entrepreneur, passés au vouvoiement
   comme le reste des pages publiques : rien n'est avancé de plus. */
const PHOTO = "/lp/statuts/auto-entrepreneur-hero.jpg";

export const seo = {
  slug: "auto-entrepreneur",
  titreSeo: "Logiciel de gestion auto-entrepreneur | Newbi",
  description:
    "Gérez votre micro-entreprise au même endroit : devis et factures conformes, clients, dépenses, trésorerie et facturation électronique incluse. 30 jours offerts, sans carte bancaire.",
  motsCles:
    "logiciel gestion auto-entrepreneur, logiciel facturation auto-entrepreneur, facture micro-entreprise, mention TVA non applicable, facturation électronique auto-entrepreneur, trésorerie micro-entreprise",
};

export const contenu = {
  jsonLd: {
    slug: "auto-entrepreneur",
    nom: "les auto-entrepreneurs",
    description:
      "Logiciel de gestion pour auto-entrepreneurs : devis et factures aux mentions de la micro-entreprise, suivi du chiffre d'affaires encaissé et facturation électronique incluse.",
    fonctionnalites: [
      "Mentions obligatoires de la micro-entreprise pré-remplies",
      "Mention « TVA non applicable » en franchise en base",
      "Numérotation continue des factures",
      "Suivi du chiffre d'affaires encaissé pour la déclaration URSSAF",
      "Facturation électronique incluse, émission et réception",
      "Archivage des factures pendant 10 ans",
      "Accès expert-comptable gratuit",
    ],
  },

  hero: {
    titre: "Le logiciel de gestion des auto-entrepreneurs",
    chapo: (
      <>
        Devis et factures, clients, dépenses et trésorerie au même endroit, avec{" "}
        <strong className="font-medium text-gray-900">
          les mentions de la micro-entreprise déjà en place
        </strong>
        . Vous entrez votre SIRET, Newbi s&apos;occupe du reste.
      </>
    ),
    image: PHOTO,
    imageAlt: "Une auto-entrepreneuse prépare ses factures depuis son bureau",
    cartes: [
      {
        icon: BadgePercent,
        titre: "TVA non applicable",
        texte: "Mention ajoutée sur chaque facture",
      },
      {
        icon: FileCheck2,
        titre: "Conforme 2026",
        texte: "Facturation électronique incluse",
      },
      {
        icon: Clock3,
        titre: "2 minutes",
        texte: "Pour envoyer votre première facture",
      },
    ],
  },

  bento: {
    titre: "Tout ce qu'une micro-entreprise doit tenir",
    chapo:
      "Facturer, suivre ce qui est encaissé, garder les justificatifs. Trois obligations, un seul endroit — sans tableur ni rappel à retenir.",
    photo: {
      src: PHOTO,
      titre: "Facturez depuis votre bureau ou votre téléphone",
      texte:
        "Une prestation finie chez un client, la facture envoyée avant d'être rentré. Votre numérotation suit, où que vous soyez.",
    },
    cartes: [
      {
        titre: "Les mentions obligatoires, déjà remplies",
        texte:
          "Votre nom, votre SIRET, une numérotation continue et, en franchise en base, la mention « TVA non applicable » en pied de page. Rien à configurer : vous entrez le client, la prestation et le montant.",
        visuel: {
          titre: "Mentions de la facture",
          lignes: [
            "Votre nom et votre SIRET",
            "Numérotation continue",
            "« TVA non applicable » en pied de page",
          ],
          chip: "Franchise en base",
        },
      },
      {
        titre: "Vos justificatifs rangés au fil de l'eau",
        texte:
          "Factures émises, achats et reçus classés dès leur arrivée, et conservés dix ans comme la loi l'exige. Si vous travaillez avec un expert-comptable, son accès est inclus gratuitement.",
        image: {
          src: "/lp/statuts/auto-entrepreneur-bento.jpg",
          alt: "Deux personnes passent en revue des documents autour d'une table",
          cartes: [
            {
              icon: Archive,
              titre: "Conservés dix ans",
              texte: "Émis comme reçus",
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
        titre: "Suivez votre chiffre d'affaires",
        texte:
          "Chaque facture porte son statut — émise, envoyée, payée. Vous voyez ce que vous avez réellement encaissé sur la période, prêt pour votre déclaration à l'URSSAF.",
      },
    ],
  },

  sombre: {
    titre: "Ce que la facturation électronique change pour vous",
    chapo:
      "Être en franchise en base de TVA ne dispense de rien : la réforme s'applique aussi aux micro-entreprises, en deux temps. Voici le calendrier et ce qu'il implique.",
    reperes: [
      {
        chiffre: "2026",
        titre: "Recevoir devient obligatoire",
        texte:
          "Depuis le 1ᵉʳ septembre 2026, tous les auto-entrepreneurs doivent pouvoir recevoir une facture électronique par une plateforme agréée, même en franchise en base de TVA.",
      },
      {
        chiffre: "2027",
        titre: "Émettre le devient à son tour",
        texte:
          "L'obligation d'émettre vos propres factures au format électronique s'applique aux micro-entreprises à partir du 1ᵉʳ septembre 2027.",
      },
      {
        chiffre: "10 ans",
        titre: "La durée de conservation",
        texte:
          "Vos factures doivent rester accessibles dix ans. Dans Newbi elles sont archivées automatiquement, sans que vous ayez à y penser.",
      },
      {
        chiffre: "0 €",
        titre: "Ce que ça vous coûte en plus",
        texte:
          "L'émission, la réception et l'archivage au format conforme sont compris dans l'abonnement. Il n'y a pas d'option à ajouter pour être en règle.",
      },
    ],
    conclusion: (
      <>
        Concrètement, vous n&apos;avez rien à préparer : vos factures partent
        déjà au bon format par une plateforme agréée, et leur statut de
        transmission s&apos;affiche à côté de chacune d&apos;elles. Sur le livre
        des recettes et les pièces à conserver, voyez notre page{" "}
        <Link
          href="/micro-entreprise"
          className="text-white underline underline-offset-4 hover:text-white/80"
        >
          micro-entreprise
        </Link>
        .
      </>
    ),
  },

  cta: {
    titre: (
      <>
        Votre première facture
        <br className="hidden md:block" /> part aujourd&apos;hui
      </>
    ),
    sousTitre:
      "Créez votre compte, entrez votre SIRET et envoyez une facture conforme dans la foulée. 30 jours pour tester, sans carte bancaire.",
    imageAlt:
      "Une auto-entrepreneuse consulte ses factures dans Newbi sur son ordinateur portable",
  },

  faq: {
    chapo:
      "Les questions que se posent les auto-entrepreneurs avant de commencer. Si vous ne trouvez pas la vôtre,",
    questions: [
      {
        title: "Newbi est-il adapté aux auto-entrepreneurs ?",
        content:
          "Oui. Vous indiquez votre statut de micro-entrepreneur à la création du compte : vos devis, factures et avoirs portent automatiquement les mentions obligatoires (nom, SIRET, numérotation continue, mention TVA non applicable en franchise en base). Vous n'avez ni taux de TVA à configurer, ni formule légale à retenir.",
      },
      {
        title:
          "La mention « TVA non applicable » est-elle ajoutée automatiquement ?",
        content:
          "Oui. En franchise en base de TVA, la mention « TVA non applicable, art. L. 223-3 du CIBS » (ex-art. 293 B du CGI) figure en pied de page de chaque facture et vos montants s'affichent sans TVA. Le jour où vous devenez redevable, vous l'activez dans vos réglages : les factures suivantes l'incluent, les précédentes restent inchangées.",
      },
      {
        title:
          "Suis-je concerné par la facturation électronique en tant qu'auto-entrepreneur ?",
        content:
          "Oui, même en franchise en base de TVA. Depuis le 1ᵉʳ septembre 2026, tous les auto-entrepreneurs doivent pouvoir recevoir des factures électroniques via une plateforme agréée. L'obligation d'émettre vos propres factures au format électronique s'applique aux micro-entreprises à partir du 1ᵉʳ septembre 2027. Les deux sont inclus dans Newbi, sans surcoût.",
      },
      {
        title:
          "Puis-je suivre mon chiffre d'affaires pour ma déclaration URSSAF ?",
        content:
          "Oui. Chaque facture porte un statut — émise, envoyée, payée : vous voyez d'un coup d'œil ce que vous avez encaissé sur la période. Si vous avez un expert-comptable, son accès est inclus gratuitement et il exporte en CSV, Excel ou FEC selon votre formule.",
      },
      {
        title: "Combien de temps dois-je conserver mes factures ?",
        content:
          "Dix ans. Dans Newbi, vos factures sont archivées automatiquement dès leur émission : vous les retrouvez à tout moment sans avoir à gérer de dossier ni de sauvegarde de votre côté.",
      },
      {
        title: "Que se passe-t-il pendant les 30 jours offerts ?",
        content:
          "Vous avez accès à toutes les fonctionnalités pendant 30 jours, sans carte bancaire, et vous pouvez émettre de vraies factures dès le premier jour. À la fin de l'essai, vous choisissez votre formule ; si vous ne faites rien, rien n'est prélevé.",
      },
      {
        title: "Et si je fais déjà mes factures sur Word ou Excel ?",
        content:
          "Vous reprenez votre numérotation là où vous en étiez et vous importez vos clients : les nouvelles factures partent depuis Newbi, les anciennes restent ce qu'elles sont. L'équipe vous accompagne sur WhatsApp si vous voulez un coup de main pour la transition.",
      },
      {
        title:
          "Que se passe-t-il si je dépasse les seuils de la micro-entreprise ?",
        content:
          "Votre compte ne change pas de nature : vous activez la TVA dans vos réglages et vos prochaines factures la font apparaître. Si vous changez de statut, vous conservez vos clients, vos documents et votre historique.",
      },
    ],
  },
};
