import fs from "fs";
import path from "path";
import { getAllPosts, getCategories, getSectors } from "@/src/lib/blog";
import { authorSlug } from "@/src/lib/blog-authors";
import { SITE_URL } from "@/src/lib/site";

/**
 * Sitemap dynamique pour www.newbi.fr
 * Accessible sur : https://www.newbi.fr/sitemap.xml
 *
 * Les pages produits sont lues depuis app/produits/ pour que le sitemap ne
 * liste jamais une page supprimée (ex. /produits/devis, redirigée) et
 * n'oublie jamais une page ajoutée.
 */

function listProductPages() {
  const dir = path.join(process.cwd(), "app", "produits");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => {
      if (!entry.isDirectory()) return false;
      const page = path.join(dir, entry.name, "page.jsx");
      if (!fs.existsSync(page)) return false;
      // Page supprimée qui ne fait que rediriger (ex. synchronisation-bancaire)
      return !/^\s*redirect\(/m.test(fs.readFileSync(page, "utf-8"));
    })
    .map((entry) => `/produits/${entry.name}`)
    .sort();
}

export default function sitemap() {
  const baseUrl = SITE_URL;
  const posts = getAllPosts();
  const latestPostDate = posts[0]
    ? new Date(posts[0].updated || posts[0].publishDate || posts[0].date)
    : undefined;

  // Pages statiques : pas de lastModified inventé (Google ignore les dates
  // qui changent à chaque build), sauf pour les listes qui bougent avec le blog.
  const staticPages = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    ...listProductPages().map((p) => ({
      url: `${baseUrl}${p}`,
      changeFrequency: "weekly",
      priority: 0.9,
    })),
    {
      url: `${baseUrl}/guide-facturation-electronique`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: latestPostDate,
      changeFrequency: "daily",
      priority: 0.8,
    },
    { url: `${baseUrl}/faq`, changeFrequency: "monthly", priority: 0.6 },
    {
      url: `${baseUrl}/qui-sommes-nous`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    { url: `${baseUrl}/contact`, changeFrequency: "monthly", priority: 0.5 },
    {
      url: `${baseUrl}/mentions-legales`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/politique-de-confidentialite`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    { url: `${baseUrl}/cgv`, changeFrequency: "yearly", priority: 0.3 },
    {
      url: `${baseUrl}/supprimer-compte`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const hubPages = [
    ...getCategories().map((c) => ({
      url: `${baseUrl}/blog/categorie/${c.slug}`,
      lastModified: latestPostDate,
      changeFrequency: "weekly",
      priority: 0.7,
    })),
    ...getSectors().map((s) => ({
      url: `${baseUrl}/blog/secteur/${s.slug}`,
      lastModified: latestPostDate,
      changeFrequency: "weekly",
      priority: 0.7,
    })),
  ];

  const authors = [...new Set(posts.map((p) => authorSlug(p.author)))];
  const authorPages = authors.map((author) => ({
    url: `${baseUrl}/blog/auteur/${author}`,
    lastModified: latestPostDate,
    changeFrequency: "weekly",
    priority: 0.4,
  }));

  const blogPages = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updated || post.publishDate || post.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticPages, ...hubPages, ...authorPages, ...blogPages];
}
