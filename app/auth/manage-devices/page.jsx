"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { authClient, performLogout } from "@/src/lib/auth-client";
import { Button } from "@/src/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { toast } from "@/src/components/ui/sonner";
import {
  Monitor,
  Smartphone,
  Tablet,
  Loader2,
  Shield,
  AlertTriangle,
} from "lucide-react";

// ─── Parsers ───

const parseBrowser = (ua) => {
  if (!ua) return "Navigateur";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("OPR") || ua.includes("Opera")) return "Opera";
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Firefox")) return "Firefox";
  return "Navigateur";
};

const parseOS = (ua) => {
  if (!ua) return "";
  if (ua.includes("Mac OS")) return "macOS";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Linux") && !ua.includes("Android")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  return "";
};

const parseDeviceType = (ua) => {
  if (!ua) return "desktop";
  if (/iPhone|Android.*Mobile/i.test(ua)) return "mobile";
  if (/iPad|Android(?!.*Mobile)/i.test(ua)) return "tablet";
  return "desktop";
};

const formatActivity = (date) => {
  if (!date) return "";
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "Actif maintenant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)}j`;
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
};

const DeviceIcon = ({ type, className }) => {
  const Icon =
    type === "mobile" ? Smartphone : type === "tablet" ? Tablet : Monitor;
  return <Icon className={className} />;
};

// ─── Main ───

function ManageDevicesContent() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(null);
  const [currentToken, setCurrentToken] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: null,
    token: null,
  });

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch("/api/check-session-limit");
        const data = await res.json();
        setCurrentToken(data.currentSessionToken);
        setSessions(
          (data.sessions || []).map((s) => ({
            ...s,
            browser: parseBrowser(s.userAgent),
            os: parseOS(s.userAgent),
            deviceType: parseDeviceType(s.userAgent),
            activity: formatActivity(s.updatedAt || s.createdAt),
            isCurrent: s.token === data.currentSessionToken,
          })),
        );
      } catch {
        toast.error("Impossible de charger les sessions");
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const handleRevoke = async (token) => {
    setRevoking(token);
    try {
      const res = await fetch("/api/revoke-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken: token }),
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.token !== token));
        toast.success("Session révoquée");
      }
    } catch {
      toast.error("Erreur lors de la révocation");
    } finally {
      setRevoking(null);
      setConfirmDialog({ open: false, type: null, token: null });
    }
  };

  const handleRevokeAll = async () => {
    setRevoking("all");
    try {
      const res = await fetch("/api/revoke-all-other-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentSessionToken: currentToken }),
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.isCurrent));
        toast.success("Toutes les autres sessions ont été révoquées");
      }
    } catch {
      toast.error("Erreur lors de la révocation");
    } finally {
      setRevoking(null);
      setConfirmDialog({ open: false, type: null, token: null });
    }
  };

  const handleContinue = async () => {
    try {
      const { data: orgs } = await authClient.organization.list();
      if (orgs?.length > 0) {
        const activeOrg = orgs.find((o) => o.isActive) || orgs[0];
        await authClient.organization.setActive({
          organizationId: activeOrg.id,
        });
      }
      router.push("/dashboard");
    } catch {
      router.push("/dashboard");
    }
  };

  const otherSessions = sessions.filter((s) => !s.isCurrent);
  const hasMultiple = otherSessions.length > 0;

  return (
    <main className="min-h-[100dvh] bg-background">
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-12 md:py-20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <Shield className="size-5 text-muted-foreground" />
          <h1 className="text-xl font-medium text-foreground">
            Sécurité & accès
          </h1>
        </div>
        <p className="text-[13px] text-muted-foreground mb-8 ml-8">
          Gérez vos sessions actives et les appareils connectés à votre compte.
        </p>

        {/* Alert banner — only if multiple sessions */}
        {hasMultiple && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 mb-6">
            <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[13px] text-amber-800 dark:text-amber-200">
                {otherSessions.length} autre
                {otherSessions.length > 1 ? "s" : ""} session
                {otherSessions.length > 1 ? "s" : ""} active
                {otherSessions.length > 1 ? "s" : ""} détectée
                {otherSessions.length > 1 ? "s" : ""}.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setConfirmDialog({
                  open: true,
                  type: "revoke-all",
                  token: null,
                })
              }
              className="text-[12px] text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 font-medium shrink-0 cursor-pointer"
            >
              Tout révoquer
            </button>
          </div>
        )}

        {/* Section: Active sessions */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider">
              Sessions actives
            </h2>
            <span className="text-[12px] text-muted-foreground">
              {sessions.length} session{sessions.length > 1 ? "s" : ""}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-[13px] text-muted-foreground text-center py-8">
              Aucune session active
            </p>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/30 transition-colors"
                >
                  <DeviceIcon
                    type={session.deviceType}
                    className="size-4 text-muted-foreground shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-foreground truncate">
                        {session.browser} sur {session.os || "Inconnu"}
                      </span>
                      {session.isCurrent && (
                        <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full shrink-0">
                          Cette session
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground/60">
                      {session.activity}
                      {session.ipAddress &&
                        !session.ipAddress.includes("0000") && (
                          <span> · {session.ipAddress}</span>
                        )}
                    </p>
                  </div>

                  {!session.isCurrent && (
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmDialog({
                          open: true,
                          type: "revoke-one",
                          token: session.token,
                        })
                      }
                      disabled={revoking === session.token}
                      className="text-[12px] text-muted-foreground/40 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                      aria-label={`Révoquer la session ${session.browser} sur ${session.os}`}
                    >
                      {revoking === session.token ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        "Révoquer"
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <p className="text-[11px] text-muted-foreground/40 mt-3">
            Les sessions inactives expirent automatiquement après 30 jours.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleContinue}
            className="bg-[#5A50FF]/90 hover:bg-[#5A50FF] text-white border-0 [box-shadow:none] rounded-lg cursor-pointer"
          >
            Continuer vers le dashboard
          </Button>
          <Button
            variant="outline"
            onClick={performLogout}
            className="rounded-lg cursor-pointer bg-background"
          >
            Se déconnecter
          </Button>
        </div>
      </div>

      {/* Confirm dialog */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          !open && setConfirmDialog({ open: false, type: null, token: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.type === "revoke-all"
                ? "Révoquer toutes les autres sessions ?"
                : "Révoquer cette session ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.type === "revoke-all"
                ? "Toutes les sessions sauf la session actuelle seront déconnectées."
                : "L'appareil sera déconnecté immédiatement."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                confirmDialog.type === "revoke-all"
                  ? handleRevokeAll()
                  : handleRevoke(confirmDialog.token)
              }
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {revoking ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Révoquer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

export default function ManageDevicesPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[100dvh] bg-background flex items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </main>
      }
    >
      <ManageDevicesContent />
    </Suspense>
  );
}
