import { notFound } from "next/navigation";
import { BlogNowHub } from "@/src/components/blog/now-hub";
import { formatPostForList } from "@/src/lib/blog-format";
import { getCategories, getSectors, getSectorBySlug } from "@/src/lib/blog";
import { SITE_URL } from "@/src/lib/site";

export function generateStaticParams() {
  return getSectors().map((s) => ({ sector: s.slug }));
}

function describe(label, count) {
  return `${count} article${count > 1 ? "s" : ""} pour ${label.toLowerCase()} : facturation, devis, obligations et outils adaptés à votre activité.`;
}

export async function generateMetadata({ params }) {
  const { sector } = await params;
  const data = getSectorBySlug(sector);
  if (!data) return { title: "Secteur introuvable" };
  return {
    title: `Facturation et gestion pour ${data.label} | Blog Newbi`,
    description: describe(data.label, data.posts.length),
    alternates: { canonical: `/blog/secteur/${sector}` },
  };
}

export default async function SectorPage({ params }) {
  const { sector } = await params;
  const data = getSectorBySlug(sector);
  if (!data) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${data.label} - Blog Newbi`,
    url: `${SITE_URL}/blog/secteur/${sector}`,
    description: describe(data.label, data.posts.length),
    isPartOf: { "@type": "WebSite", name: "Newbi", url: SITE_URL },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: data.posts.map((p, i) => ({
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
      categorieActive={false}
      posts={data.posts.map(formatPostForList)}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </BlogNowHub>
  );
}
