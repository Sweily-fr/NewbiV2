import Link from "next/link";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import Footer7 from "@/src/components/footer7";
import { JsonLd } from "@/src/components/seo/json-ld";
import { SITE_URL } from "@/src/lib/site";
import { faqJsonLd } from "@/src/components/public-faq";
import DocumentGenerator from "../_components/DocumentGenerator";
import { DEVIS_CONFIG } from "../_components/configs";
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

// Ce que l'outil fait réellement (DocumentGenerator.jsx), et donc ce que la
// page peut promettre : un PDF A4 produit dans le navigateur (une image de la
// page), sans compte ni enregistrement ; date « Valable jusqu'au » à 90 jours
// par défaut ; conditions préremplies (validité 3 mois, « Bon pour accord »,
// acompte de 30 %) et modifiables ; TVA par ligne ; franchise en base.
// Il ne fait PAS : de signature en ligne, de cadre de signature dédié (la
// mention d'accord est dans les conditions), de champ acompte, délai
// d'exécution ou assurance décennale, ni de conversion en facture.

export const metadata = {
  title: {
    absolute:
      "Générateur de devis gratuit en ligne, PDF sans inscription | Newbi",
  },
  description:
    "Faites un devis gratuit en ligne : prestations, TVA, durée de validité, aperçu puis PDF à télécharger, sans inscription.",
  alternates: { canonical: "/outils/generateur-de-devis" },
  openGraph: {
    title: "Générateur de devis gratuit en ligne | Newbi",
    description:
      "Remplissez, prévisualisez et téléchargez votre devis en PDF. Gratuit, sans compte, rien n'est enregistré.",
    url: "/outils/generateur-de-devis",
    siteName: "Newbi",
    type: "website",
    locale: "fr_FR",
    images: [{ url: "/images/op-newbi.png", width: 1200, height: 630 }],
  },
};

const ETAPES = [
  {
    title: "Renseignez votre entreprise et votre client",
    text: "Nom, adresse, SIREN et forme juridique. Entrepreneur individuel ou micro-entrepreneur : saisissez « EI » comme forme juridique, la mention s'ajoute devant votre nom. En franchise en base, cochez la case prévue.",
  },
  {
    title: "Détaillez la prestation et fixez la validité",
    text: "Une ligne par poste, avec sa quantité, son prix unitaire HT et son taux de TVA. La date « Valable jusqu'au » est posée à 90 jours. Les conditions sont préremplies (validité, « Bon pour accord », acompte de 30 %) : adaptez-les et ajoutez le délai d'exécution.",
  },
  {
    title: "Téléchargez le PDF et faites-le signer",
    text: "Relisez l'aperçu, cochez la case de prise de connaissance et téléchargez le PDF. Votre client le retourne daté et signé avec la mention « Bon pour accord ». Rien n'est enregistré : gardez le fichier pour établir la facture.",
  },
];

const MENTIONS = [
  [
    "Identité de l'émetteur",
    "Nom ou dénomination, adresse, SIREN et forme juridique, avec « EI » pour un entrepreneur individuel. Une société ajoute son capital et son RCS, un artisan son numéro au répertoire des métiers et, dans le bâtiment, son assurance professionnelle avec sa couverture géographique. Ces trois points n'ont pas de champ : portez-les dans les conditions.",
  ],
  [
    "Identité du client",
    "Nom ou dénomination et adresse, ainsi que l'adresse du chantier ou du lieu d'exécution si elle diffère.",
  ],
  [
    "Date et durée de validité",
    "Date d'établissement et date jusqu'à laquelle votre prix reste ferme. Sans elle, vous restez engagé sans limite de temps.",
  ],
  [
    "Décompte détaillé",
    "Chaque prestation ou produit avec sa quantité, son unité et son prix unitaire hors taxes, y compris les frais de déplacement s'ils sont facturés. Un devis vague se retourne contre celui qui l'a rédigé.",
  ],
  [
    "Totaux et TVA",
    "Total hors taxes, TVA par taux, total toutes taxes comprises, ou « TVA non applicable, art. 293 B du CGI » en franchise en base, référence valable jusqu'au 31 décembre 2026.",
  ],
  [
    "Conditions",
    "Acompte demandé, échéancier, moyens de paiement, date ou délai d'exécution (obligatoire face à un particulier), et le caractère gratuit ou payant du devis.",
  ],
  [
    "Mention d'acceptation",
    "La date, la signature du client et la mention « Bon pour accord », qui transforment l'offre en contrat. Le générateur la place dans les conditions ; il n'y a pas de cadre de signature séparé.",
  ],
];

const EXEMPLE = {
  caption:
    "Devis D-2026-021 établi le 9 novembre 2026 par Studio Nord, SASU de développement web, valable jusqu'au 7 février 2027 (90 jours).",
  head: ["Désignation", "Quantité", "Prix unitaire HT", "Total HT"],
  rows: [
    [
      "Site vitrine : maquettes, développement et mise en ligne",
      "1",
      "2 400,00 €",
      "2 400,00 €",
    ],
    ["Rédaction des pages, à la page", "5", "120,00 €", "600,00 €"],
    ["Maintenance, au mois", "3", "50,00 €", "150,00 €"],
  ],
  totals: [
    ["Total HT", "3 150,00 €"],
    ["TVA 20 %", "630,00 €"],
    ["Total TTC", "3 780,00 €"],
  ],
};

