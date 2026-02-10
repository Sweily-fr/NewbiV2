import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Badge } from "@/src/components/ui/badge";
import { Calendar, User, ArrowLeft } from "lucide-react";
import { getPostBySlug, generateStaticParams as getStaticParams } from "@/src/lib/blog";
import { getMDXComponents } from "@/src/components/blog/mdx-components";

export { getStaticParams as generateStaticParams };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Article non trouvé" };

  return {
    title: `${post.title} | Blog Newbi`,
    description: post.description,
    keywords: post.keyword,
    authors: [{ name: post.author }],
    alternates: {
      canonical: `https://newbi.fr/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.publishDate || post.date,
      authors: [post.author],
      images: post.image ? [{ url: post.image, width: 1200, height: 630 }] : [],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  const publishedDate = new Date(
    post.publishDate || post.date
  ).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-28">
      <article className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#5a50ff] transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux articles
        </Link>

        {/* Metadata */}
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

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-gray-900 mb-8 leading-tight">
          {post.title}
        </h1>

        {/* Separator */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-12" />

        {/* MDX Content */}
        <div className="blog-content">
          <MDXRemote source={post.content} components={getMDXComponents()} />
        </div>

        {/* Footer */}
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
