"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, FileText, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { useDocumentEmailLog } from "@/src/graphql/documentEmailQueries";
import {
  EMAIL_LOG_DOCUMENT_LABELS,
  emailLogDocumentUrl,
  formatAttachmentSize,
} from "@/src/utils/document-email-log";
import { cn } from "@/src/lib/utils";
import { EmailSentPageSkeleton } from "../components/email-sent-page-skeleton";

const OPEN_DOCUMENT_LABELS = {
  invoice: "Ouvrir la facture",
  quote: "Ouvrir le devis",
  creditNote: "Ouvrir l'avoir",
  purchaseOrder: "Ouvrir le bon de commande",
  deliveryNote: "Ouvrir le bon de livraison",
};

/**
 * E-mail tel que le client l'a reçu, ouvert depuis le reçu d'envoi, le menu
 * d'actions ou l'historique d'un document. Présenté comme dans une
 * messagerie : enveloppe, parcours de l'envoi, pièces jointes, puis l'e-mail
 * à taille réelle. Le HTML est conservé sans pixel ni liens de suivi :
 * l'afficher ne marque pas le document « Ouvert ».
 */
export default function EmailSentPage() {
  const router = useRouter();
  const { id } = useParams();
  const { workspaceId } = useRequiredWorkspace();
  const { data, loading, error } = useDocumentEmailLog(id);
  const log = data?.documentEmailLog;

  if (loading && !log) return <EmailSentPageSkeleton />;

  if (error || !log) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-6 min-h-[60vh] text-center">
        <p className="text-sm text-muted-foreground">
          Cet envoi est introuvable ou vous n&apos;y avez pas accès.
        </p>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          Retour au tableau de bord
        </Button>
      </div>
    );
  }

  const documentUrl = emailLogDocumentUrl(log);
  // Le document s'ouvre dans l'espace actif : un envoi d'un autre espace
  // reste lisible, mais son document demande de changer d'espace
  const sameWorkspace = log.workspaceId === workspaceId;
  const documentLabel = EMAIL_LOG_DOCUMENT_LABELS[log.documentType] || "";
  const hasExtraAttachments = log.attachments.some((att) => !att.isDocument);

  const goBack = () => {
    // Ouvert depuis le reçu (nouvel onglet) : pas de page précédente
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(sameWorkspace ? documentUrl : "/dashboard");
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 md:py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={goBack}
            aria-label="Retour"
            className="-ml-2 shrink-0"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-medium">E-mail envoyé</h1>
            <p className="text-sm text-muted-foreground">
              {documentLabel} {log.documentNumber} · le {formatDay(log.sentAt)}{" "}
              à {formatTime(log.sentAt)}
            </p>
          </div>
        </div>
        {sameWorkspace && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(documentUrl)}
          >
            {OPEN_DOCUMENT_LABELS[log.documentType] || "Ouvrir le document"}
          </Button>
        )}
      </div>

      {!sameWorkspace && (
        <p className="text-sm text-muted-foreground">
          Envoyé depuis l&apos;espace {log.workspaceName || "d'origine"} :
          changez d&apos;espace pour ouvrir le document.
        </p>
      )}

      <div className="overflow-hidden rounded-xl border bg-card">
        {/* Enveloppe */}
        <div className="space-y-3 p-5">
          <p className="text-base font-medium break-words">{log.subject}</p>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm">
            <EnvelopeRow label="De" value={log.from} />
            <EnvelopeRow label="À" value={log.to} />
            {log.cc.length > 0 && <EnvelopeRow label="Cc" value={log.cc} />}
            {log.bcc.length > 0 && <EnvelopeRow label="Cci" value={log.bcc} />}
            {log.replyTo && (
              <EnvelopeRow label="Répondre à" value={log.replyTo} />
            )}
          </dl>
        </div>

        {/* Parcours de l'envoi */}
        <div className="space-y-3 border-t px-5 py-4">
          <DeliverySteps log={log} />
          {log.deliveryStatus === "FAILED" && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
              Non remis à {log.to}
              {log.deliveryFailureReason
                ? ` : ${log.deliveryFailureReason}`
                : ""}
              . Vérifiez l&apos;adresse puis renvoyez le document.
            </p>
          )}
          {log.senderEmail && (
            <p className="text-xs text-muted-foreground">
              Envoyé depuis Newbi par {log.senderEmail}
            </p>
          )}
        </div>

        {/* Pièces jointes */}
        {log.attachments.length > 0 && (
          <div className="space-y-2 border-t px-5 py-4">
            <div className="flex flex-wrap gap-2">
              {log.attachments.map((att, index) => (
                <span
                  key={`${att.filename}-${index}`}
                  className="inline-flex max-w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm"
                >
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{att.filename}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatAttachmentSize(att.size)}
                  </span>
                </span>
              ))}
            </div>
            {hasExtraAttachments && (
              <p className="text-xs text-muted-foreground">
                Les fichiers ajoutés à l&apos;envoi ne sont pas conservés, seul
                leur nom est affiché.
              </p>
            )}
          </div>
        )}

        {/* L'e-mail, à taille réelle */}
        <div className="border-t">
          <EmailFrame html={log.html} />
        </div>
      </div>
    </div>
  );
}

