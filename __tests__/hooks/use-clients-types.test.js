import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

vi.mock("@apollo/client", () => ({
  useQuery: vi.fn(() => ({ data: undefined, loading: false })),
  useMutation: vi.fn(() => [vi.fn(), { loading: false }]),
  useApolloClient: vi.fn(() => ({})),
  gql: (strings, ...values) =>
    strings.reduce((acc, s, i) => acc + s + (values[i] ?? ""), ""),
}));
vi.mock("@/src/hooks/useWorkspace", () => ({
  useWorkspace: vi.fn(() => ({ workspaceId: "w1", loading: false })),
}));
vi.mock("@/src/components/ui/sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { useQuery } from "@apollo/client";
import { useClients } from "@/src/hooks/useClients";
import {
  GET_CLIENTS,
  GET_CLIENTS_BY_TYPES,
} from "@/src/graphql/queries/clients";

describe("useClients : filtre « Type »", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sans filtre : la requête habituelle, sans argument types", () => {
    renderHook(() => useClients(1, 10, ""));
    const [query, options] = useQuery.mock.calls.at(-1);
    expect(query).toBe(GET_CLIENTS);
    expect(options.variables).not.toHaveProperty("types");
  });

  it("filtre « Particulier » : appliqué par l'API, sur tous les contacts", () => {
    renderHook(() => useClients(1, 10, "", { types: ["INDIVIDUAL"] }));
    const [query, options] = useQuery.mock.calls.at(-1);
    expect(query).toBe(GET_CLIENTS_BY_TYPES);
    expect(options.variables).toMatchObject({
      page: 1,
      limit: 10,
      types: ["INDIVIDUAL"],
    });
  });
});
