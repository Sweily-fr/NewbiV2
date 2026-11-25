"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@apollo/client";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { toast } from "@/src/components/ui/sonner";
import { LAUNCH_PROSPECTING_SEQUENCE } from "@/src/graphql/prospectingQueries";
import { formatCount, plural } from "@/src/utils/email-campaigns";
import {
  estimatedDaysLabel,
  formatEndDate,
  formatSendWindow,
} from "@/src/utils/prospecting";
import { TextWithVariables } from "@/app/dashboard/outils/campagnes-email/components/setup/subject-section";
import { SendModeNotice, errorMessage } from "../shared";

/** Attestation obligatoire, tracée par l'API (consentAt, consentBy). */
export const CONSENT_LABEL =
  "J'atteste que ces destinataires sont des professionnels et que mon message concerne leur activité";

function SummaryRow({ label, children }) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 py-2 text-sm first:pt-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

/**
 * Lancement : résumé (destinataires, boîte, rythme, fin prévue, objet) et
 * case obligatoire ; l'API refuse sans elle (`consent: true`).
 */
export function LaunchDialog({
  open,
  onOpenChange,
  workspaceId,
  sequence,
  verification,
  sendMode,
}) {
  const [consent, setConsent] = useState(false);
  useEffect(() => {
    if (open) setConsent(false);
  }, [open]);

  const [launch, { loading }] = useMutation(LAUNCH_PROSPECTING_SEQUENCE, {
    errorPolicy: "none",
    refetchQueries: ["ProspectingSettings", "ProspectingSequences"],
  });

  const mailbox = sequence.mailbox;
  const sendable = verification?.audience?.sendable ?? null;
  const end = formatEndDate(verification?.estimatedEndDate);
  const days = estimatedDaysLabel(verification?.estimatedDays);
  const blocked = !consent || loading || sendable === 0;

  const handleLaunch = async () => {
    if (blocked) return;
    try {
      await launch({
        variables: { workspaceId, id: sequence.id, consent: true },
      });
      toast.success("Prospection lancée", {
        description:
          "Les messages partent un par un de votre boîte, dans votre plage d'envoi. Suivez l'avancement ici.",
      });
      onOpenChange(false);
    } catch (launchError) {
      toast.error("Lancement impossible", {
        description: errorMessage(launchError),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <DialogContent className="gap-0 p-0 sm:max-w-[540px]">
        <DialogHeader className="px-6 pt-6 pb-5">
          <DialogTitle className="text-lg font-medium">
            Lancer la prospection
          </DialogTitle>
          <DialogDescription>
            Chaque prospect reçoit votre message, de votre boîte, à votre nom.
            Vous pourrez mettre en pause ou arrêter à tout moment.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 px-6 pb-6">
          <dl className="rounded-xl border border-[#EEEFF1] px-4 py-3 dark:border-[#232323]">
            <SummaryRow label="Destinataires">
              {sendable === null ? (
                "…"
              ) : (
                <span className="font-medium">
                  {plural(sendable, "entreprise")}
                </span>
              )}
            </SummaryRow>
            <SummaryRow label="Boîte">{mailbox?.accountEmail}</SummaryRow>
            {mailbox && (
              <SummaryRow label="Rythme">
                {formatCount(mailbox.dailyLimit)} par jour au plus ·{" "}
                {formatSendWindow(mailbox.sendWindow)}
              </SummaryRow>
            )}
            {(end || days) && (
              <SummaryRow label="Fin prévue">
                {[end, days && `(${days})`].filter(Boolean).join(" ")}
              </SummaryRow>
            )}
            <SummaryRow label="Objet">
              <TextWithVariables text={sequence.subject} />
            </SummaryRow>
          </dl>

          <SendModeNotice sendMode={sendMode} />

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e6e7ea] p-3.5 transition-colors hover:bg-[#fafafa] has-[[data-state=checked]]:border-[#5a50ff]/40 has-[[data-state=checked]]:bg-[#5a50ff]/[0.04] dark:border-[#2E2E32] dark:hover:bg-white/[0.03]">
            <Checkbox
              checked={consent}
              onCheckedChange={(value) => setConsent(value === true)}
              className="mt-0.5 data-[state=checked]:border-[#5a50ff] data-[state=checked]:bg-[#5a50ff]"
            />
            <span className="text-sm leading-5">
              {CONSENT_LABEL}
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Obligatoire : sans accord préalable, la prospection par e-⁠mail
                n&apos;est permise qu&apos;auprès des professionnels, pour une
                offre en lien avec leur métier.
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
            onClick={handleLaunch}
            disabled={blocked}
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
            Lancer la prospection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
