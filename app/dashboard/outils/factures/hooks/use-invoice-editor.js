"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useCreateInvoice,
  useUpdateInvoice,
  useInvoice,
  useNextInvoiceNumber,
} from "@/src/graphql/invoiceQueries";

const AUTOSAVE_DELAY = 30000; // 30 seconds

export function useInvoiceEditor({ mode, invoiceId, initialData }) {
  const router = useRouter();
  const autosaveTimeoutRef = useRef(null);
  
  // GraphQL hooks
  const { data: existingInvoice, loading: loadingInvoice } = useInvoice(invoiceId, {
    skip: !invoiceId || mode === "create",
  });
  
  const { data: nextNumberData } = useNextInvoiceNumber(
    null, // On passe null comme préfixe pour utiliser la valeur par défaut
    { skip: mode !== "create" }
  );
  
  const { mutate: createInvoice, loading: creating } = useCreateInvoice();
  const { mutate: updateInvoice, loading: updating } = useUpdateInvoice();

  // Form state
  const [formData, setFormData] = useState(() => getInitialFormData(mode, initialData));
  const [originalData, setOriginalData] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize form data when invoice loads
  useEffect(() => {
    if (existingInvoice && mode !== "create") {
      const invoiceData = transformInvoiceToFormData(existingInvoice);
      setFormData(invoiceData);
      setOriginalData(invoiceData);
      setIsDirty(false);
    }
  }, [existingInvoice, mode]);

  // Set next invoice number for new invoices
  useEffect(() => {
    if (mode === "create" && nextNumberData?.nextInvoiceNumber) {
      setFormData(prev => ({
        ...prev,
        prefix: nextNumberData.nextInvoiceNumber.prefix,
        number: nextNumberData.nextInvoiceNumber.number,
      }));
    }
  }, [mode, nextNumberData]);

  // Track changes
  useEffect(() => {
    if (originalData) {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);
      setIsDirty(hasChanges);
    }
  }, [formData, originalData]);

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
  }, [isDirty, mode, formData.status]);

  // Form data updater
  const updateFormData = useCallback((updates) => {
    setFormData(prev => {
      if (typeof updates === "function") {
        return updates(prev);
      }
      return { ...prev, ...updates };
    });
  }, []);

  // Validation
  const validateForm = useCallback(() => {
    const newErrors = {};

    // Required fields
    if (!formData.client?.name) {
      newErrors.client = "Le client est requis";
    }

    if (!formData.items?.length) {
      newErrors.items = "Au moins un article est requis";
    }

    // Validate items
    formData.items?.forEach((item, index) => {
      if (!item.description) {
        newErrors[`item_${index}_description`] = "Description requise";
      }
      if (!item.quantity || item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = "Quantité invalide";
      }
      if (!item.unitPrice || item.unitPrice < 0) {
        newErrors[`item_${index}_unitPrice`] = "Prix unitaire invalide";
      }
    });

    // Date validation
    if (formData.dueDate && formData.issueDate) {
      const issueDate = new Date(formData.issueDate);
      const dueDate = new Date(formData.dueDate);
      if (dueDate < issueDate) {
        newErrors.dueDate = "La date d'échéance ne peut pas être antérieure à la date d'émission";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Auto-save handler
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
    } finally {
      setSaving(false);
    }
  }, [mode, invoiceId, formData, updateInvoice]);

  // Manual save handler
  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs avant de sauvegarder");
      return false;
    }

    try {
      setSaving(true);
      const input = transformFormDataToInput(formData);

      if (mode === "create") {
        const result = await createInvoice({
          variables: { input },
        });
        
        toast.success("Facture créée avec succès");
        router.push(`/dashboard/outils/factures/${result.data.createInvoice.id}`);
        return true;
      } else {
        await updateInvoice({
          variables: {
            id: invoiceId,
            input,
          },
        });
        
        setOriginalData({ ...formData });
        setIsDirty(false);
        toast.success("Facture sauvegardée");
        return true;
      }
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
      return false;
    } finally {
      setSaving(false);
    }
  }, [mode, formData, validateForm, createInvoice, updateInvoice, invoiceId, router]);

  // Submit handler (validate and send)
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs avant de valider");
      return false;
    }

    try {
      setSaving(true);
      const input = transformFormDataToInput({
        ...formData,
        status: "PENDING", // Change status to pending when submitting
      });

      if (mode === "create") {
        const result = await createInvoice({
          variables: { input },
        });
        
        toast.success("Facture créée et validée");
        router.push(`/dashboard/outils/factures/${result.data.createInvoice.id}`);
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
      toast.error("Erreur lors de la validation");
      return false;
    } finally {
      setSaving(false);
    }
  }, [mode, formData, validateForm, createInvoice, updateInvoice, invoiceId, router]);

  return {
    formData,
    setFormData: updateFormData,
    loading: loadingInvoice,
    saving: saving || creating || updating,
    handleSave,
    handleSubmit,
    handleAutoSave,
    isDirty,
    errors,
    validateForm,
  };
}

// Helper functions
function getInitialFormData(mode, initialData) {
  const defaultData = {
    prefix: "",
    number: "",
    issueDate: new Date().toISOString().split('T')[0],
    executionDate: null,
    dueDate: null,
    status: "DRAFT",
    client: null,
    companyInfo: null,
    items: [],
    discount: 0,
    discountType: "FIXED",
    headerNotes: "",
    footerNotes: "",
    termsAndConditions: "",
    customFields: [],
    paymentMethod: null,
    isDownPayment: false,
    purchaseOrderNumber: "",
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
    issueDate: invoice.issueDate ? invoice.issueDate.split('T')[0] : new Date().toISOString().split('T')[0],
    executionDate: invoice.executionDate ? invoice.executionDate.split('T')[0] : null,
    dueDate: invoice.dueDate ? invoice.dueDate.split('T')[0] : null,
    status: invoice.status || "DRAFT",
    client: invoice.client || null,
    companyInfo: invoice.companyInfo || null,
    items: invoice.items || [],
    discount: invoice.discount || 0,
    discountType: invoice.discountType || "FIXED",
    headerNotes: invoice.headerNotes || "",
    footerNotes: invoice.footerNotes || "",
    termsAndConditions: invoice.termsAndConditions || "",
    customFields: invoice.customFields || [],
    paymentMethod: invoice.paymentMethod || null,
    isDownPayment: invoice.isDownPayment || false,
    purchaseOrderNumber: invoice.purchaseOrderNumber || "",
  };
}

function transformFormDataToInput(formData) {
  return {
    prefix: formData.prefix,
    number: formData.number,
    issueDate: formData.issueDate,
    executionDate: formData.executionDate,
    dueDate: formData.dueDate,
    status: formData.status,
    client: formData.client,
    companyInfo: formData.companyInfo,
    items: formData.items,
    discount: parseFloat(formData.discount) || 0,
    discountType: formData.discountType,
    headerNotes: formData.headerNotes,
    footerNotes: formData.footerNotes,
    termsAndConditions: formData.termsAndConditions,
    customFields: formData.customFields,
    paymentMethod: formData.paymentMethod,
    isDownPayment: formData.isDownPayment,
    purchaseOrderNumber: formData.purchaseOrderNumber,
  };
}
