import Link from "next/link";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import Footer7 from "@/src/components/footer7";
import { JsonLd } from "@/src/components/seo/json-ld";
import { SITE_URL } from "@/src/lib/site";
import { FileText, FileSignature, Download, Percent } from "lucide-react";

// Section « Outils » : pages publiques et gratuites, utilisables sans compte.
// Elle a vocation à accueillir d'autres outils (calculateur de TVA,
// simulateur de facturation électronique) : les regrouper leur donne un point
// d'entrée commun qui accumule de l'autorité, plutôt que des pages isolées.

export const metadata = {
  title: {
    absolute: "Outils gratuits pour facturer et gérer son activité | Newbi",
  },
  description:
    "Des outils gratuits et sans inscription pour les indépendants et les TPE : générateurs de facture et de devis en ligne, et modèles à télécharger en Word, Excel et PDF.",
  alternates: { canonical: "/outils" },
  openGraph: {
    title: "Outils gratuits pour facturer | Newbi",
    description:
      "Générateurs de facture et de devis en ligne, et modèles à télécharger. Gratuits, sans inscription.",
    url: "/outils",
    siteName: "Newbi",
    type: "website",
    locale: "fr_FR",
    images: [{ url: "/images/op-newbi.png", width: 1200, height: 630 }],
  },
};

const OUTILS = [
  {
    href: "/outils/generateur-de-facture",
    icon: FileText,
    title: "Générateur de facture",
    desc: "Remplissez, prévisualisez et téléchargez une facture conforme en PDF. Sans inscription, rien n'est enregistré.",
    tag: "En ligne",
  },
  {
    href: "/outils/generateur-de-devis",
    icon: FileSignature,
    title: "Générateur de devis",
    desc: "Créez un devis professionnel avec sa durée de validité et sa mention d'accord, puis téléchargez-le en PDF.",
    tag: "En ligne",
  },
  {
    href: "/outils/calculateur-penalites-retard",
    icon: Percent,
    title: "Calculateur de pénalités de retard",
    desc: "Chiffrez les pénalités dues sur une facture impayée, avec l'indemnité de 40 euros, et copiez le paragraphe de relance.",
    tag: "En ligne",
  },
  {
    href: "/modeles",
    icon: Download,
    title: "Modèles de facture et de devis",
    desc: "Cinq modèles prêts à remplir en Word, Excel et PDF : facture, devis, acompte, auto-entrepreneur et facture sans TVA.",
    tag: "À télécharger",
  },
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Outils gratuits Newbi",
    url: `${SITE_URL}/outils`,
    description: metadata.description,
    isPartOf: { "@type": "WebSite", name: "Newbi", url: SITE_URL },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: OUTILS.map((o, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}${o.href}`,
        name: o.title,
      })),
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Outils", item: `${SITE_URL}/outils` },
    ],
  },
];

export default function OutilsPage() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <NewHeroNavbar solidBackground />

      <main className="pt-28 pb-16 bg-[#FDFDFD]">
        <div className="mx-auto max-w-[1200px] px-5">
          <header className="max-w-2xl mb-10">
            <p className="text-xs uppercase tracking-wide text-[#5a50ff] mb-3">
              Outils gratuits
            </p>
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-gray-900">
              Facturez sans logiciel, gratuitement
            </h1>
            <p className="mt-4 text-gray-600 leading-relaxed">
              Des outils utilisables tout de suite, sans compte et sans carte
              bancaire, pour les indépendants et les petites entreprises. Rien
              n'est enregistré : votre saisie reste chez vous.
            </p>
          </header>

          <ul className="grid gap-4 sm:grid-cols-2">
            {OUTILS.map(({ href, icon: Icon, title, desc, tag }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="group block h-full rounded-xl border border-gray-200 bg-white p-6 hover:border-[#5a50ff] transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="inline-flex size-9 items-center justify-center rounded-lg bg-[#5a50ff]/10 text-[#5a50ff]">
                      <Icon className="size-4" />
                    </span>
                    <span className="text-[11px] uppercase tracking-wide text-gray-400">
                      {tag}
                    </span>
                  </div>
                  <p className="text-lg font-medium text-gray-900 group-hover:text-[#5a50ff]">
                    {title}
                  </p>
                  <p className="mt-1.5 text-sm text-gray-600">{desc}</p>
                </Link>
              </li>
            ))}
          </ul>

          <section className="mt-14 rounded-2xl bg-[#202020] p-8 sm:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-normal text-white mb-4">
              Vous facturez régulièrement ?
            </h2>
            <p className="text-gray-400 text-sm sm:text-base mb-8 max-w-xl mx-auto">
              Numérotation automatique, clients et produits enregistrés,
              relances des impayés, trésorerie et facturation électronique au
              même endroit. 30 jours gratuits, sans carte bancaire.
            </p>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 rounded-xl px-8 py-3 text-base font-normal bg-white text-black hover:bg-gray-100 transition duration-150 active:scale-[0.98]"
            >
              Commencer gratuitement
            </Link>
          </section>
        </div>
      </main>

      <Footer7 />
    </>
  );
}
