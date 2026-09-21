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

// Description du toast, rendue DANS la boîte sombre.
// Sonner affiche sinon `description` dans son propre div, après notre JSX :
// sur un toast custom le <li> n'est pas stylé (data-styled=false), donc le
// texte débordait hors du fond noir, sans style. On la rend nous-mêmes et on
// retire l'option des données passées à sonner (cf. buildToastProps).
// Le padding gauche aligne la description sur le titre, dont l'icône est en
// inline-flex avec me-3 : largeur de l'icône + 0.75rem.
const ToastDescription = ({ description, isMobile }) => {
  if (!description) return null;
  return (
    <p
      className="mt-1.5 text-xs leading-5 whitespace-pre-line break-words"
      style={{
        color: "rgba(255, 255, 255, 0.65)",
        paddingLeft: isMobile ? 30 : 28,
      }}
    >
      {description}
    </p>
  );
};

// Composant de notification de succès
const SuccessToast = ({ message, isMobile, description }) => (
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
    <ToastDescription description={description} isMobile={isMobile} />
  </div>
);

// Composant de notification d'erreur avec détails techniques optionnels
const ErrorToast = ({ message, isMobile, details, description }) => {
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
      <ToastDescription description={description} isMobile={isMobile} />
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
const InfoToast = ({ message, isMobile, description }) => (
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
    <ToastDescription description={description} isMobile={isMobile} />
  </div>
);

// Composant de notification de chargement
const LoadingToast = ({ message, isMobile, description }) => (
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
    <ToastDescription description={description} isMobile={isMobile} />
  </div>
);

// Notification « document reçu » (import Qonto, Abby, Gmail, PDP…) :
// logo de la plateforme, titre, détail (numéro, tiers, montant) et bouton Voir.
const DocumentToast = ({
  toastId,
  title,
  description,
  logo,
  logoBg,
  logoAlt,
  fallbackIcon: FallbackIcon,
  action,
  isMobile,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const showLogo = !!logo && !imgFailed;
  return (
    <div
      className={`w-[360px] max-w-[calc(100vw-32px)] shadow-lg ${isMobile ? "rounded-2xl px-4 py-4" : "rounded-lg px-4 py-3"}`}
      style={{ backgroundColor: "#202020" }}
    >
      <div className="flex gap-3 items-start">
        <span
          className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden ring-1 ring-white/10"
          style={{
            backgroundColor: showLogo
              ? logoBg || "#ffffff"
              : "rgba(255,255,255,0.08)",
          }}
        >
          {showLogo ? (
            <img
              src={logo}
              alt={logoAlt || ""}
              className="w-8 h-8 object-cover"
              onError={() => setImgFailed(true)}
            />
          ) : FallbackIcon ? (
            <FallbackIcon size={16} style={{ color: "#ffffff" }} />
          ) : (
            <InfoIcon size={16} className="text-blue-500" />
          )}
        </span>
        <div className="grow min-w-0">
          <p
            className="text-sm font-medium leading-5 truncate"
            style={{ color: "#ffffff" }}
          >
            {title}
          </p>
          {description && (
            <p
              className="mt-0.5 text-xs leading-5 break-words"
              style={{ color: "rgba(255, 255, 255, 0.65)" }}
            >
              {description}
            </p>
          )}
          {action && (
            <button
              type="button"
              onClick={() => {
                sonnerToast.dismiss(toastId);
                action.onClick?.();
              }}
              className="mt-2 inline-flex items-center h-7 px-3 rounded-md text-xs font-medium bg-white text-[#202020] hover:bg-white/90 cursor-pointer"
            >
              {action.label}
            </button>
          )}
        </div>
        <Button
          variant="ghost"
          className="group -my-1.5 -me-2 size-8 shrink-0 p-0 hover:bg-transparent"
          aria-label="Fermer la notification"
          onClick={() => sonnerToast.dismiss(toastId)}
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
};

// Détection mobile pour les toasts
const checkIsMobile = () =>
  typeof window !== "undefined" && window.innerWidth < 768;

// Sépare ce qui est rendu par nos composants (description, details) de ce qui
// reste à sonner (duration, id, onDismiss...). `description` DOIT être retiré :
// laissée dans les données, sonner la rendrait une seconde fois hors de la
// boîte. `details` est propre à ErrorToast et n'a rien à faire côté sonner.
const buildToastProps = (options) => {
  const { description, details, ...sonnerOptions } = options || {};
  return { description, details, sonnerOptions };
};

// Fonctions de toast personnalisées
const toast = {
  success: (message, options) => {
    const { description, sonnerOptions } = buildToastProps(options);
    return sonnerToast.custom(
      () => (
        <SuccessToast
          message={message}
          isMobile={checkIsMobile()}
          description={description}
        />
      ),
      sonnerOptions,
    );
  },
  error: (message, options) => {
    const { description, details, sonnerOptions } = buildToastProps(options);
    return sonnerToast.custom(
      () => (
        <ErrorToast
          message={message}
          isMobile={checkIsMobile()}
          details={details}
          description={description}
        />
      ),
      sonnerOptions,
    );
  },
  info: (message, options) => {
    const { description, sonnerOptions } = buildToastProps(options);
    return sonnerToast.custom(
      () => (
        <InfoToast
          message={message}
          isMobile={checkIsMobile()}
          description={description}
        />
      ),
      sonnerOptions,
    );
  },
  // Utilise InfoToast pour les warnings
  warning: (message, options) => {
    const { description, sonnerOptions } = buildToastProps(options);
    return sonnerToast.custom(
      () => (
        <InfoToast
          message={message}
          isMobile={checkIsMobile()}
          description={description}
        />
      ),
      sonnerOptions,
    );
  },
  loading: (message, options) => {
    const { description, sonnerOptions } = buildToastProps(options);
    return sonnerToast.custom(
      () => (
        <LoadingToast
          message={message}
          isMobile={checkIsMobile()}
          description={description}
        />
      ),
      { duration: Infinity, ...sonnerOptions },
    );
  },
  // Document reçu d'une plateforme externe (Qonto, Abby, Gmail, PDP…)
  // options : { description, logo, logoBg, logoAlt, fallbackIcon, action:
  // { label, onClick }, duration… }
  document: (title, options) => {
    const {
      description,
      logo,
      logoBg,
      logoAlt,
      fallbackIcon,
      action,
      ...sonnerOptions
    } = options || {};
    return sonnerToast.custom(
      (id) => (
        <DocumentToast
          toastId={id}
          title={title}
          description={description}
          logo={logo}
          logoBg={logoBg}
          logoAlt={logoAlt}
          fallbackIcon={fallbackIcon}
          action={action}
          isMobile={checkIsMobile()}
        />
      ),
      { duration: 8000, ...sonnerOptions },
    );
  },
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
