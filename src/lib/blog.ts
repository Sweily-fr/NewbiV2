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
  /** Date de dernière mise à jour éditoriale (frontmatter `updated`), sinon null */
  updated: string | null;
  readTime: number;
  content: string;
}

export interface BlogPostMeta extends Omit<BlogPost, "content"> {}

export interface FaqItem {
  question: string;
  answer: string;
}

/** Libellés des catégories (clé = valeur du frontmatter `category`). */
export const CATEGORY_LABELS: Record<string, string> = {
  guide: "Guides",
  reglementaire: "Réglementaire",
  liste: "Comparatifs et listes",
  comparaison: "Newbi vs concurrents",
  glossaire: "Glossaire",
  conseils: "Conseils",
  modele: "Modèles à télécharger",
};

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  guide:
    "Des guides pas à pas pour facturer, gérer sa trésorerie et tenir sa comptabilité quand on est indépendant ou dirigeant de TPE.",
  reglementaire:
    "Les obligations légales et fiscales expliquées simplement : mentions obligatoires, TVA, facturation électronique, échéances.",
  liste:
    "Sélections et comparatifs d'outils pour choisir le logiciel adapté à votre activité.",
  comparaison:
    "Comparaisons détaillées entre Newbi et les autres logiciels de facturation et de gestion.",
  glossaire:
    "Les termes de la facturation, de la comptabilité et de la fiscalité définis clairement, avec des exemples.",
  conseils:
    "Conseils pratiques et erreurs à éviter pour gagner du temps et se faire payer plus vite.",
  modele:
    "Modèles de factures, devis, lettres et tableaux prêts à l'emploi, avec les règles pour bien les utiliser.",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

