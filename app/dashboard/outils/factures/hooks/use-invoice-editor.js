"use client";

import { useEffect, useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "@/src/components/ui/sonner";
import { useErrorHandler } from "@/src/hooks/useErrorHandler";
import {
  useCreateInvoice,
  useUpdateInvoice,
  useInvoice,
  useNextInvoiceNumber,
} from "@/src/graphql/invoiceQueries";
import { useUser } from "@/src/lib/auth/hooks";
import {
  updateOrganization,
  getActiveOrganization,
} from "@/src/lib/organization-client";

// const AUTOSAVE_DELAY = 30000; // 30 seconds - DISABLED

export function useInvoiceEditor({
  mode,
  invoiceId,
  initialData,
  organization,
}) {
  const router = useRouter();
  // const autosaveTimeoutRef = useRef(null); // DISABLED - Auto-save removed

  // Auth hook pour récupérer les données utilisateur
  const { session } = useUser();
  
  // Error handler
  const { handleError } = useErrorHandler();

  // GraphQL hooks
  const { invoice: existingInvoice, loading: loadingInvoice } =
    useInvoice(invoiceId);

  const { data: nextNumberData } = useNextInvoiceNumber(
    null, // On passe null comme préfixe pour utiliser la valeur par défaut
    {
      skip: mode !== "create",
      isDraft: true, // Toujours true pour la création car on commence toujours par un brouillon
    }
  );

  const { createInvoice, loading: creating } = useCreateInvoice();
  const { updateInvoice, loading: updating } = useUpdateInvoice();

  // Form state avec react-hook-form
  const form = useForm({
    defaultValues: getInitialFormData(mode, initialData, session, organization),
    mode: "onChange",
  });

  const { watch, setValue, getValues, formState, reset, trigger } = form;
  const { isDirty, errors } = formState;

  const [saving, setSaving] = useState(false);

  // Watch all form data for auto-save
  const formData = watch();

  // Initialize form data when invoice loads
  useEffect(() => {
    if (existingInvoice && mode !== "create") {
      const invoiceData = transformInvoiceToFormData(existingInvoice);

      reset(invoiceData);

      // Les données sont maintenant chargées dans le formulaire
    }
  }, [existingInvoice, mode, reset, getValues]);

  // Set next invoice number for new invoices
  useEffect(() => {
    if (mode === "create" && nextNumberData?.nextInvoiceNumber) {
      setValue("prefix", nextNumberData.nextInvoiceNumber.prefix);
      setValue("number", nextNumberData.nextInvoiceNumber.number);
    }
  }, [mode, nextNumberData, setValue]);

  // Auto-remplir companyInfo avec les données de l'organisation
  useEffect(() => {
    if (mode === "create" && organization) {
      const autoFilledCompanyInfo = {
        name: organization?.companyName || "",
        address: {
          street: organization?.addressStreet || "",
          city: organization?.addressCity || "",
          postalCode: organization?.addressZipCode || "",
          country: organization?.addressCountry || "",
        },
        email: organization?.companyEmail || "",
        phone: organization?.companyPhone || "",
        siret: organization?.siret || "",
        vatNumber: organization?.vatNumber || "",
        website: organization?.website || "",
        bankDetails: {
          iban: organization?.bankIban || "",
          bic: organization?.bankBic || "",
          bankName: organization?.bankName || "",
        },
      };

      setValue("companyInfo", autoFilledCompanyInfo);
    }
  }, [mode, organization, setValue]);

  // Charger les données d'organisation pour les nouvelles factures
  useEffect(() => {
    if (mode === "create" && organization) {
      // Utiliser directement les couleurs de l'organisation pour l'apparence par défaut
      setValue(
        "appearance.textColor",
        organization.documentTextColor || "#000000"
      );
      setValue(
        "appearance.headerTextColor",
        organization.documentHeaderTextColor || "#ffffff"
      );
      setValue(
        "appearance.headerBgColor",
        organization.documentHeaderBgColor || "#1d1d1b"
      );

      // Utiliser les notes et conditions spécifiques aux factures
      setValue(
        "headerNotes",
        organization.invoiceHeaderNotes ||
          organization.documentHeaderNotes ||
          ""
      );
      setValue(
        "footerNotes",
        organization.invoiceFooterNotes ||
          organization.documentFooterNotes ||
          ""
      );
      setValue(
        "termsAndConditions",
        organization.invoiceTermsAndConditions ||
          organization.documentTermsAndConditions ||
          ""
      );
      setValue("showBankDetails", organization.showBankDetails || false);

      // Ajouter les coordonnées bancaires dans companyInfo
      setValue("companyInfo.bankName", organization.bankName || "");
      setValue("companyInfo.bankIban", organization.bankIban || "");
      setValue("companyInfo.bankBic", organization.bankBic || "");
    }

    // Stocker les coordonnées bancaires de l'organisation (disponible en création et édition)
    if (organization?.bankIban) {
      const userBankDetails = {
        iban: organization.bankIban || "",
        bic: organization.bankBic || "",
        bankName: organization.bankName || "",
      };
      setValue("userBankDetails", userBankDetails);
    }
  }, [mode, organization, setValue]);

  // Auto-save handler - DISABLED
  // const handleAutoSave = useCallback(async () => {
  //   if (mode !== "edit" || !invoiceId || formData.status !== "DRAFT") {
  //     return;
  //   }

  //   try {
  //     setSaving(true);
  //     const input = transformFormDataToInput(formData);

  //     await updateInvoice(invoiceId, input);

  //     setOriginalData({ ...formData });
  //     setIsDirty(false);
  //   } catch (error) {
  //     console.error("Auto-save failed:", error);
  //     toast.error("Erreur lors de la sauvegarde automatique");
  //   } finally {
  //     setSaving(false);
  //   }
  // }, [mode, invoiceId, formData, updateInvoice]);

  // Track changes is now handled by react-hook-form's isDirty

  // Auto-save for drafts - DISABLED
  // useEffect(() => {
  //   if (isDirty && mode === "edit" && formData.status === "DRAFT") {
  //     if (autosaveTimeoutRef.current) {
  //       clearTimeout(autosaveTimeoutRef.current);
  //     }

  //     autosaveTimeoutRef.current = setTimeout(() => {
  //       handleAutoSave();
  //     }, AUTOSAVE_DELAY);
  //   }

  //   return () => {
  //     if (autosaveTimeoutRef.current) {
  //       clearTimeout(autosaveTimeoutRef.current);
  //     }
  //   };
  // }, [isDirty, mode, formData.status, handleAutoSave]);

  // Form data updater using react-hook-form

  // Manual save handler
  const handleSave = useCallback(async () => {
    const currentFormData = getValues();

    const isValid = await trigger();
    if (!isValid) {
      console.error(
        "❌ Validation échouée dans handleSave - Erreurs:",
        formState.errors
      );
      toast.error("Veuillez corriger les erreurs avant de sauvegarder");
      return false;
    }

    try {
      setSaving(true);

      // Pas de changement de statut dans handleSave, donc pas besoin du statut précédent
      const input = transformFormDataToInput(currentFormData);

      if (mode === "create") {
        await createInvoice(input);

        router.push("/dashboard/outils/factures");
        return true;
      } else {
        await updateInvoice(invoiceId, input);

        // Reset form with current data to mark as clean
        reset(currentFormData);
        toast.success("Facture sauvegardée");

        // Rediriger vers la liste des factures après sauvegarde réussie en mode édition
        router.push("/dashboard/outils/factures");
        return true;
      }
    } catch (error) {
      console.error("Save failed:", error);
      handleError(error, 'invoice');
      return false;
    } finally {
      setSaving(false);
    }
  }, [
    mode,
    invoiceId,
    createInvoice,
    updateInvoice,
    getValues,
    trigger,
    router,
    setSaving,
    formState.errors,
    reset,
    handleError,
  ]);

  // Submit handler (validate and send)
  const handleSubmit = useCallback(async () => {
    const currentFormData = getValues();

    const isValid = await trigger();
    if (!isValid) {
      console.error("❌ Validation échouée - Erreurs:", formState.errors);
      toast.error("Veuillez corriger les erreurs avant de valider");
      return false;
    }

    try {
      setSaving(true);
      const dataToTransform = {
        ...currentFormData,
        status: "PENDING", // Change status to pending when submitting
        isDeposit: currentFormData.isDepositInvoice || false, // Mapping correct vers le champ backend
      };

      // Passer le statut précédent pour gérer automatiquement la date d'émission
      const previousStatus =
        mode === "edit" ? existingInvoice?.status : "DRAFT";
      const input = transformFormDataToInput(dataToTransform, previousStatus);

      if (mode === "create") {
        await createInvoice(input);

        router.push("/dashboard/outils/factures");
        return true;
      } else {
        await updateInvoice(invoiceId, input);

        toast.success("Facture validée");
        router.push(`/dashboard/outils/factures/${invoiceId}`);
        return true;
      }
    } catch (error) {
      console.error("Submit failed:", error);
      handleError(error, 'invoice');
      return false;
    } finally {
      setSaving(false);
    }
  }, [
    mode,
    getValues,
    trigger,
    createInvoice,
    updateInvoice,
    invoiceId,
    router,
    existingInvoice?.status,
    formState.errors,
    handleError,
  ]);

  // Fonction pour sauvegarder les paramètres dans l'organisation
  const saveSettingsToOrganization = useCallback(async () => {
    try {
      const currentFormData = getValues();
      const activeOrganization = await getActiveOrganization();

      const organizationData = {
        documentTextColor: currentFormData.appearance?.textColor || "#000000",
        documentHeaderTextColor:
          currentFormData.appearance?.headerTextColor || "#ffffff",
        documentHeaderBgColor:
          currentFormData.appearance?.headerBgColor || "#1d1d1b",
        invoiceHeaderNotes: currentFormData.headerNotes || "",
        invoiceFooterNotes: currentFormData.footerNotes || "",
        invoiceTermsAndConditions: currentFormData.termsAndConditions || "",
        showBankDetails: currentFormData.showBankDetails || false,
      };

      await updateOrganization(activeOrganization.id, organizationData);
    } catch (error) {
      console.error("❌ Erreur lors de la sauvegarde des paramètres:", error);
      throw error;
    }
  }, [getValues]);

  return {
    form,
    formData,
    setFormData: (newData) => {
      if (typeof newData === "function") {
        const currentData = getValues();
        const updatedData = newData(currentData);
        Object.keys(updatedData).forEach((key) => {
          setValue(key, updatedData[key], { shouldDirty: true });
        });
      } else {
        Object.keys(newData).forEach((key) => {
          setValue(key, newData[key], { shouldDirty: true });
        });
      }
    },
    loading: loadingInvoice,
    saving: saving || creating || updating,
    handleSave,
    handleSubmit,
    // handleAutoSave, // DISABLED
    isDirty,
    errors,
    saveSettingsToOrganization,
    invoice: existingInvoice,
    error: loadingInvoice ? null : (!existingInvoice && mode !== "create"),
  };
}

// Helper functions
function getInitialFormData(mode, initialData, session, organization) {
  // Auto-remplissage du companyInfo avec les données d'organisation
  const autoFilledCompanyInfo = {
    name: organization?.companyName || "",
    address: {
      street: organization?.addressStreet || "",
      city: organization?.addressCity || "",
      postalCode: organization?.addressZipCode || "",
      country: organization?.addressCountry || "",
    },
    email: organization?.companyEmail || "",
    phone: organization?.companyPhone || "",
    siret: organization?.siret || "",
    vatNumber: organization?.vatNumber || "",
    website: organization?.website || "",
    bankDetails: {
      iban: organization?.bankIban || "",
      bic: organization?.bankBic || "",
      bankName: organization?.bankName || "",
    },
  };

  // Créer une date pour demain
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowFormatted = tomorrow.toISOString().split("T")[0];

  const defaultData = {
    prefix: "",
    number: "",
    issueDate: new Date().toISOString().split("T")[0],
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
    isDepositInvoice: false,
    purchaseOrderNumber: "",
    // Récupérer les données bancaires si elles existent dans la facture
    showBankDetails: organization?.showBankDetails || false,
    bankDetails: {
      iban: "",
      bic: "",
      bankName: "",
    },
    userBankDetails: {
      iban: "",
      bic: "",
      bankName: "",
    },
    appearance: {
      textColor: "#000000",
      headerTextColor: "#ffffff",
      headerBgColor: "#1d1d1b",
    },
  };

  // Utiliser les paramètres par défaut de l'organisation si disponibles
  if (mode === "create" && organization) {
    // Paramètres d'apparence par défaut
    if (
      organization.defaultTextColor ||
      organization.defaultHeaderTextColor ||
      organization.defaultHeaderBgColor
    ) {
      defaultData.appearance = {
        textColor: organization.defaultTextColor || "#000000",
        headerTextColor: organization.defaultHeaderTextColor || "#ffffff",
        headerBgColor: organization.defaultHeaderBgColor || "#1d1d1b",
      };
    }

    // Paramètres de contenu par défaut
    if (organization.defaultHeaderNotes) {
      defaultData.headerNotes = organization.defaultHeaderNotes;
    }
    if (organization.defaultFooterNotes) {
      defaultData.footerNotes = organization.defaultFooterNotes;
    }
    if (organization.defaultTermsAndConditions) {
      defaultData.termsAndConditions = organization.defaultTermsAndConditions;
    }
  }

  if (initialData) {
    return transformInvoiceToFormData(initialData);
  }

  return defaultData;
}

function transformInvoiceToFormData(invoice) {
  // Fonction helper pour transformer les dates
  const transformDate = (dateValue, fieldName) => {
    if (!dateValue) return null;

    try {
      // Si c'est déjà une string au format YYYY-MM-DD, on la garde
      if (
        typeof dateValue === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
      ) {
        return dateValue;
      }

      // Si c'est un timestamp en millisecondes (string de chiffres)
      if (typeof dateValue === "string" && /^\d+$/.test(dateValue)) {
        const timestamp = parseInt(dateValue, 10);
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          const formatted = date.toISOString().split("T")[0];

          return formatted;
        }
      }

      // Sinon, on essaie de la convertir normalement
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        console.warn(`  ⚠️ ${fieldName} invalide:`, dateValue);
        return null;
      }

      const formatted = date.toISOString().split("T")[0];
      return formatted;
    } catch (error) {
      console.error(`  ❌ Erreur transformation ${fieldName}:`, error);
      return null;
    }
  };

  const transformedData = {
    prefix: invoice.prefix || "",
    number: invoice.number || "",
    issueDate:
      transformDate(invoice.issueDate, "issueDate") ||
      new Date().toISOString().split("T")[0],
    executionDate: transformDate(invoice.executionDate, "executionDate"),
    dueDate: transformDate(invoice.dueDate, "dueDate"),
    status: invoice.status || "DRAFT",
    client: invoice.client || null,
    companyInfo: invoice.companyInfo
      ? {
          name: invoice.companyInfo.name || "",
          // Formatage cohérent de l'adresse avec les devis
          address: (() => {
            if (!invoice.companyInfo.address) return "";

            if (typeof invoice.companyInfo.address === "string") {
              return invoice.companyInfo.address;
            }

            // Créer un tableau avec les parties de l'adresse et filtrer les vides
            const addressParts = [
              invoice.companyInfo.address.street,
              invoice.companyInfo.address.additional,
              invoice.companyInfo.address.postalCode
                ? `${invoice.companyInfo.address.postalCode} ${invoice.companyInfo.address.city || ""}`.trim()
                : invoice.companyInfo.address.city,
              invoice.companyInfo.address.country,
            ].filter(Boolean); // Enlève les valeurs vides du tableau

            return addressParts.join("\n");
          })(),
          email: invoice.companyInfo.email || "",
          phone: invoice.companyInfo.phone || "",
          siret: invoice.companyInfo.siret || "",
          vatNumber: invoice.companyInfo.vatNumber || "",
          website: invoice.companyInfo.website || "",
          // Nettoyer les métadonnées GraphQL des coordonnées bancaires
          bankDetails: invoice.companyInfo.bankDetails
            ? {
                iban: invoice.companyInfo.bankDetails.iban || "",
                bic: invoice.companyInfo.bankDetails.bic || "",
                bankName: invoice.companyInfo.bankDetails.bankName || "",
                // Suppression explicite de __typename et autres métadonnées GraphQL
              }
            : {
                iban: "",
                bic: "",
                bankName: "",
              },
        }
      : {
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
            bankName: "",
          },
        },
    items: invoice.items || [],
    discount: invoice.discount || 0,
    discountType: invoice.discountType || "PERCENTAGE",
    headerNotes: invoice.headerNotes || "",
    footerNotes: invoice.footerNotes || "",
    termsAndConditions: invoice.termsAndConditions || "",
    customFields:
      invoice.customFields?.map((field) => ({
        name: field.key,
        value: field.value,
      })) || [],
    // Champs qui n'existent pas dans le schéma GraphQL - utiliser des valeurs par défaut
    paymentMethod: null,
    isDepositInvoice: invoice.isDeposit || false, // Mapper isDeposit vers isDepositInvoice pour le formulaire
    purchaseOrderNumber: invoice.purchaseOrderNumber || "",
    // Récupérer les données bancaires si elles existent dans la facture
    showBankDetails: invoice.showBankDetails || false,
    bankDetails: invoice.companyInfo?.bankDetails
      ? {
          iban: invoice.companyInfo.bankDetails.iban || "",
          bic: invoice.companyInfo.bankDetails.bic || "",
          bankName: invoice.companyInfo.bankDetails.bankName || "",
        }
      : {
          iban: "",
          bic: "",
          bankName: "",
        },
    userBankDetails: {
      iban: "",
      bic: "",
      bankName: "",
    },
    appearance: {
      textColor: invoice.appearance?.textColor || "#000000",
      headerTextColor: invoice.appearance?.headerTextColor || "#ffffff",
      headerBgColor: invoice.appearance?.headerBgColor || "#1d1d1b",
    },
  };

  return transformedData;
}

