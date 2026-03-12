"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Separator } from "@/src/components/ui/separator";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { useStripeConnect } from "@/src/hooks/useStripeConnect";
import { useBankingConnection } from "@/src/hooks/useBankingConnection";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { useActiveOrganization } from "@/src/lib/organization-client";
import { usePermissions } from "@/src/hooks/usePermissions";
import { useSession } from "@/src/lib/auth-client";
import { StripeConnectOnboardingModal } from "@/src/components/stripe-connect-onboarding-modal";
import {
  TabsNew,
  TabsNewList,
  TabsNewTrigger,
  TabsNewContent,
} from "@/src/components/ui/tabs-new";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  BadgeCheck,
  BarChart3,
  Zap,
  Landmark,
  CreditCard,
  Headphones,
  Sparkles,
  Mail,
  ClipboardList,
  Package,
  FileText,
  LayoutGrid,
  Globe,
  Info,
  Plus,
  ExternalLink,
} from "lucide-react";

const BRANDFETCH_CDN = "https://cdn.brandfetch.io";

// Catégories d'applications disponibles
const CATEGORIES = [
  { id: "all", label: "Toutes", icon: Package },
  { id: "payment", label: "Paiement", icon: CreditCard },
  { id: "banking", label: "Banque", icon: Landmark },
  { id: "accounting", label: "Comptabilité", icon: FileText },
  { id: "automations", label: "Automatisations", icon: Zap },
  { id: "crm", label: "CRM", icon: Headphones },
  { id: "ai", label: "Intelligence artificielle", icon: Sparkles },
  { id: "email", label: "E-mailing", icon: Mail },
  { id: "productivity", label: "Productivité", icon: ClipboardList },
];

