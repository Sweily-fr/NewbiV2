"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/src/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "@/src/components/ui/sonner";
import { domToJpeg } from 'modern-screenshot';
import jsPDF from 'jspdf';
import UniversalPreviewPDF from './UniversalPreviewPDF';

const UniversalPDFDownloader = ({
  data,
  type = "invoice",
  filename,
  children,
  className = "",
  variant = "outline",
  size = "sm",
  disabled = false,
  ...props
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const componentRef = useRef(null);

  // Génération PDF avec modern-screenshot + jsPDF
  const handlePDFDownload = async () => {
    setIsGenerating(true);
    try {
      console.log('Début génération PDF');
      
      if (!componentRef.current) {
        throw new Error('Référence du composant non trouvée');
      }

      console.log('Capture de l\'élément...');
      
      // Convertir toutes les images en base64 pour éviter les problèmes CORS
      const images = componentRef.current.querySelectorAll('img');
      console.log(`Traitement de ${images.length} image(s)...`);
      
      for (const img of images) {
        // Ignorer si déjà en base64
        if (!img.src || img.src.startsWith('data:')) continue;
        
        try {
          const originalSrc = img.src;
          
          // S'assurer que crossOrigin est défini pour les images externes
          if (!img.crossOrigin && !img.src.startsWith(window.location.origin)) {
            img.crossOrigin = 'anonymous';
            // Recharger l'image avec le nouvel attribut crossOrigin
            img.src = '';
            img.src = originalSrc;
          }
          
          // Attendre que l'image soit chargée
          if (!img.complete) {
            await new Promise((resolve) => {
              const timeout = setTimeout(resolve, 3000);
              img.onload = () => {
                clearTimeout(timeout);
                resolve();
              };
              img.onerror = () => {
                clearTimeout(timeout);
                resolve();
              };
            });
          }
          
          // Créer un canvas pour convertir l'image en base64
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Définir les dimensions du canvas
          canvas.width = img.naturalWidth || img.width || 200;
          canvas.height = img.naturalHeight || img.height || 200;
          
          // Dessiner l'image sur le canvas avec gestion d'erreur
          try {
            ctx.drawImage(img, 0, 0);
            // Convertir en base64 (PNG pour préserver la transparence)
            const dataUrl = canvas.toDataURL('image/png');
            img.src = dataUrl;
            console.log('✓ Image convertie en base64:', img.alt || originalSrc.substring(0, 50));
          } catch (drawError) {
            console.warn('✗ Erreur CORS lors du dessin de l\'image:', img.alt || originalSrc.substring(0, 50));
            console.warn('  L\'image sera peut-être manquante dans le PDF');
          }
        } catch (error) {
          console.warn('✗ Erreur conversion image:', error);
        }
      }
      
      // Attendre un peu pour s'assurer que toutes les images sont bien mises à jour
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Capturer avec modern-screenshot en JPEG (supporte oklch et compatible jsPDF)
      const dataUrl = await domToJpeg(componentRef.current, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        width: 794, // Largeur A4 en pixels
        scale: 2,
      });
      
      console.log('Capture réussie, JPEG dataURL obtenu');
      console.log('DataURL length:', dataUrl?.length || 0);
      
      // Créer une image pour obtenir les vraies dimensions
      const img = new Image();
      const imgDimensions = await new Promise((resolve, reject) => {
        img.onload = () => {
          console.log('Image chargée:', img.width, 'x', img.height);
          resolve({ width: img.width, height: img.height });
        };
        img.onerror = () => {
          // Si erreur, utiliser dimensions par défaut
          console.warn('Erreur chargement image, utilisation dimensions par défaut');
          resolve({ width: 794 * 2, height: 1123 * 2 }); // A4 ratio avec scale 2
        };
        img.src = dataUrl;
        // Timeout de sécurité
        setTimeout(() => resolve({ width: 794 * 2, height: 1123 * 2 }), 2000);
      });
      
      // Créer le PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      console.log('PDF créé, calcul des dimensions...');
      
      // Calculer les dimensions pour respecter le ratio
      const pdfWidth = 210; // Largeur A4 en mm
      const pdfHeight = 297; // Hauteur A4 en mm
      const imgRatio = imgDimensions.height / imgDimensions.width;
      
      // Calculer la hauteur de l'image pour qu'elle tienne dans la largeur A4
      const imgWidth = pdfWidth;
      const imgHeight = pdfWidth * imgRatio;
      
      console.log('Dimensions finales:', imgWidth, 'x', imgHeight, 'mm');
      console.log('Ratio image:', imgRatio);
      
      // Si l'image est plus haute qu'une page, on doit la découper
      if (imgHeight > pdfHeight) {
        console.log('Document multi-pages détecté');
        let heightLeft = imgHeight;
        let position = 0;
        
        // Ajouter la première page
        pdf.addImage(dataUrl, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
        
        // Ajouter des pages supplémentaires seulement si nécessaire
        // On ajoute une marge de tolérance de 5mm pour éviter les pages vides
        while (heightLeft > 5) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(dataUrl, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
          heightLeft -= pdfHeight;
        }
      } else {
        // L'image tient sur une seule page
        console.log('Document sur une seule page');
        pdf.addImage(dataUrl, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
      }
      
      console.log('Image ajoutée au PDF');

      // Déterminer le nom du fichier
      const documentType = type === 'invoice' ? 'facture' : type === 'quote' ? 'devis' : 'avoir';
      const fileName = filename || `${documentType}_${data.number || 'document'}.pdf`;

      // Télécharger le PDF
      console.log('Téléchargement du PDF:', fileName);
      pdf.save(fileName);
      
      console.log('PDF téléchargé avec succès');
      toast.success('PDF téléchargé avec succès');
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      console.log('Fin génération PDF');
      setIsGenerating(false);
    }
  };

  const handleDownload = (e) => {
    e?.preventDefault();
    handlePDFDownload();
  };

  return (
    <>
      {/* Composant hors écran utilisé pour la génération du PDF */}
      <div style={{ 
        position: 'fixed',
        left: '-9999px',
        top: '0',
        width: '794px',
        height: '1123px', // Hauteur A4 en pixels (297mm)
        backgroundColor: '#ffffff',
        zIndex: -1,
      }}>
        <div ref={componentRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
          <UniversalPreviewPDF data={data} type={type} isMobile={false} forPDF={true} />
        </div>
      </div>
      
      <Button 
        onClick={handleDownload}
        disabled={isGenerating || disabled}
        variant={variant}
        size={size}
        className={`flex items-center gap-2 font-normal ${className || ''}`}
        {...props}
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {children || 'Génération...'}
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            {children || 'Télécharger le PDF'}
          </>
        )}
      </Button>
    </>
  );
};

export default UniversalPDFDownloader;
