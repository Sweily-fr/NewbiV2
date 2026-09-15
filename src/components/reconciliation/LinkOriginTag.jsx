"use client";

import { cn } from "@/src/lib/utils";

/**
 * Étiquette « comment le lien a été fait » d'un rapprochement bancaire
 * (Transaction.reconciliationLinks côté API, clé documentType + documentId).
 *
 * - DOCUMENT : rapproché depuis la fiche du document (facture client,
 *   facture d'achat, facture importée)
 * - TRANSACTION : rapproché depuis le tiroir de la transaction
 * - RECEIPT : justificatif déposé sur la transaction (facture créée ou
 *   reconnue par la lecture automatique)
 * - SUGGESTION : suggestion automatique confirmée (bandeau, fiche,
 *   « Transaction trouvée »)
 *
 * Les liens antérieurs à cette mémoire n'ont pas d'entrée : rien n'est
 * affiché. Couleur par famille : violet = fait à la main, vert = automatique
 * validé.
 */
const DOCUMENT_LABELS = {
  INVOICE: "Rapproché depuis la facture client",
  PURCHASE_INVOICE: "Rapproché depuis la facture d'achat",
  IMPORTED_INVOICE: "Rapproché depuis la facture importée",
};

const ORIGIN_STYLES = {
  DOCUMENT: "bg-[#5a50ff]/10 text-[#5a50ff] dark:bg-[#5a50ff]/20",
  TRANSACTION: "bg-[#5a50ff]/10 text-[#5a50ff] dark:bg-[#5a50ff]/20",
  RECEIPT:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  SUGGESTION:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
};

export const linkOriginLabel = (link) => {
  if (!link) return null;
  switch (link.origin) {
    case "DOCUMENT":
      return (
        DOCUMENT_LABELS[link.documentType] || "Rapproché depuis la facture"
      );
    case "TRANSACTION":
      return "Rapproché depuis la transaction";
    case "RECEIPT":
      return "Justificatif déposé";
    case "SUGGESTION":
      return "Suggestion confirmée";
    default:
      return null;
  }
};

export const findReconciliationLink = (links, documentType, documentId) =>
  (links || []).find(
    (l) =>
      l.documentType === documentType &&
      String(l.documentId) === String(documentId),
  ) || null;

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? ""
    : new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(d);
};

export function LinkOriginTag({ links, documentType, documentId, className }) {
  const link = findReconciliationLink(links, documentType, documentId);
  const label = linkOriginLabel(link);
  if (!label) return null;
  const details = [
    link.linkedByName ? `par ${link.linkedByName}` : null,
    link.linkedAt ? `le ${formatDate(link.linkedAt)}` : null,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <span
      title={details || undefined}
      className={cn(
        "inline-flex items-center max-w-full truncate text-[10px] leading-none px-1.5 py-1 rounded whitespace-nowrap",
        ORIGIN_STYLES[link.origin] || "bg-muted text-muted-foreground",
        className,
      )}
    >
      {label}
    </span>
  );
}