// Applications - données statiques avec logos Brandfetch CDN
const APPLICATIONS = [
  // ── Installées (vraies intégrations du projet) ──
  {
    id: "stripe",
    name: "Stripe",
    author: "Stripe",
    description:
      "Plateforme de paiement en ligne pour encaisser vos factures et gérer vos abonnements.",
    category: "payment",
    logo: `${BRANDFETCH_CDN}/stripe.com/w/400/h/400`,
    logoBg: "#635BFF",
    installed: true,
    verified: true,
    website: "https://stripe.com",
    docs: "https://docs.stripe.com",
    support: "https://support.stripe.com",
  },
  {
    id: "bridge",
    name: "Bridge by Bankin'",
    author: "Bankin'",
    description:
      "Synchronisation bancaire automatique pour importer vos transactions en temps réel.",
    category: "banking",
    logo: `${BRANDFETCH_CDN}/bridgeapi.io/w/400/h/400`,
    logoBg: "#0047FF",
    installed: true,
    verified: true,
    website: "https://bridgeapi.io",
    docs: "https://docs.bridgeapi.io",
    support: "https://bridgeapi.io/contact",
  },
  // ── À venir ──
  {
    id: "pennylane",
    name: "Pennylane",
    author: "Pennylane",
    description:
      "Exportez automatiquement vos factures et notes de frais vers Pennylane.",
    category: "accounting",
    logo: `${BRANDFETCH_CDN}/pennylane.com/w/400/h/400`,
    logoBg: "#1A1A3E",
    installed: false,
    verified: true,
    comingSoon: true,
    website: "https://pennylane.com",
    docs: "https://pennylane.com/documentation",
    support: "https://pennylane.com/contact",
  },
  {
    id: "qonto",
    name: "Qonto",
    author: "Qonto",
    description:
      "Connectez votre compte Qonto pour synchroniser vos transactions.",
    category: "banking",
    logoBg: "#2E1065",
    logo: `${BRANDFETCH_CDN}/qonto.com/w/400/h/400`,
    installed: false,
    verified: true,
    comingSoon: true,
    website: "https://qonto.com",
    docs: "https://api-doc.qonto.com",
    support: "https://qonto.com/contact",
  },
  {
    id: "gocardless",
    name: "GoCardless",
    author: "GoCardless",
    description:
      "Collectez les paiements par prélèvement SEPA directement depuis vos factures.",
    category: "payment",
    logo: `${BRANDFETCH_CDN}/gocardless.com/w/400/h/400`,
    logoBg: "#1A1A2E",
    installed: false,
    verified: true,
    comingSoon: true,
    website: "https://gocardless.com",
    docs: "https://developer.gocardless.com",
    support: "https://gocardless.com/contact",
  },
  {
    id: "paypal",
    name: "PayPal",
    author: "PayPal",
    description:
      "Proposez PayPal comme moyen de paiement sur vos factures.",
    category: "payment",
    logo: `${BRANDFETCH_CDN}/paypal.com/w/400/h/400`,
    logoBg: "#003087",
    installed: false,
    verified: true,
    comingSoon: true,
    website: "https://paypal.com",
    docs: "https://developer.paypal.com/docs",
    support: "https://paypal.com/support",
  },
  {
    id: "zapier",
    name: "Zapier",
    author: "Zapier",
    description:
      "Connectez Newbi à plus de 5 000 applications sans code.",
    category: "automations",
    logo: `${BRANDFETCH_CDN}/zapier.com/w/400/h/400`,
    logoBg: "#FF4A00",
    installed: false,
    verified: true,
    comingSoon: true,
    website: "https://zapier.com",
    docs: "https://platform.zapier.com/docs",
    support: "https://zapier.com/help",
  },
  {
    id: "make",
    name: "Make",
    author: "Make (ex-Integromat)",
    description:
      "Créez des automatisations visuelles entre Newbi et vos outils.",
    category: "automations",
    logo: `${BRANDFETCH_CDN}/make.com/w/400/h/400`,
    logoBg: "#6D00CC",
    installed: false,
    verified: true,
    comingSoon: true,
    website: "https://make.com",
    docs: "https://www.make.com/en/help",
    support: "https://www.make.com/en/contact",
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    author: "Mailchimp",
    description:
      "Synchronisez vos clients avec vos campagnes e-mail marketing.",
    category: "email",
    logo: `${BRANDFETCH_CDN}/mailchimp.com/w/400/h/400`,
    logoBg: "#FFE01B",
    installed: false,
    verified: true,
    comingSoon: true,
    website: "https://mailchimp.com",
    docs: "https://mailchimp.com/developer",
    support: "https://mailchimp.com/contact",
  },
  {
    id: "brevo",
    name: "Brevo",
    author: "Brevo (ex-Sendinblue)",
    description:
      "Envoyez vos factures et relances via Brevo.",
    category: "email",
    logo: `${BRANDFETCH_CDN}/brevo.com/w/400/h/400`,
    logoBg: "#0B996E",
    installed: false,
    verified: true,
    comingSoon: true,
    website: "https://brevo.com",
    docs: "https://developers.brevo.com",
    support: "https://brevo.com/contact",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    author: "HubSpot",
    description:
      "Synchronisez vos contacts et deals avec votre CRM HubSpot.",
    category: "crm",
    logo: `${BRANDFETCH_CDN}/hubspot.com/w/400/h/400`,
    logoBg: "#FF7A59",
    installed: false,
    verified: true,
    comingSoon: true,
    website: "https://hubspot.com",
    docs: "https://developers.hubspot.com",
    support: "https://help.hubspot.com",
  },
  {
    id: "notion",
    name: "Notion",
    author: "Notion",
    description:
      "Créez des devis et factures directement depuis vos bases Notion.",
    category: "productivity",
    logo: `${BRANDFETCH_CDN}/notion.so/w/400/h/400`,
    installed: false,
    verified: true,
    comingSoon: true,
    website: "https://notion.so",
    docs: "https://developers.notion.com",
    support: "https://notion.so/help",
  },
  {
    id: "google-sheets",
    name: "Google Sheets",
    author: "Google",
    description:
      "Exportez automatiquement vos données de facturation vers Google Sheets.",
    category: "productivity",
    logo: `${BRANDFETCH_CDN}/google.com/w/400/h/400`,
    installed: false,
    verified: true,
    comingSoon: true,
    website: "https://sheets.google.com",
    docs: "https://developers.google.com/sheets",
    support: "https://support.google.com/docs",
  },
  {
    id: "openai",
    name: "OpenAI",
    author: "OpenAI",
    description:
      "Générez des descriptions, relances et contenus avec l'IA.",
    category: "ai",
    logo: `${BRANDFETCH_CDN}/openai.com/w/400/h/400`,
    logoBg: "#000000",
    installed: false,
    verified: true,
    comingSoon: true,
    website: "https://openai.com",
    docs: "https://platform.openai.com/docs",
    support: "https://help.openai.com",
  },
];

