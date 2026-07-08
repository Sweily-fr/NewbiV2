import { ObjectId } from "mongodb";
import { toObjectId } from "@/src/lib/security/to-object-id";

/**
 * Shared idempotent utility for organization + member + (optional) subscription
 * + invitations creation. Called from:
 *   - The Stripe webhook (auth-plugins.js) — passes `subscriptionInfo`
 *   - The verify-checkout-session fallback — passes `subscriptionInfo`
 *   - `databaseHooks.user.create.after` for the app-managed trial — passes
 *     `appTrialDays: 30` and NO `subscriptionInfo`
 *
 * @param {Object} input
 * @param {Object} input.mongoDb - MongoDB database instance
 * @param {string} input.userId - Better Auth user ID
 * @param {Object} input.orgData - Organization fields (companyName, siret, siren, etc.)
 * @param {Object|null} [input.subscriptionInfo] - Stripe subscription object (omit for trial-only)
 * @param {number|null} [input.appTrialDays] - When set, grants an app-managed
 *   trial of this length on the org (sets isTrialActive/trialStartDate/
 *   trialEndDate/hasUsedTrial). Mutually compatible with Stripe `trialing` but
 *   sets `stripeTrialActive: false` to mark the origin as app-managed.
 * @param {Object} [input.sessionMetadata] - Checkout session metadata
 * @param {Object|null} [input.pendingOrgData] - Data from pending_org_data collection
 * @param {string|null} [input.pendingOrgDataId] - ID of pending_org_data doc to clean up
 * @returns {Promise<Object>} Result with organizationId, flags for what was created
 */
