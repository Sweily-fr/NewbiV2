import { describe, it, expect, vi } from "vitest";
import { apiError } from "@/src/lib/security/api-error";

describe("apiError", () => {
  it("returns NextResponse with correct status code", async () => {
    const response = apiError(403, "Forbidden");
    expect(response.status).toBe(403);
  });

  it("returns JSON body with { error: publicMessage } only", async () => {
    const response = apiError(400, "Données invalides");
    const body = await response.json();
    expect(body).toEqual({ error: "Données invalides" });
    expect(Object.keys(body)).toEqual(["error"]);
  });

  it("never includes error.message from internalDetails in the response body", async () => {
    const response = apiError(
      500,
      "Erreur serveur",
      new Error("MongoDB connection failed at host:27017"),
    );
    const body = await response.json();
    expect(body.error).toBe("Erreur serveur");
    expect(JSON.stringify(body)).not.toContain("MongoDB");
    expect(JSON.stringify(body)).not.toContain("27017");
  });

  it("never includes error.stack in the response body", async () => {
    const err = new Error("secret internal detail");
    const response = apiError(500, "Erreur serveur", err);
    const body = await response.json();
    expect(JSON.stringify(body)).not.toContain("secret internal detail");
    expect(JSON.stringify(body)).not.toContain("at ");
  });

  it("logs internalDetails to console.error with [API ERROR] tag", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    apiError(500, "Erreur serveur", "db timeout");
    expect(spy).toHaveBeenCalledWith(
      "❌ [API ERROR 500] Erreur serveur",
      "db timeout",
    );
    spy.mockRestore();
  });

  it("handles internalDetails as Error object", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const err = new Error("connection lost");
    apiError(500, "Erreur serveur", err);
    expect(spy).toHaveBeenCalledWith(
      "❌ [API ERROR 500] Erreur serveur",
      expect.objectContaining({ message: "connection lost" }),
    );
    spy.mockRestore();
  });

  it("handles internalDetails as string", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    apiError(400, "Bad request", "missing field: email");
    expect(spy).toHaveBeenCalledWith(
      "❌ [API ERROR 400] Bad request",
      "missing field: email",
    );
    spy.mockRestore();
  });

  it("handles internalDetails as undefined (optional)", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    apiError(401, "Non authentifié");
    expect(spy).toHaveBeenCalledWith("❌ [API ERROR 401] Non authentifié");
    spy.mockRestore();
  });
});
