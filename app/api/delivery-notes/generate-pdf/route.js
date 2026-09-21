import { NextResponse } from "next/server";
import { launchBrowser } from "@/src/lib/puppeteer";
import { VECTOR_PDF_ENABLED, generateVectorPdf } from "@/src/lib/vectorPdf";
import { mongoDb } from "@/src/lib/mongodb";
import {
  requireSession,
  requireOrgMembership,
  hasInternalSecret,
  toObjectId,
  apiError,
  withErrorHandler,
} from "@/src/lib/security";

/**
 * POST /api/delivery-notes/generate-pdf
 *
 * Génère le PDF d'un bon de livraison via Puppeteer (même pipeline que les
 * bons de commande). L'auth (session + appartenance à l'organisation) est
 * vérifiée ICI, avant de lancer le navigateur. Puppeteer appelle ensuite
 * /api/delivery-notes/data/[id] avec X-Internal-Secret.
 */
async function handler(request) {
  const { deliveryNoteId } = await request.json();

  if (!deliveryNoteId) {
    return apiError(400, "deliveryNoteId est requis");
  }

  // Session utilisateur OU appel interne serveur-à-serveur (envoi d'email)
  // authentifié via x-internal-secret (autorisation déjà vérifiée côté GraphQL).
  if (!hasInternalSecret(request)) {
    const { user } = await requireSession(request);
    const deliveryNote = await mongoDb.collection("deliverynotes").findOne({
      _id: toObjectId(deliveryNoteId),
    });
    if (!deliveryNote) {
      return apiError(404, "Bon de livraison introuvable");
    }
    await requireOrgMembership(user.id, deliveryNote.workspaceId);
  }

  let browser = null;
  try {
    console.log(
      `📄 [PDF API] Génération PDF pour bon de livraison ${deliveryNoteId}`,
    );

    browser = await launchBrowser();
    const page = await browser.newPage();

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      "http://localhost:3000";
    const generatorUrl = `${baseUrl}/pdf-generator/delivery-note/${deliveryNoteId}${VECTOR_PDF_ENABLED ? "?mode=print" : ""}`;

    if (process.env.INTERNAL_API_SECRET) {
      await page.setExtraHTTPHeaders({
        "x-internal-secret": process.env.INTERNAL_API_SECRET,
      });
    }

    await page.goto(generatorUrl, {
      waitUntil: "networkidle0",
      timeout: 60000,
    });

    let finalBuffer;
    if (VECTOR_PDF_ENABLED) {
      finalBuffer = await generateVectorPdf(page);
    } else {
      await page.waitForFunction(
        () => window.pdfGenerationResult !== undefined,
        { timeout: 60000 },
      );
      const pdfData = await page.evaluate(() => window.pdfGenerationResult);
      if (pdfData.error) {
        throw new Error(`Erreur génération PDF: ${pdfData.error}`);
      }
      if (!pdfData.success || !pdfData.buffer) {
        throw new Error("PDF non généré");
      }
      finalBuffer = Buffer.from(pdfData.buffer);
    }

    await browser.close();
    browser = null;

    return new NextResponse(finalBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="delivery-note-${deliveryNoteId}.pdf"`,
      },
    });
  } catch (error) {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("Erreur fermeture browser:", closeError);
      }
    }
    throw error;
  }
}

export const POST = withErrorHandler(handler);
