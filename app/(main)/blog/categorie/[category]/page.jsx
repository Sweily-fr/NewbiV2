import { notFound } from "next/navigation";
import { BlogNowHub } from "@/src/components/blog/now-hub";
import { formatPostForList } from "@/src/lib/blog-format";
import {
  getCategories,
  getPostsByCategory,
  categoryLabel,
  CATEGORY_DESCRIPTIONS,
  getSectors,
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
    <BlogNowHub
      categories={getCategories()}
      sectors={getSectors()}
      categorieActive={category}
      posts={posts.map(formatPostForList)}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </BlogNowHub>
  );
}
