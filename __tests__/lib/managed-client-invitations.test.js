// @vitest-environment node
//
// Invitation d'un client existant par un gestionnaire (cabinet) : le client
// choisit l'espace confié puis accepte ou refuse.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";

const mocks = vi.hoisted(() => ({
  sendEmail: vi.fn(async () => {}),
  push: vi.fn(async () => {}),
}));
vi.mock("@/src/lib/auth-utils", () => ({ sendEmail: mocks.sendEmail }));
vi.mock("@/src/lib/expo-push", () => ({ sendPushToUser: mocks.push }));

// Base simulée : égalité, $in, $ne, $gt, $regex ; updateOne avec $set
function makeDb() {
  const data = {};
  const same = (a, b) => String(a) === String(b);
  const test = (value, cond) => {
    if (
      cond &&
      typeof cond === "object" &&
      !(cond instanceof ObjectId) &&
      !(cond instanceof Date)
    ) {
      if ("$in" in cond) return cond.$in.some((c) => same(c, value));
      if ("$ne" in cond) return !same(value, cond.$ne);
      if ("$gt" in cond) return value != null && value > cond.$gt;
      if ("$regex" in cond)
        return new RegExp(cond.$regex).test(String(value ?? ""));
    }
    if (cond === null) return value === null || value === undefined;
    return same(value, cond);
  };
  const matches = (doc, filter = {}) =>
    Object.entries(filter).every(([key, cond]) => test(doc[key], cond));
  const collection = (name) => {
    data[name] ||= [];
    const rows = data[name];
    return {
      async createIndex() {},
      async findOne(filter) {
        return rows.find((d) => matches(d, filter)) || null;
      },
      async insertOne(doc) {
        const row = { _id: doc._id || new ObjectId(), ...doc };
        rows.push(row);
        return { insertedId: row._id };
      },
      async updateOne(filter, update) {
        const row = rows.find((d) => matches(d, filter));
        if (!row) return { modifiedCount: 0 };
        Object.assign(row, update.$set);
        return { modifiedCount: 1 };
      },
      async deleteOne(filter) {
        const i = rows.findIndex((d) => matches(d, filter));
        if (i >= 0) rows.splice(i, 1);
      },
      find(filter) {
        const result = rows.filter((d) => matches(d, filter));
        return {
          sort: () => ({ toArray: async () => result }),
          toArray: async () => result,
        };
      },
    };
  };
  return { collection, data };
}

const {
  inviteExistingClient,
  listPendingClientInvitations,
  getClientInvitation,
  respondToClientInvitation,
  cancelClientInvitation,
} = await import("@/src/lib/managed-client-invitations");

let db;
const managerUserId = new ObjectId();
const managerId = new ObjectId();
const clientId = new ObjectId();
const clientOrg = new ObjectId();
const clientOrg2 = new ObjectId();
const memberOrg = new ObjectId(); // espace où le client n'est que membre
const client = { id: String(clientId), email: "jean@boulangerie.fr" };

const invite = (over = {}) =>
  inviteExistingClient({
    mongoDb: db,
    managerId,
    email: "Jean@Boulangerie.fr",
    actor: { type: "manager", email: "sophie@dupont.fr" },
    baseUrl: "https://www.newbi.fr",
    ...over,
  });

beforeEach(async () => {
  db = makeDb();
  mocks.sendEmail.mockReset();
  mocks.sendEmail.mockResolvedValue(undefined);
  mocks.push.mockReset();
  await db
    .collection("user")
    .insertOne({ _id: managerUserId, email: "sophie@dupont.fr" });
  await db
    .collection("user")
    .insertOne({ _id: clientId, email: "jean@boulangerie.fr", name: "Jean" });
  await db.collection("accountmanagers").insertOne({
    _id: managerId,
    userId: managerUserId,
    name: "Compta Dupont",
    status: "active",
  });
  await db
    .collection("organization")
    .insertOne({ _id: clientOrg, name: "Boulangerie Martin" });
  await db
    .collection("organization")
    .insertOne({ _id: clientOrg2, name: "SCI Martin" });
  await db
    .collection("organization")
    .insertOne({ _id: memberOrg, name: "Chez un ami" });
  await db
    .collection("member")
    .insertOne({ userId: clientId, organizationId: clientOrg, role: "owner" });
  await db
    .collection("member")
    .insertOne({ userId: clientId, organizationId: clientOrg2, role: "owner" });
  await db
    .collection("member")
    .insertOne({ userId: clientId, organizationId: memberOrg, role: "member" });
});

