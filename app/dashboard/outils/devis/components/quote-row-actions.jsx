"use client";

import { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Eye,
  Pencil,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  FileText,
  XCircle,
  FileCheck,
  Mail,
  ShoppingCart,
  BookTemplate,
  PenLine,
  Ban,
} from "lucide-react";
import { ButtonGroup } from "@/src/components/ui/button-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/src/components/ui/dropdown-menu";
import {
  useChangeQuoteStatus,
  useDeleteQuote,
  QUOTE_STATUS,
  GET_QUOTE,
} from "@/src/graphql/quoteQueries";
import {
  GET_DOCUMENT_SIGNATURE_STATUS,
  CANCEL_SIGNATURE,
} from "@/src/graphql/esignatureQueries";
import { useApolloClient } from "@apollo/client";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import { getPlanLimits } from "@/src/lib/plan-limits";
import { toast } from "@/src/components/ui/sonner";
import QuoteMobileFullscreen from "./quote-mobile-fullscreen";
import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";

// Fonction utilitaire pour formater les dates
const formatDateForEmail = (dateValue) => {
  if (!dateValue) return null;

  try {
    let date;
    // Si c'est un timestamp en millisecondes (nombre ou string de chiffres)
    if (typeof dateValue === "number") {
      date = new Date(dateValue);
    } else if (typeof dateValue === "string") {
      // Si c'est un timestamp en string
      if (/^\d+$/.test(dateValue)) {
        date = new Date(parseInt(dateValue, 10));
      } else {
        // Sinon c'est une date ISO ou autre format string
        date = new Date(dateValue);
      }
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      return null;
    }

    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString("fr-FR");
  } catch {
    return null;
  }
};

