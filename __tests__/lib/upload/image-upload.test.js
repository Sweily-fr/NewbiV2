import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const makeFile = (name = "x.png", size = 1024, type = "image/png") => {
  const f = new File(["x"], name, { type });
  Object.defineProperty(f, "size", { value: size });
  return f;
};

// ---------------------------------------------------------------------------
// validateImageFile
// ---------------------------------------------------------------------------
describe("validateImageFile", () => {
  it("returns isValid=false with message when file is null/undefined", async () => {
    const { validateImageFile } = await import("@/src/lib/upload/image-upload");
    expect(validateImageFile(null)).toEqual({
      isValid: false,
      error: "Aucun fichier sélectionné",
    });
    expect(validateImageFile(undefined).isValid).toBe(false);
  });

  it("rejects unsupported file types", async () => {
    const { validateImageFile } = await import("@/src/lib/upload/image-upload");
    const out = validateImageFile(makeFile("a.pdf", 1024, "application/pdf"));
    expect(out.isValid).toBe(false);
    expect(out.error).toMatch(/Type/);
  });

  it("accepts all four supported image types", async () => {
    const { validateImageFile } = await import("@/src/lib/upload/image-upload");
    for (const t of ["image/jpeg", "image/png", "image/webp", "image/gif"]) {
      expect(validateImageFile(makeFile("a", 1024, t)).isValid).toBe(true);
    }
  });

  it("rejects files larger than 5MB", async () => {
    const { validateImageFile } = await import("@/src/lib/upload/image-upload");
    const out = validateImageFile(makeFile("big.png", 6 * 1024 * 1024));
    expect(out.isValid).toBe(false);
    expect(out.error).toMatch(/volumineux/);
  });

  it("accepts files at exactly the 5MB boundary", async () => {
    const { validateImageFile } = await import("@/src/lib/upload/image-upload");
    expect(validateImageFile(makeFile("ok.png", 5 * 1024 * 1024)).isValid).toBe(
      true,
    );
  });
});

// ---------------------------------------------------------------------------
// uploadToCloudinary (config missing)
// ---------------------------------------------------------------------------
describe("uploadToCloudinary", () => {
  it("throws when Cloudinary config is missing", async () => {
    vi.resetModules();
    delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    delete process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const { uploadToCloudinary } =
      await import("@/src/lib/upload/image-upload");
    await expect(uploadToCloudinary(makeFile())).rejects.toThrow(
      /Configuration Cloudinary/,
    );
  });

  it("uploads to Cloudinary and returns secure_url when configured", async () => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "myCloud";
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET = "myPreset";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi
          .fn()
          .mockResolvedValue({ secure_url: "https://cdn.example/x.png" }),
      }),
    );

    const { uploadToCloudinary } =
      await import("@/src/lib/upload/image-upload");
    const out = await uploadToCloudinary(makeFile("img.png", 1000));
    expect(out).toBe("https://cdn.example/x.png");
    expect(fetch).toHaveBeenCalledWith(
      "https://api.cloudinary.com/v1_1/myCloud/image/upload",
      expect.objectContaining({ method: "POST" }),
    );

    // Cleanup env
    delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    delete process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  });

  it("throws when Cloudinary returns a non-ok response", async () => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "myCloud";
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET = "myPreset";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );

    const { uploadToCloudinary } =
      await import("@/src/lib/upload/image-upload");
    await expect(uploadToCloudinary(makeFile())).rejects.toThrow(
      /Échec de l'upload/,
    );

    delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    delete process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  });

  it("throws when fetch itself rejects", async () => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "myCloud";
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET = "myPreset";

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("dns")));

    const { uploadToCloudinary } =
      await import("@/src/lib/upload/image-upload");
    await expect(uploadToCloudinary(makeFile())).rejects.toThrow(
      /Échec de l'upload/,
    );

    delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    delete process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  });
});

