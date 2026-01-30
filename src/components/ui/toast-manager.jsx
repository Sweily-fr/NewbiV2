"use client";

import { useState, useCallback, createContext, useContext, useRef } from "react";
import { Button } from "@/src/components/ui/button";
import { X, CheckCircle, AlertCircle, Info, Landmark, FileText } from "lucide-react";
import { cn } from "@/src/lib/utils";

// Context pour le toast manager
const ToastContext = createContext(null);

// Types d'icônes selon le type de toast
const TOAST_ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertCircle,
  reconciliation: Landmark,
  document: FileText,
};

// Couleurs selon le type
const TOAST_COLORS = {
  success:
    "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
  error: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
  info: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
  warning:
    "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800",
  reconciliation: "bg-[#202020] border-[#202020]",
  document: "bg-[#202020] border-[#202020]",
};

const ICON_COLORS = {
  success: "text-green-600",
  error: "text-red-600",
  info: "text-blue-600",
  warning: "text-amber-600",
  reconciliation: "text-[#FFF]",
  document: "text-[#FFF]",
};

// Composant Toast individuel - Version compacte
function Toast({ toast, onClose }) {
  const Icon = TOAST_ICONS[toast.type] || Info;
  const isDarkBg = toast.type === "reconciliation" || toast.type === "document";

  return (
    <div
      className={cn(
        "pointer-events-auto w-[360px] overflow-hidden rounded-lg border shadow-lg",
        "animate-in slide-in-from-right-full duration-300",
        TOAST_COLORS[toast.type] || TOAST_COLORS.info
      )}
    >
      <div className="px-3 py-2.5">
        <div className="flex items-start gap-2.5">
          <div className={cn("flex-shrink-0 mt-0.5", ICON_COLORS[toast.type])}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {toast.title && (
                  <p
                    className={cn(
                      "text-sm font-medium leading-tight",
                      isDarkBg ? "text-white" : "text-gray-900 dark:text-gray-100"
                    )}
                  >
                    {toast.title}
                  </p>
                )}
                {toast.description && (
                  <p
                    className={cn(
                      "text-xs leading-tight mt-0.5 line-clamp-2",
                      isDarkBg
                        ? "text-gray-300"
                        : "text-gray-600 dark:text-gray-400"
                    )}
                  >
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => onClose(toast.id)}
                className={cn(
                  "flex-shrink-0",
                  isDarkBg
                    ? "text-gray-400 hover:text-white"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                )}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {(toast.actionProps || toast.dismissProps) && (
              <div className="mt-2 flex gap-1.5">
                {toast.dismissProps && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className={cn(
                      "h-7 text-xs px-2",
                      isDarkBg &&
                        "text-gray-400 hover:text-white hover:bg-gray-700"
                    )}
                    onClick={toast.dismissProps.onClick}
                  >
                    {toast.dismissProps.children}
                  </Button>
                )}
                {toast.secondaryActionProps && (
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                      "h-7 text-xs px-2",
                      isDarkBg && "border-gray-600 text-gray-700 dark:bg-white"
                    )}
                    onClick={toast.secondaryActionProps.onClick}
                  >
                    {toast.secondaryActionProps.children}
                  </Button>
                )}
                {toast.actionProps && (
                  <Button
                    size="sm"
                    className={cn(
                      "h-7 text-xs px-2",
                      isDarkBg && "bg-[#5a50ff] hover:bg-[#4a40ef] text-white"
                    )}
                    onClick={toast.actionProps.onClick}
                  >
                    {toast.actionProps.children}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Provider du Toast Manager
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((options) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const toast = {
      id,
      type: options.type || "info",
      title: options.title,
      description: options.description,
      actionProps: options.actionProps,
      secondaryActionProps: options.secondaryActionProps,
      dismissProps: options.dismissProps,
      timeout: options.timeout || 5000,
    };

    // Ajouter au début pour que les nouveaux toasts apparaissent en haut de la pile
    setToasts((prev) => [toast, ...prev]);

    // Auto-dismiss après timeout (sauf si timeout très long)
    if (toast.timeout < 100000) {
      setTimeout(() => {
        close(id);
      }, toast.timeout);
    }

    return id;
  }, []);

  const close = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const closeAll = useCallback(() => {
    setToasts([]);
  }, []);

  // Limiter le nombre de toasts visibles (les plus récents en premier)
  const visibleToasts = toasts.slice(0, 5);
  const hiddenCount = toasts.length - visibleToasts.length;
  const [isExpanded, setIsExpanded] = useState(false);
  const hoverTimeoutRef = useRef(null);

  // Gérer le hover avec un délai pour éviter les ouvertures/fermetures rapides
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (visibleToasts.length > 1) {
      setIsExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 500);
  };

  // Hauteur d'un toast compact pour le calcul de l'espacement
  const toastHeight = 90;
  const expandedGap = 16; // Espace entre les toasts quand déplié
  const stackOffset = isExpanded ? toastHeight + expandedGap : 6;

  return (
    <ToastContext.Provider value={{ add, close, closeAll }}>
      {children}
      {/* Toast Container - en haut à droite, effet de pile superposée */}
      {toasts.length > 0 && (
        <div
          className="fixed top-4 right-6 z-[100] mr-2"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className="relative"
            style={{
              // Réserver l'espace pour la pile étendue
              minHeight: isExpanded
                ? `${visibleToasts.length * (toastHeight + expandedGap)}px`
                : `${Math.min(visibleToasts.length * 6 + toastHeight, 130)}px`,
              transition: 'min-height 0.3s ease-out',
            }}
          >
            {visibleToasts.map((toast, index) => {
              const isFirst = index === 0;

              return (
                <div
                  key={toast.id}
                  className="absolute right-0 transition-all duration-400 ease-out pointer-events-auto"
                  style={{
                    top: isExpanded
                      ? `${index * (toastHeight + expandedGap)}px`
                      : `${index * stackOffset}px`,
                    transform: isExpanded
                      ? 'scale(1) translateX(0)'
                      : `scale(${1 - index * 0.02})`,
                    opacity: isExpanded ? 1 : (isFirst ? 1 : Math.max(0.5, 1 - index * 0.2)),
                    zIndex: 100 - index,
                    transformOrigin: 'top right',
                    filter: !isExpanded && index > 0 ? `brightness(${1 - index * 0.08})` : 'none',
                  }}
                >
                  <Toast toast={toast} onClose={close} />
                </div>
              );
            })}
          </div>


          {/* Indicateur de toasts cachés (quand étendu) */}
          {hiddenCount > 0 && isExpanded && (
            <div
              className="text-center pointer-events-auto"
              style={{
                marginTop: `${visibleToasts.length * (toastHeight + expandedGap) + 12}px`,
                position: 'absolute',
                right: 0,
                left: 0,
              }}
            >
              <span className="text-xs text-muted-foreground bg-background/95 px-3 py-1.5 rounded-full border shadow-sm">
                +{hiddenCount} autre{hiddenCount > 1 ? 's' : ''} en attente
              </span>
            </div>
          )}
        </div>
      )}
    </ToastContext.Provider>
  );
}

// Hook pour utiliser le toast manager
export function useToastManager() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToastManager must be used within a ToastProvider");
  }
  return context;
}

// Export pour usage direct (singleton pattern)
let toastManagerInstance = null;

export const toastManager = {
  _setInstance: (instance) => {
    toastManagerInstance = instance;
  },
  add: (options) => {
    if (toastManagerInstance) {
      return toastManagerInstance.add(options);
    }
    console.warn("ToastManager not initialized");
    return null;
  },
  close: (id) => {
    if (toastManagerInstance) {
      toastManagerInstance.close(id);
    }
  },
  closeAll: () => {
    if (toastManagerInstance) {
      toastManagerInstance.closeAll();
    }
  },
};

// Composant pour initialiser le singleton
export function ToastManagerInitializer() {
  const manager = useToastManager();

  // Initialiser le singleton
  if (typeof window !== "undefined") {
    toastManager._setInstance(manager);
  }

  return null;
}
