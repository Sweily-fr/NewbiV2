import Link from "next/link";
import { CONTENEUR, TITRE_SECTION, dateFrise } from "./now-shared";

/* Frise reprise du bloc « Changelog » de Linear : une ligne horizontale
   ponctuée de pastilles, et sous chacune un article court daté.
   Quatre colonnes de 272 px espacées de 64 px. */
export function BlogNowTimeline({
  titre,
  posts,
  href,
  lienLabel = "Voir tout",
}) {
  if (!posts.length) return null;

  return (
    <section className={`${CONTENEUR} pt-24 md:pt-32`}>
      <h2 className={TITRE_SECTION}>{titre}</h2>

      <div className="relative mt-12 md:mt-14">
        {/* La ligne passe derrière les pastilles, qui portent un liseré blanc */}
        <div
          aria-hidden="true"
          className="absolute left-0 right-0 top-1 hidden h-px bg-gray-200 lg:block"
        />
        <ul className="grid grid-cols-1 gap-x-16 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {posts.map((post, i) => (
            <li key={post.slug} className="relative flex flex-col">
              <span
                aria-hidden="true"
                className={`relative z-10 hidden size-[9px] rounded-full ring-4 ring-white lg:block ${
                  i === 0 ? "bg-[#5A50FF]" : "bg-gray-300"
                }`}
              />
              <Link
                href={post.url}
                className="group flex flex-1 flex-col lg:mt-7"
              >
                <h3 className="text-[15px] font-medium leading-snug text-gray-950 transition-colors group-hover:text-[#5A50FF]">
                  {post.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-[14px] leading-6 text-gray-600">
                  {post.description}
                </p>
                <p className="mt-4 pt-1 font-mono text-[11px] uppercase tracking-[0.08em] text-gray-400 lg:mt-auto">
                  {dateFrise(post.dateIso)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {href && (
        <Link
          href={href}
          className="group mt-12 inline-flex items-center gap-1.5 text-[15px] text-gray-600 transition-colors hover:text-gray-950"
        >
          {lienLabel}
          <span
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:translate-x-1"
          >
            →
          </span>
        </Link>
      )}
    </section>
  );
}
