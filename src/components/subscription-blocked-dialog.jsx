"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";
import { toast } from "@/src/components/ui/sonner";

const EVENT_NAME = "subscription-blocked";

/**
 * Dispatch this event from anywhere (e.g. Apollo errorLink) to show the dialog.
 */
export function triggerSubscriptionBlockedDialog() {
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

/**
 * Dialog shown when a write action is blocked because the subscription is inactive.
 * Listens for the "subscription-blocked" custom event.
 * Must be mounted once in the app layout (e.g. dashboard-client-layout).
 */
export function SubscriptionBlockedDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { isOwner } = useSubscriptionAccess();

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  const handleRenew = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/billing-portal", {
        method: "POST",
      });
      const data = await response.json();
      if (data.url) {
        window.open(data.url, "_blank");
        setOpen(false);
      } else {
        toast.error("Impossible d'ouvrir le portail de facturation");
      }
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[420px] p-1 gap-0 top-[40%] border-0 bg-[#efefef] dark:bg-[#1a1a1a] overflow-hidden rounded-2xl">
        <div className="bg-background rounded-xl overflow-hidden ring-1 ring-black/[0.07] dark:ring-white/[0.1]">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="size-4 text-red-500" />
              Action non disponible
            </DialogTitle>
          </DialogHeader>

          <div className="px-5 pb-5">
            <p className="text-[13px] text-muted-foreground leading-relaxed mb-5">
              {isOwner
                ? "Votre abonnement est inactif. Renouvelez-le pour retrouver l'accès complet à votre espace de travail."
                : "L'abonnement de cet espace est inactif. Contactez l'administrateur pour le renouveler."}
            </p>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="cursor-pointer bg-background"
              >
                Fermer
              </Button>
              {isOwner && (
                <Button
                  variant="primary"
                  onClick={handleRenew}
                  disabled={isLoading}
                  className="cursor-pointer gap-2"
                >
                  {isLoading ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : null}
                  Renouveler l'abonnement
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
