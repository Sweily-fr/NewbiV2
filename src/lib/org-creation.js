import { ObjectId } from "mongodb";

/**
 * Shared idempotent utility for organization + member + subscription + invitations creation.
 * Called from both the Stripe webhook (auth-plugins.js) and verify-checkout-session fallback.
 *
 * @param {Object} input
 * @param {Object} input.mongoDb - MongoDB database instance
 * @param {string} input.userId - Better Auth user ID
 * @param {Object} input.orgData - Organization fields (companyName, siret, siren, etc.)
 * @param {Object} input.subscriptionInfo - Stripe subscription object
 * @param {Object} input.sessionMetadata - Checkout session metadata
 * @param {Object|null} input.pendingOrgData - Data from pending_org_data collection
 * @param {string|null} input.pendingOrgDataId - ID of pending_org_data doc to clean up
 * @returns {Promise<Object>} Result with organizationId, flags for what was created
 */
export async function createOrganizationWithSubscription({
  mongoDb,
  userId,
  orgData,
  subscriptionInfo,
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
          `🆕 [ORG-CREATION] User ${userId} creating new org (different SIRET: ${siret} vs ${existingOrg.siret})`
        );
      }
    }

    if (organizationObjectId) {
      // Update the existing org with new data
      result.orgUpdated = true;
      console.log(
        `♻️ [ORG-CREATION] Existing org found for userId ${userId}: ${organizationObjectId}`
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
        }
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
        `♻️ [ORG-CREATION] Existing org found by SIRET ${siret}, attaching user ${userId}`
      );

      await mongoDb.collection("organization").updateOne(
        { _id: organizationObjectId },
        {
          $set: {
            onboardingCompleted: true,
            updatedAt: new Date(),
          },
        }
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
      { upsert: true }
    );
    result.memberCreated = true;
    console.log(`✅ [ORG-CREATION] Member owner upserted for userId ${userId}`);
  } catch (error) {
    if (error.code === 11000) {
      // Already exists — idempotent
      result.memberCreated = false;
      console.log(`♻️ [ORG-CREATION] Member already exists (duplicate key), skipping`);
    } else {
      throw error;
    }
  }

  // ──────────────────────────────────────────────
  // 3. Update sessions with activeOrganizationId
  // ──────────────────────────────────────────────
  const updateResult = await mongoDb.collection("session").updateMany(
    { userId: userId },
    { $set: { activeOrganizationId: result.organizationId } }
  );
  console.log(
    `✅ [ORG-CREATION] ${updateResult.modifiedCount} session(s) updated with activeOrganizationId`
  );

  // ──────────────────────────────────────────────
  // 4. Update user — hasSeenOnboarding: true
  // ──────────────────────────────────────────────
  await mongoDb.collection("user").updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        hasSeenOnboarding: true,
        updatedAt: new Date(),
      },
    }
  );
  console.log(`✅ [ORG-CREATION] hasSeenOnboarding set to true for userId: ${userId}`);

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
          `✅ [ORG-CREATION] Subscription created for org: ${result.organizationId} (plan: ${planName})`
        );
      } else {
        console.log(
          `♻️ [ORG-CREATION] Subscription already exists for org: ${result.organizationId}`
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
        .updateOne(
          { _id: organizationObjectId },
          { $set: orgUpdateData }
        );
    } catch (trialError) {
      console.warn(`⚠️ [ORG-CREATION] Trial status update error:`, trialError.message);
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
                  `♻️ [ORG-CREATION] Invitation already exists for ${memberEmail}, skipping`
                );
                return { skipped: true, email: memberEmail };
              }

              const expiresAt = new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000
              );

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

              const { sendOrganizationInvitationEmail } = await import(
                "./auth-utils.js"
              );

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

              console.log(`✅ [ORG-CREATION] Invitation sent to ${memberEmail}`);
              return { sent: true, email: memberEmail };
            })
        );

        result.invitationsSent = invitationResults.filter(
          (r) => r.status === "fulfilled" && r.value?.sent
        ).length;
        result.invitationErrors = invitationResults.filter(
          (r) => r.status === "rejected"
        ).length;

        console.log(
          `✅ [ORG-CREATION] Invitations: ${result.invitationsSent} sent, ${result.invitationErrors} errors`
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