const ERREURS = [
  {
    title: "Une désignation trop vague",
    text: "« Prestation de conseil » ne dit ni combien de jours, ni quels livrables, ni ce qui est exclu. Ce qui n'est pas écrit est réputé compris dans le prix : détaillez, et listez ce que le devis ne couvre pas.",
  },
  {
    title: "Oublier la durée de validité",
    text: "Sans date limite, un client peut accepter votre prix des mois plus tard, alors que vos coûts ont changé. Trois mois est l'usage ; raccourcissez si vos achats fluctuent.",
  },
  {
    title: "Ne rien dire du délai d'exécution",
    text: "Face à un particulier, la date ou le délai de réalisation fait partie des informations à fournir avant qu'il ne s'engage. Le formulaire n'a pas de champ dédié : écrivez-le dans les conditions.",
  },
  {
    title: "Commencer avant la signature",
    text: "Tant que le devis n'est pas accepté, rien ne prouve l'accord sur le prix. Attendez le retour daté et signé, ou au minimum un accord écrit du client.",
  },
  {
    title: "Encaisser l'acompte sans facture",
    text: "Un acompte reçu donne lieu à une facture d'acompte, avec sa TVA pour une prestation de services. Le devis seul ne suffit pas comme pièce comptable.",
  },
  {
    title: "Modifier un devis déjà signé",
    text: "Une fois accepté, le devis est un contrat : un changement de prix ou de périmètre passe par un avenant ou un nouveau devis signé, pas par une correction du document d'origine.",
  },
];

const FAQ = [
  {
    question: "Un devis est-il obligatoire ?",
    answer:
      "Pas toujours, mais souvent. Il l'est pour les travaux de dépannage, de réparation et d'entretien dans le bâtiment et l'équipement de la maison au-delà de 150 euros TTC chez un particulier, ainsi que dans plusieurs secteurs réglementés comme le déménagement ou les services à la personne. En dehors de ces cas, il reste vivement conseillé : il fixe le prix et le périmètre, et vous protège autant que votre client.",
  },
  {
    question: "Un devis signé engage-t-il vraiment ?",
    answer:
      "Oui. Une fois accepté, daté et signé par le client avec la mention « Bon pour accord », le devis vaut contrat : le prix et les prestations décrites lient les deux parties. C'est pourquoi il faut détailler précisément ce qui est inclus, et ce qui ne l'est pas.",
  },
  {
    question: "Quelle durée de validité indiquer sur un devis ?",
    answer:
      "L'usage est de trois mois, et c'est ce que propose le générateur, mais vous fixez la durée librement. Elle doit en revanche figurer sur le document, sinon vous restez tenu par votre prix sans limite dans le temps. Raccourcissez-la si vos coûts de matière première bougent vite.",
  },
  {
    question: "Faut-il un compte, et dans quel format est le devis ?",
    answer:
      "Aucun compte ni adresse e-mail : la saisie reste dans votre navigateur, n'est jamais envoyée à Newbi et disparaît à la fermeture de la page. Le devis se télécharge en PDF A4. Le contenu du PDF est une image de la page : pour corriger, modifiez le formulaire et téléchargez à nouveau.",
  },
  {
    question: "Le client peut-il signer le devis en ligne ?",
    answer:
      "Pas avec cet outil : il produit un PDF que votre client imprime ou annote, puis vous renvoie daté et signé. La signature électronique de devis, avec relance de ceux restés sans réponse, fait partie de Newbi.",
  },
  {
    question: "La facture électronique concerne-t-elle les devis ?",
    answer:
      "Non. La réforme vise les factures, pas les devis : un devis en PDF restera valable après le 1er septembre 2027. En revanche, la facture établie à partir de ce devis devra, à cette date, être émise au format électronique via une plateforme agréée si votre client est une entreprise assujettie et que vous êtes une TPE, une PME ou une micro-entreprise.",
  },
  {
    question: "Comment transformer ce devis en facture ?",
    answer:
      "Avec cet outil, il faut ressaisir les informations dans le générateur de facture, en reprenant la référence du devis dans la désignation. Dans Newbi, un devis accepté se convertit en facture en un clic, sans ressaisie, en conservant les lignes, le client et la référence du devis d'origine.",
  },
];

