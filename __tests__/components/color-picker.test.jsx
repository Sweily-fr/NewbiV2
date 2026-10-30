import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { ColorPicker } from "@/src/components/ui/color-picker";

const sansEffet = () => {};

describe("ColorPicker - nom du bouton pour les lecteurs d'écran", () => {
  it("nomme le bouton par ce qu'il règle, le code de la couleur entre parenthèses", () => {
    render(
      <ColorPicker
        label="Couleur du texte"
        color="#000000"
        onChange={sansEffet}
      />,
    );
    const bouton = screen.getByRole("button", {
      name: "Couleur du texte (000000)",
    });
    // Jamais de deux-points dans un nom accessible
    expect(bouton.getAttribute("aria-label")).not.toContain(":");
  });

  it("donne le code en majuscules, comme il est affiché", () => {
    render(
      <ColorPicker
        label="Couleur de fond du tableau"
        color="#5b4fff"
        onChange={sansEffet}
      />,
    );
    expect(
      screen.getByRole("button", {
        name: "Couleur de fond du tableau (5B4FFF)",
      }),
    ).toBeInTheDocument();
  });

  it("même nom en mode intégré (sans fenêtre)", () => {
    render(
      <ColorPicker
        inline
        label="Couleur des titres du tableau"
        color="#ffffff"
        onChange={sansEffet}
      />,
    );
    expect(
      screen.getByRole("button", {
        name: "Couleur des titres du tableau (FFFFFF)",
      }),
    ).toBeInTheDocument();
  });

  it("sans libellé, le bouton garde le code affiché pour nom", () => {
    render(<ColorPicker color="#ffffff" onChange={sansEffet} />);
    const bouton = screen.getByRole("button", { name: "FFFFFF" });
    expect(bouton.hasAttribute("aria-label")).toBe(false);
  });
});
