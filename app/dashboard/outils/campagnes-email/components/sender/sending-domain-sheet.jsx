"use client";

import { useEffect, useRef, useState } from "react";
import { useApolloClient, useMutation, useQuery } from "@apollo/client";
import {
  AtSign,
  CircleAlert,
  Info,
  Loader2,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Skeleton } from "@/src/components/ui/skeleton";
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
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { cn } from "@/src/lib/utils";
import {
  CONNECT_EMAIL_SENDING_DOMAIN,
  DISCONNECT_EMAIL_SENDING_DOMAIN,
  GET_EMAIL_SENDING_DOMAIN,
  UPDATE_EMAIL_SENDING_DOMAIN_SENDER,
  VERIFY_EMAIL_SENDING_DOMAIN,
} from "@/src/graphql/emailCampaignQueries";
import { isValidEmail } from "@/src/utils/email-campaigns";
import {
  apiErrorCode,
  checkSenderEmail,
  emailLocalPart,
  expiryNotice,
  formatCheckTime,
  formatFullDay,
  freeEmailExplanation,
  hostLabel,
  isExpiredSendingDomain,
  sendingDomainBadge,
  sendingDomainErrorMessage,
  sendingDomainProblem,
  sendingDomainState,
  suggestedSenderEmail,
  trailingDotReminder,
} from "@/src/utils/email-sending-domain";
import { FOCUS_RING, ToneBadge, useCampaignAccess } from "../shared";
import { FIELD_LABEL } from "../setup/setup-section";
import { DnsRecords } from "./dns-records";

// Requêtes qui dépendent de l'adresse d'envoi : relues quand le domaine
// change (connexion, validation, nouvelle adresse, déconnexion)
const SENDER_QUERIES = [
  "EmailCampaignSettings",
  "EmailCampaign",
  "EmailCampaignDeliverability",
];
// L'API ne relit Resend qu'une fois toutes les 20 s par espace
const VERIFY_COOLDOWN_MS = 20 * 1000;
// Validation suivie pendant que le panneau est ouvert (lecture en base :
// Newbi vérifie de lui-même toutes les 10 minutes)
const POLL_MS = 60 * 1000;

const LINK_CLASS = cn(
  "cursor-pointer rounded-sm font-medium text-[#5a50ff] hover:underline dark:text-[#8b7fff]",
  FOCUS_RING,
);

const NOTICE_TONES = {
  neutral: {
    box: "bg-[#f7f7f8] text-muted-foreground dark:bg-white/[0.04]",
    icon: Info,
    iconClass: "text-muted-foreground",
  },
  warning: {
    box: "border border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100",
    icon: TriangleAlert,
    iconClass: "text-amber-600 dark:text-amber-400",
  },
  danger: {
    box: "border border-red-200 bg-red-50 text-red-950 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-100",
    icon: CircleAlert,
    iconClass: "text-red-600 dark:text-red-400",
  },
};

/** Encadré d'information, d'avertissement ou d'erreur. */
function Notice({ tone = "neutral", title, children, className }) {
  const {
    box,
    icon: Icon,
    iconClass,
  } = NOTICE_TONES[tone] || NOTICE_TONES.neutral;
  return (
    <div
      role={tone === "neutral" ? undefined : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-xs leading-5",
        box,
        className,
      )}
    >
      <Icon className={cn("mt-0.5 size-3.5 shrink-0", iconClass)} aria-hidden />
      <div className="min-w-0">
        {title && <p className="text-sm font-medium">{title}</p>}
        <div className={cn(title && "mt-0.5 opacity-90")}>{children}</div>
      </div>
    </div>
  );
}

/** Titre d'étape numéroté (« 1. Ajoutez ces lignes… »). */
function StepTitle({ step, children }) {
  return (
    <h3 className="flex items-start gap-2.5 text-sm leading-6 font-medium">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#5a50ff]/10 text-xs font-semibold text-[#4a41e0] dark:bg-[#8b7fff]/15 dark:text-[#b5adff]">
        {step}
      </span>
      <span className="min-w-0">{children}</span>
    </h3>
  );
}

function Strong({ children }) {
  return (
    <span className="font-medium break-words text-foreground">{children}</span>
  );
}

