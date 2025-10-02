"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "@/src/components/ui/sonner";
import { useReactToPrint } from 'react-to-print';
import { domToPng } from 'modern-screenshot';
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
  const [isMobile, setIsMobile] = useState(false);
  const componentRef = useRef(null);

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: filename || `${type}_${data?.number || 'document'}`,
    onBeforeGetContent: () => {
      setIsGenerating(true);
      return new Promise((resolve) => setTimeout(resolve, 500));
    },
    onAfterPrint: () => {
      setIsGenerating(false);
      toast.success('PDF téléchargé avec succès');
    },
    onPrintError: (error) => {
      console.error('Erreur lors de l\'impression :', error);
      toast.error('Une erreur est survenue lors de la génération du PDF');
      setIsGenerating(false);
    }
  });

  // Génération PDF pour mobile avec modern-screenshot
  const handleMobileDownload = async () => {
    setIsGenerating(true);
    try {
      if (!componentRef.current) {
        throw new Error('Référence du composant non trouvée');
      }

      // Capturer avec modern-screenshot (supporte oklch)
      const dataUrl = await domToPng(componentRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        width: 794, // Largeur A4 en pixels
      });

      // Créer le PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Convertir l'image en PDF
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const imgWidth = 210; // Largeur A4 en mm
      const pageHeight = 297; // Hauteur A4 en mm
      const imgHeight = (img.height * imgWidth) / img.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Ajouter la première page
      pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Ajouter des pages supplémentaires si nécessaire
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Déterminer le nom du fichier
      const documentType = type === 'invoice' ? 'facture' : type === 'quote' ? 'devis' : 'avoir';
      const fileName = filename || `${documentType}_${data.number || 'document'}.pdf`;

      // Télécharger le PDF
      pdf.save(fileName);
      
      toast.success('PDF téléchargé avec succès');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Une erreur est survenue lors de la génération du PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (e) => {
    e?.preventDefault();
    if (isMobile) {
      handleMobileDownload();
    } else {
      handlePrint();
    }
  };

  return (
    <>
      {/* Composant caché utilisé pour la génération du PDF */}
      <div style={{ display: 'none' }}>
        <div ref={componentRef}>
          <UniversalPreviewPDF data={data} type={type} />
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
