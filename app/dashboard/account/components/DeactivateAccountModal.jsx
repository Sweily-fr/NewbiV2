"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { toast } from "@/src/components/ui/sonner";
import { AlertTriangle } from "lucide-react";

export function DeactivateAccountModal({ isOpen, onClose, userEmail }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm();

  const emailValue = watch("email");
  const isEmailMatch = emailValue === userEmail;

  const onSubmit = async (formData) => {
    if (formData.email !== userEmail) {
      toast.error("L'adresse e-mail ne correspond pas");
      return;
    }

    try {
      console.log("Désactivation du compte pour:", userEmail);

      // Appel à l'API de désactivation
      const response = await fetch("/api/account/deactivate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmail }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la désactivation");
      }

      toast.success("Compte désactivé avec succès");
      onClose();
      reset();

      // Rediriger vers la page de connexion après un délai
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 2000);
    } catch (error) {
      console.error("Erreur lors de la désactivation:", error);
      toast.error("Erreur lors de la désactivation du compte");
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-foreground">
                Désactiver le compte
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-sm text-muted-foreground mt-4">
            Cette action est irréversible. Une fois votre compte désactivé, vous
            perdrez l'accès à toutes vos données et ne pourrez plus vous
            connecter.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2 gap-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Tapez votre adresse e-mail pour confirmer.
            </Label>
            <Input
              id="email"
              type="email"
              placeholder={userEmail}
              className="w-full mt-2"
              {...register("email", {
                required: "L'adresse e-mail est requise",
                validate: (value) =>
                  value === userEmail ||
                  "L'adresse e-mail ne correspond pas à votre compte",
              })}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-red-800 dark:text-red-200 mb-1">
                  Attention
                </p>
                <p className="text-red-700 dark:text-red-300">
                  La désactivation de votre compte supprimera définitivement
                  toutes vos données, projets, factures et paramètres. Cette
                  action ne peut pas être annulée.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!isEmailMatch || isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? "Désactivation..." : "Désactiver le compte"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
