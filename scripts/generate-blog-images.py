#!/usr/bin/env python3
"""
Blog Image Generator for Newbi

Generates hero and section illustrations for blog articles using
DALL-E 3 (OpenAI) for illustrations and Unsplash for sector-specific
hero photos. Images are saved as WebP in public/blog/[slug]/.

Usage:
    python generate-blog-images.py <slug> [--force]

Environment:
    OPENAI_API_KEY       — OpenAI API key for DALL-E 3
    UNSPLASH_ACCESS_KEY  — Unsplash API key for hero photos (optional)
"""

import os
import sys
import re
import io
import json
import time
import argparse
import urllib.request
import urllib.parse

try:
    from openai import OpenAI
except ImportError:
    print("Error: openai package not installed. Run: pip install openai")
    sys.exit(1)

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow package not installed. Run: pip install Pillow")
    sys.exit(1)

# ----- Timeouts -----

MAX_RETRIES = 2
GLOBAL_TIMEOUT = 600     # 10 minutes total
_global_start = None

# ----- Config -----

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
BLOG_CONTENT_DIR = os.path.join(PROJECT_DIR, "content", "blog")
PUBLIC_BLOG_DIR = os.path.join(PROJECT_DIR, "public", "blog")

MODEL = "dall-e-3"

BASE_STYLE = (
    "Isometric minimalist illustration, extremely simple, very few elements, "
    "geometric shapes only, no detailed characters, no faces, no text, "
    "no watermarks, no complex scenes. "
    "Style like Qonto brand illustrations: clean, professional, corporate, "
    "sparse composition with lots of white space. "
    "Maximum 2-3 simple objects per image. "
    "Soft pastel purple palette: primary #5a50ff, light purple #8b7fff, "
    "very light lavender background #f8f7ff. "
    "Subtle shadows, no gradients, no dark backgrounds. "
    "Think: one simple concept, one simple visual."
)


def parse_frontmatter(content):
    """Extract frontmatter fields from MDX file content."""
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n", content, re.DOTALL)
    if not match:
        return {}
    fm = {}
    for line in match.group(1).split("\n"):
        line = line.strip()
        if ":" in line and not line.startswith("#"):
            key, _, val = line.partition(":")
            val = val.strip().strip("'\"")
            if val == "null" or val == "":
                val = None
            fm[key.strip()] = val
    return fm


def find_image_refs(content, slug):
    """Find all image paths referenced in the MDX for this slug."""
    pattern = rf'src="/blog/{re.escape(slug)}/([^"]+)"'
    matches = re.findall(pattern, content)
    fm = parse_frontmatter(content)
    if fm.get("image"):
        img_path = fm["image"]
        basename = img_path.split("/")[-1]
        if basename not in matches:
            matches.insert(0, basename)
    seen = set()
    unique = []
    for m in matches:
        if m not in seen:
            seen.add(m)
            unique.append(m)
    return unique


# ----- Unsplash -----

def fetch_unsplash_hero(sector, keyword, output_path):
    """Download a professional photo from Unsplash based on sector/keyword."""
    access_key = os.environ.get("UNSPLASH_ACCESS_KEY")
    if not access_key:
        print("  [hero.webp] UNSPLASH_ACCESS_KEY not set — falling back to DALL-E", flush=True)
        return False

    query = f"{sector} business professional"
    if keyword:
        query = f"{sector} {keyword}"

    params = urllib.parse.urlencode({
        "query": query,
        "orientation": "landscape",
        "per_page": 1,
        "content_filter": "high",
    })
    url = f"https://api.unsplash.com/search/photos?{params}"

    print(f"  [hero.webp] Unsplash search: \"{query}\"", flush=True)

    try:
        req = urllib.request.Request(url, headers={
            "Authorization": f"Client-ID {access_key}",
            "Accept-Version": "v1",
        })
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())

        if not data.get("results"):
            print("  [hero.webp] No Unsplash results — falling back to DALL-E", flush=True)
            return False

        photo = data["results"][0]
        # Use regular size (1080px wide) — good balance of quality/size
        image_url = photo["urls"]["regular"]
        photographer = photo["user"]["name"]
        print(f"  [hero.webp] Found photo by {photographer} — downloading...", flush=True)

        img_req = urllib.request.Request(image_url, headers={"User-Agent": "NewbiBlogImageGen/1.0"})
        with urllib.request.urlopen(img_req, timeout=30) as img_resp:
            img_data = img_resp.read()

        img = Image.open(io.BytesIO(img_data))
        # Crop to 16:9 if needed
        w, h = img.size
        target_ratio = 16 / 9
        current_ratio = w / h
        if current_ratio > target_ratio:
            new_w = int(h * target_ratio)
            left = (w - new_w) // 2
            img = img.crop((left, 0, left + new_w, h))
        elif current_ratio < target_ratio:
            new_h = int(w / target_ratio)
            top = (h - new_h) // 2
            img = img.crop((0, top, w, top + new_h))

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        img.save(output_path, "WEBP", quality=85)
        print(f"  [hero.webp] SAVED from Unsplash ({os.path.getsize(output_path)} bytes) — photo by {photographer}", flush=True)
        return True

    except Exception as e:
        print(f"  [hero.webp] Unsplash error: {str(e)[:150]} — falling back to DALL-E", flush=True)
        return False


