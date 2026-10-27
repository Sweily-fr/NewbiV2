"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  X,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import {
  useDocumentEmailLog,
  useDocumentEmailLogs,
} from "@/src/graphql/documentEmailQueries";
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
 * d'actions ou l'historique d'un document : l'e-mail à taille réelle, et à
 * côté l'enveloppe, le parcours de l'envoi et les pièces jointes. Le HTML est
 * conservé sans pixel ni liens de suivi : l'afficher ne marque pas le
 * document « Ouvert ». Un document envoyé plusieurs fois propose ses autres
 * envois (Envoi 1, Envoi 2…) sans quitter la page.
 */
export default function EmailSentPage() {
  const router = useRouter();
  const { id } = useParams();
  const { workspaceId } = useRequiredWorkspace();
  const [selectedId, setSelectedId] = useState(id);
  const { data, previousData, loading, error } =
    useDocumentEmailLog(selectedId);
  // Pendant le chargement d'un autre envoi, le précédent reste affiché
  const log =
    data?.documentEmailLog ??
    (loading ? previousData?.documentEmailLog : undefined);
  const switching = loading && !data?.documentEmailLog;

  // Envois du même document, lus dans l'espace actif (seul espace où la
  // liste est autorisée) ; du plus ancien au plus récent pour la numérotation
  const { data: sendsData } = useDocumentEmailLogs({
    workspaceId,
    documentType: log?.documentType,
    documentId: log?.documentId,
    skip: !log || log.workspaceId !== workspaceId,
  });
  const sends = [...(sendsData?.documentEmailLogs || [])].reverse();

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
  // Envois antérieurs à la conservation des fichiers ajoutés à la main
  const hasLostAttachments = log.attachments.some((att) => !att.available);

  const goBack = () => {
    // Ouvert depuis le reçu (nouvel onglet) : pas de page précédente
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(sameWorkspace ? documentUrl : "/dashboard");
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-6 md:py-8">
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

      {sends.length > 1 && (
        <SendSwitcher
          sends={sends}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      )}

      {/* Écran large : l'e-mail à gauche, ses informations à droite (restent
          visibles pendant la lecture). Mobile : informations d'abord. */}
      <div
        aria-busy={switching || undefined}
        className={cn(
          "flex flex-col gap-6 transition-opacity lg:flex-row lg:items-start",
          switching && "opacity-60",
        )}
      >
        <div className="min-w-0 flex-1 overflow-hidden rounded-xl border">
          <EmailFrame html={log.html} />
        </div>

        <aside className="order-first divide-y rounded-xl border bg-card lg:order-none lg:sticky lg:top-6 lg:w-[340px] lg:shrink-0">
          <section className="space-y-3 p-5">
            <SectionTitle>Envoi</SectionTitle>
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
              <EnvelopeRow label="Objet" value={log.subject} />
              <EnvelopeRow label="De" value={log.from} />
              <EnvelopeRow label="À" value={log.to} />
              {log.cc.length > 0 && <EnvelopeRow label="Cc" value={log.cc} />}
              {log.bcc.length > 0 && (
                <EnvelopeRow label="Cci" value={log.bcc} />
              )}
              {log.replyTo && (
                <EnvelopeRow label="Répondre à" value={log.replyTo} />
              )}
            </dl>
          </section>

          <section className="space-y-3 p-5">
            <SectionTitle>Suivi</SectionTitle>
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
          </section>

          {log.attachments.length > 0 && (
            <section className="space-y-3 p-5">
              <SectionTitle>Pièces jointes</SectionTitle>
              <ul className="space-y-2">
                {log.attachments.map((att, index) => {
                  const content = (
                    <>
                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                      <span
                        className={cn(
                          "truncate",
                          att.available && "group-hover:underline",
                        )}
                      >
                        {att.filename}
                      </span>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                        {formatAttachmentSize(att.size)}
                      </span>
                    </>
                  );
                  return (
                    <li key={`${att.filename}-${index}`}>
                      {att.available ? (
                        <a
                          href={attachmentUrl(log, att, index)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={
                            att.isDocument
                              ? "Ouvrir le PDF actuel du document"
                              : "Ouvrir le fichier envoyé"
                          }
                          className="group flex min-w-0 items-center gap-2 text-sm"
                        >
                          {content}
                        </a>
                      ) : (
                        <span className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                          {content}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
              {hasLostAttachments && (
                <p className="text-xs text-muted-foreground">
                  Les fichiers ajoutés aux envois plus anciens n&apos;ont pas
                  été conservés : seul leur nom est affiché.
                </p>
              )}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

/**
 * Envois successifs du document, du premier au dernier : un clic ou les
 * flèches affichent un autre envoi. La liste défile quand elle déborde.
 */
function SendSwitcher({ sends, selectedId, onSelect }) {
  const listRef = useRef(null);
  const index = sends.findIndex((send) => send.id === selectedId);

  // L'envoi affiché reste visible dans une longue liste
  useEffect(() => {
    listRef.current
      ?.querySelector('[aria-current="true"]')
      ?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [selectedId]);

  return (
    <nav aria-label="Envois de ce document" className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-8 shrink-0"
        aria-label="Envoi précédent"
        disabled={index <= 0}
        onClick={() => onSelect(sends[index - 1].id)}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <div
        ref={listRef}
        className="flex min-w-0 gap-1.5 overflow-x-auto p-0.5 scrollbar-hide"
      >
        {sends.map((send, position) => {
          const active = send.id === selectedId;
          const failed = send.deliveryStatus === "FAILED";
          return (
            <button
              key={send.id}
              type="button"
              aria-current={active ? "true" : undefined}
              title={`À ${send.to}`}
              onClick={() => onSelect(send.id)}
              className={cn(
                "flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-shadow",
                active
                  ? "bg-[#fbfbfb] text-[#242529] shadow-[inset_0_0_0_1px_rgb(238,239,241)] dark:bg-[#1a1a1a] dark:text-foreground dark:shadow-[inset_0_0_0_1px_#232323]"
                  : "text-[#606164] hover:shadow-[inset_0_0_0_1px_#EEEFF1] dark:text-muted-foreground dark:hover:shadow-[inset_0_0_0_1px_#232323]",
              )}
            >
              {failed && (
                <span
                  aria-hidden="true"
                  className="size-1.5 shrink-0 rounded-full bg-red-500"
                />
              )}
              <span className={cn(active && "font-medium")}>
                Envoi {position + 1}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatSendDate(send.sentAt)}
              </span>
              {failed && <span className="sr-only">(non remis)</span>}
            </button>
          );
        })}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 shrink-0"
        aria-label="Envoi suivant"
        disabled={index === -1 || index >= sends.length - 1}
        onClick={() => onSelect(sends[index + 1].id)}
      >
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  );
}

/**
 * Fichier servi par le proxy du site (session transmise à l'API, droits
 * vérifiés sur le document) : le PDF archivé du document, ou le fichier
 * ajouté à la main conservé avec l'envoi (repéré par sa place dans la liste).
 */
function attachmentUrl(log, attachment, index) {
  return attachment.isDocument
    ? `/api/document-preview/${log.documentType}/${log.documentId}`
    : `/api/document-preview/emailAttachment/${log.id}?index=${index}`;
}

function SectionTitle({ children }) {
  return (
    <h2 className="text-xs font-normal uppercase tracking-wide text-muted-foreground">
      {children}
    </h2>
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
    <ol>
      {steps.map((step, index) => {
        const next = steps[index + 1];
        return (
          <li
            key={step.label}
            className="relative flex items-center gap-3 pb-4 last:pb-0"
          >
            {/* Trait vers l'étape suivante, coloré une fois atteinte */}
            {next && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-[9px] top-6 bottom-1 w-0.5 rounded-full",
                  next.state === "done" ? "bg-[#5b4fff]" : "bg-border",
                )}
              />
            )}
            <StepIcon state={step.state} />
            <p
              className={cn(
                "text-sm font-medium",
                step.state === "pending" && "text-muted-foreground",
                step.state === "failed" && "text-red-600 dark:text-red-400",
              )}
            >
              {step.label}
            </p>
            <p className="ml-auto text-xs text-muted-foreground">
              {step.at ? formatStepTime(step.at, log.sentAt) : step.note}
            </p>
          </li>
        );
      })}
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

// « 27 oct. · 14:32 » : plusieurs envois le même jour se distinguent
function formatSendDate(value) {
  const day = new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
  return `${day} · ${formatTime(value)}`;
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