function transformFormDataToInput(formData, previousStatus = null) {
  // Nettoyer le client en supprimant les métadonnées GraphQL
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
        hasDifferentShippingAddress:
          formData.client.hasDifferentShippingAddress,
        address: formData.client.address
          ? {
              street: formData.client.address.street,
              city: formData.client.address.city,
              postalCode: formData.client.address.postalCode,
              country: formData.client.address.country,
            }
          : null,
        shippingAddress: formData.client.shippingAddress
          ? {
              fullName: formData.client.shippingAddress.fullName,
              street: formData.client.shippingAddress.street,
              city: formData.client.shippingAddress.city,
              postalCode: formData.client.shippingAddress.postalCode,
              country: formData.client.shippingAddress.country,
            }
          : null,
      }
    : null;

  // Nettoyer companyInfo et gérer l'adresse
  const cleanCompanyInfo = formData.companyInfo
    ? {
        name: formData.companyInfo.name,
        email: formData.companyInfo.email,
        phone: formData.companyInfo.phone,
        website: formData.companyInfo.website,
        siret: formData.companyInfo.siret,
        vatNumber: formData.companyInfo.vatNumber,
        // Convertir l'adresse string en objet si nécessaire
        address:
          typeof formData.companyInfo.address === "string"
            ? parseAddressString(formData.companyInfo.address)
            : formData.companyInfo.address,
        // Inclure bankDetails seulement si showBankDetails est true et qu'ils sont remplis
        bankDetails: formData.showBankDetails
          ? // Priorité aux données du formulaire (formData.bankDetails) si elles existent
            formData.bankDetails &&
            (formData.bankDetails.iban ||
              formData.bankDetails.bic ||
              formData.bankDetails.bankName)
            ? {
                iban: formData.bankDetails.iban || "",
                bic: formData.bankDetails.bic || "",
                bankName: formData.bankDetails.bankName || "",
              }
            : // Sinon, utiliser les données de l'entreprise (nettoyées)
              formData.companyInfo.bankDetails &&
                (formData.companyInfo.bankDetails.iban ||
                  formData.companyInfo.bankDetails.bic ||
                  formData.companyInfo.bankDetails.bankName)
              ? {
                  iban: formData.companyInfo.bankDetails.iban || "",
                  bic: formData.companyInfo.bankDetails.bic || "",
                  bankName: formData.companyInfo.bankDetails.bankName || "",
                }
              : null
          : null,
      }
    : null;

  // Gérer automatiquement la date d'émission lors du passage DRAFT -> PENDING
  let issueDate = formData.issueDate;
  if (previousStatus === "DRAFT" && formData.status === "PENDING") {
    // Mettre à jour la date d'émission à la date actuelle
    issueDate = new Date().toISOString().split("T")[0];
  }

  // Helper pour s'assurer qu'on n'envoie jamais null pour les dates obligatoires
  const ensureValidDate = (dateValue, fieldName, fallbackDate = null) => {
    if (!dateValue) {
      // Si pas de fallback, utiliser la date d'émission
      const fallback = fallbackDate || issueDate;

      return fallback;
    }
    return dateValue;
  };

  // Préparer showBankDetails et bankDetails
  const shouldShowBankDetails = formData.showBankDetails || false;
  let bankDetailsForInvoice = null;

  if (shouldShowBankDetails) {
    // Utiliser les bankDetails du formulaire s'ils existent, sinon utiliser ceux de companyInfo
    const sourceBankDetails =
      formData.bankDetails || formData.companyInfo?.bankDetails || null;

    // S'assurer que bankDetails a la structure attendue et nettoyer les métadonnées GraphQL
    if (sourceBankDetails) {
      bankDetailsForInvoice = {
        iban: sourceBankDetails.iban || "",
        bic: sourceBankDetails.bic || "",
        bankName: sourceBankDetails.bankName || "",
        // Suppression explicite de __typename et autres métadonnées GraphQL
      };
    }
  }

  // Gérer la numérotation automatique lors de la transition DRAFT -> PENDING
  let numberToSend = formData.number || "";
  let prefixToSend = formData.prefix || "";

  // Si on passe de DRAFT à PENDING, ne pas envoyer le numéro pour permettre la génération automatique
  if (previousStatus === "DRAFT" && formData.status === "PENDING") {
    numberToSend = undefined; // Ne pas envoyer le numéro
    prefixToSend = undefined; // Ne pas envoyer le préfixe
  }

  return {
    ...(prefixToSend !== undefined && { prefix: prefixToSend }),
    ...(numberToSend !== undefined && { number: numberToSend }),
    issueDate: issueDate,
    executionDate: ensureValidDate(formData.executionDate, "executionDate"),
    dueDate: ensureValidDate(formData.dueDate, "dueDate"),
    status: formData.status || "DRAFT",
    client: cleanClient,
    companyInfo: cleanCompanyInfo,
    items:
      formData.items?.map((item) => ({
        description: item.description || "",
        quantity: parseFloat(item.quantity) || 0,
        unitPrice: parseFloat(item.unitPrice) || 0,
        vatRate: parseFloat(item.vatRate || item.taxRate) || 0,
        unit: item.unit || "pièce",
        discount: parseFloat(item.discount) || 0,
        discountType: (item.discountType || "PERCENTAGE").toUpperCase(),
        details: item.details || "",
        vatExemptionText: item.vatExemptionText || "",
      })) || [],
    discount: parseFloat(formData.discount) || 0,
    discountType: (formData.discountType || "PERCENTAGE").toUpperCase(),
    headerNotes: formData.headerNotes || "",
    footerNotes: formData.footerNotes || "",
    termsAndConditions: formData.termsAndConditions || "",
    customFields:
      formData.customFields?.map((field) => ({
        key: field.name || field.key,
        value: field.value,
      })) || [],
    purchaseOrderNumber: formData.purchaseOrderNumber || "",
    isDeposit: formData.isDepositInvoice || false, // Mapping correct vers le champ backend
    showBankDetails: shouldShowBankDetails,
    bankDetails: bankDetailsForInvoice,
    appearance: {
      textColor: formData.appearance?.textColor || "#000000",
      headerTextColor: formData.appearance?.headerTextColor || "#ffffff",
      headerBgColor: formData.appearance?.headerBgColor || "#1d1d1b",
    },
    shipping: formData.shipping
      ? {
          billShipping: formData.shipping.billShipping || false,
          shippingAddress: formData.shipping.shippingAddress
            ? {
                fullName: formData.shipping.shippingAddress.fullName || "",
                street: formData.shipping.shippingAddress.street || "",
                city: formData.shipping.shippingAddress.city || "",
                postalCode: formData.shipping.shippingAddress.postalCode || "",
                country: formData.shipping.shippingAddress.country || "",
              }
            : null,
          shippingAmountHT: parseFloat(formData.shipping.shippingAmountHT) || 0,
          shippingVatRate: parseFloat(formData.shipping.shippingVatRate) || 20,
        }
      : null,
  };
}

// Fonction utilitaire pour parser une adresse string en objet
function parseAddressString(addressString) {
  if (!addressString || typeof addressString !== "string") {
    return null;
  }

  // Format attendu: "rue, ville, codePostal, pays" ou "rue, ville, pays"
  const parts = addressString
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (parts.length >= 4) {
    // Format complet: rue, ville, codePostal, pays
    return {
      street: parts[0],
      city: parts[1],
      postalCode: parts[2],
      country: parts[3],
    };
  } else if (parts.length >= 3) {
    // Format sans code postal: rue, ville, pays
    return {
      street: parts[0],
      city: parts[1],
      postalCode: "",
      country: parts[2],
    };
  }

  // Fallback: utiliser l'adresse complète comme rue
  return {
    street: addressString,
    city: "",
    postalCode: "",
    country: "",
  };
}
