"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Download, LoaderCircle } from "lucide-react";
import { toast } from "@/src/components/ui/sonner";
import { useReactToPrint } from "react-to-print";
import UniversalPreviewPDF from "./UniversalPreviewPDF";

const UniversalPDFGenerator = ({
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
  const componentRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `${type}_${data?.documentNumber || "document"}`,
    onBeforeGetContent: () => {
      setIsGenerating(true);
      return new Promise((resolve) => setTimeout(resolve, 500));
    },
    onAfterPrint: () => setIsGenerating(false),
    onPrintError: (error) => {
      console.error("Erreur lors de l'impression :", error);
      toast.error("Une erreur est survenue lors de la génération du PDF");
      setIsGenerating(false);
    },
  });

  const handleDownloadPDF = (e) => {
    e?.preventDefault();
    handlePrint();
  };

  return (
    <>
      {/* Composant caché utilisé pour la génération du PDF */}
      <div style={{ display: "none" }}>
        <div ref={componentRef}>
          <UniversalPreviewPDF data={data} type={type} />
        </div>
      </div>

      <Button
        onClick={handleDownloadPDF}
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
            <Download className="h-4 w-4" />
            {children || "Télécharger le PDF"}
          </>
        )}
      </Button>
    </>
  );
};

export default UniversalPDFGenerator;
