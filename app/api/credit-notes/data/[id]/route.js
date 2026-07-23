import { NextResponse } from "next/server";
import { mongoDb } from "@/src/lib/mongodb";
import {
  hasInternalSecret,
  requireSession,
  requireOrgMembership,
  toObjectId,
  apiError,
  withErrorHandler,
} from "@/src/lib/security";

/**
 * GET /api/credit-notes/data/[id]
 *
 * Dual-access route (Principle 4):
 * - Puppeteer (PDF generation): authenticated via X-Internal-Secret header
 * - Authenticated user: verified via session + org membership
 */
async function handler(request, { params }) {
  const { id } = await params;
  const creditNoteId = toObjectId(id);

  const fromPuppeteer = hasInternalSecret(request);

  // Auth check BEFORE any data access — prevents ID enumeration
  let authenticatedUserId = null;
  if (!fromPuppeteer) {
    const { user } = await requireSession(request);
    authenticatedUserId = user.id;
  }

  // Fetch the credit note
  const creditNote = await mongoDb.collection("creditnotes").findOne({
    _id: creditNoteId,
  });

  if (!creditNote) {
    return apiError(404, "Avoir introuvable");
  }

  // Membership check (only for authenticated users, not Puppeteer)
  if (authenticatedUserId) {
    await requireOrgMembership(authenticatedUserId, creditNote.workspaceId);
  }

  // Fetch related client data if present
  let client_data = null;
  if (creditNote.client) {
    try {
      const clientId =
        typeof creditNote.client === "string"
          ? toObjectId(creditNote.client)
          : creditNote.client;

      client_data = await mongoDb.collection("clients").findOne({
        _id: clientId,
      });
    } catch {
      // Client ID may be an embedded object, not an ObjectId reference
    }
  }

  // Fetch original invoice if present
  let originalInvoiceData = null;
  if (creditNote.originalInvoice) {
    try {
      const invoiceId =
        typeof creditNote.originalInvoice === "string"
          ? toObjectId(creditNote.originalInvoice)
          : creditNote.originalInvoice;

      originalInvoiceData = await mongoDb.collection("invoices").findOne({
        _id: invoiceId,
      });
    } catch {
      // Original invoice ID may not be a valid ObjectId
    }
  }

  // Format response data
  const formattedData = {
    id: creditNote._id.toString(),
    number: creditNote.number,
    prefix: creditNote.prefix,
    issueDate: creditNote.issueDate || creditNote.date,
    status: creditNote.status,

    originalInvoice: originalInvoiceData
      ? {
          id: originalInvoiceData._id.toString(),
          number: originalInvoiceData.number,
          prefix: originalInvoiceData.prefix,
        }
      : null,
    originalInvoiceNumber:
      creditNote.originalInvoiceNumber ||
      (originalInvoiceData
        ? `${originalInvoiceData.prefix || "F"}-${originalInvoiceData.number}`
        : null),

    totalHT: creditNote.totalHT || creditNote.subtotal,
    totalVAT: creditNote.totalVAT || creditNote.taxAmount,
    totalTTC: creditNote.totalTTC || creditNote.total,
    finalTotalHT: creditNote.finalTotalHT,
    finalTotalVAT: creditNote.finalTotalVAT,
    finalTotalTTC: creditNote.finalTotalTTC,

    headerNotes: creditNote.headerNotes,
    footerNotes: creditNote.footerNotes,
    termsAndConditions: creditNote.termsAndConditions,
    termsAndConditionsLink: creditNote.termsAndConditionsLink,
    termsAndConditionsLinkTitle: creditNote.termsAndConditionsLinkTitle,

    discount: creditNote.discount,
    discountType: creditNote.discountType,

    showBankDetails: creditNote.showBankDetails,
    isReverseCharge: creditNote.isReverseCharge,
    clientPositionRight: creditNote.clientPositionRight,

    appearance: creditNote.appearance || {
      textColor: "#000000",
      headerTextColor: "#ffffff",
      headerBgColor: "#1d1d1b",
    },

    bankDetails: creditNote.bankDetails,

    client: client_data
      ? {
          id: client_data._id.toString(),
          name: client_data.name,
          email: client_data.email,
          phone: client_data.phone,
          address: client_data.address,
          type: client_data.type,
          firstName: client_data.firstName,
          lastName: client_data.lastName,
          siret: client_data.siret,
          vatNumber: client_data.vatNumber,
          isInternational: client_data.isInternational,
        }
      : creditNote.client || creditNote.clientInfo,

    items: creditNote.items,
    companyInfo: creditNote.companyInfo,
    customFields: creditNote.customFields,
  };

  return NextResponse.json(formattedData);
}

export const GET = withErrorHandler(handler);
