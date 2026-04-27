/**
 * Log a warning if a MongoDB update operation modified 0 documents.
 * Implements: Principle 9 (MongoDB operations verify their result).
 *
 * Does NOT throw — this is informational, not blocking.
 * A modifiedCount of 0 often indicates a type mismatch (string vs ObjectId)
 * or a stale reference (document deleted between read and write).
 *
 * Tolerant mode: does NOT warn if matchedCount > 0 but modifiedCount === 0
 * (idempotent update with same values is legitimate, especially for retries).
 *
 * @param {import("mongodb").UpdateResult} result - MongoDB updateOne/updateMany result
 * @param {string} context - Human-readable description of the operation (for the log message)
 * @returns {void}
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- params used in Sprint 1d
export function assertModified(_result, _context) {
  throw new Error("Not implemented yet — Sprint 1d");
}
