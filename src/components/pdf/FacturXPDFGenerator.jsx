/**
 * Générateur de PDF avec support Factur-X intégré
 * Utilise jsPDF pour générer le PDF et pdf-lib pour embarquer le XML
 */

"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Download, LoaderCircle, FileCheck } from "lucide-react";
import { toast } from "@/src/components/ui/sonner";
import jsPDF from "jspdf";
import {
  generateFacturXML,
  validateInvoiceData,
} from "@/src/utils/facturx-generator";
import {
  embedFacturXInPDF,
  downloadFacturXPDF,
} from "@/src/utils/facturx-embedder";
import UniversalPreviewPDF from "./UniversalPreviewPDF";

const FacturXPDFGenerator = ({
  data,
  type = "invoice",
  filename,
  children,
  className = "",
  variant = "outline",
  size = "sm",
  disabled = false,
  enableFacturX = true,
  facturXProfile = "BASIC",
  ...props
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const previewRef = useRef();

  /**
   * Génère un PDF avec Factur-X à partir du HTML
   */
  const handleGenerateFacturXPDF = async (e) => {
    e?.preventDefault();
    setIsGenerating(true);

    try {
      // 1. Valider les données si Factur-X est activé
      if (enableFacturX && (type === "invoice" || type === "creditNote")) {
        const validation = validateInvoiceData(data);

        if (!validation.isValid) {
          toast.warning("Informations incomplètes pour Factur-X", {
            description: validation.errors.join(", "),
            duration: 5000,
          });
          // Continuer avec un PDF standard
        }
      }

      // 2. Capturer le HTML et le convertir en PDF
      const element = previewRef.current;
      if (!element) {
        throw new Error("Élément de prévisualisation non trouvé");
      }

      toast.info("Génération du PDF en cours...");

      // Utiliser html2canvas pour capturer le rendu
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      // Créer le PDF avec jsPDF
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Ajouter l'image au PDF
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Ajouter des pages supplémentaires si nécessaire
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // 3. Obtenir les bytes du PDF
      const pdfBytes = pdf.output("arraybuffer");

      // 4. Si Factur-X est activé, embarquer le XML
      if (enableFacturX && (type === "invoice" || type === "creditNote")) {
        const validation = validateInvoiceData(data);

        if (validation.isValid) {
          toast.info("Embarquement du XML Factur-X...");

          // Générer le XML
          const facturXML = generateFacturXML(data, facturXProfile);

          // Embarquer le XML dans le PDF
          const facturXPdfBytes = await embedFacturXInPDF(
            new Uint8Array(pdfBytes),
            facturXML,
            facturXProfile
          );

          // Télécharger le PDF avec Factur-X
          const finalFilename =
            filename ||
            `${type}_${data?.documentNumber || "document"}_facturx.pdf`;
          downloadFacturXPDF(facturXPdfBytes, finalFilename);

          toast.success("PDF Factur-X généré avec succès", {
            description: `Profil: ${facturXProfile}`,
            duration: 3000,
          });
        } else {
          // Télécharger le PDF standard
          const blob = new Blob([pdfBytes], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download =
            filename || `${type}_${data?.documentNumber || "document"}.pdf`;
          link.click();
          URL.revokeObjectURL(url);

          toast.success("PDF généré (sans Factur-X)");
        }
      } else {
        // Télécharger le PDF standard
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download =
          filename || `${type}_${data?.documentNumber || "document"}.pdf`;
        link.click();
        URL.revokeObjectURL(url);

        toast.success("PDF généré avec succès");
      }
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      toast.error("Erreur lors de la génération du PDF", {
        description: error.message,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const isFacturXEnabled =
    enableFacturX && (type === "invoice" || type === "creditNote");

  return (
    <>
      {/* Composant caché pour le rendu */}
      <div
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          width: "210mm", // A4 width
          backgroundColor: "white",
        }}
      >
        <div ref={previewRef}>
          <UniversalPreviewPDF data={data} type={type} forPDF={true} />
        </div>
      </div>

      <Button
        onClick={handleGenerateFacturXPDF}
        disabled={isGenerating || disabled}
        variant={variant}
        size={size}
        className={`flex items-center gap-2 font-normal ${className || ""}`}
        {...props}
      >
        {isGenerating ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" />
            {children || "Génération..."}
          </>
        ) : (
          <>
            {isFacturXEnabled ? (
              <FileCheck className="h-4 w-4" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {children ||
              (isFacturXEnabled
                ? "Télécharger Factur-X"
                : "Télécharger le PDF")}
          </>
        )}
      </Button>
    </>
  );
};

export default FacturXPDFGenerator;
