import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import { BlogHeroSlider } from "@/src/components/blog/blog-hero-slider";
import { BlogRecentArticles } from "@/src/components/blog/blog-recent-articles";
import { getAllPosts } from "@/src/lib/blog";

export const metadata = {
  title: "Blog Newbi - Guides et conseils pour entrepreneurs et freelances",
  description:
    "Découvrez nos articles sur la facturation, la gestion d'entreprise, la comptabilité et les outils pour freelances et auto-entrepreneurs.",
  alternates: {
    canonical: "https://newbi.fr/blog",
  },
};

export default function BlogPage() {
  const posts = getAllPosts();

  const allPosts = posts.map((post) => ({
    slug: post.slug,
    title: post.title,
    description: post.description,
    category: post.category,
    readTime: post.readTime,
    author: post.author,
    image: post.image,
    url: `/blog/${post.slug}`,
    publishDate: new Date(post.publishDate || post.date).toLocaleDateString(
      "fr-FR",
      { day: "numeric", month: "long", year: "numeric" }
    ),
  }));

  const heroSliderPosts = allPosts.slice(0, 2);
  const recentPosts = allPosts.slice(2);
  const lastUpdate = allPosts.length > 0 ? allPosts[0].publishDate : "";

  return (
    <div className="min-h-screen pt-32">
      <NewHeroNavbar />
      <BlogHeroSlider posts={heroSliderPosts} />
      {recentPosts.length > 0 && (
        <BlogRecentArticles
          posts={recentPosts}
          lastUpdate={lastUpdate}
          hasMore={posts.length > 4}
        />
      )}
    </div>
  );
}
