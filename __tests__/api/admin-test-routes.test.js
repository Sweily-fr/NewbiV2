// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Routes de test et d'administration : jamais joignables hors
 * développement local, sauf le rapport de cohérence, réservé à la liste
 * blanche du back-office.
 */

const m = vi.hoisted(() => ({
  getSession: vi.fn(),
  sendEmail: vi.fn(),
  runAllChecks: vi.fn(),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: (...args) => m.getSession(...args) } },
}));
vi.mock("@/src/lib/auth-utils", () => ({
  sendEmail: (...args) => m.sendEmail(...args),
}));
vi.mock("@/src/lib/email-templates", () => ({
  emailTemplates: { resetPassword: () => "<p>x</p>" },
}));
vi.mock("@/src/lib/consistency-checks", () => ({
  runAllChecks: (...args) => m.runAllChecks(...args),
}));
vi.mock("@/src/lib/mongodb", () => ({ mongoDb: { collection: () => ({}) } }));

const ADMIN_ID = "507f1f77bcf86cd799439011";
const OTHER_ID = "507f1f77bcf86cd799439099";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  m.runAllChecks.mockResolvedValue({ ok: true });
  process.env.BACKOFFICE_ADMIN_USER_IDS = ADMIN_ID;
});
afterEach(() => {
  vi.unstubAllEnvs();
  delete process.env.BACKOFFICE_ADMIN_USER_IDS;
});

describe("POST /api/test-email", () => {
  const call = async () => {
    const { POST } = await import("@/app/api/test-email/route");
    return POST(
      new Request("http://localhost/api/test-email", {
        method: "POST",
        body: JSON.stringify({
          template: "resetPassword",
          email: "victime@example.com",
          params: [],
        }),
      }),
    );
  };

  it.each(["production", "test", "preview"])(
    "404 et aucun email hors développement (NODE_ENV=%s)",
    async (env) => {
      vi.stubEnv("NODE_ENV", env);
      const res = await call();
      expect(res.status).toBe(404);
      expect(m.sendEmail).not.toHaveBeenCalled();
    },
  );
});

describe("GET /api/admin/consistency-check", () => {
  const call = async () => {
    const { GET } = await import("@/app/api/admin/consistency-check/route");
    return GET(new Request("http://localhost/api/admin/consistency-check"));
  };

  it("refuse sans session", async () => {
    m.getSession.mockResolvedValue(null);
    expect((await call()).status).toBe(401);
    expect(m.runAllChecks).not.toHaveBeenCalled();
  });

  it("404 pour un compte hors liste blanche du back-office", async () => {
    m.getSession.mockResolvedValue({
      user: { id: OTHER_ID, email: "sofiane.mtimet6@gmail.com" },
      session: {},
    });
    expect((await call()).status).toBe(404);
    expect(m.runAllChecks).not.toHaveBeenCalled();
  });

  it("404 si la liste blanche est vide", async () => {
    delete process.env.BACKOFFICE_ADMIN_USER_IDS;
    m.getSession.mockResolvedValue({
      user: { id: ADMIN_ID, email: "a@b.fr" },
      session: {},
    });
    expect((await call()).status).toBe(404);
  });

  it("rapport pour un administrateur de la plateforme", async () => {
    m.getSession.mockResolvedValue({
      user: { id: ADMIN_ID, email: "a@b.fr" },
      session: {},
    });
    const res = await call();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});

describe("routes /api/admin/*-test-users", () => {
  it.each(["create-test-users", "delete-test-users"])(
    "%s répond 404 hors développement",
    async (route) => {
      vi.stubEnv("NODE_ENV", "production");
      const { POST } = await import(`@/app/api/admin/${route}/route`);
      const res = await POST(
        new Request(`http://localhost/api/admin/${route}`, {
          method: "POST",
          body: JSON.stringify({
            organizationId: "x",
            members: [],
            emails: [],
            adminKey: "dev-admin-key-2024",
          }),
        }),
      );
      expect(res.status).toBe(404);
    },
  );
});
