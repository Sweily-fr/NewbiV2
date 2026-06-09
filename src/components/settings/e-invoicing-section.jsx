"use client";

import React, { useState, useEffect } from "react";
import { Loader2, ChevronRight } from "lucide-react";
import {
  ClipboardTickIcon,
  HealthIcon,
  SendIcon,
  ReceiptSearchIcon,
  Link2Icon,
  LogoutIcon,
  RoutingIcon,
  SlashIcon,
  NotificationIcon,
} from "@/src/components/icons";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import {
  useEInvoicingSettings,
  useEInvoicingStats,
} from "@/src/hooks/useEInvoicing";
import { useSuperPdp } from "@/src/hooks/useSuperPdp";
import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useQuery, useMutation } from "@apollo/client";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import {
  EINVOICING_VERIFICATION,
  EINVOICING_DIRECTORY_ENTRIES,
  REGISTER_EINVOICING_DIRECTORY,
  UPDATE_EINVOICING_VAT_REGIME,
  EINVOICING_EREPORTINGS,
} from "@/src/graphql/eInvoicingQueries";

const VAT_REGIME_LABELS = {
  monthly: "Mensuel",
  quarterly: "Trimestriel",
  simplified: "Réel simplifié",
  vat_exemption: "Franchise en base",
};

function deriveVatRegime(org) {
  if (!org) return null;
  if (org.isVatSubject === false) return "vat_exemption";
  if (org.isVatSubject !== true) return null;

  switch (org.vatRegime) {
    case "reel-simplifie":
      return "simplified";
    case "reel-normal":
      if (org.vatFrequency === "trimestriel") return "quarterly";
      // Réel normal sans fréquence explicite = déclaration mensuelle (défaut CGI).
      return "monthly";
    default:
      return null;
  }
}

function formatActivatedDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("fr-FR");
}

function getDirectoryEntryDisplay(entry) {
  if (entry.status === "created") {
    return { label: "Inscrit", className: "text-emerald-600", rank: 3 };
  }
  const msg = entry.statusMessage || "";
  if (
    entry.status === "error" &&
    /d[eè]j[aà] active|already active|ligne-annuaire/i.test(msg)
  ) {
    return { label: "Déjà inscrit", className: "text-emerald-600", rank: 3 };
  }
  if (entry.status === "error") {
    return {
      label: "Échec de l'inscription",
      className: "text-red-600",
      rank: 0,
    };
  }
  return { label: "En cours", className: "text-amber-600", rank: 1 };
}

/**
 * Chaque inscription crée une nouvelle entrée côté SuperPDP : on peut donc avoir
 * plusieurs entrées pour un même annuaire (ex. un « En cours » + un « Inscrit »).
 * On n'en garde qu'une par annuaire, celle au statut le plus avancé.
 */
function dedupeDirectoryEntries(entries) {
  const byDirectory = new Map();
  for (const entry of entries) {
    const current = byDirectory.get(entry.directory);
    if (
      !current ||
      getDirectoryEntryDisplay(entry).rank >
        getDirectoryEntryDisplay(current).rank
    ) {
      byDirectory.set(entry.directory, entry);
    }
  }
  return Array.from(byDirectory.values());
}

