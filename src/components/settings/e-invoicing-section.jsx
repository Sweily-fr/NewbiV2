"use client";

import React, { useState, useEffect } from "react";
import {
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  FileCheck,
  Shield,
  Clock,
  Send,
  LogOut,
  ExternalLink,
} from "lucide-react";
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

// Libellés des régimes TVA SuperPDP (pilotent le calendrier e-reporting au PPF)
const VAT_REGIME_LABELS = {
  monthly: "Mensuel",
  quarterly: "Trimestriel",
  simplified: "Réel simplifié",
  vat_exemption: "Franchise en base",
};

/**
 * Déduit le régime TVA SuperPDP à partir des informations légales de
 * l'organisation (onglet « Informations légales »).
 * Renvoie null si l'information n'est pas renseignée → l'activation de la
 * facturation électronique doit alors être bloquée.
 */
function deriveVatRegime(org) {
  if (!org) return null;
  // Non assujetti à la TVA → franchise en base
  if (org.isVatSubject === false) return "vat_exemption";
  if (org.isVatSubject !== true) return null; // information non renseignée

  switch (org.vatRegime) {
    case "reel-simplifie":
      return "simplified";
    case "reel-normal":
      if (org.vatFrequency === "mensuel") return "monthly";
      if (org.vatFrequency === "trimestriel") return "quarterly";
      return null; // fréquence non renseignée
    default:
      return null; // régime de TVA non renseigné
  }
}

/**
 * Formate la date d'activation de façon défensive : ne renvoie jamais
 * « Invalid Date » si la valeur est absente ou non parsable.
 */
function formatActivatedDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("fr-FR");
}

/**
 * Interprète l'état d'une entrée d'annuaire (Peppol/PPF). Le PPF renvoie un 422
 * « ligne d'annuaire déjà active » lorsque l'entreprise est déjà inscrite : on
 * traite ce cas comme une inscription valide plutôt que d'afficher l'erreur brute.
 */
