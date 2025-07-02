"use client";

import { ApolloProvider } from "@apollo/client";
import { client } from "@/src/lib/apolloClient";

export function ApolloWrapper({ children }) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
