import { memo } from "react";
import { AvatarGroup } from "@/src/components/ui/user-avatar";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/src/components/ui/tooltip";
import { cn } from "@/src/lib/utils";
import { useTaskViewers } from "../hooks/useTaskPresence";

// Couleur commune à tous les marqueurs de présence (bordure, halo)
export const PRESENCE_RING_CLASS = "border-[#5b50ff] ring-2 ring-[#5b50ff]/25";

// Libellé « Alice consulte cette tâche » / « Alice et Bob consultent… »
export function viewersLabel(viewers, { also = false } = {}) {
  const names = viewers.map((v) => v.name || "Un membre");
  const verb = names.length > 1 ? "consultent" : "consulte";
  const suffix = `${verb}${also ? " aussi" : ""} cette tâche`;
  if (names.length === 1) return `${names[0]} ${suffix}`;
  if (names.length === 2) return `${names[0]} et ${names[1]} ${suffix}`;
  return `${names.slice(0, -1).join(", ")} et ${names[names.length - 1]} ${suffix}`;
}

const toUsers = (viewers) =>
  viewers.map((v) => ({ userId: v.userId, name: v.name, image: v.image }));

/**
 * Avatars des autres membres qui ont la tâche ouverte, avec infobulle.
 * Rien n'est rendu quand personne n'est dessus.
 */
export const TaskViewersAvatars = memo(function TaskViewersAvatars({
  viewers,
  size = "xs",
  max = 3,
  className,
}) {
  if (!viewers || viewers.length === 0) return null;
  const label = viewersLabel(viewers);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn("inline-flex", className)}
          onClick={(e) => e.stopPropagation()}
          aria-label={label}
        >
          <AvatarGroup users={toUsers(viewers)} max={max} size={size} />
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
});

/**
 * Avatars + libellé en clair (« Camille consulte aussi cette tâche »),
 * pour la modale où il y a la place d'être explicite.
 */
export const TaskViewersBanner = memo(function TaskViewersBanner({
  viewers,
  className,
}) {
  if (!viewers || viewers.length === 0) return null;
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border border-[#5b50ff]/30 bg-[#5b50ff]/10 pl-1 pr-3 py-0.5 text-xs font-medium text-[#5b50ff]",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <AvatarGroup users={toUsers(viewers)} max={3} size="xs" />
      <span className="truncate">{viewersLabel(viewers, { also: true })}</span>
    </div>
  );
});

/**
 * Variantes autonomes (lisent elles-mêmes la présence de la tâche) pour les
 * vues qui rendent leurs lignes en boucle sans composant dédié (liste, Gantt).
 */
export function TaskPresenceAvatars({ taskId, ...props }) {
  const viewers = useTaskViewers(taskId);
  return <TaskViewersAvatars viewers={viewers} {...props} />;
}

/**
 * Liseré en surimpression sur une ligne ou une barre (le parent doit être
 * `relative`). Ne capte aucun événement.
 */
export function TaskPresenceOverlay({ taskId, className }) {
  const viewers = useTaskViewers(taskId);
  if (viewers.length === 0) return null;
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-[1] rounded-md ring-2 ring-inset ring-[#5b50ff]/60 bg-[#5b50ff]/5",
        className,
      )}
    />
  );
}
