"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import { Info, Loader2, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
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
import { useSession } from "@/src/lib/auth-client";
import { cn } from "@/src/lib/utils";
import { SEND_EMAIL_CAMPAIGN_TEST } from "@/src/graphql/emailCampaignQueries";
import { parseEmailList } from "@/src/utils/email-campaigns";
import { DEFAULT_VARIABLES } from "@/src/utils/email-campaign-variables";
import { ContactPicker } from "./contact-picker";
import { errorMessage } from "./shared";

const MAX_TEST_EMAILS = 5;

/** Explication du mode d'envoi hors production (aucun envoi réel à tous). */
export function SendModeNote({ sendMode, className, subject = "e-mail" }) {
  if (!sendMode || sendMode === "LIVE") return null;
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-lg bg-sky-50 px-3 py-2.5 text-xs leading-5 text-sky-900 dark:bg-sky-500/10 dark:text-sky-200",
        className,
      )}
    >
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span>
        {sendMode === "SIMULATION"
          ? `Mode simulation : aucun ${subject} ne part réellement, les statistiques avancent comme pour un vrai envoi.`
          : `Mode test : seules les adresses autorisées sur ce serveur reçoivent réellement l'${subject} ; les autres envois sont simulés.`}
      </span>
    </p>
  );
}

/**
 * Envoi d'un test (1 à 5 adresses, objet préfixé « [Test] »), personnalisé
 * avec un contact ou les valeurs d'exemple. `beforeSend` : enregistre la
 * saisie en cours (éditeur) ; false = test annulé.
 */
export function TestEmailDialog({
  open,
  onOpenChange,
  workspaceId,
  campaignId,
  sendMode,
  variables,
  beforeSend,
}) {
  const { data: session } = useSession();
  const userEmail = session?.user?.email || "";
  const [emails, setEmails] = useState([]);
  const [draft, setDraft] = useState("");
  const [contact, setContact] = useState(null);
  const [invalid, setInvalid] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setEmails(userEmail ? [userEmail.toLowerCase()] : []);
    setDraft("");
    setInvalid([]);
  }, [open, userEmail]);

  const [sendTest, { loading }] = useMutation(SEND_EMAIL_CAMPAIGN_TEST, {
    errorPolicy: "none",
  });

  // Adresses tapées : ajoutées à Entrée, virgule, espace ou en quittant le champ
  const commit = (text = draft) => {
    const { valid, invalid: wrong } = parseEmailList(text);
    if (valid.length) {
      setEmails((current) =>
        [
          ...current,
          ...valid.filter((email) => !current.includes(email)),
        ].slice(0, MAX_TEST_EMAILS),
      );
    }
    setInvalid(wrong);
    setDraft(wrong.join(" "));
  };

  const pending = parseEmailList(draft).valid;
  const all = [
    ...emails,
    ...pending.filter((email) => !emails.includes(email)),
  ];
  const tooMany = all.length > MAX_TEST_EMAILS;
  const exampleName = (variables || DEFAULT_VARIABLES).find(
    (variable) => variable.key === "nom_complet",
  )?.example;

  const handleSend = async (event) => {
    event?.preventDefault();
    if (!all.length || tooMany || loading) return;
    if (beforeSend && (await beforeSend()) === false) return;
    try {
      const { data } = await sendTest({
        variables: {
          workspaceId,
          id: campaignId,
          emails: all,
          clientId: contact?.id || null,
        },
      });
      const result = data?.sendEmailCampaignTest;
      const to = (result?.sentTo || all).join(", ");
      if (result?.simulated) {
        toast.info("Envoi de test simulé", {
          description: `Aucun e-mail n'est parti (mode test) : ${to}.`,
        });
      } else {
        toast.success("E-mail de test envoyé", { description: to });
      }
      onOpenChange(false);
    } catch (sendError) {
      toast.error("L'e-mail de test n'a pas été envoyé", {
        description: errorMessage(sendError),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <DialogContent className="gap-0 p-0 sm:max-w-[480px]">
        <form onSubmit={handleSend}>
          <DialogHeader className="px-6 pt-6 pb-5">
            <DialogTitle className="text-lg font-medium">
              Envoyer un test
            </DialogTitle>
            <DialogDescription>
              Recevez l&apos;e-mail tel que vos contacts le verront, liens
              compris. L&apos;objet commencera par « [Test] ».
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5 px-6 pb-6">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="test-emails"
                className="text-xs font-medium text-black/55 dark:text-white/55"
              >
                Adresses ({MAX_TEST_EMAILS} au plus)
              </Label>
              <div
                className="flex min-h-9 cursor-text flex-wrap items-center gap-1.5 rounded-[9px] border border-[#e6e7ea] px-1.5 py-1 transition-[border] focus-within:border-[#D1D3D8] hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A]"
                onClick={() => inputRef.current?.focus()}
              >
                {emails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex h-6 max-w-full items-center gap-1 rounded-md bg-[#f1f1f3] pr-1 pl-2 text-xs text-[#242529] dark:bg-white/10 dark:text-white"
                  >
                    <span className="truncate">{email}</span>
                    <button
                      type="button"
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation();
                        setEmails((current) =>
                          current.filter((item) => item !== email),
                        );
                      }}
                      className="flex size-4 cursor-pointer items-center justify-center rounded text-muted-foreground hover:bg-black/5 hover:text-foreground"
                      aria-label={`Retirer ${email}`}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
                <input
                  ref={inputRef}
                  id="test-emails"
                  type="text"
                  inputMode="email"
                  autoComplete="off"
                  value={draft}
                  disabled={emails.length >= MAX_TEST_EMAILS}
                  onChange={(changeEvent) => {
                    const value = changeEvent.target.value;
                    if (/[\s,;]$/.test(value)) commit(value);
                    else setDraft(value);
                  }}
                  onKeyDown={(keyEvent) => {
                    if (keyEvent.key === "Enter" && draft.trim()) {
                      keyEvent.preventDefault();
                      commit();
                    } else if (
                      keyEvent.key === "Backspace" &&
                      !draft &&
                      emails.length
                    ) {
                      setEmails((current) => current.slice(0, -1));
                    }
                  }}
                  onBlur={() => draft.trim() && commit()}
                  placeholder={emails.length ? "" : "adresse@exemple.fr"}
                  className="h-6 min-w-[140px] flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-[rgba(0,0,0,0.35)] disabled:hidden dark:placeholder:text-[rgba(255,255,255,0.35)]"
                />
              </div>
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
                  Entrée ou virgule pour ajouter une autre adresse.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-black/55 dark:text-white/55">
                Personnaliser avec
              </span>
              <ContactPicker
                workspaceId={workspaceId}
                value={contact}
                onChange={setContact}
                exampleName={exampleName}
                align="start"
                className="w-full"
              />
            </div>

            <SendModeNote sendMode={sendMode} subject="e-mail de test" />
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
              type="submit"
              variant="primary"
              disabled={!all.length || tooMany || loading}
            >
              {loading && <Loader2 className="size-3.5 animate-spin" />}
              Envoyer le test
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
