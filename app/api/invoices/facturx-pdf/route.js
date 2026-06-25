import { NextResponse } from "next/server";
import {
  hasInternalSecret,
  apiError,
  withErrorHandler,
} from "@/src/lib/security";
import {
  generateFacturXXML,
  validateFacturXData,
} from "@/src/utils/facturx-generator";

/**
 * POST /api/invoices/facturx-pdf
 *
 * Génère le PDF Factur-X COMPLET d'une facture, par invoiceId, côté serveur.
 * Version serveur-à-serveur de `buildFacturXFile` (src/utils/archive-invoice-facturx.js) :
 * elle orchestre le pipeline existant pour que le backend (newbi-api) puisse
 * archiver le Factur-X sur R2 à la finalisation, pour TOUS les clients (mobile inclus).
 *
 *   1. /api/invoices/generate-pdf  → PDF visuel (Puppeteer)
 *   2. /api/invoices/data/[id]     → données canoniques de la facture
 *   3. generateFacturXXML()        → XML EN16931 (JS pur)
 *   4. /api/generate-facturx       → embarque le XML dans un PDF/A-3 conforme
 *
 * Auth : secret interne UNIQUEMENT (appel serveur-à-serveur). Jamais exposé au public.
 * Réponse : { success, pdfBase64, facturx: boolean }. Si les données Factur-X sont
 * incomplètes, renvoie le PDF visuel seul (facturx:false) — fallback non bloquant.
 */
async function handler(request) {
  if (!hasInternalSecret(request)) {
    return apiError(401, "Non authentifié");
  }

  const { invoiceId } = await request.json();
  if (!invoiceId) {
    return apiError(400, "invoiceId est requis");
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "http://localhost:3000";
  const secret = process.env.INTERNAL_API_SECRET || "";
  const internalHeaders = {
    "Content-Type": "application/json",
    "x-internal-secret": secret,
  };

  // 1. PDF visuel (Puppeteer) — source unique de rendu
  const pdfResponse = await fetch(`${baseUrl}/api/invoices/generate-pdf`, {
    method: "POST",
    headers: internalHeaders,
    body: JSON.stringify({ invoiceId }),
  });
  if (!pdfResponse.ok) {
    return apiError(502, `generate-pdf: ${pdfResponse.status}`);
  }
  const pdfBase64 = Buffer.from(await pdfResponse.arrayBuffer()).toString(
    "base64",
  );

  // 2. Données canoniques de la facture (pour le XML)
  const dataResponse = await fetch(
    `${baseUrl}/api/invoices/data/${invoiceId}`,
    {
      method: "GET",
      headers: { "x-internal-secret": secret },
    },
  );
  if (!dataResponse.ok) {
    // Pas de données → on renvoie au moins le PDF visuel (fallback)
    return NextResponse.json({ success: true, pdfBase64, facturx: false });
  }
  const invoiceData = await dataResponse.json();

  // 3. Validation + génération XML EN16931
  const validation = validateFacturXData(invoiceData);
  if (!validation.isValid) {
    console.warn(
      "[facturx-pdf] Données Factur-X incomplètes, PDF visuel seul:",
      validation.errors?.slice(0, 3),
    );
    return NextResponse.json({ success: true, pdfBase64, facturx: false });
  }
  const xmlString = generateFacturXXML(invoiceData, "invoice");

  // 4. Embarquement XML → PDF/A-3 conforme
  const facturxResponse = await fetch(`${baseUrl}/api/generate-facturx`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pdfBase64,
      xmlString,
      invoiceNumber: invoiceData.number,
      documentType: "invoice",
    }),
  });
  if (!facturxResponse.ok) {
    return NextResponse.json({ success: true, pdfBase64, facturx: false });
  }
  const result = await facturxResponse.json();
  if (!result.success || !result.pdfBase64) {
    return NextResponse.json({ success: true, pdfBase64, facturx: false });
  }

  return NextResponse.json({
    success: true,
    pdfBase64: result.pdfBase64,
    facturx: true,
  });
}

export const POST = withErrorHandler(handler);
