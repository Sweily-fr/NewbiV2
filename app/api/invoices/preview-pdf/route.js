import { NextResponse } from "next/server";
import { launchBrowser } from "@/src/lib/puppeteer";
import {
  requireSession,
  hasInternalSecret,
  apiError,
  withErrorHandler,
} from "@/src/lib/security";

/**
 * POST /api/invoices/preview-pdf
 *
 * Generate a preview PDF from raw invoice data (not saved in DB).
 * Used by the mobile app to preview invoices before creation.
 *
 * Body: { invoiceData: { ...same structure as UniversalPreviewPDF data prop } }
 * Returns: PDF binary stream
 *
 * Auth: session cookie OR X-Internal-Secret header (for mobile/backend proxy)
 */
async function handler(request) {
  const body = await request.json();
  const { invoiceData } = body;

  if (!invoiceData) {
    return apiError(400, "invoiceData est requis");
  }

  if (!invoiceData.items || !invoiceData.items.length) {
    return apiError(400, "Au moins un article est requis");
  }

  if (!invoiceData.client) {
    return apiError(400, "Les informations client sont requises");
  }

  // Auth check — session cookie OR internal secret (mobile proxy)
  if (!hasInternalSecret(request)) {
    await requireSession(request);
  }

  let browser = null;
  try {
    console.log("📄 [Preview PDF] Génération preview PDF");

    browser = await launchBrowser();
    const page = await browser.newPage();

    // Inject invoice data into window BEFORE page loads
    await page.evaluateOnNewDocument((data) => {
      window.__PREVIEW_DATA = data;
    }, invoiceData);

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      "http://localhost:3000";
    const previewUrl = `${baseUrl}/pdf-generator/invoice/preview`;

    console.log(`🌐 [Preview PDF] Navigation vers: ${previewUrl}`);

    // Set internal secret for any sub-requests the page might make
    if (process.env.INTERNAL_API_SECRET) {
      await page.setExtraHTTPHeaders({
        "x-internal-secret": process.env.INTERNAL_API_SECRET,
      });
    }

    await page.goto(previewUrl, {
      waitUntil: "networkidle0",
      timeout: 60000,
    });

    console.log("✅ [Preview PDF] Page chargée, attente génération...");

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

    console.log("✅ [Preview PDF] PDF généré");

    const finalBuffer = Buffer.from(pdfData.buffer);

    await browser.close();
    browser = null;

    console.log(`✅ [Preview PDF] PDF retourné (${finalBuffer.length} bytes)`);

    return new NextResponse(finalBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="preview.pdf"',
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
