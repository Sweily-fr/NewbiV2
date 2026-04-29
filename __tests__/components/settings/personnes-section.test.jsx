import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PersonnesSection } from "@/src/components/settings/personnes-section";

describe("PersonnesSection", () => {
  it("renders the section title and helper text", () => {
    render(<PersonnesSection />);
    expect(screen.getByText("Rôles et permissions")).toBeInTheDocument();
    expect(screen.getByText("Gestion des rôles")).toBeInTheDocument();
  });

  it("renders the three default roles", () => {
    render(<PersonnesSection />);
    expect(screen.getByText("Owner")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Member")).toBeInTheDocument();
  });

  it("renders the right permissions count for each role", () => {
    render(<PersonnesSection />);
    // Owner has 1 permission, Admin has 2, Member has 1
    expect(screen.getAllByText(/permission\(s\)/i).length).toBe(3);
    expect(screen.getByText("2 permission(s)")).toBeInTheDocument();
  });

  it("renders an Edit button for every role", () => {
    render(<PersonnesSection />);
    const editButtons = screen.getAllByRole("button", { name: /Modifier/i });
    expect(editButtons.length).toBe(3);
  });

  it("does not render delete buttons for default roles", () => {
    render(<PersonnesSection />);
    // All 3 roles are isDefault=true so no Trash buttons
    const allButtons = screen.getAllByRole("button");
    // 3 Modifier + 1 Créer un nouveau rôle = 4
    expect(allButtons.length).toBe(4);
  });

  it("renders the create-role action button", () => {
    render(<PersonnesSection />);
    expect(
      screen.getByRole("button", { name: /Créer un nouveau rôle/i }),
    ).toBeInTheDocument();
  });
});
