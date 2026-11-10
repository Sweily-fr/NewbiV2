import { slugify } from "@/src/lib/blog";

export interface AuthorProfile {
  name: string;
  role: string;
  bio: string;
  image: string | null;
}

/**
 * Profils des auteurs du blog. La clé est le slug du nom (frontmatter `author`).
 * Depuis le 10/11/2026, tous les articles sont signés Holany, avec son avatar.
 * Les anciennes pages /blog/auteur/{trevis,joaquim,dylan} redirigent vers la
 * sienne (next.config.js). Un nom inconnu retombe aussi sur Holany.
 */
export const AUTHORS: Record<string, AuthorProfile> = {
  holany: {
    name: "Holany",
    role: "Rédaction Newbi",
    bio: "Rédige les guides du blog Newbi sur la facturation, la gestion et les obligations des indépendants et des TPE, en lien avec l'équipe produit.",
    image: "/lp/about/about-11.jpeg",
  },
};

/**
 * Signature écrite dans le frontmatter par `scripts/publish-articles.js` à la
 * publication. Le blog n'a qu'une signature : Holany.
 */
export const SIGNATURES = ["Holany"] as const;

const DEFAULT_AUTHOR_KEY = "holany";

export function getAuthor(name: string | null | undefined): AuthorProfile {
  const key = name ? slugify(name) : "";
  return AUTHORS[key] ?? AUTHORS[DEFAULT_AUTHOR_KEY];
}

/** Slug d'URL de la page auteur pour un frontmatter `author` donné. */
export function authorSlug(name: string | null | undefined): string {
  const key = name ? slugify(name) : "";
  return AUTHORS[key] ? key : DEFAULT_AUTHOR_KEY;
}
