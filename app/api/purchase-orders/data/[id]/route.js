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
 * GET /api/purchase-orders/data/[id]
 *
 * Dual-access route (Principle 4):
 * - Puppeteer (PDF generation): authenticated via X-Internal-Secret header
 * - Authenticated user: verified via session + org membership
 */
async function handler(request, { params }) {
  const { id } = await params;
  const purchaseOrderId = toObjectId(id);

  const fromPuppeteer = hasInternalSecret(request);

  // Auth check BEFORE any data access — prevents ID enumeration
  let authenticatedUserId = null;
  if (!fromPuppeteer) {
    const { user } = await requireSession(request);
    authenticatedUserId = user.id;
  }

  // Fetch the purchase order
  const purchaseOrder = await mongoDb.collection("purchaseorders").findOne({
    _id: purchaseOrderId,
  });

  if (!purchaseOrder) {
    return apiError(404, "Bon de commande introuvable");
  }

  // Membership check (only for authenticated users, not Puppeteer)
  if (authenticatedUserId) {
    await requireOrgMembership(authenticatedUserId, purchaseOrder.workspaceId);
  }

  // Format response data
  const formattedData = {
    id: purchaseOrder._id.toString(),
    number: purchaseOrder.number,
    prefix: purchaseOrder.prefix,
    issueDate: purchaseOrder.issueDate,
    validUntil: purchaseOrder.validUntil,
    deliveryDate: purchaseOrder.deliveryDate,
    status: purchaseOrder.status,
    purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,

    totalHT: purchaseOrder.totalHT,
    totalVAT: purchaseOrder.totalVAT,
    totalTTC: purchaseOrder.totalTTC,
    finalTotalHT: purchaseOrder.finalTotalHT,
    finalTotalVAT: purchaseOrder.finalTotalVAT,
    finalTotalTTC: purchaseOrder.finalTotalTTC,

    headerNotes: purchaseOrder.headerNotes,
    footerNotes: purchaseOrder.footerNotes,
    termsAndConditions: purchaseOrder.termsAndConditions,
    termsAndConditionsLink: purchaseOrder.termsAndConditionsLink,
    termsAndConditionsLinkTitle: purchaseOrder.termsAndConditionsLinkTitle,

    discount: purchaseOrder.discount,
    discountType: purchaseOrder.discountType,
    discountAmount: purchaseOrder.discountAmount,
    retenueGarantie: purchaseOrder.retenueGarantie,
    escompte: purchaseOrder.escompte,

    showBankDetails: purchaseOrder.showBankDetails,
    isReverseCharge: purchaseOrder.isReverseCharge,
    clientPositionRight: purchaseOrder.clientPositionRight,

    appearance: purchaseOrder.appearance || {
      textColor: "#000000",
      headerTextColor: "#ffffff",
      headerBgColor: "#1d1d1b",
    },

    shipping: purchaseOrder.shipping,

    client: purchaseOrder.client,
    items: purchaseOrder.items,
    companyInfo: purchaseOrder.companyInfo,
    customFields: purchaseOrder.customFields,
  };

  return NextResponse.json(formattedData);
}

export const GET = withErrorHandler(handler);
