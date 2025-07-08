"use client";

import { useState, useEffect } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { toast } from "sonner";

// PDF generation utility using jsPDF and html2canvas
const generateInvoicePDF = async (invoiceData, previewElement) => {
  try {
    // Dynamic import to avoid SSR issues
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas')
    ]);

    // Create canvas from the preview element
    const canvas = await html2canvas(previewElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: previewElement.scrollWidth,
      height: previewElement.scrollHeight,
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    return pdf;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Erreur lors de la génération du PDF');
  }
};

export function PDFGenerator({ invoiceData, previewRef, className }) {
  const [generating, setGenerating] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDownloadPDF = async () => {
    if (!previewRef?.current) {
      toast.error("Impossible de générer le PDF : aperçu non disponible");
      return;
    }

    setGenerating(true);
    try {
      const pdf = await generateInvoicePDF(invoiceData, previewRef.current);
      
      // Generate filename
      const filename = `facture_${invoiceData.number || 'brouillon'}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Download PDF
      pdf.save(filename);
      
      toast.success("PDF téléchargé avec succès");
    } catch (error) {
      toast.error(error.message || "Erreur lors de la génération du PDF");
    } finally {
      setGenerating(false);
    }
  };

  const handlePreviewPDF = async () => {
    if (!previewRef?.current) {
      toast.error("Impossible de prévisualiser le PDF : aperçu non disponible");
      return;
    }

    setGenerating(true);
    try {
      const pdf = await generateInvoicePDF(invoiceData, previewRef.current);
      
      // Open PDF in new tab
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      
      toast.success("PDF ouvert dans un nouvel onglet");
    } catch (error) {
      toast.error(error.message || "Erreur lors de la génération du PDF");
    } finally {
      setGenerating(false);
    }
  };

  // Ne pas rendre les boutons côté serveur
  if (!isClient) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button variant="outline" size="sm" disabled className="gap-2">
          <FileText className="h-4 w-4" />
          Aperçu PDF
        </Button>
        <Button variant="default" size="sm" disabled className="gap-2">
          <Download className="h-4 w-4" />
          Télécharger PDF
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={handlePreviewPDF}
        disabled={generating}
        className="gap-2"
      >
        {generating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        Aperçu PDF
      </Button>
      
      <Button
        variant="default"
        size="sm"
        onClick={handleDownloadPDF}
        disabled={generating}
        className="gap-2"
      >
        {generating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Télécharger PDF
      </Button>
    </div>
  );
}

// Hook for PDF operations
export function usePDFGenerator() {
  const [generating, setGenerating] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const generatePDF = async (invoiceData, previewElement) => {
    setGenerating(true);
    try {
      return await generateInvoicePDF(invoiceData, previewElement);
    } finally {
      setGenerating(false);
    }
  };

  const downloadPDF = async (invoiceData, previewElement, filename) => {
    try {
      const pdf = await generatePDF(invoiceData, previewElement);
      pdf.save(filename || `facture_${invoiceData.number || 'brouillon'}.pdf`);
      toast.success("PDF téléchargé avec succès");
    } catch (error) {
      toast.error("Erreur lors du téléchargement du PDF");
      throw error;
    }
  };

  const previewPDF = async (invoiceData, previewElement) => {
    if (!isClient) {
      console.warn("previewPDF can only be called on the client side");
      return;
    }

    try {
      const pdf = await generatePDF(invoiceData, previewElement);
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      toast.success("PDF ouvert dans un nouvel onglet");
    } catch (error) {
      toast.error("Erreur lors de l'aperçu du PDF");
      throw error;
    }
  };

  return {
    generating,
    generatePDF,
    downloadPDF,
    previewPDF,
  };
}
