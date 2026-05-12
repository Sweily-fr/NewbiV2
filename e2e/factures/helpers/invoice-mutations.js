/**
 * Raw GraphQL helpers for invoice mutations.
 *
 * Pattern: Playwright's APIRequestContext (`page.request`) inherits the
 * authenticated session cookie from storageState. The backend resolves the
 * workspace via the `x-workspace-id` header (cf. resolvers' withWorkspace
 * helper).
 *
 * Used by e2e/factures/*.spec.js to bypass the UI when the test is about
 * the backend contract (calculations, validation, RBAC) rather than the
 * editor flow.
 */
import { IDS } from "../../seed/test-data";

export const GRAPHQL_URL =
  process.env.GRAPHQL_URL || "http://localhost:4000/graphql";
export const WORKSPACE_ID = IDS.organizationId.toString();

const INVOICE_FIELDS = `
  id
  number
  prefix
  status
  isDeposit
  invoiceType
  totalHT
  totalVAT
  totalTTC
  finalTotalHT
  finalTotalVAT
  finalTotalTTC
  discountAmount
  discount
  discountType
  escompte
  isReverseCharge
  issueDate
  dueDate
  paymentDate
  client { id name email }
  items {
    description
    quantity
    unitPrice
    vatRate
    discount
    discountType
  }
`;

const CREATE_INVOICE_MUTATION = `
  mutation CreateInvoice($workspaceId: ID!, $input: CreateInvoiceInput!) {
    createInvoice(workspaceId: $workspaceId, input: $input) {
      ${INVOICE_FIELDS}
    }
  }
`;

const UPDATE_INVOICE_MUTATION = `
  mutation UpdateInvoice($id: ID!, $workspaceId: ID!, $input: UpdateInvoiceInput!) {
    updateInvoice(id: $id, workspaceId: $workspaceId, input: $input) {
      ${INVOICE_FIELDS}
    }
  }
`;

const GET_INVOICE_QUERY = `
  query GetInvoice($id: ID!, $workspaceId: ID!) {
    invoice(id: $id, workspaceId: $workspaceId) {
      ${INVOICE_FIELDS}
    }
  }
`;

const DELETE_INVOICE_MUTATION = `
  mutation DeleteInvoice($id: ID!, $workspaceId: ID!) {
    deleteInvoice(id: $id, workspaceId: $workspaceId)
  }
`;

const MARK_PAID_MUTATION = `
  mutation MarkInvoiceAsPaid($id: ID!, $workspaceId: ID!, $paymentDate: String!) {
    markInvoiceAsPaid(id: $id, workspaceId: $workspaceId, paymentDate: $paymentDate) {
      id
      status
      paymentDate
    }
  }
`;

const CHANGE_STATUS_MUTATION = `
  mutation ChangeInvoiceStatus($id: ID!, $workspaceId: ID!, $status: InvoiceStatus!) {
    changeInvoiceStatus(id: $id, workspaceId: $workspaceId, status: $status) {
      id
      status
    }
  }
`;

const LATEST_ISSUE_DATE_QUERY = `
  query LatestInvoiceIssueDate($workspaceId: ID!) {
    latestInvoiceIssueDate(workspaceId: $workspaceId)
  }
`;

const NEXT_INVOICE_NUMBER_QUERY = `
  query NextInvoiceNumber($workspaceId: ID!, $prefix: String, $isDraft: Boolean, $autoNumbering: Boolean) {
    nextInvoiceNumber(workspaceId: $workspaceId, prefix: $prefix, isDraft: $isDraft, autoNumbering: $autoNumbering)
  }
`;

const CHECK_INVOICE_NUMBER_EXISTS_QUERY = `
  query CheckInvoiceNumberExists($workspaceId: ID!, $number: String!, $prefix: String!, $excludeId: ID) {
    checkInvoiceNumberExists(workspaceId: $workspaceId, number: $number, prefix: $prefix, excludeId: $excludeId)
  }
`;

const CREATE_LINKED_INVOICE_MUTATION = `
  mutation CreateLinkedInvoice($quoteId: ID!, $workspaceId: ID!, $amount: Float!, $isDeposit: Boolean!) {
    createLinkedInvoice(quoteId: $quoteId, workspaceId: $workspaceId, amount: $amount, isDeposit: $isDeposit) {
      invoice {
        ${INVOICE_FIELDS}
        purchaseOrderNumber
      }
      quote {
        id
        prefix
        number
        status
        finalTotalTTC
      }
    }
  }
`;

const CREATE_QUOTE_MUTATION = `
  mutation CreateQuote($workspaceId: ID!, $input: CreateQuoteInput!) {
    createQuote(workspaceId: $workspaceId, input: $input) {
      id
      number
      prefix
      status
      finalTotalTTC
      totalTTC
      client { id name }
    }
  }
`;

const CHANGE_QUOTE_STATUS_MUTATION = `
  mutation ChangeQuoteStatus($id: ID!, $status: QuoteStatus!) {
    changeQuoteStatus(id: $id, status: $status) {
      id
      status
    }
  }
`;

