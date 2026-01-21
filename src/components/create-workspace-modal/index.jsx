"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/src/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/src/components/ui/button";
import { getAssetUrl } from "@/src/lib/image-utils";

// Import des étapes
import { PlanSelectionStep } from "./steps/PlanSelectionStep";
import { WorkspaceTypeStep } from "./steps/WorkspaceTypeStep";
import { InviteMembersStep } from "./steps/InviteMembersStep";
import { WorkspaceNameStep } from "./steps/WorkspaceNameStep";

// Import du hook
import { useCreateWorkspace } from "./hooks/useCreateWorkspace";

export function CreateWorkspaceModal({ open, onOpenChange, onSuccess }) {
  // États
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [isAnnual, setIsAnnual] = useState(false);
  const [workspaceType, setWorkspaceType] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [invitedEmails, setInvitedEmails] = useState([]);
  const [membersWithRoles, setMembersWithRoles] = useState([]);

  const totalSteps = 4;
  const { createWorkspace, isCreating } = useCreateWorkspace();

  // Réinitialiser le modal
  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      setCurrentStep(1);
      setSelectedPlan("");
      setIsAnnual(false);
      setWorkspaceType("");
      setWorkspaceName("");
      setInvitedEmails([]);
      setMembersWithRoles([]);
    }
    onOpenChange(isOpen);
  };

  // Gestion des emails
  const handleEmailsChange = (newEmails) => {
    setInvitedEmails(newEmails);
    const newMembers = newEmails.map((email) => ({
      ...email,
      role:
        membersWithRoles.find((m) => m.value === email.value)?.role || "member",
    }));
    setMembersWithRoles(newMembers);
  };

  // Gestion des rôles
  const handleRoleChange = (index, newRole) => {
    const updatedMembers = [...membersWithRoles];
    updatedMembers[index].role = newRole;
    setMembersWithRoles(updatedMembers);
  };

  // Navigation
  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Création du workspace
  const handleCreateWorkspace = async () => {
    await createWorkspace({
      workspaceName,
      workspaceType,
      selectedPlan,
      isAnnual,
      membersWithRoles,
      onSuccess,
    });
  };

  // Calculer la progression
  const progress = (currentStep / totalSteps) * 100;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="p-0 gap-0 overflow-hidden bg-white dark:bg-[#171717] dark:border-gray-800 w-[95vw] sm:w-full"
        style={{ maxWidth: "68rem", height: "90vh", maxHeight: "900px" }}
      >
        <VisuallyHidden>
          <DialogTitle>Créer un espace de travail</DialogTitle>
        </VisuallyHidden>

        {/* Fond avec dégradé */}
        <div className="absolute inset-0 bg-white dark:bg-[#171717] -z-10" />
        <div
          className="absolute top-0 left-0 right-0 h-[400px] -z-10 dark:hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(90, 80, 255, 0.06) 0%, rgba(147, 51, 234, 0.04) 30%, rgba(236, 72, 153, 0.02) 60%, rgba(255, 255, 255, 0) 100%)",
          }}
        />

        {/* Logo */}
        <div className="absolute top-4 sm:top-5 left-4 sm:left-6 z-10">
          <img
            src={getAssetUrl("NewbiLogo.svg")}
            alt="Logo Newbi"
            className="h-5 sm:h-6 w-auto"
          />
        </div>

        {/* Barre de progression */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-800">
          <div
            className="h-full bg-black dark:bg-white transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Contenu */}
        <div className="h-full flex flex-col items-center justify-center px-6 sm:px-6 md:px-6 pt-16 sm:pt-20 pb-28 w-full mx-auto overflow-y-auto">
          {currentStep === 1 && (
            <PlanSelectionStep
              selectedPlan={selectedPlan}
              isAnnual={isAnnual}
              onPlanSelect={setSelectedPlan}
              onAnnualToggle={setIsAnnual}
            />
          )}

          {currentStep === 2 && (
            <WorkspaceTypeStep
              workspaceType={workspaceType}
              onTypeSelect={setWorkspaceType}
            />
          )}

          {currentStep === 3 && (
            <InviteMembersStep
              invitedEmails={invitedEmails}
              membersWithRoles={membersWithRoles}
              onEmailsChange={handleEmailsChange}
              onRoleChange={handleRoleChange}
              selectedPlan={selectedPlan}
            />
          )}

          {currentStep === 4 && (
            <WorkspaceNameStep
              workspaceName={workspaceName}
              onNameChange={setWorkspaceName}
            />
          )}
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 sm:bottom-8 left-4 sm:left-8 right-4 sm:right-8 flex items-center justify-between gap-2">
          {currentStep > 1 ? (
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={isCreating}
              className="gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-normal cursor-pointer text-xs sm:text-sm px-3 sm:px-4"
            >
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Retour</span>
            </Button>
          ) : (
            <div />
          )}

          <Button
            onClick={
              currentStep === totalSteps ? handleCreateWorkspace : handleNext
            }
            disabled={
              (currentStep === 1 && !selectedPlan) ||
              (currentStep === 2 && !workspaceType) ||
              (currentStep === 4 && !workspaceName.trim()) ||
              isCreating
            }
            className="gap-1 px-4 sm:px-6 font-normal cursor-pointer bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 text-xs sm:text-sm"
          >
            {currentStep === totalSteps ? "Créer l'espace" : "Suivant"}
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
