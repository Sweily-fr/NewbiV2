import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import {
  AnalyticsDateFilter,
  getDateRangeForPreset,
} from "@/app/dashboard/outils/analytiques/components/analytics-date-filter";

function renderFilter(overrides = {}) {
  const props = {
    period: "current_year",
    onPeriodChange: vi.fn(),
    dateRange: getDateRangeForPreset("current_year"),
    onDateRangeChange: vi.fn(),
    ...overrides,
  };
  const utils = render(<AnalyticsDateFilter {...props} />);
  return { ...utils, props };
}

function openPopover() {
  fireEvent.click(screen.getByRole("button", { name: /Année en cours/ }));
}

describe("AnalyticsDateFilter - période personnalisée", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("propose un raccourci « Période personnalisée » à côté des presets", () => {
    renderFilter();
    openPopover();
    expect(
      screen.getByRole("button", { name: "Période personnalisée" }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Date de début")).not.toBeInTheDocument();
  });

  it("passe en mode personnalisé et affiche les champs Du / Au pré-remplis", () => {
    const { props, rerender } = renderFilter();
    openPopover();
    fireEvent.click(screen.getByRole("button", { name: "Période personnalisée" }));
    expect(props.onPeriodChange).toHaveBeenCalledWith("custom");
    // La période appliquée reste celle en cours tant que rien n'est saisi
    expect(props.onDateRangeChange).not.toHaveBeenCalled();

    rerender(<AnalyticsDateFilter {...props} period="custom" />);
    const start = screen.getByLabelText("Date de début");
    const end = screen.getByLabelText("Date de fin");
    expect(start.value).toBe(props.dateRange.startDate);
    expect(end.value).toBe(props.dateRange.endDate);
  });

  it("applique une plage saisie à la main quand les deux bornes sont valides", () => {
    const { props } = renderFilter({
      period: "custom",
      dateRange: { startDate: "2026-03-01", endDate: "2026-03-31" },
    });
    fireEvent.click(screen.getByRole("button", { name: /01 mars 2026/ }));
    fireEvent.change(screen.getByLabelText("Date de début"), {
      target: { value: "2026-02-10" },
    });
    expect(props.onDateRangeChange).toHaveBeenLastCalledWith({
      startDate: "2026-02-10",
      endDate: "2026-03-31",
    });
    fireEvent.change(screen.getByLabelText("Date de fin"), {
      target: { value: "2026-04-15" },
    });
    expect(props.onDateRangeChange).toHaveBeenLastCalledWith({
      startDate: "2026-02-10",
      endDate: "2026-04-15",
    });
  });

  it("refuse une date de fin antérieure à la date de début", () => {
    const { props } = renderFilter({
      period: "custom",
      dateRange: { startDate: "2026-03-01", endDate: "2026-03-31" },
    });
    fireEvent.click(screen.getByRole("button", { name: /01 mars 2026/ }));
    fireEvent.change(screen.getByLabelText("Date de fin"), {
      target: { value: "2026-02-01" },
    });
    expect(props.onDateRangeChange).not.toHaveBeenCalled();
    expect(
      screen.getByText(/La date de fin doit être postérieure/),
    ).toBeInTheDocument();
  });

  it("affiche la plage appliquée dans le bouton en mode personnalisé", () => {
    renderFilter({
      period: "custom",
      dateRange: { startDate: "2026-01-05", endDate: "2026-02-20" },
    });
    expect(
      screen.getByRole("button", { name: /05 janv\. 2026 - 20 févr\. 2026/ }),
    ).toBeInTheDocument();
  });

  it("revient à un preset et ferme les champs personnalisés", () => {
    const { props } = renderFilter({
      period: "custom",
      dateRange: { startDate: "2026-01-05", endDate: "2026-02-20" },
    });
    fireEvent.click(screen.getByRole("button", { name: /05 janv/ }));
    fireEvent.click(screen.getByRole("button", { name: "Mois en cours" }));
    expect(props.onPeriodChange).toHaveBeenCalledWith("current_month");
    expect(props.onDateRangeChange).toHaveBeenCalledWith(
      getDateRangeForPreset("current_month"),
    );
  });
});
