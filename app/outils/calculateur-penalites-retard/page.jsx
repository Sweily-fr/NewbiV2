import Link from "next/link";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import Footer7 from "@/src/components/footer7";
import { JsonLd } from "@/src/components/seo/json-ld";
import { SITE_URL } from "@/src/lib/site";
import PenaltyCalculator from "../_components/PenaltyCalculator";

// Troisième outil public, choisi sur la demande déjà captée dans Search
// Console : le cluster « délais de paiement » pèse 341 impressions sur 49
// requêtes en position moyenne 45, et « relance client » 89 de plus. Un
// calculateur est par ailleurs la forme de page qu'un cabinet comptable ou
// une CCI accepte de citer, ce qu'ils ne font pas pour une page produit.

export const metadata = {
  title: {
    absolute:
      "Calculateur de pénalités de retard et indemnité de 40 € | Newbi",
  },
  description:
    "Calculez gratuitement les pénalités de retard dues sur une facture impayée, avec l'indemnité forfaitaire de recouvrement de 40 euros, et copiez le paragraphe de relance à envoyer à votre client.",
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

const REGLES = [
  [
    "Le point de départ",
    "Les pénalités courent dès le jour suivant la date de règlement figurant sur la facture, sans qu'un rappel soit nécessaire. Vous n'avez ni mise en demeure à envoyer, ni relance préalable à prouver.",
  ],
  [
    "L'assiette",
    "Elles se calculent sur le montant toutes taxes comprises resté impayé, et non sur le hors taxes. En cas de paiement partiel, seul le solde porte intérêts.",
  ],
  [
    "Le taux",
    "Celui que prévoient vos conditions générales de vente, sans pouvoir descendre sous trois fois le taux d'intérêt légal. À défaut de clause, le taux directeur de la Banque centrale européenne majoré de dix points s'applique de plein droit.",
  ],
  [
    "L'indemnité de 40 euros",
    "Elle s'ajoute automatiquement, pour chaque facture payée en retard et non pour l'ensemble de la créance. Si vos frais de recouvrement réels la dépassent, vous pouvez réclamer le complément sur justificatifs.",
  ],
  [
    "Les délais maximaux",
    "Entre professionnels, le règlement intervient au plus tard 60 jours après la date d'émission, ou 45 jours fin de mois si le contrat le prévoit expressément. À défaut d'accord, le délai est de 30 jours après réception.",
  ],
  [
    "Les clients particuliers",
    "Ce régime ne s'applique qu'entre professionnels. Face à un consommateur, les intérêts supposent une clause acceptée avant la vente, et à défaut le taux légal après mise en demeure.",
  ],
];

const FAQ = [
  {
    q: "Comment calcule-t-on des pénalités de retard sur une facture ?",
    r: "On multiplie le montant TTC impayé par le taux annuel prévu au contrat, puis on rapporte le résultat au nombre de jours de retard, divisé par 365. Pour une facture de 1 200 euros réglée avec 30 jours de retard à un taux de 12 %, cela donne 1 200 × 12 % × 30 / 365, soit 11,84 euros, auxquels s'ajoute l'indemnité forfaitaire de 40 euros.",
  },
  {
    q: "Quel taux appliquer si mes conditions générales n'en prévoient aucun ?",
    r: "Le taux directeur de la Banque centrale européenne en vigueur au 1er janvier ou au 1er juillet, majoré de dix points, s'applique d'office pour tout le semestre. C'est un plancher légal : il n'est pas nécessaire que la facture le mentionne pour qu'il soit dû, même si la mention du taux reste une mention obligatoire sanctionnable.",
  },
  {
    q: "L'indemnité de 40 euros est-elle due pour chaque facture ?",
    r: "Oui. L'article D441-5 du Code de commerce la prévoit par facture payée en retard, et non par client ou par relance. Un client qui règle cinq factures en retard doit cinq indemnités de 40 euros.",
  },
  {
    q: "Suis-je obligé de réclamer ces pénalités ?",
    r: "Elles sont dues de plein droit, mais rien ne vous oblige à les encaisser. Beaucoup d'entreprises y renoncent pour préserver la relation commerciale. Attention toutefois : sur le plan comptable, les pénalités ne sont imposables qu'une fois encaissées, et y renoncer par principe dans vos conditions générales est en revanche interdit.",
  },
  {
    q: "Que faire si le client ne paie toujours pas ?",
    r: "Après la relance amiable vient la mise en demeure par lettre recommandée, qui fait courir les intérêts judiciaires et ouvre la voie à une injonction de payer devant le tribunal de commerce. Entre professionnels, l'action se prescrit par cinq ans.",
  },
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
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(({ q, r }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: r },
    })),
  },
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
              taux : le calcul se fait dans votre navigateur et rien
              n&apos;est enregistré.
            </p>
          </header>

          <PenaltyCalculator />

          <section className="mt-14">
            <h2 className="text-2xl font-medium tracking-tight text-gray-900 mb-6">
              Les six règles qui encadrent le calcul
            </h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              {REGLES.map(([titre, texte]) => (
                <div
                  key={titre}
                  className="rounded-xl border border-gray-200 bg-white p-5"
                >
                  <dt className="text-base font-medium text-gray-900">
                    {titre}
                  </dt>
                  <dd className="mt-1.5 text-sm text-gray-600 leading-relaxed">
                    {texte}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 text-sm text-gray-600">
              Pour aller plus loin :{" "}
              <Link
                href="/blog/penalites-retard-indemnite-forfaitaire-40-euros"
                className="text-[#5a50ff] hover:underline"
              >
                le calcul détaillé des pénalités et de l&apos;indemnité de 40 €
              </Link>
              ,{" "}
              <Link
                href="/blog/quest-ce-que-delai-paiement-facture"
                className="text-[#5a50ff] hover:underline"
              >
                les délais de paiement légaux
              </Link>{" "}
              et{" "}
              <Link
                href="/blog/relance-facture-impayee-modele"
                className="text-[#5a50ff] hover:underline"
              >
                les modèles de relance de facture impayée
              </Link>
              .
            </p>
          </section>

          <section className="mt-14">
            <h2 className="text-2xl font-medium tracking-tight text-gray-900 mb-6">
              Questions fréquentes
            </h2>
            <dl className="divide-y divide-gray-200 border-y border-gray-200">
              {FAQ.map(({ q, r }) => (
                <div key={q} className="py-5">
                  <dt className="text-base font-medium text-gray-900">{q}</dt>
                  <dd className="mt-2 text-sm text-gray-600 leading-relaxed">
                    {r}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

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
