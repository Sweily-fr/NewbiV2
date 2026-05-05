import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- Hoisted mocks --------------------------------------------------------
const { apolloClientMock } = vi.hoisted(() => ({
  apolloClientMock: {
    mutate: vi.fn(),
    query: vi.fn(),
  },
}));

vi.mock("@apollo/client", () => ({
  // gql tag — return the template string array as-is so we can recognize it
  gql: (strings) => ({ __isGql: true, source: strings.join("") }),
}));

vi.mock("@/src/lib/apolloClient", () => ({
  apolloClient: apolloClientMock,
}));

// Import AFTER mocks
import {
  CloudflareImageService,
  UPLOAD_SIGNATURE_IMAGE,
  DELETE_SIGNATURE_IMAGE,
  GENERATE_SIGNED_IMAGE_URL,
  GET_IMAGE_URL,
} from "@/src/lib/graphql/imageUpload";

const makeFile = (name = "x.png", size = 1024, type = "image/png") => {
  const f = new File(["x"], name, { type });
  Object.defineProperty(f, "size", { value: size });
  return f;
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  apolloClientMock.mutate.mockReset();
  apolloClientMock.query.mockReset();
});

// ---------------------------------------------------------------------------
// gql exports
// ---------------------------------------------------------------------------
describe("GraphQL document exports", () => {
  it("UPLOAD_SIGNATURE_IMAGE is a gql document", () => {
    expect(UPLOAD_SIGNATURE_IMAGE.__isGql).toBe(true);
    expect(UPLOAD_SIGNATURE_IMAGE.source).toMatch(/uploadSignatureImage/);
  });

  it("DELETE_SIGNATURE_IMAGE is a gql document", () => {
    expect(DELETE_SIGNATURE_IMAGE.__isGql).toBe(true);
    expect(DELETE_SIGNATURE_IMAGE.source).toMatch(/deleteSignatureImage/);
  });

  it("GENERATE_SIGNED_IMAGE_URL is a gql document", () => {
    expect(GENERATE_SIGNED_IMAGE_URL.__isGql).toBe(true);
    expect(GENERATE_SIGNED_IMAGE_URL.source).toMatch(/generateSignedImageUrl/);
  });

  it("GET_IMAGE_URL is a gql document", () => {
    expect(GET_IMAGE_URL.__isGql).toBe(true);
    expect(GET_IMAGE_URL.source).toMatch(/getImageUrl/);
  });
});

