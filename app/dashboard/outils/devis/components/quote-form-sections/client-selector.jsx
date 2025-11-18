"use client";

import React, { useState, useEffect, useRef, useId } from "react";
import {
  Search,
  Pencil,
  Plus,
  Building,
  Mail,
  Phone,
  LoaderCircle,
  ChevronDown,
  X,
  CheckIcon,
  ExternalLink,
  AlignLeft,
  AlignRight,
  User,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/src/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
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
  validationErrors = {},
  setValidationErrors,
  clientPositionRight = false,
  onClientPositionChange,
  onEditClient,
}) {
  // Helper pour vérifier si le client a une erreur
  const hasClientError = validationErrors?.client;
  const id = useId();
  const [activeTab, setActiveTab] = useState("existing");
  
  // État pour suivre les erreurs de validation
  const [formErrors, setFormErrors] = useState({});
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState("");

  // États pour l'API Gouv Data
  const [companyQuery, setCompanyQuery] = useState("");
  const [debouncedCompanyQuery, setDebouncedCompanyQuery] = useState("");
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const defaultAddress = {
    street: "",
    postalCode: "",
    city: "",
    country: "France",
  };

  const [newClientForm, setNewClientForm] = useState(() => ({
    type: "INDIVIDUAL",
    name: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    siret: "",
    vatNumber: "",
    hasDifferentShippingAddress: false,
    address: { ...defaultAddress },
    shippingAddress: { fullName: "", ...defaultAddress },
    notes: "",
  }));
  const inputRef = useRef(null);

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
    limit: 10,
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
    if (!showManualForm) return;
    
    // Ne pas valider si le formulaire est vide (état initial)
    const isFormEmpty = !newClientForm.name && !newClientForm.email && 
                        !newClientForm.firstName && !newClientForm.lastName &&
                        !newClientForm.address.street && !newClientForm.address.city;
    if (isFormEmpty) return;
    
    // Debounce de 500ms
    const timeoutId = setTimeout(() => {
      validateForm();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [newClientForm, showManualForm]); // eslint-disable-line react-hooks/exhaustive-deps

  // Nettoyer les erreurs quand on quitte le formulaire de nouveau client
  useEffect(() => {
    // Si on n'est pas sur l'onglet "new" ou si le formulaire manuel n'est pas affiché
    if (activeTab !== "new" || !showManualForm) {
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
  }, [activeTab, showManualForm, setValidationErrors]);

  const validateForm = () => {
    const errors = {};

    // Validation du nom selon le type de client
    if (newClientForm.type === "COMPANY") {
      // Pour les entreprises, vérifier le champ name
      if (!newClientForm.name || newClientForm.name.trim() === "") {
        errors.name = "Le nom de l'entreprise est obligatoire";
      }
    } else {
      // Pour les particuliers, vérifier firstName ET lastName, ou name
      const hasName = newClientForm.name && newClientForm.name.trim() !== "";
      const hasFirstOrLastName = 
        (newClientForm.firstName && newClientForm.firstName.trim() !== "") || 
        (newClientForm.lastName && newClientForm.lastName.trim() !== "");
      
      if (!hasName && !hasFirstOrLastName) {
        errors.name = "Le nom ou prénom est obligatoire";
      }
    }

    // Validation de l'email
    if (!newClientForm.email || newClientForm.email.trim() === "") {
      errors.email = "L'email est obligatoire";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newClientForm.email.trim())) {
        errors.email = "L'email n'est pas valide (ex: nom@exemple.com)";
      }
    }

    // Validation de l'adresse
    if (!newClientForm.address.street || newClientForm.address.street.trim() === "") {
      errors["address.street"] = "L'adresse (rue) est obligatoire";
    }
    
    if (!newClientForm.address.city || newClientForm.address.city.trim() === "") {
      errors["address.city"] = "La ville est obligatoire";
    }
    
    // Validation du code postal
    if (!newClientForm.address.postalCode || newClientForm.address.postalCode.trim() === "") {
      errors["address.postalCode"] = "Le code postal est obligatoire";
    } else {
      const postalCodeRegex = /^\d{5}$/;
      if (!postalCodeRegex.test(newClientForm.address.postalCode.trim())) {
        errors["address.postalCode"] = "Le code postal doit contenir exactement 5 chiffres";
      }
    }
    
    // Validation du pays
    if (!newClientForm.address.country || newClientForm.address.country.trim() === "") {
      errors["address.country"] = "Le pays est obligatoire";
    }

    // Validations spécifiques aux entreprises
    if (newClientForm.type === "COMPANY") {
      // Validation du SIREN/SIRET
      if (!newClientForm.siret || newClientForm.siret.trim() === "") {
        errors.siret = "Le numéro de SIREN/SIRET est obligatoire pour les entreprises";
      } else {
        const siretRegex = /^\d{9}$|^\d{14}$/;
        if (!siretRegex.test(newClientForm.siret.trim())) {
          errors.siret = "Le SIREN doit contenir 9 chiffres ou le SIRET 14 chiffres";
        }
      }
      
      // Validation du numéro de TVA
      if (!newClientForm.vatNumber || newClientForm.vatNumber.trim() === "") {
        errors.vatNumber = "Le numéro de TVA est obligatoire pour les entreprises";
      }
    }

    // Validation de l'adresse de livraison si elle est activée
    if (newClientForm.hasDifferentShippingAddress) {
      if (!newClientForm.shippingAddress?.fullName || newClientForm.shippingAddress.fullName.trim() === "") {
        errors["shippingAddress.fullName"] = "Le nom complet de livraison est obligatoire";
      }
      
      if (!newClientForm.shippingAddress?.street || newClientForm.shippingAddress.street.trim() === "") {
        errors["shippingAddress.street"] = "L'adresse de livraison (rue) est obligatoire";
      }
      
      if (!newClientForm.shippingAddress?.city || newClientForm.shippingAddress.city.trim() === "") {
        errors["shippingAddress.city"] = "La ville de livraison est obligatoire";
      }
      
      // Validation du code postal de livraison
      if (!newClientForm.shippingAddress?.postalCode || newClientForm.shippingAddress.postalCode.trim() === "") {
        errors["shippingAddress.postalCode"] = "Le code postal de livraison est obligatoire";
      } else {
        const postalCodeRegex = /^\d{5}$/;
        if (!postalCodeRegex.test(newClientForm.shippingAddress.postalCode.trim())) {
          errors["shippingAddress.postalCode"] = "Le code postal de livraison doit contenir exactement 5 chiffres";
        }
      }
      
      if (!newClientForm.shippingAddress?.country || newClientForm.shippingAddress.country.trim() === "") {
        errors["shippingAddress.country"] = "Le pays de livraison est obligatoire";
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
          canEdit: true
        }
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

  const handleNewClientSubmit = async (e) => {
    e.preventDefault();

    // Validation des champs obligatoires
    const requiredFields = [
      { field: "name", label: "Le nom" },
      { field: "email", label: "L'email" },
      { field: "address.street", label: "La rue de l'adresse" },
      { field: "address.postalCode", label: "Le code postal" },
      { field: "address.city", label: "La ville" },
    ];

    // Vérifier les champs obligatoires
    let hasErrors = false;
    for (const { field, label } of requiredFields) {
      const value = field
        .split(".")
        .reduce((obj, key) => obj?.[key], newClientForm);
      if (!value || value.trim() === "") {
        toast.error(`${label} est obligatoire`);
        hasErrors = true;
      }
    }

    // Validation de l'email (obligatoire)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newClientForm.email || newClientForm.email.trim() === "") {
      toast.error("L'adresse email est obligatoire");
      hasErrors = true;
    } else if (!emailRegex.test(newClientForm.email.trim())) {
      toast.error("L'adresse email n'est pas valide");
      hasErrors = true;
    }

    // Validation du SIREN/SIRET pour les entreprises
    if (newClientForm.type === "COMPANY" && newClientForm.siret) {
      const siretRegex = /^\d{9}$|^\d{14}$/;
      if (!siretRegex.test(newClientForm.siret)) {
        toast.error("Le SIREN doit contenir 9 chiffres ou le SIRET 14 chiffres");
        hasErrors = true;
      }
    }

    // Validation du numéro de TVA pour les entreprises
    if (newClientForm.type === "COMPANY" && newClientForm.vatNumber) {
      const vatRegex = /^[A-Z]{2}[A-Z0-9]+$/;
      if (!vatRegex.test(newClientForm.vatNumber)) {
        toast.error(
          "Le numéro de TVA doit commencer par 2 lettres suivies de chiffres/lettres"
        );
        hasErrors = true;
      }
    }

    // Validation du code postal
    const postalCodeRegex = /^\d{5}$/;
    if (
      newClientForm.address.postalCode &&
      !postalCodeRegex.test(newClientForm.address.postalCode)
    ) {
      toast.error("Le code postal doit contenir exactement 5 chiffres");
      hasErrors = true;
    }

    // Si des erreurs sont détectées, arrêter la soumission
    if (hasErrors) {
      toast.error(
        "Veuillez corriger les erreurs avant de soumettre le formulaire"
      );
      return; // ARRÊT COMPLET - Aucune soumission possible
    }

    // Vérification finale de sécurité avant soumission
    if (
      !newClientForm.name?.trim() ||
      !newClientForm.email?.trim() ||
      !newClientForm.address?.street?.trim() ||
      !newClientForm.address?.postalCode?.trim() ||
      !newClientForm.address?.city?.trim()
    ) {
      toast.error("Des champs obligatoires sont manquants");
      return; // ARRÊT COMPLET - Double sécurité
    }

    try {
      // Préparation des données pour l'API - uniquement les champs acceptés par ClientInput
      const clientData = {
        type: newClientForm.type,
        name: newClientForm.name,
        email: newClientForm.email,
        firstName: newClientForm.firstName || undefined,
        lastName: newClientForm.lastName || undefined,
        siret: newClientForm.siret || undefined,
        vatNumber: newClientForm.vatNumber || undefined,
        hasDifferentShippingAddress:
          newClientForm.hasDifferentShippingAddress || false,
        address: {
          street: newClientForm.address.street,
          postalCode: newClientForm.address.postalCode,
          city: newClientForm.address.city,
          country: newClientForm.address.country || "France",
        },
        // Ne pas inclure l'adresse de livraison si elle n'est pas utilisée
        ...(newClientForm.hasDifferentShippingAddress && {
          shippingAddress: {
            fullName: newClientForm.shippingAddress.fullName || "",
            street: newClientForm.shippingAddress.street || "",
            postalCode: newClientForm.shippingAddress.postalCode || "",
            city: newClientForm.shippingAddress.city || "",
            country: newClientForm.shippingAddress.country || "France",
          },
        }),
      };

      // Supprimer les champs undefined pour éviter les erreurs GraphQL
      Object.keys(clientData).forEach((key) => {
        if (clientData[key] === undefined) {
          delete clientData[key];
        }
      });

      // Utiliser la fonction createClient retournée par le hook
      const createdClient = await createClient(clientData);

      if (createdClient) {
        // Le toast de succès est déjà géré par le hook
        onSelect?.(createdClient);
        resetNewClientForm();
        setActiveTab("existing");
        setOpen(false); // Fermer le popover après création
      }
    } catch (error) {
      // Le toast d'erreur est déjà géré par le hook
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
      hasDifferentShippingAddress: false,
      address: { ...defaultAddress },
      shippingAddress: { fullName: "", ...defaultAddress },
      notes: "",
    });
  };

  const handleSwitchToNewClient = () => {
    setActiveTab("new");
    setOpen(false);
    setQuery("");
    setSelectedValue("");
    setShowManualForm(false); // Masquer le formulaire manuel par défaut
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

      // Afficher le formulaire manuel pré-rempli
      setShowManualForm(true);

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

  // Fonction pour afficher le formulaire manuel
  const handleShowManualForm = () => {
    setShowManualForm(true);
    setCompanyQuery("");
    setCompanies([]);

    // Focus sur le premier champ du formulaire
    setTimeout(() => {
      const firstInput = document.querySelector("#client-type");
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  };

  return (
    <div className={cn("w-full", className)}>
      <Card className="shadow-none border-none bg-transparent">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <CardHeader className="p-0 pb-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="font-normal">Client existant</span>
              </TabsTrigger>
              <TabsTrigger value="new" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span className="font-normal">Nouveau client</span>
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="space-y-6 p-0">
            <TabsContent value="existing" className="m-0">
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className={cn(
                            "w-full justify-between font-normal",
                            !selectedValue && "text-muted-foreground",
                            hasClientError && "border-destructive focus-visible:ring-destructive"
                          )}
                          disabled={disabled}
                        >
                          {selectedValue || placeholder}
                          <ChevronDown
                            size={16}
                            className="shrink-0"
                            aria-hidden="true"
                          />
                        </Button>
                      </PopoverTrigger>
                    <PopoverContent
                      className="border-input p-0"
                      align="start"
                      side="top"
                      sideOffset={4}
                      avoidCollisions={false}
                      sticky="always"
                      style={{
                        width: 'var(--radix-popover-trigger-width)'
                      }}
                    >
                      <Command>
                        <CommandInput
                          placeholder="Rechercher un client..."
                          value={query}
                          onValueChange={setQuery}
                        />
                        <CommandList>
                          {loading ? (
                            <div className="p-3 text-center">
                              <LoaderCircle className="h-4 w-4 animate-spin mx-auto" />
                              <span className="text-sm ml-2">Recherche...</span>
                            </div>
                          ) : (
                            <>
                              <CommandEmpty>
                                <div className="p-3 text-center">
                                  <p className="text-sm mb-2">
                                    Aucun client trouvé
                                    {query && ` pour "${query}"`}
                                  </p>
                                  {query && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={handleSwitchToNewClient}
                                      className="text-xs"
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Créer "{query}" comme nouveau client
                                    </Button>
                                  )}
                                </div>
                              </CommandEmpty>
                              <CommandGroup>
                                {clients?.map((client) => {
                                  const IconComponent = getClientIcon(
                                    client.type
                                  );
                                  return (
                                    <CommandItem
                                      key={client.id}
                                      value={client.id}
                                      onSelect={() => {
                                        handleClientSelect(client);
                                        setOpen(false);
                                      }}
                                      className="flex items-center space-x-3 px-3 py-2"
                                    >
                                      <div className="p-1 bg-muted rounded">
                                        <IconComponent className="h-4 w-4 text-muted-foreground" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="font-normal truncate">
                                          {client.name}
                                        </div>
                                        <div className="text-sm truncate">
                                          {client.email}
                                        </div>
                                      </div>
                                      <Badge
                                        variant="outline"
                                        className="text-xs font-normal"
                                      >
                                        {CLIENT_TYPE_LABELS[client.type]}
                                      </Badge>
                                      {selectedClient?.id === client.id && (
                                        <CheckIcon
                                          size={16}
                                          className="ml-auto"
                                        />
                                      )}
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {hasClientError && (
                    <p className="text-xs text-destructive">
                      {validationErrors.client.message || "Veuillez sélectionner un client"}
                    </p>
                  )}
                  </div>

                  {selectedClient && (
                    <div className="space-y-3">
                      <div className="p-4 border rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start space-x-3 flex-1 min-w-0">
                            <div className="p-2 bg-primary/10 rounded flex-shrink-0">
                              {React.createElement(
                                getClientIcon(selectedClient.type),
                                {
                                  className: "h-4 w-4 text-primary",
                                }
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="mb-2">
                                <Badge variant="outline" className="text-xs font-normal">
                                  {CLIENT_TYPE_LABELS[selectedClient.type]}
                                </Badge>
                              </div>
                              <div className="font-normal">
                                {selectedClient.name}
                              </div>
                              <div className="text-sm">
                                {selectedClient.email}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0 ml-2">
                            {onEditClient && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => onEditClient(selectedClient)}
                                disabled={disabled}
                                className="gap-2"
                                title="Modifier le client"
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="hidden sm:inline">Modifier</span>
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                onSelect?.(null);
                                setSelectedValue("");
                                setQuery("");
                              }}
                            >
                              <X className="h-4 w-4" />
                              <span className="sr-only">
                                Supprimer la sélection
                              </span>
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Mention pour la position du client dans le PDF */}
                      <div className="p-3 border rounded-lg bg-muted/10">
                        <p className="text-xs text-muted-foreground">
                          💡 La position des informations client dans le PDF peut être modifiée dans les paramètres du devis (icône ⚙️ en haut à droite).
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="new" className="m-0">
              {!showManualForm ? (
                // Interface de recherche d'entreprises API Gouv Data
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="company-search"
                        className="text-sm font-normal flex items-center gap-2"
                      >
                        <Building className="h-4 w-4" />
                        Rechercher une entreprise
                      </Label>
                      <div className="relative">
                        <Input
                          id="company-search"
                          value={companyQuery}
                          onChange={(e) => setCompanyQuery(e.target.value)}
                          placeholder="Nom d'entreprise, SIRET, SIREN..."
                          className="h-10 rounded-lg text-sm w-full pl-10"
                          disabled={disabled}
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
                      <div className="flex items-center justify-center p-8">
                        <LoaderCircle className="h-6 w-6 animate-spin mr-2" />
                        <span className="text-sm">Recherche en cours...</span>
                      </div>
                    )}

                    {companies.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-normal">
                          Entreprises trouvées
                        </Label>
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {companies.map((company) => (
                            <div
                              key={company.id}
                              className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => handleCompanySelect(company)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Building className="h-4 w-4 text-primary flex-shrink-0" />
                                    <h4 className="font-normal text-sm truncate">
                                      {company.name}
                                    </h4>
                                    {company.status === "A" && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs bg-green-50 text-green-700 border-green-200"
                                      >
                                        Active
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">
                                      <strong>SIRET:</strong> {company.siret}
                                    </p>
                                    {company.address && (
                                      <p className="text-xs text-muted-foreground truncate">
                                        <strong>Adresse:</strong>{" "}
                                        {company.address}, {company.postalCode}{" "}
                                        {company.city}
                                      </p>
                                    )}
                                    {company.activityLabel && (
                                      <p className="text-xs text-muted-foreground truncate">
                                        <strong>Activité:</strong>{" "}
                                        {company.activityLabel}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {companyQuery &&
                      !loadingCompanies &&
                      companies.length === 0 && (
                        <div className="text-center p-8 text-muted-foreground">
                          <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">
                            Aucune entreprise trouvée pour "{companyQuery}"
                          </p>
                          <p className="text-xs mt-1">
                            Essayez avec un nom d'entreprise ou un SIRET
                          </p>
                        </div>
                      )}
                  </div>

                  {/* Bouton pour créer manuellement */}
                  <div className="pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleShowManualForm}
                      className="w-full h-10 text-sm font-normal"
                      disabled={disabled}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Créer un client manuellement
                    </Button>
                  </div>
                </div>
              ) : (
                // Formulaire manuel (affiché après sélection d'entreprise ou clic sur "Créer manuellement")
                <form onSubmit={handleNewClientSubmit} className="space-y-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="client-type"
                        className="text-sm font-normal"
                      >
                        Type de client
                      </Label>
                      <div className="w-full">
                        <Select
                          value={newClientForm.type}
                          onValueChange={(value) =>
                            setNewClientForm((prev) => ({
                              ...prev,
                              type: value,
                            }))
                          }
                        >
                          <SelectTrigger className="w-full h-10 rounded-lg text-sm">
                            <SelectValue placeholder="Sélectionner le type" />
                          </SelectTrigger>
                          <SelectContent className="w-full">
                            <SelectItem value="INDIVIDUAL">
                              Particulier
                            </SelectItem>
                            <SelectItem value="COMPANY">Entreprise</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {newClientForm.type === "COMPANY" ? (
                      <div className="space-y-4">
                        {/* Bouton pour rechercher une entreprise */}
                        <div className="flex justify-center">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowManualForm(false);
                              setCompanyQuery("");
                              setCompanies([]);
                              // Focus sur le champ de recherche après un court délai
                              setTimeout(() => {
                                const searchInput =
                                  document.getElementById("company-search");
                                if (searchInput) {
                                  searchInput.focus();
                                }
                              }, 100);
                            }}
                            className="h-10 text-sm"
                            disabled={disabled}
                          >
                            <Search className="h-4 w-4 mr-2" />
                            Rechercher une entreprise
                          </Button>
                        </div>

                        {/* Séparateur */}
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                              ou saisir manuellement
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="client-name"
                            className="text-sm font-normal"
                          >
                            Nom de l'entreprise
                          </Label>
                          <div className="relative">
                            <Input
                              id="client-name"
                              value={newClientForm.name}
                              onChange={(e) =>
                                setNewClientForm((prev) => ({
                                  ...prev,
                                  name: e.target.value,
                                }))
                              }
                              placeholder="Nom de l'entreprise"
                              className="h-10 rounded-lg text-sm w-full"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="client-firstname"
                            className="text-sm font-normal"
                          >
                            Prénom
                          </Label>
                          <Input
                            id="client-firstname"
                            value={newClientForm.firstName}
                            onChange={(e) =>
                              setNewClientForm((prev) => ({
                                ...prev,
                                firstName: e.target.value,
                                name: `${e.target.value} ${prev.lastName || ""}`.trim(),
                              }))
                            }
                            placeholder="Prénom"
                            className="h-10 rounded-lg text-sm w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="client-lastname"
                            className="text-sm font-normal"
                          >
                            Nom
                          </Label>
                          <Input
                            id="client-lastname"
                            value={newClientForm.lastName}
                            onChange={(e) =>
                              setNewClientForm((prev) => ({
                                ...prev,
                                lastName: e.target.value,
                                name: `${prev.firstName || ""} ${e.target.value}`.trim(),
                              }))
                            }
                            placeholder="Nom"
                            className="h-10 rounded-lg text-sm w-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="client-email"
                        className="text-sm font-normal"
                      >
                        Email
                      </Label>
                      <div className="relative">
                        <Input
                          id="client-email"
                          type="email"
                          value={newClientForm.email}
                          onChange={(e) =>
                            setNewClientForm((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          placeholder="contact@exemple.com"
                          className="h-10 rounded-lg text-sm w-full"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="client-phone"
                        className="text-sm font-normal"
                      >
                        Téléphone
                      </Label>
                      <div className="relative">
                        <Input
                          id="client-phone"
                          value={newClientForm.phone}
                          onChange={(e) =>
                            setNewClientForm((prev) => ({
                              ...prev,
                              phone: e.target.value,
                            }))
                          }
                          placeholder="01 23 45 67 89"
                          className="h-10 rounded-lg text-sm w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Champs spécifiques aux entreprises */}
                  {newClientForm.type === "COMPANY" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="client-siret"
                          className="text-sm font-normal"
                        >
                          SIREN/SIRET
                        </Label>
                        <div className="relative">
                          <Input
                            id="client-siret"
                            value={newClientForm.siret || ""}
                            onChange={(e) =>
                              setNewClientForm((prev) => ({
                                ...prev,
                                siret: e.target.value,
                              }))
                            }
                            placeholder="123456789 ou 12345678901234"
                            disabled={disabled}
                            className={cn(
                              "h-10 rounded-lg",
                              formErrors.siret && "border-red-500"
                            )}
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          Numéro SIREN (9 chiffres) ou SIRET (14 chiffres)
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="client-vat"
                          className="text-sm font-normal"
                        >
                          N° TVA
                        </Label>
                        <div className="relative">
                          <Input
                            id="client-vat"
                            value={newClientForm.vatNumber || ""}
                            onChange={(e) =>
                              setNewClientForm((prev) => ({
                                ...prev,
                                vatNumber: e.target.value,
                              }))
                            }
                            placeholder="FR12345678901"
                            className="h-10 rounded-lg text-sm w-full"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Adresse */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="h-px bg-gray-200 flex-1"></div>
                      <span className="text-sm font-normal text-gray-600">
                        Adresse de facturation
                      </span>
                      <div className="h-px bg-gray-200 flex-1"></div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="client-street"
                        className="text-sm font-normal"
                      >
                        Adresse
                      </Label>
                      <Input
                        id="client-street"
                        value={newClientForm.address?.street || ""}
                        onChange={(e) =>
                          setNewClientForm((prev) => ({
                            ...prev,
                            address: {
                              ...prev.address,
                              street: e.target.value,
                            },
                          }))
                        }
                        placeholder="123 rue de la Paix"
                        className="h-10 rounded-lg text-sm w-full"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="client-postal-code"
                          className="text-sm font-normal"
                        >
                          Code postal
                        </Label>
                        <Input
                          id="client-postal-code"
                          value={newClientForm.address?.postalCode || ""}
                          onChange={(e) =>
                            setNewClientForm((prev) => ({
                              ...prev,
                              address: {
                                ...prev.address,
                                postalCode: e.target.value,
                              },
                            }))
                          }
                          placeholder="75001"
                          className="h-10 rounded-lg text-sm w-full"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label
                          htmlFor="client-city"
                          className="text-sm font-normal"
                        >
                          Ville
                        </Label>
                        <Input
                          id="client-city"
                          value={newClientForm.address?.city || ""}
                          onChange={(e) =>
                            setNewClientForm((prev) => ({
                              ...prev,
                              address: {
                                ...prev.address,
                                city: e.target.value,
                              },
                            }))
                          }
                          placeholder="Paris"
                          className="h-10 rounded-lg text-sm w-full"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="client-country"
                        className="text-sm font-normal"
                      >
                        Pays
                      </Label>
                      <Input
                        id="client-country"
                        value={newClientForm.address?.country || "France"}
                        onChange={(e) =>
                          setNewClientForm((prev) => ({
                            ...prev,
                            address: {
                              ...prev.address,
                              country: e.target.value,
                            },
                          }))
                        }
                        placeholder="France"
                        className="h-10 rounded-lg text-sm w-full"
                      />
                    </div>
                  </div>

                  {/* Adresse */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="relative">
                        <Textarea
                          id="client-address"
                          value={`${newClientForm.address.street}\n${newClientForm.address.postalCode} ${newClientForm.address.city}\n${newClientForm.address.country}`}
                          onChange={(e) => {
                            const lines = e.target.value.split("\n");
                            const newAddress = {
                              street: lines[0] || "",
                              postalCode: lines[1]?.split(" ")[0] || "",
                              city:
                                lines[1]
                                  ?.split(" ")
                                  .slice(1)
                                  .join(" ")
                                  .trim() || "",
                              country: (lines[2] || "France").trim(),
                            };

                            setNewClientForm((prev) => ({
                              ...prev,
                              address: {
                                ...defaultAddress, // S'assurer que tous les champs sont définis
                                ...prev.address, // Conserver les valeurs existantes
                                ...newAddress, // Appliquer les nouvelles valeurs
                              },
                            }));
                          }}
                          placeholder="123 Rue de la Paix\n75001 Paris\nFrance"
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer pointer-events-none"
                          rows={1}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="different-shipping-address"
                          checked={
                            newClientForm.hasDifferentShippingAddress || false
                          }
                          onCheckedChange={(checked) => {
                            setNewClientForm((prev) => ({
                              ...prev,
                              hasDifferentShippingAddress: Boolean(checked),
                            }));
                          }}
                        />
                        <Label
                          htmlFor="different-shipping-address"
                          className="text-sm font-normal cursor-pointer"
                        >
                          Utiliser une adresse de livraison différente
                        </Label>
                      </div>

                      {newClientForm.hasDifferentShippingAddress && (
                        <div className="space-y-4 px-6 pt-2 border-l-2 border-gray-200">
                          <Label className="text-sm font-normal text-gray-700">
                            Adresse de livraison
                          </Label>

                          {/* Nom complet */}
                          <div className="space-y-2">
                            <Label
                              htmlFor="shipping-fullname"
                              className="text-sm font-normal"
                            >
                              Nom complet
                            </Label>
                            <Input
                              id="shipping-fullname"
                              value={
                                newClientForm.shippingAddress?.fullName || ""
                              }
                              onChange={(e) =>
                                setNewClientForm((prev) => ({
                                  ...prev,
                                  shippingAddress: {
                                    ...prev.shippingAddress,
                                    fullName: e.target.value,
                                  },
                                }))
                              }
                              placeholder="Nom complet du destinataire"
                              className="h-10 rounded-lg text-sm w-full"
                            />
                            {formErrors["shippingAddress.fullName"] && (
                              <p className="text-xs text-red-500">
                                {formErrors["shippingAddress.fullName"]}
                              </p>
                            )}
                          </div>

                          {/* Rue */}
                          <div className="space-y-2">
                            <Label
                              htmlFor="shipping-street"
                              className="text-sm font-normal"
                            >
                              Rue
                            </Label>
                            <Input
                              id="shipping-street"
                              value={
                                newClientForm.shippingAddress?.street || ""
                              }
                              onChange={(e) =>
                                setNewClientForm((prev) => ({
                                  ...prev,
                                  shippingAddress: {
                                    ...prev.shippingAddress,
                                    street: e.target.value,
                                  },
                                }))
                              }
                              placeholder="123 Rue de la Paix"
                              className="h-10 rounded-lg text-sm w-full"
                            />
                            {formErrors["shippingAddress.street"] && (
                              <p className="text-xs text-red-500">
                                {formErrors["shippingAddress.street"]}
                              </p>
                            )}
                          </div>

                          {/* Code postal et Ville */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label
                                htmlFor="shipping-postal-code"
                                className="text-sm font-normal"
                              >
                                Code postal
                              </Label>
                              <Input
                                id="shipping-postal-code"
                                value={
                                  newClientForm.shippingAddress?.postalCode ||
                                  ""
                                }
                                onChange={(e) =>
                                  setNewClientForm((prev) => ({
                                    ...prev,
                                    shippingAddress: {
                                      ...prev.shippingAddress,
                                      postalCode: e.target.value,
                                    },
                                  }))
                                }
                                placeholder="75001"
                                className="h-10 rounded-lg text-sm w-full"
                              />
                              {formErrors["shippingAddress.postalCode"] && (
                                <p className="text-xs text-red-500">
                                  {formErrors["shippingAddress.postalCode"]}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor="shipping-city"
                                className="text-sm font-normal"
                              >
                                Ville
                              </Label>
                              <Input
                                id="shipping-city"
                                value={
                                  newClientForm.shippingAddress?.city || ""
                                }
                                onChange={(e) =>
                                  setNewClientForm((prev) => ({
                                    ...prev,
                                    shippingAddress: {
                                      ...prev.shippingAddress,
                                      city: e.target.value,
                                    },
                                  }))
                                }
                                placeholder="Paris"
                                className="h-10 rounded-lg text-sm w-full"
                              />
                              {formErrors["shippingAddress.city"] && (
                                <p className="text-xs text-red-500">
                                  {formErrors["shippingAddress.city"]}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Pays */}
                          <div className="space-y-2">
                            <Label
                              htmlFor="shipping-country"
                              className="text-sm font-normal"
                            >
                              Pays
                            </Label>
                            <Input
                              id="shipping-country"
                              value={
                                newClientForm.shippingAddress?.country ||
                                "France"
                              }
                              onChange={(e) =>
                                setNewClientForm((prev) => ({
                                  ...prev,
                                  shippingAddress: {
                                    ...prev.shippingAddress,
                                    country: e.target.value,
                                  },
                                }))
                              }
                              placeholder="France"
                              className="h-10 rounded-lg text-sm w-full"
                            />
                            {formErrors["shippingAddress.country"] && (
                              <p className="text-xs text-red-500">
                                {formErrors["shippingAddress.country"]}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="client-notes"
                      className="text-sm font-normal"
                    >
                      Notes (optionnel)
                    </Label>
                    <Textarea
                      id="client-notes"
                      value={newClientForm.notes}
                      onChange={(e) =>
                        setNewClientForm((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder="Notes internes sur ce client..."
                      rows={2}
                      className="rounded-lg px-3 py-2 text-sm resize-none"
                    />
                    <p className="text-xs">
                      Ces notes ne seront visibles que par vous
                    </p>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        // Nettoyer les erreurs locales et globales d'abord
                        setFormErrors({});
                        if (setValidationErrors) {
                          setValidationErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.newClient;
                            return newErrors;
                          });
                        }
                        // Puis réinitialiser le formulaire
                        resetNewClientForm();
                        // Masquer le formulaire manuel
                        setShowManualForm(false);
                        // Retourner à l'onglet clients existants
                        setActiveTab("existing");
                      }}
                      disabled={disabled}
                      className="h-10 px-4 text-sm font-normal"
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        createLoading ||
                        !newClientForm.name ||
                        !newClientForm.email ||
                        disabled
                      }
                      className="h-10 px-4 text-sm font-normal"
                    >
                      {createLoading ? (
                        <>
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          Création...
                        </>
                      ) : (
                        "Créer le client"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
