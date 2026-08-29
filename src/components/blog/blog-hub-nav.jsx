import Link from "next/link";

function Chip({ href, children, count }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:border-[#5a50ff] hover:text-[#5a50ff] transition-colors"
    >
      {children}
      {typeof count === "number" && (
        <span className="text-gray-400">{count}</span>
      )}
    </Link>
  );
}

/**
 * Liens vers les pages hub du blog. Rendu côté serveur pour que Google suive
 * les liens vers /blog/categorie/* et /blog/secteur/* depuis la liste.
 */
export function BlogHubNav({ categories = [], sectors = [], current }) {
  if (!categories.length && !sectors.length) return null;
  return (
    <nav aria-label="Explorer le blog" className="px-5 mt-16 md:mt-28 mb-4">
      <div className="mx-auto max-w-[1200px] flex flex-col gap-4">
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-gray-400 mr-1">
              Thèmes
            </span>
            {categories.map((c) => (
              <Chip
                key={c.slug}
                href={`/blog/categorie/${c.slug}`}
                count={c.count}
              >
                {c.label}
              </Chip>
            ))}
          </div>
        )}
        {sectors.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-gray-400 mr-1">
              Métiers
            </span>
            {sectors.map((s) => (
              <Chip
                key={s.slug}
                href={`/blog/secteur/${s.slug}`}
                count={s.count}
              >
                {s.label}
              </Chip>
            ))}
          </div>
        )}
        {current && (
          <p className="text-xs text-gray-400">
            Vous consultez :{" "}
            <strong className="text-gray-600">{current}</strong>
            {" · "}
            <Link href="/blog" className="text-[#5a50ff] hover:underline">
              Tous les articles
            </Link>
          </p>
        )}
      </div>
    </nav>
  );
}