/** Transforme un libellé (« BTP / Artisans ») en slug d'URL (« btp-artisans »). */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function calculateReadTime(content: string): number {
  const words = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

function stripImports(content: string): string {
  // Remove single-line imports AND multi-line imports (import { ... } from "...")
  return content.replace(/^import\s[\s\S]*?from\s+["'][^"']+["'];?\s*$/gm, "");
}

/**
 * La page article affiche déjà le titre en H1 : un « # Titre » en tête du
 * MDX (présent dans la plupart des articles générés) produisait un second H1.
 * On retire ce premier titre de niveau 1 s'il précède le premier « ## ».
 */
function stripLeadingH1(content: string): string {
  const firstH2 = content.search(/^## /m);
  const head = firstH2 === -1 ? content : content.slice(0, firstH2);
  const m = head.match(/^# .+\n?/m);
  if (!m || m.index === undefined) return content;
  return content.slice(0, m.index) + content.slice(m.index + m[0].length);
}

/**
 * Les articles générés embarquent leurs propres blocs
 * <script type="application/ld+json" dangerouslySetInnerHTML={{...}} />.
 * La page article génère désormais un JSON-LD unique et cohérent (BlogPosting,
 * BreadcrumbList, FAQPage, URL en www, dateModified) : on retire les blocs
 * inline pour ne pas envoyer deux schémas contradictoires à Google.
 */
function stripInlineJsonLd(content: string): string {
  return content.replace(
    /<script\s+type=["']application\/ld\+json["'][\s\S]*?(?:\/>|<\/script>)\s*/g,
    "",
  );
}

const PUBLIC_DIR = path.join(process.cwd(), "public");

/**
 * Chemin d'image utilisable seulement si le fichier existe dans public/ :
 * 61 articles référencent des illustrations jamais générées (OpenGraph,
 * cartes et JSON-LD pointaient vers des 404). Le chemin d'origine reste dans
 * le frontmatter pour la régénération.
 */
function existingImage(image: unknown): string {
  if (typeof image !== "string" || !image) return "";
  if (/^https?:\/\//.test(image)) return image;
  return fs.existsSync(path.join(PUBLIC_DIR, image)) ? image : "";
}

function toDateString(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

function parsePost(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  const strippedContent = stripLeadingH1(
    stripInlineJsonLd(stripImports(content)),
  );

  return {
    slug,
    title: data.title ?? "",
    description: data.description ?? "",
    date: toDateString(data.date) ?? "",
    category: data.category ?? "",
    sector: data.sector ?? null,
    keyword: data.keyword ?? "",
    author: data.author ?? "Newbi",
    image: existingImage(data.image),
    published: data.published === true,
    publishDate: toDateString(data.publishDate),
    updated: toDateString(data.updated),
    readTime: calculateReadTime(strippedContent),
    content: strippedContent,
  };
}

let postsCache: BlogPostMeta[] | null = null;

export function getAllPosts(): BlogPostMeta[] {
  // Cache par processus : les pages hub, le sitemap et les articles liés
  // relisent tous le dossier ; le contenu ne change qu'au build.
  if (postsCache && process.env.NODE_ENV === "production") return postsCache;

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

  postsCache = posts;
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

/** Catégories ayant au moins un article publié, avec leur nombre d'articles. */
export function getCategories(): {
  slug: string;
  label: string;
  count: number;
}[] {
  const counts = new Map<string, number>();
  for (const p of getAllPosts()) {
    if (!p.category) continue;
    counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([slug, count]) => ({ slug, label: categoryLabel(slug), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "fr"));
}

export function getPostsByCategory(category: string): BlogPostMeta[] {
  return getAllPosts().filter((p) => p.category === category);
}

/** Secteurs (frontmatter `sector`) ayant au moins un article publié. */
export function getSectors(): { slug: string; label: string; count: number }[] {
  const bySlug = new Map<string, { label: string; count: number }>();
  for (const p of getAllPosts()) {
    if (!p.sector) continue;
    const slug = slugify(p.sector);
    const entry = bySlug.get(slug) ?? { label: p.sector, count: 0 };
    entry.count += 1;
    bySlug.set(slug, entry);
  }
  return [...bySlug.entries()]
    .map(([slug, { label, count }]) => ({ slug, label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "fr"));
}

export function getSectorBySlug(
  sectorSlug: string,
): { slug: string; label: string; posts: BlogPostMeta[] } | null {
  const posts = getAllPosts().filter(
    (p) => p.sector && slugify(p.sector) === sectorSlug,
  );
  if (posts.length === 0) return null;
  return { slug: sectorSlug, label: posts[0].sector as string, posts };
}

/**
 * Articles liés : même secteur d'abord, puis même catégorie, puis les plus
 * récents. Sert le bloc « À lire aussi » en bas d'article.
 */
export function getRelatedPosts(slug: string, limit = 4): BlogPostMeta[] {
  const all = getAllPosts();
  const current = all.find((p) => p.slug === slug);
  if (!current) return all.filter((p) => p.slug !== slug).slice(0, limit);

  const score = (p: BlogPostMeta) => {
    let s = 0;
    if (current.sector && p.sector === current.sector) s += 2;
    if (p.category === current.category) s += 1;
    return s;
  };

  return all
    .filter((p) => p.slug !== slug)
    .map((p, index) => ({ p, s: score(p), index }))
    .sort((a, b) => b.s - a.s || a.index - b.index)
    .slice(0, limit)
    .map(({ p }) => p);
}

/** Retire le balisage Markdown/JSX léger pour obtenir du texte brut (schema.org). */
export function toPlainText(value: string): string {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extrait les questions/réponses de la FAQ en accordéon des articles
 * (<AccordionTrigger>question</AccordionTrigger><AccordionContent>réponse</AccordionContent>).
 */
export function extractFaq(content: string): FaqItem[] {
  const items: FaqItem[] = [];
  const re =
    /<AccordionTrigger[^>]*>([\s\S]*?)<\/AccordionTrigger>\s*<AccordionContent[^>]*>([\s\S]*?)<\/AccordionContent>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const question = toPlainText(m[1]);
    const answer = toPlainText(m[2]);
    if (question && answer) items.push({ question, answer });
  }
  return items;
}
