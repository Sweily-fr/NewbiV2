"use client";

import React, { useState } from "react";
import { X, ChevronLeft } from "lucide-react";
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
    { id: "personnes", label: "Personnes", icon: "Users" },
    { id: "facturation", label: "Facturation", icon: "CreditCard" },
    { id: "subscription", label: "Abonnement", icon: "Crown" },
    { id: "preferences", label: "Préférences", icon: "Settings2" },
    { id: "security", label: "Sécurité", icon: "Shield" },
  ];

  const currentTab = tabs.find((tab) => tab.id === activeTab);

  const renderContent = () => {
    switch (activeTab) {
      case "user-info":
        return (
          <UserInfoSection
            session={session}
            organization={organization}
            updateOrganization={updateOrganization}
            refetchOrganization={refetchOrganization}
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
    <div className="fixed inset-0 z-50 bg-gray-100 dark:bg-[#0A0A0A] flex flex-col">
      {/* Header fixe avec style iOS */}
      <div className="flex-shrink-0 bg-gray-100 dark:bg-[#0A0A0A]">
        <div className="flex items-center justify-between px-4 py-3 pt-6">
          {/* Bouton retour ou navigation */}
          {showNavigation ? (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-2 hover:bg-gray-200 dark:hover:bg-[#171717]"
              >
                <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </Button>
              <h1 className="text-xl font-medium text-gray-900 dark:text-white">
                Paramètres
              </h1>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNavigation(true)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-[#171717]"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </Button>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {currentTab?.label}
              </h1>
            </div>
          )}

          {/* Bouton de sauvegarde (si applicable) */}
          {!showNavigation &&
            [
              "generale",
              "coordonnees-bancaires",
              "informations-legales",
            ].includes(activeTab) && (
              <Button
                type="submit"
                disabled={formIsSubmitting || !isDirty}
                onClick={onSubmit}
                className="bg-[#5b4eff] hover:bg-[#5b4eff] text-white px-4 py-2 rounded-md font-medium"
                size="sm"
              >
                {formIsSubmitting ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            )}
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
          <div className="h-full overflow-y-auto bg-gray-100 dark:bg-[#0A0A0A]">
            <div className="bg-white dark:bg-[#171717] mx-4 mt-4 rounded-xl shadow-sm">
              <div className="p-4">{renderContent()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
