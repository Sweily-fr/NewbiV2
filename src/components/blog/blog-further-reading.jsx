import Link from "next/link";
import { getAllPosts, categoryLabel } from "@/src/lib/blog";

/**
 * Articles mis en avant sur chaque page produit (« Pour aller plus loin »),
 * 6 par produit depuis sept. 2026 : les 3 piliers du thème + les articles
 * en position 10-30 dans la Search Console, à pousser vers la page 1.
 * Les pages produits sont les pages les plus fortes du site : ces liens
 * transmettent leur autorité aux articles piliers et inversement, le blog
 * ramène vers le produit via ses liens contextuels.
 */
const FURTHER_READING = {
  "photographes-creatifs": [
    "facture-photographe-droits-auteur",
    "facture-graphiste-designer-freelance",
    "facture-createur-contenu-influenceur",
  ],
  avocats: [
    "facturation-avocat-honoraires-guide",
    "facturation-cabinet-avocat-gestion",
    "facture-electronique-professions-liberales",
  ],
  "professions-medicales": [
    "facture-osteopathe-guide",
    "facture-electronique-professions-liberales",
    "mentions-obligatoires-facture",
  ],
  "btp-artisans": [
    "devis-travaux-btp-guide",
    "facture-situation-travaux-btp",
    "facture-btp-artisan-mentions-specifiques",
  ],
  // Pages « Pour qui » : mêmes clés que les slugs des statuts.
  "auto-entrepreneur": [
    "comment-creer-facture-auto-entrepreneur",
    "facture-electronique-auto-entrepreneur-2027",
    "declaration-urssaf-auto-entrepreneur-guide",
  ],
  "micro-entreprise": [
    "plafonds-micro-entreprise-2027",
    "depassement-seuil-micro-entreprise-consequences",
    "compte-bancaire-professionnel-obligatoire",
  ],
  "entreprise-individuelle": [
    "ocr-justificatifs-comptables",
    "comment-partager-documents-expert-comptable",
    "declaration-tva-ca3-ca12-guide",
  ],
  "sasu-eurl": [
    "micro-entreprise-eurl-sasu-choisir",
    "comment-partager-documents-expert-comptable",
    "comment-gerer-tresorerie-entreprise",
  ],
  // Pas d'article dédié aux sociétés à plusieurs associés : on reprend les
  // guides qui leur parlent — choix du statut, partage au comptable, trésorerie.
  "sas-sarl": [
    "micro-entreprise-eurl-sasu-choisir",
    "comment-partager-documents-expert-comptable",
    "comment-gerer-tresorerie-entreprise",
  ],
  // La SCI n'a pas d'article dédié : on reprend trois guides qui s'y
  // appliquent réellement — justificatifs, partage au comptable, trésorerie.
  sci: [
    "ocr-justificatifs-comptables",
    "comment-partager-documents-expert-comptable",
    "comment-gerer-tresorerie-entreprise",
  ],
  association: [
    "facturation-association-loi-1901",
    "facture-electronique-association-concernee",
    "mentions-obligatoires-facture",
  ],
  factures: [
    "mentions-obligatoires-facture",
    "comment-creer-facture-auto-entrepreneur",
    "erreurs-facturation-independants",
    "modele-facture-gratuit-word-excel-pdf",
    "facturer-prestation-service-consultant",
    "multi-entreprises-gestion-facturation",
  ],
  "facturation-electronique": [
    "facturation-electronique-obligatoire-2026",
    "quest-ce-que-pdp-plateforme-dematerialisation",
    "facturx-format-facture-electronique",
    "facture-electronique-reception-1er-septembre-2026",
    "facture-electronique-auto-entrepreneur-2027",
    "nouvelles-mentions-obligatoires-facture-electronique",
  ],
  "gestion-des-achats": [
    "ocr-justificatifs-comptables",
    "gestion-notes-frais-deplacement",
    "comment-partager-documents-expert-comptable",
    "top-outils-scan-tickets-caisse-notes-frais",
    "quest-ce-que-tva-intracommunautaire",
    "erreurs-declaration-tva-eviter",
  ],
  tresorerie: [
    "comment-gerer-tresorerie-entreprise",
    "connexion-bancaire-rapprochement-automatique",
    "conseils-reduire-delais-paiement",
    "erreurs-gestion-tresorerie-eviter",
    "gestion-tresorerie-commerce-detail",
    "alternatives-excel-gestion-entreprise",
  ],
  kanban: [
    "gestion-projet-kanban-independant",
    "top-outils-gestion-projet-freelance",
    "gestion-administrative-office-manager-guide",
    "meilleurs-logiciels-office-manager",
    "crm-gestion-client-independant",
    "comment-creer-catalogue-produits-services",
  ],
  signatures: [
    "signature-mail-professionnelle-guide",
    "conseils-ameliorer-signature-email",
    "crm-gestion-client-independant",
    "relance-facture-impayee-modele",
    "quest-ce-que-conditions-generales-vente",
    "meilleures-pratiques-relance-client",
  ],
  transfers: [
    "transfert-fichiers-securise-professionnel",
    "comment-partager-documents-expert-comptable",
    "top-outils-scan-tickets-caisse-notes-frais",
    "gestion-notes-frais-deplacement",
    "facture-photographe-droits-auteur",
    "facture-graphiste-designer-freelance",
  ],
};

