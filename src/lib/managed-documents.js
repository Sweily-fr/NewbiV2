import { ObjectId } from "mongodb";
import { getModuleActionsForMemberships } from "./organization-roles.js";
import { buildSearchRegExp } from "./search-regex.js";

/**
 * Espace gestionnaire : factures, devis, bons de commande, bons de
 * livraison et avoirs de tous les clients d'un cabinet, en une liste.
 *
 * Un document n'est listé que si son espace est un client ACTIF du
 * gestionnaire (fiche managedclients), que l'utilisateur y est encore membre
 * et que son rôle dans cet espace lui donne « Voir » sur ce type de document
 * (le client peut avoir réduit les droits du cabinet).
 */

export const MANAGED_DOCUMENT_KINDS = {
  invoices: {
    collection: "invoices",
    moduleKey: "invoices",
    badgeType: "invoice",
    openPath: "/dashboard/outils/factures",
    tabs: [
      { value: "all", label: "Toutes" },
      { value: "DRAFT", label: "Brouillons" },
      { value: "PENDING", label: "À encaisser" },
      { value: "overdue", label: "En retard" },
      { value: "COMPLETED", label: "Terminées" },
    ],
  },
  quotes: {
    collection: "quotes",
    moduleKey: "quotes",
    badgeType: "quote",
    openPath: "/dashboard/outils/devis",
    tabs: [
      { value: "all", label: "Tous" },
      { value: "DRAFT", label: "Brouillons" },
      { value: "PENDING", label: "Envoyés" },
      { value: "COMPLETED", label: "Acceptés" },
    ],
  },
  purchaseOrders: {
    collection: "purchaseorders",
    moduleKey: "purchaseOrders",
    badgeType: "purchaseOrder",
    openPath: "/dashboard/outils/bons-commande",
    tabs: [
      { value: "all", label: "Tous" },
      { value: "DRAFT", label: "Brouillons" },
      { value: "CONFIRMED", label: "En attente" },
      { value: "VALIDATED", label: "Validés" },
      { value: "DELIVERED", label: "Livrés" },
    ],
  },
  deliveryNotes: {
    collection: "deliverynotes",
    moduleKey: "deliveryNotes",
    badgeType: "deliveryNote",
    openPath: "/dashboard/outils/bons-de-livraison",
    // Un bon de livraison n'a pas de prix
    showTotal: false,
    tabs: [
      { value: "all", label: "Tous" },
      { value: "DRAFT", label: "Brouillons" },
      { value: "PENDING", label: "À expédier" },
      { value: "SHIPPED", label: "Expédiés" },
      { value: "DELIVERED", label: "Livrés" },
    ],
  },
  creditNotes: {
    collection: "creditnotes",
    moduleKey: "creditNotes",
    badgeType: "creditNote",
    // Pas de liste des avoirs dans Newbi : chaque avoir s'ouvre sur sa page,
    // sous sa facture d'origine (voir openUrl)
    openPath: "/dashboard/outils/factures",
    tabs: [{ value: "all", label: "Tous" }],
  },
};

export const MANAGED_DOCUMENTS_PAGE_SIZE = 50;

const asObjectId = (value) =>
  value instanceof ObjectId
    ? value
    : typeof value === "string" && /^[0-9a-f]{24}$/i.test(value)
      ? new ObjectId(value)
      : null;

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// Facture en retard : statut OVERDUE, ou en attente avec échéance dépassée
// (même règle que le tableau de bord ; l'API n'écrit pas OVERDUE)
const overdueFilter = () => ({
  $or: [
    { status: "OVERDUE" },
    { status: "PENDING", dueDate: { $lt: startOfToday() } },
  ],
});

/**
 * Dossiers clients dont le gestionnaire peut voir ce type de document.
 * @returns {Promise<Array<{ id: ObjectId, name: string }>>}
 */
