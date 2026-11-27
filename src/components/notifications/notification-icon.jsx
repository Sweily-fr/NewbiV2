"use client";

import { useState } from "react";
import {
  AlertTriangle,
  AtSign,
  CalendarClock,
  CreditCard,
  FileText,
  HardDrive,
  KeyRound,
  Landmark,
  SquareKanban,
  UserPlus,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { getExternalSource } from "@/src/components/document-source-badge";
import { SocialNetworkIcon } from "@/app/dashboard/outils/kanban/[id]/components/social/SocialNetworkIcon";

// Réseaux reconnus dans le message d'une notification de post (« publié sur
// TikTok et Instagram »). Le message est la seule trace du réseau : la
// notification ne stocke pas la plateforme.
const SOCIAL_PLATFORMS = [
  { platform: "tiktok", pattern: /\bTikTok\b/ },
  { platform: "instagram", pattern: /\bInstagram\b/ },
  { platform: "facebook", pattern: /\bFacebook\b/ },
  { platform: "linkedin", pattern: /\bLinkedIn\b/ },
  { platform: "twitter", pattern: /(^|[\s,(])X(?=$|[\s.,:)])/ },
];

/** Réseaux cités dans le titre ou le message d'une notification de post. */
export function getNotificationPlatforms(notification) {
  const text = `${notification?.title || ""} ${notification?.message || ""}`;
  return SOCIAL_PLATFORMS.filter(({ pattern }) => pattern.test(text)).map(
    ({ platform }) => platform,
  );
}

// Pictogramme par type de notification (outil concerné), quand il n'y a ni
// logo de marque ni photo de l'auteur.
const TYPE_ICONS = {
  TASK_ASSIGNED: { icon: SquareKanban, tone: "brand" },
  TASK_UNASSIGNED: { icon: SquareKanban, tone: "brand" },
  TASK_COMMENT: { icon: SquareKanban, tone: "brand" },
  TASK_DUE_SOON: { icon: SquareKanban, tone: "brand" },
  TASK_OVERDUE: { icon: SquareKanban, tone: "danger" },
  MENTION: { icon: AtSign, tone: "brand" },
  DOCUMENT_SHARED: { icon: FileText, tone: "brand" },
  MEMBER_JOINED: { icon: UserPlus, tone: "brand" },
  ACCESS_REQUESTED: { icon: KeyRound, tone: "brand" },
  STORAGE_ALMOST_FULL: { icon: HardDrive, tone: "warning" },
  STORAGE_FULL: { icon: HardDrive, tone: "danger" },
  FISCAL_DEADLINE: { icon: Landmark, tone: "brand" },
  TRANSFER_PAID: { icon: CreditCard, tone: "success" },
  TRANSFER_BANK_DECLARED: { icon: Landmark, tone: "brand" },
  APPOINTMENT_BANK_DECLARED: { icon: CalendarClock, tone: "brand" },
  APPOINTMENT_REFUND_NEEDED: { icon: CalendarClock, tone: "danger" },
  PURCHASE_INVOICE_RECEIVED: { icon: FileText, tone: "brand" },
  DOCUMENT_IMPORTED: { icon: FileText, tone: "brand" },
  SOCIAL_POST_PUBLISHED: { icon: SquareKanban, tone: "brand" },
  SOCIAL_POST_FAILED: { icon: SquareKanban, tone: "danger" },
};

const TONES = {
  brand: "bg-[#5b4fff]/10 text-[#5b4fff]",
  success:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
  warning:
    "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
  danger: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
};

// Types où une personne est à l'origine de la notification : sa photo
// passe avant le pictogramme de l'outil.
const ACTOR_TYPES = new Set([
  "TASK_ASSIGNED",
  "TASK_UNASSIGNED",
  "TASK_COMMENT",
  "MENTION",
  "DOCUMENT_SHARED",
  "MEMBER_JOINED",
  "ACCESS_REQUESTED",
]);

function ErrorBadge() {
  return (
    <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-white dark:ring-[#141414]">
      <AlertTriangle className="h-2 w-2 text-white" aria-hidden="true" />
    </span>
  );
}

function TypeTile({ type }) {
  const { icon: Icon, tone } = TYPE_ICONS[type] || {
    icon: SquareKanban,
    tone: "brand",
  };
  return (
    <div
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg",
        TONES[tone],
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </div>
  );
}

function SocialTile({ platforms }) {
  if (platforms.length === 1) {
    return <SocialNetworkIcon platform={platforms[0]} size={32} />;
  }
  // Plusieurs réseaux : deux logos qui se chevauchent dans la tuile
  const [first, second] = platforms;
  return (
    <div className="relative h-8 w-8">
      <SocialNetworkIcon
        platform={first}
        size={22}
        className="absolute left-0 top-0"
      />
      <span
        className="absolute bottom-0 right-0 rounded-[5px] ring-2 ring-white dark:ring-[#141414]"
        style={{ lineHeight: 0 }}
      >
        <SocialNetworkIcon platform={second} size={20} />
      </span>
    </div>
  );
}

function SourceTile({ source, type }) {
  const [failed, setFailed] = useState(false);
  if (source.logo && !failed) {
    return (
      <div
        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg ring-1 ring-black/5 dark:ring-white/10"
        style={{ backgroundColor: source.bg }}
      >
        <img
          src={source.logo}
          alt={source.name}
          className="h-8 w-8 object-cover"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }
  if (source.icon) {
    const Icon = source.icon;
    return (
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg",
          source.className,
        )}
        title={source.name}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
    );
  }
  return <TypeTile type={type} />;
}

function ActorTile({ notification }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <TypeTile type={notification.type} />;
  return (
    <img
      src={notification.data.actorImage}
      alt={notification.data.actorName || ""}
      className="h-8 w-8 rounded-lg object-cover"
      onError={() => setFailed(true)}
    />
  );
}

/**
 * Logo d'une notification d'activité (32 px) : logo du réseau social pour
 * un post, de la plateforme d'origine pour un document importé, photo de
 * l'auteur pour une action d'un membre, sinon pictogramme de l'outil.
 */
export function NotificationIcon({ notification }) {
  const { type, data } = notification;

  if (type === "SOCIAL_POST_PUBLISHED" || type === "SOCIAL_POST_FAILED") {
    const platforms = getNotificationPlatforms(notification);
    if (platforms.length > 0) {
      return (
        <div className="relative">
          <SocialTile platforms={platforms} />
          {type === "SOCIAL_POST_FAILED" && <ErrorBadge />}
        </div>
      );
    }
    return <TypeTile type={type} />;
  }

  if (type === "DOCUMENT_IMPORTED" || type === "PURCHASE_INVOICE_RECEIVED") {
    // Une facture d'achat reçue arrive toujours par facturation électronique
    const source = getExternalSource(
      data?.source ||
        (type === "PURCHASE_INVOICE_RECEIVED" ? "SUPERPDP" : null),
    );
    if (source) return <SourceTile source={source} type={type} />;
    return <TypeTile type={type} />;
  }

  if (ACTOR_TYPES.has(type) && data?.actorImage) {
    return <ActorTile notification={notification} />;
  }

  return <TypeTile type={type} />;
}
