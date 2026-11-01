import { describe, it, expect, afterEach, vi } from "vitest";
import {
  focusItemErrorField,
  isTypingInField,
} from "@/src/utils/focus-item-error";

afterEach(() => {
  document.body.innerHTML = "";
});

function champ(html) {
  document.body.insertAdjacentHTML("beforeend", html);
  return document.body.lastElementChild;
}

describe("isTypingInField", () => {
  it("reconnaît les champs de saisie de texte", () => {
    expect(isTypingInField(champ('<input type="text" />'))).toBe(true);
    expect(isTypingInField(champ("<input />"))).toBe(true);
    expect(isTypingInField(champ('<input type="number" />'))).toBe(true);
    expect(isTypingInField(champ("<textarea></textarea>"))).toBe(true);
  });

  it("ignore les boutons, cases à cocher et le corps de la page", () => {
    expect(isTypingInField(champ("<button>Créer</button>"))).toBe(false);
    expect(isTypingInField(champ('<input type="checkbox" />'))).toBe(false);
    expect(isTypingInField(champ('<input type="submit" />'))).toBe(false);
    expect(isTypingInField(document.body)).toBe(false);
    expect(isTypingInField(null)).toBe(false);
  });
});

describe("focusItemErrorField", () => {
  it("sélectionne le champ en erreur quand rien n'est en cours de saisie (clic sur « Créer »)", () => {
    const bouton = champ("<button>Créer le devis</button>");
    const erreur = champ('<input name="items.0.description" />');
    erreur.scrollIntoView = vi.fn();
    bouton.focus();
    expect(focusItemErrorField(erreur)).toBe(true);
    expect(document.activeElement).toBe(erreur);
    expect(erreur.scrollIntoView).toHaveBeenCalled();
  });

  it("ne prend pas le focus d'un champ où l'utilisateur écrit (sa saisie partirait dans le champ en erreur)", () => {
    const erreur = champ('<input name="items.0.description" />');
    const prix = champ('<input name="items.0.unitPrice" />');
    erreur.scrollIntoView = vi.fn();
    prix.focus();
    expect(focusItemErrorField(erreur)).toBe(false);
    expect(document.activeElement).toBe(prix);
    expect(erreur.scrollIntoView).not.toHaveBeenCalled();
  });

  it("sans champ trouvé, ne fait rien", () => {
    expect(focusItemErrorField(null)).toBe(false);
  });
});
