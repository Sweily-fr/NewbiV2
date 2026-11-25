"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client";
import { Loader2, Unplug } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/src/components/ui/sheet";
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
import { toast } from "@/src/components/ui/sonner";
import { cn } from "@/src/lib/utils";
import {
  DISCONNECT_PROSPECTING_MAILBOX,
  GET_PROSPECTING_SIGNATURES,
  UPDATE_PROSPECTING_MAILBOX,
} from "@/src/graphql/prospectingQueries";
import {
  END_HOURS,
  MIN_DAILY_LIMIT,
  NO_SIGNATURE,
  RECOMMENDED_DAILY_LIMIT,
  START_HOURS,
  WEEK_DAYS,
  formatHour,
  mailboxSettingsForm,
  mailboxSettingsInput,
  providerLabel,
  rampUpHint,
  validateMailboxSettings,
} from "@/src/utils/prospecting";
import { FIELD_LABEL } from "@/app/dashboard/outils/campagnes-email/components/setup/setup-section";
import { FOCUS_RING, errorMessage } from "./shared";

function FieldBlock({ label, htmlFor, hint, error, children }) {
  return (
    <div className="flex flex-col gap-2">
      {htmlFor ? (
        <Label htmlFor={htmlFor} className={FIELD_LABEL}>
          {label}
        </Label>
      ) : (
        <span className={FIELD_LABEL}>{label}</span>
      )}
      {children}
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : (
        hint && (
          <div className="text-xs leading-5 text-muted-foreground">{hint}</div>
        )
      )}
    </div>
  );
}

/** Choix de la signature : signatures Newbi du membre, ou « Aucune ». */
export function SignatureSelect({
  id,
  value,
  onChange,
  disabled,
  skip = false,
}) {
  const { data, loading, error } = useQuery(GET_PROSPECTING_SIGNATURES, {
    skip,
    fetchPolicy: "cache-and-network",
    context: { skipErrorToast: true },
  });
  const signatures = data?.emailSignaturesV2 || [];
  // Signature supprimée depuis : gardée dans la liste pour ne rien changer
  // en silence
  const known =
    value === NO_SIGNATURE || signatures.some((item) => item.id === value);
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} aria-label="Signature">
        <SelectValue placeholder="Aucune" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NO_SIGNATURE}>Aucune</SelectItem>
        {!known && !loading && (
          <SelectItem value={value}>Signature introuvable</SelectItem>
        )}
        {signatures.map((signature) => (
          <SelectItem key={signature.id} value={signature.id}>
            {signature.name || "Signature sans nom"}
            {signature.isDefault ? " (par défaut)" : ""}
          </SelectItem>
        ))}
        {error && !signatures.length && (
          <p className="px-2 py-1.5 text-xs text-muted-foreground">
            Vos signatures n&apos;ont pas pu être chargées.
          </p>
        )}
      </SelectContent>
    </Select>
  );
}

/**
 * Réglages de la boîte d'envoi (panneau latéral) : e-mails par jour, jours
 * et heures d'envoi (heure de Paris), signature, déconnexion.
 */
