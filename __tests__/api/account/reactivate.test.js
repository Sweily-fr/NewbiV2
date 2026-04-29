import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoisted mocks
const mockFindOne = vi.fn();
const mockUpdateOne = vi.fn();
const mockCollection = vi.fn(() => ({
  findOne: mockFindOne,
  updateOne: mockUpdateOne,
}));

vi.mock("@/src/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
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

import { POST } from "@/app/api/account/reactivate/route";

function makeReq({
  method = "POST",
  url = "http://localhost/api/account/reactivate",
  body,
  headers = {},
} = {}) {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function makeToken(userId, timestamp = Date.now()) {
  return Buffer.from(`${userId}:${timestamp}`).toString("base64");
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/account/reactivate", () => {
  it("returns 400 when email is missing", async () => {
    const req = makeReq({ body: { token: "abc" } });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Email et token requis");
  });

  it("returns 400 when token is missing", async () => {
    const req = makeReq({ body: { email: "x@y.fr" } });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when token is expired (>24h)", async () => {
    const expired = Date.now() - 25 * 60 * 60 * 1000;
    const token = makeToken("507f1f77bcf86cd799439011", expired);
    const req = makeReq({ body: { email: "x@y.fr", token } });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Token expiré");
  });

  it("returns 404 when user is not found or already active", async () => {
    mockFindOne.mockResolvedValueOnce({ email: "x@y.fr" }); // userByEmail
    mockFindOne.mockResolvedValueOnce(null); // user with all criteria
    const token = makeToken("507f1f77bcf86cd799439011");
    const req = makeReq({ body: { email: "x@y.fr", token } });
    const res = await POST(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("non trouvé");
  });

  it("reactivates user successfully", async () => {
    mockFindOne.mockResolvedValueOnce({ email: "x@y.fr" });
    mockFindOne.mockResolvedValueOnce({
      _id: "507f1f77bcf86cd799439011",
      email: "x@y.fr",
      isActive: false,
    });
    mockUpdateOne.mockResolvedValueOnce({ matchedCount: 1, modifiedCount: 1 });
    const token = makeToken("507f1f77bcf86cd799439011");
    const req = makeReq({ body: { email: "x@y.fr", token } });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockUpdateOne).toHaveBeenCalled();
  });

  it("returns 500 on internal error", async () => {
    mockFindOne.mockRejectedValueOnce(new Error("DB down"));
    const token = makeToken("507f1f77bcf86cd799439011");
    const req = makeReq({ body: { email: "x@y.fr", token } });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Erreur interne du serveur");
  });
});
