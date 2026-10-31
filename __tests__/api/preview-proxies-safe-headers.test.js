// @vitest-environment node
//
// Proxys d'aperçu des fichiers d'utilisateur (/api/document-preview,
// /api/shared-documents/preview-file) : servis sur l'origine du site, ils
// n'affichent que des formats qui ne s'exécutent pas. Tout autre type
// renvoyé par l'API (SVG, HTML, XML…) part en téléchargement, avec nosniff
// et une CSP sandbox.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ObjectId } from "mongodb";
import { NextRequest } from "next/server";
import {
  safeFileHeaders,
  SHARED_PREVIEW_EXTRA_TYPES,
} from "@/src/lib/safe-file-headers";

const m = vi.hoisted(() => ({
  getSession: vi.fn(),
  memberFindOne: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: (...args) => m.getSession(...args) } },
}));
vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: { collection: () => ({ findOne: m.memberFindOne }) },
}));

const userId = new ObjectId().toString();
const workspaceId = new ObjectId().toString();
const docId = new ObjectId().toString();
const fileId = new ObjectId().toString();
const COOKIE = "better-auth.session_token=abc";

let realFetch;
beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  m.getSession.mockResolvedValue({ user: { id: userId }, session: {} });
  m.memberFindOne.mockResolvedValue({ role: "member" });
  realFetch = global.fetch;
  global.fetch = m.fetch;
});
afterEach(() => {
  global.fetch = realFetch;
});

const upstream = (contentType, disposition = 'inline; filename="x"') =>
  new Response("contenu", {
    status: 200,
    headers: {
      ...(contentType ? { "content-type": contentType } : {}),
      ...(disposition ? { "content-disposition": disposition } : {}),
    },
  });

describe("safeFileHeaders", () => {
  const headersFor = (type, disposition, options) =>
    safeFileHeaders(upstream(type, disposition).headers, options);

  it("PDF en ligne, nosniff, sans CSP sandbox", () => {
    const h = headersFor("application/pdf");
    expect(h.get("content-type")).toBe("application/pdf");
    expect(h.get("content-disposition")).toBe('inline; filename="x"');
    expect(h.get("x-content-type-options")).toBe("nosniff");
    expect(h.get("content-security-policy")).toBeNull();
  });

  it.each(["image/png", "image/jpeg", "image/gif", "image/webp"])(
    "%s en ligne sous CSP sandbox",
    (type) => {
      const h = headersFor(type);
      expect(h.get("content-type")).toBe(type);
      expect(h.get("content-disposition")).toMatch(/^inline/);
      expect(h.get("content-security-policy")).toMatch(/^sandbox;/);
    },
  );

  it.each([
    "image/svg+xml",
    "text/html",
    "text/html; charset=utf-8",
    "application/xhtml+xml",
    "text/xml",
    "application/xml",
    "application/javascript",
    "multipart/x-mixed-replace",
    null,
  ])("type %s servi en téléchargement", (type) => {
    const h = headersFor(type);
    expect(h.get("content-type")).toBe("application/octet-stream");
    expect(h.get("content-disposition")).toBe('attachment; filename="x"');
    expect(h.get("x-content-type-options")).toBe("nosniff");
    expect(h.get("content-security-policy")).toMatch(/^sandbox;/);
  });

  it("garde une pièce que l'API sert déjà en téléchargement", () => {
    const h = headersFor("application/pdf", 'attachment; filename="a.pdf"');
    expect(h.get("content-disposition")).toBe('attachment; filename="a.pdf"');
  });

  it("audio, vidéo et texte brut seulement pour les documents partagés", () => {
    for (const type of ["video/mp4", "audio/mpeg", "text/plain"]) {
      expect(headersFor(type).get("content-type")).toBe(
        "application/octet-stream",
      );
      const shared = headersFor(type, undefined, {
        extraInlineTypes: SHARED_PREVIEW_EXTRA_TYPES,
      });
      expect(shared.get("content-type").startsWith(type)).toBe(true);
      expect(shared.get("content-disposition")).toMatch(/^inline/);
      expect(shared.get("content-security-policy")).toMatch(/^sandbox;/);
    }
  });
});

describe("GET /api/document-preview/[type]/[id]", () => {
  const call = async (type, contentType, disposition) => {
    m.fetch.mockResolvedValue(upstream(contentType, disposition));
    const { GET } =
      await import("@/app/api/document-preview/[type]/[id]/route");
    return GET(
      new NextRequest(
        `http://localhost/api/document-preview/${type}/${docId}?fileId=${fileId}`,
        { headers: { cookie: COOKIE } },
      ),
      { params: Promise.resolve({ type, id: docId }) },
    );
  };

  it("justificatif SVG d'une facture d'achat servi en téléchargement", async () => {
    const res = await call(
      "purchaseInvoice",
      "image/svg+xml",
      'inline; filename="facture.svg"',
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/octet-stream");
    expect(res.headers.get("content-disposition")).toBe(
      'attachment; filename="facture.svg"',
    );
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("content-security-policy")).toMatch(/sandbox/);
  });

  it("justificatif HTML d'une transaction servi en téléchargement", async () => {
    const res = await call("transaction", "text/html");
    expect(res.headers.get("content-type")).toBe("application/octet-stream");
    expect(res.headers.get("content-disposition")).toMatch(/^attachment/);
  });

  it("PDF archivé d'une facture affiché en ligne, sans CSP sandbox", async () => {
    const res = await call(
      "invoice",
      "application/pdf",
      'inline; filename="F-001.pdf"',
    );
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toBe(
      'inline; filename="F-001.pdf"',
    );
    expect(res.headers.get("content-security-policy")).toBeNull();
    expect(res.headers.get("cache-control")).toBe("private, no-store");
  });

  it("image d'un justificatif affichée en ligne sous CSP sandbox", async () => {
    const res = await call("purchaseInvoice", "image/jpeg");
    expect(res.headers.get("content-type")).toBe("image/jpeg");
    expect(res.headers.get("content-security-policy")).toMatch(/^sandbox;/);
    expect(res.headers.get("cache-control")).toBe("private, max-age=3600");
  });
});

describe("GET /api/shared-documents/preview-file/[documentId]", () => {
  const call = async (contentType) => {
    m.fetch.mockResolvedValue(upstream(contentType));
    const { GET } =
      await import("@/app/api/shared-documents/preview-file/[documentId]/route");
    return GET(
      new Request(
        `http://localhost/api/shared-documents/preview-file/${docId}?workspaceId=${workspaceId}`,
        { headers: { cookie: COOKIE } },
      ),
      { params: Promise.resolve({ documentId: docId }) },
    );
  };

  it("document SVG servi en téléchargement", async () => {
    const res = await call("image/svg+xml");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/octet-stream");
    expect(res.headers.get("content-disposition")).toMatch(/^attachment/);
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("vidéo lue en ligne sous CSP sandbox", async () => {
    const res = await call("video/mp4");
    expect(res.headers.get("content-type")).toBe("video/mp4");
    expect(res.headers.get("content-disposition")).toMatch(/^inline/);
    expect(res.headers.get("content-security-policy")).toMatch(/^sandbox;/);
  });
});
