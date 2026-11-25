"use client";

import { cn } from "@/src/lib/utils";
import {
  mailboxStatusMeta,
  recipientStatusMeta,
  sequenceStatusMeta,
} from "@/src/utils/prospecting";
import {
  ToneBadge,
  useCampaignAccess,
} from "@/app/dashboard/outils/campagnes-email/components/shared";

// Même charte que les campagnes e-mail (pastilles, cartes, focus, erreurs)
export {
  CARD_CLASS,
  FOCUS_RING,
  ToneBadge,
  errorMessage,
  openSettings,
} from "@/app/dashboard/outils/campagnes-email/components/shared";

/**
 * Droits du rôle sur la prospection (module « prospecting », actions view,
 * create, edit, delete, send) et abonnement en lecture seule.
 */
export const useProspectingAccess = () => useCampaignAccess("prospecting");

export function SequenceStatusBadge({ status, className }) {
  const meta = sequenceStatusMeta(status);
  return (
    <ToneBadge
      tone={meta.tone}
      dot
      pulse={status === "ACTIVE"}
      className={className}
    >
      {meta.label}
    </ToneBadge>
  );
}

export function MailboxStatusBadge({ status, className }) {
  const meta = mailboxStatusMeta(status);
  return (
    <ToneBadge tone={meta.tone} dot className={className}>
      {meta.label}
    </ToneBadge>
  );
}

export function RecipientStatusBadge({ status, className }) {
  const meta = recipientStatusMeta(status);
  return (
    <ToneBadge tone={meta.tone} className={className}>
      {meta.label}
    </ToneBadge>
  );
}

export function GoogleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function MicrosoftIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
      <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}

/** Logo du fournisseur de la boîte dans une pastille ronde. */
export function ProviderBadge({ provider, className }) {
  const Icon = provider === "MICROSOFT" ? MicrosoftIcon : GoogleIcon;
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-[#e6e7ea] dark:bg-white/[0.06] dark:ring-white/10",
        className,
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}

/** Bandeau d'information (ton : info, warning, danger). */
const NOTICE_TONES = {
  info: "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-100",
  warning:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100",
  danger:
    "border-red-200 bg-red-50 text-red-950 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-100",
};
const NOTICE_ICONS = {
  info: "text-sky-600 dark:text-sky-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-red-600 dark:text-red-400",
};

export function Notice({
  tone = "info",
  icon: Icon,
  title,
  action,
  className,
  children,
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col gap-3 rounded-xl border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between",
        NOTICE_TONES[tone] || NOTICE_TONES.info,
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        {Icon && (
          <Icon
            className={cn("mt-0.5 size-4 shrink-0", NOTICE_ICONS[tone])}
            aria-hidden
          />
        )}
        <div className="min-w-0">
          {title && <p className="font-medium">{title}</p>}
          {children && (
            <div className={cn("leading-5", title && "mt-0.5 opacity-85")}>
              {children}
            </div>
          )}
        </div>
      </div>
      {action && <div className="flex shrink-0 gap-2">{action}</div>}
    </div>
  );
}