# ----- DALL-E -----

def build_prompt(slug, frontmatter, image_name, article_body):
    """Build a DALL-E prompt for a specific image in the article."""
    title = frontmatter.get("title", slug.replace("-", " "))
    keyword = frontmatter.get("keyword", "")

    context = f'Topic: "{title}"'
    if keyword:
        context += f". Keyword: {keyword}"

    name_lower = image_name.lower().replace(".webp", "").replace(".svg", "")

    if name_lower == "hero":
        prompt = (
            f"{BASE_STYLE} "
            f"Wide hero image for a business article. {context}. "
            f"One single iconic object representing the topic, centered, lots of empty space around it."
        )
    elif "section" in name_lower:
        excerpt = _extract_section_context(article_body, 1)
        prompt = (
            f"{BASE_STYLE} "
            f"Small illustration for an article section. {context}. "
            f"Context: {excerpt}. "
            f"One simple object or icon representing this section concept."
        )
    elif "comparatif" in name_lower or "comparaison" in name_lower:
        prompt = (
            f"{BASE_STYLE} "
            f"Illustration of a comparison. {context}. "
            f"Two simple geometric objects side by side, like two cards or two boxes."
        )
    elif "dashboard" in name_lower:
        prompt = (
            f"{BASE_STYLE} "
            f"Simple dashboard mockup. {context}. "
            f"One minimal screen shape with 2-3 abstract chart elements inside."
        )
    elif "workflow" in name_lower or "etape" in name_lower:
        prompt = (
            f"{BASE_STYLE} "
            f"Simple workflow illustration. {context}. "
            f"2-3 connected geometric shapes with arrows between them."
        )
    elif "checklist" in name_lower:
        prompt = (
            f"{BASE_STYLE} "
            f"Simple checklist illustration. {context}. "
            f"One clipboard shape with 2-3 checkmark lines."
        )
    elif "exemple" in name_lower or "modele" in name_lower:
        prompt = (
            f"{BASE_STYLE} "
            f"Simple document illustration. {context}. "
            f"One paper/document shape with a few abstract lines on it."
        )
    elif "seuil" in name_lower or "tva" in name_lower or "fiscal" in name_lower:
        prompt = (
            f"{BASE_STYLE} "
            f"Tax/threshold illustration. {context}. "
            f"One simple calculator or scale icon, minimal and geometric."
        )
    elif "transaction" in name_lower or "bancaire" in name_lower or "tresorerie" in name_lower:
        prompt = (
            f"{BASE_STYLE} "
            f"Financial illustration. {context}. "
            f"One simple coin or wallet icon, minimal and geometric."
        )
    elif "preparation" in name_lower or "migration" in name_lower:
        prompt = (
            f"{BASE_STYLE} "
            f"Preparation/migration illustration. {context}. "
            f"One simple arrow pointing from old to new, two geometric shapes."
        )
    else:
        readable_name = name_lower.replace("-", " ").replace("_", " ")
        prompt = (
            f"{BASE_STYLE} "
            f"Simple illustration for: {readable_name}. {context}. "
            f"One minimal iconic object representing this concept."
        )

    return prompt


def _extract_section_context(body, section_index):
    """Extract a text excerpt around the Nth section heading."""
    headings = list(re.finditer(r"^## .+$", body, re.MULTILINE))
    if section_index < len(headings):
        start = headings[section_index].start()
        excerpt = body[start : start + 300].strip()
        excerpt = re.sub(r"<[^>]+>", "", excerpt)
        excerpt = re.sub(r"\*\*([^*]+)\*\*", r"\1", excerpt)
        excerpt = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", excerpt)
        return excerpt[:200]
    return ""


def _check_global_timeout():
    """Return True if global timeout has been exceeded."""
    if _global_start is None:
        return False
    elapsed = time.time() - _global_start
    if elapsed >= GLOBAL_TIMEOUT:
        print(f"  GLOBAL TIMEOUT: {int(elapsed)}s elapsed (limit: {GLOBAL_TIMEOUT}s). Stopping.", flush=True)
        return True
    return False


