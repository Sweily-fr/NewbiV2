import { useState, useEffect } from 'react';
import { useSession } from '@/src/lib/auth-client';

/**
 * Hook d'authentification utilisant les Bearer tokens de Better Auth
 * Résout le problème des domaines croisés en production
 */
export const useBetterAuthJWT = () => {
  const { data: session, isPending } = useSession();
  const [bearerToken, setBearerToken] = useState(null);
  const [isLoadingToken, setIsLoadingToken] = useState(false);

  console.log('🔍 [useBetterAuthJWT] Hook appelé, session:', session?.user?.email || 'non connecté');

  useEffect(() => {
    const initializeToken = () => {
      // Récupérer le Bearer token depuis localStorage
      const storedToken = localStorage.getItem('bearer_token');
      console.log('🔍 [useBetterAuthJWT] Bearer token localStorage:', storedToken ? 'présent' : 'absent');
      
      if (storedToken) {
        setBearerToken(storedToken);
        console.log('✅ [useBetterAuthJWT] Bearer token récupéré depuis localStorage');
        return;
      }
    };

    if (!isPending && session?.user) {
      initializeToken();
    }
  }, [session, isPending]);

  useEffect(() => {
    // Nettoyer le token si l'utilisateur n'est plus connecté
    if (!session?.user && bearerToken) {
      setBearerToken(null);
      localStorage.removeItem('bearer_token');
    }
  }, [session, bearerToken]);

  useEffect(() => {
    const getTokenFromHeader = async () => {
      if (!session?.user || bearerToken) return;
      
      console.log('🔍 [useBetterAuthJWT] Tentative récupération Bearer token via header');
      setIsLoadingToken(true);
      
      try {
        const { getSession } = await import("@/src/lib/auth-client");
        
        await getSession({
          fetchOptions: {
            onSuccess: (ctx) => {
              const token = ctx.response.headers.get("set-auth-token");
              console.log('🔍 [useBetterAuthJWT] Header set-auth-token:', token ? 'présent' : 'absent');
              
              if (token) {
                console.log('✅ [useBetterAuthJWT] Bearer token récupéré depuis header set-auth-token');
                setBearerToken(token);
                localStorage.setItem('bearer_token', token);
              }
            },
            onError: (ctx) => {
              console.error('❌ [useBetterAuthJWT] Erreur getSession:', ctx.error);
            }
          }
        });
      } catch (error) {
        console.error('❌ [useBetterAuthJWT] Erreur récupération Bearer token:', error);
      } finally {
        setIsLoadingToken(false);
      }
    };

    if (session?.user && !bearerToken && !isLoadingToken) {
      getTokenFromHeader();
    }
  }, [session, bearerToken, isLoadingToken]);

  const refreshToken = async () => {
    console.log('🔄 [useBetterAuthJWT] Rafraîchissement Bearer token demandé');
    setBearerToken(null);
    localStorage.removeItem('bearer_token');
    
    if (session?.user) {
      setIsLoadingToken(true);
      try {
        const { getSession } = await import("@/src/lib/auth-client");
        
        await getSession({
          fetchOptions: {
            onSuccess: (ctx) => {
              const token = ctx.response.headers.get("set-auth-token");
              if (token) {
                console.log('✅ [useBetterAuthJWT] Bearer token rafraîchi avec succès');
                setBearerToken(token);
                localStorage.setItem('bearer_token', token);
              }
            }
          }
        });
      } catch (error) {
        console.error('❌ [useBetterAuthJWT] Erreur rafraîchissement Bearer token:', error);
      } finally {
        setIsLoadingToken(false);
      }
    }
  };

  /**
   * Effectue une requête authentifiée vers l'API avec Bearer token
   */
  const apiRequest = async (url, options = {}) => {
    if (!bearerToken) {
      throw new Error('Bearer token non disponible');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bearerToken}`,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Si le token est expiré, nettoyer et essayer de récupérer un nouveau
    if (response.status === 401) {
      setBearerToken(null);
      localStorage.removeItem('bearer_token');
      // Le useEffect se chargera de récupérer un nouveau token
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
      setBearerToken(null);
      localStorage.removeItem('bearer_token');
      
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
    isLoading: isPending || isLoadingToken,
    
    // Bearer token (avec alias JWT pour compatibilité)
    bearerToken,
    jwtToken: bearerToken,
    hasJWT: !!bearerToken,
    
    // Méthodes
    refreshToken,
    refreshJWT: refreshToken,
    apiRequest,
    graphqlRequest,
    logout,
    
    // État
    isAuthenticated: !!session?.user,
    isReady: !!session?.user && !!bearerToken,
  };
};
