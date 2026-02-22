import { NextResponse } from 'next/server';
import { launchBrowser } from '@/src/lib/puppeteer';

/**
 * API Route pour générer un PDF d'avoir
 * Utilise Puppeteer pour exécuter le code de génération PDF du frontend
 */
export async function POST(request) {
  let browser = null;

  try {
    const { creditNoteId } = await request.json();

    if (!creditNoteId) {
      return NextResponse.json(
        { error: 'creditNoteId est requis' },
        { status: 400 }
      );
    }

    console.log(`📄 [PDF API] Génération PDF pour avoir ${creditNoteId}`);

    browser = await launchBrowser();

    const page = await browser.newPage();

    // Naviguer vers la page de génération PDF
    // Sur Vercel, utiliser VERCEL_URL ou NEXT_PUBLIC_APP_URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || 'http://localhost:3000';
    const generatorUrl = `${baseUrl}/pdf-generator/credit-note/${creditNoteId}`;

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
        'Content-Disposition': `attachment; filename="credit-note-${creditNoteId}.pdf"`,
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
