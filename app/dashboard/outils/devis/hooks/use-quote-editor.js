"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useCreateQuote,
  useUpdateQuote,
  useQuote,
  useNextQuoteNumber,
} from "@/src/graphql/quoteQueries";
import { useUser } from "@/src/lib/auth/hooks";

const AUTOSAVE_DELAY = 30000; // 30 seconds

export function useQuoteEditor({ mode, quoteId, initialData }) {
  const router = useRouter();
  const autosaveTimeoutRef = useRef(null);
  
  // Auth hook pour récupérer les données utilisateur
  const { session } = useUser();
  
  // GraphQL hooks
  const { quote: existingQuote, loading: loadingQuote } = useQuote(quoteId);
  
  const { data: nextNumberData } = useNextQuoteNumber(
    null, // On passe null comme préfixe pour utiliser la valeur par défaut
    { 
      skip: mode !== "create",
      isDraft: true // Toujours true pour la création car on commence toujours par un brouillon
    }
  );
  
  const { createQuote, loading: creating } = useCreateQuote();
  const { updateQuote, loading: updating } = useUpdateQuote();

  // Form state avec react-hook-form
  const form = useForm({
    defaultValues: getInitialFormData(mode, initialData, session),
    mode: 'onChange'
  });
  
  const { watch, setValue, getValues, formState, reset } = form;
  const { isDirty } = formState;
  
  const [saving, setSaving] = useState(false);
  
  // Watch all form data for auto-save
  const formData = watch();

  // Initialize form data when quote loads
  useEffect(() => {
    console.log('🔄 useEffect - Chargement des données de devis existant');
    console.log('📋 existingQuote:', existingQuote);
    console.log('🎯 mode:', mode);
    
    if (existingQuote && mode !== "create") {
      console.log('✅ Conditions remplies - Transformation et reset du formulaire');
      const quoteData = transformQuoteToFormData(existingQuote);
      console.log('📝 Données avant reset:', quoteData);
      console.log('🔍 CLIENT dans les données:', quoteData.client);
      console.log('🔍 ITEMS dans les données:', quoteData.items);
      console.log('🔍 Nombre d\'articles:', quoteData.items?.length || 0);
      
      reset(quoteData);
      console.log('🎉 Reset du formulaire effectué');
      
      // Vérifier les données après reset
      setTimeout(() => {
        const currentFormData = getValues();
        console.log('🔍 Données après reset:', currentFormData);
        console.log('🔍 CLIENT après reset:', currentFormData.client);
        console.log('🔍 ITEMS après reset:', currentFormData.items);
        console.log('🔍 DATES après reset:');
        console.log('  - issueDate:', currentFormData.issueDate);
        console.log('  - validUntil:', currentFormData.validUntil);
      }, 100);
    } else {
      console.log('❌ Conditions non remplies pour le chargement:', {
        hasExistingQuote: !!existingQuote,
        isNotCreateMode: mode !== "create"
      });
    }
  }, [existingQuote, mode, reset, getValues]);

  // Set next quote number for new quotes
  useEffect(() => {
    if (mode === "create" && nextNumberData?.nextQuoteNumber) {
      setValue('prefix', nextNumberData.nextQuoteNumber.prefix);
      setValue('number', nextNumberData.nextQuoteNumber.number);
    }
  }, [mode, nextNumberData, setValue]);

  // Auto-remplir companyInfo quand la session devient disponible
  useEffect(() => {
    if (mode === "create" && session?.user?.company) {
      const userCompany = session.user.company;
      
      console.log('🔍 DEBUG - Session complète:', session);
      console.log('🔍 DEBUG - User company:', userCompany);
      console.log('🔍 DEBUG - SIRET disponible:', userCompany?.siret);
      
      setValue('companyInfo.name', userCompany.name || '');
      setValue('companyInfo.email', userCompany.email || '');
      setValue('companyInfo.phone', userCompany.phone || '');
      setValue('companyInfo.website', userCompany.website || '');
      setValue('companyInfo.siret', userCompany.siret || '');
      setValue('companyInfo.vatNumber', userCompany.vatNumber || '');
      
      // Gérer l'adresse de l'entreprise
      if (userCompany.address) {
        if (typeof userCompany.address === 'string') {
          setValue('companyInfo.address', userCompany.address);
        } else {
          const addressString = `${userCompany.address.street || ''}, ${userCompany.address.city || ''}, ${userCompany.address.country || ''}`.replace(/^,\s*|,\s*$/g, '');
          setValue('companyInfo.address', addressString);
        }
      }
      
      // Gérer les coordonnées bancaires
      if (userCompany.bankDetails) {
        setValue('userBankDetails', userCompany.bankDetails);
        console.log('🏦 Coordonnées bancaires utilisateur définies:', userCompany.bankDetails);
      }
    }
  }, [mode, session, setValue]);

  // Validation functions
  const validateStep1 = useCallback(() => {
    const data = getValues();
    
    // Vérifier le client
    if (!data.client?.id) {
      console.log('❌ Validation Step 1 échouée: Aucun client sélectionné');
      return false;
    }
    
    // Vérifier les informations de l'entreprise
    if (!data.companyInfo?.name) {
      console.log('❌ Validation Step 1 échouée: Nom de l\'entreprise manquant');
      return false;
    }
    
    // Vérifier la date d'émission
    if (!data.issueDate) {
      console.log('❌ Validation Step 1 échouée: Date d\'émission manquante');
      return false;
    }
    
    console.log('✅ Validation Step 1 réussie');
    return true;
  }, [getValues]);

  const validateStep2 = useCallback(() => {
    const data = getValues();
    
    // Vérifier qu'il y a au moins un article
    if (!data.items || data.items.length === 0) {
      console.log('❌ Validation Step 2 échouée: Aucun article');
      return false;
    }
    
    // Vérifier que tous les articles ont une description, quantité et prix
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      if (!item.description || !item.quantity || !item.unitPrice) {
        console.log(`❌ Validation Step 2 échouée: Article ${i + 1} incomplet`);
        return false;
      }
    }
    
    console.log('✅ Validation Step 2 réussie');
    return true;
  }, [getValues]);

  // Save function (for drafts and updates)
  const handleSave = useCallback(async (isAutoSave = false) => {
    try {
      setSaving(true);
      const currentFormData = getValues();
      
      if (!isAutoSave) {
        console.log('💾 Sauvegarde manuelle déclenchée');
      }
      
      const input = transformFormDataToInput(currentFormData, existingQuote?.status);
      input.status = "DRAFT";
      
      let result;
      if (mode === "create" || !quoteId) {
        console.log('📝 Création d\'un nouveau devis (brouillon)');
        result = await createQuote({ variables: { input } });
        
        if (result.data?.createQuote?.id) {
          const newQuoteId = result.data.createQuote.id;
          console.log('✅ Devis créé avec succès, ID:', newQuoteId);
          
          if (!isAutoSave) {
            toast.success("Brouillon sauvegardé");
            router.push(`/dashboard/outils/devis/${newQuoteId}/editer`);
          }
        }
      } else {
        console.log('📝 Mise à jour du devis existant');
        result = await updateQuote({ 
          variables: { 
            id: quoteId, 
            input 
          } 
        });
        
        if (!isAutoSave) {
          toast.success("Brouillon sauvegardé");
        }
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      if (!isAutoSave) {
        toast.error("Erreur lors de la sauvegarde");
      }
    } finally {
      setSaving(false);
    }
  }, [mode, quoteId, existingQuote, getValues, createQuote, updateQuote, router]);

  // Auto-save functionality
  const scheduleAutoSave = useCallback(() => {
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }
    
    autosaveTimeoutRef.current = setTimeout(() => {
      if (isDirty && formData.status === "DRAFT") {
        console.log('💾 Auto-sauvegarde déclenchée');
        handleSave(true);
      }
    }, AUTOSAVE_DELAY);
  }, [isDirty, formData.status, handleSave]);

  // Schedule auto-save when form data changes
  useEffect(() => {
    if (mode !== "create" && isDirty) {
      scheduleAutoSave();
    }
    
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [formData, isDirty, mode, scheduleAutoSave]);

  // Submit function (for final quote creation)
  const handleSubmit = useCallback(async () => {
    try {
      setSaving(true);
      const currentFormData = getValues();
      
      console.log('🚀 Soumission finale du devis');
      
      // Validation finale
      if (!validateStep1() || !validateStep2()) {
        toast.error("Veuillez corriger les erreurs avant de créer le devis");
        return;
      }
      
      const input = transformFormDataToInput(currentFormData, existingQuote?.status);
      input.status = "PENDING";
      
      let result;
      if (mode === "create" || !quoteId) {
        console.log('📝 Création d\'un nouveau devis (final)');
        result = await createQuote({ variables: { input } });
        
        if (result.data?.createQuote?.id) {
          const newQuoteId = result.data.createQuote.id;
          console.log('✅ Devis créé avec succès, ID:', newQuoteId);
          toast.success("Devis créé avec succès");
          router.push(`/dashboard/outils/devis/${newQuoteId}`);
        }
      } else {
        console.log('📝 Finalisation du devis existant');
        result = await updateQuote({ 
          variables: { 
            id: quoteId, 
            input 
          } 
        });
        
        toast.success("Devis finalisé avec succès");
        router.push(`/dashboard/outils/devis/${quoteId}`);
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la soumission:', error);
      toast.error("Erreur lors de la création du devis");
    } finally {
      setSaving(false);
    }
  }, [mode, quoteId, existingQuote, getValues, validateStep1, validateStep2, createQuote, updateQuote, router]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, []);

  // Helper function to set form data programmatically
  const setFormData = useCallback((newData) => {
    Object.keys(newData).forEach(key => {
      setValue(key, newData[key], { shouldDirty: true });
    });
  }, [setValue]);

  return {
    // Form methods
    form,
    formData,
    
    // Loading states
    loading: loadingQuote || creating || updating || saving,
    saving,
    
    // Validation
    validateStep1,
    validateStep2,
    
    // Actions
    onSave: handleSave,
    onSubmit: handleSubmit,
    setFormData,
    
    // Data
    existingQuote,
    canEdit: !loadingQuote && (mode === "create" || existingQuote?.status === "DRAFT"),
  };
}

// Helper functions
function getInitialFormData(mode, initialData, session) {
  const today = new Date().toISOString().split('T')[0];
  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 jours par défaut
  
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
      bankDetails: null
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
      bankName: ""
    },
    userBankDetails: null,
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
      address: typeof userCompany.address === 'string' 
        ? userCompany.address 
        : userCompany.address 
          ? `${userCompany.address.street || ''}, ${userCompany.address.city || ''}, ${userCompany.address.country || ''}`.replace(/^,\s*|,\s*$/g, '')
          : "",
      bankDetails: userCompany.bankDetails || null
    };
    
    if (userCompany.bankDetails) {
      baseData.userBankDetails = userCompany.bankDetails;
    }
  }

  return { ...baseData, ...initialData };
}