function EnvelopeRow({ label, value }) {
  const values = Array.isArray(value) ? value : [value];
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{values.join(", ")}</dd>
    </>
  );
}

/**
 * Envoyé → Remis → Ouvert. Un rejet arrête le parcours à la remise ; une
 * ouverture sans remise reçue (événement perdu) vaut remise.
 */
function DeliverySteps({ log }) {
  const failed = log.deliveryStatus === "FAILED";
  const delivered = !failed && Boolean(log.deliveredAt || log.openedAt);
  const steps = [
    { label: "Envoyé", state: "done", at: log.sentAt },
    failed
      ? { label: "Non remis", state: "failed", at: log.deliveryFailedAt }
      : delivered
        ? { label: "Remis", state: "done", at: log.deliveredAt }
        : {
            label: "Remis",
            state: "pending",
            note:
              log.deliveryStatus === "DELAYED"
                ? "Retardé, nouvel essai"
                : "En cours",
          },
    // Rejeté : le client n'a rien reçu, pas d'ouverture à attendre
    !failed && {
      label: "Ouvert",
      state: log.openedAt ? "done" : "pending",
      at: log.openedAt,
      note: "Pas encore",
    },
  ].filter(Boolean);

  return (
    <ol className="flex items-start">
      {steps.map((step, index) => (
        <li
          key={step.label}
          className={cn("flex items-start", index > 0 && "flex-1")}
        >
          {index > 0 && (
            <span
              aria-hidden="true"
              className={cn(
                "mx-3 mt-2.5 h-px flex-1",
                step.state === "done" ? "bg-[#5b4fff]" : "bg-border",
              )}
            />
          )}
          <div className="flex items-start gap-2">
            <StepIcon state={step.state} />
            <div className="leading-tight">
              <p
                className={cn(
                  "text-sm font-medium",
                  step.state === "pending" && "text-muted-foreground",
                  step.state === "failed" && "text-red-600 dark:text-red-400",
                )}
              >
                {step.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {step.at ? formatStepTime(step.at, log.sentAt) : step.note}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function StepIcon({ state }) {
  if (state === "done") {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#5b4fff] text-white">
        <Check className="size-3" strokeWidth={3} />
      </span>
    );
  }
  if (state === "failed") {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
        <X className="size-3" strokeWidth={3} />
      </span>
    );
  }
  return (
    <span className="size-5 shrink-0 rounded-full border-2 border-dashed border-muted-foreground/30" />
  );
}

function formatDay(value) {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// L'heure seule le jour de l'envoi, la date en plus les jours suivants
function formatStepTime(value, sentAt) {
  const sameDay =
    new Date(value).toDateString() === new Date(sentAt).toDateString();
  if (sameDay) return formatTime(value);
  const day = new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
  return `${day} à ${formatTime(value)}`;
}

/**
 * E-mail dans un cadre isolé : pas de script (sandbox sans allow-scripts),
 * styles de l'e-mail sans effet sur la page. allow-same-origin sert seulement
 * à mesurer le contenu, affiché en entier sans barre de défilement propre.
 */
function EmailFrame({ html }) {
  const frameRef = useRef(null);
  const [height, setHeight] = useState(640);

  const fitContent = useCallback(() => {
    const doc = frameRef.current?.contentDocument;
    if (!doc?.documentElement) return;
    // Hauteur propre du contenu (scrollHeight vaut au moins celle du cadre)
    const contentHeight = Math.ceil(
      doc.documentElement.getBoundingClientRect().height,
    );
    if (contentHeight) setHeight(contentHeight);
  }, []);

  // Une largeur différente (fenêtre, mobile) change la hauteur de l'e-mail
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;
    const observer = new ResizeObserver(fitContent);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [fitContent]);

  return (
    <iframe
      ref={frameRef}
      title="E-mail reçu par le client"
      srcDoc={html || ""}
      sandbox="allow-same-origin"
      onLoad={fitContent}
      className="block w-full border-0 bg-[#fafafa]"
      style={{ height }}
    />
  );
}
