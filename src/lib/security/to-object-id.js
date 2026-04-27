import { ObjectId } from "mongodb";
import { apiError } from "./api-error";

const OBJECT_ID_REGEX = /^[0-9a-f]{24}$/;

/**
 * Convert a string or ObjectId to a MongoDB ObjectId, with validation.
 * Implements: Principle 10 (IDs are consistently typed in MongoDB queries).
 *
 * Use this helper in EVERY direct MongoDB query on Better Auth collections
 * (user, session, member, organization) to avoid string vs ObjectId mismatches.
 *
 * @param {string|import("mongodb").ObjectId} id - ID to convert
 * @returns {import("mongodb").ObjectId} - Valid MongoDB ObjectId
 * @throws {NextResponse} 400 "ID invalide" if the string is not a valid 24-char lowercase hex ObjectId
 */
export function toObjectId(id) {
  // Pass-through if already an ObjectId
  if (id instanceof ObjectId) {
    return id;
  }

  if (typeof id !== "string" || !OBJECT_ID_REGEX.test(id)) {
    throw apiError(400, "ID invalide");
  }

  return new ObjectId(id);
}
