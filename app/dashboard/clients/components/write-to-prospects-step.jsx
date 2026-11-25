"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { toast } from "@/src/components/ui/sonner";
import { useWorkspaceFeatures } from "@/src/hooks/useWorkspaceFeatures";
import {
  useCreateProspectingSequence,
  useProspectingSettings,
} from "@/src/hooks/useProspecting";
import {
  PROSPECTING_URL,
  mailboxState,
  prospectingUrl,
  sequenceFromListInput,
} from "@/src/utils/prospecting";
import { plural } from "@/src/utils/email-campaigns";
import {
  errorMessage,
  useProspectingAccess,
} from "@/app/dashboard/outils/prospection/components/shared";

/**
 * « Écrire à ces prospects » proposé à la fin de « Générer des prospects » :
 * seulement si l'espace a la Prospection et que le rôle permet d'en créer.
 */
export function useCanWriteToProspects() {
  const { isEnabled } = useWorkspaceFeatures();
  const access = useProspectingAccess();
  return isEnabled("prospecting") && access.canCreate && !access.readOnly;
}

/**
 * Fin de la génération : prospects ajoutés, puis un brouillon de
 * prospection avec leur liste en destinataires, ouvert aussitôt. Sans
 * boîte d'envoi : direction la page Prospection pour la connecter.
 */
export function WriteToProspectsStep({ added, onClose }) {
  const router = useRouter();
  const { settings, loading } = useProspectingSettings();
  const mailbox = settings?.myMailbox || null;
  const hasMailbox = mailboxState(mailbox) !== "none";
  const { create, creating } = useCreateProspectingSequence();

  const write = async () => {
    try {
      const sequence = await create(
        sequenceFromListInput({
          listId: added.listId,
          listName: added.listName,
          signatureId: mailbox?.signatureId,
        }),
      );
      if (!sequence) return;
      onClose();
      router.push(prospectingUrl(sequence.id));
    } catch (createError) {
      toast.error("Création impossible", {
        description: errorMessage(createError),
      });
    }
  };

  const connect = () => {
    onClose();
    router.push(PROSPECTING_URL);
  };

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-6 py-10 text-center">
        <span className="mb-4 flex size-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          <Check className="size-5" aria-hidden />
        </span>
        <p className="text-base font-medium">
          {plural(added.count, "prospect")} ajouté{added.count > 1 ? "s" : ""} à
          vos contacts
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {[added.listName && `Liste « ${added.listName} »`, added.spent]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <p className="mt-5 max-w-md text-sm text-muted-foreground">
          Écrivez-leur depuis votre boîte mail : un message chacun, à votre nom,
          au rythme que vous choisissez.
        </p>
        {!loading && !hasMailbox && (
          <p className="mt-2 max-w-md text-sm font-medium">
            Connectez d&apos;abord votre boîte Gmail ou Outlook depuis la page
            Prospection.
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border/40 px-5 py-3">
        <Button variant="outline" onClick={onClose} disabled={creating}>
          Fermer
        </Button>
        {hasMailbox ? (
          <Button
            variant="primary"
            onClick={write}
            disabled={creating || loading}
            className="gap-2"
          >
            {creating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowRight className="size-4" aria-hidden />
            )}
            Écrire à ces prospects
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={connect}
            disabled={loading}
            className="gap-2"
          >
            <ArrowRight className="size-4" aria-hidden />
            Connecter ma boîte d&apos;envoi
          </Button>
        )}
      </div>
    </>
  );
}
