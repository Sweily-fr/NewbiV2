"use client";

import { useState, useEffect } from "react";
import { UserRoundPlusIcon } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { Label } from "@/src/components/ui/label";
import { InputEmail } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
      <DialogContent
        className={`overflow-y-auto overflow-x-hidden ${
          isMobile
            ? "!fixed !inset-0 !w-screen !h-screen !max-w-none !max-h-none !m-0 !rounded-none !translate-x-0 !translate-y-0 !p-6"
            : "sm:max-w-lg"
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-full border"
            aria-hidden="true"
          >
            <UserRoundPlusIcon className="opacity-80" size={20} />
          </div>
          <DialogHeader>
            <DialogTitle className="text-center font-medium">
              Inviter des membres
            </DialogTitle>
            <DialogDescription className="text-center w-full max-w-sm mx-auto">
              Inviter des membres pour qu'ils puissent utiliser vos outils.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-normal">
                Email du collaborateur
              </Label>
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
              <Label htmlFor="role" className="font-normal">
                Rôle
              </Label>
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

            <div className="space-y-2">
              <Label htmlFor="message" className="font-normal">
                Message (optionnel)
              </Label>
              <Textarea
                id="message"
                placeholder="Ajoutez un message personnalisé à votre invitation..."
                rows={3}
                {...register("message")}
              />
              <p className="text-xs text-muted-foreground">
                Ce message sera inclus dans l'email d'invitation
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              type="submit"
              className="w-full cursor-pointer"
              disabled={inviting}
            >
              {inviting ? "Envoi en cours..." : "Envoyer l'invitation"}
            </Button>
            <DialogClose asChild>
              <Button
                type="button"
                className="w-full cursor-pointer"
                variant="outline"
              >
                Annuler
              </Button>
            </DialogClose>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
