// @vitest-environment node
//
// /api/cloudflare/delete-icons : supprime les icônes personnalisées d'une
// signature, dans le seul dossier custom-icons/<session>/<signature>/.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const m = vi.hoisted(() => ({ getSession: vi.fn(), send: vi.fn() }));

vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: (...args) => m.getSession(...args) } },
}));
vi.mock("@aws-sdk/client-s3", () => {
  class Command {
    constructor(input) {
      this.input = input;
    }
  }
  return {
    S3Client: class {
      send(command) {
        return m.send(command);
      }
    },
    ListObjectsV2Command: class extends Command {},
    DeleteObjectsCommand: class extends Command {},
  };
});

const ME = "650000000000000000000001";
const OTHER = "650000000000000000000002";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
  process.env.CLOUDFLARE_ACCOUNT_ID = "compte";
  process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = "id";
  process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = "secret";
  process.env.CLOUDFLARE_R2_BUCKET_NAME = "signatures";
  m.getSession.mockResolvedValue({ user: { id: ME } });
  m.send.mockImplementation(async (command) =>
    command.input.Prefix
      ? { Contents: [{ Key: `${command.input.Prefix}facebook.png` }] }
      : { Deleted: command.input.Delete.Objects },
  );
});

const call = async (body) => {
  const { DELETE } = await import("@/app/api/cloudflare/delete-icons/route");
  return DELETE(
    new NextRequest("http://localhost/api/cloudflare/delete-icons", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
};

describe("DELETE /api/cloudflare/delete-icons", () => {
  it("sans session : 401, rien listé", async () => {
    m.getSession.mockResolvedValue(null);
    const res = await call({ userId: ME, signatureId: "sig1" });
    expect(res.status).toBe(401);
    expect(m.send).not.toHaveBeenCalled();
  });

  it("dossier d'un autre utilisateur : 403, rien listé", async () => {
    const res = await call({ userId: OTHER, signatureId: "sig1" });
    expect(res.status).toBe(403);
    expect(m.send).not.toHaveBeenCalled();
  });

  it.each(["", "a/b", "..", "../" + OTHER, "<svg>"])(
    "signatureId %j : refusé, rien listé",
    async (signatureId) => {
      const res = await call({ userId: ME, signatureId });
      expect(res.status).toBe(400);
      expect(m.send).not.toHaveBeenCalled();
    },
  );

  it("sa signature : ne liste et ne supprime que custom-icons/<session>/<signature>/", async () => {
    const res = await call({ userId: ME, signatureId: "6650aa_sig-1" });
    expect(res.status).toBe(200);
    const [list, del] = m.send.mock.calls.map(([c]) => c.input);
    expect(list.Prefix).toBe(`custom-icons/${ME}/6650aa_sig-1/`);
    expect(
      del.Delete.Objects.every((o) =>
        o.Key.startsWith(`custom-icons/${ME}/6650aa_sig-1/`),
      ),
    ).toBe(true);
  });
});
