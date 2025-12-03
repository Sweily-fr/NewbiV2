"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/src/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/src/components/ui/button";
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperTrigger,
} from "@/src/components/ui/stepper";

export function StripeConnectOnboardingModal({
  isOpen,
  onClose,
  currentStep = 1,
  onStartConfiguration,
  onVerifyIdentity,
  autoOpen = false,
}) {
  const [step, setStep] = useState(currentStep);
  const [internalOpen, setInternalOpen] = useState(isOpen);

  // Mettre à jour l'étape quand la prop change
  useEffect(() => {
    setStep(currentStep);
  }, [currentStep]);

  // Gérer l'ouverture automatique
  useEffect(() => {
    setInternalOpen(isOpen);
  }, [isOpen]);

  const handleClose = () => {
    setInternalOpen(false);
    onClose();
  };

  const steps = [1, 2];

  return (
    <Dialog open={internalOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-6">
        <VisuallyHidden>
          <DialogTitle>Configuration Stripe Connect - Étape {step}</DialogTitle>
        </VisuallyHidden>

        <div className="space-y-6">
          {/* Stepper */}
          <Stepper className="gap-1" value={step}>
            {steps.map((s) => (
              <StepperItem className="flex-1" key={s} step={s}>
                <StepperTrigger
                  asChild
                  className="w-full flex-col items-start gap-2"
                >
                  <StepperIndicator
                    asChild
                    className="h-1 w-full bg-border data-[state=active]:bg-[#635BFF] data-[state=complete]:bg-[#635BFF]"
                  >
                    <span className="sr-only">Étape {s}</span>
                  </StepperIndicator>
                </StepperTrigger>
              </StepperItem>
            ))}
          </Stepper>

          {/* Contenu selon l'étape */}
          {step === 1 ? (
            <>
              <div className="space-y-2 text-center">
                <h2 className="text-xl font-medium text-gray-900 dark:text-white">
                  Configuration Stripe Connect
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pour recevoir des paiements, nous devons collecter quelques
                  informations.
                </p>
              </div>

              <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <p className="font-medium">Informations requises :</p>
                <ul className="space-y-2 text-sm">
                  <li>• Nom et prénom</li>
                  <li>• Informations bancaires</li>
                  <li>• Numéro de téléphone</li>
                </ul>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Durée estimée : 2 minutes
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={onStartConfiguration}
                  className="w-full bg-[#635BFF] hover:bg-[#5A54E5] text-white"
                >
                  Continuer
                </Button>
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="w-full"
                >
                  Plus tard
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2 text-center">
                <h2 className="text-xl font-medium text-gray-900 dark:text-white">
                  Dernier effort...
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Vérifiez votre identité pour commencer à recevoir des
                  paiements.
                </p>
              </div>

              <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <p className="font-medium">Vérification d'identité :</p>
                <ul className="space-y-2 text-sm">
                  <li>• Pièce d'identité (carte d'identité ou passeport)</li>
                  <li>• Confirmation des informations bancaires</li>
                </ul>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Durée estimée : 1-2 minutes
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Cette vérification est obligatoire pour des raisons de
                  sécurité et de conformité légale.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={onVerifyIdentity}
                  className="w-full bg-[#635BFF] hover:bg-[#5A54E5] text-white"
                >
                  Vérifier mon identité
                </Button>
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="w-full"
                >
                  Plus tard
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
