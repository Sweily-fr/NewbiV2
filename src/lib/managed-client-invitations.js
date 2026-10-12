import { ObjectId } from "mongodb";
import { sendEmail } from "./auth-utils.js";
import { emailTemplates } from "./email-templates/index.js";
import { sendPushToUser } from "./expo-push.js";
import {
  ensureManagedClientIndexes,
  ManagedClientError,
} from "./managed-clients.js";

/**
 * Invitation d'un client qui a déjà un compte Newbi par un gestionnaire
 * (cabinet comptable), sur le modèle des invitations à un espace :
 * - le cabinet saisit l'e-mail du dirigeant ;
 * - le dirigeant reçoit un e-mail, une notification sur l'app et la demande
 *   dans Notifications > Invitations ;
 * - il choisit le ou les espaces à confier, puis accepte ou refuse.
 *
 * L'invitation est une fiche `managedclients` en statut « pending ». À
 * l'acceptation : le cabinet entre dans chaque espace choisi en Comptable ;
 * la fiche passe « active » sur le premier espace et une fiche « active »
 * est créée pour chacun des autres (une fiche par espace, `invitationId`
 * renvoie à l'invitation), toutes avec la preuve du consentement (RGPD :
 * accord écrit préalable du client avant que le cabinet accède à ses
 * données). Le client garde son abonnement.
 */

export const INVITATION_DAYS = 14;
// Garde-fou sur la saisie : bien au-delà du nombre d'espaces d'un client
const MAX_ORGANIZATIONS_PER_ANSWER = 50;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const asObjectId = (value) =>
  value instanceof ObjectId
    ? value
    : typeof value === "string" && /^[0-9a-f]{24}$/i.test(value)
      ? new ObjectId(value)
      : null;

const isExpired = (invitation, now = new Date()) =>
  invitation.expiresAt && new Date(invitation.expiresAt) < now;

/**
 * Espaces que l'utilisateur peut confier : ceux dont il est super admin
 * (owner) et qu'aucun gestionnaire ne suit déjà.
 * @returns {Promise<Array<{ id: ObjectId, name: string }>>}
 */
