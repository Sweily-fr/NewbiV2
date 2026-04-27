/**
 * Log a warning if a MongoDB update operation matched 0 documents.
 * Implements: Principle 9 (MongoDB operations verify their result).
 *
 * Does NOT throw — this is informational, not blocking.
 * A matchedCount of 0 often indicates a type mismatch (string vs ObjectId)
 * or a stale reference (document deleted between read and write).
 *
 * Tolerant: does NOT warn if matchedCount > 0 but modifiedCount === 0
 * (idempotent update with same values is legitimate, especially for retries).
 *
 * @param {import("mongodb").UpdateResult} result - MongoDB updateOne/updateMany result
 * @param {string} context - Human-readable description of the operation (for the log message)
 * @returns {void}
 */
export function assertModified(result, context) {
  if (!result || typeof result !== "object") {
    console.warn(
      `⚠️ [DB] ${context}: received invalid result (${typeof result})`,
    );
    return;
  }

  const { matchedCount = 0, modifiedCount = 0 } = result;

  // matchedCount === 0 means the document wasn't found at all — likely a bug
  if (matchedCount === 0 && modifiedCount === 0) {
    console.warn(`⚠️ [DB] ${context}: 0 documents matched`);
  }

  // matchedCount > 0 but modifiedCount === 0 is idempotent — no warning (Decision B)
}
