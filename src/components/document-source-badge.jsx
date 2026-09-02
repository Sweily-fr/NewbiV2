"use client";

import { useState } from "react";
import { Upload, Zap } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";

const BRANDFETCH_CDN = "https://cdn.brandfetch.io";

/**
 * Origines externes d'un document importé. Tout ce qui n'est pas listé ici
 * (OCR_UPLOAD, OCR, MANUAL, absent) vient de Newbi : on garde l'icône d'import.
 */
const EXTERNAL_SOURCES = {
  QONTO: {
    name: "Qonto",
    logo: `${BRANDFETCH_CDN}/qonto.com/w/400/h/400`,
    bg: "#2E1065",
    label: (doc) => `${doc} importé depuis Qonto`,
  },
  GMAIL: {
    name: "Gmail",
    logo: `${BRANDFETCH_CDN}/gmail.com/w/400/h/400`,
    bg: "#FFFFFF",
    label: (doc) => `${doc} reçu par Gmail`,
  },
  SUPERPDP: {
    name: "Facturation électronique",
    icon: Zap,
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    label: (doc) => `${doc} reçu par facturation électronique`,
  },
};

export function isExternalSource(source) {
  return !!source && !!EXTERNAL_SOURCES[String(source).toUpperCase()];
}

/**
 * Pastille d'origine d'un document importé.
 * - source externe (Qonto, Gmail, PDP) : logo de la plateforme
 * - sinon : icône d'import violette historique
 *
 * @param {string} source   ImportedInvoice.source / PurchaseInvoice.source / ...
 * @param {string} docLabel "Facture", "Devis", "Bon de commande"...
 * @param {string} fallbackLabel Texte de l'infobulle pour un import Newbi
 */
export function DocumentSourceBadge({
  source,
  docLabel = "Document",
  fallbackLabel,
  className = "",
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const ext = EXTERNAL_SOURCES[String(source || "").toUpperCase()];

  let content;
  let label;
  if (ext && ext.logo && !imgFailed) {
    label = ext.label(docLabel);
    content = (
      <span
        className={`flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded overflow-hidden ring-1 ring-black/5 dark:ring-white/10 cursor-default ${className}`}
        style={{ backgroundColor: ext.bg }}
      >
        <img
          src={ext.logo}
          alt={ext.name}
          className="w-5 h-5 object-cover"
          onError={() => setImgFailed(true)}
        />
      </span>
    );
  } else if (ext && ext.icon) {
    const Icon = ext.icon;
    label = ext.label(docLabel);
    content = (
      <span
        className={`flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded cursor-default ${ext.className} ${className}`}
      >
        <Icon className="w-3 h-3" />
      </span>
    );
  } else {
    label = ext ? ext.label(docLabel) : fallbackLabel || `${docLabel} importé`;
    content = (
      <span
        className={`flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 cursor-default ${className}`}
      >
        <Upload className="w-3 h-3" />
      </span>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent
        side="top"
        className="bg-[#202020] text-white border-none text-xs"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
