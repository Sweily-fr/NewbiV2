import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  sector: string | null;
  keyword: string;
  author: string;
  image: string;
  published: boolean;
  publishDate: string | null;
  readTime: number;
  content: string;
}

export interface BlogPostMeta
  extends Omit<BlogPost, "content"> {}

function calculateReadTime(content: string): number {
  const words = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

function stripImports(content: string): string {
  return content
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("import "))
    .join("\n");
}

function parsePost(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  const strippedContent = stripImports(content);

  return {
    slug,
    title: data.title ?? "",
    description: data.description ?? "",
    date: data.date ?? "",
    category: data.category ?? "",
    sector: data.sector ?? null,
    keyword: data.keyword ?? "",
    author: data.author ?? "Newbi",
    image: data.image ?? "",
    published: data.published === true,
    publishDate: data.publishDate ?? null,
    readTime: calculateReadTime(strippedContent),
    content: strippedContent,
  };
}

export function getAllPosts(): BlogPostMeta[] {
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"));

  const posts: BlogPostMeta[] = [];

  for (const file of files) {
    const slug = file.replace(/\.mdx$/, "");
    const post = parsePost(slug);
    if (post && post.published) {
      const { content, ...meta } = post;
      posts.push(meta);
    }
  }

  posts.sort((a, b) => {
    const da = a.publishDate || a.date;
    const db = b.publishDate || b.date;
    return new Date(db).getTime() - new Date(da).getTime();
  });

  return posts;
}

export function getPostBySlug(slug: string): BlogPost | null {
  const post = parsePost(slug);
  if (!post || !post.published) return null;
  return post;
}

export function getAllPublishedSlugs(): string[] {
  return getAllPosts().map((p) => p.slug);
}

export function generateStaticParams() {
  return getAllPublishedSlugs().map((slug) => ({ slug }));
}
