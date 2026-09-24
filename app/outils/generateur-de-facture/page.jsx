import Link from "next/link";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import Footer7 from "@/src/components/footer7";
import { JsonLd } from "@/src/components/seo/json-ld";
import { SITE_URL } from "@/src/lib/site";
import InvoiceGenerator from "./InvoiceGenerator";

export const metadata = {
  title: {
    absolute:
      "Générateur de facture gratuit : créez et téléchargez votre facture | Newbi",
  },
  description:
    "Créez une facture conforme en ligne et téléchargez-la en PDF, gratuitement et sans inscription. Mentions obligatoires, TVA ou franchise en base, calcul automatique des totaux.",
  alternates: { canonical: "/outils/generateur-de-facture" },
  openGraph: {
    title: "Générateur de facture gratuit, sans inscription | Newbi",
    description:
      "Remplissez, prévisualisez et téléchargez votre facture en PDF. Gratuit, sans compte, rien n'est enregistré.",
    url: "/outils/generateur-de-facture",
    siteName: "Newbi",
    type: "website",
    locale: "fr_FR",
    images: [{ url: "/images/op-newbi.png", width: 1200, height: 630 }],
  },
};

const FAQ = [
  {
    q: "Une facture créée avec ce générateur est-elle légale ?",
    r: "Oui. Aucun texte n'impose d'utiliser un logiciel certifié pour facturer : la certification NF525 ne concerne que les logiciels de caisse, pour les encaissements auprès de particuliers. Une facture est valable dès lors qu'elle porte les mentions obligatoires, ce que ce générateur remplit pour vous. En revanche, la numérotation continue et la conservation pendant dix ans restent de votre responsabilité.",
  },
  {
    q: "Faut-il créer un compte pour télécharger la facture ?",
    r: "Non. Le générateur fonctionne sans inscription et sans adresse électronique. Votre saisie reste dans votre navigateur, elle n'est jamais envoyée à Newbi, et le PDF est fabriqué par votre propre ordinateur.",
  },
  {
    q: "Comment numéroter mes factures correctement ?",
    r: "La numérotation doit être continue et chronologique, sans trou ni doublon, sur une séquence ininterrompue. Beaucoup utilisent un préfixe par année, par exemple F-2026-001 puis F-2026-002. Ce générateur ne garde aucune mémoire entre deux visites : notez le dernier numéro utilisé, ou passez à un logiciel qui le gère pour vous.",
  },
  {
    q: "Je suis auto-entrepreneur en franchise en base, que dois-je indiquer ?",
    r: "Cochez la case « franchise en base de TVA » : la mention « TVA non applicable, article 293 B du Code général des impôts » est ajoutée automatiquement et les montants s'affichent sans TVA. C'est une mention obligatoire, son absence expose à un redressement.",
  },
  {
    q: "Ce PDF suffira-t-il après la réforme de la facturation électronique ?",
    r: "Pas pour vos clients professionnels. Depuis le 1er septembre 2026, toutes les entreprises doivent pouvoir recevoir des factures électroniques. À partir du 1er septembre 2027, les micro-entreprises, TPE et PME devront aussi les émettre au format électronique, via une plateforme agréée : un PDF envoyé par courriel ne sera plus accepté entre professionnels.",
  },
  {
    q: "Puis-je créer un devis avec cet outil ?",
    r: "Pas encore. En attendant, notre modèle de devis est téléchargeable en Word, Excel et PDF, et Newbi permet de transformer un devis signé en facture en un clic.",
  },
];

const MENTIONS = [
  ["Identité de l'émetteur", "Dénomination ou nom et prénom, adresse, SIREN, forme juridique et capital pour une société, numéro RCS pour un commerçant."],
  ["Identité du client", "Dénomination ou nom, adresse de facturation, et son numéro de TVA intracommunautaire en cas d'autoliquidation ou de vente intracommunautaire."],
  ["Numéro et dates", "Numéro unique issu d'une séquence continue, date d'émission, date de la vente ou de la prestation, date d'échéance du règlement."],
  ["Détail des lignes", "Désignation précise, quantité, prix unitaire hors taxes, taux de TVA applicable et remises éventuelles."],
  ["Totaux", "Total hors taxes, montant de TVA par taux, total toutes taxes comprises."],
  ["Conditions de règlement", "Taux des pénalités de retard, au minimum trois fois le taux d'intérêt légal, indemnité forfaitaire pour frais de recouvrement de 40 euros, et conditions d'escompte."],
  ["Mentions particulières", "« TVA non applicable, article 293 B du CGI » en franchise en base, « Autoliquidation » en sous-traitance du bâtiment ou en vente intracommunautaire."],
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Générateur de facture gratuit Newbi",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: "fr-FR",
    url: `${SITE_URL}/outils/generateur-de-facture`,
    description:
      "Créez une facture conforme en ligne et téléchargez-la en PDF, gratuitement et sans inscription.",
    // L'outil est réellement gratuit et sans compte : le prix zéro est exact
    // ici, contrairement aux pages produit qui décrivent l'abonnement.
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
      description: "Gratuit, sans inscription",
    },
    publisher: { "@type": "Organization", name: "Newbi", url: SITE_URL },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.r },
    })),
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Outils", item: `${SITE_URL}/outils` },
      {
        "@type": "ListItem",
        position: 3,
        name: "Générateur de facture",
        item: `${SITE_URL}/outils/generateur-de-facture`,
      },
    ],
  },
];

