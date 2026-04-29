import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorAlert } from "@/src/components/invoice/error-alert";

describe("ErrorAlert", () => {
  it("renders the title and message", () => {
    render(<ErrorAlert title="Oops" message="Something went wrong" />);
    expect(screen.getByText("Oops")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("does not render an edit button when onEdit is not provided", () => {
    render(<ErrorAlert title="X" message="Y" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders the edit button with default label when onEdit is provided", () => {
    render(<ErrorAlert title="X" message="Y" onEdit={() => {}} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.getByText("Modifier")).toBeInTheDocument();
  });

  it("renders a custom edit label", () => {
    render(
      <ErrorAlert
        title="X"
        message="Y"
        onEdit={() => {}}
        editLabel="Réessayer"
      />,
    );
    expect(screen.getByText("Réessayer")).toBeInTheDocument();
  });

  it("calls onEdit when the edit button is clicked", async () => {
    const onEdit = vi.fn();
    render(<ErrorAlert title="X" message="Y" onEdit={onEdit} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });
});
