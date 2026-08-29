import { categoryLabel, type BlogPostMeta } from "@/src/lib/blog";
import { getAuthor } from "@/src/lib/blog-authors";

export function formatDateFr(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Forme attendue par les composants de liste du blog (cartes, slider). */
export function formatPostForList(post: BlogPostMeta) {
  return {
    slug: post.slug,
    title: post.title,
    description: post.description,
    category: post.category,
    categoryLabel: categoryLabel(post.category),
    readTime: post.readTime,
    author: getAuthor(post.author).name,
    image: post.image,
    url: `/blog/${post.slug}`,
    publishDate: formatDateFr(post.publishDate || post.date),
  };
}
