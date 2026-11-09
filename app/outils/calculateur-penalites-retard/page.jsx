import Link from "next/link";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import Footer7 from "@/src/components/footer7";
import { JsonLd } from "@/src/components/seo/json-ld";
import { SITE_URL } from "@/src/lib/site";
import { faqJsonLd } from "@/src/components/public-faq";
import PenaltyCalculator from "../_components/PenaltyCalculator";
import {
  DefinitionCards,
  ExampleTable,
  GuideSection,
  InlineLink,
  MistakeList,
  RelatedLinks,
  Steps,
  ToolFaq,
} from "../_components/ToolGuide";
import {
  PLANCHER_PENALITES,
  TAUX_LEGAL_PRO,
  pourcent,
} from "../_components/taux";

// Troisième outil public, choisi sur la demande déjà captée dans Search
// Console : le cluster « délais de paiement » pèse 341 impressions sur 49
// requêtes en position moyenne 45, et « relance client » 89 de plus. Un
// calculateur est par ailleurs la forme de page qu'un cabinet comptable ou
// une CCI accepte de citer, ce qu'ils ne font pas pour une page produit.
//
// Le calculateur ne code aucun taux en dur (le taux est saisi). Le texte de
// la page cite en revanche le taux du semestre : il vient de taux.js, à
// mettre à jour chaque semestre.

export const metadata = {
  title: {
    absolute: "Calcul des pénalités de retard et indemnité de 40 € | Newbi",
  },
  description:
    "Calculez gratuitement les pénalités de retard d'une facture impayée et l'indemnité forfaitaire de 40 € : jours de retard, taux légal, paragraphe de relance à copier.",
  alternates: { canonical: "/outils/calculateur-penalites-retard" },
  openGraph: {
    title: "Calculateur de pénalités de retard gratuit | Newbi",
    description:
      "Jours de retard, pénalités, indemnité de 40 euros et paragraphe de relance prêt à copier. Gratuit, sans inscription.",
    url: "/outils/calculateur-penalites-retard",
    siteName: "Newbi",
    type: "website",
    locale: "fr_FR",
    images: [{ url: "/images/op-newbi.png", width: 1200, height: 630 }],
  },
};

const LEGAL = pourcent(TAUX_LEGAL_PRO.valeur);
const PLANCHER = pourcent(PLANCHER_PENALITES);
const SEMESTRE = TAUX_LEGAL_PRO.periode;

const ETAPES = [
  {
    title: "Saisissez le montant resté impayé",
    text: "Le montant toutes taxes comprises de la facture, ou le solde s'il y a eu un paiement partiel : les pénalités ne portent que sur ce qui reste dû.",
  },
  {
    title: "Indiquez l'échéance et la date de paiement",
    text: "La date d'échéance figurant sur la facture, puis la date du règlement. Si la facture n'est toujours pas payée, laissez la date du jour, proposée par défaut : le calcul s'arrête à aujourd'hui.",
  },
  {
    title: "Entrez votre taux et copiez la relance",
    text: `Le taux annuel prévu par vos conditions générales, au moins ${PLANCHER} au ${SEMESTRE}. Laissez cochée l'indemnité de 40 euros si votre client est un professionnel, puis copiez le paragraphe de relance qui reprend le détail du calcul.`,
  },
];

