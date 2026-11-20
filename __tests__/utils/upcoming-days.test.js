import { describe, it, expect } from "vitest";
import { buildUpcomingDays, upcomingDays } from "@/src/utils/upcoming-days";
import { fiscalDeadlinesToToast } from "@/src/hooks/useActivityNotifications";
import {
  FILING_SITES,
  linkedItemFilingSite,
} from "@/src/utils/calendar-linked-items";

const local = (day, time = "00:00") => new Date(`${day}T${time}:00`);
const DAYS = upcomingDays(local("2026-11-20", "15:00"));

const event = (fields) => ({
  id: "e1",
  title: "Point client",
  start: local("2026-11-20", "14:00"),
  end: local("2026-11-20", "15:30"),
  allDay: false,
  type: "MANUAL",
  color: "sky",
  ...fields,
});
const linked = (fields) => ({
  id: "FISCAL:VAT_RETURN_MONTHLY:2026-11-23",
  kind: "FISCAL",
  day: "2026-11-23",
  title: "Déclaration de TVA (CA3)",
  state: "UPCOMING",
  ...fields,
});

const titlesOf = (columns, day) =>
  columns.find((c) => c.day === day).entries.map((e) => e.title);

describe("accueil : les 5 prochains jours", () => {
  it("cinq jours à partir d'aujourd'hui, passage de mois compris", () => {
    expect(DAYS).toEqual([
      "2026-11-20",
      "2026-11-21",
      "2026-11-22",
      "2026-11-23",
      "2026-11-24",
    ]);
    expect(upcomingDays(local("2026-11-29"))[2]).toBe("2026-12-01");
  });

  it("place événements et échéances sur leur jour, avec l'heure", () => {
    const columns = buildUpcomingDays({
      days: DAYS,
      events: [event({})],
      linkedItems: [linked({})],
    });
    expect(columns).toHaveLength(5);
    const today = columns[0].entries;
    expect(today).toHaveLength(1);
    expect(today[0]).toMatchObject({
      type: "event",
      day: "2026-11-20",
      detail: "14:00 – 15:30",
    });
    expect(titlesOf(columns, "2026-11-23")).toEqual([
      "Déclaration de TVA (CA3)",
    ]);
  });

  it("un événement de plusieurs jours apparaît chaque jour, sans déborder à minuit", () => {
    const columns = buildUpcomingDays({
      days: DAYS,
      events: [
        event({
          title: "Salon",
          allDay: true,
          start: local("2026-11-19"),
          end: local("2026-11-21"),
        }),
        event({
          id: "e2",
          title: "Jusqu'à minuit",
          start: local("2026-11-21", "20:00"),
          end: local("2026-11-22"),
        }),
      ],
    });
    expect(titlesOf(columns, "2026-11-20")).toEqual(["Salon"]);
    expect(titlesOf(columns, "2026-11-21")).toEqual([
      "Salon",
      "Jusqu'à minuit",
    ]);
    expect(titlesOf(columns, "2026-11-22")).toEqual([]);
  });

  it("ordre du jour : toute la journée, fiscal, heures, autres échéances", () => {
    const columns = buildUpcomingDays({
      days: DAYS,
      events: [
        event({
          title: "Midi",
          start: local("2026-11-23", "12:00"),
          end: local("2026-11-23", "13:00"),
        }),
        event({
          id: "e2",
          title: "Matin",
          start: local("2026-11-23", "09:00"),
          end: local("2026-11-23", "10:00"),
        }),
        event({
          id: "e3",
          title: "Congés",
          allDay: true,
          start: local("2026-11-23"),
          end: local("2026-11-23"),
        }),
      ],
      linkedItems: [
        linked({ id: "INVOICE:1", kind: "INVOICE", title: "Facture F-12" }),
        linked({}),
      ],
    });
    expect(titlesOf(columns, "2026-11-23")).toEqual([
      "Congés",
      "Déclaration de TVA (CA3)",
      "Matin",
      "Midi",
      "Facture F-12",
    ]);
  });

  it("suit les filtres du calendrier et laisse de côté ce qui est réglé", () => {
    const columns = buildUpcomingDays({
      days: DAYS,
      events: [
        event({}),
        event({ id: "rdv", title: "Rendez-vous", type: "APPOINTMENT" }),
      ],
      linkedItems: [
        linked({}),
        linked({ id: "TASK:1", kind: "TASK", title: "Tâche" }),
        linked({
          id: "INVOICE:2",
          kind: "INVOICE",
          title: "Payée",
          state: "DONE",
        }),
      ],
      hiddenSources: new Set(["EVENTS", "TASK"]),
    });
    expect(titlesOf(columns, "2026-11-20")).toEqual(["Rendez-vous"]);
    expect(titlesOf(columns, "2026-11-23")).toEqual([
      "Déclaration de TVA (CA3)",
    ]);
  });

  it("copie d'échéance de facture : masquée, sauf si les échéances manquent", () => {
    const copy = event({ type: "INVOICE_DUE", title: "Échéance F-1" });
    expect(
      buildUpcomingDays({ days: DAYS, events: [copy] })[0].entries,
    ).toHaveLength(0);
    expect(
      buildUpcomingDays({
        days: DAYS,
        events: [copy],
        linkedUnavailable: true,
      })[0].entries,
    ).toHaveLength(1);
  });

  it("heure de début seule pour les étiquettes", () => {
    const [today] = buildUpcomingDays({ days: DAYS, events: [event({})] });
    expect(today.entries[0].time).toBe("14:00");
    const [allDay] = buildUpcomingDays({
      days: DAYS,
      events: [
        event({
          allDay: true,
          start: local("2026-11-20"),
          end: local("2026-11-20"),
        }),
      ],
    });
    expect(allDay.entries[0].time).toBeNull();
  });
});

describe("déclaration à faire : site officiel et rappel du jour", () => {
  it("TVA vers impots.gouv.fr, Urssaf vers son portail, rien pour les autres", () => {
    expect(linkedItemFilingSite(linked({ vatPeriodKey: "2026-10" }))).toBe(
      FILING_SITES.VAT,
    );
    expect(linkedItemFilingSite(linked({ urssafPeriodKey: "2026-10" }))).toBe(
      FILING_SITES.URSSAF,
    );
    expect(linkedItemFilingSite(linked({ entityId: "CFE" }))).toBeNull();
    expect(
      linkedItemFilingSite({ kind: "INVOICE", vatPeriodKey: "x" }),
    ).toBeNull();
  });

  it("toast à la connexion : rappels du jour non lus seulement", () => {
    const now = local("2026-11-19", "10:00");
    const notifications = [
      {
        id: "a",
        type: "FISCAL_DEADLINE",
        read: false,
        createdAt: local("2026-11-19", "08:00").toISOString(),
      },
      {
        id: "b",
        type: "FISCAL_DEADLINE",
        read: true,
        createdAt: local("2026-11-19", "08:00").toISOString(),
      },
      {
        id: "c",
        type: "FISCAL_DEADLINE",
        read: false,
        createdAt: String(local("2026-11-18", "08:00").getTime()),
      },
      {
        id: "d",
        type: "TASK_ASSIGNED",
        read: false,
        createdAt: local("2026-11-19", "08:00").toISOString(),
      },
    ];
    expect(fiscalDeadlinesToToast(notifications, now).map((n) => n.id)).toEqual(
      ["a"],
    );
  });
});
