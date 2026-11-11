import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { GraphQLError } from "graphql";
import { CONNECT_SOCIAL_ACCOUNT } from "@/src/graphql/socialPublishingQueries";

const toast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}));
vi.mock("@/src/components/ui/sonner", () => ({ toast }));

import {
  useConnectSocialAccount,
  useSocialPostMutations,
} from "@/src/hooks/useSocialPublishing";
import { SCHEDULE_SOCIAL_POST } from "@/src/graphql/socialPublishingQueries";

// Avec errorPolicy "all" (défaut des mutations dans apolloClient.js), un refus
// de l'API arrive en résultat, pas en exception : on reproduit ce réglage
const DEFAULT_OPTIONS = { mutate: { errorPolicy: "all" } };

function wrapper(mocks) {
  return function ApolloWrapper({ children }) {
    return (
      <MockedProvider mocks={mocks} defaultOptions={DEFAULT_OPTIONS}>
        {children}
      </MockedProvider>
    );
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("connexion d'un réseau par connecteur", () => {
  it("envoie la clé du connecteur et montre le refus de l'API", async () => {
    const mocks = [
      {
        request: {
          query: CONNECT_SOCIAL_ACCOUNT,
          variables: {
            platform: "instagram",
            connector: "instagram_facebook",
            returnTo: "/dashboard?openSettings=true",
            workspaceId: "w1",
          },
        },
        result: {
          errors: [
            new GraphQLError(
              "La connexion d'Instagram via Facebook n'est pas disponible pour le moment.",
            ),
          ],
        },
      },
    ];
    const { result } = renderHook(() => useConnectSocialAccount("w1"), {
      wrapper: wrapper(mocks),
    });
    const beforeRedirect = vi.fn();
    await act(() =>
      result.current.connect("instagram", "/dashboard?openSettings=true", {
        connector: "instagram_facebook",
        beforeRedirect,
      }),
    );
    expect(toast.error).toHaveBeenCalledWith(
      "La connexion d'Instagram via Facebook n'est pas disponible pour le moment.",
    );
    expect(beforeRedirect).not.toHaveBeenCalled();
    expect(result.current.connecting).toBeNull();
  });
});

describe("programmation d'un post", () => {
  it("un refus de l'API est relancé (plus de succès silencieux)", async () => {
    const input = {
      accountIds: ["a-tt"],
      content: "",
      mediaIds: ["m1"],
      publishNow: true,
      tiktokSettings: { mode: "draft" },
    };
    const mocks = [
      {
        request: {
          query: SCHEDULE_SOCIAL_POST,
          variables: { input: { boardId: "b1", ...input }, workspaceId: "w1" },
        },
        result: {
          errors: [
            new GraphQLError(
              "Reconnectez votre compte TikTok pour envoyer en brouillon.",
            ),
          ],
        },
      },
    ];
    const { result } = renderHook(
      () => useSocialPostMutations({ boardId: "b1", workspaceId: "w1" }),
      { wrapper: wrapper(mocks) },
    );
    let caught = null;
    await act(async () => {
      try {
        await result.current.schedule(input);
      } catch (error) {
        caught = error;
      }
    });
    expect(caught?.graphQLErrors?.[0]?.message).toBe(
      "Reconnectez votre compte TikTok pour envoyer en brouillon.",
    );
  });
});
