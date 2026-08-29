import { notFound } from "next/navigation";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import Footer7 from "@/src/components/footer7";
import { BlogRecentArticles } from "@/src/components/blog/blog-recent-articles";
import { BlogHubNav } from "@/src/components/blog/blog-hub-nav";
import { formatPostForList } from "@/src/lib/blog-format";
import {
  getCategories,
  getPostsByCategory,
  getSectors,
  categoryLabel,
  CATEGORY_DESCRIPTIONS,
} from "@/src/lib/blog";
import { SITE_URL } from "@/src/lib/site";

export function generateStaticParams() {
  return getCategories().map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }) {
  const { category } = await params;
  const posts = getPostsByCategory(category);
  if (posts.length === 0) return { title: "Catégorie introuvable" };
  const label = categoryLabel(category);
  return {
    title: `${label} : ${posts.length} articles | Blog Newbi`,
    description:
      CATEGORY_DESCRIPTIONS[category] ??
      `Tous les articles du blog Newbi dans la catégorie ${label}.`,
    alternates: { canonical: `/blog/categorie/${category}` },
  };
}

export default async function CategoryPage({ params }) {
  const { category } = await params;
  const posts = getPostsByCategory(category);
  if (posts.length === 0) notFound();

  const label = categoryLabel(category);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${label} - Blog Newbi`,
    url: `${SITE_URL}/blog/categorie/${category}`,
    description: CATEGORY_DESCRIPTIONS[category],
    isPartOf: { "@type": "WebSite", name: "Newbi", url: SITE_URL },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/blog/${p.slug}`,
        name: p.title,
      })),
    },
  };

  return (
    <div className="min-h-screen pt-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NewHeroNavbar />
      <header className="px-5 mt-10 md:mt-16">
        <div className="mx-auto max-w-[1200px]">
          <p className="text-xs uppercase tracking-wide text-[#5a50ff] mb-3">
            Thème
          </p>
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-gray-900">
            {label}
          </h1>
          {CATEGORY_DESCRIPTIONS[category] && (
            <p className="mt-4 max-w-2xl text-gray-600">
              {CATEGORY_DESCRIPTIONS[category]}
            </p>
          )}
        </div>
      </header>
      <BlogHubNav
        categories={getCategories()}
        sectors={getSectors()}
        current={label}
      />
      <BlogRecentArticles
        posts={posts.map(formatPostForList)}
        title={`${posts.length} article${posts.length > 1 ? "s" : ""}`}
        description={`Tous nos contenus « ${label} », du plus récent au plus ancien.`}
      />
      <Footer7 />
    </div>
  );
}
