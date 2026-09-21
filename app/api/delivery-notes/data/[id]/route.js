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
import { resolveCompanyInfo } from "@/src/lib/document-company-info";

/**
 * GET /api/delivery-notes/data/[id]
 *
 * Route à double accès (même principe que les bons de commande) :
 * - Puppeteer (génération PDF) : authentifié via X-Internal-Secret
 * - Utilisateur : session + appartenance à l'organisation
 *
 * Un bon de livraison ne porte aucun montant : les champs tarifaires cachés
 * des lignes (unitPrice, vatRate…) ne sont JAMAIS renvoyés.
 */
async function handler(request, { params }) {
  const { id } = await params;
  const deliveryNoteId = toObjectId(id);

  const fromPuppeteer = hasInternalSecret(request);

  let authenticatedUserId = null;
  if (!fromPuppeteer) {
    const { user } = await requireSession(request);
    authenticatedUserId = user.id;
  }

  const deliveryNote = await mongoDb.collection("deliverynotes").findOne({
    _id: deliveryNoteId,
  });

  if (!deliveryNote) {
    return apiError(404, "Bon de livraison introuvable");
  }

  if (authenticatedUserId) {
    await requireOrgMembership(authenticatedUserId, deliveryNote.workspaceId);
  }

  const formattedData = {
    id: deliveryNote._id.toString(),
    number: deliveryNote.number,
    prefix: deliveryNote.prefix,
    status: deliveryNote.status,
    issueDate: deliveryNote.issueDate,
    deliveryDate: deliveryNote.deliveryDate,

    carrier: deliveryNote.carrier,
    trackingNumber: deliveryNote.trackingNumber,
    notes: deliveryNote.notes,
    deliveryAddress: deliveryNote.deliveryAddress,

    receivedBy: deliveryNote.receivedBy,
    receivedAt: deliveryNote.receivedAt,
    signatureDataUrl: deliveryNote.signatureDataUrl,

    headerNotes: deliveryNote.headerNotes,
    footerNotes: deliveryNote.footerNotes,
    termsAndConditions: deliveryNote.termsAndConditions,
    termsAndConditionsLink: deliveryNote.termsAndConditionsLink,
    termsAndConditionsLinkTitle: deliveryNote.termsAndConditionsLinkTitle,

    clientPositionRight: deliveryNote.clientPositionRight,
    appearance: deliveryNote.appearance || {
      textColor: "#000000",
      headerTextColor: "#ffffff",
      headerBgColor: "#1d1d1b",
    },

    client: deliveryNote.client,
    items: (deliveryNote.items || []).map((item) => ({
      description: item.description,
      details: item.details,
      reference: item.reference,
      quantity: item.quantity,
      orderedQuantity: item.orderedQuantity,
      deliveredQuantity: item.deliveredQuantity,
      unit: item.unit,
    })),
    companyInfo: await resolveCompanyInfo(deliveryNote),
    customFields: deliveryNote.customFields,
  };

  return NextResponse.json(formattedData);
}

export const GET = withErrorHandler(handler);
