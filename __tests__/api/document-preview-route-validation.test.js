// @vitest-environment node
//
// /api/document-preview/[type]/[id] : paramètres validés avant tout appel à
// l'API, session exigée, cache jamais partagé.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const ID = "650000000000000000000001";
const fetchMock = vi.fn();
let realFetch;

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  realFetch = global.fetch;
  global.fetch = fetchMock;
  fetchMock.mockResolvedValue(
    new Response("%PDF", {
      status: 200,
      headers: { "content-type": "application/pdf" },
    }),
  );
});
afterEach(() => {
  global.fetch = realFetch;
});

const call = async (
  type,
  id,
  query = "",
  cookie = "better-auth.session_token=abc",
) => {
  const { GET } = await import("@/app/api/document-preview/[type]/[id]/route");
  return GET(
    new NextRequest(
      `http://localhost/api/document-preview/${type}/${id}${query}`,
      {
        headers: cookie ? { cookie } : {},
      },
    ),
    { params: Promise.resolve({ type, id }) },
  );
};

describe("GET /api/document-preview : validation", () => {
  it.each([
    ["inconnu", ID, ""],
    ["invoice", "pas-un-id", ""],
    ["invoice", "../../users", ""],
    ["purchaseInvoice", ID, "?fileId=abc"],
    ["transaction", ID, "?index=-1"],
    ["transaction", ID, "?index=99999"],
  ])("%s/%s%s : 400 sans appel à l'API", async (type, id, query) => {
    const res = await call(type, id, query);
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sans cookie : 401 sans appel à l'API", async () => {
    const res = await call("invoice", ID, "", null);
    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refus de l'API transmis tel quel", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: "Accès refusé" }), {
        status: 403,
        headers: { "content-type": "application/json" },
      }),
    );
    const res = await call("invoice", ID);
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("Accès refusé");
  });

  it("réponse servie avec nosniff et sans cache partagé", async () => {
    const res = await call("importedInvoice", ID);
    expect(res.status).toBe(200);
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("cache-control")).toMatch(/^private/);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toMatch(
      new RegExp(`/documents/imported/importedInvoice/${ID}/file$`),
    );
  });
});
