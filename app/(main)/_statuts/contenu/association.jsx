import React from "react";
import { Archive, BadgePercent, Landmark, ScanLine, Users } from "lucide-react";

/* Contenu de la page /association.

   Les affirmations reprennent deux articles déjà publiés sur le blog :
   « Facturation association loi 1901 : règles, TVA et mentions » (activités
   lucratives accessoires, règle des 4P, mention « TVA non applicable, article
   261-7 du CGI », numéro RNA, conservation 10 ans, reçu fiscal cerfa 11580
   distinct de la facture) et « Les associations sont-elles concernées par la
   facturation électronique ? » (le périmètre dépend de l'assujettissement à
   la TVA, pas du statut juridique).

   Le seuil de franchise des impôts commerciaux n'est pas repris : il est
   revalorisé chaque année, et l'article invite à vérifier sa valeur en
   vigueur sur impots.gouv.fr. Il n'a pas sa place figé sur une page. */
const PHOTO = "/lp/statuts/association-hero.jpg";

export const seo = {
  slug: "association",
  titreSeo: "Logiciel de gestion pour association | Newbi",
  description:
    "Gérez votre association au même endroit : factures et devis aux bonnes mentions, dépenses et justificatifs, trésorerie et accès gratuit pour votre comptable. 30 jours offerts, sans carte bancaire.",
  motsCles:
    "logiciel gestion association, facturation association loi 1901, mention TVA 261-7, numéro RNA facture, trésorerie association, dépenses association",
};

