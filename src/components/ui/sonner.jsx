"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, toast as sonnerToast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { XIcon, CheckCircleIcon, AlertCircleIcon, InfoIcon } from "lucide-react";

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
  success: (message) => sonnerToast.custom(() => <SuccessToast message={message} />),
  error: (message) => sonnerToast.custom(() => <ErrorToast message={message} />),
  info: (message) => sonnerToast.custom(() => <InfoToast message={message} />),
  warning: (message) => sonnerToast.custom(() => <InfoToast message={message} />), // Utilise InfoToast pour les warnings
  // Conserver les méthodes originales de sonner si nécessaire
  dismiss: sonnerToast.dismiss,
  promise: sonnerToast.promise
};

const Toaster = ({ ...props }) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      style={{
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
        "--normal-border": "var(--border)",
      }}
      {...props}
    />
  );
};

export { Toaster, toast };

