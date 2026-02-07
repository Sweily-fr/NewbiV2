"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import DarkModeComponent from "@/src/components/darkmode";
import { Separator } from "@/src/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useSession, updateUser } from "@/src/lib/auth-client";
import { toast } from "@/src/components/ui/sonner";
import { useTutorial } from "@/src/contexts/tutorial-context";

export function PreferencesSection() {
  const { data: session, refetch: refetchSession } = useSession();
  const {
    resetTutorial,
    hasCompletedTutorial,
    isLoading: tutorialLoading,
  } = useTutorial();

  // État pour la page de démarrage
  const [startupPage, setStartupPage] = useState(
    session?.user?.redirect_after_login || "dashboard"
  );

  // Synchroniser startupPage avec redirect_after_login de l'utilisateur
  useEffect(() => {
    if (session?.user?.redirect_after_login) {
      setStartupPage(session.user.redirect_after_login);
    }
  }, [session]);

  // Fonction pour sauvegarder la page de démarrage
  const handleStartupPageChange = async (value) => {
    try {
      // Mettre à jour l'état local immédiatement
      setStartupPage(value);

      // Sauvegarder dans la base de données
      await updateUser(
        { redirect_after_login: value },
        {
          onSuccess: () => {
            toast.success("Page de démarrage mise à jour");
            refetchSession();
          },
          onError: (error) => {
            console.error("Erreur mise à jour page de démarrage:", error);
            toast.error("Erreur lors de la mise à jour");
            // Revenir à l'ancienne valeur en cas d'erreur
            setStartupPage(session?.user?.redirect_after_login || "dashboard");
          },
        }
      );
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  return (
    <div className="space-y-8">
      {/* Confidentialité */}
      <div>
        <h2 className="text-lg font-medium mb-1">Préférences</h2>
        <Separator />
        {/* Dark Mode Component */}
        <div className="mb-8 mt-12">
          <DarkModeComponent />
        </div>

        <Separator />

        <div className="space-y-10 mt-8">
          {/* Section Ouverture au démarrage */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-normal mb-1">Page de démarrage</h3>
              <p className="text-xs text-gray-400">
                Choisissez ce qui doit être affiché lorsque Newbi démarre
              </p>
            </div>
            <Select
              value={startupPage}
              size="sm"
              onValueChange={handleStartupPageChange}
            >
              <SelectTrigger className="w-40 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="dashboard">Tableau de bord</SelectItem>
                <SelectItem value="kanban">Tâches</SelectItem>
                <SelectItem value="calendar">Calendrier</SelectItem>
                <SelectItem value="factures">Factures</SelectItem>
                <SelectItem value="devis">Devis</SelectItem>
                <SelectItem value="clients">Clients</SelectItem>
                <SelectItem value="transactions">Transactions</SelectItem>
                <SelectItem value="signatures">Signatures mail</SelectItem>
                <SelectItem value="transferts">
                  Transferts de fichiers
                </SelectItem>
                <SelectItem value="documents-partages">Documents partagés</SelectItem>
                <SelectItem value="catalogues">Catalogues</SelectItem>
                <SelectItem value="collaborateurs">Collaborateurs</SelectItem>
                <SelectItem value="last-page">Dernière page visitée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tutoriel interactif */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-normal mb-1">Tutoriel interactif</h3>
              <p className="text-xs text-gray-400">
                Relancez le tutoriel pour découvrir les fonctionnalités de Newbi
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetTutorial}
              disabled={tutorialLoading}
              className="ml-4 flex-shrink-0 font-normal cursor-pointer"
            >
              {tutorialLoading ? "Chargement..." : "Relancer le tutoriel"}
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default PreferencesSection;
