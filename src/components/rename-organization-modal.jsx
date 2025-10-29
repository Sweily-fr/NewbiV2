"use client";

import { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { toast } from "@/src/components/ui/sonner";
import { Loader2 } from "lucide-react";
import { authClient } from "@/src/lib/auth-client";

export function RenameOrganizationModal({ open, onOpenChange, organization, onSuccess }) {
  const [newName, setNewName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ownerName, setOwnerName] = useState("");

  // Charger les informations de l'organisation et du owner
  useEffect(() => {
    if (open && organization) {
      setNewName(organization.name || "");
      
      // Trouver le owner dans les membres de l'organisation
      const owner = organization.members?.find(m => m.role === "owner");
      if (owner) {
        setOwnerName(owner.user?.name || owner.user?.email || "Non disponible");
      } else {
        setOwnerName("Non disponible");
      }
    }
  }, [open, organization]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newName.trim()) {
      toast.error("Le nom de l'organisation ne peut pas être vide");
      return;
    }

    if (newName.trim() === organization.name) {
      toast.error("Le nom n'a pas changé");
      return;
    }

    setIsLoading(true);

    try {
      // Utiliser Better Auth pour mettre à jour l'organisation
      await authClient.organization.update({
        organizationId: organization.id,
        data: {
          name: newName.trim(),
        },
        fetchOptions: {
          onSuccess: () => {
            toast.success("Organisation renommée avec succès");
            onOpenChange(false);
            
            if (onSuccess) {
              onSuccess();
            }
          },
          onError: (ctx) => {
            throw new Error(ctx.error?.message || "Erreur lors du renommage");
          },
        },
      });
    } catch (error) {
      console.error("Erreur lors du renommage:", error);
      toast.error(error.message || "Erreur lors du renommage de l'organisation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Renommer l'organisation</DialogTitle>
          <DialogDescription>
            Modifiez le nom de votre organisation. Ce changement sera visible par tous les membres.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nom de l'organisation</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Mon entreprise"
                disabled={isLoading}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="owner">Propriétaire</Label>
              <Input
                id="owner"
                value={ownerName}
                disabled
                className="bg-muted cursor-not-allowed"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Renommer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
