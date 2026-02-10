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
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function EInvoicingSection({ canManageOrgSettings }) {
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
          <Separator />
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
            <Button
              onClick={handleConnect}
              disabled={!canManageOrgSettings || superPdpLoading}
              className="bg-[#5b4eff] hover:bg-[#4a3ecc] text-white"
            >
              {superPdpLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Activer la facturation électronique
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Statut connecté */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* <CheckCircle2 className="h-4 w-4 text-emerald-500" /> */}
                <span className="text-sm font-medium">Connecté à SuperPDP</span>
                {settings.eInvoicingActivatedAt && (
                  <span className="text-xs text-muted-foreground">
                    • Activé le{" "}
                    {new Date(
                      settings.eInvoicingActivatedAt
                    ).toLocaleDateString("fr-FR")}
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
          </div>
        )}
      </div>

      {/* Section Comment ça marche */}
      <div className="space-y-6 mt-8">
        <div>
          <h3 className="text-sm font-medium mb-2">Comment ça marche ?</h3>
          <Separator />
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
          <Separator />
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
