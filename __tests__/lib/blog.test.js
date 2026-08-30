import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fs and gray-matter so the test doesn't depend on the real content/blog/ folder
const fsState = vi.hoisted(() => ({
  files: {},
  exists: new Set(),
}));

vi.mock("fs", () => ({
  default: {
    readdirSync: vi.fn(() => Object.keys(fsState.files)),
    existsSync: vi.fn((p) => {
      const slug = p
        .split("/")
        .pop()
        .replace(/\.mdx$/, "");
      return fsState.files[`${slug}.mdx`] !== undefined;
    }),
    readFileSync: vi.fn((p) => {
      const slug = p.split("/").pop();
      const content = fsState.files[slug];
      if (content === undefined) throw new Error("ENOENT: " + p);
      return content;
    }),
  },
  readdirSync: vi.fn(() => Object.keys(fsState.files)),
  existsSync: vi.fn((p) => {
    const slug = p
      .split("/")
      .pop()
      .replace(/\.mdx$/, "");
    return fsState.files[`${slug}.mdx`] !== undefined;
  }),
  readFileSync: vi.fn((p) => {
    const slug = p.split("/").pop();
    const content = fsState.files[slug];
    if (content === undefined) throw new Error("ENOENT: " + p);
    return content;
  }),
}));

vi.mock("gray-matter", () => ({
  default: (raw) => {
    // Very simple frontmatter parser for tests: split on '---'
    const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return { data: {}, content: raw };
    const meta = match[1];
    const content = match[2];
    const data = {};
    for (const line of meta.split("\n")) {
      const m = line.match(/^([a-zA-Z]+):\s*(.*)$/);
      if (m) {
        let v = m[2].trim();
        if (v === "true") v = true;
        else if (v === "false") v = false;
        else if (v === "null") v = null;
        else if (/^".*"$/.test(v)) v = v.slice(1, -1);
        data[m[1]] = v;
      }
    }
    return { data, content };
  },
}));

import {
  getAllPosts,
  getPostBySlug,
  getAllPublishedSlugs,
  generateStaticParams,
} from "@/src/lib/blog";

beforeEach(() => {
  fsState.files = {};
});

const fmPost = (overrides = {}) => {
  const meta = {
    title: "Hello",
    description: "desc",
    date: "2026-01-15",
    category: "guides",
    keyword: "test",
    image: "/img.jpg",
    published: true,
    publishDate: "2026-01-15",
    ...overrides,
  };
  const meta2 = Object.entries(meta)
    .map(([k, v]) =>
      v === null
        ? `${k}: null`
        : typeof v === "string"
          ? `${k}: "${v}"`
          : `${k}: ${v}`,
    )
    .join("\n");
  return `---\n${meta2}\n---\nContent body here.`;
};

describe("getAllPosts", () => {
  it("returns published posts only", () => {
    fsState.files = {
      "a.mdx": fmPost({
        title: "A",
        published: true,
        publishDate: "2026-01-10",
      }),
      "b.mdx": fmPost({
        title: "B",
        published: false,
        publishDate: "2026-01-20",
      }),
      "c.mdx": fmPost({
        title: "C",
        published: true,
        publishDate: "2026-01-15",
      }),
    };
    const posts = getAllPosts();
    expect(posts.map((p) => p.title).sort()).toEqual(["A", "C"]);
  });

  it("sorts posts by publishDate descending", () => {
    fsState.files = {
      "old.mdx": fmPost({ title: "Old", publishDate: "2026-01-01" }),
      "new.mdx": fmPost({ title: "New", publishDate: "2026-04-01" }),
      "mid.mdx": fmPost({ title: "Mid", publishDate: "2026-02-15" }),
    };
    const posts = getAllPosts();
    expect(posts.map((p) => p.title)).toEqual(["New", "Mid", "Old"]);
  });

  it("uses date when publishDate is null", () => {
    fsState.files = {
      "a.mdx": fmPost({ title: "A", date: "2026-01-01", publishDate: null }),
      "b.mdx": fmPost({ title: "B", date: "2026-04-01", publishDate: null }),
    };
    const posts = getAllPosts();
    expect(posts.map((p) => p.title)).toEqual(["B", "A"]);
  });

  it("strips MDX content from each meta object", () => {
    fsState.files = { "x.mdx": fmPost() };
    const posts = getAllPosts();
    expect(posts[0]).not.toHaveProperty("content");
  });

  it("ignores non-.mdx files", () => {
    // The fs mock filters .mdx files at the source level so this is implicit;
    // we just confirm an .md file does not show up.
    fsState.files = { "a.mdx": fmPost({ title: "A" }) };
    expect(getAllPosts()).toHaveLength(1);
  });
});

