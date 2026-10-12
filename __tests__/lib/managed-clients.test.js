// @vitest-environment node
//
// Création des clients d'un compte gestionnaire (cabinet comptable).
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";

const mocks = vi.hoisted(() => ({
  sendEmail: vi.fn(async () => {}),
  orgCalls: [],
  failOn: null,
}));

vi.mock("@/src/lib/auth-utils", () => ({ sendEmail: mocks.sendEmail }));

// Base Mongo simulée : égalité (ObjectId comparés en chaîne), $in, tri ignoré
function makeDb() {
  const data = {};
  const same = (a, b) => String(a) === String(b);
  const matches = (doc, filter = {}) =>
    Object.entries(filter).every(([key, cond]) => {
      const value = doc[key];
      if (cond && typeof cond === "object" && "$in" in cond) {
        return cond.$in.some((c) => same(c, value));
      }
      return same(value, cond);
    });
  const collection = (name) => {
    data[name] ||= [];
    const rows = data[name];
    return {
      async findOne(filter) {
        return rows.find((d) => matches(d, filter)) || null;
      },
      async insertOne(doc) {
        if (mocks.failOn === name) throw new Error(`échec ${name}`);
        const row = { _id: doc._id || new ObjectId(), ...doc };
        rows.push(row);
        return { insertedId: row._id };
      },
      async deleteOne(filter) {
        const i = rows.findIndex((d) => matches(d, filter));
        if (i >= 0) rows.splice(i, 1);
      },
      async deleteMany(filter) {
        for (let i = rows.length - 1; i >= 0; i--) {
          if (matches(rows[i], filter)) rows.splice(i, 1);
        }
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

let db;
vi.mock("@/src/lib/org-creation", () => ({
  createOrganizationWithSubscription: async (args) => {
    mocks.orgCalls.push(args);
    const orgId = new ObjectId();
    await db.collection("organization").insertOne({
      _id: orgId,
      name: args.orgData.companyName,
      companyName: args.orgData.companyName,
      siret: args.orgData.siret,
    });
    await db.collection("member").insertOne({
      userId: new ObjectId(args.userId),
      organizationId: orgId,
      role: "owner",
    });
    return { organizationId: orgId.toString() };
  },
}));

const { createManagedClient, listManagedClients, ManagedClientError } =
  await import("@/src/lib/managed-clients");

const managerUserId = new ObjectId();
const managerId = new ObjectId();
const input = (over = {}) => ({
  companyName: "Boulangerie <Martin>",
  siret: "123 456 789 00012",
  firstName: "Jean",
  lastName: "Martin",
  email: "Jean.Martin@Boulangerie.fr",
  plan: "pme",
  payer: "manager",
  ...over,
});
const create = (over, managerOverride) =>
  createManagedClient({
    mongoDb: db,
    managerId: managerOverride || managerId,
    input: input(over),
    actor: { type: "admin", email: "admin@newbi.fr" },
    baseUrl: "https://www.newbi.fr/",
  });

beforeEach(async () => {
  db = makeDb();
  mocks.orgCalls = [];
  mocks.failOn = null;
  mocks.sendEmail.mockReset();
  mocks.sendEmail.mockResolvedValue(undefined);
  await db
    .collection("user")
    .insertOne({ _id: managerUserId, email: "sophie@dupont.fr" });
  await db.collection("accountmanagers").insertOne({
    _id: managerId,
    userId: managerUserId,
    name: "Compta Dupont",
    status: "active",
  });
});

describe("createManagedClient", () => {
  it("gestionnaire payeur : compte, espace, Comptable, abonnement, lien et e-mail", async () => {
    const result = await create();

    const user = db.data.user.find(
      (u) => u.email === "jean.martin@boulangerie.fr",
    );
    expect(user).toMatchObject({
      name: "Jean Martin",
      onboardingStep: "completed",
      hasSeenOnboarding: true,
      emailVerified: false,
    });
    expect(user.password).toBeUndefined();

    expect(mocks.orgCalls[0]).toMatchObject({
      userId: user._id.toString(),
      orgData: {
        companyName: "Boulangerie <Martin>",
        siret: "12345678900012",
        siren: "123456789",
      },
      appTrialDays: null,
    });

    const orgId = result.organizationId;
    const members = db.data.member.filter(
      (m) => String(m.organizationId) === orgId,
    );
    expect(members.map((m) => [String(m.userId), m.role])).toEqual(
      expect.arrayContaining([
        [String(user._id), "owner"],
        [String(managerUserId), "accountant"],
      ]),
    );

    expect(db.data.subscription).toHaveLength(1);
    expect(db.data.subscription[0]).toMatchObject({
      referenceId: orgId,
      plan: "pme",
      status: "active",
    });
    expect(String(db.data.subscription[0].managedByAccountManagerId)).toBe(
      String(managerId),
    );

    expect(db.data.managedclients[0]).toMatchObject({
      payer: "manager",
      plan: "pme",
      status: "active",
    });

    const verification = db.data.verification[0];
    expect(verification.identifier).toMatch(/^reset-password:[0-9a-f]{64}$/);
    expect(verification.value).toBe(String(user._id));
    const days = (verification.expiresAt - verification.createdAt) / 86400000;
    expect(days).toBe(7);

    const mail = mocks.sendEmail.mock.calls[0][0];
    expect(mail.to).toBe("jean.martin@boulangerie.fr");
    expect(mail.subject).toBe("Compta Dupont a créé votre espace Newbi");
    const token = verification.identifier.split(":")[1];
    expect(mail.html).toContain(
      `https://www.newbi.fr/auth/reset-password?token=${token}`,
    );
    expect(mail.html).toContain("Boulangerie &lt;Martin&gt;");
    expect(mail.html).not.toContain("<Martin>");
    expect(result.emailSent).toBe(true);
  });

  it("client payeur : essai de l'application, aucun abonnement créé", async () => {
    await create({ payer: "client" });
    expect(mocks.orgCalls[0].appTrialDays).toBe(30);
    expect(db.data.subscription || []).toHaveLength(0);
    expect(db.data.managedclients[0].payer).toBe("client");
  });

  it("refuse un gestionnaire suspendu ou inconnu, sans rien créer", async () => {
    db.data.accountmanagers[0].status = "suspended";
    await expect(create()).rejects.toMatchObject({ status: 403 });
    await expect(create({}, new ObjectId())).rejects.toMatchObject({
      status: 404,
    });
    expect(db.data.user).toHaveLength(1);
  });

  it("refuse une adresse qui a déjà un compte Newbi", async () => {
    await expect(create({ email: "SOPHIE@dupont.fr" })).rejects.toMatchObject({
      status: 409,
    });
  });

  it("refuse une saisie invalide", async () => {
    for (const over of [
      { companyName: "  " },
      { siret: "123" },
      { email: "pas-un-email" },
      { email: { $ne: null } },
      { plan: "gratuit" },
    ]) {
      await expect(create(over)).rejects.toBeInstanceOf(ManagedClientError);
    }
    expect(db.data.user).toHaveLength(1);
  });

  it("défait tout si une étape échoue en cours de route", async () => {
    mocks.failOn = "managedclients";
    await expect(create()).rejects.toThrow("échec managedclients");
    expect(db.data.user).toHaveLength(1);
    expect(db.data.organization).toHaveLength(0);
    expect(db.data.member).toHaveLength(0);
    expect(db.data.subscription).toHaveLength(0);
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("garde l'espace si seul l'e-mail échoue", async () => {
    mocks.sendEmail.mockRejectedValue(new Error("Resend indisponible"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await create();
    console.error.mockRestore();
    expect(result.emailSent).toBe(false);
    expect(db.data.managedclients).toHaveLength(1);
  });
});

describe("listManagedClients", () => {
  it("liste les clients avec le dirigeant et l'état de l'accès", async () => {
    await create();
    await create({
      email: "b@b.fr",
      companyName: "Garage Leroy",
      payer: "client",
    });
    const clients = await listManagedClients(db, managerId);
    expect(clients).toHaveLength(2);
    const boulangerie = clients.find((c) => c.name === "Boulangerie <Martin>");
    expect(boulangerie).toMatchObject({
      ownerEmail: "jean.martin@boulangerie.fr",
      payer: "manager",
      access: { type: "subscription", status: "active" },
    });
    const garage = clients.find((c) => c.name === "Garage Leroy");
    expect(garage.access.type).toBe("none");
  });
});
