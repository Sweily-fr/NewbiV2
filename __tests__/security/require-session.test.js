import { describe, it } from "vitest";

describe("requireSession", () => {
  it.skip("returns { user, session, cookieHeader } when session is valid", () => {});

  it.skip("throws 401 NextResponse when no session cookie is present", () => {});

  it.skip("throws 401 NextResponse when session cookie is expired", () => {});

  it.skip("throws 401 NextResponse when session cookie is revoked (not in DB)", () => {});

  it.skip("includes raw cookie header string in cookieHeader for proxy use", () => {});
});