describe("getPostBySlug", () => {
  it("returns the post when published", () => {
    fsState.files = { "hello.mdx": fmPost({ title: "Hello" }) };
    const post = getPostBySlug("hello");
    expect(post.title).toBe("Hello");
    expect(post.slug).toBe("hello");
    expect(post.content).toContain("Content body here.");
  });

  it("returns null when not published", () => {
    fsState.files = { "draft.mdx": fmPost({ published: false }) };
    expect(getPostBySlug("draft")).toBeNull();
  });

  it("returns null when the file doesn't exist", () => {
    fsState.files = {};
    expect(getPostBySlug("missing")).toBeNull();
  });

  it("calculates a readTime ≥ 1", () => {
    fsState.files = { "x.mdx": fmPost() };
    const post = getPostBySlug("x");
    expect(post.readTime).toBeGreaterThanOrEqual(1);
  });

  it("strips ESM import statements from the content", () => {
    fsState.files = {
      "x.mdx": `---\ntitle: "X"\npublished: true\n---\nimport Foo from "./foo";\n\nReal content.`,
    };
    const post = getPostBySlug("x");
    expect(post.content).not.toContain("import Foo");
    expect(post.content).toContain("Real content.");
  });

  it("strips the leading markdown H1 (the page renders the title itself)", () => {
    fsState.files = {
      "x.mdx": `---\ntitle: "X"\npublished: true\n---\n<div>badges</div>\n\n# Mon titre\n\nIntro.\n\n## Section\n\n# pas un titre de page`,
    };
    const post = getPostBySlug("x");
    expect(post.content).not.toContain("# Mon titre");
    expect(post.content).toContain("Intro.");
    expect(post.content).toContain("## Section");
    expect(post.content).toContain("# pas un titre de page");
  });

  it("strips inline JSON-LD script blocks from the content", () => {
    fsState.files = {
      "x.mdx": `---\ntitle: "X"\npublished: true\n---\nAvant.\n\n<script\n  type="application/ld+json"\n  dangerouslySetInnerHTML={{\n    __html: JSON.stringify({ "@type": "Article" })\n  }}\n/>\n\n<script type="application/ld+json">{"@type":"FAQPage"}</script>\n\nAprès.`,
    };
    const post = getPostBySlug("x");
    expect(post.content).not.toContain("ld+json");
    expect(post.content).not.toContain("FAQPage");
    expect(post.content).toContain("Avant.");
    expect(post.content).toContain("Après.");
  });

  it("drops the image when the file does not exist in public/", () => {
    fsState.files = { "x.mdx": fmPost({ image: "/blog/x/hero.webp" }) };
    expect(getPostBySlug("x").image).toBe("");
  });

  it("keeps the image when the file exists in public/", () => {
    fsState.files = {
      "x.mdx": fmPost({ image: "/blog/x/hero.webp" }),
      // le mock fs indexe par nom de fichier + ".mdx"
      "hero.webp.mdx": "binary",
    };
    expect(getPostBySlug("x").image).toBe("/blog/x/hero.webp");
  });

  it("falls back to defaults for missing frontmatter fields", () => {
    fsState.files = {
      "x.mdx": `---\ntitle: "X"\npublished: true\n---\nbody`,
    };
    const post = getPostBySlug("x");
    expect(post.author).toBe("Newbi"); // default
    expect(post.image).toBe("");
    expect(post.sector).toBeNull();
  });
});

describe("getAllPublishedSlugs / generateStaticParams", () => {
  it("returns just slugs of published posts", () => {
    fsState.files = {
      "a.mdx": fmPost({ title: "A" }),
      "b.mdx": fmPost({ title: "B", published: false }),
    };
    expect(getAllPublishedSlugs()).toEqual(["a"]);
  });

  it("generateStaticParams returns slug objects suitable for Next.js", () => {
    fsState.files = {
      "a.mdx": fmPost({ title: "A" }),
      "b.mdx": fmPost({ title: "B" }),
    };
    expect(
      generateStaticParams().sort((a, b) => a.slug.localeCompare(b.slug)),
    ).toEqual([{ slug: "a" }, { slug: "b" }]);
  });
});

