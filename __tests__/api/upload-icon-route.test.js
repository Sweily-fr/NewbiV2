// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { detectRasterImageType } from "@/src/lib/security/raster-image";

/**
 * Upload d'icône personnalisée : 1 Mo maximum, PNG/JPEG/GIF/WebP reconnus à
 * leur signature, SVG refusé, chemin construit avec l'utilisateur de la
 * session et des segments validés.
 */

const m = vi.hoisted(() => ({
  getSession: vi.fn(),
  send: vi.fn(),
  commands: [],
}));

vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: (...args) => m.getSession(...args) } },
}));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: function S3Client() {
    return { send: m.send };
  },
  PutObjectCommand: function PutObjectCommand(input) {
    m.commands.push(input);
    return { input };
  },
}));

const userId = "507f1f77bcf86cd799439011";

const png = (size = 64) => {
  const bytes = new Uint8Array(size);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return bytes;
};
const svg = new TextEncoder().encode(
  '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(document.cookie)</script></svg>',
);

const call = async ({
  bytes = png(),
  type = "image/svg+xml",
  fields = {},
} = {}) => {
  const formData = new FormData();
  formData.append("file", new File([bytes], "icon.svg", { type }));
  const values = {
    userId,
    signatureId: "sig_1",
    platform: "facebook",
    color: "#1877F2",
    ...fields,
  };
  for (const [k, v] of Object.entries(values)) formData.append(k, v);
  const { POST } = await import("@/app/api/cloudflare/upload-icon/route");
  return POST(
    new Request("http://localhost/api/cloudflare/upload-icon", {
      method: "POST",
      body: formData,
    }),
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  m.commands.length = 0;
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
  m.getSession.mockResolvedValue({
    user: { id: userId },
    session: { activeOrganizationId: null },
  });
  m.send.mockResolvedValue({});
  process.env.CLOUDFLARE_ACCOUNT_ID = "acc";
  process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = "key";
  process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = "secret";
  process.env.CLOUDFLARE_R2_BUCKET_NAME = "bucket";
});

describe("POST /api/cloudflare/upload-icon", () => {
  it("refuse sans session", async () => {
    m.getSession.mockResolvedValue(null);
    const res = await call();
    expect(res.status).toBe(401);
    expect(m.send).not.toHaveBeenCalled();
  });

  it("refuse un SVG (script possible)", async () => {
    const res = await call({ bytes: svg });
    expect(res.status).toBe(400);
    expect(m.send).not.toHaveBeenCalled();
  });

  it("refuse une icône de plus de 1 Mo", async () => {
    const res = await call({ bytes: png(1024 * 1024 + 1) });
    expect(res.status).toBe(400);
    expect(m.send).not.toHaveBeenCalled();
  });

  it("refuse un segment de chemin invalide", async () => {
    const res = await call({ fields: { platform: "../autre-user/x" } });
    expect(res.status).toBe(400);
    expect(m.send).not.toHaveBeenCalled();
  });

  it("refuse l'icône d'un autre utilisateur", async () => {
    const res = await call({ fields: { userId: "507f1f77bcf86cd799439099" } });
    expect(res.status).toBe(403);
    expect(m.send).not.toHaveBeenCalled();
  });

  it("stocke un PNG avec le type réel, sous l'utilisateur de la session", async () => {
    const res = await call({ bytes: png(), type: "image/svg+xml" });
    expect(res.status).toBe(200);
    const [input] = m.commands;
    expect(input.ContentType).toBe("image/png");
    expect(input.Key).toMatch(
      new RegExp(`^custom-icons/${userId}/sig_1/facebook-1877F2-\\d+\\.png$`),
    );
  });
});

describe("detectRasterImageType", () => {
  it("reconnaît PNG, JPEG, GIF et WebP", () => {
    expect(detectRasterImageType(png())).toEqual({
      mime: "image/png",
      ext: "png",
    });
    const jpeg = new Uint8Array(16);
    jpeg.set([0xff, 0xd8, 0xff]);
    expect(detectRasterImageType(jpeg)?.mime).toBe("image/jpeg");
    expect(
      detectRasterImageType(new TextEncoder().encode("GIF89a......"))?.mime,
    ).toBe("image/gif");
    expect(
      detectRasterImageType(new TextEncoder().encode("RIFF....WEBPVP8 "))?.mime,
    ).toBe("image/webp");
  });

  it("refuse le SVG et le texte", () => {
    expect(detectRasterImageType(svg)).toBeNull();
    expect(
      detectRasterImageType(new TextEncoder().encode("hello world!")),
    ).toBeNull();
  });
});
