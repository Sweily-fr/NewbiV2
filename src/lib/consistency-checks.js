import { mongoDb } from "@/src/lib/mongodb";

/**
 * Consistency checks — detect incoherent states in MongoDB.
 *
 * Each function returns an array of anomalies (empty = healthy).
 * These are DETECTION only — no auto-fix, no side-effects.
 *
 * Findings covered:
 *   MOYEN-23 — org with onboardingCompleted but no active subscription
 *   MOYEN-19 — duplicate subscriptions (same referenceId)
 *   MOYEN-24 — org without an owner member (race condition artifact)
 *   BAS-27   — user with corrupted onboardingStep value
 */

const VALID_ONBOARDING_STEPS = ["workspace", "plan", "recap", "completed"];

/**
 * MOYEN-23 — Organizations that completed onboarding but have no valid subscription.
 * Detects orgs that somehow lost their subscription (webhook failure, manual deletion, etc.).
 */
export async function findOrgsWithoutSubscription() {
  const orgs = await mongoDb
    .collection("organization")
    .find({ onboardingCompleted: true })
    .project({ _id: 1, name: 1, createdAt: 1 })
    .toArray();

  const anomalies = [];
  const now = new Date();

  for (const org of orgs) {
    const orgIdStr = org._id.toString();

    const subscription = await mongoDb
      .collection("subscription")
      .findOne({ referenceId: orgIdStr });

    if (!subscription) {
      anomalies.push({
        organizationId: orgIdStr,
        organizationName: org.name,
        createdAt: org.createdAt,
        reason: "no_subscription",
      });
      continue;
    }

    // Check if subscription is actually valid
    const isActive =
      subscription.status === "active" || subscription.status === "trialing";
    const isCanceledButValid =
      subscription.status === "canceled" &&
      subscription.periodEnd &&
      new Date(subscription.periodEnd) > now;

    if (!isActive && !isCanceledButValid) {
      anomalies.push({
        organizationId: orgIdStr,
        organizationName: org.name,
        subscriptionStatus: subscription.status,
        periodEnd: subscription.periodEnd,
        reason: "subscription_invalid",
      });
    }
  }

  return anomalies;
}

/**
 * MOYEN-19 — Duplicate subscriptions for the same organization.
 * referenceId should be unique (index enforced), but detect any leaks.
 */
export async function findDuplicateSubscriptions() {
  const pipeline = [
    {
      $group: {
        _id: "$referenceId",
        count: { $sum: 1 },
        docs: {
          $push: {
            id: "$_id",
            status: "$status",
            plan: "$plan",
            createdAt: "$createdAt",
          },
        },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ];

  const duplicates = await mongoDb
    .collection("subscription")
    .aggregate(pipeline)
    .toArray();

  return duplicates.map((d) => ({
    referenceId: d._id,
    count: d.count,
    subscriptions: d.docs,
  }));
}

/**
 * MOYEN-24 — Organizations without an owner member.
 * Race condition during org creation can leave an org without any member with role "owner".
 */
export async function findOrgsWithoutOwner() {
  const orgs = await mongoDb
    .collection("organization")
    .find({})
    .project({ _id: 1, name: 1, createdAt: 1 })
    .toArray();

  const anomalies = [];

  for (const org of orgs) {
    const ownerMember = await mongoDb.collection("member").findOne({
      organizationId: org._id,
      role: "owner",
    });

    if (!ownerMember) {
      anomalies.push({
        organizationId: org._id.toString(),
        organizationName: org.name,
        createdAt: org.createdAt,
        reason: "no_owner_member",
      });
    }
  }

  return anomalies;
}

/**
 * BAS-27 — Users with a corrupted onboardingStep value.
 * Valid steps: workspace, plan, recap, completed (or null/undefined = treated as "workspace").
 */
export async function findCorruptedOnboardingSteps() {
  // Find users where onboardingStep exists AND is not in the valid list
  const corrupted = await mongoDb
    .collection("user")
    .find({
      onboardingStep: { $exists: true, $nin: VALID_ONBOARDING_STEPS },
    })
    .project({ _id: 1, email: 1, onboardingStep: 1, createdAt: 1 })
    .toArray();

  return corrupted.map((u) => ({
    userId: u._id.toString(),
    email: u.email,
    onboardingStep: u.onboardingStep,
    createdAt: u.createdAt,
  }));
}

/**
 * Bonus — Orphaned sessions whose userId no longer exists in the user collection.
 */
export async function findOrphanedSessions() {
  const sessions = await mongoDb
    .collection("session")
    .find({})
    .project({ _id: 1, userId: 1, createdAt: 1 })
    .toArray();

  const anomalies = [];

  // Batch: collect unique userIds, then check existence in one query
  const userIdSet = new Map();
  for (const s of sessions) {
    const key = s.userId.toString();
    if (!userIdSet.has(key)) {
      userIdSet.set(key, s.userId);
    }
  }

  const existingUsers = await mongoDb
    .collection("user")
    .find({ _id: { $in: Array.from(userIdSet.values()) } })
    .project({ _id: 1 })
    .toArray();

  const existingIds = new Set(existingUsers.map((u) => u._id.toString()));

  for (const s of sessions) {
    if (!existingIds.has(s.userId.toString())) {
      anomalies.push({
        sessionId: s._id,
        userId: s.userId.toString(),
        createdAt: s.createdAt,
        reason: "user_not_found",
      });
    }
  }

  return anomalies;
}

/**
 * Run all consistency checks and return a structured report.
 */
export async function runAllChecks() {
  const [
    orgsWithoutSubscription,
    duplicateSubscriptions,
    orgsWithoutOwner,
    corruptedOnboardingSteps,
    orphanedSessions,
  ] = await Promise.all([
    findOrgsWithoutSubscription(),
    findDuplicateSubscriptions(),
    findOrgsWithoutOwner(),
    findCorruptedOnboardingSteps(),
    findOrphanedSessions(),
  ]);

  const totalAnomalies =
    orgsWithoutSubscription.length +
    duplicateSubscriptions.length +
    orgsWithoutOwner.length +
    corruptedOnboardingSteps.length +
    orphanedSessions.length;

  return {
    healthy: totalAnomalies === 0,
    totalAnomalies,
    checks: {
      orgsWithoutSubscription: {
        finding: "MOYEN-23",
        count: orgsWithoutSubscription.length,
        items: orgsWithoutSubscription,
      },
      duplicateSubscriptions: {
        finding: "MOYEN-19",
        count: duplicateSubscriptions.length,
        items: duplicateSubscriptions,
      },
      orgsWithoutOwner: {
        finding: "MOYEN-24",
        count: orgsWithoutOwner.length,
        items: orgsWithoutOwner,
      },
      corruptedOnboardingSteps: {
        finding: "BAS-27",
        count: corruptedOnboardingSteps.length,
        items: corruptedOnboardingSteps,
      },
      orphanedSessions: {
        finding: "BONUS",
        count: orphanedSessions.length,
        items: orphanedSessions,
      },
    },
    checkedAt: new Date().toISOString(),
  };
}