const CREDIT_NOTE_FIELDS = `
  id
  number
  prefix
  creditType
  status
  refundMethod
  totalHT
  totalVAT
  totalTTC
  finalTotalHT
  finalTotalVAT
  finalTotalTTC
  originalInvoice { id number prefix }
  originalInvoiceNumber
  client { id name }
`;

const CREATE_CREDIT_NOTE_MUTATION = `
  mutation CreateCreditNote($workspaceId: ID!, $input: CreateCreditNoteInput!) {
    createCreditNote(workspaceId: $workspaceId, input: $input) {
      ${CREDIT_NOTE_FIELDS}
    }
  }
`;

const GET_CREDIT_NOTE_QUERY = `
  query GetCreditNote($id: ID!, $workspaceId: ID!) {
    creditNote(id: $id, workspaceId: $workspaceId) {
      ${CREDIT_NOTE_FIELDS}
    }
  }
`;

const CREDIT_NOTES_BY_INVOICE_QUERY = `
  query CreditNotesByInvoice($invoiceId: ID!, $workspaceId: ID!) {
    creditNotesByInvoice(invoiceId: $invoiceId, workspaceId: $workspaceId) {
      id
      number
      prefix
      creditType
      finalTotalTTC
    }
  }
`;

/**
 * Read the active organization (Better Auth REST). Returns the current
 * settings including additionalFields like invoicePrefix /
 * invoiceAutoNumbering / invoiceStartNumber (cf src/lib/auth-plugins.js
 * additionalFields). Used by numbering-settings-isolation tests to assert
 * that global state is untouched by per-invoice operations.
 */
export async function getOrganizationSettings(request, opts = {}) {
  const baseURL =
    opts.baseURL || process.env.BETTER_AUTH_URL || "http://localhost:3000";
  const res = await request.get(
    `${baseURL}/api/auth/organization/get-full-organization`,
    { failOnStatusCode: false, timeout: opts.timeout || 30000 },
  );
  const status = res.status();
  const json = await res.json().catch(() => ({}));
  return { status, json };
}

/**
 * Update Organization additional fields via Better Auth REST. Pass
 * `{ invoicePrefix, invoiceAutoNumbering, invoiceStartNumber }` (or any
 * subset). Cookie auth is provided by Playwright's storageState.
 *
 * IMPORTANT — Better Auth rejette toute mutation sans header `Origin`
 * (CSRF protection : status 403, code MISSING_OR_NULL_ORIGIN). Le client
 * frontend l'ajoute automatiquement via fetch() côté navigateur, mais
 * playwright APIRequestContext ne le pose pas par défaut.
 */
export async function updateOrganizationSettings(
  request,
  data,
  { organizationId = WORKSPACE_ID, baseURL } = {},
) {
  const origin =
    baseURL || process.env.BETTER_AUTH_URL || "http://localhost:3000";
  const res = await request.post(`${origin}/api/auth/organization/update`, {
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
    },
    data: { organizationId, data },
    failOnStatusCode: false,
    timeout: 30000,
  });
  const status = res.status();
  const json = await res.json().catch(() => ({}));
  return { status, json };
}

async function gql(
  request,
  body,
  { workspaceId = WORKSPACE_ID, timeout = 30000 } = {},
) {
  // Default playwright apiRequestContext timeout est 10s — trop court pour
  // certaines mutations sur un workspace contenant beaucoup de factures
  // (ex: latestInvoiceIssueDate qui scan toute la collection). On passe à
  // 30s par défaut.
  const response = await request.post(GRAPHQL_URL, {
    headers: { "x-workspace-id": workspaceId },
    data: body,
    failOnStatusCode: false,
    timeout,
  });
  const status = response.status();
  const json = await response.json().catch(() => ({}));
  return { status, json };
}

export async function createInvoiceMutation(request, input, opts = {}) {
  return gql(
    request,
    {
      operationName: "CreateInvoice",
      query: CREATE_INVOICE_MUTATION,
      variables: { workspaceId: opts.workspaceId || WORKSPACE_ID, input },
    },
    opts,
  );
}

export async function updateInvoiceMutation(request, id, input, opts = {}) {
  return gql(
    request,
    {
      operationName: "UpdateInvoice",
      query: UPDATE_INVOICE_MUTATION,
      variables: {
        id,
        workspaceId: opts.workspaceId || WORKSPACE_ID,
        input,
      },
    },
    opts,
  );
}

export async function getInvoiceById(request, id, opts = {}) {
  return gql(
    request,
    {
      operationName: "GetInvoice",
      query: GET_INVOICE_QUERY,
      variables: { id, workspaceId: opts.workspaceId || WORKSPACE_ID },
    },
    opts,
  );
}

export async function deleteInvoiceMutation(request, id, opts = {}) {
  return gql(
    request,
    {
      operationName: "DeleteInvoice",
      query: DELETE_INVOICE_MUTATION,
      variables: { id, workspaceId: opts.workspaceId || WORKSPACE_ID },
    },
    opts,
  );
}

