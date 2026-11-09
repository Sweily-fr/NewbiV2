import Link from "next/link";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import Footer7 from "@/src/components/footer7";
import { JsonLd } from "@/src/components/seo/json-ld";
import { SITE_URL } from "@/src/lib/site";
import { faqJsonLd } from "@/src/components/public-faq";
import DocumentGenerator from "../_components/DocumentGenerator";
import { FACTURE_CONFIG } from "../_components/configs";
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

// Ce que l'outil fait réellement (DocumentGenerator.jsx), et donc ce que la
// page peut promettre : un PDF A4 produit dans le navigateur (une image de la
// page, pas un Factur-X), sans compte ni enregistrement ; TVA par ligne à 20,
// 10, 5,5, 2,1 ou 0 % ; case franchise en base qui ajoute la mention 293 B ;
// « EI » ajouté devant le nom quand la forme juridique saisie est « EI ».
// Il ne gère PAS : la numérotation d'une visite à l'autre, la date de
// prestation distincte, les remises, le logo, le numéro de TVA du client, la
// nature de l'opération, l'adresse de livraison, ni l'émission électronique.

export const metadata = {
  title: {
    absolute:
      "Générateur de facture gratuit en ligne, sans inscription | Newbi",
  },
  description:
    "Créez une facture gratuitement en ligne : remplissez, vérifiez l'aperçu et téléchargez le PDF, sans inscription. Mentions obligatoires, TVA ou franchise en base.",
  alternates: { canonical: "/outils/generateur-de-facture" },
  openGraph: {
    title: "Générateur de facture gratuit en ligne | Newbi",
    description:
      "Remplissez, prévisualisez et téléchargez votre facture en PDF. Gratuit, sans compte, rien n'est enregistré.",
    url: "/outils/generateur-de-facture",
    siteName: "Newbi",
    type: "website",
    locale: "fr_FR",
    images: [{ url: "/images/op-newbi.png", width: 1200, height: 630 }],
  },
};

const PLANCHER = pourcent(PLANCHER_PENALITES);

const ETAPES = [
  {
    title: "Renseignez votre entreprise et votre client",
    text: "Nom, adresse, SIREN et forme juridique. Entrepreneur individuel ou micro-entrepreneur : saisissez « EI » comme forme juridique, la mention s'ajoute devant votre nom. En franchise en base, cochez la case prévue.",
  },
  {
    title: "Numérotez, datez et détaillez vos lignes",
    text: "Reprenez le numéro qui suit votre dernière facture, vérifiez l'échéance (30 jours par défaut), puis ajoutez une ligne par prestation avec sa quantité, son prix unitaire HT et son taux de TVA. Les totaux se calculent seuls.",
  },
  {
    title: "Vérifiez l'aperçu et téléchargez le PDF",
    text: "L'aperçu est le document final. Relisez les conditions de règlement, cochez la case de prise de connaissance et téléchargez le PDF. Rien n'est enregistré : archivez le fichier avant de fermer la page.",
  },
];

const MENTIONS = [
  [
    "Identité de l'émetteur",
    "Nom ou dénomination, adresse, SIREN et forme juridique, avec « EI » pour un entrepreneur individuel. Une société ajoute son capital et son RCS, un artisan son numéro au répertoire des métiers : sans champ dédié, portez-les dans les conditions.",
  ],
  [
    "Régime de TVA",
    "Votre numéro de TVA intracommunautaire, ou « TVA non applicable, art. 293 B du CGI » en franchise en base, référence valable jusqu'au 31 décembre 2026 (la TVA est recodifiée au 1er janvier 2027).",
  ],
  [
    "Identité du client",
    "Nom ou dénomination et adresse. Pour un professionnel, saisissez son SIRET : le générateur en affiche le SIREN, obligatoire avec la facture électronique.",
  ],
  [
    "Numéro et dates",
    "Numéro unique d'une séquence continue, date d'émission, date de la vente ou de la prestation, date d'échéance. Si la prestation date d'un autre jour que l'émission, précisez-le dans la désignation.",
  ],
  [
    "Lignes et totaux",
    "Désignation, quantité, prix unitaire HT et taux de TVA par ligne, puis total HT, TVA par taux et total TTC. Pas de champ de remise : indiquez-la dans la désignation.",
  ],
  [
    "Conditions de règlement",
    `Taux des pénalités de retard (au moins trois fois le taux d'intérêt légal, soit ${PLANCHER} au ${TAUX_LEGAL_PRO.periode}) et indemnité de 40 euros pour un client professionnel, déjà préremplis, et conditions d'escompte, à ajouter : « pas d'escompte pour paiement anticipé » suffit.`,
  ],
  [
    "Cas particuliers",
    "« Autoliquidation » en sous-traitance du bâtiment ou pour un client d'un autre État membre, et l'article d'exonération pour toute ligne à 0 % : le générateur ne l'exige pas, écrivez-le dans les conditions.",
  ],
];

