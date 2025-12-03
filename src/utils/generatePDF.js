import { domToJpeg } from 'modern-screenshot';
import jsPDF from 'jspdf';

/**
 * Génère un PDF à partir d'un élément DOM
 * Utilise la même logique que UniversalPDFDownloader
 * @param {HTMLElement} element - L'élément DOM à capturer
 * @returns {Promise<Uint8Array>} - Le buffer du PDF généré
 */
export async function generatePDFFromElement(element) {
  if (!element) {
    throw new Error('Élément DOM non fourni');
  }

  console.log('📄 Début génération PDF');

  // Attendre que toutes les images soient chargées
  const images = element.querySelectorAll('img');
  console.log(`🖼️ ${images.length} image(s) trouvée(s)`);

  await Promise.all(
    Array.from(images).map(img => {
      if (img.complete) {
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Continue même si erreur
        setTimeout(() => resolve(), 3000); // Timeout de sécurité
      });
    })
  );

  // Attendre un peu pour s'assurer que tout est rendu
  await new Promise(resolve => setTimeout(resolve, 500));

  // Capturer avec modern-screenshot en JPEG
  const dataUrl = await domToJpeg(element, {
    quality: 0.95,
    backgroundColor: '#ffffff',
    width: 794, // Largeur A4 en pixels
    scale: 2,
    fetch: {
      requestInit: {
        mode: 'cors',
        credentials: 'omit',
      },
    },
  });

  console.log('✅ Capture réussie');

  // Créer une image pour obtenir les dimensions
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = dataUrl;
  });

  console.log(`📐 Dimensions: ${img.width}x${img.height}px`);

  // Créer le PDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pdfWidth = 210;
  const pdfHeight = 297;
  const imgWidthMM = pdfWidth;
  const imgHeightMM = (img.height * pdfWidth) / img.width;

  // Découpage intelligent si le document est trop long
  if (imgHeightMM > pdfHeight) {
    console.log('📄 Document multi-pages');
    
    const totalPages = Math.ceil(imgHeightMM / pdfHeight);
    const pixelsPerPage = Math.floor((img.height * pdfHeight) / imgHeightMM);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) {
        pdf.addPage();
      }

      const sourceY = page * pixelsPerPage;
      const sourceHeight = Math.min(pixelsPerPage, img.height - sourceY);

      // Créer un canvas temporaire pour cette page
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = sourceHeight;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(
        img,
        0, sourceY, img.width, sourceHeight,
        0, 0, img.width, sourceHeight
      );

      const pageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const pageHeightMM = (sourceHeight * pdfWidth) / img.width;

      pdf.addImage(pageDataUrl, 'JPEG', 0, 0, imgWidthMM, pageHeightMM);

      // Ajouter le numéro de page
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text(`${page + 1}/${totalPages}`, pdfWidth - 15, pdfHeight - 5);
    }
  } else {
    // Document sur une seule page
    console.log('📄 Document sur une page');
    pdf.addImage(dataUrl, 'JPEG', 0, 0, imgWidthMM, imgHeightMM);
  }

  // Retourner le buffer du PDF
  const pdfBuffer = pdf.output('arraybuffer');
  console.log(`✅ PDF généré (${pdfBuffer.byteLength} bytes)`);

  return new Uint8Array(pdfBuffer);
}