// ── Aucun domaine ────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  "Vous indiquez l'adresse qui enverra vos campagnes.",
  "Newbi vous donne quelques lignes à copier chez l'hébergeur de votre domaine (OVH, Hostinger, IONOS…). Votre site et votre messagerie ne changent pas.",
  "Une fois votre domaine validé, vos campagnes partent de votre adresse. D'ici là, elles partent de l'adresse Newbi\u00a0: rien n'est bloqué.",
];

function ConnectView({
  newbiSenderEmail,
  expiredDomain,
  suggestion,
  canManage,
  disabledReason,
  connecting,
  onConnect,
}) {
  const [email, setEmail] = useState(suggestion);
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState(null);
  const edited = useRef(false);

  // Réglages arrivés après l'ouverture : la proposition remplit le champ
  // tant que rien n'a été saisi
  useEffect(() => {
    if (!edited.current) setEmail(suggestion);
  }, [suggestion]);

  const problem = checkSenderEmail(email, { newbiSenderEmail });
  // Adresse Gmail, Orange, Outlook… : une explication, pas une erreur,
  // affichée dès que l'adresse est reconnue
  const freeEmail =
    problem?.code === "FREE_EMAIL_PROVIDER"
      ? freeEmailExplanation(email, { newbiSenderEmail })
      : null;
  const error =
    serverError || (touched && problem && !freeEmail ? problem.message : null);

  const submit = async (event) => {
    event.preventDefault();
    setTouched(true);
    setServerError(null);
    if (problem || connecting) return;
    const message = await onConnect(email.trim().toLowerCase());
    if (message) setServerError(message);
  };

  return (
    <div className="flex flex-col gap-6">
      {expiredDomain && (
        <Notice tone="warning">
          Votre domaine <Strong>{expiredDomain.domain}</Strong> n&apos;a pas été
          validé à temps&nbsp;: il a été retiré. Vous pouvez le connecter de
          nouveau.
        </Notice>
      )}

      <div className="flex flex-col gap-1 text-sm leading-6">
        <p className="text-muted-foreground">
          Par défaut, vos campagnes partent de{" "}
          {newbiSenderEmail ? (
            <Strong>{newbiSenderEmail}</Strong>
          ) : (
            "l'adresse Newbi"
          )}
          , avec le nom de votre entreprise.
        </p>
        <p>Connectez votre domaine pour envoyer depuis votre propre adresse.</p>
      </div>

      {canManage ? (
        <form onSubmit={submit} noValidate className="flex flex-col gap-2">
          <Label htmlFor="sending-domain-email" className={FIELD_LABEL}>
            Adresse d&apos;envoi
          </Label>
          <div className="flex gap-2">
            <Input
              id="sending-domain-email"
              type="email"
              inputMode="email"
              autoComplete="off"
              spellCheck={false}
              placeholder="contact@votre-entreprise.fr"
              value={email}
              onChange={(event) => {
                edited.current = true;
                setServerError(null);
                setEmail(event.target.value);
              }}
              aria-invalid={Boolean(error) || undefined}
              aria-describedby="sending-domain-email-help"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={connecting || Boolean(disabledReason)}
              title={disabledReason || undefined}
              className="shrink-0"
            >
              {connecting && <Loader2 className="size-3.5 animate-spin" />}
              Connecter
            </Button>
          </div>
          <p
            id="sending-domain-email-help"
            className={cn(
              "text-xs leading-5",
              error
                ? "text-red-600 dark:text-red-400"
                : "text-muted-foreground",
            )}
          >
            {error ||
              "Une adresse de votre propre domaine, par exemple contact@votre-entreprise.fr."}
          </p>
          {freeEmail && (
            <Notice title={freeEmail.title} className="mt-1">
              {freeEmail.before}
              <Strong>{freeEmail.newbiSenderEmail}</Strong>
              {freeEmail.after}
            </Notice>
          )}
        </form>
      ) : (
        <Notice>
          Seuls les membres autorisés à envoyer des campagnes peuvent connecter
          un domaine. Demandez-le à un administrateur de l&apos;espace.
        </Notice>
      )}

      <div className="rounded-xl border border-[#EEEFF1] p-4 dark:border-[#232323]">
        <p className="text-sm font-medium">Comment ça se passe</p>
        <ol className="mt-3 flex flex-col gap-3">
          {HOW_IT_WORKS.map((text, index) => (
            <li
              key={text}
              className="flex items-start gap-2.5 text-xs leading-5 text-muted-foreground"
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#f1f1f3] text-[11px] font-semibold text-[#4b4d55] dark:bg-white/[0.08] dark:text-white/75">
                {index + 1}
              </span>
              <span className="pt-px">{text}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// ── Adresse connectée (en attente ou validée) ────────────────────────────

/**
 * Adresse du domaine, son état et sa modification (même domaine : seule
 * la partie avant le @ change).
 */
function AddressCard({
  domain,
  subtitle,
  canManage,
  disabledReason,
  updating,
  onUpdate,
}) {
  const badge = sendingDomainBadge(domain);
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState("");
  const [error, setError] = useState(null);

  const startEdit = () => {
    setLocal(emailLocalPart(domain.fromEmail));
    setError(null);
    setEditing(true);
  };

  const value = local.trim().toLowerCase();
  const nextEmail = `${value}@${domain.domain}`;
  const localError = !value
    ? "Indiquez la partie avant le @."
    : value.includes("@")
      ? "Saisissez seulement la partie avant le @."
      : !isValidEmail(nextEmail)
        ? "Cette adresse n'est pas valide."
        : null;

  const save = async (event) => {
    event.preventDefault();
    if (localError) {
      setError(localError);
      return;
    }
    if (nextEmail === domain.fromEmail) {
      setEditing(false);
      return;
    }
    const message = await onUpdate(nextEmail);
    if (message) setError(message);
    else setEditing(false);
  };

  return (
    <div className="rounded-xl border border-[#EEEFF1] p-4 dark:border-[#232323]">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#5a50ff]/10 text-[#5a50ff] dark:bg-[#8b7fff]/15 dark:text-[#b5adff]">
          <AtSign className="size-4" aria-hidden />
        </span>
        {editing ? (
          <form
            onSubmit={save}
            noValidate
            className="flex min-w-0 flex-1 flex-col gap-2"
          >
            <Label htmlFor="sending-domain-local" className={FIELD_LABEL}>
              Adresse d&apos;envoi
            </Label>
            <div
              className={cn(
                "flex h-8 min-w-0 items-center rounded-[9px] border transition-[border] focus-within:border-[#D1D3D8] hover:border-[#D1D3D8] sm:max-w-[420px] dark:hover:border-[#44444A]",
                error
                  ? "border-red-300 dark:border-red-500/50"
                  : "border-[#E6E7EA] dark:border-[#2E2E32]",
              )}
            >
              <Input
                id="sending-domain-local"
                variant="ghost"
                autoFocus
                autoComplete="off"
                spellCheck={false}
                value={local}
                onChange={(event) => {
                  setError(null);
                  setLocal(event.target.value);
                }}
                aria-invalid={Boolean(error) || undefined}
                className="min-w-0 pl-2.5"
              />
              <span className="max-w-[60%] shrink-0 truncate pr-2.5 text-sm text-muted-foreground">
                @{domain.domain}
              </span>
            </div>
            <p
              className={cn(
                "text-xs leading-5",
                error
                  ? "text-red-600 dark:text-red-400"
                  : "text-muted-foreground",
              )}
            >
              {error ||
                `Seule la partie avant le @ change\u00a0: le domaine reste ${domain.domain}.`}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={updating}
              >
                {updating && <Loader2 className="size-3.5 animate-spin" />}
                Enregistrer
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditing(false)}
                disabled={updating}
              >
                Annuler
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <p className="min-w-0 text-[15px] leading-6 font-medium break-words">
                  {domain.fromEmail}
                </p>
                {badge && (
                  <ToneBadge
                    tone={badge.tone}
                    dot
                    pulse={sendingDomainState(domain) === "pending"}
                  >
                    {badge.label}
                  </ToneBadge>
                )}
              </div>
              {subtitle && (
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>
            {canManage && (
              <Button
                variant="outline"
                size="sm"
                onClick={startEdit}
                disabled={Boolean(disabledReason)}
                title={disabledReason || "Modifier l'adresse d'envoi"}
                className="shrink-0"
              >
                Modifier
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** Secondes restantes avant la prochaine vérification permise. */
function useCooldown(until) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (until <= Date.now()) return undefined;
    setNow(Date.now());
    const timer = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= until) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [until]);
  return Math.max(0, Math.ceil((until - now) / 1000));
}

function PendingView({
  domain,
  newbiSenderEmail,
  canManage,
  disabledReason,
  verifying,
  cooldownUntil,
  updating,
  onVerify,
  onUpdate,
  onRemove,
}) {
  const [fullNames, setFullNames] = useState(false);
  const problem = sendingDomainProblem(domain);
  const badge = sendingDomainBadge(domain);
  const reminder = trailingDotReminder(domain.records, domain.dnsProvider);
  const expiry = expiryNotice(domain.expiresAt);
  const seconds = useCooldown(cooldownUntil);
  const host = hostLabel(domain.dnsProvider);

  return (
    <div className="flex flex-col gap-7">
      <AddressCard
        domain={domain}
        subtitle={`En attendant la validation, vos campagnes partent de ${
          newbiSenderEmail || "l'adresse Newbi"
        }.`}
        canManage={canManage}
        disabledReason={disabledReason}
        updating={updating}
        onUpdate={onUpdate}
      />

      {problem && (
        <Notice
          tone={badge?.tone === "danger" ? "danger" : "warning"}
          title={problem.title}
        >
          {problem.text}
        </Notice>
      )}

      <section className="flex flex-col gap-3" aria-labelledby="dns-step-1">
        <div className="flex flex-col gap-1.5">
          <div id="dns-step-1">
            <StepTitle step={1}>
              Ajoutez ces lignes chez <Strong>{host}</Strong>, dans la zone{" "}
              <Strong>{domain.zone}</Strong>
            </StepTitle>
          </div>
          <p className="text-xs leading-5 text-muted-foreground sm:pl-[34px]">
            {domain.dnsProvider
              ? `Connectez-vous à votre compte ${domain.dnsProvider}, ouvrez la zone DNS de ${domain.zone}, puis ajoutez chaque ligne telle quelle.`
              : `Connectez-vous là où vous avez acheté votre domaine (OVH, Hostinger, IONOS…), ouvrez la zone DNS de ${domain.zone}, puis ajoutez chaque ligne telle quelle.`}{" "}
            Elles s&apos;ajoutent aux autres&nbsp;: votre site et votre
            messagerie ne changent pas.
          </p>
        </div>

        <DnsRecords records={domain.records} fullNames={fullNames} />

        <div className="flex flex-col gap-1.5 text-xs leading-5 text-muted-foreground">
          <p>
            {fullNames
              ? "Noms complets affichés, pour les hébergeurs qui les demandent. "
              : `Votre hébergeur demande le nom complet, qui se termine par .${domain.zone}\u00a0? `}
            <button
              type="button"
              className={LINK_CLASS}
              onClick={() => setFullNames((value) => !value)}
            >
              {fullNames
                ? "Revenir aux noms courts"
                : "Afficher les noms complets"}
            </button>
          </p>
          {reminder && (
            <p>
              {reminder.ovh
                ? "Chez OVH, terminez la valeur des lignes MX et CNAME par un point, par exemple\u00a0: "
                : "Lignes MX et CNAME\u00a0: certains hébergeurs, comme OVH, demandent un point à la fin de la valeur, par exemple\u00a0: "}
              <code className="inline-block max-w-full rounded bg-[#f1f1f3] px-1 py-px align-bottom font-mono wrap-anywhere text-foreground dark:bg-white/[0.08]">
                {reminder.example}
              </code>
            </p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="dns-step-2">
        <div className="flex flex-col gap-1.5">
          <div id="dns-step-2">
            <StepTitle step={2}>
              {canManage
                ? "Cliquez sur Vérifier"
                : "Patientez pendant la vérification"}
            </StepTitle>
          </div>
          <p className="text-xs leading-5 text-muted-foreground sm:pl-[34px]">
            La prise en compte prend souvent quelques minutes, parfois
            jusqu&apos;à 48 h. Newbi vérifie aussi de lui-même toutes les 10
            minutes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:pl-[34px]">
          {canManage && (
            <Button
              variant="primary"
              onClick={onVerify}
              disabled={verifying || seconds > 0 || Boolean(disabledReason)}
              title={disabledReason || undefined}
            >
              {verifying ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" aria-hidden />
              )}
              Vérifier
            </Button>
          )}
          <p
            className="text-xs text-muted-foreground tabular-nums"
            aria-live="polite"
          >
            {seconds > 0
              ? `Nouvel essai possible dans ${seconds} s`
              : domain.lastCheckedAt
                ? `Dernière vérification\u00a0: ${formatCheckTime(domain.lastCheckedAt)}`
                : null}
          </p>
        </div>
        {expiry && (
          <p className="text-xs leading-5 text-muted-foreground sm:pl-[34px]">
            {expiry}
          </p>
        )}
      </section>

      {canManage && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EEEFF1] pt-4 dark:border-[#232323]">
          <p className="text-xs leading-5 text-muted-foreground">
            Une erreur dans l&apos;adresse ou le domaine&nbsp;? Retirez-le pour
            recommencer.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={Boolean(disabledReason)}
            className="-mx-2.5 text-red-600 hover:text-red-700 dark:text-red-400"
          >
            Retirer ce domaine
          </Button>
        </div>
      )}
    </div>
  );
}

function VerifiedView({
  domain,
  newbiSenderEmail,
  canManage,
  disabledReason,
  updating,
  onUpdate,
  onRemove,
}) {
  const verifiedOn = formatFullDay(domain.verifiedAt);
  return (
    <div className="flex flex-col gap-6">
      <AddressCard
        domain={domain}
        subtitle={`Vos campagnes partent de cette adresse, avec le nom de votre entreprise.${
          verifiedOn ? ` Domaine validé le ${verifiedOn}.` : ""
        }`}
        canManage={canManage}
        disabledReason={disabledReason}
        updating={updating}
        onUpdate={onUpdate}
      />

      <Notice>
        Gardez les lignes ajoutées chez {hostLabel(domain.dnsProvider)}&nbsp;:
        sans elles, vos campagnes repartiraient de{" "}
        {newbiSenderEmail || "l'adresse Newbi"}.
      </Notice>

      {canManage && (
        <div className="flex flex-col gap-3 rounded-xl border border-[#EEEFF1] p-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#232323]">
          <div className="min-w-0">
            <p className="text-sm font-medium">Déconnecter le domaine</p>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              Vos prochaines campagnes partiront de{" "}
              {newbiSenderEmail || "l'adresse Newbi"}.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={onRemove}
            disabled={Boolean(disabledReason)}
            title={disabledReason || undefined}
            className="shrink-0 self-start text-red-600 sm:self-auto dark:text-red-400"
          >
            Déconnecter
          </Button>
        </div>
      )}
    </div>
  );
}

function SheetSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-3/5" />
      <Skeleton className="mt-2 h-8 w-full rounded-[9px]" />
      <Skeleton className="mt-4 h-36 w-full rounded-xl" />
    </div>
  );
}

/**
 * « Envoyer depuis votre adresse » : connexion du domaine de l'entreprise
 * (lignes DNS à ajouter chez son hébergeur, vérification), adresse d'envoi
 * une fois validé, déconnexion. Tant que le domaine n'est pas validé, les
 * campagnes partent de l'adresse Newbi : rien n'est jamais bloqué.
 */
export function SendingDomainSheet({
  open,
  onOpenChange,
  workspaceId,
  settings,
}) {
  const client = useApolloClient();
  const { organization } = useWorkspace();
  const access = useCampaignAccess();
  const canManage = Boolean(settings?.canManageSendingDomain);
  const disabledReason = access.readOnly ? access.readOnlyReason : null;
  const newbiSenderEmail = settings?.newbiSenderEmail || "";

  const domainQuery = useQuery(GET_EMAIL_SENDING_DOMAIN, {
    variables: { workspaceId },
    skip: !open || !workspaceId,
    fetchPolicy: "cache-and-network",
    context: { skipErrorToast: true },
  });
  const loaded = domainQuery.data !== undefined;
  const domain = loaded
    ? domainQuery.data.emailSendingDomain
    : (settings?.sendingDomain ?? null);
  const state = sendingDomainState(domain);

  // Validation suivie tant que le panneau est ouvert
  const { startPolling, stopPolling } = domainQuery;
  const watching = open && (state === "pending" || state === "failed");
  useEffect(() => {
    if (watching) startPolling(POLL_MS);
    else stopPolling();
    return () => stopPolling();
  }, [watching, startPolling, stopPolling]);

  // Domaine changé panneau ouvert (connecté, validé, autre adresse,
  // retiré) : l'adresse d'envoi des réglages, des brouillons et la
  // vérification avant envoi sont relues
  const signature = domain
    ? `${domain.id}:${domain.status}:${domain.fromEmail}`
    : "none";
  const lastSignature = useRef(null);
  useEffect(() => {
    if (!open) {
      lastSignature.current = null;
      return;
    }
    if (lastSignature.current === null) {
      lastSignature.current = signature;
      return;
    }
    if (lastSignature.current === signature) return;
    lastSignature.current = signature;
    client.refetchQueries({ include: SENDER_QUERIES }).catch(() => {});
  }, [open, signature, client]);

  const setCachedDomain = (next) =>
    client.cache.writeQuery({
      query: GET_EMAIL_SENDING_DOMAIN,
      variables: { workspaceId },
      data: { emailSendingDomain: next },
    });

  const [connectDomain, { loading: connecting }] = useMutation(
    CONNECT_EMAIL_SENDING_DOMAIN,
    { errorPolicy: "none" },
  );
  const [verifyDomain, { loading: verifying }] = useMutation(
    VERIFY_EMAIL_SENDING_DOMAIN,
    { errorPolicy: "none" },
  );
  const [updateSender, { loading: updating }] = useMutation(
    UPDATE_EMAIL_SENDING_DOMAIN_SENDER,
    { errorPolicy: "none" },
  );
  const [disconnectDomain, { loading: disconnecting }] = useMutation(
    DISCONNECT_EMAIL_SENDING_DOMAIN,
    { errorPolicy: "none" },
  );

  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Domaine visé, figé à l'ouverture : la fenêtre garde son texte pendant
  // sa fermeture, une fois le domaine retiré
  const [confirmFor, setConfirmFor] = useState({
    domain: "",
    verified: false,
  });
  const [disconnectError, setDisconnectError] = useState(null);

  // Domaine absent ou déjà connecté côté API : l'état affiché est relu
  const resyncOn = (error, codes) => {
    if (codes.includes(apiErrorCode(error)))
      domainQuery.refetch().catch(() => {});
  };

  /** Rend null si c'est fait, sinon le message à afficher sous le champ. */
  const handleConnect = async (fromEmail) => {
    try {
      const { data } = await connectDomain({
        variables: { workspaceId, fromEmail },
      });
      setCachedDomain(data.connectEmailSendingDomain);
      toast.success("Domaine ajouté", {
        description:
          "Ajoutez maintenant les lignes indiquées chez votre hébergeur.",
      });
      return null;
    } catch (error) {
      resyncOn(error, ["SENDING_DOMAIN_EXISTS"]);
      return sendingDomainErrorMessage(error, "connect");
    }
  };

  const handleVerify = async () => {
    try {
      const { data } = await verifyDomain({ variables: { workspaceId } });
      const next = data.verifyEmailSendingDomain;
      setCooldownUntil(Date.now() + VERIFY_COOLDOWN_MS);
      const nextState = sendingDomainState(next);
      if (nextState === "verified") {
        toast.success("Domaine validé", {
          description: `Vos prochaines campagnes partiront de ${next.fromEmail}.`,
        });
      } else if (nextState === "failed") {
        toast.error(sendingDomainProblem(next)?.title || "Pas encore validé", {
          description: "Le détail est indiqué ligne par ligne.",
        });
      } else {
        toast.info("Pas encore validé", {
          description:
            "Les lignes ne sont pas encore visibles. Cela prend souvent quelques minutes, parfois jusqu'à 48 h.",
        });
      }
    } catch (error) {
      resyncOn(error, ["NOT_FOUND"]);
      toast.error("Vérification impossible", {
        description: sendingDomainErrorMessage(error, "verify"),
      });
    }
  };

  const handleUpdate = async (fromEmail) => {
    try {
      const { data } = await updateSender({
        variables: { workspaceId, fromEmail },
      });
      const next = data.updateEmailSendingDomainSender;
      toast.success("Adresse d'envoi modifiée", {
        description:
          sendingDomainState(next) === "verified"
            ? `Vos prochaines campagnes partiront de ${next.fromEmail}.`
            : "Elle servira dès que votre domaine sera validé.",
      });
      return null;
    } catch (error) {
      resyncOn(error, ["NOT_FOUND"]);
      return sendingDomainErrorMessage(error, "update");
    }
  };

  const verified = state === "verified";
  const openConfirm = () => {
    setDisconnectError(null);
    setConfirmFor({ domain: domain?.domain || "", verified });
    setConfirmOpen(true);
  };

  const handleDisconnect = async () => {
    setDisconnectError(null);
    try {
      await disconnectDomain({ variables: { workspaceId } });
      setConfirmOpen(false);
      setCachedDomain(null);
      toast.success(
        confirmFor.verified ? "Domaine déconnecté" : "Domaine retiré",
        {
          description: confirmFor.verified
            ? `Vos prochaines campagnes partiront de ${newbiSenderEmail || "l'adresse Newbi"}.`
            : "Vous pouvez connecter une autre adresse.",
        },
      );
    } catch (error) {
      resyncOn(error, ["NOT_FOUND"]);
      setDisconnectError(sendingDomainErrorMessage(error, "disconnect"));
    }
  };

  const suggestion = suggestedSenderEmail(
    [
      isExpiredSendingDomain(domain) ? domain.fromEmail : null,
      organization?.companyEmail,
      settings?.defaultReplyTo,
    ],
    { newbiSenderEmail },
  );

  // Rien à montrer tant que ni les réglages ni le domaine ne sont arrivés
  const failedToLoad = !loaded && !settings && Boolean(domainQuery.error);
  const waiting = !loaded && !settings && !failedToLoad;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="flex w-full flex-col gap-0 p-0 focus:outline-none sm:max-w-[760px]"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          event.currentTarget?.focus?.();
        }}
      >
        <SheetHeader className="shrink-0 border-b border-[#EEEFF1] px-5 pt-5 pb-4 dark:border-[#232323]">
          <SheetTitle className="pr-8 text-base font-medium">
            Envoyer depuis votre adresse
          </SheetTitle>
          <SheetDescription className="text-xs leading-5">
            L&apos;adresse qui s&apos;affiche dans la boîte de réception de vos
            contacts.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {failedToLoad ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-muted-foreground">
                {sendingDomainErrorMessage(domainQuery.error, "load")}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => domainQuery.refetch().catch(() => {})}
              >
                Réessayer
              </Button>
            </div>
          ) : waiting ? (
            <SheetSkeleton />
          ) : state === "none" ? (
            <ConnectView
              newbiSenderEmail={newbiSenderEmail}
              expiredDomain={isExpiredSendingDomain(domain) ? domain : null}
              suggestion={suggestion}
              canManage={canManage}
              disabledReason={disabledReason}
              connecting={connecting}
              onConnect={handleConnect}
            />
          ) : verified ? (
            <VerifiedView
              domain={domain}
              newbiSenderEmail={newbiSenderEmail}
              canManage={canManage}
              disabledReason={disabledReason}
              updating={updating}
              onUpdate={handleUpdate}
              onRemove={openConfirm}
            />
          ) : (
            <PendingView
              domain={domain}
              newbiSenderEmail={newbiSenderEmail}
              canManage={canManage}
              disabledReason={disabledReason}
              verifying={verifying}
              cooldownUntil={cooldownUntil}
              updating={updating}
              onVerify={handleVerify}
              onUpdate={handleUpdate}
              onRemove={openConfirm}
            />
          )}
        </div>

        <AlertDialog
          open={confirmOpen}
          onOpenChange={(next) => !disconnecting && setConfirmOpen(next)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmFor.verified ? "Déconnecter" : "Retirer"}{" "}
                {confirmFor.domain}&nbsp;?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmFor.verified
                  ? `Vos prochaines campagnes partiront de ${newbiSenderEmail || "l'adresse Newbi"}. Les campagnes déjà envoyées ne changent pas. Pour reconnecter ce domaine plus tard, il faudra refaire la validation.`
                  : "La validation en cours est abandonnée. Vous pourrez ensuite connecter une autre adresse."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            {disconnectError && (
              <p
                role="alert"
                className="text-sm leading-5 text-red-600 dark:text-red-400"
              >
                {disconnectError}
              </p>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={disconnecting}>
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(event) => {
                  event.preventDefault();
                  handleDisconnect();
                }}
                disabled={disconnecting}
                className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-700"
              >
                {disconnecting && <Loader2 className="size-3.5 animate-spin" />}
                {confirmFor.verified ? "Déconnecter" : "Retirer"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}