def generate_image(client, prompt, output_path, size):
    """Generate an image using DALL-E 3 and save as WebP."""
    basename = os.path.basename(output_path)

    for attempt in range(MAX_RETRIES):
        if _check_global_timeout():
            print(f"  SKIP (global timeout): {basename}", flush=True)
            return False

        print(f"  [{basename}] attempt {attempt + 1}/{MAX_RETRIES} — calling DALL-E 3...", flush=True)
        t0 = time.time()

        try:
            response = client.images.generate(
                model=MODEL,
                prompt=prompt,
                size=size,
                quality="standard",
                n=1,
            )

            image_url = response.data[0].url
            elapsed = time.time() - t0
            print(f"  [{basename}] response received in {elapsed:.1f}s — downloading...", flush=True)

            req = urllib.request.Request(image_url, headers={"User-Agent": "NewbiBlogImageGen/1.0"})
            with urllib.request.urlopen(req, timeout=30) as resp:
                img_data = resp.read()

            img = Image.open(io.BytesIO(img_data))
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            img.save(output_path, "WEBP", quality=85)
            print(f"  [{basename}] SAVED ({os.path.getsize(output_path)} bytes)", flush=True)
            return True

        except Exception as e:
            elapsed = time.time() - t0
            error_str = str(e)
            print(f"  [{basename}] ERROR after {elapsed:.1f}s: {error_str[:200]}", flush=True)

            if "rate_limit" in error_str.lower() or "429" in error_str:
                wait = min(30 * (attempt + 1), 60)
                print(f"  [{basename}] Rate limited, retrying in {wait}s...", flush=True)
                time.sleep(wait)
                continue
            return False

    print(f"  [{basename}] FAILED after {MAX_RETRIES} retries — skipping", flush=True)
    return False


def process_article(slug, client, force=False):
    """Generate all images for a single article."""
    mdx_path = os.path.join(BLOG_CONTENT_DIR, f"{slug}.mdx")
    if not os.path.exists(mdx_path):
        print(f"Error: MDX file not found: {mdx_path}")
        return False

    with open(mdx_path, "r", encoding="utf-8") as f:
        content = f.read()

    frontmatter = parse_frontmatter(content)
    body = re.sub(r"^---\s*\n.*?\n---\s*\n", "", content, flags=re.DOTALL)
    body = "\n".join(
        line for line in body.split("\n") if not line.strip().startswith("import ")
    )

    image_refs = find_image_refs(content, slug)
    if not image_refs:
        print(f"No image references found in {slug}.mdx")
        return True

    sector = frontmatter.get("sector")
    keyword = frontmatter.get("keyword", "")

    print(f"\nProcessing: {slug}")
    print(f"  Title: {frontmatter.get('title', 'N/A')}")
    print(f"  Sector: {sector or 'none'}")
    print(f"  Images to generate: {len(image_refs)}", flush=True)

    output_dir = os.path.join(PUBLIC_BLOG_DIR, slug)
    os.makedirs(output_dir, exist_ok=True)

    generated = 0
    skipped = 0
    for img_name in image_refs:
        if _check_global_timeout():
            skipped += len(image_refs) - generated - skipped
            break

        base = os.path.splitext(img_name)[0]
        webp_name = f"{base}.webp"
        output_path = os.path.join(output_dir, webp_name)

        if os.path.exists(output_path) and not force:
            print(f"  [{webp_name}] EXISTS — skipping", flush=True)
            generated += 1
            continue

        is_hero = "hero" in base.lower()

        # Hero + sector → try Unsplash photo first
        if is_hero and sector:
            success = fetch_unsplash_hero(sector, keyword, output_path)
            if success:
                generated += 1
                time.sleep(1)
                continue

        # DALL-E 3 illustration
        size = "1792x1024" if is_hero else "1024x1024"
        prompt = build_prompt(slug, frontmatter, img_name, body)
        success = generate_image(client, prompt, output_path, size)
        if success:
            generated += 1
        else:
            skipped += 1

        time.sleep(1)

    print(f"  Result: {generated}/{len(image_refs)} generated, {skipped} skipped", flush=True)
    return True


def main():
    parser = argparse.ArgumentParser(
        description="Generate blog illustrations using DALL-E 3 + Unsplash"
    )
    parser.add_argument("slugs", nargs="+", help="Article slug(s) to generate images for")
    parser.add_argument("--api-key", help="OpenAI API key (or set OPENAI_API_KEY env var)")
    parser.add_argument("--force", action="store_true", help="Regenerate even if images exist")

    args = parser.parse_args()

    api_key = args.api_key or os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("Error: No API key provided.")
        print("  Use --api-key KEY or set OPENAI_API_KEY environment variable.")
        sys.exit(1)

    unsplash_key = os.environ.get("UNSPLASH_ACCESS_KEY")

    global _global_start
    _global_start = time.time()

    print("=" * 60)
    print("Newbi Blog Image Generator")
    print(f"  DALL-E model: {MODEL}")
    print(f"  Unsplash: {'enabled' if unsplash_key else 'disabled (no key)'}")
    print(f"  Articles: {len(args.slugs)}")
    print(f"  Force: {args.force}")
    print(f"  Max retries: {MAX_RETRIES}")
    print(f"  Global timeout: {GLOBAL_TIMEOUT}s ({GLOBAL_TIMEOUT // 60}min)")
    print("=" * 60, flush=True)

    client = OpenAI(api_key=api_key)

    for slug in args.slugs:
        if _check_global_timeout():
            print(f"\nSkipping remaining articles due to global timeout.")
            break
        process_article(slug, client, force=args.force)

    elapsed = time.time() - _global_start
    print(f"\nDone in {int(elapsed)}s.", flush=True)
    os._exit(0)


if __name__ == "__main__":
    main()
