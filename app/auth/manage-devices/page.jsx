"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { authClient } from "@/src/lib/auth-client";
import { toast } from "@/src/components/ui/sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/src/components/ui/alert-dialog";
import {
  Smartphone,
  Monitor,
  Tablet,
  AlertTriangle,
} from "lucide-react";

// Extract browser name from user agent string
function parseBrowser(ua) {
  if (!ua) return null;
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("OPR/") || ua.includes("Opera")) return "Opera";
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Firefox")) return "Firefox";
  return null;
}

// Extract device name from user agent string
function parseDevice(ua) {
  if (!ua) return { type: "desktop", name: "Ordinateur" };

  const isMobile = /Mobile|Android|iPhone/.test(ua);
  const isTablet = /Tablet|iPad/.test(ua);

  if (isTablet) {
    if (ua.includes("iPad")) return { type: "tablet", name: "iPad" };
    return { type: "tablet", name: "Tablette" };
  }
  if (isMobile) {
    if (ua.includes("iPhone")) return { type: "mobile", name: "iPhone" };
    if (ua.includes("Android")) return { type: "mobile", name: "Android" };
    return { type: "mobile", name: "Mobile" };
  }

  // Desktop
  if (ua.includes("Macintosh")) return { type: "desktop", name: "Mac" };
  if (ua.includes("Windows")) return { type: "desktop", name: "Windows" };
  if (ua.includes("Linux")) return { type: "desktop", name: "Linux" };
  return { type: "desktop", name: "Ordinateur" };
}

