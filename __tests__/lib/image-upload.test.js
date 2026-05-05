import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validateImageFile,
  uploadToCloudinary,
  uploadSimulated,
  uploadImage,
} from "@/src/lib/upload/image-upload";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

const makeFile = (name = "x.png", size = 1024, type = "image/png") => {
  const f = new File(["x"], name, { type });
  Object.defineProperty(f, "size", { value: size });
  return f;
};

describe("validateImageFile", () => {
  it("returns isValid=false when no file", () => {
    expect(validateImageFile(null).isValid).toBe(false);
    expect(validateImageFile(undefined).isValid).toBe(false);
  });

  it("rejects unsupported file types", () => {
    const out = validateImageFile(makeFile("doc.pdf", 1024, "application/pdf"));
    expect(out.isValid).toBe(false);
    expect(out.error).toMatch(/Type/);
  });

  it("accepts JPG/PNG/WebP/GIF", () => {
    expect(
      validateImageFile(makeFile("a.jpg", 1024, "image/jpeg")).isValid,
    ).toBe(true);
    expect(
      validateImageFile(makeFile("a.png", 1024, "image/png")).isValid,
    ).toBe(true);
    expect(
      validateImageFile(makeFile("a.webp", 1024, "image/webp")).isValid,
    ).toBe(true);
    expect(
      validateImageFile(makeFile("a.gif", 1024, "image/gif")).isValid,
    ).toBe(true);
  });

  it("rejects files > 5MB", () => {
    const big = makeFile("big.png", 6 * 1024 * 1024, "image/png");
    const out = validateImageFile(big);
    expect(out.isValid).toBe(false);
    expect(out.error).toMatch(/volumineux/);
  });

  it("accepts files exactly at the 5MB boundary", () => {
    const exact = makeFile("ok.png", 5 * 1024 * 1024, "image/png");
    expect(validateImageFile(exact).isValid).toBe(true);
  });
});

describe("uploadSimulated", () => {
  it("resolves to a base64 data URL", async () => {
    const file = new File(["abc"], "f.png", { type: "image/png" });
    const onProgress = vi.fn();
    const out = await uploadSimulated(file, onProgress);
    expect(typeof out).toBe("string");
    expect(out.startsWith("data:")).toBe(true);
    // Progress should have been called multiple times
    expect(onProgress.mock.calls.length).toBeGreaterThan(0);
  });
});

describe("uploadToCloudinary", () => {
  it("throws when Cloudinary config missing", async () => {
    // Default test env has no cloudinary config
    await expect(uploadToCloudinary(makeFile())).rejects.toThrow(
      /Configuration Cloudinary/,
    );
  });
});

describe("uploadImage (main entry point)", () => {
  it("rejects invalid files before attempting upload", async () => {
    const bad = makeFile("doc.pdf", 1024, "application/pdf");
    await expect(uploadImage(bad)).rejects.toThrow(/Type/);
  });

  it("falls back to uploadSimulated when Cloudinary not configured", async () => {
    const file = new File(["data"], "img.png", { type: "image/png" });
    const onProgress = vi.fn();
    const out = await uploadImage(file, onProgress);
    expect(typeof out).toBe("string");
    expect(out.startsWith("data:")).toBe(true);
  });

  it("propagates validation errors with their message", async () => {
    const big = makeFile("big.png", 10 * 1024 * 1024, "image/png");
    await expect(uploadImage(big)).rejects.toThrow(/volumineux/);
  });
});
