import crypto from "crypto";
import { ObjectId } from "mongodb";
import { createOrganizationWithSubscription } from "./org-creation.js";
import { sendEmail } from "./auth-utils.js";
import { emailTemplates } from "./email-templates/index.js";
import {
  SIRET_VERIFICATION_ERRORS,
  siretVerificationMessage,
  verifySiret,
} from "./siret-verification.js";

/**
 * Clients des comptes gestionnaires (cabinets comptables).
 *
 * Un gestionnaire (collection `accountmanagers`, créée depuis newbi-admin)
 * crée l'espace de ses clients, depuis l'admin ou depuis son espace
 * gestionnaire. Pour chaque client :
 * - un compte utilisateur sans mot de passe, owner (super admin) de l'espace ;
 * - l'espace lui-même (org-creation.js) ;
 * - le gestionnaire comme membre « accountant » (droits Comptable) ;
 * - la fiche `managedclients` qui dit qui paie ;
 * - si le gestionnaire paie : un abonnement Newbi actif, sans Stripe,
 *   marqué managedByAccountManagerId, pour que tous les contrôles d'accès
 *   existants le voient comme un abonnement normal ;
 * - un e-mail au client pour choisir son mot de passe (lien de 7 jours).
 */

export class ManagedClientError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const MANAGED_CLIENT_PLANS = ["freelance", "pme", "entreprise"];
export const MANAGED_CLIENT_PAYERS = ["client", "manager"];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WELCOME_LINK_DAYS = 7;
// Essai de l'application quand le client paie lui-même (flag ENABLE_APP_TRIAL)
const CLIENT_APP_TRIAL_DAYS = 30;

const text = (value, max) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const asObjectId = (value) => {
  if (value instanceof ObjectId) return value;
  return typeof value === "string" && /^[0-9a-f]{24}$/i.test(value)
    ? new ObjectId(value)
    : null;
};

/** Valide et normalise la saisie du cabinet. */
export function parseManagedClientInput(input = {}) {
  const companyName = text(input.companyName, 120);
  if (!companyName) {
    throw new ManagedClientError(
      400,
      "Le nom de l'entreprise est obligatoire.",
    );
  }

  // Obligatoire, comme à l'inscription : sans lui l'espace ne peut pas
  // émettre de documents (informations d'entreprise incomplètes)
  const siret = text(input.siret, 40).replace(/\s+/g, "");
  if (!/^\d{14}$/.test(siret)) {
    throw new ManagedClientError(400, "Le SIRET doit comporter 14 chiffres.");
  }

  const email = text(input.email, 200).toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    throw new ManagedClientError(400, "Adresse e-mail du client invalide.");
  }

  const plan = MANAGED_CLIENT_PLANS.includes(input.plan) ? input.plan : null;
  if (!plan) throw new ManagedClientError(400, "Formule invalide.");

  const payer = MANAGED_CLIENT_PAYERS.includes(input.payer)
    ? input.payer
    : "client";

  return {
    companyName,
    siret,
    email,
    firstName: text(input.firstName, 60),
    lastName: text(input.lastName, 60),
    plan,
    payer,
  };
}

/** Gestionnaire actif d'un utilisateur, ou null. */
export async function findActiveAccountManagerByUserId(mongoDb, userId) {
  const uid = asObjectId(userId);
  if (!uid) return null;
  return mongoDb
    .collection("accountmanagers")
    .findOne({ userId: uid, status: "active" });
}

/**
 * Crée un client complet pour un gestionnaire.
 * @param {object} params
 * @param {import("mongodb").Db} params.mongoDb
 * @param {string|ObjectId} params.managerId
 * @param {object} params.input saisie du cabinet (voir parseManagedClientInput)
 * @param {{ type: "admin"|"manager", email: string }} params.actor auteur
 * @param {string} [params.baseUrl] URL du site pour le lien de mot de passe
 */
