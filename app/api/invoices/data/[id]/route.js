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
 * GET /api/invoices/data/[id]
 *
 * Dual-access route (Principle 4):
 * - Puppeteer (PDF generation): authenticated via X-Internal-Secret header
 * - Authenticated user: verified via session + org membership
 */
async function handler(request, { params }) {
  const { id } = await params;
  const invoiceId = toObjectId(id);

  const fromPuppeteer = hasInternalSecret(request);

  // Auth check BEFORE any data access — prevents ID enumeration by
  // unauthenticated attackers (they only see 401, never 404)
  let authenticatedUserId = null;
  if (!fromPuppeteer) {
    const { user } = await requireSession(request);
    authenticatedUserId = user.id;
  }

  // Fetch the invoice
  const invoice = await mongoDb.collection("invoices").findOne({
    _id: invoiceId,
  });

  if (!invoice) {
    return apiError(404, "Facture introuvable");
  }

  // Membership check (only for authenticated users, not Puppeteer —
  // Puppeteer auth is done upstream in generate-pdf before launching browser)
  if (authenticatedUserId) {
    await requireOrgMembership(authenticatedUserId, invoice.workspaceId);
  }

  // Fetch related client data if present
  let client_data = null;
  if (invoice.client) {
    try {
      const clientId =
        typeof invoice.client === "string"
          ? toObjectId(invoice.client)
          : invoice.client;

      client_data = await mongoDb.collection("clients").findOne({
        _id: clientId,
      });
    } catch {
      // Client ID may be an embedded object, not an ObjectId reference
    }
  }

  // Format response data
  const formattedData = {
    id: invoice._id.toString(),
    number: invoice.number,
    prefix: invoice.prefix,
    issueDate: invoice.issueDate || invoice.date,
    dueDate: invoice.dueDate,
    status: invoice.status,
    paymentMethod: invoice.paymentMethod,
    paymentDate: invoice.paymentDate,

    totalHT: invoice.totalHT || invoice.subtotal,
    totalVAT: invoice.totalVAT || invoice.taxAmount,
    totalTTC: invoice.totalTTC || invoice.total,
    finalTotalHT: invoice.finalTotalHT,
    finalTotalVAT: invoice.finalTotalVAT,
    finalTotalTTC: invoice.finalTotalTTC,

    headerNotes: invoice.headerNotes,
    footerNotes: invoice.footerNotes,
    termsAndConditions: invoice.termsAndConditions,
    termsAndConditionsLink: invoice.termsAndConditionsLink,
    termsAndConditionsLinkTitle: invoice.termsAndConditionsLinkTitle,

    discount: invoice.discount,
    discountType: invoice.discountType,
    retenueGarantie: invoice.retenueGarantie,
    escompte: invoice.escompte,
    purchaseOrderNumber: invoice.purchaseOrderNumber,

    isDeposit: invoice.isDeposit,
    depositAmount: invoice.depositAmount,

    // Type de facture + champs des factures de situation. Sans invoiceType,
    // UniversalPreviewPDF retombe sur le rendu "standard" (colonnes classiques,
    // pas de récapitulatif d'avancement) → le PDF archivé ne correspondait plus
    // à l'aperçu d'une facture de situation.
    invoiceType: invoice.invoiceType,
    situationReference: invoice.situationReference,
    situationNumber: invoice.situationNumber,
    contractTotal: invoice.contractTotal,

    showBankDetails: invoice.showBankDetails,
    isReverseCharge: invoice.isReverseCharge,
    clientPositionRight: invoice.clientPositionRight,

    appearance: invoice.appearance || {
      textColor: "#000000",
      headerTextColor: "#ffffff",
      headerBgColor: "#1d1d1b",
    },

    shipping: invoice.shipping,
    bankDetails: invoice.bankDetails,

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
      : invoice.client || invoice.clientInfo,

    items: invoice.items,
    companyInfo: invoice.companyInfo,
    customFields: invoice.customFields,
  };

  return NextResponse.json(formattedData);
}

export const GET = withErrorHandler(handler);
