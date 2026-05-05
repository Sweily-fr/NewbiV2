"use client";

import { useTutorial } from "@/src/contexts/tutorial-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Sparkles } from "lucide-react";

export function TutorialOverlay() {
  const { isRunning, completeTutorial, isLoading } = useTutorial();

  if (isLoading || !isRunning) return null;

  return (
    <Dialog open={isRunning} onOpenChange={() => completeTutorial()}>
      <DialogContent className="sm:max-w-[480px] p-1 gap-0 top-[40%] border-0 bg-[#efefef] dark:bg-[#1a1a1a] overflow-hidden rounded-2xl">
        <div className="bg-background rounded-xl overflow-hidden ring-1 ring-black/[0.07] dark:ring-white/[0.1]">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle className="text-lg font-medium flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#5A50FF]/10">
                <Sparkles className="size-4 text-[#5A50FF]" />
              </div>
              Bienvenue sur Newbi
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 pt-4 pb-0">
            <p className="text-[14px] text-muted-foreground leading-relaxed">
              Votre espace de travail est prêt. Tout est en place pour gérer
              votre facturation, suivre votre trésorerie et piloter votre
              activité.
            </p>

            <div className="mt-5 space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-1 h-1 rounded-full bg-foreground/30 mt-2 shrink-0" />
                <p className="text-[13px] text-foreground/70">
                  Utilisez le{" "}
                  <span className="text-foreground font-medium">
                    menu latéral
                  </span>{" "}
                  pour naviguer entre vos outils
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-1 h-1 rounded-full bg-foreground/30 mt-2 shrink-0" />
                <p className="text-[13px] text-foreground/70">
                  Créez votre première{" "}
                  <span className="text-foreground font-medium">
                    facture ou devis
                  </span>{" "}
                  en quelques clics
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-1 h-1 rounded-full bg-foreground/30 mt-2 shrink-0" />
                <p className="text-[13px] text-foreground/70">
                  Connectez votre{" "}
                  <span className="text-foreground font-medium">
                    compte bancaire
                  </span>{" "}
                  pour synchroniser vos transactions
                </p>
              </div>
            </div>

            <div className="flex justify-end border-t border-border/40 mt-6 px-6 py-4 -mx-6">
              <Button
                variant="primary"
                onClick={() => completeTutorial()}
                className="gap-2 cursor-pointer"
              >
                Commencer
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
