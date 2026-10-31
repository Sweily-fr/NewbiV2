import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuantityInput } from "@/src/components/ui/quantity-input";

const champ = () => screen.getByRole("textbox");

describe("QuantityInput : quantités décimales", () => {
  it.each([
    ["0,5", "0.5"],
    ["0,25", "0.25"],
    ["1,5", "1.5"],
  ])("« %s » est transmis tel quel (%s), pas ramené à 1", (saisie, attendu) => {
    const onChange = vi.fn();
    render(<QuantityInput value="2" onChange={onChange} />);

    fireEvent.change(champ(), { target: { value: saisie } });

    expect(onChange).toHaveBeenLastCalledWith({
      target: { name: undefined, value: attendu },
    });
  });

  it("« 0 » et « 0, » (frappe de 0,5) restent affichés sans être transmis", () => {
    const onChange = vi.fn();
    render(<QuantityInput value="2" onChange={onChange} />);

    fireEvent.change(champ(), { target: { value: "0" } });
    expect(champ()).toHaveValue("0");
    fireEvent.change(champ(), { target: { value: "0," } });
    expect(champ()).toHaveValue("0.");
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.change(champ(), { target: { value: "0,5" } });
    expect(onChange).toHaveBeenCalledWith({
      target: { name: undefined, value: "0.5" },
    });
  });

  it("laissée à 0, la saisie revient à la quantité enregistrée", () => {
    const onBlur = vi.fn();
    render(<QuantityInput value="2" onChange={vi.fn()} onBlur={onBlur} />);

    fireEvent.change(champ(), { target: { value: "0" } });
    fireEvent.blur(champ());

    expect(champ()).toHaveValue("2");
    expect(onBlur).toHaveBeenCalled();
  });

  it("le bouton - ne descend pas sous le minimum", () => {
    const onChange = vi.fn();
    render(<QuantityInput value="1" onChange={onChange} />);

    const [moins] = screen.getAllByRole("button");
    expect(moins).toBeDisabled();
  });
});
