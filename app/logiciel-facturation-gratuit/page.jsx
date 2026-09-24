import Link from "next/link";
import LpShell from "../lp/_components/LpShell";
import HeroSection from "../lp/facturation-auto-entrepreneur/section/hero-section";
import LpTrustFeatures from "../lp/_components/LpTrustFeatures";
import LpSteps from "../lp/_components/LpSteps";
import LpTestimonials from "../lp/_components/LpTestimonials";
import LpFaq, { buildFaqJsonLd } from "../lp/_components/LpFaq";
import LpFinalCta from "../lp/_components/LpFinalCta";
import HomePricingSection from "@/app/(main)/new/lp-home/HomePricingSection";
import { SITE_URL } from "@/src/lib/site";
import { Gift, ShieldCheck, FileText, Check, X } from "lucide-react";

// Page SEO « logiciel de facturation gratuit » : la famille de requêtes la
// plus vue dans la Search Console (« logiciel facturation gratuit »,
// « logiciel devis facture gratuit », « meilleur logiciel facture gratuit »),
// jusqu'ici portée par un seul article de blog en page 6. Page indexable,
// contrairement aux LP Ads de /lp. Le discours est honnête : Newbi est
// gratuit 30 jours sans carte bancaire, puis payant ; la page dit aussi ce
// qu'un outil 100 % gratuit ne fait pas.

export const metadata = {
  title: {
    absolute:
      "Logiciel de facturation gratuit 30 jours : devis et factures conformes | Newbi",
  },
  description:
    "Créez vos devis et factures gratuitement pendant 30 jours, sans carte bancaire : mentions obligatoires, numérotation, relances, facturation électronique 2026. Et ce qu'un logiciel 100 % gratuit ne fait pas.",
  alternates: { canonical: "/logiciel-facturation-gratuit" },
  openGraph: {
    title: "Logiciel de facturation gratuit 30 jours | Newbi",
    description:
      "Devis, factures et avoirs conformes, sans carte bancaire pendant 30 jours. Compatible facturation électronique 2026.",
    url: "/logiciel-facturation-gratuit",
    siteName: "Newbi",
    type: "website",
    locale: "fr_FR",
    images: [{ url: "/images/op-newbi.png", width: 1200, height: 630 }],
  },
};

const TRUST_FEATURES = [
  {
    icon: <Gift size={26} strokeWidth={1.75} />,
    title: "30 jours gratuits, sans carte bancaire",
    desc: "Toutes les fonctionnalités, de vraies factures dès le premier jour. Si vous ne faites rien à la fin, rien n'est prélevé.",
  },
  {
    icon: <FileText size={26} strokeWidth={1.75} />,
    title: "Devis et factures conformes",
    desc: "Mentions obligatoires, numérotation continue, TVA ou franchise en base, avoirs : tout est géré, rien à retenir.",
  },
  {
    icon: <ShieldCheck size={26} strokeWidth={1.75} />,
    title: "Prêt pour la facturation électronique",
    desc: "Réception obligatoire depuis septembre 2026, émission en 2027 pour les TPE : inclus, sans surcoût.",
  },
];

const STEPS = [
  {
    when: "Minute 0",
    title: "Vous créez votre compte avec votre SIRET",
    desc: "Email ou Google, sans carte bancaire. Vos informations légales sont pré-remplies, vos modèles de devis et de facture sont prêts.",
    aside: "Compte prêt en 2 minutes",
  },
  {
    when: "Minute 5",
    title: "Votre premier devis part, puis devient une facture",
    desc: "Client, prestation, montant. Le devis signé se transforme en facture en un clic, avec le bon numéro et les bonnes mentions.",
    aside: "Devis, facture, avoir",
  },
  {
    when: "Jour 30",
    title: "Vous choisissez de continuer, ou pas",
    desc: "Vous exportez vos données à tout moment. Si Newbi vous convient, vous choisissez votre formule ; sinon, rien n'est prélevé.",
    aside: "Sans engagement",
  },
];

