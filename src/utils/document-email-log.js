// Envois de documents par e-mail (DocumentEmailLog) : libellés et liens
// partagés par la page d'aperçu et l'historique des fiches.

export const EMAIL_LOG_DOCUMENT_LABELS = {
  invoice: "Facture",
  quote: "Devis",
  creditNote: "Avoir",
  purchaseOrder: "Bon de commande",
  deliveryNote: "Bon de livraison",
};

/**
 * Page du document envoyé (ouvre son panneau de détail dans la liste)
 */
export function emailLogDocumentUrl(log) {
  switch (log?.documentType) {
    case "invoice":
      return `/dashboard/outils/factures?id=${log.documentId}`;
    case "quote":
      return `/dashboard/outils/devis?id=${log.documentId}`;
    case "purchaseOrder":
      return `/dashboard/outils/bons-commande?id=${log.documentId}`;
    case "deliveryNote":
      return `/dashboard/outils/bons-de-livraison?id=${log.documentId}`;
    case "creditNote":
      return log.originalInvoiceId
        ? `/dashboard/outils/factures/${log.originalInvoiceId}/avoir/${log.documentId}`
        : "/dashboard/outils/factures";
    default:
      return "/dashboard";
  }
}

/**
 * Un envoi au format emailTracking, pour réutiliser son badge d'état
 */
export function emailLogTracking(log) {
  return {
    emailSentAt: log.sentAt,
    emailOpenedAt: log.openedAt,
    deliveryStatus: log.deliveryStatus,
    deliveredAt: log.deliveredAt,
    deliveryFailureReason: log.deliveryFailureReason,
    recipientEmail: log.to,
  };
}

export function formatEmailLogDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatAttachmentSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
}
