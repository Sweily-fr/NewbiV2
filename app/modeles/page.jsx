import Link from "next/link";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import Footer7 from "@/src/components/footer7";
import { JsonLd } from "@/src/components/seo/json-ld";
import { SITE_URL } from "@/src/lib/site";
import { FileText, FileSpreadsheet, FileDown } from "lucide-react";

// Hub des modèles téléchargeables.
//
// Les cinq fichiers vivent dans public/modeles/ depuis le 23/09/2026 mais
// n'étaient accessibles que depuis cinq articles de blog. Cette page leur
// donne un point d'entrée unique : c'est une ressource que des sites tiers
// peuvent citer (ce qu'on ne fait pas vers un article de blog), et elle
// concentre l'autorité au lieu de la disperser sur cinq URLs.
//
// Répartition volontaire avec le blog : ici l'intention est de TÉLÉCHARGER
// (fichiers en premier écran), les articles gardent l'explication longue de
// chaque cas. Chaque bloc renvoie vers son article, et réciproquement.

export const metadata = {
  title: {
    absolute:
      "Modèles de facture et de devis gratuits à télécharger (Word, Excel, PDF) | Newbi",
  },
  description:
    "Cinq modèles gratuits à remplir : facture, devis, facture d'acompte, facture auto-entrepreneur et facture sans TVA. Word, Excel et PDF, avec toutes les mentions obligatoires, sans inscription.",
  alternates: { canonical: "/modeles" },
  openGraph: {
    title: "Modèles de facture et de devis gratuits | Newbi",
    description:
      "Facture, devis, acompte, auto-entrepreneur, franchise en base : cinq modèles conformes à télécharger en Word, Excel et PDF.",
    url: "/modeles",
    siteName: "Newbi",
    type: "website",
    locale: "fr_FR",
    images: [{ url: "/images/op-newbi.png", width: 1200, height: 630 }],
  },
};

const MODELES = [
  {
    slug: "modele-facture",
    nom: "Modèle de facture",
    desc: "La facture standard entre professionnels, avec les quatre dates exigées par le Code de commerce, le détail de la TVA et les mentions de pénalités de retard.",
    pour: "Prestations et ventes soumises à TVA",
    article: "modele-facture-gratuit-word-excel-pdf",
  },
  {
    slug: "modele-devis",
    nom: "Modèle de devis",
    desc: "Un devis prêt à envoyer avec sa durée de validité, ses conditions de règlement et la mention « Bon pour accord » à faire signer avant de démarrer.",
    pour: "Chiffrer une prestation avant de la réaliser",
    article: "modele-devis-gratuit-word-excel-pdf",
  },
  {
    slug: "modele-facture-auto-entrepreneur",
    nom: "Modèle de facture auto-entrepreneur",
    desc: "La version micro-entreprise, avec le numéro SIRET, l'absence de RCS et la mention de franchise en base quand vous ne facturez pas la TVA.",
    pour: "Micro-entrepreneurs",
    article: "modele-facture-auto-entrepreneur-gratuit",
  },
  {
    slug: "modele-facture-acompte",
    nom: "Modèle de facture d'acompte",
    desc: "Pour encaisser une avance à la commande, avec le rappel du devis signé et le solde restant dû, à régulariser sur la facture finale.",
    pour: "Chantiers et commandes payés en plusieurs fois",
    article: "modele-facture-acompte-gratuit",
  },
  {
    slug: "modele-facture-sans-tva",
    nom: "Modèle de facture sans TVA",
    desc: "La facture en franchise en base, avec la mention « TVA non applicable, article 293 B du CGI » et un total unique sans ligne de taxe.",
    pour: "Franchise en base de TVA",
    article: "modele-facture-sans-tva-franchise-en-base",
  },
];

const FORMATS = [
  { ext: "docx", label: "Word", icon: FileText },
  { ext: "xlsx", label: "Excel", icon: FileSpreadsheet },
  { ext: "pdf", label: "PDF", icon: FileDown },
];

