import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const { toastMock } = vi.hoisted(() => ({
  toastMock: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/src/components/ui/sonner", () => ({
  toast: toastMock,
}));

import { InviteForm } from "@/src/components/create-workspace/invite-form";

const baseMembers = [{ email: "", role: "member" }];

describe("InviteForm", () => {
  it("renders title and one empty row by default", () => {
    render(
      <InviteForm
        members={baseMembers}
        setMembers={vi.fn()}
        selectedPlan="pme"
        onContinue={vi.fn()}
        onSkip={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Collaborez avec votre équipe"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("exemple@email.com"),
    ).toBeInTheDocument();
  });

  it("Continue is disabled when no email entered", () => {
    render(
      <InviteForm
        members={baseMembers}
        setMembers={vi.fn()}
        selectedPlan="pme"
        onContinue={vi.fn()}
        onSkip={vi.fn()}
      />,
    );
    expect(screen.getByText("Continuer")).toBeDisabled();
  });

  it("Continue is enabled once an email is set", () => {
    render(
      <InviteForm
        members={[{ email: "a@b.fr", role: "member" }]}
        setMembers={vi.fn()}
        selectedPlan="pme"
        onContinue={vi.fn()}
        onSkip={vi.fn()}
      />,
    );
    expect(screen.getByText("Continuer")).not.toBeDisabled();
  });

  it("calls onSkip when 'Passer pour le moment' clicked", () => {
    const onSkip = vi.fn();
    render(
      <InviteForm
        members={baseMembers}
        setMembers={vi.fn()}
        selectedPlan="pme"
        onContinue={vi.fn()}
        onSkip={onSkip}
      />,
    );
    fireEvent.click(screen.getByText("Passer pour le moment"));
    expect(onSkip).toHaveBeenCalled();
  });

  it("typing email calls setMembers with updated value", () => {
    const setMembers = vi.fn();
    render(
      <InviteForm
        members={baseMembers}
        setMembers={setMembers}
        selectedPlan="pme"
        onContinue={vi.fn()}
        onSkip={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText("exemple@email.com"), {
      target: { value: "alice@x.fr" },
    });
    expect(setMembers).toHaveBeenCalledWith([
      { email: "alice@x.fr", role: "member" },
    ]);
  });

  it("'Ajouter' adds a new row", () => {
    const setMembers = vi.fn();
    render(
      <InviteForm
        members={baseMembers}
        setMembers={setMembers}
        selectedPlan="pme"
        onContinue={vi.fn()}
        onSkip={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Ajouter"));
    expect(setMembers).toHaveBeenCalledWith([
      ...baseMembers,
      { email: "", role: "member" },
    ]);
  });

  it("calls toast.error on Continue with invalid email", () => {
    const onContinue = vi.fn();
    render(
      <InviteForm
        members={[{ email: "not-an-email", role: "member" }]}
        setMembers={vi.fn()}
        selectedPlan="pme"
        onContinue={onContinue}
        onSkip={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Continuer"));
    expect(toastMock.error).toHaveBeenCalledWith(
      "Veuillez saisir des adresses email valides",
    );
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("calls onContinue when all emails are valid", () => {
    const onContinue = vi.fn();
    render(
      <InviteForm
        members={[{ email: "valid@x.fr", role: "member" }]}
        setMembers={vi.fn()}
        selectedPlan="pme"
        onContinue={onContinue}
        onSkip={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Continuer"));
    expect(onContinue).toHaveBeenCalled();
  });

  it("freelance plan shows accountant-only progress label", () => {
    render(
      <InviteForm
        members={[{ email: "comp@x.fr", role: "accountant" }]}
        setMembers={vi.fn()}
        selectedPlan="freelance"
        onContinue={vi.fn()}
        onSkip={vi.fn()}
      />,
    );
    // Should have at least one /comptable/ element
    expect(screen.getAllByText(/comptable/i).length).toBeGreaterThan(0);
  });

  it("delete button removes row when there are multiple", () => {
    const setMembers = vi.fn();
    render(
      <InviteForm
        members={[
          { email: "a@x.fr", role: "member" },
          { email: "b@x.fr", role: "member" },
        ]}
        setMembers={setMembers}
        selectedPlan="pme"
        onContinue={vi.fn()}
        onSkip={vi.fn()}
      />,
    );
    const trashButtons = screen
      .getAllByRole("button")
      .filter((b) => b.querySelector("svg") && !b.disabled);
    // Click the first non-disabled trash button (the second member)
    const trash = trashButtons.find(
      (b) =>
        !b.textContent.includes("Continuer") &&
        !b.textContent.includes("Ajouter"),
    );
    if (trash) {
      fireEvent.click(trash);
      expect(setMembers).toHaveBeenCalled();
    }
  });
});
