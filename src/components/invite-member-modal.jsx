"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { useForm, Controller } from "react-hook-form";
import { useOrganizationInvitations } from "@/src/hooks/useOrganizationInvitations";

export function InviteMemberModal({ open, onOpenChange, onSuccess }) {
  const [memberType, setMemberType] = useState("collaborator");
  
  const { inviteMember, inviting } = useOrganizationInvitations();

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
      message: "",
    },
  });

  const onInviteSubmit = async (formData, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    let role;
    if (memberType === "accountant") {
      role = "accountant";
    } else {
      role = formData.role || "member";
    }

    const result = await inviteMember({
      email: formData.email,
      role: role,
      message: formData.message,
    });

    if (result.success) {
      reset();
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-6 gap-5">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-semibold">
            Inviter un membre
          </DialogTitle>
          <p className="text-xs text-foreground">
            Saisissez ou collez les adresses e-mail ci-dessous
          </p>
          {memberType === "accountant" && (
            <div className="bg-[#5b4fff]/10 border border-[#5b4fff]/50 rounded-lg p-3">
              <p className="text-xs text-[#5b4fff]/700">
                <strong>Comptable gratuit :</strong> Un seul comptable par
                organisation est autorisé et n'est pas facturé.
              </p>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-5">
          {/* Switch Collaborateur / Comptable */}
          <div className="inline-flex items-center gap-1 p-0.5 bg-muted/50 rounded-md">
            <button
              type="button"
              onClick={() => setMemberType("collaborator")}
              className={`px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors ${
                memberType === "collaborator"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Collaborateur
            </button>
            <button
              type="button"
              onClick={() => setMemberType("accountant")}
              className={`px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors ${
                memberType === "accountant"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Comptable
            </button>
          </div>

          {/* Information de tarification */}
          <div className="text-xs text-muted-foreground">
            {memberType === "collaborator" ? (
              <span>
                <span className="text-[#5b4fff] font-medium">7,49€/mois</span>{" "}
                par collaborateur additionnel
              </span>
            ) : (
              <span>
                <span className="text-[#5b4fff] font-medium">Gratuit</span> ·
                Un seul comptable par organisation
              </span>
            )}
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit(onInviteSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-xs font-medium text-muted-foreground"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={
                  memberType === "collaborator"
                    ? "nom@exemple.com"
                    : "comptable@exemple.com"
                }
                className="h-9 text-sm"
                {...register("email", {
                  required: "L'email est requis",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Email invalide",
                  },
                })}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Champ Rôle */}
            <div className="space-y-1.5 min-h-[68px]">
              {memberType === "collaborator" && (
                <>
                  <Label
                    htmlFor="role"
                    className="text-xs font-medium text-muted-foreground"
                  >
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
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Membre</SelectItem>
                          <SelectItem value="admin">Administrateur</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.role && (
                    <p className="text-xs text-red-500">
                      {errors.role.message}
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="flex-1 h-9 text-sm cursor-pointer"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={inviting}
                className="flex-1 h-9 text-sm bg-[#5b4fff] hover:bg-[#5b4fff]/90 cursor-pointer text-white"
              >
                {inviting ? "Envoi..." : "Inviter"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
