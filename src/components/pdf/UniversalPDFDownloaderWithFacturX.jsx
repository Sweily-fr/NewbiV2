"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/src/components/ui/button";
import { Download, LoaderCircle, FileCheck } from "lucide-react";
import { toast } from "@/src/components/ui/sonner";
import { domToJpeg } from 'modern-screenshot';
import jsPDF from 'jspdf';
import UniversalPreviewPDF from './UniversalPreviewPDF';
import { embedFacturXInPDF, validateFacturXData } from '@/src/utils/facturx-generator';

const UniversalPDFDownloaderWithFacturX = ({
  data,
  type = "invoice",
  filename,
  children,
  className = "",
  variant = "outline",
  size = "sm",
  disabled = false,
  enableFacturX = true, // Nouveau prop pour activer/désactiver Factur-X
  ...props
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const componentRef = useRef(null);

  // Vérifier si Factur-X peut être appliqué
  // Par défaut : uniquement pour les factures
  // Les avoirs peuvent aussi utiliser Factur-X si explicitement activé
  const canUseFacturX = enableFacturX && (type === 'invoice' || type === 'creditNote');

  // Génération PDF avec modern-screenshot + jsPDF + Factur-X
  const handlePDFDownload = async () => {
    setIsGenerating(true);
    try {
      console.log('Début génération PDF');
      
      if (!componentRef.current) {
        throw new Error('Référence du composant non trouvée');
      }

      console.log('Capture de l\'élément...');
      
      // Attendre que toutes les images soient chargées
      const images = componentRef.current.querySelectorAll('img');
      console.log(`Nombre d'images trouvées: ${images.length}`);
      
      await Promise.all(
        Array.from(images).map(img => {
          if (img.complete) {
            console.log('Image déjà chargée:', img.src);
            return Promise.resolve();
          }
          return new Promise((resolve, reject) => {
            img.onload = () => {
              console.log('Image chargée:', img.src);
              resolve();
            };
            img.onerror = () => {
              console.warn('Erreur chargement image:', img.src);
              resolve();
            };
            setTimeout(() => {
              console.warn('Timeout chargement image:', img.src);
              resolve();
            }, 3000);
          });
        })
      );
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Capturer avec modern-screenshot en JPEG
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
      
      console.log('Capture réussie, JPEG dataURL obtenu');
      
      // Créer une image pour obtenir les vraies dimensions
      const img = new Image();
      const imgDimensions = await new Promise((resolve, reject) => {
        img.onload = () => {
          console.log('Image chargée:', img.width, 'x', img.height);
          resolve({ width: img.width, height: img.height });
        };
        img.onerror = () => {
          console.warn('Erreur chargement image, utilisation dimensions par défaut');
          resolve({ width: 794 * 2, height: 1123 * 2 });
        };
        img.src = dataUrl;
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
      const pdfWidth = 210;
      const pdfHeight = 297;
      const imgRatio = imgDimensions.height / imgDimensions.width;
      
      const imgWidth = pdfWidth;
      const imgHeight = pdfWidth * imgRatio;
      
      console.log('Dimensions finales:', imgWidth, 'x', imgHeight, 'mm');
      
      // Ajouter l'image au PDF
      if (imgHeight > pdfHeight) {
        console.log('Document multi-pages détecté');
        let heightLeft = imgHeight;
        let position = 0;
        
        pdf.addImage(dataUrl, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
        
        while (heightLeft > 5) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(dataUrl, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
          heightLeft -= pdfHeight;
        }
      } else {
        console.log('Document sur une seule page');
        pdf.addImage(dataUrl, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
      }
      
      console.log('Image ajoutée au PDF');

      // Déterminer le nom du fichier
      const documentType = type === 'invoice' ? 'facture' : type === 'quote' ? 'devis' : 'avoir';
      const fileName = filename || `${documentType}_${data.number || 'document'}.pdf`;

      // ===== INTÉGRATION FACTUR-X =====
      if (canUseFacturX) {
        console.log('🔧 Intégration Factur-X conforme...');
        
        // Valider les données pour Factur-X
        const validation = validateFacturXData(data);
        
        if (validation.isValid) {
          try {
            // Obtenir le PDF en base64
            const pdfBase64 = pdf.output('dataurlstring').split(',')[1];
            
            // Générer le XML Factur-X
            const { generateFacturXXML } = await import('@/src/utils/facturx-generator');
            const xmlString = generateFacturXXML(data, type);
            
            console.log('📤 Envoi au serveur pour conversion PDF/A-3...');
            
            // Appeler l'API pour générer le PDF Factur-X conforme
            const response = await fetch('/api/generate-facturx', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                pdfBase64,
                xmlString,
                invoiceNumber: data.number,
                documentType: type,
              }),
            });
            
            const result = await response.json();
            
            if (result.success) {
              // Convertir le base64 en blob
              const binaryString = atob(result.pdfBase64);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const blob = new Blob([bytes], { type: 'application/pdf' });
              
              // Télécharger le PDF
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = fileName;
              link.click();
              URL.revokeObjectURL(url);
              
              console.log('✅ PDF Factur-X conforme téléchargé avec succès');
              toast.success('PDF téléchargé', {
                description: 'PDF/A-3 + XML EN16931 + Métadonnées XMP',
                icon: <FileCheck className="h-4 w-4" />
              });
            } else {
              throw new Error(result.error || 'Erreur serveur');
            }
          } catch (facturXError) {
            console.error('❌ Erreur Factur-X, téléchargement PDF standard:', facturXError);
            // Fallback : télécharger le PDF sans Factur-X
            pdf.save(fileName);
            toast.warning('PDF téléchargé sans Factur-X', {
              description: 'Une erreur est survenue lors de l\'intégration XML'
            });
          }
        } else {
          console.warn('⚠️ Données incomplètes pour Factur-X:');
          console.warn('Erreurs détaillées:', validation.errors);
          validation.errors.forEach((error, index) => {
            console.warn(`  ${index + 1}. ${error}`);
          });
          
          // Télécharger le PDF standard
          pdf.save(fileName);
          toast.warning('PDF téléchargé sans Factur-X', {
            description: `Données manquantes: ${validation.errors.join(', ')}`,
            duration: 10000, // 10 secondes pour avoir le temps de lire
          });
        }
      } else {
        // Télécharger le PDF standard (devis, avoir, ou Factur-X désactivé)
        console.log('Téléchargement du PDF standard:', fileName);
        pdf.save(fileName);
        toast.success('PDF téléchargé avec succès');
      }
      
      console.log('PDF téléchargé avec succès');
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
        height: '1123px',
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
            <LoaderCircle className="h-4 w-4 animate-spin" />
            {children || 'Génération...'}
          </>
        ) : (
          <>
            {canUseFacturX ? (
              <FileCheck className="h-4 w-4" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {children || 'Télécharger le PDF'}
          </>
        )}
      </Button>
    </>
  );
};

export default UniversalPDFDownloaderWithFacturX;
