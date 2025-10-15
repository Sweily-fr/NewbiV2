"use client";

import { useEffect, useCallback, useState, useMemo } from "react";
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
  const [validationErrors, setValidationErrors] = useState({});

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
    resolver: async (values) => {
      const errors = {};
      
      // Validation du client
      if (!values.client || !values.client.id) {
        errors.client = {
          type: "required",
          message: "Veuillez sélectionner un client"
        };
      }
      
      // Validation des informations entreprise
      if (!values.companyInfo?.name) {
        errors.companyInfo = {
          type: "required",
          message: "Le nom de l'entreprise est requis"
        };
      }
      
      if (!values.companyInfo?.email) {
        errors.companyInfo = {
          type: "required",
          message: "L'email de l'entreprise est requis"
        };
      }
      
      // Validation des articles (seulement pour la validation finale)
      if (values.status === "PENDING" && (!values.items || values.items.length === 0)) {
        errors.items = {
          type: "required",
          message: "Veuillez ajouter au moins un article"
        };
      }
      
      return {
        values: Object.keys(errors).length === 0 ? values : {},
        errors
      };
    }
  });

  const { watch, setValue, getValues, formState, reset, trigger } = form;
  const { isDirty, errors } = formState;

  const [saving, setSaving] = useState(false);
  const [editingFields, setEditingFields] = useState(new Set());

  // Watch all form data for auto-save
  const formData = watch();
  
  // Watch items array to detect deep changes
  const watchedItems = watch("items");
  
  // Créer des valeurs stables pour éviter les boucles infinies
  const shippingData = useMemo(() => JSON.stringify(formData.shipping || {}), [formData.shipping]);
  const itemsData = useMemo(() => JSON.stringify(watchedItems || []), [watchedItems]);
  const discount = formData.discount;
  const discountType = formData.discountType;
  
  // Fonction pour marquer un champ comme en cours d'édition
  const markFieldAsEditing = (itemIndex, fieldName) => {
    setEditingFields((prev) => {
      const newSet = new Set(prev);
      newSet.add(`${itemIndex}-${fieldName}`);
      return newSet;
    });
  };
  
  // Fonction pour retirer un champ de la liste d'édition
  const unmarkFieldAsEditing = (itemIndex, fieldName) => {
    setEditingFields((prev) => {
      const newSet = new Set(prev);
      newSet.delete(`${itemIndex}-${fieldName}`);
      return newSet;
    });
  };
  
  // Re-valider quand le client change
  useEffect(() => {
    setValidationErrors((prevErrors) => {
      if (prevErrors.client && formData.client?.id) {
        // Vérifier si le client est maintenant valide
        const client = formData.client;
        const clientErrors = [];
        
        if (!client.name || client.name.trim() === "") clientErrors.push("nom manquant");
        if (!client.email || client.email.trim() === "") clientErrors.push("email manquant");
        if (!client.address?.street || client.address.street.trim() === "") clientErrors.push("adresse (rue) manquante");
        if (!client.address?.city || client.address.city.trim() === "") clientErrors.push("ville manquante");
        if (!client.address?.postalCode || client.address.postalCode.trim() === "") clientErrors.push("code postal manquant");
        if (!client.address?.country || client.address.country.trim() === "") clientErrors.push("pays manquant");
        if (client.type === "COMPANY" && (!client.vatNumber || client.vatNumber.trim() === "")) {
          clientErrors.push("numéro de TVA manquant (obligatoire pour les entreprises)");
        }
        
        // Si le client est maintenant valide, supprimer l'erreur
        if (clientErrors.length === 0) {
          const newErrors = { ...prevErrors };
          delete newErrors.client;
          return newErrors;
        } else {
          // Mettre à jour le message d'erreur
          return {
            ...prevErrors,
            client: {
              message: `Le client "${client.name || 'Sans nom'}" a des informations incomplètes:\n${clientErrors.join(", ")}`,
              canEdit: true
            }
          };
        }
      }
      return prevErrors;
    });
  }, [formData.client]);

  // Re-valider quand les champs personnalisés changent
  useEffect(() => {
    setValidationErrors((prevErrors) => {
      if (prevErrors.customFields && formData.customFields && formData.customFields.length > 0) {
        const invalidCustomFields = [];
        const customFieldsWithErrors = [];
        
        formData.customFields.forEach((field, index) => {
          const fieldErrors = [];
          
          if (!field.name || field.name.trim() === "") {
            fieldErrors.push("nom du champ manquant");
          }
          if (!field.value || field.value.trim() === "") {
            fieldErrors.push("valeur manquante");
          }
          
          if (fieldErrors.length > 0) {
            invalidCustomFields.push(`Champ personnalisé ${index + 1}: ${fieldErrors.join(", ")}`);
            customFieldsWithErrors.push({ index, errors: fieldErrors });
          }
        });
        
        // Si tous les champs personnalisés sont valides, supprimer l'erreur
        if (invalidCustomFields.length === 0) {
          const newErrors = { ...prevErrors };
          delete newErrors.customFields;
          return newErrors;
        } else {
          // Mettre à jour le message d'erreur
          return {
            ...prevErrors,
            customFields: {
              message: `Certains champs personnalisés sont incomplets:\n${invalidCustomFields.join("\n")}`,
              canEdit: false,
              details: customFieldsWithErrors
            }
          };
        }
      }
      return prevErrors;
    });
  }, [formData.customFields]);

  // Re-valider quand les articles changent
  useEffect(() => {
    setValidationErrors((prevErrors) => {
      // Valider les articles uniquement s'il y a déjà une erreur OU si on a des articles
      if (watchedItems && watchedItems.length > 0) {
        const invalidItems = [];
        const itemsWithErrors = [];
        
        watchedItems.forEach((item, index) => {
          const itemErrors = [];
          const fields = [];
          
          // Ne pas afficher l'erreur si le champ est en cours d'édition
          const isDescriptionEditing = editingFields.has(`${index}-description`);
          const isQuantityEditing = editingFields.has(`${index}-quantity`);
          const isPriceEditing = editingFields.has(`${index}-unitPrice`);
          
          if (!isDescriptionEditing && (!item.description || item.description.trim() === "")) {
            itemErrors.push("description manquante");
            fields.push("description");
          }
          if (!isQuantityEditing && (!item.quantity || parseFloat(item.quantity) <= 0)) {
            itemErrors.push("quantité invalide");
            fields.push("quantity");
          }
          // Vérifier si le prix est vide, 0 ou invalide
          if (!isPriceEditing) {
            const priceValue = item.unitPrice;
            const isInvalid = priceValue === undefined || 
                             priceValue === null || 
                             priceValue === "" || 
                             isNaN(parseFloat(priceValue)) ||
                             parseFloat(priceValue) <= 0;
            
            if (isInvalid) {
              itemErrors.push("prix unitaire doit être > 0€");
              fields.push("unitPrice");
            }
          }
          
          // Vérifier le texte d'exonération de TVA si la TVA est à 0%
          const vatRate = parseFloat(item.vatRate) || 0;
          if (vatRate === 0) {
            const vatExemptionText = item.vatExemptionText;
            if (!vatExemptionText || vatExemptionText.trim() === "" || vatExemptionText === "none") {
              itemErrors.push("texte d'exonération de TVA requis (TVA à 0%)");
              fields.push("vatExemptionText");
            }
          }
          
          if (itemErrors.length > 0) {
            invalidItems.push(`Article ${index + 1}: ${itemErrors.join(", ")}`);
            itemsWithErrors.push({ index, fields });
          }
        });
        
        // Si on a déjà une erreur items, mettre à jour ou supprimer
        if (prevErrors.items) {
          if (invalidItems.length === 0) {
            // Tous les articles sont valides, supprimer l'erreur
            const newErrors = { ...prevErrors };
            delete newErrors.items;
            return newErrors;
          } else {
            // Mettre à jour le message d'erreur
            return {
              ...prevErrors,
              items: {
                message: `Certains articles sont incomplets:\n${invalidItems.join("\n")}`,
                canEdit: false,
                details: itemsWithErrors
              }
            };
          }
        }
      }
      return prevErrors;
    });
  }, [itemsData, editingFields, watchedItems]);

  // Re-valider quand la remise change
  useEffect(() => {
    setValidationErrors((prevErrors) => {
      if (prevErrors.discount) {
        if (formData.discountType !== "PERCENTAGE" || formData.discount <= 100) {
          const newErrors = { ...prevErrors };
          delete newErrors.discount;
          return newErrors;
        }
      }
      return prevErrors;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discount, discountType]);

  // Re-valider quand la livraison change
  useEffect(() => {
    setValidationErrors((prevErrors) => {
      if (prevErrors.shipping) {
        if (!formData.shipping?.billShipping) {
          const newErrors = { ...prevErrors };
          delete newErrors.shipping;
          return newErrors;
        } else {
          const shippingErrors = [];
          const shippingAddr = formData.shipping?.shippingAddress || {};
          
          if (!shippingAddr.fullName || shippingAddr.fullName.trim() === "") {
            shippingErrors.push("nom complet manquant");
          } else if (!/^[a-zA-ZÀ-ÿ\s'-]{2,100}$/.test(shippingAddr.fullName.trim())) {
            shippingErrors.push("nom complet invalide");
          }
          
          if (!shippingAddr.street || shippingAddr.street.trim() === "") {
            shippingErrors.push("adresse manquante");
          } else if (shippingAddr.street.trim().length < 5) {
            shippingErrors.push("adresse trop courte");
          }
          
          if (!shippingAddr.postalCode || shippingAddr.postalCode.trim() === "") {
            shippingErrors.push("code postal manquant");
          } else if (!/^\d{5}$/.test(shippingAddr.postalCode.trim())) {
            shippingErrors.push("code postal invalide");
          }
          
          if (!shippingAddr.city || shippingAddr.city.trim() === "") {
            shippingErrors.push("ville manquante");
          } else if (!/^[a-zA-ZÀ-ÿ\s'-]{2,100}$/.test(shippingAddr.city.trim())) {
            shippingErrors.push("ville invalide");
          }
          
          if (!shippingAddr.country || shippingAddr.country.trim() === "") {
            shippingErrors.push("pays manquant");
          }
          
          const shippingCost = formData.shipping?.shippingAmountHT;
          if (shippingCost === undefined || shippingCost === null || shippingCost === "" || isNaN(parseFloat(shippingCost)) || parseFloat(shippingCost) < 0) {
            shippingErrors.push("coût de livraison invalide");
          }
          
          if (shippingErrors.length === 0) {
            const newErrors = { ...prevErrors };
            delete newErrors.shipping;
            return newErrors;
          }
        }
      }
      return prevErrors;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shippingData]);

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
        logo: organization?.logo || "",
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

    // Validation manuelle pour le brouillon (moins stricte)
    const errors = {};
    
    if (!currentFormData.client || !currentFormData.client.id) {
      errors.client = {
        message: "Veuillez sélectionner un client",
        canEdit: false // Pas de client à modifier
      };
    } else {
      // Vérifier les champs obligatoires du client sélectionné
      const client = currentFormData.client;
      const clientErrors = [];
      
      if (!client.name || client.name.trim() === "") {
        clientErrors.push("nom manquant");
      }
      if (!client.email || client.email.trim() === "") {
        clientErrors.push("email manquant");
      }
      if (!client.address?.street || client.address.street.trim() === "") {
        clientErrors.push("adresse (rue) manquante");
      }
      if (!client.address?.city || client.address.city.trim() === "") {
        clientErrors.push("ville manquante");
      }
      if (!client.address?.postalCode || client.address.postalCode.trim() === "") {
        clientErrors.push("code postal manquant");
      }
      if (!client.address?.country || client.address.country.trim() === "") {
        clientErrors.push("pays manquant");
      }
      
      // Vérifier le numéro de TVA pour les entreprises
      if (client.type === "COMPANY" && (!client.vatNumber || client.vatNumber.trim() === "")) {
        clientErrors.push("numéro de TVA manquant (obligatoire pour les entreprises)");
      }
      
      if (clientErrors.length > 0) {
        errors.client = {
          message: `Le client "${client.name || 'Sans nom'}" a des informations incomplètes:\n${clientErrors.join(", ")}`,
          canEdit: true // On peut modifier le client
        };
      }
    }
    
    if (!currentFormData.companyInfo?.name || !currentFormData.companyInfo?.email) {
      errors.companyInfo = {
        message: "Les informations de l'entreprise sont incomplètes",
        canEdit: true // On peut toujours modifier l'entreprise
      };
    }
    
    // Validation de la remise globale
    if (currentFormData.discountType === "PERCENTAGE" && currentFormData.discount > 100) {
      errors.discount = {
        message: "La remise ne peut pas dépasser 100%",
        canEdit: false
      };
    }
    
    // Validation de la livraison si activée
    if (currentFormData.shipping?.billShipping) {
      const shippingErrors = [];
      const shippingAddr = currentFormData.shipping?.shippingAddress || {};
      
      // Validation du nom complet
      if (!shippingAddr.fullName || shippingAddr.fullName.trim() === "") {
        shippingErrors.push("nom complet manquant");
      } else if (!/^[a-zA-ZÀ-ÿ\s'-]{2,100}$/.test(shippingAddr.fullName.trim())) {
        shippingErrors.push("nom complet invalide");
      }
      
      // Validation de l'adresse
      if (!shippingAddr.street || shippingAddr.street.trim() === "") {
        shippingErrors.push("adresse manquante");
      } else if (shippingAddr.street.trim().length < 5) {
        shippingErrors.push("adresse trop courte");
      }
      
      // Validation du code postal
      if (!shippingAddr.postalCode || shippingAddr.postalCode.trim() === "") {
        shippingErrors.push("code postal manquant");
      } else if (!/^\d{5}$/.test(shippingAddr.postalCode.trim())) {
        shippingErrors.push("code postal invalide (5 chiffres requis)");
      }
      
      // Validation de la ville
      if (!shippingAddr.city || shippingAddr.city.trim() === "") {
        shippingErrors.push("ville manquante");
      } else if (!/^[a-zA-ZÀ-ÿ\s'-]{2,100}$/.test(shippingAddr.city.trim())) {
        shippingErrors.push("ville invalide");
      }
      
      // Validation du pays
      if (!shippingAddr.country || shippingAddr.country.trim() === "") {
        shippingErrors.push("pays manquant");
      }
      
      // Validation du coût de livraison
      const shippingCost = currentFormData.shipping?.shippingAmountHT;
      if (shippingCost === undefined || shippingCost === null || shippingCost === "" || isNaN(parseFloat(shippingCost)) || parseFloat(shippingCost) < 0) {
        shippingErrors.push("coût de livraison invalide (doit être >= 0€)");
      }
      
      if (shippingErrors.length > 0) {
        errors.shipping = {
          message: `Les informations de livraison sont incomplètes ou invalides:\n${shippingErrors.join(", ")}`,
          canEdit: false
        };
      }
    }
    
    // Validation des champs personnalisés
    if (currentFormData.customFields && currentFormData.customFields.length > 0) {
      const invalidCustomFields = [];
      const customFieldsWithErrors = [];
      
      currentFormData.customFields.forEach((field, index) => {
        const fieldErrors = [];
        
        if (!field.name || field.name.trim() === "") {
          fieldErrors.push("nom du champ manquant");
        }
        if (!field.value || field.value.trim() === "") {
          fieldErrors.push("valeur manquante");
        }
        
        if (fieldErrors.length > 0) {
          invalidCustomFields.push(`Champ personnalisé ${index + 1}: ${fieldErrors.join(", ")}`);
          customFieldsWithErrors.push({ index, errors: fieldErrors });
        }
      });
      
      if (invalidCustomFields.length > 0) {
        errors.customFields = {
          message: `Certains champs personnalisés sont incomplets:\n${invalidCustomFields.join("\n")}`,
          canEdit: false,
          details: customFieldsWithErrors
        };
      }
    }
    
    // Validation des articles - vérifier qu'il y en a au moins un
    if (!currentFormData.items || currentFormData.items.length === 0) {
      errors.items = {
        message: "Veuillez ajouter au moins un article à la facture",
        canEdit: false
      };
    } else {
      // Vérifier que chaque article a les champs requis
      const invalidItems = [];
      const itemsWithErrors = [];
      
      currentFormData.items.forEach((item, index) => {
        const itemErrors = [];
        const fields = [];
        
        if (!item.description || item.description.trim() === "") {
          itemErrors.push("description");
          fields.push("description");
        }
        if (!item.quantity || parseFloat(item.quantity) <= 0) {
          itemErrors.push("quantité invalide");
          fields.push("quantity");
        }
        const priceValue = item.unitPrice;
        const isInvalid = priceValue === undefined || 
                         priceValue === null || 
                         priceValue === "" || 
                         isNaN(parseFloat(priceValue)) ||
                         parseFloat(priceValue) <= 0;
        
        if (isInvalid) {
          itemErrors.push("prix unitaire doit être > 0€");
          fields.push("unitPrice");
        }
        
        // Vérifier le texte d'exonération de TVA si la TVA est à 0%
        const vatRate = parseFloat(item.vatRate) || 0;
        if (vatRate === 0) {
          const vatExemptionText = item.vatExemptionText;
          if (!vatExemptionText || vatExemptionText.trim() === "" || vatExemptionText === "none") {
            itemErrors.push("texte d'exonération de TVA requis (TVA à 0%)");
            fields.push("vatExemptionText");
          }
        }
        
        if (itemErrors.length > 0) {
          invalidItems.push(`Article ${index + 1}: ${itemErrors.join(", ")}`);
          itemsWithErrors.push({ index, fields });
        }
      });
      
      if (invalidItems.length > 0) {
        errors.items = {
          message: `Certains articles sont incomplets:\n${invalidItems.join("\n")}`,
          canEdit: false,
          details: itemsWithErrors // Pour afficher les champs en rouge
        };
      }
    }
    
    const errorCount = Object.keys(errors).length;
    const hasErrors = errorCount > 0;
    
    if (hasErrors) {
      setValidationErrors(errors);
      return false;
    }
    
    // Réinitialiser les erreurs si la validation passe
    setValidationErrors({});

    try {
      setSaving(true);

      // Pas de changement de statut dans handleSave, donc pas besoin du statut précédent
      const input = transformFormDataToInput(currentFormData);

      if (mode === "create") {
        await createInvoice(input);
        toast.success("Facture créée avec succès");
        router.push("/dashboard/outils/factures");
        return true;
      } else {
        await updateInvoice(invoiceId, input);
        toast.success("Facture sauvegardée");
        // Reset form with current data to mark as clean
        reset(currentFormData);
        // Rediriger vers la liste des factures après sauvegarde réussie en mode édition
        router.push("/dashboard/outils/factures");
        return true;
      }
    } catch (error) {
      handleError(error, 'invoice', { 
        preventDuplicates: true,
        hideServerErrors: true 
      });
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
    router,
    reset,
    handleError,
  ]);

  // Submit handler (validate and send)
  const handleSubmit = useCallback(async () => {
    const currentFormData = getValues();

    // Validation complète pour la soumission
    const errors = {};
    
    if (!currentFormData.client || !currentFormData.client.id) {
      errors.client = {
        message: "Veuillez sélectionner un client",
        canEdit: false // Pas de client à modifier
      };
    } else {
      // Vérifier les champs obligatoires du client sélectionné
      const client = currentFormData.client;
      const clientErrors = [];
      
      if (!client.name || client.name.trim() === "") {
        clientErrors.push("nom manquant");
      }
      if (!client.email || client.email.trim() === "") {
        clientErrors.push("email manquant");
      }
      if (!client.address?.street || client.address.street.trim() === "") {
        clientErrors.push("adresse (rue) manquante");
      }
      if (!client.address?.city || client.address.city.trim() === "") {
        clientErrors.push("ville manquante");
      }
      if (!client.address?.postalCode || client.address.postalCode.trim() === "") {
        clientErrors.push("code postal manquant");
      }
      if (!client.address?.country || client.address.country.trim() === "") {
        clientErrors.push("pays manquant");
      }
      
      // Vérifier le numéro de TVA pour les entreprises
      if (client.type === "COMPANY" && (!client.vatNumber || client.vatNumber.trim() === "")) {
        clientErrors.push("numéro de TVA manquant (obligatoire pour les entreprises)");
      }
      
      if (clientErrors.length > 0) {
        errors.client = {
          message: `Le client "${client.name || 'Sans nom'}" a des informations incomplètes:\n${clientErrors.join(", ")}`,
          canEdit: true // On peut modifier le client
        };
      }
    }
    
    if (!currentFormData.companyInfo?.name || !currentFormData.companyInfo?.email) {
      errors.companyInfo = {
        message: "Les informations de l'entreprise sont incomplètes",
        canEdit: true // On peut toujours modifier l'entreprise
      };
    }
    
    // Validation de la remise globale
    if (currentFormData.discountType === "PERCENTAGE" && currentFormData.discount > 100) {
      errors.discount = {
        message: "La remise ne peut pas dépasser 100%",
        canEdit: false
      };
    }
    
    // Validation de la livraison si activée
    if (currentFormData.shipping?.billShipping) {
      const shippingErrors = [];
      const shipping = currentFormData.shipping?.shippingAddress || {};
      
      if (!shipping.fullName || shipping.fullName.trim() === "") {
        shippingErrors.push("nom complet manquant");
      } else if (!/^[a-zA-ZÀ-ÿ\s'-]{2,100}$/.test(shipping.fullName.trim())) {
        shippingErrors.push("nom complet invalide");
      }
      
      if (!shipping.address || shipping.address.trim() === "") {
        shippingErrors.push("adresse manquante");
      } else if (shipping.address.trim().length < 5) {
        shippingErrors.push("adresse trop courte");
      }
      
      if (!shipping.postalCode || shipping.postalCode.trim() === "") {
        shippingErrors.push("code postal manquant");
      } else if (!/^\d{5}$/.test(shipping.postalCode.trim())) {
        shippingErrors.push("code postal invalide");
      }
      
      if (!shipping.city || shipping.city.trim() === "") {
        shippingErrors.push("ville manquante");
      } else if (!/^[a-zA-ZÀ-ÿ\s'-]{2,100}$/.test(shipping.city.trim())) {
        shippingErrors.push("ville invalide");
      }
      
      if (!shipping.country || shipping.country.trim() === "") {
        shippingErrors.push("pays manquant");
      }
      
      if (shipping.cost === undefined || shipping.cost === null || shipping.cost === "" || isNaN(parseFloat(shipping.cost)) || parseFloat(shipping.cost) < 0) {
        shippingErrors.push("coût de livraison invalide");
      }
      
      if (shippingErrors.length > 0) {
        errors.shipping = {
          message: `Les informations de livraison sont incomplètes ou invalides:\n${shippingErrors.join(", ")}`,
          canEdit: false
        };
      }
    }
    
    // Validation des champs personnalisés
    if (currentFormData.customFields && currentFormData.customFields.length > 0) {
      const invalidCustomFields = [];
      const customFieldsWithErrors = [];
      
      currentFormData.customFields.forEach((field, index) => {
        const fieldErrors = [];
        
        if (!field.name || field.name.trim() === "") {
          fieldErrors.push("nom du champ manquant");
        }
        if (!field.value || field.value.trim() === "") {
          fieldErrors.push("valeur manquante");
        }
        
        if (fieldErrors.length > 0) {
          invalidCustomFields.push(`Champ personnalisé ${index + 1}: ${fieldErrors.join(", ")}`);
          customFieldsWithErrors.push({ index, errors: fieldErrors });
        }
      });
      
      if (invalidCustomFields.length > 0) {
        errors.customFields = {
          message: `Certains champs personnalisés sont incomplets:\n${invalidCustomFields.join("\n")}`,
          canEdit: false,
          details: customFieldsWithErrors
        };
      }
    }
    
    if (!currentFormData.items || currentFormData.items.length === 0) {
      errors.items = {
        message: "Veuillez ajouter au moins un article à la facture",
        canEdit: false // Pas de bouton modifier pour les articles
      };
    } else {
      // Vérifier que chaque article a les champs requis
      const invalidItems = [];
      const itemsWithErrors = [];
      
      currentFormData.items.forEach((item, index) => {
        const itemErrors = [];
        const fields = [];
        
        if (!item.description || item.description.trim() === "") {
          itemErrors.push("description");
          fields.push("description");
        }
        if (!item.quantity || parseFloat(item.quantity) <= 0) {
          itemErrors.push("quantité invalide");
          fields.push("quantity");
        }
        const priceValue = item.unitPrice;
        const isInvalid = priceValue === undefined || 
                         priceValue === null || 
                         priceValue === "" || 
                         isNaN(parseFloat(priceValue)) ||
                         parseFloat(priceValue) <= 0;
        
        if (isInvalid) {
          itemErrors.push("prix unitaire doit être > 0€");
          fields.push("unitPrice");
        }
        
        // Vérifier le texte d'exonération de TVA si la TVA est à 0%
        const vatRate = parseFloat(item.vatRate) || 0;
        if (vatRate === 0) {
          const vatExemptionText = item.vatExemptionText;
          if (!vatExemptionText || vatExemptionText.trim() === "" || vatExemptionText === "none") {
            itemErrors.push("texte d'exonération de TVA requis (TVA à 0%)");
            fields.push("vatExemptionText");
          }
        }
        
        if (itemErrors.length > 0) {
          invalidItems.push(`Article ${index + 1}: ${itemErrors.join(", ")}`);
          itemsWithErrors.push({ index, fields });
        }
      });
      
      if (invalidItems.length > 0) {
        errors.items = {
          message: `Certains articles sont incomplets:\n${invalidItems.join("\n")}`,
          canEdit: false,
          details: itemsWithErrors // Pour afficher les champs en rouge
        };
      }
    }
    
    if (Object.keys(errors).length > 0) {
      console.error("❌ Validation échouée - Erreurs:", errors);
      setValidationErrors(errors);
      toast.error("Veuillez corriger les erreurs avant de valider la facture");
      return false;
    }
    
    // Réinitialiser les erreurs si la validation passe
    setValidationErrors({});

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
        toast.success("Facture créée avec succès");
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
      handleError(error, 'invoice', { 
        preventDuplicates: true,
        hideServerErrors: true 
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [
    mode,
    getValues,
    createInvoice,
    updateInvoice,
    invoiceId,
    router,
    existingInvoice?.status,
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
    markFieldAsEditing,
    unmarkFieldAsEditing,
    // handleAutoSave, // DISABLED
    isDirty,
    errors,
    validationErrors,
    clearValidationErrors: () => setValidationErrors({}),
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
    logo: organization?.logo || "",
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
          logo: invoice.companyInfo.logo || "",
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
        logo: formData.companyInfo.logo,
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
