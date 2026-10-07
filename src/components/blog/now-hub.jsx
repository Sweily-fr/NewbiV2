import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import { BlogNowHero } from "./now-hero";
import { BlogNowArchive } from "./now-archive";
import { CONTENEUR, GrilleArticles, indexDeRecherche } from "./now-shared";

/* Gabarit commun aux pages hub du blog (thème, métier, auteur) : le même
   en-tête que l'index, une grille de cartes puis la liste d'archive.
   Comme sur l'index, les cartes montrent les articles les plus récents. */
export function BlogNowHub({
  categories = [],
  categorieActive,
  sectors = [],
  index = [],
  posts,
  titreArchive = "Tous les articles",
  children,
}) {
  const vedettes = posts.slice(0, 6);
  const reste = posts.slice(6);

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-32">
      {children}
      <NewHeroNavbar />
      <BlogNowHero
        categories={categories}
        categorieActive={categorieActive}
        sectors={sectors}
        index={index.length > 0 ? index : indexDeRecherche(posts)}
      />

      {vedettes.length > 0 && (
        <section className={`${CONTENEUR} pt-14 md:pt-16`}>
          <h2 className="sr-only">Articles en avant</h2>
          <GrilleArticles posts={vedettes} priorite />
        </section>
      )}

      {reste.length > 0 && (
        <BlogNowArchive
          posts={reste}
          titre={
            vedettes.length > 0
              ? titreArchive
              : `${posts.length} article${posts.length > 1 ? "s" : ""}`
          }
        />
      )}
    </div>
  );
}
