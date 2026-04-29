import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockSetColorblindMode = vi.fn();
let mockColorblindMode = false;

vi.mock("@/src/components/theme-provider", () => ({
  useTheme: () => ({
    colorblindMode: mockColorblindMode,
    setColorblindMode: mockSetColorblindMode,
  }),
}));

import ColorblindModeComponent from "@/src/components/colorblind-mode";

describe("ColorblindMode", () => {
  beforeEach(() => {
    mockSetColorblindMode.mockClear();
    mockColorblindMode = false;
  });

  it("renders both Standard and Daltonien options", () => {
    render(<ColorblindModeComponent />);
    expect(screen.getByText("Standard")).toBeInTheDocument();
    expect(screen.getByText("Daltonien")).toBeInTheDocument();
  });

  it("renders the legend label", () => {
    render(<ColorblindModeComponent />);
    expect(screen.getByText(/Mode daltonien/i)).toBeInTheDocument();
  });

  it("displays the description text", () => {
    render(<ColorblindModeComponent />);
    expect(
      screen.getByText(/Applique uniquement aux graphiques/i),
    ).toBeInTheDocument();
  });

  it("calls setColorblindMode(true) when Daltonien is selected", () => {
    render(<ColorblindModeComponent />);
    const daltonienRadio = screen.getByLabelText(/Daltonien/i);
    fireEvent.click(daltonienRadio);
    expect(mockSetColorblindMode).toHaveBeenCalledWith(true);
  });

  it("renders standard description", () => {
    render(<ColorblindModeComponent />);
    expect(screen.getByText("Vert et rouge")).toBeInTheDocument();
    expect(screen.getByText("Bleu et noir")).toBeInTheDocument();
  });
});
