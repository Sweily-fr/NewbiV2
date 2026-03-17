"use client";

import { Badge } from "@/src/components/ui/badge";
import {
  PenLine,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Ban,
} from "lucide-react";

const STATUS_CONFIG = {
  PENDING: {
    label: "En attente",
    variant: "secondary",
    icon: Clock,
  },
  WAIT_VALIDATION: {
    label: "Validation",
    variant: "secondary",
    icon: Clock,
  },
  WAIT_SIGN: {
    label: "Prêt à signer",
    variant: "outline",
    icon: PenLine,
  },
  WAIT_SIGNER: {
    label: "En attente du signataire",
    variant: "outline",
    icon: PenLine,
  },
  DONE: {
    label: "Signé",
    variant: "default",
    icon: CheckCircle2,
    className: "bg-green-100 text-green-800 hover:bg-green-100",
  },
  ERROR: {
    label: "Erreur",
    variant: "destructive",
    icon: AlertTriangle,
  },
  CANCELLED: {
    label: "Annulé",
    variant: "secondary",
    icon: Ban,
    className: "bg-gray-100 text-gray-500 hover:bg-gray-100",
  },
};

export function SignatureStatusBadge({ status, className = "" }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={`gap-1 ${config.className || ""} ${className}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
