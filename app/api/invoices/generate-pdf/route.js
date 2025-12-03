import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

/**
 * API Route pour générer un PDF de facture
 * Utilise Puppeteer pour exécuter le code de génération PDF du frontend
 */
export async function POST(request) {
  let browser = null;

  try {
    const { invoiceId } = await request.json();

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'invoiceId est requis' },
        { status: 400 }
      );
    }

    console.log(`📄 [PDF API] Génération PDF pour facture ${invoiceId}`);

    // Lancer Puppeteer
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();

    // Naviguer vers la page de génération PDF
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const generatorUrl = `${baseUrl}/pdf-generator/invoice/${invoiceId}`;

    console.log(`🌐 [PDF API] Navigation vers: ${generatorUrl}`);

    await page.goto(generatorUrl, {
      waitUntil: 'networkidle0',
      timeout: 60000,
    });

    console.log('✅ [PDF API] Page chargée, attente de la génération...');

    // Attendre que le PDF soit généré (la page stocke le résultat dans window.pdfGenerationResult)
    await page.waitForFunction(
      () => window.pdfGenerationResult !== undefined,
      { timeout: 60000 }
    );

    // Récupérer le résultat
    const pdfData = await page.evaluate(() => window.pdfGenerationResult);

    if (pdfData.error) {
      throw new Error(`Erreur génération PDF: ${pdfData.error}`);
    }

    if (!pdfData.success || !pdfData.buffer) {
      throw new Error('PDF non généré');
    }

    console.log('✅ [PDF API] PDF généré côté client');

    // Convertir le tableau en Buffer
    const finalBuffer = Buffer.from(pdfData.buffer);

    await browser.close();
    browser = null;

    console.log(`✅ [PDF API] PDF généré (${finalBuffer.length} bytes)`);

    // Retourner le PDF
    return new NextResponse(finalBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoiceId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('❌ [PDF API] Erreur:', error);

    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Erreur fermeture browser:', closeError);
      }
    }

    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF', details: error.message },
      { status: 500 }
    );
  }
}
