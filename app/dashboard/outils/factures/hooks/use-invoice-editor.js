"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useCreateInvoice,
  useUpdateInvoice,
  useInvoice,
  useNextInvoiceNumber,
} from "@/src/graphql/invoiceQueries";
import { useUser } from "@/src/lib/auth/hooks";

const AUTOSAVE_DELAY = 30000; // 30 seconds

export function useInvoiceEditor({ mode, invoiceId, initialData }) {
  const router = useRouter();
  const autosaveTimeoutRef = useRef(null);
  
  // Auth hook pour récupérer les données utilisateur
  const { session } = useUser();
  
  // GraphQL hooks
  const { data: existingInvoice, loading: loadingInvoice } = useInvoice(invoiceId, {
    skip: !invoiceId || mode === "create",
  });
  
  const { data: nextNumberData } = useNextInvoiceNumber(
    null, // On passe null comme préfixe pour utiliser la valeur par défaut
    { skip: mode !== "create" }
  );
  
  const { createInvoice, loading: creating } = useCreateInvoice();
  const { updateInvoice, loading: updating } = useUpdateInvoice();

  // Form state avec react-hook-form
  const form = useForm({
    defaultValues: getInitialFormData(mode, initialData, session),
    mode: 'onChange'
  });
  
  const { handleSubmit: rhfHandleSubmit, watch, setValue, getValues, formState, reset, trigger } = form;
  const { isDirty, errors } = formState;
  
  const [saving, setSaving] = useState(false);
  
  // Watch all form data for auto-save
  const formData = watch();

  // Initialize form data when invoice loads
  useEffect(() => {
    if (existingInvoice && mode !== "create") {
      const invoiceData = transformInvoiceToFormData(existingInvoice);
      reset(invoiceData);
    }
  }, [existingInvoice, mode, reset]);

  // Set next invoice number for new invoices
  useEffect(() => {
    if (mode === "create" && nextNumberData?.nextInvoiceNumber) {
      setValue('prefix', nextNumberData.nextInvoiceNumber.prefix);
      setValue('number', nextNumberData.nextInvoiceNumber.number);
    }
  }, [mode, nextNumberData, setValue]);

  // Auto-remplir companyInfo quand la session devient disponible
  useEffect(() => {
    if (mode === "create" && session?.user?.company) {
      const userCompany = session.user.company;
      
      // 🔍 Debug: Afficher la structure complète des données utilisateur
      console.log('🔍 DEBUG - Session complète:', session);
      console.log('🔍 DEBUG - User company:', userCompany);
      console.log('🔍 DEBUG - SIRET disponible:', userCompany?.siret);
      console.log('🔍 DEBUG - VAT Number disponible:', userCompany?.vatNumber);
      
      const autoFilledCompanyInfo = {
        name: userCompany?.name || "",
        address: userCompany?.address ? 
          `${userCompany.address.street || ""}, ${userCompany.address.city || ""}, ${userCompany.address.zipCode || ""}, ${userCompany.address.country || ""}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',').trim() : "",
        email: userCompany?.email || "",
        phone: userCompany?.phone || "",
        siret: userCompany?.legal?.siret || userCompany?.siret || "",
        vatNumber: userCompany?.legal?.vatNumber || userCompany?.vatNumber || "",
        website: userCompany?.website || "",
        bankDetails: {
          iban: userCompany?.bankDetails?.iban || "",
          bic: userCompany?.bankDetails?.bic || "",
          bankName: userCompany?.bankDetails?.bankName || ""
        }
      };

      setValue('companyInfo', autoFilledCompanyInfo);
      
      console.log('✅ CompanyInfo auto-rempli avec les données utilisateur:', autoFilledCompanyInfo);
    }
  }, [mode, session, setValue]);

  // Auto-save handler (défini avant son utilisation)
  const handleAutoSave = useCallback(async () => {
    if (mode !== "edit" || !invoiceId || formData.status !== "DRAFT") {
      return;
    }

    try {
      setSaving(true);
      const input = transformFormDataToInput(formData);
      
      await updateInvoice({
        variables: {
          id: invoiceId,
          input,
        },
      });

      setOriginalData({ ...formData });
      setIsDirty(false);
    } catch (error) {
      console.error("Auto-save failed:", error);
      toast.error("Erreur lors de la sauvegarde automatique");
    } finally {
      setSaving(false);
    }
  }, [mode, invoiceId, formData, updateInvoice]);

  // Track changes is now handled by react-hook-form's isDirty

  // Auto-save for drafts
  useEffect(() => {
    if (isDirty && mode === "edit" && formData.status === "DRAFT") {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
      
      autosaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave();
      }, AUTOSAVE_DELAY);
    }

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [isDirty, mode, formData.status, handleAutoSave]);

  // Form data updater using react-hook-form

  // Manual save handler
  const handleSave = useCallback(async () => {
    const currentFormData = getValues();
    console.log('💾 DÉBUT handleSave - Données du formulaire:', currentFormData);
    
    const isValid = await trigger();
    if (!isValid) {
      console.error('❌ Validation échouée dans handleSave - Erreurs:', formState.errors);
      toast.error("Veuillez corriger les erreurs avant de sauvegarder");
      return false;
    }

    try {
      setSaving(true);
      console.log('📝 Données avant transformation (handleSave):', currentFormData);
      // Pas de changement de statut dans handleSave, donc pas besoin du statut précédent
      const input = transformFormDataToInput(currentFormData);
      console.log('🔄 Input transformé pour GraphQL (handleSave):', input);

      if (mode === "create") {
        console.log('📤 Envoi de la mutation CREATE_INVOICE (handleSave)...');
        const result = await createInvoice(input);
        
        console.log('✅ Facture créée avec succès (handleSave):', result);
        toast.success("Facture créée avec succès");
        router.push('/dashboard/outils/factures');
        return true;
      } else {
        await updateInvoice({
          variables: {
            id: invoiceId,
            input,
          },
        });
        
        // Reset form with current data to mark as clean
        reset(currentFormData);
        toast.success("Facture sauvegardée");
        return true;
      }
    } catch (error) {
      console.error("Save failed:", error);
      toast.error(`Erreur lors de la sauvegarde: ${error.message || 'Erreur inconnue'}`);
      return false;
    } finally {
      setSaving(false);
    }
  }, [mode, invoiceId, createInvoice, updateInvoice, getValues, trigger, router, setSaving, formState.errors, reset]);

  // Submit handler (validate and send)
  const handleSubmit = useCallback(async () => {
    const currentFormData = getValues();
    console.log('🚀 DÉBUT handleSubmit - Données du formulaire:', currentFormData);
    
    const isValid = await trigger();
    if (!isValid) {
      console.error('❌ Validation échouée - Erreurs:', formState.errors);
      toast.error("Veuillez corriger les erreurs avant de valider");
      return false;
    }

    try {
      setSaving(true);
      const dataToTransform = {
        ...currentFormData,
        status: "PENDING", // Change status to pending when submitting
        isDownPayment: currentFormData.isDownPayment || currentFormData.isDepositInvoice || false, // Correction du mapping
      };
      
      console.log('📝 Données avant transformation:', dataToTransform);
      // Passer le statut précédent pour gérer automatiquement la date d'émission
      const previousStatus = mode === "edit" ? existingInvoice?.status : "DRAFT";
      const input = transformFormDataToInput(dataToTransform, previousStatus);
      console.log('🔄 Input transformé pour GraphQL:', input);

      if (mode === "create") {
        console.log('📤 Envoi de la mutation CREATE_INVOICE...');
        const result = await createInvoice(input);
        
        console.log('✅ Facture créée avec succès:', result);
        toast.success("Facture créée et validée");
        router.push('/dashboard/outils/factures');
        return true;
      } else {
        await updateInvoice({
          variables: {
            id: invoiceId,
            input,
          },
        });
        
        toast.success("Facture validée");
        router.push(`/dashboard/outils/factures/${invoiceId}`);
        return true;
      }
    } catch (error) {
      console.error("Submit failed:", error);
      toast.error(`Erreur lors de la validation: ${error.message || 'Erreur inconnue'}`);
      return false;
    } finally {
      setSaving(false);
    }
  }, [mode, getValues, trigger, createInvoice, updateInvoice, invoiceId, router, existingInvoice?.status, formState.errors]);

  return {
    form,
    formData,
    setFormData: (newData) => {
      if (typeof newData === 'function') {
        const currentData = getValues();
        const updatedData = newData(currentData);
        Object.keys(updatedData).forEach(key => {
          setValue(key, updatedData[key], { shouldDirty: true });
        });
      } else {
        Object.keys(newData).forEach(key => {
          setValue(key, newData[key], { shouldDirty: true });
        });
      }
    },
    loading: loadingInvoice,
    saving: saving || creating || updating,
    handleSave,
    handleSubmit,
    handleAutoSave,
    isDirty,
    errors,
  };
}

// Helper functions
function getInitialFormData(mode, initialData, session) {
  // Auto-remplissage du companyInfo avec les données utilisateur
  const userCompany = session?.user?.company;
  const autoFilledCompanyInfo = {
    name: userCompany?.name || "",
    address: userCompany?.address ? 
      `${userCompany.address.street || ""}, ${userCompany.address.city || ""}, ${userCompany.address.zipCode || ""}, ${userCompany.address.country || ""}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',').trim() : "",
    email: userCompany?.email || "",
    phone: userCompany?.phone || "",
    siret: userCompany?.legal?.siret || userCompany?.siret || "",
    vatNumber: userCompany?.legal?.vatNumber || userCompany?.vatNumber || "",
    website: userCompany?.website || "",
    bankDetails: {
      iban: userCompany?.bankDetails?.iban || "",
      bic: userCompany?.bankDetails?.bic || "",
      bankName: userCompany?.bankDetails?.bankName || ""
    }
  };

  // Créer une date pour demain
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowFormatted = tomorrow.toISOString().split('T')[0];

  const defaultData = {
    prefix: "",
    number: "",
    issueDate: new Date().toISOString().split('T')[0],
    executionDate: tomorrowFormatted,
    dueDate: null,
    status: "DRAFT",
    client: null,
    companyInfo: autoFilledCompanyInfo,
    items: [],
    discount: 0,
    discountType: "PERCENTAGE",
    headerNotes: "",
    footerNotes: "",
    termsAndConditions: "",
    customFields: [],
    paymentMethod: null,
    isDownPayment: false,
    purchaseOrderNumber: "",
    showBankDetails: false,
    bankDetails: {
      iban: "",
      bic: "",
      bankName: ""
    }
  };

  if (initialData) {
    return transformInvoiceToFormData(initialData);
  }

  return defaultData;
}

function transformInvoiceToFormData(invoice) {
  return {
    prefix: invoice.prefix || "",
    number: invoice.number || "",
    issueDate: invoice.issueDate || new Date().toISOString().split('T')[0],
    executionDate: invoice.executionDate || null,
    dueDate: invoice.dueDate || null,
    status: invoice.status || "DRAFT",
    client: invoice.client || null, // ✅ AJOUT DU CLIENT
    companyInfo: invoice.companyInfo || {
      name: "",
      address: "",
      email: "",
      phone: "",
      siret: "",
      vatNumber: "",
      website: "",
      bankDetails: {
        iban: "",
        bic: "",
        bankName: ""
      }
    },
    items: invoice.items || [], // ✅ AJOUT DES ARTICLES
    discount: invoice.discount || 0,
    discountType: invoice.discountType || "PERCENTAGE",
    headerNotes: invoice.headerNotes || "",
    footerNotes: invoice.footerNotes || "",
    termsAndConditions: invoice.termsAndConditions || "",
    customFields: invoice.customFields || [],
    paymentMethod: invoice.paymentMethod || null,
    isDownPayment: invoice.isDownPayment || false,
    purchaseOrderNumber: invoice.purchaseOrderNumber || "",
    showBankDetails: invoice.showBankDetails || false,
    bankDetails: invoice.bankDetails || {
      iban: "",
      bic: "",
      bankName: ""
    }
  };
}

function transformFormDataToInput(formData, previousStatus = null) {
  // Nettoyer le client en supprimant les métadonnées GraphQL
  const cleanClient = formData.client ? {
    id: formData.client.id,
    name: formData.client.name,
    email: formData.client.email,
    type: formData.client.type,
    firstName: formData.client.firstName,
    lastName: formData.client.lastName,
    siret: formData.client.siret,
    vatNumber: formData.client.vatNumber,
    hasDifferentShippingAddress: formData.client.hasDifferentShippingAddress,
    address: formData.client.address ? {
      street: formData.client.address.street,
      city: formData.client.address.city,
      postalCode: formData.client.address.postalCode,
      country: formData.client.address.country
    } : null,
    shippingAddress: formData.client.shippingAddress ? {
      street: formData.client.shippingAddress.street,
      city: formData.client.shippingAddress.city,
      postalCode: formData.client.shippingAddress.postalCode,
      country: formData.client.shippingAddress.country
    } : null
  } : null;

  // Nettoyer companyInfo et gérer l'adresse
  const cleanCompanyInfo = formData.companyInfo ? {
    name: formData.companyInfo.name,
    email: formData.companyInfo.email,
    phone: formData.companyInfo.phone,
    website: formData.companyInfo.website,
    siret: formData.companyInfo.siret,
    vatNumber: formData.companyInfo.vatNumber,
    // Convertir l'adresse string en objet si nécessaire
    address: typeof formData.companyInfo.address === 'string' 
      ? parseAddressString(formData.companyInfo.address)
      : formData.companyInfo.address,
    // Inclure bankDetails seulement si showBankDetails est true et qu'ils sont remplis
    bankDetails: (formData.showBankDetails && formData.companyInfo.bankDetails && 
                 (formData.companyInfo.bankDetails.iban || formData.companyInfo.bankDetails.bic || formData.companyInfo.bankDetails.bankName)) 
      ? formData.companyInfo.bankDetails 
      : null
  } : null;

  // Gérer automatiquement la date d'émission lors du passage DRAFT -> PENDING
  let issueDate = formData.issueDate;
  if (previousStatus === "DRAFT" && formData.status === "PENDING") {
    // Mettre à jour la date d'émission à la date actuelle
    issueDate = new Date().toISOString().split('T')[0];
    console.log('📅 Date d\'émission mise à jour automatiquement lors du passage DRAFT -> PENDING:', issueDate);
  }

  return {
    prefix: formData.prefix || "",
    number: formData.number || "",
    issueDate: issueDate,
    executionDate: formData.executionDate,
    dueDate: formData.dueDate,
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
    termsAndConditions: formData.termsAndConditions || "",
    customFields: formData.customFields || [],
    purchaseOrderNumber: formData.purchaseOrderNumber || ""
  };
}

// Fonction utilitaire pour parser une adresse string en objet
function parseAddressString(addressString) {
  if (!addressString || typeof addressString !== 'string') {
    return null;
  }
  
  // Format attendu: "229 rue Saint-Honoré, Paris, France"
  const parts = addressString.split(',').map(part => part.trim());
  
  if (parts.length >= 3) {
    return {
      street: parts[0],
      city: parts[1],
      postalCode: "", // Pas d'info dans le format actuel
      country: parts[2]
    };
  }
  
  // Fallback: utiliser l'adresse complète comme rue
  return {
    street: addressString,
    city: "",
    postalCode: "",
    country: ""
  };
}
