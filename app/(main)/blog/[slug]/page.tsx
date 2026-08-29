import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Badge } from "@/src/components/ui/badge";
import { Calendar } from "lucide-react";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import Footer7 from "@/src/components/footer7";
import { BlogArticleLayout } from "@/src/components/blog/blog-article-layout";
import { BlogRelatedPosts } from "@/src/components/blog/blog-related-posts";
import {
  getPostBySlug,
  getRelatedPosts,
  extractFaq,
  categoryLabel,
  slugify,
  generateStaticParams as getStaticParams,
} from "@/src/lib/blog";
import { formatDateFr } from "@/src/lib/blog-format";
import { getAuthor, authorSlug } from "@/src/lib/blog-authors";
import { SITE_URL, absoluteUrl } from "@/src/lib/site";
import { getMDXComponents } from "@/src/components/blog/mdx-components";

export { getStaticParams as generateStaticParams };

/** Visuel de partage utilisé quand l'article n'a pas (encore) d'illustration. */
const DEFAULT_OG_IMAGE = "/images/op-newbi.png";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Article non trouvé" };

  const author = getAuthor(post.author);
  const published = post.publishDate || post.date;
  const ogImage = post.image || DEFAULT_OG_IMAGE;

  return {
    title: `${post.title} | Blog Newbi`,
    description: post.description,
    authors: [
      { name: author.name, url: `/blog/auteur/${authorSlug(post.author)}` },
    ],
    alternates: {
      // Chemin relatif : résolu par metadataBase (www.newbi.fr) pour que le
      // canonical soit toujours l'URL réellement servie.
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: `/blog/${post.slug}`,
      siteName: "Newbi",
      locale: "fr_FR",
      publishedTime: published,
      modifiedTime: post.updated || published,
      authors: [author.name],
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [ogImage],
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

  const author = getAuthor(post.author);
  const authorHref = `/blog/auteur/${authorSlug(post.author)}`;
  const published = post.publishDate || post.date;
  const modified = post.updated || published;
  const publishedDate = formatDateFr(published);
  const related = getRelatedPosts(post.slug, 4);
  const faq = extractFaq(post.content);
  const articleUrl = `${SITE_URL}/blog/${post.slug}`;
  const categoryHref = `/blog/categorie/${post.category}`;
  const sectorHref = post.sector
    ? `/blog/secteur/${slugify(post.sector)}`
    : null;

  const breadcrumb = [
    { name: "Accueil", url: SITE_URL },
    { name: "Blog", url: `${SITE_URL}/blog` },
    ...(post.category
      ? [
          {
            name: categoryLabel(post.category),
            url: `${SITE_URL}${categoryHref}`,
          },
        ]
      : []),
    { name: post.title, url: articleUrl },
  ];

  const jsonLd: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "@id": `${articleUrl}#article`,
      mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
      headline: post.title,
      description: post.description,
      image: post.image ? [absoluteUrl(post.image)] : undefined,
      datePublished: published,
      dateModified: modified,
      inLanguage: "fr-FR",
      keywords: post.keyword || undefined,
      articleSection: categoryLabel(post.category),
      wordCount: post.content.replace(/<[^>]*>/g, "").split(/\s+/).length,
      author: {
        "@type": "Person",
        name: author.name,
        jobTitle: author.role,
        url: `${SITE_URL}${authorHref}`,
      },
      publisher: {
        "@type": "Organization",
        name: "Newbi",
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/newbi.svg` },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumb.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        item: item.url,
      })),
    },
  ];

  if (faq.length > 0) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Données structurées rendues côté serveur (lisibles sans exécuter le JS) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NewHeroNavbar solidBackground />

      <BlogArticleLayout title={post.title} slug={post.slug}>
        <article className="max-w-3xl">
          {/* Author + Metadata row */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <Link href={authorHref} className="flex items-center gap-3 group">
              {author.image && (
                <div className="size-10 rounded-full overflow-hidden">
                  <Image
                    src={author.image}
                    alt={author.name}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
              <div>
                <p className="text-sm font-medium tracking-tight group-hover:text-[#5a50ff] transition-colors">
                  {author.name}
                </p>
                <p className="text-xs text-gray-400">{author.role}</p>
              </div>
            </Link>
            <span className="hidden sm:block w-px h-6 bg-gray-200" />
            <Link href={categoryHref}>
              <Badge
                variant="secondary"
                className="bg-[#5a50ff]/10 text-[#5a50ff] border-[#5a50ff]/20 hover:bg-[#5a50ff]/20 uppercase text-xs"
              >
                {categoryLabel(post.category)}
              </Badge>
            </Link>
            {sectorHref && (
              <Link href={sectorHref}>
                <Badge
                  variant="outline"
                  className="uppercase text-xs text-gray-600 hover:border-[#5a50ff] hover:text-[#5a50ff]"
                >
                  {post.sector}
                </Badge>
              </Link>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <time dateTime={published}>{publishedDate}</time>
              {post.updated && (
                <span className="text-gray-400">
                  {" · mis à jour le "}
                  <time dateTime={post.updated}>
                    {formatDateFr(post.updated)}
                  </time>
                </span>
              )}
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

          {/* Articles liés */}
          <BlogRelatedPosts
            posts={related}
            categoryHref={categoryHref}
            categoryLabel={categoryLabel(post.category)}
            sectorHref={sectorHref}
            sectorLabel={post.sector}
          />

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-100">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-[#5a50ff] hover:gap-3 transition-all"
            >
              Voir tous les articles
            </Link>
          </div>
        </article>
      </BlogArticleLayout>
      <Footer7 />
    </div>
  );
}
