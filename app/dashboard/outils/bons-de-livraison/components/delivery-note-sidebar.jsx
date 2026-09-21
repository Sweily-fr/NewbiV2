"use client";

import { useState, useEffect } from "react";
import {
  X,
  FileText,
  Eye,
  Pencil,
  CheckCircle,
  XCircle,
  FileCheck,
  Truck,
  PackageCheck,
  CalendarClock,
  RotateCcw,
  Mail,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import { useRouter } from "next/navigation";
import { useQuery } from "@apollo/client";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import {
  useChangeDeliveryNoteStatus,
  useDeliveryNote,
  useCreateInvoiceFromDeliveryNote,
  DELIVERY_NOTE_STATUS,
  DELIVERY_NOTE_DOCUMENT_URL,
  formatDeliveryNoteReference,
} from "@/src/graphql/deliveryNoteQueries";
import { getDraftEffectiveDates } from "@/src/utils/dateFormatter";
import { toast } from "@/src/components/ui/sonner";
import { useArchiveDocumentPdf } from "@/src/hooks/useArchiveDocumentPdf";
import dynamic from "next/dynamic";
import { PdfPageSkeleton, prefetchPdf } from "@/src/components/pdf/pdf-preview";
import { LinkedDocumentRow } from "@/src/components/documents/linked-document-row";
import { DeliveryNoteStatusBadge } from "../hooks/use-delivery-note-table";
import DeliveryNotePreview from "./DeliveryNotePreview";
import DeliveryNotePdfButton from "./delivery-note-pdf-button";
import DeliveryReceptionDialog from "./delivery-reception-dialog";

// Rendu canvas (pdfjs) du PDF archivé, chargé à l'ouverture seulement
const PdfPreview = dynamic(
  () =>
    import("@/src/components/pdf/pdf-preview").then((m) => ({
      default: m.PdfPreview,
    })),
  { ssr: false },
);

const formatDate = (dateString) => {
  if (!dateString) return "Non définie";
  let date;
  if (typeof dateString === "string" && /^\d+$/.test(dateString)) {
    date = new Date(parseInt(dateString, 10));
  } else {
    date = new Date(dateString);
  }
  if (isNaN(date.getTime())) return "Date invalide";
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatQty = (value) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(
    parseFloat(value) || 0,
  );

export default function DeliveryNoteSidebar({
  isOpen,
  onClose,
  deliveryNote: initialDeliveryNote,
  onRefetch,
  onSendEmail,
}) {
  const router = useRouter();
  const { changeStatus, loading: changingStatus } =
    useChangeDeliveryNoteStatus();
  const { createInvoice, loading: creatingInvoice } =
    useCreateInvoiceFromDeliveryNote();
  const { archiveDocument } = useArchiveDocumentPdf("deliveryNote");
  const { workspaceId } = useRequiredWorkspace();
  const [showReception, setShowReception] = useState(false);

  // URL du PDF archivé (R2) — hors brouillon uniquement
  const { data: docData } = useQuery(DELIVERY_NOTE_DOCUMENT_URL, {
    variables: { workspaceId, deliveryNoteId: initialDeliveryNote?.id },
    skip:
      !workspaceId ||
      !initialDeliveryNote?.id ||
      initialDeliveryNote?.status === DELIVERY_NOTE_STATUS.DRAFT,
    fetchPolicy: "cache-and-network",
  });
  const documentUrl = docData?.deliveryNoteDocumentUrl || null;

  useEffect(() => {
    if (
      isOpen &&
      initialDeliveryNote?.id &&
      initialDeliveryNote?.status !== DELIVERY_NOTE_STATUS.DRAFT
    ) {
      prefetchPdf(`/api/document-preview/deliveryNote/${initialDeliveryNote.id}`);
    }
  }, [isOpen, initialDeliveryNote?.id, initialDeliveryNote?.status]);

  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { deliveryNote: fullDeliveryNote, loading: loadingFull } =
    useDeliveryNote(initialDeliveryNote?.id);

  if (!initialDeliveryNote) return null;

  const deliveryNote = fullDeliveryNote || initialDeliveryNote;

  const handleEdit = () => {
    router.push(`/dashboard/outils/bons-de-livraison/${deliveryNote.id}/editer`);
    onClose();
  };

  const changeTo = async (status, successMessage) => {
    try {
      const updated = await changeStatus(deliveryNote.id, status);
      toast.success(successMessage);
      onRefetch?.();
      // Émission : archiver le PDF (non bloquant, comme les BC)
      if (status === DELIVERY_NOTE_STATUS.PENDING && updated) {
        archiveDocument(updated);
      }
    } catch (error) {
      toast.error(error?.message || "Erreur lors du changement de statut");
    }
  };

  const handleInvoice = async () => {
    try {
      const invoice = await createInvoice(deliveryNote.id);
      if (!invoice?.id) throw new Error("Facture non créée");
      toast.success("Facture brouillon créée à partir du bon de livraison");
      onClose();
      router.push(`/dashboard/outils/factures/${invoice.id}/editer`);
    } catch (error) {
      toast.error(error?.message || "Erreur lors de la création de la facture");
    }
  };

  const isLoading = changingStatus || creatingInvoice;

  const isDraft = deliveryNote.status === DELIVERY_NOTE_STATUS.DRAFT;
  const isPending = deliveryNote.status === DELIVERY_NOTE_STATUS.PENDING;
  const isShipped = deliveryNote.status === DELIVERY_NOTE_STATUS.SHIPPED;
  const isDelivered = deliveryNote.status === DELIVERY_NOTE_STATUS.DELIVERED;
  const hasLinkedInvoices =
    !!deliveryNote.linkedInvoices && deliveryNote.linkedInvoices.length > 0;
  const canInvoice =
    (isPending || isShipped || isDelivered) &&
    !hasLinkedInvoices &&
    !deliveryNote.sourceInvoice;
  const canCancel = (isPending || isShipped) && !hasLinkedInvoices;

  const deliveryAddress =
    deliveryNote.deliveryAddress?.street || deliveryNote.deliveryAddress?.city
      ? deliveryNote.deliveryAddress
      : deliveryNote.client?.hasDifferentShippingAddress
        ? deliveryNote.client?.shippingAddress
        : null;

  const draftDates = isDraft
    ? getDraftEffectiveDates(deliveryNote.issueDate, deliveryNote.deliveryDate)
    : null;
  const refreshed = draftDates?.changed;

  return (
    <>
      {/* Overlay léger sur toute la page */}
      <motion.div
        className="fixed inset-0 z-40 bg-black/30"
        data-app-overlay=""
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.1, ease: "easeOut" } }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        onClick={onClose}
      />

      {/* Fond sombre sur la zone d'aperçu */}
      <motion.div
        className="fixed inset-y-0 left-0 md:right-[40%] right-0 z-40 bg-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.1, ease: "easeOut" } }}
        transition={{ duration: 0.2, delay: 0.2, ease: "easeOut" }}
      />

      {/* Aperçu du document */}
      <motion.div
        className="fixed inset-y-0 left-0 md:right-[40%] right-0 z-50 pointer-events-none"
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{
          x: "-100%",
          transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] },
        }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      >
        <div className="absolute inset-0 p-0 flex items-start justify-center overflow-y-auto py-4 md:py-12 px-2 md:px-24">
          {loadingFull && !fullDeliveryNote ? (
            <div className="w-[210mm] max-w-full min-h-[calc(100%-4rem)] bg-white pointer-events-auto">
              <PdfPageSkeleton />
            </div>
          ) : (
            <div className="w-[210mm] max-w-full min-h-[calc(100%-4rem)] bg-white pointer-events-auto">
              {documentUrl && !isDraft ? (
                <PdfPreview
                  src={`/api/document-preview/deliveryNote/${deliveryNote.id}`}
                  placeholder={<PdfPageSkeleton />}
                  fallback={
                    <DeliveryNotePreview data={deliveryNote} recalcDraftDates />
                  }
                />
              ) : (
                <DeliveryNotePreview data={deliveryNote} recalcDraftDates />
              )}
            </div>
          )}
        </div>

        <Button
          onClick={() => setShowMobileDetails(true)}
          className="md:hidden fixed bottom-6 right-6 z-[60] rounded-full h-14 w-14 shadow-lg pointer-events-auto"
          size="icon"
        >
          <Eye className="h-5 w-5" />
        </Button>
      </motion.div>

      {/* Panneau de détails */}
      <motion.div
        className="fixed inset-y-0 right-0 z-50 md:w-[40%] w-full bg-background border-l shadow-lg flex flex-col"
        initial={{ x: "100%" }}
        animate={{ x: isMobile && !showMobileDetails ? "100%" : 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      >
        {/* En-tête */}
        <div className="flex items-start justify-between gap-2 px-6 py-4 border-b">
          <div className="flex flex-col items-start gap-1 min-w-0 flex-1">
            <h2 className="text-base font-medium">
              Bon de livraison {formatDeliveryNoteReference(deliveryNote)}
            </h2>
            <div className="flex items-center gap-1.5 flex-wrap">
              <DeliveryNoteStatusBadge status={deliveryNote.status} />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isDraft && (
              <DeliveryNotePdfButton
                deliveryNote={deliveryNote}
                variant="primary"
                className="gap-1.5 font-medium"
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                if (window.innerWidth < 768 && showMobileDetails) {
                  setShowMobileDetails(false);
                } else {
                  setShowMobileDetails(false);
                  onClose();
                }
              }}
              className="h-8 w-8 bg-[rgba(0,0,0,0.04)] hover:bg-[rgba(0,0,0,0.08)] dark:bg-[rgba(255,255,255,0.06)] dark:hover:bg-[rgba(255,255,255,0.1)]"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Client */}
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
              Client
            </p>
            {deliveryNote.client ? (
              <div className="space-y-2">
                <div>
                  <p className="font-medium">{deliveryNote.client.name}</p>
                  {deliveryNote.client.email && (
                    <p className="text-sm text-muted-foreground">
                      {deliveryNote.client.email}
                    </p>
                  )}
                </div>
                {deliveryNote.client.address && (
                  <div className="text-sm text-muted-foreground">
                    {deliveryNote.client.address.street && (
                      <p>{deliveryNote.client.address.street}</p>
                    )}
                    {(deliveryNote.client.address.postalCode ||
                      deliveryNote.client.address.city) && (
                      <p>
                        {deliveryNote.client.address.postalCode}{" "}
                        {deliveryNote.client.address.city}
                      </p>
                    )}
                    {deliveryNote.client.address.country && (
                      <p>{deliveryNote.client.address.country}</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun client sélectionné
              </p>
            )}
          </div>

          <Separator />

          {/* Adresse de livraison */}
          {deliveryAddress && (
            <>
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                  Adresse de livraison
                </p>
                <div className="text-sm text-muted-foreground">
                  {deliveryAddress.fullName && (
                    <p className="font-medium text-foreground">
                      {deliveryAddress.fullName}
                    </p>
                  )}
                  {deliveryAddress.street && <p>{deliveryAddress.street}</p>}
                  {(deliveryAddress.postalCode || deliveryAddress.city) && (
                    <p>
                      {deliveryAddress.postalCode} {deliveryAddress.city}
                    </p>
                  )}
                  {deliveryAddress.country && <p>{deliveryAddress.country}</p>}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Dates & transport */}
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
              Livraison
            </p>
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <span className="text-sm font-normal text-muted-foreground">
                  Date d'émission
                </span>
                <span className="flex flex-col items-end text-sm font-normal">
                  <span>
                    {formatDate(
                      refreshed
                        ? draftDates.issue.effective
                        : deliveryNote.issueDate,
                    )}
                  </span>
                  {refreshed && draftDates.issue.original && (
                    <span className="text-xs text-muted-foreground">
                      (ancienne&nbsp;: {formatDate(draftDates.issue.original)})
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-normal text-muted-foreground flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Date de livraison
                </span>
                <span className="text-sm font-normal">
                  {formatDate(
                    refreshed
                      ? draftDates.second.effective
                      : deliveryNote.deliveryDate,
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-normal text-muted-foreground flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5" />
                  Transporteur
                </span>
                <span className="text-sm font-normal">
                  {deliveryNote.carrier || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-normal text-muted-foreground">
                  N° de suivi
                </span>
                <span className="text-sm font-mono">
                  {deliveryNote.trackingNumber || "—"}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Articles : quantités seulement */}
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
              Articles
            </p>
            <div className="space-y-2">
              {deliveryNote.items && deliveryNote.items.length > 0 ? (
                deliveryNote.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-normal truncate">
                        {item.description || "Article sans description"}
                      </p>
                      {item.reference && (
                        <p className="text-xs text-muted-foreground">
                          Réf. {item.reference}
                        </p>
                      )}
                    </div>
                    <span className="text-sm whitespace-nowrap">
                      {formatQty(
                        item.deliveredQuantity != null
                          ? item.deliveredQuantity
                          : item.quantity,
                      )}{" "}
                      {item.unit || ""}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Aucun article</p>
              )}
            </div>
          </div>

          {/* Réception */}
          {(deliveryNote.receivedBy ||
            deliveryNote.receivedAt ||
            deliveryNote.signatureDataUrl) && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                  Réception
                </p>
                <div className="space-y-2">
                  {deliveryNote.receivedBy && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-normal text-muted-foreground">
                        Réceptionné par
                      </span>
                      <span className="text-sm font-normal">
                        {deliveryNote.receivedBy}
                      </span>
                    </div>
                  )}
                  {deliveryNote.receivedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-normal text-muted-foreground">
                        Date de réception
                      </span>
                      <span className="text-sm font-normal">
                        {formatDate(deliveryNote.receivedAt)}
                      </span>
                    </div>
                  )}
                  {deliveryNote.signatureDataUrl && (
                    <div className="rounded-md border bg-white p-2 flex justify-center">
                      <img
                        src={deliveryNote.signatureDataUrl}
                        alt="Signature du client"
                        className="max-h-20"
                      />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Documents liés */}
          {deliveryNote.sourceQuote && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                  Devis lié
                </p>
                <LinkedDocumentRow
                  type="quote"
                  document={deliveryNote.sourceQuote}
                  onClick={() => {
                    router.push(
                      `/dashboard/outils/devis?id=${deliveryNote.sourceQuote.id}`,
                    );
                    onClose();
                  }}
                />
              </div>
            </>
          )}

          {deliveryNote.sourceInvoice && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                  Facture d'origine
                </p>
                <LinkedDocumentRow
                  type="invoice"
                  document={deliveryNote.sourceInvoice}
                  onClick={() => {
                    router.push(
                      `/dashboard/outils/factures?id=${deliveryNote.sourceInvoice.id}`,
                    );
                    onClose();
                  }}
                />
              </div>
            </>
          )}

          {hasLinkedInvoices && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                  Factures générées
                </p>
                <div className="space-y-1">
                  {deliveryNote.linkedInvoices.map((invoice) => (
                    <LinkedDocumentRow
                      key={invoice.id}
                      type="invoice"
                      document={invoice}
                      onClick={() => {
                        router.push(
                          `/dashboard/outils/factures?id=${invoice.id}`,
                        );
                        onClose();
                      }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="border-t px-6 py-4 space-y-3">
          {isDraft && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleEdit}
                disabled={isLoading}
                className="flex-1 font-normal"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Éditer
              </Button>
              <Button
                onClick={() =>
                  changeTo(
                    DELIVERY_NOTE_STATUS.PENDING,
                    "Bon de livraison émis, à expédier",
                  )
                }
                disabled={isLoading}
                className="flex-1 font-normal"
              >
                <FileText className="h-4 w-4 mr-2" />
                Émettre le bon de livraison
              </Button>
            </div>
          )}

          {isPending && (
            <>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    changeTo(
                      DELIVERY_NOTE_STATUS.DRAFT,
                      "Bon de livraison repassé en brouillon",
                    )
                  }
                  disabled={isLoading}
                  className="flex-1 font-normal"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Repasser brouillon
                </Button>
                <Button
                  variant="primary"
                  onClick={() =>
                    changeTo(
                      DELIVERY_NOTE_STATUS.SHIPPED,
                      "Bon de livraison marqué comme expédié",
                    )
                  }
                  disabled={isLoading}
                  className="flex-1 font-normal"
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Marquer expédié
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowReception(true)}
                disabled={isLoading}
                className="w-full font-normal"
              >
                <PackageCheck className="h-4 w-4 mr-2" />
                Marquer comme livré
              </Button>
            </>
          )}

          {isShipped && (
            <Button
              variant="primary"
              onClick={() => setShowReception(true)}
              disabled={isLoading}
              className="w-full font-normal"
            >
              <PackageCheck className="h-4 w-4 mr-2" />
              Marquer comme livré
            </Button>
          )}

          {(isPending || isShipped || isDelivered) && (
            <div className="flex gap-2">
              {onSendEmail && (
                <Button
                  variant="outline"
                  onClick={() => onSendEmail(deliveryNote)}
                  disabled={isLoading}
                  className="flex-1 font-normal"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Envoyer
                </Button>
              )}
              {canInvoice && (
                <Button
                  variant="outline"
                  onClick={handleInvoice}
                  disabled={isLoading}
                  className="flex-1 font-normal"
                >
                  <FileCheck className="h-4 w-4 mr-2" />
                  Facturer
                </Button>
              )}
            </div>
          )}

          {canCancel && (
            <Button
              variant="outline"
              onClick={() =>
                changeTo(DELIVERY_NOTE_STATUS.CANCELED, "Bon de livraison annulé")
              }
              disabled={isLoading}
              className="w-full font-normal"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Annuler le bon de livraison
            </Button>
          )}

          {isDelivered && !canInvoice && hasLinkedInvoices && (
            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" />
              Livré et facturé
            </p>
          )}
        </div>
      </motion.div>

      <DeliveryReceptionDialog
        open={showReception}
        onOpenChange={setShowReception}
        deliveryNote={deliveryNote}
        onDelivered={() => onRefetch?.()}
      />
    </>
  );
}