const FAQ = [
  {
    id: "g-1",
    title: "Newbi est-il vraiment gratuit ?",
    content:
      "Newbi est gratuit pendant 30 jours, sans carte bancaire et sans limite de fonctionnalités : vous pouvez émettre de vraies factures dès le premier jour. Ensuite, l'abonnement démarre à quelques euros par mois (voir les tarifs). Nous ne proposons pas de version 100 % gratuite à vie : un logiciel de facturation doit être maintenu, hébergé en France et mis à jour à chaque évolution réglementaire, et ce n'est pas compatible avec un modèle sans revenu.",
  },
  {
    id: "g-2",
    title: "Quel est le meilleur logiciel de facturation gratuit ?",
    content:
      "Cela dépend de votre volume. Pour quelques factures par an, un outil gratuit comme Henrri ou Facture.net suffit. Dès que vous avez des clients récurrents, des relances à faire, une banque à rapprocher ou l'obligation d'émettre des factures électroniques (TPE en 2027), un outil complet devient nécessaire. Notre comparatif des 8 logiciels gratuits détaille les limites de chacun.",
  },
  {
    id: "g-3",
    title: "Un logiciel de devis et factures gratuit est-il conforme à la loi ?",
    content:
      "Une facture doit porter des mentions obligatoires et suivre une numérotation continue et chronologique, quel que soit l'outil. La plupart des logiciels gratuits sérieux le respectent. En revanche, très peu couvrent la facturation électronique obligatoire (réception depuis le 1er septembre 2026, émission le 1er septembre 2027 pour les micro-entreprises, TPE et PME), qui impose de passer par une plateforme agréée.",
  },
  {
    id: "g-4",
    title: "Puis-je facturer en tant qu'auto-entrepreneur ?",
    content:
      "Oui. Vous indiquez votre statut à la création du compte : la mention de franchise en base de TVA est ajoutée automatiquement sur chaque facture, et vos montants sont affichés sans TVA. Le jour où vous devenez redevable de la TVA, vous l'activez dans vos réglages.",
  },
  {
    id: "g-5",
    title: "Que se passe-t-il à la fin des 30 jours ?",
    content:
      "Vous choisissez votre formule, ou vous ne faites rien : aucune carte n'a été enregistrée, donc rien n'est prélevé. Vos documents restent exportables (PDF, CSV, Excel) pour que vous ne soyez jamais bloqué.",
  },
  {
    id: "g-6",
    title: "Puis-je importer mes factures faites sur Word ou Excel ?",
    content:
      "Vous reprenez votre numérotation là où elle en était et vous importez vos clients. Les anciennes factures restent dans vos archives ; les nouvelles partent depuis Newbi. L'équipe vous accompagne sur WhatsApp si vous voulez un coup de main pour la transition.",
  },
];

const COMPARISON = [
  {
    label: "Devis, factures et avoirs conformes",
    free: true,
    newbi: true,
  },
  {
    label: "Numérotation continue et mentions obligatoires",
    free: true,
    newbi: true,
  },
  {
    label: "Relances automatiques des impayés",
    free: false,
    newbi: true,
  },
  {
    label: "Connexion bancaire et rapprochement",
    free: false,
    newbi: true,
  },
  {
    label: "Facturation électronique 2026-2027 (plateforme agréée)",
    free: false,
    newbi: true,
  },
  {
    label: "Notes de frais et factures d'achat scannées (OCR)",
    free: false,
    newbi: true,
  },
  {
    label: "Accès expert-comptable et export FEC",
    free: false,
    newbi: true,
  },
  {
    label: "Support humain en français",
    free: false,
    newbi: true,
  },
];

const jsonLd = [
  buildFaqJsonLd(FAQ),
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Logiciel de facturation gratuit",
        item: `${SITE_URL}/logiciel-facturation-gratuit`,
      },
    ],
  },
];

