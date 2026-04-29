import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import React from "react";

const { toastMock } = vi.hoisted(() => ({
  toastMock: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/src/components/ui/sonner", () => ({ toast: toastMock }));

vi.mock("@/src/hooks/useWorkspace", () => ({
  useRequiredWorkspace: () => ({ workspaceId: "ws-1" }),
}));

import {
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from "@/src/hooks/useTransactions";
import {
  CREATE_TRANSACTION,
  UPDATE_TRANSACTION,
  DELETE_TRANSACTION,
} from "@/src/graphql/mutations/banking";

const wrap = (mocks) =>
  function Wrapper({ children }) {
    return (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );
  };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useCreateTransaction", () => {
  it("returns success and shows a toast on a successful mutation", async () => {
    const tx = { id: "tx-1", amount: 100 };
    const input = { amount: 100, description: "Test" };

    const mocks = [
      {
        request: { query: CREATE_TRANSACTION, variables: { input } },
        result: { data: { createTransaction: tx } },
      },
    ];

    const { result } = renderHook(() => useCreateTransaction(), {
      wrapper: wrap(mocks),
    });

    let returned;
    await act(async () => {
      returned = await result.current.createTransaction(input);
    });

    expect(returned).toEqual({ success: true, transaction: tx });
    expect(toastMock.success).toHaveBeenCalledWith(
      "Transaction créée avec succès",
    );
  });

  it("surfaces a GraphQL error message on failure", async () => {
    const input = { amount: 100 };
    const mocks = [
      {
        request: { query: CREATE_TRANSACTION, variables: { input } },
        result: {
          errors: [{ message: "Champ obligatoire manquant" }],
        },
      },
    ];

    const { result } = renderHook(() => useCreateTransaction(), {
      wrapper: wrap(mocks),
    });

    let returned;
    await act(async () => {
      returned = await result.current.createTransaction(input);
    });

    expect(returned.success).toBe(false);
    // The hook re-throws via try/catch; result.error is the ApolloError instance
    // whose .message contains the GraphQL message.
    expect(String(returned.error)).toContain("Champ obligatoire manquant");
    expect(toastMock.error).toHaveBeenCalledWith("Champ obligatoire manquant");
  });
});

describe("useUpdateTransaction", () => {
  it("returns success on successful update", async () => {
    const tx = { id: "tx-1", amount: 200 };
    const input = { amount: 200 };
    const mocks = [
      {
        request: {
          query: UPDATE_TRANSACTION,
          variables: { id: "tx-1", input },
        },
        result: { data: { updateTransaction: tx } },
      },
    ];

    const { result } = renderHook(() => useUpdateTransaction(), {
      wrapper: wrap(mocks),
    });

    let returned;
    await act(async () => {
      returned = await result.current.updateTransaction("tx-1", input);
    });
    expect(returned.success).toBe(true);
    expect(returned.transaction).toEqual(tx);
  });
});

describe("useDeleteTransaction", () => {
  it("returns success on successful delete", async () => {
    const mocks = [
      {
        request: { query: DELETE_TRANSACTION, variables: { id: "tx-1" } },
        result: { data: { deleteTransaction: true } },
      },
    ];

    const { result } = renderHook(() => useDeleteTransaction(), {
      wrapper: wrap(mocks),
    });

    let returned;
    await act(async () => {
      returned = await result.current.deleteTransaction("tx-1");
    });
    expect(returned.success).toBe(true);
    expect(toastMock.success).toHaveBeenCalled();
  });
});
