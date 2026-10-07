import Link from "next/link";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import { BlogNowHero } from "@/src/components/blog/now-hero";
import { BlogNowTimeline } from "@/src/components/blog/now-timeline";
import { BlogNowArchive } from "@/src/components/blog/now-archive";
import {
  CONTENEUR,
  GrilleArticles,
  TITRE_SECTION,
  indexDeRecherche,
} from "@/src/components/blog/now-shared";
import { getAllPosts, getCategories, getSectors } from "@/src/lib/blog";
import { formatPostForList } from "@/src/lib/blog-format";

export const metadata = {
  title: "Blog Newbi - Guides et conseils pour entrepreneurs et freelances",
  description:
    "Découvrez nos articles sur la facturation, la gestion d'entreprise, la comptabilité et les outils pour freelances et auto-entrepreneurs.",
  alternates: {
    canonical: "/blog",
  },
};

export default function BlogPage() {
  const tous = getAllPosts().map(formatPostForList);
  const categories = getCategories();
  const sectors = getSectors();

  // Même découpage que la page « Now » de Linear : une première grille de
  // cartes, une frise datée, une seconde grille, puis l'archive.
  // Les deux grilles montrent les douze articles les plus récents, dans
  // l'ordre de publication ; la frise prend les articles réglementaires
  // suivants, pour ne jamais répéter une carte déjà affichée.
  const vedettes = tous.slice(0, 6);
  const suite = tous.slice(6, 12);
  const enGrille = new Set([...vedettes, ...suite].map((p) => p.slug));
  const frise = tous
    .filter((p) => p.category === "reglementaire" && !enGrille.has(p.slug))
    .slice(0, 4);
  const dejaVus = new Set([...enGrille, ...frise.map((p) => p.slug)]);
  const archive = tous.filter((p) => !dejaVus.has(p.slug));

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-32">
      <NewHeroNavbar />
      <BlogNowHero
        categories={categories}
        sectors={sectors}
        index={indexDeRecherche(tous)}
      />

      <section className={`${CONTENEUR} pt-14 md:pt-16`}>
        <h2 className="sr-only">Derniers articles</h2>
        <GrilleArticles posts={vedettes} priorite />
      </section>

      <BlogNowTimeline
        titre="Réglementaire"
        posts={frise}
        href="/blog/categorie/reglementaire"
      />

      <section className={`${CONTENEUR} pt-24 md:pt-32`}>
        <h2 className="sr-only">Autres articles</h2>
        <GrilleArticles posts={suite} />
      </section>

      <BlogNowArchive posts={archive} />

      {/* Liens vers les pages métier : ils ne figurent pas chez Linear, mais
          ce sont les seules entrées vers /blog/secteur/* depuis la liste. */}
      {sectors.length > 0 && (
        <section className={`${CONTENEUR} pt-24 md:pt-32`}>
          <h2 className={TITRE_SECTION}>Par métier</h2>
          <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 md:mt-12">
            {sectors.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/blog/secteur/${s.slug}`}
                  className="text-[15px] text-gray-600 transition-colors hover:text-gray-950"
                >
                  {s.label}
                  <span className="ml-1.5 text-gray-400">{s.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
