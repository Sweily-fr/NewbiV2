"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "@/src/components/ui/sonner";
import UniversalPreviewPDF from "./UniversalPreviewPDF";

const UniversalPDFGenerator = ({
  data,
  type = "invoice", // 'invoice' ou 'quote'
  filename,
  children,
  className = "",
  variant = "outline",
  size = "sm",
  disabled = false,
  ...props
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const previewRef = useRef(null);

  const generatePDF = async () => {
    if (!data) {
      toast.error("Aucune donnée disponible pour générer le PDF");
      return;
    }

    setIsGenerating(true);

    try {
      // Import dynamique pour optimiser le bundle
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      // Configuration html2canvas optimisée
      const canvas = await html2canvas(previewRef.current, {
        scale: 2, // Haute résolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        removeContainer: true,
        imageTimeout: 15000,
        // Configuration pour éviter les erreurs oklch
        ignoreElements: (element) => {
          // Ignorer les éléments avec des styles problématiques
          const computedStyle = window.getComputedStyle(element);
          return computedStyle.display === "none";
        },
        onclone: (clonedDoc) => {
          // Nettoyer les styles oklch dans le document cloné
          const allElements = clonedDoc.querySelectorAll("*");
          allElements.forEach((el) => {
            const style = el.style;
            // Remplacer les couleurs oklch par des équivalents
            if (style.color && style.color.includes("oklch")) {
              style.color = "#000000";
            }
            if (
              style.backgroundColor &&
              style.backgroundColor.includes("oklch")
            ) {
              style.backgroundColor = "#ffffff";
            }
          });
        },
      });

      // Configuration PDF A4
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;

      // Calculer les dimensions pour s'adapter à la page
      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - margin * 2;

      const imgWidth = availableWidth;
      const imgHeight = (canvas.height * availableWidth) / canvas.width;

      // Gérer la pagination si nécessaire
      let yPosition = margin;
      let remainingHeight = imgHeight;

      while (remainingHeight > 0) {
        const currentPageHeight = Math.min(remainingHeight, availableHeight);

        pdf.addImage(
          canvas.toDataURL("image/png"),
          "PNG",
          margin,
          yPosition,
          imgWidth,
          currentPageHeight,
          undefined,
          "FAST"
        );

        remainingHeight -= currentPageHeight;

        if (remainingHeight > 0) {
          pdf.addPage();
          yPosition = margin;
        }
      }

      // Générer le nom de fichier
      const defaultFilename =
        type === "invoice"
          ? `facture_${data.number || "DRAFT"}_${new Date().toISOString().split("T")[0]}.pdf`
          : `devis_${data.number || "DRAFT"}_${new Date().toISOString().split("T")[0]}.pdf`;

      const finalFilename = filename || defaultFilename;

      // Télécharger le PDF
      pdf.save(finalFilename);

      toast.success(
        `${type === "invoice" ? "Facture" : "Devis"} téléchargé avec succès`
      );
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* Composant de preview caché pour la capture */}
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
        <div ref={previewRef}>
          <UniversalPreviewPDF data={data} type={type} />
        </div>
      </div>

      {/* Bouton ou wrapper personnalisé */}
      {children ? (
        <div onClick={generatePDF} className={className} {...props}>
          {children}
        </div>
      ) : (
        <Button
          onClick={generatePDF}
          disabled={disabled || isGenerating}
          variant={variant}
          size={size}
          className={className}
          {...props}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Génération...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              PDF
            </>
          )}
        </Button>
      )}
    </>
  );
};

export default UniversalPDFGenerator;
