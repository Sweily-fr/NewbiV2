import { describe, it, expect, vi } from "vitest";
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/src/lib/security/with-error-handler";

describe("withErrorHandler", () => {
  it("passes request and context to the wrapped handler", async () => {
    const mockHandler = vi.fn(async () => NextResponse.json({ ok: true }));
    const wrapped = withErrorHandler(mockHandler);
    const fakeRequest = new Request("http://localhost/api/test");
    const fakeContext = { params: { id: "123" } };

    await wrapped(fakeRequest, fakeContext);

    expect(mockHandler).toHaveBeenCalledWith(fakeRequest, fakeContext);
  });

  it("returns the handler's NextResponse on success", async () => {
    const wrapped = withErrorHandler(async () =>
      NextResponse.json({ data: "hello" }),
    );
    const response = await wrapped(new Request("http://localhost/api/test"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ data: "hello" });
  });

  it("catches thrown NextResponse (from requireSession etc.) and returns it as-is", async () => {
    const errorResponse = NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 },
    );
    const wrapped = withErrorHandler(async () => {
      throw errorResponse;
    });

    const response = await wrapped(new Request("http://localhost/api/test"));
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Non authentifié");
  });

  it("catches unexpected Error and returns apiError(500, 'Erreur serveur')", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const wrapped = withErrorHandler(async () => {
      throw new Error("Unexpected DB crash");
    });

    const response = await wrapped(new Request("http://localhost/api/test"));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Erreur serveur");
    console.error.mockRestore();
  });

  it("never leaks error.message from unexpected errors to the client", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const wrapped = withErrorHandler(async () => {
      throw new Error("SECRET_DB_PASSWORD_IN_ERROR");
    });

    const response = await wrapped(new Request("http://localhost/api/test"));
    const body = await response.json();
    expect(JSON.stringify(body)).not.toContain("SECRET_DB_PASSWORD_IN_ERROR");
    console.error.mockRestore();
  });

  it("logs unexpected errors via console.error", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const wrapped = withErrorHandler(async () => {
      throw new Error("crash details");
    });

    await wrapped(new Request("http://localhost/api/test"));
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("[API ERROR 500]"),
      expect.objectContaining({ message: "crash details" }),
    );
    spy.mockRestore();
  });
});