export async function markInvoiceAsPaid(
  request,
  id,
  paymentDate = new Date().toISOString().slice(0, 10),
  opts = {},
) {
  return gql(
    request,
    {
      operationName: "MarkInvoiceAsPaid",
      query: MARK_PAID_MUTATION,
      variables: {
        id,
        workspaceId: opts.workspaceId || WORKSPACE_ID,
        paymentDate,
      },
    },
    opts,
  );
}

export async function changeInvoiceStatus(request, id, status, opts = {}) {
  return gql(
    request,
    {
      operationName: "ChangeInvoiceStatus",
      query: CHANGE_STATUS_MUTATION,
      variables: {
        id,
        status,
        workspaceId: opts.workspaceId || WORKSPACE_ID,
      },
    },
    opts,
  );
}

export async function latestInvoiceIssueDate(request, opts = {}) {
  return gql(
    request,
    {
      operationName: "LatestInvoiceIssueDate",
      query: LATEST_ISSUE_DATE_QUERY,
      variables: { workspaceId: opts.workspaceId || WORKSPACE_ID },
    },
    opts,
  );
}

/**
 * Query the next sequential invoice number for a given prefix.
 *
 * Backend (cf newbi-api/src/resolvers/invoice.js:565-602) :
 *   - When `autoNumbering = true`, scans ALL invoices in the workspace and
 *     returns max(numeric number) + 1, ignoring `prefix`.
 *   - When `autoNumbering = false` (default) and `prefix` is provided,
 *     scopes the max scan to that prefix only.
 *   - When `isDraft = true`, returns a "DRAFT-NNNN"-style placeholder via
 *     generateInvoiceNumber().
 * Result is always padded to 4 digits ("0001", "0042", ...).
 */
export async function nextInvoiceNumber(
  request,
  { prefix, isDraft, autoNumbering } = {},
  opts = {},
) {
  return gql(
    request,
    {
      operationName: "NextInvoiceNumber",
      query: NEXT_INVOICE_NUMBER_QUERY,
      variables: {
        workspaceId: opts.workspaceId || WORKSPACE_ID,
        prefix,
        isDraft,
        autoNumbering,
      },
    },
    opts,
  );
}

/**
 * Returns true if a (prefix, number) tuple already exists for this
 * workspace (excluding optional `excludeId`). Used by the editor to guard
 * against manual-number collisions before submit.
 */
export async function checkInvoiceNumberExists(
  request,
  { prefix, number, excludeId } = {},
  opts = {},
) {
  return gql(
    request,
    {
      operationName: "CheckInvoiceNumberExists",
      query: CHECK_INVOICE_NUMBER_EXISTS_QUERY,
      variables: {
        workspaceId: opts.workspaceId || WORKSPACE_ID,
        prefix,
        number,
        excludeId,
      },
    },
    opts,
  );
}

// ──── Linked invoice + quote helpers (prompt 4 — workflows) ────

export async function createLinkedInvoiceMutation(
  request,
  { quoteId, amount, isDeposit },
  opts = {},
) {
  return gql(
    request,
    {
      operationName: "CreateLinkedInvoice",
      query: CREATE_LINKED_INVOICE_MUTATION,
      variables: {
        quoteId,
        workspaceId: opts.workspaceId || WORKSPACE_ID,
        amount,
        isDeposit,
      },
    },
    opts,
  );
}

export async function createQuoteMutation(request, input, opts = {}) {
  return gql(
    request,
    {
      operationName: "CreateQuote",
      query: CREATE_QUOTE_MUTATION,
      variables: { workspaceId: opts.workspaceId || WORKSPACE_ID, input },
    },
    opts,
  );
}

export async function changeQuoteStatus(request, id, status, opts = {}) {
  return gql(
    request,
    {
      operationName: "ChangeQuoteStatus",
      query: CHANGE_QUOTE_STATUS_MUTATION,
      variables: { id, status },
    },
    opts,
  );
}

// ──── Credit note helpers ────

export async function createCreditNoteMutation(request, input, opts = {}) {
  return gql(
    request,
    {
      operationName: "CreateCreditNote",
      query: CREATE_CREDIT_NOTE_MUTATION,
      variables: { workspaceId: opts.workspaceId || WORKSPACE_ID, input },
    },
    opts,
  );
}

export async function getCreditNoteById(request, id, opts = {}) {
  return gql(
    request,
    {
      operationName: "GetCreditNote",
      query: GET_CREDIT_NOTE_QUERY,
      variables: { id, workspaceId: opts.workspaceId || WORKSPACE_ID },
    },
    opts,
  );
}

export async function creditNotesByInvoice(request, invoiceId, opts = {}) {
  return gql(
    request,
    {
      operationName: "CreditNotesByInvoice",
      query: CREDIT_NOTES_BY_INVOICE_QUERY,
      variables: {
        invoiceId,
        workspaceId: opts.workspaceId || WORKSPACE_ID,
      },
    },
    opts,
  );
}
