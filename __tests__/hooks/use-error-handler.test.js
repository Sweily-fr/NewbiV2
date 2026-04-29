import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const { toastMock } = vi.hoisted(() => ({
  toastMock: { error: vi.fn(), warning: vi.fn(), success: vi.fn() },
}));

vi.mock("@/src/components/ui/sonner", () => ({ toast: toastMock }));

vi.mock("@/src/utils/errorMessages", () => ({
  getErrorMessage: vi.fn((err) =>
    typeof err === "string" ? err : err?.message || "Erreur",
  ),
  isCriticalError: vi.fn(() => false),
  requiresUserAction: vi.fn(() => false),
}));

import {
  useErrorHandler,
  useAuthErrorHandler,
  useFormErrorHandler,
} from "@/src/hooks/useErrorHandler";
import {
  isCriticalError,
  requiresUserAction,
  getErrorMessage,
} from "@/src/utils/errorMessages";
import { useRouter } from "next/navigation";

beforeEach(() => {
  vi.clearAllMocks();
  isCriticalError.mockReturnValue(false);
  requiresUserAction.mockReturnValue(false);
  getErrorMessage.mockImplementation((err) =>
    typeof err === "string" ? err : err?.message || "Erreur",
  );
});

describe("useErrorHandler.handleError", () => {
  it("shows an error toast with the user message", () => {
    const { result } = renderHook(() => useErrorHandler());
    act(() => {
      result.current.handleError(new Error("Boom"));
    });
    expect(toastMock.error).toHaveBeenCalledTimes(1);
    expect(toastMock.error.mock.calls[0][0]).toBe("Boom");
  });

  it("respects showToast=false", () => {
    const { result } = renderHook(() => useErrorHandler());
    act(() => {
      result.current.handleError(new Error("Quiet"), "ctx", {
        showToast: false,
      });
    });
    expect(toastMock.error).not.toHaveBeenCalled();
  });

  it("uses customMessage when provided", () => {
    const { result } = renderHook(() => useErrorHandler());
    act(() => {
      result.current.handleError(new Error("raw"), "ctx", {
        customMessage: "Pretty message",
      });
    });
    expect(toastMock.error.mock.calls[0][0]).toBe("Pretty message");
  });

  it("hides 500 server errors behind a generic message", () => {
    const { result } = renderHook(() => useErrorHandler());
    act(() => {
      result.current.handleError(new Error("Internal Server Error"));
    });
    expect(toastMock.error.mock.calls[0][0]).toMatch(/erreur s'est produite/i);
  });

  it("calls toast.warning when requiresUserAction is true", () => {
    requiresUserAction.mockReturnValue(true);
    const { result } = renderHook(() => useErrorHandler());
    act(() => {
      result.current.handleError(new Error("action needed"));
    });
    expect(toastMock.warning).toHaveBeenCalledTimes(1);
  });

  it("redirects to /auth/login when isCriticalError + redirectOnCritical", async () => {
    isCriticalError.mockReturnValue(true);
    vi.useFakeTimers();
    const { result } = renderHook(() => useErrorHandler());
    act(() => {
      result.current.handleError(new Error("expired"));
    });
    act(() => {
      vi.advanceTimersByTime(2100);
    });
    const router = useRouter();
    expect(router.push).toHaveBeenCalledWith("/auth/login");
    vi.useRealTimers();
  });

  it("dedupes the same error within 3 seconds", () => {
    const { result } = renderHook(() => useErrorHandler());
    act(() => {
      result.current.handleError(new Error("dup"), "ctx");
      result.current.handleError(new Error("dup"), "ctx");
    });
    expect(toastMock.error).toHaveBeenCalledTimes(1);
  });

  it("invokes onError callback with both error and message", () => {
    const onError = vi.fn();
    const { result } = renderHook(() => useErrorHandler());
    act(() => {
      result.current.handleError(new Error("Boom"), "ctx", { onError });
    });
    expect(onError).toHaveBeenCalledWith(expect.any(Error), "Boom");
  });
});

describe("useErrorHandler.handleGraphQLError", () => {
  it("extracts the first GraphQL error message", () => {
    const { result } = renderHook(() => useErrorHandler());
    const apolloError = {
      graphQLErrors: [{ message: "Bad request", extensions: { code: "X" } }],
    };
    act(() => {
      result.current.handleGraphQLError(apolloError, "ctx");
    });
    expect(toastMock.error.mock.calls[0][0]).toBe("Bad request");
  });

  it("falls back to networkError when no GraphQL errors", () => {
    const { result } = renderHook(() => useErrorHandler());
    act(() => {
      result.current.handleGraphQLError({
        networkError: new Error("Offline"),
      });
    });
    expect(toastMock.error.mock.calls[0][0]).toBe("Offline");
  });
});

describe("useErrorHandler.handleMutationError", () => {
  it("uses an operation/context-aware message", () => {
    const { result } = renderHook(() => useErrorHandler());
    act(() => {
      result.current.handleMutationError(
        { graphQLErrors: [{ message: "raw" }] },
        "create",
        "invoice",
      );
    });
    expect(toastMock.error.mock.calls[0][0]).toBe(
      "Impossible de créer la facture",
    );
  });

  it("falls back to a generic message for unknown operations", () => {
    const { result } = renderHook(() => useErrorHandler());
    act(() => {
      result.current.handleMutationError(
        { graphQLErrors: [{ message: "raw" }] },
        "unknown",
        "client",
      );
    });
    expect(toastMock.error.mock.calls[0][0]).toBe("Opération impossible");
  });
});

describe("useErrorHandler.handleValidationError", () => {
  it("formats a single field error", () => {
    const { result } = renderHook(() => useErrorHandler());
    let returned;
    act(() => {
      returned = result.current.handleValidationError({
        email: { message: "Email invalide" },
      });
    });
    expect(returned).toBe("Email: Email invalide");
    expect(toastMock.error.mock.calls[0][1].description).toContain(
      "Email: Email invalide",
    );
  });

  it("translates technical field names to French labels", () => {
    const { result } = renderHook(() => useErrorHandler());
    let returned;
    act(() => {
      returned = result.current.handleValidationError({
        siret: { message: "Invalide" },
      });
    });
    expect(returned).toBe("SIRET: Invalide");
  });

  it("combines multiple errors with newlines", () => {
    const { result } = renderHook(() => useErrorHandler());
    let returned;
    act(() => {
      returned = result.current.handleValidationError({
        email: "invalide",
        phone: "invalide",
      });
    });
    expect(returned).toMatch(/Email: invalide/);
    expect(returned).toMatch(/Téléphone: invalide/);
  });

  it("returns undefined for non-object input", () => {
    const { result } = renderHook(() => useErrorHandler());
    expect(result.current.handleValidationError(null)).toBeUndefined();
    expect(result.current.handleValidationError("string")).toBeUndefined();
  });
});

describe("useErrorHandler.withErrorHandling", () => {
  it("calls handleError and re-throws on failure", async () => {
    const { result } = renderHook(() => useErrorHandler());
    const failing = vi.fn().mockRejectedValue(new Error("fail"));
    const wrapped = result.current.withErrorHandling(failing, "ctx");

    await expect(wrapped()).rejects.toThrow("fail");
    expect(toastMock.error).toHaveBeenCalled();
  });

  it("returns the operation's value on success", async () => {
    const { result } = renderHook(() => useErrorHandler());
    const wrapped = result.current.withErrorHandling(async () => 42);
    await expect(wrapped()).resolves.toBe(42);
    expect(toastMock.error).not.toHaveBeenCalled();
  });
});

describe("useAuthErrorHandler", () => {
  it("forwards to handleError with auth context and redirectOnCritical=true", () => {
    isCriticalError.mockReturnValue(false);
    const { result } = renderHook(() => useAuthErrorHandler());
    act(() => {
      result.current.handleAuthError(new Error("Bad creds"));
    });
    expect(toastMock.error).toHaveBeenCalled();
  });
});

describe("useFormErrorHandler", () => {
  it("treats objects without a .message as RHF validation errors", () => {
    const { result } = renderHook(() => useFormErrorHandler());
    act(() => {
      result.current.handleFormError({ email: { message: "invalide" } });
    });
    expect(toastMock.error.mock.calls[0][0]).toMatch(/Veuillez corriger/i);
  });

  it("treats objects with a .message as regular errors", () => {
    const { result } = renderHook(() => useFormErrorHandler());
    act(() => {
      result.current.handleFormError(new Error("classic"));
    });
    expect(toastMock.error.mock.calls[0][0]).toBe("classic");
  });
});
