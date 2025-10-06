"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog"
import { Button } from "@/src/components/ui/button"
import { InputWithError } from "@/src/components/ui/input-with-error"
import { Label } from "@/src/components/ui/label"
import { Textarea } from "@/src/components/ui/textarea"
import { useUpdateClient } from "@/src/graphql/clientQueries"
import { toast } from "@/src/components/ui/sonner"

interface QuickEditClientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: any
  onClientUpdated?: (updatedClient: any) => void
}

export function QuickEditClientModal({
  open,
  onOpenChange,
  client,
  onClientUpdated,
}: QuickEditClientModalProps) {
  const [saving, setSaving] = useState(false)
  const { updateClient } = useUpdateClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: client?.name || "",
      email: client?.email || "",
      phone: client?.phone || "",
      siret: client?.siret || "",
      vatNumber: client?.vatNumber || "",
      addressStreet: client?.address?.street || "",
      addressCity: client?.address?.city || "",
      addressPostalCode: client?.address?.postalCode || "",
      addressCountry: client?.address?.country || "",
    },
  })

  const onSubmit = async (data: any) => {
    try {
      setSaving(true)

      const input = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        siret: data.siret,
        vatNumber: data.vatNumber,
        address: {
          street: data.addressStreet,
          city: data.addressCity,
          postalCode: data.addressPostalCode,
          country: data.addressCountry,
        },
      }

      const result = await updateClient(client.id, input)

      if (result) {
        toast.success("Client mis à jour avec succès")
        onClientUpdated?.(result)
        onOpenChange(false)
        reset()
      }
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du client:", error)
      toast.error(error.message || "Erreur lors de la mise à jour du client")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier les informations du client</DialogTitle>
          <DialogDescription>
            Corrigez les informations du client directement depuis l'éditeur
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputWithError
              label="Nom du client *"
              {...register("name", { required: "Le nom est requis" })}
              error={errors.name?.message as string}
            />

            <InputWithError
              label="Email *"
              type="email"
              {...register("email", {
                required: "L'email est requis",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Email invalide",
                },
              })}
              error={errors.email?.message as string}
            />

            <InputWithError
              label="Téléphone"
              {...register("phone")}
              error={errors.phone?.message as string}
            />

            <InputWithError
              label="SIRET"
              {...register("siret")}
              error={errors.siret?.message as string}
            />

            <InputWithError
              label="Numéro de TVA"
              {...register("vatNumber")}
              error={errors.vatNumber?.message as string}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Adresse</h3>
            
            <InputWithError
              label="Rue"
              {...register("addressStreet")}
              error={errors.addressStreet?.message as string}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputWithError
                label="Ville"
                {...register("addressCity")}
                error={errors.addressCity?.message as string}
              />

              <InputWithError
                label="Code postal"
                {...register("addressPostalCode")}
                error={errors.addressPostalCode?.message as string}
              />

              <InputWithError
                label="Pays"
                {...register("addressCountry")}
                error={errors.addressCountry?.message as string}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
