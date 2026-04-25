import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import {
  ApolloProvider,
  ApolloClient,
  InMemoryCache,
  HttpLink,
  useQuery,
} from "@apollo/client";

import { server, graphql, HttpResponse } from "../msw/server.js";
import { GET_CLIENTS } from "@/src/graphql/clientQueries";
import { buildClient } from "../factories/index.js";

const GRAPHQL_URL = "http://localhost:4000/graphql";

function makeClient() {
  return new ApolloClient({
    link: new HttpLink({ uri: GRAPHQL_URL, fetch }),
    cache: new InMemoryCache(),
    defaultOptions: {
      query: { fetchPolicy: "no-cache" },
      watchQuery: { fetchPolicy: "no-cache" },
    },
  });
}

function ClientsList() {
  const { data, loading, error } = useQuery(GET_CLIENTS, {
    variables: { workspaceId: "ws-1", page: 1, limit: 10 },
  });
  if (loading) return <p>loading</p>;
  if (error) return <p>error: {error.message}</p>;
  return (
    <ul>
      {data?.clients?.items?.map((c) => (
        <li key={c.id}>{c.name}</li>
      ))}
    </ul>
  );
}

describe("MSW + Apollo integration: GET_CLIENTS", () => {
  it("renders the clients returned by the mocked GraphQL endpoint", async () => {
    const acme = buildClient({ name: "Acme Corp" });
    const beta = buildClient({ name: "Beta Inc" });

    server.use(
      graphql.query("GetClients", () =>
        HttpResponse.json({
          data: {
            clients: {
              __typename: "ClientPagination",
              items: [acme, beta].map((c) => ({ __typename: "Client", ...c })),
              totalItems: 2,
              currentPage: 1,
              totalPages: 1,
            },
          },
        }),
      ),
    );

    render(
      <ApolloProvider client={makeClient()}>
        <ClientsList />
      </ApolloProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      expect(screen.getByText("Beta Inc")).toBeInTheDocument();
    });
  });

  it("shows the GraphQL error returned by the mocked server", async () => {
    server.use(
      graphql.query("GetClients", () =>
        HttpResponse.json({
          errors: [{ message: "Workspace not found" }],
        }),
      ),
    );

    render(
      <ApolloProvider client={makeClient()}>
        <ClientsList />
      </ApolloProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/error:/)).toBeInTheDocument();
    });
  });
});