const LIENS = [
  [
    "/blog/modele-devis-gratuit-word-excel-pdf",
    "Modèle de devis à télécharger",
    "Word, Excel et PDF, avec un exemple rempli.",
  ],
  [
    "/blog/comment-faire-devis-professionnel",
    "Rédiger un devis professionnel",
    "La méthode, poste par poste.",
  ],
  [
    "/blog/duree-validite-devis-regles",
    "Durée de validité d'un devis",
    "Ce que dit la loi, et la durée à choisir.",
  ],
  [
    "/blog/devis-signe-valeur-juridique-engagement",
    "Devis signé : valeur juridique",
    "Engagement, rétractation et annulation.",
  ],
  [
    "/blog/quel-acompte-demander-sur-un-devis",
    "Quel acompte demander ?",
    "Les pourcentages pratiqués, secteur par secteur.",
  ],
  [
    "/outils/generateur-de-facture",
    "Générateur de facture",
    "Le devis est accepté ? Créez la facture correspondante.",
  ],
  [
    "/modeles/modele-devis.xlsx",
    "Modèle de devis Excel",
    "Le même document à remplir hors ligne, avec calcul automatique.",
  ],
  [
    "/blog/obligations-legales-devis-consommateur",
    "Devis pour un particulier",
    "Seuils et mentions imposés par le droit de la consommation.",
  ],
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Générateur de devis gratuit Newbi",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    browserRequirements: "Navigateur web récent avec JavaScript",
    inLanguage: "fr-FR",
    url: `${SITE_URL}/outils/generateur-de-devis`,
    description:
      "Créez un devis professionnel en ligne et téléchargez-le en PDF, gratuitement et sans inscription.",
    isAccessibleForFree: true,
    featureList: [
      "Aperçu en direct du document",
      "Durée de validité et mention « Bon pour accord »",
      "Calcul du total HT, de la TVA et du total TTC",
      "Téléchargement en PDF",
    ],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
      description: "Gratuit, sans inscription",
    },
    publisher: { "@type": "Organization", name: "Newbi", url: SITE_URL },
  },
  faqJsonLd(FAQ),
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
              Générateur de devis gratuit en ligne
            </h1>
            <p className="mt-4 text-gray-600 leading-relaxed">
              Remplissez le formulaire, vérifiez l&apos;aperçu à droite et
              téléchargez votre devis en PDF. Durée de validité, mentions
              obligatoires et calcul de la TVA sont en place. Gratuit, sans
              inscription, et votre saisie ne quitte jamais votre navigateur.
            </p>
          </header>

          <DocumentGenerator config={DEVIS_CONFIG} />

          {/* ------------------- Guide, rendu côté serveur ------------------- */}
          <GuideSection
            id="mode-emploi"
            title="Faire un devis en ligne gratuit en 3 étapes"
            intro={
              <p>
                Un devis clair se signe plus vite. Prévoyez de quoi décrire
                chaque poste précisément : c&apos;est là que se jouent la
                plupart des litiges.
              </p>
            }
          >
            <Steps steps={ETAPES} />
          </GuideSection>

          <GuideSection
            id="mentions"
            title="Ce que contient le devis généré"
            intro={
              <p>
                Ce qui n&apos;y figure pas est réputé inclus dans le prix. Voici
                ce que votre devis doit contenir au 9 novembre 2026, et ce
                qu&apos;il vous revient d&apos;ajouter quand le formulaire
                n&apos;a pas de champ prévu.
              </p>
            }
          >
            <DefinitionCards items={MENTIONS} />
            <p className="mt-6 text-sm text-gray-600 leading-relaxed">
              Votre client est un particulier ? Le droit de la consommation
              ajoute ses propres règles, détaillées dans notre article sur{" "}
              <InlineLink href="/blog/obligations-legales-devis-consommateur">
                les obligations légales du devis pour un consommateur
              </InlineLink>
              . Pour la méthode complète, voyez notre guide pour{" "}
              <InlineLink href="/blog/comment-faire-devis-professionnel">
                rédiger un devis professionnel
              </InlineLink>
              .
            </p>
          </GuideSection>

          <GuideSection
            id="exemple"
            title="Exemple : un devis de site internet"
            intro={
              <p>
                Studio Nord chiffre un site vitrine pour une entreprise cliente.
                Chaque poste a sa ligne, la maintenance est comptée au mois pour
                que le client voie ce qu&apos;il achète.
              </p>
            }
          >
            <ExampleTable {...EXEMPLE} />
            <p className="mt-6 text-sm text-gray-600 leading-relaxed">
              Avec l&apos;acompte de 30 % prévu dans les conditions, le client
              verse 1 134,00 euros TTC à la signature, qui donnent lieu à une
              facture d&apos;acompte, et 2 646,00 euros à la livraison. Les
              conditions précisent aussi la date de mise en ligne visée et ce
              qui n&apos;est pas compris, par exemple l&apos;hébergement.
            </p>
          </GuideSection>

          <GuideSection id="erreurs" title="Les erreurs fréquentes à éviter">
            <MistakeList items={ERREURS} />
          </GuideSection>

          <GuideSection id="faq" title="Questions fréquentes">
            <ToolFaq items={FAQ} />
          </GuideSection>

          <GuideSection id="plus-loin" title="Pour aller plus loin">
            <RelatedLinks links={LIENS} />
          </GuideSection>
        </div>
      </main>

      <Footer7 />
    </>
  );
}
