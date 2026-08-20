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
import {
  resolveCompanyInfo,
  resolveBeneficiary,
} from "@/src/lib/document-company-info";

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

  // Nom du bénéficiaire du virement : réglage d'organisation, jamais
  // recopié dans le document. Sans lui, le PDF headless (pas de session,
  // pas d'organisation active) retombait sur la dénomination sociale.
  const { beneficiaryNameType, userName } = await resolveBeneficiary(invoice);

  // Factures de situation précédentes : indispensables au récapitulatif de
  // facturation et à la colonne "Av. cumulé" de UniversalPreviewPDF. Sans
  // elles, le PDF archivé d'une facture de situation perdait le récap et
  // l'avancement cumulé repartait de l'avancement de la seule facture
  // courante. Même sélection que la sidebar (resolver
  // situationInvoicesByQuoteRef + filtre situationNumber strictement
  // inférieur, tri croissant).
  let previousSituationInvoices = [];
  if (invoice.invoiceType === "situation") {
    const reference = (
      invoice.situationReference ||
      invoice.purchaseOrderNumber ||
      ""
    ).trim();
    if (reference) {
      const currentSituationNumber = invoice.situationNumber || 1;
      const siblings = await mongoDb
        .collection("invoices")
        .find({
          workspaceId: invoice.workspaceId,
          invoiceType: "situation",
          situationReference: reference,
          _id: { $ne: invoice._id },
        })
        .toArray();

      previousSituationInvoices = siblings
        .filter((inv) => (inv.situationNumber || 0) < currentSituationNumber)
        .sort((a, b) => (a.situationNumber || 0) - (b.situationNumber || 0))
        .map((inv) => ({
          id: inv._id.toString(),
          number: inv.number,
          prefix: inv.prefix,
          situationNumber: inv.situationNumber,
          status: inv.status,
          issueDate: inv.issueDate || inv.date,
          createdAt: inv.createdAt,
          updatedAt: inv.updatedAt,
          finalTotalTTC: inv.finalTotalTTC,
          isReverseCharge: inv.isReverseCharge,
          discount: inv.discount,
          discountType: inv.discountType,
          escompte: inv.escompte,
          items: inv.items,
        }));
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
    previousSituationInvoices,

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
    companyInfo: await resolveCompanyInfo(invoice),
    beneficiaryNameType,
    userName,
    customFields: invoice.customFields,
  };

  return NextResponse.json(formattedData);
}

export const GET = withErrorHandler(handler);
