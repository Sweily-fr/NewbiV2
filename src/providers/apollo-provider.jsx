"use client";

import { ApolloProvider } from "@apollo/client";
import { apolloClient } from "@/src/lib/apolloClient";

export function ApolloWrapper({ children }) {
  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
}
