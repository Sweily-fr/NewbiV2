import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

const mockToastError = vi.fn();
vi.mock("@/src/components/ui/sonner", () => ({
  toast: {
    error: (...args) => mockToastError(...args),
  },
}));

vi.mock("@/src/utils/errorMessages", () => ({
  getErrorMessage: (err, ctx) => `MSG:${ctx}:${err?.message || err}`,
}));

import ErrorBoundary, {
  CriticalErrorBoundary,
} from "@/src/components/ErrorBoundary";

function ProblemChild({ shouldThrow }) {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div data-testid="ok">All good</div>;
}

describe("ErrorBoundary", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    mockToastError.mockClear();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("renders children when no error is thrown", () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId("ok")).toBeInTheDocument();
  });

  it("catches errors and renders the default fallback UI", () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/Une erreur s'est produite/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Réessayer/i }),
    ).toBeInTheDocument();
  });

  it("calls toast.error and onError prop when an error is caught", () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError} context="banking">
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(mockToastError).toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
    const callArg = onError.mock.calls[0][0];
    expect(callArg).toBeInstanceOf(Error);
  });

  it("renders a custom fallback when fallback prop is provided", () => {
    const fallback = (error, retry) => (
      <div>
        <p>Custom fallback: {error?.message}</p>
        <button onClick={retry}>Custom retry</button>
      </div>
    );
    render(
      <ErrorBoundary fallback={fallback}>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/Custom fallback/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Custom retry/i }),
    ).toBeInTheDocument();
  });

  it.skip("retry button resets the error state", () => {
    const Wrapper = ({ shouldThrow }) => (
      <ErrorBoundary>
        <ProblemChild shouldThrow={shouldThrow} />
      </ErrorBoundary>
    );
    const { rerender } = render(<Wrapper shouldThrow={true} />);
    expect(screen.getByText(/Une erreur s'est produite/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Réessayer/i }));
    rerender(<Wrapper shouldThrow={false} />);
    expect(screen.getByTestId("ok")).toBeInTheDocument();
  });
});

describe("CriticalErrorBoundary", () => {
  let consoleErrorSpy;
  beforeEach(() => {
    mockToastError.mockClear();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("renders the critical fallback UI on error", () => {
    render(
      <CriticalErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </CriticalErrorBoundary>,
    );
    expect(
      screen.getByText(/Fonctionnalité temporairement indisponible/i),
    ).toBeInTheDocument();
  });

  it("renders children when no error", () => {
    render(
      <CriticalErrorBoundary>
        <div data-testid="critical-ok">OK</div>
      </CriticalErrorBoundary>,
    );
    expect(screen.getByTestId("critical-ok")).toBeInTheDocument();
  });
});
