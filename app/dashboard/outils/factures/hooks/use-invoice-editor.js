"use client";

import { useEffect, useCallback, useState, useMemo } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "@/src/components/ui/sonner";
import { useErrorHandler } from "@/src/hooks/useErrorHandler";
import {
  useCreateInvoice,
  useUpdateInvoice,
  useInvoice,
  useNextInvoiceNumber,
  useCheckInvoiceNumber,
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
  const { checkInvoiceNumber } = useCheckInvoiceNumber();

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
  const [touchedFields, setTouchedFields] = useState(new Set()); // Champs qui ont été touchés (onBlur)
  const [isFormInitialized, setIsFormInitialized] = useState(false); // Indique si le formulaire est complètement chargé

  // Watch all form data for auto-save
  const formData = watch();
  
  // Watch items array to detect deep changes in real-time
  const watchedItems = useWatch({ control: form.control, name: "items" });
  const watchedShipping = useWatch({ control: form.control, name: "shipping" });
  const watchedDiscount = useWatch({ control: form.control, name: "discount" });
  const watchedDiscountType = useWatch({ control: form.control, name: "discountType" });
  const watchedCustomFields = useWatch({ control: form.control, name: "customFields" });
  const watchedClient = useWatch({ control: form.control, name: "client" });
  
  // Créer des valeurs stables pour éviter les boucles infinies
  const shippingData = useMemo(() => JSON.stringify(watchedShipping || {}), [watchedShipping]);
  const itemsDataString = useMemo(() => JSON.stringify(watchedItems || []), [watchedItems]);
  
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
    // Marquer le champ comme touché pour validation en temps réel
    setTouchedFields((prev) => {
      const newSet = new Set(prev);
      newSet.add(`${itemIndex}-${fieldName}`);
      return newSet;
    });
    // Le useEffect se déclenchera automatiquement quand editingFields change
  };
  
  // Mettre à jour companyInfo quand organization est chargée
  useEffect(() => {
    if (organization && !formData.companyInfo?.legalForm) {
      // Toujours mettre à jour avec les données complètes de l'organization
      const updatedCompanyInfo = {
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
        rcs: organization?.rcs || "",
        legalForm: organization?.legalForm || "",
        capitalSocial: organization?.capitalSocial || "",
        fiscalRegime: organization?.fiscalRegime || "",
        website: organization?.website || "",
        logo: organization?.logo || "",
        bankDetails: {
          iban: organization?.bankIban || "",
          bic: organization?.bankBic || "",
          bankName: organization?.bankName || "",
        },
      };
      
      setValue("companyInfo", updatedCompanyInfo, { shouldDirty: false });
    }
  }, [organization, formData.companyInfo?.legalForm, setValue]);
  
  // Re-valider quand le client change (avec debounce)
  useEffect(() => {
    // Ne pas valider si le formulaire n'est pas encore initialisé
    if (!isFormInitialized) return;
    
    // Debounce de 500ms
    const timeoutId = setTimeout(() => {
      setValidationErrors((prevErrors) => {
        if (watchedClient?.id) {
          // Vérifier si le client est valide
          const client = watchedClient;
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
          
          // Si le client est valide, supprimer l'erreur
          if (clientErrors.length === 0) {
            if (prevErrors.client) {
              const newErrors = { ...prevErrors };
              delete newErrors.client;
              return newErrors;
            }
          } else {
            // Il y a des erreurs, les afficher
            return {
              ...prevErrors,
              client: {
                message: `Le client "${client.name || 'Sans nom'}" a des informations incomplètes:\n${clientErrors.join(", ")}`,
                canEdit: true
              }
            };
          }
        } else {
          // Pas de client sélectionné, supprimer l'erreur si elle existe
          if (prevErrors.client) {
            const newErrors = { ...prevErrors };
            delete newErrors.client;
            return newErrors;
          }
        }
        
        return prevErrors;
      });
    }, 500); // Attendre 500ms après avoir arrêté de taper
    
    // Cleanup : annuler le timeout si l'utilisateur retape avant les 500ms
    return () => clearTimeout(timeoutId);
  }, [watchedClient, isFormInitialized]);

  // Re-valider quand les informations de l'entreprise changent
  useEffect(() => {
    // Ne pas valider si le formulaire n'est pas encore initialisé
    if (!isFormInitialized) return;
    
    setValidationErrors((prevErrors) => {
      const companyInfo = formData.companyInfo;
      
      if (!companyInfo?.name || companyInfo.name.trim() === "") {
        return {
          ...prevErrors,
          companyInfo: {
            message: "Le nom de l'entreprise est requis",
            canEdit: true
          }
        };
      } else if (!companyInfo?.email || companyInfo.email.trim() === "") {
        return {
          ...prevErrors,
          companyInfo: {
            message: "L'email de l'entreprise est requis",
            canEdit: true
          }
        };
      } else {
        // Supprimer l'erreur si les champs sont valides
        if (prevErrors.companyInfo) {
          const newErrors = { ...prevErrors };
          delete newErrors.companyInfo;
          return newErrors;
        }
      }
      
      return prevErrors;
    });
  }, [formData.companyInfo, isFormInitialized]);

  // Re-valider quand la date d'émission change
  useEffect(() => {
    // Ne pas valider si le formulaire n'est pas encore initialisé
    if (!isFormInitialized) return;
    
    setValidationErrors((prevErrors) => {
      if (!formData.issueDate) {
        return {
          ...prevErrors,
          issueDate: {
            message: "La date d'émission est requise",
            canEdit: true
          }
        };
      } else {
        // Supprimer l'erreur si la date est valide
        if (prevErrors.issueDate) {
          const newErrors = { ...prevErrors };
          delete newErrors.issueDate;
          return newErrors;
        }
      }
      
      return prevErrors;
    });
  }, [formData.issueDate, isFormInitialized]);

  // Re-valider quand la date d'échéance change
  useEffect(() => {
    // Ne pas valider si le formulaire n'est pas encore initialisé
    if (!isFormInitialized) return;
    
    setValidationErrors((prevErrors) => {
      // Si pas de date d'échéance, pas d'erreur (champ optionnel)
      if (!formData.dueDate) {
        if (prevErrors.dueDate) {
          const newErrors = { ...prevErrors };
          delete newErrors.dueDate;
          return newErrors;
        }
        return prevErrors;
      }
      
      // Si on a une date d'échéance, vérifier qu'elle est >= à la date d'émission
      if (formData.issueDate && formData.dueDate) {
        const issueDate = new Date(formData.issueDate);
        const dueDate = new Date(formData.dueDate);
        
        if (dueDate < issueDate) {
          return {
            ...prevErrors,
            dueDate: {
              message: "La date d'échéance doit être postérieure ou égale à la date d'émission",
              canEdit: true
            }
          };
        } else {
          // Supprimer l'erreur si la date est valide
          if (prevErrors.dueDate) {
            const newErrors = { ...prevErrors };
            delete newErrors.dueDate;
            return newErrors;
          }
        }
      }
      
      return prevErrors;
    });
  }, [formData.issueDate, formData.dueDate, isFormInitialized]);

  // Re-valider quand le préfixe change (format uniquement, optionnel)
  useEffect(() => {
    // Ne pas valider si le formulaire n'est pas encore initialisé
    if (!isFormInitialized) return;
    
    setValidationErrors((prevErrors) => {
      const prefix = formData.prefix || "";

      // Préfixe optionnel : si vide, aucune erreur
      if (!prefix) {
        if (prevErrors.prefix) {
          const newErrors = { ...prevErrors };
          delete newErrors.prefix;
          return newErrors;
        }
        return prevErrors;
      }

      const isValid = /^[A-Za-z0-9-]*$/.test(prefix);

      if (!isValid) {
        return {
          ...prevErrors,
          prefix: {
            message:
              "Le préfixe ne doit contenir que des lettres, chiffres et tirets (sans espaces ni caractères spéciaux)",
            canEdit: true,
          },
        };
      }

      if (prevErrors.prefix) {
        const newErrors = { ...prevErrors };
        delete newErrors.prefix;
        return newErrors;
      }

      return prevErrors;
    });
  }, [formData.prefix, isFormInitialized]);

  // Re-valider quand la référence devis change (format uniquement, optionnel)
  useEffect(() => {
    // Ne pas valider si le formulaire n'est pas encore initialisé
    if (!isFormInitialized) return;
    
    setValidationErrors((prevErrors) => {
      const ref = formData.purchaseOrderNumber || "";

      // Champ optionnel : si vide, aucune erreur
      if (!ref) {
        if (prevErrors.purchaseOrderNumber) {
          const newErrors = { ...prevErrors };
          delete newErrors.purchaseOrderNumber;
          return newErrors;
        }
        return prevErrors;
      }

      const isValid = /^[A-Za-z0-9-]*$/.test(ref);

      if (!isValid) {
        return {
          ...prevErrors,
          purchaseOrderNumber: {
            message:
              "La référence devis ne doit contenir que des lettres, chiffres et tirets (sans espaces ni caractères spéciaux)",
            canEdit: true,
          },
        };
      }

      if (prevErrors.purchaseOrderNumber) {
        const newErrors = { ...prevErrors };
        delete newErrors.purchaseOrderNumber;
        return newErrors;
      }
      
      return prevErrors;
    });
  }, [formData.purchaseOrderNumber, isFormInitialized]);

  // Re-valider quand les champs personnalisés changent (avec debounce)
  useEffect(() => {
    // Ne pas valider si le formulaire n'est pas encore initialisé
    if (!isFormInitialized) return;
    
    // Debounce de 500ms
    const timeoutId = setTimeout(() => {
      setValidationErrors((prevErrors) => {
        if (watchedCustomFields && watchedCustomFields.length > 0) {
          const invalidCustomFields = [];
          const customFieldsWithErrors = [];
          
          watchedCustomFields.forEach((field, index) => {
            const fieldErrors = [];
            
            if (!field.name || field.name.trim() === "") {
              fieldErrors.push("nom manquant");
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
            if (prevErrors.customFields) {
              const newErrors = { ...prevErrors };
              delete newErrors.customFields;
              return newErrors;
            }
          } else {
            // Il y a des erreurs, les afficher
            return {
              ...prevErrors,
              customFields: {
                message: `Certains champs personnalisés sont incomplets:\n${invalidCustomFields.join("\n")}`,
                canEdit: false,
                details: customFieldsWithErrors
              }
            };
          }
        } else {
          // Pas de champs personnalisés, supprimer l'erreur si elle existe
          if (prevErrors.customFields) {
            const newErrors = { ...prevErrors };
            delete newErrors.customFields;
            return newErrors;
          }
        }
        
        return prevErrors;
      });
    }, 500); // Attendre 500ms après avoir arrêté de taper
    
    // Cleanup : annuler le timeout si l'utilisateur retape avant les 500ms
    return () => clearTimeout(timeoutId);
  }, [watchedCustomFields, isFormInitialized]);

  // Re-valider quand les articles changent (avec debounce)
  useEffect(() => {
    // Ne pas valider si le formulaire n'est pas encore initialisé
    if (!isFormInitialized) return;
    
    // Debounce de 500ms - la validation se déclenche 500ms après avoir arrêté de taper
    const timeoutId = setTimeout(() => {
      setValidationErrors((prevErrors) => {
      // Valider les articles si on a des articles
      if (watchedItems && watchedItems.length > 0) {
        const invalidItems = [];
        const itemsWithErrors = [];
        
        watchedItems.forEach((item, index) => {
          const itemErrors = [];
          const fields = [];
          
          // Valider les champs (validation automatique après 500ms d'inactivité)
          
          // Valider la description (obligatoire)
          if (!item.description || item.description.trim() === "") {
            itemErrors.push("description manquante");
            fields.push("description");
          } else if (item.description.length > 255) {
            itemErrors.push("description trop longue (max 255 caractères)");
            fields.push("description");
          } else if (!/^[A-Za-zÀ-ÖØ-öø-ÿ0-9\s\.,;:!?@#$%&*()\[\]\-_+='"/\\]+$/.test(item.description)) {
            itemErrors.push("description contient des caractères non autorisés");
            fields.push("description");
          }
          
          // Valider les détails si présents (optionnel mais limité à 500 caractères)
          if (item.details && item.details.length > 500) {
            itemErrors.push("détails trop longs (max 500 caractères)");
            fields.push("details");
          }
          
          // Valider la quantité si présente
          if (item.quantity && parseFloat(item.quantity) <= 0) {
            itemErrors.push("quantité invalide");
            fields.push("quantity");
          }
          
          // Valider le prix si présent
          if (item.unitPrice !== undefined && item.unitPrice !== null && item.unitPrice !== "") {
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
          
          // Valider la remise de l'article si c'est un pourcentage
          if (item.discountType === "PERCENTAGE" && item.discount !== undefined && item.discount !== null && item.discount !== "") {
            const discountValue = parseFloat(item.discount);
            if (discountValue > 100) {
              itemErrors.push("remise ne peut pas dépasser 100%");
              fields.push("discount");
            } else if (discountValue < 0) {
              itemErrors.push("remise ne peut pas être négative");
              fields.push("discount");
            }
          }
          
          // Vérifier le texte d'exonération de TVA si la TVA est à 0% (sauf en auto-liquidation)
          const vatRate = parseFloat(item.vatRate) || 0;
          if (vatRate === 0 && !formData.isReverseCharge) {
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
        
        // Toujours mettre à jour l'état des erreurs
        if (invalidItems.length === 0) {
          // Tous les articles sont valides, supprimer l'erreur si elle existe
          if (prevErrors.items) {
            const newErrors = { ...prevErrors };
            delete newErrors.items;
            return newErrors;
          }
        } else {
          // Il y a des erreurs, les afficher
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
      return prevErrors;
      });
    }, 500); // Attendre 500ms après avoir arrêté de taper

    // Cleanup : annuler le timeout si l'utilisateur retape avant les 500ms
    return () => clearTimeout(timeoutId);
  }, [itemsDataString, editingFields, touchedFields, formData.isReverseCharge, watchedItems, isFormInitialized]);

  // Re-valider quand la remise change
  useEffect(() => {
    // Ne pas valider si le formulaire n'est pas encore initialisé
    if (!isFormInitialized) return;
    
    setValidationErrors((prevErrors) => {
      // Valider la remise en pourcentage
      if (watchedDiscountType === "PERCENTAGE") {
        if (watchedDiscount > 100) {
          return {
            ...prevErrors,
            discount: {
              message: "La remise ne peut pas dépasser 100%",
              canEdit: false
            }
          };
        } else if (watchedDiscount < 0) {
          return {
            ...prevErrors,
            discount: {
              message: "La remise ne peut pas être négative",
              canEdit: false
            }
          };
        }
      }
      
      // Si la remise est valide, supprimer l'erreur
      if (prevErrors.discount) {
        const newErrors = { ...prevErrors };
        delete newErrors.discount;
        return newErrors;
      }
      
      return prevErrors;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedDiscount, watchedDiscountType, isFormInitialized]);

  // Re-valider quand la livraison change (avec debounce)
  useEffect(() => {
    // Ne pas valider si le formulaire n'est pas encore initialisé
    if (!isFormInitialized) return;
    
    // Debounce de 500ms
    const timeoutId = setTimeout(() => {
      setValidationErrors((prevErrors) => {
        // Si la livraison n'est pas activée, supprimer les erreurs
        if (!watchedShipping?.billShipping) {
          if (prevErrors.shipping) {
            const newErrors = { ...prevErrors };
            delete newErrors.shipping;
            return newErrors;
          }
          return prevErrors;
        } else {
          const shippingErrors = [];
          const shippingAddr = watchedShipping?.shippingAddress || {};
          
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
          
          const shippingCost = watchedShipping?.shippingAmountHT;
          if (shippingCost === undefined || shippingCost === null || shippingCost === "" || isNaN(parseFloat(shippingCost)) || parseFloat(shippingCost) < 0) {
            shippingErrors.push("coût de livraison invalide");
          }
          
          if (shippingErrors.length === 0) {
            // Pas d'erreurs, supprimer l'erreur si elle existe
            if (prevErrors.shipping) {
              const newErrors = { ...prevErrors };
              delete newErrors.shipping;
              return newErrors;
            }
          } else {
            // Il y a des erreurs, les afficher
            return {
              ...prevErrors,
              shipping: {
                message: `Informations de livraison incomplètes:\n${shippingErrors.join(", ")}`,
                canEdit: true
              }
            };
          }
        }
        
        return prevErrors;
      });
    }, 500); // Attendre 500ms après avoir arrêté de taper
    
    // Cleanup : annuler le timeout si l'utilisateur retape avant les 500ms
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shippingData, isFormInitialized]);

  // Initialize form data when invoice loads
  useEffect(() => {
    if (existingInvoice && mode !== "create") {
      const invoiceData = transformInvoiceToFormData(existingInvoice);

      reset(invoiceData);

      // Les données sont maintenant chargées dans le formulaire
      // Marquer le formulaire comme initialisé après un court délai pour s'assurer que tous les setValue sont terminés
      setTimeout(() => {
        setIsFormInitialized(true);
      }, 100);
    }
  }, [existingInvoice, mode, reset, getValues]);

  // Set next invoice number for new invoices
  // Note: Le prefix est maintenant géré dans InvoiceInfoSection avec le préfixe de la dernière facture
  useEffect(() => {
    if (mode === "create" && nextNumberData?.nextInvoiceNumber) {
      // Ne plus définir le prefix ici, il est géré dans InvoiceInfoSection
      // setValue("prefix", nextNumberData.nextInvoiceNumber.prefix);
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
        organization.documentHeaderBgColor || "#5b50FF"
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
      setValue("clientPositionRight", organization.invoiceClientPositionRight || false);
      
      // Marquer le formulaire comme initialisé après un court délai pour s'assurer que tous les setValue sont terminés
      setTimeout(() => {
        setIsFormInitialized(true);
      }, 100);

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

  // Charger clientPositionRight depuis l'organisation pour toutes les factures (création et édition)
  useEffect(() => {
    if (organization && organization.invoiceClientPositionRight !== undefined) {
      const currentValue = getValues("clientPositionRight");
      // Ne mettre à jour que si la valeur n'est pas déjà définie
      if (currentValue === undefined || currentValue === null) {
        setValue("clientPositionRight", organization.invoiceClientPositionRight || false);
      }
    }
  }, [organization, setValue, getValues]);

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
    
    console.log('[handleSave] Form data before save:', currentFormData);
    console.log('[handleSave] Prefix in form:', currentFormData.prefix);
    
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
    if (currentFormData.discountType === "PERCENTAGE") {
      if (currentFormData.discount > 100) {
        errors.discount = {
          message: "La remise ne peut pas dépasser 100%",
          canEdit: false
        };
      } else if (currentFormData.discount < 0) {
        errors.discount = {
          message: "La remise ne peut pas être négative",
          canEdit: false
        };
      }
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
        
        // Vérifier le texte d'exonération de TVA si la TVA est à 0% (sauf en auto-liquidation)
        const vatRate = parseFloat(item.vatRate) || 0;
        if (vatRate === 0 && !currentFormData.isReverseCharge) {
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
          canEdit: true,
          details: itemsWithErrors
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
      // Vérifier si c'est une erreur de numéro de facture en double
      const errorMessage = error.message || error.toString();
      if (errorMessage.includes("existe déjà") || errorMessage.includes("already exists") || errorMessage.includes("duplicate")) {
        // Extraire le numéro de facture du message d'erreur si possible
        const invoiceNumberMatch = errorMessage.match(/([A-Z0-9-]+)\s+existe déjà/i);
        const invoiceNumber = invoiceNumberMatch ? invoiceNumberMatch[1] : currentFormData.invoiceNumber;
        
        setValidationErrors({
          invoiceNumber: {
            message: `Le numéro de facture ${invoiceNumber} existe déjà. Veuillez en choisir un autre.`,
            canEdit: true
          }
        });
        
        toast.error(`Le numéro de facture ${invoiceNumber} existe déjà`);
      } else {
        handleError(error, 'invoice', { 
          preventDuplicates: true,
          hideServerErrors: true 
        });
      }
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
    if (currentFormData.discountType === "PERCENTAGE") {
      if (currentFormData.discount > 100) {
        errors.discount = {
          message: "La remise ne peut pas dépasser 100%",
          canEdit: false
        };
      } else if (currentFormData.discount < 0) {
        errors.discount = {
          message: "La remise ne peut pas être négative",
          canEdit: false
        };
      }
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
        
        // Vérifier le texte d'exonération de TVA si la TVA est à 0% (sauf en auto-liquidation)
        const vatRate = parseFloat(item.vatRate) || 0;
        if (vatRate === 0 && !formData.isReverseCharge) {
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
        isDeposit: currentFormData.isDepositInvoice || currentFormData.invoiceType === "deposit", // Mapping correct vers le champ backend
        invoiceType: currentFormData.invoiceType || "standard", // Type de facture
      };

      // Passer le statut précédent pour gérer automatiquement la date d'émission
      // IMPORTANT: Ne pas définir previousStatus lors de la création pour éviter de vider le préfixe
      const previousStatus =
        mode === "edit" ? existingInvoice?.status : null;
      const input = transformFormDataToInput(dataToTransform, previousStatus);

      if (mode === "create") {
        const result = await createInvoice(input);
        toast.success("Facture créée avec succès");
        // Retourner les données de la facture pour permettre l'envoi par email
        return {
          success: true,
          invoice: result,
          shouldRedirect: true,
          redirectUrl: "/dashboard/outils/factures",
        };
      } else {
        const result = await updateInvoice(invoiceId, input);
        // Message différent selon si on passe de Draft à Pending ou si on met à jour une facture Pending
        const wasDraft = existingInvoice?.status === "DRAFT";
        toast.success(wasDraft ? "Facture créée avec succès" : "Facture mise à jour avec succès");
        // Retourner les données de la facture pour permettre l'envoi par email
        return {
          success: true,
          invoice: result,
          shouldRedirect: true,
          redirectUrl: `/dashboard/outils/factures/${invoiceId}`,
          isNewInvoice: wasDraft,
        };
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la facture:', error);
      
      // Vérifier si c'est une erreur de numéro de facture en double
      const errorMessage = error.message || error.toString();
      if (errorMessage.includes("existe déjà") || errorMessage.includes("already exists") || errorMessage.includes("duplicate")) {
        // Extraire le numéro de facture du message d'erreur si possible
        const invoiceNumberMatch = errorMessage.match(/([A-Z0-9-]+)\s+existe déjà/i);
        const invoiceNumber = invoiceNumberMatch ? invoiceNumberMatch[1] : currentFormData.invoiceNumber;
        
        setValidationErrors({
          invoiceNumber: {
            message: `Le numéro de facture ${invoiceNumber} existe déjà. Veuillez en choisir un autre.`,
            canEdit: true
          }
        });
        
        toast.error(`Le numéro de facture ${invoiceNumber} existe déjà`);
      } else {
        // Vérifier si l'erreur est vide et la remplacer par un message par défaut
        const errorToHandle = error && (error.message || error.graphQLErrors || Object.keys(error).length > 0) 
          ? error 
          : new Error('Une erreur inconnue est survenue lors de la sauvegarde de la facture');
        
        handleError(errorToHandle, 'invoice', { 
          preventDuplicates: true,
          hideServerErrors: true 
        });
      }
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
          currentFormData.appearance?.headerBgColor || "#5b50FF",
        invoiceHeaderNotes: currentFormData.headerNotes || "",
        invoiceFooterNotes: currentFormData.footerNotes || "",
        invoiceTermsAndConditions: currentFormData.termsAndConditions || "",
        showBankDetails: currentFormData.showBankDetails || false,
        invoiceClientPositionRight: currentFormData.clientPositionRight || false,
      };

      await updateOrganization(activeOrganization.id, organizationData);
    } catch (error) {
      throw error;
    }
  }, [getValues]);

  // Fonction pour valider le numéro de facture en temps réel
  const validateInvoiceNumber = useCallback(async (invoiceNumber, invoicePrefix) => {
    console.log('[validateInvoiceNumber] Validation:', { prefix: invoicePrefix, number: invoiceNumber });
    
    if (!invoiceNumber || invoiceNumber.trim() === "") {
      // Si le numéro est vide, supprimer l'erreur
      setValidationErrors((prevErrors) => {
        if (prevErrors.invoiceNumber) {
          const newErrors = { ...prevErrors };
          delete newErrors.invoiceNumber;
          return newErrors;
        }
        return prevErrors;
      });
      return;
    }

    // Si pas de préfixe fourni, récupérer depuis le formulaire
    const prefix = invoicePrefix || getValues('prefix');
    
    if (!prefix) {
      console.log('[validateInvoiceNumber] ⚠️ Pas de préfixe, validation ignorée');
      return;
    }

    try {
      const { exists } = await checkInvoiceNumber(invoiceNumber, prefix, invoiceId);
      
      console.log('[validateInvoiceNumber] Résultat:', { exists, prefix, number: invoiceNumber });
      
      if (exists) {
        console.log('[validateInvoiceNumber] ❌ Numéro existe déjà, ajout de l\'erreur');
        setValidationErrors((prevErrors) => {
          const newErrors = {
            ...prevErrors,
            invoiceNumber: {
              message: `Le numéro de facture ${prefix}-${invoiceNumber} existe déjà. Veuillez en choisir un autre.`,
              canEdit: true
            }
          };
          console.log('[validateInvoiceNumber] Nouvelles erreurs:', newErrors);
          return newErrors;
        });
      } else {
        console.log('[validateInvoiceNumber] ✅ Numéro valide, suppression de l\'erreur');
        // Supprimer l'erreur si le numéro est valide
        setValidationErrors((prevErrors) => {
          if (prevErrors.invoiceNumber) {
            const newErrors = { ...prevErrors };
            delete newErrors.invoiceNumber;
            return newErrors;
          }
          return prevErrors;
        });
      }
    } catch (error) {
      console.error("Erreur lors de la validation du numéro de facture:", error);
    }
  }, [checkInvoiceNumber, invoiceId, getValues]);

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
    setValidationErrors,
    clearValidationErrors: () => setValidationErrors({}),
    validateInvoiceNumber,
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
    rcs: organization?.rcs || "",
    legalForm: organization?.legalForm || "",
    capitalSocial: organization?.capitalSocial || "",
    fiscalRegime: organization?.fiscalRegime || "",
    website: organization?.website || "",
    logo: organization?.logo || "",
    bankDetails: {
      iban: organization?.bankIban || "",
      bic: organization?.bankBic || "",
      bankName: organization?.bankName || "",
    },
  };

  const defaultData = {
    prefix: "",
    number: "",
    issueDate: new Date().toISOString().split("T")[0],
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
    invoiceType: "standard",
    situationNumber: 1,
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
      headerBgColor: "#5b50FF",
    },
    clientPositionRight: organization?.invoiceClientPositionRight || false, // Position du client dans le PDF (false = centre, true = droite)
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
        headerBgColor: organization.defaultHeaderBgColor || "#5b50FF",
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
        return null;
      }

      const formatted = date.toISOString().split("T")[0];
      return formatted;
    } catch (error) {
      return null;
    }
  };

  const transformedData = {
    prefix: invoice.prefix || "",
    number: invoice.number || "",
    issueDate:
      transformDate(invoice.issueDate, "issueDate") ||
      new Date().toISOString().split("T")[0],
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
          rcs: invoice.companyInfo.rcs || "",
          legalForm: invoice.companyInfo.legalForm || "",
          capitalSocial: invoice.companyInfo.capitalSocial || "",
          fiscalRegime: invoice.companyInfo.fiscalRegime || "",
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
    items: invoice.items?.map(item => ({
      ...item,
      progressPercentage: item.progressPercentage ?? 100
    })) || [],
    discount: invoice.discount || 0,
    discountType: invoice.discountType || "PERCENTAGE",
    retenueGarantie: invoice.retenueGarantie || 0,
    escompte: invoice.escompte || 0,
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
    invoiceType: invoice.invoiceType || (invoice.isDeposit ? "deposit" : "standard"), // Mapper invoiceType avec fallback sur isDeposit
    situationNumber: invoice.situationNumber || 1,
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
      headerBgColor: invoice.appearance?.headerBgColor || "#5b50FF",
    },
    clientPositionRight: invoice.clientPositionRight || false,
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

  console.log('[transformFormDataToInput] Prefix from form:', formData.prefix);
  console.log('[transformFormDataToInput] Prefix to send:', prefixToSend);
  console.log('[transformFormDataToInput] previousStatus:', previousStatus);
  console.log('[transformFormDataToInput] formData.status:', formData.status);

  // Si on passe de DRAFT à PENDING, ne pas envoyer le numéro pour permettre la génération automatique
  // IMPORTANT: Seulement si previousStatus existe ET est différent du statut actuel (vrai changement de statut)
  const isStatusTransition = previousStatus && previousStatus !== formData.status;
  if (isStatusTransition && previousStatus === "DRAFT" && formData.status === "PENDING") {
    console.log('[transformFormDataToInput] ⚠️ DRAFT->PENDING transition detected, clearing prefix');
    numberToSend = undefined; // Ne pas envoyer le numéro
    prefixToSend = undefined; // Ne pas envoyer le préfixe
  }

  // Ne pas envoyer le prefix s'il est vide (pour laisser le backend utiliser le dernier)
  // Mais l'envoyer s'il a une valeur (même si c'est une modification)
  const shouldSendPrefix = prefixToSend !== undefined && prefixToSend !== "";
  
  console.log('[transformFormDataToInput] Should send prefix:', shouldSendPrefix, 'Value:', prefixToSend);

  return {
    ...(shouldSendPrefix && { prefix: prefixToSend }),
    ...(numberToSend !== undefined && { number: numberToSend }),
    issueDate: issueDate,
    dueDate: ensureValidDate(formData.dueDate, "dueDate"),
    status: formData.status || "DRAFT",
    client: cleanClient,
    companyInfo: cleanCompanyInfo,
    items:
      formData.items?.map((item) => {
        const vatRate = parseFloat(item.vatRate || item.taxRate) || 0;
        // Auto-liquidation : si isReverseCharge = true et TVA = 0, utiliser "Auto-liquidation" comme texte d'exonération
        const vatExemptionText = formData.isReverseCharge && vatRate === 0
          ? "Auto-liquidation"
          : (item.vatExemptionText || "");
        
        return {
          description: item.description || "",
          quantity: parseFloat(item.quantity) || 0,
          unitPrice: parseFloat(item.unitPrice) || 0,
          vatRate: vatRate,
          unit: item.unit !== undefined ? item.unit : "",
          discount: parseFloat(item.discount) || 0,
          discountType: (item.discountType || "PERCENTAGE").toUpperCase(),
          details: item.details || "",
          vatExemptionText: vatExemptionText,
          progressPercentage: parseFloat(item.progressPercentage) || 100,
        };
      }) || [],
    discount: parseFloat(formData.discount) || 0,
    discountType: (formData.discountType || "PERCENTAGE").toUpperCase(),
    retenueGarantie: parseFloat(formData.retenueGarantie) || 0,
    escompte: parseFloat(formData.escompte) || 0,
    headerNotes: formData.headerNotes || "",
    footerNotes: formData.footerNotes || "",
    termsAndConditions: formData.termsAndConditions || "",
    customFields:
      formData.customFields?.map((field) => ({
        key: field.name || field.key,
        value: field.value,
      })) || [],
    purchaseOrderNumber: formData.purchaseOrderNumber || "",
    isDeposit: formData.isDepositInvoice || formData.invoiceType === "deposit", // Mapping correct vers le champ backend
    invoiceType: formData.invoiceType || "standard", // Type de facture (standard, deposit, situation)
    situationNumber: formData.situationNumber || 1, // Numéro de situation pour les factures de situation
    showBankDetails: shouldShowBankDetails,
    bankDetails: bankDetailsForInvoice,
    appearance: {
      textColor: formData.appearance?.textColor || "#000000",
      headerTextColor: formData.appearance?.headerTextColor || "#ffffff",
      headerBgColor: formData.appearance?.headerBgColor || "#5b50FF",
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
    isReverseCharge: formData.isReverseCharge || false,
    clientPositionRight: formData.clientPositionRight || false,
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
