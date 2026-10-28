import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

import { LinkedItemSheet } from "@/app/dashboard/calendar/components/linked-item-sheet";
import { FiscalSetupMenuItem } from "@/app/dashboard/calendar/components/fiscal-setup-hint";
import {
  DropdownMenu,
  DropdownMenuContent,
} from "@/src/components/ui/dropdown-menu";

// Ligne du menu « Filtres », rendue menu ouvert
const inMenu = (setup) => (
  <DropdownMenu open>
    <DropdownMenuContent>
      <FiscalSetupMenuItem setup={setup} />
    </DropdownMenuContent>
  </DropdownMenu>
);

/**
 * Calendrier : fiche d'une échéance fiscale (lien vers la page officielle,
 * date indicative) et invitation à compléter les informations légales.
 */

const item = {
  id: "FISCAL:VAT_RETURN_MONTHLY:2026-11-19",
  kind: "FISCAL",
  entityId: "VAT_RETURN_MONTHLY",
  day: "2026-11-19",
  title: "Déclaration de TVA (CA3)",
  reference: "Octobre 2026",
  counterparty: "Service des impôts des entreprises",
  amount: null,
  currency: null,
  state: "UPCOMING",
  documentStatus: "DECLARATION_PAYMENT",
  infoUrl: "https://www.impots.gouv.fr/professionnel/tva",
  isIndicative: true,
  isConditional: true,
  note: "La date exacte figure dans votre espace professionnel.",
};

describe("fiche d'une échéance fiscale", () => {
  it("période, organisme, mentions et lien externe vers la page officielle", () => {
    render(<LinkedItemSheet item={item} onClose={() => {}} />);
    const sheet = screen.getByRole("dialog");

    expect(within(sheet).getByText("Échéance fiscale")).toBeInTheDocument();
    expect(within(sheet).getByText("Date limite")).toBeInTheDocument();
    expect(within(sheet).getByText("Période")).toBeInTheDocument();
    expect(within(sheet).getByText("Organisme")).toBeInTheDocument();
    expect(
      within(sheet).getByText("Service des impôts des entreprises"),
    ).toBeInTheDocument();
    expect(within(sheet).getByText("Déclarer et payer")).toBeInTheDocument();
    expect(within(sheet).getByText("Date indicative")).toBeInTheDocument();
    expect(
      within(sheet).getByText("Selon votre situation"),
    ).toBeInTheDocument();
    expect(within(sheet).getByText(item.note)).toBeInTheDocument();

    const link = within(sheet).getByRole("link", {
      name: /Voir la page officielle/,
    });
    expect(link).toHaveAttribute("href", item.infoUrl);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    // Aucun lien interne vers une page de l'application
    expect(within(sheet).getAllByRole("link")).toHaveLength(1);
  });

  it("date passée : « Date passée », sans badge vert", () => {
    render(
      <LinkedItemSheet
        item={{ ...item, state: "DONE", isIndicative: false }}
        onClose={() => {}}
      />,
    );
    const badge = within(screen.getByRole("dialog")).getByText("Date passée");

    expect(badge.className).not.toMatch(/emerald/);
  });
});

describe("invitation à compléter les informations légales", () => {
  const setup = {
    complete: false,
    missing: [
      {
        code: "FISCAL_YEAR_END",
        label: "Renseignez la date de clôture de votre exercice comptable.",
        concerns: ["Impôt sur les sociétés"],
      },
    ],
  };

  it("ouvre les paramètres sur l'onglet des informations légales", () => {
    const listener = vi.fn();
    window.addEventListener("newbi:open-settings", listener);

    render(inMenu(setup));
    const item = screen.getByRole("menuitem", {
      name: /Compléter les informations légales/,
    });
    expect(item).toHaveTextContent("Non affichées : Impôt sur les sociétés.");
    expect(item).toHaveAttribute(
      "title",
      "Renseignez la date de clôture de votre exercice comptable.",
    );
    fireEvent.click(item);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail).toEqual({
      tab: "informations-legales",
    });
    window.removeEventListener("newbi:open-settings", listener);
  });

  it("rien quand toutes les informations sont là", () => {
    for (const complete of [{ complete: true, missing: [] }, null]) {
      const { unmount } = render(inMenu(complete));
      expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();
      unmount();
    }
  });
});