const EXEMPLE = {
  caption:
    "Facture F-2026-014 émise le 9 novembre 2026 par Camille Martin EI, graphiste assujettie à la TVA, à la société Atelier Lumière, échéance au 9 décembre 2026.",
  head: ["Désignation", "Quantité", "Prix unitaire HT", "Total HT"],
  rows: [
    ["Création de logo (octobre 2026)", "1", "800,00 €", "800,00 €"],
    ["Charte graphique et déclinaisons", "1", "450,00 €", "450,00 €"],
    ["Retouches, en heures", "3", "60,00 €", "180,00 €"],
  ],
  totals: [
    ["Total HT", "1 430,00 €"],
    ["TVA 20 %", "286,00 €"],
    ["Total TTC", "1 716,00 €"],
  ],
};

const ERREURS = [
  {
    title: "Repartir de 001 à chaque facture",
    text: "Le générateur propose 001 par défaut et n'a aucune mémoire d'une visite à l'autre. Un doublon ou un trou est une irrégularité : notez votre dernier numéro.",
  },
  {
    title: "Oublier « EI » ou la mention de franchise",
    text: "Chaque mention manquante ou inexacte coûte 15 euros d'amende, dans la limite du quart du montant facturé.",
  },
  {
    title: "Mettre une ligne à 0 % sans justification",
    text: "Un taux nul n'est valable qu'avec la mention qui l'explique : franchise en base, autoliquidation, exportation ou article d'exonération. Sans elle, la TVA reste due.",
  },
  {
    title: "Fixer une échéance trop lointaine",
    text: "Entre professionnels : 30 jours après la livraison ou la prestation si rien n'est convenu, et jamais plus de 60 jours après la date de la facture, ou 45 jours fin de mois si le contrat le prévoit.",
  },
  {
    title: "Réclamer l'indemnité de 40 euros à un particulier",
    text: "Elle n'existe qu'entre professionnels : pour un particulier, retirez-la des conditions.",
  },
  {
    title: "Ne pas archiver le fichier",
    text: "Une facture se conserve dix ans. Cet outil n'enregistre rien : un PDF perdu n'existe plus nulle part.",
  },
];

