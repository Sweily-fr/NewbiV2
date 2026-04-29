import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  getActiveOrganization: vi.fn(),
  updateOrganization: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/src/lib/organization-client", () => ({
  getActiveOrganization: (...args) => mocks.getActiveOrganization(...args),
  updateOrganization: (...args) => mocks.updateOrganization(...args),
}));

vi.mock("@/src/components/ui/sonner", () => ({
  toast: {
    success: (...args) => mocks.toastSuccess(...args),
    error: (...args) => mocks.toastError(...args),
  },
}));

import { QuickEditCompanyModal } from "@/src/components/invoice/quick-edit-company-modal";

const org = {
  id: "org_1",
  companyName: "MyCompany",
  companyEmail: "x@example.com",
  companyPhone: "01",
  siret: "123456789AB123",
  vatNumber: "FR1",
  addressStreet: "1 rue",
  addressCity: "Paris",
  addressZipCode: "75001",
  addressCountry: "France",
};

describe("QuickEditCompanyModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getActiveOrganization.mockResolvedValue(org);
    mocks.updateOrganization.mockResolvedValue({});
  });

  it("does not fetch the organization when closed", () => {
    render(<QuickEditCompanyModal open={false} onOpenChange={vi.fn()} />);
    expect(mocks.getActiveOrganization).not.toHaveBeenCalled();
  });

  it("loads and displays organization values when opened", async () => {
    render(<QuickEditCompanyModal open={true} onOpenChange={vi.fn()} />);
    await waitFor(() => {
      expect(mocks.getActiveOrganization).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByDisplayValue("MyCompany")).toBeInTheDocument();
    });
  });

  it("submits with computed siren prefix", async () => {
    const onCompanyUpdated = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <QuickEditCompanyModal
        open={true}
        onOpenChange={onOpenChange}
        onCompanyUpdated={onCompanyUpdated}
      />,
    );
    await waitFor(() =>
      expect(screen.getByDisplayValue("MyCompany")).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByRole("button", { name: /Enregistrer/i }));
    await waitFor(() => {
      expect(mocks.updateOrganization).toHaveBeenCalled();
    });
    const [orgId, input] = mocks.updateOrganization.mock.calls[0];
    expect(orgId).toBe("org_1");
    expect(input.siren).toBe("123456789");
    expect(input.companyName).toBe("MyCompany");
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(mocks.toastSuccess).toHaveBeenCalled();
    });
  });

  it("shows an error toast on failure", async () => {
    mocks.updateOrganization.mockRejectedValue(new Error("DB down"));
    render(<QuickEditCompanyModal open={true} onOpenChange={vi.fn()} />);
    await waitFor(() =>
      expect(screen.getByDisplayValue("MyCompany")).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByRole("button", { name: /Enregistrer/i }));
    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith("DB down");
    });
  });

  it("shows error when organization id is missing", async () => {
    mocks.getActiveOrganization.mockResolvedValue({ ...org, id: undefined });
    render(<QuickEditCompanyModal open={true} onOpenChange={vi.fn()} />);
    await waitFor(() =>
      expect(screen.getByDisplayValue("MyCompany")).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByRole("button", { name: /Enregistrer/i }));
    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith("Organisation introuvable");
    });
  });

  it("calls onOpenChange(false) when Annuler is clicked", async () => {
    const onOpenChange = vi.fn();
    render(<QuickEditCompanyModal open={true} onOpenChange={onOpenChange} />);
    await waitFor(() =>
      expect(screen.getByDisplayValue("MyCompany")).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByRole("button", { name: /Annuler/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
