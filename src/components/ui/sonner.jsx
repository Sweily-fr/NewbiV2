"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, toast as sonnerToast } from "sonner";
import { Button } from "@/src/components/ui/button";
import {
  XIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  InfoIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

// Composant de notification de succès
const SuccessToast = ({ message }) => (
  <div className="bg-background max-w-[400px] rounded-md border px-4 py-3 shadow-lg">
    <div className="flex gap-2">
      <p className="grow text-sm">
        <CheckCircleIcon
          className="me-3 -mt-0.5 inline-flex text-emerald-500"
          size={16}
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
        />
      </Button>
    </div>
  </div>
);

// Composant de notification d'erreur
const ErrorToast = ({ message }) => (
  <div className="bg-background max-w-[400px] rounded-md border px-4 py-3 shadow-lg">
    <div className="flex gap-2">
      <p className="grow text-sm">
        <AlertCircleIcon
          className="me-3 -mt-0.5 inline-flex text-red-500"
          size={16}
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
        />
      </Button>
    </div>
  </div>
);

// Composant de notification d'information
const InfoToast = ({ message }) => (
  <div className="bg-background max-w-[400px] rounded-md border px-4 py-3 shadow-lg">
    <div className="flex gap-2">
      <p className="grow text-sm">
        <InfoIcon
          className="me-3 -mt-0.5 inline-flex text-blue-500"
          size={16}
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
        />
      </Button>
    </div>
  </div>
);

// Fonctions de toast personnalisées
const toast = {
  success: (message) =>
    sonnerToast.custom(() => <SuccessToast message={message} />),
  error: (message) =>
    sonnerToast.custom(() => <ErrorToast message={message} />),
  info: (message) => sonnerToast.custom(() => <InfoToast message={message} />),
  warning: (message) =>
    sonnerToast.custom(() => <InfoToast message={message} />), // Utilise InfoToast pour les warnings
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
                marginTop: "30px", // Espace pour éviter la barre de statut
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
