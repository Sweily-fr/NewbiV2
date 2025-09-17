import { useSession } from "@/src/lib/auth-client";
import { useState, useEffect } from "react";

/**
 * Hook d'authentification utilisant les JWT natifs de Better Auth
 * Résout le problème des domaines croisés en production
 */
export const useBetterAuthJWT = () => {
  const { data: session, isPending } = useSession();
  const [jwtToken, setJwtToken] = useState(null);
  const [isLoadingJWT, setIsLoadingJWT] = useState(false);

  // Récupérer le JWT quand la session Better Auth est disponible
  useEffect(() => {
    const fetchJWT = async () => {
      if (!session?.user || jwtToken || isLoadingJWT) return;

      setIsLoadingJWT(true);
      try {
        // Méthode 1: Via l'endpoint /api/auth/token
        const response = await fetch('/api/auth/token', {
          method: 'GET',
          credentials: 'include', // Inclure les cookies de session
        });

        if (response.ok) {
          const data = await response.json();
          setJwtToken(data.token);
          
          // Stocker le JWT dans localStorage pour persistance
          localStorage.setItem('better_auth_jwt', data.token);
        }
      } catch (error) {
        console.error('Erreur récupération JWT:', error);
      } finally {
        setIsLoadingJWT(false);
      }
    };

    // Récupérer le JWT depuis localStorage au démarrage
    console.log('🔍 [useBetterAuthJWT] Vérification token localStorage');
    const storedToken = localStorage.getItem('better_auth_jwt');
    console.log('🔍 [useBetterAuthJWT] Token stocké:', storedToken ? 'présent' : 'absent');
    
    if (storedToken) {
      try {
        const decoded = jwt.decode(storedToken);
        console.log(' [useBetterAuthJWT] Token décodé:', decoded);
        
        if (decoded && decoded.exp * 1000 > Date.now()) {
          console.log(' [useBetterAuthJWT] Token valide, utilisation');
          setJwtToken(storedToken);
        } else {
          console.log(' [useBetterAuthJWT] Token expiré, suppression');
          localStorage.removeItem('better_auth_jwt');
        }
      } catch (error) {
        console.error(' [useBetterAuthJWT] Token JWT invalide dans localStorage:', error);
        localStorage.removeItem('better_auth_jwt');
      }
    } else if (session?.user && !storedToken) {
      fetchJWT();
    }
  }, [session, jwtToken, isLoadingJWT]);

  // Alternative: Récupérer JWT via header set-auth-jwt lors de getSession
  useEffect(() => {
    const getJWTFromHeader = async () => {
      if (!session?.user || jwtToken) return;

      try {
        // Utiliser getSession avec fetchOptions pour récupérer le header
        const { getSession } = await import("@/src/lib/auth-client");
        
        await getSession({
          fetchOptions: {
            onSuccess: (ctx) => {
              const jwt = ctx.response.headers.get("set-auth-jwt");
              if (jwt) {
                setJwtToken(jwt);
                localStorage.setItem('better_auth_jwt', jwt);
              }
            }
          }
        });
      } catch (error) {
        console.error('Erreur récupération JWT via header:', error);
      }
    };

    // Utiliser cette méthode si la première échoue
    if (session?.user && !jwtToken && !isLoadingJWT) {
      getJWTFromHeader();
    }
  }, [session, jwtToken, isLoadingJWT]);

  // Nettoyer le JWT quand la session se termine
  useEffect(() => {
    if (!session?.user && jwtToken) {
      setJwtToken(null);
      localStorage.removeItem('better_auth_jwt');
    }
  }, [session, jwtToken]);

  /**
   * Effectue une requête authentifiée vers l'API avec JWT
   */
  const apiRequest = async (url, options = {}) => {
    if (!jwtToken) {
      throw new Error('JWT non disponible');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Si le JWT est expiré, nettoyer et essayer de récupérer un nouveau
    if (response.status === 401) {
      setJwtToken(null);
      localStorage.removeItem('better_auth_jwt');
      // Le useEffect se chargera de récupérer un nouveau JWT
    }

    return response;
  };

  /**
   * Effectue une requête GraphQL authentifiée
   */
  const graphqlRequest = async (query, variables = {}) => {
    const response = await apiRequest(`${process.env.NEXT_PUBLIC_API_URL}/graphql`, {
      method: 'POST',
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(data.errors[0]?.message || 'Erreur GraphQL');
    }

    return data.data;
  };

  /**
   * Déconnexion complète
   */
  const logout = async () => {
    try {
      // Déconnecter Better Auth
      await fetch('/api/auth/sign-out', {
        method: 'POST',
        credentials: 'include',
      });

      // Nettoyer l'état local
      setJwtToken(null);
      localStorage.removeItem('better_auth_jwt');
      
      // Rediriger vers la page de connexion
      window.location.href = '/auth/signin';
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  return {
    // Session Better Auth
    session,
    user: session?.user,
    isLoading: isPending || isLoadingJWT,
    
    // JWT
    jwtToken,
    hasJWT: !!jwtToken,
    
    // Méthodes
    apiRequest,
    graphqlRequest,
    logout,
    
    // État
    isAuthenticated: !!session?.user,
    isReady: !!session?.user && !!jwtToken,
  };
};
