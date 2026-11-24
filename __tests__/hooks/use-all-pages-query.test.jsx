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
import { useAllPagesQuery, MAX_PAGE_SIZE } from "@/src/hooks/useAllPagesQuery";

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

function Liste({ allPages = true, firstPageSize, onRender }) {
  const { data, complete } = useAllPagesQuery(
    GET_DOCS,
    { variables: { workspaceId: "ws-1" }, fetchPolicy: "cache-and-network" },
    {
      field: "docs",
      listField: "docs",
      allPages,
      ...(firstPageSize ? { firstPageSize } : {}),
    },
  );
  const docs = data?.docs?.docs || [];
  onRender?.({ count: docs.length, complete });
  return (
    <>
      <p>
        {docs.length} chargés : {docs.at(-1)?.number}
      </p>
      <p>{complete ? "complète" : "en cours"}</p>
    </>
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

  it("plus de 1 000 documents : relus par pages de 1 000 (plafond de l'API)", async () => {
    const BEAUCOUP = Array.from({ length: 2350 }, (_, i) => ({
      __typename: "Doc",
      id: `doc-${2350 - i}`,
      number: String(2350 - i).padStart(4, "0"),
    }));
    const demandes = servirParPages(BEAUCOUP);
    render(
      <ApolloProvider client={makeClient()}>
        <Liste />
      </ApolloProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText("2350 chargés : 0001")).toBeInTheDocument(),
    );
    expect(demandes.map((v) => [v.page, v.limit])).toEqual([
      [1, 50],
      [1, 1000],
      [2, 1000],
      [3, 1000],
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
    // Relecture abandonnée : la liste reçue est définitive, rien ne l'attend
    expect(screen.getByText("complète")).toBeInTheDocument();
  });

  it("complete : vrai seulement avec la liste entière", async () => {
    servirParPages();
    const etats = [];
    render(
      <ApolloProvider client={makeClient()}>
        <Liste onRender={(etat) => etats.push(etat)} />
      </ApolloProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText("complète")).toBeInTheDocument(),
    );
    expect(screen.getByText("59 chargés : 0001")).toBeInTheDocument();
    // La première page de 50 est passée, sans jamais être annoncée complète
    expect(etats.some((etat) => etat.count === 50)).toBe(true);
    expect(
      etats.filter((etat) => etat.complete).every((etat) => etat.count === 59),
    ).toBe(true);
  });

  it("première page de 1 000 : la liste entière d'une seule requête", async () => {
    const demandes = servirParPages();
    const etats = [];
    render(
      <ApolloProvider client={makeClient()}>
        <Liste
          firstPageSize={MAX_PAGE_SIZE}
          onRender={(etat) => etats.push(etat)}
        />
      </ApolloProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText("complète")).toBeInTheDocument(),
    );
    expect(screen.getByText("59 chargés : 0001")).toBeInTheDocument();
    await new Promise((r) => setTimeout(r, 50));
    expect(demandes.map((v) => [v.page, v.limit])).toEqual([[1, 1000]]);
    // Jamais de liste partielle : rien, puis tout
    expect(etats.every((etat) => [0, 59].includes(etat.count))).toBe(true);
  });

  it("plus de 1 000 avec une première page de 1 000 : seule la suite est relue", async () => {
    const BEAUCOUP = Array.from({ length: 2350 }, (_, i) => ({
      __typename: "Doc",
      id: `doc-${2350 - i}`,
      number: String(2350 - i).padStart(4, "0"),
    }));
    const demandes = servirParPages(BEAUCOUP);
    const etats = [];
    render(
      <ApolloProvider client={makeClient()}>
        <Liste
          firstPageSize={MAX_PAGE_SIZE}
          onRender={(etat) => etats.push(etat)}
        />
      </ApolloProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText("2350 chargés : 0001")).toBeInTheDocument(),
    );
    expect(screen.getByText("complète")).toBeInTheDocument();
    expect(demandes.map((v) => [v.page, v.limit])).toEqual([
      [1, 1000],
      [2, 1000],
      [3, 1000],
    ]);
    expect(
      etats
        .filter((etat) => etat.complete)
        .every((etat) => etat.count === 2350),
    ).toBe(true);
  });

  it("retour sur la page : la liste en cache n'est pas remplacée par une liste partielle", async () => {
    const demandes = servirParPages();
    const client = makeClient();
    const premiereVisite = render(
      <ApolloProvider client={client}>
        <Liste firstPageSize={MAX_PAGE_SIZE} />
      </ApolloProvider>,
    );
    await waitFor(() =>
      expect(screen.getByText("complète")).toBeInTheDocument(),
    );
    premiereVisite.unmount();

    const etats = [];
    render(
      <ApolloProvider client={client}>
        <Liste
          firstPageSize={MAX_PAGE_SIZE}
          onRender={(etat) => etats.push(etat)}
        />
      </ApolloProvider>,
    );
    // Le rafraîchissement réseau (cache-and-network) est bien revenu
    await waitFor(() => expect(demandes).toHaveLength(2));
    await new Promise((r) => setTimeout(r, 50));
    expect(etats.length).toBeGreaterThan(0);
    expect(etats.every((etat) => etat.count === 59 && etat.complete)).toBe(
      true,
    );
  });

  it("relecture de la suite en échec : la liste reçue finit complète, sans attente sans fin", async () => {
    const demandes = [];
    server.use(
      graphql.query("GetDocs", ({ variables }) => {
        demandes.push(variables);
        if (variables.limit === 50) {
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
        }
        return HttpResponse.json(
          { errors: [{ message: "Erreur serveur" }] },
          { status: 500 },
        );
      }),
    );
    render(
      <ApolloProvider client={makeClient()}>
        <Liste />
      </ApolloProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText("complète")).toBeInTheDocument(),
    );
    expect(screen.getByText("50 chargés : 0010")).toBeInTheDocument();
    expect(demandes.length).toBeLessThanOrEqual(3);
  });
});
