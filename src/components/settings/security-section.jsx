"use client";

import React, { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Separator } from "@/src/components/ui/separator";
import { Switch } from "@/src/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  Eye,
  EyeOff,
  LogOut,
  Smartphone,
} from "lucide-react";
import { toast } from "@/src/components/ui/sonner";
import { useActiveOrganization } from "@/src/lib/organization-client";
import {
  useSession,
  twoFactor,
  signOut,
  authClient,
  updateUser,
} from "@/src/lib/auth-client";
import { useEffect } from "react";
import { useUser } from "@/src/lib/auth/hooks";
import { usePermissions } from "@/src/hooks/usePermissions";
import { Callout } from "@/src/components/ui/callout";
import { Setup2FAModal } from "@/app/dashboard/account/components/Setup2FAModal";

export function SecuritySection({
  organization: orgProp,
  orgLoading: orgLoadingProp,
  canManageOrgSettings = true,
}) {
  // Utiliser l'organisation passée en props si disponible, sinon utiliser le hook
  const hookData = useActiveOrganization();
  const organization = orgProp || hookData.organization;
  const orgLoading =
    orgLoadingProp !== undefined ? orgLoadingProp : hookData.loading;

  const { data: session, refetch: refetchSession } = useSession();
  const { session: user } = useUser();

  const [securitySettings, setSecuritySettings] = useState({
    mfaRequired: false,
    sessionDuration: 30,
    inactivityTimeout: 12,
    maxSessions: 1, // Limité à 1 session
  });

  // États pour le 2FA - Utiliser Setup2FAModal
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showDisable2FADialog, setShowDisable2FADialog] = useState(false);
  const [disable2FAPassword, setDisable2FAPassword] = useState("");
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);

  // États pour la gestion des sessions
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [devices, setDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(true);

  // Récupérer les sessions actives depuis Better Auth
  const fetchDeviceSessions = async () => {
    try {
      setDevicesLoading(true);

      // Essayer d'abord avec l'API client
      let data = null;
      let error = null;

      try {
        const result = await authClient.multiSession.listDeviceSessions();
        // Better Auth retourne directement les données, pas un objet { data, error }
        if (result && typeof result === "object") {
          if (result.data !== undefined) {
            data = result.data;
            error = result.error;
          } else {
            // Si c'est directement les données
            data = result;
          }
        }
      } catch (err) {
        console.log("Erreur API client:", err);
        error = err;
      }

      // Si ça ne fonctionne pas, essayer avec l'API REST directement
      if (error || !data || (Array.isArray(data) && data.length === 0)) {
        try {
          const response = await fetch("/api/auth/list-device-sessions", {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const restData = await response.json();
            data = restData;
            error = null;
          }
        } catch (restError) {
          console.log(
            "🔍 API REST non disponible, utilisation des données client"
          );
        }
      }

      if (error) {
        console.error("Erreur lors de la récupération des sessions:", error);
        // Ne pas afficher d'erreur si c'est juste un objet vide (pas vraiment une erreur)
        if (error && Object.keys(error).length > 0 && error.message) {
          toast.error("Erreur lors du chargement des sessions");
        }
        // Continuer avec un tableau vide au lieu de return
        setDevices([]);
        setDevicesLoading(false);
        return;
      }

      if (data) {
        // Vérifier si data est un tableau ou un objet avec session
        let sessionsArray = [];

        if (Array.isArray(data)) {
          // Si c'est un tableau de sessions
          sessionsArray = data;
        } else if (data.session) {
          // Si c'est un objet avec une session unique
          sessionsArray = [data.session];
        } else if (data.sessions) {
          // Si c'est un objet avec un tableau de sessions
          sessionsArray = data.sessions;
        } else {
          // Si c'est directement une session
          sessionsArray = [data];
        }

        // Transformer les données Better Auth pour l'affichage
        const transformedDevices = sessionsArray.map((sessionData, index) => {
          // Traiter l'IP vide
          const ipAddress =
            sessionData.ipAddress || sessionData.ip || "127.0.0.1";
          const displayIp = ipAddress === "" ? "Localhost" : ipAddress;

          // Générer un ID unique en combinant plusieurs sources et l'index
          const uniqueId =
            sessionData.id ||
            sessionData.sessionId ||
            sessionData.token ||
            `device-${index}-${Date.now()}`;

          return {
            id: uniqueId,
            device:
              getUserAgent(sessionData.userAgent) || `Appareil ${index + 1}`,
            lastActivity: formatLastActivity(
              sessionData.updatedAt || sessionData.lastAccessed
            ),
            ip: displayIp,
            location:
              getLocationFromIP(ipAddress) ||
              (ipAddress === "" || ipAddress === "127.0.0.1"
                ? "Local"
                : "Localisation inconnue"),
            createdAt: sessionData.createdAt || sessionData.created,
            current: true, // Pour l'instant, on considère que c'est la session actuelle
            sessionToken:
              sessionData.token || sessionData.sessionToken || sessionData.id,
          };
        });

        setDevices(transformedDevices);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des sessions:", error);
      toast.error("Erreur lors du chargement des sessions");
    } finally {
      setDevicesLoading(false);
    }
  };

  // Fonctions utilitaires pour transformer les données
  const getUserAgent = (userAgent) => {
    if (!userAgent) return "Navigateur inconnu";

    // Détection plus précise des navigateurs et OS
    let browser = "Navigateur inconnu";
    let os = "";

    // Détection de l'OS
    if (userAgent.includes("Macintosh") || userAgent.includes("Mac OS X")) {
      os = "macOS";
    } else if (userAgent.includes("Windows")) {
      os = "Windows";
    } else if (userAgent.includes("Linux")) {
      os = "Linux";
    } else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
      os = "iOS";
    } else if (userAgent.includes("Android")) {
      os = "Android";
    }

    // Détection du navigateur (ordre important)
    if (userAgent.includes("Edg/")) {
      browser = "Edge";
    } else if (userAgent.includes("Chrome/") && !userAgent.includes("Edg/")) {
      browser = "Chrome";
    } else if (
      userAgent.includes("Safari/") &&
      !userAgent.includes("Chrome/")
    ) {
      browser = "Safari";
    } else if (userAgent.includes("Firefox/")) {
      browser = "Firefox";
    }

    return os ? `${browser} sur ${os}` : browser;
  };

  const formatLastActivity = (updatedAt) => {
    if (!updatedAt) return "Activité inconnue";

    const now = new Date();
    const updated = new Date(updatedAt);

    // Vérifier si la date est valide
    if (isNaN(updated.getTime())) {
      return "Activité inconnue";
    }

    const diffInMinutes = Math.floor((now - updated) / (1000 * 60));

    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60)
      return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""}`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24)
      return `Il y a ${diffInHours} heure${diffInHours > 1 ? "s" : ""}`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `Il y a ${diffInDays} jour${diffInDays > 1 ? "s" : ""}`;
  };

  const getLocationFromIP = (ip) => {
    // TODO: Intégrer un service de géolocalisation IP
    // Pour l'instant, retourner une valeur par défaut
    return "Localisation inconnue";
  };

  // Charger les sessions et les settings au montage du composant
  useEffect(() => {
    if (session?.user) {
      fetchDeviceSessions();
      // Charger les paramètres de session depuis l'API
      fetch("/api/session-settings", { credentials: "include" })
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data && !data.error) {
            setSecuritySettings((prev) => ({
              ...prev,
              sessionDuration: data.sessionDuration ?? prev.sessionDuration,
              inactivityTimeout: data.inactivityTimeout ?? prev.inactivityTimeout,
              maxSessions: data.maxSessions ?? prev.maxSessions,
            }));
          }
        })
        .catch(() => {});
    }
  }, [session?.user]);

  const revokeSession = async (deviceId) => {
    await handleLogoutDevice(deviceId);
  };

  const revokeAllSessions = async () => {
    await handleLogoutAllOtherDevices();
  };

  // Fonction pour gérer le toggle 2FA
  const handle2FAToggle = async (enabled) => {
    if (enabled) {
      // Activer le 2FA - ouvrir le modal Setup2FA
      setShow2FAModal(true);
    } else {
      // Désactiver le 2FA - ouvrir le dialog de confirmation
      setShowDisable2FADialog(true);
    }
  };

  // Fonction pour désactiver le 2FA
  const handleDisable2FA = async () => {
    if (!disable2FAPassword) {
      toast.error("Veuillez saisir votre mot de passe");
      return;
    }

    setIsDisabling2FA(true);
    try {
      const { data, error } = await twoFactor.disable({
        password: disable2FAPassword,
      });

      if (error) {
        toast.error("Mot de passe incorrect");
        return;
      }

      toast.success("Authentification à deux facteurs désactivée");
      setShowDisable2FADialog(false);
      setDisable2FAPassword("");
      await refetchSession();
    } catch (error) {
      console.error("Erreur désactivation 2FA:", error);
      toast.error("Erreur lors de la désactivation du 2FA");
    } finally {
      setIsDisabling2FA(false);
    }
  };

  // Fonction pour gérer la fermeture du modal 2FA
  const handle2FAModalClose = async () => {
    setShow2FAModal(false);
    // Rafraîchir la session pour mettre à jour l'état 2FA
    await refetchSession();
  };

  // Fonction pour sauvegarder les paramètres de session
  const handleSessionSettingsChange = async (setting, value) => {
    setIsSessionLoading(true);

    try {
      const response = await fetch("/api/session-settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [setting]: parseInt(value) }),
      });

      if (!response.ok) {
        throw new Error("Erreur serveur");
      }

      const data = await response.json();

      setSecuritySettings((prev) => ({
        ...prev,
        sessionDuration: data.sessionDuration ?? prev.sessionDuration,
        inactivityTimeout: data.inactivityTimeout ?? prev.inactivityTimeout,
        maxSessions: data.maxSessions ?? prev.maxSessions,
      }));

      toast.success("Paramètres de session mis à jour");
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour des paramètres de session:",
        error
      );
      toast.error("Erreur lors de la mise à jour des paramètres");
    } finally {
      setIsSessionLoading(false);
    }
  };

  // Fonction pour déconnecter un appareil spécifique
  const handleLogoutDevice = async (deviceId) => {
    try {
      const device = devices.find((d) => d.id === deviceId);

      if (device?.current) {
        // Session actuelle - déconnexion complète
        await signOut();
        toast.success("Déconnexion réussie");
      } else if (device?.sessionToken) {
        // Déconnecter une session spécifique avec Better Auth
        const { error } = await authClient.multiSession.revoke({
          sessionToken: device.sessionToken,
        });

        if (error) {
          console.error("Erreur lors de la révocation de session:", error);
          toast.error("Erreur lors de la déconnexion de l'appareil");
          return;
        }

        // Recharger la liste des appareils
        await fetchDeviceSessions();
        toast.success("Appareil déconnecté avec succès");
      }
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      toast.error("Erreur lors de la déconnexion");
    }
  };

  // Fonction pour déconnecter tous les autres appareils
  const handleLogoutAllOtherDevices = async () => {
    try {
      const response = await fetch("/api/revoke-all-other-sessions", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        toast.error("Erreur lors de la déconnexion globale");
        return;
      }

      const result = await response.json();

      if (result.revokedCount === 0) {
        toast.info("Aucun autre appareil connecté");
      } else {
        toast.success(
          `${result.revokedCount} session(s) déconnectée(s) avec succès`
        );
      }

      // Recharger la liste des appareils
      await fetchDeviceSessions();
    } catch (error) {
      console.error(
        "Erreur lors de la déconnexion des autres appareils:",
        error
      );
      toast.error("Erreur lors de la déconnexion globale");
    }
  };

  return (
    <div className="space-y-20">
      <div>
        <h2 className="text-lg font-medium mb-1 hidden md:block">Sécurité</h2>
        <Separator className="hidden md:block bg-[#eeeff1] dark:bg-[#232323]" />
        {!canManageOrgSettings && (
          <div className="mt-4">
            <Callout type="warning" noMargin>
              <p>
                Vous n'avez pas la permission de modifier les paramètres de
                l'organisation. Seuls les <strong>owners</strong> et{" "}
                <strong>admins</strong> peuvent effectuer ces modifications.
              </p>
            </Callout>
          </div>
        )}

        {/* Section Authentification 2FA */}
        <div className="space-y-6 mt-8">
          {/* Titre section 2FA */}
          <div>
            <h3 className="text-sm font-medium mb-2">
              Authentification à deux facteurs (2FA)
            </h3>
            <Separator className="bg-[#eeeff1] dark:bg-[#232323]" />
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-normal mb-1">
                Activer l'authentification à deux facteurs
              </h4>
              <p className="text-xs text-gray-400">
                Sécurisez votre compte avec une couche de protection
                supplémentaire
              </p>
            </div>
            <Switch
              checked={!!session?.user?.twoFactorEnabled}
              onCheckedChange={handle2FAToggle}
              className="ml-4 flex-shrink-0 scale-75 data-[state=checked]:!bg-[#5b4eff]"
            />
          </div>
        </div>

        {/* Section Paramètres de session */}
        <div className="space-y-6 mt-8">
          {/* Titre section Sessions */}
          <div>
            <h3 className="text-sm font-medium mb-2">Paramètres de session</h3>
            <Separator className="bg-[#eeeff1] dark:bg-[#232323]" />
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-normal mb-1">Durée de session</h4>
              <p className="text-xs text-gray-400">
                Définir la durée de validité des sessions utilisateur
              </p>
            </div>
            <Select
              value={securitySettings.sessionDuration.toString()}
              onValueChange={(value) =>
                handleSessionSettingsChange("sessionDuration", value)
              }
              disabled={isSessionLoading}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 jours</SelectItem>
                <SelectItem value="30">30 jours</SelectItem>
                <SelectItem value="90">90 jours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-normal mb-1">Timeout d'inactivité</h4>
              <p className="text-xs text-gray-400">
                Déconnexion automatique après inactivité
              </p>
            </div>
            <Select
              value={securitySettings.inactivityTimeout.toString()}
              onValueChange={(value) =>
                handleSessionSettingsChange("inactivityTimeout", value)
              }
              disabled={isSessionLoading}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 heure</SelectItem>
                <SelectItem value="12">12 heures</SelectItem>
                <SelectItem value="24">24 heures</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-normal mb-1">Sessions simultanées</h4>
              <p className="text-xs text-gray-400">
                Nombre maximum de sessions actives par utilisateur
              </p>
            </div>
            <Select
              value={securitySettings.maxSessions.toString()}
              onValueChange={(value) =>
                handleSessionSettingsChange("maxSessions", value)
              }
              disabled={isSessionLoading}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 session</SelectItem>
                <SelectItem value="2">2 sessions</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* <Separator className="mt-8" /> */}

        {/* Section Appareils et sessions */}
        <div className="space-y-6 mt-8">
          {/* Titre section Appareils */}
          <div>
            <h3 className="text-sm font-medium mb-2">Appareils et sessions</h3>
            <Separator className="bg-[#eeeff1] dark:bg-[#232323]" />
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-normal mb-1">Appareils connectés</h4>
              <p className="text-xs text-gray-400">
                {devicesLoading
                  ? "Chargement..."
                  : `${devices.length} appareil(s) connecté(s)`}{" "}
                • Gérez vos sessions actives
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer font-normal"
                >
                  <LogOut className="h-4 w-4" />
                  Déconnexion globale
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Déconnexion globale</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir déconnecter tous les appareils ?
                    Vous devrez vous reconnecter sur tous vos appareils.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogoutAllOtherDevices}>
                    Déconnecter tout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Tableau des appareils */}
          <div>
            {devicesLoading ? (
              <div className="flex justify-center py-8">
                <div className="text-sm text-gray-400">
                  Chargement des sessions...
                </div>
              </div>
            ) : devices.length === 0 ? (
              <div className="flex justify-center py-8">
                <div className="text-sm text-gray-400">
                  Aucune session active trouvée
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-normal text-xs">
                      Appareil
                    </TableHead>
                    <TableHead className="font-normal text-xs">
                      Dernière activité
                    </TableHead>
                    <TableHead className="font-normal text-xs">
                      Localisation
                    </TableHead>
                    <TableHead className="font-normal text-xs">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-normal text-xs">
                                {device.device}
                              </span>
                              {device.current && (
                                <Badge
                                  variant="secondary"
                                  className="text-[8px]"
                                >
                                  Actuel
                                </Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400">
                              IP: {device.ip}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-xs">{device.lastActivity}</p>
                          <p className="text-[10px] text-gray-400">
                            Créé le{" "}
                            {new Date(device.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">{device.location}</span>
                      </TableCell>
                      <TableCell>
                        {!device.current && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                Révoquer
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Révoquer la session
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir révoquer cette
                                  session ? L'appareil sera déconnecté
                                  immédiatement.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleLogoutDevice(device.id)}
                                >
                                  Révoquer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

      {/* Modal Setup 2FA - Composant complet avec QR code */}
      <Setup2FAModal isOpen={show2FAModal} onClose={handle2FAModalClose} />

      {/* Dialog de désactivation 2FA */}
      <Dialog
        open={showDisable2FADialog}
        onOpenChange={setShowDisable2FADialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-medium">
              Désactiver l'authentification à deux facteurs
            </DialogTitle>
            <DialogDescription className="text-xs">
              Entrez votre mot de passe pour confirmer la désactivation du 2FA
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="disable-password">Mot de passe</Label>
              <Input
                id="disable-password"
                type="password"
                value={disable2FAPassword}
                onChange={(e) => setDisable2FAPassword(e.target.value)}
                placeholder="Votre mot de passe"
                disabled={isDisabling2FA}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && disable2FAPassword) {
                    handleDisable2FA();
                  }
                }}
              />
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800">
              Votre compte sera moins sécurisé sans l'authentification à deux
              facteurs
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDisable2FADialog(false);
                setDisable2FAPassword("");
              }}
              disabled={isDisabling2FA}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable2FA}
              disabled={!disable2FAPassword || isDisabling2FA}
            >
              {isDisabling2FA ? "Désactivation..." : "Désactiver le 2FA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
