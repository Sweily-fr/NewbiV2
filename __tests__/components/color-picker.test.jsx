import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

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

describe("ColorPicker - la couleur enregistrée n'est jamais modifiée en silence", () => {
  it("ouvrir le sélecteur ne change pas la couleur (pas d'arrondi HSV)", () => {
    const onChange = vi.fn();
    render(
      <ColorPicker
        inline
        label="Couleur de fond du tableau"
        color="#5b50FF"
        onChange={onChange}
      />,
    );
    expect(onChange).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", {
        name: "Couleur de fond du tableau (5B50FF)",
      }),
    ).toBeInTheDocument();
  });

  it("un préréglage choisi est transmis tel quel, une seule fois", () => {
    const onChange = vi.fn();
    render(<ColorPicker inline color="#5b50FF" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "5B50FF" }));
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTitle("#FF3B30"));
    expect(onChange.mock.calls).toEqual([["#FF3B30"]]);
  });

  it("déplacer la teinte change la couleur", () => {
    const onChange = vi.fn();
    render(<ColorPicker inline color="#5b50FF" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "5B50FF" }));
    fireEvent.change(screen.getByRole("slider"), { target: { value: "120" } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toMatch(/^#[0-9A-F]{6}$/);
    expect(onChange.mock.calls[0][0]).not.toBe("#5B50FF");
  });
});
