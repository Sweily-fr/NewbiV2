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
  DialogTrigger,
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
  CreditCard,
  CheckCircle,
  ExternalLink,
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
import { useStripeConnect } from "@/src/hooks/useStripeConnect";
import StripeConnectOnboarding from "@/src/components/stripe/StripeConnectOnboarding";
import { useUser } from "@/src/lib/auth/hooks";
import { usePermissions } from "@/src/hooks/usePermissions";
import { Callout } from "@/src/components/ui/callout";
import { Setup2FAModal } from "@/app/dashboard/account/components/Setup2FAModal";

export function SecuritySection({
  organization: orgProp,
  orgLoading: orgLoadingProp,
  canManageOrgSettings = true,
}) {
  const [showOrganizationModal, setShowOrganizationModal] = useState(false);

  // Utiliser l'organisation passée en props si disponible, sinon utiliser le hook
  const hookData = useActiveOrganization();
  const organization = orgProp || hookData.organization;
  const orgLoading =
    orgLoadingProp !== undefined ? orgLoadingProp : hookData.loading;
  const updateOrganization = hookData.updateOrganization;

  // Debug: Vérifier quelle organisation est utilisée
  useEffect(() => {
    console.log("🔐 [SecuritySection] Organisation utilisée:", {
      fromProps: !!orgProp,
      orgId: organization?.id,
      orgName: organization?.name,
      companyName: organization?.companyName,
    });
  }, [organization, orgProp]);

  const { data: session, refetch: refetchSession } = useSession();
  const { session: user } = useUser();

  // États pour Stripe Connect
  const [showStripeOnboarding, setShowStripeOnboarding] = useState(false);
  const {
    isConnected: stripeConnected,
    canReceivePayments,
    isLoading: stripeLoading,
    stripeAccount,
    checkAndUpdateAccountStatus,
    refetchStatus,
  } = useStripeConnect(user?.user?.id);

  const [organizationForm, setOrganizationForm] = useState({});
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

  // Vérifier automatiquement le statut Stripe après redirection
  useEffect(() => {
    const checkStripeStatus = async () => {
      // Vérifier si on revient de Stripe
      const urlParams = new URLSearchParams(window.location.search);
      const stripeSuccess = urlParams.get("stripe_success");
      const openSettings = urlParams.get("open_settings");

      if (stripeSuccess === "true" && stripeConnected) {
        console.log(
          "🔄 Vérification automatique du statut Stripe après redirection..."
        );

        // Attendre un peu pour que Stripe ait le temps de mettre à jour
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Vérifier le statut
        await checkAndUpdateAccountStatus();

        // Ouvrir le modal de sécurité si demandé
        if (openSettings === "securite") {
          // Le modal sera ouvert par le composant parent
        }

        // Nettoyer l'URL
        window.history.replaceState({}, "", window.location.pathname);
      }
    };

    checkStripeStatus();
  }, [stripeConnected, checkAndUpdateAccountStatus]);

  // Charger les sessions au montage du composant
  useEffect(() => {
    if (session?.user) {
      fetchDeviceSessions();
    }
  }, [session?.user]);

  const handleOrganizationChange = async () => {
    if (!organizationForm.organizationName.trim()) {
      toast.error("Veuillez saisir un nom d'organisation");
      return;
    }

    try {
      await updateOrganization(
        {
          name: organizationForm.organizationName.trim(),
        },
        {
          onSuccess: () => {
            toast.success("Nom de l'organisation modifié avec succès");
            setShowOrganizationModal(false);
            setOrganizationForm({ organizationName: "" });
          },
          onError: (error) => {
            console.error("Erreur lors de la mise à jour:", error);
            toast.error(
              "Erreur lors de la modification du nom de l'organisation"
            );
          },
        }
      );
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast.error("Erreur lors de la modification du nom de l'organisation");
    }
  };

  const revokeSession = (deviceId) => {
    toast.success("Session révoquée avec succès");
  };

  const revokeAllSessions = () => {
    toast.success("Toutes les sessions ont été révoquées");
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
      // Convertir les valeurs UI en secondes pour Better Auth
      let sessionConfig = {};

      if (setting === "sessionDuration") {
        // Convertir jours en secondes
        sessionConfig.expiresIn = parseInt(value) * 24 * 60 * 60;
      }

      if (setting === "inactivityTimeout") {
        // Convertir heures en secondes pour updateAge
        sessionConfig.updateAge = parseInt(value) * 60 * 60;
      }

      // Mettre à jour l'état local
      setSecuritySettings((prev) => ({
        ...prev,
        [setting]: parseInt(value),
      }));

      // TODO: Implémenter l'API pour mettre à jour la configuration de session
      // Cette fonctionnalité nécessiterait une API personnalisée car Better Auth
      // ne permet pas de modifier la configuration de session à chaud

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
      // Déconnecter toutes les sessions sauf la session actuelle
      const otherDevices = devices.filter(
        (device) => !device.current && device.sessionToken
      );

      if (otherDevices.length === 0) {
        toast.info("Aucun autre appareil connecté");
        return;
      }

      // Révoquer toutes les autres sessions
      const revokePromises = otherDevices.map((device) =>
        authClient.multiSession.revoke({ sessionToken: device.sessionToken })
      );

      const results = await Promise.allSettled(revokePromises);

      // Vérifier les résultats
      const failedRevocations = results.filter(
        (result) => result.status === "rejected"
      );

      if (failedRevocations.length > 0) {
        console.error("Certaines révocations ont échoué:", failedRevocations);
        toast.error(
          `Erreur lors de la déconnexion de ${failedRevocations.length} appareil(s)`
        );
      } else {
        toast.success(
          `${otherDevices.length} appareil(s) déconnecté(s) avec succès`
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
        <h2 className="text-lg font-medium mb-1">Sécurité</h2>
        <Separator className="hidden md:block" />
        {!canManageOrgSettings && (
          <div className="mt-4">
            <Callout type="warning" noMargin>
              <p>
                Vous n'avez pas la permission de modifier les paramètres de l'organisation. 
                Seuls les <strong>owners</strong> et <strong>admins</strong> peuvent effectuer ces modifications.
              </p>
            </Callout>
          </div>
        )}

        <div className="space-y-6 mt-8">
          {/* Titre section Identité */}
          <div>
            <h3 className="text-sm font-medium mb-2">Identité</h3>
            <Separator />
          </div>

          {/* Modification nom de l'organisation */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-normal mb-1">
                Nom de l'organisation
              </h4>
              <p className="text-xs text-gray-400">
                {orgLoading
                  ? "Chargement..."
                  : organization?.name || "Aucune organisation"}{" "}
                •{" "}
                <Dialog
                  open={showOrganizationModal}
                  onOpenChange={setShowOrganizationModal}
                >
                  <DialogTrigger asChild>
                    <button
                      className="text-gray-400 underline hover:text-gray-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={orgLoading || !canManageOrgSettings}
                      title={!canManageOrgSettings ? "Seuls les owners et admins peuvent modifier" : ""}
                    >
                      Modifier
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        Modifier le nom de l'organisation
                      </DialogTitle>
                      <DialogDescription>
                        Changez le nom qui apparaît dans votre espace de travail
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="organizationName">
                          Nom de l'organisation
                        </Label>
                        <Input
                          id="organizationName"
                          type="text"
                          value={organizationForm.organizationName}
                          onChange={(e) =>
                            setOrganizationForm((prev) => ({
                              ...prev,
                              organizationName: e.target.value,
                            }))
                          }
                          placeholder="Nom de votre organisation"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowOrganizationModal(false)}
                      >
                        Annuler
                      </Button>
                      <Button onClick={handleOrganizationChange}>
                        Enregistrer
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </p>
            </div>
          </div>
        </div>

        {/* <Separator className="mt-8" /> */}

        {/* Section Stripe Connect */}
        <div className="space-y-6 mt-8">
          {/* Titre section Stripe Connect */}
          <div>
            <h3 className="text-sm font-medium mb-2">
              Paiements Stripe Connect
            </h3>
            <Separator />
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-normal mb-1">Connexion Stripe</h4>
              <p className="text-xs text-gray-400">
                {stripeConnected
                  ? canReceivePayments
                    ? "✓ Prêt à recevoir des paiements"
                    : "⚠️ Configuration requise - Finalisez votre profil Stripe"
                  : "Connectez Stripe Connect pour recevoir des paiements sécurisés"}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {stripeConnected ? (
                <div className="flex items-center gap-2">
                  {/* <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-green-600">Connecté</span>
                  </div> */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowStripeOnboarding(true)}
                    disabled={!canManageOrgSettings}
                    className="text-xs h-7 border-[#5b4fff]/20 text-[#5b4fff] hover:bg-[#5b4fff]/5 cursor-pointer"
                    title={!canManageOrgSettings ? "Seuls les owners et admins peuvent gérer Stripe" : ""}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    {canReceivePayments ? "Tableau de bord" : "Finaliser"}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStripeOnboarding(true)}
                  disabled={stripeLoading || !canManageOrgSettings}
                  className="text-xs cursor-pointer h-7 bg-[#5b4fff] border-[#5b4fff]/20 text-[#fff] hover:text-[#fff] hover:bg-[#5b4fff]/90"
                  title={!canManageOrgSettings ? "Seuls les owners et admins peuvent connecter Stripe" : ""}
                >
                  <CreditCard className="h-3 w-3 mr-1" />
                  {stripeLoading ? "Chargement..." : "Connecter Stripe"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Section Authentification 2FA */}
        <div className="space-y-6 mt-8">
          {/* Titre section 2FA */}
          <div>
            <h3 className="text-sm font-medium mb-2">
              Authentification à deux facteurs (2FA)
            </h3>
            <Separator />
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
            <Separator />
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
            <Separator />
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
      <Setup2FAModal 
        isOpen={show2FAModal} 
        onClose={handle2FAModalClose}
      />

      {/* Dialog de désactivation 2FA */}
      <Dialog open={showDisable2FADialog} onOpenChange={setShowDisable2FADialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Désactiver l'authentification à deux facteurs</DialogTitle>
            <DialogDescription>
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
              ⚠️ Votre compte sera moins sécurisé sans l'authentification à deux facteurs
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

      {/* Modal Stripe Connect Onboarding */}
      <StripeConnectOnboarding
        isOpen={showStripeOnboarding}
        onClose={() => setShowStripeOnboarding(false)}
        userId={user?.user?.id}
        userEmail={user?.user?.email}
        onSuccess={() => {
          setShowStripeOnboarding(false);
          // Optionnel: afficher une notification de succès
        }}
      />
    </div>
  );
}
