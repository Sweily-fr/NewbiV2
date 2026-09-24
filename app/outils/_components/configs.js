/**
 * Configuration des deux générateurs publics. Facture et devis partagent le
 * même composant : seuls le type passé au gabarit, le libellé de la seconde
 * date, les avertissements légaux et l'accroche changent.
 *
 * Les avertissements diffèrent réellement d'un document à l'autre : une
 * facture est une pièce comptable (numérotation continue, conservation dix
 * ans, émission électronique obligatoire au 1er septembre 2027), un devis est
 * une offre commerciale, qui n'est soumise à aucune de ces trois obligations
 * mais engage dès qu'il est signé.
 */

// Ces objets traversent la frontière serveur / client : ils ne doivent
// contenir que des valeurs sérialisables. Une fonction y provoquerait
// « Functions cannot be passed directly to Client Components ». D'où un
// nombre de jours plutôt qu'un calculateur de date.

export const FACTURE_CONFIG = {
  type: "invoice",
  prefix: "F",
  sectionTitle: "La facture",
  downloadTitle: "Télécharger votre facture",
  downloadLabel: "Télécharger la facture en PDF",
  secondDate: {
    label: "Date d'échéance",
    defaultDays: 30,
  },
  defaultTerms:
    "Paiement à 30 jours à compter de la date d'émission. En cas de retard, pénalités au taux de 3 fois le taux d'intérêt légal et indemnité forfaitaire pour frais de recouvrement de 40 euros.",
  warnings: {
    title: "Trois points restent à votre charge",
    consent:
      "J'ai compris que la numérotation, l'archivage et la conformité 2027 restent de ma responsabilité.",
    items: [
      {
        label: "La numérotation.",
        text: "Elle doit être continue et chronologique, sans trou ni doublon. Cet outil ne garde aucune mémoire d'une facture à l'autre : c'est à vous de tenir le compteur.",
      },
      {
        label: "La conservation.",
        text: "Vous devez garder chaque facture dix ans. Rien n'est enregistré ici, pensez à archiver le fichier.",
      },
      {
        label: "L'échéance de 2027.",
        text: "À partir du 1er septembre 2027, les TPE devront émettre leurs factures entre professionnels au format électronique, via une plateforme agréée. Un PDF envoyé par courriel ne suffira plus.",
      },
    ],
  },
  cta: {
    title:
      "Vous voulez créer vos factures plus vite, sans retaper vos clients ni surveiller votre numérotation ? Rejoignez Newbi.",
    subtitle:
      "Numérotation automatique, clients et produits enregistrés, relances des impayés et facturation électronique incluse. 30 jours gratuits, sans carte bancaire.",
  },
};

export const DEVIS_CONFIG = {
  type: "quote",
  prefix: "D",
  sectionTitle: "Le devis",
  downloadTitle: "Télécharger votre devis",
  downloadLabel: "Télécharger le devis en PDF",
  secondDate: {
    label: "Valable jusqu'au",
    defaultDays: 90,
  },
  defaultTerms:
    "Devis valable 3 mois à compter de sa date d'établissement. À retourner daté et signé, avec la mention manuscrite « Bon pour accord ». Acompte de 30 % à la commande, solde à la livraison.",
  warnings: {
    title: "Trois points à connaître avant d'envoyer",
    consent:
      "J'ai compris qu'un devis signé m'engage et que sa durée de validité doit y figurer.",
    items: [
      {
        label: "Un devis signé engage les deux parties.",
        text: "Dès que le client le date, le signe et porte la mention « Bon pour accord », le prix et le périmètre décrits deviennent contractuels. Détaillez donc précisément ce qui est inclus, et ce qui ne l'est pas.",
      },
      {
        label: "La durée de validité est obligatoire.",
        text: "Sans elle, vous restez tenu par votre prix sans limite dans le temps. Trois mois est l'usage courant ; adaptez-la si vos coûts bougent vite.",
      },
      {
        label: "Le devis est parfois obligatoire.",
        text: "C'est le cas pour les travaux de réparation et d'entretien au-delà de 150 euros TTC chez un particulier, et dans plusieurs secteurs réglementés comme le déménagement ou l'optique. En cas de doute, établissez-en un : il vous protège autant que votre client.",
      },
    ],
  },
  cta: {
    title:
      "Vous voulez envoyer vos devis plus vite et les transformer en facture en un clic ? Rejoignez Newbi.",
    subtitle:
      "Devis signés en ligne, relance automatique de ceux qui traînent, conversion en facture sans ressaisie, et suivi de votre taux de signature. 30 jours gratuits, sans carte bancaire.",
  },
};
