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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    },
  });

  const [hasDifferentShipping, setHasDifferentShipping] = useState(
    client?.hasDifferentShippingAddress || false
  );
  const clientType = watch("type");

  const onSubmit = async (formData) => {
    try {
      const clientData = {
        ...formData,
        hasDifferentShippingAddress: hasDifferentShipping,
        shippingAddress: hasDifferentShipping ? formData.shippingAddress : null,
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
      <DialogContent
        className={`flex flex-col p-0 overflow-hidden ${
          isMobile
            ? "!fixed !inset-0 !w-screen !max-w-none !m-0 !rounded-none !translate-x-0 !translate-y-0"
            : "max-h-[90vh] my-4 sm:max-w-lg"
        }`}
        style={isMobile ? { height: '100dvh' } : {}}
      >
        {/* Header fixe */}
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

        {/* Contenu scrollable */}
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
              </div>
            )}

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
                <Input placeholder="France" {...register("address.country")} />
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
                  <Label>SIRET</Label>
                  <Input placeholder="12345678901234" {...register("siret")} />
                </div>

                <div className="space-y-2">
                  <Label>Numéro de TVA</Label>
                  <Input
                    placeholder="FR12345678901"
                    {...register("vatNumber")}
                  />
                </div>
              </div>
            )}
          </div>
          </div>

          {/* Footer dans le flux flex - s'adapte automatiquement à Safari */}
          <div 
            className="flex-shrink-0 flex gap-3 px-6 py-4 border-t bg-background"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
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
              onClick={handleSubmit(onSubmit)} 
              disabled={loading} 
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