// Format relative time
function formatLastActivity(date) {
  if (!date) return null;
  const now = new Date();
  const activityDate = new Date(date);
  const diffMs = now - activityDate;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Il y a ${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Il y a 1 jour";
  return `Il y a ${diffDays} jours`;
}

// Device icon component
function DeviceIcon({ type }) {
  const iconProps = { className: "h-5 w-5 text-gray-400", strokeWidth: 1.5 };
  if (type === "mobile") return <Smartphone {...iconProps} />;
  if (type === "tablet") return <Tablet {...iconProps} />;
  return <Monitor {...iconProps} />;
}

function ManageDevicesContent() {
  const router = useRouter();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(null);
  const [currentSessionToken, setCurrentSessionToken] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null, sessionToken: null });

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch("/api/check-session-limit", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des sessions");
        }

        const sessionData = await response.json();

        if (sessionData.error) {
          toast.error("Erreur lors du chargement des sessions");
          setDevices([]);
        } else {
          if (sessionData.currentSessionToken) {
            setCurrentSessionToken(sessionData.currentSessionToken);
          }

          const sessions = sessionData.sessions || [];
          const transformedDevices = sessions.map((session, index) => {
            const device = parseDevice(session.userAgent);
            const browser = parseBrowser(session.userAgent);
            const label = browser ? `${device.name} · ${browser}` : device.name;

            return {
              id: session.id || session.token || `device-${index}`,
              label,
              deviceType: device.type,
              lastActivity: formatLastActivity(session.updatedAt || session.createdAt),
              ip: session.ipAddress || session.ip || null,
              location: session.location && session.location !== "Localisation inconnue" ? session.location : null,
              sessionToken: session.token || session.sessionToken || session.id,
            };
          });

          setDevices(transformedDevices);
        }
      } catch (error) {
        console.error("Erreur chargement sessions:", error);
        toast.error("Erreur lors du chargement des sessions");
        setDevices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const hasMultipleSessions = devices.length > 1;

  const activateOrganization = async () => {
    try {
      const orgsResponse = await fetch("/api/auth/organization/list");
      if (orgsResponse.ok) {
        const organizations = await orgsResponse.json();
        if (organizations?.length > 0) {
          const activeOrg = organizations.find((org) => org.isActive) || organizations[0];
          await fetch("/api/auth/organization/set-active", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ organizationId: activeOrg.id }),
          });
        }
      }
    } catch {
      // Continue anyway
    }
  };

  const handleRevokeSession = async (sessionToken) => {
    try {
      setRevoking(sessionToken);
      const response = await fetch("/api/revoke-session", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken }),
      });

      if (!response.ok) {
        toast.error("Erreur lors de la révocation de la session");
      } else {
        toast.success("Session révoquée");
        await activateOrganization();
        setTimeout(() => router.push("/dashboard"), 800);
      }
    } catch {
      toast.error("Erreur lors de la révocation");
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeAllOthers = async () => {
    try {
      setRevoking("all");
      const response = await fetch("/api/revoke-all-other-sessions", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        toast.error("Erreur lors de la déconnexion des autres sessions");
        return;
      }

      const result = await response.json();
      toast.success(`${result.revokedCount} session(s) révoquée(s)`);
      await activateOrganization();
      setTimeout(() => router.push("/dashboard"), 800);
    } catch {
      toast.error("Erreur lors de la déconnexion");
    } finally {
      setRevoking(null);
    }
  };

  const handleCancel = async () => {
    try {
      await authClient.signOut();
      router.push("/auth/login");
    } catch {
      router.push("/auth/login");
    }
  };

  const onConfirmAction = () => {
    if (confirmDialog.type === "revoke-one") {
      handleRevokeSession(confirmDialog.sessionToken);
    } else if (confirmDialog.type === "revoke-all") {
      handleRevokeAllOthers();
    } else if (confirmDialog.type === "cancel") {
      handleCancel();
    }
    setConfirmDialog({ open: false, type: null, sessionToken: null });
  };

  const dialogMessages = {
    "revoke-one": {
      title: "Révoquer cette session ?",
      description: "L'appareil sera immédiatement déconnecté de votre compte.",
    },
    "revoke-all": {
      title: "Déconnecter les autres sessions ?",
      description: "Toutes les autres sessions seront immédiatement révoquées. Seule votre session actuelle restera active.",
    },
    cancel: {
      title: "Se déconnecter ?",
      description: "Vous serez déconnecté de cet appareil et redirigé vers la page de connexion.",
    },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex justify-center px-4 py-12 sm:py-20">
      <div className="w-full max-w-[680px]">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sessions actives
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gérez les appareils connectés à votre compte.
          </p>
        </div>

        {/* Alert banner — only when multiple sessions */}
        {hasMultipleSessions && !loading && (
          <div className="mb-8 border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-500 rounded-r-lg py-3 px-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Connexion simultanée détectée
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">
                  Vous êtes déjà connecté sur un autre appareil. Pour éviter le partage de compte, une seule connexion est autorisée à la fois.
                </p>
                <a
                  href="/dashboard/settings/members"
                  className="text-sm font-medium text-amber-800 dark:text-amber-200 underline mt-2 inline-block transition-colors duration-150 hover:text-amber-900 dark:hover:text-amber-100"
                >
                  Besoin de collaborer ?
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Sessions list */}
        {loading ? (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-400 dark:text-gray-500">Chargement des sessions...</p>
          </div>
        ) : devices.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aucune session active
            </p>
            <Button
              onClick={() => router.push("/dashboard")}
              variant="primary"
              className="mt-4"
            >
              Continuer vers le dashboard
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              {devices.map((device) => {
                const isCurrentSession = currentSessionToken && device.sessionToken === currentSessionToken;

                return (
                  <div
                    key={device.id}
                    className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                  >
                    {/* Left side */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <DeviceIcon type={device.deviceType} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {device.label}
                          </span>
                          {isCurrentSession && (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                              Cette session
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {device.lastActivity && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {device.lastActivity}
                            </span>
                          )}
                          {device.location && (
                            <>
                              <span className="text-xs text-gray-300 dark:text-gray-600">·</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {device.location}
                              </span>
                            </>
                          )}
                          {device.ip && (
                            <>
                              <span className="text-xs text-gray-300 dark:text-gray-600">·</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {device.ip}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side — revoke button */}
                    {!isCurrentSession && (
                      <button
                        onClick={() => setConfirmDialog({ open: true, type: "revoke-one", sessionToken: device.sessionToken })}
                        disabled={revoking === device.sessionToken}
                        className="text-sm text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 transition-colors duration-150 cursor-pointer ml-4 flex-shrink-0 disabled:opacity-50"
                      >
                        {revoking === device.sessionToken ? "Révocation..." : "Révoquer"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
              {hasMultipleSessions ? (
                <>
                  <Button
                    onClick={() => setConfirmDialog({ open: true, type: "cancel", sessionToken: null })}
                    variant="outline"
                    size="sm"
                    disabled={revoking !== null}
                    className="sm:w-auto"
                  >
                    Se déconnecter de cet appareil
                  </Button>
                  <Button
                    onClick={() => setConfirmDialog({ open: true, type: "revoke-all", sessionToken: null })}
                    variant="primary"
                    size="sm"
                    disabled={revoking !== null}
                    className="sm:w-auto"
                  >
                    {revoking === "all" ? "Déconnexion..." : "Déconnecter les autres sessions"}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setConfirmDialog({ open: true, type: "revoke-all", sessionToken: null })}
                  variant="outline"
                  size="sm"
                  disabled={revoking !== null}
                  className="sm:w-auto"
                >
                  Révoquer toutes les autres sessions
                </Button>
              )}
            </div>
          </>
        )}

        {/* Security info */}
        <div className="mt-10 bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Pour votre sécurité, si vous ne reconnaissez pas un appareil, révoquez sa session et changez votre mot de passe.
          </p>
        </div>
      </div>

      {/* Confirmation dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, type: null, sessionToken: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogMessages[confirmDialog.type]?.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogMessages[confirmDialog.type]?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmAction}
              className={confirmDialog.type === "cancel" ? "" : "bg-red-600 hover:bg-red-700 text-white"}
            >
              {confirmDialog.type === "cancel" ? "Se déconnecter" : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function ManageDevicesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center">
          <p className="text-sm text-gray-400">Chargement...</p>
        </div>
      }
    >
      <ManageDevicesContent />
    </Suspense>
  );
}
