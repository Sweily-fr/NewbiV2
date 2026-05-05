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
 * GET /api/quotes/data/[id]
 *
 * Dual-access route (Principle 4):
 * - Puppeteer (PDF generation): authenticated via X-Internal-Secret header
 * - Authenticated user: verified via session + org membership
 */
async function handler(request, { params }) {
  const { id } = await params;
  const quoteId = toObjectId(id);

  const fromPuppeteer = hasInternalSecret(request);

  // Auth check BEFORE any data access — prevents ID enumeration
  let authenticatedUserId = null;
  if (!fromPuppeteer) {
    const { user } = await requireSession(request);
    authenticatedUserId = user.id;
  }

  // Fetch the quote
  const quote = await mongoDb.collection("quotes").findOne({
    _id: quoteId,
  });

  if (!quote) {
    return apiError(404, "Devis introuvable");
  }

  // Membership check (only for authenticated users, not Puppeteer)
  if (authenticatedUserId) {
    await requireOrgMembership(authenticatedUserId, quote.workspaceId);
  }

  // Fetch related client data if present
  let client_data = null;
  if (quote.client) {
    try {
      const clientId =
        typeof quote.client === "string"
          ? toObjectId(quote.client)
          : quote.client;

      client_data = await mongoDb.collection("clients").findOne({
        _id: clientId,
      });
    } catch {
      // Client ID may be an embedded object, not an ObjectId reference
    }
  }

  // Format response data
  const formattedData = {
    id: quote._id.toString(),
    number: quote.number,
    prefix: quote.prefix,
    issueDate: quote.issueDate || quote.date,
    validUntil: quote.validUntil,
    status: quote.status,

    totalHT: quote.totalHT || quote.subtotal,
    totalVAT: quote.totalVAT || quote.taxAmount,
    totalTTC: quote.totalTTC || quote.total,
    finalTotalHT: quote.finalTotalHT,
    finalTotalVAT: quote.finalTotalVAT,
    finalTotalTTC: quote.finalTotalTTC,

    headerNotes: quote.headerNotes,
    footerNotes: quote.footerNotes,
    termsAndConditions: quote.termsAndConditions,
    termsAndConditionsLink: quote.termsAndConditionsLink,
    termsAndConditionsLinkTitle: quote.termsAndConditionsLinkTitle,

    discount: quote.discount,
    discountType: quote.discountType,
    retenueGarantie: quote.retenueGarantie,
    escompte: quote.escompte,
    purchaseOrderNumber: quote.purchaseOrderNumber,

    isDeposit: quote.isDeposit,
    depositAmount: quote.depositAmount,

    showBankDetails: quote.showBankDetails,
    isReverseCharge: quote.isReverseCharge,
    clientPositionRight: quote.clientPositionRight,

    appearance: quote.appearance || {
      textColor: "#000000",
      headerTextColor: "#ffffff",
      headerBgColor: "#1d1d1b",
    },

    shipping: quote.shipping,
    bankDetails: quote.bankDetails,

    client: client_data
      ? {
          id: client_data._id.toString(),
          name: client_data.name,
          email: client_data.email,
          phone: client_data.phone,
          address: client_data.address,
        }
      : quote.client || quote.clientInfo,

    items: quote.items,
    companyInfo: quote.companyInfo,
    customFields: quote.customFields,
  };

  return NextResponse.json(formattedData);
}

export const GET = withErrorHandler(handler);
