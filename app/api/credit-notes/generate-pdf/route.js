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
 * POST /api/credit-notes/generate-pdf
 *
 * Generate a PDF for a credit note via Puppeteer.
 * Auth check (session + org membership) is done HERE, before launching the browser.
 * Puppeteer then calls /api/credit-notes/data/[id] with X-Internal-Secret to fetch data.
 */
async function handler(request) {
  const { creditNoteId } = await request.json();

  if (!creditNoteId) {
    return apiError(400, "creditNoteId est requis");
  }

  // Auth : session utilisateur OU appel interne serveur-à-serveur (backend
  // d'envoi d'email) authentifié via x-internal-secret. Dans ce dernier cas,
  // l'autorisation a déjà été vérifiée côté GraphQL (RBAC + scope workspace).
  if (!hasInternalSecret(request)) {
    const { user } = await requireSession(request);
    const creditNote = await mongoDb.collection("creditnotes").findOne({
      _id: toObjectId(creditNoteId),
    });
    if (!creditNote) {
      return apiError(404, "Avoir introuvable");
    }
    await requireOrgMembership(user.id, creditNote.workspaceId);
  }

  // User is authorized — launch Puppeteer to generate the PDF
  let browser = null;
  try {
    console.log(`📄 [PDF API] Génération PDF pour avoir ${creditNoteId}`);

    browser = await launchBrowser();
    const page = await browser.newPage();

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      "http://localhost:3000";
    // mode=print : la page rend le document sans le capturer, le PDF vectoriel
    // est produit ici par page.pdf() (cf. src/lib/vectorPdf.js).
    const generatorUrl = `${baseUrl}/pdf-generator/credit-note/${creditNoteId}${VECTOR_PDF_ENABLED ? "?mode=print" : ""}`;

    console.log(`🌐 [PDF API] Navigation vers: ${generatorUrl}`);

    // Authenticate Puppeteer requests via internal secret (Principle 4)
    if (process.env.INTERNAL_API_SECRET) {
      await page.setExtraHTTPHeaders({
        "x-internal-secret": process.env.INTERNAL_API_SECRET,
      });
    }

    await page.goto(generatorUrl, {
      waitUntil: "networkidle0",
      timeout: 60000,
    });

    console.log("✅ [PDF API] Page chargée, attente de la génération...");

    let finalBuffer;
    if (VECTOR_PDF_ENABLED) {
      finalBuffer = await generateVectorPdf(page);
      console.log("✅ [PDF API] PDF vectoriel généré (page.pdf)");
    } else {
      await page.waitForFunction(
        () => window.pdfGenerationResult !== undefined,
        {
          timeout: 60000,
        },
      );

      const pdfData = await page.evaluate(() => window.pdfGenerationResult);

      if (pdfData.error) {
        throw new Error(`Erreur génération PDF: ${pdfData.error}`);
      }

      if (!pdfData.success || !pdfData.buffer) {
        throw new Error("PDF non généré");
      }

      console.log("✅ [PDF API] PDF généré côté client");

      finalBuffer = Buffer.from(pdfData.buffer);
    }

    await browser.close();
    browser = null;

    console.log(`✅ [PDF API] PDF généré (${finalBuffer.length} bytes)`);

    return new NextResponse(finalBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="credit-note-${creditNoteId}.pdf"`,
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
