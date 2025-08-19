"use client";

import { useEffect, useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "@/src/components/ui/sonner";
import {
  useCreateInvoice,
  useUpdateInvoice,
  useInvoice,
  useNextInvoiceNumber,
} from "@/src/graphql/invoiceQueries";
import { useUser } from "@/src/lib/auth/hooks";

// const AUTOSAVE_DELAY = 30000; // 30 seconds - DISABLED

export function useInvoiceEditor({ mode, invoiceId, initialData }) {
  const router = useRouter();
  // const autosaveTimeoutRef = useRef(null); // DISABLED - Auto-save removed

  // Auth hook pour récupérer les données utilisateur
  const { session } = useUser();

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
    defaultValues: getInitialFormData(mode, initialData, session),
    mode: "onChange",
  });

  const { watch, setValue, getValues, formState, reset, trigger } = form;
  const { isDirty, errors } = formState;

  const [saving, setSaving] = useState(false);

  // Watch all form data for auto-save
  const formData = watch();

  // Initialize form data when invoice loads
  useEffect(() => {
    console.log("🔄 useEffect - Chargement des données de facture existante");
    console.log("📋 existingInvoice:", existingInvoice);
    console.log("🎯 mode:", mode);

    if (existingInvoice && mode !== "create") {
      console.log(
        "✅ Conditions remplies - Transformation et reset du formulaire"
      );
      const invoiceData = transformInvoiceToFormData(existingInvoice);
      console.log("📝 Données avant reset:", invoiceData);
      console.log("🔍 CLIENT dans les données:", invoiceData.client);
      console.log("🔍 ITEMS dans les données:", invoiceData.items);
      console.log("🔍 Nombre d'articles:", invoiceData.items?.length || 0);

      reset(invoiceData);
      console.log("🎉 Reset du formulaire effectué");

      // Vérifier les données après reset
      setTimeout(() => {
        const currentFormData = getValues();
        console.log("🔍 Données après reset:", currentFormData);
        console.log("🔍 CLIENT après reset:", currentFormData.client);
        console.log("🔍 ITEMS après reset:", currentFormData.items);
        console.log("🔍 DATES après reset:");
        console.log("  - issueDate:", currentFormData.issueDate);
        console.log("  - executionDate:", currentFormData.executionDate);
        console.log("  - dueDate:", currentFormData.dueDate);
      }, 100);
    } else {
      console.log("❌ Conditions non remplies pour le chargement:", {
        hasExistingInvoice: !!existingInvoice,
        isNotCreateMode: mode !== "create",
      });
    }
  }, [existingInvoice, mode, reset, getValues]);

  // Set next invoice number for new invoices
  useEffect(() => {
    if (mode === "create" && nextNumberData?.nextInvoiceNumber) {
      setValue("prefix", nextNumberData.nextInvoiceNumber.prefix);
      setValue("number", nextNumberData.nextInvoiceNumber.number);
    }
  }, [mode, nextNumberData, setValue]);

  // Auto-remplir companyInfo quand la session devient disponible
  useEffect(() => {
    if (mode === "create" && session?.user?.company) {
      const userCompany = session.user.company;

      // 🔍 Debug: Afficher la structure complète des données utilisateur
      console.log("🔍 DEBUG - Session complète:", session);
      console.log("🔍 DEBUG - User company:", userCompany);
      console.log("🔍 DEBUG - SIRET disponible:", userCompany?.siret);
      console.log("🔍 DEBUG - VAT Number disponible:", userCompany?.vatNumber);

      const autoFilledCompanyInfo = {
        name: userCompany?.name || "",
        address: userCompany?.address
          ? `${userCompany.address.street || ""}, ${userCompany.address.city || ""}, ${userCompany.address.postalCode || ""}, ${userCompany.address.country || ""}`
              .replace(/^,\s*|,\s*$/g, "")
              .replace(/,\s*,/g, ",")
              .trim()
          : "",
        email: userCompany?.email || "",
        phone: userCompany?.phone || "",
        siret: userCompany?.legal?.siret || userCompany?.siret || "",
        vatNumber:
          userCompany?.legal?.vatNumber || userCompany?.vatNumber || "",
        website: userCompany?.website || "",
        bankDetails: {
          iban: userCompany?.bankDetails?.iban || "",
          bic: userCompany?.bankDetails?.bic || "",
          bankName: userCompany?.bankDetails?.bankName || "",
        },
      };

      setValue("companyInfo", autoFilledCompanyInfo);

      console.log(
        "✅ CompanyInfo auto-rempli avec les données utilisateur:",
        autoFilledCompanyInfo
      );
    }
  }, [mode, session, setValue]);

  // Stocker les coordonnées bancaires de l'utilisateur actuel (disponible en création et édition)
  useEffect(() => {
    if (session?.user?.company?.bankDetails) {
      // Nettoyer les métadonnées GraphQL comme __typename
      const sourceBankDetails = session.user.company.bankDetails;
      const userBankDetails = {
        iban: sourceBankDetails.iban || "",
        bic: sourceBankDetails.bic || "",
        bankName: sourceBankDetails.bankName || "",
        // Suppression explicite de __typename et autres métadonnées GraphQL
      };
      setValue("userBankDetails", userBankDetails);
      console.log(
        "🏦 Coordonnées bancaires utilisateur disponibles (nettoyées):",
        userBankDetails
      );
    }
  }, [session, setValue]);

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
    console.log(
      "💾 DÉBUT handleSave - Données du formulaire:",
      currentFormData
    );

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
      console.log(
        "📝 Données avant transformation (handleSave):",
        currentFormData
      );
      // Pas de changement de statut dans handleSave, donc pas besoin du statut précédent
      const input = transformFormDataToInput(currentFormData);
      console.log("🔄 Input transformé pour GraphQL (handleSave):", input);

      if (mode === "create") {
        console.log("📤 Envoi de la mutation CREATE_INVOICE (handleSave)...");
        const result = await createInvoice(input);

        console.log("✅ Facture créée avec succès (handleSave):", result);
        toast.success("Facture créée avec succès");
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
      toast.error(
        `Erreur lors de la sauvegarde: ${error.message || "Erreur inconnue"}`
      );
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
  ]);

  // Submit handler (validate and send)
  const handleSubmit = useCallback(async () => {
    const currentFormData = getValues();
    console.log(
      "🚀 DÉBUT handleSubmit - Données du formulaire:",
      currentFormData
    );

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

      console.log("📝 Données avant transformation:", dataToTransform);
      // Passer le statut précédent pour gérer automatiquement la date d'émission
      const previousStatus =
        mode === "edit" ? existingInvoice?.status : "DRAFT";
      const input = transformFormDataToInput(dataToTransform, previousStatus);
      console.log("🔄 Input transformé pour GraphQL:", input);

      if (mode === "create") {
        console.log("📤 Envoi de la mutation CREATE_INVOICE...");
        const result = await createInvoice(input);

        console.log("✅ Facture créée avec succès:", result);
        toast.success("Facture créée et validée");
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
      toast.error(
        `Erreur lors de la validation: ${error.message || "Erreur inconnue"}`
      );
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
  ]);

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
  };
}

