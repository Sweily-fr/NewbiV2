// @vitest-environment node
import { describe, it, expect, vi } from "vitest";

const m = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock("@/src/lib/resend", () => ({
  resend: { emails: { send: (...args) => m.send(...args) } },
}));

vi.mock("@/src/lib/security", () => ({ withErrorHandler: (h) => h }));

const post = async (body, ip) => {
  const { POST } = await import("@/app/api/contact/route");
  return POST(
    new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
};

describe("POST /api/contact", () => {
  it("valeurs non texte : 400 avec message, rien n'est envoyé", async () => {
    const res = await post(
      { name: 123, email: ["a"], subject: {}, message: true },
      "10.0.0.1",
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Tous les champs sont requis");
    expect(m.send).not.toHaveBeenCalled();
  });

  it("corps qui n'est pas un objet JSON : 400", async () => {
    const res = await post("null", "10.0.0.2");
    expect(res.status).toBe(400);
    expect(m.send).not.toHaveBeenCalled();
  });

  it("message valide : envoyé", async () => {
    m.send.mockResolvedValue({ error: null });
    const res = await post(
      {
        name: "Anne Lecœur",
        email: "anne@exemple.test",
        subject: "Question",
        message: "Bonjour",
      },
      "10.0.0.3",
    );
    expect(res.status).toBe(200);
    expect(m.send).toHaveBeenCalledTimes(1);
  });
});
