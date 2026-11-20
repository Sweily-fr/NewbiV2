import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";

import {
  UpcomingDaysView,
  formatDuration,
  newEventDraft,
} from "@/app/dashboard/components/upcoming-days-card";
import { buildUpcomingDays, upcomingDays } from "@/src/utils/upcoming-days";

const local = (day, time = "00:00") => new Date(`${day}T${time}:00`);
const DAYS = upcomingDays(local("2026-11-20", "08:00"));

const columns = buildUpcomingDays({
  days: DAYS,
  events: [
    {
      id: "e1",
      title: "Point hebdo équipe",
      start: local("2026-11-20", "09:30"),
      end: local("2026-11-20", "10:00"),
      allDay: false,
      type: "MANUAL",
      color: "violet",
      location: "Visio",
    },
    {
      id: "e2",
      title: "Déclaration de TVA",
      start: local("2026-11-20"),
      end: local("2026-11-20", "23:59"),
      allDay: true,
      type: "MANUAL",
      color: "#5A50FF",
      declarationKind: "VAT",
    },
    {
      id: "e3",
      title: "Lancement projet",
      start: local("2026-11-23", "09:00"),
      end: local("2026-11-23", "10:30"),
      allDay: false,
      type: "MANUAL",
      color: "blue",
    },
    {
      id: "e4",
      title: "Déjeuner",
      start: local("2026-11-23", "12:30"),
      end: local("2026-11-23", "13:30"),
      allDay: false,
      type: "MANUAL",
      color: "rose",
    },
  ],
});

describe("accueil : aujourd'hui et les 6 jours suivants", () => {
  it("détaille aujourd'hui : heure, lieu, durée", () => {
    render(
      <UpcomingDaysView columns={columns} loading={false} onOpen={() => {}} />,
    );
    expect(screen.getByText("09:30")).toBeInTheDocument();
    expect(screen.getByText("Point hebdo équipe")).toBeInTheDocument();
    expect(screen.getByText("Visio · 30 min")).toBeInTheDocument();
  });

  it("une déclaration porte son lien de dépôt", () => {
    render(
      <UpcomingDaysView columns={columns} loading={false} onOpen={() => {}} />,
    );
    const link = screen.getByRole("link", { name: /Déclarer/ });
    expect(link).toHaveAttribute(
      "href",
      "https://cfspro.impots.gouv.fr/mire/accueil.do",
    );
    expect(
      screen.getByText("À déposer sur impots.gouv.fr"),
    ).toBeInTheDocument();
  });

  it("les 6 jours suivants : premier élément, « +N », lien vers le jour", () => {
    render(
      <UpcomingDaysView columns={columns} loading={false} onOpen={() => {}} />,
    );
    const monday = screen.getByRole("link", {
      name: /lundi 23 novembre, 2 éléments/i,
    });
    expect(monday).toHaveAttribute(
      "href",
      "/dashboard/calendar?jour=2026-11-23",
    );
    expect(within(monday).getByText("Lancement projet")).toBeInTheDocument();
    expect(within(monday).getByText("+1")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /dimanche 22 novembre, rien de prévu/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").length).toBeGreaterThanOrEqual(6);
  });

  it("ouvre l'élément au clic et propose de créer un événement", () => {
    const onOpen = vi.fn();
    const onCreate = vi.fn();
    render(
      <UpcomingDaysView
        columns={columns}
        loading={false}
        onOpen={onOpen}
        onCreate={onCreate}
      />,
    );
    fireEvent.click(screen.getByText("Point hebdo équipe"));
    expect(onOpen).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Point hebdo équipe" }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Nouvel événement/ }));
    expect(onCreate).toHaveBeenCalled();
  });

  it("sans le droit de créer : pas de bouton", () => {
    render(
      <UpcomingDaysView columns={columns} loading={false} onOpen={() => {}} />,
    );
    expect(
      screen.queryByRole("button", { name: /Nouvel événement/ }),
    ).not.toBeInTheDocument();
  });

  it("durées et brouillon d'un nouvel événement", () => {
    expect(
      formatDuration(
        local("2026-11-20", "09:00"),
        local("2026-11-20", "09:30"),
      ),
    ).toBe("30 min");
    expect(
      formatDuration(
        local("2026-11-20", "09:00"),
        local("2026-11-20", "10:00"),
      ),
    ).toBe("1 h");
    expect(
      formatDuration(
        local("2026-11-20", "09:00"),
        local("2026-11-20", "10:30"),
      ),
    ).toBe("1 h 30");
    const draft = newEventDraft(local("2026-11-20", "07:12"));
    expect(draft.start.getHours()).toBe(9);
    expect(draft.end.getHours()).toBe(10);
    expect(newEventDraft(local("2026-11-20", "14:40")).start.getHours()).toBe(
      15,
    );
  });
});
