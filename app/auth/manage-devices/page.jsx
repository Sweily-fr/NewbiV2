"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { authClient } from "@/src/lib/auth-client";
import { toast } from "@/src/components/ui/sonner";
import {
  Smartphone,
  Monitor,
  Tablet,
  LogOut,
  AlertTriangle,
} from "lucide-react";

function ManageDevicesContent() {
  const router = useRouter();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(null);

  console.log("🔧 [MANAGE-DEVICES] Page chargée");

  // Récupérer les sessions actives
  useEffect(() => {
    console.log("🔄 [MANAGE-DEVICES] useEffect déclenché");

    const fetchSessions = async () => {
      console.log("📡 [MANAGE-DEVICES] Récupération des sessions...");
      try {
        // Utiliser notre API qui utilise Better Auth côté serveur
        const response = await fetch("/api/check-session-limit", {
          method: "GET",
          credentials: "include",
        });

        console.log("📊 [MANAGE-DEVICES] Réponse API:", response.status);

        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des sessions");
        }

        const sessionData = await response.json();
        console.log("📊 [MANAGE-DEVICES] Données reçues:", sessionData);

        if (sessionData.error) {
          console.error("Erreur:", sessionData.error);
          toast.error("Erreur lors du chargement des appareils");
          setDevices([]);
        } else {
          // Transformer les données
          const sessions = sessionData.sessions || [];

          const transformedDevices = sessions.map((session, index) => ({
            id: session.id || session.token || `device-${index}`,
            device: getUserAgent(session.userAgent) || `Appareil ${index + 1}`,
            lastActivity: formatLastActivity(
              session.updatedAt || session.createdAt
            ),
            ip: session.ipAddress || session.ip || "127.0.0.1",
            location: session.location || "Localisation inconnue",
            sessionToken: session.token || session.sessionToken || session.id,
            userAgent: session.userAgent,
          }));

          console.log(
            "✅ [MANAGE-DEVICES] Appareils transformés:",
            transformedDevices
          );
          setDevices(transformedDevices);
        }
      } catch (error) {
        console.error("❌ [MANAGE-DEVICES] Erreur:", error);
        toast.error("Erreur lors du chargement des appareils");
        setDevices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  // Fonction pour obtenir le type d'appareil depuis le user agent
  const getUserAgent = (userAgent) => {
    if (!userAgent) return "Appareil inconnu";

    if (userAgent.includes("Mobile") || userAgent.includes("Android")) {
      return "Mobile";
    } else if (userAgent.includes("Tablet") || userAgent.includes("iPad")) {
      return "Tablette";
    } else {
      return "Ordinateur";
    }
  };

  // Fonction pour formater la dernière activité
  const formatLastActivity = (date) => {
    if (!date) return "Inconnue";

    const now = new Date();
    const activityDate = new Date(date);
    const diffMs = now - activityDate;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    return `Il y a ${diffDays}j`;
  };

  // Fonction pour obtenir l'icône de l'appareil
  const getDeviceIcon = (device) => {
    if (device.includes("Mobile")) return Smartphone;
    if (device.includes("Tablette")) return Tablet;
    return Monitor;
  };

  // Fonction pour révoquer une session
  const handleRevokeSession = async (sessionToken) => {
    console.log("🗑️ [MANAGE-DEVICES] Révocation de session:", sessionToken);
    try {
      setRevoking(sessionToken);

      // Utiliser notre API pour révoquer la session dans MongoDB
      const response = await fetch("/api/revoke-session", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionToken }),
      });

      console.log("📊 [MANAGE-DEVICES] Réponse API:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ [MANAGE-DEVICES] Erreur révocation:", errorData);
        toast.error("Erreur lors de la déconnexion de l'appareil");
      } else {
        const result = await response.json();
        console.log("✅ [MANAGE-DEVICES] Résultat:", result);
        toast.success("Appareil déconnecté avec succès");

        // Récupérer et activer l'organisation avant de rediriger
        try {
          console.log("🏢 [MANAGE-DEVICES] Récupération des organisations...");
          
          // Récupérer les organisations de l'utilisateur
          const orgsResponse = await fetch("/api/auth/organization/list");
          if (orgsResponse.ok) {
            const organizations = await orgsResponse.json();
            console.log("📋 [MANAGE-DEVICES] Organisations:", organizations);

            if (organizations && organizations.length > 0) {
              // Prendre la première organisation ou celle marquée comme active
              const activeOrg = organizations.find(org => org.isActive) || organizations[0];
              console.log("🎯 [MANAGE-DEVICES] Organisation sélectionnée:", activeOrg);

              // Activer l'organisation
              const setActiveResponse = await fetch("/api/auth/organization/set-active", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ organizationId: activeOrg.id }),
              });

              if (setActiveResponse.ok) {
                console.log("✅ [MANAGE-DEVICES] Organisation activée avec succès");
              } else {
                console.warn("⚠️ [MANAGE-DEVICES] Échec activation organisation");
              }
            }
          }
        } catch (orgError) {
          console.error("❌ [MANAGE-DEVICES] Erreur activation organisation:", orgError);
          // Continuer quand même vers le dashboard
        }

        // Rediriger vers le dashboard après activation de l'organisation
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      }
    } catch (error) {
      console.error("❌ [MANAGE-DEVICES] Exception révocation:", error);
      toast.error("Erreur lors de la déconnexion");
    } finally {
      setRevoking(null);
    }
  };

  // Fonction pour continuer avec la nouvelle session (révoquer l'ancienne)
  const handleContinueWithNewSession = async () => {
    if (devices.length > 0) {
      // Révoquer la première session (la plus ancienne)
      await handleRevokeSession(devices[0].sessionToken);
    }
  };

  // Fonction pour annuler et se déconnecter
  const handleCancel = async () => {
    try {
      await authClient.signOut();
      router.push("/auth/login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      router.push("/auth/login");
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-[#5b4fff]/10 flex items-center justify-center flex-shrink-0">
              <Monitor className="h-5 w-5 text-[#5b4fff]" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-medium text-gray-900 dark:text-white">
                Appareils connectés
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Gérez les sessions actives de votre compte
              </p>
            </div>
          </div>
        </div>

        {/* Note d'information */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg border border-blue-200 dark:border-blue-800/30 bg-blue-50/50 dark:bg-blue-900/10">
          <div className="flex items-start gap-2 sm:gap-3">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                Connexion simultanée détectée
              </p>
              <p className="text-[11px] sm:text-xs text-blue-700 dark:text-blue-300 mb-2 leading-relaxed">
                Vous êtes déjà connecté sur un autre appareil. Pour éviter le partage de compte, une seule connexion est autorisée à la fois.
              </p>
              <p className="text-[11px] sm:text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                💡 <span className="font-medium">Besoin de collaborer ?</span> Invitez des membres dans votre organisation plutôt que de partager votre compte.
              </p>
            </div>
          </div>
        </div>

        {/* Liste des appareils */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Chargement des appareils...
            </p>
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aucun appareil connecté
            </p>
            <Button
              onClick={() => router.push("/dashboard")}
              className="mt-4 bg-[#5b4fff] hover:bg-[#5b4fff]/90"
            >
              Continuer vers le dashboard
            </Button>
          </div>
        ) : (
          <>
            {/* Liste des sessions */}
            <div className="space-y-3 mb-4 sm:mb-6">
              {devices.map((device, index) => {
                const DeviceIcon = getDeviceIcon(device.device);
                const isCurrentSession = index === devices.length - 1;

                return (
                  <div
                    key={device.id}
                    className="group relative p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        {/* Icône de l'appareil */}
                        <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                          <DeviceIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </div>

                        {/* Informations */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {device.device}
                            </p>
                            {isCurrentSession && (
                              <span className="px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full bg-[#5b4fff]/10 text-[#5b4fff] whitespace-nowrap">
                                Session actuelle
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                            Dernière activité : {device.lastActivity}
                          </p>
                        </div>
                      </div>

                      {/* Bouton de déconnexion */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRevokeSession(device.sessionToken)}
                        disabled={revoking === device.sessionToken}
                        className="w-full sm:w-auto text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10"
                      >
                        {revoking === device.sessionToken ? (
                          <span className="text-xs">Déconnexion...</span>
                        ) : (
                          <>
                            <LogOut className="h-4 w-4 mr-1" />
                            <span className="text-xs">Déconnecter</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions principales */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
              <Button
                onClick={handleCancel}
                variant="outline"
                className="w-full font-normal border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer text-xs sm:text-sm"
                disabled={revoking !== null}
              >
                Annuler et se déconnecter
              </Button>
              <Button
                onClick={handleContinueWithNewSession}
                className="w-full font-normal bg-[#5b4fff] hover:bg-[#5b4fff]/90 text-white cursor-pointer text-xs sm:text-sm"
                disabled={revoking !== null}
              >
                Déconnecter l'autre appareil et continuer
              </Button>
            </div>
          </>
        )}

        {/* Note d'information en bas */}
        <div className="mt-6 sm:mt-8 p-3 sm:p-4 rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800">
          <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400 mb-2 leading-relaxed">
            <span className="text-gray-900 font-medium dark:text-gray-300">
              Pourquoi cette limitation ?
            </span>{" "}
            Pour garantir une utilisation équitable et encourager la collaboration via notre système d'invitations, chaque compte ne peut être connecté que sur un seul appareil à la fois.
          </p>
          <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            <span className="text-gray-900 font-medium dark:text-gray-300">
              ⚠️ Sécurité :
            </span>{" "}
            Si vous ne reconnaissez pas l'appareil ci-dessus, déconnectez-le immédiatement et changez votre mot de passe.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ManageDevicesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Chargement...</p>
        </div>
      }
    >
      <ManageDevicesContent />
    </Suspense>
  );
}
