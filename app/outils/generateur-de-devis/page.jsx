import Link from "next/link";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import Footer7 from "@/src/components/footer7";
import { JsonLd } from "@/src/components/seo/json-ld";
import { SITE_URL } from "@/src/lib/site";
import DocumentGenerator from "../_components/DocumentGenerator";
import { DEVIS_CONFIG } from "../_components/configs";

export const metadata = {
  title: {
    absolute:
      "Générateur de devis gratuit : créez et téléchargez votre devis | Newbi",
  },
  description:
    "Créez un devis professionnel en ligne et téléchargez-le en PDF, gratuitement et sans inscription. Mentions obligatoires, durée de validité, TVA et calcul automatique des totaux.",
  alternates: { canonical: "/outils/generateur-de-devis" },
  openGraph: {
    title: "Générateur de devis gratuit, sans inscription | Newbi",
    description:
      "Remplissez, prévisualisez et téléchargez votre devis en PDF. Gratuit, sans compte, rien n'est enregistré.",
    url: "/outils/generateur-de-devis",
    siteName: "Newbi",
    type: "website",
    locale: "fr_FR",
    images: [{ url: "/images/op-newbi.png", width: 1200, height: 630 }],
  },
};

const FAQ = [
  {
    q: "Un devis est-il obligatoire ?",
    r: "Pas toujours, mais souvent. Il l'est pour les travaux de réparation et d'entretien au-delà de 150 euros TTC chez un particulier, ainsi que dans plusieurs secteurs réglementés comme le déménagement, l'optique ou les services à la personne. En dehors de ces cas, il reste vivement conseillé : il fixe le prix et le périmètre, et vous protège autant que votre client en cas de désaccord.",
  },
  {
    q: "Un devis signé engage-t-il vraiment ?",
    r: "Oui. Dès que le client le date, le signe et porte la mention manuscrite « Bon pour accord », le devis vaut contrat : le prix et les prestations décrites deviennent contractuels pour les deux parties. C'est pourquoi il faut détailler précisément ce qui est inclus, et ce qui ne l'est pas.",
  },
  {
    q: "Quelle durée de validité indiquer sur un devis ?",
    r: "L'usage courant est de trois mois, mais rien ne l'impose : vous fixez la durée librement. Elle doit en revanche figurer sur le document, sinon vous restez tenu par votre prix sans limite dans le temps. Raccourcissez-la si vos coûts de matière première bougent vite.",
  },
  {
    q: "Quelles mentions doit contenir un devis ?",
    r: "La date d'établissement, votre identité complète avec SIREN et adresse, celle du client, le décompte détaillé de chaque prestation en quantité et prix unitaire, les totaux hors taxes et toutes taxes comprises, la durée de validité, les modalités de règlement et la mention « devis gratuit » ou son coût s'il est payant. Pour un particulier, le caractère gratuit ou payant du devis doit être annoncé avant de l'établir.",
  },
  {
    q: "Faut-il créer un compte pour télécharger le devis ?",
    r: "Non. Le générateur fonctionne sans inscription et sans adresse électronique. Votre saisie reste dans votre navigateur, elle n'est jamais envoyée à Newbi, et le PDF est fabriqué par votre propre ordinateur.",
  },
  {
    q: "Comment transformer ce devis en facture ?",
    r: "Avec cet outil, il faut ressaisir les informations dans le générateur de facture. Dans Newbi, un devis accepté se convertit en facture en un clic, sans ressaisie, en conservant les lignes, le client et la référence du devis d'origine.",
  },
];

const MENTIONS = [
  ["Identité de l'émetteur", "Dénomination ou nom et prénom, adresse, SIREN, forme juridique et capital pour une société, et l'assurance décennale pour un artisan du bâtiment."],
  ["Identité du client", "Nom ou dénomination et adresse, ainsi que l'adresse du chantier ou du lieu d'exécution si elle diffère."],
  ["Date et durée de validité", "Date d'établissement et durée pendant laquelle votre prix reste ferme. Sans elle, vous restez engagé sans limite de temps."],
  ["Décompte détaillé", "Chaque prestation ou produit avec sa quantité, son unité et son prix unitaire hors taxes. Un devis vague se retourne contre celui qui l'a rédigé."],
  ["Totaux", "Total hors taxes, TVA par taux, total toutes taxes comprises, et montant de l'acompte demandé le cas échéant."],
  ["Modalités de règlement", "Échéancier, acompte à la commande, moyens de paiement acceptés et conditions d'annulation."],
  ["Mention d'acceptation", "L'emplacement où le client date, signe et porte la mention « Bon pour accord », qui transforme l'offre en contrat."],
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Générateur de devis gratuit Newbi",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: "fr-FR",
    url: `${SITE_URL}/outils/generateur-de-devis`,
    description:
      "Créez un devis professionnel en ligne et téléchargez-le en PDF, gratuitement et sans inscription.",
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
        name: "Générateur de devis",
        item: `${SITE_URL}/outils/generateur-de-devis`,
      },
    ],
  },
];

export default function GenerateurDeDevisPage() {
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
            <span className="text-gray-900">Générateur de devis</span>
          </nav>

          <header className="max-w-3xl mb-10">
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-gray-900">
              Générateur de devis gratuit
            </h1>
            <p className="mt-4 text-gray-600 leading-relaxed">
              Remplissez le formulaire, vérifiez l'aperçu à droite et
              téléchargez votre devis en PDF. Durée de validité, mentions
              obligatoires et calcul de la TVA sont en place. Gratuit, sans
              inscription, et votre saisie ne quitte jamais votre navigateur.
            </p>
          </header>

          <DocumentGenerator config={DEVIS_CONFIG} />

          {/* --------------------------- Contenu SEO --------------------------- */}
          <section className="mt-20 max-w-3xl">
            <h2 className="text-2xl font-medium tracking-tight text-gray-900 mb-4">
              Ce que doit contenir un devis
            </h2>
            <p className="text-gray-600 mb-6">
              Un devis imprécis se retourne toujours contre celui qui l'a
              rédigé : ce qui n'y figure pas est réputé inclus dans le prix.
              Voici ce que votre document doit contenir, et ce que le
              générateur remplit à partir de votre saisie.
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
              Pour aller plus loin, consultez notre guide pour{" "}
              <Link
                href="/blog/comment-faire-devis-professionnel"
                className="text-[#5a50ff] underline underline-offset-4"
              >
                rédiger un devis professionnel
              </Link>{" "}
              et nos conseils sur{" "}
              <Link
                href="/blog/duree-validite-devis-regles"
                className="text-[#5a50ff] underline underline-offset-4"
              >
                la durée de validité d'un devis
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
                ["/outils/generateur-de-facture", "Générateur de facture", "Le devis est accepté ? Créez la facture correspondante."],
                ["/modeles/modele-devis.xlsx", "Modèle de devis Excel", "Le même document à remplir hors ligne, avec calcul automatique."],
                ["/blog/erreurs-devis-perdre-clients", "Les erreurs qui font perdre des devis", "Huit maladresses courantes et comment les éviter."],
                ["/blog/conseils-convertir-devis-facture", "Convertir un devis en facture", "Sept conseils pour signer plus de devis."],
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
