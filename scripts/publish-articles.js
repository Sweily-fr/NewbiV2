const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { execSync } = require("child_process");

const BLOG_DIR = path.join(__dirname, "..", "content", "blog");
const QUEUE_PATH = path.join(BLOG_DIR, "_publication-queue.json");
const LOG_PATH = path.join(BLOG_DIR, "_publication-log.json");
const IMAGE_SCRIPT = path.join(__dirname, "generate-blog-images.py");

const imagesOnly = process.argv.includes("--images-only");
const skipImages = process.argv.includes("--skip-images");
const forceImages = process.argv.includes("--force-images");
const ignoreLinks = process.argv.includes("--ignore-links");
const forceFlag = forceImages ? " --force" : "";
const count = imagesOnly ? 0 : parseInt(process.argv[2], 10) || 3;

const queue = JSON.parse(fs.readFileSync(QUEUE_PATH, "utf-8"));
const log = fs.existsSync(LOG_PATH)
  ? JSON.parse(fs.readFileSync(LOG_PATH, "utf-8"))
  : [];

const today = new Date().toISOString().split("T")[0];

// --images-only: find all already-published articles and generate their images
if (imagesOnly) {
  const publishedSlugs = [];
  for (const slug of queue.queue) {
    const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
    if (!fs.existsSync(filePath)) continue;
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(raw);
    if (data.published === true) publishedSlugs.push(slug);
  }

  if (publishedSlugs.length === 0) {
    console.log("No published articles found.");
    process.exit(0);
  }

  console.log(
    `Found ${publishedSlugs.length} published article(s). Generating images...`,
  );
  if (!process.env.OPENAI_API_KEY) {
    console.log("Error: OPENAI_API_KEY not set.");
    process.exit(1);
  }

  try {
    execSync(
      `python3 ${IMAGE_SCRIPT} ${publishedSlugs.join(" ")}${forceFlag}`,
      {
        stdio: "inherit",
        env: { ...process.env },
        timeout: 660000,
      },
    );
  } catch (err) {
    console.error("Warning: Image generation failed:", err.message);
  }
  process.exit(0);
}

// Build set of already-published slugs
function getPublishedSlugs() {
  const slugs = new Set();
  for (const slug of queue.queue) {
    const fp = path.join(BLOG_DIR, `${slug}.mdx`);
    if (!fs.existsSync(fp)) continue;
    const { data } = matter(fs.readFileSync(fp, "utf-8"));
    if (data.published === true) slugs.add(slug);
  }
  return slugs;
}

// Normal mode: publish new articles
const published = [];
const publishedSlugs = getPublishedSlugs();

