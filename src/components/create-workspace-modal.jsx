"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronLeft, Lightbulb, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/src/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { authClient } from "@/src/lib/auth-client";
import { toast } from "@/src/components/ui/sonner";
import MultipleSelector from "@/src/components/ui/multiselect";
import { getAssetUrl } from "@/src/lib/image-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import { Callout } from "@/src/components/ui/callout";

export function CreateWorkspaceModal({ open, onOpenChange, onSuccess }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [workspaceType, setWorkspaceType] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [invitedEmails, setInvitedEmails] = useState([]);
  const [membersWithRoles, setMembersWithRoles] = useState([]);
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
      setMembersWithRoles([]);
    }
    onOpenChange(isOpen);
  };

  // Quand on ajoute des emails, les ajouter à la liste avec un rôle par défaut
  const handleEmailsChange = (emails) => {
    setInvitedEmails(emails);

    // Ajouter les nouveaux emails à la liste avec rôle par défaut
    const newMembers = emails.map((email) => {
      const existingMember = membersWithRoles.find(
        (m) => m.email === (email.value || email.label)
      );
      return (
        existingMember || {
          email: email.value || email.label,
          role: "member",
        }
      );
    });

    setMembersWithRoles(newMembers);
  };

  // Changer le rôle d'un membre
  const handleRoleChange = (email, newRole) => {
    setMembersWithRoles((prev) =>
      prev.map((member) =>
        member.email === email ? { ...member, role: newRole } : member
      )
    );
  };

  // Supprimer un membre
  const handleRemoveMember = (emailToRemove) => {
    setInvitedEmails((prev) =>
      prev.filter((e) => (e.value || e.label) !== emailToRemove)
    );
    setMembersWithRoles((prev) =>
      prev.filter((m) => m.email !== emailToRemove)
    );
  };

  // Fonction pour obtenir le label du rôle
  const getRoleLabel = (role) => {
    switch (role) {
      case "admin":
        return "Administrateur";
      case "member":
        return "Membre";
      case "guest":
        return "Invité";
      case "accountant":
        return "Comptable";
      case "owner":
        return "Propriétaire";
      default:
        return role;
    }
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

      // Préparer les données de l'organisation avec les rôles
      const invitedMembersWithRoles = membersWithRoles.map((member) => ({
        email: member.email,
        role: member.role,
      }));

      // Stocker les données dans sessionStorage pour les récupérer après paiement
      const orgData = {
        name: workspaceName,
        type: workspaceType,
        invitedMembers: invitedMembersWithRoles, // Utiliser invitedMembers au lieu de invitedEmails
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
        className="max-h-[90vh] md:max-h-[90vh] p-0 gap-0 overflow-hidden bg-white dark:bg-[#171717] dark:border-gray-800 w-[95vw] sm:w-full"
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
        <div className="absolute top-4 sm:top-5 left-4 z-10">
          <img
            src={getAssetUrl("NewbiLogo.svg")}
            alt="Logo Newbi"
            className="h-4 sm:h-5 w-16 sm:w-20"
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
          className={`min-h-[500px] sm:min-h-[600px] flex flex-col px-6 sm:px-16 md:px-32 py-12 sm:py-16 w-full max-w-4xl mx-auto ${
            currentStep === 1
              ? "items-center justify-center"
              : "items-start justify-center"
          }`}
        >
          {/* Étape 1: Information sur l'abonnement */}
          {currentStep === 1 && (
            <div className="w-full max-w-xl text-center space-y-4 sm:space-y-6">
              <div className="space-y-2 sm:space-y-3">
                <h2 className="text-xl sm:text-2xl font-medium text-gray-900 dark:text-white px-4">
                  Créer une nouvelle organisation
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed px-4">
                  La création d'une nouvelle organisation nécessite un nouvel
                  abonnement.
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-center">
                  <div className="inline-block bg-[#5a50ff]/10 dark:bg-[#5a50ff]/20 text-[#5a50ff] dark:text-[#8b7fff] px-3 py-1 rounded-full text-xs font-medium">
                    -25%
                  </div>
                </div>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white">
                    10,79€
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    TTC/mois
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 px-4">
                  *Chaque organisation dispose de son propre abonnement et de
                  ses propres paramètres
                </p>
              </div>

              <Button
                onClick={handleNext}
                className="gap-2 px-6 py-2.5 text-sm font-normal cursor-pointer bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 w-full sm:w-auto"
              >
                Commencer
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Étape 2: Type d'espace de travail */}
          {currentStep === 2 && (
            <div className="w-full space-y-6 sm:space-y-8">
              <h2 className="text-xl sm:text-2xl font-medium text-gray-900 dark:text-white">
                À quoi servira cet espace de travail ?
              </h2>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setWorkspaceType("work")}
                  className={`px-6 sm:px-8 py-3 rounded-lg text-sm font-medium transition-all ${
                    workspaceType === "work"
                      ? "bg-black dark:bg-white text-white dark:text-black"
                      : "bg-white dark:bg-[#000] text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-[#171717] hover:border-gray-400 dark:hover:border-gray-600"
                  }`}
                >
                  Travail
                </button>

                <button
                  onClick={() => setWorkspaceType("personal")}
                  className={`px-6 sm:px-8 py-3 rounded-lg text-sm font-medium transition-all ${
                    workspaceType === "personal"
                      ? "bg-black dark:bg-white text-white dark:text-black"
                      : "bg-white dark:bg-[#000] text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-[#171717] hover:border-gray-400 dark:hover:border-gray-600"
                  }`}
                >
                  Personnel
                </button>
              </div>
            </div>
          )}

          {/* Étape 3: Inviter des personnes */}
          {currentStep === 3 && (
            <div className="w-full space-y-4 sm:space-y-6">
              <h2 className="text-xl sm:text-2xl font-medium text-gray-900 dark:text-white">
                Invitez des personnes dans votre espace :
              </h2>

              <div className="space-y-3">
                <MultipleSelector
                  value={invitedEmails}
                  onChange={handleEmailsChange}
                  placeholder="Entrez des adresses email"
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

              {/* Callout pour la facturation */}
              {membersWithRoles.length > 0 && (
                <Callout type="neutral" noMargin>
                  <p className="text-xs">
                    <span className="font-medium">Facturation :</span> L'ajout
                    d'un membre (admin, membre ou invité) est facturé{" "}
                    <span className="font-medium">7,49€/mois</span> en plus de
                    votre abonnement. Un seul{" "}
                    <span className="font-medium">comptable gratuit</span> par
                    organisation est autorisé.
                  </p>
                </Callout>
              )}

              {/* Liste des membres ajoutés avec sélection de rôle */}
              {membersWithRoles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Membres à inviter ({membersWithRoles.length})
                  </p>
                  <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto dark:border-gray-700">
                    {membersWithRoles.map((member) => (
                      <div
                        key={member.email}
                        className="flex items-center justify-between p-3 hover:bg-muted/50 dark:hover:bg-gray-800/50"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-[#5b4fff]/10 text-[#5b4fff] text-xs">
                              {member.email[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm dark:text-gray-200">
                            {member.email}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Select
                            value={member.role}
                            onValueChange={(newRole) =>
                              handleRoleChange(member.email, newRole)
                            }
                          >
                            <SelectTrigger className="w-[180px] h-8 text-xs border-none shadow-none hover:bg-muted dark:hover:bg-gray-800">
                              <SelectValue>
                                {getRoleLabel(member.role)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">
                                <div className="flex flex-col">
                                  <span className="font-normal text-sm">
                                    Administrateur
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Gestion complète
                                  </span>
                                </div>
                              </SelectItem>
                              <SelectItem value="member">
                                <div className="flex flex-col">
                                  <span className="font-normal text-sm">
                                    Membre
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Accès standard
                                  </span>
                                </div>
                              </SelectItem>
                              <SelectItem value="guest">
                                <div className="flex flex-col">
                                  <span className="font-normal text-sm">
                                    Invité
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Accès limité
                                  </span>
                                </div>
                              </SelectItem>
                              <SelectItem value="accountant">
                                <div className="flex flex-col">
                                  <span className="font-normal text-sm">
                                    Comptable
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Accès comptabilité
                                  </span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.email)}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground dark:text-gray-400">
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
            <div className="w-full space-y-4 sm:space-y-6">
              <h2 className="text-xl sm:text-2xl font-medium text-gray-900 dark:text-white">
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
                <p className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400">
                  Essayez le nom de votre entreprise ou organisation.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer avec boutons minimalistes */}
        {currentStep !== 1 && (
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
        )}
      </DialogContent>
    </Dialog>
  );
}
