"use client";

import { ApolloProvider } from "@apollo/client";
import { apolloClient, getApolloClient } from "@/src/lib/apolloClient";
import { useEffect, useState } from "react";

export function ApolloWrapper({ children }) {
  const [client, setClient] = useState(apolloClient);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialiser le client avec cache persistant côté client uniquement
    const initializeClient = async () => {
      try {
        const persistentClient = await getApolloClient();
        setClient(persistentClient);
        setIsInitialized(true);
      } catch (error) {
        console.warn('⚠️ Fallback vers client Apollo sans persistance:', error);
        setClient(apolloClient);
        setIsInitialized(true);
      }
    };

    initializeClient();
  }, []);

  // Afficher un skeleton minimal pendant l'initialisation
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
