import Link from "next/link";
import type { BlogPostMeta } from "@/src/lib/blog";
import { categoryLabel } from "@/src/lib/blog";
import { formatDateFr } from "@/src/lib/blog-format";

interface Props {
  posts: BlogPostMeta[];
  categoryHref: string;
  categoryLabel: string;
  sectorHref: string | null;
  sectorLabel: string | null;
}

/**
 * « À lire aussi » en bas d'article : 4 articles du même secteur / de la même
 * catégorie, plus les liens vers les pages hub. C'est ce bloc qui donne à
 * chaque article des liens entrants depuis les articles voisins.
 */
export function BlogRelatedPosts({
  posts,
  categoryHref,
  categoryLabel: catLabel,
  sectorHref,
  sectorLabel,
}: Props) {
  if (posts.length === 0) return null;

  return (
    <aside aria-labelledby="related-heading" className="not-prose mt-16">
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-6">
        <h2
          id="related-heading"
          className="text-xl font-medium tracking-tight text-gray-900"
        >
          À lire aussi
        </h2>
        <p className="text-sm text-gray-500">
          Tous les articles{" "}
          <Link href={categoryHref} className="text-[#5a50ff] hover:underline">
            {catLabel}
          </Link>
          {sectorHref && sectorLabel && (
            <>
              {" · "}
              <Link
                href={sectorHref}
                className="text-[#5a50ff] hover:underline"
              >
                {sectorLabel}
              </Link>
            </>
          )}
        </p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="group block h-full rounded-lg border border-gray-200 bg-white p-4 hover:border-[#5a50ff] transition-colors"
            >
              <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-2">
                {categoryLabel(post.category)}
                {post.sector ? ` · ${post.sector}` : ""}
              </p>
              <p className="text-sm font-medium text-gray-900 group-hover:text-[#5a50ff] transition-colors leading-snug">
                {post.title}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                {formatDateFr(post.publishDate || post.date)} · {post.readTime}{" "}
                min
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
