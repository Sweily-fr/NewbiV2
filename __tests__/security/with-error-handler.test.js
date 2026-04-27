import { describe, it } from "vitest";

describe("withErrorHandler", () => {
  it.skip("passes request and context to the wrapped handler", () => {});

  it.skip("returns the handler's NextResponse on success", () => {});

  it.skip("catches thrown NextResponse (from requireSession etc.) and returns it as-is", () => {});

  it.skip("catches unexpected Error and returns apiError(500, 'Erreur serveur')", () => {});

  it.skip("never leaks error.message from unexpected errors to the client", () => {});

  it.skip("logs unexpected errors via console.error", () => {});
});
