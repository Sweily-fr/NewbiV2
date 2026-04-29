import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmailReminderToggle } from "@/src/components/email-reminder-toggle";

describe("EmailReminderToggle", () => {
  it("renders the 'Rappel par email' label", () => {
    render(<EmailReminderToggle value={null} onChange={vi.fn()} />);
    expect(screen.getByText(/Rappel par email/i)).toBeInTheDocument();
  });

  it("toggles the checkbox and calls onChange when checkbox is clicked", () => {
    const onChange = vi.fn();
    render(<EmailReminderToggle value={null} onChange={onChange} />);
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(onChange).toHaveBeenCalled();
    const arg = onChange.mock.calls[0][0];
    expect(arg.enabled).toBe(true);
  });

  it("does not show extra options when not enabled", () => {
    render(
      <EmailReminderToggle
        value={{ enabled: false, anticipation: null, echeance: null }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.queryByText(/Rappel anticipé/i)).not.toBeInTheDocument();
  });

  it("shows extra options when enabled", () => {
    render(
      <EmailReminderToggle
        value={{ enabled: true, anticipation: null, echeance: null }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText(/Rappel anticipé/i)).toBeInTheDocument();
    expect(screen.getByText(/À l'échéance/i)).toBeInTheDocument();
  });

  it("does not show 'À l'échéance' when allDay is true", () => {
    render(
      <EmailReminderToggle
        value={{ enabled: true, anticipation: null, echeance: null }}
        onChange={vi.fn()}
        allDay={true}
      />,
    );
    expect(screen.getByText(/Rappel anticipé/i)).toBeInTheDocument();
    expect(screen.queryByText(/À l'échéance/i)).not.toBeInTheDocument();
  });

  it("disables the checkbox when disabled prop is true", () => {
    render(
      <EmailReminderToggle
        value={{ enabled: false }}
        onChange={vi.fn()}
        disabled={true}
      />,
    );
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeDisabled();
  });

  it("displays summary text when enabled with anticipation", () => {
    render(
      <EmailReminderToggle
        value={{ enabled: true, anticipation: "1h", echeance: null }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText(/Vous recevrez un email/i)).toBeInTheDocument();
  });

  it("syncs from external value updates (rerender)", () => {
    const { rerender } = render(
      <EmailReminderToggle value={{ enabled: false }} onChange={vi.fn()} />,
    );
    expect(screen.queryByText(/Rappel anticipé/i)).not.toBeInTheDocument();
    rerender(
      <EmailReminderToggle
        value={{ enabled: true, anticipation: null, echeance: null }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText(/Rappel anticipé/i)).toBeInTheDocument();
  });
});
