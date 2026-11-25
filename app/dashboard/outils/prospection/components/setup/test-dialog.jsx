"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@apollo/client";
import { Info, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { toast } from "@/src/components/ui/sonner";
import { SEND_PROSPECTING_TEST } from "@/src/graphql/prospectingQueries";
import { parseEmailList } from "@/src/utils/email-campaigns";
import { FIELD_LABEL } from "@/app/dashboard/outils/campagnes-email/components/setup/setup-section";
import { errorMessage } from "../shared";

const MAX_TEST_EMAILS = 5;

/**
 * « M'envoyer un test » : le brouillon enregistré part de la boîte, objet
 * précédé de « [Test] », à l'adresse de la boîte par défaut (5 adresses au
 * plus). `unsaved` : un message est en cours de modification.
 */
export function TestDialog({
  open,
  onOpenChange,
  workspaceId,
  sequence,
  unsaved = false,
}) {
  const mailboxEmail = sequence.mailbox?.accountEmail || "";
  const [text, setText] = useState(mailboxEmail);
  useEffect(() => {
    if (open) setText(mailboxEmail);
  }, [open, mailboxEmail]);

  const [sendTest, { loading }] = useMutation(SEND_PROSPECTING_TEST, {
    errorPolicy: "none",
  });

  const { valid, invalid } = parseEmailList(text);
  const tooMany = valid.length > MAX_TEST_EMAILS;
  const blocked = loading || !valid.length || invalid.length > 0 || tooMany;

  const handleSend = async (event) => {
    event?.preventDefault();
    if (blocked) return;
    try {
      // Seule l'adresse de la boîte : défaut de l'API
      const onlyMailbox =
        valid.length === 1 && valid[0] === mailboxEmail.toLowerCase();
      const { data } = await sendTest({
        variables: {
          workspaceId,
          id: sequence.id,
          emails: onlyMailbox ? null : valid,
        },
      });
      const served = data?.sendProspectingTest?.length
        ? data.sendProspectingTest
        : valid;
      toast.success("E-mail de test envoyé", {
        description: served.join(", "),
      });
      onOpenChange(false);
    } catch (sendError) {
      toast.error("Le test n'a pas été envoyé", {
        description: errorMessage(sendError),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <DialogContent className="gap-0 p-0 sm:max-w-[460px]">
        <form onSubmit={handleSend}>
          <DialogHeader className="px-6 pt-6 pb-5">
            <DialogTitle className="text-lg font-medium">
              M&apos;envoyer un test
            </DialogTitle>
            <DialogDescription>
              Le message part de votre boîte, objet précédé de « [Test] »,
              personnalisé avec votre premier destinataire ou des valeurs
              d&apos;exemple.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 px-6 pb-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="prospecting-test-emails" className={FIELD_LABEL}>
                Adresses ({MAX_TEST_EMAILS} au plus)
              </Label>
              <Input
                id="prospecting-test-emails"
                value={text}
                onChange={(event) => setText(event.target.value)}
                inputMode="email"
                autoComplete="off"
                placeholder="adresse@exemple.fr"
              />
              {invalid.length > 0 ? (
                <p className="text-xs text-red-600 dark:text-red-400">
                  Adresse invalide : {invalid.join(", ")}
                </p>
              ) : tooMany ? (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {MAX_TEST_EMAILS} adresses au plus.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Séparez les adresses par une virgule.
                </p>
              )}
            </div>
            {unsaved && (
              <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                Le test part de la dernière version enregistrée : enregistrez
                d&apos;abord le message en cours de modification.
              </p>
            )}
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
            <Button type="submit" variant="primary" disabled={blocked}>
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <MailCheck className="size-3.5" />
              )}
              Envoyer le test
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
