import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

const permissions = vi.hoisted(() => ({
  canViewVat: true,
  vatOpen: true,
  canViewUrssaf: true,
  urssafOpen: true,
}));
vi.mock("@/src/hooks/useMyPermissions", () => ({
  useMyPermissions: () => ({
    isReady: true,
    canDo: (module) => {
      if (module === "vat") return permissions.canViewVat;
      if (module === "urssaf") return permissions.canViewUrssaf;
      return true;
    },
  }),
}));
vi.mock("@/src/hooks/useWorkspaceFeatures", () => ({
  useWorkspaceFeatures: () => ({
    isReady: true,
    isEnabled: (feature) => {
      if (feature === "vat") return permissions.vatOpen;
      if (feature === "urssaf") return permissions.urssafOpen;
      return true;
    },
  }),
}));

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

describe("fiche d'une déclaration de TVA", () => {
  const vatItem = { ...item, vatPeriodKey: "2026-10", isDeclared: false };

  it("ouvre sa période dans la page TVA, en gardant la page officielle", () => {
    permissions.canViewVat = true;
    render(<LinkedItemSheet item={vatItem} onClose={() => {}} />);
    const sheet = screen.getByRole("dialog");
    expect(
      within(sheet).getByRole("link", { name: /Préparer la déclaration/ }),
    ).toHaveAttribute("href", "/dashboard/outils/tva?periode=2026-10");
    expect(
      within(sheet).getByRole("link", { name: /Voir la page officielle/ }),
    ).toHaveAttribute("href", item.infoUrl);
  });

  it("une fois confirmée : « Déclarée » et lien vers la déclaration", () => {
    permissions.canViewVat = true;
    render(
      <LinkedItemSheet
        item={{ ...vatItem, isDeclared: true, state: "DONE" }}
        onClose={() => {}}
      />,
    );
    const sheet = screen.getByRole("dialog");
    expect(within(sheet).getByText("Déclarée")).toBeInTheDocument();
    expect(
      within(sheet).getByRole("link", { name: /Voir la déclaration/ }),
    ).toBeInTheDocument();
  });

  it("sans le droit « Voir » de la page TVA : pas de lien vers elle", () => {
    permissions.canViewVat = false;
    render(<LinkedItemSheet item={vatItem} onClose={() => {}} />);
    const sheet = screen.getByRole("dialog");
    expect(
      within(sheet).queryByRole("link", { name: /Préparer la déclaration/ }),
    ).not.toBeInTheDocument();
    expect(within(sheet).getAllByRole("link")).toHaveLength(1);
    permissions.canViewVat = true;
  });

  it("page TVA pas encore ouverte à l'espace : pas de lien vers elle", () => {
    permissions.vatOpen = false;
    render(<LinkedItemSheet item={vatItem} onClose={() => {}} />);
    const sheet = screen.getByRole("dialog");
    expect(
      within(sheet).queryByRole("link", { name: /Préparer la déclaration/ }),
    ).not.toBeInTheDocument();
    expect(within(sheet).getAllByRole("link")).toHaveLength(1);
    permissions.vatOpen = true;
  });
});

describe("fiche d'une déclaration Urssaf", () => {
  const urssafItem = {
    ...item,
    id: "FISCAL:URSSAF_REVENUE:2026-11-30",
    entityId: "URSSAF_REVENUE",
    day: "2026-11-30",
    title: "Déclaration de chiffre d'affaires (Urssaf)",
    counterparty: "Urssaf",
    isIndicative: false,
    isConditional: false,
    vatPeriodKey: null,
    urssafPeriodKey: "2026-10",
    isDeclared: false,
  };

  it("ouvre sa période dans la page Urssaf", () => {
    render(<LinkedItemSheet item={urssafItem} onClose={() => {}} />);
    const sheet = screen.getByRole("dialog");
    expect(
      within(sheet).getByRole("link", { name: /Préparer la déclaration/ }),
    ).toHaveAttribute("href", "/dashboard/outils/urssaf?periode=2026-10");
  });

  it("le droit et l'accès de la page Urssaf comptent, pas ceux de la TVA", () => {
    permissions.canViewVat = false;
    permissions.vatOpen = false;
    const { unmount } = render(
      <LinkedItemSheet item={urssafItem} onClose={() => {}} />,
    );
    expect(
      within(screen.getByRole("dialog")).getByRole("link", {
        name: /Préparer la déclaration/,
      }),
    ).toBeInTheDocument();
    unmount();
    permissions.canViewVat = true;
    permissions.vatOpen = true;

    permissions.urssafOpen = false;
    render(<LinkedItemSheet item={urssafItem} onClose={() => {}} />);
    const sheet = screen.getByRole("dialog");
    expect(
      within(sheet).queryByRole("link", { name: /Préparer la déclaration/ }),
    ).not.toBeInTheDocument();
    permissions.urssafOpen = true;
  });
});

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
