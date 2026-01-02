"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import {
  FileCheck,
  Shield,
  Clock,
  Send,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useSuperPdp } from "@/src/hooks/useSuperPdp";
import { useEInvoicingSettings } from "@/src/hooks/useEInvoicing";

export function EInvoicingPromoModal({ open, onOpenChange }) {
  const { connect, loading: superPdpLoading } = useSuperPdp();
  const { settings, loading: settingsLoading } = useEInvoicingSettings();

  const isConnected = settings?.eInvoicingEnabled;

  const handleConnect = async () => {
    await connect();
  };

  const features = [
    {
      icon: FileCheck,
      title: "Format Factur-X",
      description: "Conversion automatique au format européen EN16931",
    },
    {
      icon: Shield,
      title: "Conformité garantie",
      description: "Validation selon les normes françaises et européennes",
    },
    {
      icon: Send,
      title: "Transmission sécurisée",
      description: "Envoi via Chorus Pro ou réseau PEPPOL",
    },
    {
      icon: Clock,
      title: "Suivi en temps réel",
      description: "Statut de vos factures en direct",
    },
  ];

  const deadlines = [
    {
      date: "Sept. 2026",
      title: "Réception obligatoire",
      description:
        "Toutes les entreprises devront recevoir des factures électroniques",
    },
    {
      date: "Sept. 2027",
      title: "Émission obligatoire",
      description: "Les TPE/PME devront émettre en format électronique",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] p-0 gap-0 overflow-hidden">
        <div className="p-6 pb-4">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#5b4eff]/10">
                <FileCheck className="h-5 w-5 text-[#5b4eff]" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  Facturation électronique
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Préparez-vous à la réforme française
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <Separator />

        <div className="p-6 space-y-6">
          {/* Statut de connexion */}
          {isConnected ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Compte SuperPDP connecté
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Vos factures seront automatiquement transmises
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <Calendar className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Anticipez la réforme
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Connectez votre compte SuperPDP dès maintenant
                </p>
              </div>
            </div>
          )}

          {/* Fonctionnalités */}
          <div className="grid grid-cols-2 gap-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card"
              >
                <feature.icon className="h-4 w-4 text-[#5b4eff] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{feature.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Échéances */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Échéances légales</p>
            <div className="space-y-2">
              {deadlines.map((deadline, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex h-8 w-16 items-center justify-center rounded bg-[#5b4eff]/10 text-xs font-medium text-[#5b4eff]">
                    {deadline.date}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{deadline.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {deadline.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="p-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          {!isConnected && (
            <Button
              onClick={handleConnect}
              disabled={superPdpLoading || settingsLoading}
              className="bg-[#5b4eff] hover:bg-[#4a3ecc] text-white"
            >
              {superPdpLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Connexion...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Connecter SuperPDP
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