// ---------------------------------------------------------------------------
// uploadSimulated
// ---------------------------------------------------------------------------
describe("uploadSimulated", () => {
  it("resolves to a base64 data URL and reports progress", async () => {
    const { uploadSimulated } = await import("@/src/lib/upload/image-upload");
    const file = new File(["abc"], "f.png", { type: "image/png" });
    const onProgress = vi.fn();
    const out = await uploadSimulated(file, onProgress);
    expect(typeof out).toBe("string");
    expect(out.startsWith("data:")).toBe(true);
    expect(onProgress).toHaveBeenCalled();
    // Final progress should reach 100
    const lastCall = onProgress.mock.calls.at(-1)[0];
    expect(lastCall).toBeGreaterThanOrEqual(100);
  });

  it("works without an onProgress callback (default no-op)", async () => {
    const { uploadSimulated } = await import("@/src/lib/upload/image-upload");
    const file = new File(["xyz"], "g.png", { type: "image/png" });
    const out = await uploadSimulated(file);
    expect(out.startsWith("data:")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// uploadImage (main entry)
// ---------------------------------------------------------------------------
describe("uploadImage", () => {
  it("rejects invalid file type before uploading", async () => {
    vi.resetModules();
    delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    delete process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const { uploadImage } = await import("@/src/lib/upload/image-upload");
    await expect(
      uploadImage(makeFile("doc.pdf", 1024, "application/pdf")),
    ).rejects.toThrow(/Type/);
  });

  it("rejects too-large files", async () => {
    vi.resetModules();
    const { uploadImage } = await import("@/src/lib/upload/image-upload");
    await expect(
      uploadImage(makeFile("big.png", 10 * 1024 * 1024)),
    ).rejects.toThrow(/volumineux/);
  });

  it("falls back to simulated upload when Cloudinary not configured", async () => {
    vi.resetModules();
    delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    delete process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const { uploadImage } = await import("@/src/lib/upload/image-upload");
    const file = new File(["data"], "img.png", { type: "image/png" });
    const out = await uploadImage(file);
    expect(typeof out).toBe("string");
    expect(out.startsWith("data:")).toBe(true);
    expect(console.warn).toHaveBeenCalled();
  });

  it("delegates to Cloudinary when configured", async () => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "myCloud";
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET = "myPreset";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi
          .fn()
          .mockResolvedValue({ secure_url: "https://cdn.example/y.png" }),
      }),
    );

    const { uploadImage } = await import("@/src/lib/upload/image-upload");
    const out = await uploadImage(
      new File(["data"], "img.png", { type: "image/png" }),
    );
    expect(out).toBe("https://cdn.example/y.png");
    expect(fetch).toHaveBeenCalled();

    delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    delete process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  });
});

// ---------------------------------------------------------------------------
// resizeImage
// ---------------------------------------------------------------------------
describe("resizeImage", () => {
  it("rejects when image fails to load", async () => {
    const { resizeImage } = await import("@/src/lib/upload/image-upload");

    // Stub URL.createObjectURL
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:fake"),
    });

    // Replace Image to trigger onerror immediately
    const ImageOriginal = globalThis.Image;
    class FakeImage {
      constructor() {
        setTimeout(() => this.onerror && this.onerror(), 0);
      }
    }
    vi.stubGlobal("Image", FakeImage);

    const file = new File(["data"], "x.png", { type: "image/png" });
    await expect(resizeImage(file)).rejects.toThrow(/chargement/);

    vi.stubGlobal("Image", ImageOriginal);
  });

  it("resolves with a resized File when canvas yields a blob", async () => {
    const { resizeImage } = await import("@/src/lib/upload/image-upload");

    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:fake"),
    });

    // Fake Image: triggers onload with width/height that fits within bounds
    class FakeImage {
      constructor() {
        this.width = 800;
        this.height = 400;
        setTimeout(() => this.onload && this.onload(), 0);
      }
    }
    vi.stubGlobal("Image", FakeImage);

    // Stub canvas.toBlob via document.createElement
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      if (tag === "canvas") {
        return {
          width: 0,
          height: 0,
          getContext: () => ({ drawImage: vi.fn() }),
          toBlob: (cb) => cb(new Blob(["resized"], { type: "image/png" })),
        };
      }
      return realCreate(tag);
    });

    const file = new File(["data"], "x.png", { type: "image/png" });
    const out = await resizeImage(file, 400, 400, 0.8);
    expect(out).toBeInstanceOf(File);
    expect(out.name).toBe("x.png");
    expect(out.type).toBe("image/png");
  });

  it("rejects when canvas.toBlob produces no blob", async () => {
    const { resizeImage } = await import("@/src/lib/upload/image-upload");

    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:fake"),
    });

    class FakeImage {
      constructor() {
        this.width = 100;
        this.height = 800;
        setTimeout(() => this.onload && this.onload(), 0);
      }
    }
    vi.stubGlobal("Image", FakeImage);

    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      if (tag === "canvas") {
        return {
          width: 0,
          height: 0,
          getContext: () => ({ drawImage: vi.fn() }),
          toBlob: (cb) => cb(null),
        };
      }
      return realCreate(tag);
    });

    const file = new File(["data"], "x.png", { type: "image/png" });
    await expect(resizeImage(file)).rejects.toThrow(/redimensionnement/);
  });
});