function transformQuoteToFormData(quote) {
  const transformDate = (dateValue, fieldName) => {
    if (!dateValue) {
      console.log(`⚠️ ${fieldName} est null/undefined`);
      return "";
    }
    
    try {
      let dateObj;
      if (typeof dateValue === 'string') {
        if (dateValue.includes('T')) {
          dateObj = new Date(dateValue);
        } else {
          const [year, month, day] = dateValue.split('-');
          dateObj = new Date(year, month - 1, day);
        }
      } else if (dateValue instanceof Date) {
        dateObj = dateValue;
      } else {
        console.log(`⚠️ Format de date non reconnu pour ${fieldName}:`, dateValue);
        return "";
      }
      
      if (isNaN(dateObj.getTime())) {
        console.log(`⚠️ Date invalide pour ${fieldName}:`, dateValue);
        return "";
      }
      
      const result = dateObj.toISOString().split('T')[0];
      console.log(`✅ ${fieldName} transformé: ${dateValue} -> ${result}`);
      return result;
    } catch (error) {
      console.error(`❌ Erreur lors de la transformation de ${fieldName}:`, error);
      return "";
    }
  };

  return {
    prefix: quote.prefix || "",
    number: quote.number || "",
    reference: quote.reference || "",
    issueDate: transformDate(quote.issueDate, 'issueDate'),
    validUntil: transformDate(quote.validUntil, 'validUntil'),
    status: quote.status || "DRAFT",
    
    client: quote.client ? {
      id: quote.client.id,
      type: quote.client.type,
      email: quote.client.email,
      phone: quote.client.phone,
      address: quote.client.address,
      ...(quote.client.type === 'COMPANY' ? {
        companyName: quote.client.companyName,
        siret: quote.client.siret,
        vatNumber: quote.client.vatNumber,
        contactFirstName: quote.client.contactFirstName,
        contactLastName: quote.client.contactLastName,
      } : {
        firstName: quote.client.firstName,
        lastName: quote.client.lastName,
      })
    } : null,
    
    companyInfo: {
      name: quote.companyInfo?.name || "",
      email: quote.companyInfo?.email || "",
      phone: quote.companyInfo?.phone || "",
      website: quote.companyInfo?.website || "",
      siret: quote.companyInfo?.siret || "",
      vatNumber: quote.companyInfo?.vatNumber || "",
      address: quote.companyInfo?.address ? 
        (typeof quote.companyInfo.address === 'string' 
          ? quote.companyInfo.address 
          : `${quote.companyInfo.address.street || ''}, ${quote.companyInfo.address.city || ''}, ${quote.companyInfo.address.country || ''}`.replace(/^,\s*|,\s*$/g, ''))
        : "",
      bankDetails: quote.companyInfo?.bankDetails || null
    },
    
    items: quote.items?.map(item => ({
      description: item.description || "",
      details: item.details || "",
      quantity: item.quantity || 0,
      unit: item.unit || "pièce",
      unitPrice: item.unitPrice || 0,
      vatRate: item.vatRate || 0,
      discount: item.discount || 0,
      discountType: item.discountType || "PERCENTAGE",
      vatExemptionText: item.vatExemptionText || ""
    })) || [],
    
    discount: quote.discount || 0,
    discountType: quote.discountType || "PERCENTAGE",
    
    headerNotes: quote.headerNotes || "",
    footerNotes: quote.footerNotes || "",
    terms: quote.terms || "",
    
    customFields: quote.customFields?.map(field => ({
      name: field.key,
      value: field.value
    })) || [],
    
    showBankDetails: !!(quote.companyInfo?.bankDetails && 
      (quote.companyInfo.bankDetails.iban || quote.companyInfo.bankDetails.bic || quote.companyInfo.bankDetails.bankName)),
    
    bankDetails: quote.companyInfo?.bankDetails || {
      iban: "",
      bic: "",
      bankName: ""
    },
    
    userBankDetails: quote.companyInfo?.bankDetails || null,
  };
}

