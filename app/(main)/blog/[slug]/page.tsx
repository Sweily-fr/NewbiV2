import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Badge } from "@/src/components/ui/badge";
import { Calendar } from "lucide-react";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import { BlogArticleLayout } from "@/src/components/blog/blog-article-layout";
import {
  getPostBySlug,
  generateStaticParams as getStaticParams,
} from "@/src/lib/blog";
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
    authors: [{ name: "Holany" }],
    alternates: {
      canonical: `https://newbi.fr/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.publishDate || post.date,
      authors: ["Holany"],
      images: post.image
        ? [{ url: post.image, width: 1200, height: 630 }]
        : [],
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <NewHeroNavbar solidBackground />

      <BlogArticleLayout title={post.title} slug={post.slug}>
        <article className="max-w-3xl">
          {/* Author + Metadata row */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full overflow-hidden">
                <Image
                  src="/lp/about/about-11.jpeg"
                  alt="Holany"
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                />
              </div>
              <div>
                <p className="text-sm font-medium tracking-tight">Holany</p>
                <p className="text-xs text-gray-400">Newbi</p>
              </div>
            </div>
            <span className="hidden sm:block w-px h-6 bg-gray-200" />
            <Badge
              variant="secondary"
              className="bg-[#5a50ff]/10 text-[#5a50ff] border-[#5a50ff]/20 hover:bg-[#5a50ff]/20 uppercase text-xs"
            >
              {post.category}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <time>{publishedDate}</time>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{post.readTime} min de lecture</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-gray-900 mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Separator */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-10" />

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
              Voir tous les articles
            </Link>
          </div>
        </article>
      </BlogArticleLayout>
    </div>
  );
}
