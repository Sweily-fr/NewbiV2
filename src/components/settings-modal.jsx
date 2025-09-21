"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import {
  Building2,
  CreditCard,
  FileText,
  Shield,
  Settings,
  Settings2,
  Bell,
  Users,
  Crown,
  User,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/src/components/ui/dialog";
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
import { Button } from "@/src/components/ui/button";
import { useSession } from "@/src/lib/auth-client";
import { useActiveOrganization } from "@/src/lib/organization-client";
import { toast } from "@/src/components/ui/sonner";
import { validateSettingsForm } from "@/src/lib/validation";
import PreferencesSection from "./settings/preferences-section";
import GeneraleSection from "./settings/generale-section";
import CoordonneesBancairesSection from "./settings/coordonnees-bancaires-section";
import InformationsLegalesSection from "./settings/informations-legales-section";
import EspacesSection from "./settings/espaces-section";
import FacturationSection from "./settings/facturation-section";
import { SubscriptionSection } from "./settings/subscription-section";
import { SecuritySection } from "./settings/security-section";
import PersonnesSection from "./settings/personnes-section";
import UserInfoSection from "./settings/user-info-section";

export function SettingsModal({ open, onOpenChange, initialTab = "preferences" }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [showNoChangesWarning, setShowNoChangesWarning] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingTab, setPendingTab] = useState(null);
  const initialValuesRef = useRef(null);
  const { data: session } = useSession();
  const {
    organization,
    loading: orgLoading,
    error: orgError,
    refetch: refetchOrg,
    updateOrganization,
  } = useActiveOrganization();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      // Informations entreprise
      name: "",
      email: "",
      phone: "",
      website: "",
      description: "",
      logo: "",

      // Adresse
      address: {
        street: "",
        city: "",
        postalCode: "",
        country: "France",
      },

      // Informations bancaires
      bankDetails: {
        iban: "",
        bic: "",
        bankName: "",
      },

      // Informations légales
      legal: {
        siret: "",
        vatNumber: "",
        rcs: "",
        legalForm: "",
        capital: "",
        regime: "",
        category: "",
        isVatSubject: false,
        hasCommercialActivity: false,
      },
    },
  });

  // Fonction pour mettre à jour les informations de l'organisation
  const onSubmit = async (formData) => {
    try {
      console.log("🚀 onSubmit déclenché avec:", formData);

      if (!organization?.id) {
        console.error("❌ Aucune organisation active trouvée");
        toast.error("Aucune organisation active trouvée");
        return;
      }

      console.log("✅ Organisation trouvée:", organization.id);

      // Validation et nettoyage des données côté frontend
      console.log("🔍 Validation des données...");
      const validation = validateSettingsForm(formData);
      console.log("📋 Résultat de validation:", validation);

      if (!validation.isValid) {
        console.error("❌ Validation échouée:", validation.errors);
        toast.error(
          `Erreurs de validation: ${Object.keys(validation.errors).join(", ")}`
        );
        return;
      }

      console.log("✅ Validation réussie");

      // Utiliser les données nettoyées
      const sanitizedFormData = validation.sanitizedData;

      // Récupérer les données existantes de l'organisation
      const existingOrgData = organization || {};

      // Transformer les données pour correspondre au schéma organization
      const transformedData = {
        // Informations de base de l'entreprise
        companyName:
          sanitizedFormData.name || existingOrgData.companyName || "",
        companyEmail:
          sanitizedFormData.email || existingOrgData.companyEmail || "",
        companyPhone:
          sanitizedFormData.phone || existingOrgData.companyPhone || "",
        website: sanitizedFormData.website || existingOrgData.website || "",
        logo:
          sanitizedFormData.logo !== undefined
            ? sanitizedFormData.logo
            : existingOrgData.logo || "",

        // Informations légales
        siret: sanitizedFormData.legal?.siret || existingOrgData.siret || "",
        vatNumber:
          sanitizedFormData.legal?.vatNumber || existingOrgData.vatNumber || "",
        rcs: sanitizedFormData.legal?.rcs || existingOrgData.rcs || "",
        legalForm:
          sanitizedFormData.legal?.legalForm || existingOrgData.legalForm || "",
        capitalSocial:
          sanitizedFormData.legal?.capital ||
          existingOrgData.capitalSocial ||
          "",
        fiscalRegime:
          sanitizedFormData.legal?.regime || existingOrgData.fiscalRegime || "",
        activityCategory:
          sanitizedFormData.legal?.category ||
          existingOrgData.activityCategory ||
          "",
        isVatSubject:
          sanitizedFormData.legal?.isVatSubject ||
          existingOrgData.isVatSubject ||
          false,
        hasCommercialActivity:
          sanitizedFormData.legal?.hasCommercialActivity ||
          existingOrgData.hasCommercialActivity ||
          false,

        // Adresse (champs aplatis)
        addressStreet:
          sanitizedFormData.address?.street ||
          existingOrgData.addressStreet ||
          "",
        addressCity:
          sanitizedFormData.address?.city || existingOrgData.addressCity || "",
        addressZipCode:
          sanitizedFormData.address?.postalCode ||
          existingOrgData.addressZipCode ||
          "",
        addressCountry:
          sanitizedFormData.address?.country ||
          existingOrgData.addressCountry ||
          "France",

        // Coordonnées bancaires (champs aplatis)
        bankName:
          sanitizedFormData.bankDetails?.bankName !== undefined
            ? sanitizedFormData.bankDetails.bankName
            : existingOrgData.bankName || "",
        bankIban:
          sanitizedFormData.bankDetails?.iban !== undefined
            ? sanitizedFormData.bankDetails.iban
            : existingOrgData.bankIban || "",
        bankBic:
          sanitizedFormData.bankDetails?.bic !== undefined
            ? sanitizedFormData.bankDetails.bic
            : existingOrgData.bankBic || "",
      };

      console.log("🔄 Données du formulaire:", formData);
      console.log("🔄 Données transformées à envoyer:", transformedData);
      console.log("🔄 Organisation actuelle:", organization);

      await updateOrganization(transformedData, {
        onSuccess: (result) => {
          console.log("✅ Mise à jour réussie:", result);
          toast.success("Informations mises à jour avec succès");
          // Réinitialiser les valeurs de référence après sauvegarde réussie
          initialValuesRef.current = formData;
          setHasUnsavedChanges(false);
        },
        onError: (error) => {
          console.error("❌ Erreur lors de la mise à jour:", error);
          toast.error(
            `Erreur lors de la mise à jour: ${error.message || "Erreur inconnue"}`
          );
        },
      });
    } catch (error) {
      toast.error("Une erreur s'est produite lors de la mise à jour");
    }
  };

  // Mettre à jour l'onglet actif quand initialTab change
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Charger les données de l'organisation et du user dans le formulaire
  useEffect(() => {
    if (organization && session?.user) {
      const initialData = {
        name: organization.companyName || "",
        email: organization.companyEmail || "",
        phone: organization.companyPhone || "",
        website: organization.website || "",
        description: organization.description || "",
        logo: organization.logo || "",
        address: {
          street: organization.addressStreet || "",
          city: organization.addressCity || "",
          postalCode: organization.addressZipCode || "",
          country: organization.addressCountry || "France",
        },
        bankDetails: {
          iban: organization.bankIban || "",
          bic: organization.bankBic || "",
          bankName: organization.bankName || "",
        },
        // Informations légales - mapper vers la structure legal.* pour cohérence avec LegalSection
        legal: {
          siret: organization.siret || "",
          vatNumber: organization.vatNumber || "",
          rcs: organization.rcs || "",
          legalForm: organization.legalForm || "",
          capital: organization.capitalSocial || "",
          regime: organization.fiscalRegime || "",
          category: organization.activityCategory || "",
          isVatSubject: organization.isVatSubject || false,
          hasCommercialActivity: organization.hasCommercialActivity || false,
        },
      };

      reset(initialData);
      initialValuesRef.current = initialData;
      setHasUnsavedChanges(false);
    }
  }, [organization, session, reset]);

  // Surveiller les changements dans le formulaire
  const watchedValues = watch();
  useEffect(() => {
    if (initialValuesRef.current && watchedValues) {
      const hasChanges =
        JSON.stringify(watchedValues) !==
        JSON.stringify(initialValuesRef.current);
      setHasUnsavedChanges(hasChanges);
    }
  }, [watchedValues]);

  // Fonction pour gérer le changement d'onglet
  const handleTabChange = (newTab) => {
    // Vérifier si on est sur un onglet avec formulaire et s'il y a des modifications
    const isFormTab = [
      "generale",
      "coordonnees-bancaires",
      "informations-legales",
    ].includes(activeTab);

    if (isFormTab && hasUnsavedChanges) {
      // Afficher le modal de confirmation s'il y a des modifications non sauvegardées
      setPendingTab(newTab);
      setShowNoChangesWarning(true);
    } else {
      // Changer d'onglet directement
      setActiveTab(newTab);
    }
  };

  // Fonction pour gérer la fermeture du modal
  const handleCloseModal = () => {
    if (
      hasUnsavedChanges &&
      (activeTab === "generale" ||
        activeTab === "coordonnees-bancaires" ||
        activeTab === "informations-legales")
    ) {
      setPendingTab(null);
      setShowUnsavedWarning(true);
    } else {
      onOpenChange(false);
    }
  };

  // Fonction pour forcer la fermeture sans sauvegarder
  const handleForceClose = () => {
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    } else {
      onOpenChange(false);
    }
    setShowUnsavedWarning(false);
  };

  const handleCancelClose = () => {
    setPendingTab(null);
    setShowUnsavedWarning(false);
  };

  // Fonctions pour gérer le modal "aucune modification"
  const handleContinueEditing = () => {
    setPendingTab(null);
    setShowNoChangesWarning(false);
  };

  const handleCancelEditing = () => {
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
    setShowNoChangesWarning(false);
  };

  const renderContent = () => {
    const commonProps = {
      register,
      errors,
      watch,
      setValue,
      session,
      organization,
      updateOrganization,
      refetchOrganization: refetchOrg,
    };
    switch (activeTab) {
      case "espaces":
        return <EspacesSection />;
      case "preferences":
        return <PreferencesSection />;
      case "generale":
        return <GeneraleSection {...commonProps} />;
      case "coordonnees-bancaires":
        return <CoordonneesBancairesSection {...commonProps} />;
      case "informations-legales":
        return <InformationsLegalesSection {...commonProps} />;
      case "facturation":
        return <FacturationSection />;
      case "subscription":
        return <SubscriptionSection />;
      case "securite":
        return <SecuritySection />;
      case "personnes":
        return <PersonnesSection />;
      case "user-info":
        return <UserInfoSection onTabChange={handleTabChange} />;
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Contenu à venir
            </h2>
            <p className="text-sm text-gray-500">Section : {activeTab}</p>
          </div>
        );
    }
  };

  const sections = [
    {
      items: [
        {
          id: "preferences",
          label: "Préférences",
          icon: Settings2,
        },
        {
          id: "notifications",
          label: "Notifications",
          icon: Bell,
          disabled: true,
        },
      ],
    },
    {
      title: "Espace de travail",
      items: [
        {
          id: "generale",
          label: "Générale",
          icon: Settings,
        },
        {
          id: "coordonnees-bancaires",
          label: "Coordonnées bancaires",
          icon: CreditCard,
        },
        {
          id: "informations-legales",
          label: "Informations légales",
          icon: FileText,
        },
        {
          id: "securite",
          label: "Sécurité",
          icon: Shield,
        },
      ],
    },
    {
      items: [
        {
          id: "personnes",
          label: "Rôles utilisateurs",
          icon: Users,
          disabled: true,
        },
        {
          id: "espaces",
          label: "Espaces",
          icon: Building2,
        },
      ],
    },
    {
      items: [
        {
          id: "facturation",
          label: "Facturation",
          icon: CreditCard,
        },
        {
          id: "subscription",
          label: "Abonnement",
          icon: Crown,
        },
      ],
    },
  ];

  // Onglets principaux pour mobile (regroupés logiquement)
  const mobileMainTabs = [
    {
      id: "user-info",
      label: "Mon compte",
      icon: User,
    },
    {
      id: "generale",
      label: "Général",
      icon: Settings,
      hasSubsections: true,
      subsections: ["generale", "coordonnees-bancaires", "informations-legales"]
    },
    {
      id: "securite",
      label: "Sécurité",
      icon: Shield,
    },
    {
      id: "subscription",
      label: "Abonnement",
      icon: Crown,
    },
  ];

  // Fonction pour déterminer l'onglet actif sur mobile
  const getActiveMobileTab = () => {
    const generalTabs = ["generale", "coordonnees-bancaires", "informations-legales"];
    if (generalTabs.includes(activeTab)) {
      return "generale";
    }
    return activeTab;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] md:max-h-[90vh] p-0 gap-0 overflow-hidden"
        style={{ 
          maxWidth: "72rem", 
          width: "95vw", 
          height: "92vh",
          // Mobile specific styles
          ...(typeof window !== 'undefined' && window.innerWidth < 768 && {
            width: "100vw",
            height: "100vh",
            maxWidth: "100vw",
            maxHeight: "100vh",
            borderRadius: "0px",
            margin: "0",
          })
        }}
      >
        {/* DialogTitle caché pour l'accessibilité */}
        <DialogTitle className="sr-only">Paramètres de l'application</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Desktop Layout */}
          <div className="hidden md:flex h-full">
            {/* Sidebar Desktop */}
            <div className="w-60 bg-gray-50 dark:bg-[#171717] overflow-y-auto">
              {/* Header */}
              <div className="p-4">
                <h2 className="text-sm font-medium text-gray-500 mb-4">
                  Paramètres
                </h2>

                {/* User Info - Now clickable */}
                <button
                  type="button"
                  onClick={() => handleTabChange("user-info")}
                  className={`w-full flex items-center gap-2 mb-4 px-2 py-2 rounded-md transition-colors ${
                    activeTab === "user-info"
                      ? "bg-[#EDECEB] dark:bg-[#2c2c2c]"
                      : "hover:bg-gray-100 dark:hover:bg-[#2c2c2c]"
                  }`}
                >
                  <div className="w-6 h-6 bg-[#5B4FFF]/300 rounded-full flex items-center justify-center text-white text-xs font-medium">
                    {session?.user?.name?.charAt(0) || "S"}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {session?.user?.name || "Sofiane Mtimet"}
                    </p>
                  </div>
                </button>

                {/* Sections */}
                <div className="space-y-1">
                  {sections.map((section, sectionIndex) => (
                    <div key={sectionIndex}>
                      {/* Titre de section si présent */}
                      {section.title && (
                        <h3 className="text-xs font-medium text-gray-500 mb-2 mt-4">
                          {section.title}
                        </h3>
                      )}
                      <div className="space-y-1">
                        {section.items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() =>
                                !item.disabled && handleTabChange(item.id)
                              }
                              disabled={item.disabled}
                              className={`w-full text-left px-2 py-1.5 text-[13.5px] rounded-md transition-colors flex items-center gap-3 ${
                                item.disabled
                                  ? "cursor-not-allowed opacity-50"
                                  : "cursor-pointer"
                              } ${
                                activeTab === item.id && !item.disabled
                                  ? "bg-[#EDECEB] dark:bg-[#2c2c2c] font-medium"
                                  : !item.disabled
                                    ? "hover:bg-gray-100 dark:hover:bg-[#2c2c2c]"
                                    : ""
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                              <span className="flex items-center gap-2">
                                {item.label}
                                {item.disabled && (
                                  <span className="px-1.5 py-0.5 text-[9px] font-medium bg-[#5b4eff] text-white rounded-full">
                                    à venir
                                  </span>
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      {/* Séparateur entre sections (sauf pour la dernière et la première) */}
                      {sectionIndex < sections.length - 1 &&
                        sectionIndex > 0 && (
                          <div className="border-t border-gray-200 dark:border-[#2c2c2c] mt-3 pt-1"></div>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Content Area Desktop */}
            <div className="flex-1 bg-white dark:bg-[#0A0A0A] flex flex-col">
              {/* Scrollable Content */}
              <div
                className="flex-1 overflow-y-auto"
                style={{
                  height: "calc(88vh - 80px)",
                  maxHeight: "calc(88vh - 80px)",
                  overflowY: "scroll",
                }}
              >
                <div className="p-12 pb-6">{renderContent()}</div>
              </div>

              {/* Fixed Footer with Buttons */}
              <div className="border-t bg-white dark:bg-[#0A0A0A] p-4 flex justify-end gap-3">
                <Button
                  variant="outline"
                  className="cursor-pointer"
                  onClick={handleCloseModal}
                >
                  Annuler
                </Button>
                {activeTab !== "espaces" &&
                  activeTab !== "facturation" &&
                  activeTab !== "preferences" && (
                    <Button
                      type="submit"
                      disabled={isSubmitting || !hasUnsavedChanges}
                      className="bg-[#5b4eff] cursor-pointer hover:bg-[#5b4eff] dark:text-white"
                      onClick={(e) => {
                        console.log(
                          "🔘 Bouton cliqué, type:",
                          e.currentTarget.type
                        );
                        console.log("🔘 Form element:", e.currentTarget.form);
                      }}
                    >
                      {isSubmitting ? "Mise à jour..." : "Sauvegarder"}
                    </Button>
                  )}
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden flex flex-col h-full">
            {/* Header Mobile */}
            <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-[#0A0A0A]">
              <h2 className="text-lg font-semibold">Paramètres</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseModal}
                className="h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>

            {/* Sub-navigation for General section on mobile */}
            {getActiveMobileTab() === "generale" && (
              <div className="bg-gray-50 dark:bg-[#171717] border-b border-gray-200 dark:border-gray-800">
                <div className="flex overflow-x-auto">
                  {[
                    { id: "generale", label: "Informations" },
                    { id: "coordonnees-bancaires", label: "Bancaire" },
                    { id: "informations-legales", label: "Légal" }
                  ].map((subTab) => (
                    <button
                      key={subTab.id}
                      type="button"
                      onClick={() => handleTabChange(subTab.id)}
                      className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                        activeTab === subTab.id
                          ? "border-[#5b4eff] text-[#5b4eff] bg-white dark:bg-[#0A0A0A]"
                          : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                    >
                      {subTab.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Content Area Mobile */}
            <div className="flex-1 bg-white dark:bg-[#0A0A0A] overflow-y-auto">
              <div className={`p-6 ${
                (activeTab === "generale" || activeTab === "coordonnees-bancaires" || activeTab === "informations-legales")
                  ? "pb-40" // Plus d'espace pour les boutons d'action
                  : "pb-24" // Espace normal pour les autres sections
              }`}>
                {renderContent()}
              </div>
            </div>

            {/* Bottom Navigation Mobile */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#0A0A0A] border-t border-gray-200 dark:border-gray-800 shadow-lg">
              {/* Safe area padding for iOS devices */}
              <div className="pb-safe">
                <div className="flex items-center justify-around px-2 py-3">
                  {mobileMainTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = getActiveMobileTab() === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => handleTabChange(tab.id)}
                        className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-200 min-w-0 flex-1 mx-1 relative ${
                          isActive
                            ? "bg-[#5b4eff]/10 text-[#5b4eff] scale-105"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        <Icon className={`h-5 w-5 mb-1 transition-colors ${isActive ? "text-[#5b4eff]" : ""}`} />
                        <span className={`text-xs font-medium truncate transition-colors ${isActive ? "text-[#5b4eff]" : ""}`}>
                          {tab.label}
                        </span>
                        {/* Indicateur pour les onglets avec sous-sections */}
                        {tab.hasSubsections && isActive && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#5b4eff] rounded-full animate-pulse"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {/* Action Buttons Mobile */}
                {(activeTab === "generale" || activeTab === "coordonnees-bancaires" || activeTab === "informations-legales") && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 cursor-pointer h-11"
                        onClick={handleCloseModal}
                      >
                        Annuler
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting || !hasUnsavedChanges}
                        className="flex-1 bg-[#5b4eff] cursor-pointer hover:bg-[#5b4eff] dark:text-white h-11"
                      >
                        {isSubmitting ? "Mise à jour..." : "Sauvegarder"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </DialogContent>

      {/* Alert Dialog pour les modifications non sauvegardées */}
      <AlertDialog
        open={showUnsavedWarning}
        onOpenChange={setShowUnsavedWarning}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Modifications non sauvegardées</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingTab
                ? "Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir changer d'onglet sans sauvegarder ?"
                : "Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir fermer sans sauvegarder ?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelClose}>
              Continuer l'édition
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForceClose}
              className="bg-red-600 hover:bg-red-700 dark:text-white"
            >
              {pendingTab
                ? "Changer d'onglet sans sauvegarder"
                : "Fermer sans sauvegarder"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog pour aucune modification effectuée */}
      <AlertDialog
        open={showNoChangesWarning}
        onOpenChange={setShowNoChangesWarning}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Modifications non sauvegardées</AlertDialogTitle>
            <AlertDialogDescription>
              Vous avez des modifications non sauvegardées. Souhaitez-vous
              continuer à modifier ou changer d'onglet sans sauvegarder ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleContinueEditing}
              className="cursor-pointer"
            >
              Continuer la modification
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelEditing}
              className="bg-red-600 hover:bg-red-700 dark:text-white cursor-pointer"
            >
              Changer d'onglet sans sauvegarder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
