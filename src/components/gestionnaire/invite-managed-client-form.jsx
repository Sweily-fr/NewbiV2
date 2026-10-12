"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Button } from "@/src/components/ui/button";
import { toast } from "@/src/components/ui/sonner";
import { GESTIONNAIRE_PATH } from "@/src/lib/gestionnaire-paths";

/**
 * Invitation d'un client qui a déjà un compte Newbi : il reçoit un e-mail,
 * une notification et la demande dans ses invitations, puis choisit
 * l'espace qu'il vous confie.
 */
export default function InviteManagedClientForm({ defaultEmail = "" }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (pending) return;
    const email = new FormData(event.currentTarget).get("email");
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/gestionnaire/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "L'invitation n'a pas pu être envoyée.");
        setPending(false);
        return;
      }
      toast.success(
        data.invitation?.emailSent
          ? `Invitation envoyée à ${data.invitation.email}.`
          : `Invitation enregistrée, mais l'e-mail à ${data.invitation.email} n'est pas parti.`,
      );
      router.push(GESTIONNAIRE_PATH);
      router.refresh();
    } catch {
      setError("Le serveur ne répond pas, réessayez.");
      setPending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">E-mail du dirigeant</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="off"
          defaultValue={defaultEmail}
          placeholder="dirigeant@entreprise.fr"
        />
        <p className="text-xs text-muted-foreground">
          L&apos;adresse de son compte Newbi. Il choisit ensuite l&apos;espace
          qu&apos;il vous confie et garde son abonnement. L&apos;invitation est
          valable 14 jours.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending && <LoaderCircle className="size-4 animate-spin" />}
          Envoyer l&apos;invitation
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(GESTIONNAIRE_PATH)}
          disabled={pending}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}
