import Link from "next/link";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import { BlogNowHero } from "@/src/components/blog/now-hero";
import {
  CONTENEUR,
  GrilleArticles,
  indexDeRecherche,
} from "@/src/components/blog/now-shared";
import { getAllPosts, getCategories, getSectors } from "@/src/lib/blog";
import { formatPostForList } from "@/src/lib/blog-format";

// Une page de résultats n'a pas vocation à être indexée.
export const metadata = {
  title: "Rechercher un article - Blog Newbi",
  robots: { index: false, follow: true },
};

/** Normalise pour comparer sans accents ni casse. */
function sansAccents(valeur) {
  return valeur.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Recherche plein texte simple sur le titre, le chapô et le thème. */
function filtrer(posts, q) {
  const termes = sansAccents(q).split(/\s+/).filter(Boolean);
  if (!termes.length) return [];
  return posts.filter((p) => {
    const foin = sansAccents(`${p.title} ${p.description} ${p.categoryLabel}`);
    return termes.every((t) => foin.includes(t));
  });
}

export default async function BlogRecherchePage({ searchParams }) {
  const params = await searchParams;
  const q = (params?.q ?? "").toString().trim();

  const tous = getAllPosts().map(formatPostForList);
  const resultats = q ? filtrer(tous, q) : [];

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-32">
      <NewHeroNavbar />
      <BlogNowHero
        categories={getCategories()}
        sectors={getSectors()}
        index={indexDeRecherche(tous)}
        q={q}
      />

      <section className={`${CONTENEUR} pt-14 md:pt-16`}>
        <p className="mb-10 text-[15px] text-gray-500">
          {!q ? (
            "Saisissez un mot-clé pour chercher dans le blog."
          ) : (
            <>
              {resultats.length === 0
                ? "Aucun article ne correspond à "
                : `${resultats.length} article${resultats.length > 1 ? "s" : ""} pour `}
              <span className="text-gray-950">«&nbsp;{q}&nbsp;»</span>
            </>
          )}
        </p>

        {resultats.length > 0 ? (
          <GrilleArticles posts={resultats} priorite />
        ) : (
          <Link
            href="/blog"
            className="inline-flex h-9 items-center rounded-full bg-[#F4F4F6] px-4 text-[15px] text-gray-700 transition-colors hover:bg-[#ECECEE] hover:text-gray-950"
          >
            Voir tous les articles
          </Link>
        )}
      </section>
    </div>
  );
}
