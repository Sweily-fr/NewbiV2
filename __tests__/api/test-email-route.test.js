// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Route de test d'envoi d'emails : jamais joignable hors développement
 * local.
 */

const m = vi.hoisted(() => ({
  getSession: vi.fn(),
  sendEmail: vi.fn(),
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
vi.mock("@/src/lib/mongodb", () => ({ mongoDb: { collection: () => ({}) } }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
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
