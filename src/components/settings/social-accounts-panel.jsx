"use client";

import { useState } from "react";
import { Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
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
import {
  useConnectSocialAccount,
  useSocialAccountActions,
  useSocialPublishingStatus,
} from "@/src/hooks/useSocialPublishing";
import {
  SOCIAL_PLATFORMS,
  buildSettingsReturnTo,
  getPlatformLabel,
} from "@/src/utils/social-post-rules";
import {
  SocialAccountAvatar,
  SocialNetworkIcon,
  getSocialAccountName,
} from "@/app/dashboard/outils/kanban/[id]/components/social/SocialNetworkIcon";

// Rouvre la fiche « Réseaux sociaux » des applications au retour de la
// connexion (lu par ApplicationsSection)
export const SOCIAL_APP_ID = "reseaux-sociaux";
export const PENDING_SETTINGS_APP_KEY = "newbi:settings-open-app";

const PLATFORM_HINTS = {
  instagram: "Compte professionnel ou créateur",
  facebook: "Page Facebook",
  linkedin: "Profil ou page entreprise",
  twitter: "Compte X",
  tiktok: "Compte TikTok",
};

function StatusPill({ status }) {
  if (status === "active") {
    return (
      <span className="rounded-md border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-600 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
        Actif
      </span>
    );
  }
  return (
    <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
      À reconnecter
    </span>
  );
}

/**
 * Comptes de réseaux sociaux de l'espace (Paramètres > Intégrations >
 * Applications > Réseaux sociaux) : connecter, reconnecter, déconnecter.
 */
export function SocialAccountsPanel({
  workspaceId,
  canManage,
  isReadOnly,
  readOnlyTooltip,
}) {
  const status = useSocialPublishingStatus(workspaceId);
  const { connect, connectingPlatform } = useConnectSocialAccount(workspaceId);
  const { disconnect, refresh, disconnecting, refreshing } =
    useSocialAccountActions(workspaceId);
  const [toDisconnect, setToDisconnect] = useState(null);

  const manage = canManage && status.canManageAccounts;
  const locked = isReadOnly || !!connectingPlatform;

  const handleConnect = (platform) => {
    const returnTo = buildSettingsReturnTo(window.location.pathname);
    connect(platform, returnTo, {
      beforeRedirect: () => {
        try {
          window.sessionStorage.setItem(
            PENDING_SETTINGS_APP_KEY,
            SOCIAL_APP_ID,
          );
        } catch {
          // Sans stockage : les paramètres rouvrent la liste des applications
        }
      },
    });
  };

  if (status.loading && !status.loaded) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement des comptes…
      </div>
    );
  }

  if (!status.enabled) {
    return (
      <p className="rounded-xl border border-[#eeeff1] bg-[#f8f9fa] px-3 py-2.5 text-sm text-[#505154] dark:border-[#232323] dark:bg-[#141414] dark:text-gray-400">
        La publication sur les réseaux sociaux n&apos;est pas encore disponible.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Connectez vos comptes une fois : vous pourrez ensuite programmer vos
          posts depuis vos tableaux (bouton « Programmer un post »).
        </p>
        {manage && status.accounts.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={refresh}
            disabled={refreshing}
            className="flex-shrink-0"
            title="Actualiser l'état des comptes"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Actualiser</span>
          </Button>
        )}
      </div>

      <div className="divide-y divide-[#eeeff1] overflow-hidden rounded-xl border border-[#eeeff1] dark:divide-[#232323] dark:border-[#232323]">
        {SOCIAL_PLATFORMS.map((platform) => {
          const accounts = status.accounts.filter(
            (a) => a.platform === platform,
          );
          const label = getPlatformLabel(platform);
          return (
            <div key={platform} className="space-y-2 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <SocialNetworkIcon platform={platform} size={24} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {PLATFORM_HINTS[platform]}
                    </p>
                  </div>
                </div>
                {manage && (
                  <Button
                    type="button"
                    variant={accounts.length > 0 ? "ghost" : "outline"}
                    size="sm"
                    onClick={() => handleConnect(platform)}
                    disabled={locked}
                    title={readOnlyTooltip}
                    className="flex-shrink-0"
                  >
                    {connectingPlatform === platform ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    {accounts.length > 0 ? "Ajouter un compte" : "Connecter"}
                  </Button>
                )}
              </div>

              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-[#f8f9fa] px-2.5 py-2 dark:bg-[#141414] sm:ml-8"
                >
                  <SocialAccountAvatar account={account} size={28} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {account.displayName || getSocialAccountName(account)}
                    </p>
                    {account.displayName && account.username && (
                      <p className="truncate text-xs text-muted-foreground">
                        {getSocialAccountName(account)}
                      </p>
                    )}
                  </div>
                  <StatusPill status={account.status} />
                  {manage && (
                    <div className="flex items-center gap-1">
                      {account.status !== "active" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleConnect(platform)}
                          disabled={locked}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Reconnecter
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setToDisconnect(account)}
                        disabled={disconnecting}
                        className="text-red-500 hover:text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Déconnecter</span>
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {!manage && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Votre rôle ne permet pas de gérer les comptes de réseaux sociaux.
        </p>
      )}

      <AlertDialog
        open={!!toDisconnect}
        onOpenChange={(open) => !open && setToDisconnect(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Déconnecter{" "}
              {toDisconnect ? getSocialAccountName(toDisconnect) : "ce compte"}{" "}
              ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Les posts programmés sur ce compte seront annulés. Les posts déjà
              publiés restent en ligne.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer bg-red-500 text-white hover:bg-red-600"
              onClick={async () => {
                const account = toDisconnect;
                setToDisconnect(null);
                if (account) await disconnect(account);
              }}
            >
              Déconnecter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
