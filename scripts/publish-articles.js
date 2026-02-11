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
const count = imagesOnly ? 0 : (parseInt(process.argv[2], 10) || 3);

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

  console.log(`Found ${publishedSlugs.length} published article(s). Generating images...`);
  if (!process.env.GOOGLE_API_KEY) {
    console.log("Error: GOOGLE_API_KEY not set.");
    process.exit(1);
  }

  try {
    execSync(`python3 ${IMAGE_SCRIPT} ${publishedSlugs.join(" ")}`, {
      stdio: "inherit",
      env: { ...process.env },
      timeout: 660000,
    });
  } catch (err) {
    console.error("Warning: Image generation failed:", err.message);
  }
  process.exit(0);
}

// Normal mode: publish new articles
const published = [];

for (const slug of queue.queue) {
  if (published.length >= count) break;

  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${slug}.mdx — skipping`);
    continue;
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  if (data.published === true) continue;

  data.published = true;
  data.publishDate = today;

  fs.writeFileSync(filePath, matter.stringify(content, data), "utf-8");
  published.push(slug);
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
if (!skipImages && process.env.GOOGLE_API_KEY) {
  console.log("\n--- Generating images ---");
  const slugArgs = published.join(" ");
  try {
    execSync(`python3 ${IMAGE_SCRIPT} ${slugArgs}`, {
      stdio: "inherit",
      env: { ...process.env },
      timeout: 660000,
    });
  } catch (err) {
    console.error("Warning: Image generation failed. Articles are published but some images may be missing.");
    console.error(err.message);
  }
} else if (!process.env.GOOGLE_API_KEY) {
  console.log("\nSkipping image generation: GOOGLE_API_KEY not set.");
} else {
  console.log("\nSkipping image generation: --skip-images flag used.");
}