export default function GenerateurDeFacturePage() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <NewHeroNavbar solidBackground />

      <main className="pt-28 pb-16 bg-[#FDFDFD]">
        <div className="mx-auto max-w-[1200px] px-5">
          <nav aria-label="Fil d'Ariane" className="text-xs text-gray-500 mb-4">
            <Link href="/" className="hover:text-gray-900">
              Accueil
            </Link>
            <span className="mx-1.5">/</span>
            <Link href="/outils" className="hover:text-gray-900">
              Outils
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-gray-900">Générateur de facture</span>
          </nav>

          <header className="max-w-3xl mb-10">
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-gray-900">
              Générateur de facture gratuit
            </h1>
            <p className="mt-4 text-gray-600 leading-relaxed">
              Remplissez le formulaire, vérifiez l'aperçu à droite et
              téléchargez votre facture en PDF. Les mentions obligatoires sont
              en place, les totaux et la TVA se calculent tout seuls. Gratuit,
              sans inscription, et votre saisie ne quitte jamais votre
              navigateur.
            </p>
          </header>

          <InvoiceGenerator />

          {/* --------------------------- Contenu SEO --------------------------- */}
          <section className="mt-20 max-w-3xl">
            <h2 className="text-2xl font-medium tracking-tight text-gray-900 mb-4">
              Les mentions obligatoires d'une facture
            </h2>
            <p className="text-gray-600 mb-6">
              Une facture incomplète expose à une amende de 15 euros par mention
              manquante, plafonnée au quart du montant facturé. Voici ce que
              votre document doit contenir, et ce que le générateur remplit à
              partir de votre saisie.
            </p>
            <dl className="space-y-4">
              {MENTIONS.map(([titre, texte]) => (
                <div
                  key={titre}
                  className="rounded-lg border border-gray-200 bg-white p-4"
                >
                  <dt className="text-sm font-medium text-gray-900">{titre}</dt>
                  <dd className="mt-1 text-sm text-gray-600">{texte}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-sm text-gray-600">
              Le détail complet, avec les cas particuliers par métier, figure
              dans notre guide des{" "}
              <Link
                href="/blog/mentions-obligatoires-facture"
                className="text-[#5a50ff] underline underline-offset-4"
              >
                mentions obligatoires d'une facture
              </Link>
              .
            </p>
          </section>

          <section className="mt-16 max-w-3xl">
            <h2 className="text-2xl font-medium tracking-tight text-gray-900 mb-6">
              Questions fréquentes
            </h2>
            <dl className="space-y-5">
              {FAQ.map((f) => (
                <div key={f.q}>
                  <dt className="text-base font-medium text-gray-900">{f.q}</dt>
                  <dd className="mt-1.5 text-sm text-gray-600 leading-relaxed">
                    {f.r}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-16 max-w-3xl">
            <h2 className="text-2xl font-medium tracking-tight text-gray-900 mb-4">
              Pour aller plus loin
            </h2>
            <ul className="grid sm:grid-cols-2 gap-4">
              {[
                ["/modeles/modele-facture.xlsx", "Modèle de facture Excel", "Le même document à remplir hors ligne, avec calcul automatique."],
                ["/blog/modele-facture-gratuit-word-excel-pdf", "Modèle de facture à télécharger", "Word, Excel et PDF, avec un exemple rempli."],
                ["/blog/quest-ce-que-numero-facture", "Bien numéroter ses factures", "Les règles de la séquence continue et les erreurs à éviter."],
                ["/produits/facturation-electronique", "Facturation électronique 2026-2027", "Ce qui devient obligatoire, et quand."],
              ].map(([href, titre, desc]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="group block h-full rounded-xl border border-gray-200 bg-white p-5 hover:border-[#5a50ff] transition-colors"
                  >
                    <p className="text-base font-medium text-gray-900 group-hover:text-[#5a50ff]">
                      {titre}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">{desc}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>

      <Footer7 />
    </>
  );
}
