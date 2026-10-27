import { describe, it, expect } from "vitest";
import {
  formatLinkedAmount,
  isPlainInvoiceDueEvent,
  linkedItemHref,
  linkedItemToEvent,
  periodNames,
  relativeDayLabel,
  summarizeLinkedItems,
  summaryRange,
  visibleRange,
} from "@/src/utils/calendar-linked-items";

// Mercredi 28 octobre 2026 (dates locales, comme le calendrier)
const TODAY = new Date(2026, 9, 28, 10, 0);

const item = (kind, day, state, amount = null, extra = {}) => ({
  id: `${kind}:${day}:${state}:${amount}`,
  kind,
  entityId: "e1",
  day,
  title: "Titre",
  state,
  amount,
  currency: "EUR",
  ...extra,
});

describe("visibleRange", () => {
  it("vue mois : semaines complètes, dimanche en premier", () => {
    // Octobre 2026 : jeudi 1er au samedi 31
    expect(visibleRange("mois", TODAY)).toEqual({
      from: "2026-09-27",
      to: "2026-10-31",
    });
  });

  it("vue semaine, jour et agenda", () => {
    expect(visibleRange("semaine", TODAY)).toEqual({
      from: "2026-10-25",
      to: "2026-10-31",
    });
    expect(visibleRange("jour", TODAY)).toEqual({
      from: "2026-10-28",
      to: "2026-10-28",
    });
    expect(visibleRange("agenda", TODAY, 30)).toEqual({
      from: "2026-10-28",
      to: "2026-11-26",
    });
  });

  it("les totaux du mois ignorent les jours voisins de la grille", () => {
    expect(summaryRange("mois", TODAY)).toEqual({
      from: "2026-10-01",
      to: "2026-10-31",
    });
    expect(summaryRange("semaine", TODAY)).toEqual(
      visibleRange("semaine", TODAY),
    );
  });
});

describe("linkedItemToEvent", () => {
  it("journée entière au jour local, en lecture seule", () => {
    const linked = item("INVOICE", "2026-11-15", "UPCOMING", 1200);

    const event = linkedItemToEvent(linked);

    expect(event.start).toEqual(new Date(2026, 10, 15));
    expect(event.end).toEqual(new Date(2026, 10, 15));
    expect(event).toMatchObject({
      allDay: true,
      isReadOnly: true,
      linked,
    });
  });
});

describe("isPlainInvoiceDueEvent", () => {
  it("seules les copies d'échéance non enrichies sont remplacées", () => {
    expect(isPlainInvoiceDueEvent({ type: "INVOICE_DUE" })).toBe(true);
    expect(
      isPlainInvoiceDueEvent({ type: "INVOICE_DUE", assignedMembers: ["u1"] }),
    ).toBe(false);
    expect(
      isPlainInvoiceDueEvent({
        type: "INVOICE_DUE",
        emailReminder: { enabled: true },
      }),
    ).toBe(false);
    expect(isPlainInvoiceDueEvent({ type: "MANUAL" })).toBe(false);
  });
});

describe("summarizeLinkedItems", () => {
  const items = [
    item("INVOICE", "2026-10-05", "OVERDUE", 1200),
    item("INVOICE", "2026-10-30", "UPCOMING", 800),
    item("INVOICE", "2026-10-10", "DONE", 3000),
    // Jour voisin affiché dans la grille, hors du mois
    item("INVOICE", "2026-11-01", "UPCOMING", 500),
    item("PURCHASE_INVOICE", "2026-10-12", "UPCOMING", 300),
    item("PURCHASE_INVOICE", "2026-10-13", "UPCOMING", 99, {
      currency: "USD",
    }),
    item("TASK", "2026-10-20", "OVERDUE"),
    item("TASK", "2026-10-29", "UPCOMING"),
    item("RECURRING_INVOICE", "2026-10-29", "UPCOMING", 500),
  ];

  it("totaux par source et solde des échéances non réglées", () => {
    const { byKind, balance } = summarizeLinkedItems(items, {
      from: "2026-10-01",
      to: "2026-10-31",
    });

    expect(byKind.INVOICE).toMatchObject({
      count: 3,
      openCount: 2,
      overdueCount: 1,
      doneCount: 1,
      openAmount: 2000,
      overdueAmount: 1200,
      doneAmount: 3000,
    });
    // La facture en dollars est comptée à part, jamais additionnée
    expect(byKind.PURCHASE_INVOICE).toMatchObject({
      openCount: 2,
      openAmount: 300,
      foreignCount: 1,
    });
    expect(byKind.TASK).toMatchObject({ openCount: 2, overdueCount: 1 });
    // Récurrences hors solde : payées plus tard, à leur échéance
    expect(balance).toBe(1700);
  });
});

describe("linkedItemHref", () => {
  it("ouvre chaque élément sur sa page", () => {
    expect(linkedItemHref({ kind: "INVOICE", entityId: "f1" })).toBe(
      "/dashboard/outils/factures?id=f1",
    );
    expect(linkedItemHref({ kind: "QUOTE", entityId: "d1" })).toBe(
      "/dashboard/outils/devis?id=d1",
    );
    expect(linkedItemHref({ kind: "PURCHASE_INVOICE", entityId: "a1" })).toBe(
      "/dashboard/outils/factures-achat?id=a1",
    );
    expect(
      linkedItemHref({ kind: "TASK", entityId: "t1", boardId: "b1" }),
    ).toBe("/dashboard/outils/kanban/b1?task=t1");
    expect(
      linkedItemHref({
        kind: "RECURRING_INVOICE",
        entityId: "r1",
        sourceInvoiceId: "f9",
      }),
    ).toBe("/dashboard/outils/factures?id=f9");
  });
});

describe("relativeDayLabel", () => {
  it("formule le délai en jours calendaires", () => {
    expect(relativeDayLabel("2026-10-28", "UPCOMING", TODAY)).toBe(
      "Aujourd'hui",
    );
    expect(relativeDayLabel("2026-10-29", "UPCOMING", TODAY)).toBe("Demain");
    expect(relativeDayLabel("2026-11-02", "UPCOMING", TODAY)).toBe(
      "Dans 5 jours",
    );
    expect(relativeDayLabel("2026-10-27", "DONE", TODAY)).toBe("Hier");
    expect(relativeDayLabel("2026-10-27", "OVERDUE", TODAY)).toBe(
      "En retard d'un jour",
    );
    expect(relativeDayLabel("2026-10-20", "OVERDUE", TODAY)).toBe(
      "En retard de 8 jours",
    );
  });
});

describe("formatLinkedAmount", () => {
  const clean = (text) => text.replace(/\s/g, " ");

  it("euros arrondis pour les puces, centimes pour la fiche", () => {
    expect(clean(formatLinkedAmount(12450.4, "EUR", { compact: true }))).toBe(
      "12 450 €",
    );
    expect(clean(formatLinkedAmount(59.99, "EUR"))).toBe("59,99 €");
    expect(clean(formatLinkedAmount(45, "USD"))).toBe("45,00 $US");
    expect(formatLinkedAmount(null)).toBeNull();
  });
});

describe("periodNames", () => {
  it("élide devant une voyelle", () => {
    expect(periodNames("mois", TODAY)).toEqual({
      title: "en octobre",
      of: "d'octobre",
    });
    expect(periodNames("mois", new Date(2026, 10, 3))).toEqual({
      title: "en novembre",
      of: "de novembre",
    });
    expect(periodNames("mois", new Date(2026, 7, 3)).of).toBe("d'août");
    expect(periodNames("agenda", TODAY, 30).of).toBe("des 30 jours");
  });
});
