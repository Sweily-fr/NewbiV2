import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/src/utils/errorMessages", () => ({
  getErrorMessage: (err, ctx) =>
    typeof err === "string" ? err : err?.message || "default error",
}));

import {
  ErrorMessage,
  FormErrorMessage,
  FormErrorSummary,
  LoadingErrorMessage,
  NetworkErrorMessage,
} from "@/src/components/ErrorMessage";

describe("ErrorMessage", () => {
  it("returns null when error is falsy", () => {
    const { container } = render(<ErrorMessage error={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a string error message", () => {
    render(<ErrorMessage error="Something went wrong" />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders error from object using getErrorMessage", () => {
    render(<ErrorMessage error={{ message: "boom" }} />);
    expect(screen.getByText("boom")).toBeInTheDocument();
  });

  it("renders dismiss button when onDismiss is passed and fires it", () => {
    const onDismiss = vi.fn();
    const { container } = render(
      <ErrorMessage error="X" onDismiss={onDismiss} />,
    );
    const dismissButton = container.querySelector("button");
    fireEvent.click(dismissButton);
    expect(onDismiss).toHaveBeenCalled();
  });

  it("does not render dismiss button when onDismiss is null", () => {
    const { container } = render(<ErrorMessage error="X" />);
    expect(container.querySelector("button")).toBeNull();
  });

  it("supports warning, info and success variants", () => {
    const { rerender, container } = render(
      <ErrorMessage error="W" variant="warning" />,
    );
    expect(container.querySelector(".bg-yellow-50")).toBeTruthy();

    rerender(<ErrorMessage error="I" variant="info" />);
    expect(container.querySelector(".bg-blue-50")).toBeTruthy();

    rerender(<ErrorMessage error="S" variant="success" />);
    expect(container.querySelector(".bg-green-50")).toBeTruthy();
  });
});

describe("FormErrorMessage", () => {
  it("returns null when no errors", () => {
    const { container } = render(
      <FormErrorMessage errors={null} fieldName="name" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("returns null when fieldName not in errors", () => {
    const { container } = render(
      <FormErrorMessage errors={{ other: "x" }} fieldName="name" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the error message for the field", () => {
    render(<FormErrorMessage errors={{ name: "Required" }} fieldName="name" />);
    expect(screen.getByText("Required")).toBeInTheDocument();
  });
});

describe("FormErrorSummary", () => {
  it("returns null for empty errors", () => {
    const { container } = render(<FormErrorSummary errors={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders all errors with field display names", () => {
    render(
      <FormErrorSummary
        errors={{
          email: "Invalid",
          name: "Required",
        }}
      />,
    );
    expect(screen.getByText(/corriger les erreurs/i)).toBeInTheDocument();
    expect(screen.getByText("Email:")).toBeInTheDocument();
    expect(screen.getByText("Nom:")).toBeInTheDocument();
  });
});

describe("LoadingErrorMessage", () => {
  it("renders error and retry button", () => {
    const onRetry = vi.fn();
    render(<LoadingErrorMessage error="Network error" onRetry={onRetry} />);
    expect(screen.getByText(/Impossible de charger/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Réessayer/i }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("does not render retry button when onRetry is null", () => {
    render(<LoadingErrorMessage error="Network error" />);
    expect(
      screen.queryByRole("button", { name: /Réessayer/i }),
    ).not.toBeInTheDocument();
  });
});

describe("NetworkErrorMessage", () => {
  it("renders network error message", () => {
    render(<NetworkErrorMessage />);
    expect(screen.getByText(/Problème de connexion/i)).toBeInTheDocument();
  });

  it("renders retry button when onRetry is passed", () => {
    const onRetry = vi.fn();
    render(<NetworkErrorMessage onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: /Réessayer/i }));
    expect(onRetry).toHaveBeenCalled();
  });
});