export const contenu = {
  jsonLd: {
    slug: "association",
    nom: "les associations loi 1901",
    description:
      "Logiciel de gestion pour association loi 1901 : factures aux mentions de l'association, dépenses et justificatifs enregistrés au fil de l'eau, trésorerie suivie en direct.",
    fonctionnalites: [
      "Factures avec numéro RNA et mentions de l'association",
      "Mention « TVA non applicable, article 261-7 du CGI »",
      "Dépenses et justificatifs rattachés",
      "Trésorerie de l'association suivie en direct",
      "Archivage des pièces pendant 10 ans",
      "Travail à plusieurs : bureau, trésorier et comptable",
      "Accès expert-comptable gratuit",
    ],
  },

  hero: {
    titre: "Le logiciel de gestion des associations",
    chapo: (
      <>
        Factures et devis aux bonnes mentions, dépenses et justificatifs,
        trésorerie suivie —{" "}
        <strong className="font-medium text-gray-900">
          et un accès gratuit pour votre comptable
        </strong>
        . Votre bureau travaille sur les mêmes chiffres, sans tableur partagé.
      </>
    ),
    image: PHOTO,
    imageAlt:
      "Des bénévoles d'association réunis autour d'une table avec leurs dossiers",
    cartes: [
      {
        icon: BadgePercent,
        titre: "TVA non applicable",
        texte: "Mention de l'article 261-7 du CGI",
      },
      {
        icon: Users,
        titre: "Travaillez à plusieurs",
        texte: "Bureau, trésorier et comptable",
      },
      {
        icon: Archive,
        titre: "Pièces gardées 10 ans",
        texte: "Factures et justificatifs archivés",
      },
    ],
  },

  bento: {
    titre: "Tout ce qu'une association qui facture doit tenir",
    chapo:
      "Une association loi 1901 peut facturer tant que l'activité reste accessoire à son objet. Mais dès qu'elle facture, les obligations de tenue suivent : enregistrement des opérations, pièces justificatives, séparation des activités.",
    photo: {
      src: PHOTO,
      titre: "Le bureau travaille sur les mêmes chiffres",
      texte:
        "Le trésorier saisit, le président consulte, le comptable exporte. Plus de classeur qui circule ni de tableur dont personne ne sait quelle version fait foi.",
    },
    cartes: [
      {
        titre: "Des factures aux mentions de l'association",
        texte:
          "Le nom et l'adresse de l'association, son numéro RNA, son SIRET quand elle en a un, une numérotation unique et séquentielle. Sous le seuil de franchise, la mention « TVA non applicable, article 261-7 du CGI » s'ajoute et vos montants restent hors taxe.",
        visuel: {
          titre: "Mentions de la facture",
          lignes: [
            "Nom et adresse de l'association",
            "Numéro RNA, SIRET le cas échéant",
            "Numérotation unique et séquentielle",
          ],
          chip: "TVA non applicable, art. 261-7",
        },
      },
      {
        titre: "Vos dépenses et vos pièces, enregistrées au fil de l'eau",
        texte:
          "Photographiez un justificatif : la dépense est lue, classée et rapprochée de la ligne bancaire. Toutes vos pièces, émises comme reçues, restent accessibles dix ans comme l'exige la réglementation.",
        image: {
          src: "/lp/statuts/association-bento.jpg",
          alt: "Des bénévoles animent un atelier associatif",
          cartes: [
            {
              icon: ScanLine,
              titre: "Justificatif photographié",
              texte: "Lu et classé",
            },
            {
              icon: Landmark,
              titre: "Rapproché en banque",
              texte: "Sur la bonne ligne",
            },
          ],
        },
      },
      {
        titre: "La trésorerie de l'association, en temps réel",
        texte:
          "Connectez le compte de l'association et suivez ce qui entre et ce qui sort, sans attendre le relevé. De quoi préparer une assemblée générale sans tout reconstituer la veille.",
      },
    ],
  },

  sombre: {
    titre: "Ce qu'une association doit savoir avant de facturer",
    chapo:
      "Facturer n'est pas interdit à une association loi 1901 : la loi l'autorise à exercer des activités lucratives accessoires, à condition qu'elles restent secondaires par rapport à son objet non lucratif. Quatre repères avant de s'y mettre.",
    reperes: [
      {
        chiffre: "4 P",
        titre: "La règle de lucrativité",
        texte:
          "Produit, Public, Prix, Publicité : quatre critères cumulatifs que l'administration fiscale examine pour déterminer si votre association exerce réellement une activité non lucrative ou se comporte comme une entreprise.",
      },
      {
        chiffre: "261-7",
        titre: "La mention de TVA",
        texte:
          "Sous le seuil de franchise des impôts commerciaux, l'association facture sans TVA ni impôt sur les sociétés, avec la mention « TVA non applicable, article 261-7 du CGI » sur chaque document.",
      },
      {
        chiffre: "RNA",
        titre: "Le numéro à faire figurer",
        texte:
          "Le numéro du Répertoire National des Associations — un W suivi de neuf chiffres — doit apparaître sur vos factures, avec le SIRET si votre association en dispose.",
      },
      {
        chiffre: "10 ans",
        titre: "La conservation des pièces",
        texte:
          "Toutes les factures émises et reçues se conservent dix ans, avec l'enregistrement chronologique des recettes et des dépenses. Dans Newbi, l'archivage est automatique.",
      },
    ],
    conclusion:
      "Un point à ne pas confondre : un reçu fiscal atteste d'un don et ouvre droit à une réduction d'impôt, une facture correspond à une vente. Une association ne peut pas délivrer de reçu fiscal en échange d'une prestation.",
  },

  cta: {
    titre: (
      <>
        Vos comptes au clair,
        <br className="hidden md:block" /> avant la prochaine AG
      </>
    ),
    sousTitre:
      "Créez votre compte, connectez celui de l'association et invitez votre trésorier. 30 jours pour tester, sans carte bancaire.",
    imageAlt:
      "Un trésorier d'association consulte les comptes de sa structure dans Newbi sur son ordinateur portable",
  },

  faq: {
    chapo:
      "Les questions que se posent les trésoriers et les dirigeants bénévoles. Si vous ne trouvez pas la vôtre,",
    questions: [
      {
        title: "Une association loi 1901 a-t-elle le droit de facturer ?",
        content:
          "Oui. La loi du 1ᵉʳ juillet 1901 autorise les associations à exercer des activités lucratives accessoires, à condition qu'elles restent secondaires par rapport à l'objet social non lucratif. Si l'activité commerciale devient prépondérante, l'administration fiscale peut requalifier l'association en organisme à but lucratif.",
      },
      {
        title:
          "Quelles mentions doivent figurer sur une facture d'association ?",
        content:
          "Le nom et l'adresse de l'association, son numéro RNA (un W suivi de neuf chiffres), son numéro SIRET si elle en dispose — obligatoire pour les associations employeuses ou percevant des subventions —, un numéro de facture unique et séquentiel, et la mention de TVA correspondant à sa situation. Dans Newbi, ces éléments sont renseignés une fois et repris sur chaque document.",
      },
      {
        title: "Mon association doit-elle facturer avec ou sans TVA ?",
        content:
          "Tout dépend de son assujettissement. Sous le seuil de franchise des impôts commerciaux, une association facture sans TVA, avec la mention « TVA non applicable, article 261-7 du CGI ». Au-delà, elle devient redevable sur ses activités lucratives. Le seuil étant revalorisé chaque année, vérifiez sa valeur en vigueur sur impots.gouv.fr ou auprès du correspondant associations de votre centre des impôts.",
      },
      {
        title: "Un reçu fiscal et une facture, est-ce la même chose ?",
        content:
          "Non, et la confusion coûte cher. Un reçu fiscal (cerfa n° 11580) atteste d'un don et ouvre droit à une réduction d'impôt pour le donateur ; une facture correspond à une vente de bien ou de prestation. Une association ne peut pas délivrer de reçu fiscal en échange d'une prestation commerciale : seuls les dons sans contrepartie significative y donnent droit.",
      },
      {
        title:
          "Mon association est-elle concernée par la facturation électronique ?",
        content:
          "La réforme ne raisonne pas en termes de statut juridique mais d'assujettissement à la TVA. Si votre association exerce des activités lucratives qui la rendent assujettie, elle entre dans le champ avec le même calendrier que les entreprises. Si elle est intégralement non lucrative et hors du champ de la TVA, l'obligation d'émission ne s'applique pas — mais elle a tout intérêt à savoir recevoir les factures électroniques de ses fournisseurs.",
      },
      {
        title:
          "Le trésorier et le président peuvent-ils accéder au même espace ?",
        content:
          "Oui. La formule Freelance couvre un utilisateur, TPE jusqu'à dix et Entreprise jusqu'à vingt-cinq. S'y ajoutent les accès comptables, gratuits et sans occuper de place : un, trois ou cinq selon la formule. Chacun travaille sur les mêmes données, sans fichier qui circule par e-mail.",
      },
      {
        title:
          "Combien de temps dois-je conserver les pièces de l'association ?",
        content:
          "Dix ans pour les factures émises comme reçues, avec l'enregistrement chronologique des recettes et des dépenses. Dans Newbi, l'archivage se fait automatiquement à l'émission, et chaque justificatif reste rattaché à sa dépense.",
      },
      {
        title: "Que se passe-t-il pendant les 30 jours offerts ?",
        content:
          "Vous avez accès à toutes les fonctionnalités pendant 30 jours, sans carte bancaire, et vous pouvez émettre de vraies factures dès le premier jour. À la fin de l'essai, vous choisissez votre formule ; si vous ne faites rien, rien n'est prélevé.",
      },
    ],
  },
};