// ---------------------------------------------------------------------------
// uploadImage
// ---------------------------------------------------------------------------
describe("CloudflareImageService.uploadImage", () => {
  it("throws when no file provided", async () => {
    await expect(
      CloudflareImageService.uploadImage(null, "imgProfil", "sig-1"),
    ).rejects.toThrow(/Aucun fichier/);
  });

  it("throws when signatureId is missing", async () => {
    await expect(
      CloudflareImageService.uploadImage(makeFile(), "imgProfil"),
    ).rejects.toThrow(/signatureId/);
  });

  it("throws on invalid imageType", async () => {
    await expect(
      CloudflareImageService.uploadImage(makeFile(), "bogus", "sig-1"),
    ).rejects.toThrow(/Type d'image invalide/);
  });

  it("throws when file type is unsupported", async () => {
    const file = makeFile("a.pdf", 1024, "application/pdf");
    await expect(
      CloudflareImageService.uploadImage(file, "imgProfil", "sig-1"),
    ).rejects.toThrow(/Format d'image non supporté/);
  });

  it("throws when file too large", async () => {
    const file = makeFile("big.png", 6 * 1024 * 1024, "image/png");
    await expect(
      CloudflareImageService.uploadImage(file, "imgProfil", "sig-1"),
    ).rejects.toThrow(/trop volumineuse/);
  });

  it("returns success payload and reports progress on happy path", async () => {
    apolloClientMock.mutate.mockResolvedValue({
      data: {
        uploadSignatureImage: {
          success: true,
          key: "k-1",
          url: "https://cdn/x.png",
          contentType: "image/png",
          message: "ok",
        },
      },
      errors: undefined,
    });

    const onProgress = vi.fn();
    const out = await CloudflareImageService.uploadImage(
      makeFile(),
      "imgProfil",
      "sig-1",
      onProgress,
    );
    expect(out).toMatchObject({
      success: true,
      key: "k-1",
      url: "https://cdn/x.png",
      contentType: "image/png",
    });
    expect(onProgress).toHaveBeenCalledWith(10);
    expect(onProgress).toHaveBeenCalledWith(100);
  });

  it("works with all valid imageType values", async () => {
    apolloClientMock.mutate.mockResolvedValue({
      data: {
        uploadSignatureImage: {
          success: true,
          key: "k",
          url: "u",
          contentType: "image/png",
          message: "ok",
        },
      },
    });
    for (const t of ["imgProfil", "logoReseau", "banner"]) {
      const out = await CloudflareImageService.uploadImage(
        makeFile(),
        t,
        "sig-1",
      );
      expect(out.success).toBe(true);
    }
  });

  it("throws on GraphQL errors[]", async () => {
    apolloClientMock.mutate.mockResolvedValue({
      data: null,
      errors: [{ message: "Bad input" }],
    });
    await expect(
      CloudflareImageService.uploadImage(makeFile(), "imgProfil", "sig-1"),
    ).rejects.toThrow(/Bad input/);
  });

  it("throws when response data missing", async () => {
    apolloClientMock.mutate.mockResolvedValue({ data: null });
    await expect(
      CloudflareImageService.uploadImage(makeFile(), "imgProfil", "sig-1"),
    ).rejects.toThrow(/Réponse GraphQL invalide/);
  });

  it("throws when uploadSignatureImage.success=false", async () => {
    apolloClientMock.mutate.mockResolvedValue({
      data: {
        uploadSignatureImage: {
          success: false,
          message: "Quota exceeded",
        },
      },
    });
    await expect(
      CloudflareImageService.uploadImage(makeFile(), "imgProfil", "sig-1"),
    ).rejects.toThrow(/Quota exceeded/);
  });
});

// ---------------------------------------------------------------------------
// getImageUrl
// ---------------------------------------------------------------------------
describe("CloudflareImageService.getImageUrl", () => {
  it("throws when key is missing", async () => {
    await expect(CloudflareImageService.getImageUrl()).rejects.toThrow(
      /Clé d'image requise/,
    );
  });

  it("returns url and key on success", async () => {
    apolloClientMock.query.mockResolvedValue({
      data: {
        getImageUrl: {
          success: true,
          url: "https://cdn/k.png",
          key: "k-1",
        },
      },
    });
    const out = await CloudflareImageService.getImageUrl("k-1");
    expect(out).toEqual({
      success: true,
      url: "https://cdn/k.png",
      key: "k-1",
    });
  });

  it("throws when getImageUrl.success=false", async () => {
    apolloClientMock.query.mockResolvedValue({
      data: { getImageUrl: { success: false, message: "Not found" } },
    });
    await expect(CloudflareImageService.getImageUrl("missing")).rejects.toThrow(
      /Not found/,
    );
  });

  it("throws when query rejects", async () => {
    apolloClientMock.query.mockRejectedValue(new Error("network"));
    await expect(CloudflareImageService.getImageUrl("k")).rejects.toThrow(
      /network/,
    );
  });
});

// ---------------------------------------------------------------------------
// deleteImage
// ---------------------------------------------------------------------------
describe("CloudflareImageService.deleteImage", () => {
  it("throws when key is missing", async () => {
    await expect(CloudflareImageService.deleteImage()).rejects.toThrow(
      /Clé d'image requise/,
    );
  });

  it("returns success on delete", async () => {
    apolloClientMock.mutate.mockResolvedValue({
      data: { deleteSignatureImage: { success: true, message: "deleted" } },
    });
    const out = await CloudflareImageService.deleteImage("k-1");
    expect(out).toEqual({ success: true, message: "deleted" });
  });

  it("throws when delete returns success=false", async () => {
    apolloClientMock.mutate.mockResolvedValue({
      data: { deleteSignatureImage: { success: false, message: "no such" } },
    });
    await expect(CloudflareImageService.deleteImage("k")).rejects.toThrow(
      /no such/,
    );
  });

  it("throws when mutate rejects", async () => {
    apolloClientMock.mutate.mockRejectedValue(new Error("server"));
    await expect(CloudflareImageService.deleteImage("k")).rejects.toThrow(
      /server/,
    );
  });
});

// ---------------------------------------------------------------------------
// generateSignedUrl
// ---------------------------------------------------------------------------
describe("CloudflareImageService.generateSignedUrl", () => {
  it("throws when key is missing", async () => {
    await expect(CloudflareImageService.generateSignedUrl()).rejects.toThrow(
      /Clé d'image requise/,
    );
  });

  it("returns url and expiresIn on success (default)", async () => {
    apolloClientMock.mutate.mockResolvedValue({
      data: {
        generateSignedImageUrl: {
          success: true,
          url: "https://cdn/signed",
          expiresIn: 3600,
        },
      },
    });
    const out = await CloudflareImageService.generateSignedUrl("k-1");
    expect(out).toEqual({
      success: true,
      url: "https://cdn/signed",
      expiresIn: 3600,
    });
    // Verify default expiresIn=3600 forwarded
    expect(apolloClientMock.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { key: "k-1", expiresIn: 3600 },
      }),
    );
  });

  it("forwards a custom expiresIn", async () => {
    apolloClientMock.mutate.mockResolvedValue({
      data: {
        generateSignedImageUrl: {
          success: true,
          url: "https://cdn/signed",
          expiresIn: 60,
        },
      },
    });
    await CloudflareImageService.generateSignedUrl("k-1", 60);
    expect(apolloClientMock.mutate.mock.calls[0][0].variables.expiresIn).toBe(
      60,
    );
  });

  it("throws when success=false", async () => {
    apolloClientMock.mutate.mockResolvedValue({
      data: {
        generateSignedImageUrl: { success: false, message: "denied" },
      },
    });
    await expect(CloudflareImageService.generateSignedUrl("k")).rejects.toThrow(
      /denied/,
    );
  });

  it("throws when mutate rejects", async () => {
    apolloClientMock.mutate.mockRejectedValue(new Error("net"));
    await expect(CloudflareImageService.generateSignedUrl("k")).rejects.toThrow(
      /net/,
    );
  });
});
