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
import { InputEmail } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { useOrganizationInvitations } from "@/src/hooks/useOrganizationInvitations";

export default function InviteMembers({
  open,
  onOpenChange,
  onInvitationSent,
}) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  const { inviteMember, inviting } = useOrganizationInvitations();

  const onSubmit = async (formData) => {
    console.log("Envoi d'invitation:", formData);

    const result = await inviteMember({
      email: formData.email,
      role: formData.role,
    });

    if (result.success) {
      reset(); // Réinitialiser le formulaire
      onOpenChange(false); // Fermer le dialog

      // Notifier le parent pour rafraîchir la liste
      if (onInvitationSent) {
        onInvitationSent();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="hidden">
          Ajouter un collaborateur
        </Button>
      </DialogTrigger>
      <DialogContent>
        <div className="flex flex-col gap-2">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-full border"
            aria-hidden="true"
          >
            <UserRoundPlusIcon className="opacity-80" size={16} />
          </div>
          <DialogHeader>
            <DialogTitle className="text-left">Inviter des membres</DialogTitle>
            <DialogDescription className="text-left">
              Inviter des membres pour qu'ils puissent utiliser les composants
              gratuitement.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email du collaborateur</Label>
              <InputEmail
                id="email"
                placeholder="collaborateur@exemple.com"
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

            <div className="space-y-2">
              <Label htmlFor="role">Rôle</Label>
              <Controller
                name="role"
                control={control}
                rules={{ required: "Le rôle est requis" }}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Membre</SelectItem>
                      <SelectItem value="admin">Administrateur</SelectItem>
                      {/* <SelectItem value="guest">Invité</SelectItem> */}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && (
                <p className="text-sm text-red-500">{errors.role.message}</p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={inviting}>
            {inviting ? "Envoi en cours..." : "Envoyer l'invitation"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
