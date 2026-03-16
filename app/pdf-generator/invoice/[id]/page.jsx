"use client";

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import UniversalPreviewPDF from '@/src/components/pdf/UniversalPreviewPDF';
import { domToJpeg } from 'modern-screenshot';
// jsPDF importé dynamiquement pour réduire la taille du bundle

export default function PDFGeneratorPage() {
  const params = useParams();
  const [invoiceData, setInvoiceData] = useState(null);
  const [status, setStatus] = useState('loading');
  const componentRef = useRef(null);

  useEffect(() => {
    async function fetchAndGenerate() {
      try {
        console.log('🔍 Récupération facture:', params.id);
        
        // Récupérer les données de la facture depuis l'API
        const response = await fetch(`/api/invoices/data/${params.id}`);
        console.log('📡 Réponse API:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Erreur API:', errorText);
          throw new Error('Facture non trouvée');
        }
        
        const data = await response.json();
        console.log('✅ Données reçues:', data);
        setInvoiceData(data);
        setStatus('ready');

        // Attendre que le composant soit rendu
        console.log('⏳ Attente rendu composant...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Générer le PDF
        console.log('📄 Début génération PDF...');
        await generatePDF(data);
      } catch (error) {
        console.error('❌ Erreur:', error);
        setStatus('error');
        window.pdfGenerationResult = { error: error.message };
      }
    }

    fetchAndGenerate();
  }, [params.id]);

  async function generatePDF(data) {
    try {
      console.log('🎨 Génération PDF - Étape 1: Vérification composant');
      if (!componentRef.current) {
        console.error('❌ componentRef.current est null');
        throw new Error('Composant non trouvé');
      }
      console.log('✅ Composant trouvé');

      // Attendre le chargement des images
      console.log('🖼️ Génération PDF - Étape 2: Chargement images');
      const images = componentRef.current.querySelectorAll('img');
      console.log(`📸 ${images.length} image(s) trouvée(s)`);
      
      await Promise.all(
        Array.from(images).map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            setTimeout(() => resolve(), 3000);
          });
        })
      );

      console.log('✅ Images chargées');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Capturer avec modern-screenshot
      console.log('📷 Génération PDF - Étape 3: Capture screenshot');
      const dataUrl = await domToJpeg(componentRef.current, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        width: 794,
        scale: 2,
        fetch: {
          requestInit: {
            mode: 'cors',
            credentials: 'omit',
          },
        },
      });

      // Créer une image
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = dataUrl;
      });

      // Créer le PDF (import dynamique)
      const { default: jsPDF } = await import('jspdf');
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

      // Vérifier si le contenu tient sur une seule page (avec une petite marge de tolérance)
      const fitsOnOnePage = imgHeightMM <= pdfHeight + 1; // +1mm de tolérance

      // Multi-pages avec découpage intelligent (même logique que UniversalPDFDownloader)
      if (!fitsOnOnePage) {
        console.log('📄 Document multi-pages détecté');

        // Détecter le footer pour le repositionner sur la dernière page
        const footerElement = componentRef.current.querySelector('[data-pdf-section="footer"]');
        let footerHeight = 0;
        let footerPositionY = img.height;
        let footerBgColor = 'rgb(232, 232, 232)'; // Couleur par défaut
        
        if (footerElement) {
          const containerRect = componentRef.current.getBoundingClientRect();
          const footerRect = footerElement.getBoundingClientRect();
          footerHeight = footerRect.height * 2; // *2 pour le scale
          footerPositionY = (footerRect.top - containerRect.top) * 2;
          
          console.log(`🔖 Footer détecté: hauteur=${footerHeight}px, position=${footerPositionY}px`);
        }
        
        // Extraire la couleur du footer directement depuis l'image capturée
        const colorCanvas = document.createElement('canvas');
        colorCanvas.width = img.width;
        colorCanvas.height = img.height;
        const colorCtx = colorCanvas.getContext('2d');
        colorCtx.drawImage(img, 0, 0);
        
        // Récupérer la couleur d'un pixel au milieu du footer (10px à l'intérieur)
        if (footerPositionY < img.height) {
          const sampleY = Math.min(footerPositionY + 20, img.height - 1); // 10px dans le footer (scale 2)
          const sampleX = 50; // 25px du bord gauche
          const pixelData = colorCtx.getImageData(sampleX, sampleY, 1, 1).data;
          footerBgColor = `rgb(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]})`;
          console.log(`🎨 Couleur extraite du footer: ${footerBgColor}`);
        }
        
        // Hauteur du bandeau de pagination (en mm pour le PDF)
        const paginationBannerHeightMM = 12; // 12mm de hauteur
        const paginationBannerHeightPx = paginationBannerHeightMM * (img.width / pdfWidth); // Convertir en pixels

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const canvasWidth = img.width;
        const pixelsPerMM = img.width / pdfWidth;
        const pageHeightPixels = pdfHeight * pixelsPerMM;

        canvas.width = canvasWidth;
        canvas.height = pageHeightPixels;

        let currentY = 0;
        let pageNumber = 0;
        const pages = [];

        // Première passe : générer toutes les pages
        while (currentY < img.height) {
          let targetY = currentY + pageHeightPixels;
          
          // S'assurer de ne pas dépasser l'image
          if (targetY > img.height) {
            targetY = img.height;
          }

          const sliceHeight = targetY - currentY;
          const isLastPage = targetY >= img.height;

          // Remplir le canvas avec du blanc
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Si c'est la dernière page et qu'il y a un footer, on le repositionne en bas
          if (isLastPage && footerElement && footerHeight > 0) {
            console.log('📄 Dernière page - repositionnement du footer');
            
            // Marge en haut pour les pages après la première (15mm)
            const topMarginPx = pageNumber > 0 ? 15 * pixelsPerMM : 0;
            
            // Calculer la hauteur du contenu sans le footer
            const contentWithoutFooter = footerPositionY - currentY;
            
            // Dessiner le contenu (sans le footer, avec marge en haut si pas première page)
            if (contentWithoutFooter > 0) {
              ctx.drawImage(
                img,
                0, currentY,
                canvasWidth, contentWithoutFooter,
                0, topMarginPx,
                canvasWidth, contentWithoutFooter
              );
            }
            
            // Dessiner le bandeau de pagination en bas
            ctx.fillStyle = footerBgColor;
            ctx.fillRect(0, pageHeightPixels - paginationBannerHeightPx, canvasWidth, paginationBannerHeightPx);
            
            // Dessiner le footer au-dessus du bandeau de pagination
            const footerDestY = pageHeightPixels - footerHeight - paginationBannerHeightPx;
            ctx.drawImage(
              img,
              0, footerPositionY,
              canvasWidth, footerHeight,
              0, footerDestY,
              canvasWidth, footerHeight
            );
          } else {
            // Page intermédiaire : dessiner le contenu + bandeau de pagination en bas
            // Marge en haut pour les pages après la première (15mm)
            const topMarginPx = pageNumber > 0 ? 15 * pixelsPerMM : 0;
            
            // Calculer la hauteur disponible pour le contenu (page - bandeau - marge haut)
            const availableContentHeight = pageHeightPixels - paginationBannerHeightPx - topMarginPx;
            
            // Calculer combien de contenu on peut dessiner (sans dépasser le footer)
            let contentToDraw = availableContentHeight;
            
            // IMPORTANT: Ne jamais dessiner le footer sur les pages intermédiaires
            // Le footer commence à footerPositionY, on s'arrête juste avant
            if (footerElement && footerPositionY > 0) {
              const maxContentY = footerPositionY - 2; // -2px de marge pour éviter le trait
              if (currentY + contentToDraw > maxContentY) {
                contentToDraw = Math.max(0, maxContentY - currentY);
              }
            }
            
            // Dessiner le contenu (avec marge en haut si ce n'est pas la première page)
            if (contentToDraw > 0) {
              ctx.drawImage(
                img,
                0, currentY,
                canvasWidth, contentToDraw,
                0, topMarginPx,
                canvasWidth, contentToDraw
              );
            }
            
            // Dessiner le bandeau de pagination en bas
            ctx.fillStyle = footerBgColor;
            ctx.fillRect(0, pageHeightPixels - paginationBannerHeightPx, canvasWidth, paginationBannerHeightPx);
          }

          // Convertir le canvas en image
          const pageImageData = canvas.toDataURL('image/jpeg', 0.95);
          
          // Toutes les pages font la hauteur complète A4
          const pageHeightMM = pdfHeight;
          
          // Stocker les données de la page avec sa hauteur réelle
          pages.push({
            imageData: pageImageData,
            heightMM: pageHeightMM,
            isLastPage: isLastPage
          });

          console.log(`✅ Page ${pageNumber + 1} générée`);

          // Avancer dans le contenu
          if (isLastPage) {
            currentY = targetY;
          } else {
            // On avance de la hauteur disponible pour le contenu (page - bandeau)
            const availableContentHeight = pageHeightPixels - paginationBannerHeightPx;
            // Mais on ne dépasse pas le footer
            if (footerElement && currentY + availableContentHeight > footerPositionY) {
              currentY = footerPositionY;
            } else {
              currentY += availableContentHeight;
            }
          }
          pageNumber++;

          // Sécurité pour éviter boucle infinie
          if (pageNumber > 50) {
            console.error('⚠️ Trop de pages, arrêt');
            break;
          }
        }

        // Deuxième passe : ajouter les pages au PDF avec numérotation
        const totalPages = pages.length;
        console.log(`📄 Total: ${totalPages} page(s)`);

        pages.forEach((page, index) => {
          if (index > 0) {
            pdf.addPage();
          }

          // Ajouter l'image de la page avec sa hauteur réelle
          pdf.addImage(
            page.imageData,
            'JPEG',
            0,
            0,
            pdfWidth,
            page.heightMM,
            undefined,
            'FAST'
          );

          // Ajouter la numérotation en bas de page à droite (dans le bandeau)
          pdf.setFontSize(9);
          const pageText = `Page ${index + 1}/${totalPages}`;
          const textWidth = pdf.getTextWidth(pageText);
          
          // Pagination en gris foncé sur le bandeau coloré (fond clair)
          // Position : centré verticalement dans le bandeau de 12mm
          // Le bandeau va de (pdfHeight - 12) à pdfHeight, donc le centre est à pdfHeight - 6
          // On ajoute ~1mm pour compenser la hauteur du texte (baseline)
          pdf.setTextColor(80, 80, 80);
          const bannerY = pdfHeight - 4; // 4mm du bas = centré dans un bandeau de 12mm
          pdf.text(pageText, pdfWidth - textWidth - 10, bannerY);
        });
      } else {
        // Une seule page
        console.log('📄 Document sur une seule page');
        pdf.addImage(dataUrl, 'JPEG', 0, 0, imgWidthMM, imgHeightMM, undefined, 'FAST');
      }

      // Stocker le résultat dans window pour que Puppeteer puisse le récupérer
      const arrayBuffer = pdf.output('arraybuffer');
      window.pdfGenerationResult = {
        success: true,
        buffer: Array.from(new Uint8Array(arrayBuffer))
      };

      setStatus('complete');
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      window.pdfGenerationResult = { error: error.message };
      setStatus('error');
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center text-red-600">
          <p className="text-xl font-semibold">Erreur</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen p-4">
      {status === 'complete' && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded z-50">
          PDF généré avec succès
        </div>
      )}
      {status === 'loading' && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded z-50">
          Chargement...
        </div>
      )}
      {status === 'ready' && (
        <div className="fixed top-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded z-50">
          Génération en cours...
        </div>
      )}
      <div 
        ref={componentRef}
        style={{ 
          width: '794px',
          backgroundColor: '#ffffff',
          margin: '0 auto',
        }}
      >
        {invoiceData && (
          <UniversalPreviewPDF
            data={invoiceData}
            type="invoice"
            forPDF={true}
          />
        )}
      </div>
    </div>
  );
}
