"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, toast as sonnerToast } from "sonner";
import { Button } from "@/src/components/ui/button";
import {
  XIcon,
  CircleCheck,
  AlertCircleIcon,
  InfoIcon,
  LoaderCircle,
  ChevronDown,
  ChevronUp,
  Copy,
} from "lucide-react";
import { useEffect, useState } from "react";

// Composant de notification de succès
const SuccessToast = ({ message, isMobile }) => (
  <div
    className={`max-w-[400px] shadow-lg ${isMobile ? "rounded-2xl px-4 py-4" : "rounded-lg px-4 py-3"}`}
    style={{ backgroundColor: "#202020" }}
  >
    <div className="flex gap-2 items-center">
      <p
        className={`grow ${isMobile ? "text-sm" : "text-sm"}`}
        style={{ color: "#ffffff" }}
      >
        <CircleCheck
          className="me-3 -mt-0.5 inline-flex text-green-600"
          size={isMobile ? 18 : 16}
          aria-hidden="true"
        />
        {message}
      </p>
      <Button
        variant="ghost"
        className="group -my-1.5 -me-2 size-8 shrink-0 p-0 hover:bg-transparent"
        aria-label="Fermer la notification"
        onClick={() => sonnerToast.dismiss()}
      >
        <XIcon
          size={16}
          className="opacity-60 transition-opacity group-hover:opacity-100"
          aria-hidden="true"
          style={{ color: "#ffffff" }}
        />
      </Button>
    </div>
  </div>
);

