import { notFound } from "next/navigation";
import { BlogNowHub } from "@/src/components/blog/now-hub";
import { formatPostForList } from "@/src/lib/blog-format";
import { getAllPosts, getCategories, getSectors } from "@/src/lib/blog";
import { authorSlug, getAuthor } from "@/src/lib/blog-authors";
import { SITE_URL } from "@/src/lib/site";

export function generateStaticParams() {
  const slugs = new Set(getAllPosts().map((p) => authorSlug(p.author)));
  return [...slugs].map((author) => ({ author }));
}

export async function generateMetadata({ params }) {
  const { author } = await params;
  const posts = getAllPosts().filter((p) => authorSlug(p.author) === author);
  if (posts.length === 0) return { title: "Auteur introuvable" };
  const profile = getAuthor(posts[0].author);
  return {
    title: `${profile.name} : ${posts.length} articles | Blog Newbi`,
    description: profile.bio,
    alternates: { canonical: `/blog/auteur/${author}` },
  };
}

export default async function AuthorPage({ params }) {
  const { author } = await params;
  const posts = getAllPosts().filter((p) => authorSlug(p.author) === author);
  if (posts.length === 0) notFound();
  const profile = getAuthor(posts[0].author);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: `${SITE_URL}/blog/auteur/${author}`,
    mainEntity: {
      "@type": "Person",
      name: profile.name,
      jobTitle: profile.role,
      description: profile.bio,
      image: profile.image ? `${SITE_URL}${profile.image}` : undefined,
      worksFor: { "@type": "Organization", name: "Newbi", url: SITE_URL },
    },
  };

  return (
    <BlogNowHub
      categories={getCategories()}
      sectors={getSectors()}
      categorieActive={false}
      posts={posts.map(formatPostForList)}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </BlogNowHub>
  );
}
