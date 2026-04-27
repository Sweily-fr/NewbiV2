import { describe, it } from "vitest";

describe("toObjectId", () => {
  it.skip("converts valid 24-char hex string to ObjectId", () => {});

  it.skip("passes through an existing ObjectId unchanged", () => {});

  it.skip("throws 400 for a string that is not 24 hex chars", () => {});

  it.skip("throws 400 for an empty string", () => {});

  it.skip("throws 400 for null", () => {});

  it.skip("throws 400 for undefined", () => {});

  it.skip("throws 400 for a number", () => {});

  it.skip("throws 400 for a string with uppercase hex (e.g., 'AABBCC...')", () => {
    // Decision A (2026-04-27): reject uppercase. All ObjectIds in the app are lowercase
    // (Better Auth adapter outputs lowercase via toHexString). Uppercase would be a forged input.
  });
});
