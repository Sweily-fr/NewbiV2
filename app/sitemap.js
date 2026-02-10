import { getAllPosts } from "@/src/lib/blog";

/**
 * Sitemap dynamique pour newbi.fr
 * Généré automatiquement par Next.js
 * Accessible sur : https://www.newbi.fr/sitemap.xml
 */
export default function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://newbi.fr";

  const staticPages = [
    // Page d'accueil - Priorité maximale
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },

    // Pages produits - Haute priorité
    {
      url: `${baseUrl}/produits/factures`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/produits/devis`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/produits/signatures`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/produits/kanban`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/produits/transfers`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },

    // Blog listing
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },

    // Pages informatives - Priorité moyenne
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },

    // Pages légales - Priorité basse
    {
      url: `${baseUrl}/mentions-legales`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/politique-de-confidentialite`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/cgv`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  const posts = getAllPosts();
  const blogPages = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishDate || post.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticPages, ...blogPages];
}
