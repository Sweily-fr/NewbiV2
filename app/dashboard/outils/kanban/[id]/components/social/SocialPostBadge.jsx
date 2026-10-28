"use client";

import { memo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { cn } from "@/src/lib/utils";
import {
  formatParisDateTime,
  getPlatformLabel,
  getPostStatusInfo,
  joinLabels,
  uniquePlatforms,
} from "@/src/utils/social-post-rules";
import { SocialNetworkIconStack } from "./SocialNetworkIcon";
import { useTaskSocialPost } from "./SocialPostsProvider";

const TONE_CLASSES = {
  scheduled:
    "bg-[#5A50FF]/10 text-[#5A50FF] dark:bg-[#5A50FF]/20 dark:text-[#a9a3ff]",
  progress: "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  success:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  warning:
    "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  error: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  muted: "bg-muted text-muted-foreground",
};

const DOT_CLASSES = {
  scheduled: "bg-[#5A50FF]",
  progress: "bg-sky-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
  muted: "bg-muted-foreground/50",
};

/**
 * Statut du post réseaux sociaux d'une carte : logos des réseaux + libellé
 * (« Programmé · 14:30 », « Publié », « Échec »…). Rien si la carte n'a pas
 * de post.
 *
 * variant : "full" (carte du tableau), "compact" (ligne de liste),
 * "icon" (puce du calendrier : logos et pastille de statut seulement).
 * dueDate : échéance de la carte, qui suit la date de publication tant que
 * le post est programmé (glisser-déposer du calendrier compris).
 */
export const SocialPostBadge = memo(function SocialPostBadge({
  taskId,
  dueDate,
  variant = "full",
  className,
}) {
  const post = useTaskSocialPost(taskId);
  if (!post) return null;

  const platforms = uniquePlatforms(
    (post.targets || []).map((t) => t.platform),
  );
  const when =
    post.status === "scheduled" && dueDate ? dueDate : post.scheduledFor;
  const { label, tone } = getPostStatusInfo(post.status, when);
  const networks = joinLabels(platforms.map(getPlatformLabel));
  const tooltip =
    post.status === "scheduled"
      ? `Post ${networks} programmé le ${formatParisDateTime(when)}`
      : `Post ${networks} : ${label.toLowerCase()}`;

  let content;
  if (variant === "icon") {
    content = (
      <span
        className={cn("relative inline-flex flex-shrink-0", className)}
        aria-label={tooltip}
      >
        <SocialNetworkIconStack platforms={platforms} size={12} />
        <span
          className={cn(
            "absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full ring-1 ring-background",
            DOT_CLASSES[tone],
          )}
        />
      </span>
    );
  } else {
    content = (
      <span
        className={cn(
          "inline-flex max-w-full flex-shrink-0 items-center gap-1.5",
          className,
        )}
        aria-label={tooltip}
      >
        <SocialNetworkIconStack
          platforms={platforms}
          size={variant === "compact" ? 13 : 14}
        />
        <span
          className={cn(
            "truncate rounded px-1.5 text-[11px] font-medium leading-[18px]",
            TONE_CLASSES[tone],
          )}
        >
          {label}
        </span>
      </span>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
});