export async function createOrganizationWithSubscription({
  mongoDb,
  userId,
  orgData,
  subscriptionInfo = null,
  appTrialDays = null,
  markOnboardingComplete = true,
  sessionMetadata = {},
  pendingOrgData = null,
  pendingOrgDataId = null,
}) {
  const result = {
    organizationId: null,
    orgCreated: false,
    orgUpdated: false,
    memberCreated: false,
    subscriptionCreated: false,
    invitationsSent: 0,
    invitationErrors: 0,
  };

  const {
    companyName = "Mon entreprise",
    orgName = companyName,
    siret = "",
    siren = "",
    employeeCount = "",
    orgType = "business",
    legalForm = "",
    addressStreet = "",
    addressCity = "",
    addressZipCode = "",
    addressCountry = "France",
    activitySector = "",
    activityCategory = "",
  } = orgData;

  const orgLogo = pendingOrgData?.logo || null;
  const orgInvitedMembers = pendingOrgData?.invitedMembers || [];

  // ──────────────────────────────────────────────
  // 1. Resolve organization (find existing or create new)
  // ──────────────────────────────────────────────
  let organizationObjectId = null;

  // Check if user already has a membership
  const existingMember = await mongoDb.collection("member").findOne({
    userId: new ObjectId(userId),
  });

  if (existingMember) {
    // User already has an org. Check if it's for the SAME org (same SIRET) or a NEW one.
    organizationObjectId =
      existingMember.organizationId instanceof ObjectId
        ? existingMember.organizationId
        : new ObjectId(existingMember.organizationId.toString());

    if (siret) {
      const existingOrg = await mongoDb
        .collection("organization")
        .findOne({ _id: organizationObjectId });

      if (existingOrg && existingOrg.siret && existingOrg.siret !== siret) {
        // Different SIRET = user is creating a SECOND org, don't reuse the old one
        organizationObjectId = null;
        console.log(
          `🆕 [ORG-CREATION] User ${userId} creating new org (different SIRET: ${siret} vs ${existingOrg.siret})`,
        );
      }
    }

    if (organizationObjectId) {
      // Update the existing org with new data
      result.orgUpdated = true;
      console.log(
        `♻️ [ORG-CREATION] Existing org found for userId ${userId}: ${organizationObjectId}`,
      );

      await mongoDb.collection("organization").updateOne(
        { _id: organizationObjectId },
        {
          $set: {
            companyName,
            siret: siret || "",
            siren: siren || "",
            employeeCount: employeeCount || "",
            organizationType: orgType || "business",
            legalForm: legalForm || "",
            addressStreet: addressStreet || "",
            addressCity: addressCity || "",
            addressZipCode: addressZipCode || "",
            addressCountry: addressCountry || "France",
            activitySector: activitySector || "",
            activityCategory: activityCategory || "",
            ...(orgLogo && { logo: orgLogo }),
            onboardingCompleted: true,
            updatedAt: new Date(),
          },
        },
      );
    }
  }

  // If no org found via member, check by SIRET
  if (!organizationObjectId && siret) {
    const existingOrg = await mongoDb
      .collection("organization")
      .findOne({ siret });

    if (existingOrg) {
      organizationObjectId = existingOrg._id;
      result.orgUpdated = true;
      console.log(
        `♻️ [ORG-CREATION] Existing org found by SIRET ${siret}, attaching user ${userId}`,
      );

      await mongoDb.collection("organization").updateOne(
        { _id: organizationObjectId },
        {
          $set: {
            onboardingCompleted: true,
            updatedAt: new Date(),
          },
        },
      );
    }
  }

  // Create new org if none found
  if (!organizationObjectId) {
    const orgSlug = `org-${userId.slice(-8)}-${Date.now().toString(36)}`;

    const newOrg = {
      name: orgName,
      slug: orgSlug,
      createdAt: new Date(),
      companyName,
      siret: siret || "",
      siren: siren || "",
      employeeCount: employeeCount || "",
      organizationType: orgType || "business",
      legalForm: legalForm || "",
      addressStreet: addressStreet || "",
      addressCity: addressCity || "",
      addressZipCode: addressZipCode || "",
      addressCountry: addressCountry || "France",
      activitySector: activitySector || "",
      activityCategory: activityCategory || "",
      ...(orgLogo && { logo: orgLogo }),
      onboardingCompleted: true,
      metadata: JSON.stringify({
        type: orgType,
        createdAt: new Date().toISOString(),
        createdAfterPayment: true,
      }),
    };

    const orgResult = await mongoDb
      .collection("organization")
      .insertOne(newOrg);
    organizationObjectId = orgResult.insertedId;
    result.orgCreated = true;
    console.log(`✅ [ORG-CREATION] New org created: ${organizationObjectId}`);
  }

  result.organizationId = organizationObjectId.toString();

  // ──────────────────────────────────────────────
  // 2. Create member (upsert on userId + organizationId)
  // ──────────────────────────────────────────────
  try {
    await mongoDb.collection("member").updateOne(
      {
        userId: new ObjectId(userId),
        organizationId: organizationObjectId,
      },
      {
        $setOnInsert: {
          userId: new ObjectId(userId),
          organizationId: organizationObjectId,
          role: "owner",
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
    result.memberCreated = true;
    console.log(`✅ [ORG-CREATION] Member owner upserted for userId ${userId}`);
  } catch (error) {
    if (error.code === 11000) {
      // Already exists — idempotent
      result.memberCreated = false;
      console.log(
        `♻️ [ORG-CREATION] Member already exists (duplicate key), skipping`,
      );
    } else {
      throw error;
    }
  }

  // ──────────────────────────────────────────────
  // 3. Update sessions with activeOrganizationId
  // ──────────────────────────────────────────────
  // MOYEN-25 fix: userId is stored as ObjectId in session collection (ADR-004)
  const updateResult = await mongoDb
    .collection("session")
    .updateMany(
      { userId: toObjectId(userId) },
      { $set: { activeOrganizationId: result.organizationId } },
    );
  console.log(
    `✅ [ORG-CREATION] ${updateResult.modifiedCount} session(s) updated with activeOrganizationId`,
  );

  // ──────────────────────────────────────────────
  // 4. Update user — mark onboarding as completed
  // ──────────────────────────────────────────────
  // Skipped when markOnboardingComplete=false (e.g. when called from
  // databaseHooks.user.create.after, where the org is a placeholder and the
  // user still has to fill the workspace step before being marked completed).
  if (markOnboardingComplete) {
    await mongoDb.collection("user").updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          hasSeenOnboarding: true,
          onboardingStep: "completed",
          updatedAt: new Date(),
        },
        $unset: {
          onboardingData: "",
        },
      },
    );
    console.log(
      `✅ [ORG-CREATION] onboardingStep set to "completed" for userId: ${userId}`,
    );
  }

  // ──────────────────────────────────────────────
  // 4b. App-managed trial (no Stripe subscription)
  // ──────────────────────────────────────────────
  // Used by databaseHooks.user.create.after when ENABLE_APP_TRIAL is ON.
  // Sets trial fields directly on the organization without creating a Stripe
  // subscription. stripeTrialActive: false discriminates this from a Stripe
  // trial (set elsewhere when subscriptionInfo.status === "trialing").
  if (appTrialDays && !subscriptionInfo) {
    // Decision #16: only the user's FIRST org gets the trial. Additional orgs
    // created later must NOT re-grant a trial — detect by checking whether
    // the user already had any other org marked hasUsedTrial.
    let anotherTrialUsedOrg = null;
    try {
      const otherMember = await mongoDb.collection("member").findOne({
        userId: new ObjectId(userId),
        organizationId: { $ne: organizationObjectId },
      });
      if (otherMember) {
        anotherTrialUsedOrg = await mongoDb
          .collection("organization")
          .findOne(
            { _id: otherMember.organizationId, hasUsedTrial: true },
            { projection: { _id: 1 } },
          );
      }
    } catch (err) {
      console.warn(`⚠️ [ORG-CREATION] Decision-16 check failed:`, err.message);
    }

    if (anotherTrialUsedOrg) {
      console.log(
        `🚫 [ORG-CREATION] Decision #16 — user already used a trial on another org, no app-trial granted`,
      );
    } else {
      const now = new Date();
      const end = new Date(now.getTime() + appTrialDays * 24 * 60 * 60 * 1000);
      await mongoDb.collection("organization").updateOne(
        { _id: organizationObjectId },
        {
          $set: {
            isTrialActive: true,
            trialStartDate: now.toISOString(),
            trialEndDate: end.toISOString(),
            hasUsedTrial: true,
            stripeTrialActive: false,
            updatedAt: now,
          },
        },
      );
      console.log(
        `✅ [ORG-CREATION] App-managed trial granted (${appTrialDays} days) on org ${result.organizationId}`,
      );
    }
  }

  // ──────────────────────────────────────────────
  // 5. Create subscription (with duplicate key catch)
  // ──────────────────────────────────────────────
  if (subscriptionInfo) {
    try {
      const existingSub = await mongoDb
        .collection("subscription")
        .findOne({ referenceId: result.organizationId });

      if (!existingSub) {
        const planName =
          subscriptionInfo.metadata?.planName ||
          sessionMetadata.planName ||
          "freelance";

        const subscriptionData = {
          plan: planName,
          referenceId: result.organizationId,
          stripeCustomerId:
            typeof subscriptionInfo.customer === "string"
              ? subscriptionInfo.customer
              : subscriptionInfo.customer?.id,
          status: subscriptionInfo.status,
          seats: 1,
          cancelAtPeriodEnd: subscriptionInfo.cancel_at_period_end || false,
          periodEnd: subscriptionInfo.current_period_end
            ? new Date(subscriptionInfo.current_period_end * 1000)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          periodStart: subscriptionInfo.current_period_start
            ? new Date(subscriptionInfo.current_period_start * 1000)
            : new Date(),
          stripeSubscriptionId: subscriptionInfo.id,
          currentPeriodEnd: subscriptionInfo.current_period_end
            ? new Date(subscriptionInfo.current_period_end * 1000)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          currentPeriodStart: subscriptionInfo.current_period_start
            ? new Date(subscriptionInfo.current_period_start * 1000)
            : new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await mongoDb.collection("subscription").insertOne(subscriptionData);
        result.subscriptionCreated = true;
        console.log(
          `✅ [ORG-CREATION] Subscription created for org: ${result.organizationId} (plan: ${planName})`,
        );
      } else {
        console.log(
          `♻️ [ORG-CREATION] Subscription already exists for org: ${result.organizationId}`,
        );
      }
    } catch (error) {
      if (error.code === 11000) {
        console.log(`♻️ [ORG-CREATION] Subscription duplicate key, skipping`);
      } else {
        console.error(`❌ [ORG-CREATION] Subscription creation error:`, error);
      }
    }

    // ──────────────────────────────────────────────
    // 5b. Handle trial status on organization
    // ──────────────────────────────────────────────
    try {
      const orgUpdateData = {
        onboardingCompleted: true,
        updatedAt: new Date(),
      };

      if (subscriptionInfo.status === "trialing") {
        const trialEnd = subscriptionInfo.trial_end
          ? new Date(subscriptionInfo.trial_end * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        orgUpdateData.isTrialActive = true;
        orgUpdateData.trialStartDate = new Date().toISOString();
        orgUpdateData.trialEndDate = trialEnd.toISOString();
        orgUpdateData.stripeTrialActive = true;
      } else if (subscriptionInfo.status === "active") {
        orgUpdateData.isTrialActive = false;
        orgUpdateData.hasUsedTrial = true;
        orgUpdateData.stripeTrialActive = false;
      }

      await mongoDb
        .collection("organization")
        .updateOne({ _id: organizationObjectId }, { $set: orgUpdateData });
    } catch (trialError) {
      console.warn(
        `⚠️ [ORG-CREATION] Trial status update error:`,
        trialError.message,
      );
    }
  }

  // ──────────────────────────────────────────────
  // 6. Send invitations (with deduplication)
  // ──────────────────────────────────────────────
  if (orgInvitedMembers.length > 0) {
    try {
      const inviterUser = await mongoDb
        .collection("user")
        .findOne({ _id: new ObjectId(userId) });

      const org = await mongoDb
        .collection("organization")
        .findOne({ _id: organizationObjectId });

      if (inviterUser && org) {
        // Résolu une seule fois avant les envois concurrents : un import()
        // dynamique par membre invité entraînerait une résolution concurrente
        // du même module, ce qui peut retourner des instances différentes.
        const { sendOrganizationInvitationEmail } =
          await import("./auth-utils.js");

        const invitationResults = await Promise.allSettled(
          orgInvitedMembers
            .filter((m) => m && (m.email || m).toString().trim())
            .map(async (memberItem) => {
              const memberEmail =
                typeof memberItem === "string" ? memberItem : memberItem.email;
              const memberRole =
                typeof memberItem === "string"
                  ? "member"
                  : memberItem.role || "member";

              // Deduplication: check for existing pending invitation
              const existingInvitation = await mongoDb
                .collection("invitation")
                .findOne({
                  organizationId: organizationObjectId,
                  email: memberEmail.trim().toLowerCase(),
                  status: "pending",
                });

              if (existingInvitation) {
                console.log(
                  `♻️ [ORG-CREATION] Invitation already exists for ${memberEmail}, skipping`,
                );
                return { skipped: true, email: memberEmail };
              }

              const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

              const insertResult = await mongoDb
                .collection("invitation")
                .insertOne({
                  organizationId: organizationObjectId,
                  email: memberEmail.trim(),
                  role: memberRole,
                  inviterId: new ObjectId(userId),
                  status: "pending",
                  expiresAt,
                  createdAt: new Date(),
                });

              const invitationId = insertResult.insertedId.toString();

              await sendOrganizationInvitationEmail({
                id: invitationId,
                email: memberEmail.trim(),
                role: memberRole,
                organization: {
                  id: result.organizationId,
                  name: org.name,
                },
                inviter: {
                  user: {
                    id: userId,
                    name: inviterUser.name,
                    email: inviterUser.email,
                  },
                },
              });

              console.log(
                `✅ [ORG-CREATION] Invitation sent to ${memberEmail}`,
              );
              return { sent: true, email: memberEmail };
            }),
        );

        result.invitationsSent = invitationResults.filter(
          (r) => r.status === "fulfilled" && r.value?.sent,
        ).length;
        result.invitationErrors = invitationResults.filter(
          (r) => r.status === "rejected",
        ).length;

        console.log(
          `✅ [ORG-CREATION] Invitations: ${result.invitationsSent} sent, ${result.invitationErrors} errors`,
        );
      }
    } catch (inviteError) {
      console.error(`❌ [ORG-CREATION] Invitation error:`, inviteError);
    }
  }

  // ──────────────────────────────────────────────
  // 7. Clean pending data
  // ──────────────────────────────────────────────
  if (pendingOrgDataId) {
    mongoDb
      .collection("pending_org_data")
      .deleteOne({ _id: new ObjectId(pendingOrgDataId) })
      .catch(() => {});
  }

  return result;
}
