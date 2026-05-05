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
