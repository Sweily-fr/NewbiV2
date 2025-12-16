"use client";

import React, { useState, useEffect } from "react";
import { Switch } from "@/src/components/ui/switch";
import { Button } from "@/src/components/ui/button";
import { ChevronDown, Plus, X, Mail, Clock, Send } from "lucide-react";
import DarkModeComponent from "@/src/components/darkmode";
import { Separator } from "@/src/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
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
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import { Crown } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useSession, updateUser } from "@/src/lib/auth-client";
import { toast } from "@/src/components/ui/sonner";
import { useEmailPreferences } from "@/src/hooks/useEmailPreferences";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";

export function PreferencesSection() {
  const { isActive } = useSubscription();
  const { data: session, refetch: refetchSession } = useSession();

  // État pour les préférences de cookies
  const [cookiePreferences, setCookiePreferences] = useState({
    strictementNecessaires: true, // Toujours activé
    fonctionnels: true,
    analyses: true,
    marketing: true,
  });

  // État pour le dropdown des cookies
  const [cookieDropdownOpen, setCookieDropdownOpen] = useState(false);

  // États pour les rappels email
  const {
    preferences,
    loading: emailLoading,
    updating,
    sendingTest,
    updatePreferences,
    sendTestEmail,
  } = useEmailPreferences();
  const [emailDropdownOpen, setEmailDropdownOpen] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [emailTypes, setEmailTypes] = useState(["due", "anticipated"]);
  const [doNotDisturb, setDoNotDisturb] = useState({
    weekday: { start: "22:00", end: "08:00" },
    weekend: { start: "22:00", end: "10:00" },
  });

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

  // Charger les préférences email
  useEffect(() => {
    if (preferences) {
      setEmailEnabled(preferences.enabled || false);
      setEmailTypes(preferences.types || ["due", "anticipated"]);
      setDoNotDisturb(
        preferences.doNotDisturb || {
          weekday: { start: "22:00", end: "08:00" },
          weekend: { start: "22:00", end: "10:00" },
        }
      );
    }
  }, [preferences]);

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
      name: "Transactions",
      url: "/dashboard/outils/transactions",
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

  // Fonctions pour les rappels email
  const handleEmailSave = async () => {
    await updatePreferences({
      enabled: emailEnabled,
      types: emailTypes,
      doNotDisturb,
    });
  };

  const handleEmailTypeChange = (type, checked) => {
    if (checked) {
      setEmailTypes([...emailTypes, type]);
    } else {
      setEmailTypes(emailTypes.filter((t) => t !== type));
    }
  };

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

        {/* Paramètres des cookies */}
        <div className="space-y-10 mt-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-normal mb-1">
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
                  className="ml-4 flex font-normal items-center gap-2"
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
                      <h4 className="text-sm font-normal mb-1">
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
                      <h4 className="text-sm font-normal mb-1">Fonctionnels</h4>
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
                      <h4 className="text-sm font-normal mb-1">Analyses</h4>
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
                      <h4 className="text-sm font-normal mb-1">Marketing</h4>
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
                <SelectItem value="kanban">Kanban</SelectItem>
                <SelectItem value="calendar">Calendrier</SelectItem>
                <SelectItem value="factures">Factures</SelectItem>
                <SelectItem value="devis">Devis</SelectItem>
                <SelectItem value="clients">Clients</SelectItem>
                <SelectItem value="depenses">Gestion des dépenses</SelectItem>
                <SelectItem value="signatures">Signatures mail</SelectItem>
                <SelectItem value="transferts">
                  Transferts de fichiers
                </SelectItem>
                <SelectItem value="catalogues">Catalogues</SelectItem>
                <SelectItem value="collaborateurs">Collaborateurs</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
                <SelectItem value="favoris">Favoris</SelectItem>
                <SelectItem value="last-page">Dernière page visitée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Section Rappels par email */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-normal mb-1">Rappels par email</h3>
              <p className="text-xs text-gray-400">
                Recevez des emails de rappel pour vos tâches importantes
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={emailEnabled}
                onCheckedChange={setEmailEnabled}
                className="scale-75 data-[state=checked]:!bg-[#5b4eff]"
              />
              {emailEnabled && (
                <DropdownMenu
                  open={emailDropdownOpen}
                  onOpenChange={setEmailDropdownOpen}
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="ml-2 flex font-normal items-center gap-2"
                    >
                      Personnaliser
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-96 p-4 rounded-xl"
                  >
                    <div className="space-y-4">
                      {/* Types de rappels */}
                      <div>
                        <h4 className="text-sm font-normal mb-3">
                          Types de rappels
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="type-due"
                              checked={emailTypes.includes("due")}
                              onCheckedChange={(checked) =>
                                handleEmailTypeChange("due", checked)
                              }
                              className="h-4 w-4 data-[state=checked]:bg-[#5b4eff] data-[state=checked]:border-[#5b4eff]"
                            />
                            <Label
                              htmlFor="type-due"
                              className="text-xs font-normal cursor-pointer"
                            >
                              À l'échéance
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="type-anticipated"
                              checked={emailTypes.includes("anticipated")}
                              onCheckedChange={(checked) =>
                                handleEmailTypeChange("anticipated", checked)
                              }
                              className="h-4 w-4 data-[state=checked]:bg-[#5b4eff] data-[state=checked]:border-[#5b4eff]"
                            />
                            <Label
                              htmlFor="type-anticipated"
                              className="text-xs font-normal cursor-pointer"
                            >
                              Rappels anticipés (1h, 3h, 1j, 3j avant)
                            </Label>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Ne pas déranger */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <h4 className="text-sm font-normal">
                            Ne pas déranger
                          </h4>
                        </div>
                        <p className="text-xs text-gray-500 mb-4">
                          Les emails seront différés pendant ces périodes
                        </p>

                        {/* Semaine */}
                        <div className="space-y-2 mb-4">
                          <Label className="text-xs font-normal">
                            Semaine (lundi-vendredi)
                          </Label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <Label
                                htmlFor="weekday-start"
                                className="text-xs text-gray-500"
                              >
                                De
                              </Label>
                              <Input
                                id="weekday-start"
                                type="time"
                                value={doNotDisturb.weekday.start}
                                onChange={(e) =>
                                  setDoNotDisturb({
                                    ...doNotDisturb,
                                    weekday: {
                                      ...doNotDisturb.weekday,
                                      start: e.target.value,
                                    },
                                  })
                                }
                                className="mt-1 h-8 text-xs"
                              />
                            </div>
                            <div className="flex-1">
                              <Label
                                htmlFor="weekday-end"
                                className="text-xs text-gray-500"
                              >
                                À
                              </Label>
                              <Input
                                id="weekday-end"
                                type="time"
                                value={doNotDisturb.weekday.end}
                                onChange={(e) =>
                                  setDoNotDisturb({
                                    ...doNotDisturb,
                                    weekday: {
                                      ...doNotDisturb.weekday,
                                      end: e.target.value,
                                    },
                                  })
                                }
                                className="mt-1 h-8 text-xs"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Week-end */}
                        <div className="space-y-2">
                          <Label className="text-xs font-normal">
                            Week-end (samedi-dimanche)
                          </Label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <Label
                                htmlFor="weekend-start"
                                className="text-xs text-gray-500"
                              >
                                De
                              </Label>
                              <Input
                                id="weekend-start"
                                type="time"
                                value={doNotDisturb.weekend.start}
                                onChange={(e) =>
                                  setDoNotDisturb({
                                    ...doNotDisturb,
                                    weekend: {
                                      ...doNotDisturb.weekend,
                                      start: e.target.value,
                                    },
                                  })
                                }
                                className="mt-1 h-8 text-xs"
                              />
                            </div>
                            <div className="flex-1">
                              <Label
                                htmlFor="weekend-end"
                                className="text-xs text-gray-500"
                              >
                                À
                              </Label>
                              <Input
                                id="weekend-end"
                                type="time"
                                value={doNotDisturb.weekend.end}
                                onChange={(e) =>
                                  setDoNotDisturb({
                                    ...doNotDisturb,
                                    weekend: {
                                      ...doNotDisturb.weekend,
                                      end: e.target.value,
                                    },
                                  })
                                }
                                className="mt-1 h-8 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Actions */}
                      <div className="flex items-center justify-between">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={sendTestEmail}
                          disabled={sendingTest}
                          className="flex items-center gap-2 font-normal"
                        >
                          <Send className="h-3 w-3" />
                          {sendingTest ? "Envoi..." : "Test"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleEmailSave}
                          disabled={updating}
                          className="bg-[#5b4eff] hover:bg-[#5b4eff]/90 font-normal"
                        >
                          {updating ? "Sauvegarde..." : "Sauvegarder"}
                        </Button>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Section Apps préférées */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-normal mb-1">
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
                      <span className="text-sm font-normal">{app.name}</span>
                      {!hasAccess && (
                        <Crown className="w-3 h-3 text-[#5b4fff]" />
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveApp(app.url)}
                      className="h-7 w-7 p-0"
                    >
                      <X className="h-2 w-2" />
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
                      className="w-full font-normal justify-start gap-2 h-12 border-dashed cursor-pointer"
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
              <h3 className="text-sm font-normal mb-1">
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
