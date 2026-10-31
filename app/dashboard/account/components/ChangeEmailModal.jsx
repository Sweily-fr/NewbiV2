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
import { authClient } from "@/src/lib/auth-client";

export function ChangeEmailModal({ isOpen, onClose, currentEmail }) {
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newEmail !== confirmEmail) {
      toast.error("Les adresses email ne correspondent pas");
      return;
    }

    if (newEmail === currentEmail) {
      toast.error(
        "La nouvelle adresse email doit être différente de l'actuelle",
      );
      return;
    }

    setIsLoading(true);

    try {
      // Better Auth envoie un lien de confirmation (à l'adresse actuelle
      // si elle est vérifiée, sinon à la nouvelle) ; l'adresse ne change
      // qu'une fois ce lien suivi
      const { error } = await authClient.changeEmail({
        newEmail,
        callbackURL: "/dashboard",
      });
      if (error) {
        toast.error("Impossible de changer l'adresse e-mail pour le moment");
        return;
      }

      toast.success(
        "Un e-mail de confirmation vous a été envoyé : suivez son lien pour terminer le changement",
      );
      onClose();
      setNewEmail("");
      setConfirmEmail("");
    } catch (error) {
      toast.error("Erreur lors du changement d'email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setNewEmail("");
    setConfirmEmail("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Changer d'adresse e-mail</DialogTitle>
          <DialogDescription>
            Saisissez votre nouvelle adresse e-mail. Un email de confirmation
            sera envoyé.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="current-email">Adresse e-mail actuelle</Label>
            <Input
              id="current-email"
              type="email"
              value={currentEmail}
              disabled
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="new-email">Nouvelle adresse e-mail</Label>
            <Input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="nouvelle@email.com"
              required
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="confirm-email">
              Confirmer la nouvelle adresse e-mail
            </Label>
            <Input
              id="confirm-email"
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder="nouvelle@email.com"
              required
              className="mt-2"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Envoi..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
