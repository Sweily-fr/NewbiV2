#!/usr/bin/env python3
"""
Blog Image Generator for Newbi

Generates hero and section illustrations for blog articles using
the Gemini Image API. Images are saved as WebP in public/blog/[slug]/.

Usage:
    python generate-blog-images.py <slug> [--api-key KEY]

Reads the MDX file at content/blog/<slug>.mdx, extracts frontmatter
and inline image references, then generates each missing image.

Environment:
    GOOGLE_API_KEY  — Google API key (or pass --api-key)
"""

import os
import sys
import re
import io
import time
import signal
import argparse
import threading

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("Error: google-genai package not installed. Run: pip install google-genai")
    sys.exit(1)

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow package not installed. Run: pip install Pillow")
    sys.exit(1)

# ----- Timeouts -----

IMAGE_TIMEOUT = 60       # seconds per image API call
MAX_RETRIES = 2          # max retries per image
GLOBAL_TIMEOUT = 600     # 10 minutes total for all image generation
_global_start = None

# ----- Config -----

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
BLOG_CONTENT_DIR = os.path.join(PROJECT_DIR, "content", "blog")
PUBLIC_BLOG_DIR = os.path.join(PROJECT_DIR, "public", "blog")

MODEL = "gemini-2.5-flash-image"

# Newbi brand palette
PALETTE_DESCRIPTION = (
    "Color palette: primary purple #5a50ff, secondary lighter purple #8b7fff, "
    "white backgrounds, light gray #f8f7ff accents, soft purple gradients. "
    "No dark backgrounds."
)

