"use client";

import {
  UserRoundPlusIcon,
  Search,
  Building,
  LoaderCircle,
  ExternalLink,
  Globe,
  Copy,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/src/lib/utils";
import { VALIDATION_PATTERNS, validateField } from "@/src/lib/validation";
import ClientActivity from "./ClientActivity";
import CustomFieldsForm from "./custom-fields-form";
import ClientContactsForm from "./client-contacts-form";

import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { Label } from "@/src/components/ui/label";
import { InputEmail, Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Badge } from "@/src/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { useForm, Controller } from "react-hook-form";
import { toast } from "@/src/components/ui/sonner";
import { useCreateClient, useUpdateClient } from "@/src/hooks/useClients";
import { useAddClientToLists } from "@/src/hooks/useClientLists";
import { useAddClientNote } from "@/src/graphql/clientQueries";
import { useQuery } from "@apollo/client";
import { GET_CLIENT } from "@/src/graphql/queries/clients";
import { useWorkspace } from "@/src/hooks/useWorkspace";

// Import API Gouv utilities
import { searchCompanies, convertCompanyToClient } from "@/src/utils/api-gouv";

export default function ClientsModal({
  client,
  onSave,
  open,
  onOpenChange,
  defaultListId = null,
  workspaceId = null,
}) {
  const [isMobile, setIsMobile] = useState(false);
  const { workspaceId: contextWorkspaceId } = useWorkspace();
  const finalWorkspaceId = workspaceId || contextWorkspaceId;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { createClient, loading: createLoading } = useCreateClient();
  const { updateClient, loading: updateLoading } = useUpdateClient();
  const { addToLists } = useAddClientToLists();
  const { addNote: addNoteToClient } = useAddClientNote(finalWorkspaceId);
  const isEditing = !!client;

  // Charger le client complet avec activity et notes quand on est en mode édition
  const { data: fullClientData, loading: loadingFullClient } = useQuery(
    GET_CLIENT,
    {
      variables: { workspaceId: finalWorkspaceId, id: client?.id },
      skip: !client?.id || !open, // Ne charger que si on a un client et que le modal est ouvert
      fetchPolicy: "network-only", // Toujours récupérer les dernières données
    }
  );

  // Utiliser le client complet si disponible, sinon utiliser le client passé en prop
  const fullClient = fullClientData?.client || client;

  const loading = createLoading || updateLoading || loadingFullClient;

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    trigger,
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange", // Validation en temps réel
    defaultValues: {
      type: "INDIVIDUAL",
      name: "",
      firstName: "",
      lastName: "",
      email: "",
      address: {
        street: "",
        city: "",
        postalCode: "",
        country: "",
      },
      shippingAddress: {
        fullName: "",
        street: "",
        city: "",
        postalCode: "",
        country: "",
      },
      siret: "",
      vatNumber: "",
      isInternational: false,
    },
  });

  const [hasDifferentShipping, setHasDifferentShipping] = useState(false);
  const [customErrors, setCustomErrors] = useState({});
  const [currentClient, setCurrentClient] = useState(client);
  const [pendingNotes, setPendingNotes] = useState([]);
  const [customFieldValues, setCustomFieldValues] = useState({});
  const [clientContacts, setClientContacts] = useState([]);
  const clientType = watch("type");
  const isInternational = watch("isInternational");

  // Initialiser les valeurs des champs personnalisés depuis le client existant
  useEffect(() => {
    if (fullClient?.customFields) {
      const values = {};
      fullClient.customFields.forEach((cf) => {
        values[cf.fieldId] = cf.value;
      });
      setCustomFieldValues(values);
    }
  }, [fullClient]);

  // Initialiser les contacts depuis le client existant
  useEffect(() => {
    if (fullClient?.contacts) {
      setClientContacts(fullClient.contacts);
    } else {
      setClientContacts([]);
    }
  }, [fullClient]);

  // Handler pour les changements de champs personnalisés
  const handleCustomFieldChange = (fieldId, value) => {
    setCustomFieldValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  // Mettre à jour currentClient quand fullClient change
  useEffect(() => {
    setCurrentClient(fullClient);
  }, [fullClient]);

  // Gestion des notes en attente (pour la création de client)
  const addPendingNote = (content) => {
    if (!content.trim()) return;

    setPendingNotes((prev) => [
      ...prev,
      {
        id: `pending-${Date.now()}-${Math.random()}`,
        content: content.trim(),
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const removePendingNote = (noteId) => {
    setPendingNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  const updatePendingNote = (noteId, newContent) => {
    setPendingNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, content: newContent } : n))
    );
  };

  // Fonction pour valider un champ avec le système de validation
  const validateClientField = (fieldName, value, isRequired = false) => {
    const validation = validateField(value, fieldName, isRequired);
    return validation.isValid ? undefined : validation.message;
  };

  // Fonction pour obtenir les règles de validation React Hook Form
  const getValidationRules = (fieldName, isRequired = false) => {
    const pattern = VALIDATION_PATTERNS[fieldName];
    const rules = {};

    if (isRequired) {
      rules.required = "Ce champ est requis";
    }

    if (pattern) {
      rules.pattern = {
        value: pattern.pattern,
        message: pattern.message,
      };
    }

    return rules;
  };

  // Règles de validation dynamiques pour SIRET (utilise validate pour évaluation dynamique)
  const siretValidationRules = {
    validate: (value) => {
      const currentIsInternational = watch("isInternational");
      if (!value || value.trim() === "") {
        return currentIsInternational
          ? "Le numéro d'identification est obligatoire"
          : "Le SIREN/SIRET est obligatoire";
      }
      // Pour les entreprises françaises, vérifier le format
      if (!currentIsInternational) {
        const siretRegex = /^\d{9}$|^\d{14}$/;
        if (!siretRegex.test(value)) {
          return "Le SIREN doit contenir 9 chiffres ou le SIRET 14 chiffres";
        }
      }
      return true;
    },
  };

  // Règles de validation dynamiques pour TVA (utilise validate pour évaluation dynamique)
  const vatValidationRules = {
    validate: (value) => {
      const currentIsInternational = watch("isInternational");
      // Pour les entreprises internationales, pas de validation
      if (currentIsInternational) {
        return true;
      }
      // Pour les entreprises françaises, vérifier le format si une valeur est fournie
      if (value && value.trim() !== "") {
        const vatRegex = /^[A-Z]{2}[0-9A-Z]{2,12}$/;
        if (!vatRegex.test(value)) {
          return "Format de numéro de TVA invalide (ex: FR12345678901)";
        }
      }
      return true;
    },
  };

  // Règles de validation dynamiques pour le code postal (format libre pour international)
  const postalCodeValidationRules = {
    validate: (value) => {
      if (!value || value.trim() === "") {
        return "Le code postal est obligatoire";
      }
      const currentIsInternational = watch("isInternational");
      // Pour les entreprises internationales, format libre (2-20 caractères alphanumériques)
      if (currentIsInternational) {
        if (value.length < 2 || value.length > 20) {
          return "Le code postal doit contenir entre 2 et 20 caractères";
        }
        return true;
      }
      // Pour la France, validation stricte du format
      const frenchPostalCodeRegex = /^(0[1-9]|[1-8]\d|9[0-8])\d{3}$/;
      if (!frenchPostalCodeRegex.test(value)) {
        return "Code postal français invalide (format: 01000 à 98999)";
      }
      return true;
    },
  };

  // Règles de validation pour le code postal de l'adresse de livraison
  const shippingPostalCodeValidationRules = {
    validate: (value) => {
      const hasDifferentShippingAddr = watch("hasDifferentShippingAddress");
      if (!hasDifferentShippingAddr) return true;
      if (!value || value.trim() === "") {
        return "Le code postal est obligatoire";
      }
      const currentIsInternational = watch("isInternational");
      if (currentIsInternational) {
        if (value.length < 2 || value.length > 20) {
          return "Le code postal doit contenir entre 2 et 20 caractères";
        }
        return true;
      }
      const frenchPostalCodeRegex = /^(0[1-9]|[1-8]\d|9[0-8])\d{3}$/;
      if (!frenchPostalCodeRegex.test(value)) {
        return "Code postal français invalide (format: 01000 à 98999)";
      }
      return true;
    },
  };

  // États pour la recherche d'entreprises via API Gouv
  const [companyQuery, setCompanyQuery] = useState("");
  const [debouncedCompanyQuery, setDebouncedCompanyQuery] = useState("");
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [showCompanySearch, setShowCompanySearch] = useState(false);

  // Mettre à jour le formulaire quand le client change
  useEffect(() => {
    if (fullClient) {
      reset({
        type: fullClient.type || "INDIVIDUAL",
        name: fullClient.name || "",
        firstName: fullClient.firstName || "",
        lastName: fullClient.lastName || "",
        email: fullClient.email || "",
        address: {
          street: fullClient.address?.street || "",
          city: fullClient.address?.city || "",
          postalCode: fullClient.address?.postalCode || "",
          country: fullClient.address?.country || "",
        },
        shippingAddress: {
          fullName: fullClient.shippingAddress?.fullName || "",
          street: fullClient.shippingAddress?.street || "",
          city: fullClient.shippingAddress?.city || "",
          postalCode: fullClient.shippingAddress?.postalCode || "",
          country: fullClient.shippingAddress?.country || "",
        },
        siret: fullClient.siret || "",
        vatNumber: fullClient.vatNumber || "",
        isInternational: fullClient.isInternational || false,
      });
      setHasDifferentShipping(fullClient.hasDifferentShippingAddress || false);
    } else if (open) {
      // Réinitialiser pour un nouveau client seulement si le modal est ouvert
      reset({
        type: "INDIVIDUAL",
        name: "",
        firstName: "",
        lastName: "",
        email: "",
        address: {
          street: "",
          city: "",
          postalCode: "",
          country: "",
        },
        shippingAddress: {
          fullName: "",
          street: "",
          city: "",
          postalCode: "",
          country: "",
        },
        siret: "",
        vatNumber: "",
        isInternational: false,
      });
      setHasDifferentShipping(false);
    }
  }, [fullClient, open, reset]);

  // Debounce company search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCompanyQuery(companyQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [companyQuery]);

  // Recherche d'entreprises via API Gouv Data
  useEffect(() => {
    if (!debouncedCompanyQuery || debouncedCompanyQuery.length < 2) {
      setCompanies([]);
      return;
    }

    const searchApiGouv = async () => {
      setLoadingCompanies(true);
      try {
        const results = await searchCompanies(debouncedCompanyQuery, 8);
        setCompanies(results);
      } catch (error) {
        toast.error("Erreur lors de la recherche d'entreprises");
        setCompanies([]);
      } finally {
        setLoadingCompanies(false);
      }
    };

    searchApiGouv();
  }, [debouncedCompanyQuery]);

  // Réinitialiser la recherche quand on change de type
  useEffect(() => {
    if (clientType !== "COMPANY") {
      setShowCompanySearch(false);
      setCompanyQuery("");
      setCompanies([]);
    }
  }, [clientType]);

  // Fonction pour calculer le numéro de TVA français à partir du SIREN
  const calculateFrenchVAT = (siren) => {
    if (!siren || siren.length !== 9) return "";
    const key = (12 + 3 * (parseInt(siren) % 97)) % 97;
    return `FR${key.toString().padStart(2, "0")}${siren}`;
  };

  // Fonction pour sélectionner une entreprise de l'API Gouv
  const handleCompanySelect = (company) => {
    try {
      // Convertir l'entreprise en format client
      const clientData = convertCompanyToClient(company);

      // Calculer le numéro de TVA automatiquement
      if (company.id) {
        clientData.vatNumber = calculateFrenchVAT(company.id);
      }

      // Remplir le formulaire avec les données de l'entreprise
      reset({
        type: "COMPANY",
        name: clientData.name,
        firstName: "",
        lastName: "",
        email: "", // À compléter manuellement
        address: clientData.address,
        shippingAddress: clientData.shippingAddress,
        siret: clientData.siret,
        vatNumber: clientData.vatNumber,
      });

      // Masquer la recherche et afficher le formulaire pré-rempli
      setShowCompanySearch(false);
      setCompanyQuery("");
      setCompanies([]);

      // Notification de succès
      toast.success(`Entreprise "${company.name}" importée avec succès`);
    } catch (error) {
      toast.error("Erreur lors de l'import de l'entreprise");
    }
  };

  const onSubmit = async (formData) => {
    try {
      // Validation finale avant soumission
      const hasFormErrors = Object.keys(errors).length > 0;
      const hasCustomErrors = Object.keys(customErrors).length > 0;

      if (hasFormErrors || hasCustomErrors) {
        toast.error(
          "Veuillez corriger les erreurs avant de soumettre le formulaire"
        );
        return;
      }

      // Convertir les champs personnalisés en format attendu par l'API
      const customFieldsArray = Object.entries(customFieldValues)
        .filter(([_, value]) => value !== undefined && value !== null && value !== "")
        .map(([fieldId, value]) => ({
          fieldId,
          // Convertir les valeurs en string pour l'API (les tableaux sont JSON stringifiés)
          value: Array.isArray(value) ? JSON.stringify(value) : String(value),
        }));

      // Préparer les contacts pour l'API (nettoyer les IDs temporaires)
      const contactsArray = clientContacts.map(contact => ({
        id: contact.id?.startsWith("temp-") ? undefined : contact.id,
        position: contact.position || "",
        firstName: contact.firstName || "",
        lastName: contact.lastName || "",
        email: contact.email || "",
        phone: contact.phone || "",
        isPrimary: contact.isPrimary || false,
      }));

      const clientData = {
        ...formData,
        hasDifferentShippingAddress: hasDifferentShipping,
        shippingAddress: hasDifferentShipping ? formData.shippingAddress : null,
        contacts: contactsArray,
        customFields: customFieldsArray,
      };

      let result;
      if (isEditing) {
        result = await updateClient(client.id, clientData);
      } else {
        result = await createClient(clientData);

        // Ajouter les notes en attente après la création du client
        if (result?.id && pendingNotes.length > 0) {
          try {
            for (const note of pendingNotes) {
              await addNoteToClient(result.id, note.content);
            }
            // Réinitialiser les notes en attente
            setPendingNotes([]);
          } catch (error) {
            console.error("Erreur lors de l'ajout des notes:", error);
          }
        }

        // Si un defaultListId est fourni, ajouter le contact à cette liste
        if (defaultListId && workspaceId && result?.id) {
          try {
            await addToLists(workspaceId, result.id, [defaultListId]);
          } catch (error) {
            console.error(
              "Erreur lors de l'ajout du contact à la liste:",
              error
            );
          }
        }
      }

      // Fermer le modal d'abord
      onOpenChange(false);

      // Appeler le callback avec le résultat
      if (onSave) {
        await onSave(result);
      }

      // La notification est déjà gérée par le hook useUpdateClient/useCreateClient
      // Réinitialiser complètement le formulaire avec les valeurs par défaut (seulement pour la création)
      if (!isEditing) {
        reset({
          type: "INDIVIDUAL",
          name: "",
          firstName: "",
          lastName: "",
          email: "",
          address: {
            street: "",
            city: "",
            postalCode: "",
            country: "",
          },
          shippingAddress: {
            fullName: "",
            street: "",
            city: "",
            postalCode: "",
            country: "",
          },
          siret: "",
          vatNumber: "",
          isInternational: false,
        });
      }
      setCustomErrors({});
      setHasDifferentShipping(false);
      setShowCompanySearch(false);
      setCompanyQuery("");
      setCompanies([]);
    } catch (error) {
      // La notification d'erreur est déjà gérée par le hook useCreateClient/useUpdateClient
      // Ne pas afficher de notification supplémentaire ici
      // Ne pas fermer le modal en cas d'erreur
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="hidden">
          Ajouter un collaborateur
        </Button>
      </DialogTrigger>
      <DialogContent
        className={`flex flex-col p-0 overflow-hidden ${
          isMobile
            ? "!fixed !inset-0 !w-screen !max-w-none !m-0 !rounded-none !translate-x-0 !translate-y-0"
            : "!max-w-[1400px] !w-[calc(100vw-4rem)] h-[calc(100vh-4rem)]"
        }`}
        style={isMobile ? { height: "100dvh", maxHeight: "100dvh" } : {}}
      >
        {!isMobile ? (
          // Mode desktop : 2 colonnes (création et édition)
          <div className="flex h-full">
            {/* Colonne gauche : Formulaire - 50% */}
            <div className="w-1/2 flex flex-col border-r">
              {/* Header */}
              <div className="flex-shrink-0 p-6 pb-4 border-b">
                <DialogHeader>
                  <DialogTitle className="text-left">
                    {client ? "Modifier le client" : "Ajouter un client"}
                  </DialogTitle>
                  <DialogDescription className="text-left">
                    {client
                      ? "Modifiez les informations du client"
                      : "Créez un nouveau client pour votre entreprise"}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col flex-1 min-h-0"
              >
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                  <div className="space-y-4">
                    {/* Type de client */}
                    <div className="space-y-2">
                      <Label className="font-normal">Type de client *</Label>
                      <Controller
                        name="type"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Sélectionnez le type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="INDIVIDUAL">
                                Particulier
                              </SelectItem>
                              <SelectItem value="COMPANY">
                                Entreprise
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    {/* Sélecteur de localisation (France / Hors France) - uniquement pour les entreprises */}
                    {clientType === "COMPANY" && (
                      <div className="space-y-2">
                        <Label className="font-normal">
                          Localisation de l'entreprise *
                        </Label>
                        <Controller
                          name="isInternational"
                          control={control}
                          render={({ field }) => (
                            <Select
                              value={field.value ? "international" : "france"}
                              onValueChange={(value) => {
                                field.onChange(value === "international");
                                if (value === "international") {
                                  setValue("siret", "");
                                  setValue("vatNumber", "");
                                }
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Sélectionnez la localisation" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="france">
                                  <div className="flex items-center gap-2">
                                    <span>🇫🇷</span>
                                    <span>France</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="international">
                                  <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4" />
                                    <span>Hors France</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {isInternational && (
                          <p className="text-xs text-muted-foreground">
                            Pour les entreprises hors France, les champs SIRET
                            et TVA sont optionnels et sans validation stricte.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Recherche d'entreprises via API Gouv Data - uniquement pour les entreprises françaises */}
                    {clientType === "COMPANY" &&
                      !isInternational &&
                      !showCompanySearch && (
                        <div className="space-y-3 p-4 border rounded-lg bg-[#5a50ff]/5 dark:bg-[#5a50ff]/10 border-[#5a50ff]/20 dark:border-[#5a50ff]/30">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center size-8 rounded-full bg-[#5a50ff]/10 dark:bg-[#5a50ff]/20">
                              <Building className="h-4 w-4 text-[#5a50ff] dark:text-[#5a50ff]" />
                            </div>
                            <span className="font-medium text-sm text-[#5a50ff] dark:text-[#5a50ff]">
                              Rechercher une entreprise
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Importez automatiquement les informations depuis la
                            base officielle
                          </p>
                          <Button
                            type="button"
                            onClick={() => setShowCompanySearch(true)}
                            className="w-full h-9 text-sm bg-[#5a50ff] hover:bg-[#5a50ff]/90 text-white dark:bg-[#5a50ff] dark:hover:bg-[#5a50ff]/90 dark:text-white"
                          >
                            <Search className="h-4 w-4 mr-2" />
                            Rechercher
                          </Button>
                        </div>
                      )}

                    {/* Interface de recherche d'entreprises */}
                    {clientType === "COMPANY" &&
                      !isInternational &&
                      showCompanySearch && (
                        <div className="space-y-4 p-4 border rounded-lg bg-[#5a50ff]/5 dark:bg-[#5a50ff]/10 border-[#5a50ff]/20 dark:border-[#5a50ff]/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center justify-center size-8 rounded-full bg-[#5a50ff]/10 dark:bg-[#5a50ff]/20">
                                <Building className="h-4 w-4 text-[#5a50ff] dark:text-[#5a50ff]" />
                              </div>
                              <Label className="font-medium text-[#5a50ff] dark:text-[#5a50ff]">
                                Rechercher une entreprise
                              </Label>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setShowCompanySearch(false);
                                setCompanyQuery("");
                                setCompanies([]);
                              }}
                              className="h-8 w-8 p-0 hover:bg-[#5a50ff]/10 dark:hover:bg-[#5a50ff]/20 text-[#5a50ff] dark:text-[#5a50ff] text-lg font-medium"
                            >
                              ×
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <div className="relative">
                              <Input
                                value={companyQuery}
                                onChange={(e) =>
                                  setCompanyQuery(e.target.value)
                                }
                                placeholder="Nom d'entreprise, SIRET, SIREN..."
                                className="h-9 text-sm pl-10"
                              />
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Recherchez une entreprise française via la base de
                              données officielle
                            </p>
                          </div>

                          {/* Résultats de recherche */}
                          {loadingCompanies && (
                            <div className="flex items-center justify-center p-6">
                              <LoaderCircle className="h-5 w-5 animate-spin mr-2" />
                              <span className="text-sm">
                                Recherche en cours...
                              </span>
                            </div>
                          )}

                          {companies.length > 0 && (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {companies.map((company) => (
                                <div
                                  key={company.id}
                                  className="p-3 border rounded-lg bg-white dark:bg-gray-800 hover:border-[#5a50ff] dark:hover:border-[#5a50ff] hover:shadow-sm cursor-pointer transition-all border-gray-200 dark:border-gray-700"
                                  onClick={() => handleCompanySelect(company)}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Building className="h-4 w-4 text-[#5a50ff] dark:text-[#5a50ff] flex-shrink-0" />
                                        <h4 className="font-medium text-sm truncate text-gray-900 dark:text-gray-100">
                                          {company.name}
                                        </h4>
                                        {company.status === "A" && (
                                          <Badge
                                            variant="outline"
                                            className="text-xs bg-[#5a50ff]/10 dark:bg-[#5a50ff]/20 text-[#5a50ff] dark:text-[#5a50ff] border-[#5a50ff]/20 dark:border-[#5a50ff]/30"
                                          >
                                            Active
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">
                                          <strong>SIRET:</strong>{" "}
                                          {company.siret}
                                        </p>
                                        {company.address && (
                                          <p className="text-xs text-muted-foreground truncate">
                                            <strong>Adresse:</strong>{" "}
                                            {company.address},{" "}
                                            {company.postalCode} {company.city}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <ExternalLink className="h-4 w-4 text-[#5a50ff]/50 dark:text-[#5a50ff]/60 flex-shrink-0 ml-2" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {companyQuery &&
                            !loadingCompanies &&
                            companies.length === 0 && (
                              <div className="text-center p-6 text-muted-foreground">
                                <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">
                                  Aucune entreprise trouvée pour "{companyQuery}
                                  "
                                </p>
                                <p className="text-xs mt-1">
                                  Essayez avec un nom d'entreprise ou un SIRET
                                </p>
                              </div>
                            )}

                          <div className="pt-2 border-t border-[#5a50ff]/10 dark:border-[#5a50ff]/20">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setShowCompanySearch(false);
                                setCompanyQuery("");
                                setCompanies([]);
                              }}
                              className="w-full h-9 text-sm border-[#5a50ff]/20 dark:border-[#5a50ff]/30 text-[#5a50ff] dark:text-[#5a50ff] hover:bg-[#5a50ff]/5 dark:hover:bg-[#5a50ff]/10"
                            >
                              Saisir manuellement
                            </Button>
                          </div>
                        </div>
                      )}

                    {/* Nom/Raison sociale */}
                    {/* Raison sociale uniquement pour les entreprises */}
                    {clientType === "COMPANY" && !showCompanySearch && (
                      <div className="space-y-2">
                        <Label className="font-normal">Raison sociale *</Label>
                        <Input
                          placeholder="Nom de l'entreprise"
                          className={cn(
                            errors.name && "border-red-500 focus:border-red-500"
                          )}
                          {...register(
                            "name",
                            getValidationRules("companyName", true)
                          )}
                        />
                        {errors.name && (
                          <p className="text-sm text-red-500">
                            {errors.name.message}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Prénom et Nom pour particuliers, Contact et Email pour entreprises */}
                    {clientType === "INDIVIDUAL" ? (
                      <div className="grid grid-cols-2 gap-4">
                        {/* Prénom */}
                        <div className="space-y-2">
                          <Label>Prénom *</Label>
                          <Input
                            placeholder="Prénom"
                            className={cn(
                              errors.firstName &&
                                "border-red-500 focus:border-red-500"
                            )}
                            {...register("firstName", {
                              required: "Le prénom est requis",
                              pattern: {
                                value: /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/,
                                message:
                                  "Le prénom doit contenir entre 2 et 50 caractères (lettres, espaces, apostrophes et tirets uniquement)",
                              },
                            })}
                          />
                          {errors.firstName && (
                            <p className="text-sm text-red-500">
                              {errors.firstName.message}
                            </p>
                          )}
                        </div>

                        {/* Nom de famille */}
                        <div className="space-y-2">
                          <Label className="font-normal">Nom *</Label>
                          <Input
                            placeholder="Nom"
                            className={cn(
                              errors.lastName &&
                                "border-red-500 focus:border-red-500"
                            )}
                            {...register("lastName", {
                              required: "Le nom est requis",
                              pattern: {
                                value: /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/,
                                message:
                                  "Le nom doit contenir entre 2 et 50 caractères (lettres, espaces, apostrophes et tirets uniquement)",
                              },
                            })}
                          />
                          {errors.lastName && (
                            <p className="text-sm text-red-500">
                              {errors.lastName.message}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {/* Contact principal pour entreprises */}
                        <div className="space-y-2">
                          <Label className="font-normal">Contact principal</Label>
                          <Input
                            placeholder="Nom du contact"
                            className={cn(
                              errors.firstName &&
                                "border-red-500 focus:border-red-500"
                            )}
                            {...register("firstName", {
                              pattern: {
                                value: /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/,
                                message:
                                  "Le nom du contact doit contenir entre 2 et 50 caractères (lettres, espaces, apostrophes et tirets uniquement)",
                              },
                            })}
                          />
                          {errors.firstName && (
                            <p className="text-sm text-red-500">
                              {errors.firstName.message}
                            </p>
                          )}
                        </div>

                        {/* Email (pour tous les types) */}
                        <div className="space-y-2">
                          <Label className="font-normal">Email *</Label>
                          <div className="relative">
                            <InputEmail
                              placeholder="contact@entreprise.com"
                              className={cn(
                                "pr-10",
                                errors.email &&
                                  "border-red-500 focus:border-red-500"
                              )}
                              {...register(
                                "email",
                                getValidationRules("email", true)
                              )}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                              onClick={() => {
                                const email = watch("email");
                                if (email) {
                                  navigator.clipboard.writeText(email);
                                  toast.success("Email copié");
                                }
                              }}
                            >
                              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </div>
                          {errors.email && (
                            <p className="text-sm text-red-500">
                              {errors.email.message}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Email pour particuliers (ligne séparée) */}
                    {clientType === "INDIVIDUAL" && (
                      <div className="space-y-2">
                        <Label className="font-normal">Email *</Label>
                        <div className="relative">
                          <InputEmail
                            placeholder="client@exemple.com"
                            className={cn(
                              "pr-10",
                              errors.email &&
                                "border-red-500 focus:border-red-500"
                            )}
                            {...register(
                              "email",
                              getValidationRules("email", true)
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                            onClick={() => {
                              const email = watch("email");
                              if (email) {
                                navigator.clipboard.writeText(email);
                                toast.success("Email copié");
                              }
                            }}
                          >
                            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                        {errors.email && (
                          <p className="text-sm text-red-500">
                            {errors.email.message}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Adresse de facturation */}
                    <div className="space-y-3 py-2">
                      <div className="space-y-2">
                        <Label className="font-normal">
                          Adresse de facturation
                        </Label>
                        <Textarea
                          placeholder="123 Rue de la Paix"
                          className={cn(
                            errors.address?.street &&
                              "border-red-500 focus:border-red-500"
                          )}
                          {...register(
                            "address.street",
                            getValidationRules("street", true)
                          )}
                          rows={2}
                        />
                        {errors.address?.street && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors.address.street.message}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-normal">Ville</Label>
                          <Input
                            placeholder="Paris"
                            className={cn(
                              errors.address?.city &&
                                "border-red-500 focus:border-red-500"
                            )}
                            {...register(
                              "address.city",
                              getValidationRules("city", true)
                            )}
                          />
                          {errors.address?.city && (
                            <p className="text-sm text-red-500">
                              {errors.address.city.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="font-normal">Code postal</Label>
                          <Input
                            placeholder={
                              isInternational
                                ? "Ex: SW1A 1AA, 10001..."
                                : "75001"
                            }
                            className={cn(
                              errors.address?.postalCode &&
                                "border-red-500 focus:border-red-500"
                            )}
                            {...register(
                              "address.postalCode",
                              postalCodeValidationRules
                            )}
                          />
                          {errors.address?.postalCode && (
                            <p className="text-sm text-red-500">
                              {errors.address.postalCode.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="font-normal">Pays</Label>
                        <Input
                          placeholder="France"
                          className={cn(
                            errors.address?.country &&
                              "border-red-500 focus:border-red-500"
                          )}
                          {...register(
                            "address.country",
                            getValidationRules("country", true)
                          )}
                        />
                        {errors.address?.country && (
                          <p className="text-sm text-red-500">
                            {errors.address.country.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Adresse de livraison différente */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="differentShipping"
                        checked={hasDifferentShipping}
                        onCheckedChange={setHasDifferentShipping}
                      />
                      <Label
                        htmlFor="differentShipping"
                        className="font-normal"
                      >
                        Adresse de livraison différente
                      </Label>
                    </div>

                    {/* Adresse de livraison */}
                    {hasDifferentShipping && (
                      <div className="space-y-3 border-l-2 border-gray-200 pl-4">
                        <div className="space-y-2">
                          <Label className="font-normal">Adresse</Label>
                          <Textarea
                            placeholder="123 Rue de la Livraison"
                            className={cn(
                              errors.shippingAddress?.street &&
                                "border-red-500 focus:border-red-500"
                            )}
                            {...register(
                              "shippingAddress.street",
                              getValidationRules("street", hasDifferentShipping)
                            )}
                            rows={2}
                          />
                          {errors.shippingAddress?.street && (
                            <p className="text-sm text-red-500 mt-1">
                              {errors.shippingAddress.street.message}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="font-normal">Ville</Label>
                            <Input
                              placeholder="Paris"
                              className={cn(
                                errors.shippingAddress?.city &&
                                  "border-red-500 focus:border-red-500"
                              )}
                              {...register(
                                "shippingAddress.city",
                                getValidationRules("city", hasDifferentShipping)
                              )}
                            />
                            {errors.shippingAddress?.city && (
                              <p className="text-sm text-red-500">
                                {errors.shippingAddress.city.message}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label className="font-normal">Code postal</Label>
                            <Input
                              placeholder={
                                isInternational
                                  ? "Ex: SW1A 1AA, 10001..."
                                  : "75001"
                              }
                              className={cn(
                                errors.shippingAddress?.postalCode &&
                                  "border-red-500 focus:border-red-500"
                              )}
                              {...register(
                                "shippingAddress.postalCode",
                                shippingPostalCodeValidationRules
                              )}
                            />
                            {errors.shippingAddress?.postalCode && (
                              <p className="text-sm text-red-500">
                                {errors.shippingAddress.postalCode.message}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="font-normal">Pays</Label>
                          <Input
                            placeholder="France"
                            className={cn(
                              errors.shippingAddress?.country &&
                                "border-red-500 focus:border-red-500"
                            )}
                            {...register(
                              "shippingAddress.country",
                              getValidationRules(
                                "country",
                                hasDifferentShipping
                              )
                            )}
                          />
                          {errors.shippingAddress?.country && (
                            <p className="text-sm text-red-500">
                              {errors.shippingAddress.country.message}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Informations entreprise (pour les entreprises) */}
                    {clientType === "COMPANY" && (
                      <div className="space-y-3 border-t pt-4">
                        {/* <Label className="text-base font-normal">
                          Informations entreprise
                        </Label> */}

                        <div className="space-y-2">
                          <Label className="font-normal">
                            {isInternational
                              ? "Numéro d'identification"
                              : "SIREN/SIRET"}{" "}
                            *
                          </Label>
                          <Input
                            placeholder={
                              isInternational
                                ? "Numéro d'identification (ex: VAT, EIN, etc.)"
                                : "123456789 ou 12345678901234"
                            }
                            className={cn(
                              errors.siret &&
                                "border-red-500 focus:border-red-500"
                            )}
                            {...register("siret", siretValidationRules)}
                          />
                          {errors.siret && (
                            <p className="text-sm text-red-500">
                              {errors.siret.message}
                            </p>
                          )}
                          {isInternational && (
                            <p className="text-xs text-muted-foreground">
                              Numéro d'identification fiscale ou équivalent
                              local (ex: VAT, EIN, etc.)
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="font-normal">Numéro de TVA</Label>
                          <Input
                            placeholder={
                              isInternational
                                ? "Numéro de TVA (format libre)"
                                : "FR12345678901"
                            }
                            className={cn(
                              errors.vatNumber &&
                                "border-red-500 focus:border-red-500"
                            )}
                            {...register("vatNumber", vatValidationRules)}
                          />
                          {errors.vatNumber && (
                            <p className="text-sm text-red-500">
                              {errors.vatNumber.message}
                            </p>
                          )}
                          {isInternational && (
                            <p className="text-xs text-muted-foreground">
                              Optionnel - Format libre pour les entreprises hors
                              UE
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Contacts additionnels - uniquement pour les entreprises */}
                    {clientType === "COMPANY" && (
                      <ClientContactsForm
                        contacts={clientContacts}
                        onChange={setClientContacts}
                      />
                    )}

                    {/* Champs personnalisés */}
                    <CustomFieldsForm
                      values={customFieldValues}
                      onChange={handleCustomFieldChange}
                      errors={{}}
                    />
                  </div>
                </div>

                {/* Footer dans le flux flex - s'adapte automatiquement à Safari */}
                <div
                  className="flex-shrink-0 flex gap-3 px-6 border-t bg-background"
                  style={{
                    paddingTop: "1rem",
                    paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
                  }}
                >
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      loading ||
                      Object.keys(errors).length > 0 ||
                      Object.keys(customErrors).length > 0
                    }
                    className="flex-1"
                  >
                    {loading
                      ? "Enregistrement..."
                      : client
                        ? "Modifier"
                        : "Créer un contact"}
                  </Button>
                </div>
              </form>
            </div>

            {/* Colonne droite : Timeline d'activité - 50% */}
            <div className="w-1/2 flex flex-col bg-muted/30">
              <div className="flex-shrink-0 px-6 py-4 border-b bg-background">
                <h3 className="font-semibold text-sm">Activité</h3>
              </div>
              <div className="flex-1 overflow-hidden">
                <ClientActivity
                  client={currentClient}
                  workspaceId={workspaceId}
                  onClientUpdate={setCurrentClient}
                  pendingNotes={pendingNotes}
                  onAddPendingNote={addPendingNote}
                  onUpdatePendingNote={updatePendingNote}
                  onRemovePendingNote={removePendingNote}
                  isCreating={!isEditing}
                />
              </div>
            </div>
          </div>
        ) : (
          // Mode mobile : Onglets (création et édition)
          <Tabs defaultValue="form" className="flex flex-col h-full gap-0">
            <div className="flex-shrink-0 p-6 pb-4 border-b">
              <DialogHeader>
                <DialogTitle className="text-left">
                  {client ? "Modifier le client" : "Ajouter un client"}
                </DialogTitle>
                <DialogDescription className="text-left">
                  {client
                    ? "Modifiez les informations du client"
                    : "Créez un nouveau client pour votre entreprise"}
                </DialogDescription>
              </DialogHeader>
            </div>

            <TabsList className="flex-shrink-0 grid w-full grid-cols-2 rounded-none border-b py-1.5 px-4">
              <TabsTrigger value="form" className="py-2 text-sm">
                Formulaire
              </TabsTrigger>
              <TabsTrigger value="activity" className="py-2 text-sm">
                Activité
              </TabsTrigger>
            </TabsList>

            <TabsContent value="form" className="flex-1 overflow-hidden m-0">
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col h-full"
              >
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                  <div className="space-y-4">
                    {/* Type de client */}
                    <div className="space-y-2">
                      <Label className="font-normal">Type de client *</Label>
                      <Controller
                        name="type"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Sélectionnez le type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="INDIVIDUAL">
                                Particulier
                              </SelectItem>
                              <SelectItem value="COMPANY">
                                Entreprise
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    {/* Sélecteur de localisation (France / Hors France) - uniquement pour les entreprises */}
                    {clientType === "COMPANY" && (
                      <div className="space-y-2">
                        <Label className="font-normal">
                          Localisation de l'entreprise *
                        </Label>
                        <Controller
                          name="isInternational"
                          control={control}
                          render={({ field }) => (
                            <Select
                              value={field.value ? "international" : "france"}
                              onValueChange={(value) => {
                                field.onChange(value === "international");
                                if (value === "international") {
                                  setValue("siret", "");
                                  setValue("vatNumber", "");
                                }
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Sélectionnez la localisation" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="france">
                                  <div className="flex items-center gap-2">
                                    <span>🇫🇷</span>
                                    <span>France</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="international">
                                  <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4" />
                                    <span>Hors France</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {isInternational && (
                          <p className="text-xs text-muted-foreground">
                            Pour les entreprises hors France, les champs SIRET
                            et TVA sont optionnels et sans validation stricte.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Recherche d'entreprises via API Gouv Data - uniquement pour les entreprises françaises */}
                    {clientType === "COMPANY" &&
                      !isInternational &&
                      !showCompanySearch && (
                        <div className="space-y-3 p-4 border rounded-lg bg-[#5a50ff]/5 dark:bg-[#5a50ff]/10 border-[#5a50ff]/20 dark:border-[#5a50ff]/30">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center size-8 rounded-full bg-[#5a50ff]/10 dark:bg-[#5a50ff]/20">
                              <Building className="h-4 w-4 text-[#5a50ff] dark:text-[#5a50ff]" />
                            </div>
                            <span className="font-medium text-sm text-[#5a50ff] dark:text-[#5a50ff]">
                              Rechercher une entreprise
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Importez automatiquement les informations depuis la
                            base officielle
                          </p>
                          <Button
                            type="button"
                            onClick={() => setShowCompanySearch(true)}
                            className="w-full h-9 text-sm bg-[#5a50ff] hover:bg-[#5a50ff]/90 text-white dark:bg-[#5a50ff] dark:hover:bg-[#5a50ff]/90 dark:text-white"
                          >
                            <Search className="h-4 w-4 mr-2" />
                            Rechercher
                          </Button>
                        </div>
                      )}

                    {/* Interface de recherche d'entreprises */}
                    {clientType === "COMPANY" &&
                      !isInternational &&
                      showCompanySearch && (
                        <div className="space-y-4 p-4 border rounded-lg bg-[#5a50ff]/5 dark:bg-[#5a50ff]/10 border-[#5a50ff]/20 dark:border-[#5a50ff]/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center justify-center size-8 rounded-full bg-[#5a50ff]/10 dark:bg-[#5a50ff]/20">
                                <Building className="h-4 w-4 text-[#5a50ff] dark:text-[#5a50ff]" />
                              </div>
                              <Label className="font-medium text-[#5a50ff] dark:text-[#5a50ff]">
                                Rechercher une entreprise
                              </Label>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setShowCompanySearch(false);
                                setCompanyQuery("");
                                setCompanies([]);
                              }}
                              className="h-8 w-8 p-0 hover:bg-[#5a50ff]/10 dark:hover:bg-[#5a50ff]/20 text-[#5a50ff] dark:text-[#5a50ff] text-lg font-medium"
                            >
                              ×
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <div className="relative">
                              <Input
                                value={companyQuery}
                                onChange={(e) =>
                                  setCompanyQuery(e.target.value)
                                }
                                placeholder="Nom d'entreprise, SIRET, SIREN..."
                                className="h-9 text-sm pl-10"
                              />
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Recherchez une entreprise française via la base de
                              données officielle
                            </p>
                          </div>

                          {/* Résultats de recherche */}
                          {loadingCompanies && (
                            <div className="flex items-center justify-center p-6">
                              <LoaderCircle className="h-5 w-5 animate-spin mr-2" />
                              <span className="text-sm">
                                Recherche en cours...
                              </span>
                            </div>
                          )}

                          {companies.length > 0 && (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {companies.map((company) => (
                                <div
                                  key={company.id}
                                  className="p-3 border rounded-lg bg-white dark:bg-gray-800 hover:border-[#5a50ff] dark:hover:border-[#5a50ff] hover:shadow-sm cursor-pointer transition-all border-gray-200 dark:border-gray-700"
                                  onClick={() => handleCompanySelect(company)}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Building className="h-4 w-4 text-[#5a50ff] dark:text-[#5a50ff] flex-shrink-0" />
                                        <h4 className="font-medium text-sm truncate text-gray-900 dark:text-gray-100">
                                          {company.name}
                                        </h4>
                                        {company.status === "A" && (
                                          <Badge
                                            variant="outline"
                                            className="text-xs bg-[#5a50ff]/10 dark:bg-[#5a50ff]/20 text-[#5a50ff] dark:text-[#5a50ff] border-[#5a50ff]/20 dark:border-[#5a50ff]/30"
                                          >
                                            Active
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">
                                          <strong>SIRET:</strong>{" "}
                                          {company.siret}
                                        </p>
                                        {company.address && (
                                          <p className="text-xs text-muted-foreground truncate">
                                            <strong>Adresse:</strong>{" "}
                                            {company.address},{" "}
                                            {company.postalCode} {company.city}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <ExternalLink className="h-4 w-4 text-[#5a50ff]/50 dark:text-[#5a50ff]/60 flex-shrink-0 ml-2" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {companyQuery &&
                            !loadingCompanies &&
                            companies.length === 0 && (
                              <div className="text-center p-6 text-muted-foreground">
                                <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">
                                  Aucune entreprise trouvée pour "{companyQuery}
                                  "
                                </p>
                                <p className="text-xs mt-1">
                                  Essayez avec un nom d'entreprise ou un SIRET
                                </p>
                              </div>
                            )}

                          <div className="pt-2 border-t border-[#5a50ff]/10 dark:border-[#5a50ff]/20">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setShowCompanySearch(false);
                                setCompanyQuery("");
                                setCompanies([]);
                              }}
                              className="w-full h-9 text-sm border-[#5a50ff]/20 dark:border-[#5a50ff]/30 text-[#5a50ff] dark:text-[#5a50ff] hover:bg-[#5a50ff]/5 dark:hover:bg-[#5a50ff]/10"
                            >
                              Saisir manuellement
                            </Button>
                          </div>
                        </div>
                      )}

                    {/* Nom/Raison sociale */}
                    {/* Raison sociale uniquement pour les entreprises */}
                    {clientType === "COMPANY" && !showCompanySearch && (
                      <div className="space-y-2">
                        <Label className="font-normal">Raison sociale *</Label>
                        <Input
                          placeholder="Nom de l'entreprise"
                          className={cn(
                            errors.name && "border-red-500 focus:border-red-500"
                          )}
                          {...register(
                            "name",
                            getValidationRules("companyName", true)
                          )}
                        />
                        {errors.name && (
                          <p className="text-sm text-red-500">
                            {errors.name.message}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Prénom et Nom pour particuliers, Contact et Email pour entreprises */}
                    {clientType === "INDIVIDUAL" ? (
                      <div className="grid grid-cols-2 gap-4">
                        {/* Prénom */}
                        <div className="space-y-2">
                          <Label>Prénom *</Label>
                          <Input
                            placeholder="Prénom"
                            className={cn(
                              errors.firstName &&
                                "border-red-500 focus:border-red-500"
                            )}
                            {...register("firstName", {
                              required: "Le prénom est requis",
                              pattern: {
                                value: /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/,
                                message:
                                  "Le prénom doit contenir entre 2 et 50 caractères (lettres, espaces, apostrophes et tirets uniquement)",
                              },
                            })}
                          />
                          {errors.firstName && (
                            <p className="text-sm text-red-500">
                              {errors.firstName.message}
                            </p>
                          )}
                        </div>

                        {/* Nom de famille */}
                        <div className="space-y-2">
                          <Label className="font-normal">Nom *</Label>
                          <Input
                            placeholder="Nom"
                            className={cn(
                              errors.lastName &&
                                "border-red-500 focus:border-red-500"
                            )}
                            {...register("lastName", {
                              required: "Le nom est requis",
                              pattern: {
                                value: /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/,
                                message:
                                  "Le nom doit contenir entre 2 et 50 caractères (lettres, espaces, apostrophes et tirets uniquement)",
                              },
                            })}
                          />
                          {errors.lastName && (
                            <p className="text-sm text-red-500">
                              {errors.lastName.message}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {/* Contact principal pour entreprises */}
                        <div className="space-y-2">
                          <Label className="font-normal">Contact principal</Label>
                          <Input
                            placeholder="Nom du contact"
                            className={cn(
                              errors.firstName &&
                                "border-red-500 focus:border-red-500"
                            )}
                            {...register("firstName", {
                              pattern: {
                                value: /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/,
                                message:
                                  "Le nom du contact doit contenir entre 2 et 50 caractères (lettres, espaces, apostrophes et tirets uniquement)",
                              },
                            })}
                          />
                          {errors.firstName && (
                            <p className="text-sm text-red-500">
                              {errors.firstName.message}
                            </p>
                          )}
                        </div>

                        {/* Email (pour tous les types) */}
                        <div className="space-y-2">
                          <Label className="font-normal">Email *</Label>
                          <div className="relative">
                            <InputEmail
                              placeholder="contact@entreprise.com"
                              className={cn(
                                "pr-10",
                                errors.email &&
                                  "border-red-500 focus:border-red-500"
                              )}
                              {...register(
                                "email",
                                getValidationRules("email", true)
                              )}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                              onClick={() => {
                                const email = watch("email");
                                if (email) {
                                  navigator.clipboard.writeText(email);
                                  toast.success("Email copié");
                                }
                              }}
                            >
                              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </div>
                          {errors.email && (
                            <p className="text-sm text-red-500">
                              {errors.email.message}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Email pour particuliers (ligne séparée) */}
                    {clientType === "INDIVIDUAL" && (
                      <div className="space-y-2">
                        <Label className="font-normal">Email *</Label>
                        <div className="relative">
                          <InputEmail
                            placeholder="client@exemple.com"
                            className={cn(
                              "pr-10",
                              errors.email &&
                                "border-red-500 focus:border-red-500"
                            )}
                            {...register(
                              "email",
                              getValidationRules("email", true)
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                            onClick={() => {
                              const email = watch("email");
                              if (email) {
                                navigator.clipboard.writeText(email);
                                toast.success("Email copié");
                              }
                            }}
                          >
                            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                        {errors.email && (
                          <p className="text-sm text-red-500">
                            {errors.email.message}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Adresse de facturation */}
                    <div className="space-y-3 py-2">
                      <div className="space-y-2">
                        <Label className="font-normal">
                          Adresse de facturation
                        </Label>
                        <Textarea
                          placeholder="123 Rue de la Paix"
                          className={cn(
                            errors.address?.street &&
                              "border-red-500 focus:border-red-500"
                          )}
                          {...register(
                            "address.street",
                            getValidationRules("street", true)
                          )}
                          rows={2}
                        />
                        {errors.address?.street && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors.address.street.message}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-normal">Ville</Label>
                          <Input
                            placeholder="Paris"
                            className={cn(
                              errors.address?.city &&
                                "border-red-500 focus:border-red-500"
                            )}
                            {...register(
                              "address.city",
                              getValidationRules("city", true)
                            )}
                          />
                          {errors.address?.city && (
                            <p className="text-sm text-red-500">
                              {errors.address.city.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="font-normal">Code postal</Label>
                          <Input
                            placeholder={
                              isInternational
                                ? "Ex: SW1A 1AA, 10001..."
                                : "75001"
                            }
                            className={cn(
                              errors.address?.postalCode &&
                                "border-red-500 focus:border-red-500"
                            )}
                            {...register(
                              "address.postalCode",
                              postalCodeValidationRules
                            )}
                          />
                          {errors.address?.postalCode && (
                            <p className="text-sm text-red-500">
                              {errors.address.postalCode.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="font-normal">Pays</Label>
                        <Input
                          placeholder="France"
                          className={cn(
                            errors.address?.country &&
                              "border-red-500 focus:border-red-500"
                          )}
                          {...register(
                            "address.country",
                            getValidationRules("country", true)
                          )}
                        />
                        {errors.address?.country && (
                          <p className="text-sm text-red-500">
                            {errors.address.country.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Adresse de livraison différente */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="differentShipping"
                        checked={hasDifferentShipping}
                        onCheckedChange={setHasDifferentShipping}
                      />
                      <Label
                        htmlFor="differentShipping"
                        className="font-normal"
                      >
                        Adresse de livraison différente
                      </Label>
                    </div>

                    {/* Adresse de livraison */}
                    {hasDifferentShipping && (
                      <div className="space-y-3 border-l-2 border-gray-200 pl-4">
                        <div className="space-y-2">
                          <Label className="font-normal">Adresse</Label>
                          <Textarea
                            placeholder="123 Rue de la Livraison"
                            className={cn(
                              errors.shippingAddress?.street &&
                                "border-red-500 focus:border-red-500"
                            )}
                            {...register(
                              "shippingAddress.street",
                              getValidationRules("street", hasDifferentShipping)
                            )}
                            rows={2}
                          />
                          {errors.shippingAddress?.street && (
                            <p className="text-sm text-red-500 mt-1">
                              {errors.shippingAddress.street.message}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="font-normal">Ville</Label>
                            <Input
                              placeholder="Paris"
                              className={cn(
                                errors.shippingAddress?.city &&
                                  "border-red-500 focus:border-red-500"
                              )}
                              {...register(
                                "shippingAddress.city",
                                getValidationRules("city", hasDifferentShipping)
                              )}
                            />
                            {errors.shippingAddress?.city && (
                              <p className="text-sm text-red-500">
                                {errors.shippingAddress.city.message}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label className="font-normal">Code postal</Label>
                            <Input
                              placeholder={
                                isInternational
                                  ? "Ex: SW1A 1AA, 10001..."
                                  : "75001"
                              }
                              className={cn(
                                errors.shippingAddress?.postalCode &&
                                  "border-red-500 focus:border-red-500"
                              )}
                              {...register(
                                "shippingAddress.postalCode",
                                shippingPostalCodeValidationRules
                              )}
                            />
                            {errors.shippingAddress?.postalCode && (
                              <p className="text-sm text-red-500">
                                {errors.shippingAddress.postalCode.message}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="font-normal">Pays</Label>
                          <Input
                            placeholder="France"
                            className={cn(
                              errors.shippingAddress?.country &&
                                "border-red-500 focus:border-red-500"
                            )}
                            {...register(
                              "shippingAddress.country",
                              getValidationRules(
                                "country",
                                hasDifferentShipping
                              )
                            )}
                          />
                          {errors.shippingAddress?.country && (
                            <p className="text-sm text-red-500">
                              {errors.shippingAddress.country.message}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Informations entreprise (pour les entreprises) */}
                    {clientType === "COMPANY" && (
                      <div className="space-y-3 border-t pt-4">
                        <Label className="text-base font-normal">
                          Informations entreprise
                        </Label>

                        <div className="space-y-2">
                          <Label className="font-normal">
                            {isInternational
                              ? "Numéro d'identification"
                              : "SIREN/SIRET"}{" "}
                            *
                          </Label>
                          <Input
                            placeholder={
                              isInternational
                                ? "Numéro d'identification (ex: VAT, EIN, etc.)"
                                : "123456789 ou 12345678901234"
                            }
                            className={cn(
                              errors.siret &&
                                "border-red-500 focus:border-red-500"
                            )}
                            {...register("siret", siretValidationRules)}
                          />
                          {errors.siret && (
                            <p className="text-sm text-red-500">
                              {errors.siret.message}
                            </p>
                          )}
                          {isInternational && (
                            <p className="text-xs text-muted-foreground">
                              Numéro d'identification fiscale ou équivalent
                              local (ex: VAT, EIN, etc.)
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="font-normal">Numéro de TVA</Label>
                          <Input
                            placeholder={
                              isInternational
                                ? "Numéro de TVA (format libre)"
                                : "FR12345678901"
                            }
                            className={cn(
                              errors.vatNumber &&
                                "border-red-500 focus:border-red-500"
                            )}
                            {...register("vatNumber", vatValidationRules)}
                          />
                          {errors.vatNumber && (
                            <p className="text-sm text-red-500">
                              {errors.vatNumber.message}
                            </p>
                          )}
                          {isInternational && (
                            <p className="text-xs text-muted-foreground">
                              Optionnel - Format libre pour les entreprises hors
                              UE
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Contacts additionnels - uniquement pour les entreprises */}
                    {clientType === "COMPANY" && (
                      <ClientContactsForm
                        contacts={clientContacts}
                        onChange={setClientContacts}
                      />
                    )}

                    {/* Champs personnalisés */}
                    <CustomFieldsForm
                      values={customFieldValues}
                      onChange={handleCustomFieldChange}
                      errors={{}}
                    />
                  </div>
                </div>

                <div
                  className="flex-shrink-0 flex gap-3 px-6 border-t bg-background"
                  style={{
                    paddingTop: "1rem",
                    paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
                  }}
                >
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      loading ||
                      Object.keys(errors).length > 0 ||
                      Object.keys(customErrors).length > 0
                    }
                    className="flex-1"
                  >
                    {loading
                      ? "Enregistrement..."
                      : client
                        ? "Modifier"
                        : "Créer un contact"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent
              value="activity"
              className="flex-1 overflow-hidden m-0"
            >
              <ClientActivity
                client={currentClient}
                workspaceId={workspaceId}
                onClientUpdate={setCurrentClient}
                pendingNotes={pendingNotes}
                onAddPendingNote={addPendingNote}
                onUpdatePendingNote={updatePendingNote}
                onRemovePendingNote={removePendingNote}
                isCreating={!isEditing}
              />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