// Visuels des cartes : les vignettes d'article manquent souvent sur le
// disque, on sert donc une photo dédiée quand elle existe. Sinon la carte
// reste sur un aplat dégradé de la marque.
const CARD_IMAGES = {
  // Les illustrations générées de ces trois articles sont des aplats clairs
  // très chargés : sous le voile sombre de la carte, le titre devenait
  // illisible. `null` leur fait prendre l'aplat pastel de la marque.
  "devis-travaux-btp-guide": null,
  "facture-situation-travaux-btp": null,
  "facture-btp-artisan-mentions-specifiques": null,

  "comment-gerer-tresorerie-entreprise": "/lp/tresorerie/blog/gerer.jpg",
  "connexion-bancaire-rapprochement-automatique":
    "/lp/tresorerie/blog/rapprochement.jpg",
  "conseils-reduire-delais-paiement": "/lp/tresorerie/blog/delais.jpg",
  // Facturation : une photo par thème d'article (Unsplash, auto-hébergées)
  "mentions-obligatoires-facture": "/lp/factures/blog/mentions.jpg",
  "comment-creer-facture-auto-entrepreneur":
    "/lp/factures/blog/auto-entrepreneur.jpg",
  "erreurs-facturation-independants": "/lp/factures/blog/erreurs.jpg",
  // Achats : une photo par thème d'article (Unsplash, auto-hébergées)
  "ocr-justificatifs-comptables": "/lp/achats/blog/ocr.jpg",
  "gestion-notes-frais-deplacement": "/lp/achats/blog/notes-frais.jpg",
  "comment-partager-documents-expert-comptable":
    "/lp/achats/blog/comptable.jpg",
  // Facturation électronique : une photo par thème d'article
  "facturation-electronique-obligatoire-2026":
    "/lp/facturation-electronique/blog/dates.jpg",
  "quest-ce-que-pdp-plateforme-dematerialisation":
    "/lp/facturation-electronique/blog/pdp.jpg",
  "facturx-format-facture-electronique":
    "/lp/facturation-electronique/blog/facturx.jpg",
  // Gestion de projet : une photo par thème d'article
  "gestion-projet-kanban-independant": "/lp/kanban/blog/kanban.jpg",
  "top-outils-gestion-projet-freelance": "/lp/kanban/blog/outils.jpg",
  "gestion-administrative-office-manager-guide":
    "/lp/kanban/blog/administratif.jpg",
  // Transferts : une photo par thème d'article
  "transfert-fichiers-securise-professionnel":
    "/lp/transfers/blog/transfert-securise.jpg",
  "top-outils-scan-tickets-caisse-notes-frais":
    "/lp/transfers/blog/tickets.jpg",
  // Signatures : une photo par thème d'article
  "signature-mail-professionnelle-guide": "/lp/signatures/blog/signature.jpg",
  "conseils-ameliorer-signature-email": "/lp/signatures/blog/checklist.jpg",
  "crm-gestion-client-independant": "/lp/signatures/blog/crm.jpg",
};

export function BlogFurtherReading({ product }) {
  // Trois articles : au-delà, la grille photo devient un mur d'images
  const slugs = (FURTHER_READING[product] ?? []).slice(0, 3);
  if (slugs.length === 0) return null;

  const bySlug = new Map(getAllPosts().map((p) => [p.slug, p]));
  const posts = slugs.map((s) => bySlug.get(s)).filter(Boolean);
  if (posts.length === 0) return null;

  return (
    <section
      aria-labelledby="further-reading-heading"
      className="px-5 py-16 md:py-20 bg-white"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10 md:mb-14">
          <h2
            id="further-reading-heading"
            className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance text-gray-950"
          >
            Pour aller plus loin
          </h2>
          <Link
            href="/blog"
            className="flex-none self-start md:self-auto rounded-xl border border-gray-300 px-7 py-3.5 text-[15px] text-gray-900 hover:bg-gray-50 transition-colors"
          >
            Tous les articles
          </Link>
        </div>

        {/* Deux rendus de carte selon qu'il y a une photo ou non.
            Avec photo : image plein cadre, voile sombre en haut, texte blanc.
            Sans photo : aplat pastel de la marque (le même que la bannière
            claire des LP) et texte sombre — un voile noir sur du pastel
            donnerait un gris sale, et du blanc dessus serait illisible. */}
        <ul className="grid gap-4 md:gap-5 md:grid-cols-3">
          {posts.map((post) => {
            // Un slug présent dans CARD_IMAGES l'emporte sur l'image de
            // l'article — y compris avec la valeur null, qui force alors
            // l'aplat pastel. C'est utile quand l'illustration de l'article
            // ne rend rien sous le voile sombre de la carte.
            const image =
              post.slug in CARD_IMAGES ? CARD_IMAGES[post.slug] : post.image;

            return (
              <li key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className={`group relative flex h-full aspect-[5/4] flex-col overflow-hidden rounded-3xl ${
                    image
                      ? "bg-gradient-to-br from-[#4B41F0] via-[#5A50FF] to-[#8F89FF]"
                      : "bg-gradient-to-br from-[#F0EEFF] via-[#F7F6FF] to-[#EDE9FF]"
                  }`}
                >
                  {image && (
                    <>
                      <img
                        src={image}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-x-0 top-0 h-3/4 bg-gradient-to-b from-black/85 via-black/55 to-transparent" />
                    </>
                  )}

                  <div className="relative p-7 md:p-8">
                    <p
                      className={`mb-2 text-[11px] uppercase tracking-wide ${
                        image ? "text-white/70" : "text-[#5A50FF]"
                      }`}
                    >
                      {categoryLabel(post.category)} · {post.readTime} min
                    </p>
                    <h3
                      className={`mb-3 text-xl font-medium leading-snug tracking-tight md:text-2xl ${
                        image ? "text-white" : "text-gray-950"
                      }`}
                    >
                      {post.title}
                    </h3>
                    <p
                      className={`line-clamp-2 text-[15px] leading-relaxed ${
                        image ? "text-white/85" : "text-gray-600"
                      }`}
                    >
                      {post.description}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