function ComparisonSection() {
  return (
    <section className="px-5 py-14 md:py-20">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-gray-950 mb-4">
          Gratuit, ou gratuit 30 jours : ce que ça change
        </h2>
        <p className="text-gray-600 max-w-2xl mb-10">
          Un logiciel 100 % gratuit suffit pour émettre quelques factures par
          an. Dès que votre activité tourne, ce sont les fonctions autour de la
          facture qui font gagner du temps : relances, banque, achats,
          facturation électronique. Voici ce que couvre en général un outil
          gratuit, et ce que Newbi ajoute.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="px-5 py-4 font-medium text-gray-700">
                  Fonctionnalité
                </th>
                <th className="px-5 py-4 font-medium text-gray-700 whitespace-nowrap">
                  Outil 100 % gratuit
                </th>
                <th className="px-5 py-4 font-medium text-[#5A50FF] whitespace-nowrap">
                  Newbi (30 jours offerts)
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.label} className="border-b border-gray-100 last:border-0">
                  <td className="px-5 py-3 text-gray-900">{row.label}</td>
                  <td className="px-5 py-3">
                    {row.free ? (
                      <span className="inline-flex items-center gap-1 text-gray-700">
                        <Check size={16} /> Oui
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gray-400">
                        <X size={16} /> Rarement
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1 text-[#5A50FF]">
                      <Check size={16} /> {row.newbi ? "Inclus" : ""}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 text-sm text-gray-600 max-w-2xl">
          Vous voulez comparer les outils gratuits entre eux ? Lisez notre{" "}
          <Link
            href="/blog/logiciel-devis-facture-gratuit"
            className="text-[#5A50FF] underline underline-offset-4"
          >
            comparatif des 8 logiciels de devis et factures gratuits
          </Link>{" "}
          et nos{" "}
          <Link
            href="/alternatives"
            className="text-[#5A50FF] underline underline-offset-4"
          >
            comparatifs face à chaque logiciel du marché
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

function GuidesSection() {
  const guides = [
    {
      href: "/outils/generateur-de-facture",
      title: "Générateur de facture gratuit",
      desc: "Créez et téléchargez une facture conforme en ligne, sans inscription.",
    },
    {
      href: "/blog/mentions-obligatoires-facture",
      title: "Les mentions obligatoires d'une facture",
      desc: "La liste complète, avec les mentions propres aux micro-entrepreneurs et aux ventes B2B.",
    },
    {
      href: "/blog/modele-facture-gratuit-word-excel-pdf",
      title: "Modèle de facture gratuit (Word, Excel, PDF)",
      desc: "Un modèle conforme à reproduire, et les limites du modèle face à un logiciel.",
    },
    {
      href: "/blog/top-6-logiciels-facturation-artisan",
      title: "Logiciels de facturation pour artisans du bâtiment",
      desc: "Acomptes, situations de travaux, TVA à 10 % : les outils qui gèrent le BTP.",
    },
    {
      href: "/produits/facturation-electronique",
      title: "Facturation électronique 2026 avec Newbi",
      desc: "Ce qui devient obligatoire, quand, et comment Newbi transmet vos factures.",
    },
  ];
  return (
    <section className="px-5 pb-14 md:pb-20">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-medium tracking-tight text-gray-950 mb-8">
          Pour bien démarrer
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {guides.map((g) => (
            <li key={g.href}>
              <Link
                href={g.href}
                className="group block h-full rounded-xl border border-gray-200 bg-white p-5 hover:border-[#5a50ff] transition-colors"
              >
                <h3 className="text-base font-medium text-gray-900 group-hover:text-[#5a50ff] mb-2">
                  {g.title}
                </h3>
                <p className="text-sm text-gray-600">{g.desc}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function LogicielFacturationGratuitPage() {
  return (
    <LpShell navbar="full" footer="full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HeroSection
        title="Logiciel de facturation gratuit pendant 30 jours, sans carte bancaire."
        subtitle={
          <>
            Créez vos devis et vos factures en 2 minutes, avec les{" "}
            <strong className="font-medium text-gray-900">
              mentions obligatoires et la numérotation gérées pour vous
            </strong>
            . Compatible facturation électronique 2026, inclus sans surcoût.
          </>
        }
        secondaryLabel="Comparer les 8 logiciels gratuits du marché"
        secondaryHref="/blog/logiciel-devis-facture-gratuit"
      />
      <LpTrustFeatures items={TRUST_FEATURES} />
      <ComparisonSection />
      <LpSteps
        title="Votre première facture, ce matin"
        intro="Pas de modèle Word à bricoler, pas de formation. Voilà comment ça se passe."
        steps={STEPS}
        ctaLabel="Commencer gratuitement"
      />
      <LpTestimonials title="Ils ont commencé par les 30 jours gratuits" />
      {/* Mêmes cartes de prix que la home : essai gratuit, offre Freelance, renvoi vers /tarifs */}
      <HomePricingSection />
      <GuidesSection />
      <LpFinalCta
        title={
          <>
            Facturez gratuitement
            <br className="hidden md:block" /> dès aujourd'hui
          </>
        }
        subtitle="Créez votre compte, envoyez votre première facture conforme ce matin. 30 jours pour tester, sans carte bancaire."
        image="/lp/facturation-electronique/cta-laptop.jpg"
        imageAlt="Un indépendant consulte ses factures clients dans Newbi sur son ordinateur portable"
      />
      <LpFaq items={FAQ} />
    </LpShell>
  );
}
