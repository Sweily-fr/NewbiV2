import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/src/lib/auth";
import { mongoDb } from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";
import DashboardClientLayout from "./dashboard-client-layout";

/**
 * Vérifie si l'utilisateur a un abonnement actif via son organisation
 * @param {string} userId - ID de l'utilisateur
 * @param {string|null} activeOrgId - ID de l'organisation active (optionnel)
 * @returns {Promise<{hasSubscription: boolean, reason?: string, organizationId?: string}>}
 */
async function checkSubscription(userId, activeOrgId) {
  try {
    const userObjectId = new ObjectId(userId);

    // 1. Récupérer l'organisation active
    let organizationId = activeOrgId;

    if (!organizationId) {
      // Fallback: Trouver une organisation où l'utilisateur est membre
      const members = await mongoDb
        .collection("member")
        .find({ userId: userObjectId })
        .toArray();

      if (!members || members.length === 0) {
        console.log("[Dashboard Layout] Utilisateur sans organisation");
        return { hasSubscription: false, reason: "no_organization" };
      }

      // Priorité: owner > admin > member > viewer
      const rolePriority = { owner: 0, admin: 1, member: 2, viewer: 3, accountant: 2 };
      members.sort((a, b) => {
        const priorityA = rolePriority[a.role] ?? 99;
        const priorityB = rolePriority[b.role] ?? 99;
        return priorityA - priorityB;
      });

      organizationId = members[0].organizationId.toString();
    }

    console.log(`[Dashboard Layout] Vérification abonnement pour org: ${organizationId}`);

    // 2. Vérifier l'abonnement de l'organisation (recherche avec les deux formats d'ID)
    const subscription = await mongoDb.collection("subscription").findOne({
      $or: [
        { referenceId: organizationId },
        { organizationId: organizationId },
      ],
    });

    if (!subscription) {
      console.log(`[Dashboard Layout] Aucun abonnement pour org: ${organizationId}`);
      return { hasSubscription: false, reason: "no_subscription", organizationId };
    }

    console.log(`[Dashboard Layout] Abonnement trouvé - Status: ${subscription.status}`);

    // 3. Vérifier si l'abonnement est valide
    const isActive = subscription.status === "active" || subscription.status === "trialing";

    const isCanceledButValid =
      subscription.status === "canceled" &&
      subscription.periodEnd &&
      new Date(subscription.periodEnd) > new Date();

    if (isActive || isCanceledButValid) {
      return { hasSubscription: true, organizationId };
    }

    return { hasSubscription: false, reason: "subscription_expired", organizationId };
  } catch (error) {
    console.error("[Dashboard Layout] Erreur vérification abonnement:", error);
    return { hasSubscription: false, reason: "error" };
  }
}

/**
 * Vérifie si l'utilisateur revient d'un paiement Stripe récent et valide
 * @param {string} organizationId - ID de l'organisation
 * @returns {Promise<boolean>}
 */
async function checkRecentStripePayment(organizationId) {
  try {
    // Vérifier s'il y a une session de checkout récente (< 5 min) pour cette organisation
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Chercher un abonnement créé très récemment (le webhook peut être en cours)
    const recentSubscription = await mongoDb.collection("subscription").findOne({
      $or: [
        { referenceId: organizationId },
        { organizationId: organizationId },
      ],
      createdAt: { $gte: fiveMinutesAgo },
    });

    if (recentSubscription) {
      console.log("[Dashboard Layout] Abonnement récent trouvé, bypass autorisé");
      return true;
    }

    return false;
  } catch (error) {
    console.error("[Dashboard Layout] Erreur vérification paiement récent:", error);
    return false;
  }
}

/**
 * Server Component Layout pour le Dashboard
 * Vérifie l'authentification ET l'abonnement côté serveur avant de rendre le contenu
 */
export default async function DashboardLayout({ children }) {
  // Récupérer les headers de la requête
  const headersList = await headers();

  // Récupérer la session utilisateur côté serveur
  let session;
  try {
    session = await auth.api.getSession({
      headers: headersList,
    });
  } catch (error) {
    console.error("[Dashboard Layout] Erreur récupération session:", error);
    redirect("/auth/login");
  }

  // Vérifier l'authentification
  if (!session?.user) {
    console.log("[Dashboard Layout] Pas de session, redirection vers login");
    redirect("/auth/login");
  }

  console.log(`[Dashboard Layout] Session trouvée pour: ${session.user.email}`);

  // Vérifier l'abonnement
  const { hasSubscription, reason, organizationId } = await checkSubscription(
    session.user.id,
    session.session?.activeOrganizationId
  );

  console.log(`[Dashboard Layout] hasSubscription: ${hasSubscription}, reason: ${reason}`);

  // Si pas d'abonnement valide, vérifier s'il y a un paiement Stripe récent (webhook en cours)
  if (!hasSubscription && organizationId) {
    const hasRecentPayment = await checkRecentStripePayment(organizationId);

    if (hasRecentPayment) {
      console.log("[Dashboard Layout] Paiement récent détecté, accès temporaire autorisé");
      return <DashboardClientLayout>{children}</DashboardClientLayout>;
    }
  }

  // Si pas d'abonnement valide, rediriger vers onboarding
  if (!hasSubscription) {
    console.log("[Dashboard Layout] Pas d'abonnement, redirection vers onboarding");
    redirect("/onboarding");
  }

  // Utilisateur authentifié avec abonnement valide
  return <DashboardClientLayout>{children}</DashboardClientLayout>;
}
