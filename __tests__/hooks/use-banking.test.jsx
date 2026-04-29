import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import React from "react";

vi.mock("@/src/components/ui/sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import {
  useBankingAccounts,
  useBankingAccount,
  useBankTransactions,
  useBankTransaction,
  useAccountBalance,
} from "@/src/hooks/useBanking";
import {
  GET_BANKING_ACCOUNTS,
  GET_BANKING_ACCOUNT,
  GET_TRANSACTIONS,
  GET_TRANSACTION,
  GET_ACCOUNT_BALANCE,
} from "@/src/graphql/queries/banking";

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

describe("useBankingAccounts", () => {
  it("returns accounts from the query", async () => {
    const mocks = [
      {
        request: { query: GET_BANKING_ACCOUNTS },
        result: {
          data: {
            bankingAccounts: [
              { id: "a-1", name: "Compte courant" },
              { id: "a-2", name: "Livret A" },
            ],
          },
        },
      },
    ];
    const { result } = renderHook(() => useBankingAccounts(), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.accounts).toHaveLength(2);
  });

  it("returns [] when no data", () => {
    const { result } = renderHook(() => useBankingAccounts(), {
      wrapper: wrap([]),
    });
    expect(result.current.accounts).toEqual([]);
  });
});

describe("useBankingAccount", () => {
  it("returns the account by id", async () => {
    const mocks = [
      {
        request: { query: GET_BANKING_ACCOUNT, variables: { id: "a-1" } },
        result: {
          data: {
            bankingAccount: { id: "a-1", name: "Compte courant" },
          },
        },
      },
    ];
    const { result } = renderHook(() => useBankingAccount("a-1"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.account.name).toBe("Compte courant");
  });

  it("skips when id is missing", () => {
    const { result } = renderHook(() => useBankingAccount(null), {
      wrapper: wrap([]),
    });
    expect(result.current.account).toBeUndefined();
  });
});

describe("useBankTransactions", () => {
  it("returns transactions with default pagination", async () => {
    const mocks = [
      {
        request: {
          query: GET_TRANSACTIONS,
          variables: { filters: {}, limit: 500, offset: 0 },
        },
        result: {
          data: {
            transactions: [
              { id: "tx-1", amount: -50 },
              { id: "tx-2", amount: 200 },
            ],
          },
        },
      },
    ];
    const { result } = renderHook(() => useBankTransactions(), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.transactions).toHaveLength(2);
  });

  it("forwards filters and pagination", async () => {
    const filters = { accountId: "a-1", from: "2026-04-01" };
    const mocks = [
      {
        request: {
          query: GET_TRANSACTIONS,
          variables: { filters, limit: 100, offset: 50 },
        },
        result: {
          data: { transactions: [{ id: "tx-1" }] },
        },
      },
    ];
    const { result } = renderHook(() => useBankTransactions(filters, 100, 50), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.transactions).toHaveLength(1);
  });
});

describe("useBankTransaction", () => {
  it("returns the transaction by id", async () => {
    const mocks = [
      {
        request: { query: GET_TRANSACTION, variables: { id: "tx-1" } },
        result: { data: { transaction: { id: "tx-1", amount: 42 } } },
      },
    ];
    const { result } = renderHook(() => useBankTransaction("tx-1"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.transaction.amount).toBe(42);
  });

  it("skips when id is missing", () => {
    const { result } = renderHook(() => useBankTransaction(null), {
      wrapper: wrap([]),
    });
    expect(result.current.transaction).toBeUndefined();
  });
});

describe("useAccountBalance", () => {
  it("returns balance by accountId", async () => {
    const mocks = [
      {
        request: {
          query: GET_ACCOUNT_BALANCE,
          variables: { accountId: "a-1" },
        },
        result: {
          data: { accountBalance: { amount: 1234.56, currency: "EUR" } },
        },
      },
    ];
    const { result } = renderHook(() => useAccountBalance("a-1"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.balance.amount).toBe(1234.56);
  });

  it("skips when accountId is missing", () => {
    const { result } = renderHook(() => useAccountBalance(null), {
      wrapper: wrap([]),
    });
    expect(result.current.balance).toBeUndefined();
  });
});
