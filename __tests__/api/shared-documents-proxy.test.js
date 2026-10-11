// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ObjectId } from "mongodb";

/**
 * Proxys des documents partagés : session, membre de l'espace, et
 * identifiants en chaînes ObjectId (un objet `{"$ne": ...}` devenait un
 * opérateur MongoDB côté API et ouvrait les documents d'autres espaces).
 */

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
const COOKIE = "better-auth.session_token=abc";

let realFetch;
beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  m.getSession.mockResolvedValue({ user: { id: userId }, session: {} });
  m.memberFindOne.mockResolvedValue({ role: "member" });
  m.fetch.mockResolvedValue(
    new Response(JSON.stringify({ success: true, data: {} }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
  realFetch = global.fetch;
  global.fetch = m.fetch;
});
afterEach(() => {
  global.fetch = realFetch;
});

const postJson = (path, body) =>
  new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: COOKIE },
    body: JSON.stringify(body),
  });

describe("POST /api/shared-documents/selection-info et download-selection", () => {
  const routes = [
    ["selection-info", "@/app/api/shared-documents/selection-info/route"],
    [
      "download-selection",
      "@/app/api/shared-documents/download-selection/route",
    ],
  ];

  it.each(routes)("%s refuse sans session", async (name, mod) => {
    m.getSession.mockResolvedValue(null);
    const { POST } = await import(mod);
    const res = await POST(
      postJson(`/api/shared-documents/${name}`, {
        workspaceId,
        documentIds: [docId],
      }),
    );
    expect(res.status).toBe(401);
    expect(m.fetch).not.toHaveBeenCalled();
  });

  it.each(routes)(
    "%s refuse un workspaceId objet (injection)",
    async (name, mod) => {
      const { POST } = await import(mod);
      const res = await POST(
        postJson(`/api/shared-documents/${name}`, {
          workspaceId: { $ne: "000000000000000000000000" },
          documentIds: [docId],
        }),
      );
      expect(res.status).toBe(400);
      expect(m.fetch).not.toHaveBeenCalled();
    },
  );

  it.each(routes)("%s refuse un id de document objet", async (name, mod) => {
    const { POST } = await import(mod);
    const res = await POST(
      postJson(`/api/shared-documents/${name}`, {
        workspaceId,
        documentIds: [{ $gt: "" }],
      }),
    );
    expect(res.status).toBe(400);
    expect(m.fetch).not.toHaveBeenCalled();
  });

  it.each(routes)("%s refuse un non-membre de l'espace", async (name, mod) => {
    m.memberFindOne.mockResolvedValue(null);
    const { POST } = await import(mod);
    const res = await POST(
      postJson(`/api/shared-documents/${name}`, {
        workspaceId,
        documentIds: [docId],
      }),
    );
    expect(res.status).toBe(403);
    expect(m.fetch).not.toHaveBeenCalled();
  });

  it("selection-info transmet la sélection d'un membre avec son cookie", async () => {
    const { POST } =
      await import("@/app/api/shared-documents/selection-info/route");
    const res = await POST(
      postJson("/api/shared-documents/selection-info", {
        workspaceId,
        documentIds: [docId],
        folderIds: [],
      }),
    );
    expect(res.status).toBe(200);
    const [, init] = m.fetch.mock.calls[0];
    expect(init.headers.cookie).toBe(COOKIE);
  });
});

describe("GET /api/shared-documents/download-file, preview-file, download-folder", () => {
  it("download-file encode les paramètres et refuse une injection dans workspaceId", async () => {
    const { GET } =
      await import("@/app/api/shared-documents/download-file/[documentId]/route");
    const injected = `${workspaceId}&workspaceId[$ne]=0`;
    const res = await GET(
      new Request(
        `http://localhost/api/shared-documents/download-file/${docId}?workspaceId=${encodeURIComponent(injected)}`,
        { headers: { cookie: COOKIE } },
      ),
      { params: Promise.resolve({ documentId: docId }) },
    );
    expect(res.status).toBe(400);
    expect(m.fetch).not.toHaveBeenCalled();
  });

  it("preview-file refuse sans session", async () => {
    m.getSession.mockResolvedValue(null);
    const { GET } =
      await import("@/app/api/shared-documents/preview-file/[documentId]/route");
    const res = await GET(
      new Request(
        `http://localhost/api/shared-documents/preview-file/${docId}?workspaceId=${workspaceId}`,
      ),
      { params: Promise.resolve({ documentId: docId }) },
    );
    expect(res.status).toBe(401);
    expect(m.fetch).not.toHaveBeenCalled();
  });

  it("preview-file ne met pas un document privé en cache partagé", async () => {
    m.fetch.mockResolvedValue(
      new Response("PDF", {
        status: 200,
        headers: { "content-type": "application/pdf" },
      }),
    );
    const { GET } =
      await import("@/app/api/shared-documents/preview-file/[documentId]/route");
    const res = await GET(
      new Request(
        `http://localhost/api/shared-documents/preview-file/${docId}?workspaceId=${workspaceId}`,
        { headers: { cookie: COOKIE } },
      ),
      { params: Promise.resolve({ documentId: docId }) },
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toMatch(/^private/);
  });

  it("download-folder refuse un non-membre", async () => {
    m.memberFindOne.mockResolvedValue(null);
    const { GET } =
      await import("@/app/api/shared-documents/download-folder/route");
    const res = await GET(
      new Request(
        `http://localhost/api/shared-documents/download-folder?folderId=${docId}&workspaceId=${workspaceId}`,
        { headers: { cookie: COOKIE } },
      ),
    );
    expect(res.status).toBe(403);
    expect(m.fetch).not.toHaveBeenCalled();
  });
});