BASE_STYLE = (
    "Flat illustration style, minimal, professional, clean lines, geometric shapes, "
    "modern SaaS aesthetic, no text in image, no watermarks, no logos, "
    "soft shadows, rounded corners feel. " + PALETTE_DESCRIPTION
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
    # Also check frontmatter image field
    fm = parse_frontmatter(content)
    if fm.get("image"):
        img_path = fm["image"]
        basename = img_path.split("/")[-1]
        if basename not in matches:
            matches.insert(0, basename)
    # De-duplicate while preserving order
    seen = set()
    unique = []
    for m in matches:
        if m not in seen:
            seen.add(m)
            unique.append(m)
    return unique


def build_prompt(slug, frontmatter, image_name, article_body):
    """Build a Gemini prompt for a specific image in the article."""
    title = frontmatter.get("title", slug.replace("-", " "))
    keyword = frontmatter.get("keyword", "")
    category = frontmatter.get("category", "")
    sector = frontmatter.get("sector", "")

    context_parts = [f"Article: \"{title}\""]
    if keyword:
        context_parts.append(f"Keyword: {keyword}")
    if sector:
        context_parts.append(f"Industry: {sector}")
    if category:
        context_parts.append(f"Category: {category}")

    context = ". ".join(context_parts)

    # Determine image type from filename
    name_lower = image_name.lower().replace(".webp", "").replace(".svg", "")

    if name_lower == "hero":
        prompt = (
            f"{BASE_STYLE} "
            f"Create a wide hero illustration for a French business blog article. "
            f"{context}. "
            f"Show an abstract, professional scene that represents the topic. "
            f"Wide composition suitable for 16:9 banner. "
            f"Evoke trust, simplicity, and modern business tools."
        )
    elif "section" in name_lower:
        # Extract surrounding context from article body
        excerpt = _extract_section_context(article_body, 1)
        prompt = (
            f"{BASE_STYLE} "
            f"Create an illustration for a section of a French business article. "
            f"{context}. "
            f"Section context: {excerpt}. "
            f"Show a clear, focused diagram or scene related to this section. "
            f"4:3 aspect ratio, informative yet visually appealing."
        )
    elif "comparatif" in name_lower or "comparaison" in name_lower:
        prompt = (
            f"{BASE_STYLE} "
            f"Create an illustration showing a comparison or side-by-side analysis. "
            f"{context}. "
            f"Show abstract representations of comparing two options, with balance scales, "
            f"side-by-side cards, or comparison charts. 4:3 aspect ratio."
        )
    elif "dashboard" in name_lower:
        prompt = (
            f"{BASE_STYLE} "
            f"Create an illustration of a modern SaaS dashboard interface mockup. "
            f"{context}. "
            f"Show a clean, minimal dashboard with charts, metrics cards, and navigation. "
            f"Purple accent color (#5a50ff). 4:3 aspect ratio."
        )
    elif "workflow" in name_lower or "etape" in name_lower:
        prompt = (
            f"{BASE_STYLE} "
            f"Create an illustration of a step-by-step workflow or process. "
            f"{context}. "
            f"Show connected steps with arrows, numbered stages, or a flowchart. "
            f"4:3 aspect ratio."
        )
    elif "checklist" in name_lower:
        prompt = (
            f"{BASE_STYLE} "
            f"Create an illustration of a checklist or verification process. "
            f"{context}. "
            f"Show a stylized checklist with checkmarks, completed items, and a clean layout. "
            f"4:3 aspect ratio."
        )
    elif "exemple" in name_lower or "modele" in name_lower:
        prompt = (
            f"{BASE_STYLE} "
            f"Create an illustration of a document template or example. "
            f"{context}. "
            f"Show a stylized document with fields, lines, and professional formatting. "
            f"4:3 aspect ratio."
        )
    elif "seuil" in name_lower or "tva" in name_lower or "fiscal" in name_lower:
        prompt = (
            f"{BASE_STYLE} "
            f"Create an illustration about tax thresholds or fiscal regulations. "
            f"{context}. "
            f"Show abstract representations of financial thresholds, scales, or regulatory elements. "
            f"4:3 aspect ratio."
        )
    elif "transaction" in name_lower or "bancaire" in name_lower or "tresorerie" in name_lower:
        prompt = (
            f"{BASE_STYLE} "
            f"Create an illustration about financial transactions or banking. "
            f"{context}. "
            f"Show abstract bank connections, money flows, or financial overview. "
            f"4:3 aspect ratio."
        )
    elif "preparation" in name_lower or "migration" in name_lower:
        prompt = (
            f"{BASE_STYLE} "
            f"Create an illustration about preparing or migrating to a new system. "
            f"{context}. "
            f"Show a transition, upgrade, or preparation process with arrows and stages. "
            f"4:3 aspect ratio."
        )
    else:
        # Generic fallback based on filename
        readable_name = name_lower.replace("-", " ").replace("_", " ")
        prompt = (
            f"{BASE_STYLE} "
            f"Create a professional illustration for a French business article section. "
            f"{context}. "
            f"Image topic: {readable_name}. "
            f"4:3 aspect ratio."
        )

    return prompt


def _extract_section_context(body, section_index):
    """Extract a text excerpt around the Nth section heading."""
    # Find ## headings
    headings = list(re.finditer(r"^## .+$", body, re.MULTILINE))
    if section_index < len(headings):
        start = headings[section_index].start()
        # Get up to 300 chars after heading
        excerpt = body[start : start + 300].strip()
        # Clean MDX syntax
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
        print(f"  GLOBAL TIMEOUT: {int(elapsed)}s elapsed (limit: {GLOBAL_TIMEOUT}s). Stopping image generation.")
        return True
    return False


def _call_gemini_with_timeout(client, prompt, aspect_ratio, timeout=IMAGE_TIMEOUT):
    """Call Gemini API with a thread-based timeout. Returns response or raises TimeoutError."""
    result = [None]
    error = [None]

    def _call():
        try:
            result[0] = client.models.generate_content(
                model=MODEL,
                contents=[prompt],
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE"],
                    image_config=types.ImageConfig(
                        aspect_ratio=aspect_ratio,
                    ),
                ),
            )
        except Exception as e:
            error[0] = e

    thread = threading.Thread(target=_call, daemon=True)
    thread.start()
    thread.join(timeout=timeout)

    if thread.is_alive():
        raise TimeoutError(f"Gemini API call timed out after {timeout}s")

    if error[0]:
        raise error[0]

    return result[0]


def generate_image(client, prompt, output_path, aspect_ratio):
    """Generate an image using Gemini API and save as WebP with retry."""
    basename = os.path.basename(output_path)

    for attempt in range(MAX_RETRIES):
        if _check_global_timeout():
            print(f"  SKIP (global timeout): {basename}")
            return False

        print(f"  [{basename}] attempt {attempt + 1}/{MAX_RETRIES} — calling Gemini (timeout {IMAGE_TIMEOUT}s)...")
        t0 = time.time()

        try:
            response = _call_gemini_with_timeout(client, prompt, aspect_ratio, IMAGE_TIMEOUT)
            elapsed = time.time() - t0
            print(f"  [{basename}] response received in {elapsed:.1f}s")

            if not response.candidates or not response.candidates[0].content.parts:
                print(f"  [{basename}] WARNING: empty response (no candidates/parts)")
                return False

            for part in response.candidates[0].content.parts:
                if part.inline_data:
                    img = Image.open(io.BytesIO(part.inline_data.data))
                    os.makedirs(os.path.dirname(output_path), exist_ok=True)
                    img.save(output_path, "WEBP", quality=85)
                    print(f"  [{basename}] SAVED ({os.path.getsize(output_path)} bytes)")
                    return True

            print(f"  [{basename}] WARNING: response had parts but no inline_data")
            return False

        except TimeoutError:
            print(f"  [{basename}] TIMEOUT after {IMAGE_TIMEOUT}s — skipping")
            return False

        except Exception as e:
            elapsed = time.time() - t0
            error_str = str(e)
            print(f"  [{basename}] ERROR after {elapsed:.1f}s: {error_str[:200]}")

            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                wait = min(30 * (attempt + 1), 60)
                print(f"  [{basename}] Rate limited, retrying in {wait}s...")
                time.sleep(wait)
                continue
            if "not available in your country" in error_str.lower():
                print(f"  FATAL: Image generation not available in this region. Aborting all.")
                sys.exit(0)
            # Other error — skip this image
            return False

    print(f"  [{basename}] FAILED after {MAX_RETRIES} retries — skipping")
    return False


