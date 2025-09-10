"use client";

import { useEffect, useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "@/src/components/ui/sonner";
import { getActiveOrganization, updateOrganization } from "@/src/lib/organization-client";
import { useUser } from "@/src/lib/auth/hooks";
import { useCreateQuote, useUpdateQuote, useQuote } from "@/src/graphql/quoteQueries";
import { useQuoteNumber } from "./use-quote-number";

// const AUTOSAVE_DELAY = 30000; // 30 seconds - DISABLED

export function useQuoteEditor({ mode, quoteId, initialData }) {
  const router = useRouter();
  // const autosaveTimeoutRef = useRef(null); // DISABLED - Auto-save removed

  // Auth hook pour récupérer les données utilisateur
  const { session } = useUser();

  // GraphQL hooks
  const { quote: existingQuote, loading: loadingQuote } = useQuote(quoteId);

  // Use the new quote numbering hook that mirrors invoice logic
  const {
    nextQuoteNumber,
    validateQuoteNumber,
    isLoading: numberLoading,
    hasExistingQuotes
  } = useQuoteNumber();

  const { createQuote, loading: creating } = useCreateQuote();
  const { updateQuote, loading: updating } = useUpdateQuote();

  // Form state avec react-hook-form
  const form = useForm({
    defaultValues: getInitialFormData(mode, initialData, session),
    mode: "onChange",
    resolver: (values) => {
      const errors = {};
      
      // Validation de la date d'émission
      if (values.issueDate) {
        const issueDate = new Date(values.issueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Réinitialiser l'heure à minuit pour la comparaison
        
        if (issueDate < today) {
          errors.issueDate = {
            type: 'validate',
            message: 'La date d\'émission ne peut pas être antérieure à la date actuelle'
          };
        }
        
        // Validation de la date de validité
        if (values.validUntil) {
          const validUntilDate = new Date(values.validUntil);
          
          if (validUntilDate < issueDate) {
            errors.validUntil = {
              type: 'validate',
              message: 'La date de validité ne peut pas être antérieure à la date d\'émission'
            };
          }
        }
      }
      
      return {
        values,
        errors: Object.keys(errors).length > 0 ? errors : {}
      };
    },
  });

  const { watch, setValue, getValues, reset } = form;
  // const { isDirty } = formState; // DISABLED - Auto-save removed

  const [saving, setSaving] = useState(false);

  // Watch all form data for auto-save
  const formData = watch();

  // Initialize form data when quote loads
  useEffect(() => {
    if (existingQuote && mode !== "create") {
      console.log("🔍 Données brutes du devis:", {
        id: existingQuote.id,
        issueDate: existingQuote.issueDate,
        validUntil: existingQuote.validUntil,
        status: existingQuote.status,
        appearance: existingQuote.appearance,
        appearanceDetails: {
          textColor: existingQuote.appearance?.textColor,
          headerBgColor: existingQuote.appearance?.headerBgColor,
          headerTextColor: existingQuote.appearance?.headerTextColor
        },
        rawValidUntil: existingQuote.validUntil,
        rawIssueDate: existingQuote.issueDate
      });
      
      const quoteData = transformQuoteToFormData(existingQuote);
      console.log("🎨 Données d'apparence transformées:", quoteData.appearance);

      reset(quoteData);

      // Vérifier les données après reset
      setTimeout(() => {
        const currentFormData = getValues();
        console.log("🔍 Données après reset:", {
          issueDate: currentFormData.issueDate,
          validUntil: currentFormData.validUntil,
          status: currentFormData.status,
          appearance: currentFormData.appearance,
          client: currentFormData.client ? 'Client présent' : 'Aucun client'
        });
      }, 100);
    } else {
      console.log("❌ Conditions non remplies pour le chargement:", {
        hasExistingQuote: !!existingQuote,
        isNotCreateMode: mode !== "create",
      });
    }
  }, [existingQuote, mode, reset, getValues]);

  // Set next quote number for new quotes
  useEffect(() => {
    if (mode === "create") {
      // Set the next sequential number or 000001 for first quote
      const numberToUse = nextQuoteNumber || 1;
      const formattedNumber = String(numberToUse).padStart(6, '0');
      setValue("number", formattedNumber);
    }
  }, [mode, nextQuoteNumber, setValue]);

  // Effet pour charger les données d'organisation au démarrage
  useEffect(() => {
    if (mode === "create") {
      const loadOrganizationData = async () => {
        try {
          const organization = await getActiveOrganization();
          console.log("🔍 Debug - Organisation récupérée:", organization);
          
          if (organization) {
            // Utiliser directement les couleurs de l'organisation pour l'apparence par défaut
            setValue("appearance.textColor", organization.documentTextColor || "#000000");
            setValue("appearance.headerTextColor", organization.documentHeaderTextColor || "#ffffff");
            setValue("appearance.headerBgColor", organization.documentHeaderBgColor || "#1d1d1b");
            
            // Utiliser les notes et conditions spécifiques aux devis
            setValue("headerNotes", organization.quoteHeaderNotes || organization.documentHeaderNotes || "");
            setValue("footerNotes", organization.quoteFooterNotes || organization.documentFooterNotes || "");
            setValue("termsAndConditions", organization.quoteTermsAndConditions || organization.documentTermsAndConditions || "");
            setValue("showBankDetails", organization.showBankDetails || false);
            
            // Ajouter les coordonnées bancaires dans companyInfo
            setValue("companyInfo.bankName", organization.bankName || "");
            setValue("companyInfo.bankIban", organization.bankIban || "");
            setValue("companyInfo.bankBic", organization.bankBic || "");
            
            console.log("🔍 Debug - Données d'organisation appliquées:", {
              bankName: organization.bankName,
              bankIban: organization.bankIban,
              bankBic: organization.bankBic
            });
          }
        } catch (error) {
          console.error("❌ Erreur lors de la récupération de l'organisation:", error);
        }
      };
      
      loadOrganizationData();
    }
  }, [mode, setValue]);

  // Auto-remplir companyInfo quand la session devient disponible
  useEffect(() => {
    if (mode === "create" && session?.user?.company) {
      const userCompany = session.user.company;

      setValue("companyInfo.name", userCompany.name || "");
      setValue("companyInfo.email", userCompany.email || "");
      setValue("companyInfo.phone", userCompany.phone || "");
      setValue("companyInfo.website", userCompany.website || "");
      setValue("companyInfo.siret", userCompany.siret || "");
      setValue("companyInfo.vatNumber", userCompany.vatNumber || "");

      // Gérer l'adresse de l'entreprise
      if (userCompany.address) {
        if (typeof userCompany.address === "string") {
          setValue("companyInfo.address", userCompany.address);
        } else {
          const addressString =
            `${userCompany.address.street || ""}, ${userCompany.address.city || ""}, ${userCompany.address.country || ""}`.replace(
              /^,\s*|,\s*$/g,
              ""
            );
          setValue("companyInfo.address", addressString);
        }
      }

      // Gérer les coordonnées bancaires (nettoyer les métadonnées GraphQL)
      if (userCompany.bankDetails) {
        const cleanBankDetails = {
          iban: userCompany.bankDetails.iban || "",
          bic: userCompany.bankDetails.bic || "",
          bankName: userCompany.bankDetails.bankName || "",
          // Suppression explicite de __typename et autres métadonnées GraphQL
        };
        setValue("userBankDetails", cleanBankDetails);
      }
    }
  }, [mode, session, setValue]);

  // Validation functions
  const validateStep1 = useCallback(() => {
    const data = getValues();

    // Logs de débogage supprimés

    // Vérifier le client
    if (!data.client?.id) {
      return false;
    }

    // Vérifier les informations de l'entreprise (plus flexible)
    // Si pas de companyInfo dans le formulaire, on utilise les données de session
    const hasCompanyInfo =
      data.companyInfo?.name || session?.user?.company?.name;

    if (!hasCompanyInfo) {
      console.log(
        "⚠️ Validation Step 1: Aucune information d'entreprise - mais on continue (temporaire)"
      );
      // return false; // Désactivé temporairement
    }

    // Vérifier la date d'émission
    if (!data.issueDate) {
      toast.error("La date d'émission est requise");
      return false;
    }
    
    // Vérifier que la date d'émission n'est pas antérieure à la date actuelle
    const issueDate = new Date(data.issueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Réinitialiser l'heure à minuit pour la comparaison
    
    if (issueDate < today) {
      toast.error("La date d'émission ne peut pas être antérieure à la date actuelle");
      return false;
    }
    
    // Vérifier la date de validité
    if (data.validUntil) {
      const validUntilDate = new Date(data.validUntil);
      
      // Vérifier que la date de validité n'est pas antérieure à la date d'émission
      if (validUntilDate < issueDate) {
        toast.error("La date de validité ne peut pas être antérieure à la date d'émission");
        return false;
      }
    }

    return true;
  }, [getValues, session?.user?.company?.name]);

  const validateStep2 = useCallback(() => {
    const data = getValues();

    // Vérifier qu'il y a au moins un article
    if (!data.items || data.items.length === 0) {
      return false;
    }

    // Vérifier que tous les articles ont une description, quantité et prix
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      if (!item.description || !item.quantity || !item.unitPrice) {
        return false;
      }
    }

    return true;
  }, [getValues]);

  // Save function (for drafts and updates)
  const handleSave = useCallback(
    async (isAutoSave = false) => {
      try {
        setSaving(true);
        const currentFormData = getValues();
        
        // Vérifier la validité du formulaire
        if (!isAutoSave) {
          if (!validateStep1()) {
            toast.error("Veuillez corriger les erreurs avant d'enregistrer");
            setSaving(false);
            return false;
          }
        }

        if (!isAutoSave) {
          console.log("💾 Sauvegarde manuelle déclenchée");
        }

        const input = transformFormDataToInput(
          currentFormData,
          existingQuote?.status,
          session,
          existingQuote
        );
        input.status = "DRAFT";
        
        console.log("💾 Données à sauvegarder (appearance):", {
          formDataAppearance: currentFormData.appearance,
          formDataAppearanceDetails: {
            textColor: currentFormData.appearance?.textColor,
            headerBgColor: currentFormData.appearance?.headerBgColor,
            headerTextColor: currentFormData.appearance?.headerTextColor
          },
          inputAppearance: input.appearance,
          inputAppearanceDetails: {
            textColor: input.appearance?.textColor,
            headerBgColor: input.appearance?.headerBgColor,
            headerTextColor: input.appearance?.headerTextColor
          }
        });

        let result;
        if (mode === "create" || !quoteId) {
          result = await createQuote(input);

          if (result?.id) {
            const newQuoteId = result.id;
            console.log("✅ Devis créé avec succès, ID:", newQuoteId);

            if (!isAutoSave) {
              toast.success("Brouillon sauvegardé");
              router.push("/dashboard/outils/devis");
            } else {
              console.log("⏸️ Pas de redirection (auto-sauvegarde)");
            }
          }
        } else {
          result = await updateQuote(quoteId, input);

          if (!isAutoSave) {
            toast.success("Brouillon sauvegardé");
            router.push("/dashboard/outils/devis");
          } else {
            console.log("⏸️ Pas de redirection (auto-sauvegarde)");
          }
        }
      } catch (error) {
        console.error("❌ Erreur lors de la sauvegarde:", error);
        if (!isAutoSave) {
          toast.error("Erreur lors de la sauvegarde");
        }
        return false;
      } finally {
        setSaving(false);
      }
      
      return true;
    },
    [
      mode,
      quoteId,
      existingQuote,
      getValues,
      createQuote,
      updateQuote,
      router,
      session,
      validateStep1
    ]
  );

  // Submit function (for final quote creation)
  const handleSubmit = useCallback(
    async (formDataOverride) => {
      try {
        setSaving(true);
        const currentFormData = formDataOverride || getValues();

        if (!validateStep1() || !validateStep2()) {
          toast.error("Veuillez corriger les erreurs avant de créer le devis");
          return;
        }

        const input = transformFormDataToInput(
          currentFormData,
          existingQuote?.status,
          session,
          existingQuote
        );
        input.status = "PENDING";

        let result;
        if (existingQuote?.id) {
          result = await updateQuote(existingQuote.id, input);
        } else {
          result = await createQuote(input);
        }

        if (result?.id) {
          toast.success(
            existingQuote?.id
              ? "Devis mis à jour avec succès"
              : "Devis créé avec succès"
          );
          router.push("/dashboard/outils/devis");
        }
      } catch (error) {
        console.error("❌ Erreur lors de la soumission:", error);
        toast.error("Erreur lors de la création du devis");
      } finally {
        setSaving(false);
      }
    },
    [
      existingQuote,
      getValues,
      validateStep1,
      validateStep2,
      createQuote,
      updateQuote,
      router,
      session,
    ]
  );

  // Cleanup on unmount - DISABLED (auto-save removed)
  // useEffect(() => {
  //   return () => {
  //     if (autosaveTimeoutRef.current) {
  //       clearTimeout(autosaveTimeoutRef.current);
  //     }
  //   };
  // }, []);

  // Helper function to set form data programmatically
  const setFormData = useCallback(
    (newData) => {
      Object.keys(newData).forEach((key) => {
        setValue(key, newData[key], { shouldDirty: true });
      });
    },
    [setValue]
  );

  // Fonction pour sauvegarder les paramètres dans l'organisation
  const saveSettingsToOrganization = useCallback(async () => {
    try {
      const currentFormData = getValues();
      const activeOrganization = await getActiveOrganization();
      
      const organizationData = {
        documentTextColor: currentFormData.appearance?.textColor || "#000000",
        documentHeaderTextColor: currentFormData.appearance?.headerTextColor || "#ffffff",
        documentHeaderBgColor: currentFormData.appearance?.headerBgColor || "#1d1d1b",
        quoteHeaderNotes: currentFormData.headerNotes || "",
        quoteFooterNotes: currentFormData.footerNotes || "",
        quoteTermsAndConditions: currentFormData.termsAndConditions || "",
        showBankDetails: currentFormData.showBankDetails || false,
      };

      await updateOrganization(activeOrganization.id, organizationData);
      console.log("✅ Paramètres sauvegardés dans l'organisation:", organizationData);
    } catch (error) {
      console.error("❌ Erreur lors de la sauvegarde des paramètres:", error);
      throw error;
    }
  }, [getValues]);

  return {
    // Form methods
    form,
    formData,

    // Loading states
    loading: loadingQuote || creating || updating || saving || numberLoading,
    saving,

    // Validation
    validateStep1,
    validateStep2,

    // Actions
    onSave: (formData) => {
      console.log("🔄 onSave appelé depuis le formulaire avec:", {
        formData,
        status: formData?.status,
      });
      // Mettre à jour les données du formulaire si nécessaire
      if (formData) {
        setFormData(formData);
      }
      // Appeler handleSave avec isAutoSave = false (sauvegarde manuelle)
      return handleSave(false);
    },
    onSubmit: handleSubmit,
    setFormData,

    // Data
    existingQuote,
    nextQuoteNumber,
    validateQuoteNumber,
    hasExistingQuotes,
    canEdit:
      !loadingQuote && (mode === "create" || existingQuote?.status === "DRAFT"),
    
    // Organization settings
    saveSettingsToOrganization,
  };
}

// Helper functions
function getInitialFormData(mode, initialData, session) {
  const today = new Date().toISOString().split("T")[0];
  
  // Utiliser la valeur validUntil existante si elle est disponible
  // sinon définir une date par défaut (aujourd'hui + 30 jours)
  const validUntil = initialData?.validUntil || 
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const baseData = {
    // Informations du devis
    prefix: "",
    number: "",
    reference: "",
    issueDate: today,
    validUntil: validUntil,
    status: "DRAFT",

    // Client
    client: null,

    // Informations de l'entreprise
    companyInfo: {
      name: "",
      email: "",
      phone: "",
      website: "",
      siret: "",
      vatNumber: "",
      address: "",
      bankDetails: null,
    },

    // Articles
    items: [],

    // Remise globale
    discount: 0,
    discountType: "PERCENTAGE",

    // Notes et conditions
    headerNotes: "",
    footerNotes: "",
    terms: "",

    // Champs personnalisés
    customFields: [],

    // Coordonnées bancaires
    showBankDetails: false,
    bankDetails: {
      iban: "",
      bic: "",
      bankName: "",
    },
    userBankDetails: null,

    // Paramètres d'apparence
    appearance: {
      textColor: "#000000",
      headerTextColor: "#ffffff",
      headerBgColor: "#1d1d1b",
    },

    // Paramètres d'organisation (pour les valeurs par défaut)
    organizationSettings: null,
  };


  if (mode === "create" && session?.user?.company) {
    const userCompany = session.user.company;
    
    baseData.companyInfo = {
      name: userCompany.name || "",
      email: userCompany.email || "",
      phone: userCompany.phone || "",
      website: userCompany.website || "",
      siret: userCompany.siret || "",
      vatNumber: userCompany.vatNumber || "",
      address:
        typeof userCompany.address === "string"
          ? userCompany.address
          : userCompany.address
            ? `${userCompany.address.street || ""}, ${userCompany.address.city || ""}, ${userCompany.address.country || ""}`.replace(
                /^,\s*|,\s*$/g,
                ""
              )
            : "",
      // Coordonnées bancaires directement dans companyInfo
      bankName: userCompany.bankName || "",
      bankIban: userCompany.bankIban || "",
      bankBic: userCompany.bankBic || "",
      // Nettoyer les métadonnées GraphQL des coordonnées bancaires
      bankDetails: userCompany.bankDetails
        ? {
            iban: userCompany.bankDetails.iban || "",
            bic: userCompany.bankDetails.bic || "",
            bankName: userCompany.bankDetails.bankName || "",
            // Suppression explicite de __typename et autres métadonnées GraphQL
          }
        : null,
    };

    if (userCompany.bankDetails) {
      baseData.userBankDetails = {
        iban: userCompany.bankDetails.iban || "",
        bic: userCompany.bankDetails.bic || "",
        bankName: userCompany.bankDetails.bankName || "",
        // Suppression explicite de __typename et autres métadonnées GraphQL
      };
    }
  }

  return { ...baseData, ...initialData };
}

function transformQuoteToFormData(quote) {
  const transformDate = (dateValue, fieldName) => {
    if (dateValue === null || dateValue === undefined) {
      return "";
    }

    try {
      let dateObj;
      
      // Si c'est déjà une chaîne au format YYYY-MM-DD
      if (typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return dateValue;
      }
      
      // Si c'est un timestamp numérique ou une chaîne de chiffres
      if ((typeof dateValue === 'number' && !isNaN(dateValue)) || 
          (typeof dateValue === 'string' && /^\d+$/.test(dateValue))) {
        const timestamp = typeof dateValue === 'string' ? parseInt(dateValue, 10) : dateValue;
        
        // Vérifier si c'est un timestamp en secondes (10 chiffres) ou millisecondes (13 chiffres)
        if (timestamp > 0) {
          const timestampMs = timestamp.toString().length === 10 ? timestamp * 1000 : timestamp;
          dateObj = new Date(timestampMs);
          
          if (isNaN(dateObj.getTime())) {
            return "";
          }
          
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          const result = `${year}-${month}-${day}`;
          
          return result;
        } else {
          return "";
        }
      }
      // Si c'est une chaîne avec un timestamp ISO (2024-09-25T00:00:00.000Z)
      else if (typeof dateValue === "string" && dateValue.includes("T")) {
        // Extraire uniquement la partie date (YYYY-MM-DD)
        const datePart = dateValue.split('T')[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
          return datePart;
        }
        dateObj = new Date(dateValue);
      } 
      // Si c'est déjà un objet Date
      else if (dateValue instanceof Date) {
        dateObj = dateValue;
      }
      // Si c'est un objet avec des propriétés de date (comme venant d'un sélecteur de date)
      else if (dateValue && typeof dateValue === 'object') {
        
        // Format avec year, month, day
        if ('year' in dateValue && 'month' in dateValue && 'day' in dateValue) {
          dateObj = new Date(dateValue.year, dateValue.month - 1, dateValue.day);
        }
        // Format avec getTime()
        else if ('getTime' in dateValue) {
          dateObj = new Date(dateValue.getTime());
        }
        // Autre format d'objet non reconnu
        else {
          return "";
        }
      }
      // Format non reconnu
      else {
        return "";
      }

      // Vérifier que la date est valide
      if (isNaN(dateObj.getTime())) {
        return "";
      }

      // Formater en YYYY-MM-DD
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const result = `${year}-${month}-${day}`;
      
      return result;
    } catch (error) {
      console.error(`❌ Erreur lors de la transformation de ${fieldName}:`, error);
      return "";
    }
  };

  const issueDate = transformDate(quote.issueDate, "issueDate");
  
  // Pour la date de validité, on la récupère directement depuis la base de données
  // sans appliquer de logique conditionnelle qui pourrait la supprimer
  let validUntil = "";
  
  if (quote.validUntil !== undefined && quote.validUntil !== null && quote.validUntil !== '') {
    validUntil = transformDate(quote.validUntil, "validUntil");
  } else {
    console.log("ℹ️ Aucune date de validité trouvée dans le devis");
  }
  
  return {
    prefix: quote.prefix || "",
    number: quote.number || "",
    reference: quote.reference || "",
    issueDate: issueDate,
    validUntil: validUntil,
    status: quote.status || "DRAFT",

    client: quote.client
      ? {
          id: quote.client.id,
          type: quote.client.type,
          email: quote.client.email,
          phone: quote.client.phone,
          address: quote.client.address,
          ...(quote.client.type === "COMPANY"
            ? {
                companyName: quote.client.companyName,
                siret: quote.client.siret,
                vatNumber: quote.client.vatNumber,
                contactFirstName: quote.client.contactFirstName,
                contactLastName: quote.client.contactLastName,
              }
            : {
                firstName: quote.client.firstName,
                lastName: quote.client.lastName,
              }),
        }
      : null,

    companyInfo: {
      name: quote.companyInfo?.name || "",
      email: quote.companyInfo?.email || "",
      phone: quote.companyInfo?.phone || "",
      website: quote.companyInfo?.website || "",
      siret: quote.companyInfo?.siret || "",
      vatNumber: quote.companyInfo?.vatNumber || "",
      address: quote.companyInfo?.address
        ? typeof quote.companyInfo.address === "string"
          ? quote.companyInfo.address
          : `${quote.companyInfo.address.street || ""}, ${quote.companyInfo.address.city || ""}, ${quote.companyInfo.address.country || ""}`.replace(
              /^,\s*|,\s*$/g,
              ""
            )
        : "",
      bankDetails: quote.companyInfo?.bankDetails || null,
    },

    items:
      quote.items?.map((item) => ({
        description: item.description || "",
        details: item.details || "",
        quantity: item.quantity || 0,
        unit: item.unit || "pièce",
        unitPrice: item.unitPrice || 0,
        vatRate: item.vatRate || 0,
        discount: item.discount || 0,
        discountType: item.discountType || "PERCENTAGE",
        vatExemptionText: item.vatExemptionText || "",
      })) || [],

    discount: quote.discount || 0,
    discountType: quote.discountType || "PERCENTAGE",

    headerNotes: quote.headerNotes || "",
    footerNotes: quote.footerNotes || "",
    terms: quote.terms || "",

    customFields:
      quote.customFields?.map((field) => ({
        name: field.key,
        value: field.value,
      })) || [],

    showBankDetails: !!(
      quote.companyInfo?.bankDetails &&
      (quote.companyInfo.bankDetails.iban ||
        quote.companyInfo.bankDetails.bic ||
        quote.companyInfo.bankDetails.bankName)
    ),

    // Nettoyer les métadonnées GraphQL des coordonnées bancaires
    bankDetails: quote.companyInfo?.bankDetails
      ? {
          iban: quote.companyInfo.bankDetails.iban || "",
          bic: quote.companyInfo.bankDetails.bic || "",
          bankName: quote.companyInfo.bankDetails.bankName || "",
          // Suppression explicite de __typename et autres métadonnées GraphQL
        }
      : {
          iban: "",
          bic: "",
          bankName: "",
        },

    userBankDetails: quote.companyInfo?.bankDetails
      ? {
          iban: quote.companyInfo.bankDetails.iban || "",
          bic: quote.companyInfo.bankDetails.bic || "",
          bankName: quote.companyInfo.bankDetails.bankName || "",
          // Suppression explicite de __typename et autres métadonnées GraphQL
        }
      : null,

    // Paramètres d'apparence depuis le devis existant
    appearance: quote.appearance ? {
      textColor: quote.appearance.textColor || "#000000",
      headerTextColor: quote.appearance.headerTextColor || "#ffffff",
      headerBgColor: quote.appearance.headerBgColor || "#1d1d1b",
    } : {
      textColor: "#000000",
      headerTextColor: "#ffffff",
      headerBgColor: "#1d1d1b",
    },
  };
}

function transformFormDataToInput(
  formData,
  previousStatus = null,
  session = null,
  existingQuote = null // Ajouter existingQuote comme paramètre
) {

  const cleanClient = formData.client
    ? {
        id: formData.client.id,
        // Générer automatiquement le champ name requis s'il n'existe pas
        name:
          formData.client.name ||
          (formData.client.type === "COMPANY"
            ? formData.client.companyName || "Entreprise"
            : `${formData.client.firstName || ""} ${formData.client.lastName || ""}`.trim() ||
              "Client"),
        email: formData.client.email,
        type: formData.client.type,
        firstName: formData.client.firstName,
        lastName: formData.client.lastName,
        siret: formData.client.siret,
        vatNumber: formData.client.vatNumber,
        address: formData.client.address
          ? typeof formData.client.address === "string"
            ? parseAddressString(formData.client.address)
            : (() => {
                const addr = formData.client.address;
                // Supprimer __typename si présent (pollution GraphQL)
                if (addr && addr.__typename) {
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  const { __typename, ...cleanAddr } = addr;
                  return cleanAddr;
                }
                return addr;
              })()
          : null,
      }
    : null;

  // Utiliser les informations de l'entreprise du formulaire ou de la session comme fallback
  const sessionCompany = session?.user?.company;
  const companyInfo = formData.companyInfo || sessionCompany;

  // Si aucune information d'entreprise n'est disponible, utiliser des valeurs par défaut temporaires
  const cleanCompanyInfo = {
    name: companyInfo?.name || "Mon Entreprise",
    email: companyInfo?.email || session?.user?.email || "",
    phone: companyInfo?.phone || "",
    website: companyInfo?.website || "",
    siret: companyInfo?.siret || "",
    vatNumber: companyInfo?.vatNumber || "",
    address: companyInfo?.address
      ? typeof companyInfo.address === "string"
        ? parseAddressString(companyInfo.address)
        : companyInfo.address
      : {
          street: "",
          city: "",
          postalCode: "",
          country: "France",
        },
    bankDetails: formData.showBankDetails
      ? formData.bankDetails &&
        (formData.bankDetails.iban ||
          formData.bankDetails.bic ||
          formData.bankDetails.bankName)
        ? {
            iban: formData.bankDetails.iban || "",
            bic: formData.bankDetails.bic || "",
            bankName: formData.bankDetails.bankName || "",
          }
        : companyInfo?.bankDetails &&
            (companyInfo.bankDetails.iban ||
              companyInfo.bankDetails.bic ||
              companyInfo.bankDetails.bankName)
          ? {
              iban: companyInfo.bankDetails.iban || "",
              bic: companyInfo.bankDetails.bic || "",
              bankName: companyInfo.bankDetails.bankName || "",
            }
          : null
      : null,
  };

  let issueDate = formData.issueDate;
  if (previousStatus === "DRAFT" && formData.status === "PENDING") {
    issueDate = new Date().toISOString().split("T")[0];
  }

  // S'assurer qu'on a toujours une date d'émission valide
  if (!issueDate) {
    issueDate = new Date().toISOString().split("T")[0];
  } else {
    // S'assurer que la date est au bon format
    try {
      const d = new Date(issueDate);
      if (isNaN(d.getTime())) {
        issueDate = new Date().toISOString().split("T")[0];
      } else {
        // Reformater pour s'assurer du format YYYY-MM-DD
        issueDate = d.toISOString().split("T")[0];
      }
    } catch (e) {
      console.error('Erreur lors de la validation de la date d\'émission:', e);
      issueDate = new Date().toISOString().split("T")[0];
    }
  }

  const ensureValidDate = (dateValue, fieldName, fallbackDate = null, existingQuoteParam = null) => {
    
    // Fonction pour créer une date sans l'heure
    const createDateWithoutTime = (date) => {
      if (!date) return null;
      const d = new Date(date);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    };
    
    // Si on a une date valide, on la retourne
    if (dateValue) {
      // Si c'est déjà une chaîne au format YYYY-MM-DD
      if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        const [year, month, day] = dateValue.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date;
      }
      
      // Pour les autres formats de date
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return createDateWithoutTime(date);
      }
    }
    
    // Si on est en mode édition et qu'il y a une date existante dans le devis, on la conserve
    if (existingQuoteParam && existingQuoteParam.validUntil) {
      const existingDate = createDateWithoutTime(existingQuoteParam.validUntil);
      if (existingDate && !isNaN(existingDate.getTime())) {
        return existingDate;
      }
    }
    
    // Si on est en mode édition et qu'il y a une date existante dans le formulaire, on la conserve
    if (formData.id && formData.validUntil) {
      const existingDate = createDateWithoutTime(formData.validUntil);
      if (existingDate && !isNaN(existingDate.getTime())) {
        return existingDate;
      }
    }
    
    // Sinon, on utilise la date de fallback fournie ou la date d'émission + 30 jours
    let fallback;
    if (fallbackDate) {
      fallback = createDateWithoutTime(fallbackDate);
    } else {
      // Créer une date à partir de la date d'émission ou de la date actuelle
      const baseDate = issueDate ? new Date(issueDate) : new Date();
      fallback = createDateWithoutTime(baseDate);
      // Ajouter 30 jours par défaut
      fallback.setDate(fallback.getDate() + 30);
    }
    
    return fallback;
  };

  // Vérifier si on est en mode édition et si le devis existant a une date de validité
  const isEditMode = !!existingQuote;
  const existingValidUntil = existingQuote?.validUntil;
    
  // Déterminer la date de validité
  let validUntilDate;
  try {
    if (isEditMode && existingValidUntil) {
      validUntilDate = new Date(existingValidUntil);
      // Vérifier que la date est valide
      if (isNaN(validUntilDate.getTime())) {
        validUntilDate = ensureValidDate(formData.validUntil, "validUntil", null, existingQuote);
      }
    } else {
      validUntilDate = ensureValidDate(formData.validUntil, "validUntil", null, existingQuote);
    }
  } catch (e) {
    console.error('Erreur lors de la récupération de la date de validité:', e);
    validUntilDate = new Date(issueDate);
    validUntilDate.setDate(validUntilDate.getDate() + 30); // 30 jours par défaut
  }
  
  // Fonction pour créer une date sans l'heure pour la comparaison
  const createDateWithoutTime = (date) => {
    if (!date) return null;
    try {
      // Si c'est déjà une chaîne au format YYYY-MM-DD
      if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [year, month, day] = date.split('-').map(Number);
        return new Date(year, month - 1, day);
      }
      
      const d = new Date(date);
      if (isNaN(d.getTime())) {
        console.warn('Date invalide fournie à createDateWithoutTime:', date);
        return null;
      }
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    } catch (e) {
      console.error('Erreur lors de la création de la date:', e, 'Valeur:', date);
      return null;
    }
  };

  // S'assurer que la date de validité est postérieure ou égale à la date d'émission
  const issueDateForComparison = createDateWithoutTime(issueDate);
  const validUntilDateNoTime = createDateWithoutTime(validUntilDate);
  
  // Vérifier que les dates sont valides avant de les utiliser
  if (!issueDateForComparison || !validUntilDateNoTime) {
    const errorMessage = `❌ Erreur: Date invalide détectée - ` +
      `issueDate: ${issueDate} (${typeof issueDate}), ` +
      `validUntilDate: ${validUntilDate} (${typeof validUntilDate})`;
    console.error(errorMessage);
    
    // Utiliser des valeurs par défaut sécurisées
    const today = new Date();
    const defaultValidUntil = new Date(today);
    defaultValidUntil.setDate(today.getDate() + 30);
    
    return {
      ...formData,
      issueDate: today.toISOString().split('T')[0],
      validUntil: defaultValidUntil.toISOString().split('T')[0],
      status: formData.status || "DRAFT"
    };
  }
    
  // Si la date de validité est antérieure à la date d'émission, on l'ajuste
  if (validUntilDateNoTime < issueDateForComparison) {
    // Utiliser la date d'émission + 1 jour comme date de validité minimale
    validUntilDate = new Date(issueDateForComparison);
    validUntilDate.setDate(validUntilDate.getDate() + 1);
  }
  
  // Formater les dates finales en tenant compte du fuseau horaire local
  const formatFinalDate = (date) => {
    try {
      if (!date) return null;
      
      // Si c'est déjà au format YYYY-MM-DD, le retourner tel quel
      if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }
      
      // Créer une date locale sans décalage de fuseau horaire
      const d = new Date(date);
      if (isNaN(d.getTime())) return null;
      
      // Formater manuellement pour éviter les problèmes de fuseau horaire
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (e) {
      console.error('Erreur lors du formatage final de la date:', e);
      return null;
    }
  };
  
  // Formater les dates finales en ignorant l'heure et le fuseau horaire
  const today = new Date();
  const defaultIssueDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const finalIssueDate = formatFinalDate(issueDate) || defaultIssueDate;
  
  // Pour la date de validité, on s'assure qu'elle est bien après la date d'émission
  let finalValidUntil = formatFinalDate(validUntilDate);
  if (!finalValidUntil) {
    const d = new Date(finalIssueDate);
    d.setDate(d.getDate() + 30);
    finalValidUntil = formatFinalDate(d) || defaultIssueDate;
  }
  
  // Vérifier que la date de validité n'est pas antérieure à la date d'émission
  const finalIssueDateObj = new Date(finalIssueDate);
  const validUntilObj = new Date(finalValidUntil);
  
  if (validUntilObj < finalIssueDateObj) {
    const adjustedDate = new Date(finalIssueDateObj);
    adjustedDate.setDate(adjustedDate.getDate() + 1);
    finalValidUntil = formatFinalDate(adjustedDate) || defaultIssueDate;
  }
  
  return {
    prefix: formData.prefix || "",
    number: formData.number || "",
    // Utiliser les dates formatées avec des valeurs par défaut sécurisées
    issueDate: finalIssueDate,
    validUntil: finalValidUntil,
    status: formData.status || "DRAFT",
    client: cleanClient,
    companyInfo: cleanCompanyInfo,
    items: formData.items?.map((item) => {
      // Convertir vatRate en nombre et s'assurer qu'il est défini
      const itemVatRate = parseFloat(item.vatRate || item.taxRate || 0) || 0;
      
      // Créer l'objet de base de l'article
      const itemData = {
        description: item.description || "",
        quantity: parseFloat(item.quantity) || 0,
        unitPrice: parseFloat(item.unitPrice) || 0,
        vatRate: itemVatRate,
        unit: item.unit || "pièce",
        discount: parseFloat(item.discount) || 0,
        discountType: (item.discountType || "PERCENTAGE").toUpperCase(),
        details: item.details || "",
      };

      // Ajouter vatExemptionText uniquement si vatRate est 0
      if (itemVatRate === 0) {
        itemData.vatExemptionText = item.vatExemptionText || '';
      }

      return itemData;
    }) || [],
    discount: parseFloat(formData.discount) || 0,
    discountType: (formData.discountType || "PERCENTAGE").toUpperCase(),
    headerNotes: formData.headerNotes || "",
    footerNotes: formData.footerNotes || "",
    termsAndConditions: formData.terms || formData.termsAndConditions || "",
    customFields:
      formData.customFields?.map((field) => ({
        key: field.name,
        value: field.value,
      })) || [],
    // Inclure les paramètres d'apparence
    appearance: {
      textColor: formData.appearance?.textColor || "#000000",
      headerTextColor: formData.appearance?.headerTextColor || "#ffffff", 
      headerBgColor: formData.appearance?.headerBgColor || "#1d1d1b",
    },
    // Inclure les paramètres des coordonnées bancaires
    showBankDetails: formData.showBankDetails || false,
  };
}

function parseAddressString(addressString) {
  if (!addressString || typeof addressString !== "string") {
    return null;
  }

  const parts = addressString.split(",").map((part) => part.trim());

  if (parts.length >= 3) {
    return {
      street: parts[0],
      city: parts[1],
      postalCode: "",
      country: parts[2],
    };
  }

  return {
    street: addressString,
    city: "",
    postalCode: "",
    country: "",
  };
}