const FAQ = [
  {
    q: "Ces modèles de facture sont-ils vraiment gratuits ?",
    r: "Oui. Les quinze fichiers se téléchargent sans compte, sans adresse e-mail et sans limite d'utilisation. Vous pouvez les modifier, y mettre votre logo et les réutiliser autant de fois que vous voulez.",
  },
  {
    q: "Une facture faite sous Word ou Excel est-elle légale ?",
    r: "Oui, tant qu'elle comporte toutes les mentions obligatoires et que sa numérotation est continue, sans trou ni doublon. La loi n'impose aucun outil particulier. En revanche, elle vous impose de conserver vos factures dix ans et de ne jamais modifier une facture déjà envoyée : sur un fichier bureautique, c'est à vous de vous en assurer.",
  },
  {
    q: "Quelles mentions sont obligatoires sur une facture ?",
    r: "L'identité et l'adresse complètes des deux parties, le numéro SIREN ou SIRET de l'émetteur, un numéro de facture unique et séquentiel, la date d'émission, la date de la vente ou de la prestation, le détail des lignes, les totaux hors taxes et toutes taxes comprises, le taux et le montant de TVA ou la mention d'exonération, la date d'échéance, le taux des pénalités de retard et l'indemnité forfaitaire de recouvrement de 40 euros entre professionnels.",
  },
  {
    q: "Ces modèles seront-ils encore valables avec la facturation électronique ?",
    r: "Depuis le 1er septembre 2026, toutes les entreprises doivent déjà pouvoir recevoir une facture au format électronique. Les TPE et PME devront les émettre à partir du 1er septembre 2027 : à cette date, un Word ou un PDF envoyé par e-mail ne sera plus accepté entre professionnels, il faudra passer par une plateforme de dématérialisation partenaire qui produit un format structuré. Ces modèles restent utiles d'ici là, et après pour vos clients particuliers, qui ne sont pas concernés par la réforme.",
  },
  {
    q: "Quelle différence avec le générateur de facture en ligne ?",
    r: "Le générateur remplit et met en page la facture pour vous, calcule les totaux et la TVA, et vous rend un PDF prêt à envoyer sans rien installer. Le modèle Word ou Excel se remplit à la main mais reste modifiable hors ligne. Les deux sont gratuits.",
  },
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Modèles de facture et de devis gratuits",
    url: `${SITE_URL}/modeles`,
    description: metadata.description,
    inLanguage: "fr-FR",
    isPartOf: { "@type": "WebSite", name: "Newbi", url: SITE_URL },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: MODELES.map((m, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: m.nom,
        url: `${SITE_URL}/modeles#${m.slug}`,
      })),
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Outils", item: `${SITE_URL}/outils` },
      { "@type": "ListItem", position: 3, name: "Modèles", item: `${SITE_URL}/modeles` },
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

export default function ModelesPage() {
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
            <span className="text-gray-700">Modèles</span>
          </nav>

          <header className="max-w-2xl mb-10">
            <p className="text-xs uppercase tracking-wide text-[#5a50ff] mb-3">
              Modèles gratuits
            </p>
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-gray-900">
              Modèles de facture et de devis à télécharger
            </h1>
            <p className="mt-4 text-gray-600 leading-relaxed">
              Cinq modèles prêts à remplir, chacun disponible en Word, Excel et
              PDF. Ils contiennent déjà toutes les mentions obligatoires et les
              formules de calcul. Téléchargement immédiat, sans inscription et
              sans adresse e-mail à laisser.
            </p>
          </header>

          <ul className="grid gap-4 lg:grid-cols-2">
            {MODELES.map(({ slug, nom, desc, pour, article }) => (
              <li
                key={slug}
                id={slug}
                className="scroll-mt-28 rounded-xl border border-gray-200 bg-white p-6"
              >
                <p className="text-[11px] uppercase tracking-wide text-gray-400">
                  {pour}
                </p>
                <h2 className="mt-2 text-lg font-medium text-gray-900">{nom}</h2>
                <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
                  {desc}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {FORMATS.map(({ ext, label, icon: Icon }) => (
                    <a
                      key={ext}
                      href={`/modeles/${slug}.${ext}`}
                      download
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:border-[#5a50ff] hover:text-[#5a50ff] transition-colors"
                    >
                      <Icon className="size-3.5" />
                      {label}
                    </a>
                  ))}
                </div>

                <Link
                  href={`/blog/${article}`}
                  className="mt-4 inline-block text-sm text-[#5a50ff] hover:underline"
                >
                  Comment le remplir, cas par cas
                </Link>
              </li>
            ))}
          </ul>

          <section className="mt-14 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-medium text-gray-900">
                Vérifiez vos mentions obligatoires
              </h2>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Une facture incomplète expose à une amende de 15 euros par
                mention manquante, et votre client peut refuser de la payer tant
                qu'elle n'est pas corrigée. Les modèles les reprennent toutes,
                mais relisez l'identité des deux parties, le numéro séquentiel
                et la date d'échéance avant d'envoyer.
              </p>
              <Link
                href="/blog/mentions-obligatoires-facture"
                className="mt-4 inline-block text-sm text-[#5a50ff] hover:underline"
              >
                La liste complète des mentions obligatoires
              </Link>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-medium text-gray-900">
                Ce qui change avec la facturation électronique
              </h2>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Depuis le 1er septembre 2026, toute entreprise doit pouvoir
                recevoir une facture électronique. Les TPE et PME devront les
                émettre au 1er septembre 2027 : le PDF envoyé par e-mail entre
                professionnels ne suffira plus, il faudra passer par une
                plateforme de dématérialisation partenaire.
              </p>
              <Link
                href="/guide-facturation-electronique"
                className="mt-4 inline-block text-sm text-[#5a50ff] hover:underline"
              >
                Le guide de la facturation électronique
              </Link>
            </div>
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
              Remplir un modèle à chaque facture, ça va deux mois
            </h2>
            <p className="text-gray-400 text-sm sm:text-base mb-8 max-w-xl mx-auto">
              Numérotation automatique, clients et produits enregistrés, relance
              des impayés, suivi de trésorerie et facturation électronique au
              même endroit. 30 jours gratuits, sans carte bancaire.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 rounded-xl px-8 py-3 text-base font-normal bg-white text-black hover:bg-gray-100 transition duration-150 active:scale-[0.98]"
              >
                Commencer gratuitement
              </Link>
              <Link
                href="/outils/generateur-de-facture"
                className="inline-flex items-center gap-2 rounded-xl px-8 py-3 text-base font-normal border border-white/20 text-white hover:bg-white/10 transition duration-150"
              >
                Essayer le générateur en ligne
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer7 />
    </>
  );
}