export async function listEntrustableOrganizations(mongoDb, userId) {
  const uid = asObjectId(userId);
  if (!uid) return [];
  const owned = await mongoDb
    .collection("member")
    .find(
      { userId: uid, role: { $regex: "(^|,)\\s*owner\\s*(,|$)" } },
      { projection: { organizationId: 1 } },
    )
    .toArray();
  if (owned.length === 0) return [];

  const orgIds = owned.map((m) => m.organizationId);
  const managed = await mongoDb
    .collection("managedclients")
    .find(
      { organizationId: { $in: orgIds }, status: "active" },
      { projection: { organizationId: 1 } },
    )
    .toArray();
  const managedIds = new Set(managed.map((m) => String(m.organizationId)));
  const free = orgIds.filter((id) => !managedIds.has(String(id)));
  if (free.length === 0) return [];

  const orgs = await mongoDb
    .collection("organization")
    .find({ _id: { $in: free } }, { projection: { name: 1, companyName: 1 } })
    .toArray();
  return orgs
    .map((o) => ({ id: o._id, name: o.companyName || o.name || "Sans nom" }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

/**
 * Le cabinet invite un client existant.
 * @param {object} params
 * @param {import("mongodb").Db} params.mongoDb
 * @param {string|ObjectId} params.managerId
 * @param {string} params.email e-mail du dirigeant
 * @param {{ type: string, email: string }} params.actor
 * @param {string} [params.baseUrl]
 */
export async function inviteExistingClient({
  mongoDb,
  managerId,
  email: rawEmail,
  actor,
  baseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
}) {
  const email =
    typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  if (!EMAIL_PATTERN.test(email)) {
    throw new ManagedClientError(400, "Adresse e-mail invalide.");
  }

  const managerOid = asObjectId(managerId);
  const manager = managerOid
    ? await mongoDb.collection("accountmanagers").findOne({ _id: managerOid })
    : null;
  if (!manager) throw new ManagedClientError(404, "Gestionnaire introuvable.");
  if (manager.status !== "active") {
    throw new ManagedClientError(
      403,
      "Ce gestionnaire est suspendu : il ne peut pas inviter de client.",
    );
  }

  const user = await mongoDb
    .collection("user")
    .findOne({ email }, { projection: { email: 1, name: 1 } });
  if (!user) {
    throw new ManagedClientError(
      404,
      "Aucun compte Newbi n'utilise cette adresse. Créez plutôt l'espace de ce client avec « Nouveau client ».",
    );
  }
  if (String(user._id) === String(manager.userId)) {
    throw new ManagedClientError(
      400,
      "Vous ne pouvez pas vous inviter vous-même.",
    );
  }

  if ((await listEntrustableOrganizations(mongoDb, user._id)).length === 0) {
    throw new ManagedClientError(
      409,
      "Ce compte n'a aucun espace à confier : il n'est super admin d'aucun espace, ou ses espaces sont déjà suivis par un gestionnaire.",
    );
  }

  const now = new Date();
  const pending = await mongoDb.collection("managedclients").findOne({
    managerId: manager._id,
    invitedUserId: user._id,
    status: "pending",
    expiresAt: { $gt: now },
  });
  if (pending) {
    throw new ManagedClientError(
      409,
      "Une invitation est déjà en attente pour ce client.",
    );
  }

  const { insertedId } = await mongoDb.collection("managedclients").insertOne({
    managerId: manager._id,
    organizationId: null,
    status: "pending",
    invitedEmail: email,
    invitedUserId: user._id,
    payer: "client",
    requestedAt: now,
    expiresAt: new Date(now.getTime() + INVITATION_DAYS * 86400000),
    respondedAt: null,
    startedAt: null,
    endedAt: null,
    endedBy: null,
    createdBy: { type: actor?.type || "manager", email: actor?.email || null },
    createdAt: now,
    updatedAt: now,
  });

  const url = `${baseUrl.replace(/\/+$/, "")}/invitation-gestionnaire/${insertedId}`;
  let emailSent = true;
  try {
    await sendEmail({
      to: email,
      subject: `${manager.name} souhaite gérer votre espace Newbi`,
      html: emailTemplates.managedClientInvitation({
        managerName: manager.name,
        url,
        days: INVITATION_DAYS,
      }),
    });
  } catch (error) {
    emailSent = false;
    console.error(
      `[MANAGED-CLIENT] E-mail d'invitation non envoyé à ${email}:`,
      error?.message,
    );
  }

  await sendPushToUser(mongoDb, user._id, {
    title: "Invitation d'un cabinet",
    body: `${manager.name} souhaite gérer votre espace Newbi`,
    data: {
      type: "managed_client_invitation",
      invitationId: String(insertedId),
    },
  });

  return { id: String(insertedId), email, emailSent };
}

/** Invitations en attente adressées à l'utilisateur (panneau, compteur). */
export async function listPendingClientInvitations(mongoDb, userId) {
  const uid = asObjectId(userId);
  if (!uid) return [];
  const now = new Date();
  const invitations = await mongoDb
    .collection("managedclients")
    .find({ invitedUserId: uid, status: "pending", expiresAt: { $gt: now } })
    .sort({ requestedAt: -1 })
    .toArray();
  if (invitations.length === 0) return [];

  const managers = await mongoDb
    .collection("accountmanagers")
    .find(
      { _id: { $in: invitations.map((i) => i.managerId) } },
      { projection: { name: 1, status: 1 } },
    )
    .toArray();
  const byId = new Map(managers.map((m) => [String(m._id), m]));
  return invitations
    .filter((i) => byId.get(String(i.managerId))?.status === "active")
    .map((i) => ({
      id: String(i._id),
      managerName: byId.get(String(i.managerId)).name,
      requestedAt: i.requestedAt,
      expiresAt: i.expiresAt,
    }));
}

// Invitation adressée à cet utilisateur, sinon erreur
async function loadInvitationForUser(mongoDb, id, user) {
  const oid = asObjectId(id);
  const invitation = oid
    ? await mongoDb.collection("managedclients").findOne({ _id: oid })
    : null;
  if (
    !invitation ||
    !invitation.invitedUserId ||
    String(invitation.invitedUserId) !== String(user.id)
  ) {
    throw new ManagedClientError(404, "Invitation introuvable.");
  }
  return invitation;
}

/** Détail d'une invitation pour la page d'acceptation. */
export async function getClientInvitation(mongoDb, { id, user }) {
  const invitation = await loadInvitationForUser(mongoDb, id, user);
  const manager = await mongoDb
    .collection("accountmanagers")
    .findOne(
      { _id: invitation.managerId },
      { projection: { name: 1, status: 1 } },
    );

  let state = invitation.status;
  if (state === "pending" && isExpired(invitation)) state = "expired";
  if (state === "pending" && manager?.status !== "active")
    state = "unavailable";

  return {
    id: String(invitation._id),
    managerName: manager?.name || "Un cabinet",
    state,
    expiresAt: invitation.expiresAt,
    organizations:
      state === "pending"
        ? (await listEntrustableOrganizations(mongoDb, user.id)).map((o) => ({
            id: String(o.id),
            name: o.name,
          }))
        : [],
  };
}

/**
 * Réponse du client : « accept » (avec les espaces confiés) ou « refuse ».
 * @param {object} params
 * @param {{ id: string }} params.user utilisateur connecté
 * @param {string[]} [params.organizationIds] espaces confiés
 * @param {string} [params.organizationId] un seul espace (ancien format)
 * @param {{ ip?: string, userAgent?: string }} [params.proof]
 */
export async function respondToClientInvitation({
  mongoDb,
  id,
  user,
  action,
  organizationIds,
  organizationId,
  proof = {},
}) {
  const invitation = await loadInvitationForUser(mongoDb, id, user);
  if (invitation.status !== "pending") {
    throw new ManagedClientError(409, "Cette invitation a déjà été traitée.");
  }
  if (isExpired(invitation)) {
    throw new ManagedClientError(410, "Cette invitation a expiré.");
  }
  const now = new Date();

  if (action === "refuse") {
    await mongoDb
      .collection("managedclients")
      .updateOne(
        { _id: invitation._id, status: "pending" },
        { $set: { status: "declined", respondedAt: now, updatedAt: now } },
      );
    return { status: "declined" };
  }
  if (action !== "accept") {
    throw new ManagedClientError(400, "Action inconnue.");
  }

  const manager = await mongoDb
    .collection("accountmanagers")
    .findOne({ _id: invitation.managerId });
  if (!manager || manager.status !== "active") {
    throw new ManagedClientError(409, "Ce cabinet n'est plus actif sur Newbi.");
  }

  // Chaque espace doit être l'un de ceux que l'utilisateur peut confier : il
  // en est super admin et aucun gestionnaire ne le suit déjà
  const requested = Array.isArray(organizationIds)
    ? organizationIds
    : organizationId != null
      ? [organizationId]
      : [];
  if (requested.length === 0) {
    throw new ManagedClientError(400, "Choisissez au moins un de vos espaces.");
  }
  if (requested.length > MAX_ORGANIZATIONS_PER_ANSWER) {
    throw new ManagedClientError(400, "Trop d'espaces sélectionnés.");
  }
  const entrustable = new Set(
    (await listEntrustableOrganizations(mongoDb, user.id)).map((o) =>
      String(o.id),
    ),
  );
  const orgOids = [];
  for (const value of requested) {
    const oid = asObjectId(value);
    if (!oid || !entrustable.has(String(oid))) {
      throw new ManagedClientError(400, "Choisissez parmi vos espaces.");
    }
    if (!orgOids.some((o) => o.equals(oid))) orgOids.push(oid);
  }

  await ensureManagedClientIndexes(mongoDb);

  // Preuve du consentement du client (RGPD), la même pour chaque espace
  const consent = {
    acceptedAt: now,
    acceptedByUserId: asObjectId(user.id),
    ip: proof.ip || null,
    userAgent: proof.userAgent || null,
  };
  const [firstOrg, ...otherOrgs] = orgOids;
  const done = { claimed: false, links: [], members: [] };

  try {
    // 1. L'invitation devient la fiche du premier espace. Le filtre
    // « pending » départage deux réponses simultanées.
    const { modifiedCount } = await mongoDb
      .collection("managedclients")
      .updateOne(
        { _id: invitation._id, status: "pending" },
        {
          $set: {
            status: "active",
            organizationId: firstOrg,
            startedAt: now,
            respondedAt: now,
            updatedAt: now,
            consent,
          },
        },
      );
    if (modifiedCount === 0) {
      throw new ManagedClientError(409, "Cette invitation a déjà été traitée.");
    }
    done.claimed = true;

    // 2. Une fiche par autre espace confié
    for (const orgOid of otherOrgs) {
      const { insertedId } = await mongoDb
        .collection("managedclients")
        .insertOne({
          managerId: invitation.managerId,
          organizationId: orgOid,
          status: "active",
          payer: invitation.payer || "client",
          invitationId: invitation._id,
          invitedEmail: invitation.invitedEmail,
          invitedUserId: invitation.invitedUserId,
          requestedAt: invitation.requestedAt,
          expiresAt: invitation.expiresAt,
          respondedAt: now,
          startedAt: now,
          endedAt: null,
          endedBy: null,
          consent,
          createdBy: invitation.createdBy,
          createdAt: now,
          updatedAt: now,
        });
      done.links.push(insertedId);
    }

    // 3. Le cabinet entre en Comptable ; s'il est déjà membre, son rôle reste
    for (const orgOid of orgOids) {
      const alreadyMember = await mongoDb
        .collection("member")
        .findOne({ userId: manager.userId, organizationId: orgOid });
      if (alreadyMember) continue;
      const { insertedId } = await mongoDb.collection("member").insertOne({
        userId: manager.userId,
        organizationId: orgOid,
        role: "accountant",
        createdAt: now,
      });
      done.members.push(insertedId);
    }
  } catch (error) {
    // Tout ou rien : un espace suivi entre-temps par un autre gestionnaire
    // (index unique) annule toute la réponse
    await undoAcceptance(mongoDb, invitation._id, done);
    if (error?.code === 11000) {
      throw new ManagedClientError(
        409,
        "L'un de ces espaces est déjà suivi par un gestionnaire.",
      );
    }
    throw error;
  }

  return { status: "active", organizationIds: orgOids.map(String) };
}

async function undoAcceptance(mongoDb, invitationId, done) {
  const steps = [];
  if (done.members.length > 0) {
    steps.push(
      mongoDb.collection("member").deleteMany({ _id: { $in: done.members } }),
    );
  }
  if (done.links.length > 0) {
    steps.push(
      mongoDb
        .collection("managedclients")
        .deleteMany({ _id: { $in: done.links } }),
    );
  }
  if (done.claimed) {
    steps.push(
      mongoDb.collection("managedclients").updateOne(
        { _id: invitationId, status: "active" },
        {
          $set: {
            status: "pending",
            organizationId: null,
            startedAt: null,
            respondedAt: null,
            consent: null,
          },
        },
      ),
    );
  }
  const results = await Promise.allSettled(steps);
  for (const result of results) {
    if (result.status === "rejected") {
      console.error(
        "[MANAGED-CLIENT] Annulation incomplète d'une acceptation:",
        result.reason?.message,
      );
    }
  }
}

/** Le cabinet retire une invitation encore en attente. */
export async function cancelClientInvitation(mongoDb, { managerId, id }) {
  const oid = asObjectId(id);
  const managerOid = asObjectId(managerId);
  const now = new Date();
  const { modifiedCount } =
    oid && managerOid
      ? await mongoDb
          .collection("managedclients")
          .updateOne(
            { _id: oid, managerId: managerOid, status: "pending" },
            { $set: { status: "canceled", respondedAt: now, updatedAt: now } },
          )
      : { modifiedCount: 0 };
  if (modifiedCount === 0) {
    throw new ManagedClientError(
      404,
      "Invitation introuvable ou déjà traitée.",
    );
  }
  return { status: "canceled" };
}
