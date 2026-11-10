/**
 * Fonctionnalités en accès anticipé : fermées tant que l'API n'a pas répondu
 * (rien n'apparaît puis disparaît), puis selon la réponse pour l'espace.
 */
import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { GraphQLError } from "graphql";
import { GET_WORKSPACE_FEATURES } from "@/src/graphql/queries/workspaceFeatures";

vi.mock("@/src/hooks/useWorkspace", () => ({
  useWorkspace: () => ({ workspaceId: "espace-1" }),
}));

import { useWorkspaceFeatures } from "@/src/hooks/useWorkspaceFeatures";

const request = {
  query: GET_WORKSPACE_FEATURES,
  variables: { workspaceId: "espace-1" },
};

function wrapper(mocks) {
  return function ApolloWrapper({ children }) {
    return <MockedProvider mocks={mocks}>{children}</MockedProvider>;
  };
}

describe("useWorkspaceFeatures", () => {
  it("tout fermé pendant le chargement, sauf les pages ordinaires", () => {
    const { result } = renderHook(() => useWorkspaceFeatures(), {
      wrapper: wrapper([]),
    });
    expect(result.current.isReady).toBe(false);
    expect(result.current.loading).toBe(true);
    expect(result.current.isEnabled("vat")).toBe(false);
    expect(result.current.isEnabled(null)).toBe(true);
  });

  it("suit la réponse de l'API pour l'espace", async () => {
    const mocks = [
      {
        request,
        result: {
          data: {
            workspaceFeatures: {
              __typename: "WorkspaceFeatures",
              vat: true,
              appointments: false,
              documentShares: true,
              socialPublishing: false,
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => useWorkspaceFeatures(), {
      wrapper: wrapper(mocks),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.isEnabled("vat")).toBe(true);
    expect(result.current.isEnabled("appointments")).toBe(false);
    expect(result.current.isEnabled("documentShares")).toBe(true);
    expect(result.current.isEnabled("socialPublishing")).toBe(false);
  });

  it("reste fermé si l'API répond une erreur", async () => {
    const mocks = [
      { request, result: { errors: [new GraphQLError("Indisponible")] } },
    ];
    const { result } = renderHook(() => useWorkspaceFeatures(), {
      wrapper: wrapper(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isReady).toBe(false);
    expect(result.current.isEnabled("vat")).toBe(false);
  });
});
