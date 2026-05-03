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

async function gql(request, body, { workspaceId = WORKSPACE_ID } = {}) {
  const response = await request.post(GRAPHQL_URL, {
    headers: { "x-workspace-id": workspaceId },
    data: body,
    failOnStatusCode: false,
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
