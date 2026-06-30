"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  useReconciliation,
  useReconciliationForImportedInvoice,
} from "@/src/hooks/useReconciliation";
import { useRouter } from "next/navigation";
import { Landmark, X, Undo2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { toast as sonnerToast } from "sonner";
import {
  getIgnoredSuggestions,
  saveIgnoredSuggestion,
  removeIgnoredSuggestion,
  RECONCILIATION_REPROPOSE_EVENT,
} from "@/src/lib/reconciliationIgnored";

// Délai avant confirmation serveur (fenêtre d'undo)
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
// ReconciliationCard — Carte individuelle style "inbox notification"
// ---------------------------------------------------------------------------
function ReconciliationCard({
  transaction,
  invoice,
  onLink,
  onIgnore,
  onNavigate,
  isExiting,
}) {
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
                  {transaction.description || "Virement reçu"}
                </span>
                {" a payé "}
                <span className="font-semibold text-gray-900 dark:text-zinc-100">
                  {formatCurrency(transaction.amount)}
                </span>
                {" — "}
                <span className="font-semibold text-gray-900 dark:text-zinc-100">
                  Facture {invoice.number}
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
                  onLink(transaction.id, invoice.id, invoice.documentType);
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
// ReconciliationDeck — Stack "deck de cartes" avec hover expand
// ---------------------------------------------------------------------------
function ReconciliationDeck({
  suggestions,
  onLink,
  onIgnore,
  onNavigate,
  exitingIds,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const containerRef = useRef(null);

  // Max 3 cartes visibles dans le deck, badge pour le reste
  const maxVisible = 3;
  const visibleSuggestions = suggestions.slice(0, maxVisible);
  const hiddenCount = Math.max(0, suggestions.length - maxVisible);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (suggestions.length > 1) {
      setIsExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 400);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // Quand il ne reste qu'une seule carte, pas besoin d'expand
  useEffect(() => {
    if (suggestions.length <= 1) setIsExpanded(false);
  }, [suggestions.length]);

  if (suggestions.length === 0) return null;

  // Constantes de layout
  const cardHeight = 110; // hauteur estimée d'une carte
  const stackOffset = 8; // décalage entre les cartes en mode deck
  const expandedGap = 12; // espace entre les cartes en mode expanded

  return (
    <div
      ref={containerRef}
      className="fixed top-5 right-6 z-[100]"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
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
          const invoice = suggestion.matchingInvoices[0];
          const isFirst = index === 0;
          const isExiting = exitingIds.has(transaction.id);

          return (
            <div
              key={transaction.id}
              className="absolute right-0 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                top: isExpanded
                  ? `${index * (cardHeight + expandedGap)}px`
                  : `${index * stackOffset}px`,
                transform: isExpanded
                  ? "scale(1)"
                  : `scale(${1 - index * 0.03})`,
                opacity: isExpanded ? 1 : isFirst ? 1 : 0.85 - index * 0.1,
                zIndex: 100 - index,
                transformOrigin: "top right",
                pointerEvents: isExpanded || isFirst ? "auto" : "none",
              }}
            >
              <ReconciliationCard
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

      {/* Compteur des cartes cachées */}
      {hiddenCount > 0 && (
        <div className="flex justify-end mt-2">
          <span className="text-[12px] text-gray-400 dark:text-zinc-500">
            et {hiddenCount} autre{hiddenCount > 1 ? "s" : ""} paiement
            {hiddenCount > 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ReconciliationToastProvider — Logique métier (interface identique)
// ---------------------------------------------------------------------------
export function ReconciliationToastProvider({ children }) {
  const router = useRouter();
  const {
    suggestions,
    linkTransaction,
    refetch: fetchSuggestions,
    loading,
    error,
  } = useReconciliation();
  // Rattachement des factures de CA importées (mutation dédiée, même signature
  // (transactionId, importedInvoiceId) que linkTransaction).
  const { linkTransaction: linkImportedTransaction } =
    useReconciliationForImportedInvoice();

  const [ignoredSuggestions, setIgnoredSuggestions] = useState(new Set());
  const [exitingIds, setExitingIds] = useState(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const undoTimersRef = useRef(new Map());

  // Charger les suggestions ignorées au montage
  useEffect(() => {
    setIgnoredSuggestions(getIgnoredSuggestions());
  }, []);

  // Reproposer une transaction dissociée : le hook de déliaison a déjà nettoyé
  // le localStorage et rafraîchi GET_RECONCILIATION_SUGGESTIONS (cache Apollo
  // partagé). Il ne reste qu'à synchroniser l'état "ignoré" en mémoire pour que
  // la carte réapparaisse — sans la rattacher.
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
    window.addEventListener(RECONCILIATION_REPROPOSE_EVENT, handleRepropose);
    return () =>
      window.removeEventListener(
        RECONCILIATION_REPROPOSE_EVENT,
        handleRepropose,
      );
  }, []);

  // Cleanup des timers au démontage
  useEffect(() => {
    return () => {
      undoTimersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  // Filtrer les suggestions affichables
  const activeSuggestions = suggestions.filter(
    (s) =>
      s.confidence === "high" &&
      !ignoredSuggestions.has(s.transaction.id) &&
      !exitingIds.has(s.transaction.id) &&
      s.matchingInvoices.length > 0,
  );

  // Animation de sortie puis suppression
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

  // Annuler un ignore (undo)
  const handleUndo = useCallback((transactionId) => {
    // Annuler le timer de confirmation serveur
    const timer = undoTimersRef.current.get(transactionId);
    if (timer) {
      clearTimeout(timer);
      undoTimersRef.current.delete(transactionId);
    }

    // Retirer du localStorage et du state
    removeIgnoredSuggestion(transactionId);
    setIgnoredSuggestions((prev) => {
      const next = new Set(prev);
      next.delete(transactionId);
      return next;
    });

    sonnerToast.dismiss(`undo-${transactionId}`);
  }, []);

  // Rattacher une transaction à une facture (standard ou de CA importée)
  const handleLink = useCallback(
    async (transactionId, invoiceId, documentType) => {
      setIsProcessing(true);
      saveIgnoredSuggestion(transactionId);

      animateOut(transactionId, () => {
        setIgnoredSuggestions((prev) => new Set([...prev, transactionId]));
      });

      try {
        const linkFn =
          documentType === "IMPORTED_INVOICE"
            ? linkImportedTransaction
            : linkTransaction;
        const result = await linkFn(transactionId, invoiceId);
        // Rollback de l'optimistic-ignore si le serveur refuse le rattachement :
        // sinon la carte reste masquée alors que la transaction n'est pas
        // rapprochée (linkTransaction ne jette pas, il renvoie { success }).
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
    [linkTransaction, linkImportedTransaction, animateOut],
  );

  // Masquer une suggestion du toast — NON bloquant. On la cache uniquement côté
  // client (localStorage) ; la transaction reste "unmatched" en base, donc
  // toujours rapprochable depuis le drawer transaction et la sidebar facture.
  // Aucun statut "ignoré" serveur n'est posé.
  const handleIgnore = useCallback(
    (transactionId) => {
      // Optimistic UI : disparition immédiate de la carte
      saveIgnoredSuggestion(transactionId);
      animateOut(transactionId, () => {
        setIgnoredSuggestions((prev) => new Set([...prev, transactionId]));
      });

      // Toast undo (5 secondes pour annuler le masquage)
      sonnerToast.custom(
        () => (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg max-w-[360px]"
            style={{ backgroundColor: "#202020" }}
          >
            <p className="text-sm text-white grow">Paiement masqué</p>
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
          id: `undo-${transactionId}`,
          duration: UNDO_DELAY_MS,
        },
      );
    },
    [animateOut, handleUndo],
  );

  // Naviguer vers la facture (clic sur la carte)
  const handleNavigate = useCallback(
    (invoiceId) => {
      router.push(`/dashboard/outils/factures?id=${invoiceId}`);
    },
    [router],
  );

  return (
    <>
      {children}
      {activeSuggestions.length > 0 && (
        <ReconciliationDeck
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
