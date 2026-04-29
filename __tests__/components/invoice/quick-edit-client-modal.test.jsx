import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  updateClient: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/src/graphql/clientQueries", () => ({
  useUpdateClient: () => ({
    updateClient: (...args) => mocks.updateClient(...args),
  }),
}));

vi.mock("@/src/components/ui/sonner", () => ({
  toast: {
    success: (...args) => mocks.toastSuccess(...args),
    error: (...args) => mocks.toastError(...args),
  },
}));

import { QuickEditClientModal } from "@/src/components/invoice/quick-edit-client-modal";

const mockClient = {
  id: "c_1",
  type: "BUSINESS",
  name: "Acme Corp",
  email: "contact@acme.com",
  phone: "0102030405",
  siret: "12345678901234",
  vatNumber: "FR123",
  address: {
    street: "1 rue de Paris",
    city: "Paris",
    postalCode: "75001",
    country: "France",
  },
};

describe("QuickEditClientModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when open is false", () => {
    render(
      <QuickEditClientModal
        open={false}
        onOpenChange={vi.fn()}
        client={mockClient}
      />,
    );
    expect(
      screen.queryByText(/Modifier les informations du client/i),
    ).not.toBeInTheDocument();
  });

  it("renders the modal with client values when open", async () => {
    render(
      <QuickEditClientModal
        open={true}
        onOpenChange={vi.fn()}
        client={mockClient}
      />,
    );
    expect(
      await screen.findByText(/Modifier les informations du client/i),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Acme Corp")).toBeInTheDocument();
    expect(screen.getByDisplayValue("contact@acme.com")).toBeInTheDocument();
  });

  it("calls onOpenChange(false) when Annuler is clicked", async () => {
    const onOpenChange = vi.fn();
    render(
      <QuickEditClientModal
        open={true}
        onOpenChange={onOpenChange}
        client={mockClient}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /Annuler/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("submits and calls updateClient with cleaned input", async () => {
    mocks.updateClient.mockResolvedValue({ id: "c_1", name: "Acme" });
    const onClientUpdated = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <QuickEditClientModal
        open={true}
        onOpenChange={onOpenChange}
        client={mockClient}
        onClientUpdated={onClientUpdated}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /Enregistrer/i }));

    await waitFor(() => {
      expect(mocks.updateClient).toHaveBeenCalled();
    });
    const [id, input] = mocks.updateClient.mock.calls[0];
    expect(id).toBe("c_1");
    expect(input.type).toBe("BUSINESS");
    expect(input.name).toBe("Acme Corp");
    expect(input.address.city).toBe("Paris");

    await waitFor(() => {
      expect(onClientUpdated).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(mocks.toastSuccess).toHaveBeenCalled();
    });
  });

  it("shows an error toast when update fails", async () => {
    mocks.updateClient.mockRejectedValue(new Error("Network error"));
    render(
      <QuickEditClientModal
        open={true}
        onOpenChange={vi.fn()}
        client={mockClient}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /Enregistrer/i }));
    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith("Network error");
    });
  });
});
