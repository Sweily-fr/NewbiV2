import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Fenêtre d'un événement du calendrier : titre en en-tête, types en
 * pastilles, propriétés en lignes (date, lieu, membres, étiquette, rappel,
 * description).
 */

const LABELS = [
  { color: "#3B82F6", label: "Bleu" },
  { color: "#EF4444", label: "Rouge" },
];

vi.mock("@/src/hooks/useCalendarColorLabels", () => ({
  useCalendarColorLabels: () => ({
    labels: LABELS,
    getLabelForColor: (color) =>
      LABELS.find((entry) => entry.color === color)?.label || color,
    updateLabels: vi.fn(),
    updateLoading: false,
  }),
}));
vi.mock("@/src/hooks/useMyPermissions", () => ({
  useMyPermissions: () => ({ canDo: () => true, isReady: true }),
}));
vi.mock("@/src/hooks/useWorkspace", () => ({
  useWorkspace: () => ({
    organization: { legalForm: "SAS", vatFranchise: false },
  }),
}));
vi.mock("@/src/hooks/useCalendarEventTypes", () => ({
  useCalendarEventTypes: () => ({
    types: [
      {
        id: "type_rdv",
        name: "Rendez-vous client",
        color: "#378ADD",
        allDay: false,
      },
    ],
    updateTypes: vi.fn(),
    updateLoading: false,
  }),
}));
vi.mock("@/src/hooks/useCalendarConnections", () => ({
  useCalendarConnections: () => ({ connections: [] }),
  usePushEventToCalendar: () => ({ pushEvent: vi.fn(), loading: false }),
}));
vi.mock("@/app/dashboard/outils/kanban/[id]/components/MemberSelector", () => ({
  MemberSelector: () => <span>Ajouter des membres</span>,
}));

const { EventDialog } =
  await import("@/app/dashboard/calendar/components/event-dialog");

const YEAR = new Date().getFullYear();
const at = (day, hours = 0, minutes = 0) =>
  new Date(YEAR, 10, day, hours, minutes);
const dayLabel = (date) => format(date, "EEE d MMM", { locale: fr });

const draft = {
  id: "",
  title: "",
  start: at(20, 14),
  end: at(20, 15),
  allDay: false,
};

function renderDialog(props = {}) {
  const onSave = vi.fn();
  render(
    <EventDialog
      event={draft}
      isOpen
      onClose={() => {}}
      onSave={onSave}
      onDelete={() => {}}
      {...props}
    />,
  );
  return { onSave };
}