const FAQ = [
  {
    question: "Une facture créée avec ce générateur est-elle valable ?",
    answer:
      "Oui, aujourd'hui, si elle porte les mentions obligatoires : aucun texte n'impose un logiciel certifié pour facturer, la certification NF525 ne visant que les logiciels de caisse. La numérotation et la conservation pendant dix ans restent à votre charge. Et à partir du 1er septembre 2027, ce PDF ne sera plus une facture valable entre entreprises assujetties pour les TPE, PME et micro-entreprises.",
  },
  {
    question: "Que change la facture électronique pour ce PDF ?",
    answer:
      "Depuis le 1er septembre 2026, toutes les entreprises doivent pouvoir recevoir des factures électroniques. Au 1er septembre 2027, les TPE, PME et micro-entreprises devront aussi les émettre, en données structurées via une plateforme agréée, pour leurs clients professionnels : un PDF envoyé par e-mail ne suffira plus. Pour les particuliers, la facture électronique n'est pas exigée, mais les données de vente devront être transmises à l'administration.",
  },
  {
    question: "Faut-il un compte, et dans quel format est la facture ?",
    answer:
      "Aucun compte ni adresse e-mail : votre saisie reste dans votre navigateur, n'est jamais envoyée à Newbi, et rien n'est conservé après la fermeture de la page. La facture se télécharge en PDF A4, sur plusieurs pages si besoin. Le contenu du PDF est une image de la page : pour corriger, modifiez le formulaire et téléchargez à nouveau. Pour un fichier à remplir dans Word ou Excel, utilisez nos modèles de facture.",
  },
  {
    question: "Comment numéroter mes factures correctement ?",
    answer:
      "Continue et chronologique, sans trou ni doublon. Un préfixe par année est courant, par exemple F-2026-001 puis F-2026-002 : c'est ce que proposent les champs préfixe et numéro. Le générateur ne retient pas le dernier numéro : notez-le, ou passez à un logiciel qui le gère.",
  },
  {
    question:
      "Je suis auto-entrepreneur en franchise en base, que dois-je indiquer ?",
    answer:
      "Saisissez « EI » dans la forme juridique pour que la mention figure devant votre nom, puis cochez la case de franchise en base : la mention « TVA non applicable, article 293 B du Code général des impôts » est ajoutée et les montants s'affichent sans TVA. Cette référence vaut jusqu'au 31 décembre 2026 : la TVA étant recodifiée au 1er janvier 2027, l'article cité changera.",
  },
  {
    question: "Puis-je facturer un client particulier avec cet outil ?",
    answer:
      "Oui. Laissez le SIRET du client vide et adaptez les conditions : l'indemnité de 40 euros ne s'applique pas à un consommateur, et des pénalités de retard supposent des conditions générales acceptées avant la vente. À défaut, seuls les intérêts au taux légal courent, après une mise en demeure.",
  },
];

