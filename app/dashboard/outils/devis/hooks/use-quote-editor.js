"use client";

import { useEffect, useCallback, useState, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "@/src/components/ui/sonner";
import { useErrorHandler } from "@/src/hooks/useErrorHandler";
import {
  getActiveOrganization,
  updateOrganization,
} from "@/src/lib/organization-client";
import { useUser } from "@/src/lib/auth/hooks";
import {
  useCreateQuote,
  useUpdateQuote,
  useQuote,
  useCheckQuoteNumber,
} from "@/src/graphql/quoteQueries";
import { useQuoteNumber } from "./use-quote-number";

// const AUTOSAVE_DELAY = 30000; // 30 seconds - DISABLED

export function useQuoteEditor({ mode, quoteId, initialData }) {
  const router = useRouter();
  // const autosaveTimeoutRef = useRef(null); // DISABLED - Auto-save removed

  // Auth hook pour récupérer les données utilisateur
  const { session } = useUser();
  
  // Error handler
  const { handleError } = useErrorHandler();
  const [validationErrors, setValidationErrors] = useState({});

  // GraphQL hooks
  const { quote: existingQuote, loading: loadingQuote } = useQuote(quoteId);

  // Use the new quote numbering hook that mirrors invoice logic
  const {
    nextQuoteNumber,
    validateQuoteNumber,
    isLoading: numberLoading,
    hasExistingQuotes,
  } = useQuoteNumber();

  const { createQuote, loading: creating } = useCreateQuote();
  const { updateQuote, loading: updating } = useUpdateQuote();
  const { checkQuoteNumber } = useCheckQuoteNumber();

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
            type: "validate",
            message:
              "La date d'émission ne peut pas être antérieure à la date actuelle",
          };
        }

        // Validation de la date de validité
        if (values.validUntil) {
          const validUntilDate = new Date(values.validUntil);

          if (validUntilDate < issueDate) {
            errors.validUntil = {
              type: "validate",
              message:
                "La date de validité ne peut pas être antérieure à la date d'émission",
            };
          }
        }
      }

      return {
        values,
        errors: Object.keys(errors).length > 0 ? errors : {},
      };
    },
  });

  const { watch, setValue, getValues, reset } = form;
  // const { isDirty } = formState; // DISABLED - Auto-save removed

  const [saving, setSaving] = useState(false);

  // Watch all form data for auto-save
  const formData = watch();
  
  // Watch items array to detect deep changes in real-time
  const watchedItems = useWatch({ control: form.control, name: "items" });
  const watchedShipping = useWatch({ control: form.control, name: "shipping" });
  const watchedDiscount = useWatch({ control: form.control, name: "discount" });
  const watchedDiscountType = useWatch({ control: form.control, name: "discountType" });
  const watchedCustomFields = useWatch({ control: form.control, name: "customFields" });
  const watchedClient = useWatch({ control: form.control, name: "client" });
  const watchedPrefix = useWatch({ control: form.control, name: "prefix" });
  const watchedNumber = useWatch({ control: form.control, name: "number" });
  const watchedIssueDate = useWatch({ control: form.control, name: "issueDate" });
  const watchedValidUntil = useWatch({ control: form.control, name: "validUntil" });
  
  // Créer une valeur stable pour détecter les changements dans les items
  const itemsData = useMemo(() => JSON.stringify(watchedItems || []), [watchedItems]);
  
  // Re-valider quand le client change (avec debounce)
  useEffect(() => {
    // Debounce de 500ms
    const timeoutId = setTimeout(() => {
      setValidationErrors((prevErrors) => {
        if (watchedClient?.id) {
          // Vérifier si le client est valide
          const client = watchedClient;
          const clientErrors = [];
          
          // Vérifier le nom selon le type de client
          if (client.type === "COMPANY") {
            // Pour les entreprises, vérifier le champ name
            if (!client.name || client.name.trim() === "") {
              clientErrors.push("nom de l'entreprise manquant");
            }
          } else {
            // Pour les particuliers, vérifier firstName ET lastName, ou name
            const hasName = client.name && client.name.trim() !== "";
            const hasFirstAndLastName = 
              (client.firstName && client.firstName.trim() !== "") || 
              (client.lastName && client.lastName.trim() !== "");
            
            if (!hasName && !hasFirstAndLastName) {
              clientErrors.push("nom manquant");
            }
          }
          
          // Validation de l'email
          if (!client.email || client.email.trim() === "") {
            clientErrors.push("email manquant");
          } else {
            // Vérifier le format de l'email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(client.email.trim())) {
              clientErrors.push("email invalide (format attendu: nom@exemple.com)");
            }
          }
          
          // Validation de l'adresse
          if (!client.address?.street || client.address.street.trim() === "") clientErrors.push("adresse (rue) manquante");
          if (!client.address?.city || client.address.city.trim() === "") clientErrors.push("ville manquante");
          
          // Validation du code postal
          if (!client.address?.postalCode || client.address.postalCode.trim() === "") {
            clientErrors.push("code postal manquant");
          } else {
            // Vérifier le format du code postal (5 chiffres pour la France)
            const postalCodeRegex = /^\d{5}$/;
            if (!postalCodeRegex.test(client.address.postalCode.trim())) {
              clientErrors.push("code postal invalide (5 chiffres attendus)");
            }
          }
          
          if (!client.address?.country || client.address.country.trim() === "") clientErrors.push("pays manquant");
          
          // Validations spécifiques aux entreprises
          if (client.type === "COMPANY") {
            // Validation du SIRET
            if (!client.siret || client.siret.trim() === "") {
              clientErrors.push("numéro de SIRET manquant (obligatoire pour les entreprises)");
            } else {
              // Vérifier le format du SIRET (14 chiffres)
              const siretRegex = /^\d{14}$/;
              if (!siretRegex.test(client.siret.trim())) {
                clientErrors.push("numéro de SIRET invalide (14 chiffres attendus)");
              }
            }
            
            // Validation du numéro de TVA
            if (!client.vatNumber || client.vatNumber.trim() === "") {
              clientErrors.push("numéro de TVA manquant (obligatoire pour les entreprises)");
            }
          }
          
          // Construire le nom d'affichage du client
          const displayName = client.name || 
            (client.firstName || client.lastName 
              ? `${client.firstName || ''} ${client.lastName || ''}`.trim() 
              : 'Sans nom');
          
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
                message: `Le client "${displayName}" a des informations incomplètes:\n${clientErrors.join(", ")}`,
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
  }, [watchedClient]);

  // Re-valider quand le préfixe change (avec debounce)
  useEffect(() => {
    // Debounce de 500ms
    const timeoutId = setTimeout(() => {
      setValidationErrors((prevErrors) => {
        const prefix = watchedPrefix || "";

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
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [watchedPrefix]);

  // Re-valider quand le numéro de devis change (avec debounce)
  useEffect(() => {
    // Debounce de 500ms
    const timeoutId = setTimeout(async () => {
      const number = watchedNumber || "";

      // Si le numéro est vide, supprimer l'erreur
      if (!number || number.trim() === "") {
        setValidationErrors((prevErrors) => {
          if (prevErrors.quoteNumber) {
            const newErrors = { ...prevErrors };
            delete newErrors.quoteNumber;
            return newErrors;
          }
          return prevErrors;
        });
        return;
      }

      // Vérifier si le numéro est "000000" (interdit)
      if (number === "000000") {
        setValidationErrors((prevErrors) => ({
          ...prevErrors,
          quoteNumber: {
            message: 'Le numéro de devis ne peut pas être "000000"',
            canEdit: true,
          },
        }));
        return;
      }

      try {
        // Vérifier si le numéro existe déjà (sans tenir compte du prefix)
        const { exists } = await checkQuoteNumber(number, quoteId);

        if (exists) {
          setValidationErrors((prevErrors) => ({
            ...prevErrors,
            quoteNumber: {
              message: `Le numéro de devis "${number}" existe déjà`,
              canEdit: true,
            },
          }));
        } else {
          // Numéro valide, supprimer l'erreur
          setValidationErrors((prevErrors) => {
            if (prevErrors.quoteNumber) {
              const newErrors = { ...prevErrors };
              delete newErrors.quoteNumber;
              return newErrors;
            }
            return prevErrors;
          });
        }
      } catch (error) {
        console.error("Erreur lors de la validation du numéro de devis:", error);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [watchedNumber, checkQuoteNumber, quoteId]);

  // Re-valider quand les informations entreprise changent
  useEffect(() => {
    setValidationErrors((prevErrors) => {
      if (prevErrors.companyInfo) {
        if (formData.companyInfo?.name && formData.companyInfo?.email) {
          const newErrors = { ...prevErrors };
          delete newErrors.companyInfo;
          return newErrors;
        }
      }
      return prevErrors;
    });
  }, [formData.companyInfo]);

  // Re-valider quand la date d'émission change (avec debounce)
  useEffect(() => {
    // Debounce de 500ms
    const timeoutId = setTimeout(() => {
      setValidationErrors((prevErrors) => {
        let hasError = false;
        let errorMessage = "";
        
        if (!watchedIssueDate) {
          hasError = true;
          errorMessage = "La date d'émission est obligatoire";
        } else {
          const issueDate = new Date(watchedIssueDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (issueDate < today) {
            hasError = true;
            errorMessage = "La date d'émission ne peut pas être antérieure à aujourd'hui";
          }
        }
        
        if (hasError) {
          return {
            ...prevErrors,
            issueDate: {
              message: errorMessage,
              canEdit: true
            }
          };
        } else {
          if (prevErrors.issueDate) {
            const newErrors = { ...prevErrors };
            delete newErrors.issueDate;
            return newErrors;
          }
        }
        
        return prevErrors;
      });
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [watchedIssueDate]);

  // Re-valider quand la date de validité change (avec debounce)
  useEffect(() => {
    // Debounce de 500ms
    const timeoutId = setTimeout(() => {
      setValidationErrors((prevErrors) => {
        if (watchedValidUntil && watchedIssueDate) {
          const issueDate = new Date(watchedIssueDate);
          const validUntilDate = new Date(watchedValidUntil);
          
          if (validUntilDate < issueDate) {
            return {
              ...prevErrors,
              validUntil: {
                message: "La date de validité ne peut pas être antérieure à la date d'émission",
                canEdit: true
              }
            };
          }
        }
        
        // Pas d'erreur, supprimer si elle existe
        if (prevErrors.validUntil) {
          const newErrors = { ...prevErrors };
          delete newErrors.validUntil;
          return newErrors;
        }
        
        return prevErrors;
      });
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [watchedValidUntil, watchedIssueDate]);

  // Re-valider quand les articles changent (avec debounce)
  useEffect(() => {
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
          
          if (!item.description || item.description.trim() === "") {
            itemErrors.push("description");
            fields.push("description");
          }
          if (!item.quantity || item.quantity <= 0) {
            itemErrors.push("quantity");
            fields.push("quantity");
          }
          if (item.unitPrice === undefined || item.unitPrice === null || item.unitPrice <= 0) {
            itemErrors.push("unitPrice");
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
        
        // Si tous les articles sont valides, supprimer l'erreur
        if (invalidItems.length === 0) {
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
      } else {
        // Pas d'articles, supprimer l'erreur si elle existe
        if (prevErrors.items) {
          const newErrors = { ...prevErrors };
          delete newErrors.items;
          return newErrors;
        }
      }
      
      return prevErrors;
      });
    }, 500); // Attendre 500ms après avoir arrêté de taper
    
    // Cleanup : annuler le timeout si l'utilisateur retape avant les 500ms
    return () => clearTimeout(timeoutId);
  }, [watchedItems, formData.isReverseCharge]);

  // Re-valider quand la remise change (avec debounce)
  useEffect(() => {
    // Debounce de 500ms
    const timeoutId = setTimeout(() => {
      setValidationErrors((prevErrors) => {
        // Valider la remise en pourcentage
        if (watchedDiscountType === "PERCENTAGE") {
          if (watchedDiscount > 100) {
            return {
              ...prevErrors,
              discount: {
                message: "La remise ne peut pas dépasser 100%",
                canEdit: true
              }
            };
          } else if (watchedDiscount < 0) {
            return {
              ...prevErrors,
              discount: {
                message: "La remise ne peut pas être négative",
                canEdit: true
              }
            };
          }
        }
        
        // Supprimer l'erreur si la remise est valide
        if (prevErrors.discount) {
          const newErrors = { ...prevErrors };
          delete newErrors.discount;
          return newErrors;
        }
        
        return prevErrors;
      });
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [watchedDiscount, watchedDiscountType]);

  // Re-valider quand la livraison change (avec debounce)
  useEffect(() => {
    // Debounce de 500ms
    const timeoutId = setTimeout(() => {
      setValidationErrors((prevErrors) => {
        if (watchedShipping?.billShipping) {
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
            if (prevErrors.shipping) {
              const newErrors = { ...prevErrors };
              delete newErrors.shipping;
              return newErrors;
            }
          } else {
            return {
              ...prevErrors,
              shipping: {
                message: `Informations de livraison incomplètes:\n${shippingErrors.join(", ")}`,
                canEdit: true
              }
            };
          }
        } else {
          // Pas de facturation de livraison, supprimer l'erreur
          if (prevErrors.shipping) {
            const newErrors = { ...prevErrors };
            delete newErrors.shipping;
            return newErrors;
          }
        }
        
        return prevErrors;
      });
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [watchedShipping]);

  // Re-valider quand les champs personnalisés changent (avec debounce)
  useEffect(() => {
    // Debounce de 500ms
    const timeoutId = setTimeout(() => {
      setValidationErrors((prevErrors) => {
        if (watchedCustomFields && watchedCustomFields.length > 0) {
          const invalidCustomFields = [];
          const customFieldsWithErrors = [];
          
          watchedCustomFields.forEach((field, index) => {
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
          
          if (invalidCustomFields.length === 0) {
            if (prevErrors.customFields) {
              const newErrors = { ...prevErrors };
              delete newErrors.customFields;
              return newErrors;
            }
          } else {
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
          // Pas de champs personnalisés, supprimer l'erreur
          if (prevErrors.customFields) {
            const newErrors = { ...prevErrors };
            delete newErrors.customFields;
            return newErrors;
          }
        }
        
        return prevErrors;
      });
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [watchedCustomFields]);

  // Initialize form data when quote loads
  useEffect(() => {
    if (existingQuote && mode !== "create") {
      const quoteData = transformQuoteToFormData(existingQuote);

      reset(quoteData);
    }
  }, [existingQuote, mode, reset, getValues]);

  // Set next quote number for new quotes
  useEffect(() => {
    if (mode === "create" && nextQuoteNumber && !numberLoading) {
      // Initialiser avec le prochain numéro séquentiel calculé
      const formattedNumber = String(nextQuoteNumber).padStart(6, '0');
      setValue("number", formattedNumber, { shouldValidate: false, shouldDirty: false });
    }
  }, [mode, nextQuoteNumber, numberLoading, setValue]);

  // Effet pour charger les données d'organisation au démarrage
  useEffect(() => {
    if (mode === "create") {
      const loadOrganizationData = async () => {
        try {
          const organization = await getActiveOrganization();

          if (organization) {
            // Mettre à jour les informations de l'entreprise
            setValue("companyInfo.name", organization.companyName || "");
            setValue("companyInfo.email", organization.companyEmail || "");
            setValue("companyInfo.phone", organization.companyPhone || "");
            setValue("companyInfo.website", organization.website || "");
            setValue("companyInfo.siret", organization.siret || "");
            setValue("companyInfo.vatNumber", organization.vatNumber || "");
            setValue("companyInfo.rcs", organization.rcs || "");
            setValue("companyInfo.legalForm", organization.legalForm || "");
            setValue("companyInfo.capitalSocial", organization.capitalSocial || "");
            setValue("companyInfo.fiscalRegime", organization.fiscalRegime || "");

            // Gérer l'adresse de l'entreprise à partir des champs séparés de l'organisation
            const addressString = [
              organization.addressStreet,
              `${organization.addressZipCode || ""} ${organization.addressCity || ""}`.trim(),
              organization.addressCountry,
            ]
              .filter(Boolean)
              .join("\n");
            
            if (addressString) {
              setValue("companyInfo.address", addressString);
            }

            // Mettre à jour les paramètres d'apparence
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

            // Mettre à jour les notes et conditions
            setValue(
              "headerNotes",
              organization.quoteHeaderNotes ||
                organization.documentHeaderNotes ||
                ""
            );
            setValue(
              "footerNotes",
              organization.quoteFooterNotes ||
                organization.documentFooterNotes ||
                ""
            );
            setValue(
              "termsAndConditions",
              organization.quoteTermsAndConditions ||
                organization.documentTermsAndConditions ||
                ""
            );

            // Ne pas activer showBankDetails par défaut, même si l'organisation a des coordonnées bancaires
            setValue("showBankDetails", false);
            setValue("companyInfo.bankDetails", {
              bankName: organization.bankName || "",
              iban: organization.bankIban || "",
              bic: organization.bankBic || "",
            });
          }
        } catch (error) {
          // Error silently ignored
        }
      };

      loadOrganizationData();
    }
  }, [mode, setValue]);

  // Ne plus utiliser les données de la session utilisateur pour les informations de l'entreprise
  // car elles sont maintenant gérées par la récupération des données de l'organisation active
  // via getActiveOrganization() dans l'effet précédent

  // Validation functions
  const validateStep1 = useCallback(() => {
    const data = getValues();

    // Logs de débogage supprimés

    // Vérifier le client
    if (!data.client?.id) {
      return false;
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
      toast.error(
        "La date d'émission ne peut pas être antérieure à la date actuelle"
      );
      return false;
    }

    // Vérifier la date de validité
    if (data.validUntil) {
      const validUntilDate = new Date(data.validUntil);

      // Vérifier que la date de validité n'est pas antérieure à la date d'émission
      if (validUntilDate < issueDate) {
        toast.error(
          "La date de validité ne peut pas être antérieure à la date d'émission"
        );
        return false;
      }
    }

    return true;
  }, [getValues]);

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

        // Validation complète pour le brouillon
        const errors = {};
        
        // Validation du client
        if (!currentFormData.client || !currentFormData.client.id) {
          errors.client = {
            message: "Veuillez sélectionner un client",
            canEdit: false
          };
        }
        
        // Validation des informations entreprise
        if (!currentFormData.companyInfo?.name || !currentFormData.companyInfo?.email) {
          errors.companyInfo = {
            message: "Les informations de l'entreprise sont incomplètes",
            canEdit: false
          };
        }
        
        // Validation des informations du devis (dates)
        const quoteInfoErrors = [];
        
        // Vérifier la date d'émission
        if (!currentFormData.issueDate) {
          quoteInfoErrors.push("date d'émission manquante");
        } else {
          const issueDate = new Date(currentFormData.issueDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (issueDate < today) {
            quoteInfoErrors.push("la date d'émission ne peut pas être antérieure à aujourd'hui");
          }
          
          // Vérifier la date de validité
          if (currentFormData.validUntil) {
            const validUntilDate = new Date(currentFormData.validUntil);
            
            if (validUntilDate < issueDate) {
              quoteInfoErrors.push("la date de validité ne peut pas être antérieure à la date d'émission");
            }
          }
        }
        
        if (quoteInfoErrors.length > 0) {
          errors.quoteInfo = {
            message: `Informations du devis invalides:\n${quoteInfoErrors.join(", ")}`,
            canEdit: false
          };
        }
        
        // Validation des articles
        if (!currentFormData.items || currentFormData.items.length === 0) {
          errors.items = {
            message: "Veuillez ajouter au moins un article au devis",
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
              details: itemsWithErrors
            };
          }
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
        
        if (Object.keys(errors).length > 0) {
          setValidationErrors(errors);
          setSaving(false);
          return false;
        }
        
        // Réinitialiser les erreurs si la validation passe
        setValidationErrors({});

        const input = transformFormDataToInput(
          currentFormData,
          existingQuote?.status,
          session,
          existingQuote
        );
        input.status = "DRAFT";

        let result;
        if (mode === "create" || !quoteId) {
          result = await createQuote(input);

          if (result?.id) {
            // Mettre à jour le numéro dans le formulaire avec celui retourné par le backend
            if (result.number) {
              setValue("number", result.number);
            }
            
            if (!isAutoSave) {
              toast.success("Brouillon sauvegardé");
              router.push("/dashboard/outils/devis");
            }
          }
        } else {
          result = await updateQuote(quoteId, input);

          if (!isAutoSave) {
            toast.success("Brouillon sauvegardé");
            router.push("/dashboard/outils/devis");
          }
        }
      } catch (error) {
        if (!isAutoSave) {
          handleError(error, 'quote');
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
      setValue,
      createQuote,
      updateQuote,
      router,
      session,
      handleError,
    ]
  );

  // Submit function (for final quote creation)
  const handleSubmit = useCallback(
    async (formDataOverride) => {
      try {
        setSaving(true);
        const currentFormData = formDataOverride || getValues();

        // Validation complète pour la soumission
        const errors = {};
        
        // Validation du client
        if (!currentFormData.client || !currentFormData.client.id) {
          errors.client = {
            message: "Veuillez sélectionner un client",
            canEdit: false
          };
        }
        
        // Validation des informations entreprise
        if (!currentFormData.companyInfo?.name || !currentFormData.companyInfo?.email) {
          errors.companyInfo = {
            message: "Les informations de l'entreprise sont incomplètes",
            canEdit: false
          };
        }
        
        // Validation des informations du devis (dates)
        const quoteInfoErrors = [];
        
        // Vérifier la date d'émission
        if (!currentFormData.issueDate) {
          quoteInfoErrors.push("date d'émission manquante");
        } else {
          const issueDate = new Date(currentFormData.issueDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (issueDate < today) {
            quoteInfoErrors.push("la date d'émission ne peut pas être antérieure à aujourd'hui");
          }
          
          // Vérifier la date de validité
          if (currentFormData.validUntil) {
            const validUntilDate = new Date(currentFormData.validUntil);
            
            if (validUntilDate < issueDate) {
              quoteInfoErrors.push("la date de validité ne peut pas être antérieure à la date d'émission");
            }
          }
        }
        
        if (quoteInfoErrors.length > 0) {
          errors.quoteInfo = {
            message: `Informations du devis invalides:\n${quoteInfoErrors.join(", ")}`,
            canEdit: false
          };
        }
        
        // Validation des articles
        if (!currentFormData.items || currentFormData.items.length === 0) {
          errors.items = {
            message: "Veuillez ajouter au moins un article au devis",
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
              details: itemsWithErrors
            };
          }
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
        
        if (Object.keys(errors).length > 0) {
          setValidationErrors(errors);
          toast.error("Veuillez corriger les erreurs avant de créer le devis");
          setSaving(false);
          return;
        }
        
        // Réinitialiser les erreurs si la validation passe
        setValidationErrors({});

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
          // Mettre à jour le numéro dans le formulaire avec celui retourné par le backend
          if (result.number) {
            setValue("number", result.number);
          }
          
          toast.success(
            existingQuote?.id
              ? "Devis mis à jour avec succès"
              : "Devis créé avec succès"
          );
          router.push("/dashboard/outils/devis");
        }
      } catch (error) {
        handleError(error, 'quote');
      } finally {
        setSaving(false);
      }
    },
    [
      existingQuote,
      getValues,
      setValue,
      createQuote,
      updateQuote,
      router,
      session,
      handleError,
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
        documentHeaderTextColor:
          currentFormData.appearance?.headerTextColor || "#ffffff",
        documentHeaderBgColor:
          currentFormData.appearance?.headerBgColor || "#5b50FF",
        quoteHeaderNotes: currentFormData.headerNotes || "",
        quoteFooterNotes: currentFormData.footerNotes || "",
        quoteTermsAndConditions: currentFormData.termsAndConditions || "",
        showBankDetails: currentFormData.showBankDetails || false,
      };

      await updateOrganization(activeOrganization.id, organizationData);
    } catch (error) {
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
    validationErrors,
    setValidationErrors,

    // Actions
    onSave: (formData) => {
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
    
    // Resource existence
    quote: existingQuote,
    error: loadingQuote ? null : (!existingQuote && mode !== "create"),
  };
}

// Helper functions
function getInitialFormData(mode, initialData, session) {
  const today = new Date().toISOString().split("T")[0];

  // Utiliser la valeur validUntil existante si elle est disponible
  // sinon définir une date par défaut (aujourd'hui + 30 jours)
  const validUntil =
    initialData?.validUntil ||
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
      headerBgColor: "#5b50FF",
    },

    // Position du client dans le PDF
    clientPositionRight: false,

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
      rcs: userCompany.rcs || "",
      legalForm: userCompany.legalForm || "",
      capitalSocial: userCompany.capitalSocial || "",
      fiscalRegime: userCompany.fiscalRegime || "",
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
      if (
        typeof dateValue === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
      ) {
        return dateValue;
      }

      // Si c'est un timestamp numérique ou une chaîne de chiffres
      if (
        (typeof dateValue === "number" && !isNaN(dateValue)) ||
        (typeof dateValue === "string" && /^\d+$/.test(dateValue))
      ) {
        const timestamp =
          typeof dateValue === "string" ? parseInt(dateValue, 10) : dateValue;

        // Vérifier si c'est un timestamp en secondes (10 chiffres) ou millisecondes (13 chiffres)
        if (timestamp > 0) {
          const timestampMs =
            timestamp.toString().length === 10 ? timestamp * 1000 : timestamp;
          dateObj = new Date(timestampMs);

          if (isNaN(dateObj.getTime())) {
            return "";
          }

          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, "0");
          const day = String(dateObj.getDate()).padStart(2, "0");
          const result = `${year}-${month}-${day}`;

          return result;
        } else {
          return "";
        }
      }
      // Si c'est une chaîne avec un timestamp ISO (2024-09-25T00:00:00.000Z)
      else if (typeof dateValue === "string" && dateValue.includes("T")) {
        // Extraire uniquement la partie date (YYYY-MM-DD)
        const datePart = dateValue.split("T")[0];
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
      else if (dateValue && typeof dateValue === "object") {
        // Format avec year, month, day
        if ("year" in dateValue && "month" in dateValue && "day" in dateValue) {
          dateObj = new Date(
            dateValue.year,
            dateValue.month - 1,
            dateValue.day
          );
        }
        // Format avec getTime()
        else if ("getTime" in dateValue) {
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
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      const result = `${year}-${month}-${day}`;

      return result;
    } catch (error) {
      return "";
    }
  };

  const issueDate = transformDate(quote.issueDate, "issueDate");

  // Pour la date de validité, on la récupère directement depuis la base de données
  // sans appliquer de logique conditionnelle qui pourrait la supprimer
  let validUntil = "";

  if (
    quote.validUntil !== undefined &&
    quote.validUntil !== null &&
    quote.validUntil !== ""
  ) {
    validUntil = transformDate(quote.validUntil, "validUntil");
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
      // Formatage cohérent de l'adresse pour l'affichage dans le PDF
      address: (() => {
        if (!quote.companyInfo?.address) return "";

        if (typeof quote.companyInfo.address === "string") {
          return quote.companyInfo.address;
        }

        // Créer un tableau avec les parties de l'adresse et filtrer les vides
        const addressParts = [
          quote.companyInfo.address.street,
          quote.companyInfo.address.additional,
          quote.companyInfo.address.postalCode
            ? quote.companyInfo.address.postalCode +
              " " +
              (quote.companyInfo.address.city || "")
            : quote.companyInfo.address.city,
          quote.companyInfo.address.country,
        ].filter(Boolean); // Enlève les valeurs vides du tableau

        return addressParts.join("\n");
      })(),
      // Assurer que bankDetails a toujours la même structure
      bankDetails: quote.companyInfo?.bankDetails
        ? {
            bankName: quote.companyInfo.bankDetails.bankName || "",
            iban: quote.companyInfo.bankDetails.iban || "",
            bic: quote.companyInfo.bankDetails.bic || "",
          }
        : null,
    },

    items:
      quote.items?.map((item) => ({
        description: item.description || "",
        details: item.details || "",
        quantity: item.quantity || 0,
        unit: item.unit !== undefined ? item.unit : "",
        unitPrice: item.unitPrice || 0,
        vatRate: item.vatRate || 0,
        discount: item.discount || 0,
        discountType: item.discountType || "PERCENTAGE",
        vatExemptionText: item.vatExemptionText || "",
      })) || [],

    discount: quote.discount || 0,
    discountType: quote.discountType || "PERCENTAGE",
    retenueGarantie: quote.retenueGarantie || 0,
    escompte: quote.escompte || 0,

    headerNotes: quote.headerNotes || "",
    footerNotes: quote.footerNotes || "",
    terms: quote.terms || "",

    customFields:
      quote.customFields?.map((field) => ({
        name: field.key,
        value: field.value,
      })) || [],

    // Récupérer showBankDetails depuis le devis existant, par défaut false
    showBankDetails: quote.showBankDetails || false,

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
    appearance: quote.appearance
      ? {
          textColor: quote.appearance.textColor || "#000000",
          headerTextColor: quote.appearance.headerTextColor || "#ffffff",
          headerBgColor: quote.appearance.headerBgColor || "#5b50FF",
        }
      : {
          textColor: "#000000",
          headerTextColor: "#ffffff",
          headerBgColor: "#5b50FF",
        },
    
    // Position du client dans le PDF
    clientPositionRight: quote.clientPositionRight || false,
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
        hasDifferentShippingAddress:
          formData.client.hasDifferentShippingAddress,
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
      issueDate = new Date().toISOString().split("T")[0];
    }
  }

  const ensureValidDate = (
    dateValue,
    fieldName,
    fallbackDate = null,
    existingQuoteParam = null
  ) => {
    // Fonction pour créer une date sans l'heure
    const createDateWithoutTime = (date) => {
      if (!date) return null;
      const d = new Date(date);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    };

    // Si on a une date valide, on la retourne
    if (dateValue) {
      // Si c'est déjà une chaîne au format YYYY-MM-DD
      if (
        typeof dateValue === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
      ) {
        const [year, month, day] = dateValue.split("-").map(Number);
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
        validUntilDate = ensureValidDate(
          formData.validUntil,
          "validUntil",
          null,
          existingQuote
        );
      }
    } else {
      validUntilDate = ensureValidDate(
        formData.validUntil,
        "validUntil",
        null,
        existingQuote
      );
    }
  } catch (e) {
    validUntilDate = new Date(issueDate);
    validUntilDate.setDate(validUntilDate.getDate() + 30); // 30 jours par défaut
  }

  // Fonction pour créer une date sans l'heure pour la comparaison
  const createDateWithoutTime = (date) => {
    if (!date) return null;
    try {
      // Si c'est déjà une chaîne au format YYYY-MM-DD
      if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [year, month, day] = date.split("-").map(Number);
        return new Date(year, month - 1, day);
      }

      const d = new Date(date);
      if (isNaN(d.getTime())) {
        return null;
      }
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    } catch (e) {
      return null;
    }
  };

  // S'assurer que la date de validité est postérieure ou égale à la date d'émission
  const issueDateForComparison = createDateWithoutTime(issueDate);
  const validUntilDateNoTime = createDateWithoutTime(validUntilDate);

  // Vérifier que les dates sont valides avant de les utiliser
  if (!issueDateForComparison || !validUntilDateNoTime) {
    const errorMessage =
      `❌ Erreur: Date invalide détectée - ` +
      `issueDate: ${issueDate} (${typeof issueDate}), ` +
      `validUntilDate: ${validUntilDate} (${typeof validUntilDate})`;

    // Utiliser des valeurs par défaut sécurisées
    const today = new Date();
    const defaultValidUntil = new Date(today);
    defaultValidUntil.setDate(today.getDate() + 30);

    return {
      ...formData,
      issueDate: today.toISOString().split("T")[0],
      validUntil: defaultValidUntil.toISOString().split("T")[0],
      status: formData.status || "DRAFT",
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
      if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }

      // Créer une date locale sans décalage de fuseau horaire
      const d = new Date(date);
      if (isNaN(d.getTime())) return null;

      // Formater manuellement pour éviter les problèmes de fuseau horaire
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    } catch (e) {
      return null;
    }
  };

  // Formater les dates finales en ignorant l'heure et le fuseau horaire
  const today = new Date();
  const defaultIssueDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

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
    console.log('[transformFormDataToInput] ⚠️ DRAFT->PENDING transition detected, clearing number and prefix');
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
    // Utiliser les dates formatées avec des valeurs par défaut sécurisées
    issueDate: finalIssueDate,
    validUntil: finalValidUntil,
    status: formData.status || "DRAFT",
    client: cleanClient,
    companyInfo: cleanCompanyInfo,
    items:
      formData.items?.map((item) => {
        // Convertir vatRate en nombre et s'assurer qu'il est défini
        const itemVatRate = parseFloat(item.vatRate || item.taxRate || 0) || 0;

        // Créer l'objet de base de l'article
        const itemData = {
          description: item.description || "",
          quantity: parseFloat(item.quantity) || 0,
          unitPrice: parseFloat(item.unitPrice) || 0,
          vatRate: itemVatRate,
          unit: item.unit !== undefined ? item.unit : "",
          discount: parseFloat(item.discount) || 0,
          discountType: (item.discountType || "PERCENTAGE").toUpperCase(),
          details: item.details || "",
        };

        // Ajouter vatExemptionText uniquement si vatRate est 0
        if (itemVatRate === 0) {
          // Auto-liquidation : si isReverseCharge = true, utiliser "Auto-liquidation" comme texte d'exonération
          itemData.vatExemptionText = formData.isReverseCharge
            ? "Auto-liquidation"
            : (item.vatExemptionText || "");
        }

        return itemData;
      }) || [],
    discount: parseFloat(formData.discount) || 0,
    discountType: (formData.discountType || "PERCENTAGE").toUpperCase(),
    retenueGarantie: parseFloat(formData.retenueGarantie) || 0,
    escompte: parseFloat(formData.escompte) || 0,
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
      headerBgColor: formData.appearance?.headerBgColor || "#5b50FF",
    },
    // Inclure les paramètres des coordonnées bancaires
    showBankDetails: formData.showBankDetails || false,
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
