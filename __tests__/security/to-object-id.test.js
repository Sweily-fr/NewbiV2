// @vitest-environment node
import { describe, it, expect } from "vitest";
import { ObjectId } from "mongodb";
import { toObjectId } from "@/src/lib/security/to-object-id";

describe("toObjectId", () => {
  it("converts valid 24-char hex string to ObjectId", () => {
    const result = toObjectId("aabbccddeeff00112233aabb");
    expect(result).toBeInstanceOf(ObjectId);
    expect(result.toHexString()).toBe("aabbccddeeff00112233aabb");
  });

  it("passes through an existing ObjectId unchanged", () => {
    const original = new ObjectId("aabbccddeeff00112233aabb");
    const result = toObjectId(original);
    expect(result).toBe(original); // Same reference
  });

  it("throws 400 for a string that is not 24 hex chars", () => {
    expect(() => toObjectId("tooshort")).toThrow();
    try {
      toObjectId("tooshort");
    } catch (response) {
      expect(response.status).toBe(400);
    }
  });

  it("throws 400 for an empty string", () => {
    expect(() => toObjectId("")).toThrow();
    try {
      toObjectId("");
    } catch (response) {
      expect(response.status).toBe(400);
    }
  });

  it("throws 400 for null", () => {
    expect(() => toObjectId(null)).toThrow();
    try {
      toObjectId(null);
    } catch (response) {
      expect(response.status).toBe(400);
    }
  });

  it("throws 400 for undefined", () => {
    expect(() => toObjectId(undefined)).toThrow();
    try {
      toObjectId(undefined);
    } catch (response) {
      expect(response.status).toBe(400);
    }
  });

  it("throws 400 for a number", () => {
    expect(() => toObjectId(12345)).toThrow();
    try {
      toObjectId(12345);
    } catch (response) {
      expect(response.status).toBe(400);
    }
  });

  it("throws 400 for a string with uppercase hex (e.g., 'AABBCC...')", () => {
    // Decision A (2026-04-27): reject uppercase. All ObjectIds in the app are lowercase.
    expect(() => toObjectId("AABBCCDDEEFF00112233AABB")).toThrow();
    try {
      toObjectId("AABBCCDDEEFF00112233AABB");
    } catch (response) {
      expect(response.status).toBe(400);
    }
  });
});
