"use client";
import { useQuery } from "@apollo/client";
import { LoaderCircle } from "lucide-react";
import { BlogGrid } from "@/src/components/blog-grid";
import { GET_ALL_BLOG_POSTS } from "@/src/graphql/queries/blog";

export default function BlogPage() {
  const { data, loading, error } = useQuery(GET_ALL_BLOG_POSTS, {
    variables: { limit: 20, offset: 0 },
  });

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="h-6 w-6 text-gray-400 mx-auto mb-3 animate-spin" strokeWidth={2} />
          <p className="text-sm text-gray-500">Chargement des articles...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.getAllBlogPosts?.success) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">
            Erreur lors du chargement des articles
          </p>
        </div>
      </div>
    );
  }

  // Transformer les données pour le composant BlogGrid
  const postsForGrid = data.getAllBlogPosts.posts.map((post) => ({
    id: post.slug,
    title: post.title,
    summary: post.summary,
    label: post.category,
    author: post.author,
    published: new Date(parseInt(post.publishedAt)).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    url: `/blog/${post.slug}`,
    image: post.image,
  }));

  return (
    <div className="min-h-screen pt-32 pb-20">
      <BlogGrid posts={postsForGrid} />
    </div>
  );
}