export function MailboxSettingsSheet({
  open,
  onOpenChange,
  workspaceId,
  mailbox,
  settings,
  canEdit = true,
}) {
  const maxDailyLimit = settings?.maxDailyLimit || 50;
  const [form, setForm] = useState(() =>
    mailboxSettingsForm(mailbox, {
      defaultDailyLimit: settings?.defaultDailyLimit,
    }),
  );
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  // Formulaire repris de la boîte à chaque ouverture
  useEffect(() => {
    if (!open) return;
    setForm(
      mailboxSettingsForm(mailbox, {
        defaultDailyLimit: settings?.defaultDailyLimit,
      }),
    );
    // La boîte peut être relue pendant l'ouverture : seule l'ouverture compte
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mailbox?.id]);

  const [updateMailbox, { loading: saving }] = useMutation(
    UPDATE_PROSPECTING_MAILBOX,
    { errorPolicy: "none" },
  );
  const [disconnectMailbox, { loading: disconnecting }] = useMutation(
    DISCONNECT_PROSPECTING_MAILBOX,
    {
      errorPolicy: "none",
      refetchQueries: [
        "ProspectingSettings",
        "ProspectingSequences",
        "ProspectingSequence",
      ],
    },
  );

  if (!mailbox) return null;

  const errors = validateMailboxSettings(form, { maxDailyLimit });
  const invalid = Object.keys(errors).length > 0;
  const set = (field) => (value) =>
    setForm((current) => ({ ...current, [field]: value }));
  const toggleDay = (day) =>
    setForm((current) => ({
      ...current,
      days: current.days.includes(day)
        ? current.days.filter((item) => item !== day)
        : [...current.days, day],
    }));
  const typedLimit = Number(form.dailyLimit);
  const ramp =
    Number.isFinite(typedLimit) && typedLimit > 0
      ? rampUpHint(mailbox.connectedAt, typedLimit)
      : null;

  const save = async (event) => {
    event?.preventDefault();
    if (invalid || saving || !canEdit) return;
    try {
      await updateMailbox({
        variables: {
          workspaceId,
          id: mailbox.id,
          input: mailboxSettingsInput(form),
        },
      });
      toast.success("Réglages enregistrés");
      onOpenChange(false);
    } catch (saveError) {
      toast.error("Enregistrement impossible", {
        description: errorMessage(saveError),
      });
    }
  };

  const disconnect = async () => {
    try {
      await disconnectMailbox({ variables: { workspaceId, id: mailbox.id } });
      toast.success("Boîte déconnectée", {
        description: "Newbi n'a plus accès à cette adresse.",
      });
      setConfirmDisconnect(false);
      onOpenChange(false);
    } catch (disconnectError) {
      toast.error("Déconnexion impossible", {
        description: errorMessage(disconnectError),
      });
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
        <SheetContent
          className="flex w-full flex-col gap-0 p-0 focus:outline-none sm:max-w-[480px]"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            event.currentTarget?.focus?.();
          }}
        >
          <SheetHeader className="shrink-0 border-b border-[#EEEFF1] px-5 pt-5 pb-4 dark:border-[#232323]">
            <SheetTitle className="pr-8 text-base font-medium">
              Réglages de la boîte d&apos;envoi
            </SheetTitle>
            <SheetDescription className="text-xs leading-5 [overflow-wrap:anywhere]">
              {mailbox.accountEmail} · {providerLabel(mailbox.provider)}
            </SheetDescription>
          </SheetHeader>

          <form
            id="mailbox-settings-form"
            onSubmit={save}
            noValidate
            className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 py-5"
          >
            <FieldBlock
              label="E-mails par jour"
              htmlFor="mailbox-daily-limit"
              error={errors.dailyLimit}
              hint={
                <>
                  Conseil : {RECOMMENDED_DAILY_LIMIT} par jour, entre{" "}
                  {MIN_DAILY_LIMIT} et {maxDailyLimit}.{" "}
                  {ramp ||
                    "Les 14 premiers jours, la limite monte d'elle-même : 10 la première semaine, 20 la deuxième."}
                </>
              }
            >
              <div className="flex items-center gap-2.5">
                <Input
                  id="mailbox-daily-limit"
                  type="number"
                  inputMode="numeric"
                  min={MIN_DAILY_LIMIT}
                  max={maxDailyLimit}
                  step={1}
                  value={form.dailyLimit}
                  onChange={(event) => set("dailyLimit")(event.target.value)}
                  disabled={!canEdit}
                  className="w-24 tabular-nums"
                  aria-invalid={Boolean(errors.dailyLimit)}
                />
                <span className="text-sm text-muted-foreground">
                  au plus, un toutes les 3 à 8 minutes
                </span>
              </div>
            </FieldBlock>

            <FieldBlock label="Jours d'envoi" error={errors.days}>
              <div
                role="group"
                aria-label="Jours d'envoi"
                className="grid grid-cols-7 gap-1.5"
              >
                {WEEK_DAYS.map((day) => {
                  const active = form.days.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      aria-pressed={active}
                      aria-label={day.long}
                      disabled={!canEdit}
                      onClick={() => toggleDay(day.value)}
                      className={cn(
                        "h-8 cursor-pointer rounded-[9px] border text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                        FOCUS_RING,
                        active
                          ? "border-[#5a50ff] bg-[#5a50ff]/[0.08] text-[#4a41e0] dark:border-[#8b7fff] dark:bg-[#8b7fff]/15 dark:text-[#c9c3ff]"
                          : "border-[#e6e7ea] text-muted-foreground hover:border-[#c9cbd1] hover:text-foreground dark:border-[#2E2E32] dark:hover:border-[#44444A]",
                      )}
                    >
                      {day.short}
                    </button>
                  );
                })}
              </div>
            </FieldBlock>

            <FieldBlock
              label="Heures d'envoi (heure de Paris)"
              error={errors.hours}
              hint="Jamais un jour férié. Un message envoyé au bureau, en semaine, ressemble à un vrai e-⁠mail."
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">De</span>
                <Select
                  value={String(form.startHour)}
                  onValueChange={(value) => set("startHour")(Number(value))}
                  disabled={!canEdit}
                >
                  <SelectTrigger
                    className="w-[92px]"
                    aria-label="Heure de début"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {START_HOURS.map((hour) => (
                      <SelectItem key={hour} value={String(hour)}>
                        {formatHour(hour)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">à</span>
                <Select
                  value={String(form.endHour)}
                  onValueChange={(value) => set("endHour")(Number(value))}
                  disabled={!canEdit}
                >
                  <SelectTrigger className="w-[92px]" aria-label="Heure de fin">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {END_HOURS.map((hour) => (
                      <SelectItem key={hour} value={String(hour)}>
                        {formatHour(hour)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </FieldBlock>

            <FieldBlock
              label="Signature"
              htmlFor="mailbox-signature"
              hint={
                <>
                  Proposée pour chaque nouvelle prospection. Vos signatures se
                  gèrent dans{" "}
                  <Link
                    href="/dashboard/outils/signatures-mail"
                    className="font-medium text-[#5a50ff] hover:underline dark:text-[#8b7fff]"
                  >
                    Signature de mail
                  </Link>
                  .
                </>
              }
            >
              <SignatureSelect
                id="mailbox-signature"
                value={form.signatureId}
                onChange={set("signatureId")}
                disabled={!canEdit}
                skip={!open}
              />
            </FieldBlock>
          </form>

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-[#EEEFF1] px-5 py-4 dark:border-[#232323]">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmDisconnect(true)}
              disabled={saving}
              className="text-red-600 hover:text-red-700 dark:text-red-400"
            >
              <Unplug className="size-3.5" aria-hidden />
              Déconnecter
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                form="mailbox-settings-form"
                variant="primary"
                disabled={!canEdit || invalid || saving}
              >
                {saving && <Loader2 className="size-3.5 animate-spin" />}
                Enregistrer
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={confirmDisconnect}
        onOpenChange={(next) => !disconnecting && setConfirmDisconnect(next)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Déconnecter {mailbox.accountEmail} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Newbi n&apos;aura plus accès à cette boîte. Les prospections en
              cours qui en partent seront mises en pause : vous pourrez les
              reprendre après avoir reconnecté une boîte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disconnecting}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                disconnect();
              }}
              disabled={disconnecting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {disconnecting && <Loader2 className="size-3.5 animate-spin" />}
              Déconnecter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
