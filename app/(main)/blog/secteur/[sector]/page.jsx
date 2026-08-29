import { notFound } from "next/navigation";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import Footer7 from "@/src/components/footer7";
import { BlogRecentArticles } from "@/src/components/blog/blog-recent-articles";
import { BlogHubNav } from "@/src/components/blog/blog-hub-nav";
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
    <div className="min-h-screen pt-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NewHeroNavbar />
      <header className="px-5 mt-10 md:mt-16">
        <div className="mx-auto max-w-[1200px]">
          <p className="text-xs uppercase tracking-wide text-[#5a50ff] mb-3">
            Métier
          </p>
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-gray-900">
            {data.label}
          </h1>
          <p className="mt-4 max-w-2xl text-gray-600">
            {describe(data.label, data.posts.length)}
          </p>
        </div>
      </header>
      <BlogHubNav
        categories={getCategories()}
        sectors={getSectors()}
        current={data.label}
      />
      <BlogRecentArticles
        posts={data.posts.map(formatPostForList)}
        title={`${data.posts.length} article${data.posts.length > 1 ? "s" : ""}`}
        description={`Nos guides et conseils pour ${data.label.toLowerCase()}, du plus récent au plus ancien.`}
      />
      <Footer7 />
    </div>
  );
}
