import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PlanForm, PLANS } from "@/src/components/create-workspace/plan-form";

describe("PlanForm — PLANS export", () => {
  it("exposes 3 plans: freelance, pme, entreprise", () => {
    expect(PLANS).toHaveLength(3);
    expect(PLANS.map((p) => p.key)).toEqual(["freelance", "pme", "entreprise"]);
  });

  it("PME is flagged as popular", () => {
    const pme = PLANS.find((p) => p.key === "pme");
    expect(pme.popular).toBe(true);
  });

  it("annual price is ~10% lower than monthly", () => {
    for (const p of PLANS) {
      const ratio = p.annualPrice / p.monthlyPrice;
      expect(ratio).toBeGreaterThan(0.85);
      expect(ratio).toBeLessThan(0.95);
    }
  });
});

describe("PlanForm UI", () => {
  it("renders the title and 3 plan cards", () => {
    render(
      <PlanForm
        selectedPlan="pme"
        setSelectedPlan={vi.fn()}
        isAnnual={true}
        setIsAnnual={vi.fn()}
        onContinue={vi.fn()}
      />,
    );
    expect(screen.getByText("Choisissez votre abonnement")).toBeInTheDocument();
    expect(screen.getByText("Freelance")).toBeInTheDocument();
    expect(screen.getByText("PME")).toBeInTheDocument();
    expect(screen.getByText("Entreprise")).toBeInTheDocument();
  });

  it("Continue is disabled when no plan selected", () => {
    render(
      <PlanForm
        selectedPlan={null}
        setSelectedPlan={vi.fn()}
        isAnnual={true}
        setIsAnnual={vi.fn()}
        onContinue={vi.fn()}
      />,
    );
    expect(screen.getByText("Continuer")).toBeDisabled();
  });

  it("Continue is enabled with selected plan", () => {
    render(
      <PlanForm
        selectedPlan="pme"
        setSelectedPlan={vi.fn()}
        isAnnual={true}
        setIsAnnual={vi.fn()}
        onContinue={vi.fn()}
      />,
    );
    expect(screen.getByText("Continuer")).not.toBeDisabled();
  });

  it("toggle Mensuel calls setIsAnnual(false)", () => {
    const setIsAnnual = vi.fn();
    render(
      <PlanForm
        selectedPlan="pme"
        setSelectedPlan={vi.fn()}
        isAnnual={true}
        setIsAnnual={setIsAnnual}
        onContinue={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Mensuel"));
    expect(setIsAnnual).toHaveBeenCalledWith(false);
  });

  it("toggle Annuel calls setIsAnnual(true)", () => {
    const setIsAnnual = vi.fn();
    render(
      <PlanForm
        selectedPlan="pme"
        setSelectedPlan={vi.fn()}
        isAnnual={false}
        setIsAnnual={setIsAnnual}
        onContinue={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Annuel"));
    expect(setIsAnnual).toHaveBeenCalledWith(true);
  });

  it("clicking a plan card calls setSelectedPlan", () => {
    const setSelectedPlan = vi.fn();
    render(
      <PlanForm
        selectedPlan="pme"
        setSelectedPlan={setSelectedPlan}
        isAnnual={true}
        setIsAnnual={vi.fn()}
        onContinue={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Freelance"));
    expect(setSelectedPlan).toHaveBeenCalledWith("freelance");
  });

  it("displays annual price when isAnnual=true", () => {
    render(
      <PlanForm
        selectedPlan="freelance"
        setSelectedPlan={vi.fn()}
        isAnnual={true}
        setIsAnnual={vi.fn()}
        onContinue={vi.fn()}
      />,
    );
    // 16,19 €/mois facturé annuellement
    expect(
      screen.getByText(/16,19.*facturé annuellement/i),
    ).toBeInTheDocument();
  });

  it("displays monthly price when isAnnual=false", () => {
    render(
      <PlanForm
        selectedPlan="freelance"
        setSelectedPlan={vi.fn()}
        isAnnual={false}
        setIsAnnual={vi.fn()}
        onContinue={vi.fn()}
      />,
    );
    expect(
      screen.getByText(/17,99.*facturé mensuellement/i),
    ).toBeInTheDocument();
  });

  it("shows the 'Populaire' badge on PME plan", () => {
    render(
      <PlanForm
        selectedPlan={null}
        setSelectedPlan={vi.fn()}
        isAnnual={true}
        setIsAnnual={vi.fn()}
        onContinue={vi.fn()}
      />,
    );
    expect(screen.getByText("Populaire")).toBeInTheDocument();
  });

  it("calls onContinue when Continue clicked", () => {
    const onContinue = vi.fn();
    render(
      <PlanForm
        selectedPlan="pme"
        setSelectedPlan={vi.fn()}
        isAnnual={true}
        setIsAnnual={vi.fn()}
        onContinue={onContinue}
      />,
    );
    fireEvent.click(screen.getByText("Continuer"));
    expect(onContinue).toHaveBeenCalled();
  });
});
