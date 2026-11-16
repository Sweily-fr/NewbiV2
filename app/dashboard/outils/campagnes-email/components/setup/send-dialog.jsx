"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@apollo/client";
import { CalendarClock, Loader2, Send } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Input } from "@/src/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { toast } from "@/src/components/ui/sonner";
import { SEND_EMAIL_CAMPAIGN } from "@/src/graphql/emailCampaignQueries";
import {
  getDefaultScheduleParts,
  getParisToday,
  parisPartsToIso,
} from "@/src/utils/social-post-rules";
import {
  formatCount,
  formatLongDateTime,
  plural,
} from "@/src/utils/email-campaigns";
import { TextWithVariables } from "./subject-section";
import { SendModeNote } from "../test-email-dialog";
import { errorMessage } from "../shared";
import { FIELD_LABEL } from "./setup-section";

const MIN_DELAY_MS = 10 * 60 * 1000;

function SummaryRow({ label, children }) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 py-2 text-sm first:pt-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate">{children}</dd>
    </div>
  );
}

/**
 * Envoi immédiat ou programmé (date et heure de Paris), après un résumé et
 * la case de consentement obligatoire (« Ces contacts sont mes clients ou
 * ont accepté de recevoir mes e-mails »).
 */
export function SendDialog({
  open,
  onOpenChange,
  mode,
  workspaceId,
  campaign,
  audienceCount,
  settings,
}) {
  const [consent, setConsent] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");

  useEffect(() => {
    if (!open) return;
    setConsent(false);
    const parts = getDefaultScheduleParts();
    setDate(parts.date);
    setTime(parts.time);
  }, [open]);

  const [sendCampaign, { loading }] = useMutation(SEND_EMAIL_CAMPAIGN, {
    errorPolicy: "none",
  });

  const scheduled = mode === "schedule";
  const scheduledAt = scheduled ? parisPartsToIso(date, time) : null;
  const scheduleError = useMemo(() => {
    if (!scheduled) return null;
    if (!scheduledAt) return "Choisissez une date et une heure.";
    if (new Date(scheduledAt).getTime() < Date.now() + MIN_DELAY_MS)
      return "Choisissez un moment au moins 10 minutes plus tard.";
    return null;
  }, [scheduled, scheduledAt]);

  const sendable = audienceCount?.sendable ?? null;
  const remaining = settings?.quota?.remaining;
  const overQuota =
    sendable !== null && remaining !== undefined && sendable > remaining;
  const blocked =
    !consent ||
    loading ||
    Boolean(scheduleError) ||
    sendable === 0 ||
    overQuota;

  const handleSend = async () => {
    if (blocked) return;
    try {
      await sendCampaign({
        variables: {
          workspaceId,
          id: campaign.id,
          scheduledAt: scheduled ? scheduledAt : null,
          consent: true,
        },
      });
      if (scheduled) {
        toast.success("Envoi programmé", {
          description: `La campagne partira le ${formatLongDateTime(scheduledAt)} (heure de Paris).`,
        });
      } else {
        toast.success("C'est parti", {
          description:
            "Les e-mails partent progressivement pour protéger votre réputation : suivez l'avancement ici.",
        });
      }
      onOpenChange(false);
    } catch (sendError) {
      toast.error(scheduled ? "Programmation impossible" : "Envoi impossible", {
        description: errorMessage(sendError),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <DialogContent className="gap-0 p-0 sm:max-w-[520px]">
        <DialogHeader className="px-6 pt-6 pb-5">
          <DialogTitle className="text-lg font-medium">
            {scheduled ? "Programmer l'envoi" : "Envoyer la campagne"}
          </DialogTitle>
          <DialogDescription>
            {scheduled
              ? "La campagne partira automatiquement au moment choisi. Vous pourrez annuler la programmation d'ici là."
              : "Vérifiez une dernière fois : une fois partis, les e-mails ne peuvent pas être rappelés."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 px-6 pb-6">
          {scheduled && (
            <div className="flex flex-col gap-2">
              <span className={FIELD_LABEL}>Date et heure d&apos;envoi</span>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="date"
                  aria-label="Date d'envoi"
                  value={date}
                  min={getParisToday()}
                  onChange={(event) => setDate(event.target.value)}
                  className="w-[170px]"
                />
                <Input
                  type="time"
                  aria-label="Heure d'envoi"
                  value={time}
                  step={300}
                  onChange={(event) => setTime(event.target.value)}
                  className="w-[120px]"
                />
                <span className="text-xs text-muted-foreground">
                  Heure de Paris
                </span>
              </div>
              {scheduleError ? (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {scheduleError}
                </p>
              ) : (
                scheduledAt && (
                  <p className="text-xs text-muted-foreground">
                    Départ le {formatLongDateTime(scheduledAt)}.
                  </p>
                )
              )}
            </div>
          )}

          <dl className="rounded-xl border border-[#EEEFF1] px-4 py-3 dark:border-[#232323]">
            <SummaryRow label="Destinataires">
              {sendable === null ? (
                "…"
              ) : (
                <span className="font-medium">
                  {plural(sendable, "contact")}
                </span>
              )}
            </SummaryRow>
            <SummaryRow label="Expéditeur">
              {campaign.fromName}
              <span className="text-muted-foreground">
                {" "}
                · {campaign.senderEmail}
              </span>
            </SummaryRow>
            <SummaryRow label="Objet">
              <TextWithVariables text={campaign.subject} />
            </SummaryRow>
            {remaining !== undefined && (
              <SummaryRow label="Quota du mois">
                {overQuota ? (
                  <span className="text-red-700 dark:text-red-400">
                    Insuffisant : {formatCount(remaining)} e-mails restants
                  </span>
                ) : (
                  <>
                    {formatCount(Math.max(0, remaining - (sendable || 0)))}{" "}
                    e-mails restants après l&apos;envoi
                  </>
                )}
              </SummaryRow>
            )}
          </dl>

          <SendModeNote sendMode={settings?.sendMode} />

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e6e7ea] p-3.5 transition-colors hover:bg-[#fafafa] has-[[data-state=checked]]:border-[#5a50ff]/40 has-[[data-state=checked]]:bg-[#5a50ff]/[0.04] dark:border-[#2E2E32] dark:hover:bg-white/[0.03]">
            <Checkbox
              checked={consent}
              onCheckedChange={(value) => setConsent(value === true)}
              className="mt-0.5 data-[state=checked]:border-[#5a50ff] data-[state=checked]:bg-[#5a50ff]"
            />
            <span className="text-sm leading-5">
              Ces contacts sont mes clients ou ont accepté de recevoir mes
              e-mails.
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Obligatoire (RGPD) : n&apos;envoyez jamais à des adresses
                achetées ou récupérées sans accord.
              </span>
            </span>
          </label>
        </div>

        <DialogFooter className="border-t border-[#EEEFF1] px-6 py-4 dark:border-[#232323]">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSend}
            disabled={blocked}
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : scheduled ? (
              <CalendarClock className="size-3.5" />
            ) : (
              <Send className="size-3.5" />
            )}
            {scheduled
              ? "Programmer l'envoi"
              : sendable
                ? `Envoyer à ${plural(sendable, "contact")}`
                : "Envoyer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