const LIENS = [
  [
    "/blog/modele-facture-gratuit-word-excel-pdf",
    "Modèle de facture à télécharger",
    "Word, Excel et PDF, avec un exemple rempli.",
  ],
  [
    "/blog/mentions-obligatoires-facture",
    "Les mentions obligatoires d'une facture",
    "La liste complète, avec les cas particuliers par métier.",
  ],
  [
    "/blog/quest-ce-que-numero-facture",
    "Numérotation des factures",
    "Règles, exemples et changement d'année.",
  ],
  [
    "/blog/comment-creer-facture-auto-entrepreneur",
    "Facture auto-entrepreneur",
    "Mentions, franchise en base et modèle.",
  ],
  [
    "/blog/facture-pdf-email-jusqu-a-quand",
    "Facture PDF par e-mail : jusqu'à quand ?",
    "Ce qui change en 2026 et 2027, selon votre client.",
  ],
  [
    "/outils/calculateur-penalites-retard",
    "Calculateur de pénalités de retard",
    "Facture payée en retard ? Chiffrez ce qui vous est dû.",
  ],
  [
    "/outils/generateur-de-devis",
    "Générateur de devis",
    "Chiffrez d'abord, facturez ensuite : le même outil pour vos devis.",
  ],
  [
    "/produits/facturation-electronique",
    "Facturation électronique 2026-2027",
    "Ce qui devient obligatoire, et quand.",
  ],
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Générateur de facture gratuit Newbi",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    browserRequirements: "Navigateur web récent avec JavaScript",
    inLanguage: "fr-FR",
    url: `${SITE_URL}/outils/generateur-de-facture`,
    description:
      "Créez une facture en ligne et téléchargez-la en PDF, gratuitement et sans inscription.",
    isAccessibleForFree: true,
    featureList: [
      "Aperçu en direct du document",
      "Calcul du total HT, de la TVA et du total TTC",
      "Mention de franchise en base de TVA",
      "Téléchargement en PDF",
    ],
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
              Générateur de facture gratuit en ligne
            </h1>
            <p className="mt-4 text-gray-600 leading-relaxed">
              Remplissez le formulaire, vérifiez l&apos;aperçu à droite et
              téléchargez votre facture en PDF. Les mentions obligatoires sont
              en place, les totaux et la TVA se calculent tout seuls. Gratuit,
              sans inscription, et votre saisie ne quitte jamais votre
              navigateur.
            </p>
          </header>

          <DocumentGenerator config={FACTURE_CONFIG} />

          {/* ------------------- Guide, rendu côté serveur ------------------- */}
          <GuideSection
            id="mode-emploi"
            title="Créer une facture gratuitement en 3 étapes"
            intro={
              <p>
                Comptez cinq minutes. Un document qui paraît complet peut encore
                manquer d&apos;une mention obligatoire : la liste plus bas vous
                dit lesquelles vérifier.
              </p>
            }
          >
            <Steps steps={ETAPES} />
          </GuideSection>

          <GuideSection
            id="mentions"
            title="Ce que contient la facture générée"
            intro={
              <p>
                Voici les mentions obligatoires au 9 novembre 2026, et pour
                chacune ce que le générateur remplit ou ce qu&apos;il vous
                revient d&apos;ajouter.
              </p>
            }
          >
            <DefinitionCards items={MENTIONS} />
            <p className="mt-6 text-sm text-gray-600 leading-relaxed">
              Quatre mentions s&apos;ajouteront avec la facture électronique, au
              1er septembre 2027 pour les TPE et PME : le SIREN du client,
              l&apos;adresse de livraison si elle diffère, la nature de
              l&apos;opération (biens, services ou les deux) et l&apos;option
              pour la TVA sur les débits. Le générateur n&apos;a de champ que
              pour la première. Le détail figure dans notre article sur{" "}
              <InlineLink href="/blog/nouvelles-mentions-obligatoires-facture-electronique">
                les nouvelles mentions obligatoires de la facture électronique
              </InlineLink>
              .
            </p>
          </GuideSection>

          <GuideSection
            id="exemple"
            title="Exemple : une facture de graphiste remplie"
            intro={
              <p>
                Camille Martin est graphiste en entreprise individuelle,
                assujettie à la TVA. Elle saisit « EI » dans la forme juridique,
                son SIREN et son numéro de TVA, puis les coordonnées et le SIRET
                de son client. La prestation date d&apos;octobre : elle
                l&apos;indique dans la désignation, puisque la facture est émise
                en novembre.
              </p>
            }
          >
            <ExampleTable {...EXEMPLE} />
            <p className="mt-6 text-sm text-gray-600 leading-relaxed">
              En franchise en base, la même facture afficherait 1 430,00 euros à
              payer, sans TVA, avec la mention de l&apos;article 293 B. Si le
              client règle avec 20 jours de retard et que les conditions
              retiennent le taux plancher de {PLANCHER}, il doit 7,76 euros de
              pénalités (1 716 × {PLANCHER} × 20 / 365) et 40 euros
              d&apos;indemnité forfaitaire. Le{" "}
              <InlineLink href="/outils/calculateur-penalites-retard">
                calculateur de pénalités de retard
              </InlineLink>{" "}
              fait ce calcul pour vous.
            </p>
          </GuideSection>

          <GuideSection id="erreurs" title="Les erreurs fréquentes à éviter">
            <MistakeList items={ERREURS} />
          </GuideSection>

          <GuideSection
            id="facture-electronique"
            title="Et à partir de septembre 2027 ?"
          >
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 leading-relaxed space-y-3">
              <p>
                Ce générateur suffit pour facturer aujourd&apos;hui. Au 1er
                septembre 2027, un PDF, d&apos;où qu&apos;il vienne, ne sera
                plus une facture valable entre entreprises assujetties pour les
                TPE, PME et micro-entreprises.
              </p>
              <p>
                Newbi émet vos factures au format Factur-X via une plateforme
                agréée, numérote sans trou, archive vos documents et relance les
                retards. Vous pouvez l&apos;essayer 30 jours sans carte
                bancaire, et garder ce générateur pour vos besoins ponctuels
                d&apos;ici là.{" "}
                <InlineLink href="/auth/signup">Essayer Newbi</InlineLink>
              </p>
            </div>
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
