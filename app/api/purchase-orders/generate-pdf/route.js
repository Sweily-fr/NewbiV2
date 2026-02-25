import { NextResponse } from 'next/server';
import { launchBrowser } from '@/src/lib/puppeteer';

export async function POST(request) {
  let browser = null;

  try {
    const { purchaseOrderId } = await request.json();

    if (!purchaseOrderId) {
      return NextResponse.json(
        { error: 'purchaseOrderId est requis' },
        { status: 400 }
      );
    }

    console.log(`📄 [PDF API] Génération PDF pour bon de commande ${purchaseOrderId}`);

    browser = await launchBrowser();

    const page = await browser.newPage();

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || 'http://localhost:3000';
    const generatorUrl = `${baseUrl}/pdf-generator/purchase-order/${purchaseOrderId}`;

    console.log(`🌐 [PDF API] Navigation vers: ${generatorUrl}`);

    await page.goto(generatorUrl, {
      waitUntil: 'networkidle0',
      timeout: 60000,
    });

    console.log('✅ [PDF API] Page chargée, attente de la génération...');

    await page.waitForFunction(
      () => window.pdfGenerationResult !== undefined,
      { timeout: 60000 }
    );

    const pdfData = await page.evaluate(() => window.pdfGenerationResult);

    if (pdfData.error) {
      throw new Error(`Erreur génération PDF: ${pdfData.error}`);
    }

    if (!pdfData.success || !pdfData.buffer) {
      throw new Error('PDF non généré');
    }

    console.log('✅ [PDF API] PDF généré côté client');

    const finalBuffer = Buffer.from(pdfData.buffer);

    await browser.close();
    browser = null;

    console.log(`✅ [PDF API] PDF généré (${finalBuffer.length} bytes)`);

    return new NextResponse(finalBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="purchase-order-${purchaseOrderId}.pdf"`,
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