const REGLES = [
  [
    "Le point de départ",
    "Les pénalités courent dès le lendemain de la date d'échéance figurant sur la facture, sans qu'un rappel soit nécessaire. Vous n'avez ni mise en demeure à envoyer, ni relance préalable à prouver.",
  ],
  [
    "L'assiette",
    "Elles se calculent sur le montant toutes taxes comprises resté impayé, et non sur le hors taxes. En cas de paiement partiel, seul le solde porte intérêts.",
  ],
  [
    "Le taux",
    `Celui de vos conditions générales, qui ne peut être inférieur à trois fois le taux d'intérêt légal : ${LEGAL} au ${SEMESTRE} pour les créances des professionnels, soit un minimum de ${PLANCHER}. À défaut de taux convenu, c'est le taux de refinancement de la Banque centrale européenne majoré de dix points.`,
  ],
  [
    "L'indemnité de 40 euros",
    "Elle s'ajoute de plein droit, pour chaque facture payée en retard (articles L. 441-10 et D. 441-5 du Code de commerce). Si vos frais de recouvrement réels la dépassent, vous pouvez demander un complément sur justificatifs. Elle n'est pas due quand une procédure collective du client interdit le paiement.",
  ],
  [
    "Les délais maximaux",
    "Sans accord, le délai est de 30 jours après la livraison ou l'exécution de la prestation. Il ne peut dépasser 60 jours à compter de la date de la facture, ou 45 jours fin de mois si le contrat le prévoit expressément. Certains secteurs, comme le transport, ont des plafonds plus courts.",
  ],
  [
    "Les clients particuliers",
    "Ce régime ne vaut qu'entre professionnels. Face à un consommateur, pas d'indemnité de 40 euros : des pénalités supposent une clause acceptée avant la vente, et à défaut seuls les intérêts au taux légal courent, après une mise en demeure.",
  ],
];

const EXEMPLE = {
  caption: `Facture de 2 400 euros TTC échue le 15 septembre 2026 et réglée le 30 octobre 2026, conditions générales au taux plancher du ${SEMESTRE}.`,
  head: ["Élément", "Calcul", "Montant"],
  rows: [
    ["Jours de retard", "du 16 septembre au 30 octobre", "45 jours"],
    ["Pénalités de retard", `2 400 × ${PLANCHER} × 45 / 365`, "24,41 €"],
    ["Indemnité forfaitaire", "une facture", "40,00 €"],
  ],
  totals: [
    ["Pénalités et indemnité", "64,41 €"],
    ["Total dû avec la facture", "2 464,41 €"],
  ],
};

const ERREURS = [
  {
    title: "Calculer sur le montant hors taxes",
    text: "L'assiette est le montant TTC resté impayé. Calculer sur le HT minore les pénalités d'un sixième pour une facture à 20 % de TVA.",
  },
  {
    title: "Appliquer le taux annuel en entier",
    text: "Le taux est annuel : il se rapporte au nombre de jours de retard, divisé par 365. Un mois de retard à 12 % ne représente qu'environ 1 % du montant.",
  },
  {
    title: "Ne compter qu'une indemnité pour plusieurs factures",
    text: "L'indemnité de 40 euros est due par facture. Un client qui règle trois factures en retard en doit trois, soit 120 euros.",
  },
  {
    title: "Prévoir un taux sous le plancher",
    text: `Une clause à 5 % est irrégulière au ${SEMESTRE} : le minimum est ${PLANCHER}. Le taux d'intérêt légal change chaque semestre, relisez vos conditions générales en janvier et en juillet.`,
  },
  {
    title: "Ajouter de la TVA aux pénalités",
    text: "Les pénalités de retard et l'indemnité forfaitaire réparent un préjudice, elles ne rémunèrent pas une prestation : elles sont hors du champ de la TVA.",
  },
  {
    title: "Attendre trop longtemps",
    text: "Entre professionnels, l'action en paiement se prescrit par cinq ans. Face à un particulier, le délai n'est que de deux ans pour les biens et services fournis par un professionnel.",
  },
];

