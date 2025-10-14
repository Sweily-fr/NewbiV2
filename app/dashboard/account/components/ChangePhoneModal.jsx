"use client";

import React, { useState } from "react";
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
import { updateUser, useSession } from "@/src/lib/auth-client";

export function ChangePhoneModal({ isOpen, onClose, currentPhone }) {
  const [newPhone, setNewPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { refetch } = useSession();

  const handleUpdatePhone = async (e) => {
    e.preventDefault();

    if (!newPhone.trim()) {
      toast.error("Veuillez saisir un numéro de téléphone");
      return;
    }

    if (newPhone === currentPhone) {
      toast.error("Le nouveau numéro doit être différent de l'actuel");
      return;
    }

    setIsLoading(true);

    try {
      // Mise à jour directe du numéro via Better Auth
      await updateUser(
        { phoneNumber: newPhone },
        {
          onSuccess: async () => {
            toast.success("Numéro de téléphone modifié avec succès");
            await refetch(); // Rafraîchir la session
            handleClose();
          },
          onError: (error) => {
            console.error("Erreur mise à jour:", error);
            toast.error(
              error?.message || "Erreur lors de la mise à jour du numéro"
            );
          },
        }
      );
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast.error("Erreur lors de la mise à jour du numéro");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setNewPhone("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier le numéro de téléphone</DialogTitle>
          <DialogDescription>
            Saisissez votre nouveau numéro de téléphone.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleUpdatePhone} className="space-y-4">
          <div>
            <Label htmlFor="current-phone">Numéro actuel</Label>
            <Input
              id="current-phone"
              type="tel"
              value={currentPhone || "Non renseigné"}
              disabled
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="new-phone">Nouveau numéro de téléphone</Label>
            <Input
              id="new-phone"
              type="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="+33 6 12 34 56 78"
              required
              className="mt-2"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Mise à jour..." : "Modifier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
