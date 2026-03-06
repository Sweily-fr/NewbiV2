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
import { AlertTriangle } from "lucide-react";

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

// Extract OS name
function parseOS(ua) {
  if (!ua) return null;
  if (ua.includes("Macintosh") || ua.includes("Mac OS")) return "macOS";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Linux") && !ua.includes("Android")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  return null;
}

// Format relative time
function formatLastActivity(date) {
  if (!date) return null;
  const now = new Date();
  const activityDate = new Date(date);
  const diffMs = now - activityDate;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "A l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Il y a ${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Il y a 1 jour";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return "Il y a 1 semaine";
  return `Il y a ${diffWeeks} semaines`;
}

// Realistic device icon components matching the screenshot style
function DesktopDeviceIcon() {
  return (
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden">
      <svg width="30" height="22" viewBox="0 0 30 21.5" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Screen */}
        <rect x="2" y="0" width="26" height="17" rx="1.5" fill="#1a1a2e" />
        <rect x="3.5" y="1.5" width="23" height="14" rx="0.5" fill="url(#sky-desktop)" />
        {/* Cloud 1 */}
        <ellipse cx="12" cy="7" rx="3" ry="1.8" fill="white" opacity="0.9" />
        <ellipse cx="10.2" cy="7.5" rx="2" ry="1.2" fill="white" opacity="0.8" />
        <ellipse cx="14" cy="7.3" rx="2.2" ry="1.4" fill="white" opacity="0.85" />
        {/* Cloud 2 */}
        <ellipse cx="22" cy="5.5" rx="2.5" ry="1.5" fill="white" opacity="0.7" />
        <ellipse cx="20.5" cy="6" rx="1.8" ry="1" fill="white" opacity="0.65" />
        {/* Base */}
        <path d="M0 18.5h30l-2.5 3H2.5l-2.5-3z" fill="#c4c4c4" />
        <rect x="0" y="17.5" width="30" height="1.2" rx="0.5" fill="#d4d4d4" />
        {/* Trackpad */}
        <rect x="11" y="18.5" width="8" height="0.5" rx="0.25" fill="#aaa" />
        <defs>
          <linearGradient id="sky-desktop" x1="15" y1="1" x2="15" y2="16" gradientUnits="userSpaceOnUse">
            <stop stopColor="#87CEEB" />
            <stop offset="1" stopColor="#4DA6E0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function MobileDeviceIcon() {
  return (
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden">
      <svg width="18" height="30" viewBox="0 0 18 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Phone body */}
        <rect x="0" y="0" width="18" height="30" rx="3" fill="#1a1a2e" />
        {/* Screen */}
        <rect x="1.5" y="2.5" width="15" height="24" rx="1.5" fill="url(#sky-mobile)" />
        {/* Cloud */}
        <ellipse cx="9" cy="11" rx="3.5" ry="2" fill="white" opacity="0.9" />
        <ellipse cx="6.8" cy="11.5" rx="2.2" ry="1.3" fill="white" opacity="0.8" />
        <ellipse cx="11.5" cy="11.2" rx="2.5" ry="1.5" fill="white" opacity="0.85" />
        {/* Small cloud */}
        <ellipse cx="5.5" cy="7.5" rx="2" ry="1.2" fill="white" opacity="0.6" />
        {/* Home indicator */}
        <rect x="6" y="28" width="6" height="0.8" rx="0.4" fill="#555" />
        <defs>
          <linearGradient id="sky-mobile" x1="9" y1="2" x2="9" y2="27" gradientUnits="userSpaceOnUse">
            <stop stopColor="#87CEEB" />
            <stop offset="1" stopColor="#4DA6E0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function TabletDeviceIcon() {
  return (
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden">
      <svg width="24" height="30" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Tablet body */}
        <rect x="0" y="0" width="24" height="30" rx="2.5" fill="#1a1a2e" />
        {/* Screen */}
        <rect x="2" y="2.5" width="20" height="23" rx="1" fill="url(#sky-tablet)" />
        {/* Cloud */}
        <ellipse cx="12" cy="11" rx="3.5" ry="2" fill="white" opacity="0.9" />
        <ellipse cx="9.5" cy="11.5" rx="2.2" ry="1.3" fill="white" opacity="0.8" />
        <ellipse cx="14.8" cy="11.2" rx="2.5" ry="1.5" fill="white" opacity="0.85" />
        {/* Home button */}
        <circle cx="12" cy="27.5" r="1.2" fill="#555" />
        <defs>
          <linearGradient id="sky-tablet" x1="12" y1="2" x2="12" y2="26" gradientUnits="userSpaceOnUse">
            <stop stopColor="#87CEEB" />
            <stop offset="1" stopColor="#4DA6E0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function DeviceIcon({ type }) {
  if (type === "mobile") return <MobileDeviceIcon />;
  if (type === "tablet") return <TabletDeviceIcon />;
  return <DesktopDeviceIcon />;
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
          throw new Error("Erreur lors de la recuperation des sessions");
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
            const os = parseOS(session.userAgent);

            return {
              id: session.id || session.token || `device-${index}`,
              deviceName: device.name,
              browser,
              os,
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
        toast.error("Erreur lors de la revocation de la session");
      } else {
        toast.success("Session revoquee");
        await activateOrganization();
        setTimeout(() => router.push("/dashboard"), 800);
      }
    } catch {
      toast.error("Erreur lors de la revocation");
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
        toast.error("Erreur lors de la deconnexion des autres sessions");
        return;
      }

      const result = await response.json();
      toast.success(`${result.revokedCount} session(s) revoquee(s)`);
      await activateOrganization();
      setTimeout(() => router.push("/dashboard"), 800);
    } catch {
      toast.error("Erreur lors de la deconnexion");
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
      title: "Revoquer cette session ?",
      description: "L'appareil sera immediatement deconnecte de votre compte.",
    },
    "revoke-all": {
      title: "Deconnecter les autres sessions ?",
      description: "Toutes les autres sessions seront immediatement revoquees. Seule votre session actuelle restera active.",
    },
    cancel: {
      title: "Se deconnecter ?",
      description: "Vous serez deconnecte de cet appareil et redirige vers la page de connexion.",
    },
  };

  // Build device label: "App de bureau sur macOS" / "App mobile"
  function buildDeviceLabel(device) {
    const typeLabels = {
      desktop: "App de bureau",
      mobile: "App mobile",
      tablet: "Tablette",
    };
    const base = typeLabels[device.deviceType] || "Appareil";
    if (device.os) return `${base} sur ${device.os}`;
    return base;
  }

  const sessionsList = (
    <>
      {loading ? (
        <div className="py-12 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-200 dark:border-gray-700 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Chargement des sessions...</p>
        </div>
      ) : devices.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
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
          {/* Alert banner */}
          {hasMultipleSessions && (
            <div className="mb-6 border border-amber-200 dark:border-amber-800/40 bg-amber-50/80 dark:bg-amber-950/20 rounded-lg py-3 px-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Connexion simultanee detectee
                  </p>
                  <p className="text-[13px] text-amber-700/80 dark:text-amber-300/80 mt-1 leading-relaxed">
                    Vous etes deja connecte sur un autre appareil. Une seule connexion est autorisee a la fois.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Device list */}
          <div className="space-y-0">
            {devices.map((device) => {
              const isCurrentSession = currentSessionToken && device.sessionToken === currentSessionToken;
              const label = buildDeviceLabel(device);

              return (
                <div
                  key={device.id}
                  className="flex items-center gap-4 py-4 border-b border-gray-100 dark:border-gray-800/60 last:border-b-0"
                >
                  <DeviceIcon type={device.deviceType} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {isCurrentSession ? (
                        <>
                          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                            Session active
                          </span>
                          {(device.location || device.ip) && (
                            <>
                              <span className="text-xs text-muted-foreground/40">&middot;</span>
                              <span className="text-xs text-muted-foreground">{device.location || device.ip}</span>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          {(device.location || device.ip) && (
                            <span className="text-xs text-muted-foreground">{device.location || device.ip}</span>
                          )}
                          {(device.location || device.ip) && device.lastActivity && (
                            <span className="text-xs text-muted-foreground/40">&middot;</span>
                          )}
                          {device.lastActivity && (
                            <span className="text-xs text-muted-foreground">{device.lastActivity}</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Revoke button */}
                  {!isCurrentSession && (
                    <button
                      onClick={() => setConfirmDialog({ open: true, type: "revoke-one", sessionToken: device.sessionToken })}
                      disabled={revoking === device.sessionToken}
                      className="text-xs text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors duration-150 cursor-pointer flex-shrink-0 disabled:opacity-50"
                    >
                      {revoking === device.sessionToken ? "..." : "Revoquer"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-6">
            {hasMultipleSessions ? (
              <>
                <Button
                  onClick={() => setConfirmDialog({ open: true, type: "cancel", sessionToken: null })}
                  variant="outline"
                  size="sm"
                  disabled={revoking !== null}
                  className="sm:w-auto"
                >
                  Se deconnecter
                </Button>
                <Button
                  onClick={() => setConfirmDialog({ open: true, type: "revoke-all", sessionToken: null })}
                  variant="primary"
                  size="sm"
                  disabled={revoking !== null}
                  className="sm:w-auto"
                >
                  {revoking === "all" ? "Deconnexion..." : "Garder cette session uniquement"}
                </Button>
              </>
            ) : (
              <Button
                onClick={async () => {
                  await activateOrganization();
                  router.push("/dashboard");
                }}
                variant="primary"
                size="sm"
                className="sm:w-auto"
              >
                Continuer
              </Button>
            )}
          </div>
        </>
      )}
    </>
  );

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen">
        <div className="w-1/2 flex items-center justify-center p-8">
          <div className="mx-auto sm:max-w-md w-full">
            <h3 className="text-3xl font-medium text-foreground">
              Sessions actives
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Gerez les appareils connectes a votre compte.
            </p>

            <div className="mt-8">
              {sessionsList}
            </div>

            <p className="mt-8 text-xs text-muted-foreground/60 leading-relaxed">
              Si vous ne reconnaissez pas un appareil, revoquez sa session et changez votre mot de passe.
            </p>
          </div>
        </div>
        <div className="w-1/2 p-2 flex items-center min-h-screen justify-center">
          <div className="flex flex-col p-5 items-center justify-center w-full h-full rounded-lg bg-[#5A50FF]/30 relative">
            <img
              src="/illustrations/mobile-encryption.svg"
              alt="Securite des appareils"
              className="w-80 h-auto max-w-full"
            />
            <p className="mt-6 text-[15px] font-medium text-white/90 text-center max-w-xs">
              Votre compte est protege. Une seule session active a la fois.
            </p>
            <img
              src="/ni.svg"
              alt="Newbi Logo"
              className="absolute bottom-2 right-3 w-5 h-auto filter brightness-0 invert"
              style={{ opacity: 0.9 }}
            />
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden min-h-screen bg-background flex flex-col">
        <div className="pt-10 flex justify-center">
          <img src="/newbiLetter.png" alt="Newbi" className="h-5 w-auto object-contain" />
        </div>

        <div className="flex-1 flex items-start justify-center px-6 pt-8">
          <div className="w-full max-w-sm">
            <h3 className="text-2xl font-medium text-foreground text-center mb-1">
              Sessions actives
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-8">
              Gerez les appareils connectes a votre compte.
            </p>

            {sessionsList}

            <p className="mt-8 text-xs text-muted-foreground/60 leading-relaxed text-center">
              Si vous ne reconnaissez pas un appareil, revoquez sa session et changez votre mot de passe.
            </p>
          </div>
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
              {confirmDialog.type === "cancel" ? "Se deconnecter" : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function ManageDevicesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      }
    >
      <ManageDevicesContent />
    </Suspense>
  );
}
