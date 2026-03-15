"use client";

import React, { useState, useEffect, useId } from "react";
import {
  Search,
  User,
  Plus,
  Building,
  LoaderCircle,
  ChevronDown,
  X,
  Check,
  Pencil,
  Globe,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  TabsNew,
  TabsNewList,
  TabsNewTrigger,
  TabsNewContent,
} from "@/src/components/ui/tabs-new";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { Input } from "@/src/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { cn } from "@/src/lib/utils";
import { toast } from "@/src/components/ui/sonner";

// Import GraphQL hooks and utilities
import {
  useClients,
  useCreateClient,
  CLIENT_TYPE_LABELS,
} from "@/src/graphql/clientQueries";

// Import API Gouv utilities
import { searchCompanies, convertCompanyToClient } from "@/src/utils/api-gouv";

export default function ClientSelector({
  onSelect,
  selectedClient,
  placeholder = "Rechercher un client...",
  className,
  disabled = false,
  error = null,
  clientPositionRight = false,
  onClientPositionChange,
  onEditClient,
  setValidationErrors,
}) {
  const id = useId();
  const [activeTab, setActiveTab] = useState("existing");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState("");

  // États pour l'API Gouv Data
  const [companyQuery, setCompanyQuery] = useState("");
  const [debouncedCompanyQuery, setDebouncedCompanyQuery] = useState("");
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const defaultAddress = {
    street: "",
    postalCode: "",
    city: "",
    country: "France",
  };

  // État pour suivre les erreurs de validation
  const [formErrors, setFormErrors] = useState({});

  const [newClientForm, setNewClientForm] = useState(() => ({
    type: "INDIVIDUAL",
    name: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    siret: "",
    vatNumber: "",
    isInternational: false,
    hasDifferentShippingAddress: false,
    address: { ...defaultAddress },
    shippingAddress: { fullName: "", ...defaultAddress },
    notes: "",
  }));


  // Synchroniser selectedValue avec selectedClient prop
  useEffect(() => {
    if (selectedClient) {
      setSelectedValue(selectedClient.name);
    } else {
      setSelectedValue("");
    }
  }, [selectedClient]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

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

  // Use GraphQL hooks
  const { clients, loading } = useClients({
    search: debouncedQuery,
    limit: 50,
  });
  const { createClient, loading: createLoading } = useCreateClient();

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
  };

  // Fonction pour compléter les données client manquantes
  const completeClientData = (client) => {
    const completedClient = { ...client };

    // Compléter l'adresse si elle est incomplète
    if (completedClient.address) {
      completedClient.address = {
        street: completedClient.address.street || "",
        city: completedClient.address.city || "",
        postalCode: completedClient.address.postalCode || "",
        country: completedClient.address.country || "France",
        ...completedClient.address,
      };
    } else {
      // Créer une adresse par défaut si elle n'existe pas
      completedClient.address = {
        street: "",
        city: "",
        postalCode: "",
        country: "France",
      };
    }

    // S'assurer que isInternational est défini
    // Détecter automatiquement si le pays n'est pas la France
    if (completedClient.isInternational === undefined || completedClient.isInternational === null) {
      const country = completedClient.address?.country?.toLowerCase() || "france";
      completedClient.isInternational = country !== "france" && country !== "fr";
    }

    // Pour les clients INDIVIDUAL, s'assurer que firstName et lastName existent
    if (
      completedClient.type === "INDIVIDUAL" &&
      completedClient.name &&
      !completedClient.firstName &&
      !completedClient.lastName
    ) {
      const nameParts = completedClient.name.split(" ");
      completedClient.firstName = nameParts[0] || "";
      completedClient.lastName = nameParts.slice(1).join(" ") || "";
    }

    return completedClient;
  };

  const handleClientSelect = (client) => {
    // Compléter les données manquantes
    const completedClient = completeClientData(client);

    onSelect?.(completedClient);
    setSelectedValue(client.name);
    setQuery(""); // Vider la recherche après sélection
  };

  const getClientIcon = (type) => {
    return type === "COMPANY" ? Building : User;
  };

  // Validation automatique avec debounce quand le formulaire change
  useEffect(() => {
    // Ne valider que si le formulaire manuel est affiché
    if (!createDialogOpen) return;

    // Ne pas valider si le formulaire est vide (état initial)
    const isFormEmpty =
      !newClientForm.name &&
      !newClientForm.email &&
      !newClientForm.firstName &&
      !newClientForm.lastName &&
      !newClientForm.address.street &&
      !newClientForm.address.city;
    if (isFormEmpty) return;

    // Debounce de 500ms
    const timeoutId = setTimeout(() => {
      validateForm();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [newClientForm, createDialogOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Nettoyer les erreurs quand on quitte le formulaire de nouveau client
  useEffect(() => {
    // Si on n'est pas sur l'onglet "new" ou si le formulaire manuel n'est pas affiché
    if (activeTab !== "new" || !createDialogOpen) {
      // Supprimer les erreurs de validation globales
      if (setValidationErrors) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.newClient;
          return newErrors;
        });
      }
      // Nettoyer aussi les erreurs locales
      setFormErrors({});
    }
  }, [activeTab, createDialogOpen, setValidationErrors]);

  const validateForm = () => {
    const errors = {};

    // Validation des champs obligatoires
    const requiredFields = [
      { field: "name", label: "name", message: "Le nom est obligatoire" },
      { field: "email", label: "email", message: "L'email est obligatoire" },
      {
        field: "address.street",
        label: "address.street",
        message: "La rue est obligatoire",
      },
      {
        field: "address.postalCode",
        label: "address.postalCode",
        message: "Le code postal est obligatoire",
      },
      {
        field: "address.city",
        label: "address.city",
        message: "La ville est obligatoire",
      },

      // Champs conditionnels selon le type de client
      ...(newClientForm.type === "INDIVIDUAL"
        ? [
            {
              field: "firstName",
              label: "firstName",
              message: "Le prénom est obligatoire",
            },
            {
              field: "lastName",
              label: "lastName",
              message: "Le nom est obligatoire",
            },
          ]
        : []),

      // Champs conditionnels pour les entreprises
      ...(newClientForm.type === "COMPANY" && newClientForm.siret
        ? [
            {
              field: "siret",
              label: "siret",
              message: "Le SIREN/SIRET est invalide (9 ou 14 chiffres requis)",
            },
          ]
        : []),
    ];

    // Validation des champs obligatoires
    requiredFields.forEach(({ field, label, message }) => {
      const value = field
        .split(".")
        .reduce((obj, key) => obj?.[key], newClientForm);
      if (!value || (typeof value === "string" && value.trim() === "")) {
        errors[label] = message;
      }
    });

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (newClientForm.email) {
      if (!emailRegex.test(newClientForm.email.trim())) {
        errors.email = "L'email n'est pas valide";
      }
    } else {
      errors.email = "L'email est obligatoire";
    }

    // Validation des codes postaux (format français uniquement pour les entreprises françaises)
    const postalCodeRegex = /^\d{5}$/;
    const isInternational = newClientForm.isInternational;

    // Validation du code postal de facturation
    if (newClientForm.address?.postalCode) {
      // Validation stricte uniquement pour les entreprises françaises
      if (
        !isInternational &&
        !postalCodeRegex.test(newClientForm.address.postalCode)
      ) {
        errors["address.postalCode"] =
          "Le code postal doit contenir 5 chiffres";
      }
    } else {
      errors["address.postalCode"] = "Le code postal est obligatoire";
    }

    // Validation de l'adresse de livraison (si différente)
    if (newClientForm.hasDifferentShippingAddress) {
      // Validation de la rue de livraison
      if (!newClientForm.shippingAddress?.street?.trim()) {
        errors["shippingAddress.street"] =
          "La rue de livraison est obligatoire";
      }

      // Validation du code postal de livraison
      if (!newClientForm.shippingAddress?.postalCode?.trim()) {
        errors["shippingAddress.postalCode"] =
          "Le code postal de livraison est obligatoire";
      } else if (
        !isInternational &&
        !postalCodeRegex.test(newClientForm.shippingAddress.postalCode)
      ) {
        errors["shippingAddress.postalCode"] =
          "Le code postal de livraison doit contenir 5 chiffres";
      }

      // Validation de la ville de livraison
      if (!newClientForm.shippingAddress?.city?.trim()) {
        errors["shippingAddress.city"] =
          "La ville de livraison est obligatoire";
      }
    }

    // Validation du numéro de téléphone (optionnel mais doit être valide si renseigné)
    if (newClientForm.phone && newClientForm.phone.trim() !== "") {
      const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
      if (!phoneRegex.test(newClientForm.phone.trim())) {
        errors.phone =
          "Format de téléphone invalide. Ex: 01 23 45 67 89 ou 0123456789";
      }
    }

    // Validation du SIREN/SIRET ou numéro d'identification (si entreprise)
    if (newClientForm.type === "COMPANY") {
      if (newClientForm.isInternational) {
        // Pour les entreprises internationales : numéro d'identification obligatoire mais format libre
        if (!newClientForm.siret || newClientForm.siret.trim() === "") {
          errors.siret =
            "Le numéro d'identification est obligatoire pour une entreprise internationale";
        }
      } else {
        // Pour les entreprises françaises : validation stricte du format SIREN/SIRET
        if (newClientForm.siret) {
          const siretRegex = /^\d{9}$|^\d{14}$/;
          if (!siretRegex.test(newClientForm.siret)) {
            errors.siret =
              "Le SIREN doit contenir 9 chiffres ou le SIRET 14 chiffres";
          }
        } else {
          errors.siret =
            "Le SIREN/SIRET est obligatoire pour une entreprise française";
        }
      }
    }

    // Validation du numéro de téléphone (si fourni)
    if (newClientForm.phone && newClientForm.phone.trim() !== "") {
      const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
      if (!phoneRegex.test(newClientForm.phone.trim())) {
        errors.phone =
          "Le numéro de téléphone n'est pas valide (ex: 01 23 45 67 89)";
      }
    }

    setFormErrors(errors);

    // Afficher aussi dans la bannière globale si setValidationErrors est disponible
    if (setValidationErrors && Object.keys(errors).length > 0) {
      const errorMessages = Object.values(errors);
      setValidationErrors((prev) => ({
        ...prev,
        newClient: {
          message: `Erreurs dans le formulaire de nouveau client:\n${errorMessages.join("\n")}`,
          canEdit: true,
        },
      }));
    } else if (setValidationErrors && Object.keys(errors).length === 0) {
      // Supprimer l'erreur si le formulaire est valide
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.newClient;
        return newErrors;
      });
    }

    return Object.keys(errors).length === 0;
  };

  // Création du client (applyToInvoice = true pour "Créer et appliquer")
  const handleCreateClient = async (applyToInvoice = true) => {
    const isValid = validateForm();
    if (!isValid) {
      toast.error("Veuillez corriger les erreurs dans le formulaire");
      return;
    }

    const clientsList = Array.isArray(clients) ? clients : clients?.items || [];
    const emailExists = clientsList.some(
      (client) =>
        client.email.toLowerCase() === newClientForm.email.toLowerCase()
    );

    if (emailExists) {
      setFormErrors((prev) => ({
        ...prev,
        email: "Cet email est déjà utilisé par un autre client",
      }));
      toast.error("Un client avec cet email existe déjà");
      return;
    }

    try {
      const clientData = {
        type: newClientForm.type,
        name: newClientForm.name,
        email: newClientForm.email,
        firstName: newClientForm.firstName || undefined,
        lastName: newClientForm.lastName || undefined,
        siret: newClientForm.siret || undefined,
        vatNumber: newClientForm.vatNumber || undefined,
        isInternational: newClientForm.isInternational || false,
        hasDifferentShippingAddress: Boolean(
          newClientForm.hasDifferentShippingAddress
        ),
        address: {
          street: newClientForm.address.street,
          postalCode: newClientForm.address.postalCode,
          city: newClientForm.address.city,
          country: newClientForm.address.country || "France",
        },
        ...(newClientForm.hasDifferentShippingAddress &&
          newClientForm.shippingAddress && {
            shippingAddress: {
              fullName: newClientForm.shippingAddress.fullName,
              street: newClientForm.shippingAddress.street,
              postalCode: newClientForm.shippingAddress.postalCode,
              city: newClientForm.shippingAddress.city,
              country: newClientForm.shippingAddress.country || "France",
            },
          }),
      };

      Object.keys(clientData).forEach((key) => {
        if (clientData[key] === undefined) {
          delete clientData[key];
        }
      });

      const createdClient = await createClient(clientData);

      if (createdClient) {
        if (applyToInvoice) {
          onSelect?.(createdClient);
          setActiveTab("existing");
        }
        resetNewClientForm();
        setCreateDialogOpen(false);
        toast.success(
          applyToInvoice
            ? `Client "${createdClient.name}" créé et appliqué`
            : `Client "${createdClient.name}" créé`
        );
      }
    } catch (error) {
      let errorMessage =
        "Une erreur est survenue lors de la création du client";

      if (error.message.includes("Network Error")) {
        errorMessage =
          "Erreur de connexion au serveur. Vérifiez votre connexion Internet.";
      } else if (
        error.message.includes("400") ||
        error.message.includes("Validation Error") ||
        error.message.includes("ClientInput")
      ) {
        errorMessage =
          "Erreur de validation. Vérifiez que tous les champs sont correctement remplis.";
      } else if (
        error.message.includes("409") ||
        error.message.toLowerCase().includes("existe déjà") ||
        error.message.toLowerCase().includes("email existe") ||
        error.extensions?.code === "ALREADY_EXISTS" ||
        error.code === "ALREADY_EXISTS"
      ) {
        errorMessage =
          "Un client avec cet email existe déjà. Veuillez utiliser un email différent ou sélectionner ce client dans la liste.";
        setFormErrors((prev) => ({
          ...prev,
          email: "Cet email est déjà utilisé par un autre client",
        }));
      } else if (
        error.message.includes("401") ||
        error.message.includes("403")
      ) {
        errorMessage =
          "Vous n'avez pas les droits nécessaires pour effectuer cette action.";
      } else if (error.message.includes("500")) {
        errorMessage = "Erreur serveur. Veuillez réessayer plus tard.";
      }

      toast.error(errorMessage, {
        duration: 5000,
        position: "top-center",
        action: {
          label: "Fermer",
          onClick: () => {},
        },
      });
    }
  };

  const resetNewClientForm = () => {
    setNewClientForm({
      type: "INDIVIDUAL",
      name: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      siret: "",
      vatNumber: "",
      isInternational: false,
      hasDifferentShippingAddress: false,
      address: { ...defaultAddress },
      shippingAddress: { fullName: "", ...defaultAddress },
      notes: "",
    });
    setFormErrors({});
  };

  const handleSwitchToNewClient = () => {
    setActiveTab("new");
    setOpen(false);
    setQuery("");
    setSelectedValue("");
    setCreateDialogOpen(false); // Masquer le formulaire manuel par défaut
    setCompanyQuery(""); // Reset de la recherche entreprise
    setCompanies([]);

    // Focus sur le champ de recherche d'entreprise
    setTimeout(() => {
      const searchInput = document.querySelector("#company-search");
      if (searchInput) {
        searchInput.focus();
      }
    }, 100);
  };

  // Fonction pour sélectionner une entreprise de l'API Gouv
  const handleCompanySelect = (company) => {
    try {
      // Convertir l'entreprise en format client
      const clientData = convertCompanyToClient(company);

      // Remplir le formulaire avec les données de l'entreprise
      setNewClientForm(clientData);

      // Effacer les erreurs existantes
      setFormErrors({});

      // Afficher le formulaire manuel pré-rempli
      setCreateDialogOpen(true);

      // Notification de succès
      toast.success(`Entreprise "${company.name}" importée avec succès`);

      // Focus sur le champ email (à compléter manuellement)
      setTimeout(() => {
        const emailInput = document.querySelector("#client-email");
        if (emailInput) {
          emailInput.focus();
        }
      }, 100);
    } catch (error) {
      toast.error("Erreur lors de l'import de l'entreprise");
    }
  };

  // Ouvrir le dialogue de création manuelle
  const handleShowManualForm = () => {
    resetNewClientForm();
    setCreateDialogOpen(true);
  };

  // Fermer le dialogue et nettoyer
  const handleCloseDialog = () => {
    setFormErrors({});
    if (setValidationErrors) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.newClient;
        return newErrors;
      });
    }
    resetNewClientForm();
    setCreateDialogOpen(false);
  };

  return (
    <div className={cn("w-full", className)}>
      <Card className="shadow-none border-none bg-transparent">
        <TabsNew value={activeTab} onValueChange={setActiveTab} className="w-full">
          <CardHeader className="p-0 pb-4">
            <TabsNewList className="px-0 sm:px-0">
              <TabsNewTrigger value="existing">
                <User className="h-3.5 w-3.5" />
                Client existant
              </TabsNewTrigger>
              <TabsNewTrigger value="new">
                <Plus className="h-3.5 w-3.5" />
                Nouveau client
              </TabsNewTrigger>
            </TabsNewList>
          </CardHeader>

          <CardContent className="p-0">
            <TabsNewContent value="existing" className="m-0">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        role="combobox"
                        aria-expanded={open}
                        disabled={disabled}
                        className={cn(
                          "appearance-none m-0 flex w-full items-center justify-between overflow-hidden text-sm font-medium leading-5 -tracking-[0.01em] text-foreground outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
                          "border border-[#e6e7ea] bg-transparent hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A]",
                          "h-8 rounded-lg pr-2 pl-2.5 gap-3",
                          "transition-[border] duration-[80ms] ease-in-out",
                          error && "border-destructive",
                        )}
                      >
                        <span className={cn("truncate", !selectedClient && "text-muted-foreground")}>
                          {selectedClient?.name || placeholder}
                        </span>
                        <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="p-0 overflow-hidden rounded-xl"
                      align="start"
                      side="bottom"
                      sideOffset={4}
                      avoidCollisions={false}
                      style={{ width: "var(--radix-popover-trigger-width)" }}
                    >
                      {/* Search header */}
                      <div className="flex items-center gap-2.5 px-2.5 h-10 border-b border-[#e6e7ea] dark:border-[#232323]">
                        <Search className="size-3.5 text-muted-foreground shrink-0" />
                        <Input
                          variant="ghost"
                          placeholder="Rechercher un client..."
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          autoFocus
                        />
                      </div>

                      {/* Items list */}
                      <div className="max-h-[280px] overflow-y-auto p-1">
                        {loading ? (
                          <div className="flex items-center justify-center gap-2 p-4">
                            <LoaderCircle className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Recherche...</span>
                          </div>
                        ) : !clients?.length ? (
                          <div className="p-4 text-center">
                            <p className="text-sm text-muted-foreground mb-2">
                              Aucun client trouvé{query && ` pour "${query}"`}
                            </p>
                            {query && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleSwitchToNewClient}
                                className="text-xs font-normal"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Créer &quot;{query}&quot; comme nouveau client
                              </Button>
                            )}
                          </div>
                        ) : (
                          clients.map((client) => {
                            const IconComponent = getClientIcon(client.type);
                            const isSelected = selectedClient?.id === client.id;
                            return (
                              <button
                                key={client.id}
                                type="button"
                                onClick={() => {
                                  handleClientSelect(client);
                                  setOpen(false);
                                }}
                                className={cn(
                                  "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm outline-none cursor-pointer transition-colors",
                                  "hover:bg-accent",
                                  isSelected && "bg-accent/50"
                                )}
                              >
                                <IconComponent className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="truncate flex-1 text-left font-medium -tracking-[0.01em] text-foreground">
                                  {client.name}
                                </span>
                                <Check
                                  className={cn(
                                    "h-3.5 w-3.5 shrink-0 text-foreground",
                                    isSelected ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </button>
                            );
                          })
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Message d'erreur */}
                  {error && (
                    <p className="text-sm text-destructive font-normal">
                      {error}
                    </p>
                  )}

                  {selectedClient && (
                    <div className="space-y-3 mt-3">
                      {/* Client card — Attio style */}
                      <div
                        className="flex items-center justify-between w-full rounded-xl bg-white dark:bg-[#1a1a1e] shadow-[inset_0_0_0_1px_#EEEFF1] dark:shadow-[inset_0_0_0_1px_#2E2E32] hover:bg-[#FAFAFA] dark:hover:bg-[#1e1e22] transition-colors duration-[140ms] cursor-pointer py-2 pr-4 pl-2 gap-2.5"
                        onClick={() => onEditClient?.(selectedClient)}
                      >
                        {/* Left: icon + text */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex items-center justify-center size-9 rounded-lg bg-[#5a50ff]/10 dark:bg-[#5a50ff]/20 shrink-0">
                            {React.createElement(
                              getClientIcon(selectedClient.type),
                              {
                                className: "size-4 text-[#5a50ff]",
                              }
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium leading-5 -tracking-[0.01em] text-[#242529] dark:text-white truncate">
                              {selectedClient.name}
                            </div>
                            <div className="text-xs leading-4 text-black/45 dark:text-white/45 truncate">
                              {CLIENT_TYPE_LABELS[selectedClient.type]}
                            </div>
                          </div>
                        </div>

                        {/* Right: actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            className="flex items-center justify-center size-7 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelect?.(null);
                              setSelectedValue("");
                              setQuery("");
                            }}
                            aria-label="Supprimer la sélection"
                          >
                            <X className="size-3.5 text-black/40 dark:text-white/40" />
                          </button>
                        </div>
                      </div>

                      {/* Mention pour la position du client dans le PDF */}
                      <div className="flex items-start gap-2 px-1">
                        <p className="text-xs leading-4 text-black/40 dark:text-white/40">
                          La position des informations client dans le PDF
                          peut être modifiée dans les paramètres de la facture
                          (icône ⚙️ en haut à droite).
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsNewContent>

            <TabsNewContent value="new" className="m-0">
              <div className="space-y-6">
                  {/* Side-by-side: Location select + Company search */}
                  <div className="flex items-start gap-3">
                    {/* Location Select */}
                    <Select
                      value={
                        newClientForm.isInternational
                          ? "international"
                          : "france"
                      }
                      onValueChange={(value) => {
                        setNewClientForm((prev) => ({
                          ...prev,
                          isInternational: value === "international",
                          siret: value === "international" ? "" : prev.siret,
                          vatNumber:
                            value === "international" ? "" : prev.vatNumber,
                        }));
                        // Si international, afficher directement le formulaire manuel
                        if (value === "international") {
                          setCreateDialogOpen(true);
                        }
                      }}
                    >
                      <SelectTrigger className="w-[160px] shrink-0">
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

                    {/* Company search with dropdown */}
                    <div className="flex-1 relative">
                      <div
                        className={cn(
                          "flex items-center gap-2.5 px-2.5 h-8 rounded-lg transition-[border] duration-[80ms] ease-in-out",
                          "border border-[#e6e7ea] bg-transparent hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A]"
                        )}
                      >
                        <Search className="size-3.5 text-muted-foreground shrink-0" />
                        <Input
                          variant="ghost"
                          id="company-search"
                          value={companyQuery}
                          onChange={(e) => setCompanyQuery(e.target.value)}
                          placeholder="Nom d'entreprise, SIRET, SIREN..."
                          disabled={disabled}
                        />
                        {companyQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setCompanyQuery("");
                              setCompanies([]);
                            }}
                            className="shrink-0"
                          >
                            <X className="size-3 text-muted-foreground hover:text-foreground transition-colors" />
                          </button>
                        )}
                      </div>

                      {/* Dropdown results */}
                      {companyQuery.length >= 2 && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-[#e6e7ea] dark:border-[#232323] bg-popover shadow-md overflow-hidden">
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
                                    {company.activityLabel && (
                                      <p className="text-xs text-muted-foreground truncate">
                                        {company.activityLabel}
                                      </p>
                                    )}
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
                  </div>

                  {/* Bouton pour créer manuellement */}
                  <div className="pt-4 border-t border-[#e6e7ea] dark:border-[#232323]">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleShowManualForm}
                      className="w-full"
                      disabled={disabled}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Créer un client manuellement
                    </Button>
                  </div>
                </div>
            </TabsNewContent>
          </CardContent>
        </TabsNew>
      </Card>

      {/* ─── Dialog de création de client ─── */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => { if (!open) handleCloseDialog(); }}>
        <DialogContent className="sm:max-w-[640px] max-h-[85vh] flex flex-col overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
            <DialogTitle className="text-base font-medium -tracking-[0.01em]">Nouveau client</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Remplissez les informations pour créer un nouveau client.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-5">
            {/* Type de client */}
            <div className="space-y-2">
              <Label htmlFor="client-type" className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">
                Type de client
              </Label>
              <Select
                value={newClientForm.type}
                onValueChange={(value) =>
                  setNewClientForm((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INDIVIDUAL">Particulier</SelectItem>
                  <SelectItem value="COMPANY">Entreprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Localisation - entreprises uniquement */}
            {newClientForm.type === "COMPANY" && (
              <div className="space-y-2">
                <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">
                  Localisation de l&apos;entreprise
                </Label>
                <Select
                  value={newClientForm.isInternational ? "international" : "france"}
                  onValueChange={(value) => {
                    setNewClientForm((prev) => ({
                      ...prev,
                      isInternational: value === "international",
                      siret: value === "international" ? "" : prev.siret,
                      vatNumber: value === "international" ? "" : prev.vatNumber,
                    }));
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
                {newClientForm.isInternational && (
                  <p className="text-xs text-muted-foreground">
                    Pour les entreprises hors France, les champs SIRET et TVA sont optionnels.
                  </p>
                )}
              </div>
            )}

            {/* Nom (entreprise) ou Prénom/Nom (particulier) */}
            {newClientForm.type === "COMPANY" ? (
              <div className="space-y-2">
                <Label htmlFor="client-name" className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">
                  Nom de l&apos;entreprise <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="client-name"
                  value={newClientForm.name}
                  onChange={(e) => {
                    setNewClientForm((prev) => ({ ...prev, name: e.target.value }));
                    if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: null }));
                  }}
                  placeholder="Nom de l'entreprise"
                  className={cn(formErrors.name && "border-red-500 hover:border-red-500")}
                />
                {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client-firstname" className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Prénom</Label>
                  <Input
                    id="client-firstname"
                    value={newClientForm.firstName}
                    onChange={(e) => {
                      setNewClientForm((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                        name: `${e.target.value} ${prev.lastName || ""}`.trim(),
                      }));
                      if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: null }));
                    }}
                    placeholder="Prénom"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-lastname" className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Nom</Label>
                  <Input
                    id="client-lastname"
                    value={newClientForm.lastName}
                    onChange={(e) => {
                      setNewClientForm((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                        name: `${prev.firstName || ""} ${e.target.value}`.trim(),
                      }));
                      if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: null }));
                    }}
                    placeholder="Nom"
                  />
                </div>
              </div>
            )}

            {/* Email + Téléphone */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client-email" className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="client-email"
                  type="email"
                  value={newClientForm.email}
                  onChange={(e) => {
                    setNewClientForm((prev) => ({ ...prev, email: e.target.value }));
                    if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: null }));
                  }}
                  placeholder="contact@exemple.com"
                  className={cn(formErrors.email && "border-red-500 hover:border-red-500")}
                />
                {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-phone" className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Téléphone</Label>
                <Input
                  id="client-phone"
                  value={newClientForm.phone}
                  onChange={(e) => {
                    setNewClientForm((prev) => ({ ...prev, phone: e.target.value }));
                    if (formErrors.phone) {
                      setFormErrors((prev) => { const n = { ...prev }; delete n.phone; return n; });
                    }
                  }}
                  placeholder="01 23 45 67 89"
                  className={cn(formErrors.phone && "border-red-500 hover:border-red-500")}
                />
                {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
              </div>
            </div>

            {/* SIRET / TVA - entreprises uniquement */}
            {newClientForm.type === "COMPANY" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client-siret" className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">
                    {newClientForm.isInternational ? "N° d'identification" : "SIREN/SIRET"}
                    <span className="text-red-500"> *</span>
                  </Label>
                  <Input
                    id="client-siret"
                    value={newClientForm.siret || ""}
                    onChange={(e) => setNewClientForm((prev) => ({ ...prev, siret: e.target.value }))}
                    placeholder={newClientForm.isInternational ? "N° d'identification" : "123456789 ou 12345678901234"}
                    disabled={disabled}
                    className={cn(formErrors.siret && "border-red-500 hover:border-red-500")}
                  />
                  <p className="text-xs text-muted-foreground">
                    {newClientForm.isInternational
                      ? "N° d'identification fiscale ou équivalent local"
                      : "SIREN (9 chiffres) ou SIRET (14 chiffres)"}
                  </p>
                  {formErrors.siret && <p className="text-xs text-red-500 mt-1">{formErrors.siret}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-vat" className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">N° TVA</Label>
                  <Input
                    id="client-vat"
                    value={newClientForm.vatNumber || ""}
                    onChange={(e) => setNewClientForm((prev) => ({ ...prev, vatNumber: e.target.value }))}
                    placeholder={newClientForm.isInternational ? "TVA intracommunautaire" : "FR12345678901"}
                  />
                </div>
              </div>
            )}

            {/* ─── Adresse de facturation ─── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-px bg-border flex-1" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Adresse de facturation
                </span>
                <div className="h-px bg-border flex-1" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-street" className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">
                  Adresse <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="client-street"
                  value={newClientForm.address?.street || ""}
                  onChange={(e) => {
                    setNewClientForm((prev) => ({ ...prev, address: { ...prev.address, street: e.target.value } }));
                    if (formErrors["address.street"]) {
                      setFormErrors((prev) => { const n = { ...prev }; delete n["address.street"]; return n; });
                    }
                  }}
                  placeholder="1 rue de l'exemple"
                  className={cn(formErrors["address.street"] && "border-red-500 hover:border-red-500")}
                />
                {formErrors["address.street"] && <p className="text-xs text-red-500 mt-1">{formErrors["address.street"]}</p>}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client-postal-code" className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">
                    Code postal <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="client-postal-code"
                    value={newClientForm.address?.postalCode || ""}
                    onChange={(e) => {
                      setNewClientForm((prev) => ({ ...prev, address: { ...prev.address, postalCode: e.target.value } }));
                      if (formErrors["address.postalCode"]) {
                        setFormErrors((prev) => { const n = { ...prev }; delete n["address.postalCode"]; return n; });
                      }
                    }}
                    placeholder={newClientForm.isInternational ? "Ex: SW1A 1AA" : "75000"}
                    className={cn(formErrors["address.postalCode"] && "border-red-500 hover:border-red-500")}
                  />
                  {formErrors["address.postalCode"] && <p className="text-xs text-red-500 mt-1">{formErrors["address.postalCode"]}</p>}
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="client-city" className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">
                    Ville <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="client-city"
                    value={newClientForm.address?.city || ""}
                    onChange={(e) => {
                      setNewClientForm((prev) => ({ ...prev, address: { ...prev.address, city: e.target.value } }));
                      if (formErrors["address.city"]) {
                        setFormErrors((prev) => { const n = { ...prev }; delete n["address.city"]; return n; });
                      }
                    }}
                    placeholder="Paris"
                    className={cn(formErrors["address.city"] && "border-red-500 hover:border-red-500")}
                  />
                  {formErrors["address.city"] && <p className="text-xs text-red-500 mt-1">{formErrors["address.city"]}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-country" className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Pays</Label>
                <Input
                  id="client-country"
                  value={newClientForm.address?.country || "France"}
                  onChange={(e) =>
                    setNewClientForm((prev) => ({ ...prev, address: { ...prev.address, country: e.target.value } }))
                  }
                  placeholder="France"
                />
              </div>
            </div>

            {/* Hidden textarea for address sync */}
            <div className="hidden">
              <Textarea
                id="client-address"
                value={`${newClientForm.address.street}\n${newClientForm.address.postalCode} ${newClientForm.address.city}\n${newClientForm.address.country}`}
                onChange={(e) => {
                  const lines = e.target.value.split("\n");
                  setNewClientForm((prev) => ({
                    ...prev,
                    address: {
                      ...defaultAddress,
                      ...prev.address,
                      street: lines[0] || "",
                      postalCode: lines[1]?.split(" ")[0] || "",
                      city: lines[1]?.split(" ").slice(1).join(" ").trim() || "",
                      country: (lines[2] || "France").trim(),
                    },
                  }));
                }}
                rows={1}
              />
            </div>

            {/* Adresse de livraison */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="different-shipping-address"
                  checked={newClientForm.hasDifferentShippingAddress || false}
                  onCheckedChange={(checked) => {
                    setNewClientForm((prev) => ({
                      ...prev,
                      hasDifferentShippingAddress: Boolean(checked),
                    }));
                  }}
                />
                <Label htmlFor="different-shipping-address" className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55 cursor-pointer">
                  Utiliser une adresse de livraison différente
                </Label>
              </div>

              {newClientForm.hasDifferentShippingAddress && (
                <div className="space-y-4 pl-6 pt-2 border-l-2 border-border">
                  <div className="space-y-2">
                    <Label htmlFor="shipping-fullname" className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Nom complet</Label>
                    <Input
                      id="shipping-fullname"
                      value={newClientForm.shippingAddress?.fullName || ""}
                      onChange={(e) => setNewClientForm((prev) => ({ ...prev, shippingAddress: { ...prev.shippingAddress, fullName: e.target.value } }))}
                      placeholder="Nom complet du destinataire"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shipping-street" className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">
                      Rue <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="shipping-street"
                      value={newClientForm.shippingAddress?.street || ""}
                      onChange={(e) => {
                        setNewClientForm((prev) => ({ ...prev, shippingAddress: { ...prev.shippingAddress, street: e.target.value } }));
                        if (formErrors["shippingAddress.street"]) {
                          setFormErrors((prev) => { const n = { ...prev }; delete n["shippingAddress.street"]; return n; });
                        }
                      }}
                      placeholder="123 Rue de la Paix"
                      className={cn(formErrors["shippingAddress.street"] && "border-red-500 hover:border-red-500")}
                    />
                    {formErrors["shippingAddress.street"] && <p className="text-xs text-red-500 mt-1">{formErrors["shippingAddress.street"]}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="shipping-postal-code" className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Code postal</Label>
                      <Input
                        id="shipping-postal-code"
                        value={newClientForm.shippingAddress?.postalCode || ""}
                        onChange={(e) => {
                          setNewClientForm((prev) => ({ ...prev, shippingAddress: { ...prev.shippingAddress, postalCode: e.target.value } }));
                          if (formErrors["shippingAddress.postalCode"]) {
                            setFormErrors((prev) => { const n = { ...prev }; delete n["shippingAddress.postalCode"]; return n; });
                          }
                        }}
                        placeholder={newClientForm.isInternational ? "Ex: SW1A 1AA" : "75001"}
                        className={cn(formErrors["shippingAddress.postalCode"] && "border-red-500 hover:border-red-500")}
                      />
                      {formErrors["shippingAddress.postalCode"] && <p className="text-xs text-red-500 mt-1">{formErrors["shippingAddress.postalCode"]}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shipping-city" className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">
                        Ville <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="shipping-city"
                        value={newClientForm.shippingAddress?.city || ""}
                        onChange={(e) => {
                          setNewClientForm((prev) => ({ ...prev, shippingAddress: { ...prev.shippingAddress, city: e.target.value } }));
                          if (formErrors["shippingAddress.city"]) {
                            setFormErrors((prev) => { const n = { ...prev }; delete n["shippingAddress.city"]; return n; });
                          }
                        }}
                        placeholder="Paris"
                        className={cn(formErrors["shippingAddress.city"] && "border-red-500 hover:border-red-500")}
                      />
                      {formErrors["shippingAddress.city"] && <p className="text-xs text-red-500 mt-1">{formErrors["shippingAddress.city"]}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shipping-country" className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Pays</Label>
                    <Input
                      id="shipping-country"
                      value={newClientForm.shippingAddress?.country || "France"}
                      onChange={(e) => setNewClientForm((prev) => ({ ...prev, shippingAddress: { ...prev.shippingAddress, country: e.target.value } }))}
                      placeholder="France"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="client-notes" className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">Notes (optionnel)</Label>
              <Textarea
                id="client-notes"
                value={newClientForm.notes}
                onChange={(e) => setNewClientForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Notes internes sur ce client..."
                rows={2}
                className="rounded-lg px-2.5 py-2 text-sm font-medium leading-5 -tracking-[0.01em] resize-none border border-[#e6e7ea] hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A] bg-transparent transition-[border] duration-[80ms] ease-in-out focus-visible:outline-none focus-visible:ring-0"
              />
              <p className="text-xs text-muted-foreground">Ces notes ne seront visibles que par vous</p>
            </div>
          </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2 px-6 py-4 shrink-0 border-t border-[#e6e7ea] dark:border-[#232323]">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseDialog}
              disabled={createLoading}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleCreateClient(false)}
              disabled={createLoading || !newClientForm.name || !newClientForm.email || disabled}
            >
              {createLoading ? (
                <>
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer"
              )}
            </Button>
            <Button
              type="button"
              onClick={() => handleCreateClient(true)}
              disabled={createLoading || !newClientForm.name || !newClientForm.email || disabled}
            >
              {createLoading ? (
                <>
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer et appliquer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
