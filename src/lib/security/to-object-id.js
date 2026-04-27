// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used in Sprint 1b implementation
import { ObjectId } from "mongodb";
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used in Sprint 1b implementation
import { apiError } from "./api-error";

/**
 * Convert a string or ObjectId to a MongoDB ObjectId, with validation.
 * Implements: Principle 10 (IDs are consistently typed in MongoDB queries).
 *
 * Use this helper in EVERY direct MongoDB query on Better Auth collections
 * (user, session, member, organization) to avoid string vs ObjectId mismatches.
 *
 * @param {string|import("mongodb").ObjectId} id - ID to convert
 * @returns {import("mongodb").ObjectId} - Valid MongoDB ObjectId
 * @throws {NextResponse} 400 "ID invalide" if the string is not a valid 24-char hex ObjectId
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- params used in Sprint 1b
export function toObjectId(_id) {
  throw new Error("Not implemented yet — Sprint 1b");
}