// Build metadata for every unpublished queued article: parsed frontmatter,
// content, internal-link dependencies (unpublished but existing) and missing
// targets (file doesn't exist — unresolvable 404).
const linkScanRegex = /\[([^\]]+)\]\(\/blog\/([^)#?]+)(?:[#?][^)]*)?\)/g;
const meta = new Map(); // slug -> { data, content, deps:Set<string>, missing:[{text,target}] }

for (const slug of queue.queue) {
  const fp = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(fp)) continue;
  const { data, content } = matter(fs.readFileSync(fp, "utf-8"));
  if (data.published === true) continue;

  const deps = new Set();
  const missing = [];
  let m;
  const re = new RegExp(linkScanRegex.source, "g");
  while ((m = re.exec(content)) !== null) {
    const target = m[2].replace(/\/$/, "");
    if (target === slug) continue;
    const targetFp = path.join(BLOG_DIR, `${target}.mdx`);
    if (!fs.existsSync(targetFp)) {
      missing.push({ text: m[1], target });
    } else if (!publishedSlugs.has(target)) {
      deps.add(target);
    }
  }
  meta.set(slug, { data, content, deps, missing });
}

// Build the dep graph over unpublished articles. Articles that mutually link
// to each other (strongly-connected components) must be published in the same
// batch — otherwise one would 404 the other. Tarjan's algo finds SCCs; we
// then pick whole SCCs in topological order using queue position as
// tiebreaker. An SCC bigger than `count` forces a larger-than-usual week,
// which is strictly better than stranding articles forever.
const graph = new Map(); // slug -> deps limited to other unpublished
for (const [slug, { deps, missing }] of meta.entries()) {
  if (missing.length > 0 && !ignoreLinks) continue; // unpublishable in strict mode
  graph.set(
    slug,
    [...deps].filter((d) => meta.has(d)),
  );
}

// Iterative Tarjan SCC (avoids stack overflow on deep graphs).
const sccIdBySlug = new Map();
const sccs = [];
{
  let idx = 0;
  const indices = new Map();
  const lowlink = new Map();
  const onStack = new Set();
  const stk = [];
  const callStack = [];

  for (const start of graph.keys()) {
    if (indices.has(start)) continue;
    callStack.push({ v: start, iter: 0 });
    while (callStack.length > 0) {
      const frame = callStack[callStack.length - 1];
      const { v } = frame;
      if (frame.iter === 0) {
        indices.set(v, idx);
        lowlink.set(v, idx);
        idx++;
        stk.push(v);
        onStack.add(v);
      }
      const neighbors = graph.get(v) || [];
      if (frame.iter < neighbors.length) {
        const w = neighbors[frame.iter++];
        if (!indices.has(w)) {
          callStack.push({ v: w, iter: 0 });
        } else if (onStack.has(w)) {
          lowlink.set(v, Math.min(lowlink.get(v), indices.get(w)));
        }
      } else {
        if (lowlink.get(v) === indices.get(v)) {
          const scc = [];
          let w;
          do {
            w = stk.pop();
            onStack.delete(w);
            scc.push(w);
          } while (w !== v);
          const id = sccs.length;
          sccs.push(scc);
          for (const s of scc) sccIdBySlug.set(s, id);
        }
        callStack.pop();
        if (callStack.length > 0) {
          const parent = callStack[callStack.length - 1];
          lowlink.set(
            parent.v,
            Math.min(lowlink.get(parent.v), lowlink.get(v)),
          );
        }
      }
    }
  }
}

// SCC-level dependency set and priority (min queue position of members).
const queueIndex = new Map(queue.queue.map((s, i) => [s, i]));
const sccExternalDeps = sccs.map(() => new Set());
for (const [slug, deps] of graph.entries()) {
  const from = sccIdBySlug.get(slug);
  for (const d of deps) {
    const to = sccIdBySlug.get(d);
    if (to !== from) sccExternalDeps[from].add(to);
  }
}
const sccPriority = sccs.map((scc) =>
  Math.min(...scc.map((s) => queueIndex.get(s) ?? Number.MAX_SAFE_INTEGER)),
);

// Walk SCCs in topo order, tiebreaking on earliest queue position, until the
// batch reaches `count`. Include whole SCCs — never half of one.
const sccDone = new Set();
const batch = [];
const batchSet = new Set();
const resolved = new Set(publishedSlugs);

while (batch.length < count) {
  let pick = -1;
  let pickPrio = Number.MAX_SAFE_INTEGER;
  for (let i = 0; i < sccs.length; i++) {
    if (sccDone.has(i)) continue;
    const unresolvedDeps = [...sccExternalDeps[i]].some((d) => !sccDone.has(d));
    if (unresolvedDeps) continue;
    if (sccPriority[i] < pickPrio) {
      pick = i;
      pickPrio = sccPriority[i];
    }
  }
  if (pick === -1) break;
  sccDone.add(pick);
  const members = sccs[pick]
    .slice()
    .sort((a, b) => (queueIndex.get(a) ?? 0) - (queueIndex.get(b) ?? 0));
  if (members.length > 1) {
    console.log(
      `→ Co-publishing cycle of ${members.length} articles: ${members.join(", ")}`,
    );
  }
  for (const slug of members) {
    batch.push(slug);
    batchSet.add(slug);
    resolved.add(slug);
  }
}

// Articles with missing targets (broken slugs with no .mdx file) can never be
// resolved through scheduling — surface them so the editor can fix the link
// or create the missing article.
for (const [slug, { missing }] of meta.entries()) {
  if (batchSet.has(slug)) continue;
  if (missing.length === 0) continue;
  console.warn(
    `⚠ ${slug} blocked on missing targets: ${missing
      .map((x) => `/blog/${x.target}`)
      .join(", ")}`,
  );
}

// Publish the selected batch in the chosen order.
for (const slug of batch) {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  const { data, content, missing } = meta.get(slug);

  if (missing.length > 0 && ignoreLinks) {
    console.warn(`\n⚠ ${slug}.mdx has ${missing.length} missing target(s):`);
    for (const link of missing) {
      console.warn(`  - [${link.text}](/blog/${link.target}) — file not found`);
    }
    console.warn(`  → Publishing anyway (--ignore-links flag used).\n`);
  }

  data.published = true;
  data.publishDate = today;

  fs.writeFileSync(filePath, matter.stringify(content, data), "utf-8");
  published.push(slug);
  publishedSlugs.add(slug);
  console.log(`Published: ${slug}`);
}

if (published.length === 0) {
  console.log("No new articles to publish.");
  process.exit(0);
}

log.push({
  date: today,
  articles: published,
});

fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2), "utf-8");
console.log(`\nPublished ${published.length} article(s) on ${today}.`);

// Generate images for newly published articles
if (!skipImages && process.env.OPENAI_API_KEY) {
  console.log("\n--- Generating images ---");
  const slugArgs = published.join(" ");
  try {
    execSync(`python3 ${IMAGE_SCRIPT} ${slugArgs}${forceFlag}`, {
      stdio: "inherit",
      env: { ...process.env },
      timeout: 660000,
    });
  } catch (err) {
    console.error(
      "Warning: Image generation failed. Articles are published but some images may be missing.",
    );
    console.error(err.message);
  }
} else if (!process.env.OPENAI_API_KEY) {
  console.log("\nSkipping image generation: OPENAI_API_KEY not set.");
} else {
  console.log("\nSkipping image generation: --skip-images flag used.");
}
