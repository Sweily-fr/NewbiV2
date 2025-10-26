"use client";
import { useQuery } from "@apollo/client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/src/components/ui/badge";
import { GET_BLOG_POST_BY_SLUG } from "@/src/graphql/queries/blog";
import { Calendar, User, ArrowLeft, FileText, LoaderCircle } from "lucide-react";
import { BlogContent } from "@/src/components/blog/BlogContent";

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data, loading, error } = useQuery(GET_BLOG_POST_BY_SLUG, {
    variables: { slug },
    skip: !slug,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-28 flex items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="h-6 w-6 text-gray-400 mx-auto mb-3 animate-spin" strokeWidth={2} />
          <p className="text-sm text-gray-500">Chargement de l'article...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.getBlogPostBySlug?.success || !data?.getBlogPostBySlug?.post) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-28 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Article non trouvé</p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-[#5a50ff] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux articles
          </Link>
        </div>
      </div>
    );
  }

  const post = data.getBlogPostBySlug.post;
  const publishedDate = new Date(parseInt(post.publishedAt)).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-28">
      <article className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Lien de retour */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#5a50ff] transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux articles
        </Link>
        {/* Image placeholder avec icône */}
        <div className="mb-12 rounded-2xl border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-white p-16 flex items-center justify-center">
          <FileText className="h-24 w-24 text-gray-300" strokeWidth={1} />
        </div>

        {/* Métadonnées */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <Badge
            variant="secondary"
            className="bg-[#5a50ff]/10 text-[#5a50ff] border-[#5a50ff]/20 hover:bg-[#5a50ff]/20"
          >
            {post.category}
          </Badge>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <time>{publishedDate}</time>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <User className="h-4 w-4" />
            <span>{post.author}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{post.readTime} min de lecture</span>
          </div>
        </div>

        {/* Titre */}
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-gray-900 mb-8 leading-tight">
          {post.title}
        </h1>

        {/* Séparateur subtil */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-12" />

        {/* Contenu avec style épuré */}
        <BlogContent content={post.content} />

        {/* Footer avec séparateur */}
        <div className="mt-16 pt-8 border-t border-gray-100">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-[#5a50ff] hover:gap-3 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Voir tous les articles
          </Link>
        </div>
      </article>
    </div>
  );
}
