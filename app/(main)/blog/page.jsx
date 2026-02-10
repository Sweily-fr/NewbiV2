import { BlogGrid } from "@/src/components/blog-grid";
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

  const postsForGrid = posts.map((post) => ({
    id: post.slug,
    title: post.title,
    summary: post.description,
    label: post.category,
    author: post.author,
    published: new Date(post.publishDate || post.date).toLocaleDateString(
      "fr-FR",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    ),
    url: `/blog/${post.slug}`,
    image: post.image,
  }));

  return (
    <div className="min-h-screen pt-32 pb-20">
      <BlogGrid posts={postsForGrid} />
    </div>
  );
}
