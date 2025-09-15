"use client";

import { useEffect, useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "@/src/components/ui/sonner";
import {
  useCreateCreditNote,
  useUpdateCreditNote,
  useCreditNote,
  useCreditNotesByInvoice,
  CREDIT_TYPE,
  REFUND_METHOD,
} from "@/src/graphql/creditNoteQueries";
import { useInvoice } from "@/src/graphql/invoiceQueries";
import { useUser } from "@/src/lib/auth/hooks";
import { useCreditNoteNumber } from "./use-credit-note-number";

export function useCreditNoteEditor({
  mode,
  creditNoteId,
  invoiceId,
  initialData,
  organization,
}) {
  const router = useRouter();

  // Auth hook pour récupérer les données utilisateur
  const { session } = useUser();

  // Credit note numbering hook
  const {
    nextCreditNoteNumber,
    getFormattedNextNumber,
    validateCreditNoteNumber,
    isLoading: numberLoading,
  } = useCreditNoteNumber();

  // GraphQL hooks
  const { creditNote: existingCreditNote, loading: loadingCreditNote } =
    useCreditNote(creditNoteId);
  const { invoice: originalInvoice, loading: loadingInvoice } =
    useInvoice(invoiceId);
  const {
    creditNotes: existingCreditNotes,
    loading: loadingExistingCreditNotes,
  } = useCreditNotesByInvoice(invoiceId);

  const {
    createCreditNote,
    loading: creating,
    workspaceId: debugWorkspaceId,
  } = useCreateCreditNote();
  const { updateCreditNote, loading: updating } = useUpdateCreditNote();

  // Form state avec react-hook-form
  const form = useForm({
    defaultValues: getInitialFormData(
      mode,
      initialData,
      originalInvoice,
      session,
      organization,
      getFormattedNextNumber()
    ),
    mode: "onChange",
  });

  const { watch, setValue, getValues, formState, reset } = form;
  const { isDirty, errors } = formState;

  const [saving, setSaving] = useState(false);

  // Watch all form data
  const formData = watch();

  // Initialize form data when credit note loads (edit mode)
  useEffect(() => {
    if (existingCreditNote && mode !== "create") {
      const creditNoteData = transformCreditNoteToFormData(existingCreditNote);
      reset(creditNoteData);
    }
  }, [existingCreditNote, mode, reset]);

  // Initialize form data when original invoice loads (create mode)
  useEffect(() => {
    if (originalInvoice && mode === "create") {
      const nextNumber = nextCreditNoteNumber
        ? String(nextCreditNoteNumber).padStart(6, "0")
        : "";
      const creditNoteData = transformInvoiceToCreditNoteFormData(
        originalInvoice,
        session,
        organization,
        nextNumber
      );
      reset(creditNoteData);
    }
  }, [
    originalInvoice,
    mode,
    reset,
    session,
    organization,
    nextCreditNoteNumber,
  ]);

  // Update credit note number when numbering data becomes available
  useEffect(() => {
    if (mode === "create" && !numberLoading && nextCreditNoteNumber) {
      const formattedNumber = String(nextCreditNoteNumber).padStart(6, "0");
      setValue("number", formattedNumber, { shouldDirty: false });
    }
  }, [mode, numberLoading, nextCreditNoteNumber, setValue]);

  // Calculate totals
  const calculateTotals = useCallback(
    (items = [], discount = 0, discountType = "PERCENTAGE") => {
      const itemTotals = items.reduce(
        (acc, item) => {
          const quantity = parseFloat(item.quantity) || 0;
          const unitPrice = parseFloat(item.unitPrice) || 0;
          const vatRate = parseFloat(item.vatRate) || 0;
          const itemDiscount = parseFloat(item.discount) || 0;

          let itemTotal = quantity * unitPrice;

          // Apply item discount
          if (itemDiscount > 0) {
            if (item.discountType === "PERCENTAGE") {
              itemTotal = itemTotal * (1 - itemDiscount / 100);
            } else {
              itemTotal = itemTotal - itemDiscount; // Permettre les valeurs négatives pour les avoirs
            }
          }

          const vatAmount = itemTotal * (vatRate / 100);

          return {
            totalHT: acc.totalHT + itemTotal,
            totalVAT: acc.totalVAT + vatAmount,
          };
        },
        { totalHT: 0, totalVAT: 0 }
      );

      let finalTotalHT = itemTotals.totalHT;

      // Apply global discount
      if (discount > 0) {
        if (discountType === "PERCENTAGE") {
          finalTotalHT = finalTotalHT * (1 - discount / 100);
        } else {
          finalTotalHT = finalTotalHT - discount; // Permettre les valeurs négatives pour les avoirs
        }
      }

      const discountAmount = itemTotals.totalHT - finalTotalHT;
      const finalTotalTTC = finalTotalHT + itemTotals.totalVAT;

      // Credit notes have negative amounts
      return {
        totalHT: -itemTotals.totalHT,
        totalVAT: -itemTotals.totalVAT,
        finalTotalHT: -finalTotalHT,
        finalTotalTTC: -finalTotalTTC,
        discountAmount: -discountAmount,
      };
    },
    []
  );

  // Save function
  const save = useCallback(
    async (data, options = {}) => {
      const { redirect = true } = options;

      try {
        setSaving(true);

        // Transform data for GraphQL submission
        const submitData = transformFormDataToInput(data, invoiceId);

        let result;
        if (mode === "create") {
          result = await createCreditNote(submitData);
          toast.success("Avoir créé avec succès");
        } else {
          result = await updateCreditNote(creditNoteId, submitData);
          toast.success("Avoir mis à jour avec succès");
        }

        if (redirect && result) {
          router.push(`/dashboard/outils/factures`);
        }

        return result;
      } catch (error) {
        console.error("Erreur lors de la sauvegarde:", error);
        toast.error("Erreur lors de la sauvegarde de l'avoir");
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [
      mode,
      createCreditNote,
      updateCreditNote,
      creditNoteId,
      invoiceId,
      router,
      debugWorkspaceId,
      session?.user,
    ]
  );

  // Create credit note (no draft functionality)
  const createCreditNoteAction = useCallback(
    async (redirect = true) => {
      const data = getValues();

      // Reason is optional - no validation needed

      // Basic validation - check if we have items
      if (!data.items || data.items.length === 0) {
        toast.error("Veuillez ajouter au moins un article à l'avoir");
        return;
      }

      // Check if all items have required fields
      const hasInvalidItems = data.items.some(
        (item) => !item.description || !item.quantity || !item.unitPrice
      );

      if (hasInvalidItems) {
        toast.error(
          "Veuillez remplir tous les champs obligatoires des articles"
        );
        return;
      }

      // Validate that credit note amount doesn't exceed remaining invoice amount
      if (originalInvoice && existingCreditNotes) {
        const totals = calculateTotals(
          data.items,
          data.discount,
          data.discountType
        );
        const creditNoteAmount = Math.abs(totals.finalTotalTTC);
        const invoiceAmount = originalInvoice.finalTotalTTC || 0;

        // Calculate existing credit notes total
        const existingCreditNotesTotal = existingCreditNotes.reduce(
          (sum, creditNote) => {
            return sum + Math.abs(creditNote.finalTotalTTC || 0);
          },
          0
        );

        const remainingAmount = invoiceAmount - existingCreditNotesTotal;

        if (creditNoteAmount > remainingAmount) {
          toast.error(
            `Le montant de cet avoir (${creditNoteAmount.toFixed(2)}€) dépasse le montant restant disponible (${remainingAmount.toFixed(2)}€). La somme des avoirs ne peut pas dépasser le montant de la facture originale (${invoiceAmount.toFixed(2)}€).`
          );
          return;
        }
      }

      return await save(data, { redirect });
    },
    [getValues, save, originalInvoice, calculateTotals, existingCreditNotes]
  );

  // Finalize credit note (same as create since only CREATED status exists)
  const finalize = useCallback(
    async (redirect = true) => {
      return await createCreditNoteAction(redirect);
    },
    [createCreditNoteAction]
  );

  // Update totals when items or discount change
  useEffect(() => {
    const items = formData.items || [];
    const discount = formData.discount || 0;
    const discountType = formData.discountType || "PERCENTAGE";

    const totals = calculateTotals(items, discount, discountType);

    // Update form values without triggering validation
    Object.entries(totals).forEach(([key, value]) => {
      setValue(key, value, { shouldDirty: false, shouldValidate: false });
    });
  }, [
    formData.items,
    formData.discount,
    formData.discountType,
    calculateTotals,
    setValue,
  ]);

  return {
    form,
    formData,
    originalInvoice,
    existingCreditNote,
    loading:
      loadingCreditNote ||
      loadingInvoice ||
      creating ||
      updating ||
      saving ||
      numberLoading ||
      loadingExistingCreditNotes,
    isDirty,
    errors,
    save,
    createCreditNoteAction,
    finalize,
    calculateTotals,
    // Credit note numbering functions
    nextCreditNoteNumber,
    getFormattedNextNumber,
    validateCreditNoteNumber,
  };
}

// Helper functions
function getInitialFormData(
  mode,
  initialData,
  originalInvoice,
  session,
  organization,
  nextNumber = ""
) {
  if (mode === "create" && originalInvoice) {
    return transformInvoiceToCreditNoteFormData(
      originalInvoice,
      session,
      organization,
      nextNumber
    );
  }

  return {
    prefix: "AV-",
    number: nextNumber,
    creditType: CREDIT_TYPE.CORRECTION,
    reason: "",
    status: "CREATED",
    issueDate: new Date().toISOString().split("T")[0],
    executionDate: new Date().toISOString().split("T")[0],
    refundMethod: REFUND_METHOD.NEXT_INVOICE,
    headerNotes: "",
    footerNotes: "",
    termsAndConditions: "",
    termsAndConditionsLinkTitle: "",
    termsAndConditionsLink: "",
    discount: 0,
    discountType: "PERCENTAGE",
    showBankDetails: false,
    client: null,
    companyInfo: organization || {},
    items: [],
    customFields: [],
    bankDetails: {
      iban: "",
      bic: "",
      bankName: "",
    },
    appearance: {
      textColor: "#000000",
      headerTextColor: "#ffffff",
      headerBgColor: "#3b82f6",
    },
    ...initialData,
  };
}

function transformInvoiceToCreditNoteFormData(
  invoice,
  session,
  organization,
  nextNumber = ""
) {
  return {
    prefix: "AV-",
    number: nextNumber,
    creditType: CREDIT_TYPE.CORRECTION,
    reason: "",
    status: "CREATED",
    issueDate: new Date().toISOString().split("T")[0],
    executionDate: new Date().toISOString().split("T")[0],
    refundMethod: REFUND_METHOD.NEXT_INVOICE,
    headerNotes: invoice.headerNotes || "",
    footerNotes: invoice.footerNotes || "",
    termsAndConditions: invoice.termsAndConditions || "",
    termsAndConditionsLinkTitle: invoice.termsAndConditionsLinkTitle || "",
    termsAndConditionsLink: invoice.termsAndConditionsLink || "",
    discount: invoice.discount || 0,
    discountType: invoice.discountType || "PERCENTAGE",
    showBankDetails: invoice.showBankDetails || false,
    client: invoice.client,
    companyInfo: invoice.companyInfo || organization || {},
    items:
      invoice.items?.map((item) => ({
        ...item,
        quantity: -Math.abs(item.quantity), // Convertir en négatif pour l'avoir
        unitPrice: -Math.abs(item.unitPrice), // Convertir en négatif pour l'avoir
        vatRate: item.vatRate,
        discount: item.discount || 0,
        discountType: item.discountType || "PERCENTAGE",
      })) || [],
    customFields: invoice.customFields || [],
    bankDetails: invoice.bankDetails || {
      iban: "",
      bic: "",
      bankName: "",
    },
    appearance: invoice.appearance || {
      textColor: "#000000",
      headerTextColor: "#ffffff",
      headerBgColor: "#3b82f6",
    },
  };
}

function transformCreditNoteToFormData(creditNote) {
  return {
    prefix: creditNote.prefix || "AV-",
    number: creditNote.number || "",
    creditType: creditNote.creditType || CREDIT_TYPE.CORRECTION,
    reason: creditNote.reason || "",
    status: creditNote.status || "CREATED",
    issueDate: (() => {
      if (!creditNote.issueDate) return new Date().toISOString().split("T")[0];
      const date = new Date(creditNote.issueDate);
      return isNaN(date.getTime())
        ? new Date().toISOString().split("T")[0]
        : date.toISOString().split("T")[0];
    })(),
    executionDate: (() => {
      if (!creditNote.executionDate)
        return new Date().toISOString().split("T")[0];
      const date = new Date(creditNote.executionDate);
      return isNaN(date.getTime())
        ? new Date().toISOString().split("T")[0]
        : date.toISOString().split("T")[0];
    })(),
    refundMethod: creditNote.refundMethod || REFUND_METHOD.NEXT_INVOICE,
    headerNotes: creditNote.headerNotes || "",
    footerNotes: creditNote.footerNotes || "",
    termsAndConditions: creditNote.termsAndConditions || "",
    termsAndConditionsLinkTitle: creditNote.termsAndConditionsLinkTitle || "",
    termsAndConditionsLink: creditNote.termsAndConditionsLink || "",
    discount: creditNote.discount || 0,
    discountType: creditNote.discountType || "PERCENTAGE",
    showBankDetails: creditNote.showBankDetails || false,
    client: creditNote.client,
    companyInfo: creditNote.companyInfo || {},
    items: creditNote.items || [],
    customFields: creditNote.customFields || [],
    bankDetails: creditNote.bankDetails || {
      iban: "",
      bic: "",
      bankName: "",
    },
    appearance: creditNote.appearance || {
      textColor: "#000000",
      headerTextColor: "#ffffff",
      headerBgColor: "#3b82f6",
    },
  };
}

// Transform form data to GraphQL input format
function transformFormDataToInput(formData, originalInvoiceId) {
  // Remove __typename fields and calculated values
  const cleanObject = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map(cleanObject);
    }
    if (obj && typeof obj === "object") {
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        if (key !== "__typename") {
          cleaned[key] = cleanObject(value);
        }
      }
      return cleaned;
    }
    return obj;
  };

  const cleanedData = cleanObject(formData);

  // Reason is optional - use provided reason or leave empty
  let reason = cleanedData.reason?.trim() || "";
  // Validate and clean items
  const items = (cleanedData.items || []).map((item) => {
    const cleanedItem = { ...item };

    // Remove calculated fields that are not part of ItemInput schema
    delete cleanedItem.total;

    // For credit notes, quantities can be negative (representing credits)
    // But we still need to ensure it's a valid number
    const quantity = parseFloat(cleanedItem.quantity);
    if (isNaN(quantity)) {
      throw new Error("La quantité doit être un nombre valide");
    }
    cleanedItem.quantity = quantity;

    // For credit notes, unit prices can be negative (representing credits)
    // But we still need to ensure it's a valid number and not zero
    const unitPrice = parseFloat(cleanedItem.unitPrice);
    if (isNaN(unitPrice) || unitPrice === 0) {
      throw new Error(
        "Le prix unitaire doit être un nombre valide différent de zéro"
      );
    }
    cleanedItem.unitPrice = unitPrice;

    // Ensure vatRate is a valid number
    const vatRate = parseFloat(cleanedItem.vatRate);
    if (isNaN(vatRate) || vatRate < 0 || vatRate > 100) {
      throw new Error(
        "Le taux de TVA doit être un pourcentage valide (entre 0 et 100)"
      );
    }
    cleanedItem.vatRate = vatRate;

    return cleanedItem;
  });

  if (items.length === 0) {
    throw new Error("Un avoir doit contenir au moins un article");
  }

  // Clean client data and ensure shippingAddress includes fullName
  const cleanClient = cleanedData.client
    ? {
        ...cleanedData.client,
        shippingAddress: cleanedData.client.shippingAddress
          ? {
              fullName: cleanedData.client.shippingAddress.fullName,
              street: cleanedData.client.shippingAddress.street,
              city: cleanedData.client.shippingAddress.city,
              postalCode: cleanedData.client.shippingAddress.postalCode,
              country: cleanedData.client.shippingAddress.country,
            }
          : null,
      }
    : null;

  return {
    originalInvoiceId,
    creditType: cleanedData.creditType,
    reason: reason,
    client: cleanClient,
    companyInfo: cleanedData.companyInfo,
    items: items,
    status: "CREATED", // Use CREATED status as per CreditNoteStatus enum
    issueDate: cleanedData.issueDate,
    executionDate: cleanedData.executionDate,
    refundMethod: cleanedData.refundMethod,
    headerNotes: cleanedData.headerNotes,
    footerNotes: cleanedData.footerNotes,
    termsAndConditions: cleanedData.termsAndConditions,
    termsAndConditionsLinkTitle: cleanedData.termsAndConditionsLinkTitle,
    termsAndConditionsLink: cleanedData.termsAndConditionsLink,
    discount: cleanedData.discount,
    discountType: cleanedData.discountType,
    customFields: cleanedData.customFields || [],
    number: cleanedData.number,
    prefix: cleanedData.prefix,
    showBankDetails: cleanedData.showBankDetails,
    bankDetails: cleanedData.bankDetails,
    appearance: cleanedData.appearance,
    // Exclude calculated fields - these are computed on the backend
    // totalHT, totalVAT, finalTotalHT, finalTotalTTC, discountAmount
  };
}
