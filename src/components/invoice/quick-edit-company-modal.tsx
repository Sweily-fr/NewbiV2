"use client"

import { useState, useEffect } from "react"
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
import { updateOrganization, getActiveOrganization } from "@/src/lib/organization-client"
import { toast } from "@/src/components/ui/sonner"

interface QuickEditCompanyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCompanyUpdated?: (updatedCompany: any) => void
}

export function QuickEditCompanyModal({
  open,
  onOpenChange,
  onCompanyUpdated,
}: QuickEditCompanyModalProps) {
  const [saving, setSaving] = useState(false)
  const [organization, setOrganization] = useState<any>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm()

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const org = await getActiveOrganization()
        setOrganization(org)
        reset({
          companyName: org?.companyName || "",
          companyEmail: org?.companyEmail || "",
          companyPhone: org?.companyPhone || "",
          siret: org?.siret || "",
          vatNumber: org?.vatNumber || "",
          addressStreet: org?.addressStreet || "",
          addressCity: org?.addressCity || "",
          addressZipCode: org?.addressZipCode || "",
          addressCountry: org?.addressCountry || "",
        })
      } catch (error) {
        console.error("Erreur lors de la récupération de l'organisation:", error)
      }
    }

    if (open) {
      fetchOrganization()
    }
  }, [open, reset])

  const onSubmit = async (data: any) => {
    try {
      setSaving(true)

      const input = {
        companyName: data.companyName,
        companyEmail: data.companyEmail,
        companyPhone: data.companyPhone,
        siret: data.siret,
        vatNumber: data.vatNumber,
        addressStreet: data.addressStreet,
        addressCity: data.addressCity,
        addressZipCode: data.addressZipCode,
        addressCountry: data.addressCountry,
      }

      await updateOrganization(organization.id, input)

      toast.success("Informations de l'entreprise mises à jour")
      onCompanyUpdated?.(input)
      onOpenChange(false)
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour de l'entreprise:", error)
      toast.error(error.message || "Erreur lors de la mise à jour de l'entreprise")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier les informations de l'entreprise</DialogTitle>
          <DialogDescription>
            Corrigez les informations de votre entreprise directement depuis l'éditeur
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputWithError
              label="Nom de l'entreprise *"
              {...register("companyName", { required: "Le nom de l'entreprise est requis" })}
              error={errors.companyName?.message as string}
            />

            <InputWithError
              label="Email *"
              type="email"
              {...register("companyEmail", {
                required: "L'email est requis",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Email invalide",
                },
              })}
              error={errors.companyEmail?.message as string}
            />

            <InputWithError
              label="Téléphone"
              {...register("companyPhone")}
              error={errors.companyPhone?.message as string}
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
            <h3 className="text-sm font-medium">Adresse de l'entreprise</h3>
            
            <InputWithError
              label="Rue *"
              {...register("addressStreet", { required: "La rue est requise" })}
              error={errors.addressStreet?.message as string}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputWithError
                label="Ville *"
                {...register("addressCity", { required: "La ville est requise" })}
                error={errors.addressCity?.message as string}
              />

              <InputWithError
                label="Code postal *"
                {...register("addressZipCode", { required: "Le code postal est requis" })}
                error={errors.addressZipCode?.message as string}
              />

              <InputWithError
                label="Pays *"
                {...register("addressCountry", { required: "Le pays est requis" })}
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
