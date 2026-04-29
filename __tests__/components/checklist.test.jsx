import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("uuid", () => ({
  v4: () => "fixed-uuid-1",
}));

import { Checklist } from "@/src/components/Checklist";

describe("Checklist", () => {
  it("renders the heading and add button when items are empty", () => {
    render(<Checklist items={[]} onChange={vi.fn()} />);
    expect(screen.getByText(/Checklist/i)).toBeInTheDocument();
    expect(screen.getByText(/Ajouter un item/i)).toBeInTheDocument();
  });

  it("renders the items list and progress count", () => {
    const items = [
      { id: "1", text: "Item 1", completed: true },
      { id: "2", text: "Item 2", completed: false },
    ];
    render(<Checklist items={items} onChange={vi.fn()} />);
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
    expect(screen.getByText(/1 sur 2/)).toBeInTheDocument();
  });

  it("opens an input when 'Ajouter un item' is clicked", () => {
    render(<Checklist items={[]} onChange={vi.fn()} />);
    fireEvent.click(screen.getByText(/Ajouter un item/i));
    expect(
      screen.getByPlaceholderText("New checklist item"),
    ).toBeInTheDocument();
  });

  it("calls onChange with new item when typing and pressing Enter", () => {
    const onChange = vi.fn();
    render(<Checklist items={[]} onChange={onChange} />);
    fireEvent.click(screen.getByText(/Ajouter un item/i));
    const input = screen.getByPlaceholderText("New checklist item");
    fireEvent.change(input, { target: { value: "New task" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith([
      {
        id: "fixed-uuid-1",
        text: "New task",
        completed: false,
      },
    ]);
  });

  it("toggles completion when clicking the circle", () => {
    const onChange = vi.fn();
    const items = [{ id: "1", text: "Task A", completed: false }];
    const { container } = render(
      <Checklist items={items} onChange={onChange} />,
    );
    // First button is the toggle for the item (the trash button is opacity-0)
    const buttons = container.querySelectorAll("button[type='button']");
    fireEvent.click(buttons[0]);
    expect(onChange).toHaveBeenCalledWith([
      { id: "1", text: "Task A", completed: true },
    ]);
  });

  it("deletes an item when delete button is clicked", () => {
    const onChange = vi.fn();
    const items = [
      { id: "1", text: "A", completed: false },
      { id: "2", text: "B", completed: false },
    ];
    render(<Checklist items={items} onChange={onChange} />);
    // Find the delete buttons (Trash icon) by being the last button per row
    const allButtons = screen.getAllByRole("button");
    // Each item has 2 buttons (toggle + trash); with 2 items total = 4 buttons + 1 add
    // Click the trash for item 1 = index 1
    fireEvent.click(allButtons[1]);
    expect(onChange).toHaveBeenCalledWith([
      { id: "2", text: "B", completed: false },
    ]);
  });

  it("does not add an item when text is empty (Escape clears)", () => {
    const onChange = vi.fn();
    render(<Checklist items={[]} onChange={onChange} />);
    fireEvent.click(screen.getByText(/Ajouter un item/i));
    const input = screen.getByPlaceholderText("New checklist item");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onChange).not.toHaveBeenCalled();
    expect(
      screen.queryByPlaceholderText("New checklist item"),
    ).not.toBeInTheDocument();
  });

  it("renders progress bar when items are present", () => {
    const items = [
      { id: "1", text: "x", completed: true },
      { id: "2", text: "y", completed: true },
    ];
    const { container } = render(
      <Checklist items={items} onChange={vi.fn()} />,
    );
    expect(screen.getByText(/2 sur 2 \(100%\)/)).toBeInTheDocument();
    const progressBar = container.querySelector('div[style*="width: 100%"]');
    expect(progressBar).toBeTruthy();
  });
});