export async function listReadableClientOrganizations(
  mongoDb,
  { managerId, userId, moduleKey },
) {
  const managerOid = asObjectId(managerId);
  const userOid = asObjectId(userId);
  if (!managerOid || !userOid) return [];

  const links = await mongoDb
    .collection("managedclients")
    .find(
      { managerId: managerOid, status: "active" },
      { projection: { organizationId: 1 } },
    )
    .toArray();
  if (links.length === 0) return [];

  const memberships = await mongoDb
    .collection("member")
    .find(
      {
        userId: userOid,
        organizationId: { $in: links.map((l) => l.organizationId) },
      },
      { projection: { organizationId: 1, role: 1 } },
    )
    .toArray();

  // Droits de tous les espaces en une requête (pas une par client)
  const actionsByOrg = await getModuleActionsForMemberships(mongoDb, {
    memberships,
    moduleKey,
  });
  const readable = memberships
    .filter((m) =>
      (actionsByOrg.get(String(m.organizationId)) || []).includes("view"),
    )
    .map((m) => m.organizationId);
  if (readable.length === 0) return [];

  const orgs = await mongoDb
    .collection("organization")
    .find(
      { _id: { $in: readable } },
      { projection: { name: 1, companyName: 1 } },
    )
    .toArray();
  return orgs
    .map((o) => ({ id: o._id, name: o.companyName || o.name || "Sans nom" }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

/**
 * Page de documents d'un type, tous dossiers confondus.
 * @param {object} params
 * @param {"invoices"|"quotes"|"purchaseOrders"|"deliveryNotes"|"creditNotes"} params.kind
 * @param {string} [params.status] valeur d'onglet (voir MANAGED_DOCUMENT_KINDS)
 * @param {string} [params.organizationId] un seul dossier
 * @param {string} [params.q] recherche : numéro ou client destinataire
 * @param {boolean} [params.exact] recherche exacte (majuscules et accents)
 * @param {number} [params.page]
 */
export async function listManagedDocuments(
  mongoDb,
  {
    managerId,
    userId,
    kind,
    status = "all",
    organizationId,
    q = "",
    exact = false,
    page = 1,
  },
) {
  const config = MANAGED_DOCUMENT_KINDS[kind];
  if (!config) throw new Error(`Type de document inconnu : ${kind}`);

  const organizations = await listReadableClientOrganizations(mongoDb, {
    managerId,
    userId,
    moduleKey: config.moduleKey,
  });
  const empty = {
    organizations: organizations.map((o) => ({
      id: String(o.id),
      name: o.name,
    })),
    rows: [],
    total: 0,
    page: 1,
    pageSize: MANAGED_DOCUMENTS_PAGE_SIZE,
    statusCounts: {},
  };
  if (organizations.length === 0) return empty;

  // Un seul dossier demandé : seulement s'il fait partie des dossiers lisibles
  let workspaceIds = organizations.map((o) => o.id);
  if (organizationId) {
    workspaceIds = workspaceIds.filter(
      (id) => String(id) === String(organizationId),
    );
    if (workspaceIds.length === 0) return empty;
  }

  const base = { workspaceId: { $in: workspaceIds } };
  const search = typeof q === "string" ? q.trim().slice(0, 100) : "";
  if (search) {
    // Sans accents ni majuscules, sauf bouton « Aa » coché
    const regex = buildSearchRegExp(search, { exact });
    const or = [
      { number: regex },
      { prefix: regex },
      { "client.name": regex },
      { "client.firstName": regex },
      { "client.lastName": regex },
    ];
    // Référence complète telle qu'affichée (« F-202610-0001 ») : préfixe et
    // numéro sont stockés séparément
    const reference = search.match(/^(.+?)-?(\d+)$/);
    if (reference && reference[1].length > 0) {
      or.push({
        $and: [
          {
            prefix: new RegExp(
              `^${escapeRegex(reference[1].replace(/-$/, ""))}-?$`,
              "i",
            ),
          },
          { number: new RegExp(`^${escapeRegex(reference[2])}`, "i") },
        ],
      });
    }
    base.$and = [{ $or: or }];
  }

  const validTab = config.tabs.some((t) => t.value === status) ? status : "all";
  const tabFilter = (tab) => {
    if (tab === "all") return {};
    if (tab === "overdue") return overdueFilter();
    return { status: tab };
  };
  const filter = { ...base, ...tabFilter(validTab) };
  if (validTab === "overdue" && base.$and) {
    // $or de la recherche et $or du retard ne doivent pas s'écraser
    filter.$and = [...base.$and, overdueFilter()];
    delete filter.$or;
  }

  const collection = mongoDb.collection(config.collection);
  const pageSize = MANAGED_DOCUMENTS_PAGE_SIZE;
  const total = await collection.countDocuments(filter);
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, Number(page) || 1), lastPage);

  const [docs, statusCounts] = await Promise.all([
    collection
      .find(filter, {
        projection: {
          prefix: 1,
          number: 1,
          status: 1,
          issueDate: 1,
          dueDate: 1,
          validUntil: 1,
          deliveryDate: 1,
          originalInvoice: 1,
          originalInvoiceNumber: 1,
          finalTotalTTC: 1,
          totalTTC: 1,
          client: 1,
          workspaceId: 1,
          createdAt: 1,
        },
      })
      .sort({ issueDate: -1, createdAt: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize)
      .toArray(),
    Promise.all(
      config.tabs.map(async (tab) => {
        const tabQuery = { ...base, ...tabFilter(tab.value) };
        if (tab.value === "overdue" && base.$and) {
          tabQuery.$and = [...base.$and, overdueFilter()];
          delete tabQuery.$or;
        }
        return [tab.value, await collection.countDocuments(tabQuery)];
      }),
    ).then(Object.fromEntries),
  ]);

  const orgName = new Map(organizations.map((o) => [String(o.id), o.name]));
  const today = startOfToday();
  const rows = docs.map((doc) => {
    const overdue =
      kind === "invoices" &&
      (doc.status === "OVERDUE" ||
        (doc.status === "PENDING" &&
          doc.dueDate &&
          new Date(doc.dueDate) < today));
    const clientName =
      doc.client?.name ||
      [doc.client?.firstName, doc.client?.lastName].filter(Boolean).join(" ") ||
      null;
    const isDraftNumber =
      typeof doc.number === "string" && doc.number.startsWith("DRAFT-");
    const reference =
      doc.number && !isDraftNumber
        ? doc.prefix
          ? `${doc.prefix.replace(/-$/, "")}-${doc.number}`
          : doc.number
        : null;
    const id = String(doc._id);
    return {
      id,
      organizationId: String(doc.workspaceId),
      organizationName: orgName.get(String(doc.workspaceId)) || null,
      reference,
      clientName,
      status: overdue ? "OVERDUE" : doc.status,
      issueDate: doc.issueDate || doc.createdAt || null,
      dueDate:
        kind === "invoices"
          ? doc.dueDate
          : kind === "quotes"
            ? doc.validUntil
            : doc.deliveryDate || doc.validUntil || null,
      // Avoir : sa facture d'origine à la place d'une date
      dueText:
        kind === "creditNotes" ? doc.originalInvoiceNumber || "-" : undefined,
      totalTTC:
        config.showTotal === false
          ? null
          : (doc.finalTotalTTC ?? doc.totalTTC ?? null),
      openUrl:
        kind === "creditNotes"
          ? doc.originalInvoice
            ? `/dashboard/outils/factures/${doc.originalInvoice}/avoir/${id}`
            : null
          : `${config.openPath}?id=${id}`,
    };
  });

  return {
    organizations: organizations.map((o) => ({
      id: String(o.id),
      name: o.name,
    })),
    rows,
    total,
    page: currentPage,
    pageSize,
    statusCounts,
  };
}