function getDirectoryEntryDisplay(entry) {
  if (entry.status === "created") {
    return { label: "Inscrit", className: "text-green-600", rank: 3 };
  }
  const msg = entry.statusMessage || "";
  if (
    entry.status === "error" &&
    /d[eè]j[aà] active|already active|ligne-annuaire/i.test(msg)
  ) {
    return { label: "Déjà inscrit", className: "text-green-600", rank: 3 };
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

  // Vérification KYC/KYB + annuaire (uniquement si e-invoicing activé)
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

  // Le régime TVA est déduit des « Informations légales » (source de vérité).
  // Null = information non renseignée → activation de l'e-invoicing bloquée.
  const derivedVatRegime = deriveVatRegime(organization);

  // Synchronise le régime TVA déduit vers SuperPDP quand il diffère de la valeur
  // enregistrée côté plateforme (pilote le calendrier e-reporting au PPF).
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

  // Gérer les paramètres de retour OAuth
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const message = searchParams.get("message");

    if (success === "true") {
      toast.success(message || "Connexion à SuperPDP réussie !");
      refetch();
      // Nettoyer l'URL
      window.history.replaceState({}, "", window.location.pathname);
    } else if (error) {
      toast.error(error);
      // Nettoyer l'URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams, refetch]);

  // Vérifier le statut au chargement
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium">Facturation électronique</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Conformez-vous à la réforme française de la facturation électronique
        </p>
      </div>

      {/* Section principale */}
      <div className="space-y-6">
        {/* Titre section */}
        <div>
          <h3 className="text-sm font-medium mb-2">Configuration</h3>
          <Separator className="bg-[#eeeff1] dark:bg-[#232323]" />
        </div>

        {/* Connexion SuperPDP via OAuth2 */}
        {!settings.eInvoicingEnabled ? (
          <div className="space-y-4">
            <div className="flex-1">
              <h4 className="text-sm font-normal mb-1">
                Connecter votre compte SuperPDP
              </h4>
              <p className="text-xs text-gray-400">
                Connectez votre compte SuperPDP pour activer l'envoi automatique
                de vos factures électroniques
              </p>
            </div>
            {!derivedVatRegime && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-900/20 p-3">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
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
              className="bg-[#5b4eff] hover:bg-[#4a3ecc] text-white"
            >
              {superPdpLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Activer la facturation électronique
            </Button>
            {isInTrial && (
              <p className="text-xs text-gray-400">
                La facturation électronique est réservée aux abonnements
                payants.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Statut connecté */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* <CheckCircle2 className="h-4 w-4 text-emerald-500" /> */}
                <span className="text-sm font-medium">Connecté à SuperPDP</span>
                {formatActivatedDate(settings.eInvoicingActivatedAt) && (
                  <span className="text-xs text-muted-foreground">
                    • Activé le{" "}
                    {formatActivatedDate(settings.eInvoicingActivatedAt)}
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={!canManageOrgSettings || superPdpLoading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {superPdpLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <LogOut className="h-4 w-4 mr-2" />
                )}
                Déconnecter
              </Button>
            </div>

            <p className="text-xs text-gray-400">
              Vos factures seront automatiquement transmises à la plateforme
              SuperPDP lors de leur validation
            </p>

            {/* Stats minimalistes */}
            {!statsLoading && stats.totalSent > 0 && (
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="font-semibold">{stats.totalSent}</span>
                  <span className="text-muted-foreground ml-1">envoyées</span>
                </div>
                <div>
                  <span className="text-green-600 font-semibold">
                    {stats.ACCEPTED + stats.PAID}
                  </span>
                  <span className="text-muted-foreground ml-1">acceptées</span>
                </div>
                {stats.ERROR + stats.REJECTED > 0 && (
                  <div>
                    <span className="text-red-600 font-semibold">
                      {stats.ERROR + stats.REJECTED}
                    </span>
                    <span className="text-muted-foreground ml-1">erreurs</span>
                  </div>
                )}
              </div>
            )}

            {/* Entreprise connectée + statut de vérification KYC/KYB */}
            {verification?.connected && (
              <div className="mt-4 rounded-lg border border-[#eeeff1] dark:border-[#232323] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {verification.company?.formalName ||
                        "Entreprise connectée"}
                    </span>
                    {verification.company?.number && (
                      <span className="text-xs text-muted-foreground">
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
                            cls: "bg-green-50 text-green-600 dark:bg-green-900/20",
                            Icon: CheckCircle2,
                          }
                        : v === "failed"
                          ? {
                              label: "Vérification refusée",
                              cls: "bg-red-50 text-red-600 dark:bg-red-900/20",
                              Icon: AlertCircle,
                            }
                          : {
                              label: "Vérification en cours",
                              cls: "bg-amber-50 text-amber-600 dark:bg-amber-900/20",
                              Icon: Clock,
                            };
                    const Icon = cfg.Icon;
                    return (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${cfg.cls}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {cfg.label}
                      </span>
                    );
                  })()}
                </div>
                {verification.companyVerificationStatus !== "verified" && (
                  <p className="text-xs text-amber-600">
                    L'émission et la réception de factures électroniques seront
                    actives une fois la vérification de votre entreprise validée
                    par SuperPDP.
                  </p>
                )}
              </div>
            )}

            {/* Recevoir des factures : inscription à l'annuaire (Peppol + PPF) */}
            {verification?.connected && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      Recevoir des factures
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {allDirectoriesRegistered
                        ? "Votre entreprise est inscrite aux annuaires Peppol et PPF"
                        : "Inscrivez votre entreprise aux annuaires Peppol et PPF"}
                    </span>
                  </div>
                  {allDirectoriesRegistered ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-600 dark:bg-green-900/20">
                      <CheckCircle2 className="h-3.5 w-3.5" />
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
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      {directoryRegistrationPending
                        ? "En cours…"
                        : "S'inscrire"}
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

            {/* Régime TVA — déduit des « Informations légales » (lecture seule). */}
            {verification?.connected && (
              <div className="mt-4 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Régime de TVA</span>
                  <span className="text-xs text-muted-foreground">
                    Issu de vos{" "}
                    <button
                      type="button"
                      onClick={goToLegalInfo}
                      className="underline hover:text-foreground"
                    >
                      informations légales
                    </button>{" "}
                    · pilote la fréquence d'envoi e-reporting au PPF
                  </span>
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

            {/* Historique des déclarations e-reporting (PPF) */}
            {verification?.connected && eReportings.length > 0 && (
              <div className="mt-4 space-y-2">
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
      </div>

      {/* Section Comment ça marche */}
      <div className="space-y-6 mt-8">
        <div>
          <h3 className="text-sm font-medium mb-2">Comment ça marche ?</h3>
          <Separator className="bg-[#eeeff1] dark:bg-[#232323]" />
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
              <FileCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-normal">Création automatique</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Lors de la validation d'une facture, elle est automatiquement
                convertie au format Factur-X (EN16931) et envoyée à SuperPDP
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
              <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-normal">Validation et conformité</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                SuperPDP vérifie la conformité de votre facture selon les normes
                françaises et européennes
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
              <Send className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-normal">Transmission sécurisée</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Votre facture est transmise de manière sécurisée au destinataire
                via le réseau Chorus Pro ou PEPPOL
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-normal">Suivi en temps réel</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Suivez le statut de vos factures en temps réel : validation,
                envoi, réception, acceptation ou rejet
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section Réforme */}
      <div className="space-y-6 mt-8">
        <div>
          <h3 className="text-sm font-medium mb-2">
            Réforme de la facturation électronique
          </h3>
          <Separator className="bg-[#eeeff1] dark:bg-[#232323]" />
        </div>

        <div className="bg-[#5b4eff]/10 dark:bg-[#5b4eff]/20 rounded-lg p-4">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-normal text-blue-900 dark:text-blue-100">
                Septembre 2026 : Réception obligatoire
              </p>
              <p className="text-xs text-blue-900 dark:text-blue-300 mt-1">
                Toutes les entreprises françaises devront être en mesure de
                recevoir des factures électroniques
              </p>
            </div>
            <div>
              <p className="text-sm font-normal text-blue-900 dark:text-blue-100">
                Septembre 2027 : Émission obligatoire (TPE/PME)
              </p>
              <p className="text-xs text-blue-900 dark:text-blue-300 mt-1">
                Les TPE et PME devront émettre leurs factures en format
                électronique via une plateforme agréée
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lien SuperPDP */}
      <a
        href="https://www.superpdp.tech"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between py-3 px-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Zap className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-medium group-hover:text-[#5b4fff] transition-colors">
              Propulsé par SuperPDP
            </p>
            <p className="text-xs text-muted-foreground">
              Plateforme de Dématérialisation Partenaire agréée par l'État
            </p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#5b4fff] transition-colors" />
      </a>

      {/* Avertissement permissions */}
      {!canManageOrgSettings && (
        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 mt-4">
          <AlertCircle className="h-4 w-4" />
          <span>
            Seuls les administrateurs peuvent modifier ces paramètres.
          </span>
        </div>
      )}
    </div>
  );
}
