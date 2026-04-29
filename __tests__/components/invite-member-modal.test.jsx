import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
const mockInviteMember = vi.fn();
const mockUseDashboardLayoutContext = vi.fn();

vi.mock("@/src/components/ui/sonner", () => ({
  toast: {
    error: (...args) => mockToastError(...args),
    success: (...args) => mockToastSuccess(...args),
  },
}));

vi.mock("@/src/hooks/useOrganizationInvitations", () => ({
  useOrganizationInvitations: () => ({
    inviteMember: mockInviteMember,
    inviting: false,
  }),
}));

vi.mock("@/src/contexts/dashboard-layout-context", () => ({
  useDashboardLayoutContext: (...args) =>
    mockUseDashboardLayoutContext(...args),
}));

vi.mock("@/src/lib/plan-limits", () => ({
  getPlanLimits: (plan) => ({
    invitableUsers: 10,
    accountants: 2,
    canAddPaidUsers: true,
    availableRoles: ["admin", "member", "viewer", "accountant"],
  }),
  getSeatPrice: () => 5,
}));

import { InviteMemberModal } from "@/src/components/invite-member-modal";

describe("InviteMemberModal", () => {
  beforeEach(() => {
    mockToastError.mockClear();
    mockToastSuccess.mockClear();
    mockInviteMember.mockReset();
    mockUseDashboardLayoutContext.mockReturnValue({
      organization: { id: "org-1" },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn((url) => {
        if (url.includes("/members")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: [],
              }),
          });
        }
        if (url.includes("/subscription")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ plan: "tpe" }),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }),
    );
  });

  it("renders the modal title when open", async () => {
    render(<InviteMemberModal open={true} onOpenChange={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("Inviter des membres")).toBeInTheDocument();
    });
  });

  it("does not render content when open is false", () => {
    render(<InviteMemberModal open={false} onOpenChange={vi.fn()} />);
    expect(screen.queryByText("Inviter des membres")).not.toBeInTheDocument();
  });

  it("renders the email input field", async () => {
    render(<InviteMemberModal open={true} onOpenChange={vi.fn()} />);
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("exemple@email.com"),
      ).toBeInTheDocument();
    });
  });

  it("disables the send button when no emails are entered", async () => {
    render(<InviteMemberModal open={true} onOpenChange={vi.fn()} />);
    await waitFor(() => {
      const btn = screen.getByRole("button", {
        name: /Envoyer les invitations/i,
      });
      expect(btn).toBeDisabled();
    });
  });

  it("adds an email tag when typing and pressing Enter", async () => {
    render(<InviteMemberModal open={true} onOpenChange={vi.fn()} />);
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("exemple@email.com"),
      ).toBeInTheDocument();
    });
    const input = screen.getByPlaceholderText("exemple@email.com");
    fireEvent.change(input, { target: { value: "test@example.com" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("rejects duplicate emails with toast error", async () => {
    render(<InviteMemberModal open={true} onOpenChange={vi.fn()} />);
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("exemple@email.com"),
      ).toBeInTheDocument();
    });
    const input = screen.getByPlaceholderText("exemple@email.com");

    fireEvent.change(input, { target: { value: "dup@example.com" } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.change(input, { target: { value: "dup@example.com" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockToastError).toHaveBeenCalledWith(
      "Cet email est déjà dans la liste",
    );
  });

  it("removes email tag when X button clicked", async () => {
    render(<InviteMemberModal open={true} onOpenChange={vi.fn()} />);
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("exemple@email.com"),
      ).toBeInTheDocument();
    });
    const input = screen.getByPlaceholderText("exemple@email.com");
    fireEvent.change(input, { target: { value: "remove@example.com" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText("remove@example.com")).toBeInTheDocument();

    // Find and click the X button next to the chip
    const removeButtons = screen.getAllByRole("button");
    const xButton = removeButtons.find((b) => b.querySelector("svg.lucide-x"));
    if (xButton) fireEvent.click(xButton);

    expect(screen.queryByText("remove@example.com")).not.toBeInTheDocument();
  });

  it("shows invalid email warning indicator", async () => {
    render(<InviteMemberModal open={true} onOpenChange={vi.fn()} />);
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("exemple@email.com"),
      ).toBeInTheDocument();
    });
    const input = screen.getByPlaceholderText("exemple@email.com");
    fireEvent.change(input, { target: { value: "not-an-email" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText("not-an-email")).toBeInTheDocument();
  });
});
