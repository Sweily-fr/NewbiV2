"use client";

import {
  UserRoundPlusIcon,
  Search,
  Building,
  LoaderCircle,
  ExternalLink,
  Globe,
  Copy,
  Bell,
  X,
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
import { Input } from "@/src/components/ui/input";
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
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
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
            : "!max-w-[700px] !w-[calc(100vw-4rem)] !max-h-[calc(100vh-4rem)]"
        }`}
        style={isMobile ? { height: "100dvh", maxHeight: "100dvh" } : {}}
      >
        {!isMobile ? (
          // Mode desktop : formulaire seul
          <div className="flex flex-col max-h-[calc(100vh-4rem)] overflow-hidden">
            <div className="flex flex-col flex-1 min-h-0">
              {/* Header */}
              <div className="flex-shrink-0 p-6 pb-4">
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
                    {/* Type de client + Localisation côte à côte */}
                    <div className="flex items-start gap-3">
                      <div className={cn("space-y-2", clientType === "COMPANY" ? "flex-1" : "w-full")}>
                        <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Type de client *</Label>
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

                      {clientType === "COMPANY" && (
                        <div className="flex-1 space-y-2">
                          <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">
                            Localisation *
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
                                  <SelectValue placeholder="Localisation" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="france">
                                    <span className="flex items-center gap-2">
                                      <span>🇫🇷</span>
                                      <span>France</span>
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="international">
                                    <span className="flex items-center gap-2">
                                      <Globe className="h-3.5 w-3.5" />
                                      <span>Hors France</span>
                                    </span>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                      )}
                    </div>

                    {clientType === "COMPANY" && isInternational && (
                      <p className="text-xs text-muted-foreground">
                        Pour les entreprises hors France, les champs SIRET
                        et TVA sont optionnels et sans validation stricte.
                      </p>
                    )}

                    {/* Recherche d'entreprises — inline search */}
                    {clientType === "COMPANY" && !isInternational && (
                      <div className="relative">
                        <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55 mb-2 block">
                          Importer depuis la base officielle
                        </Label>
                        <div
                          className={cn(
                            "flex items-center gap-2.5 px-2.5 h-8 rounded-[9px] transition-[border] duration-[80ms] ease-in-out",
                            "border border-[#e6e7ea] bg-transparent hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A]"
                          )}
                        >
                          <Search className="size-3.5 text-muted-foreground shrink-0" />
                          <Input
                            variant="ghost"
                            value={companyQuery}
                            onChange={(e) => setCompanyQuery(e.target.value)}
                            placeholder="Nom d'entreprise, SIRET, SIREN..."
                          />
                          {companyQuery && (
                            <button
                              type="button"
                              onClick={() => {
                                setCompanyQuery("");
                                setCompanies([]);
                              }}
                              className="shrink-0 cursor-pointer"
                            >
                              <X className="size-3 text-muted-foreground hover:text-foreground transition-colors" />
                            </button>
                          )}
                        </div>

                        {/* Dropdown results */}
                        {companyQuery.length >= 2 && (
                          <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-[#e6e7ea] dark:border-[#2E2E32] bg-popover shadow-md overflow-hidden">
                            <div className="max-h-[320px] overflow-y-auto p-1">
                              {loadingCompanies ? (
                                <div className="flex items-center justify-center gap-2 p-4">
                                  <LoaderCircle className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">
                                    Recherche...
                                  </span>
                                </div>
                              ) : companies.length > 0 ? (
                                companies.map((company) => (
                                  <button
                                    key={company.id}
                                    type="button"
                                    onClick={() => handleCompanySelect(company)}
                                    className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left outline-none cursor-pointer transition-colors hover:bg-accent"
                                  >
                                    <Building className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium -tracking-[0.01em] truncate">
                                          {company.name}
                                        </span>
                                        {company.status === "A" && (
                                          <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-full shrink-0">
                                            Active
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground truncate">
                                        SIRET: {company.siret}
                                        {company.city &&
                                          ` · ${company.postalCode} ${company.city}`}
                                      </p>
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <div className="p-4 text-center">
                                  <p className="text-sm text-muted-foreground">
                                    Aucune entreprise trouvée pour &quot;{companyQuery}&quot;
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Essayez avec un nom d&apos;entreprise ou un SIRET
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Nom/Raison sociale */}
                    {/* Raison sociale uniquement pour les entreprises */}
                    {clientType === "COMPANY" && (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Raison sociale *</Label>
                        <Input
                          placeholder="Nom de l'entreprise"
                          className={cn(
                            errors.name && "border-red-500 hover:border-red-500"
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
                          <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Prénom *</Label>
                          <Input
                            placeholder="Prénom"
                            className={cn(
                              errors.firstName &&
                                "border-red-500 hover:border-red-500"
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
                          <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Nom *</Label>
                          <Input
                            placeholder="Nom"
                            className={cn(
                              errors.lastName &&
                                "border-red-500 hover:border-red-500"
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
                          <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Contact principal</Label>
                          <Input
                            placeholder="Nom du contact"
                            className={cn(
                              errors.firstName &&
                                "border-red-500 hover:border-red-500"
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
                          <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Email *</Label>
                          <div className="relative">
                            <Input type="email"
                              placeholder="contact@entreprise.com"
                              className={cn(
                                "pr-10",
                                errors.email &&
                                  "border-red-500 hover:border-red-500"
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
                        <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Email *</Label>
                        <div className="relative">
                          <Input type="email"
                            placeholder="client@exemple.com"
                            className={cn(
                              "pr-10",
                              errors.email &&
                                "border-red-500 hover:border-red-500"
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
                        <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">
                          Adresse de facturation
                        </Label>
                        <Textarea
                          placeholder="123 Rue de la Paix"
                          className={cn(
                            "border-[#e6e7ea] hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A] rounded-[9px] transition-[border] duration-[80ms]",
                            errors.address?.street &&
                              "border-red-500 hover:border-red-500"
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
                          <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Ville</Label>
                          <Input
                            placeholder="Paris"
                            className={cn(
                              errors.address?.city &&
                                "border-red-500 hover:border-red-500"
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
                          <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Code postal</Label>
                          <Input
                            placeholder={
                              isInternational
                                ? "Ex: SW1A 1AA, 10001..."
                                : "75001"
                            }
                            className={cn(
                              errors.address?.postalCode &&
                                "border-red-500 hover:border-red-500"
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
                        <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Pays</Label>
                        <Input
                          placeholder="France"
                          className={cn(
                            errors.address?.country &&
                              "border-red-500 hover:border-red-500"
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
                        className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55 cursor-pointer"
                      >
                        Adresse de livraison différente
                      </Label>
                    </div>

                    {/* Adresse de livraison */}
                    {hasDifferentShipping && (
                      <div className="space-y-3 border-l-2 border-gray-200 pl-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Adresse</Label>
                          <Textarea
                            placeholder="123 Rue de la Livraison"
                            className={cn(
                              "border-[#e6e7ea] hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A] rounded-[9px] transition-[border] duration-[80ms]",
                              errors.shippingAddress?.street &&
                                "border-red-500 hover:border-red-500"
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
                            <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Ville</Label>
                            <Input
                              placeholder="Paris"
                              className={cn(
                                errors.shippingAddress?.city &&
                                  "border-red-500 hover:border-red-500"
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
                            <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Code postal</Label>
                            <Input
                              placeholder={
                                isInternational
                                  ? "Ex: SW1A 1AA, 10001..."
                                  : "75001"
                              }
                              className={cn(
                                errors.shippingAddress?.postalCode &&
                                  "border-red-500 hover:border-red-500"
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
                          <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Pays</Label>
                          <Input
                            placeholder="France"
                            className={cn(
                              errors.shippingAddress?.country &&
                                "border-red-500 hover:border-red-500"
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
                        {/* <Label className="text-base font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">
                          Informations entreprise
                        </Label> */}

                        <div className="space-y-2">
                          <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">
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
                                "border-red-500 hover:border-red-500"
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
                          <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Numéro de TVA</Label>
                          <Input
                            placeholder={
                              isInternational
                                ? "Numéro de TVA (format libre)"
                                : "FR12345678901"
                            }
                            className={cn(
                              errors.vatNumber &&
                                "border-red-500 hover:border-red-500"
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
                    variant="secondary"
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
                    {/* Type de client + Localisation côte à côte */}
                    <div className="flex items-start gap-3">
                      <div className={cn("space-y-2", clientType === "COMPANY" ? "flex-1" : "w-full")}>
                        <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Type de client *</Label>
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

                      {clientType === "COMPANY" && (
                        <div className="flex-1 space-y-2">
                          <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">
                            Localisation *
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
                                  <SelectValue placeholder="Localisation" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="france">
                                    <span className="flex items-center gap-2">
                                      <span>🇫🇷</span>
                                      <span>France</span>
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="international">
                                    <span className="flex items-center gap-2">
                                      <Globe className="h-3.5 w-3.5" />
                                      <span>Hors France</span>
                                    </span>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                      )}
                    </div>

                    {clientType === "COMPANY" && isInternational && (
                      <p className="text-xs text-muted-foreground">
                        Pour les entreprises hors France, les champs SIRET
                        et TVA sont optionnels et sans validation stricte.
                      </p>
                    )}

                    {/* Recherche d'entreprises — inline search */}
                    {clientType === "COMPANY" && !isInternational && (
                      <div className="relative">
                        <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55 mb-2 block">
                          Importer depuis la base officielle
                        </Label>
                        <div
                          className={cn(
                            "flex items-center gap-2.5 px-2.5 h-8 rounded-[9px] transition-[border] duration-[80ms] ease-in-out",
                            "border border-[#e6e7ea] bg-transparent hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A]"
                          )}
                        >
                          <Search className="size-3.5 text-muted-foreground shrink-0" />
                          <Input
                            variant="ghost"
                            value={companyQuery}
                            onChange={(e) => setCompanyQuery(e.target.value)}
                            placeholder="Nom d'entreprise, SIRET, SIREN..."
                          />
                          {companyQuery && (
                            <button
                              type="button"
                              onClick={() => {
                                setCompanyQuery("");
                                setCompanies([]);
                              }}
                              className="shrink-0 cursor-pointer"
                            >
                              <X className="size-3 text-muted-foreground hover:text-foreground transition-colors" />
                            </button>
                          )}
                        </div>

                        {/* Dropdown results */}
                        {companyQuery.length >= 2 && (
                          <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-[#e6e7ea] dark:border-[#2E2E32] bg-popover shadow-md overflow-hidden">
                            <div className="max-h-[320px] overflow-y-auto p-1">
                              {loadingCompanies ? (
                                <div className="flex items-center justify-center gap-2 p-4">
                                  <LoaderCircle className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">
                                    Recherche...
                                  </span>
                                </div>
                              ) : companies.length > 0 ? (
                                companies.map((company) => (
                                  <button
                                    key={company.id}
                                    type="button"
                                    onClick={() => handleCompanySelect(company)}
                                    className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left outline-none cursor-pointer transition-colors hover:bg-accent"
                                  >
                                    <Building className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium -tracking-[0.01em] truncate">
                                          {company.name}
                                        </span>
                                        {company.status === "A" && (
                                          <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-full shrink-0">
                                            Active
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground truncate">
                                        SIRET: {company.siret}
                                        {company.city &&
                                          ` · ${company.postalCode} ${company.city}`}
                                      </p>
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <div className="p-4 text-center">
                                  <p className="text-sm text-muted-foreground">
                                    Aucune entreprise trouvée pour &quot;{companyQuery}&quot;
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Essayez avec un nom d&apos;entreprise ou un SIRET
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Nom/Raison sociale */}
                    {/* Raison sociale uniquement pour les entreprises */}
                    {clientType === "COMPANY" && (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Raison sociale *</Label>
                        <Input
                          placeholder="Nom de l'entreprise"
                          className={cn(
                            errors.name && "border-red-500 hover:border-red-500"
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
                          <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Prénom *</Label>
                          <Input
                            placeholder="Prénom"
                            className={cn(
                              errors.firstName &&
                                "border-red-500 hover:border-red-500"
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
                          <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Nom *</Label>
                          <Input
                            placeholder="Nom"
                            className={cn(
                              errors.lastName &&
                                "border-red-500 hover:border-red-500"
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
                          <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Contact principal</Label>
                          <Input
                            placeholder="Nom du contact"
                            className={cn(
                              errors.firstName &&
                                "border-red-500 hover:border-red-500"
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
                          <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Email *</Label>
                          <div className="relative">
                            <Input type="email"
                              placeholder="contact@entreprise.com"
                              className={cn(
                                "pr-10",
                                errors.email &&
                                  "border-red-500 hover:border-red-500"
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
                        <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Email *</Label>
                        <div className="relative">
                          <Input type="email"
                            placeholder="client@exemple.com"
                            className={cn(
                              "pr-10",
                              errors.email &&
                                "border-red-500 hover:border-red-500"
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
                        <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">
                          Adresse de facturation
                        </Label>
                        <Textarea
                          placeholder="123 Rue de la Paix"
                          className={cn(
                            "border-[#e6e7ea] hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A] rounded-[9px] transition-[border] duration-[80ms]",
                            errors.address?.street &&
                              "border-red-500 hover:border-red-500"
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
                          <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Ville</Label>
                          <Input
                            placeholder="Paris"
                            className={cn(
                              errors.address?.city &&
                                "border-red-500 hover:border-red-500"
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
                          <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Code postal</Label>
                          <Input
                            placeholder={
                              isInternational
                                ? "Ex: SW1A 1AA, 10001..."
                                : "75001"
                            }
                            className={cn(
                              errors.address?.postalCode &&
                                "border-red-500 hover:border-red-500"
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
                        <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Pays</Label>
                        <Input
                          placeholder="France"
                          className={cn(
                            errors.address?.country &&
                              "border-red-500 hover:border-red-500"
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
                        className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55 cursor-pointer"
                      >
                        Adresse de livraison différente
                      </Label>
                    </div>

                    {/* Adresse de livraison */}
                    {hasDifferentShipping && (
                      <div className="space-y-3 border-l-2 border-gray-200 pl-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Adresse</Label>
                          <Textarea
                            placeholder="123 Rue de la Livraison"
                            className={cn(
                              "border-[#e6e7ea] hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A] rounded-[9px] transition-[border] duration-[80ms]",
                              errors.shippingAddress?.street &&
                                "border-red-500 hover:border-red-500"
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
                            <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Ville</Label>
                            <Input
                              placeholder="Paris"
                              className={cn(
                                errors.shippingAddress?.city &&
                                  "border-red-500 hover:border-red-500"
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
                            <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Code postal</Label>
                            <Input
                              placeholder={
                                isInternational
                                  ? "Ex: SW1A 1AA, 10001..."
                                  : "75001"
                              }
                              className={cn(
                                errors.shippingAddress?.postalCode &&
                                  "border-red-500 hover:border-red-500"
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
                          <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Pays</Label>
                          <Input
                            placeholder="France"
                            className={cn(
                              errors.shippingAddress?.country &&
                                "border-red-500 hover:border-red-500"
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
                        <Label className="text-base font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">
                          Informations entreprise
                        </Label>

                        <div className="space-y-2">
                          <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">
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
                                "border-red-500 hover:border-red-500"
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
                          <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Numéro de TVA</Label>
                          <Input
                            placeholder={
                              isInternational
                                ? "Numéro de TVA (format libre)"
                                : "FR12345678901"
                            }
                            className={cn(
                              errors.vatNumber &&
                                "border-red-500 hover:border-red-500"
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
                    variant="secondary"
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
              className="flex-1 overflow-hidden m-0 flex flex-col"
            >
              {isEditing && (
                <div className="flex-shrink-0 px-4 py-2 border-b flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1.5"
                    onClick={() => setIsReminderDialogOpen(true)}
                  >
                    <Bell className="h-3.5 w-3.5" />
                    Rappel
                  </Button>
                </div>
              )}
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
                  isReminderDialogOpen={isReminderDialogOpen}
                  onReminderDialogClose={() => setIsReminderDialogOpen(false)}
                />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
