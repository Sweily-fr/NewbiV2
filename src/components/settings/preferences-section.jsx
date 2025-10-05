"use client";

import React, { useState, useEffect } from "react";
import { Switch } from "@/src/components/ui/switch";
import { Button } from "@/src/components/ui/button";
import { ChevronDown, Plus, X } from "lucide-react";
import DarkModeComponent from "@/src/components/darkmode";
import { Separator } from "@/src/components/ui/separator";
import {
  IconReceipt,
  IconFileText,
  IconLayoutKanban,
  IconMail,
  IconFileUpload,
  IconCreditCard,
} from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { useSubscription } from "@/src/contexts/subscription-context";
import { Crown } from "lucide-react";
import { cn } from "@/src/lib/utils";

export function PreferencesSection() {
  const { isActive } = useSubscription();

  // État pour les préférences de cookies
  const [cookiePreferences, setCookiePreferences] = useState({
    strictementNecessaires: true, // Toujours activé
    fonctionnels: true,
    analyses: true,
    marketing: true,
  });

  // État pour le dropdown des cookies
  const [cookieDropdownOpen, setCookieDropdownOpen] = useState(false);

  // Charger les préférences de cookies depuis localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("cookiePreferences");
        if (saved) {
          setCookiePreferences(JSON.parse(saved));
        }
      } catch (error) {
        console.error("Erreur chargement préférences cookies:", error);
      }
    }
  }, []);

  // Sauvegarder les préférences de cookies dans localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "cookiePreferences",
          JSON.stringify(cookiePreferences)
        );
      } catch (error) {
        console.error("Erreur sauvegarde préférences cookies:", error);
      }
    }
  }, [cookiePreferences]);

  // Icon mapping for localStorage serialization
  const iconMap = {
    IconReceipt: IconReceipt,
    IconFileText: IconFileText,
    IconLayoutKanban: IconLayoutKanban,
    IconMail: IconMail,
    IconFileUpload: IconFileUpload,
    IconCreditCard: IconCreditCard,
  };

  // Available tools that can be selected as favorites
  const availableTools = [
    {
      name: "Factures",
      url: "/dashboard/outils/factures",
      icon: IconReceipt,
      iconName: "IconReceipt",
      isPro: true,
    },
    {
      name: "Devis",
      url: "/dashboard/outils/devis",
      icon: IconFileText,
      iconName: "IconFileText",
      isPro: true,
    },
    {
      name: "Kanban",
      url: "/dashboard/outils/kanban",
      icon: IconLayoutKanban,
      iconName: "IconLayoutKanban",
      isPro: false,
    },
    {
      name: "Signatures de mail",
      url: "/dashboard/outils/signatures-mail",
      icon: IconMail,
      iconName: "IconMail",
      isPro: false,
    },
    {
      name: "Transferts de fichiers",
      url: "/dashboard/outils/transferts-fichiers",
      icon: IconFileUpload,
      iconName: "IconFileUpload",
      isPro: true,
    },
    {
      name: "Dépenses",
      url: "/dashboard/outils/gestion-depenses",
      icon: IconCreditCard,
      iconName: "IconCreditCard",
      isPro: true,
    },
  ];

  // State for favorite apps (synchronized with sidebar)
  const [favoriteApps, setFavoriteApps] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load favorite apps from localStorage on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedApps = localStorage.getItem("newbi-pinned-apps");
        if (savedApps) {
          const parsedApps = JSON.parse(savedApps);
          // Restore icon components from iconName
          const validApps = parsedApps
            .filter((app) => app.name && app.url && app.iconName)
            .map((app) => ({
              ...app,
              icon: iconMap[app.iconName] || IconReceipt, // fallback icon
            }));
          setFavoriteApps(validApps);
        }
      } catch (error) {
        console.error("Error loading favorite apps from localStorage:", error);
      }
      setIsLoaded(true);
    }
  }, []);

  // Save favorite apps to localStorage whenever they change
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      try {
        // Serialize apps with iconName instead of icon component
        const appsToSave = favoriteApps.map((app) => ({
          name: app.name,
          url: app.url,
          iconName: app.iconName,
          isPro: app.isPro,
        }));
        localStorage.setItem("newbi-pinned-apps", JSON.stringify(appsToSave));
      } catch (error) {
        console.error("Error saving favorite apps to localStorage:", error);
      }
    }
  }, [favoriteApps, isLoaded]);

  // Filter out already selected apps
  const availableToSelect = availableTools.filter(
    (tool) => !favoriteApps.some((app) => app.url === tool.url)
  );

  const handleAddApp = (tool) => {
    if (favoriteApps.length < 3) {
      setFavoriteApps([...favoriteApps, tool]);
    }
  };

  const handleRemoveApp = (appUrl) => {
    setFavoriteApps(favoriteApps.filter((app) => app.url !== appUrl));
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

        {/* Paramètres des cookies */}
        <div className="space-y-10 mt-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium mb-1">
                Paramètres des cookies
              </h3>
              <p className="text-xs text-gray-400">
                Personnalisez les cookies. Pour en savoir plus, consultez notre{" "}
                <button
                  type="button"
                  className="text-gray-400 underline hover:text-gray-600 cursor-pointer"
                >
                  Politique en matière de cookies.
                </button>
              </p>
            </div>
            <DropdownMenu
              open={cookieDropdownOpen}
              onOpenChange={setCookieDropdownOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="ml-4 flex items-center gap-2"
                >
                  Personnaliser
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-4 rounded-xl">
                <div className="space-y-4">
                  {/* Strictement nécessaires */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium mb-1">
                        Strictement nécessaires
                      </h4>
                      <p className="text-xs text-gray-500">
                        Nécessaires au fonctionnement du site. Toujours activés.
                      </p>
                    </div>
                    <Switch
                      checked={true}
                      disabled={true}
                      className="flex-shrink-0 scale-65 data-[state=checked]:!bg-[#5b4eff]"
                    />
                  </div>

                  <Separator />

                  {/* Fonctionnels */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium mb-1">Fonctionnels</h4>
                      <p className="text-xs text-gray-500">
                        Servent à enregistrer votre sélection et offrir des
                        fonctionnalités avancées.
                      </p>
                    </div>
                    <Switch
                      checked={cookiePreferences.fonctionnels}
                      onCheckedChange={(checked) =>
                        setCookiePreferences((prev) => ({
                          ...prev,
                          fonctionnels: checked,
                        }))
                      }
                      className="flex-shrink-0 scale-65 data-[state=checked]:!bg-[#5b4eff]"
                    />
                  </div>

                  <Separator />

                  {/* Analyses */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium mb-1">Analyses</h4>
                      <p className="text-xs text-gray-500">
                        Servent à mesurer l'utilisation et à améliorer votre
                        expérience.
                      </p>
                    </div>
                    <Switch
                      checked={cookiePreferences.analyses}
                      onCheckedChange={(checked) =>
                        setCookiePreferences((prev) => ({
                          ...prev,
                          analyses: checked,
                        }))
                      }
                      className="flex-shrink-0 scale-65 data-[state=checked]:!bg-[#5b4eff]"
                    />
                  </div>

                  <Separator />

                  {/* Marketing */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium mb-1">Marketing</h4>
                      <p className="text-xs text-gray-500">
                        Servent à faire de la publicité ciblée.
                      </p>
                    </div>
                    <Switch
                      checked={cookiePreferences.marketing}
                      onCheckedChange={(checked) =>
                        setCookiePreferences((prev) => ({
                          ...prev,
                          marketing: checked,
                        }))
                      }
                      className="flex-shrink-0 scale-65 data-[state=checked]:!bg-[#5b4eff]"
                    />
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Section Apps préférées */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium mb-1">
                  Apps préférées dans la sidebar
                </h3>
                <p className="text-xs text-gray-400">
                  Choisissez jusqu'à 3 applications à afficher dans votre
                  sidebar "Mes apps"
                </p>
              </div>
            </div>

            {/* Liste des apps sélectionnées */}
            <div className="space-y-2">
              {favoriteApps.map((app) => {
                const hasAccess = !app.isPro || isActive();
                return (
                  <div
                    key={app.url}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 border rounded-lg",
                      !hasAccess && "opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <app.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{app.name}</span>
                      {!hasAccess && (
                        <Crown className="w-3 h-3 text-[#5b4fff]" />
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveApp(app.url)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}

              {/* Bouton pour ajouter une app */}
              {favoriteApps.length < 3 && availableToSelect.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start gap-2 h-12 border-dashed cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      Ajouter une application ({favoriteApps.length}/3)
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="start">
                    {availableToSelect.map((tool) => {
                      const hasAccess = !tool.isPro || isActive();
                      return (
                        <DropdownMenuItem
                          key={tool.name}
                          onClick={
                            hasAccess ? () => handleAddApp(tool) : undefined
                          }
                          className={cn(
                            "cursor-pointer",
                            !hasAccess && "opacity-60 cursor-not-allowed"
                          )}
                        >
                          <tool.icon className="h-4 w-4 mr-2" />
                          <span>{tool.name}</span>
                          {!hasAccess && (
                            <Crown className="w-3 h-3 ml-auto text-[#5b4fff]" />
                          )}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {favoriteApps.length >= 3 && (
                <div className="text-xs text-gray-400 text-center py-2">
                  Maximum 3 applications sélectionnées
                </div>
              )}
            </div>
          </div>

          {/* Afficher l'historique de mes vues */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium mb-1">
                Afficher l'historique de mes vues
              </h3>
              <p className="text-xs text-gray-400">
                Les personnes disposant d'un accès complet ou d'un accès en
                écriture pourront voir quand vous avez consulté une page.{" "}
                <button className="text-gray-400 underline hover:text-gray-600">
                  En savoir plus.
                </button>
              </p>
            </div>
            <Switch
              defaultChecked={true}
              className="ml-4 flex-shrink-0 scale-75 data-[state=checked]:!bg-[#5b4eff]"
            />
          </div>

          {/* Visibilité du profil */}
          {/* <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium mb-1">Visibilité du profil</h3>
              <p className="text-xs text-gray-400">
                Les utilisateurs qui utilisent votre adresse e-mail pour vous
                inviter à un nouvel espace de travail pourront voir votre nom et
                votre photo de profil.{" "}
                <button className="text-gray-400 underline hover:text-gray-600 cursor-pointer">
                  En savoir plus..
                </button>
              </p>
            </div>
            <Switch
              defaultChecked={true}
              className="ml-4 flex-shrink-0 scale-75 data-[state=checked]:!bg-[#5b4eff]"
            />
          </div> */}
        </div>
      </div>
    </div>
  );
}

export default PreferencesSection;
