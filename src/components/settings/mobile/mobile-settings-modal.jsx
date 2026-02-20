"use client";

import React, { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import MobileSettingsNavigation from "./mobile-settings-navigation";

// Import des sections (même contenu que desktop)
import PreferencesSection from "../preferences-section";
import GeneraleSection from "../generale-section";
import CoordonneesBancairesSection from "../coordonnees-bancaires-section";
import InformationsLegalesSection from "../informations-legales-section";
import EspacesSection from "../espaces-section";
import FacturationSection from "../facturation-section";
import { SubscriptionSection } from "../subscription-section";
import { SecuritySection } from "../security-section";
import PersonnesSection from "../personnes-section";
import UserInfoSection from "../user-info-section";
import { NotificationsSection } from "../notifications-section";

export function MobileSettingsModal({
  open,
  onClose,
  session,
  organization,
  updateOrganization,
  refetchOrganization,
  formIsSubmitting,
  isDirty,
  onSubmit,
}) {
  const [activeTab, setActiveTab] = useState("generale");
  const [showNavigation, setShowNavigation] = useState(true);

  if (!open) return null;

  // Configuration des onglets (même que desktop)
  const tabs = [
    { id: "user-info", label: "Informations utilisateur", icon: "User" },
    { id: "generale", label: "Générale", icon: "Building2" },
    {
      id: "coordonnees-bancaires",
      label: "Coordonnées bancaires",
      icon: "CreditCard",
    },
    {
      id: "informations-legales",
      label: "Informations légales",
      icon: "FileText",
    },
    { id: "espaces", label: "Espaces", icon: "Settings" },
    { id: "personnes", label: "Accès", icon: "Users", disabled: true },
    { id: "facturation", label: "Facturation", icon: "CreditCard" },
    { id: "preferences", label: "Préférences", icon: "Settings2" },
    { id: "notifications", label: "Notifications", icon: "Bell" },
    { id: "security", label: "Sécurité", icon: "Shield" },
    { id: "subscription", label: "Abonnement", icon: "Crown" },
  ];

  const currentTab = tabs.find((tab) => tab.id === activeTab);

  const hasSaveFooter = [
    "generale",
    "coordonnees-bancaires",
    "informations-legales",
  ].includes(activeTab);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setShowNavigation(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "user-info":
        return (
          <UserInfoSection
            session={session}
            organization={organization}
            updateOrganization={updateOrganization}
            refetchOrganization={refetchOrganization}
            onTabChange={handleTabChange}
          />
        );
      case "generale":
        return (
          <GeneraleSection
            session={session}
            organization={organization}
            updateOrganization={updateOrganization}
            refetchOrganization={refetchOrganization}
          />
        );
      case "coordonnees-bancaires":
        return (
          <CoordonneesBancairesSection
            session={session}
            organization={organization}
            updateOrganization={updateOrganization}
            refetchOrganization={refetchOrganization}
          />
        );
      case "informations-legales":
        return (
          <InformationsLegalesSection
            session={session}
            organization={organization}
            updateOrganization={updateOrganization}
            refetchOrganization={refetchOrganization}
          />
        );
      case "espaces":
        return (
          <EspacesSection
            session={session}
            organization={organization}
            updateOrganization={updateOrganization}
            refetchOrganization={refetchOrganization}
          />
        );
      case "personnes":
        return (
          <PersonnesSection
            session={session}
            organization={organization}
            updateOrganization={updateOrganization}
            refetchOrganization={refetchOrganization}
          />
        );
      case "facturation":
        return (
          <FacturationSection
            session={session}
            organization={organization}
            updateOrganization={updateOrganization}
            refetchOrganization={refetchOrganization}
          />
        );
      case "subscription":
        return (
          <SubscriptionSection
            session={session}
            organization={organization}
            updateOrganization={updateOrganization}
            refetchOrganization={refetchOrganization}
          />
        );
      case "preferences":
        return (
          <PreferencesSection
            session={session}
            organization={organization}
            updateOrganization={updateOrganization}
            refetchOrganization={refetchOrganization}
          />
        );
      case "notifications":
        return <NotificationsSection />;
      case "security":
        return (
          <SecuritySection
            session={session}
            organization={organization}
            updateOrganization={updateOrganization}
            refetchOrganization={refetchOrganization}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex-shrink-0">
        <div className="relative flex items-center justify-center px-4 py-3">
          {/* Bouton retour */}
          <Button
            variant="ghost"
            size="sm"
            onClick={showNavigation ? onClose : () => setShowNavigation(true)}
            className="absolute left-1 p-2"
          >
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </Button>

          {/* Titre centré */}
          <h1 className="text-base font-medium text-foreground">
            {showNavigation ? "Paramètres" : currentTab?.label}
          </h1>

        </div>
      </div>

      {/* Contenu principal avec animation */}
      <div className="flex-1 overflow-hidden relative">
        {/* Vue navigation */}
        <div
          className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
            showNavigation ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <MobileSettingsNavigation
            tabs={tabs}
            activeTab={activeTab}
            session={session}
            onTabSelect={(tabId) => {
              setActiveTab(tabId);
              setShowNavigation(false);
            }}
          />
        </div>

        {/* Vue contenu */}
        <div
          className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
            showNavigation ? "translate-x-full" : "translate-x-0"
          }`}
        >
          <div className="h-full overflow-y-auto">
            <div className={`px-4 pt-4 ${hasSaveFooter ? "pb-24" : "pb-8"}`}>{renderContent()}</div>
          </div>
        </div>
      </div>

      {/* Footer fixe avec boutons Annuler / Valider */}
      {hasSaveFooter && !showNavigation && (
        <div className="flex-shrink-0 border-t bg-background px-4 py-3 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setShowNavigation(true)}
          >
            Annuler
          </Button>
          <Button
            className="flex-1 bg-[#5b4eff] hover:bg-[#4a3fdf] text-white"
            disabled={formIsSubmitting || !isDirty}
            onClick={onSubmit}
          >
            {formIsSubmitting ? "Sauvegarde..." : "Valider"}
          </Button>
        </div>
      )}
    </div>
  );
}
