import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import {
  ApolloProvider,
  ApolloClient,
  InMemoryCache,
  HttpLink,
  gql,
} from "@apollo/client";

import { server, graphql, HttpResponse } from "../msw/server.js";
import { useAllPagesQuery } from "@/src/hooks/useAllPagesQuery";

const GRAPHQL_URL = "http://localhost:4000/graphql";

const GET_DOCS = gql`
  query GetDocs($workspaceId: ID!, $page: Int, $limit: Int) {
    docs(workspaceId: $workspaceId, page: $page, limit: $limit) {
      docs {
        id
        number
      }
      totalCount
      hasNextPage
    }
  }
`;

const makeClient = () =>
  new ApolloClient({
    link: new HttpLink({ uri: GRAPHQL_URL, fetch }),
    cache: new InMemoryCache(),
  });

/** 59 documents, les plus récents en premier, servis par pages comme l'API. */
const TOUS = Array.from({ length: 59 }, (_, i) => ({
  __typename: "Doc",
  id: `doc-${59 - i}`,
  number: String(59 - i).padStart(4, "0"),
}));

function servirParPages(total = TOUS, demandes = []) {
  server.use(
    graphql.query("GetDocs", ({ variables }) => {
      demandes.push(variables);
      const { page = 1, limit = 10 } = variables;
      const debut = (page - 1) * limit;
      return HttpResponse.json({
        data: {
          docs: {
            __typename: "DocPagination",
            docs: total.slice(debut, debut + limit),
            totalCount: total.length,
            hasNextPage: total.length > debut + limit,
          },
        },
      });
    }),
  );
  return demandes;
}

function Liste({ allPages = true }) {
  const { data } = useAllPagesQuery(
    GET_DOCS,
    { variables: { workspaceId: "ws-1" }, fetchPolicy: "cache-and-network" },
    { field: "docs", listField: "docs", allPages },
  );
  const docs = data?.docs?.docs || [];
  return (
    <p>
      {docs.length} chargés : {docs.at(-1)?.number}
    </p>
  );
}

describe("useAllPagesQuery", () => {
  it("charge les documents au-delà de la première page (plus de 50)", async () => {
    const demandes = servirParPages();
    render(
      <ApolloProvider client={makeClient()}>
        <Liste />
      </ApolloProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText("59 chargés : 0001")).toBeInTheDocument(),
    );
    // Première page de 50, puis la liste entière d'une requête
    expect(demandes.map((v) => [v.page, v.limit])).toEqual([
      [1, 50],
      [1, 59],
    ]);
  });

  it("une seule requête quand tout tient dans la première page", async () => {
    const demandes = servirParPages(TOUS.slice(0, 12));
    render(
      <ApolloProvider client={makeClient()}>
        <Liste />
      </ApolloProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText("12 chargés : 0048")).toBeInTheDocument(),
    );
    await new Promise((r) => setTimeout(r, 50));
    expect(demandes).toHaveLength(1);
  });

  it("allPages false : la première page seule (compteur)", async () => {
    const demandes = servirParPages();
    render(
      <ApolloProvider client={makeClient()}>
        <Liste allPages={false} />
      </ApolloProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText("50 chargés : 0010")).toBeInTheDocument(),
    );
    await new Promise((r) => setTimeout(r, 50));
    expect(demandes).toHaveLength(1);
  });

  it("ne relance pas sans fin quand l'API rend moins que son total", async () => {
    const demandes = [];
    server.use(
      graphql.query("GetDocs", ({ variables }) => {
        demandes.push(variables);
        return HttpResponse.json({
          data: {
            docs: {
              __typename: "DocPagination",
              docs: TOUS.slice(0, 50),
              totalCount: 59,
              hasNextPage: true,
            },
          },
        });
      }),
    );
    render(
      <ApolloProvider client={makeClient()}>
        <Liste />
      </ApolloProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText("50 chargés : 0010")).toBeInTheDocument(),
    );
    await new Promise((r) => setTimeout(r, 200));
    expect(demandes.length).toBeLessThanOrEqual(3);
  });
});
