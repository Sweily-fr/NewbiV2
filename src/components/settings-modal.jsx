"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm, FormProvider } from "react-hook-form";
import {
  Building2,
  CreditCard,
  FileText,
  Shield,
  Settings,
  Settings2,
  Bell,
  Mail,
  Users,
  Crown,
  User,
  Landmark,
  Zap,
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
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import {
  validateSettingsForm,
  VALIDATION_PATTERNS,
  sanitizeInput,
  detectInjectionAttempt,
} from "@/src/lib/validation";
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
import { NotificationsSection } from "./settings/notifications-section";
import { MobileSettingsModal } from "./settings/mobile/mobile-settings-modal";
import { usePermissions } from "@/src/hooks/usePermissions";
import { BankAccountsSection } from "./settings/bank-accounts-section";
// DÉSACTIVÉ: SuperPDP API pas encore active
// import { EInvoicingSection } from "./settings/e-invoicing-section";

export function SettingsModal({
  open,
  onOpenChange,
  initialTab = "preferences",
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [showNoChangesWarning, setShowNoChangesWarning] = useState(false);
  const [pendingTab, setPendingTab] = useState(null);
  const { data: session } = useSession();
  const { isActive } = useSubscription();
  const { getUserRole, isOwner, isAdmin } = usePermissions();
  const {
    organization,
    loading: orgLoading,
    error: orgError,
    refetch: refetchOrg,
    updateOrganization,
  } = useActiveOrganization();

  // Vérifier si l'utilisateur peut modifier les paramètres d'organisation
  const canManageOrgSettings = isOwner() || isAdmin();

  const formMethods = useForm({
    mode: "onChange", // Validation en temps réel
    defaultValues: {
      // Informations générales
      name: "",
      email: "",
      phone: "",
      website: "",
      description: "",
      logo: "",
      address: {
        street: "",
        city: "",
        postalCode: "",
        country: "France",
      },
      // Coordonnées bancaires
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
        vatRegime: "",
        vatFrequency: "",
        vatMode: "",
        fiscalYearStartDate: "",
        fiscalYearEndDate: "",
      },
    },
  });

  const {
    handleSubmit,
    formState: { errors, isSubmitting: formIsSubmitting, isDirty },
    reset,
    watch,
  } = formMethods;

  // Synchroniser activeTab avec initialTab quand le modal s'ouvre
  useEffect(() => {
    if (open && initialTab) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  // Initialiser le formulaire avec les données de l'organisation
  useEffect(() => {
    if (organization) {
      const initialData = {
        // Informations générales
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
        // Coordonnées bancaires
        bankDetails: {
          iban: organization.bankIban || "",
          bic: organization.bankBic || "",
          bankName: organization.bankName || "",
        },
        // Informations légales
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
          vatRegime: organization.vatRegime || "",
          vatFrequency: organization.vatFrequency || "",
          vatMode: organization.vatMode || "",
          fiscalYearStartDate: organization.fiscalYearStartDate || "",
          fiscalYearEndDate: organization.fiscalYearEndDate || "",
        },
      };

      reset(initialData);
    }
  }, [organization, reset]);

  // Fonction de sauvegarde
  const handleSaveAll = async (formData) => {
    try {
      // Vérifier les permissions avant de sauvegarder
      if (!canManageOrgSettings) {
        toast.error(
          "Vous n'avez pas la permission de modifier les paramètres de l'organisation"
        );
        return;
      }

      if (!organization?.id) {
        toast.error("Aucune organisation active trouvée");
        return;
      }

      // Transformer les données pour Better Auth
      const transformedData = {
        // Informations générales
        companyName: sanitizeInput(formData.name || ""),
        companyEmail: sanitizeInput(formData.email || ""),
        companyPhone: sanitizeInput(formData.phone || ""),
        website: sanitizeInput(formData.website || ""),
        logo: formData.logo || "",
        addressStreet: sanitizeInput(formData.address?.street || ""),
        addressCity: sanitizeInput(formData.address?.city || ""),
        addressZipCode: sanitizeInput(formData.address?.postalCode || ""),
        addressCountry: formData.address?.country || "France",

        // Coordonnées bancaires
        bankName: sanitizeInput(formData.bankDetails?.bankName || ""),
        bankIban: sanitizeInput(formData.bankDetails?.iban || "")
          .replace(/\s/g, "")
          .toUpperCase(),
        bankBic: sanitizeInput(formData.bankDetails?.bic || ""),

        // Informations légales
        siret: sanitizeInput(formData.legal?.siret || ""),
        vatNumber: sanitizeInput(formData.legal?.vatNumber || ""),
        rcs: sanitizeInput(formData.legal?.rcs || ""),
        legalForm: formData.legal?.legalForm || "",
        capitalSocial: sanitizeInput(formData.legal?.capital || ""),
        fiscalRegime: formData.legal?.regime || "",
        activityCategory: formData.legal?.category || "",
        isVatSubject: formData.legal?.isVatSubject || false,
        hasCommercialActivity: formData.legal?.hasCommercialActivity || false,
        vatRegime: formData.legal?.vatRegime || "",
        vatFrequency: formData.legal?.vatFrequency || "",
        vatMode: formData.legal?.vatMode || "",
        fiscalYearStartDate: formData.legal?.fiscalYearStartDate || "",
        fiscalYearEndDate: formData.legal?.fiscalYearEndDate || "",
      };

      // Sauvegarder via Better Auth
      await updateOrganization(transformedData, {
        onSuccess: async () => {
          // Forcer un refetch pour s'assurer que les données sont bien en BDD
          if (refetchOrg) {
            await refetchOrg();
          }
          toast.success("Modifications sauvegardées avec succès");
        },
        onError: (error) => {
          console.error("❌ Erreur sauvegarde:", error);
          toast.error("Erreur lors de la sauvegarde");
        },
      });
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  // Fonction pour gérer le changement d'onglet
  const handleTabChange = (newTab) => {
    const isFormTab = [
      "generale",
      "coordonnees-bancaires",
      "informations-legales",
    ].includes(activeTab);

    if (isFormTab && isDirty) {
      setPendingTab(newTab);
      setShowNoChangesWarning(true);
    } else {
      setActiveTab(newTab);
    }
  };

  // Fonction pour gérer la fermeture du modal
  const handleCloseModal = () => {
    if (
      isDirty &&
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

  // Fonctions pour les modals de confirmation
  const handleForceClose = () => {
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    } else {
      onOpenChange(false);
    }
    setShowUnsavedWarning(false);
    setShowNoChangesWarning(false);
  };

  const handleCancelClose = () => {
    setPendingTab(null);
    setShowUnsavedWarning(false);
    setShowNoChangesWarning(false);
  };

  const renderContent = () => {
    // Les composants vont maintenant utiliser useFormContext()
    switch (activeTab) {
      case "espaces":
        return <EspacesSection canManageOrgSettings={canManageOrgSettings} />;
      case "preferences":
        return <PreferencesSection />;
      case "notifications":
        return <NotificationsSection />;
      case "generale":
        return (
          <GeneraleSection
            session={session}
            organization={organization}
            updateOrganization={updateOrganization}
            refetchOrganization={refetchOrg}
            canManageOrgSettings={canManageOrgSettings}
          />
        );
      case "coordonnees-bancaires":
        return (
          <CoordonneesBancairesSection
            session={session}
            organization={organization}
            updateOrganization={updateOrganization}
            refetchOrganization={refetchOrg}
            canManageOrgSettings={canManageOrgSettings}
          />
        );
      case "informations-legales":
        return (
          <InformationsLegalesSection
            session={session}
            organization={organization}
            updateOrganization={updateOrganization}
            refetchOrganization={refetchOrg}
            canManageOrgSettings={canManageOrgSettings}
          />
        );
      case "facturation":
        return <FacturationSection />;
      case "subscription":
        return <SubscriptionSection canManageSubscription={isOwner()} />;
      case "securite":
        return (
          <SecuritySection
            organization={organization}
            orgLoading={orgLoading}
            canManageOrgSettings={canManageOrgSettings}
          />
        );
      case "comptes-bancaires":
        return (
          <BankAccountsSection canManageOrgSettings={canManageOrgSettings} />
        );
      // DÉSACTIVÉ: SuperPDP API pas encore active
      // case "facturation-electronique":
      //   return (
      //     <EInvoicingSection canManageOrgSettings={canManageOrgSettings} />
      //   );
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
        { id: "preferences", label: "Préférences", icon: Settings2 },
        {
          id: "notifications",
          label: "Notifications",
          icon: Bell,
        },
      ],
    },
    {
      title: "Espace de travail",
      items: [
        { id: "generale", label: "Générale", icon: Settings },
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
          id: "comptes-bancaires",
          label: "Comptes bancaires",
          icon: Landmark,
        },
        { id: "securite", label: "Sécurité", icon: Shield },
        // DÉSACTIVÉ: SuperPDP API pas encore active
        // {
        //   id: "facturation-electronique",
        //   label: "Facturation électronique",
        //   icon: Zap,
        //   isNew: true,
        // },
      ],
    },
    {
      title: "Gestion",
      items: [
        {
          id: "personnes",
          label: "Accès",
          icon: Users,
          disabled: true,
        },
        {
          id: "espaces",
          label: "Espaces",
          icon: Building2,
          disabled: !isActive(),
        },
      ],
    },
    {
      title: "Préférences",
      items: [
        { id: "subscription", label: "Abonnement", icon: Crown },
        { id: "facturation", label: "Facturation", icon: CreditCard },
      ],
    },
  ];

  // Déterminer si on est sur mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Rendu conditionnel selon la taille d'écran
  if (isMobile) {
    return (
      <FormProvider {...formMethods}>
        <MobileSettingsModal
          open={open}
          onClose={() => onOpenChange(false)}
          session={session}
          organization={organization}
          updateOrganization={updateOrganization}
          refetchOrganization={refetchOrg}
          formIsSubmitting={formIsSubmitting}
          isDirty={isDirty}
          onSubmit={handleSubmit(handleSaveAll)}
        />
      </FormProvider>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <FormProvider {...formMethods}>
        <DialogContent
          className="max-h-[90vh] md:max-h-[90vh] p-0 gap-0 overflow-hidden"
          style={{
            maxWidth: "72rem",
            width: "95vw",
            height: "92vh",
          }}
        >
          <DialogTitle className="sr-only">
            Paramètres de l'application
          </DialogTitle>

          <form onSubmit={handleSubmit(handleSaveAll)}>
            {/* Desktop Layout */}
            <div className="flex h-full">
              {/* Sidebar Desktop */}
              <div className="w-60 bg-gray-50 dark:bg-[#171717] overflow-y-auto max-h-[92vh]">
                <div className="p-4">
                  <h2 className="text-sm font-medium text-gray-500 mb-4">
                    Paramètres
                  </h2>

                  {/* User Info */}
                  <button
                    type="button"
                    onClick={() => handleTabChange("user-info")}
                    className={`w-full flex items-center gap-2 mb-4 px-2 py-2 rounded-md transition-colors ${
                      activeTab === "user-info"
                        ? "bg-[#EDECEB] dark:bg-[#2c2c2c]"
                        : "hover:bg-gray-100 dark:hover:bg-[#2c2c2c]"
                    }`}
                  >
                    {session?.user?.avatar ? (
                      <img
                        src={session.user.avatar}
                        alt={session?.user?.name || "Utilisateur"}
                        className="w-6 h-6 rounded-md object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-[#5B4FFF]/300 rounded-md flex items-center justify-center text-white text-xs font-medium">
                        {session?.user?.name?.charAt(0) || "S"}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {session?.user?.name || "Utilisateur"}
                      </p>
                    </div>
                  </button>

                  {/* Sections */}
                  <div className="space-y-1">
                    {sections.map((section, sectionIndex) => (
                      <div key={sectionIndex}>
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
                                <span className="flex font-normal items-center gap-2">
                                  {item.label}
                                  {item.isNew && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 rounded-md">
                                      nouveau
                                    </span>
                                  )}
                                  {item.disabled &&
                                    (item.id === "espaces" ? (
                                      <Crown className="w-3 h-3 text-[#5b4fff]" />
                                    ) : (
                                      <span className="px-2 py-0.5 text-[10px] font-normal bg-[#5a50ff]/10 border border-[#5a50ff]/30 text-[#5a50ff] rounded-md">
                                        à venir
                                      </span>
                                    ))}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Content Area Desktop */}
              <div className="flex-1 bg-white dark:bg-[#0A0A0A] flex flex-col">
                <div
                  className="flex-1 overflow-y-auto"
                  style={{
                    height: "calc(88vh - 80px)",
                    maxHeight: "calc(88vh - 58px)",
                    overflowY: "scroll",
                  }}
                >
                  <div className="p-12 pb-6">{renderContent()}</div>
                </div>

                {/* Fixed Footer with Buttons */}
                <div className="border-t bg-white dark:bg-[#0A0A0A] p-4 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer"
                    onClick={handleCloseModal}
                  >
                    Annuler
                  </Button>
                  {[
                    "generale",
                    "coordonnees-bancaires",
                    "informations-legales",
                  ].includes(activeTab) && (
                    <Button
                      type="submit"
                      disabled={
                        formIsSubmitting || !isDirty || !canManageOrgSettings
                      }
                      className="bg-[#5b4eff] cursor-pointer hover:bg-[#5b4eff] dark:text-white"
                      title={
                        !canManageOrgSettings
                          ? "Seuls les owners et admins peuvent modifier les paramètres"
                          : ""
                      }
                    >
                      {formIsSubmitting ? "Sauvegarde..." : "Sauvegarder"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </DialogContent>

        {/* Alert Dialogs */}
        <AlertDialog
          open={showUnsavedWarning}
          onOpenChange={setShowUnsavedWarning}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Modifications non sauvegardées
              </AlertDialogTitle>
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

        <AlertDialog
          open={showNoChangesWarning}
          onOpenChange={setShowNoChangesWarning}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Modifications non sauvegardées
              </AlertDialogTitle>
              <AlertDialogDescription>
                Vous avez des modifications non sauvegardées. Souhaitez-vous
                continuer à modifier ou changer d'onglet sans sauvegarder ?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={handleCancelClose}
                className="cursor-pointer"
              >
                Continuer la modification
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleForceClose}
                className="bg-red-600 hover:bg-red-700 dark:text-white cursor-pointer"
              >
                Changer d'onglet sans sauvegarder
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </FormProvider>
    </Dialog>
  );
}
