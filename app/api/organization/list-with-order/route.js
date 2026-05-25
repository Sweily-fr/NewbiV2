import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { mongoDb } from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";
import { isAppTrialEnabled } from "@/src/lib/feature-flags";
import { isTrialAppActive } from "@/src/lib/trial-app";

export async function GET() {
  try {
    // Vérifier l'authentification
    let session;
    try {
      session = await auth.api.getSession({ headers: await headers() });
    } catch (sessionError) {
      console.error("❌ [LIST-ORG] Erreur session:", sessionError.message);
      return Response.json(
        { error: "Erreur de session", organizations: [] },
        { status: 401 },
      );
    }

    if (!session?.user) {
      return Response.json(
        { error: "Non authentifié", organizations: [] },
        { status: 401 },
      );
    }

    // Récupérer les membres de l'utilisateur avec l'ordre
    const members = await mongoDb
      .collection("member")
      .find({ userId: new ObjectId(session.user.id) })
      .toArray();

    // Récupérer les organisations correspondantes
    const organizationIds = members.map((m) => m.organizationId);
    const organizations = await mongoDb
      .collection("organization")
      .find({ _id: { $in: organizationIds } })
      .toArray();

    // Récupérer les abonnements de toutes les organisations en une seule requête
    const orgIdStrings = organizationIds.map((id) => id.toString());
    const subscriptions = await mongoDb
      .collection("subscription")
      .find({
        $or: [
          { referenceId: { $in: orgIdStrings } },
          { organizationId: { $in: orgIdStrings } },
        ],
      })
      .toArray();

    // Créer un map orgId → subscription status
    const subscriptionMap = {};
    for (const sub of subscriptions) {
      const orgId = (sub.referenceId || sub.organizationId)?.toString();
      if (!orgId) continue;
      const isActive = sub.status === "active" || sub.status === "trialing";
      const isCanceledButValid =
        sub.status === "canceled" &&
        sub.periodEnd &&
        new Date(sub.periodEnd) > new Date();
      subscriptionMap[orgId] =
        isActive || isCanceledButValid ? "active" : "expired";
    }

    const appTrialOn = isAppTrialEnabled();

    // Fusionner les données : ajouter le champ order, role et subscriptionStatus à chaque organisation
    const organizationsWithOrder = organizations.map((org) => {
      const orgIdStr = org._id.toString();
      const member = members.find(
        (m) => m.organizationId.toString() === orgIdStr,
      );

      // App-managed trial check (feature-flagged). Only applied when the org
      // has NO valid Stripe subscription — a Stripe sub always wins. When the
      // flag is OFF, this branch is skipped entirely so the historical
      // "active | expired | none" tristate is preserved exactly.
      let subscriptionStatus = subscriptionMap[orgIdStr] || "none";
      let trialEndDate = null;
      if (
        appTrialOn &&
        subscriptionStatus !== "active" &&
        isTrialAppActive(org)
      ) {
        subscriptionStatus = "trialing";
        trialEndDate = org.trialEndDate;
      }

      return {
        id: orgIdStr,
        name: org.name,
        slug: org.slug,
        createdAt: org.createdAt,
        metadata: org.metadata,
        customColor: org.customColor,
        customIcon: org.customIcon,
        order: member?.order ?? 999, // Si pas d'ordre, mettre à la fin
        role: member?.role, // Ajouter le rôle de l'utilisateur
        subscriptionStatus,
        // trialEndDate only exposed when the org is in an app-managed trial
        // (null otherwise to keep the legacy payload shape minimal).
        trialEndDate,
      };
    });

    // Trier par ordre
    organizationsWithOrder.sort((a, b) => a.order - b.order);

    return Response.json({ organizations: organizationsWithOrder });
  } catch (error) {
    console.error("❌ [LIST-ORG] Erreur:", error);
    return Response.json(
      { error: "Erreur lors de la récupération des organisations" },
      { status: 500 },
    );
  }
}
