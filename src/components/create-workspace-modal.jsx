"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronLeft, Lightbulb } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/src/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { authClient } from "@/src/lib/auth-client";
import { toast } from "@/src/components/ui/sonner";
import MultipleSelector from "@/src/components/ui/multiselect";
import { getAssetUrl } from "@/src/lib/image-utils";

export function CreateWorkspaceModal({ open, onOpenChange, onSuccess }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [workspaceType, setWorkspaceType] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [invitedEmails, setInvitedEmails] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  // Récupérer la session utilisateur
  const { data: session } = authClient.useSession();

  const totalSteps = 4;

  // Réinitialiser le modal quand il se ferme
  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      setCurrentStep(1);
      setWorkspaceType("");
      setWorkspaceName("");
      setInvitedEmails([]);
    }
    onOpenChange(isOpen);
  };

  // Passer à l'étape suivante
  const handleNext = () => {
    if (currentStep === 2 && !workspaceType) {
      toast.error("Veuillez sélectionner un type d'espace de travail");
      return;
    }
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Revenir à l'étape précédente
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Créer l'espace de travail
  const handleCreateWorkspace = async () => {
    let newOrgId = null;

    try {
      setIsCreating(true);

      // Vérifier la session
      if (!session?.user?.id) {
        toast.error("Session expirée, veuillez vous reconnecter");
        return;
      }

      // Préparer les données de l'organisation
      const invitedEmailsList = invitedEmails.map((e) => e.value || e.label);

      // Stocker les données dans sessionStorage pour les récupérer après paiement
      const orgData = {
        name: workspaceName,
        type: workspaceType,
        invitedEmails: invitedEmailsList,
        userId: session.user.id,
      };

      sessionStorage.setItem("pending_org_creation", JSON.stringify(orgData));
      console.log(
        "💾 [MODAL] Données organisation sauvegardées pour après paiement"
      );

      // Créer la session Stripe SANS créer l'organisation
      console.log("🔄 [MODAL] Création session Stripe...");
      const response = await fetch("/api/create-org-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationData: orgData, // Passer les données pour le webhook
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        sessionStorage.removeItem("pending_org_creation");
        throw new Error(
          errorData.error || "Erreur lors de la création du checkout"
        );
      }

      const { url } = await response.json();

      // Rediriger vers Stripe Checkout
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Erreur création workspace:", error);
      toast.error(error.message || "Erreur lors de la création");
      sessionStorage.removeItem("pending_org_creation");
    } finally {
      setIsCreating(false);
    }
  };

  // Calculer la progression
  const progress = (currentStep / totalSteps) * 100;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90vh] md:max-h-[90vh] p-0 gap-0 overflow-hidden bg-white dark:bg-[#171717] dark:border-gray-800"
        style={{ maxWidth: "58rem" }}
      >
        <VisuallyHidden>
          <DialogTitle>Créer un espace de travail</DialogTitle>
        </VisuallyHidden>

        {/* Fond avec dégradé de couleur en haut */}
        <div className="absolute inset-0 bg-white dark:bg-[#171717] -z-10" />
        <div
          className="absolute top-0 left-0 right-0 h-[400px] -z-10 dark:hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(90, 80, 255, 0.06) 0%, rgba(147, 51, 234, 0.04) 30%, rgba(236, 72, 153, 0.02) 60%, rgba(255, 255, 255, 0) 100%)",
          }}
        />

        {/* Logo en haut à gauche */}
        <div className="absolute top-5 left-4 z-10">
          <img
            src={getAssetUrl("NewbiLogo.svg")}
            alt="Logo Newbi"
            className="h-5 w-20"
          />
        </div>

        {/* Barre de progression minimaliste */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-800">
          <div
            className="h-full bg-black dark:bg-white transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Contenu du modal */}
        <div
          className={`min-h-[600px] flex flex-col px-32 py-16 w-full max-w-4xl mx-auto ${
            currentStep === 1
              ? "items-center justify-center"
              : "items-start justify-center"
          }`}
        >
          {/* Étape 1: Information sur l'abonnement */}
          {currentStep === 1 && (
            <div className="w-full max-w-xl text-center space-y-6">
              <div className="space-y-3">
                <h2 className="text-2xl font-medium text-gray-900 dark:text-white">
                  Créer une nouvelle organisation
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  La création d'une nouvelle organisation nécessite un nouvel
                  abonnement.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="inline-block bg-[#5a50ff]/10 dark:bg-[#5a50ff]/20 text-[#5a50ff] dark:text-[#8b7fff] px-3 py-1 rounded-full text-xs font-medium">
                    -25%
                  </div>
                </div>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-semibold text-gray-900 dark:text-white">
                    11,24€
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    HT/mois
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  *Chaque organisation dispose de son propre abonnement et de
                  ses propres paramètres
                </p>
              </div>

              <Button
                onClick={handleNext}
                className="gap-2 px-6 py-2.5 text-sm font-normal cursor-pointer bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              >
                Commencer
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Étape 2: Type d'espace de travail */}
          {currentStep === 2 && (
            <div className="w-full space-y-8">
              <h2 className="text-2xl font-medium text-gray-900 dark:text-white">
                À quoi servira cet espace de travail ?
              </h2>

              <div className="flex gap-3">
                <button
                  onClick={() => setWorkspaceType("work")}
                  className={`px-8 py-3 rounded-lg text-sm font-medium transition-all ${
                    workspaceType === "work"
                      ? "bg-black dark:bg-white text-white dark:text-black"
                      : "bg-white dark:bg-[#000] text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-[#171717] hover:border-gray-400 dark:hover:border-gray-600"
                  }`}
                >
                  Travail
                </button>

                <button
                  onClick={() => setWorkspaceType("personal")}
                  className={`px-8 py-3 rounded-lg text-sm font-medium transition-all ${
                    workspaceType === "personal"
                      ? "bg-black dark:bg-white text-white dark:text-black"
                      : "bg-white dark:bg-[#000] text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-[#171717] hover:border-gray-400 dark:hover:border-gray-600"
                  }`}
                >
                  Personnel
                </button>

                {/* <button
                  onClick={() => setWorkspaceType("school")}
                  className={`px-8 py-3 rounded-lg text-sm font-medium transition-all ${
                    workspaceType === "school"
                      ? "bg-black text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:border-gray-400"
                  }`}
                >
                  École
                </button> */}
              </div>
            </div>
          )}

          {/* Étape 3: Inviter des personnes */}
          {currentStep === 3 && (
            <div className="w-full space-y-6">
              <h2 className="text-2xl font-medium text-gray-900 dark:text-white">
                Invitez des personnes dans votre espace :
              </h2>

              <div className="space-y-3">
                <MultipleSelector
                  value={invitedEmails}
                  onChange={setInvitedEmails}
                  placeholder="Entrez des adresses email (ou collez-en plusieurs)"
                  creatable
                  hidePlaceholderWhenSelected
                  emptyIndicator={
                    <p className="text-center text-sm text-muted-foreground">
                      Aucun résultat trouvé
                    </p>
                  }
                  className="w-full"
                />
              </div>

              <div className="flex items-start gap-2 text-sm text-muted-foreground dark:text-gray-400">
                <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600 dark:text-green-500" />
                <p>
                  Ne travaillez pas seul - Invitez votre équipe pour commencer
                  200% plus vite.
                </p>
              </div>
            </div>
          )}

          {/* Étape 4: Nommer l'espace de travail */}
          {currentStep === 4 && (
            <div className="w-full space-y-6">
              <h2 className="text-2xl font-medium text-gray-900 dark:text-white">
                Enfin, comment souhaitez-vous nommer votre espace ?
              </h2>

              <div className="space-y-3">
                <Input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="Newbi"
                  className="w-full text-base px-4 dark:bg-[#171717] dark:text-white dark:border-gray-700"
                  autoFocus
                />
                <p className="text-sm text-muted-foreground dark:text-gray-400">
                  Essayez le nom de votre entreprise ou organisation.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer avec boutons minimalistes */}
        {currentStep !== 1 && (
          <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between">
            {currentStep > 1 ? (
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={isCreating}
                className="gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-normal cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Retour
              </Button>
            ) : (
              <div />
            )}

            <Button
              onClick={
                currentStep === totalSteps ? handleCreateWorkspace : handleNext
              }
              disabled={
                (currentStep === 2 && !workspaceType) ||
                (currentStep === 4 && !workspaceName.trim()) ||
                isCreating
              }
              className="gap-1 px-6 font-normal cursor-pointer bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
            >
              {currentStep === totalSteps ? "Créer l'espace" : "Suivant"}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