export async function createManagedClient({
  mongoDb,
  managerId,
  input,
  actor,
  baseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
}) {
  const data = parseManagedClientInput(input);

  const managerOid = asObjectId(managerId);
  const manager = managerOid
    ? await mongoDb.collection("accountmanagers").findOne({ _id: managerOid })
    : null;
  if (!manager) {
    throw new ManagedClientError(404, "Gestionnaire introuvable.");
  }
  if (manager.status !== "active") {
    throw new ManagedClientError(
      403,
      "Ce gestionnaire est suspendu : il ne peut pas créer de client.",
    );
  }

  if (await mongoDb.collection("user").findOne({ email: data.email })) {
    throw new ManagedClientError(
      409,
      "Cette adresse a déjà un compte Newbi. Le rattachement d'un client existant n'est pas encore possible.",
    );
  }

  const managerUser = await mongoDb
    .collection("user")
    .findOne({ _id: manager.userId }, { projection: { _id: 1 } });
  if (!managerUser) {
    throw new ManagedClientError(
      409,
      "Le compte du gestionnaire n'existe plus.",
    );
  }

  // SIRET vérifié au registre (même contrôle que l'inscription) : il remplit
  // l'adresse et la forme juridique, pour que l'espace puisse émettre ses
  // documents dès le départ
  const verification = await verifySiret(data.siret);
  if (!verification.ok) {
    throw new ManagedClientError(
      verification.reason === SIRET_VERIFICATION_ERRORS.SERVICE_UNAVAILABLE
        ? 503
        : 400,
      siretVerificationMessage(verification.reason),
    );
  }
  const company = verification.company;

  const now = new Date();
  const userId = new ObjectId();
  const created = { userId: null, organizationId: null };

  try {
    // 1. Compte du client, sans mot de passe (choisi via l'e-mail). Inséré
    // directement : les hooks Better Auth de création d'utilisateur le
    // renverraient vers l'onboarding et créeraient un espace vide en trop.
    await mongoDb.collection("user").insertOne({
      _id: userId,
      email: data.email,
      emailVerified: false,
      name: [data.firstName, data.lastName].filter(Boolean).join(" "),
      lastName: data.lastName,
      createdAt: now,
      updatedAt: now,
      role: "member",
      isActive: true,
      redirect_after_login: "dashboard",
      twoFactorEnabled: false,
      hasSeenOnboarding: true,
      onboardingStep: "completed",
      isInvitedUser: false,
      managedByAccountManagerId: manager._id,
    });
    created.userId = userId;

    // 2. Espace du client, dont il est owner. Essai de l'application s'il
    // paie lui-même (sans effet si ENABLE_APP_TRIAL est désactivé).
    const orgResult = await createOrganizationWithSubscription({
      mongoDb,
      userId: userId.toString(),
      orgData: {
        companyName: data.companyName,
        siret: company.siret,
        siren: company.siren,
        legalForm: company.natureJuridique,
        addressStreet: company.addressStreet,
        addressCity: company.addressCity,
        addressZipCode: company.addressZipCode,
        addressCountry: company.addressCountry || "France",
      },
      appTrialDays: data.payer === "client" ? CLIENT_APP_TRIAL_DAYS : null,
      markOnboardingComplete: true,
    });
    const organizationId = new ObjectId(orgResult.organizationId);
    created.organizationId = organizationId;

    // E-mail de contact = celui du dirigeant ; preuve de la vérification
    // du SIRET, comme à l'inscription
    await mongoDb.collection("organization").updateOne(
      { _id: organizationId },
      {
        $set: {
          companyEmail: data.email,
          siretVerifiedAt: now,
          siretVerificationSource: "recherche-entreprises.api.gouv.fr",
          denominationUniteLegale: company.denominationUniteLegale,
          activitePrincipale: company.activitePrincipale,
          dateCreationUniteLegale: company.dateCreation,
        },
      },
    );

    // 3. Le gestionnaire entre avec les droits Comptable
    await mongoDb.collection("member").insertOne({
      userId: manager.userId,
      organizationId,
      role: "accountant",
      createdAt: now,
    });

    // 4. Le gestionnaire paie : abonnement actif sans Stripe
    if (data.payer === "manager") {
      await mongoDb.collection("subscription").insertOne({
        referenceId: organizationId.toString(),
        plan: data.plan,
        status: "active",
        periodStart: now,
        periodEnd: null,
        cancelAtPeriodEnd: false,
        seats: 1,
        managedByAccountManagerId: manager._id,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 5. Fiche du lien gestionnaire / client
    await mongoDb.collection("managedclients").insertOne({
      managerId: manager._id,
      organizationId,
      payer: data.payer,
      plan: data.plan,
      status: "active",
      startedAt: now,
      endedAt: null,
      endedBy: null,
      createdBy: { type: actor?.type || "admin", email: actor?.email || null },
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    await rollback(mongoDb, created);
    throw error;
  }

  // 6. Lien pour choisir le mot de passe : même jeton que « mot de passe
  // oublié » de Better Auth, mais valable 7 jours et avec un e-mail dédié
  const token = crypto.randomBytes(32).toString("hex");
  await mongoDb.collection("verification").insertOne({
    identifier: `reset-password:${token}`,
    value: userId.toString(),
    expiresAt: new Date(now.getTime() + WELCOME_LINK_DAYS * 86400000),
    createdAt: now,
    updatedAt: now,
  });
  const url = `${baseUrl.replace(/\/+$/, "")}/auth/reset-password?token=${token}`;

  let emailSent = true;
  try {
    await sendEmail({
      to: data.email,
      subject: `${manager.name} a créé votre espace Newbi`,
      html: emailTemplates.managedClientWelcome({
        managerName: manager.name,
        companyName: data.companyName,
        url,
      }),
    });
  } catch (error) {
    // L'espace existe : l'e-mail pourra être renvoyé, on ne défait rien
    emailSent = false;
    console.error(
      `[MANAGED-CLIENT] E-mail de bienvenue non envoyé à ${data.email}:`,
      error?.message,
    );
  }

  return {
    organizationId: created.organizationId.toString(),
    userId: userId.toString(),
    email: data.email,
    companyName: data.companyName,
    payer: data.payer,
    plan: data.plan,
    emailSent,
  };
}

/**
 * Clients d'un gestionnaire, du plus récent au plus ancien, avec l'état de
 * leur accès : abonnement (payé par le client ou par le gestionnaire) ou
 * essai de l'application.
 */
export async function listManagedClients(mongoDb, managerId) {
  const managerOid = asObjectId(managerId);
  if (!managerOid) return [];
  const links = await mongoDb
    .collection("managedclients")
    .find({ managerId: managerOid })
    .sort({ status: 1, startedAt: -1 })
    .toArray();
  if (links.length === 0) return [];

  const orgIds = links.map((l) => l.organizationId);
  const [orgs, owners, subscriptions] = await Promise.all([
    mongoDb
      .collection("organization")
      .find(
        { _id: { $in: orgIds } },
        {
          projection: {
            name: 1,
            companyName: 1,
            siret: 1,
            isTrialActive: 1,
            trialEndDate: 1,
          },
        },
      )
      .toArray(),
    mongoDb
      .collection("member")
      .find(
        { organizationId: { $in: orgIds }, role: "owner" },
        { projection: { organizationId: 1, userId: 1 } },
      )
      .toArray(),
    mongoDb
      .collection("subscription")
      .find(
        {
          referenceId: { $in: orgIds.map(String) },
          status: { $in: ["active", "trialing", "past_due"] },
        },
        { projection: { referenceId: 1, plan: 1, status: 1 } },
      )
      .toArray(),
  ]);
  const ownerUsers = await mongoDb
    .collection("user")
    .find(
      { _id: { $in: owners.map((o) => o.userId) } },
      { projection: { email: 1, name: 1 } },
    )
    .toArray();

  const orgById = new Map(orgs.map((o) => [String(o._id), o]));
  const ownerByOrg = new Map(
    owners.map((o) => [String(o.organizationId), String(o.userId)]),
  );
  const userById = new Map(ownerUsers.map((u) => [String(u._id), u]));
  const subByOrg = new Map(subscriptions.map((s) => [s.referenceId, s]));

  return links.map((link) => {
    const orgId = String(link.organizationId);
    const org = orgById.get(orgId);
    const owner = userById.get(ownerByOrg.get(orgId));
    const sub = subByOrg.get(orgId);
    const trialActive =
      org?.isTrialActive === true &&
      org?.trialEndDate &&
      new Date(org.trialEndDate) > new Date();
    return {
      id: String(link._id),
      organizationId: orgId,
      name: org?.companyName || org?.name || null,
      siret: org?.siret || null,
      ownerEmail: owner?.email || null,
      ownerName: owner?.name || null,
      payer: link.payer,
      plan: link.plan || sub?.plan || null,
      status: link.status,
      startedAt: link.startedAt,
      access: sub
        ? { type: "subscription", status: sub.status }
        : trialActive
          ? { type: "trial", endsAt: org.trialEndDate }
          : { type: "none" },
    };
  });
}

// Défait une création interrompue : rien ne doit rester à moitié créé
async function rollback(mongoDb, { userId, organizationId }) {
  const steps = [];
  if (organizationId) {
    steps.push(
      mongoDb.collection("managedclients").deleteMany({ organizationId }),
      mongoDb
        .collection("subscription")
        .deleteMany({ referenceId: organizationId.toString() }),
      mongoDb.collection("member").deleteMany({ organizationId }),
      mongoDb.collection("organization").deleteOne({ _id: organizationId }),
    );
  }
  if (userId) {
    steps.push(mongoDb.collection("user").deleteOne({ _id: userId }));
  }
  const results = await Promise.allSettled(steps);
  for (const result of results) {
    if (result.status === "rejected") {
      console.error(
        "[MANAGED-CLIENT] Nettoyage incomplet après échec :",
        result.reason?.message,
      );
    }
  }
}
