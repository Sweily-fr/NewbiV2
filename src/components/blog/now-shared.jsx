import Link from "next/link";

/* Briques communes aux blocs du blog, calées sur la page « Now » de Linear :
   grille de 3 colonnes de 384 px séparées par 64 px dans un conteneur de
   1280 px, couvertures en 16/9, et une échelle typographique resserrée
   (titres 20 px, chapôs 16/24, méta 13 px). Thème clair. */

// Même emprise que la navbar : son conteneur intérieur fait max-w-7xl à
// l'intérieur d'un padding de 48 px (24 px sous lg), soit 1280 + 2 x 48.
export const CONTENEUR = "mx-auto w-full max-w-[1376px] px-6 lg:px-12";
export const TITRE_SECTION =
  "text-4xl md:text-5xl font-medium tracking-[-0.022em] leading-none text-gray-950";

/**
 * Charge utile minimale envoyée à la palette de recherche : titre, URL et
 * thème seulement, pour ne pas sérialiser 170 articles complets dans le
 * bundle client de chaque page du blog.
 */
export function indexDeRecherche(posts) {
  return posts.map((p) => ({
    titre: p.title,
    url: p.url,
    theme: p.categoryLabel || p.category,
  }));
}

/** Date courte : « 14 oct. 2026 ». */
export function dateCourte(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Date de la frise, en capitales : « 14 OCT. 2026 ». */
export function dateFrise(iso) {
  return dateCourte(iso).toUpperCase();
}

/** Couverture d'article. Les articles sans visuel gardent la même emprise. */
export function Couverture({ post, priorite = false }) {
  return (
    <div className="relative aspect-[16/9] overflow-hidden rounded-md bg-[#F4F4F6] ring-1 ring-black/[0.055]">
      {post.image ? (
        <img
          src={post.image}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading={priorite ? "eager" : "lazy"}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-[#F4F4F6] to-[#FAFAFB]">
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-gray-400">
            {post.categoryLabel || post.category}
          </span>
        </div>
      )}
    </div>
  );
}

/** Carte d'article : couverture, titre, chapô, puis auteur et date. */
export function CarteArticle({ post, priorite = false }) {
  return (
    <article>
      <Link href={post.url} className="group block">
        <Couverture post={post} priorite={priorite} />
        <h3 className="mt-6 text-[20px] font-medium leading-[1.33] tracking-[-0.012em] text-gray-950 transition-colors group-hover:text-[#5A50FF]">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-3 text-[16px] leading-6 text-gray-600">
          {post.description}
        </p>
        <p className="mt-6 flex items-center gap-1.5 text-[13px] text-gray-500">
          <span>{post.author}</span>
          <span aria-hidden="true">·</span>
          <span>{dateCourte(post.dateIso)}</span>
          <span
            aria-hidden="true"
            className="translate-x-0 opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100"
          >
            →
          </span>
        </p>
      </Link>
    </article>
  );
}

/** Grille de cartes : 3 colonnes, gouttières de 64 px comme chez Linear. */
export function GrilleArticles({ posts, priorite = false, className = "" }) {
  if (!posts.length) return null;
  return (
    <div
      className={`grid grid-cols-1 gap-x-16 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 ${className}`.trim()}
    >
      {posts.map((post, i) => (
        <CarteArticle
          key={post.slug}
          post={post}
          priorite={priorite && i < 3}
        />
      ))}
    </div>
  );
}
