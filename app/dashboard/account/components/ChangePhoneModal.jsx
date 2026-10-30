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
import { useSession } from "@/src/lib/auth-client";

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
      // Enregistré par /api/account/phone : Better Auth refuse de changer
      // le numéro par updateUser (vérification par SMS attendue)
      const response = await fetch("/api/account/phone", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: newPhone }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(data?.error || "Erreur lors de la mise à jour du numéro");
        return;
      }
      toast.success("Numéro de téléphone modifié avec succès");
      // Session relue sans son cache, qui garde l'ancien numéro
      await refetch({ query: { disableCookieCache: true } });
      handleClose();
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
