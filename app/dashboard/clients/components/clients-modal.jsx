"use client";

import { UserRoundPlusIcon, Search, Building, Loader2, ExternalLink } from "lucide-react";

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
import { useForm, Controller } from "react-hook-form";
import { toast } from "@/src/components/ui/sonner";
import { useCreateClient, useUpdateClient } from "@/src/hooks/useClients";
import { useState, useEffect } from "react";
import { validateField, VALIDATION_PATTERNS } from "@/src/lib/validation";
import { cn } from "@/src/lib/utils";

// Import API Gouv utilities
import { searchCompanies, convertCompanyToClient } from "@/src/utils/api-gouv";

export default function ClientsModal({ client, onSave, open, onOpenChange }) {
  const { createClient, loading: createLoading } = useCreateClient();
  const { updateClient, loading: updateLoading } = useUpdateClient();
  const isEditing = !!client;
  const loading = createLoading || updateLoading;

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
    },
  });

  const [hasDifferentShipping, setHasDifferentShipping] = useState(false);
  const [customErrors, setCustomErrors] = useState({});
  const clientType = watch("type");

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
        message: pattern.message
      };
    }
    
    return rules;
  };

  // États pour la recherche d'entreprises via API Gouv
  const [companyQuery, setCompanyQuery] = useState("");
  const [debouncedCompanyQuery, setDebouncedCompanyQuery] = useState("");
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [showCompanySearch, setShowCompanySearch] = useState(false);

  // Mettre à jour le formulaire quand le client change
  useEffect(() => {
    if (client) {
      reset({
        type: client.type || "INDIVIDUAL",
        name: client.name || "",
        firstName: client.firstName || "",
        lastName: client.lastName || "",
        email: client.email || "",
        address: {
          street: client.address?.street || "",
          city: client.address?.city || "",
          postalCode: client.address?.postalCode || "",
          country: client.address?.country || "",
        },
        shippingAddress: {
          fullName: client.shippingAddress?.fullName || "",
          street: client.shippingAddress?.street || "",
          city: client.shippingAddress?.city || "",
          postalCode: client.shippingAddress?.postalCode || "",
          country: client.shippingAddress?.country || "",
        },
        siret: client.siret || "",
        vatNumber: client.vatNumber || "",
      });
      setHasDifferentShipping(client.hasDifferentShippingAddress || false);
    } else {
      // Réinitialiser pour un nouveau client
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
      });
      setHasDifferentShipping(false);
    }
  }, [client, reset]);

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
        console.error("Erreur recherche API Gouv:", error);
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
    if (!siren || siren.length !== 9) return '';
    const key = (12 + 3 * (parseInt(siren) % 97)) % 97;
    return `FR${key.toString().padStart(2, '0')}${siren}`;
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
      console.error("Erreur lors de l'import de l'entreprise:", error);
      toast.error("Erreur lors de l'import de l'entreprise");
    }
  };

  const onSubmit = async (formData) => {
    try {
      // Validation finale avant soumission
      const hasFormErrors = Object.keys(errors).length > 0;
      const hasCustomErrors = Object.keys(customErrors).length > 0;
      
      if (hasFormErrors || hasCustomErrors) {
        toast.error("Veuillez corriger les erreurs avant de soumettre le formulaire");
        return;
      }

      const clientData = {
        ...formData,
        hasDifferentShippingAddress: hasDifferentShipping,
        shippingAddress: hasDifferentShipping ? formData.shippingAddress : null,
      };

      let result;
      if (isEditing) {
        result = await updateClient(client.id, clientData);
      } else {
        result = await createClient(clientData);
      }

      if (onSave) {
        await onSave(result);
      }

      // La notification est déjà gérée par le hook useUpdateClient/useCreateClient
      reset();
      setCustomErrors({});
      onOpenChange(false);
    } catch (error) {
      // La notification d'erreur est déjà gérée par le hook useCreateClient/useUpdateClient
      // Ne pas afficher de notification supplémentaire ici
      console.error(error);
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
      <DialogContent className="flex flex-col max-h-[90vh] my-4 p-0 overflow-hidden">
        <div className="flex flex-col gap-2 p-6 pb-0">
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
                <Label>Type de client *</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez le type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INDIVIDUAL">Particulier</SelectItem>
                        <SelectItem value="COMPANY">Entreprise</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Recherche d'entreprises via API Gouv Data */}
              {clientType === "COMPANY" && !showCompanySearch && (
                <div className="space-y-3 p-4 border rounded-lg bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Building className="h-4 w-4" />
                    <span className="font-medium text-sm">Rechercher une entreprise française</span>
                  </div>
                  <p className="text-xs text-blue-600">
                    Importez automatiquement les informations d'une entreprise depuis la base officielle
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCompanySearch(true)}
                    className="w-full h-9 text-sm border-blue-300 hover:bg-blue-100"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Rechercher via API Data.gouv
                  </Button>
                </div>
              )}

              {/* Interface de recherche d'entreprises */}
              {clientType === "COMPANY" && showCompanySearch && (
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-primary" />
                      <Label className="font-medium">Rechercher une entreprise</Label>
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
                      className="h-8 w-8 p-0"
                    >
                      ×
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        value={companyQuery}
                        onChange={(e) => setCompanyQuery(e.target.value)}
                        placeholder="Nom d'entreprise, SIRET, SIREN..."
                        className="h-9 text-sm pl-10"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Recherchez une entreprise française via la base de données officielle
                    </p>
                  </div>

                  {/* Résultats de recherche */}
                  {loadingCompanies && (
                    <div className="flex items-center justify-center p-6">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      <span className="text-sm">Recherche en cours...</span>
                    </div>
                  )}

                  {companies.length > 0 && (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {companies.map((company) => (
                        <div
                          key={company.id}
                          className="p-3 border rounded-lg hover:bg-white cursor-pointer transition-colors"
                          onClick={() => handleCompanySelect(company)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Building className="h-4 w-4 text-primary flex-shrink-0" />
                                <h4 className="font-medium text-sm truncate">
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
                                    <strong>Adresse:</strong> {company.address}, {company.postalCode} {company.city}
                                  </p>
                                )}
                              </div>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {companyQuery && !loadingCompanies && companies.length === 0 && (
                    <div className="text-center p-6 text-muted-foreground">
                      <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">
                        Aucune entreprise trouvée pour "{companyQuery}"
                      </p>
                      <p className="text-xs mt-1">
                        Essayez avec un nom d'entreprise ou un SIRET
                      </p>
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCompanySearch(false);
                        setCompanyQuery("");
                        setCompanies([]);
                      }}
                      className="w-full h-9 text-sm"
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
                  <Label>Raison sociale *</Label>
                  <Input
                    placeholder="Nom de l'entreprise"
                    className={cn(errors.name && "border-red-500 focus:border-red-500")}
                    {...register("name", getValidationRules("companyName", true))}
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
                      className={cn(errors.firstName && "border-red-500 focus:border-red-500")}
                      {...register("firstName", {
                        required: "Le prénom est requis",
                        pattern: {
                          value: /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/,
                          message: "Le prénom doit contenir entre 2 et 50 caractères (lettres, espaces, apostrophes et tirets uniquement)",
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
                    <Label>Nom *</Label>
                    <Input
                      placeholder="Nom"
                      className={cn(errors.lastName && "border-red-500 focus:border-red-500")}
                      {...register("lastName", {
                        required: "Le nom est requis",
                        pattern: {
                          value: /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/,
                          message: "Le nom doit contenir entre 2 et 50 caractères (lettres, espaces, apostrophes et tirets uniquement)",
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
                  {/* Contact pour entreprises */}
                  <div className="space-y-2">
                    <Label>Contact</Label>
                    <Input
                      placeholder="Nom du contact"
                      className={cn(errors.firstName && "border-red-500 focus:border-red-500")}
                      {...register("firstName", {
                        pattern: {
                          value: /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/,
                          message: "Le nom du contact doit contenir entre 2 et 50 caractères (lettres, espaces, apostrophes et tirets uniquement)",
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
                    <Label>Email *</Label>
                    <InputEmail
                      placeholder="contact@entreprise.com"
                      className={cn(errors.email && "border-red-500 focus:border-red-500")}
                      {...register("email", getValidationRules("email", true))}
                    />
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
                  <Label>Email *</Label>
                  <InputEmail
                    placeholder="client@exemple.com"
                    className={cn(errors.email && "border-red-500 focus:border-red-500")}
                    {...register("email", getValidationRules("email", true))}
                  />
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
                  <Label>Adresse de facturation *</Label>
                  <Textarea
                    placeholder="123 Rue de la Paix"
                    className={cn(errors.address?.street && "border-red-500 focus:border-red-500")}
                    {...register("address.street", getValidationRules("street", true))}
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
                    <Label>Ville *</Label>
                    <Input
                      placeholder="Paris"
                      className={cn(errors.address?.city && "border-red-500 focus:border-red-500")}
                      {...register("address.city", getValidationRules("city", true))}
                    />
                    {errors.address?.city && (
                      <p className="text-sm text-red-500">
                        {errors.address.city.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Code postal *</Label>
                    <Input
                      placeholder="75001"
                      className={cn(errors.address?.postalCode && "border-red-500 focus:border-red-500")}
                      {...register("address.postalCode", getValidationRules("postalCode", true))}
                    />
                    {errors.address?.postalCode && (
                      <p className="text-sm text-red-500">
                        {errors.address.postalCode.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Pays *</Label>
                  <Input
                    placeholder="France"
                    className={cn(errors.address?.country && "border-red-500 focus:border-red-500")}
                    {...register("address.country", getValidationRules("country", true))}
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
                <Label htmlFor="differentShipping">
                  Adresse de livraison différente
                </Label>
              </div>

              {/* Adresse de livraison */}
              {hasDifferentShipping && (
                <div className="space-y-3 border-l-2 border-gray-200 pl-4">
                  <Label className="text-base font-medium">Adresse de livraison</Label>

                  <div className="space-y-2">
                    <Label>Nom complet du destinataire</Label>
                    <Input
                      placeholder="Nom complet du destinataire"
                      className={cn(errors.shippingAddress?.fullName && "border-red-500 focus:border-red-500")}
                      {...register("shippingAddress.fullName", {
                        pattern: {
                          value: /^[a-zA-ZÀ-ÿ\s'-]{2,100}$/,
                          message: "Le nom complet doit contenir entre 2 et 100 caractères (lettres, espaces, apostrophes et tirets uniquement)",
                        },
                      })}
                    />
                    {errors.shippingAddress?.fullName && (
                      <p className="text-sm text-red-500">
                        {errors.shippingAddress.fullName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Adresse *</Label>
                    <Textarea
                      placeholder="123 Rue de la Livraison"
                      className={cn(errors.shippingAddress?.street && "border-red-500 focus:border-red-500")}
                      {...register("shippingAddress.street", getValidationRules("street", hasDifferentShipping))}
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
                      <Label>Ville *</Label>
                      <Input
                        placeholder="Paris"
                        className={cn(errors.shippingAddress?.city && "border-red-500 focus:border-red-500")}
                        {...register("shippingAddress.city", getValidationRules("city", hasDifferentShipping))}
                      />
                      {errors.shippingAddress?.city && (
                        <p className="text-sm text-red-500">
                          {errors.shippingAddress.city.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Code postal *</Label>
                      <Input
                        placeholder="75001"
                        className={cn(errors.shippingAddress?.postalCode && "border-red-500 focus:border-red-500")}
                        {...register("shippingAddress.postalCode", getValidationRules("postalCode", hasDifferentShipping))}
                      />
                      {errors.shippingAddress?.postalCode && (
                        <p className="text-sm text-red-500">
                          {errors.shippingAddress.postalCode.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Pays *</Label>
                    <Input
                      placeholder="France"
                      className={cn(errors.shippingAddress?.country && "border-red-500 focus:border-red-500")}
                      {...register("shippingAddress.country", getValidationRules("country", hasDifferentShipping))}
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
                  <Label className="text-base font-medium">
                    Informations entreprise
                  </Label>

                  <div className="space-y-2">
                    <Label>SIRET</Label>
                    <Input
                      placeholder="12345678901234"
                      className={cn(errors.siret && "border-red-500 focus:border-red-500")}
                      {...register("siret", getValidationRules("siret"))}
                    />
                    {errors.siret && (
                      <p className="text-sm text-red-500">
                        {errors.siret.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Numéro de TVA</Label>
                    <Input
                      placeholder="FR12345678901"
                      className={cn(errors.vatNumber && "border-red-500 focus:border-red-500")}
                      {...register("vatNumber", getValidationRules("vatNumber"))}
                    />
                    {errors.vatNumber && (
                      <p className="text-sm text-red-500">
                        {errors.vatNumber.message}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Boutons fixés en bas */}
          <div className="flex gap-3 p-6 pt-4 border-t bg-background">
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
              disabled={loading || Object.keys(errors).length > 0 || Object.keys(customErrors).length > 0} 
              className="flex-1"
            >
              {loading ? "Enregistrement..." : isEditing ? "Modifier" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
