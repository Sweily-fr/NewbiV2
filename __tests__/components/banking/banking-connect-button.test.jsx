import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => {
  return {
    useBankingConnection: vi.fn(),
    useWorkspace: vi.fn(),
    useSubscriptionAccess: vi.fn(),
    useDebouncedValue: vi.fn((v) => v),
  };
});

vi.mock("@/src/hooks/useBankingConnection", () => ({
  useBankingConnection: (...args) => mocks.useBankingConnection(...args),
}));

vi.mock("@/src/hooks/useWorkspace", () => ({
  useWorkspace: (...args) => mocks.useWorkspace(...args),
}));

vi.mock("@/src/hooks/useSubscriptionAccess", () => ({
  useSubscriptionAccess: (...args) => mocks.useSubscriptionAccess(...args),
}));

vi.mock("@/src/hooks/useDebouncedValue", () => ({
  useDebouncedValue: (v) => mocks.useDebouncedValue(v),
}));

import BankingConnectButton from "@/src/components/banking/BankingConnectButton";

describe("BankingConnectButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useDebouncedValue.mockImplementation((v) => v);
    mocks.useWorkspace.mockReturnValue({ workspaceId: "ws_1" });
    mocks.useSubscriptionAccess.mockReturnValue({
      isReadOnly: false,
      isOwner: false,
    });
  });

  function setupHook(overrides = {}) {
    mocks.useBankingConnection.mockReturnValue({
      isConnected: false,
      accountsCount: 0,
      hasAccounts: false,
      isLoading: false,
      isLoadingInstitutions: false,
      institutions: [],
      error: null,
      connectBank: vi.fn(),
      fetchInstitutions: vi.fn(),
      ...overrides,
    });
  }

  it("renders the connect button when not connected", () => {
    setupHook();
    render(<BankingConnectButton />);
    expect(
      screen.getByRole("button", { name: /Connecter un compte bancaire/i }),
    ).toBeInTheDocument();
  });

  it("shows the connected state with the right plural", () => {
    setupHook({ isConnected: true, hasAccounts: true, accountsCount: 2 });
    render(<BankingConnectButton />);
    expect(screen.getByText(/Connecté \(2 comptes\)/i)).toBeInTheDocument();
  });

  it("shows the singular connected state when only one account", () => {
    setupHook({ isConnected: true, hasAccounts: true, accountsCount: 1 });
    render(<BankingConnectButton />);
    expect(screen.getByText(/Connecté \(1 compte\)/i)).toBeInTheDocument();
  });

  it("disables the button when in read-only mode", () => {
    mocks.useSubscriptionAccess.mockReturnValue({
      isReadOnly: true,
      isOwner: true,
    });
    setupHook();
    render(<BankingConnectButton />);
    const btn = screen.getByRole("button", {
      name: /Connecter un compte bancaire/i,
    });
    expect(btn).toBeDisabled();
  });

  it("opens the dialog and calls fetchInstitutions on first open", async () => {
    const fetchInstitutions = vi.fn();
    setupHook({ fetchInstitutions });
    render(<BankingConnectButton />);
    await userEvent.click(
      screen.getByRole("button", { name: /Connecter un compte bancaire/i }),
    );
    await waitFor(() => {
      expect(fetchInstitutions).toHaveBeenCalledWith("FR");
    });
  });

  it("filters institutions by search query", async () => {
    setupHook({
      institutions: [
        { id: "1", name: "BNP Paribas" },
        { id: "2", name: "Société Générale" },
      ],
    });
    render(<BankingConnectButton />);
    await userEvent.click(
      screen.getByRole("button", { name: /Connecter un compte bancaire/i }),
    );

    // Wait for dialog to open
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/Rechercher une banque/i),
      ).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/Rechercher une banque/i);
    await userEvent.type(input, "BNP");

    await waitFor(() => {
      expect(screen.getByText("BNP Paribas")).toBeInTheDocument();
    });
    expect(screen.queryByText("Société Générale")).not.toBeInTheDocument();
  });

  it("calls connectBank when an institution is clicked", async () => {
    const connectBank = vi.fn().mockResolvedValue();
    setupHook({
      institutions: [{ id: "ins_1", name: "BNP Paribas" }],
      connectBank,
    });
    render(<BankingConnectButton />);
    await userEvent.click(
      screen.getByRole("button", { name: /Connecter un compte bancaire/i }),
    );
    await waitFor(() => {
      expect(screen.getByText("BNP Paribas")).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText("BNP Paribas"));
    expect(connectBank).toHaveBeenCalledWith("ins_1");
  });
});