const FAQ = [
  {
    question: "Comment calcule-t-on les pénalités de retard sur une facture ?",
    answer: `On multiplie le montant TTC impayé par le taux annuel prévu au contrat, puis par le nombre de jours de retard divisé par 365. Pour une facture de 2 400 euros réglée avec 45 jours de retard au taux de ${PLANCHER}, cela donne 2 400 × ${PLANCHER} × 45 / 365, soit 24,41 euros, auxquels s'ajoute l'indemnité forfaitaire de 40 euros.`,
  },
  {
    question: "Quel est le taux minimum des pénalités de retard ?",
    answer: `Trois fois le taux d'intérêt légal applicable aux professionnels. Au ${SEMESTRE}, ce taux est de ${LEGAL}, d'où un minimum de ${PLANCHER} par an. Il est fixé par arrêté chaque semestre : la valeur change au 1er janvier et au 1er juillet.`,
  },
  {
    question:
      "Quel taux appliquer si mes conditions générales n'en prévoient aucun ?",
    answer:
      "Le taux de refinancement de la Banque centrale européenne en vigueur au 1er janvier ou au 1er juillet, majoré de dix points, s'applique d'office pour tout le semestre. Il n'est pas nécessaire que la facture le mentionne pour qu'il soit dû, même si l'indication du taux reste une mention obligatoire de la facture.",
  },
  {
    question:
      "L'indemnité forfaitaire de 40 euros est-elle due pour chaque facture ?",
    answer:
      "Oui. L'article D. 441-5 du Code de commerce la fixe à 40 euros par facture payée en retard, et non par client ou par relance. Elle est due de plein droit, sans mise en demeure, mais uniquement entre professionnels.",
  },
  {
    question: "Peut-on appliquer des pénalités à un client particulier ?",
    answer:
      "Pas dans les mêmes conditions. L'indemnité de 40 euros ne s'applique jamais à un consommateur. Des pénalités de retard ne sont dues que si vos conditions générales, acceptées avant la vente, les prévoient ; à défaut, seuls les intérêts au taux légal courent, à partir d'une mise en demeure. Ce calculateur suit le régime entre professionnels : pour un particulier, décochez l'indemnité.",
  },
  {
    question: "Suis-je obligé de réclamer ces pénalités ?",
    answer:
      "Elles sont dues de plein droit, mais rien ne vous oblige à les encaisser : beaucoup d'entreprises y renoncent pour préserver la relation commerciale. Votre facture doit en revanche toujours en indiquer le taux. Sur le plan fiscal, les pénalités ne sont imposables qu'une fois encaissées.",
  },
  {
    question: "Que faire si le client ne paie toujours pas ?",
    answer:
      "Après la relance amiable vient la mise en demeure par lettre recommandée avec accusé de réception, qui ouvre la voie à une injonction de payer devant le tribunal compétent : tribunal de commerce entre commerçants, tribunal judiciaire dans les autres cas. Entre professionnels, l'action se prescrit par cinq ans.",
  },
];

const LIENS = [
  [
    "/blog/penalites-retard-indemnite-forfaitaire-40-euros",
    "Pénalités de retard et indemnité de 40 €",
    "Le calcul détaillé, cas par cas.",
  ],
  [
    "/blog/quest-ce-que-delai-paiement-facture",
    "Délais de paiement légaux",
    "Délai par défaut, plafonds et calcul de l'échéance.",
  ],
  [
    "/blog/relance-facture-impayee-modele",
    "Relancer une facture impayée",
    "Quatre modèles de relance et le calendrier conseillé.",
  ],
  [
    "/blog/modele-mise-en-demeure-facture-impayee",
    "Modèle de mise en demeure",
    "La lettre type quand les relances restent sans effet.",
  ],
  [
    "/blog/injonction-de-payer-procedure-facture-impayee",
    "Injonction de payer",
    "La procédure pas à pas pour récupérer votre créance.",
  ],
  [
    "/outils/generateur-de-facture",
    "Générateur de facture gratuit",
    "Une facture avec les conditions de règlement déjà en place.",
  ],
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Calculateur de pénalités de retard",
    url: `${SITE_URL}/outils/calculateur-penalites-retard`,
    description: metadata.description,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Tout navigateur web",
    inLanguage: "fr-FR",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    publisher: {
      "@type": "Organization",
      name: "Newbi",
      url: SITE_URL,
      logo: `${SITE_URL}/images/op-newbi.png`,
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Outils",
        item: `${SITE_URL}/outils`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Calculateur de pénalités de retard",
        item: `${SITE_URL}/outils/calculateur-penalites-retard`,
      },
    ],
  },
  faqJsonLd(FAQ),
];