// Composant de notification d'erreur avec détails techniques optionnels
const ErrorToast = ({ message, isMobile, details }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyDetails = (e) => {
    e.stopPropagation();
    if (!details) return;
    const text = [
      details.operation && `Opération: ${details.operation}`,
      details.errorCode && `Code: ${details.errorCode}`,
      details.rawMessage && `Message: ${details.rawMessage}`,
    ]
      .filter(Boolean)
      .join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className={`max-w-[400px] shadow-lg ${isMobile ? "rounded-2xl px-4 py-4" : "rounded-lg px-4 py-3"}`}
      style={{ backgroundColor: "#202020" }}
    >
      <div className="flex gap-2 items-center">
        <p
          className={`grow ${isMobile ? "text-sm" : "text-sm"}`}
          style={{ color: "#ffffff" }}
        >
          <AlertCircleIcon
            className="me-3 -mt-0.5 inline-flex text-red-500"
            size={isMobile ? 18 : 16}
            aria-hidden="true"
          />
          {message}
        </p>
        <div className="flex items-center gap-0.5 shrink-0">
          {details && (
            <Button
              variant="ghost"
              className="group -my-1.5 size-8 shrink-0 p-0 hover:bg-transparent"
              aria-label="Voir les détails"
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(!showDetails);
              }}
            >
              {showDetails ? (
                <ChevronUp
                  size={14}
                  className="opacity-60 transition-opacity group-hover:opacity-100"
                  style={{ color: "#ffffff" }}
                />
              ) : (
                <ChevronDown
                  size={14}
                  className="opacity-60 transition-opacity group-hover:opacity-100"
                  style={{ color: "#ffffff" }}
                />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            className="group -my-1.5 -me-2 size-8 shrink-0 p-0 hover:bg-transparent"
            aria-label="Fermer la notification"
            onClick={() => sonnerToast.dismiss()}
          >
            <XIcon
              size={16}
              className="opacity-60 transition-opacity group-hover:opacity-100"
              aria-hidden="true"
              style={{ color: "#ffffff" }}
            />
          </Button>
        </div>
      </div>
      {details && showDetails && (
        <div className="mt-2 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between mb-1">
            <span
              className="text-[10px] font-medium uppercase tracking-wider"
              style={{ color: "#888" }}
            >
              Détails techniques
            </span>
            <Button
              variant="ghost"
              className="h-5 px-1.5 py-0 hover:bg-white/10 rounded"
              onClick={handleCopyDetails}
            >
              <Copy size={10} style={{ color: "#888" }} />
              <span className="ml-1 text-[10px]" style={{ color: "#888" }}>
                {copied ? "Copié" : "Copier"}
              </span>
            </Button>
          </div>
          <div
            className="space-y-0.5 text-xs font-mono"
            style={{ color: "#aaa" }}
          >
            {details.operation && (
              <p>
                Opération:{" "}
                <span style={{ color: "#f59e0b" }}>{details.operation}</span>
              </p>
            )}
            {details.errorCode && (
              <p>
                Code:{" "}
                <span style={{ color: "var(--color-status-danger)" }}>
                  {details.errorCode}
                </span>
              </p>
            )}
            {details.rawMessage && (
              <p className="break-all">Message: {details.rawMessage}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Composant de notification d'information
const InfoToast = ({ message, isMobile }) => (
  <div
    className={`max-w-[400px] shadow-lg ${isMobile ? "rounded-2xl px-4 py-4" : "rounded-lg px-4 py-3"}`}
    style={{ backgroundColor: "#202020" }}
  >
    <div className="flex gap-2 items-center">
      <p
        className={`grow ${isMobile ? "text-sm" : "text-sm"}`}
        style={{ color: "#ffffff" }}
      >
        <InfoIcon
          className="me-3 -mt-0.5 inline-flex text-blue-500"
          size={isMobile ? 18 : 16}
          aria-hidden="true"
        />
        {message}
      </p>
      <Button
        variant="ghost"
        className="group -my-1.5 -me-2 size-8 shrink-0 p-0 hover:bg-transparent"
        aria-label="Fermer la notification"
        onClick={() => sonnerToast.dismiss()}
      >
        <XIcon
          size={16}
          className="opacity-60 transition-opacity group-hover:opacity-100"
          aria-hidden="true"
          style={{ color: "#ffffff" }}
        />
      </Button>
    </div>
  </div>
);

// Composant de notification de chargement
const LoadingToast = ({ message, isMobile }) => (
  <div
    className={`max-w-[400px] shadow-lg ${isMobile ? "rounded-2xl px-4 py-4" : "rounded-lg px-4 py-3"}`}
    style={{ backgroundColor: "#202020" }}
  >
    <div className="flex gap-2 items-center">
      <p
        className={`grow ${isMobile ? "text-sm" : "text-sm"}`}
        style={{ color: "#ffffff" }}
      >
        <LoaderCircle
          className="me-3 -mt-0.5 inline-flex text-white animate-spin"
          size={isMobile ? 18 : 16}
          aria-hidden="true"
        />
        {message}
      </p>
    </div>
  </div>
);

// Détection mobile pour les toasts
const checkIsMobile = () =>
  typeof window !== "undefined" && window.innerWidth < 768;

// Fonctions de toast personnalisées
const toast = {
  success: (message) =>
    sonnerToast.custom(() => (
      <SuccessToast message={message} isMobile={checkIsMobile()} />
    )),
  error: (message, options) =>
    sonnerToast.custom(
      () => (
        <ErrorToast
          message={message}
          isMobile={checkIsMobile()}
          details={options?.details}
        />
      ),
      options,
    ),
  info: (message) =>
    sonnerToast.custom(() => (
      <InfoToast message={message} isMobile={checkIsMobile()} />
    )),
  warning: (message) =>
    sonnerToast.custom(() => (
      <InfoToast message={message} isMobile={checkIsMobile()} />
    )), // Utilise InfoToast pour les warnings
  loading: (message) =>
    sonnerToast.custom(
      () => <LoadingToast message={message} isMobile={checkIsMobile()} />,
      { duration: Infinity },
    ),
  // Conserver les méthodes originales de sonner si nécessaire
  dismiss: sonnerToast.dismiss,
  promise: sonnerToast.promise,
};

const Toaster = ({ ...props }) => {
  const { theme = "system" } = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <>
      {isMobile && (
        <style jsx global>{`
          .mobile-toast {
            animation: slideInFromTop 0.3s ease-out !important;
            transform-origin: top center !important;
          }

          @keyframes slideInFromTop {
            from {
              transform: translateY(-100%) scale(0.95);
              opacity: 0;
            }
            to {
              transform: translateY(0) scale(1);
              opacity: 1;
            }
          }

          .toaster[data-position="top-center"] {
            top: 0 !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            width: calc(100% - 32px) !important;
            max-width: 400px !important;
          }

          .mobile-toast [data-sonner-toast] {
            border-radius: 12px !important;
            backdrop-filter: blur(20px) !important;
            background: rgba(255, 255, 255, 0.9) !important;
            border: 1px solid rgba(0, 0, 0, 0.1) !important;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1) !important;
          }

          .dark .mobile-toast [data-sonner-toast] {
            background: rgba(28, 28, 30, 0.9) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
          }
        `}</style>
      )}
      <Sonner
        theme={theme}
        className="toaster group"
        position={isMobile ? "top-center" : "bottom-right"}
        expand={isMobile}
        richColors={false}
        closeButton={false}
        style={{
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        }}
        toastOptions={{
          style: isMobile
            ? {
                marginTop: "4px", // Remonté - moins d'espace
              }
            : {},
          className: isMobile ? "mobile-toast" : "",
        }}
        {...props}
      />
    </>
  );
};

export { Toaster, toast };
