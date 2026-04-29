import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
  findMerchant: vi.fn(),
}));

vi.mock("@apollo/client", () => ({
  useQuery: (...args) => mocks.useQuery(...args),
  gql: (s) => s,
}));

vi.mock("@/src/graphql/queries/banking", () => ({
  GET_TRANSACTIONS: "GET_TRANSACTIONS",
}));

vi.mock("@/lib/merchants-config", () => ({
  findMerchant: (...args) => mocks.findMerchant(...args),
}));

vi.mock("@/app/dashboard/outils/transactions/components/merchant-logo", () => ({
  MerchantLogo: ({ merchant }) => (
    <div data-testid="merchant-logo">{merchant?.name}</div>
  ),
}));

vi.mock("@/src/components/icons", () => ({
  ReceiptItemIcon: (props) => <span data-testid="receipt-icon" {...props} />,
}));

import RecentTransactionsCard from "@/src/components/banking/RecentTransactionsCard";

describe("RecentTransactionsCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findMerchant.mockReturnValue(null);
  });

  it("renders the loading skeleton when isLoading is true", () => {
    mocks.useQuery.mockReturnValue({ data: null, loading: false });
    const { container } = render(
      <RecentTransactionsCard workspaceId="ws_1" isLoading />,
    );
    expect(screen.getByText(/Transactions récentes/i)).toBeInTheDocument();
    expect(container.querySelector(".animate-pulse")).toBeTruthy();
  });

  it("renders the loading skeleton when query is loading", () => {
    mocks.useQuery.mockReturnValue({ data: null, loading: true });
    const { container } = render(<RecentTransactionsCard workspaceId="ws_1" />);
    expect(container.querySelector(".animate-pulse")).toBeTruthy();
  });

  it("renders the empty state when no transactions", () => {
    mocks.useQuery.mockReturnValue({
      data: { transactions: [] },
      loading: false,
    });
    render(<RecentTransactionsCard workspaceId="ws_1" />);
    expect(screen.getByText(/Aucune transaction récente/i)).toBeInTheDocument();
  });

  it("renders incoming and outgoing transactions with formatted amounts", () => {
    mocks.useQuery.mockReturnValue({
      data: {
        transactions: [
          {
            id: "tx_1",
            description: "Remboursement",
            amount: 100,
            date: "2026-04-20",
          },
          {
            id: "tx_2",
            description: "Achat",
            amount: -42.5,
            date: "2026-04-21",
          },
        ],
      },
      loading: false,
    });
    render(<RecentTransactionsCard workspaceId="ws_1" />);
    expect(screen.getByText("Remboursement")).toBeInTheDocument();
    expect(screen.getByText("Achat")).toBeInTheDocument();
    // The plus sign appears for income
    expect(screen.getByText(/\+/)).toBeInTheDocument();
  });

  it("uses MerchantLogo when a known merchant is found", () => {
    mocks.findMerchant.mockReturnValue({ name: "Amazon" });
    mocks.useQuery.mockReturnValue({
      data: {
        transactions: [
          {
            id: "tx_1",
            description: "AMAZON EU SARL",
            amount: -10,
            date: "2026-04-20",
          },
        ],
      },
      loading: false,
    });
    render(<RecentTransactionsCard workspaceId="ws_1" />);
    expect(screen.getByTestId("merchant-logo")).toBeInTheDocument();
  });

  it("falls back to 'Transaction' label when description is missing", () => {
    mocks.useQuery.mockReturnValue({
      data: {
        transactions: [{ id: "tx_1", amount: 5, date: "2026-04-20" }],
      },
      loading: false,
    });
    render(<RecentTransactionsCard workspaceId="ws_1" />);
    expect(screen.getByText("Transaction")).toBeInTheDocument();
  });
});