export default function QuoteRowActions({
  row,
  onRefetch,
  onSendEmail,
  onSaveAsTemplate,
  onRequestSignature,
  onOpenSidebar,
}) {
  const [isMobileFullscreenOpen, setIsMobileFullscreenOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCancellingSignature, setIsCancellingSignature] = useState(false);
  const router = useRouter();
  const quote = row.original;

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  const apolloClient = useApolloClient();
  const { workspaceId } = useRequiredWorkspace();
  const { subscription } = useSubscription();
  const planLimits = getPlanLimits(subscription?.plan);
  const esignatureAccess = planLimits.esignature; // false | "ses" | "qes"
  const { isReadOnly, isOwner } = useSubscriptionAccess();
  const { changeStatus, loading: changingStatus } = useChangeQuoteStatus();
  const { deleteQuote, loading: isDeleting } = useDeleteQuote();
  const handleView = () => {
    if (isMobile) {
      setIsMobileFullscreenOpen(true);
    } else {
      if (onOpenSidebar) {
        onOpenSidebar(quote);
      }
    }
  };

  const handleEdit = () => {
    router.push(`/dashboard/outils/devis/${quote.id}/editer`);
  };

  const handleDelete = async () => {
    try {
      await deleteQuote(quote.id);
      toast.success("Devis supprimé avec succès");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error("Erreur lors de la suppression du devis");
    }
  };

  // Annuler une demande de signature en cours (récupère l'id à la volée)
  const handleCancelSignature = async () => {
    try {
      setIsCancellingSignature(true);

      const { data } = await apolloClient.query({
        query: GET_DOCUMENT_SIGNATURE_STATUS,
        variables: { documentType: "quote", documentId: quote.id },
        fetchPolicy: "network-only",
      });

      const signatureId = data?.getDocumentSignatureStatus?.id;
      if (!signatureId) {
        toast.error("Aucune demande de signature à annuler");
        return;
      }

      const { data: cancelData } = await apolloClient.mutate({
        mutation: CANCEL_SIGNATURE,
        variables: { signatureId },
      });

      if (cancelData?.cancelSignature?.success) {
        toast.success("Signature annulée", {
          description: "Vous pouvez relancer une demande de signature.",
        });
        if (onRefetch) onRefetch();
      } else {
        toast.error(
          cancelData?.cancelSignature?.message ||
            "Impossible d'annuler la signature",
        );
      }
    } catch (error) {
      toast.error("Erreur lors de l'annulation de la signature", {
        description: error.message,
      });
    } finally {
      setIsCancellingSignature(false);
    }
  };

  const handleSendQuote = async () => {
    try {
      await changeStatus(quote.id, QUOTE_STATUS.PENDING);
      toast.success("Devis envoyé avec succès");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error("Erreur lors de l'envoi du devis");
    }
  };

  const handleAccept = async () => {
    try {
      await changeStatus(quote.id, QUOTE_STATUS.COMPLETED);
      toast.success("Devis accepté");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error(
        error?.message || "Erreur lors de l'acceptation du devis"
      );
    }
  };

  const handleReject = async () => {
    try {
      await changeStatus(quote.id, QUOTE_STATUS.CANCELED);
      toast.success("Devis rejeté");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error("Erreur lors du rejet du devis");
    }
  };

  const fetchFullQuote = async () => {
    if (!workspaceId) return null;
    try {
      const { data } = await apolloClient.query({
        query: GET_QUOTE,
        variables: { workspaceId, id: quote.id },
        fetchPolicy: "network-only",
      });
      return data?.quote || null;
    } catch (error) {
      console.error("[quote-row-actions] GET_QUOTE failed:", error);
      return null;
    }
  };

  const buildConversionPayload = (source) => ({
    sourceQuoteId: source.id,
    purchaseOrderNumber: `${source.prefix || ""}-${source.number || ""}`,
    client: source.client,
    items: source.items,
    discount: source.discount,
    discountType: source.discountType,
    customFields: source.customFields,
    shipping: source.shipping,
    isReverseCharge: source.isReverseCharge,
    retenueGarantie: source.retenueGarantie,
    escompte: source.escompte,
  });

  const handleConvertToInvoice = async () => {
    try {
      const fullQuote = (await fetchFullQuote()) || quote;
      sessionStorage.setItem(
        "quoteInvoiceData",
        JSON.stringify(buildConversionPayload(fullQuote)),
      );
      router.push("/dashboard/outils/factures/new");
    } catch (error) {
      console.error("[quote-row-actions] convert to invoice failed:", error);
      toast.error("Erreur lors de la conversion en facture");
    }
  };

  const handleConvertToPurchaseOrder = async () => {
    try {
      const fullQuote = (await fetchFullQuote()) || quote;
      sessionStorage.setItem(
        "quotePurchaseOrderData",
        JSON.stringify(buildConversionPayload(fullQuote)),
      );
      router.push("/dashboard/outils/bons-commande/new");
    } catch (error) {
      console.error(
        "[quote-row-actions] convert to purchase order failed:",
        error,
      );
      toast.error("Erreur lors de la conversion en bon de commande");
    }
  };

  const isLoading = changingStatus || isDeleting;

  // Logique pour déterminer quelles actions sont disponibles
  const canConvertToPO = quote.status === QUOTE_STATUS.COMPLETED;
  const canConvertToInvoice =
    quote.status === QUOTE_STATUS.COMPLETED &&
    (!quote.linkedInvoices || quote.linkedInvoices.length === 0) &&
    !quote.hasPurchaseOrderInvoices;
  const hasStatusActions =
    quote.status === QUOTE_STATUS.DRAFT || // Envoyer le devis
    quote.status === QUOTE_STATUS.PENDING || // Accepter/Rejeter
    quote.status === QUOTE_STATUS.IMPORTED || // Accepter/Rejeter (devis importé)
    canConvertToInvoice ||
    canConvertToPO;

  // Origine import : préfixe vide (conservé après acceptation/refus). Un devis
  // importé reste supprimable quel que soit son statut, comme l'indique le logo.
  const isImportedOrigin = !quote.prefix && Boolean(quote.number);
  const hasDeleteAction =
    quote.status === QUOTE_STATUS.DRAFT ||
    quote.status === QUOTE_STATUS.IMPORTED ||
    isImportedOrigin;

  return (
    <>
      <div className="flex items-center justify-end gap-1" data-actions-cell>
        {/* Bouton invisible pour déclencher l'ouverture via le clic sur la ligne */}
        <button
          data-view-quote
          onClick={handleView}
          className="hidden"
          aria-hidden="true"
        />
        <ButtonGroup>
          {/* Icône d'envoi par email - visible pour les devis non brouillon (hors importés) */}
          {quote.status !== QUOTE_STATUS.DRAFT &&
            quote.status !== QUOTE_STATUS.IMPORTED && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 p-0 cursor-pointer"
                      disabled={isReadOnly}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSendEmail?.(quote);
                      }}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Envoyer par email</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 p-0"
                disabled={isLoading}
              >
                <span className="sr-only">Ouvrir le menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleView}>
                <Eye className="mr-2 h-4 w-4" />
                Voir
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onSaveAsTemplate?.(quote);
                }}
                disabled={isReadOnly}
              >
                <BookTemplate className="mr-2 h-4 w-4" />
                Sauv. modèle
              </DropdownMenuItem>
              {(quote.status === QUOTE_STATUS.DRAFT ||
                quote.status === QUOTE_STATUS.PENDING) && (
                <DropdownMenuItem onClick={handleEdit} disabled={isReadOnly}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Éditer
                </DropdownMenuItem>
              )}

              {/* Séparateur entre les actions de base et les actions de statut */}
              {hasStatusActions && <DropdownMenuSeparator />}

              {quote.status === QUOTE_STATUS.DRAFT && (
                <DropdownMenuItem
                  onClick={handleSendQuote}
                  disabled={isLoading || isReadOnly}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Envoyer le devis
                </DropdownMenuItem>
              )}

              {/* Accepter : devis importés librement, devis natifs uniquement une fois signés */}
              {(quote.status === QUOTE_STATUS.IMPORTED ||
                (quote.status === QUOTE_STATUS.PENDING &&
                  quote.signatureStatus === "DONE")) && (
                <>
                  <DropdownMenuItem
                    onClick={handleAccept}
                    disabled={isLoading || isReadOnly}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Accepter le devis
                  </DropdownMenuItem>
                </>
              )}

              {canConvertToInvoice && (
                <DropdownMenuItem
                  onClick={handleConvertToInvoice}
                  disabled={isLoading || isReadOnly}
                >
                  <FileCheck className="mr-2 h-4 w-4" />
                  Convertir en facture
                </DropdownMenuItem>
              )}

              {canConvertToPO && (
                <DropdownMenuItem
                  onClick={handleConvertToPurchaseOrder}
                  disabled={isLoading || isReadOnly}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Convertir en bon de commande
                </DropdownMenuItem>
              )}

              {/* Faire signer - visible pour les devis non brouillon (hors importés) et sans signature en cours/terminée */}
              {quote.status !== QUOTE_STATUS.DRAFT &&
                quote.status !== QUOTE_STATUS.IMPORTED &&
                (!quote.signatureStatus ||
                  quote.signatureStatus === "ERROR" ||
                  quote.signatureStatus === "CANCELLED") && (
                  <>
                    {quote.status === QUOTE_STATUS.DRAFT && (
                      <DropdownMenuSeparator />
                    )}
                    {esignatureAccess ? (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onRequestSignature?.(quote);
                        }}
                        disabled={isReadOnly}
                      >
                        <PenLine className="mr-2 h-4 w-4" />
                        Faire signer
                      </DropdownMenuItem>
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DropdownMenuItem
                              disabled
                              onSelect={(e) => e.preventDefault()}
                            >
                              <PenLine className="mr-2 h-4 w-4" />
                              Faire signer
                            </DropdownMenuItem>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            <p>Disponible à partir du plan PME</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </>
                )}

              {/* Annuler la signature - visible quand une demande est en cours */}
              {[
                "PENDING",
                "WAIT_VALIDATION",
                "WAIT_SIGN",
                "WAIT_SIGNER",
              ].includes(quote.signatureStatus) && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancelSignature();
                  }}
                  disabled={isCancellingSignature || isReadOnly}
                  className="text-red-600 focus:text-red-600"
                >
                  <Ban className="mr-2 h-4 w-4 text-red-600" />
                  Annuler la signature
                </DropdownMenuItem>
              )}

              {/* Rejeter le devis - en rouge */}
              {(quote.status === QUOTE_STATUS.PENDING ||
                quote.status === QUOTE_STATUS.IMPORTED) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleReject}
                    disabled={isLoading || isReadOnly}
                    className="text-red-600 focus:text-red-600"
                  >
                    <XCircle className="mr-2 h-4 w-4 text-red-600" />
                    Rejeter le devis
                  </DropdownMenuItem>
                </>
              )}

              {/* Supprimer - pour les brouillons, en rouge */}
              {hasDeleteAction && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    disabled={isReadOnly}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                    Supprimer
                  </DropdownMenuItem>
                </>
              )}
              {isReadOnly && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    {isOwner
                      ? "Mode lecture seule · Renouvelez votre abonnement"
                      : "Mode lecture seule · Contactez l'administrateur"}
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </ButtonGroup>
      </div>

      {/* Sidebar pour desktop - gérée au niveau du tableau pour éviter les re-renders */}

      {/* Fullscreen pour mobile - Ne monter que si ouvert */}
      {isMobileFullscreenOpen && (
        <QuoteMobileFullscreen
          quote={quote}
          isOpen={isMobileFullscreenOpen}
          onClose={() => setIsMobileFullscreenOpen(false)}
          onRefetch={onRefetch}
        />
      )}
    </>
  );
}
