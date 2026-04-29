import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockUpdateOne, mockCollection, mockGetSession, mockSignOut } =
  vi.hoisted(() => {
    const mockUpdateOne = vi.fn();
    return {
      mockUpdateOne,
      mockCollection: vi.fn(() => ({ updateOne: mockUpdateOne })),
      mockGetSession: vi.fn(),
      mockSignOut: vi.fn(),
    };
  });

vi.mock("@/src/lib/auth", () => ({
  auth: {
    api: {
      getSession: mockGetSession,
      signOut: mockSignOut,
    },
  },
}));

vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: mockCollection,
  },
}));

vi.mock("mongodb", () => {
  function ObjectId(id) {
    if (!(this instanceof ObjectId)) return new ObjectId(id);
    this.id = id;
    this.toString = () => id;
  }
  return { ObjectId };
});

import { POST } from "@/app/api/account/deactivate/route";

function makeReq({
  method = "POST",
  url = "http://localhost/api/account/deactivate",
  body,
  headers = {},
} = {}) {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/account/deactivate", () => {
  it("returns 400 when email is missing", async () => {
    const req = makeReq({ body: {} });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Email requis");
  });

  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const req = makeReq({ body: { email: "x@y.fr" } });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Non authentifié");
  });

  it("returns 403 when email does not match session", async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { id: "507f1f77bcf86cd799439011", email: "other@y.fr" },
    });
    const req = makeReq({ body: { email: "x@y.fr" } });
    const res = await POST(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Email non autorisé");
  });

  it("deactivates account successfully", async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { id: "507f1f77bcf86cd799439011", email: "x@y.fr" },
    });
    mockUpdateOne.mockResolvedValueOnce({ matchedCount: 1, modifiedCount: 1 });
    mockSignOut.mockResolvedValueOnce({ ok: true });

    const req = makeReq({ body: { email: "x@y.fr" } });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockUpdateOne).toHaveBeenCalled();
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("returns 500 on internal error", async () => {
    mockGetSession.mockRejectedValueOnce(new Error("Boom"));
    const req = makeReq({ body: { email: "x@y.fr" } });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Erreur interne du serveur");
  });
});
