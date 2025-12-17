"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { Calendar as CalendarIcon, Clock, Building, Info, Search, FileText, Receipt, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useLazyQuery, useQuery } from "@apollo/client";
import { Calendar } from "@/src/components/ui/calendar";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/src/components/ui/command";
import { cn } from "@/src/lib/utils";
import {
  generateInvoicePrefix,
  parseInvoicePrefix,
  formatInvoicePrefix,
  getCurrentMonthYear,
} from "@/src/utils/invoiceUtils";
import { useInvoiceNumber } from "../../hooks/use-invoice-number";
import { useLastInvoicePrefix, GET_SITUATION_INVOICES_BY_QUOTE_REF, GET_SITUATION_REFERENCES } from "@/src/graphql/invoiceQueries";
import { GET_QUOTE_BY_NUMBER, SEARCH_QUOTES_FOR_REFERENCE } from "@/src/graphql/quoteQueries";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";

// Fonction utilitaire pour formater les montants
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

const PAYMENT_TERMS_SUGGESTIONS = [
  { value: 0, label: "Paiement à réception" },
  { value: 15, label: "15 jours" },
  { value: 30, label: "30 jours" },
  { value: 45, label: "45 jours" },
  { value: 60, label: "60 jours" },
];

export default function InvoiceInfoSection({ canEdit, validateInvoiceNumber: validateInvoiceNumberExists, onSituationNumberChange, onPreviousSituationInvoicesChange, onContractTotalChange, setValidationErrors }) {
  const {
    watch,
    setValue,
    register,
    formState: { errors },
    trigger,
  } = useFormContext();
  const data = watch();
  const { workspaceId } = useRequiredWorkspace();

  // Get the next invoice number and validation function
  const {
    nextInvoiceNumber,
    validateInvoiceNumber,
    isLoading: isLoadingInvoiceNumber,
    getFormattedNextNumber,
    hasExistingInvoices,
  } = useInvoiceNumber();

  // Get the last invoice prefix
  const { prefix: lastInvoicePrefix, loading: loadingLastPrefix } = useLastInvoicePrefix();
  
  // Query pour rechercher les factures de situation par référence
  const [fetchSituationInvoices, { data: situationData, loading: loadingSituation }] = useLazyQuery(
    GET_SITUATION_INVOICES_BY_QUOTE_REF,
    { fetchPolicy: "network-only" }
  );

  // Query pour récupérer le devis par son numéro (pour le total du contrat)
  const [fetchQuoteByNumber, { data: quoteData, loading: loadingQuote }] = useLazyQuery(
    GET_QUOTE_BY_NUMBER,
    { fetchPolicy: "network-only" }
  );

  // State pour la recherche de références
  const [referenceSearchOpen, setReferenceSearchOpen] = React.useState(false);
  const [referenceSearchTerm, setReferenceSearchTerm] = React.useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState("");
  const [referenceFilter, setReferenceFilter] = React.useState("all"); // "all", "quotes", "situations"

  // Debounce pour la recherche
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(referenceSearchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [referenceSearchTerm]);

  // Query pour rechercher les devis acceptés
  const { data: quotesData, loading: loadingQuotes } = useQuery(
    SEARCH_QUOTES_FOR_REFERENCE,
    {
      variables: {
        workspaceId,
        search: debouncedSearchTerm || undefined,
        limit: 10,
      },
      skip: !referenceSearchOpen || !workspaceId,
      fetchPolicy: "network-only",
    }
  );

  // Debug: afficher les devis reçus
  React.useEffect(() => {
    if (quotesData?.quotes?.quotes) {
      console.log("📋 [QUOTES SEARCH] Devis reçus:", quotesData.quotes.quotes.map(q => ({
        id: q.id,
        number: q.number,
        prefix: q.prefix,
        fullRef: q.prefix ? `${q.prefix}-${q.number}` : q.number,
        finalTotalTTC: q.finalTotalTTC,
        client: q.client?.name
      })));
    }
  }, [quotesData]);

  // Query pour rechercher les références de situation existantes
  const { data: situationRefsData, loading: loadingSituationRefs } = useQuery(
    GET_SITUATION_REFERENCES,
    {
      variables: {
        workspaceId,
        search: debouncedSearchTerm || undefined,
      },
      skip: !referenceSearchOpen || !workspaceId,
      fetchPolicy: "network-only",
    }
  );

  // Calculer les compteurs filtrés pour les tabulations
  const availableQuotesCount = React.useMemo(() => {
    if (!quotesData?.quotes?.quotes) return 0;
    if (data.invoiceType !== "situation") return quotesData.quotes.quotes.length;
    
    return quotesData.quotes.quotes.filter(quote => {
      const invoicedTotal = quote.situationInvoicedTotal || 0;
      const contractTotal = quote.finalTotalTTC || 0;
      // Calculer le reste à facturer
      const remaining = contractTotal - invoicedTotal;
      // Afficher uniquement si le reste est strictement positif (> 0.01 pour éviter les erreurs d'arrondi)
      return remaining > 0.01;
    }).length;
  }, [quotesData, data.invoiceType]);

  const availableSituationsCount = React.useMemo(() => {
    if (!situationRefsData?.situationReferences) return 0;
    
    return situationRefsData.situationReferences.filter(ref => {
      // Si pas de montant de contrat défini, ne pas afficher (on ne peut pas calculer le reste)
      if (!ref.contractTotal || ref.contractTotal === 0) return false;
      // Calculer le reste à facturer
      const remaining = ref.contractTotal - (ref.totalTTC || 0);
      // Afficher uniquement si le reste est strictement positif (> 0.01 pour éviter les erreurs d'arrondi)
      return remaining > 0.01;
    }).length;
  }, [situationRefsData]);

  // State pour stocker le numéro de situation
  const [situationNumber, setSituationNumber] = React.useState(1);
  
  // Flag pour savoir si le préfixe a déjà été initialisé
  const prefixInitialized = React.useRef(false);
  // Flag pour éviter la validation au premier montage
  const isInitialMount = React.useRef(true);

  // Marquer que le montage initial est terminé après le premier rendu
  React.useEffect(() => {
    isInitialMount.current = false;
  }, []);


  // Rechercher les factures de situation et le devis quand le type est "situation" et qu'il y a une référence
  React.useEffect(() => {
    if (data.invoiceType === "situation" && data.purchaseOrderNumber && workspaceId) {
      fetchSituationInvoices({
        variables: {
          workspaceId,
          purchaseOrderNumber: data.purchaseOrderNumber,
        },
      });
      // Récupérer aussi le devis pour avoir le total du contrat
      fetchQuoteByNumber({
        variables: {
          workspaceId,
          number: data.purchaseOrderNumber,
        },
      });
    }
  }, [data.invoiceType, data.purchaseOrderNumber, workspaceId, fetchSituationInvoices, fetchQuoteByNumber]);

  // Notifier le parent du total du contrat quand le devis ou la première facture de situation est récupéré
  React.useEffect(() => {
    if (data.invoiceType === "situation") {
      // Priorité 1: Si un devis correspondant existe, utiliser son total
      if (quoteData?.quoteByNumber) {
        if (onContractTotalChange) {
          onContractTotalChange(quoteData.quoteByNumber.finalTotalTTC);
        }
      } 
      // Priorité 2: Si pas de devis mais des factures de situation existent, 
      // calculer le total à partir de la première facture (sans avancement)
      else if (situationData?.situationInvoicesByQuoteRef?.length > 0) {
        const existingInvoices = situationData.situationInvoicesByQuoteRef;
        // Trier par date de création pour obtenir la première
        const sortedInvoices = [...existingInvoices].sort((a, b) => 
          new Date(a.issueDate || a.createdAt) - new Date(b.issueDate || b.createdAt)
        );
        const firstInvoice = sortedInvoices[0];
        
        // Calculer le total TTC de la première facture SANS tenir compte de l'avancement
        if (firstInvoice.items && firstInvoice.items.length > 0) {
          let totalHT = 0;
          let totalVAT = 0;
          
          firstInvoice.items.forEach(item => {
            const quantity = parseFloat(item.quantity) || 0;
            const unitPrice = parseFloat(item.unitPrice) || 0;
            const vatRate = parseFloat(item.vatRate) || 0;
            const discount = parseFloat(item.discount) || 0;
            const discountType = item.discountType || "PERCENTAGE";
            
            // Calculer le total de l'article SANS avancement
            let itemTotal = quantity * unitPrice;
            
            // Appliquer la remise
            if (discount > 0) {
              if (discountType === "PERCENTAGE") {
                itemTotal = itemTotal * (1 - discount / 100);
              } else {
                itemTotal = Math.max(0, itemTotal - discount);
              }
            }
            
            totalHT += itemTotal;
            totalVAT += itemTotal * (vatRate / 100);
          });
          
          const contractTotal = totalHT + totalVAT;
          if (onContractTotalChange) {
            onContractTotalChange(contractTotal);
          }
        }
      }
    } else {
      if (onContractTotalChange) {
        onContractTotalChange(null);
      }
    }
  }, [quoteData, situationData, data.invoiceType, onContractTotalChange]);

  // Copier les articles du devis quand il est récupéré (si pas de factures de situation existantes)
  React.useEffect(() => {
    if (data.invoiceType === "situation" && quoteData?.quoteByNumber && data.purchaseOrderNumber) {
      const quote = quoteData.quoteByNumber;
      const quoteFullRef = quote.prefix ? `${quote.prefix}-${quote.number}` : quote.number;
      
      console.log('📋 [QUOTE COPY] Devis récupéré:', {
        quoteFullRef,
        purchaseOrderNumber: data.purchaseOrderNumber,
        match: quoteFullRef === data.purchaseOrderNumber,
        itemsCount: quote.items?.length,
        finalTotalTTC: quote.finalTotalTTC
      });
      
      // Vérifier que le devis récupéré correspond bien à la référence sélectionnée
      if (quoteFullRef !== data.purchaseOrderNumber) {
        return;
      }
      
      const existingInvoices = situationData?.situationInvoicesByQuoteRef || [];
      
      // Ne copier les articles du devis que s'il n'y a pas de factures de situation existantes
      if (existingInvoices.length === 0 && quote.items && quote.items.length > 0) {
        console.log('📋 [QUOTE COPY] Copie des articles:', quote.items);
        
        const copiedItems = quote.items.map(item => ({
          description: item.description || "",
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          vatRate: item.vatRate !== undefined ? item.vatRate : 20,
          vatExemptionText: item.vatExemptionText || "", // Mention d'exonération TVA
          unit: item.unit || "unité",
          discount: item.discount || 0,
          discountType: item.discountType || "PERCENTAGE",
          details: item.details || "", // Détails supplémentaires
          progressPercentage: 100, // Première situation: 100% reste à facturer
        }));
        
        setValue("items", copiedItems, { shouldDirty: true });
        
        // Copier aussi le client si disponible
        if (quote.client) {
          const clientData = quote.client;
          setValue("client", {
            id: clientData.id || "",
            name: clientData.name || "",
            email: clientData.email || "",
            type: clientData.type || "COMPANY",
            vatNumber: clientData.vatNumber || "",
            siret: clientData.siret || "",
            address: {
              fullName: clientData.address?.fullName || "",
              street: clientData.address?.street || "",
              city: clientData.address?.city || "",
              postalCode: clientData.address?.postalCode || "",
              country: clientData.address?.country || "",
            },
          }, { shouldDirty: true });
        }
      }
    }
  }, [quoteData, situationData, data.invoiceType, data.purchaseOrderNumber, setValue]);

  // Calculer le numéro de situation et copier les articles de la dernière facture de situation
  React.useEffect(() => {
    if (data.invoiceType === "situation") {
      const existingInvoices = situationData?.situationInvoicesByQuoteRef || [];
      // Exclure la facture actuelle si elle est en mode édition
      const otherInvoices = data.id 
        ? existingInvoices.filter(inv => inv.id !== data.id)
        : existingInvoices;
      const newSituationNumber = otherInvoices.length + 1;
      setSituationNumber(newSituationNumber);
      // Mettre à jour le numéro de situation dans le formulaire
      setValue("situationNumber", newSituationNumber, { shouldDirty: false });
      // Notifier le parent si callback fourni
      if (onSituationNumberChange) {
        onSituationNumberChange(newSituationNumber);
      }
      // Notifier le parent des factures de situation précédentes pour le récapitulatif
      if (onPreviousSituationInvoicesChange) {
        onPreviousSituationInvoicesChange(otherInvoices);
      }

      // Copier les articles de la dernière facture de situation
      // (priorité sur le devis car les factures de situation peuvent avoir des modifications)
      if (otherInvoices.length > 0) {
        // Prendre la dernière facture de situation (triée par date croissante, donc la dernière est à la fin)
        const lastSituationInvoice = otherInvoices[otherInvoices.length - 1];
        
        if (lastSituationInvoice.items && lastSituationInvoice.items.length > 0) {
          console.log('📋 [SITUATION COPY] Copie des articles de la dernière facture de situation:', lastSituationInvoice.items.length, 'articles');
          
          // Calculer le total des avancements déjà facturés pour chaque article
          // En sommant les progressPercentage de toutes les factures précédentes
          const totalProgressByIndex = {};
          otherInvoices.forEach(invoice => {
            if (invoice.items) {
              invoice.items.forEach((item, idx) => {
                totalProgressByIndex[idx] = (totalProgressByIndex[idx] || 0) + (item.progressPercentage || 0);
              });
            }
          });
          
          // Copier les articles avec progressPercentage = reste à facturer (100% - déjà facturé)
          const copiedItems = lastSituationInvoice.items.map((item, idx) => {
            const alreadyInvoiced = totalProgressByIndex[idx] || 0;
            const remainingProgress = Math.max(0, 100 - alreadyInvoiced);
            console.log(`📋 [SITUATION COPY] Article ${idx}: déjà facturé ${alreadyInvoiced}%, reste ${remainingProgress}%`);
            
            return {
              description: item.description || "",
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice || 0,
              vatRate: item.vatRate !== undefined ? item.vatRate : 20,
              vatExemptionText: item.vatExemptionText || "", // Mention d'exonération TVA
              unit: item.unit || "unité",
              discount: item.discount || 0,
              discountType: item.discountType || "PERCENTAGE",
              details: item.details || "", // Détails supplémentaires
              progressPercentage: remainingProgress, // Reste à facturer (100% - déjà facturé)
            };
          });
          
          setValue("items", copiedItems, { shouldDirty: true });
          
          // Copier aussi le client si disponible
          if (lastSituationInvoice.client) {
            const clientData = lastSituationInvoice.client;
            setValue("client", {
              id: clientData.id || "",
              name: clientData.name || "",
              email: clientData.email || "",
              type: clientData.type || "COMPANY",
              vatNumber: clientData.vatNumber || "",
              siret: clientData.siret || "",
              address: {
                fullName: clientData.address?.fullName || "",
                street: clientData.address?.street || "",
                city: clientData.address?.city || "",
                postalCode: clientData.address?.postalCode || "",
                country: clientData.address?.country || "",
              },
            }, { shouldDirty: true });
          }
        }
      }
      // Note: Si pas de factures de situation existantes, les articles seront copiés depuis le devis
      // par l'autre useEffect (QUOTE COPY)
    } else {
      // Si ce n'est plus une facture de situation, vider les factures précédentes
      if (onPreviousSituationInvoicesChange) {
        onPreviousSituationInvoicesChange([]);
      }
    }
  }, [situationData, data.invoiceType, data.id, data.purchaseOrderNumber, setValue, onSituationNumberChange, onPreviousSituationInvoicesChange]);

  // Créer une clé de dépendance pour les items (pour détecter les changements profonds)
  const itemsKey = React.useMemo(() => {
    if (!data.items || data.items.length === 0) return '';
    return data.items.map(item => 
      `${item.quantity || 0}-${item.unitPrice || 0}-${item.vatRate || 0}-${item.discount || 0}-${item.discountType || 'PERCENTAGE'}-${item.progressPercentage || 100}`
    ).join('|');
  }, [data.items]);

  // Validation frontend : vérifier que le total des factures de situation ne dépasse pas le contrat
  React.useEffect(() => {
    if (!setValidationErrors) return;
    
    if (data.invoiceType === "situation" && data.purchaseOrderNumber) {
      // Calculer le montant du contrat
      let contractTotal = 0;
      
      // Priorité 1: Depuis le devis
      if (quoteData?.quoteByNumber) {
        contractTotal = quoteData.quoteByNumber.finalTotalTTC || 0;
      } 
      // Priorité 2: Depuis la première facture de situation
      else if (situationData?.situationInvoicesByQuoteRef?.length > 0) {
        const existingInvoices = situationData.situationInvoicesByQuoteRef;
        const sortedInvoices = [...existingInvoices].sort((a, b) => 
          new Date(a.issueDate || a.createdAt) - new Date(b.issueDate || b.createdAt)
        );
        const firstInvoice = sortedInvoices[0];
        
        if (firstInvoice.items && firstInvoice.items.length > 0) {
          let totalHT = 0;
          let totalVAT = 0;
          
          firstInvoice.items.forEach(item => {
            const quantity = parseFloat(item.quantity) || 0;
            const unitPrice = parseFloat(item.unitPrice) || 0;
            const vatRate = parseFloat(item.vatRate) || 0;
            const discount = parseFloat(item.discount) || 0;
            const discountType = item.discountType || "PERCENTAGE";
            
            let itemTotal = quantity * unitPrice;
            if (discount > 0) {
              if (discountType === "PERCENTAGE") {
                itemTotal = itemTotal * (1 - discount / 100);
              } else {
                itemTotal = Math.max(0, itemTotal - discount);
              }
            }
            
            totalHT += itemTotal;
            totalVAT += itemTotal * (vatRate / 100);
          });
          
          contractTotal = totalHT + totalVAT;
        }
      }
      
      // Calculer le total déjà facturé (excluant la facture actuelle)
      const existingInvoices = situationData?.situationInvoicesByQuoteRef || [];
      const otherInvoices = data.id 
        ? existingInvoices.filter(inv => inv.id !== data.id)
        : existingInvoices;
      
      const alreadyInvoicedTotal = otherInvoices.reduce(
        (sum, inv) => sum + (inv.finalTotalTTC || 0), 
        0
      );
      
      // Calculer le total de la facture actuelle à partir des items (car finalTotalTTC peut ne pas être à jour)
      let currentInvoiceTotal = 0;
      if (data.items && data.items.length > 0) {
        const globalDiscount = parseFloat(data.discount) || 0;
        const globalDiscountType = data.discountType || 'PERCENTAGE';
        
        let totalHT = 0;
        let totalVAT = 0;
        
        data.items.forEach(item => {
          const quantity = parseFloat(item.quantity) || 1;
          const unitPrice = parseFloat(item.unitPrice) || 0;
          const vatRate = parseFloat(item.vatRate) || 0;
          const discount = parseFloat(item.discount) || 0;
          const discountType = item.discountType || 'PERCENTAGE';
          const progressPercentage = parseFloat(item.progressPercentage) || 100;
          
          // Calculer le total HT de la ligne avec avancement
          let lineHT = quantity * unitPrice * (progressPercentage / 100);
          
          // Appliquer la remise de ligne
          if (discount > 0) {
            if (discountType === 'PERCENTAGE') {
              lineHT = lineHT * (1 - discount / 100);
            } else {
              lineHT = Math.max(0, lineHT - discount);
            }
          }
          
          totalHT += lineHT;
          totalVAT += lineHT * (vatRate / 100);
        });
        
        // Appliquer la remise globale
        if (globalDiscount > 0) {
          if (globalDiscountType === 'PERCENTAGE') {
            const discountMultiplier = 1 - globalDiscount / 100;
            totalHT = totalHT * discountMultiplier;
            totalVAT = totalVAT * discountMultiplier;
          } else {
            const totalBeforeDiscount = totalHT + totalVAT;
            if (totalBeforeDiscount > 0) {
              const discountRatio = Math.min(1, globalDiscount / totalBeforeDiscount);
              totalHT = totalHT * (1 - discountRatio);
              totalVAT = totalVAT * (1 - discountRatio);
            }
          }
        }
        
        currentInvoiceTotal = totalHT + totalVAT;
      }
      
      // Vérifier si le total dépasserait le contrat
      if (contractTotal > 0 && (alreadyInvoicedTotal + currentInvoiceTotal) > contractTotal * 1.001) { // 0.1% de tolérance pour les arrondis
        const remaining = Math.max(0, contractTotal - alreadyInvoicedTotal);
        setValidationErrors(prev => ({
          ...prev,
          situationTotal: {
            message: `Le montant total des factures de situation dépasserait le montant du contrat. Montant du contrat: ${formatCurrency(contractTotal)}. Déjà facturé: ${formatCurrency(alreadyInvoicedTotal)}. Reste disponible: ${formatCurrency(remaining)}. Montant de cette facture: ${formatCurrency(currentInvoiceTotal)}.`,
            canEdit: false
          }
        }));
      } else {
        // Supprimer l'erreur si elle existait
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.situationTotal;
          return newErrors;
        });
      }
    } else {
      // Supprimer l'erreur si ce n'est pas une facture de situation
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.situationTotal;
        return newErrors;
      });
    }
  }, [data.invoiceType, data.purchaseOrderNumber, itemsKey, data.discount, data.discountType, data.id, quoteData, situationData, setValidationErrors]);

  // Set default invoice number when nextInvoiceNumber is available
  React.useEffect(() => {
    if (!isLoadingInvoiceNumber && nextInvoiceNumber) {
      const formattedNumber = getFormattedNextNumber();

      if (hasExistingInvoices()) {
        // Case 1: Existing invoices - set next sequential number
        if (!data.number || data.number === "") {
          setValue("number", formattedNumber, { shouldValidate: true });
        }
      } else {
        // Case 2: No existing invoices - set to 000001
        if (!data.number || data.number === "" || data.number === "1") {
          setValue("number", "000001", { shouldValidate: true });
        }
        // If user has already entered a number, don't override it
      }

      // Set default due date to today + 30 days for new invoices
      if (!data.dueDate) {
        const today = new Date();
        const dueDate = new Date(today);
        dueDate.setDate(today.getDate() + 30);
        setValue("dueDate", dueDate.toISOString().split("T")[0], {
          shouldValidate: true,
        });
      }
    }
  }, [
    nextInvoiceNumber,
    isLoadingInvoiceNumber,
    data.number,
    data.dueDate,
    setValue,
    getFormattedNextNumber,
    hasExistingInvoices,
  ]);

  // Handle prefix changes with auto-fill for MM and AAAA
  const handlePrefixChange = (e) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;

    console.log('[InvoiceInfoSection] handlePrefixChange - New value:', value);

    // Auto-fill MM (month)
    if (value.includes("MM")) {
      const { month } = getCurrentMonthYear();
      const newValue = value.replace("MM", month);
      setValue("prefix", newValue, { shouldValidate: true });
      // Position cursor after the inserted month
      const newPosition = cursorPosition + month.length - 2;
      setTimeout(() => {
        e.target.setSelectionRange(newPosition, newPosition);
      }, 0);
      return;
    }

    // Auto-fill AAAA (year)
    if (value.includes("AAAA")) {
      const { year } = getCurrentMonthYear();
      const newValue = value.replace("AAAA", year);
      setValue("prefix", newValue, { shouldValidate: true });
      // Position cursor after the inserted year
      const newPosition = cursorPosition + year.length - 4;
      setTimeout(() => {
        e.target.setSelectionRange(newPosition, newPosition);
      }, 0);
      return;
    }

    // Default behavior
    setValue("prefix", value, { shouldValidate: true });
  };

  // Set default prefix from last invoice only once on mount (only for new invoices)
  React.useEffect(() => {
    const isNewInvoice = !data.id;
    
    console.log('[InvoiceInfoSection] useEffect - Current prefix:', data.prefix);
    console.log('[InvoiceInfoSection] useEffect - Last invoice prefix:', lastInvoicePrefix);
    console.log('[InvoiceInfoSection] useEffect - Will set?', !loadingLastPrefix && !prefixInitialized.current && !data.prefix && lastInvoicePrefix && isNewInvoice);
    
    if (!loadingLastPrefix && !prefixInitialized.current && !data.prefix && lastInvoicePrefix && isNewInvoice) {
      console.log('[InvoiceInfoSection] Setting prefix to:', lastInvoicePrefix);
      setValue("prefix", lastInvoicePrefix, { shouldValidate: false, shouldDirty: false });
      prefixInitialized.current = true;
    }
  }, [lastInvoicePrefix, loadingLastPrefix, data.id]);

  // Set default issue date to today if not already set
  React.useEffect(() => {
    if (!data.issueDate) {
      const today = new Date().toISOString().split("T")[0];
      setValue("issueDate", today, { shouldValidate: true });
    }
  }, [data.issueDate, setValue]);

  // Fonction pour valider la date d'échéance
  const validateDueDate = (value) => {
    if (!value) return true; // Optionnel
    const dueDate = new Date(value);
    const issueDate = new Date(data.issueDate);
    return (
      dueDate >= issueDate ||
      "La date d'échéance doit être postérieure à la date d'émission"
    );
  };
  return (
    <Card className="shadow-none p-2 border-none bg-transparent">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 font-normal text-lg">
          {/* <Clock className="h-5 w-5" /> */}
          Informations de la facture
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-0">
        {/* Type de facture */}
        <div className="space-y-2">
          <Label htmlFor="invoice-type" className="text-sm font-light">
            Type de facture
          </Label>
          <Select
            value={data.invoiceType || "standard"}
            onValueChange={(value) => {
              setValue("invoiceType", value, { shouldDirty: true });
              // Mettre à jour isDepositInvoice pour la compatibilité
              setValue("isDepositInvoice", value === "deposit", { shouldDirty: true });
              
              if (value === "situation") {
                // Générer une référence automatique pour les factures de situation si pas de référence
                if (!data.purchaseOrderNumber && !data.id) {
                  const now = new Date();
                  const autoRef = `SIT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
                  setValue("purchaseOrderNumber", autoRef, { shouldDirty: true });
                }
              } else {
                // Si on change vers un autre type, effacer la référence auto-générée (SIT-...)
                if (data.purchaseOrderNumber?.startsWith("SIT-")) {
                  setValue("purchaseOrderNumber", "", { shouldDirty: true });
                }
              }
            }}
            disabled={!canEdit}
          >
            <SelectTrigger id="invoice-type" className="w-full">
              <SelectValue placeholder="Sélectionner le type de facture" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Facture</SelectItem>
              <SelectItem value="deposit">Facture d'acompte</SelectItem>
              <SelectItem value="situation">Facture de situation</SelectItem>
            </SelectContent>
          </Select>
          {data.invoiceType === "situation" && (
            <p className="text-xs text-muted-foreground">
              Une référence unique est générée automatiquement. Vous pouvez la modifier ou utiliser une référence existante pour lier plusieurs factures de situation.
              {situationData?.situationInvoicesByQuoteRef?.length > 0 && (
                <span className="block mt-1 text-primary font-medium">
                  {situationData.situationInvoicesByQuoteRef.length} facture(s) de situation existante(s) avec cette référence.
                </span>
              )}
            </p>
          )}
        </div>

        {/* Préfixe et numéro de facture */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="invoice-prefix" className="text-sm font-light">
                Préfixe de facture
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[280px] sm:max-w-xs">
                  <p>
                    Préfixe personnalisable pour identifier vos factures. Tapez{" "}
                    <span className="font-mono">MM</span> pour insérer le mois actuel
                    ou <span className="font-mono">AAAA</span> pour l'année.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="space-y-1">
              <div className="relative">
                <Input
                  id="invoice-prefix"
                  {...register("prefix", {
                    maxLength: {
                      value: 20,
                      message: "Le préfixe ne doit pas dépasser 20 caractères",
                    },
                    pattern: {
                      value: /^[A-Za-z0-9-]*$/,
                      message:
                        "Le préfixe ne doit contenir que des lettres, chiffres et tirets (sans espaces ni caractères spéciaux)",
                    },
                  })}
                  onChange={handlePrefixChange}
                  onBlur={async (e) => {
                    // Déclencher la validation du numéro quand le préfixe change
                    const currentNumber = watch("number");
                    if (currentNumber && validateInvoiceNumberExists) {
                      await validateInvoiceNumberExists(currentNumber, e.target.value);
                    }
                  }}
                  placeholder="F-MMYYYY"
                  disabled={!canEdit}
                />
              </div>
              {errors?.prefix && (
                <p className="text-xs text-red-500">{errors.prefix.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="invoice-number" className="text-sm font-light">
                Numéro de facture
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[280px] sm:max-w-xs">
                  <p>
                    Numéro unique et séquentiel de votre facture. Il sera automatiquement
                    formaté avec des zéros (ex: 000001). La numérotation doit être
                    continue sans saut pour respecter les obligations légales.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="space-y-1">
              <Input
                id="invoice-number"
                {...register("number", {
                  required: "Le numéro de facture est requis",
                  validate: {
                    isNumeric: (value) => {
                      if (!/^\d+$/.test(value)) {
                        return "Le numéro doit contenir uniquement des chiffres";
                      }
                      return true;
                    },
                    isValidSequence: (value) => {
                      if (isLoadingInvoiceNumber) return true; // Skip validation while loading
                      const result = validateInvoiceNumber(parseInt(value, 10));
                      return result.isValid || result.message;
                    },
                  },
                  minLength: {
                    value: 1,
                    message: "Le numéro est requis",
                  },
                  maxLength: {
                    value: 6,
                    message: "Le numéro ne peut pas dépasser 6 chiffres",
                  },
                })}
                value={
                  data.number ||
                  (nextInvoiceNumber
                    ? String(nextInvoiceNumber).padStart(4, "0")
                    : "")
                }
                onChange={(e) => {
                  // Allow only numbers and update the value
                  const value = e.target.value.replace(/\D/g, "");
                  setValue("number", value, { shouldValidate: true });
                }}
                placeholder={
                  nextInvoiceNumber
                    ? String(nextInvoiceNumber).padStart(4, "0")
                    : "000001"
                }
                disabled={!canEdit || isLoadingInvoiceNumber}
                onBlur={async (e) => {
                  // Ne pas valider au montage initial pour éviter l'affichage de la bannière
                  if (isInitialMount.current) {
                    return;
                  }
                  
                  // Format with leading zeros when leaving the field
                  let finalNumber;
                  if (e.target.value) {
                    finalNumber = e.target.value.padStart(4, "0");
                    setValue("number", finalNumber, { shouldValidate: true });
                  } else if (nextInvoiceNumber) {
                    // If field is empty, set to next invoice number
                    finalNumber = String(nextInvoiceNumber).padStart(4, "0");
                    setValue("number", finalNumber, { shouldValidate: true });
                  }
                  
                  // Vérifier si le numéro existe déjà (avec le préfixe)
                  if (finalNumber && validateInvoiceNumberExists) {
                    const currentPrefix = watch("prefix");
                    await validateInvoiceNumberExists(finalNumber, currentPrefix);
                  }
                }}
                className={`${errors?.number ? "border-red-500" : ""}`}
              />
              {errors?.number ? (
                <p className="text-xs text-red-500">{errors.number.message}</p>
              ) : (
                <></>
                // <p className="text-xs text-muted-foreground">
                //   {isLoadingInvoiceNumber
                //     ? "Chargement du prochain numéro..."
                //     : `Prochain numéro suggéré: ${nextInvoiceNumber ? String(nextInvoiceNumber).padStart(4, "0") : "000001"} (numérotation séquentielle)`}
                // </p>
              )}
            </div>
          </div>
        </div>

        {/* Référence / Référence de situation */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label
              htmlFor="purchase-order-number"
              className="text-sm font-light"
            >
              {data.invoiceType === "situation" ? "Référence de situation" : "Référence"}
              {data.invoiceType === "situation" && <span className="text-red-500">*</span>}
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[280px] sm:max-w-xs">
                <p>
                  {data.invoiceType === "situation" 
                    ? "Référence unique permettant de lier plusieurs factures de situation entre elles. Peut être une référence de devis ou une référence générée automatiquement."
                    : "Référence du contrat, devis, bon de commande ou dossier lié à cette facture (optionnel)."
                  }
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Popover open={referenceSearchOpen} onOpenChange={setReferenceSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={referenceSearchOpen}
                className="w-full justify-between font-normal"
                disabled={!canEdit}
              >
                {data.purchaseOrderNumber || (
                  <span className="text-muted-foreground">
                    {data.invoiceType === "situation" ? "Rechercher ou saisir une référence..." : "Saisir une référence..."}
                  </span>
                )}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[420px] p-0" align="start">
              {/* Onglets de filtre - uniquement pour les factures de situation */}
              {data.invoiceType === "situation" && (
                <div className="p-2 border-b">
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant={referenceFilter === "all" ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setReferenceFilter("all")}
                    >
                      Tout
                    </Button>
                    <Button
                      type="button"
                      variant={referenceFilter === "quotes" ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setReferenceFilter("quotes")}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Devis ({availableQuotesCount})
                    </Button>
                    <Button
                      type="button"
                      variant={referenceFilter === "situations" ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setReferenceFilter("situations")}
                    >
                      <Receipt className="h-3 w-3 mr-1" />
                      Situations ({availableSituationsCount})
                    </Button>
                  </div>
                </div>
              )}
              <Command shouldFilter={false}>
                <CommandInput 
                  placeholder="Rechercher un devis..."
                  value={referenceSearchTerm}
                  onValueChange={setReferenceSearchTerm}
                />
                <CommandList className="max-h-[280px]">
                  <CommandEmpty>
                    {loadingQuotes || loadingSituationRefs ? (
                      <span className="text-muted-foreground">Recherche en cours...</span>
                    ) : (
                      <span className="text-muted-foreground">Aucun résultat trouvé</span>
                    )}
                  </CommandEmpty>
                  
                  {/* Devis acceptés */}
                  {(referenceFilter === "all" || referenceFilter === "quotes") && quotesData?.quotes?.quotes?.length > 0 && (() => {
                    // Pour les factures de situation, filtrer les devis dont le total facturé a atteint le montant du devis
                    const availableQuotes = data.invoiceType === "situation" 
                      ? quotesData.quotes.quotes.filter(quote => {
                          const invoicedTotal = quote.situationInvoicedTotal || 0;
                          const contractTotal = quote.finalTotalTTC || 0;
                          // Calculer le reste à facturer
                          const remaining = contractTotal - invoicedTotal;
                          // Afficher uniquement si le reste est strictement positif (> 0.01 pour éviter les erreurs d'arrondi)
                          return remaining > 0.01;
                        })
                      : quotesData.quotes.quotes;
                    
                    if (availableQuotes.length === 0) return null;
                    
                    return (
                      <CommandGroup heading={`Devis acceptés (${availableQuotes.length})`}>
                        {[...availableQuotes].sort((a, b) => {
                          // Trier par numéro décroissant pour avoir les plus récents en premier
                          const numA = parseInt(a.number) || 0;
                          const numB = parseInt(b.number) || 0;
                          return numB - numA;
                        }).map((quote) => {
                          const fullRef = quote.prefix ? `${quote.prefix}-${quote.number}` : quote.number;
                          const invoicedTotal = quote.situationInvoicedTotal || 0;
                          const remaining = data.invoiceType === "situation" && invoicedTotal > 0 
                            ? quote.finalTotalTTC - invoicedTotal 
                            : null;
                          
                          return (
                            <CommandItem
                              key={quote.id}
                              value={fullRef}
                              onSelect={() => {
                                setValue("purchaseOrderNumber", fullRef, { shouldDirty: true });
                                setReferenceSearchOpen(false);
                                setReferenceSearchTerm("");
                                setReferenceFilter("all");
                              }}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{fullRef}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {quote.client?.name} • {formatCurrency(quote.finalTotalTTC)}
                                  {remaining !== null && ` • Reste: ${formatCurrency(remaining)}`}
                                </div>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    );
                  })()}
                  
                  {/* Références de situation existantes - uniquement pour les factures de situation */}
                  {data.invoiceType === "situation" && (referenceFilter === "all" || referenceFilter === "situations") && situationRefsData?.situationReferences?.length > 0 && (() => {
                    // Filtrer les références dont le total n'a pas atteint le montant du contrat
                    const availableRefs = situationRefsData.situationReferences.filter(ref => {
                      // Si pas de montant de contrat défini, ne pas afficher
                      if (!ref.contractTotal || ref.contractTotal === 0) return false;
                      // Calculer le reste à facturer
                      const remaining = ref.contractTotal - (ref.totalTTC || 0);
                      // Afficher uniquement si le reste est strictement positif (> 0.01 pour éviter les erreurs d'arrondi)
                      return remaining > 0.01;
                    });
                    
                    if (availableRefs.length === 0) return null;
                    
                    return (
                      <>
                        {referenceFilter === "all" && quotesData?.quotes?.quotes?.length > 0 && <CommandSeparator />}
                        <CommandGroup heading={`Factures de situation (${availableRefs.length})`}>
                          {availableRefs.map((ref) => {
                            const remaining = ref.contractTotal ? ref.contractTotal - ref.totalTTC : null;
                            return (
                              <CommandItem
                                key={ref.reference}
                                value={ref.reference}
                                onSelect={() => {
                                  setValue("purchaseOrderNumber", ref.reference, { shouldDirty: true });
                                  setReferenceSearchOpen(false);
                                  setReferenceSearchTerm("");
                                  setReferenceFilter("all");
                                }}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Receipt className="h-4 w-4 text-green-500 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">{ref.reference}</div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {ref.count} facture(s) • Facturé: {formatCurrency(ref.totalTTC)}
                                    {remaining !== null && ` • Reste: ${formatCurrency(remaining)}`}
                                  </div>
                                </div>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </>
                    );
                  })()}
                  
                  {/* Option pour saisir manuellement */}
                  {referenceSearchTerm && (
                    <>
                      <CommandSeparator />
                      <CommandGroup heading="Saisie manuelle">
                        <CommandItem
                          value={referenceSearchTerm}
                          onSelect={() => {
                            setValue("purchaseOrderNumber", referenceSearchTerm, { shouldDirty: true });
                            setReferenceSearchOpen(false);
                            setReferenceSearchTerm("");
                            setReferenceFilter("all");
                          }}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Search className="h-4 w-4 text-gray-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">Utiliser "{referenceSearchTerm}"</div>
                            <div className="text-xs text-muted-foreground">
                              Saisir cette référence manuellement
                            </div>
                          </div>
                        </CommandItem>
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
          {/* Bouton pour effacer la référence */}
          {data.purchaseOrderNumber && canEdit && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-1 h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setValue("purchaseOrderNumber", "", { shouldDirty: true })}
            >
              Effacer la référence
            </Button>
          )}
        </div>

        {/* Dates */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-light">
                Date d'émission <span className="text-red-500">*</span>
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[280px] sm:max-w-xs">
                  <p>
                    Date à laquelle la facture est créée et envoyée au client.
                    Cette date est automatiquement définie lors de la création et
                    sert de référence pour calculer la date d'échéance.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <input
              type="hidden"
              {...register("issueDate", {
                required: false, // On ne veut plus de message d'erreur
              })}
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={!canEdit}
                  className={cn(
                    "w-full justify-start font-normal text-left",
                    !data.issueDate && "text-muted-foreground",
                    errors?.issueDate && "border-red-500"
                  )}
                  type="button"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.issueDate ? (
                    (() => {
                      try {
                        const date = new Date(data.issueDate);
                        if (isNaN(date.getTime()))
                          return <span>Date invalide</span>;
                        return format(date, "PPP", { locale: fr });
                      } catch (error) {
                        return <span>Date invalide</span>;
                      }
                    })()
                  ) : (
                    <span>Choisir une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data.issueDate ? new Date(data.issueDate) : undefined}
                  onSelect={(date) => {
                    const dateStr = format(date, "yyyy-MM-dd");
                    setValue("issueDate", dateStr, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                  initialFocus
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
            {errors?.issueDate && (
              <p className="text-xs text-red-500">
                {errors.issueDate.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-light">Date d'échéance</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[280px] sm:max-w-xs">
                  <p>
                    Date limite de paiement de la facture. Au-delà de cette date,
                    des pénalités de retard peuvent s'appliquer. Utilisez le sélecteur
                    pour ajouter automatiquement 15, 30, 45 ou 60 jours.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
              <input
                type="hidden"
                {...register("dueDate", {
                  validate: validateDueDate,
                })}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={!canEdit}
                    className={cn(
                      "w-full justify-start font-normal text-left",
                      !data.dueDate && "text-muted-foreground",
                      errors?.dueDate && "border-red-500"
                    )}
                    type="button"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data.dueDate ? (
                      (() => {
                        try {
                          const date = new Date(data.dueDate);
                          if (isNaN(date.getTime()))
                            return <span>Date invalide</span>;
                          return format(date, "PPP", { locale: fr });
                        } catch (error) {
                          return <span>Date invalide</span>;
                        }
                      })()
                    ) : (
                      <span>Choisir une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={data.dueDate ? new Date(data.dueDate) : undefined}
                    onSelect={(date) => {
                      const dateStr = format(date, "yyyy-MM-dd");
                      setValue("dueDate", dateStr, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
              <Select
                onValueChange={(value) => {
                  const days = parseInt(value);
                  const issueDate = new Date(data.issueDate || new Date());
                  const dueDate = new Date(issueDate);
                  dueDate.setDate(dueDate.getDate() + days);
                  setValue("dueDate", dueDate.toISOString().split("T")[0], {
                    shouldDirty: true,
                    shouldValidate: true, // Ajout de la validation
                  });
                }}
                disabled={!canEdit}
                defaultValue="30"
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="30 jours" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TERMS_SUGGESTIONS.map((term) => (
                    <SelectItem key={term.value} value={term.value.toString()}>
                      {term.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {errors?.dueDate && (
              <p className="text-xs text-red-500">{errors.dueDate.message}</p>
            )}
            <p className="text-xs">
              Utilisez le sélecteur "+" pour ajouter des jours automatiquement
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
