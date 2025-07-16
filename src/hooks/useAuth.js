"use client";

import { useSession } from "@/src/lib/auth-client";
import { useEffect, useState } from "react";

/**
 * Hook personnalisé pour gérer l'authentification de manière plus robuste
 */
export function useAuth() {
  const { data: session, status } = useSession();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    console.log('🔐 useAuth - État:', {
      status,
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      timestamp: new Date().toISOString()
    });

    if (status === "loading") {
      setIsLoading(true);
      return;
    }

    // Vérifier si l'utilisateur est authentifié
    const authenticated = status === "authenticated" && !!session?.user;
    
    setIsAuthenticated(authenticated);
    setUser(session?.user || null);
    setIsLoading(false);

    console.log('✅ useAuth - Résultat:', {
      isAuthenticated: authenticated,
      hasUser: !!session?.user,
      isLoading: false
    });
  }, [session, status]);

  return {
    isAuthenticated,
    isLoading,
    user,
    session,
    status
  };
}
