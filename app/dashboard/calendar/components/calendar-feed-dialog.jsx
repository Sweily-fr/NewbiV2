"use client";

import { useEffect, useState } from "react";
import {
  CalendarArrowUp,
  Check,
  Copy,
  Link2Off,
  Loader2,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Separator } from "@/src/components/ui/separator";
import { Switch } from "@/src/components/ui/switch";
import { toast } from "@/src/components/ui/sonner";
import {
  useCalendarFeedLink,
  useCalendarWeeklyDigest,
} from "@/src/hooks/useCalendarFeed";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import {
  FEED_HELP,
  createdLabel,
  lastReadLabel,
} from "@/src/utils/calendar-feed";

const PRIMARY = "bg-[#5a50ff] hover:bg-[#5a50ff]/90";

const CONFIRM_TEXT = {
  regenerate: {
    title: "Régénérer le lien ?",
    description:
      "L'adresse actuelle cessera de fonctionner : les agendas qui la suivent ne recevront plus rien, il faudra y coller la nouvelle.",
    action: "Régénérer",
    className: PRIMARY,
  },
  disable: {
    title: "Désactiver le lien ?",
    description:
      "Les agendas qui suivent ce lien ne recevront plus rien de Newbi. Vous pourrez en créer un nouveau à tout moment.",
    action: "Désactiver",
    className: "bg-red-500 hover:bg-red-600",
  },
};

/**
 * « Recevoir le calendrier ailleurs » : lien d'abonnement à coller dans
 * Google Agenda, Apple Calendrier ou Outlook (lecture seule, propre à
 * l'utilisateur et à l'espace), et récap du lundi par e-mail.
 */
export function CalendarFeedDialog() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [copied, setCopied] = useState(false);
  const { organization } = useWorkspace();
  const { link, loading, regenerate, disable, busy } = useCalendarFeedLink({
    skip: !open,
  });
  const digest = useCalendarWeeklyDigest({ skip: !open });

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    if (!link?.url) return;
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      toast.success("Lien copié");
    } catch {
      toast.error("Copie impossible : sélectionnez le lien pour le copier");
    }
  };

  const handleCreate = async () => {
    if (await regenerate()) toast.success("Lien créé");
  };

  const handleConfirm = async () => {
    const action = confirm;
    setConfirm(null);
    if (action === "regenerate") {
      if (await regenerate()) {
        toast.success("Nouveau lien créé, l'ancien ne fonctionne plus");
      }
    } else if (action === "disable") {
      if (await disable()) toast.success("Lien désactivé");
    }
  };

  const workspaceName = organization?.name || "cet espace";
  const confirmText = confirm ? CONFIRM_TEXT[confirm] : null;
  const meta = link?.enabled
    ? [createdLabel(link.createdAt), lastReadLabel(link.lastAccessedAt)]
        .filter(Boolean)
        .join(" · ")
    : null;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 font-normal"
            title="Recevoir le calendrier ailleurs"
          >
            <CalendarArrowUp className="h-4 w-4" aria-hidden="true" />
            <span className="hidden xl:inline">Ajouter à mon agenda</span>
            <span className="sr-only xl:hidden">
              Recevoir le calendrier ailleurs
            </span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Recevoir le calendrier ailleurs</DialogTitle>
            <DialogDescription>
              Suivez les événements et les échéances de {workspaceName} dans
              Google Agenda, Apple Calendrier ou Outlook, en lecture seule.
            </DialogDescription>
          </DialogHeader>

          <section className="space-y-3">
            <h3 className="text-sm font-medium">Lien d&apos;abonnement</h3>
            {loading ? (
              <div className="text-muted-foreground flex items-center gap-2 py-4 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Chargement du lien...
              </div>
            ) : !link?.enabled ? (
              <div className="rounded-lg border border-dashed p-4">
                <p className="text-muted-foreground text-sm">
                  Créez un lien personnel : collé dans votre agenda, il affiche
                  ce que votre rôle permet de voir dans Newbi et se met à jour
                  tout seul.
                </p>
                <Button
                  size="sm"
                  className={`mt-3 ${PRIMARY}`}
                  onClick={handleCreate}
                  disabled={busy}
                >
                  {busy && (
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                  )}
                  Créer le lien
                </Button>
              </div>
            ) : (
              <>
                {link.url ? (
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={link.url}
                      aria-label="Lien d'abonnement"
                      onFocus={(event) => event.target.select()}
                      className="font-mono text-xs"
                    />
                    <Button
                      size="sm"
                      className={`h-9 shrink-0 gap-1.5 ${PRIMARY}`}
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <Check className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Copy className="h-4 w-4" aria-hidden="true" />
                      )}
                      {copied ? "Copié" : "Copier"}
                    </Button>
                  </div>
                ) : (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
                    Ce lien ne peut plus être affiché. Régénérez-le pour obtenir
                    une nouvelle adresse.
                  </p>
                )}
                {meta && (
                  <p className="text-muted-foreground text-xs">{meta}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 font-normal"
                    onClick={() => setConfirm("regenerate")}
                    disabled={busy}
                  >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                    Régénérer le lien
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 font-normal text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
                    onClick={() => setConfirm("disable")}
                    disabled={busy}
                  >
                    <Link2Off className="h-3.5 w-3.5" aria-hidden="true" />
                    Désactiver
                  </Button>
                </div>
                <p className="text-muted-foreground flex gap-2 text-xs leading-relaxed">
                  <ShieldAlert
                    className="mt-0.5 h-3.5 w-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    Gardez ce lien pour vous : toute personne qui le connaît
                    peut lire ce calendrier. En cas de doute, régénérez-le.
                  </span>
                </p>
              </>
            )}
          </section>

          <Separator />

          <section className="space-y-2">
            <h3 className="text-sm font-medium">Où coller le lien</h3>
            <ul className="space-y-2">
              {FEED_HELP.map(({ app, steps }) => (
                <li key={app} className="text-xs leading-relaxed">
                  <span className="text-foreground font-medium">{app}</span>
                  <span className="text-muted-foreground"> : {steps}</span>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Chaque agenda relit le lien à son rythme, de quelques minutes à
              quelques heures. Les modifications se font dans Newbi.
            </p>
          </section>

          {digest.available && (
            <>
              <Separator />
              <section className="flex items-start justify-between gap-4">
                <div>
                  <Label
                    htmlFor="calendar-weekly-digest"
                    className="text-sm font-medium"
                  >
                    Récap du lundi par e-mail
                  </Label>
                  <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                    Chaque lundi à 8 h, le programme de la semaine de chacun de
                    vos espaces : événements, factures à encaisser ou à payer,
                    devis à relancer, tâches. Rien n&apos;est envoyé si la
                    semaine est vide.
                  </p>
                </div>
                <Switch
                  id="calendar-weekly-digest"
                  checked={digest.enabled}
                  disabled={digest.saving}
                  onCheckedChange={digest.setEnabled}
                  className="mt-0.5 shrink-0 data-[state=checked]:bg-[#5a50ff]"
                />
              </section>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmText?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmText?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={confirmText?.className}
            >
              {confirmText?.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
