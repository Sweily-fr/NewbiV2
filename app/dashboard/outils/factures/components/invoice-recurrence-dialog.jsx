"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarIcon,
  CalendarSync,
  LoaderCircle,
  TriangleAlert,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Calendar } from "@/src/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { toast } from "@/src/components/ui/sonner";
import { cn } from "@/src/lib/utils";
import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";
import { useEmailSettings } from "@/src/graphql/emailQueries";
import {
  RECURRENCE_FREQUENCY_UNITS,
  formatRecurrenceDay,
  formatRecurrenceFrequency,
  useSaveInvoiceRecurrence,
  useSetInvoiceRecurrenceStatus,
} from "@/src/graphql/invoiceRecurrenceQueries";
import {
  addMonthsToDay,
  dateToDay,
  dayToDate,
  nextRecurrenceDay,
  todayDay,
} from "@/src/utils/recurrenceDays";

const DEFAULT_SUBJECT = "Facture {documentNumber}";

// Même texte par défaut que le dialogue d'envoi manuel (send-document-modal)
const DEFAULT_BODY = `Bonjour {clientName},

Veuillez trouver ci-joint la facture {documentNumber}.

Nous vous remercions de bien vouloir procéder au règlement selon les conditions indiquées.

Cordialement,
{companyName}`;

const STATUS_LABELS = {
  ACTIVE: "Active",
  PAUSED: "Suspendue",
  ENDED: "Terminée",
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    value || 0,
  );