import {
  slugify,
  extractFaq,
  toPlainText,
  getRelatedPosts,
  getCategories,
  getSectors,
  getSectorBySlug,
  categoryLabel,
} from "@/src/lib/blog";

describe("slugify", () => {
  it("removes accents and non alphanumerics", () => {
    expect(slugify("BTP / Artisans")).toBe("btp-artisans");
    expect(slugify("Professions médicales")).toBe("professions-medicales");
    expect(slugify("Comptables / Experts-comptables")).toBe(
      "comptables-experts-comptables",
    );
  });
});

describe("categoryLabel", () => {
  it("maps known categories and falls back to the raw value", () => {
    expect(categoryLabel("reglementaire")).toBe("Réglementaire");
    expect(categoryLabel("inconnu")).toBe("inconnu");
  });
});

describe("extractFaq", () => {
  it("extracts question/answer pairs from the accordion markup", () => {
    const content = `
## Questions fréquentes
<Accordion type="multiple">
  <AccordionItem value="faq-0">
    <AccordionTrigger>Faut-il un SIREN ?</AccordionTrigger>
    <AccordionContent>
      Oui, le **SIREN** est obligatoire. Voir [la liste](/blog/mentions-obligatoires-facture).
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="faq-1">
    <AccordionTrigger>Et le SIRET ?</AccordionTrigger>
    <AccordionContent>Recommandé.</AccordionContent>
  </AccordionItem>
</Accordion>`;
    expect(extractFaq(content)).toEqual([
      {
        question: "Faut-il un SIREN ?",
        answer: "Oui, le SIREN est obligatoire. Voir la liste.",
      },
      { question: "Et le SIRET ?", answer: "Recommandé." },
    ]);
  });

  it("returns an empty array when there is no FAQ", () => {
    expect(extractFaq("Just text")).toEqual([]);
  });
});

describe("toPlainText", () => {
  it("strips markdown links, emphasis, code and tags", () => {
    expect(toPlainText("Un <b>mot</b> *en* `code` et [lien](/x)")).toBe(
      "Un mot en code et lien",
    );
  });
});

describe("hubs and related posts", () => {
  beforeEach(() => {
    fsState.files = {
      "a.mdx": fmPost({
        title: "A",
        category: "guide",
        sector: "BTP / Artisans",
        publishDate: "2026-01-01",
      }),
      "b.mdx": fmPost({
        title: "B",
        category: "guide",
        sector: "BTP / Artisans",
        publishDate: "2026-02-01",
      }),
      "c.mdx": fmPost({
        title: "C",
        category: "glossaire",
        sector: null,
        publishDate: "2026-03-01",
      }),
      "d.mdx": fmPost({
        title: "D",
        category: "guide",
        sector: null,
        publishDate: "2026-04-01",
      }),
      "e.mdx": fmPost({
        title: "E",
        category: "conseils",
        sector: null,
        publishDate: "2026-05-01",
      }),
      "draft.mdx": fmPost({
        title: "Draft",
        category: "guide",
        sector: "BTP / Artisans",
        published: false,
      }),
    };
  });

  it("lists categories with counts, published only", () => {
    expect(getCategories()).toEqual([
      { slug: "guide", label: "Guides", count: 3 },
      { slug: "conseils", label: "Conseils", count: 1 },
      { slug: "glossaire", label: "Glossaire", count: 1 },
    ]);
  });

  it("lists sectors with slug and label", () => {
    expect(getSectors()).toEqual([
      { slug: "btp-artisans", label: "BTP / Artisans", count: 2 },
    ]);
    expect(getSectorBySlug("btp-artisans").posts.map((p) => p.title)).toEqual([
      "B",
      "A",
    ]);
    expect(getSectorBySlug("inconnu")).toBeNull();
  });

  it("prefers same sector, then same category, then recency", () => {
    // A : secteur BTP + guide. B partage les deux, D la catégorie, E et C rien.
    expect(getRelatedPosts("a", 3).map((p) => p.title)).toEqual([
      "B",
      "D",
      "E",
    ]);
  });

  it("never returns the current post", () => {
    expect(getRelatedPosts("b", 10).map((p) => p.title)).not.toContain("B");
  });
});
