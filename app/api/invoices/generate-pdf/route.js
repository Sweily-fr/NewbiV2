import { NextResponse } from "next/server";
import { launchBrowser } from "@/src/lib/puppeteer";
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
 * POST /api/invoices/generate-pdf
 *
 * Generate a PDF for an invoice via Puppeteer.
 * Auth check (session + org membership) is done HERE, before launching the browser.
 * Puppeteer then calls /api/invoices/data/[id] with X-Internal-Secret to fetch data.
 */
async function handler(request) {
  const { invoiceId } = await request.json();

  if (!invoiceId) {
    return apiError(400, "invoiceId est requis");
  }

  // Auth : session utilisateur OU appel interne serveur-à-serveur (backend
  // d'envoi d'email) authentifié via x-internal-secret. Dans ce dernier cas,
  // l'autorisation a déjà été vérifiée côté GraphQL (RBAC + scope workspace).
  if (!hasInternalSecret(request)) {
    const { user } = await requireSession(request);
    const invoice = await mongoDb.collection("invoices").findOne({
      _id: toObjectId(invoiceId),
    });
    if (!invoice) {
      return apiError(404, "Facture introuvable");
    }
    await requireOrgMembership(user.id, invoice.workspaceId);
  }

  // User is authorized — launch Puppeteer to generate the PDF
  let browser = null;
  try {
    console.log(`📄 [PDF API] Génération PDF pour facture ${invoiceId}`);

    browser = await launchBrowser();
    const page = await browser.newPage();

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      "http://localhost:3000";
    const generatorUrl = `${baseUrl}/pdf-generator/invoice/${invoiceId}`;

    console.log(`🌐 [PDF API] Navigation vers: ${generatorUrl}`);

    // Authenticate Puppeteer requests via internal secret (Principle 4)
    // The data route checks this header and skips session verification
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

    await page.waitForFunction(() => window.pdfGenerationResult !== undefined, {
      timeout: 60000,
    });

    const pdfData = await page.evaluate(() => window.pdfGenerationResult);

    if (pdfData.error) {
      throw new Error(`Erreur génération PDF: ${pdfData.error}`);
    }

    if (!pdfData.success || !pdfData.buffer) {
      throw new Error("PDF non généré");
    }

    console.log("✅ [PDF API] PDF généré côté client");

    const finalBuffer = Buffer.from(pdfData.buffer);

    await browser.close();
    browser = null;

    console.log(`✅ [PDF API] PDF généré (${finalBuffer.length} bytes)`);

    return new NextResponse(finalBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoiceId}.pdf"`,
      },
    });
  } catch (error) {
    // Puppeteer errors need special handling — must close browser before re-throwing
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("Erreur fermeture browser:", closeError);
      }
    }
    // Re-throw so withErrorHandler converts it to apiError(500)
    throw error;
  }
}

export const POST = withErrorHandler(handler);