// ── Sous-composants ──

function AppLogo({ src, name, size = "md", bgColor }) {
  const sizes = {
    xxs: { container: 18, img: "w-full h-full", radius: 6 },
    xs: { container: 24, img: "w-full h-full", radius: 6 },
    sm: { container: 32, img: "w-full h-full", radius: 8 },
    md: { container: 40, img: "w-full h-full", radius: 12 },
    lg: { container: 56, img: "w-full h-full", radius: 18 },
  };
  const s = sizes[size];

  return (
    <div
      className="relative flex-shrink-0 overflow-hidden flex items-center justify-center"
      style={{
        width: s.container,
        height: s.container,
        borderRadius: s.radius,
        backgroundColor: bgColor || "#f3f4f6",
      }}
    >
      {/* Pseudo-border overlay — z-10 pour rester au-dessus de l'image */}
      <div className="absolute inset-0 z-10 rounded-[inherit] pointer-events-none border border-black/5 dark:border-white/10" />
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${s.img} object-contain`}
          loading="lazy"
          onError={(e) => {
            e.target.style.display = "none";
            if (e.target.nextSibling)
              e.target.nextSibling.style.display = "flex";
          }}
        />
      ) : null}
      <span
        className="text-sm font-semibold text-gray-500 dark:text-gray-400 items-center justify-center"
        style={{ display: src ? "none" : "flex" }}
      >
        {name.charAt(0)}
      </span>
    </div>
  );
}

function AppCard({ app, onClick }) {
  const isClickable = !app.comingSoon;
  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={`${isClickable ? "cursor-pointer hover:bg-[#f9f9f9] dark:hover:bg-[#1a1a1a]" : "cursor-default opacity-75"} bg-white dark:bg-[#141414] border border-[#eeeff1] dark:border-[#232323] relative rounded-2xl flex flex-col items-center justify-start gap-3 p-4 h-full transition-colors duration-75`}
    >
      {app.comingSoon && (
        <span className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-medium bg-gray-100 border border-gray-200 text-gray-500 dark:bg-[#2c2c2c] dark:border-[#3c3c3c] dark:text-gray-400 rounded-md">
          bientôt
        </span>
      )}
      <div className="flex items-start gap-3 w-full">
        <AppLogo src={app.logo} name={app.name} bgColor={app.logoBg} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-medium truncate">{app.name}</h4>
            {app.verified && (
              <BadgeCheck className="w-3.5 h-3.5 text-[#5A50FF] fill-[#5A50FF] stroke-white flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Par {app.author}</p>
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 w-full line-clamp-2">
        {app.description}
      </p>
    </div>
  );
}

function InstalledAppChip({ app, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#141414] border border-[#eeeff1] dark:border-[#232323] hover:bg-[#f9f9f9] dark:hover:bg-[#1a1a1a] cursor-pointer rounded-xl transition-colors duration-75"
    >
      <AppLogo
        src={app.logo}
        name={app.name}
        size="xs"
        bgColor={app.logoBg}
      />
      <span className="text-sm font-medium">{app.name}</span>
      {app.connected && (
        <span className="ml-auto px-2 py-0.5 text-[10px] font-medium bg-gray-100 border border-gray-200 text-gray-500 dark:bg-[#2c2c2c] dark:border-[#3c3c3c] dark:text-gray-400 rounded-md flex-shrink-0">
          Connectée
        </span>
      )}
    </div>
  );
}

function InstalledAppRow({ app, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between gap-2 bg-white dark:bg-[#141414] border border-[#eeeff1] dark:border-[#232323] hover:bg-[#f9f9f9] dark:hover:bg-[#1a1a1a] cursor-pointer rounded-2xl w-full transition-colors duration-75"
      style={{ padding: "12px 18px 12px 12px" }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <AppLogo src={app.logo} name={app.name} size="sm" bgColor={app.logoBg} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-medium">{app.name}</h4>
            {app.verified && (
              <BadgeCheck className="w-3.5 h-3.5 text-[#5A50FF] fill-[#5A50FF] stroke-white flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {app.connectionDetail || app.description}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {app.connected ? (
          <span className="px-2 py-0.5 text-[10px] font-medium bg-green-50 border border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 rounded-md">
            Connectée
          </span>
        ) : (
          <span className="px-2 py-0.5 text-[10px] font-medium bg-amber-50 border border-amber-200 text-amber-500 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400 rounded-md">
            Non connectée
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );
}

// ── Vue détail d'une app installée ──

function AppDetailView({ app, onBack, isConnected, connectionDetail, stripeActions, bankingActions }) {
  return (
    <div className="space-y-6">
      {/* Back */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="text-gray-500 cursor-pointer"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Retour
      </Button>

      {/* App header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <AppLogo
            src={app.logo}
            name={app.name}
            size="lg"
            bgColor={app.logoBg}
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{app.name}</h2>
              {app.verified && (
                <BadgeCheck className="w-4 h-4 text-[#5A50FF] fill-[#5A50FF] stroke-white" />
              )}
              {isConnected ? (
                <span className="px-2 py-0.5 text-[11px] font-medium bg-green-50 border border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 rounded-md">
                  Connectée
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[11px] font-medium bg-amber-50 border border-amber-200 text-amber-600 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400 rounded-md">
                  Non connectée
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-1">{app.description}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <TabsNew defaultValue="connexions">
        <TabsNewList className="px-0 sm:px-0">
          <TabsNewTrigger value="connexions">Connexions</TabsNewTrigger>
          <TabsNewTrigger value="a-propos">À propos</TabsNewTrigger>
        </TabsNewList>

        <TabsNewContent value="connexions" className="mt-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-1">Connexions actives</h3>
              <p className="text-xs text-gray-400">
                Gérez les connexions de cette application.
              </p>
            </div>

            {/* ── Stripe ── */}
            {app.id === "stripe" && stripeActions && (
              <>
                {isConnected ? (
                  <div className="space-y-3">
                    <div className="flex-shrink-0 flex items-center justify-between gap-6 bg-[#f8f9fa] dark:bg-[#141414] border border-[#eeeff1] dark:border-[#232323] rounded-xl px-3 py-2.5 w-full min-h-[44px] overflow-hidden">
                      <div className="flex items-center gap-3">
                        <AppLogo src={app.logo} name={app.name} size="xs" bgColor={app.logoBg} />
                        <p className="text-sm font-medium text-[#505154] dark:text-gray-400">
                          {connectionDetail || "Application connectée et active."}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 text-[11px] font-medium bg-green-50 border border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 rounded-md flex-shrink-0">
                        Active
                      </span>
                    </div>

                    {/* Stripe actions */}
                    <div className="flex items-center gap-2">
                      {stripeActions.stripeAccount && !stripeActions.stripeAccount.isOnboarded ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={stripeActions.onFinishSetup}
                          disabled={!stripeActions.canManage}
                          className="bg-[#635BFF] hover:bg-[#5A54E5] text-white cursor-pointer"
                          title={!stripeActions.canManage ? "Réservé aux owners et admins" : "Finalisez votre configuration Stripe"}
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                          Finaliser la configuration
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={stripeActions.onOpenDashboard}
                          disabled={!stripeActions.canManage}
                          className="cursor-pointer"
                          title={!stripeActions.canManage ? "Réservé aux owners et admins" : ""}
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                          Tableau de bord
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={stripeActions.onDisconnect}
                        disabled={stripeActions.isLoading || !stripeActions.canManage}
                        className="cursor-pointer text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                        title={!stripeActions.canManage ? "Réservé aux owners et admins" : ""}
                      >
                        {stripeActions.isLoading ? "..." : "Déconnecter"}
                      </Button>
                    </div>

                    {!stripeActions.canManage && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Seuls les propriétaires et administrateurs peuvent gérer Stripe Connect
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex-shrink-0 flex items-center justify-between gap-6 bg-[#f8f9fa] dark:bg-[#141414] border border-[#eeeff1] dark:border-[#232323] rounded-xl px-3 py-2 w-full min-h-[44px] overflow-hidden">
                      <div className="flex items-center gap-3">
                        <Info className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <p className="text-sm font-medium text-[#505154] dark:text-gray-400">
                          Connectez Stripe pour recevoir des paiements sur vos factures.
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={stripeActions.onConnect}
                        disabled={stripeActions.isLoading || !stripeActions.canManage}
                        className="bg-[#635BFF] hover:bg-[#5A54E5] text-white cursor-pointer"
                        title={!stripeActions.canManage ? "Réservé aux owners et admins" : ""}
                      >
                        {stripeActions.isLoading ? "Connexion..." : "Connecter"}
                      </Button>
                    </div>
                    {!stripeActions.canManage && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Seuls les propriétaires et administrateurs peuvent gérer Stripe Connect
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ── Bridge ── */}
            {app.id === "bridge" && bankingActions && (
              <>
                {isConnected ? (
                  <div className="space-y-3">
                    <div className="flex-shrink-0 flex items-center justify-between gap-6 bg-[#f8f9fa] dark:bg-[#141414] border border-[#eeeff1] dark:border-[#232323] rounded-xl px-3 py-2.5 w-full min-h-[44px] overflow-hidden">
                      <div className="flex items-center gap-3">
                        <AppLogo src={app.logo} name={app.name} size="xs" bgColor={app.logoBg} />
                        <p className="text-sm font-medium text-[#505154] dark:text-gray-400">
                          {connectionDetail || "Synchronisation bancaire active."}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 text-[11px] font-medium bg-green-50 border border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 rounded-md flex-shrink-0">
                        Active
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={bankingActions.onDisconnect}
                        disabled={bankingActions.isLoading}
                        className="cursor-pointer text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                      >
                        {bankingActions.isLoading ? "..." : "Déconnecter"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-shrink-0 flex items-center justify-between gap-6 bg-[#f8f9fa] dark:bg-[#141414] border border-[#eeeff1] dark:border-[#232323] rounded-xl px-3 py-2 w-full min-h-[44px] overflow-hidden">
                    <div className="flex items-center gap-3">
                      <Info className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <p className="text-sm font-medium text-[#505154] dark:text-gray-400">
                        Connectez votre banque pour synchroniser vos transactions.
                      </p>
                    </div>
                    <span className="px-2 py-0.5 text-[11px] font-medium bg-amber-50 border border-amber-200 text-amber-500 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400 rounded-md flex-shrink-0">
                      Non connectée
                    </span>
                  </div>
                )}
              </>
            )}

            {/* ── Autres apps (générique) ── */}
            {app.id !== "stripe" && app.id !== "bridge" && (
              <>
                {isConnected ? (
                  <div className="flex-shrink-0 flex items-center justify-between gap-6 bg-[#f8f9fa] dark:bg-[#141414] border border-[#eeeff1] dark:border-[#232323] rounded-xl px-3 py-2.5 w-full min-h-[44px] overflow-hidden">
                    <div className="flex items-center gap-3">
                      <AppLogo src={app.logo} name={app.name} size="xs" bgColor={app.logoBg} />
                      <p className="text-sm font-medium text-[#505154] dark:text-gray-400">
                        {connectionDetail || "Application connectée et active."}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 text-[11px] font-medium bg-green-50 border border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 rounded-md flex-shrink-0">
                      Active
                    </span>
                  </div>
                ) : (
                  <div className="flex-shrink-0 flex items-center justify-between gap-6 bg-[#f8f9fa] dark:bg-[#141414] border border-[#eeeff1] dark:border-[#232323] rounded-xl px-3 py-2 w-full min-h-[44px] overflow-hidden">
                    <div className="flex items-center gap-3">
                      <Info className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <p className="text-sm font-medium text-[#505154] dark:text-gray-400">
                        Cette application nécessite une connexion pour être utilisée.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-[#5b4eff] hover:bg-[#4a3eee] dark:text-white cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      Connecter
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </TabsNewContent>

        <TabsNewContent value="a-propos" className="mt-6">
          <div className="flex gap-10">
            {/* Sidebar gauche */}
            <div className="w-48 flex-shrink-0 space-y-5">
              {/* Catégorie */}
              <div>
                <p className="text-xs font-medium text-[#505154] dark:text-gray-500 mb-1.5">
                  Catégorie
                </p>
                <div className="flex items-center gap-2">
                  {(() => {
                    const cat = CATEGORIES.find(
                      (c) => c.id === app.category
                    );
                    const CatIcon = cat?.icon;
                    return (
                      <>
                        {CatIcon && (
                          <CatIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        )}
                        <span className="text-sm font-medium tracking-tight text-[#505154] dark:text-gray-300">
                          {cat?.label || app.category}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Développeur */}
              <div>
                <p className="text-xs font-medium text-[#505154] dark:text-gray-500 mb-1.5">
                  Développé par
                </p>
                <div className="flex items-center gap-2">
                  <AppLogo
                    src={app.logo}
                    name={app.name}
                    size="xxs"
                    bgColor={app.logoBg}
                  />
                  <span className="text-sm font-medium tracking-tight text-[#505154] dark:text-gray-300">
                    {app.author}
                  </span>
                </div>
              </div>

              {/* Ressources */}
              <div>
                <p className="text-xs font-medium text-[#505154] dark:text-gray-500 mb-1.5">
                  Ressources
                </p>
                <div className="space-y-1.5">
                  {app.website && (
                    <a
                      href={app.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 group"
                    >
                      <Globe className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-medium tracking-tight text-[#505154] dark:text-gray-300 underline decoration-dashed decoration-gray-300 dark:decoration-gray-600 underline-offset-[3px] group-hover:decoration-gray-400 dark:group-hover:decoration-gray-500 transition-colors">
                        Site web
                      </span>
                    </a>
                  )}
                  {app.docs && (
                    <a
                      href={app.docs}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 group"
                    >
                      <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-medium tracking-tight text-[#505154] dark:text-gray-300 underline decoration-dashed decoration-gray-300 dark:decoration-gray-600 underline-offset-[3px] group-hover:decoration-gray-400 dark:group-hover:decoration-gray-500 transition-colors">
                        Documentation
                      </span>
                    </a>
                  )}
                  {app.support && (
                    <a
                      href={app.support}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 group"
                    >
                      <Headphones className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-medium tracking-tight text-[#505154] dark:text-gray-300 underline decoration-dashed decoration-gray-300 dark:decoration-gray-600 underline-offset-[3px] group-hover:decoration-gray-400 dark:group-hover:decoration-gray-500 transition-colors">
                        Support
                      </span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Contenu droit */}
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold text-[#242529] dark:text-white mb-2">
                Présentation
              </h3>
              <p className="text-sm leading-6 tracking-tight text-[#505154] dark:text-gray-400">
                {app.description}
              </p>

              <h3 className="text-xl font-semibold text-[#242529] dark:text-white mb-2 mt-8">
                Comment ça marche
              </h3>
              <p className="text-sm leading-6 tracking-tight text-[#505154] dark:text-gray-400">
                Intégrez {app.name} pour automatiser vos flux de travail
                et synchroniser vos données directement avec Newbi.
              </p>

              <h3 className="text-xl font-semibold text-[#242529] dark:text-white mb-2 mt-8">
                Configurer
              </h3>
              <p className="text-sm leading-6 tracking-tight text-[#505154] dark:text-gray-400">
                Un administrateur peut suivre ces étapes pour connecter
                votre compte {app.name} :
              </p>
              <ol className="list-decimal list-inside mt-3 space-y-1.5 text-sm leading-6 tracking-tight text-[#505154] dark:text-gray-400">
                <li>
                  Allez dans les <strong className="dark:text-gray-200">Paramètres</strong> de votre
                  espace de travail.
                </li>
                <li>
                  Ouvrez <strong className="dark:text-gray-200">Applications</strong>, recherchez{" "}
                  <strong className="dark:text-gray-200">{app.name}</strong> et cliquez sur{" "}
                  <strong className="dark:text-gray-200">Installer</strong>.
                </li>
                <li>
                  Connectez-vous à {app.name} et autorisez l'accès.
                </li>
              </ol>
            </div>
          </div>
        </TabsNewContent>
      </TabsNew>
    </div>
  );
}

// ── Vue liste des apps installées ──

function InstalledAppsView({ apps, onBack, onSelectApp, onBrowse }) {
  return (
    <div className="space-y-6">
      {/* Back */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="text-gray-500 cursor-pointer"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Retour
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">Applications installées</h2>
          <p className="text-sm text-gray-400 mt-1">
            Consultez et configurez vos applications installées.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onBrowse}
          className="cursor-pointer flex-shrink-0"
        >
          <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
          Découvrir des apps
        </Button>
      </div>

      {/* App list */}
      <div className="space-y-3 mt-2">
        {apps.map((app) => (
          <InstalledAppRow
            key={app.id}
            app={app}
            onClick={() => onSelectApp(app)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Vue principale ──

export function ApplicationsSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  // "main" | "installed-list" | "app-detail"
  const [view, setView] = useState("main");
  const [selectedApp, setSelectedApp] = useState(null);

  // Modal Stripe onboarding
  const [isStripeOnboardingModalOpen, setIsStripeOnboardingModalOpen] = useState(false);
  const [stripeOnboardingStep, setStripeOnboardingStep] = useState(1);

  // Hooks pour vérifier le statut réel des connexions
  const { data: session } = useSession();
  const { organization } = useActiveOrganization();
  const { activeOrganization, workspaceId } = useWorkspace();
  const organizationId = organization?.id;
  const { isOwner, isAdmin } = usePermissions();
  const canManageStripeConnect = isOwner() || isAdmin();

  const {
    isConnected: isStripeConnected,
    canReceivePayments: stripeCanReceive,
    accountStatus: stripeStatus,
    isLoading: isStripeLoading,
    stripeAccount,
    connectStripe,
    disconnectStripe,
    openStripeDashboard,
    refetchStatus: refetchStripeStatus,
  } = useStripeConnect(activeOrganization?.id || organizationId);

  const {
    isConnected: isBankingConnected,
    accountsCount: bankingAccountsCount,
    provider: bankingProvider,
    isLoading: isBankingLoading,
    disconnectBank,
  } = useBankingConnection(workspaceId);

  // Écouter l'événement de configuration Stripe complète
  useEffect(() => {
    const handleStripeConfigComplete = async () => {
      await refetchStripeStatus();
      setTimeout(async () => {
        await refetchStripeStatus();
      }, 2000);
    };

    window.addEventListener("stripeConfigComplete", handleStripeConfigComplete);
    return () => {
      window.removeEventListener("stripeConfigComplete", handleStripeConfigComplete);
    };
  }, [refetchStripeStatus]);

  // Gérer les paramètres de retour de Stripe
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stripeSuccess = urlParams.get("stripe_success");
    const stripeRefresh = urlParams.get("stripe_refresh");
    const stripeConnectSuccess = urlParams.get("stripe_connect_success");

    if (stripeSuccess === "true" || stripeConnectSuccess === "true") {
      refetchStripeStatus();
      if (stripeSuccess === "true") {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } else if (stripeRefresh === "true") {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [refetchStripeStatus]);

  // Enrichir les apps avec le statut de connexion réel
  const appsWithStatus = useMemo(() => {
    return APPLICATIONS.map((app) => {
      if (app.id === "stripe") {
        return {
          ...app,
          connected: isStripeConnected,
          connectionDetail: stripeCanReceive
            ? "Paiements actifs"
            : isStripeConnected
              ? "Onboarding en cours"
              : null,
        };
      }
      if (app.id === "bridge") {
        return {
          ...app,
          connected: isBankingConnected,
          connectionDetail: isBankingConnected
            ? `${bankingAccountsCount} compte${bankingAccountsCount > 1 ? "s" : ""} connecté${bankingAccountsCount > 1 ? "s" : ""}`
            : null,
        };
      }
      return { ...app, connected: false };
    });
  }, [isStripeConnected, stripeCanReceive, isBankingConnected, bankingAccountsCount]);

  const installedApps = appsWithStatus.filter((app) => app.installed);

  const filteredApps = useMemo(() => {
    return appsWithStatus.filter((app) => {
      const matchesCategory =
        activeCategory === "all" || app.category === activeCategory;
      const matchesSearch =
        !searchQuery ||
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.author.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery, appsWithStatus]);

  const groupedApps = useMemo(() => {
    if (activeCategory !== "all") {
      const category = CATEGORIES.find((c) => c.id === activeCategory);
      return [
        { category: category?.label || activeCategory, apps: filteredApps },
      ];
    }
    const groups = {};
    filteredApps.forEach((app) => {
      const category = CATEGORIES.find((c) => c.id === app.category);
      const label = category?.label || app.category;
      if (!groups[label]) groups[label] = [];
      groups[label].push(app);
    });
    return Object.entries(groups).map(([category, apps]) => ({
      category,
      apps,
    }));
  }, [filteredApps, activeCategory]);

  // Actions Stripe pour la vue détail
  const stripeActions = {
    canManage: canManageStripeConnect,
    isLoading: isStripeLoading,
    stripeAccount,
    onConnect: () => {
      setStripeOnboardingStep(1);
      setIsStripeOnboardingModalOpen(true);
    },
    onFinishSetup: () => {
      setStripeOnboardingStep(2);
      setIsStripeOnboardingModalOpen(true);
    },
    onOpenDashboard: openStripeDashboard,
    onDisconnect: disconnectStripe,
  };

  // Actions Banking pour la vue détail
  const bankingActions = {
    isLoading: isBankingLoading,
    onDisconnect: () => disconnectBank({ provider: bankingProvider }),
  };

  // ── Vue détail app ──
  if (view === "app-detail" && selectedApp) {
    return (
      <>
        <AppDetailView
          app={selectedApp}
          isConnected={selectedApp.connected}
          connectionDetail={selectedApp.connectionDetail}
          stripeActions={stripeActions}
          bankingActions={bankingActions}
          onBack={() => {
            setSelectedApp(null);
            setView("installed-list");
          }}
        />
        {/* Modal d'onboarding Stripe */}
        <StripeConnectOnboardingModal
          isOpen={isStripeOnboardingModalOpen}
          onClose={() => setIsStripeOnboardingModalOpen(false)}
          currentStep={stripeOnboardingStep}
          onStartConfiguration={async () => {
            if (session?.user?.email) {
              await connectStripe(session.user.email);
            }
          }}
          onVerifyIdentity={async () => {
            await openStripeDashboard();
          }}
        />
      </>
    );
  }

  // ── Vue liste installées ──
  if (view === "installed-list") {
    return (
      <InstalledAppsView
        apps={installedApps}
        onBack={() => setView("main")}
        onSelectApp={(app) => {
          setSelectedApp(app);
          setView("app-detail");
        }}
        onBrowse={() => setView("main")}
      />
    );
  }

  // ── Vue principale ──
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium mb-1 hidden md:block">
          Applications
        </h2>
        <p className="text-sm text-gray-400 mb-3 hidden md:block">
          Gérez et découvrez les applications connectées à votre espace.
        </p>
        <Separator className="hidden md:block bg-[#eeeff1] dark:bg-[#232323]" />
      </div>

      {/* Section Installées */}
      {installedApps.length > 0 && (
        <div className="flex flex-col items-center justify-start gap-3 p-3 w-full bg-[#fbfbfb] dark:bg-[#141414] border border-[#eeeff1] dark:border-[#232323] rounded-2xl">
          <div className="flex items-center justify-between w-full px-2">
            <h3 className="text-sm font-medium">Installées</h3>
            <button
              type="button"
              onClick={() => setView("installed-list")}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Voir tout
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            {installedApps.slice(0, 4).map((app) => (
              <InstalledAppChip
                key={app.id}
                app={app}
                onClick={() => {
                  setSelectedApp(app);
                  setView("app-detail");
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Section Parcourir */}
      <div>
        <h3 className="text-sm font-medium mb-1">
          Parcourir les applications
        </h3>
        <p className="text-xs text-gray-400 mb-4">
          Découvrez de nouvelles applications pour améliorer votre productivité.
        </p>

        <div className="flex gap-6">
          {/* Sidebar catégories - sticky au scroll */}
          <div className="w-48 flex-shrink-0">
            <div className="sticky top-6">
              {/* Barre de recherche */}
              <div className="relative mb-4">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Rechercher"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>

              {/* Liste des catégories */}
              <div className="space-y-0.5">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={`w-full text-left px-2.5 py-1.5 text-[13px] rounded-md transition-colors flex items-center gap-2.5 ${
                        activeCategory === cat.id
                          ? "bg-[#EDECEB] dark:bg-[#2c2c2c] font-medium"
                          : "hover:bg-gray-100 dark:hover:bg-[#2c2c2c] text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Grille d'applications */}
          <div className="flex-1 min-w-0">
            {groupedApps.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-gray-400">
                  Aucune application trouvée.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {groupedApps.map(({ category, apps }) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium mb-3">{category}</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {apps.map((app) => (
                        <AppCard
                          key={app.id}
                          app={app}
                          onClick={() => {
                            setSelectedApp(app);
                            setView("app-detail");
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApplicationsSection;
