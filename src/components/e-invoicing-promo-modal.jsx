"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import { CheckCircle2, Loader2, ExternalLink, ArrowRight } from "lucide-react";
import { useSuperPdp } from "@/src/hooks/useSuperPdp";
import { useEInvoicingSettings } from "@/src/hooks/useEInvoicing";

// Clé localStorage : l'utilisateur a demandé de ne plus voir la modal automatiquement (permanent)
export const E_INVOICING_PROMO_DISMISSED_KEY = "e_invoicing_promo_dismissed";
// Clé sessionStorage : la modal a déjà été ouverte automatiquement durant cette session
// (évite la réouverture à chaque rechargement de page ; remise à zéro à la prochaine connexion)
export const E_INVOICING_PROMO_SESSION_KEY = "e_invoicing_promo_session_shown";

export function EInvoicingPromoModal({ open, onOpenChange }) {
  const { connect, loading: superPdpLoading } = useSuperPdp();
  const { settings, loading: settingsLoading } = useEInvoicingSettings();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const isConnected = settings?.eInvoicingEnabled;

  const handleConnect = async () => {
    await connect();
  };

  // Mémoriser le choix « ne plus voir » à la fermeture
  const handleClose = () => {
    if (dontShowAgain && typeof window !== "undefined") {
      localStorage.setItem(E_INVOICING_PROMO_DISMISSED_KEY, "true");
    }
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => (v ? onOpenChange(true) : handleClose())}
    >
      <DialogContent
        className="p-0 gap-0 overflow-hidden border-0 shadow-lg"
        style={{ maxWidth: "780px" }}
      >
        <div className="p-8 pb-0">
          <DialogHeader>
            <DialogTitle className="text-2xl font-medium tracking-tight">
              Facturation électronique
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-8 pt-6">
          {/* Contenu principal avec illustration */}
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Illustration */}
            <div className="flex-shrink-0 w-full md:w-48">
              <Image
                src="/undraw_questions.svg"
                alt="Facturation électronique"
                width={202}
                height={202}
                className="w-full h-auto"
              />
            </div>

            {/* Contenu explicatif */}
            <div className="flex-1 space-y-6">
              {/* Statut de connexion */}
              {isConnected ? (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/20">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      Facturation électronique activée
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      Vos factures sont automatiquement converties au format
                      Factur-X et transmises via SuperPDP.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Introduction */}
                  <div className="space-y-3">
                    <p className="text-base text-muted-foreground leading-relaxed">
                      À partir de{" "}
                      <span className="font-medium text-foreground">
                        septembre 2026
                      </span>
                      , toutes les entreprises françaises devront être en mesure
                      de recevoir des factures électroniques.
                    </p>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      L'émission obligatoire pour les TPE/PME suivra en{" "}
                      <span className="font-medium text-foreground">
                        septembre 2027
                      </span>
                      .
                    </p>
                  </div>

                  {/* Ce que Newbi fait pour vous */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">
                      Ce que Newbi fait pour vous
                    </h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2.5">
                        <ArrowRight className="h-4 w-4 text-[#5b4eff] mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">
                          Conversion automatique de vos factures au format{" "}
                          <span className="font-medium text-foreground">
                            Factur-X
                          </span>{" "}
                          (norme européenne EN16931)
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <ArrowRight className="h-4 w-4 text-[#5b4eff] mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">
                          Transmission sécurisée via{" "}
                          <span className="font-medium text-foreground">
                            Chorus Pro
                          </span>{" "}
                          ou le réseau{" "}
                          <span className="font-medium text-foreground">
                            PEPPOL
                          </span>
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <ArrowRight className="h-4 w-4 text-[#5b4eff] mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">
                          Suivi en temps réel du statut de vos factures
                        </span>
                      </li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-8 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {!isConnected ? (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <Checkbox
                checked={dontShowAgain}
                onCheckedChange={(v) => setDontShowAgain(v === true)}
              />
              <span className="text-sm text-muted-foreground">
                Ne plus voir ce message
              </span>
            </label>
          ) : (
            <span />
          )}
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground"
            >
              Fermer
            </Button>
            {!isConnected && (
              <Button
                onClick={handleConnect}
                disabled={superPdpLoading || settingsLoading}
                className="bg-[#5b4eff] hover:bg-[#4a3ecc] text-white px-6"
              >
                {superPdpLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Connexion...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Activer la facturation électronique
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
