"use client";

import { useState, useRef, useEffect } from "react";
import { Signature, LoaderCircle, Plus, X, CornerDownLeft } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { useRequestSignature } from "@/src/hooks/useESignature";
import { toast } from "@/src/components/ui/sonner";
import { domToJpeg } from "modern-screenshot";
import jsPDF from "jspdf";
import UniversalPreviewPDF from "@/src/components/pdf/UniversalPreviewPDF";

const DOCUMENT_TYPE_LABELS = {
  invoice: "facture",
  quote: "devis",
  credit_note: "avoir",
};

/**
 * Génère un PDF en base64 à partir d'un ref DOM
 */
async function generatePdfBase64FromRef(componentRef) {
  if (!componentRef.current) {
    throw new Error("Référence du composant non trouvée");
  }

  const images = componentRef.current.querySelectorAll("img");
  await Promise.all(
    Array.from(images).map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
        setTimeout(resolve, 3000);
      });
    }),
  );

  await new Promise((resolve) => setTimeout(resolve, 500));

  const dataUrl = await domToJpeg(componentRef.current, {
    quality: 0.95,
    backgroundColor: "#ffffff",
    width: 794,
    scale: 2,
    fetch: {
      requestInit: { mode: "cors", credentials: "omit" },
    },
  });

  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = dataUrl;
  });

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pdfWidth = 210;
  const pdfHeight = 297;
  const imgWidthMM = pdfWidth;
  const imgHeightMM = (img.height * pdfWidth) / img.width;

  if (imgHeightMM > pdfHeight) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const canvasWidth = img.width;
    const pixelsPerMM = img.width / pdfWidth;
    const pageHeightPixels = pdfHeight * pixelsPerMM;

    canvas.width = canvasWidth;
    canvas.height = pageHeightPixels;

    let currentY = 0;
    let pageNumber = 0;

    while (currentY < img.height) {
      const sliceHeight = Math.min(pageHeightPixels, img.height - currentY);

      canvas.height = sliceHeight;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        img,
        0,
        currentY,
        canvasWidth,
        sliceHeight,
        0,
        0,
        canvasWidth,
        sliceHeight,
      );

      const pageData = canvas.toDataURL("image/jpeg", 0.95);
      const pageHeightMM = sliceHeight / pixelsPerMM;

      if (pageNumber > 0) pdf.addPage();
      pdf.addImage(
        pageData,
        "JPEG",
        0,
        0,
        pdfWidth,
        pageHeightMM,
        undefined,
        "FAST",
      );

      currentY += sliceHeight;
      pageNumber++;
    }
  } else {
    pdf.addImage(
      dataUrl,
      "JPEG",
      0,
      0,
      imgWidthMM,
      imgHeightMM,
      undefined,
      "FAST",
    );
  }

  const pdfArrayBuffer = pdf.output("arraybuffer");
  const bytes = new Uint8Array(pdfArrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function SignatureDialog({
  open,
  onOpenChange,
  document,
  documentType,
  client,
  onSuccess,
  signatureLevel = "ses", // "ses" | "qes"
}) {
  const { requestSignature, loading } = useRequestSignature();
  const pdfRef = useRef(null);
  const firstInputRef = useRef(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [signatureType, setSignatureType] = useState("SES");

  const [signers, setSigners] = useState([]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      if (client) {
        const names = (client.name || "").split(" ");
        setSigners([
          {
            name: names[0] || "",
            surname: names.slice(1).join(" ") || "",
            email: client.email || "",
            mobile: client.phone || "",
          },
        ]);
      } else {
        setSigners([{ name: "", surname: "", email: "", mobile: "" }]);
      }
      setGeneratingPdf(false);
      setSignatureType("SES");
    }
  }, [open, client]);

  // Focus first input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [open]);

  const addSigner = () => {
    setSigners([...signers, { name: "", surname: "", email: "", mobile: "" }]);
  };

  const removeSigner = (index) => {
    if (signers.length <= 1) return;
    setSigners(signers.filter((_, i) => i !== index));
  };

  const updateSigner = (index, field, value) => {
    const updated = [...signers];
    updated[index] = { ...updated[index], [field]: value };
    setSigners(updated);
  };

  const isValid = signers.every(
    (s) => s.name.trim() && s.surname.trim() && s.email.trim(),
  );

  const isBusy = loading || generatingPdf;

  const handleSubmit = async () => {
    if (!isValid) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      setGeneratingPdf(true);
      let documentBase64;

      try {
        documentBase64 = await generatePdfBase64FromRef(pdfRef);
      } catch (err) {
        toast.error("Erreur lors de la génération du PDF", {
          description: err.message,
        });
        return;
      } finally {
        setGeneratingPdf(false);
      }

      if (!documentBase64) {
        toast.error("Impossible de générer le PDF du document");
        return;
      }

      const formattedSigners = signers.map((s) => ({
        name: s.name.trim(),
        surname: s.surname.trim(),
        email: s.email.trim(),
        mobile: s.mobile?.trim() || null,
        authentication: s.mobile?.trim() ? ["email", "sms"] : ["email"],
      }));

      const result = await requestSignature({
        documentType,
        documentId: document._id || document.id,
        signatureType,
        signers: formattedSigners,
        title: `Signature ${DOCUMENT_TYPE_LABELS[documentType] || "document"} ${document.number || ""}`,
        documentBase64,
      });

      if (result.success) {
        onOpenChange(false);
        onSuccess?.(result.signatureRequest);
      }
    } catch (err) {
      toast.error("Erreur", {
        description: err.message || "Une erreur est survenue",
      });
    }
  };

  const documentLabel = DOCUMENT_TYPE_LABELS[documentType] || "document";
  const pdfType = documentType === "credit_note" ? "creditNote" : documentType;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* PDF hors écran pour capture */}
      <div
        style={{
          position: "fixed",
          left: "-9999px",
          top: "0",
          width: "794px",
          backgroundColor: "#ffffff",
          zIndex: -1,
        }}
      >
        <div ref={pdfRef} style={{ position: "relative", width: "100%" }}>
          <UniversalPreviewPDF
            data={document}
            type={pdfType}
            isMobile={false}
            forPDF={true}
          />
        </div>
      </div>

      <DialogContent className="sm:max-w-[540px] p-1 gap-0 top-[40%] border-0 bg-[#efefef] dark:bg-[#1a1a1a] overflow-hidden rounded-2xl">
        <div className="bg-background rounded-xl overflow-hidden ring-1 ring-black/[0.07] dark:ring-white/[0.1]">
          <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/40">
            <DialogTitle className="text-sm font-medium flex items-center gap-2">
              <Signature className="size-4" />
              Faire signer
              {document?.number && (
                <span className="text-muted-foreground font-normal">
                  &middot; {document.number}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="px-5 pt-3 pb-0">
            {/* Description */}
            <p className="text-xs text-muted-foreground mb-4">
              {documentLabel === "devis" ? "Le" : "La"} {documentLabel} sera
              envoyé{documentLabel === "facture" ? "e" : ""} par email avec un
              lien sécurisé pour signature.
            </p>

            {/* Type de signature - visible uniquement pour le plan Entreprise (QES) */}
            {signatureLevel === "qes" && (
              <div className="mb-4">
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Type de signature
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSignatureType("SES")}
                    className={`flex-1 text-xs px-3 py-2 rounded-lg border transition-colors ${
                      signatureType === "SES"
                        ? "border-primary bg-primary/5 text-foreground font-medium"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <span className="block font-medium">SES</span>
                    <span className="block text-[10px] mt-0.5 opacity-70">
                      Signature simple
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignatureType("QES_automatic")}
                    className={`flex-1 text-xs px-3 py-2 rounded-lg border transition-colors ${
                      signatureType === "QES_automatic"
                        ? "border-primary bg-primary/5 text-foreground font-medium"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <span className="block font-medium">QES</span>
                    <span className="block text-[10px] mt-0.5 opacity-70">
                      Signature qualifiée
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Signataires */}
            <div className="space-y-3">
              {signers.map((signer, index) => (
                <div key={index} className="space-y-2">
                  {/* Header signataire (seulement si multiple) */}
                  {signers.length > 1 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Signataire {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSigner(index)}
                        className="rounded-sm hover:bg-muted-foreground/20 p-0.5"
                      >
                        <X className="size-3 text-muted-foreground" />
                      </button>
                    </div>
                  )}

                  {/* Champs */}
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      ref={index === 0 ? firstInputRef : undefined}
                      value={signer.name}
                      onChange={(e) =>
                        updateSigner(index, "name", e.target.value)
                      }
                      placeholder="Prénom *"
                      className="h-9 text-sm"
                    />
                    <Input
                      value={signer.surname}
                      onChange={(e) =>
                        updateSigner(index, "surname", e.target.value)
                      }
                      placeholder="Nom *"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="email"
                      value={signer.email}
                      onChange={(e) =>
                        updateSigner(index, "email", e.target.value)
                      }
                      placeholder="Email *"
                      className="h-9 text-sm"
                    />
                    <Input
                      type="tel"
                      value={signer.mobile}
                      onChange={(e) =>
                        updateSigner(index, "mobile", e.target.value)
                      }
                      placeholder="Téléphone"
                      className="h-9 text-sm"
                    />
                  </div>

                  {/* Séparateur entre signataires */}
                  {signers.length > 1 && index < signers.length - 1 && (
                    <div className="border-b border-border/30 mt-1" />
                  )}
                </div>
              ))}

              {/* Ajouter signataire */}
              <button
                type="button"
                onClick={addSigner}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                <Plus className="size-3" />
                Ajouter un signataire
              </button>
            </div>

            {/* Footer avec bouton */}
            <div className="flex justify-end border-t border-border/40 mt-4 px-5 py-3 -mx-5">
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={!isValid || isBusy}
                className="gap-2"
              >
                {isBusy ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    {generatingPdf ? "Préparation..." : "Envoi..."}
                  </>
                ) : (
                  <>
                    Envoyer pour signature
                    <kbd className="inline-flex items-center justify-center size-5 rounded bg-white/20 ml-0.5">
                      <CornerDownLeft className="size-3" />
                    </kbd>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
