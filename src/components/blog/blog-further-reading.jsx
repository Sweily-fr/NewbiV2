import Link from "next/link";
import { getAllPosts, categoryLabel } from "@/src/lib/blog";

/**
 * Articles mis en avant sur chaque page produit (« Pour aller plus loin »).
 * Les pages produits sont les pages les plus fortes du site : ces liens
 * transmettent leur autorité aux articles piliers et inversement, le blog
 * ramène vers le produit via ses liens contextuels.
 */
const FURTHER_READING = {
  factures: [
    "mentions-obligatoires-facture",
    "comment-creer-facture-auto-entrepreneur",
    "erreurs-facturation-independants",
  ],
  "facturation-electronique": [
    "facturation-electronique-obligatoire-2026",
    "quest-ce-que-pdp-plateforme-dematerialisation",
    "facturx-format-facture-electronique",
  ],
  "gestion-des-achats": [
    "ocr-justificatifs-comptables",
    "gestion-notes-frais-deplacement",
    "comment-partager-documents-expert-comptable",
  ],
  tresorerie: [
    "comment-gerer-tresorerie-entreprise",
    "connexion-bancaire-rapprochement-automatique",
    "conseils-reduire-delais-paiement",
  ],
  kanban: [
    "gestion-projet-kanban-independant",
    "top-outils-gestion-projet-freelance",
    "gestion-administrative-office-manager-guide",
  ],
  signatures: [
    "signature-mail-professionnelle-guide",
    "conseils-ameliorer-signature-email",
    "crm-gestion-client-independant",
  ],
  transfers: [
    "transfert-fichiers-securise-professionnel",
    "comment-partager-documents-expert-comptable",
    "top-outils-scan-tickets-caisse-notes-frais",
  ],
};

export function BlogFurtherReading({ product }) {
  const slugs = FURTHER_READING[product] ?? [];
  if (slugs.length === 0) return null;

  const bySlug = new Map(getAllPosts().map((p) => [p.slug, p]));
  const posts = slugs.map((s) => bySlug.get(s)).filter(Boolean);
  if (posts.length === 0) return null;

  return (
    <section
      aria-labelledby="further-reading-heading"
      className="px-5 py-16 md:py-20 bg-white"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-baseline justify-between gap-3 mb-8">
          <h2
            id="further-reading-heading"
            className="text-2xl md:text-3xl font-medium tracking-tight text-gray-900"
          >
            Pour aller plus loin
          </h2>
          <Link href="/blog" className="text-sm text-[#5a50ff] hover:underline">
            Tous les articles du blog
          </Link>
        </div>
        <ul className="grid gap-4 md:grid-cols-3">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group block h-full rounded-xl border border-gray-200 p-5 hover:border-[#5a50ff] transition-colors"
              >
                <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-2">
                  {categoryLabel(post.category)} · {post.readTime} min
                </p>
                <p className="text-base font-medium text-gray-900 group-hover:text-[#5a50ff] transition-colors leading-snug">
                  {post.title}
                </p>
                <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                  {post.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
