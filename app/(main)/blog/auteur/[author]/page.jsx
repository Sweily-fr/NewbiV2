import { notFound } from "next/navigation";
import Image from "next/image";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import Footer7 from "@/src/components/footer7";
import { BlogRecentArticles } from "@/src/components/blog/blog-recent-articles";
import { formatPostForList } from "@/src/lib/blog-format";
import { getAllPosts } from "@/src/lib/blog";
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
    <div className="min-h-screen pt-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NewHeroNavbar />
      <header className="px-5 mt-10 md:mt-16">
        <div className="mx-auto max-w-[1200px] flex items-center gap-5">
          {profile.image && (
            <div className="size-16 rounded-full overflow-hidden shrink-0">
              <Image
                src={profile.image}
                alt={profile.name}
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            </div>
          )}
          <div>
            <p className="text-xs uppercase tracking-wide text-[#5a50ff] mb-1">
              {profile.role}
            </p>
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-gray-900">
              {profile.name}
            </h1>
            <p className="mt-2 max-w-2xl text-gray-600">{profile.bio}</p>
          </div>
        </div>
      </header>
      <BlogRecentArticles
        posts={posts.map(formatPostForList)}
        title={`${posts.length} article${posts.length > 1 ? "s" : ""}`}
        description={`Tous les articles signés ${profile.name}, du plus récent au plus ancien.`}
      />
      <Footer7 />
    </div>
  );
}
