"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Users } from "lucide-react";
import { UserAvatar } from "@/src/components/ui/user-avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { GET_ORGANIZATION_MEMBERS_PRESENCE } from "@/src/graphql/kanbanQueries";

const MAX_VISIBLE = 4;
const POLL_INTERVAL_MS = 60 * 1000;

function memberKey(member) {
  return String(member.userId || member.id);
}

/**
 * Libellé de dernière activité : "En ligne", "Vu il y a 3 heures", ou
 * "Jamais connecté".
 */
export function presenceLabel(presence) {
  if (!presence) return "Dernière connexion inconnue";
  if (presence.isOnline) return "En ligne";
  if (!presence.lastSeenAt) return "Jamais connecté";
  const date = new Date(presence.lastSeenAt);
  if (Number.isNaN(date.getTime())) return "Dernière connexion inconnue";
  return `Dernière connexion ${formatDistanceToNow(date, {
    addSuffix: true,
    locale: fr,
  })}`;
}

/**
 * Trie les membres du plus récemment actif au moins récent. Les membres en
 * ligne passent devant, ceux sans information ferment la liste.
 */
export function sortMembersByPresence(members, presenceByUserId) {
  return [...members].sort((a, b) => {
    const pa = presenceByUserId.get(memberKey(a));
    const pb = presenceByUserId.get(memberKey(b));
    if (!!pa?.isOnline !== !!pb?.isOnline) return pa?.isOnline ? -1 : 1;
    const ta = pa?.lastSeenAt ? new Date(pa.lastSeenAt).getTime() : 0;
    const tb = pb?.lastSeenAt ? new Date(pb.lastSeenAt).getTime() : 0;
    return tb - ta;
  });
}

function OnlineDot({ className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute rounded-full bg-emerald-500 ring-2 ring-background ${className}`}
    />
  );
}

/**
 * Pile d'avatars des membres du tableau (en-tête kanban).
 *
 * - Ordre : plus l'utilisateur est à gauche, plus il a été actif récemment.
 * - Point vert : session active (activité dans les 5 dernières minutes).
 * - Survol : nom + dernière connexion.
 * - Clic : popover listant tous les membres avec leur statut.
 */
export function BoardMembersPresence({ members = [], workspaceId }) {
  const [open, setOpen] = useState(false);

  const { data } = useQuery(GET_ORGANIZATION_MEMBERS_PRESENCE, {
    variables: { workspaceId },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    pollInterval: POLL_INTERVAL_MS,
  });

  const presenceByUserId = useMemo(() => {
    const map = new Map();
    (data?.organizationMembersPresence || []).forEach((p) => {
      map.set(String(p.userId), p);
    });
    return map;
  }, [data]);

  const sortedMembers = useMemo(
    () => sortMembersByPresence(members, presenceByUserId),
    [members, presenceByUserId],
  );

  if (sortedMembers.length === 0) return null;

  const visible = sortedMembers.slice(0, MAX_VISIBLE);
  const hiddenCount = sortedMembers.length - visible.length;
  const onlineCount = sortedMembers.filter(
    (m) => presenceByUserId.get(memberKey(m))?.isOnline,
  ).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center shrink-0 rounded-md px-1 py-0.5 hover:bg-muted/50 transition-colors cursor-pointer"
          aria-label={`Membres du tableau (${onlineCount} en ligne)`}
        >
          <div className="flex -space-x-1.5">
            {visible.map((member) => {
              const presence = presenceByUserId.get(memberKey(member));
              return (
                <Tooltip key={memberKey(member)}>
                  <TooltipTrigger asChild>
                    <span className="relative inline-flex">
                      <UserAvatar
                        src={member.image}
                        name={member.name || member.email}
                        size="xs"
                        className="h-5 w-5 ring-1 ring-background"
                      />
                      {presence?.isOnline && (
                        <OnlineDot className="-bottom-px -right-px h-2 w-2 ring-1" />
                      )}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    <div className="font-medium">
                      {member.name || member.email}
                    </div>
                    <div className="opacity-80">{presenceLabel(presence)}</div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
            {hiddenCount > 0 && (
              <div className="h-5 w-5 rounded-full bg-muted border border-background flex items-center justify-center text-[8px] font-medium text-muted-foreground">
                +{hiddenCount}
              </div>
            )}
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="px-3 pt-3 pb-2 border-b border-border/50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Membres du tableau</span>
          </div>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {onlineCount} en ligne
          </span>
        </div>
        <div className="max-h-[280px] overflow-y-auto p-1">
          {sortedMembers.map((member) => {
            const presence = presenceByUserId.get(memberKey(member));
            const isOnline = !!presence?.isOnline;
            return (
              <div
                key={memberKey(member)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md"
              >
                <span className="relative inline-flex flex-shrink-0">
                  <UserAvatar
                    src={member.image}
                    name={member.name || member.email}
                    size="xs"
                    className="h-6 w-6"
                  />
                  {isOnline && (
                    <OnlineDot className="-bottom-px -right-px h-2.5 w-2.5" />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">
                    {member.name || member.email}
                  </div>
                  <div
                    className={`text-[10px] truncate ${
                      isOnline ? "text-emerald-600" : "text-muted-foreground"
                    }`}
                  >
                    {presenceLabel(presence)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
