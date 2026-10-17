import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import CategorySearchSelect, {
  searchCategoryGroups,
} from "@/src/components/category-search-select";
import { EXPENSE_CATEGORY_GROUPS } from "@/lib/category-icons-config";

/**
 * Sélecteur de catégorie (Transactions, Factures d'achat, Prévision) : pendant
 * une recherche, une catégorie qui commence par la saisie passe devant une
 * catégorie qui la contient seulement, y compris d'un groupe à l'autre. cmdk ne
 * réordonne pas les groupes : « tel » + Entrée choisissait Hôtel au lieu de
 * Téléphone, « forma » + Entrée Matériel informatique au lieu de Formation.
 */

const values = (groups) =>
  groups.map((group) => group.options.map((option) => option.value));

describe("searchCategoryGroups", () => {
  const GROUPS = [
    {
      heading: "Déplacements",
      options: [
        { value: "hotel", label: "Hôtel" },
        { value: "train", label: "Train" },
      ],
    },
    {
      heading: "Communication",
      options: [
        { value: "mobile", label: "Mobile et téléphone" },
        { value: "telephone", label: "Téléphone" },
        { value: "telecopie", label: "Télécopie" },
      ],
    },
    { heading: "Divers", options: [{ value: "autre", label: "Autre" }] },
  ];

  it("préfixe avant contient, dans un groupe et d'un groupe à l'autre", () => {
    const groups = searchCategoryGroups(GROUPS, "tel");
    expect(groups.map((group) => group.heading)).toEqual([
      "Communication",
      "Déplacements",
    ]);
    // À score égal, l'ordre du référentiel est gardé
    expect(values(groups)).toEqual([
      ["telephone", "telecopie", "mobile"],
      ["hotel"],
    ]);
  });

  it("sans saisie : tous les groupes, dans l'ordre", () => {
    expect(searchCategoryGroups(GROUPS, "")).toBe(GROUPS);
    expect(searchCategoryGroups(GROUPS, "  ")).toBe(GROUPS);
  });

  // Seule la tête est vérifiée : l'ajout d'une catégorie au référentiel ne
  // doit pas casser ce test (l'ordre complet est couvert par GROUPS)
  it("référentiel réel : « tel » donne Téléphone, « forma » Formation", () => {
    expect(
      values(searchCategoryGroups(EXPENSE_CATEGORY_GROUPS, "tel"))[0][0],
    ).toBe("telephone");
    expect(
      values(searchCategoryGroups(EXPENSE_CATEGORY_GROUPS, "forma"))[0][0],
    ).toBe("formation");
    // Sans accents ni casse
    expect(
      values(searchCategoryGroups(EXPENSE_CATEGORY_GROUPS, "TÉL"))[0][0],
    ).toBe("telephone");
  });
});

describe("CategorySearchSelect : saisie + Entrée", () => {
  const PLACEHOLDER = "Rechercher une catégorie...";
  const highlighted = () =>
    document.querySelector('[cmdk-item][aria-selected="true"]');

  async function openAndType(query, props = {}) {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <CategorySearchSelect
        value=""
        onValueChange={onValueChange}
        {...props}
      />,
    );
    await user.click(screen.getByRole("combobox"));
    await user.type(await screen.findByPlaceholderText(PLACEHOLDER), query);
    return { user, onValueChange };
  }

  it.each([
    ["tel", "Téléphone", "telephone"],
    ["forma", "Formation", "formation"],
  ])(
    "« %s » affiche et surligne %s en premier, Entrée le choisit",
    async (query, label, value) => {
      const { user, onValueChange } = await openAndType(query);
      await waitFor(() => expect(highlighted()).toHaveTextContent(label));
      expect(screen.getAllByRole("option")[0]).toHaveTextContent(label);
      await user.keyboard("{Enter}");
      expect(onValueChange).toHaveBeenLastCalledWith(value);
    },
  );

  it("Entrée sur la catégorie déjà cochée la retire (chaîne vide)", async () => {
    const { user, onValueChange } = await openAndType("tel", {
      value: "telephone",
    });
    await waitFor(() => expect(highlighted()).toHaveTextContent("Téléphone"));
    await user.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith("");
  });

  it("à la réouverture, la recherche repart de zéro", async () => {
    const { user } = await openAndType("forma");
    await user.keyboard("{Enter}");
    await waitFor(() =>
      expect(screen.queryByPlaceholderText(PLACEHOLDER)).toBeNull(),
    );
    await user.click(screen.getByRole("combobox"));
    expect(await screen.findByPlaceholderText(PLACEHOLDER)).toHaveValue("");
    expect(screen.getAllByRole("option")).toHaveLength(
      EXPENSE_CATEGORY_GROUPS.flatMap((group) => group.options).length,
    );
  });
});
