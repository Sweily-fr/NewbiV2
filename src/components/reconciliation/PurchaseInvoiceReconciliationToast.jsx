"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePurchaseInvoiceReconciliation } from "@/src/hooks/usePurchaseInvoiceReconciliation";
import { useRouter } from "next/navigation";
import { Landmark, Undo2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { toast as sonnerToast } from "sonner";
import {
  getIgnoredSuggestions,
  saveIgnoredSuggestion,
  removeIgnoredSuggestion,
  PI_RECONCILIATION_REPROPOSE_EVENT,
} from "@/src/lib/purchaseInvoiceReconciliationIgnored";

// Délai avant confirmation serveur (fenêtre d'undo du masquage)
const UNDO_DELAY_MS = 5000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const formatCurrency = (amount) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount || 0);

const formatRelativeDate = (dateInput) => {
  if (!dateInput) return "";
  try {
    const date = new Date(dateInput);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `il y a ${diffDays} j.`;
    if (diffDays < 30) return `il y a ${Math.floor(diffDays / 7)} sem.`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
};

// ---------------------------------------------------------------------------
// Carte individuelle — style "inbox notification" (identique au flux facture
// client, adaptée aux factures d'achat).
// ---------------------------------------------------------------------------
function PurchaseInvoiceReconciliationCard({
  transaction,
  invoice,
  onLink,
  onIgnore,
  onNavigate,
  isExiting,
}) {
  const supplierLabel = invoice.supplierName || "Fournisseur";
  const refLabel = invoice.invoiceNumber
    ? `${supplierLabel} · ${invoice.invoiceNumber}`
    : supplierLabel;

  return (
    <div
      onClick={() => onNavigate(invoice.id)}
      className={cn(
        "group relative w-[400px] cursor-pointer",
        "bg-white dark:bg-zinc-900",
        "rounded-[20px]",
        "shadow-[0_4px_20px_rgba(0,0,0,0.1),0_1px_4px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4),0_1px_4px_rgba(0,0,0,0.18)]",
        "border border-gray-200/60 dark:border-zinc-800/60",
        "transition-all duration-300 ease-out",
        "hover:border-gray-200/80 dark:hover:border-zinc-700/80",
        isExiting && "opacity-0 scale-95 translate-x-8",
      )}
    >
      <div className="px-4 py-3.5">
        <div className="flex items-start gap-3">
          {/* Icône banque */}
          <div className="flex-shrink-0 mt-0.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 dark:bg-zinc-800">
              <Landmark className="h-4 w-4 text-gray-500 dark:text-zinc-400" />
            </div>
          </div>

          {/* Contenu principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              {/* Texte fluide */}
              <p className="text-[13px] leading-relaxed text-gray-600 dark:text-zinc-400">
                <span className="font-semibold text-gray-900 dark:text-zinc-100">
                  {transaction.description || "Dépense"}
                </span>
                {" — "}
                <span className="font-semibold text-gray-900 dark:text-zinc-100">
                  {formatCurrency(Math.abs(transaction.amount))}
                </span>
                {" · Facture d'achat "}
                <span className="font-semibold text-gray-900 dark:text-zinc-100">
                  {refLabel}
                </span>
              </p>

              {/* Timestamp relatif */}
              <span className="flex-shrink-0 text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5 whitespace-nowrap">
                {formatRelativeDate(transaction.date)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-2.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onIgnore(transaction.id);
                }}
                className={cn(
                  "h-[30px] px-3.5 text-[12px] font-medium rounded-full cursor-pointer",
                  "border border-gray-200 dark:border-zinc-700",
                  "text-gray-600 dark:text-zinc-400",
                  "bg-transparent",
                  "hover:bg-gray-50 dark:hover:bg-zinc-800",
                  "hover:border-gray-300 dark:hover:border-zinc-600",
                  "transition-colors duration-150",
                )}
              >
                Masquer
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLink(transaction.id, invoice.id);
                }}
                className={cn(
                  "h-[30px] px-3.5 text-[12px] font-medium rounded-full cursor-pointer",
                  "bg-gray-900 dark:bg-zinc-100",
                  "text-white dark:text-zinc-900",
                  "hover:bg-gray-800 dark:hover:bg-white",
                  "transition-colors duration-150",
                )}
              >
                Rattacher
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Deck "stack de cartes" ancré en bas à droite (grandit vers le haut) pour ne
// pas chevaucher le toast facture client (ancré en haut à droite).
// ---------------------------------------------------------------------------
function PurchaseInvoiceReconciliationDeck({
  suggestions,
  onLink,
  onIgnore,
  onNavigate,
  exitingIds,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hoverTimeoutRef = useRef(null);

  const maxVisible = 3;
  const visibleSuggestions = suggestions.slice(0, maxVisible);
  const hiddenCount = Math.max(0, suggestions.length - maxVisible);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (suggestions.length > 1) setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => setIsExpanded(false), 400);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (suggestions.length <= 1) setIsExpanded(false);
  }, [suggestions.length]);

  if (suggestions.length === 0) return null;

  const cardHeight = 110;
  const stackOffset = 8;
  const expandedGap = 12;

  return (
    <div
      className="fixed bottom-5 right-6 z-[100]"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Compteur des cartes cachées (au-dessus de la pile) */}
      {hiddenCount > 0 && (
        <div className="flex justify-end mb-2">
          <span className="text-[12px] text-gray-400 dark:text-zinc-500">
            et {hiddenCount} autre{hiddenCount > 1 ? "s" : ""} dépense
            {hiddenCount > 1 ? "s" : ""}
          </span>
        </div>
      )}

      <div
        className="relative"
        style={{
          minHeight: isExpanded
            ? `${visibleSuggestions.length * (cardHeight + expandedGap)}px`
            : `${cardHeight + (visibleSuggestions.length - 1) * stackOffset}px`,
          transition: "min-height 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {visibleSuggestions.map((suggestion, index) => {
          const transaction = suggestion.transaction;
          const invoice = suggestion.matchingPurchaseInvoices[0];
          const isFirst = index === 0;
          const isExiting = exitingIds.has(transaction.id);

          return (
            <div
              key={transaction.id}
              className="absolute right-0 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                bottom: isExpanded
                  ? `${index * (cardHeight + expandedGap)}px`
                  : `${index * stackOffset}px`,
                transform: isExpanded
                  ? "scale(1)"
                  : `scale(${1 - index * 0.03})`,
                opacity: isExpanded ? 1 : isFirst ? 1 : 0.85 - index * 0.1,
                zIndex: 100 - index,
                transformOrigin: "bottom right",
                pointerEvents: isExpanded || isFirst ? "auto" : "none",
              }}
            >
              <PurchaseInvoiceReconciliationCard
                transaction={transaction}
                invoice={invoice}
                onLink={onLink}
                onIgnore={onIgnore}
                onNavigate={onNavigate}
                isExiting={isExiting}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Provider — logique métier (miroir de ReconciliationToastProvider).
// ---------------------------------------------------------------------------
export function PurchaseInvoiceReconciliationToastProvider({ children }) {
  const router = useRouter();
  const { suggestions, linkTransaction } = usePurchaseInvoiceReconciliation();

  const [ignoredSuggestions, setIgnoredSuggestions] = useState(new Set());
  const [exitingIds, setExitingIds] = useState(new Set());
  const [, setIsProcessing] = useState(false);
  const undoTimersRef = useRef(new Map());

  useEffect(() => {
    setIgnoredSuggestions(getIgnoredSuggestions());
  }, []);

  useEffect(() => {
    const handleRepropose = (event) => {
      const transactionId = event.detail?.transactionId;
      if (!transactionId) return;
      setIgnoredSuggestions((prev) => {
        if (!prev.has(transactionId)) return prev;
        const next = new Set(prev);
        next.delete(transactionId);
        return next;
      });
    };
    window.addEventListener(PI_RECONCILIATION_REPROPOSE_EVENT, handleRepropose);
    return () =>
      window.removeEventListener(
        PI_RECONCILIATION_REPROPOSE_EVENT,
        handleRepropose,
      );
  }, []);

  useEffect(() => {
    const timers = undoTimersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const activeSuggestions = suggestions.filter(
    (s) =>
      s.confidence === "high" &&
      !ignoredSuggestions.has(s.transaction.id) &&
      !exitingIds.has(s.transaction.id) &&
      s.matchingPurchaseInvoices.length > 0,
  );

  const animateOut = useCallback((transactionId, callback) => {
    setExitingIds((prev) => new Set([...prev, transactionId]));
    setTimeout(() => {
      setExitingIds((prev) => {
        const next = new Set(prev);
        next.delete(transactionId);
        return next;
      });
      callback();
    }, 300);
  }, []);

  const handleUndo = useCallback((transactionId) => {
    const timer = undoTimersRef.current.get(transactionId);
    if (timer) {
      clearTimeout(timer);
      undoTimersRef.current.delete(transactionId);
    }
    removeIgnoredSuggestion(transactionId);
    setIgnoredSuggestions((prev) => {
      const next = new Set(prev);
      next.delete(transactionId);
      return next;
    });
    sonnerToast.dismiss(`pi-undo-${transactionId}`);
  }, []);

  const handleLink = useCallback(
    async (transactionId, invoiceId) => {
      setIsProcessing(true);
      saveIgnoredSuggestion(transactionId);

      animateOut(transactionId, () => {
        setIgnoredSuggestions((prev) => new Set([...prev, transactionId]));
      });

      try {
        const result = await linkTransaction(transactionId, invoiceId);
        // Rollback de l'optimistic-ignore si le serveur refuse.
        if (!result?.success) {
          removeIgnoredSuggestion(transactionId);
          setIgnoredSuggestions((prev) => {
            const next = new Set(prev);
            next.delete(transactionId);
            return next;
          });
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [linkTransaction, animateOut],
  );

  const handleIgnore = useCallback(
    (transactionId) => {
      saveIgnoredSuggestion(transactionId);
      animateOut(transactionId, () => {
        setIgnoredSuggestions((prev) => new Set([...prev, transactionId]));
      });

      sonnerToast.custom(
        () => (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg max-w-[360px]"
            style={{ backgroundColor: "#202020" }}
          >
            <p className="text-sm text-white grow">Dépense masquée</p>
            <button
              onClick={() => handleUndo(transactionId)}
              className="flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <Undo2 size={14} />
              Annuler
            </button>
          </div>
        ),
        {
          id: `pi-undo-${transactionId}`,
          duration: UNDO_DELAY_MS,
        },
      );
    },
    [animateOut, handleUndo],
  );

  const handleNavigate = useCallback(
    (invoiceId) => {
      router.push(`/dashboard/outils/factures-achat?id=${invoiceId}`);
    },
    [router],
  );

  return (
    <>
      {children}
      {activeSuggestions.length > 0 && (
        <PurchaseInvoiceReconciliationDeck
          suggestions={activeSuggestions}
          onLink={handleLink}
          onIgnore={handleIgnore}
          onNavigate={handleNavigate}
          exitingIds={exitingIds}
        />
      )}
    </>
  );
}
