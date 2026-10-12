"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Check,
  LoaderCircle,
  ShieldCheck,
  Wallet,
  UserCog,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { toast } from "@/src/components/ui/sonner";
import { cn } from "@/src/lib/utils";

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function Shell({ children }) {
  return (
    <section className="min-h-screen bg-white dark:bg-background">
      <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-20 md:py-28">
        <div className="mb-8 flex size-16 items-center justify-center rounded-2xl border border-black/5 shadow-xl shadow-black/5 dark:border-white/10 dark:bg-white/10">
          <img src="/ni2.svg" alt="Newbi" className="size-7" />
        </div>
        {children}
      </div>
    </section>
  );
}

function Notice({ title, text }) {
  return (
    <Shell>
      <div className="space-y-3 text-center">
        <h1 className="text-2xl font-medium">{title}</h1>
        <p className="text-sm text-muted-foreground">{text}</p>
        <div className="pt-4">
          <Link href="/dashboard">
            <Button variant="outline" className="cursor-pointer">
              Aller sur Newbi
            </Button>
          </Link>
        </div>
      </div>
    </Shell>
  );
}

const POINTS = [
  {
    icon: UserCog,
    text: "Le cabinet accède à l'espace choisi avec les droits Comptable. Vous pouvez les ajuster dans Paramètres > Rôles.",
  },
  {
    icon: ShieldCheck,
    text: "Vous restez super admin de votre espace. Pour mettre fin à cet accès, il suffit de nous écrire.",
  },
  {
    icon: Wallet,
    text: "Vous gardez votre abonnement : rien ne change pour vous.",
  },
];

/**
 * Le client choisit l'espace qu'il confie au cabinet, puis accepte ou
 * refuse. L'acceptation vaut accord écrit du client (conservé côté serveur).
 */
export default function ManagedClientInvitationView({ invitation, userEmail }) {
  const organizations = invitation?.organizations || [];
  const [selected, setSelected] = useState(
    organizations.length === 1 ? organizations[0].id : null,
  );
  const [pending, setPending] = useState(null);
  const [done, setDone] = useState(null);

  if (!invitation) {
    return (
      <Notice
        title="Invitation introuvable"
        text={`Cette invitation n'existe pas ou n'est pas adressée au compte ${userEmail}.`}
      />
    );
  }
  if (done === "accepted") {
    return (
      <Notice
        title="C'est fait"
        text={`${invitation.managerName} a maintenant accès à votre espace, avec les droits Comptable.`}
      />
    );
  }
  if (done === "refused" || invitation.state === "declined") {
    return (
      <Notice
        title="Invitation refusée"
        text={`${invitation.managerName} n'a pas accès à vos espaces.`}
      />
    );
  }
  if (invitation.state === "expired") {
    return (
      <Notice
        title="Invitation expirée"
        text={`Demandez à ${invitation.managerName} de vous envoyer une nouvelle invitation.`}
      />
    );
  }
  if (invitation.state !== "pending") {
    return (
      <Notice
        title="Invitation déjà traitée"
        text="Cette invitation n'est plus en attente."
      />
    );
  }
  if (organizations.length === 0) {
    return (
      <Notice
        title="Aucun espace à confier"
        text="Vous n'êtes super admin d'aucun espace, ou vos espaces sont déjà suivis par un gestionnaire."
      />
    );
  }

  const respond = async (action) => {
    if (pending) return;
    if (action === "accept" && !selected) {
      toast.error("Choisissez l'espace à confier");
      return;
    }
    setPending(action);
    try {
      const response = await fetch(
        `/api/invitations-gestionnaire/${invitation.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, organizationId: selected }),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(data.error || "La réponse n'a pas pu être enregistrée");
        setPending(null);
        return;
      }
      window.dispatchEvent(new Event("notificationsRead"));
      setDone(action === "accept" ? "accepted" : "refused");
    } catch {
      toast.error("Le serveur ne répond pas, réessayez.");
      setPending(null);
    }
  };

  return (
    <Shell>
      <div className="w-full space-y-8">
        <div className="space-y-3 text-center">
          <h1 className="text-balance text-3xl font-medium">
            {invitation.managerName} souhaite gérer votre espace
          </h1>
          <p className="text-sm text-muted-foreground">
            Votre cabinet vous invite à lui confier l&apos;un de vos espaces
            Newbi. Invitation valable jusqu&apos;au{" "}
            {dateFormat.format(new Date(invitation.expiresAt))}.
          </p>
        </div>

        <ul className="space-y-3">
          {POINTS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3 text-sm">
              <Icon className="mt-0.5 size-4 shrink-0 text-[#5b4fff]" />
              <span>{text}</span>
            </li>
          ))}
        </ul>

        <div className="space-y-2">
          <p className="text-sm font-medium">
            {organizations.length > 1
              ? "Quel espace confier ?"
              : "Espace confié"}
          </p>
          <div className="space-y-2" role="radiogroup">
            {organizations.map((org) => {
              const active = selected === org.id;
              return (
                <button
                  key={org.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSelected(org.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors cursor-pointer",
                    active
                      ? "border-[#5b4fff] bg-[#5b4fff]/5"
                      : "border-border hover:bg-muted/50",
                  )}
                >
                  <Building2 className="size-4 text-muted-foreground" />
                  <span className="flex-1 truncate">{org.name}</span>
                  {active && <Check className="size-4 text-[#5b4fff]" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <Button
            className="flex-1 cursor-pointer bg-[#5b4fff] text-white hover:bg-[#5b4fff]/90"
            onClick={() => respond("accept")}
            disabled={Boolean(pending)}
          >
            {pending === "accept" && (
              <LoaderCircle className="size-4 animate-spin" />
            )}
            Accepter
          </Button>
          <Button
            variant="outline"
            className="flex-1 cursor-pointer"
            onClick={() => respond("refuse")}
            disabled={Boolean(pending)}
          >
            {pending === "refuse" && (
              <LoaderCircle className="size-4 animate-spin" />
            )}
            Refuser
          </Button>
        </div>
      </div>
    </Shell>
  );
}