export default function CalculateurPenalitesPage() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <NewHeroNavbar solidBackground />

      <main className="pt-28 pb-16 bg-[#FDFDFD]">
        <div className="mx-auto max-w-[1200px] px-5">
          <nav aria-label="Fil d'Ariane" className="mb-6 text-xs text-gray-500">
            <Link href="/outils" className="hover:text-[#5a50ff]">
              Outils gratuits
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-gray-700">Pénalités de retard</span>
          </nav>

          <header className="max-w-2xl mb-10">
            <p className="text-xs uppercase tracking-wide text-[#5a50ff] mb-3">
              Outil gratuit
            </p>
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-gray-900">
              Calculateur de pénalités de retard
            </h1>
            <p className="mt-4 text-gray-600 leading-relaxed">
              Une facture réglée en retard vous donne droit à des pénalités et à
              une indemnité forfaitaire de 40 euros, dues automatiquement entre
              professionnels. Renseignez le montant, l&apos;échéance et votre
              taux : le calcul se fait dans votre navigateur et rien n&apos;est
              enregistré.
            </p>
          </header>

          <PenaltyCalculator />

          {/* ------------------- Guide, rendu côté serveur ------------------- */}
          <GuideSection
            id="mode-emploi"
            title="Calculer vos pénalités de retard en 3 étapes"
          >
            <Steps steps={ETAPES} />
          </GuideSection>

          <GuideSection
            id="regles"
            title="Les six règles qui encadrent le calcul"
            intro={
              <p>
                Le calculateur applique le régime entre professionnels de
                l&apos;article L. 441-10 du Code de commerce, à jour au 9
                novembre 2026.
              </p>
            }
          >
            <DefinitionCards items={REGLES} columns={2} />
          </GuideSection>

          <GuideSection
            id="exemple"
            title="Exemple chiffré : 45 jours de retard"
            intro={
              <p>
                Votre client professionnel règle avec un mois et demi de retard
                une facture de 2 400 euros TTC. Vos conditions générales
                retiennent trois fois le taux d&apos;intérêt légal.
              </p>
            }
          >
            <ExampleTable {...EXEMPLE} />
            <p className="mt-6 text-sm text-gray-600 leading-relaxed">
              Avec un taux de 12 % dans vos conditions générales, les pénalités
              passeraient à 35,51 euros pour le même retard. L&apos;indemnité,
              elle, reste de 40 euros quelle que soit la durée du retard et quel
              que soit le montant de la facture.
            </p>
          </GuideSection>

          <GuideSection id="erreurs" title="Les erreurs fréquentes à éviter">
            <MistakeList items={ERREURS} />
            <p className="mt-6 text-sm text-gray-600 leading-relaxed">
              Pour aller plus loin :{" "}
              <InlineLink href="/blog/penalites-retard-indemnite-forfaitaire-40-euros">
                le calcul détaillé des pénalités et de l&apos;indemnité de 40 €
              </InlineLink>
              , et les mentions de règlement à porter sur vos factures dans
              notre{" "}
              <InlineLink href="/blog/modele-facture-gratuit-word-excel-pdf">
                modèle de facture gratuit
              </InlineLink>
              .
            </p>
          </GuideSection>

          <GuideSection id="faq" title="Questions fréquentes">
            <ToolFaq items={FAQ} />
          </GuideSection>

          <GuideSection id="plus-loin" title="Pour aller plus loin">
            <RelatedLinks links={LIENS} />
          </GuideSection>

          <section className="mt-14 rounded-2xl bg-[#202020] p-8 sm:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-normal text-white mb-4">
              Ne plus courir après les paiements
            </h2>
            <p className="text-gray-400 text-sm sm:text-base mb-8 max-w-xl mx-auto">
              Newbi suit vos échéances, repère les factures en retard dès le
              premier jour et envoie les relances à votre place. 30 jours
              gratuits, sans carte bancaire.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 rounded-xl px-8 py-3 text-base font-normal bg-white text-black hover:bg-gray-100 transition duration-150 active:scale-[0.98]"
              >
                Commencer gratuitement
              </Link>
              <Link
                href="/modeles"
                className="inline-flex items-center gap-2 rounded-xl px-8 py-3 text-base font-normal border border-white/20 text-white hover:bg-white/10 transition duration-150"
              >
                Télécharger un modèle de facture
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer7 />
    </>
  );
}
