import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { gql } from "@apollo/client";

/**
 * Requête que l'API ne connaît pas encore (fonctionnalité pas déployée) :
 * Apollo Server répond HTTP 400 GRAPHQL_VALIDATION_FAILED, qui arrive dans
 * le lien d'erreur comme erreur réseau. Avec skipErrorToast, l'appelant gère
 * l'échec lui-même (ex. bouton « Programmer un post » masqué) : aucun toast.
 */

const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }));

vi.mock("@/src/components/ui/sonner", () => ({
  toast: {
    error: toastError,
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock("@/src/lib/auth-client", () => ({
  authClient: { getSession: vi.fn(async () => ({ data: null })) },
}));

const UNKNOWN_FIELD_QUERY = gql`
  query GetUnknownFeature {
    unknownFeature {
      enabled
    }
  }
`;

const validationFailure = () =>
  new Response(
    JSON.stringify({
      errors: [
        {
          message: 'Cannot query field "unknownFeature" on type "Query".',
          extensions: { code: "GRAPHQL_VALIDATION_FAILED" },
        },
      ],
    }),
    { status: 400, headers: { "Content-Type": "application/json" } },
  );

let apolloClient;

beforeAll(async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url) =>
      String(url).includes("/api/auth/token")
        ? new Response("", { status: 401 })
        : validationFailure(),
    ),
  );
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  ({ apolloClient } = await import("@/src/lib/apolloClient"));
});

beforeEach(() => {
  toastError.mockClear();
});

describe("apolloClient : skipErrorToast sur une requête refusée (HTTP 400)", () => {
  it("n'affiche aucun toast quand l'appelant le demande", async () => {
    // Une erreur réseau rejette la requête, même avec errorPolicy "all"
    const error = await apolloClient
      .query({
        query: UNKNOWN_FIELD_QUERY,
        fetchPolicy: "network-only",
        errorPolicy: "all",
        context: { skipErrorToast: true },
      })
      .then(
        () => null,
        (e) => e,
      );
    expect(error?.networkError?.statusCode).toBe(400);
    expect(toastError).not.toHaveBeenCalled();
  });

  it("garde le toast par défaut", async () => {
    await apolloClient
      .query({
        query: UNKNOWN_FIELD_QUERY,
        fetchPolicy: "network-only",
        errorPolicy: "all",
      })
      .catch(() => {});
    expect(toastError).toHaveBeenCalled();
  });
});
