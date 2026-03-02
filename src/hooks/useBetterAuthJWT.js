import { useSession } from "@/src/lib/auth-client";

/**
 * Hook d'authentification simplifié — cookie-only
 *
 * L'authentification repose entièrement sur le cookie httpOnly
 * better-auth.session_token, envoyé automatiquement via credentials: "include".
 * Plus besoin de stocker de JWT dans localStorage (risque XSS éliminé).
 */
export const useBetterAuthJWT = () => {
  const { data: session, isPending } = useSession();

  /**
   * Effectue une requête authentifiée vers l'API avec cookies
   */
  const apiRequest = async (url, options = {}) => {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    return response;
  };

  /**
   * Effectue une requête GraphQL authentifiée
   */
  const graphqlRequest = async (query, variables = {}) => {
    const response = await apiRequest(
      `${process.env.NEXT_PUBLIC_API_URL}/graphql`,
      {
        method: "POST",
        body: JSON.stringify({ query, variables }),
      }
    );

    const data = await response.json();

    if (data.errors) {
      throw new Error(data.errors[0]?.message || "Erreur GraphQL");
    }

    return data.data;
  };

  /**
   * Déconnexion complète
   */
  const logout = async () => {
    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "include",
      });
      window.location.href = "/auth/signin";
    } catch (error) {
      console.error("Erreur déconnexion:", error);
    }
  };

  return {
    session,
    user: session?.user,
    isLoading: isPending,
    bearerToken: null,
    jwtToken: null,
    hasJWT: false,
    refreshToken: () => Promise.resolve(),
    refreshJWT: () => Promise.resolve(),
    apiRequest,
    graphqlRequest,
    logout,
    isAuthenticated: !!session?.user,
    isReady: !!session?.user,
  };
};
