"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Button } from "@/src/components/ui/button";
import { toast } from "@/src/components/ui/sonner";

function Field({ id, label, hint, className, children }) {
  return (
    <div
      className={["flex flex-col gap-1.5", className].filter(Boolean).join(" ")}
    >
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/**
 * Création d'un client par le cabinet : l'espace de l'entreprise, le compte
 * du dirigeant (super admin, qui reçoit un e-mail pour choisir son mot de
 * passe) et l'accès Comptable du cabinet. Pas de formule à choisir : le
 * client démarre en essai gratuit, l'offre se choisit à la fin de l'essai.
 */
export default function NewManagedClientForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  // Adresse déjà inscrite sur Newbi : proposer l'invitation à la place
  const [inviteEmail, setInviteEmail] = useState(null);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/gestionnaire/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: form.get("companyName"),
          siret: form.get("siret"),
          firstName: form.get("firstName"),
          lastName: form.get("lastName"),
          email: form.get("email"),
          payer: form.get("payer") === "manager" ? "manager" : "client",
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "La création a échoué, réessayez.");
        setInviteEmail(
          response.status === 409 ? String(form.get("email") || "") : null,
        );
        setPending(false);
        return;
      }
      toast.success(
        data.client?.emailSent
          ? `${data.client.companyName} est créé. ${data.client.email} a reçu un e-mail pour choisir son mot de passe.`
          : `${data.client.companyName} est créé, mais l'e-mail au dirigeant n'est pas parti.`,
      );
      router.push("/dashboard/gestionnaire");
      router.refresh();
    } catch {
      setError("Le serveur ne répond pas, réessayez.");
      setPending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="companyName" label="Entreprise" className="sm:col-span-2">
          <Input
            id="companyName"
            name="companyName"
            required
            maxLength={120}
            placeholder="Boulangerie Martin"
          />
        </Field>
        <Field
          id="siret"
          label="SIRET"
          hint="14 chiffres, vérifié au registre : l'adresse et la forme juridique sont remplies automatiquement."
          className="sm:col-span-2"
        >
          <Input id="siret" name="siret" inputMode="numeric" required />
        </Field>
        <Field id="firstName" label="Prénom du dirigeant">
          <Input id="firstName" name="firstName" maxLength={60} />
        </Field>
        <Field id="lastName" label="Nom du dirigeant">
          <Input id="lastName" name="lastName" maxLength={60} />
        </Field>
        <Field
          id="email"
          label="E-mail du dirigeant"
          hint="Il recevra un e-mail pour choisir son mot de passe. Il sera le super admin de son espace ; vous y aurez les droits Comptable."
          className="sm:col-span-2"
        >
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="off"
          />
        </Field>
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          name="payer"
          value="manager"
          className="mt-0.5 size-4 accent-[#5A50FF]"
        />
        <span>
          Je paierai l&apos;abonnement de ce client
          <span className="block text-xs text-muted-foreground">
            Le client démarre avec 30 jours d&apos;essai gratuit. À la fin de
            l&apos;essai, c&apos;est vous qui choisirez et paierez son offre ;
            sinon, il le fera lui-même.
          </span>
        </span>
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
          {inviteEmail && (
            <>
              {" "}
              <Link
                href={`/dashboard/gestionnaire/clients/inviter?email=${encodeURIComponent(inviteEmail)}`}
                className="font-medium underline underline-offset-4"
              >
                Inviter ce client
              </Link>
            </>
          )}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending && <LoaderCircle className="size-4 animate-spin" />}
          Créer le client
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/dashboard/gestionnaire")}
          disabled={pending}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}