describe("fenêtre d'événement", () => {
  it("nouvel événement : titre en en-tête, types en pastilles, « Créer l'événement »", () => {
    renderDialog();
    expect(
      screen.getByRole("textbox", { name: "Titre de l'événement" }),
    ).toHaveAttribute("placeholder", "Ajouter un titre");

    const types = screen
      .getAllByRole("radio")
      .map((radio) => radio.textContent);
    expect(types).toEqual([
      "Événement",
      "Déclaration de TVA",
      "Déclaration Urssaf",
      "Rendez-vous client",
    ]);
    expect(screen.getByRole("radio", { name: "Événement" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(
      screen.getByRole("button", { name: "Ajouter un type d'événement" }),
    ).toBeInTheDocument();

    // Une ligne par propriété
    expect(
      screen.getByRole("button", {
        name: new RegExp(
          `Date de début : ${format(at(20), "EEEE d MMMM", { locale: fr })}`,
        ),
      }),
    ).toHaveTextContent(dayLabel(at(20)));
    expect(
      screen.getByRole("combobox", { name: "Heure de début" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Heure de fin" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Lieu" })).toBeInTheDocument();
    expect(screen.getByText("Ajouter des membres")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Étiquette : Bleu" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Rappel par e-mail")).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Description" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Créer l'événement" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Supprimer/ })).toBeNull();
  });

  it("sans brouillon : 9:00 → 10:00 affichés dans les pastilles d'heure", () => {
    renderDialog({ event: null });
    expect(
      screen.getByRole("combobox", { name: "Heure de début" }),
    ).toHaveTextContent(/^9:00$/);
    expect(
      screen.getByRole("combobox", { name: "Heure de fin" }),
    ).toHaveTextContent(/^10:00$/);
  });

  it("déclaration de TVA : lien de dépôt, journée entière, sans lieu ni étiquette", () => {
    const { onSave } = renderDialog();
    fireEvent.click(screen.getByRole("radio", { name: "Déclaration de TVA" }));

    expect(
      screen.getByRole("textbox", { name: "Titre de l'événement" }),
    ).toHaveValue("Déclaration de TVA");
    expect(screen.getByText("impots.gouv.fr")).toBeInTheDocument();
    expect(
      screen.getByText("Déclaration et paiement en ligne"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Déclarer/ })).toHaveAttribute(
      "href",
      "https://cfspro.impots.gouv.fr/mire/accueil.do",
    );
    expect(
      screen.getByRole("switch", { name: "Toute la journée" }),
    ).toHaveAttribute("aria-checked", "true");
    expect(
      screen.queryByRole("combobox", { name: "Heure de début" }),
    ).toBeNull();
    expect(screen.queryByRole("textbox", { name: "Lieu" })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Étiquette/ })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Créer l'événement" }));
    expect(onSave).toHaveBeenCalledTimes(1);
    const saved = onSave.mock.calls[0][0];
    expect(saved).toMatchObject({
      title: "Déclaration de TVA",
      declarationKind: "VAT",
      eventTypeId: null,
      allDay: true,
      color: "#5A50FF",
    });
    expect(saved.start).toEqual(at(20));
    expect(saved.end).toEqual(new Date(YEAR, 10, 20, 23, 59, 59, 999));
  });

  it("type de l'espace choisi : crayon pour le modifier", () => {
    renderDialog();
    expect(
      screen.queryByRole("button", {
        name: "Modifier le type « Rendez-vous client »",
      }),
    ).toBeNull();
    fireEvent.click(screen.getByRole("radio", { name: /Rendez-vous client/ }));
    expect(
      screen.getByRole("button", {
        name: "Modifier le type « Rendez-vous client »",
      }),
    ).toBeInTheDocument();
  });

  it("« Sur plusieurs jours » ajoute une date de fin, « Sur un seul jour » la retire", () => {
    renderDialog();
    expect(screen.queryByRole("button", { name: /^Date de fin/ })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /^Date de début/ }));
    fireEvent.click(
      screen.getByRole("button", { name: "Sur plusieurs jours" }),
    );
    const end = screen.getByRole("button", { name: /^Date de fin/ });
    expect(end).toHaveTextContent(dayLabel(at(21)));

    fireEvent.click(end);
    fireEvent.click(screen.getByRole("button", { name: "Sur un seul jour" }));
    expect(screen.queryByRole("button", { name: /^Date de fin/ })).toBeNull();
  });

  it("lecture seule : date et heures en une ligne, raison affichée", () => {
    renderDialog({
      canEdit: false,
      event: {
        ...draft,
        id: "evt1",
        title: "Point client",
        location: "Paris 11e",
        color: "#EF4444",
      },
    });
    expect(screen.getByText("Point client")).toBeInTheDocument();
    expect(
      screen.getByText(`${dayLabel(at(20))} · 14:00 → 15:00`),
    ).toBeInTheDocument();
    expect(screen.getByText("Paris 11e")).toBeInTheDocument();
    expect(screen.getByText("Rouge")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Votre rôle permet de consulter les événements, pas de les modifier",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByRole("button", { name: "Fermer" })).toBeInTheDocument();
  });

  it("journée entière d'un calendrier externe (fin à minuit) : un seul jour", () => {
    renderDialog({
      event: {
        id: "ext1",
        title: "Salon",
        start: at(20),
        end: at(21),
        allDay: true,
        isReadOnly: true,
        source: "google",
      },
    });
    expect(
      screen.getByText(`${dayLabel(at(20))} · Toute la journée`),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Synchronisé depuis Google Calendar"),
    ).toBeInTheDocument();
  });
});
