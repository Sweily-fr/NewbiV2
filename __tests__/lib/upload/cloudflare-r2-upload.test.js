import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validateImageFileForR2,
  uploadToCloudflareR2,
  deleteFromCloudflareR2,
} from "@/src/lib/upload/cloudflare-r2-upload";

function makeFile({ type = "image/png", size = 1024, name = "x.png" } = {}) {
  return { name, type, size };
}

// ─── validateImageFileForR2 ──────────────────────────────────────────────────

describe("validateImageFileForR2", () => {
  it("rejects null/undefined", () => {
    expect(validateImageFileForR2(null)).toEqual({
      isValid: false,
      error: "Aucun fichier sélectionné",
    });
    expect(validateImageFileForR2(undefined).isValid).toBe(false);
  });

  it.each(["image/jpeg", "image/png", "image/webp", "image/gif"])(
    "accepts %s files",
    (type) => {
      expect(validateImageFileForR2(makeFile({ type }))).toEqual({
        isValid: true,
      });
    },
  );

  it.each([
    "application/pdf",
    "image/svg+xml",
    "image/bmp",
    "video/mp4",
    "text/plain",
  ])("rejects unsupported %s", (type) => {
    const result = validateImageFileForR2(makeFile({ type }));
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/Type de fichier non supporté/);
  });

  it("rejects files larger than 5MB", () => {
    const result = validateImageFileForR2(
      makeFile({ size: 5 * 1024 * 1024 + 1 }),
    );
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/trop volumineux/);
    expect(result.error).toContain("5MB");
  });

  it("accepts files exactly at the 5MB boundary", () => {
    expect(validateImageFileForR2(makeFile({ size: 5 * 1024 * 1024 }))).toEqual(
      {
        isValid: true,
      },
    );
  });
});

// ─── uploadToCloudflareR2 ────────────────────────────────────────────────────

describe("uploadToCloudflareR2", () => {
  let onProgress;
  let uploadMutation;

  beforeEach(() => {
    onProgress = vi.fn();
    uploadMutation = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns URL/key/fileName on a successful upload", async () => {
    uploadMutation.mockResolvedValue({
      data: {
        uploadDocument: {
          success: true,
          url: "https://r2/foo.png",
          key: "users/u1/foo.png",
          fileName: "foo.png",
        },
      },
    });

    const result = await uploadToCloudflareR2(
      makeFile(),
      uploadMutation,
      onProgress,
    );
    expect(result).toEqual({
      url: "https://r2/foo.png",
      key: "users/u1/foo.png",
      fileName: "foo.png",
    });
    expect(onProgress).toHaveBeenCalledWith(10);
    expect(onProgress).toHaveBeenCalledWith(100);
    expect(uploadMutation).toHaveBeenCalledWith({
      variables: { file: expect.objectContaining({ type: "image/png" }) },
    });
  });

  it("throws when validation fails before calling the mutation", async () => {
    await expect(
      uploadToCloudflareR2(makeFile({ type: "video/mp4" }), uploadMutation),
    ).rejects.toThrow(/Type de fichier non supporté/);
    expect(uploadMutation).not.toHaveBeenCalled();
  });

  it("throws when the upload mutation returns success=false", async () => {
    uploadMutation.mockResolvedValue({
      data: {
        uploadDocument: { success: false, message: "Quota dépassé" },
      },
    });

    await expect(
      uploadToCloudflareR2(makeFile(), uploadMutation),
    ).rejects.toThrow("Quota dépassé");
  });

  it("uses a default error when no message is provided", async () => {
    uploadMutation.mockResolvedValue({
      data: { uploadDocument: { success: false } },
    });
    await expect(
      uploadToCloudflareR2(makeFile(), uploadMutation),
    ).rejects.toThrow(/Erreur lors de l'upload/);
  });

  it("rethrows mutation errors with a friendly fallback message", async () => {
    uploadMutation.mockRejectedValue(new Error("Network error"));
    await expect(
      uploadToCloudflareR2(makeFile(), uploadMutation),
    ).rejects.toThrow("Network error");
  });

  it("does not require an onProgress callback", async () => {
    uploadMutation.mockResolvedValue({
      data: {
        uploadDocument: { success: true, url: "u", key: "k", fileName: "n" },
      },
    });
    await expect(
      uploadToCloudflareR2(makeFile(), uploadMutation),
    ).resolves.toEqual(expect.objectContaining({ url: "u" }));
  });
});

// ─── deleteFromCloudflareR2 ──────────────────────────────────────────────────

describe("deleteFromCloudflareR2", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns true (currently a no-op stub)", async () => {
    expect(await deleteFromCloudflareR2("k", "u1")).toBe(true);
  });
});