def process_article(slug, api_key, force=False):
    """Generate all images for a single article."""
    mdx_path = os.path.join(BLOG_CONTENT_DIR, f"{slug}.mdx")
    if not os.path.exists(mdx_path):
        print(f"Error: MDX file not found: {mdx_path}")
        return False

    with open(mdx_path, "r", encoding="utf-8") as f:
        content = f.read()

    frontmatter = parse_frontmatter(content)
    # Strip frontmatter for body
    body = re.sub(r"^---\s*\n.*?\n---\s*\n", "", content, flags=re.DOTALL)
    # Strip import lines
    body = "\n".join(
        line for line in body.split("\n") if not line.strip().startswith("import ")
    )

    image_refs = find_image_refs(content, slug)
    if not image_refs:
        print(f"No image references found in {slug}.mdx")
        return True

    print(f"\nProcessing: {slug}")
    print(f"  Title: {frontmatter.get('title', 'N/A')}")
    print(f"  Images to generate: {len(image_refs)}")

    client = genai.Client(api_key=api_key)
    output_dir = os.path.join(PUBLIC_BLOG_DIR, slug)
    os.makedirs(output_dir, exist_ok=True)

    generated = 0
    skipped = 0
    for img_name in image_refs:
        if _check_global_timeout():
            skipped += len(image_refs) - generated - skipped
            break

        # Normalize extension to .webp
        base = os.path.splitext(img_name)[0]
        webp_name = f"{base}.webp"
        output_path = os.path.join(output_dir, webp_name)

        if os.path.exists(output_path) and not force:
            print(f"  [{webp_name}] EXISTS — skipping")
            generated += 1
            continue

        is_hero = "hero" in base.lower()
        aspect_ratio = "16:9" if is_hero else "4:3"

        prompt = build_prompt(slug, frontmatter, img_name, body)
        success = generate_image(client, prompt, output_path, aspect_ratio)
        if success:
            generated += 1
        else:
            skipped += 1

        # Rate limiting — avoid hitting API quotas
        time.sleep(2)

    print(f"  Result: {generated}/{len(image_refs)} generated, {skipped} skipped")
    return True  # Always continue — don't block publishing because of image failures


def main():
    parser = argparse.ArgumentParser(
        description="Generate blog illustrations using Gemini Image API"
    )
    parser.add_argument("slugs", nargs="+", help="Article slug(s) to generate images for")
    parser.add_argument(
        "--api-key", help="Google API key (or set GOOGLE_API_KEY env var)"
    )
    parser.add_argument(
        "--force", action="store_true", help="Regenerate even if images exist"
    )

    args = parser.parse_args()

    api_key = args.api_key or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("Error: No API key provided.")
        print("  Use --api-key KEY or set GOOGLE_API_KEY environment variable.")
        sys.exit(1)

    global _global_start
    _global_start = time.time()

    print("=" * 60)
    print("Newbi Blog Image Generator")
    print(f"  Model: {MODEL}")
    print(f"  Articles: {len(args.slugs)}")
    print(f"  Timeout per image: {IMAGE_TIMEOUT}s")
    print(f"  Max retries: {MAX_RETRIES}")
    print(f"  Global timeout: {GLOBAL_TIMEOUT}s ({GLOBAL_TIMEOUT // 60}min)")
    print("=" * 60, flush=True)

    for slug in args.slugs:
        if _check_global_timeout():
            print(f"\nSkipping remaining articles due to global timeout.")
            break
        process_article(slug, api_key, force=args.force)

    elapsed = time.time() - _global_start
    print(f"\nDone in {int(elapsed)}s.")
    sys.stdout.flush()
    # Force-exit to kill any lingering daemon threads (hanging API calls)
    os._exit(0)


if __name__ == "__main__":
    main()
