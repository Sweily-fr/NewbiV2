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
import { useQuery } from "@apollo/client";
import { GET_QUOTE } from "@/src/graphql/quoteQueries";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";

const DOCUMENT_TYPE_LABELS = {
  invoice: "facture",
  quote: "devis",
  credit_note: "avoir",
};

/**
 * Normalise un numéro de mobile au format international E.164 (ex: +33612345678),
 * requis par l'API eSignature OpenAPI (sinon erreur 825 "invalid signer 'mobile'").
 * Accepte les formats français locaux (06.../07...) et internationaux (+33.../0033...).
 * Retourne null si le numéro est vide ou inexploitable (-> authentification email seule).
 */
function normalizeMobile(raw) {
  if (!raw) return null;

  // Retirer espaces, points, tirets, parenthèses
  let cleaned = raw.trim().replace(/[\s.()/-]/g, "");
  if (!cleaned) return null;

  // Préfixe international "00" -> "+"
  if (cleaned.startsWith("00")) {
    cleaned = "+" + cleaned.slice(2);
  }

  // Déjà au format international (+33...)
  if (cleaned.startsWith("+")) {
    const digits = cleaned.slice(1).replace(/\D/g, "");
    return digits.length >= 8 ? "+" + digits : null;
  }

  const digits = cleaned.replace(/\D/g, "");

  // Numéro français local "0X XX XX XX XX" (10 chiffres) -> +33X...
  if (digits.length === 10 && digits.startsWith("0")) {
    return "+33" + digits.slice(1);
  }

  // 9 chiffres sans le 0 initial (ex: 612345678) -> +33...
  if (digits.length === 9) {
    return "+33" + digits;
  }

  return null;
}

// Dimensions d'une page A4 en points PDF (unité utilisée par l'API eSignature)
const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;
// Hauteur réservée au tampon de signature apposé par le prestataire : la boîte
// a une taille fixe non paramétrable (l'API n'accepte que page/x/y), on garde
// donc assez de place pour qu'elle tienne entièrement au-dessus du footer.
const SIGNATURE_RESERVED_PT = 90;

/**
 * Calcule où placer la zone de signature : juste au-dessus du bandeau de pied
 * de page ([data-pdf-section="footer"]), sur la partie blanche du document.
 * Coordonnées en points PDF, origine en HAUT à gauche (convention OpenAPI
 * eSignature). Retourne null si le footer est introuvable — le backend
 * applique alors son placement par défaut.
 */
function computeSignaturePlacement(componentRef) {
  const container = componentRef.current;
  const footer = container?.querySelector('[data-pdf-section="footer"]');
  if (!container || !footer) return null;

  const containerRect = container.getBoundingClientRect();
  const footerRect = footer.getBoundingClientRect();
  if (!containerRect.width) return null;

  // Même découpage que generatePdfBase64FromRef : l'image est tranchée en
  // pages A4 pleines, chaque tranche dessinée à partir du haut de sa page.
  const pageHeightPx = containerRect.width * (A4_HEIGHT_PT / A4_WIDTH_PT);
  const footerTopPx = footerRect.top - containerRect.top;
  const pageIndex = Math.floor(footerTopPx / pageHeightPx);
  const ptPerPx = A4_WIDTH_PT / containerRect.width;
  const footerTopPt = (footerTopPx - pageIndex * pageHeightPx) * ptPerPx;

  const y = Math.max(40, Math.round(footerTopPt - SIGNATURE_RESERVED_PT));
  return [{ page: pageIndex + 1, x: 400, y }];
}

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

      // Le conteneur de capture (min-height 1123px) dépasse d'une fraction de
      // pixel la hauteur A4 exacte (1122,93px à 794px de large) : sans garde,
      // ce résidu génère une page blanche supplémentaire que le signataire
      // doit faire défiler (signerMustRead). On ignore toute tranche finale
      // inférieure à ~10px de contenu réel (20px à scale 2).
      if (pageNumber > 0 && sliceHeight < 20) break;

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
}) {
  const { requestSignature, loading } = useRequestSignature();
  const { workspaceId } = useRequiredWorkspace();

  // Le devis passé en prop vient de la liste (fragment partiel) : il lui manque
  // companyInfo, footerNotes, termsAndConditions. On récupère le devis COMPLET
  // pour générer un PDF de signature identique au PDF officiel.
  const documentId = document?._id || document?.id;
  const { data: fullQuoteData, loading: loadingFullQuote } = useQuery(
    GET_QUOTE,
    {
      variables: { workspaceId, id: documentId },
      skip: !open || documentType !== "quote" || !documentId || !workspaceId,
      fetchPolicy: "cache-first",
    },
  );
  const documentToRender =
    documentType === "quote" && fullQuoteData?.quote
      ? fullQuoteData.quote
      : document;

  const pdfRef = useRef(null);
  const firstInputRef = useRef(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

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

  const isBusy = loading || generatingPdf || loadingFullQuote;

  const handleSubmit = async () => {
    if (!isValid) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (loadingFullQuote) {
      toast.error("Chargement du devis en cours, réessayez dans un instant.");
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

      const formattedSigners = signers.map((s) => {
        const mobile = normalizeMobile(s.mobile);
        return {
          name: s.name.trim(),
          surname: s.surname.trim(),
          email: s.email.trim(),
          mobile,
          authentication: mobile ? ["email", "sms"] : ["email"],
        };
      });

      // Zone de signature juste au-dessus du pied de page, mesurée sur le
      // document rendu (le footer varie selon les notes/mentions de l'orga)
      const signaturePlacement = computeSignaturePlacement(pdfRef);

      const result = await requestSignature({
        documentType,
        documentId: document._id || document.id,
        signatureType: "SES",
        signers: formattedSigners,
        title: `Signature ${DOCUMENT_TYPE_LABELS[documentType] || "document"} ${document.number || ""}`,
        documentBase64,
        ...(signaturePlacement && { signaturePlacement }),
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
            data={documentToRender}
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

            {/*
              Signature client = SES uniquement (signature électronique simple
              eIDAS : le client signe via un lien + OTP email/SMS). C'est valable
              juridiquement et suffisant pour faire accepter un devis.
              La QES (EU-QES_otp) n'est pas proposée : elle nécessite un certificat
              qualifié Namirial détenu par l'entreprise + un OTP généré par son app
              à chaque signature — ce n'est pas un parcours client en libre-service.
            */}

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
