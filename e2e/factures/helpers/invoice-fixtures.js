/**
 * Factory helpers — build CreateInvoiceInput payloads from minimal arguments.
 *
 * Defaults are tuned to match the seeded TEST_USER company info so backend
 * validation (capitalSocial/rcs required for SASU) passes without the caller
 * having to repeat boilerplate.
 *
 * Used by e2e/factures/crud-mutations.spec.js + edit-delete.spec.js to
 * construct inputs for createInvoice / updateInvoice without duplicating
 * the 12+ required fields each time.
 */
import { TEST_CLIENTS } from "../../seed/test-data";

const DEFAULT_CLIENT = TEST_CLIENTS[0]; // Entreprise Alpha SAS

/**
 * Build a ClientInput from a seeded TEST_CLIENT or override fields.
 * Strips internal Mongo fields to match the GraphQL ClientInput shape.
 *
 * IMPORTANT — passing `id` is required when reusing a seeded client:
 * the resolver (newbi-api/src/resolvers/invoice.js:1178-1201) only checks
 * the unique-email constraint for NEW clients (id absent). Without this,
 * every test invoice rejects with "client existe déjà".
 */
export function buildClientInput(client = DEFAULT_CLIENT) {
  return {
    id: client._id?.toString?.() ?? client.id,
    name: client.name,
    email: client.email,
    phone: client.phone,
    type: client.type,
    siret: client.siret,
    vatNumber: client.vatNumber,
    address: {
      street: client.address.street,
      city: client.address.city,
      postalCode: client.address.postalCode,
      country: client.address.country,
    },
  };
}

/**
 * Build an ItemInput with sensible defaults (qty=1, vatRate=20, unit="unité").
 * Spread an override object to customize.
 */
export function buildItem(overrides = {}) {
  return {
    description: "Prestation E2E",
    quantity: 1,
    unitPrice: 100,
    vatRate: 20,
    unit: "unité",
    ...overrides,
  };
}

/**
 * Build a CreateInvoiceInput. The caller passes items + optional overrides
 * (status, discount, escompte, isReverseCharge, shipping, dates...).
 *
 * Defaults:
 *   - status: PENDING (so the test asserts the finalized payload immediately).
 *     Pass status: "DRAFT" for brouillon flow.
 *   - issueDate / dueDate: today / +30d.
 *   - client: TEST_CLIENTS[0].
 */
export function buildInvoiceInput(overrides = {}) {
  const today = new Date();
  const due = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const {
    client = DEFAULT_CLIENT,
    items = [buildItem()],
    status = "PENDING",
    issueDate = today.toISOString().slice(0, 10),
    dueDate = due.toISOString().slice(0, 10),
    ...rest
  } = overrides;

  return {
    client: buildClientInput(client),
    items,
    status,
    issueDate,
    dueDate,
    ...rest,
  };
}
