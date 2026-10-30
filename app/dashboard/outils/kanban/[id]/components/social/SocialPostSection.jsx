"use client";

import { useState } from "react";
import {
  AlertCircle,
  ExternalLink,
  Loader2,
  Music,
  Pencil,
  Play,
  RotateCcw,
  Send,
  XCircle,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
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
import { cn } from "@/src/lib/utils";
import { getApiErrorMessage } from "@/src/hooks/useSocialPublishing";
import {
  SOUND_PLATFORMS,
  formatParisDateTime,
  formatSoundLabel,
  formatVideoDuration,
  getPlatformLabel,
  getPostSound,
  getPostStatusInfo,
  getTargetFormatLabel,
  getTargetStatusInfo,
  isVideoMedia,
} from "@/src/utils/social-post-rules";
import { SocialNetworkIcon } from "./SocialNetworkIcon";
import { useSocialPublishing, useTaskSocialPost } from "./SocialPostsProvider";

const TONE_TEXT = {
  scheduled: "text-[#5A50FF] dark:text-[#a9a3ff]",
  progress: "text-sky-600 dark:text-sky-300",
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  error: "text-red-600 dark:text-red-400",
  muted: "text-muted-foreground",
};

function targetName(target) {
  if (target.username) return `@${target.username.replace(/^@/, "")}`;
  return target.displayName || getPlatformLabel(target.platform);
}

const MAX_THUMBNAILS = 6;

/**
 * Photos ou vidéo du post : vignettes des photos, ou vignette de la vidéo
 * avec une icône de lecture (le lecteur s'ouvre au clic).
 */
function PostMedia({ media }) {
  const [playing, setPlaying] = useState(false);
  const items = (media || []).filter((m) => m?.url || m?.thumbnailUrl);
  if (items.length === 0) return null;

  const video = items.find(isVideoMedia);
  if (video) {
    if (playing && video.url) {
      return (
        <video
          controls
          autoPlay
          playsInline
          poster={video.thumbnailUrl || undefined}
          src={video.url}
          aria-label="Vidéo du post"
          className="max-h-72 w-full rounded-lg bg-black object-contain"
        />
      );
    }
    const duration =
      video.durationMs > 0 ? formatVideoDuration(video.durationMs) : "";
    return (
      <button
        type="button"
        onClick={() => setPlaying(true)}
        disabled={!video.url}
        aria-label="Lire la vidéo du post"
        className="relative block h-24 w-40 cursor-pointer overflow-hidden rounded-lg border bg-black disabled:cursor-default"
      >
        {video.thumbnailUrl && (
          <img
            src={video.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white">
            <Play className="ml-0.5 h-4 w-4 fill-current" />
          </span>
        </span>
        {duration && (
          <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 text-[10px] font-medium leading-4 text-white">
            {duration}
          </span>
        )}
      </button>
    );
  }

  const shown = items.slice(0, MAX_THUMBNAILS);
  const extra = items.length - shown.length;
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((image, index) => (
        <img
          key={image.id || index}
          src={image.url || image.thumbnailUrl}
          alt={`Image ${index + 1} du post`}
          className="h-12 w-12 rounded-md border object-cover"
        />
      ))}
      {extra > 0 && (
        <span className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
          +{extra}
        </span>
      )}
    </div>
  );
}

/**
 * Section « Post réseaux sociaux » de la fenêtre d'une tâche : statut par
 * réseau, lien vers le post publié, erreurs et actions. Rien si la tâche
 * n'a pas de post.
 */
export function SocialPostSection({ taskId, dueDate }) {
  const social = useSocialPublishing();
  const post = useTaskSocialPost(taskId);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [pending, setPending] = useState(null);

  if (!social?.enabled || !post) return null;

  const when =
    post.status === "scheduled" && dueDate ? dueDate : post.scheduledFor;
  const statusInfo = getPostStatusInfo(post.status, when, post.targets);
  // Sons choisis, pour les réseaux visés par le post
  const soundLines = SOUND_PLATFORMS.filter(
    (platform) =>
      getPostSound(post, platform) &&
      (post.targets || []).some((t) => t.platform === platform),
  ).map((platform) => ({
    platform,
    label: formatSoundLabel(getPostSound(post, platform)),
  }));
  const canAct = social.canEdit && !social.isReadOnly;
  const isScheduled = post.status === "scheduled";
  const canRetry = post.status === "failed" || post.status === "partial";

  const run = async (action, fn, successMessage) => {
    setPending(action);
    try {
      await fn();
      toast.success(successMessage);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "L'action n'a pas abouti. Réessayez."),
      );
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Send className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Post réseaux sociaux</span>
          <span
            className={cn("text-xs font-medium", TONE_TEXT[statusInfo.tone])}
          >
            {statusInfo.label}
          </span>
        </div>
        {isScheduled && when && (
          <span className="text-xs text-muted-foreground">
            Publication le {formatParisDateTime(when)} (heure de Paris)
          </span>
        )}
      </div>

      <PostMedia media={post.media} />

      <ul className="space-y-2">
        {(post.targets || []).map((target, index) => {
          const info = getTargetStatusInfo(target.status, target);
          const formatLabel = getTargetFormatLabel(post, target);
          return (
            <li
              key={`${target.accountId || target.platform}-${index}`}
              className="space-y-1"
            >
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <SocialNetworkIcon platform={target.platform} />
                <span className="min-w-0 truncate">{targetName(target)}</span>
                {formatLabel && (
                  <span className="rounded border px-1 text-[11px] leading-4 text-muted-foreground">
                    {formatLabel}
                  </span>
                )}
                <span
                  className={cn("text-xs font-medium", TONE_TEXT[info.tone])}
                >
                  {info.label}
                </span>
                {target.platformPostUrl && (
                  <a
                    href={target.platformPostUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto inline-flex items-center gap-1 text-xs text-[#5A50FF] hover:underline"
                  >
                    Voir le post
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              {target.errorMessage && target.status !== "published" && (
                <p className="flex items-start gap-1.5 pl-6 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="mt-px h-3.5 w-3.5 flex-shrink-0" />
                  <span>{target.errorMessage}</span>
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {soundLines.length > 0 && (
        <div className="space-y-1">
          {soundLines.map(({ platform, label }) => (
            <p
              key={platform}
              className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground"
            >
              <Music className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">
                Son {getPlatformLabel(platform)} :{" "}
                <span className="text-foreground">{label}</span>
              </span>
            </p>
          ))}
        </div>
      )}

      {canAct && (isScheduled || canRetry) && (
        <div className="flex flex-wrap gap-2">
          {isScheduled && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => social.openComposer({ post })}
              disabled={!!pending}
            >
              <Pencil className="h-3.5 w-3.5" />
              Modifier le post
            </Button>
          )}
          {canRetry && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                run(
                  "retry",
                  () => social.mutations.retry(post.id),
                  "Nouvelle tentative de publication lancée",
                )
              }
              disabled={!!pending}
            >
              {pending === "retry" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
              Réessayer
            </Button>
          )}
          {isScheduled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmCancel(true)}
              disabled={!!pending}
              className="text-red-600 hover:text-red-700 dark:text-red-400"
            >
              {pending === "cancel" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              Annuler la publication
            </Button>
          )}
        </div>
      )}

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler la publication ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le post ne sera pas publié. La carte reste sur le tableau, vous
              pourrez la supprimer si vous le souhaitez.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Garder le post
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer bg-red-500 text-white hover:bg-red-600"
              onClick={() =>
                run(
                  "cancel",
                  () => social.mutations.cancel(post.id),
                  "Publication annulée",
                )
              }
            >
              Annuler la publication
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