const parseInvoiceDate = (value) => {
  if (!value) return null;
  const raw =
    typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
  const date = new Date(raw);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Première facture proposée : même jour que la facture modèle, le mois
 * suivant, repoussé de mois en mois jusqu'à aujourd'hui au plus tôt.
 */
function defaultFirstDay(issueDate) {
  const today = todayDay();
  const issued = parseInvoiceDate(issueDate);
  if (!issued) return today;
  const anchor = dateToDay(issued);
  let k = 1;
  let candidate = addMonthsToDay(anchor, k);
  while (candidate < today && k < 600) {
    k += 1;
    candidate = addMonthsToDay(anchor, k);
  }
  return candidate;
}

function DayPicker({ value, onChange, minDay, placeholder }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="size-3.5 text-muted-foreground" />
          {value ? formatRecurrenceDay(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ? dayToDate(value) : undefined}
          defaultMonth={dayToDate(value || minDay || todayDay())}
          disabled={(date) => (minDay ? dateToDay(date) < minDay : false)}
          onSelect={(date) => {
            if (!date) return;
            onChange(dateToDay(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

/**
 * Programmer, modifier, suspendre ou arrêter la récurrence d'une facture.
 * `invoice` vient du tableau des factures ; depuis l'onglet « Récurrentes »,
 * seule la récurrence est connue et son résumé de facture modèle suffit.
 */
export default function InvoiceRecurrenceDialog({
  open,
  onOpenChange,
  invoice,
  recurrence,
  onSaved,
}) {
  const { isReadOnly } = useSubscriptionAccess();
  const { data: emailSettingsData } = useEmailSettings();
  const { saveRecurrence, loading: saving } = useSaveInvoiceRecurrence();
  const { setStatus, loading: changingStatus } =
    useSetInvoiceRecurrenceStatus();

  const isLive = recurrence && ["ACTIVE", "PAUSED"].includes(recurrence.status);

  const source = useMemo(() => {
    const summary = recurrence?.sourceInvoice;
    const prefix = invoice?.prefix ?? summary?.prefix;
    const number = invoice?.number ?? summary?.number;
    return {
      id: invoice?.id || recurrence?.sourceInvoiceId,
      reference: [prefix, number].filter(Boolean).join("-"),
      clientName: invoice?.client?.name ?? summary?.clientName,
      clientEmail: invoice?.client?.email ?? summary?.clientEmail,
      total:
        invoice?.finalTotalTTC ?? invoice?.totalTTC ?? summary?.finalTotalTTC,
      issueDate: invoice?.issueDate,
    };
  }, [invoice, recurrence]);

  const defaultBody =
    emailSettingsData?.getEmailSettings?.invoiceEmailTemplate || DEFAULT_BODY;

  const [frequency, setFrequency] = useState("MONTHLY");
  const [intervalInput, setIntervalInput] = useState("1");
  const [firstDay, setFirstDay] = useState(todayDay());
  const [dayTouched, setDayTouched] = useState(false);
  const [hasEnd, setHasEnd] = useState(false);
  const [endDay, setEndDay] = useState(null);
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [bodyTouched, setBodyTouched] = useState(false);
  const [confirmStop, setConfirmStop] = useState(false);
  const initializedFor = useRef(null);

  // Réinitialiser le formulaire à chaque ouverture
  useEffect(() => {
    if (!open) {
      initializedFor.current = null;
      return;
    }
    const key = `${source.id}:${recurrence?.id || "new"}`;
    if (initializedFor.current === key) return;
    initializedFor.current = key;

    if (isLive) {
      setFrequency(recurrence.frequency);
      setIntervalInput(String(recurrence.interval || 1));
      setFirstDay(
        nextRecurrenceDay(recurrence) || defaultFirstDay(source.issueDate),
      );
      setHasEnd(Boolean(recurrence.endDate));
      setEndDay(recurrence.endDate || null);
      setSubject(recurrence.emailSubject || DEFAULT_SUBJECT);
      setBody(recurrence.emailBody || defaultBody);
      setBodyTouched(Boolean(recurrence.emailBody));
    } else {
      setFrequency(recurrence?.frequency || "MONTHLY");
      setIntervalInput(String(recurrence?.interval || 1));
      setFirstDay(defaultFirstDay(source.issueDate));
      setHasEnd(false);
      setEndDay(null);
      setSubject(recurrence?.emailSubject || DEFAULT_SUBJECT);
      setBody(recurrence?.emailBody || defaultBody);
      setBodyTouched(Boolean(recurrence?.emailBody));
    }
    setDayTouched(false);
    setConfirmStop(false);
  }, [open, source.id, source.issueDate, recurrence, isLive, defaultBody]);

  // Modèle des paramètres email arrivé après l'ouverture
  useEffect(() => {
    if (open && !bodyTouched) setBody(defaultBody);
  }, [open, defaultBody, bodyTouched]);

  const intervalNumber = parseInt(intervalInput, 10);
  const intervalValid =
    Number.isInteger(intervalNumber) &&
    intervalNumber >= 1 &&
    intervalNumber <= 365;
  const today = todayDay();
  const firstDayValid = Boolean(firstDay) && firstDay >= today;
  const endValid = !hasEnd || (Boolean(endDay) && endDay >= firstDay);
  const canSubmit =
    !isReadOnly &&
    intervalValid &&
    firstDayValid &&
    endValid &&
    subject.trim().length > 0 &&
    body.trim().length > 0 &&
    Boolean(source.clientEmail);

  const unit = RECURRENCE_FREQUENCY_UNITS[frequency];

  const handleSubmit = async () => {
    if (!canSubmit || saving) return;
    // Rythme et date inchangés : on garde l'ancrage d'origine (le 31 du
    // mois retombe sur le dernier jour des mois courts sans dériver). Sinon
    // la date affichée devient la nouvelle ancre.
    const keepAnchor =
      isLive &&
      !dayTouched &&
      frequency === recurrence.frequency &&
      intervalNumber === (recurrence.interval || 1) &&
      recurrence.startDate <= firstDay;
    const startDate = keepAnchor ? recurrence.startDate : firstDay;
    const result = await saveRecurrence(source.id, {
      frequency,
      interval: intervalNumber,
      startDate,
      endDate: hasEnd ? endDay : null,
      emailSubject: subject.trim() === DEFAULT_SUBJECT ? null : subject.trim(),
      emailBody: body === defaultBody ? null : body,
    });
    if (!result.success) return;
    toast.success(
      isLive ? "Récurrence mise à jour" : "Facture rendue récurrente",
      {
        description: `Prochaine facture le ${formatRecurrenceDay(
          result.recurrence?.nextRunDate || firstDay,
        )}`,
      },
    );
    onSaved?.(result.recurrence);
    onOpenChange(false);
  };

  const handleStatus = async (status) => {
    const result = await setStatus(recurrence.id, status);
    if (!result.success) return;
    const messages = {
      PAUSED: "Récurrence suspendue",
      ACTIVE: "Récurrence reprise",
      ENDED: "Récurrence arrêtée",
    };
    toast.success(messages[status]);
    onSaved?.(result.recurrence);
    onOpenChange(false);
  };

  const busy = saving || changingStatus;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[560px] max-h-[calc(100vh-2rem)] p-1 gap-0 border-0 bg-[#efefef] dark:bg-[#1a1a1a] overflow-hidden rounded-2xl">
          <div className="flex flex-col min-h-0 max-h-[calc(100vh-2.5rem)] bg-background rounded-xl overflow-hidden ring-1 ring-black/[0.07] dark:ring-white/[0.1]">
            <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/40">
              <DialogTitle className="text-sm font-medium flex items-center gap-2">
                <CalendarSync className="size-4" />
                {isLive
                  ? "Récurrence de la facture"
                  : "Rendre la facture récurrente"}
              </DialogTitle>
              <p className="text-[11px] text-muted-foreground mt-1">
                {[
                  source.reference,
                  source.clientName,
                  source.total != null ? formatCurrency(source.total) : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </DialogHeader>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 px-5 py-4">
              {isLive && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-1 rounded-md font-medium",
                      recurrence.status === "ACTIVE"
                        ? "bg-[#5b4eff]/10 text-[#5b4eff]"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <CalendarSync className="size-3" />
                    {STATUS_LABELS[recurrence.status]}
                  </span>
                  <span className="text-muted-foreground">
                    {recurrence.generatedCount > 0
                      ? `${recurrence.generatedCount} facture${recurrence.generatedCount > 1 ? "s" : ""} générée${recurrence.generatedCount > 1 ? "s" : ""}`
                      : "Aucune facture générée pour l'instant"}
                    {recurrence.lastRunDate
                      ? `, la dernière le ${formatRecurrenceDay(recurrence.lastRunDate)}`
                      : ""}
                  </span>
                </div>
              )}

              {recurrence?.lastError && (
                <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                  <TriangleAlert className="size-3.5 mt-0.5 shrink-0" />
                  <div>
                    {recurrence.status === "PAUSED" && (
                      <p className="font-medium">
                        Récurrence suspendue après plusieurs échecs.
                      </p>
                    )}
                    <p>{recurrence.lastError}</p>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">Répéter</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm shrink-0">
                    {frequency === "WEEKLY" ? "Toutes les" : "Tous les"}
                  </span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={365}
                    value={intervalInput}
                    onChange={(e) => setIntervalInput(e.target.value)}
                    className={cn(
                      "w-20",
                      !intervalValid && "border-destructive",
                    )}
                  />
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(RECURRENCE_FREQUENCY_UNITS).map(
                        ([value, labels]) => (
                          <SelectItem key={value} value={value}>
                            {intervalNumber > 1 ? labels.many : labels.one}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm text-muted-foreground">
                    Prochaine facture le
                  </label>
                  <DayPicker
                    value={firstDay}
                    minDay={today}
                    placeholder="Choisir une date"
                    onChange={(day) => {
                      setFirstDay(day);
                      setDayTouched(true);
                      if (hasEnd && endDay && endDay < day) setEndDay(day);
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted-foreground">Fin</label>
                  <Select
                    value={hasEnd ? "date" : "never"}
                    onValueChange={(value) => {
                      setHasEnd(value === "date");
                      if (value === "date" && !endDay) {
                        setEndDay(addMonthsToDay(firstDay, 12));
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Jamais</SelectItem>
                      <SelectItem value="date">À une date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {hasEnd && (
                <div className="space-y-1.5">
                  <label className="text-sm text-muted-foreground">
                    Dernière facture au plus tard le
                  </label>
                  <DayPicker
                    value={endDay}
                    minDay={firstDay}
                    placeholder="Choisir une date"
                    onChange={setEndDay}
                  />
                </div>
              )}

              <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground leading-relaxed">
                {firstDayValid && intervalValid ? (
                  <>
                    Une facture sera créée le{" "}
                    <span className="text-foreground font-medium">
                      {formatRecurrenceDay(firstDay)}
                    </span>
                    , puis{" "}
                    <span className="text-foreground font-medium">
                      {formatRecurrenceFrequency(frequency, intervalNumber)}
                    </span>
                    {hasEnd && endDay
                      ? ` jusqu'au ${formatRecurrenceDay(endDay)}`
                      : ""}
                    . Elle reprend le contenu de{" "}
                    {source.reference || "cette facture"}, prend le numéro qui
                    suit vos dernières factures et part automatiquement par
                    email à{" "}
                    <span className="text-foreground font-medium">
                      {source.clientEmail || "l'adresse du client"}
                    </span>{" "}
                    avec la facture en pièce jointe.
                  </>
                ) : !intervalValid ? (
                  `Indiquez un nombre de ${unit?.many || "périodes"} entre 1 et 365.`
                ) : (
                  "Choisissez une date à partir d'aujourd'hui."
                )}
              </div>

              <div className="space-y-3 pt-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Email envoyé au client
                </p>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted-foreground">Objet</label>
                  <Input
                    value={subject}
                    maxLength={300}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted-foreground">
                    Message
                  </label>
                  <Textarea
                    value={body}
                    rows={7}
                    maxLength={10000}
                    onChange={(e) => {
                      setBody(e.target.value);
                      setBodyTouched(true);
                    }}
                    className="resize-none text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Variables : {"{clientName}"}, {"{documentNumber}"},{" "}
                    {"{totalAmount}"}, {"{companyName}"}. Elles sont remplacées
                    à chaque envoi.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-border/40 px-5 py-3">
              <div className="flex items-center gap-3">
                {isLive && (
                  <>
                    <button
                      type="button"
                      disabled={busy || isReadOnly}
                      onClick={() =>
                        handleStatus(
                          recurrence.status === "ACTIVE" ? "PAUSED" : "ACTIVE",
                        )
                      }
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {recurrence.status === "ACTIVE"
                        ? "Suspendre"
                        : "Reprendre"}
                    </button>
                    <button
                      type="button"
                      disabled={busy || isReadOnly}
                      onClick={() => setConfirmStop(true)}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Arrêter
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={busy}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={!canSubmit || busy}
                  className="gap-2"
                >
                  {saving ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      {!isLive
                        ? "Programmer"
                        : recurrence.status === "PAUSED"
                          ? "Enregistrer et reprendre"
                          : "Enregistrer"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmStop} onOpenChange={setConfirmStop}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arrêter la récurrence ?</AlertDialogTitle>
            <AlertDialogDescription>
              Plus aucune facture ne sera créée ni envoyée à partir de{" "}
              {source.reference || "cette facture"}. Les factures déjà générées
              sont conservées. Vous pourrez programmer une nouvelle récurrence
              plus tard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={changingStatus}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={changingStatus}
              onClick={(e) => {
                e.preventDefault();
                setConfirmStop(false);
                handleStatus("ENDED");
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Arrêter la récurrence
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
