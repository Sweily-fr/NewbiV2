const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { execSync } = require("child_process");

const BLOG_DIR = path.join(__dirname, "..", "content", "blog");
const QUEUE_PATH = path.join(BLOG_DIR, "_publication-queue.json");
const LOG_PATH = path.join(BLOG_DIR, "_publication-log.json");
const IMAGE_SCRIPT = path.join(__dirname, "generate-blog-images.py");

const count = parseInt(process.argv[2], 10) || 3;
const skipImages = process.argv.includes("--skip-images");

const queue = JSON.parse(fs.readFileSync(QUEUE_PATH, "utf-8"));
const log = fs.existsSync(LOG_PATH)
  ? JSON.parse(fs.readFileSync(LOG_PATH, "utf-8"))
  : [];

const today = new Date().toISOString().split("T")[0];
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
    });
  } catch (err) {
    console.error("Warning: Image generation failed. Articles are published but some images may be missing.");
    console.error(err.message);
    // Don't exit with error — articles are already published
  }
} else if (!process.env.GOOGLE_API_KEY) {
  console.log("\nSkipping image generation: GOOGLE_API_KEY not set.");
} else {
  console.log("\nSkipping image generation: --skip-images flag used.");
}