// Helper functions
function getInitialFormData(mode, initialData, session) {
  // Auto-remplissage du companyInfo avec les données utilisateur
  const userCompany = session?.user?.company;
  const autoFilledCompanyInfo = {
    name: userCompany?.name || "",
    address: userCompany?.address
      ? `${userCompany.address.street || ""}, ${userCompany.address.city || ""}, ${userCompany.address.postalCode || ""}, ${userCompany.address.country || ""}`
          .replace(/^,\s*|,\s*$/g, "")
          .replace(/,\s*,/g, ",")
          .trim()
      : "",
    email: userCompany?.email || "",
    phone: userCompany?.phone || "",
    siret: userCompany?.legal?.siret || userCompany?.siret || "",
    vatNumber: userCompany?.legal?.vatNumber || userCompany?.vatNumber || "",
    website: userCompany?.website || "",
    bankDetails: {
      iban: userCompany?.bankDetails?.iban || "",
      bic: userCompany?.bankDetails?.bic || "",
      bankName: userCompany?.bankDetails?.bankName || "",
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
    showBankDetails: false,
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

  if (initialData) {
    return transformInvoiceToFormData(initialData);
  }

  return defaultData;
}

function transformInvoiceToFormData(invoice) {
  console.log(
    "🔍 DEBUG - Données de facture reçues pour transformation:",
    invoice
  );

  // Debug spécifique pour les dates
  console.log("📅 DATES DEBUG:");
  console.log(
    "  - issueDate brute:",
    invoice.issueDate,
    "type:",
    typeof invoice.issueDate
  );
  console.log(
    "  - executionDate brute:",
    invoice.executionDate,
    "type:",
    typeof invoice.executionDate
  );
  console.log(
    "  - dueDate brute:",
    invoice.dueDate,
    "type:",
    typeof invoice.dueDate
  );

  // Fonction helper pour transformer les dates
  const transformDate = (dateValue, fieldName) => {
    if (!dateValue) return null;

    try {
      // Si c'est déjà une string au format YYYY-MM-DD, on la garde
      if (
        typeof dateValue === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
      ) {
        console.log(`  ✅ ${fieldName} déjà au bon format:`, dateValue);
        return dateValue;
      }

      // Si c'est un timestamp en millisecondes (string de chiffres)
      if (typeof dateValue === "string" && /^\d+$/.test(dateValue)) {
        const timestamp = parseInt(dateValue, 10);
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          const formatted = date.toISOString().split("T")[0];
          console.log(
            `  🔄 ${fieldName} timestamp transformé:`,
            dateValue,
            "→",
            formatted
          );
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
      console.log(`  🔄 ${fieldName} transformée:`, dateValue, "→", formatted);
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
          address: invoice.companyInfo.address
            ? `${invoice.companyInfo.address.street || ""}, ${invoice.companyInfo.address.city || ""}, ${invoice.companyInfo.address.postalCode || ""}, ${invoice.companyInfo.address.country || ""}`
                .replace(/^,\s*|,\s*$/g, "")
                .replace(/,\s*,/g, ",")
                .trim()
            : "",
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

  console.log(
    "🔍 DEBUG - Données transformées pour le formulaire:",
    transformedData
  );
  console.log(
    "🔍 DEBUG - executionDate dans transformedData:",
    transformedData.executionDate
  );
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
    console.log(
      "📅 Date d'émission mise à jour automatiquement lors du passage DRAFT -> PENDING:",
      issueDate
    );
  }

  // Helper pour s'assurer qu'on n'envoie jamais null pour les dates obligatoires
  const ensureValidDate = (dateValue, fieldName, fallbackDate = null) => {
    if (!dateValue) {
      // Si pas de fallback, utiliser la date d'émission
      const fallback = fallbackDate || issueDate;
      console.log(
        `⚠️ ${fieldName} est null/undefined, utilisation de la date de fallback:`,
        fallback
      );
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
    console.log(
      "🔄 Transition DRAFT->PENDING détectée - Le numéro sera généré automatiquement par le backend"
    );
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
