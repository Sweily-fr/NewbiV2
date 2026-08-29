import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import Footer7 from "@/src/components/footer7";
import { BlogHeroSlider } from "@/src/components/blog/blog-hero-slider";
import { BlogRecentArticles } from "@/src/components/blog/blog-recent-articles";
import { BlogHubNav } from "@/src/components/blog/blog-hub-nav";
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
  const posts = getAllPosts();
  const allPosts = posts.map(formatPostForList);

  const heroSliderPosts = allPosts.slice(0, 2);
  const recentPosts = allPosts.slice(2);
  const lastUpdate = allPosts.length > 0 ? allPosts[0].publishDate : "";

  return (
    <div className="min-h-screen pt-32">
      <NewHeroNavbar />
      <BlogHeroSlider posts={heroSliderPosts} />
      <BlogHubNav categories={getCategories()} sectors={getSectors()} />
      {recentPosts.length > 0 && (
        <BlogRecentArticles posts={recentPosts} lastUpdate={lastUpdate} />
      )}
      <Footer7 />
    </div>
  );
}
