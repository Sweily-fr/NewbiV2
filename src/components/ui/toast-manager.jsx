"use client";

import { useState, useCallback, createContext, useContext } from "react";
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

// Composant Toast individuel
function Toast({ toast, onClose }) {
  const Icon = TOAST_ICONS[toast.type] || Info;
  const isDarkBg = toast.type === "reconciliation" || toast.type === "document";

  return (
    <div
      className={cn(
        "pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg",
        "animate-in slide-in-from-right-full duration-300",
        TOAST_COLORS[toast.type] || TOAST_COLORS.info
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("flex-shrink-0", ICON_COLORS[toast.type])}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            {toast.title && (
              <p
                className={cn(
                  "text-sm font-medium",
                  isDarkBg ? "text-white" : "text-gray-900 dark:text-gray-100"
                )}
              >
                {toast.title}
              </p>
            )}
            {toast.description && (
              <p
                className={cn(
                  "mt-1 text-sm",
                  isDarkBg
                    ? "text-gray-300"
                    : "text-gray-600 dark:text-gray-400"
                )}
              >
                {toast.description}
              </p>
            )}
            {(toast.actionProps || toast.dismissProps) && (
              <div className="mt-3 flex gap-2">
                {toast.dismissProps && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className={cn(
                      "h-8 text-xs",
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
                      "h-8 text-xs",
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
                      "h-8 text-xs",
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
          <button
            onClick={() => onClose(toast.id)}
            className={cn(
              "flex-shrink-0",
              isDarkBg
                ? "text-gray-400 hover:text-white"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            )}
          >
            <X className="h-4 w-4" />
          </button>
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

    setToasts((prev) => [...prev, toast]);

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

  return (
    <ToastContext.Provider value={{ add, close, closeAll }}>
      {children}
      {/* Toast Container - en haut à droite */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={close} />
        ))}
      </div>
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