function transformFormDataToInput(formData, previousStatus = null) {
  const cleanClient = formData.client ? {
    id: formData.client.id,
    type: formData.client.type?.toUpperCase() || "INDIVIDUAL",
    email: formData.client.email || "",
    phone: formData.client.phone || "",
    address: typeof formData.client.address === 'string' 
      ? parseAddressString(formData.client.address)
      : formData.client.address,
    ...(formData.client.type === 'COMPANY' ? {
      companyName: formData.client.companyName || "",
      siret: formData.client.siret || "",
      vatNumber: formData.client.vatNumber || "",
      contactFirstName: formData.client.contactFirstName || "",
      contactLastName: formData.client.contactLastName || "",
    } : {
      firstName: formData.client.firstName || "",
      lastName: formData.client.lastName || "",
    })
  } : null;

  const cleanCompanyInfo = formData.companyInfo ? {
    name: formData.companyInfo.name,
    email: formData.companyInfo.email,
    phone: formData.companyInfo.phone,
    website: formData.companyInfo.website,
    siret: formData.companyInfo.siret,
    vatNumber: formData.companyInfo.vatNumber,
    address: typeof formData.companyInfo.address === 'string' 
      ? parseAddressString(formData.companyInfo.address)
      : formData.companyInfo.address,
    bankDetails: formData.showBankDetails ? (
      (formData.bankDetails && (formData.bankDetails.iban || formData.bankDetails.bic || formData.bankDetails.bankName)) 
        ? formData.bankDetails
        : (formData.companyInfo.bankDetails && (formData.companyInfo.bankDetails.iban || formData.companyInfo.bankDetails.bic || formData.companyInfo.bankDetails.bankName))
          ? formData.companyInfo.bankDetails
          : null
    ) : null
  } : null;

  let issueDate = formData.issueDate;
  if (previousStatus === "DRAFT" && formData.status === "PENDING") {
    issueDate = new Date().toISOString().split('T')[0];
    console.log('📅 Date d\'émission mise à jour automatiquement lors du passage DRAFT -> PENDING:', issueDate);
  }

  const ensureValidDate = (dateValue, fieldName, fallbackDate = null) => {
    if (!dateValue) {
      const fallback = fallbackDate || issueDate;
      console.log(`⚠️ ${fieldName} est null/undefined, utilisation de la date de fallback:`, fallback);
      return fallback;
    }
    return dateValue;
  };

  return {
    prefix: formData.prefix || "",
    number: formData.number || "",
    reference: formData.reference || "",
    issueDate: issueDate,
    validUntil: ensureValidDate(formData.validUntil, 'validUntil'),
    status: formData.status || "DRAFT",
    client: cleanClient,
    companyInfo: cleanCompanyInfo,
    items: formData.items?.map(item => ({
      description: item.description || "",
      quantity: parseFloat(item.quantity) || 0,
      unitPrice: parseFloat(item.unitPrice) || 0,
      vatRate: parseFloat(item.vatRate || item.taxRate) || 0,
      unit: item.unit || "pièce",
      discount: parseFloat(item.discount) || 0,
      discountType: (item.discountType || "PERCENTAGE").toUpperCase(),
      details: item.details || "",
      vatExemptionText: item.vatExemptionText || ""
    })) || [],
    discount: parseFloat(formData.discount) || 0,
    discountType: (formData.discountType || "PERCENTAGE").toUpperCase(),
    headerNotes: formData.headerNotes || "",
    footerNotes: formData.footerNotes || "",
    terms: formData.terms || "",
    customFields: formData.customFields?.map(field => ({
      key: field.name,
      value: field.value
    })) || [],
  };
}

function parseAddressString(addressString) {
  if (!addressString || typeof addressString !== 'string') {
    return null;
  }
  
  const parts = addressString.split(',').map(part => part.trim());
  
  if (parts.length >= 3) {
    return {
      street: parts[0],
      city: parts[1],
      postalCode: "",
      country: parts[2]
    };
  }
  
  return {
    street: addressString,
    city: "",
    postalCode: "",
    country: ""
  };
}
