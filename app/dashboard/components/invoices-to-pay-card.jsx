"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { GmailConnectionDialog } from "@/app/dashboard/outils/factures-achat/components/gmail-connection";

export function InvoicesToPayCard({ className }) {
  const [isGmailDialogOpen, setIsGmailDialogOpen] = useState(false);

  return (
    <>
      <Card className={`${className || ""} flex flex-col min-h-[360px]`}>
        <CardHeader>
          <CardTitle className="text-base font-normal">
            Factures à payer
          </CardTitle>
          <CardDescription>
            <span className="text-lg font-medium text-foreground leading-tight">
              Vos factures fournisseurs en pilotage automatique
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col flex-1">
          <div className="flex items-start gap-6 flex-1">
            {/* Contenu texte */}
            <div className="flex flex-col flex-1">
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Vos factures arrivent prêtes à être payées via la synchronisation
                avec Gmail, la facturation électronique et le transfert
                d&apos;e-mails.
              </p>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsGmailDialogOpen(true)}
                >
                  Automatiser les factures fournisseurs
                </Button>
              </div>
            </div>

            {/* Illustration */}
            <div className="hidden sm:flex flex-shrink-0 items-center justify-center w-28 h-28">
              <svg
                viewBox="0 0 120 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
              >
                {/* Cloche */}
                <path
                  d="M50 30 C50 20 60 15 65 15 C70 15 80 20 80 30 L82 55 L45 55 Z"
                  fill="#d1d5db"
                  stroke="#9ca3af"
                  strokeWidth="1"
                />
                <ellipse cx="65" cy="55" rx="20" ry="4" fill="#9ca3af" />
                <circle cx="65" cy="60" r="4" fill="#9ca3af" />
                <line
                  x1="65"
                  y1="10"
                  x2="65"
                  y2="15"
                  stroke="#9ca3af"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {/* Document/checklist */}
                <rect
                  x="55"
                  y="50"
                  width="55"
                  height="65"
                  rx="4"
                  fill="white"
                  stroke="#d1d5db"
                  strokeWidth="1.5"
                  transform="rotate(-8 82 82)"
                />
                <rect x="68" y="60" width="28" height="3" rx="1.5" fill="#93c5fd" transform="rotate(-8 82 62)" />
                <rect x="70" y="68" width="20" height="3" rx="1.5" fill="#93c5fd" transform="rotate(-8 80 70)" />
                <rect x="72" y="76" width="24" height="3" rx="1.5" fill="#93c5fd" transform="rotate(-8 84 78)" />
                <rect x="74" y="84" width="16" height="3" rx="1.5" fill="#93c5fd" transform="rotate(-8 82 86)" />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      <GmailConnectionDialog
        open={isGmailDialogOpen}
        onOpenChange={setIsGmailDialogOpen}
      />
    </>
  );
}
