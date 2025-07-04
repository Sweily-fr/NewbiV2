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
import { InputPassword } from "@/src/components/ui/input";
import { useForm } from "react-hook-form";
import { admin } from "../../../../src/lib/auth-client";
import { toast } from "@/src/components/ui/sonner";
import { useUser } from "../../../../src/lib/auth/hooks";

export default function InviteMembers({ open, onOpenChange }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm();
  const { session } = useUser();
  console.log(session?.session.userId, "session");

  const onSubmit = async (formData) => {
    console.log({ ...formData, role: "user" }, "formData");
    await admin.createUser(
      {
        ...formData,
        role: "user",
        createdBy: session?.session.userId,
      },
      {
        onSuccess: () => {
          toast.success("Un nouveau collaborateur a été ajouté");
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error("Erreur lors de l'inscription");
        },
      }
    );
  };
  const users = async () => {
    await admin.listUsers(
      {
        query: {
          filterField: "createdBy",
          filterValue: session?.session?.userId,
        },
        onSuccess: (users) => {
          console.log(users, "users");
          return users;
        },
      },
      {
        onError: (error) => {
          console.log(error, "error");
        },
      }
    );
  };

  console.log(users(), "users");

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
            <div className="*:not-first:mt-2">
              <Label>Nom</Label>
              <div className="space-y-3">
                <Input
                  id="name"
                  placeholder="Nom"
                  type="text"
                  value={watch("name")}
                  {...register("name")}
                />
              </div>
            </div>
            <div className="*:not-first:mt-2">
              <Label>Email</Label>
              <div className="space-y-3">
                <InputEmail
                  id="email"
                  placeholder="hi@yourcompany.com"
                  type="email"
                  value={watch("email")}
                  {...register("email")}
                />
              </div>
            </div>
            <div className="*:not-first:mt-2">
              <Label>Mot de passe</Label>
              <div className="space-y-3">
                <InputPassword
                  id="password"
                  placeholder="Saisissez votre mot de passe"
                  type="password"
                  value={watch("password")}
                  {...register("password")}
                />
              </div>
            </div>
          </div>
          <Button type="submit" className="w-full">
            Ajouter
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