export function EInvoicingSection({
  canManageOrgSettings,
  organization,
  onNavigateToTab,
}) {
  const {
    settings,
    loading: settingsLoading,
    refetch,
  } = useEInvoicingSettings();
  const { stats, loading: statsLoading } = useEInvoicingStats();
  const {
    connect,
    disconnect,
    checkStatus,
    loading: superPdpLoading,
    status,
  } = useSuperPdp();
  const searchParams = useSearchParams();
  const { isReadOnly, isOwner, isInTrial } = useSubscriptionAccess();
  const { workspaceId } = useRequiredWorkspace();

  const skipEInvoicing = !workspaceId || !settings?.eInvoicingEnabled;
  const { data: verificationData } = useQuery(EINVOICING_VERIFICATION, {
    variables: { workspaceId },
    skip: skipEInvoicing,
    fetchPolicy: "cache-and-network",
  });
  const verification = verificationData?.eInvoicingVerification;

  const { data: directoryData, refetch: refetchDirectory } = useQuery(
    EINVOICING_DIRECTORY_ENTRIES,
    {
      variables: { workspaceId },
      skip: skipEInvoicing,
      fetchPolicy: "cache-and-network",
    },
  );
  const directoryEntries = dedupeDirectoryEntries(
    directoryData?.eInvoicingDirectoryEntries || [],
  );

  // L'entreprise peut RECEVOIR des factures une fois inscrite aux deux annuaires
  // (Peppol + PPF). On masque alors le bouton « S'inscrire ».
  const REQUIRED_DIRECTORIES = ["peppol", "ppf"];
  const registeredDirectories = new Set(
    directoryEntries
      .filter((e) => getDirectoryEntryDisplay(e).rank === 3)
      .map((e) => e.directory),
  );
  const allDirectoriesRegistered = REQUIRED_DIRECTORIES.every((d) =>
    registeredDirectories.has(d),
  );
  const directoryRegistrationPending = directoryEntries.some(
    (e) => getDirectoryEntryDisplay(e).rank === 1,
  );

  const { data: eReportingData } = useQuery(EINVOICING_EREPORTINGS, {
    variables: { workspaceId },
    skip: skipEInvoicing,
    fetchPolicy: "cache-and-network",
  });
  const eReportings = eReportingData?.eInvoicingEReportings || [];

  const [registerDirectory, { loading: registeringDirectory }] = useMutation(
    REGISTER_EINVOICING_DIRECTORY,
  );

  const handleRegisterDirectory = async () => {
    try {
      await registerDirectory({ variables: { workspaceId } });
      await refetchDirectory();
      toast.success("Inscription à l'annuaire envoyée");
    } catch (e) {
      toast.error(e.message || "Échec de l'inscription à l'annuaire");
    }
  };

  const [updateVatRegime] = useMutation(UPDATE_EINVOICING_VAT_REGIME);

  const derivedVatRegime = deriveVatRegime(organization);

  const syncedVatRegimeRef = React.useRef(null);
  useEffect(() => {
    if (!verification?.connected || !derivedVatRegime) return;
    if (verification?.company?.vatRegime === derivedVatRegime) return;
    if (syncedVatRegimeRef.current === derivedVatRegime) return;
    syncedVatRegimeRef.current = derivedVatRegime;
    updateVatRegime({
      variables: { workspaceId, vatRegime: derivedVatRegime },
    }).catch(() => {
      syncedVatRegimeRef.current = null;
    });
  }, [verification, derivedVatRegime, workspaceId, updateVatRegime]);

  const goToLegalInfo = () => onNavigateToTab?.("informations-legales");
  const readOnlyTooltip = isReadOnly
    ? isOwner
      ? "Mode lecture seule · Renouvelez votre abonnement"
      : "Mode lecture seule · Contactez l'administrateur"
    : undefined;

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const message = searchParams.get("message");

    if (success === "true") {
      toast.success(message || "Connexion à SuperPDP réussie !");
      refetch();
      window.history.replaceState({}, "", window.location.pathname);
    } else if (error) {
      toast.error(error);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams, refetch]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleConnect = async () => {
    await connect();
  };

  const handleDisconnect = async () => {
    await disconnect();
    refetch();
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium mb-1 hidden md:block">
          Facturation électronique
        </h2>
        <p className="text-sm text-muted-foreground mb-4 hidden md:block">
          Conformez-vous à la réforme française de la facturation électronique.
        </p>
        <Separator className="hidden md:block bg-[#eeeff1] dark:bg-[#232323]" />
      </div>

      {/* Connexion SuperPDP */}
      {!settings.eInvoicingEnabled ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-1">
              Connecter votre compte SuperPDP
            </h3>
            <p className="text-xs text-muted-foreground">
              Connectez votre compte SuperPDP pour activer l'envoi automatique
              de vos factures électroniques.
            </p>
          </div>
          {!derivedVatRegime && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-900/20 p-3">
              <NotificationIcon className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-700 dark:text-amber-400">
                Renseignez votre{" "}
                <button
                  type="button"
                  onClick={goToLegalInfo}
                  className="underline font-medium hover:text-amber-800"
                >
                  régime de TVA
                </button>{" "}
                dans les informations légales avant d'activer la facturation
                électronique.
              </div>
            </div>
          )}
          <Button
            onClick={handleConnect}
            disabled={
              isReadOnly ||
              isInTrial ||
              !canManageOrgSettings ||
              superPdpLoading ||
              !derivedVatRegime
            }
            title={
              isInTrial
                ? "Réservé aux abonnements payants"
                : !derivedVatRegime
                  ? "Renseignez votre régime de TVA dans les informations légales"
                  : readOnlyTooltip
            }
            variant="primary"
          >
            {superPdpLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Link2Icon className="h-4 w-4 mr-2" />
            )}
            Activer la facturation électronique
          </Button>
          {isInTrial && (
            <p className="text-xs text-muted-foreground">
              La facturation électronique est réservée aux abonnements payants.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Statut connecté */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-normal mb-1">Connecté à SuperPDP</h4>
              <p className="text-xs text-gray-400">
                {formatActivatedDate(settings.eInvoicingActivatedAt)
                  ? `Activé le ${formatActivatedDate(settings.eInvoicingActivatedAt)}`
                  : "Votre compte est lié à SuperPDP"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={!canManageOrgSettings || superPdpLoading}
            >
              {superPdpLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <LogoutIcon className="h-4 w-4 mr-2" />
              )}
              Déconnecter
            </Button>
          </div>

          {/* Stats */}
          {!statsLoading && stats.totalSent > 0 && (
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="font-medium">{stats.totalSent}</span>
                <span className="text-muted-foreground ml-1">envoyées</span>
              </div>
              <div>
                <span className="font-medium">
                  {stats.ACCEPTED + stats.PAID}
                </span>
                <span className="text-muted-foreground ml-1">acceptées</span>
              </div>
              {stats.ERROR + stats.REJECTED > 0 && (
                <div>
                  <span className="font-medium">
                    {stats.ERROR + stats.REJECTED}
                  </span>
                  <span className="text-muted-foreground ml-1">erreurs</span>
                </div>
              )}
            </div>
          )}

          {/* Entreprise + statut de vérification */}
          {verification?.connected && (
            <div className="rounded-xl border bg-[#F5F5F5] dark:bg-neutral-900 px-4 py-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {verification.company?.formalName || "Entreprise connectée"}
                  </span>
                  {verification.company?.number && (
                    <span className="text-xs text-gray-400">
                      SIREN {verification.company.number}
                    </span>
                  )}
                </div>
                {(() => {
                  const v = verification.companyVerificationStatus;
                  const cfg =
                    v === "verified"
                      ? {
                          label: "Vérifiée",
                          className:
                            "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
                          Icon: ClipboardTickIcon,
                        }
                      : v === "failed"
                        ? {
                            label: "Vérification refusée",
                            className:
                              "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
                            Icon: SlashIcon,
                          }
                        : {
                            label: "Vérification en cours",
                            className:
                              "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
                            Icon: RoutingIcon,
                          };
                  const Icon = cfg.Icon;
                  return (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap ${cfg.className}`}
                    >
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  );
                })()}
              </div>
              {verification.companyVerificationStatus !== "verified" && (
                <p className="text-xs text-gray-400">
                  L'émission et la réception seront actives une fois la
                  vérification validée par SuperPDP.
                </p>
              )}
            </div>
          )}

          {/* Recevoir des factures */}
          {verification?.connected && (
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-normal mb-1">
                    Recevoir des factures
                  </h4>
                  <p className="text-xs text-gray-400">
                    {allDirectoriesRegistered
                      ? "Votre entreprise est inscrite aux annuaires Peppol et PPF"
                      : "Inscrivez votre entreprise aux annuaires Peppol et PPF"}
                  </p>
                </div>
                {allDirectoriesRegistered ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                    <ClipboardTickIcon className="w-3 h-3" />
                    Inscrit
                  </span>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegisterDirectory}
                    disabled={
                      !canManageOrgSettings ||
                      registeringDirectory ||
                      directoryRegistrationPending
                    }
                  >
                    {registeringDirectory || directoryRegistrationPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <SendIcon className="h-4 w-4 mr-2" />
                    )}
                    {directoryRegistrationPending ? "En cours…" : "S'inscrire"}
                  </Button>
                )}
              </div>
              {directoryEntries.length > 0 && (
                <div className="flex flex-col gap-1">
                  {directoryEntries.map((entry) => {
                    const display = getDirectoryEntryDisplay(entry);
                    return (
                      <div
                        key={
                          entry.id || `${entry.directory}-${entry.identifier}`
                        }
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="uppercase text-muted-foreground">
                          {entry.directory}
                        </span>
                        <span className={display.className}>
                          {display.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Régime TVA (lecture seule, dérivé des informations légales) */}
          {verification?.connected && (
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-normal mb-1">Régime de TVA</h4>
                <p className="text-xs text-gray-400">
                  Issu de vos{" "}
                  <button
                    type="button"
                    onClick={goToLegalInfo}
                    className="underline hover:text-foreground"
                  >
                    informations légales
                  </button>{" "}
                  · pilote la fréquence d'envoi e-reporting au PPF
                </p>
              </div>
              {derivedVatRegime ? (
                <span className="text-sm font-medium">
                  {VAT_REGIME_LABELS[derivedVatRegime]}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={goToLegalInfo}
                  className="text-sm text-amber-600 underline"
                >
                  À renseigner
                </button>
              )}
            </div>
          )}

          {/* Historique déclarations PPF */}
          {verification?.connected && eReportings.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Déclarations PPF</span>
              <div className="flex flex-col gap-1">
                {eReportings.slice(0, 8).map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between text-xs text-muted-foreground"
                  >
                    <span>
                      {r.kind === "payment" ? "Paiements" : "Transactions"}
                    </span>
                    <span>
                      {r.startPeriod
                        ? new Date(r.startPeriod).toLocaleDateString("fr-FR")
                        : "—"}
                      {" → "}
                      {r.endPeriod
                        ? new Date(r.endPeriod).toLocaleDateString("fr-FR")
                        : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comment ça marche */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Comment ça marche ?</h3>
        <div className="space-y-5">
          {[
            {
              Icon: ClipboardTickIcon,
              title: "Création automatique",
              description:
                "Lors de la validation d'une facture, elle est automatiquement convertie au format Factur-X (EN16931) et envoyée à SuperPDP.",
            },
            {
              Icon: HealthIcon,
              title: "Validation et conformité",
              description:
                "SuperPDP vérifie la conformité de votre facture selon les normes françaises et européennes.",
            },
            {
              Icon: SendIcon,
              title: "Transmission sécurisée",
              description:
                "Votre facture est transmise de manière sécurisée au destinataire via le réseau Chorus Pro ou PEPPOL.",
            },
            {
              Icon: ReceiptSearchIcon,
              title: "Suivi en temps réel",
              description:
                "Suivez le statut de vos factures en temps réel : validation, envoi, réception, acceptation ou rejet.",
            },
          ].map(({ Icon, title, description }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-md bg-[#f6f6f7] dark:bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
                <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendrier de la réforme */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Calendrier de la réforme</h3>
        <div className="rounded-lg border border-[#eeeff1] dark:border-[#232323] divide-y divide-[#eeeff1] dark:divide-[#232323]">
          <div className="p-4">
            <p className="text-sm font-medium">
              Septembre 2026 — Réception obligatoire
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Toutes les entreprises françaises devront être en mesure de
              recevoir des factures électroniques.
            </p>
          </div>
          <div className="p-4">
            <p className="text-sm font-medium">
              Septembre 2027 — Émission obligatoire (TPE/PME)
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Les TPE et PME devront émettre leurs factures en format
              électronique via une plateforme agréée.
            </p>
          </div>
        </div>
      </div>

      {/* Lien SuperPDP */}
      <a
        href="https://www.superpdp.tech"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between py-3 px-4 rounded-lg border border-[#eeeff1] dark:border-[#232323] hover:bg-[#f6f6f7] dark:hover:bg-[#1a1a1a] transition-colors group"
      >
        <div>
          <p className="text-sm font-medium">Propulsé par SuperPDP</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Plateforme de Dématérialisation Partenaire agréée par l'État.
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-foreground transition-colors" />
      </a>

      {/* Avertissement permissions */}
      {!canManageOrgSettings && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <NotificationIcon className="h-3.5 w-3.5" />
          <span>
            Seuls les administrateurs peuvent modifier ces paramètres.
          </span>
        </div>
      )}
    </div>
  );
}
