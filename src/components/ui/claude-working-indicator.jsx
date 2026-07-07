"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/src/lib/utils";

// Au-delà de ce délai sans réponse 🤖 (claudeWorkingSince jamais remis à null,
// ex. run de la routine échoué), le marqueur est considéré périmé et le loader
// masqué. Un ticket complet peut prendre longtemps, d'où une fenêtre large.
const CLAUDE_WORKING_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2h

export function isClaudeWorking(claudeWorkingSince) {
  if (!claudeWorkingSince) return false;
  const since = new Date(claudeWorkingSince).getTime();
  if (Number.isNaN(since)) return false;
  return Date.now() - since < CLAUDE_WORKING_EXPIRY_MS;
}

// Ré-évalue périodiquement l'expiration pour que le loader disparaisse de
// lui-même si le bot ne répond jamais (aucun événement serveur dans ce cas).
export function useClaudeWorking(claudeWorkingSince) {
  const [working, setWorking] = useState(() =>
    isClaudeWorking(claudeWorkingSince),
  );

  useEffect(() => {
    setWorking(isClaudeWorking(claudeWorkingSince));
    if (!claudeWorkingSince) return undefined;
    const interval = setInterval(
      () => setWorking(isClaudeWorking(claudeWorkingSince)),
      60 * 1000,
    );
    return () => clearInterval(interval);
  }, [claudeWorkingSince]);

  return working;
}

function TypingDots() {
  return (
    <span className="flex items-center gap-0.5" aria-hidden="true">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-1 w-1 rounded-full bg-[#D97757] animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}

/**
 * Bulle « Claude est en train de répondre… » à afficher dans le fil de
 * commentaires d'une tâche kanban tant que claudeWorkingSince est actif.
 */
export function ClaudeWorkingIndicator({ claudeWorkingSince, className }) {
  const working = useClaudeWorking(claudeWorkingSince);
  if (!working) return null;

  return (
    <div
      className={cn("flex items-center gap-2", className)}
      role="status"
      aria-live="polite"
    >
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D97757]">
        <Sparkles className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5">
        <span className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Claude</span> est en
          train de répondre
        </span>
        <TypingDots />
      </div>
    </div>
  );
}

/**
 * Petit badge animé pour la carte kanban sur le board.
 */
export function ClaudeWorkingBadge({ claudeWorkingSince, className }) {
  const working = useClaudeWorking(claudeWorkingSince);
  if (!working) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-[#D97757]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#D97757]",
        className,
      )}
      title="Claude est en train de répondre"
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D97757] opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#D97757]" />
      </span>
      Claude répond…
    </span>
  );
}