describe("inviteExistingClient", () => {
  it("crée une invitation en attente, envoie l'e-mail et la notification mobile", async () => {
    const result = await invite();
    const stored = db.data.managedclients[0];
    expect(stored).toMatchObject({
      status: "pending",
      invitedEmail: "jean@boulangerie.fr",
      payer: "client",
      organizationId: null,
    });
    expect(String(stored.invitedUserId)).toBe(String(clientId));
    expect((stored.expiresAt - stored.requestedAt) / 86400000).toBe(14);

    const mail = mocks.sendEmail.mock.calls[0][0];
    expect(mail.to).toBe("jean@boulangerie.fr");
    expect(mail.subject).toBe(
      "Compta Dupont souhaite gérer votre espace Newbi",
    );
    expect(mail.html).toContain(
      `https://www.newbi.fr/invitation-gestionnaire/${result.id}`,
    );
    expect(mocks.push).toHaveBeenCalledOnce();
  });

  it("refuse un compte inconnu, soi-même, un doublon et un gestionnaire suspendu", async () => {
    await expect(invite({ email: "inconnu@x.fr" })).rejects.toMatchObject({
      status: 404,
    });
    await expect(invite({ email: "sophie@dupont.fr" })).rejects.toMatchObject({
      status: 400,
    });
    await invite();
    await expect(invite()).rejects.toMatchObject({ status: 409 });
    db.data.accountmanagers[0].status = "suspended";
    await expect(invite({ email: "autre@x.fr" })).rejects.toMatchObject({
      status: 403,
    });
  });

  it("refuse un client dont tous les espaces sont déjà suivis", async () => {
    for (const org of [clientOrg, clientOrg2]) {
      await db
        .collection("managedclients")
        .insertOne({
          managerId: new ObjectId(),
          organizationId: org,
          status: "active",
        });
    }
    await expect(invite()).rejects.toMatchObject({ status: 409 });
  });
});

describe("côté client", () => {
  it("liste l'invitation et ne propose que ses espaces de super admin", async () => {
    const { id } = await invite();
    expect(await listPendingClientInvitations(db, clientId)).toEqual([
      expect.objectContaining({ id, managerName: "Compta Dupont" }),
    ]);
    const detail = await getClientInvitation(db, { id, user: client });
    expect(detail.state).toBe("pending");
    expect(detail.organizations.map((o) => o.name)).toEqual([
      "Boulangerie Martin",
      "SCI Martin",
    ]);
  });

  it("une invitation n'est lisible et ne se répond que par son destinataire", async () => {
    const { id } = await invite();
    const intrus = { id: String(managerUserId), email: "sophie@dupont.fr" };
    await expect(
      getClientInvitation(db, { id, user: intrus }),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      respondToClientInvitation({
        mongoDb: db,
        id,
        user: intrus,
        action: "accept",
        organizationId: String(clientOrg),
      }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("acceptation : le cabinet entre en Comptable, le dossier devient actif, le consentement est gardé", async () => {
    const { id } = await invite();
    await respondToClientInvitation({
      mongoDb: db,
      id,
      user: client,
      action: "accept",
      organizationId: String(clientOrg),
      proof: { ip: "1.2.3.4", userAgent: "Test" },
    });
    const link = db.data.managedclients[0];
    expect(link).toMatchObject({ status: "active", payer: "client" });
    expect(String(link.organizationId)).toBe(String(clientOrg));
    expect(link.consent).toMatchObject({ ip: "1.2.3.4", userAgent: "Test" });
    expect(String(link.consent.acceptedByUserId)).toBe(String(clientId));
    const member = db.data.member.find(
      (m) => String(m.userId) === String(managerUserId),
    );
    expect(member).toMatchObject({ role: "accountant" });
    expect(String(member.organizationId)).toBe(String(clientOrg));
    expect(await listPendingClientInvitations(db, clientId)).toEqual([]);
  });

  it("refuse un espace dont le client n'est pas super admin", async () => {
    const { id } = await invite();
    for (const organizationId of [
      String(memberOrg),
      String(new ObjectId()),
      { $ne: null },
    ]) {
      await expect(
        respondToClientInvitation({
          mongoDb: db,
          id,
          user: client,
          action: "accept",
          organizationId,
        }),
      ).rejects.toMatchObject({ status: 400 });
    }
    expect(
      db.data.member.some((m) => String(m.userId) === String(managerUserId)),
    ).toBe(false);
  });

  it("refus, puis plus aucune réponse possible", async () => {
    const { id } = await invite();
    await respondToClientInvitation({
      mongoDb: db,
      id,
      user: client,
      action: "refuse",
    });
    expect(db.data.managedclients[0].status).toBe("declined");
    await expect(
      respondToClientInvitation({
        mongoDb: db,
        id,
        user: client,
        action: "accept",
        organizationId: String(clientOrg),
      }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("une invitation expirée ne s'accepte plus", async () => {
    const { id } = await invite();
    db.data.managedclients[0].expiresAt = new Date(Date.now() - 1000);
    expect((await getClientInvitation(db, { id, user: client })).state).toBe(
      "expired",
    );
    await expect(
      respondToClientInvitation({
        mongoDb: db,
        id,
        user: client,
        action: "accept",
        organizationId: String(clientOrg),
      }),
    ).rejects.toMatchObject({ status: 410 });
  });
});

describe("cancelClientInvitation", () => {
  it("le cabinet retire son invitation, pas celle d'un autre", async () => {
    const { id } = await invite();
    await expect(
      cancelClientInvitation(db, { managerId: new ObjectId(), id }),
    ).rejects.toMatchObject({ status: 404 });
    await cancelClientInvitation(db, { managerId, id });
    expect(db.data.managedclients[0].status).toBe("canceled");
    expect(await listPendingClientInvitations(db, clientId)).toEqual([]);
  });
});
