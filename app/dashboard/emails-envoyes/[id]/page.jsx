"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Paperclip } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { EmailTrackingStatus } from "@/src/components/email-tracking-status";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { useDocumentEmailLog } from "@/src/graphql/documentEmailQueries";
import {
  EMAIL_LOG_DOCUMENT_LABELS,
  emailLogDocumentUrl,
  emailLogTracking,
  formatAttachmentSize,
  formatEmailLogDate,
} from "@/src/utils/document-email-log";
import { EmailSentPageSkeleton } from "../components/email-sent-page-skeleton";

/**
 * E-mail tel que le client l'a reçu, ouvert depuis le reçu d'envoi ou
 * l'historique d'un document. Le HTML est conservé sans pixel ni liens de
 * suivi : l'afficher ne marque pas le document « Ouvert ».
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
  const extraAttachments = log.attachments.filter((att) => !att.isDocument);

  const goBack = () => {
    // Ouvert depuis le reçu (nouvel onglet) : pas de page précédente
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(sameWorkspace ? documentUrl : "/dashboard");
    }
  };

  return (
    // Écran large : la page tient dans la hauteur de la fenêtre, l'e-mail est
    // réduit pour tenir dans son cadre (pas de défilement de la page)
    <div className="flex flex-col gap-4 p-4 md:p-6 md:h-[calc(100vh-64px-var(--dashboard-banners-h,0px))] md:overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 shrink-0">
        <div className="flex items-start gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={goBack}
            aria-label="Retour"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold">E-mail envoyé</h1>
            <p className="text-sm text-muted-foreground">
              {documentLabel} {log.documentNumber} · envoyé le{" "}
              {formatEmailLogDate(log.sentAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EmailTrackingStatus emailTracking={emailLogTracking(log)} />
          {sameWorkspace && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(documentUrl)}
            >
              Ouvrir le document
            </Button>
          )}
        </div>
      </div>

      {log.deliveryStatus === "FAILED" && (
        <div className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm dark:border-red-900/50 dark:bg-red-950/20">
          <p className="font-medium text-red-700 dark:text-red-400">
            Cet e-mail n&apos;a pas été remis à {log.to}
          </p>
          <p className="mt-1 text-red-700/80 dark:text-red-400/80">
            {log.deliveryFailureReason ? `${log.deliveryFailureReason}. ` : ""}
            Vérifiez l&apos;adresse puis renvoyez le document.
          </p>
        </div>
      )}

      {!sameWorkspace && (
        <p className="shrink-0 text-sm text-muted-foreground">
          Envoyé depuis l&apos;espace {log.workspaceName || "d'origine"} :
          changez d&apos;espace pour ouvrir le document.
        </p>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:flex-1 md:min-h-0">
        <dl className="grid grid-cols-[96px_minmax(0,1fr)] content-start gap-x-3 gap-y-2.5 rounded-lg border p-4 text-sm md:w-[340px] md:shrink-0 md:overflow-y-auto">
          <DetailRow label="De" value={log.from} />
          {log.replyTo && <DetailRow label="Répondre à" value={log.replyTo} />}
          <DetailRow label="À" value={log.to} />
          {log.cc.length > 0 && <DetailRow label="Cc" value={log.cc} />}
          {log.bcc.length > 0 && <DetailRow label="Cci" value={log.bcc} />}
          <DetailRow label="Objet" value={log.subject} />
          {log.senderEmail && (
            <DetailRow label="Envoyé par" value={log.senderEmail} />
          )}
          {log.deliveredAt && (
            <DetailRow
              label="Remis le"
              value={formatEmailLogDate(log.deliveredAt)}
            />
          )}
          {log.openedAt && (
            <DetailRow
              label="Ouvert le"
              value={formatEmailLogDate(log.openedAt)}
            />
          )}
          {log.attachments.length > 0 && (
            <>
              <dt className="text-muted-foreground">Pièces jointes</dt>
              <dd className="min-w-0 space-y-1">
                {log.attachments.map((att, index) => (
                  <p
                    key={`${att.filename}-${index}`}
                    className="flex items-center gap-1.5 min-w-0"
                  >
                    <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{att.filename}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatAttachmentSize(att.size)}
                    </span>
                  </p>
                ))}
                {extraAttachments.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Les fichiers ajoutés à l&apos;envoi ne sont pas conservés,
                    seul leur nom est affiché.
                  </p>
                )}
              </dd>
            </>
          )}
        </dl>

        <EmailFrame html={log.html} />
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  const values = Array.isArray(value) ? value : [value];
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">
        {values.map((item, index) => (
          <span key={index} className="block">
            {item || "-"}
          </span>
        ))}
      </dd>
    </>
  );
}

// En dessous, l'e-mail devient illisible : son cadre défile plutôt
const MIN_EMAIL_SCALE = 0.5;

/**
 * E-mail dans un cadre isolé : pas de script (sandbox sans allow-scripts),
 * styles de l'e-mail sans effet sur la page. allow-same-origin sert seulement
 * à mesurer le contenu.
 *
 * Écran large : l'e-mail est réduit pour tenir entier dans la hauteur
 * disponible (comme l'aperçu d'un PDF). Mobile : taille réelle, la page
 * défile.
 */
function EmailFrame({ html }) {
  const containerRef = useRef(null);
  const frameRef = useRef(null);
  const [layout, setLayout] = useState({
    scale: 1,
    width: null,
    height: 640,
  });

  const fitContent = useCallback(() => {
    const container = containerRef.current;
    const doc = frameRef.current?.contentDocument;
    if (!container || !doc?.documentElement) return;

    // Hauteur propre du contenu (scrollHeight vaut au moins celle du cadre)
    const contentHeight = Math.ceil(
      doc.documentElement.getBoundingClientRect().height,
    );
    if (!contentHeight) return;
    const fitToPage = window.matchMedia("(min-width: 768px)").matches;
    const scale = fitToPage
      ? Math.max(
          MIN_EMAIL_SCALE,
          Math.min(1, container.clientHeight / contentHeight),
        )
      : 1;
    // Cadre élargi d'autant qu'il est réduit : l'e-mail occupe toute la
    // largeur visible et reste centré
    const width = container.clientWidth / scale;

    setLayout((prev) =>
      prev.scale === scale &&
      prev.width === width &&
      prev.height === contentHeight
        ? prev
        : { scale, width, height: contentHeight },
    );
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const observer = new ResizeObserver(fitContent);
    observer.observe(container);
    return () => observer.disconnect();
  }, [fitContent]);

  // La largeur du cadre change la mise en page de l'e-mail : seconde mesure
  useEffect(() => {
    fitContent();
  }, [layout.width, fitContent]);

  return (
    <div
      ref={containerRef}
      className="overflow-x-hidden overflow-y-auto rounded-lg border bg-[#fafafa] md:flex-1 md:min-h-0"
    >
      {/* La réduction ne change pas l'encombrement du cadre : on coupe ce
          qui dépasse de sa taille réduite */}
      <div
        className="overflow-hidden"
        style={{ height: layout.height * layout.scale }}
      >
        <iframe
          ref={frameRef}
          title="E-mail reçu par le client"
          srcDoc={html || ""}
          sandbox="allow-same-origin"
          onLoad={fitContent}
          className="block border-0"
          style={{
            width: layout.width ?? "100%",
            height: layout.height,
            transform: `scale(${layout.scale})`,
            transformOrigin: "top left",
          }}
        />
      </div>
    </div>
  );
}
