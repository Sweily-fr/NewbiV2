"use client";

import { UserRoundPlusIcon } from "lucide-react";

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
import { useForm, Controller } from "react-hook-form";
import { toast } from "@/src/components/ui/sonner";
import { useCreateClient, useUpdateClient } from "@/src/hooks/useClients";
import { useState, useEffect } from "react";

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
    formState: { errors },
  } = useForm({
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
  const clientType = watch("type");

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

  const onSubmit = async (formData) => {
    try {
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

              {/* Nom/Raison sociale */}
              {/* Raison sociale uniquement pour les entreprises */}
              {clientType === "COMPANY" && (
                <div className="space-y-2">
                  <Label>Raison sociale *</Label>
                  <Input
                    placeholder="Nom de l'entreprise"
                    {...register("name", {
                      required: "Ce champ est requis",
                      pattern: {
                        value: /^[a-zA-ZÀ-ÿ0-9\s&'"\-.,()]{2,100}$/,
                        message:
                          "Le nom de l'entreprise doit contenir entre 2 et 100 caractères",
                      },
                    })}
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
                    <Label>Nom *</Label>
                    <Input
                      placeholder="Nom"
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
                  {/* Contact pour entreprises */}
                  <div className="space-y-2">
                    <Label>Contact</Label>
                    <Input
                      placeholder="Nom du contact"
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
                    <Label>Email *</Label>
                    <InputEmail
                      placeholder="contact@entreprise.com"
                      {...register("email", {
                        required: "L'email est requis",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Email invalide",
                        },
                      })}
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
                    {...register("email", {
                      required: "L'email est requis",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Email invalide",
                      },
                    })}
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
                  <Label> Adresse de facturation</Label>
                  <Textarea
                    placeholder="123 Rue de la Paix"
                    {...register("address.street")}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ville</Label>
                    <Input
                      placeholder="Paris"
                      {...register("address.city", {
                        pattern: {
                          value: /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/,
                          message:
                            "La ville doit contenir entre 2 et 50 caractères (lettres, espaces, apostrophes et tirets uniquement)",
                        },
                      })}
                    />
                    {errors.address?.city && (
                      <p className="text-sm text-red-500">
                        {errors.address.city.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Code postal</Label>
                    <Input
                      placeholder="75001"
                      {...register("address.postalCode", {
                        pattern: {
                          value: /^[0-9]{5}$/,
                          message:
                            "Le code postal doit contenir exactement 5 chiffres",
                        },
                      })}
                    />
                    {errors.address?.postalCode && (
                      <p className="text-sm text-red-500">
                        {errors.address.postalCode.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Pays</Label>
                  <Input
                    placeholder="France"
                    {...register("address.country", {
                      pattern: {
                        value: /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/,
                        message:
                          "Le pays doit contenir entre 2 et 50 caractères (lettres, espaces, apostrophes et tirets uniquement)",
                      },
                    })}
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

                  <div className="space-y-2">
                    <Label>Nom complet</Label>
                    <Input
                      placeholder="Nom complet du destinataire"
                      {...register("shippingAddress.fullName", {
                        pattern: {
                          value: /^[a-zA-ZÀ-ÿ\s'-]{2,100}$/,
                          message:
                            "Le nom complet doit contenir entre 2 et 100 caractères (lettres, espaces, apostrophes et tirets uniquement)",
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
                    <Label>Adresse</Label>
                    <Textarea
                      placeholder="123 Rue de la Livraison"
                      {...register("shippingAddress.street")}
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Ville</Label>
                      <Input
                        placeholder="Paris"
                        {...register("shippingAddress.city", {
                          pattern: {
                            value: /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/,
                            message:
                              "La ville doit contenir entre 2 et 50 caractères (lettres, espaces, apostrophes et tirets uniquement)",
                          },
                        })}
                      />
                      {errors.shippingAddress?.city && (
                        <p className="text-sm text-red-500">
                          {errors.shippingAddress.city.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Code postal</Label>
                      <Input
                        placeholder="75001"
                        {...register("shippingAddress.postalCode", {
                          pattern: {
                            value: /^[0-9]{5}$/,
                            message:
                              "Le code postal doit contenir exactement 5 chiffres",
                          },
                        })}
                      />
                      {errors.shippingAddress?.postalCode && (
                        <p className="text-sm text-red-500">
                          {errors.shippingAddress.postalCode.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Pays</Label>
                    <Input
                      placeholder="France"
                      {...register("shippingAddress.country", {
                        pattern: {
                          value: /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/,
                          message:
                            "Le pays doit contenir entre 2 et 50 caractères (lettres, espaces, apostrophes et tirets uniquement)",
                        },
                      })}
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
                      {...register("siret", {
                        pattern: {
                          value: /^[0-9]{14}$/,
                          message:
                            "Le SIRET doit contenir exactement 14 chiffres",
                        },
                      })}
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
                      {...register("vatNumber", {
                        pattern: {
                          value: /^[A-Z]{2}[0-9A-Z]{2,13}$/,
                          message: "Format de TVA invalide (ex: FR12345678901)",
                        },
                      })}
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
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Enregistrement..." : isEditing ? "Modifier" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
