"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { Button } from "@/src/components/ui/button";
import { toast } from "@/src/components/ui/sonner";
import { PLANS_DISPLAY } from "@/src/lib/plans-display";
import { payerChangeMessage } from "./payer-change-messages";

const longDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";
const planName = (key) =>
  PLANS_DISPLAY.find((p) => p.key === key)?.displayName || key;

/**
 * « Ne plus payer l'abonnement » d'un client : le client le reprend. Une
 * période déjà payée par le cabinet va à son terme et le client peut
 * choisir son offre tout de suite ; rien de prélevé au cabinet, son
 * abonnement s'arrête aussitôt.
 */
export default function ManagedHandBackDialog({ client, open, onOpenChange }) {
  const router = useRouter();
  const [preview, setPreview] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open || !client?.id) return;
    let cancelled = false;
    setPreview(null);
    setLoadError(null);
    fetch(`/api/gestionnaire/clients/${client.id}/payeur`)
      .then((response) =>
        response.json().then((data) => ({ ok: response.ok, data })),
      )
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok || !data.preview) {
          setLoadError(data.error || "Impossible de préparer le changement.");
          return;
        }
        setPreview(data.preview);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Le serveur ne répond pas, réessayez.");
      });
    return () => {
      cancelled = true;
    };
  }, [open, client?.id]);

  const name = preview?.name || client?.name || "ce client";
  let description = loadError || "Chargement de votre abonnement...";
  if (preview) {
    switch (preview.outcome) {
      case "scheduled":
        description = `Votre abonnement pour ${name} s'arrête le ${longDate(preview.cabinet?.periodEnd)}, à la fin de la période déjà payée. Votre client est prévenu par e-mail et peut choisir son offre dès maintenant, premier prélèvement à cette date. Sans offre choisie, son espace passera en lecture seule.`;
        break;
      case "restored":
        description = `Votre prise en charge n'a pas encore commencé : ${name} retrouve son propre abonnement (${planName(preview.clientRestore?.plan)}), prochain prélèvement le ${longDate(preview.clientRestore?.periodEnd)}. Rien ne vous est prélevé.`;
        break;
      case "trial-restored":
        description = preview.cabinet
          ? `Rien ne vous a encore été prélevé : votre abonnement pour ${name} s'arrête tout de suite. ${name} reprend son essai jusqu'au ${longDate(preview.cabinet.trialEnd)} et choisira son offre.`
          : `${name} choisira et paiera lui-même son offre à la fin de son essai, le ${longDate(preview.trialEndsAt)}.`;
        break;
      default:
        description = preview.cabinet
          ? `Votre abonnement pour ${name} s'arrête tout de suite. Votre client est prévenu par e-mail et choisit son offre pour garder l'accès complet à son espace.`
          : `${name} choisira et paiera son offre. Votre client est prévenu par e-mail.`;
    }
  }

  const submit = async () => {
    if (pending || !preview) return;
    setPending(true);
    try {
      const response = await fetch(
        `/api/gestionnaire/clients/${client.id}/payeur`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payer: "client" }),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(data.error || "Le changement n'a pas pu être fait.");
        setPending(false);
        return;
      }
      const message = payerChangeMessage(name, data);
      toast[message.tone](message.text);
      setPending(false);
      onOpenChange(false);
      router.refresh();
    } catch {
      toast.error("Le serveur ne répond pas, réessayez.");
      setPending(false);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(value) => !pending && onOpenChange(value)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Ne plus payer l&apos;abonnement de {name} ?
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>
            Garder la prise en charge
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={submit}
            disabled={pending || !preview}
          >
            {pending && <LoaderCircle className="size-4 animate-spin" />}
            Ne plus payer
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
