"use client";

import { UserRoundPlusIcon, Globe } from "lucide-react";

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
import { useState } from "react";

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
      type: client?.type || "INDIVIDUAL",
      name: client?.name || "",
      firstName: client?.firstName || "",
      lastName: client?.lastName || "",
      email: client?.email || "",
      address: {
        street: client?.address?.street || "",
        city: client?.address?.city || "",
        postalCode: client?.address?.postalCode || "",
        country: client?.address?.country || "",
      },
      shippingAddress: {
        street: client?.shippingAddress?.street || "",
        city: client?.shippingAddress?.city || "",
        postalCode: client?.shippingAddress?.postalCode || "",
        country: client?.shippingAddress?.country || "",
      },
      siret: client?.siret || "",
      vatNumber: client?.vatNumber || "",
      isInternational: client?.isInternational || false,
    },
  });

  const [hasDifferentShipping, setHasDifferentShipping] = useState(
    client?.hasDifferentShippingAddress || false
  );
  const clientType = watch("type");
  const isInternational = watch("isInternational");

  const onSubmit = async (formData) => {
    try {
      const clientData = {
        ...formData,
        hasDifferentShippingAddress: hasDifferentShipping,
        shippingAddress: hasDifferentShipping ? formData.shippingAddress : null,
        isInternational: formData.isInternational || false,
      };

      let result;
      if (isEditing) {
        result = await updateClient({
          id: client.id,
          input: clientData,
        });
      } else {
        result = await createClient(clientData);
      }

      if (onSave) {
        await onSave(result);
      }

      toast.success(
        isEditing ? "Client modifié avec succès" : "Client créé avec succès"
      );
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde du client");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="hidden">
          Ajouter un collaborateur
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full h-full max-w-full md:max-w-lg md:h-auto">
        <div className="p-6 md:p-0">
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

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5 max-h-[70vh] md:max-h-[70vh] p-1 overflow-y-auto"
          >
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

              {/* Sélecteur de localisation pour les entreprises */}
              {clientType === "COMPANY" && (
                <div className="space-y-2">
                  <Label>Localisation de l'entreprise *</Label>
                  <Controller
                    name="isInternational"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value ? "international" : "france"}
                        onValueChange={(value) =>
                          field.onChange(value === "international")
                        }
                      >
                        <SelectTrigger>
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
                </div>
              )}

              {/* Nom/Raison sociale */}
              <div className="space-y-2">
                <Label>
                  {clientType === "COMPANY" ? "Raison sociale" : "Nom"} *
                </Label>
                <Input
                  placeholder={
                    clientType === "COMPANY"
                      ? "Nom de l'entreprise"
                      : "Nom du client"
                  }
                  {...register("name", { required: "Ce champ est requis" })}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              {/* Prénom et Nom (pour particuliers) */}
              {clientType === "INDIVIDUAL" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prénom</Label>
                    <Input placeholder="Prénom" {...register("firstName")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Nom de famille</Label>
                    <Input
                      placeholder="Nom de famille"
                      {...register("lastName")}
                    />
                  </div>
                </div>
              )}

              {/* Email */}
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
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Adresse de facturation */}
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Adresse de facturation
                </Label>

                <div className="space-y-2">
                  <Label>Adresse</Label>
                  <Textarea
                    placeholder="123 Rue de la Paix"
                    {...register("address.street")}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ville</Label>
                    <Input placeholder="Paris" {...register("address.city")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Code postal</Label>
                    <Input
                      placeholder="75001"
                      {...register("address.postalCode")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Pays</Label>
                  <Input
                    placeholder="France"
                    {...register("address.country")}
                  />
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
                  <Label className="text-base font-medium">
                    Adresse de livraison
                  </Label>

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
                        {...register("shippingAddress.city")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Code postal</Label>
                      <Input
                        placeholder="75001"
                        {...register("shippingAddress.postalCode")}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Pays</Label>
                    <Input
                      placeholder="France"
                      {...register("shippingAddress.country")}
                    />
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
                    <Label>
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
                      {...register("siret", {
                        validate: (value) => {
                          const currentIsInternational =
                            watch("isInternational");
                          if (!value || value.trim() === "") {
                            return currentIsInternational
                              ? "Le numéro d'identification est obligatoire"
                              : "Le SIREN/SIRET est obligatoire";
                          }
                          if (!currentIsInternational) {
                            const siretRegex = /^\d{9}$|^\d{14}$/;
                            if (!siretRegex.test(value)) {
                              return "Le SIREN doit contenir 9 chiffres ou le SIRET 14 chiffres";
                            }
                          }
                          return true;
                        },
                      })}
                    />
                    {errors.siret && (
                      <p className="text-sm text-red-500">
                        {errors.siret.message}
                      </p>
                    )}
                    {isInternational && (
                      <p className="text-xs text-muted-foreground">
                        Numéro d'identification fiscale ou équivalent local (ex:
                        VAT, EIN, etc.)
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Numéro de TVA</Label>
                    <Input
                      placeholder={
                        isInternational
                          ? "Numéro de TVA (format libre)"
                          : "FR12345678901"
                      }
                      {...register("vatNumber", {
                        validate: (value) => {
                          const currentIsInternational =
                            watch("isInternational");
                          if (currentIsInternational) return true;
                          if (value && value.trim() !== "") {
                            const vatRegex = /^[A-Z]{2}[0-9A-Z]{2,12}$/;
                            if (!vatRegex.test(value)) {
                              return "Format de numéro de TVA invalide (ex: FR12345678901)";
                            }
                          }
                          return true;
                        },
                      })}
                    />
                    {errors.vatNumber && (
                      <p className="text-sm text-red-500">
                        {errors.vatNumber.message}
                      </p>
                    )}
                    {isInternational && (
                      <p className="text-xs text-muted-foreground">
                        Optionnel - Format libre pour les entreprises hors UE
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading
                  ? "Enregistrement..."
                  : isEditing
                    ? "Modifier"
                    : "Créer"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
