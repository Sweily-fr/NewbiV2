import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetSession = vi.fn();
const mockAcceptInvitation = vi.fn();
const mockRejectInvitation = vi.fn();
const mockSetActiveOrganization = vi.fn();

vi.mock("@/src/lib/auth", () => ({
  auth: {
    api: {
      getSession: (...a) => mockGetSession(...a),
      acceptInvitation: (...a) => mockAcceptInvitation(...a),
      rejectInvitation: (...a) => mockRejectInvitation(...a),
      setActiveOrganization: (...a) => mockSetActiveOrganization(...a),
    },
    options: { database: {} },
  },
}));

vi.mock("next/headers", () => ({
  headers: () => Promise.resolve(new Headers()),
}));

const collections = {};
function getCollection(name) {
  if (!collections[name]) {
    collections[name] = {
      findOne: vi.fn(),
      updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
      updateMany: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
      countDocuments: vi.fn().mockResolvedValue(0),
    };
  }
  return collections[name];
}

const mockMongoDb = {
  collection: vi.fn((name) => getCollection(name)),
};

vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: mockMongoDb,
}));

vi.mock("mongodb", () => {
  function MockObjectId(id) {
    this._id = id;
  }
  MockObjectId.prototype.toString = function () {
    return String(this._id);
  };
  return { ObjectId: MockObjectId };
});

vi.mock("@/src/services/seatSyncService", () => ({
  seatSyncService: {
    syncSeatsAfterInvitationAccepted: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/src/lib/email-templates", () => ({
  emailTemplates: {
    memberJoinedNotificationOwner: vi.fn(() => "<html>owner</html>"),
    memberJoinedNotificationInviter: vi.fn(() => "<html>inviter</html>"),
    memberJoinedConfirmation: vi.fn(() => "<html>confirm</html>"),
  },
}));

vi.mock("@/src/lib/auth-utils", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

import { GET, POST } from "@/app/api/invitations/[id]/route";

function makeReq({
  method = "GET",
  url = "http://localhost/api/invitations/x",
  body,
} = {}) {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("GET /api/invitations/[id]", () => {
  beforeEach(() => {
    Object.keys(collections).forEach((k) => delete collections[k]);
    vi.clearAllMocks();
  });

  it("returns 404 when invitation not found", async () => {
    getCollection("invitation").findOne.mockResolvedValue(null);
    const res = await GET(makeReq(), {
      params: Promise.resolve({ id: "missing" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns enriched invitation when found", async () => {
    getCollection("invitation").findOne.mockResolvedValue({
      _id: { toString: () => "inv1" },
      email: "u@e.com",
      role: "member",
      status: "pending",
      expiresAt: new Date(),
      organizationId: { toString: () => "org1" },
      inviterId: { toString: () => "inviter1" },
    });
    getCollection("organization").findOne.mockResolvedValue({ name: "ACME" });

    const res = await GET(makeReq(), {
      params: Promise.resolve({ id: "inv1" }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.email).toBe("u@e.com");
    expect(json.organizationName).toBe("ACME");
  });
});

describe("POST /api/invitations/[id]", () => {
  beforeEach(() => {
    Object.keys(collections).forEach((k) => delete collections[k]);
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await POST(
      makeReq({ method: "POST", body: { action: "accept" } }),
      { params: Promise.resolve({ id: "inv1" }) },
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid action", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "u1", email: "u@e.com" } });
    const res = await POST(
      makeReq({ method: "POST", body: { action: "bogus" } }),
      { params: Promise.resolve({ id: "inv1" }) },
    );
    expect(res.status).toBe(400);
  });

  it("accept returns 404 when invitation not found", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "u1", email: "u@e.com" } });
    getCollection("invitation").findOne.mockResolvedValue(null);
    const res = await POST(
      makeReq({ method: "POST", body: { action: "accept" } }),
      { params: Promise.resolve({ id: "inv1" }) },
    );
    expect(res.status).toBe(404);
  });

  it("accept returns 410 when invitation expired", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "u1", email: "u@e.com" } });
    getCollection("invitation").findOne.mockResolvedValue({
      _id: "inv1",
      email: "u@e.com",
      expiresAt: new Date(Date.now() - 1000),
      status: "pending",
    });
    const res = await POST(
      makeReq({ method: "POST", body: { action: "accept" } }),
      { params: Promise.resolve({ id: "inv1" }) },
    );
    expect(res.status).toBe(410);
  });

  it("accept returns 400 when already accepted", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "u1", email: "u@e.com" } });
    getCollection("invitation").findOne.mockResolvedValue({
      _id: "inv1",
      email: "u@e.com",
      status: "accepted",
    });
    const res = await POST(
      makeReq({ method: "POST", body: { action: "accept" } }),
      { params: Promise.resolve({ id: "inv1" }) },
    );
    expect(res.status).toBe(400);
  });

  it("accept returns 403 when email mismatches", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "u1", email: "actual@e.com" },
    });
    getCollection("invitation").findOne.mockResolvedValue({
      _id: "inv1",
      email: "other@e.com",
      status: "pending",
    });
    const res = await POST(
      makeReq({ method: "POST", body: { action: "accept" } }),
      { params: Promise.resolve({ id: "inv1" }) },
    );
    expect(res.status).toBe(403);
  });

  it("reject returns success when invitation already processed", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "u1", email: "u@e.com" } });
    getCollection("invitation").findOne.mockResolvedValue({
      _id: "inv1",
      email: "u@e.com",
      status: "rejected",
    });
    const res = await POST(
      makeReq({ method: "POST", body: { action: "reject" } }),
      { params: Promise.resolve({ id: "inv1" }) },
    );
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.success).toBe(true);
  });
});
