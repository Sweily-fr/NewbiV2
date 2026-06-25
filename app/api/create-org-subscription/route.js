import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import Stripe from "stripe";
import { createOrgSubscriptionSchema } from "@/src/lib/schemas/create-org-subscription";
import { apiError, withErrorHandler } from "@/src/lib/security";
import { isAppTrialEnabled } from "@/src/lib/feature-flags";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function handler(request) {
  // 1. Auth check first (Principle 1)
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    throw apiError(401, "Non authentifié");
  }

  // 2. Parse and validate body (Principle 7)
  let body;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "Body JSON invalide");
  }

  const validation = createOrgSubscriptionSchema.safeParse(body);
  if (!validation.success) {
    const flat = validation.error.flatten();
    return apiError(400, "Données invalides", flat, flat);
  }

  const { organizationData } = validation.data;
  const planName = organizationData.planName;
  const isAnnual = organizationData.isAnnual;

  // When ENABLE_APP_TRIAL is ON, the trial is fully managed by the app
  // (Lot 3 cron + Lot 1 gating). Stripe is then ONLY used for paid plans,
  // so trial_period_days must be 0 — never re-grant a Stripe trial.
  //
  // - Main signup with flag ON does NOT reach this endpoint anymore (org +
  //   app trial are created at user.create.after).
  // - /create-workspace (additional org) reaches this with flag ON → decision
  //   #16: no trial, payment immediate (trial_period_days: 0).
  // - Flag OFF preserves the legacy 30-day Stripe trial for the entire flow.
  //
  // EXCEPTION (Pattern A — "convert trial at trial_end") : si on est dans un
  // upgrade d'org existante AVEC trial maison encore actif, on garde la date
  // de fin du trial maison comme date de première facturation Stripe. Les
  // features payantes seront débloquées immédiatement via le webhook (cf.
  // auth-plugins.js handler `customer.subscription.created`).
  let trialDays = isAppTrialEnabled() ? 0 : 30;
  if (isAppTrialEnabled()) {
    console.log(
      `🚫 [CREATE-SUB] App-trial flag ON — Stripe trial_period_days forced to 0`,
    );
  }

  // Anti re-essai : une org qui a DÉJÀ un abonnement (renouvellement après
  // expiration/résiliation) ou qui a déjà consommé son essai ne doit pas
  // ré-obtenir 30 jours gratuits → paiement immédiat. Sans ça, un client
  // expiré repassait par le "bon flux nouveau client" (essai) au lieu d'un
  // vrai renouvellement.
  if (trialDays > 0 && session.session?.activeOrganizationId) {
    try {
      const { mongoDb: db } = await import("@/src/lib/mongodb");
      const { ObjectId } = await import("mongodb");
      const orgId = session.session.activeOrganizationId;
      const orgObjectId = new ObjectId(orgId);
      const [existingSub, orgDoc] = await Promise.all([
        db.collection("subscription").findOne(
          { $or: [{ organizationId: orgObjectId }, { referenceId: orgId }] },
          { projection: { _id: 1 } },
        ),
        db.collection("organization").findOne(
          { _id: orgObjectId },
          { projection: { hasUsedTrial: 1 } },
        ),
      ]);
      if (existingSub || orgDoc?.hasUsedTrial === true) {
        trialDays = 0;
        console.log(
          `🚫 [CREATE-SUB] Pas d'essai — abonnement déjà existant: ${!!existingSub}, essai déjà utilisé: ${orgDoc?.hasUsedTrial === true}. Paiement immédiat.`,
        );
      }
    } catch (err) {
      console.warn(
        `⚠️ [CREATE-SUB] Échec vérif éligibilité essai (fallback: essai conservé):`,
        err.message,
      );
    }
  }

  // Pattern A : détecter "conversion du trial maison" pour cet upgrade
  let convertedTrialEndUnix = null;
  let originalAppTrialEndDate = null;
  if (
    isAppTrialEnabled() &&
    organizationData.type === "existing" &&
    session.session?.activeOrganizationId
  ) {
    try {
      const { mongoDb: db } = await import("@/src/lib/mongodb");
      const { ObjectId } = await import("mongodb");
      const org = await db.collection("organization").findOne({
        _id: new ObjectId(session.session.activeOrganizationId),
      });
      const trialEndDate = org?.trialEndDate
        ? new Date(org.trialEndDate)
        : null;
      const now = new Date();
      if (org?.isTrialActive === true && trialEndDate && trialEndDate > now) {
        convertedTrialEndUnix = Math.floor(trialEndDate.getTime() / 1000);
        originalAppTrialEndDate = trialEndDate.toISOString();
        console.log(
          `🎁 [CREATE-SUB] Trial maison actif (jusqu'au ${originalAppTrialEndDate}) → conversion en trial Stripe avec trial_end identique. Aucune facturation avant cette date.`,
        );
      }
    } catch (err) {
      console.warn(
        `⚠️ [CREATE-SUB] Échec lecture trial maison (fallback immédiat):`,
        err.message,
      );
    }
  }

  try {
    console.log(
      `✅ [CREATE-SUB] User: ${session.user.id} (${session.user.email})`,
    );

    // 2. Récupérer ou créer le customer Stripe
    let customerId = session.user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name,
        metadata: {
          userId: session.user.id,
        },
      });
      customerId = customer.id;
      console.log(`✅ [CREATE-SUB] Customer Stripe créé: ${customerId}`);

      // Mettre à jour l'utilisateur avec le customerId
      const { mongoDb } = await import("@/src/lib/mongodb");
      await mongoDb
        .collection("user")
        .updateOne(
          { id: session.user.id },
          { $set: { stripeCustomerId: customerId } },
        );
    } else {
      console.log(`✅ [CREATE-SUB] Customer Stripe existant: ${customerId}`);
    }

    // 3. Déterminer le Price ID selon le plan et la période (mensuel/annuel)
    const priceIds = {
      freelance: {
        monthly: process.env.STRIPE_FREELANCE_MONTHLY_PRICE_ID,
        annual: process.env.STRIPE_FREELANCE_YEARLY_PRICE_ID,
      },
      pme: {
        monthly: process.env.STRIPE_PME_MONTHLY_PRICE_ID,
        annual: process.env.STRIPE_PME_YEARLY_PRICE_ID,
      },
      entreprise: {
        monthly: process.env.STRIPE_ENTREPRISE_MONTHLY_PRICE_ID,
        annual: process.env.STRIPE_ENTREPRISE_YEARLY_PRICE_ID,
      },
    };

    const priceId = isAnnual
      ? priceIds[planName]?.annual
      : priceIds[planName]?.monthly;

    console.log(
      `📋 [CREATE-SUB] Plan: ${planName}, Période: ${isAnnual ? "Annuel" : "Mensuel"}, Price ID: ${priceId}`,
    );

    if (!priceId) {
      console.error(
        `❌ [CREATE-SUB] Price ID manquant pour le plan: ${planName}`,
      );
      return NextResponse.json(
        {
          error: `Price ID non configuré pour le plan ${planName}. Vérifiez les variables d'environnement.`,
          details: {
            planName,
            availablePlans: Object.keys(priceIds).filter(
              (key) => priceIds[key],
            ),
          },
        },
        { status: 500 },
      );
    }

    // 4. Déterminer si c'est une nouvelle organisation ou un upgrade d'abonnement existant
    const isNewOrganization = organizationData.type !== "existing";
    const isOnboarding = organizationData.type === "onboarding";
    const isMobileSource = organizationData.source === "mobile";

    // Dériver le baseUrl depuis l'Origin de la requête pour que Stripe
    // redirige vers le bon host (localhost, IP locale, ou domaine prod).
    // Fallback sur NEXT_PUBLIC_BETTER_AUTH_URL pour les cas sans Origin.
    const requestOrigin = request.headers.get("origin");
    const baseUrl =
      requestOrigin ||
      process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
      "http://localhost:3000";

    // Bypass ngrok interstitiel si l'URL passe par ngrok (dev mobile uniquement)
    const isNgrok = baseUrl.includes("ngrok");
    const ngrok = isNgrok ? "&ngrok-skip-browser-warning=true" : "";

    // URL de succès différente selon le cas
    let successUrl;
    let cancelUrl;

    if (isOnboarding) {
      // Flux onboarding : redirection vers page de succès dédiée
      successUrl = `${baseUrl}/onboarding/success?session_id={CHECKOUT_SESSION_ID}${isMobileSource ? "&source=mobile" : ""}${ngrok}`;
      cancelUrl = isMobileSource
        ? `${baseUrl}/auth/signup?source=mobile${ngrok}`
        : `${baseUrl}/auth/signup${isNgrok ? "?ngrok-skip-browser-warning=true" : ""}`;
    } else if (isNewOrganization) {
      successUrl = `${baseUrl}/dashboard?org_created=true&payment_success=true${ngrok}`;
      cancelUrl = `${baseUrl}/create-workspace/payment-error${isNgrok ? "?ngrok-skip-browser-warning=true" : ""}`;
    } else {
      successUrl = `${baseUrl}/dashboard?subscription_success=true${ngrok}`;
      cancelUrl = `${baseUrl}/dashboard${isNgrok ? "?ngrok-skip-browser-warning=true" : ""}`;
    }

    // 5. Stocker les données volumineuses dans MongoDB (évite la limite Stripe de 500 chars/clé)
    const { mongoDb } = await import("@/src/lib/mongodb");
    const pendingData = {
      userId: session.user.id,
      invitedMembers: organizationData.invitedMembers || [],
      logo: organizationData.logo || null,
      createdAt: new Date(),
      // TTL : le document sera nettoyé après 24h si jamais le webhook ne le supprime pas
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
    const pendingResult = await mongoDb
      .collection("pending_org_data")
      .insertOne(pendingData);
    const pendingOrgDataId = pendingResult.insertedId.toString();
    console.log(
      `✅ [CREATE-SUB] Données pendantes stockées: ${pendingOrgDataId}`,
    );

    console.log(`🔄 [CREATE-SUB] Création session Stripe Checkout...`);
    console.log(
      `📋 [CREATE-SUB] Type: ${isNewOrganization ? "Nouvelle organisation" : "Upgrade abonnement existant"}`,
    );

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      payment_method_collection: "always",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      billing_address_collection: "required",
      // Activer les codes promo dans l'interface Stripe Checkout
      allow_promotion_codes: true,
      metadata: {
        userId: session.user.id,
        isNewOrganization: isNewOrganization ? "true" : "false",
        isOnboarding: isOnboarding ? "true" : "false",
        // Référence vers les données complètes en MongoDB
        pendingOrgDataId: pendingOrgDataId,
        // Données légères pour le webhook (pas de limite de taille ici)
        orgName: organizationData.name || "",
        orgType: organizationData.type || "",
        planName: planName,
        isAnnual: isAnnual ? "true" : "false",
        organizationId: session.session?.activeOrganizationId || "",
        // Données entreprise
        employeeCount: organizationData.employeeCount || "",
        companyName: organizationData.companyName || "",
        siret: organizationData.siret || "",
        siren: organizationData.siren || "",
        legalForm: organizationData.legalForm || "",
        addressStreet: (organizationData.addressStreet || "").substring(0, 100),
        addressCity: organizationData.addressCity || "",
        addressZipCode: organizationData.addressZipCode || "",
        addressCountry: organizationData.addressCountry || "France",
        activitySector: organizationData.activitySector || "",
        activityCategory: (organizationData.activityCategory || "").substring(
          0,
          100,
        ),
      },
      subscription_data: {
        // Stripe rejects `trial_period_days: 0` (minimum is 1) — to mean
        // "no trial" the field must be OMITTED entirely. We spread it
        // conditionally so flag OFF / decision #16 (additional org) keeps the
        // historical Stripe trial, and flag ON paths go straight to billing.
        //
        // PATTERN A : si l'org est en trial maison actif, on prend la priorité
        // sur `trial_period_days` et on passe `trial_end` (timestamp Unix) à
        // Stripe = date de fin du trial maison. Stripe place la sub en
        // `trialing` jusqu'à cette date, puis facture automatiquement.
        ...(convertedTrialEndUnix
          ? { trial_end: convertedTrialEndUnix }
          : trialDays > 0
            ? { trial_period_days: trialDays }
            : {}),
        metadata: {
          userId: session.user.id,
          isNewOrganization: isNewOrganization ? "true" : "false",
          isOnboarding: isOnboarding ? "true" : "false",
          orgName: organizationData.name || "",
          orgType: organizationData.type || "",
          planName: planName,
          isAnnual: isAnnual ? "true" : "false",
          organizationId: session.session?.activeOrganizationId || "",
          employeeCount: organizationData.employeeCount || "",
          hasTrial: convertedTrialEndUnix || trialDays > 0 ? "true" : "false",
          trialDays: String(trialDays),
          // Flag Pattern A : utilisé par le webhook pour désactiver le trial
          // maison dès la création de la sub (features payantes débloquées
          // immédiatement, facturation différée).
          convertedFromAppTrial: convertedTrialEndUnix ? "true" : "false",
          appTrialEndDate: originalAppTrialEndDate || "",
        },
      },
      // Message personnalisé — adapté au trial period choisi
      custom_text: {
        submit: {
          message: convertedTrialEndUnix
            ? `Aucun prélèvement avant la fin de votre essai (${new Date(convertedTrialEndUnix * 1000).toLocaleDateString("fr-FR")}). Toutes les fonctionnalités du plan ${planName.toUpperCase()} sont accessibles immédiatement.`
            : trialDays > 0
              ? isOnboarding
                ? `Essai gratuit ${trialDays} jours - Aucun prélèvement avant la fin de l'essai`
                : `Souscription au plan ${planName.toUpperCase()} - ${trialDays} jours d'essai gratuit`
              : `Souscription au plan ${planName.toUpperCase()} - Paiement immédiat`,
        },
      },
    });

    console.log(`✅ [CREATE-SUB] Session Stripe créée: ${checkoutSession.id}`);
    console.log(`📋 [CREATE-SUB] Metadata session:`, checkoutSession.metadata);
    console.log(
      `📋 [CREATE-SUB] Metadata subscription:`,
      checkoutSession.subscription_data?.metadata,
    );

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    // Re-throw for withErrorHandler (removes error.message leak — Principle 8)
    throw error;
  }
}

export const POST = withErrorHandler(handler);
