const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const BLOG_DIR = path.join(__dirname, "..", "content", "blog");

const files = fs
  .readdirSync(BLOG_DIR)
  .filter((f) => f.endsWith(".mdx"));

let updated = 0;

for (const file of files) {
  const filePath = path.join(BLOG_DIR, file);
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  if (data.published !== undefined && data.publishDate !== undefined) {
    continue;
  }

  if (data.published === undefined) data.published = false;
  if (data.publishDate === undefined) data.publishDate = null;

  const output = matter.stringify(content, data);
  fs.writeFileSync(filePath, output, "utf-8");
  updated++;
}

console.log(`Updated ${updated}/${files.length} MDX files with published/publishDate fields.`);
