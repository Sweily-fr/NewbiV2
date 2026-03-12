"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useSession } from "@/src/lib/auth-client";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { Loader2 } from "lucide-react";

const SessionGateContext = createContext({ isReady: false });

/**
 * SessionGate bloque le rendu des enfants (et donc leurs queries GraphQL)
 * tant que le triptyque n'est pas pret :
 * 1. Session Better Auth chargee (useSession → session.user)
 * 2. Workspace synchronise (useWorkspace → workspaceId + setOrganizationIdForApollo)
 *
 * Cela evite les queries qui partent sans JWT/orgId et declenchent
 * des erreurs UNAUTHENTICATED + toasts "erreur inattendue".
 */
export function SessionGateProvider({ children }) {
  const { data: session, isPending: sessionPending } = useSession();
  const { workspaceId, loading: workspaceLoading } = useWorkspace();
  const [isReady, setIsReady] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Conditions de pret : session chargee + workspace synchronise
    const sessionReady = !sessionPending && !!session?.user;
    const workspaceReady = !workspaceLoading && !!workspaceId;

    if (sessionReady && workspaceReady) {
      setIsReady(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Safety timeout : si apres 8s on a la session mais pas le workspace,
    // on laisse passer quand meme (utilisateur sans organisation possible)
    if (sessionReady && !workspaceReady && !timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        setIsReady(true);
      }, 8000);
    }

    // Si pas de session apres le chargement, on laisse passer
    // (le server component a deja verifie l'auth, donc ca ne devrait pas arriver)
    if (!sessionPending && !session?.user) {
      setIsReady(true);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [sessionPending, session?.user, workspaceLoading, workspaceId]);

  if (!isReady) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <SessionGateContext.Provider value={{ isReady }}>
      {children}
    </SessionGateContext.Provider>
  );
}

export function useSessionGate() {
  return useContext(SessionGateContext);
}
