"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Connexion PayPal : l'adresse e-mail du compte PayPal Business du vendeur.
 * Les paiements des transferts arrivent directement sur ce compte.
 */
export function PaypalConnectDialog({
  open,
  onOpenChange,
  initialEmail = "",
  onConnect,
  onConnected,
}) {
  const [email, setEmail] = useState(initialEmail || "");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail(initialEmail || "");
      setError(null);
    }
  }, [open, initialEmail]);

  const handleSubmit = async (event) => {
    event?.preventDefault?.();
    const value = email.trim();
    if (!EMAIL_PATTERN.test(value)) {
      setError("Saisissez une adresse e-mail valide.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await onConnect(value);
      if (result?.success) {
        toast.success("PayPal est connecté", {
          description:
            "Vos clients pourront payer vos transferts par PayPal, directement sur votre compte.",
        });
        onConnected?.(result.email || value);
        onOpenChange(false);
      } else {
        setError(result?.message || "La connexion à PayPal n'a pas abouti.");
      }
    } catch (err) {
      setError(err?.message || "La connexion à PayPal n'a pas abouti.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={saving ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Connecter PayPal</DialogTitle>
            <DialogDescription>
              Indiquez l&apos;adresse e-mail de votre compte PayPal Business.
              Les paiements de vos clients arriveront directement sur ce compte,
              PayPal y prélève ses frais habituels.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="paypal-email" className="text-sm font-normal">
              E-mail du compte PayPal
            </Label>
            <Input
              id="paypal-email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="vous@entreprise.fr"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              aria-invalid={Boolean(error)}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <p className="text-xs text-muted-foreground">
              Pas encore de compte PayPal Business ?{" "}
              <a
                href="https://www.paypal.com/fr/business"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#5b4fff] hover:underline"
              >
                Créez-le gratuitement
              </a>
              .
            </p>
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
              {saving ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Connexion…
                </>
              ) : (
                "Connecter PayPal"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default PaypalConnectDialog;
