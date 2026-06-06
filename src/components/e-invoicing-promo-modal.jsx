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
import {
  CheckCircle2,
  LoaderCircle,
  ArrowRight,
  CornerDownLeft,
} from "lucide-react";
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
      <DialogContent className="sm:max-w-[620px] p-1 gap-0 top-[40%] border-0 bg-[#efefef] dark:bg-[#1a1a1a] overflow-hidden rounded-2xl">
        <div className="bg-background rounded-xl overflow-hidden ring-1 ring-black/[0.07] dark:ring-white/[0.1]">
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/40">
            <DialogTitle className="text-sm font-medium">
              Facturation électronique
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 px-6 pt-5 pb-0">
            {isConnected ? (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200/50 dark:border-green-900/30">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Facturation électronique activée
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-400">
                    Vos factures sont automatiquement converties au format
                    Factur-X et transmises via SuperPDP.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center">
                {/* Illustration */}
                <div className="flex-shrink-0 w-full md:w-44">
                  <Image
                    src="/undraw_questions.svg"
                    alt="Facturation électronique"
                    width={176}
                    height={176}
                    className="w-full h-auto"
                  />
                </div>

                {/* Contenu explicatif */}
                <div className="flex-1 space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    À partir de{" "}
                    <span className="font-medium text-foreground">
                      septembre 2026
                    </span>
                    , toutes les entreprises françaises devront être en mesure
                    de recevoir des factures électroniques. L'émission
                    obligatoire pour les TPE/PME suivra en{" "}
                    <span className="font-medium text-foreground">
                      septembre 2027
                    </span>
                    .
                  </p>

                  <div className="space-y-2.5">
                    <p className="text-sm font-medium text-foreground">
                      Ce que Newbi fait pour vous
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <ArrowRight className="h-3.5 w-3.5 text-[#5b4eff] mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">
                          Conversion automatique au format{" "}
                          <span className="font-medium text-foreground">
                            Factur-X
                          </span>{" "}
                          (EN16931)
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="h-3.5 w-3.5 text-[#5b4eff] mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">
                          Transmission sécurisée via{" "}
                          <span className="font-medium text-foreground">
                            Chorus Pro
                          </span>{" "}
                          ou{" "}
                          <span className="font-medium text-foreground">
                            PEPPOL
                          </span>
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="h-3.5 w-3.5 text-[#5b4eff] mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">
                          Suivi en temps réel du statut de vos factures
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-border/40 mt-5 px-6 py-4 -mx-6">
              {!isConnected ? (
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <Checkbox
                    checked={dontShowAgain}
                    onCheckedChange={(v) => setDontShowAgain(v === true)}
                  />
                  <span className="text-xs text-muted-foreground">
                    Ne plus voir ce message
                  </span>
                </label>
              ) : (
                <span />
              )}

              {!isConnected ? (
                <Button
                  variant="primary"
                  onClick={handleConnect}
                  disabled={superPdpLoading || settingsLoading}
                  className="gap-2"
                >
                  {superPdpLoading ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    <>
                      Activer la facturation électronique
                      <kbd className="inline-flex items-center justify-center size-5 rounded bg-white/20 ml-0.5">
                        <CornerDownLeft className="size-3" />
                      </kbd>
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleClose}
                  className="gap-2"
                >
                  Fermer
                  <kbd className="inline-flex items-center justify-center size-5 rounded bg-white/20 ml-0.5">
                    <CornerDownLeft className="size-3" />
                  </kbd>
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
