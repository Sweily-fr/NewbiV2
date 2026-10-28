import { describe, it, expect } from "vitest";
import {
  LINKED_KINDS,
  fiscalMissingConcerns,
  linkedItemExternalUrl,
  linkedItemHref,
  linkedItemToEvent,
  summarizeLinkedItems,
} from "@/src/utils/calendar-linked-items";
import {
  FISCAL_ACTION_LABELS,
  LINKED_SOURCE_META,
  linkedStateLabel,
} from "@/app/dashboard/calendar/components/linked-sources";

/**
 * Source « Fiscal » du calendrier : échéances fiscales et sociales
 * calculées par l'API depuis les informations légales.
 */

const fiscal = (day, state, extra = {}) => ({
  id: `FISCAL:VAT_RETURN_MONTHLY:${day}`,
  kind: "FISCAL",
  entityId: "VAT_RETURN_MONTHLY",
  day,
  title: "Déclaration de TVA (CA3)",
  reference: "Octobre 2026",
  counterparty: "Service des impôts des entreprises",
  amount: null,
  currency: null,
  state,
  documentStatus: "DECLARATION_PAYMENT",
  infoUrl: "https://www.impots.gouv.fr/professionnel/tva",
  isIndicative: true,
  isConditional: false,
  note: "Date indicative.",
  ...extra,
});

describe("source Fiscal", () => {
  it("vient en dernier dans la barre des sources", () => {
    expect(LINKED_KINDS.at(-1)).toBe("FISCAL");
  });

  it("totaux : échéances à venir et dates passées, sans montant", () => {
    const { byKind, balance } = summarizeLinkedItems(
      [
        fiscal("2026-11-19", "UPCOMING"),
        fiscal("2026-12-21", "UPCOMING"),
        fiscal("2026-10-19", "DONE"),
        fiscal("2027-01-19", "UPCOMING"),
      ],
      { from: "2026-10-01", to: "2026-12-31" },
    );

    expect(byKind.FISCAL).toMatchObject({
      count: 3,
      openCount: 2,
      overdueCount: 0,
      doneCount: 1,
      openAmount: 0,
    });
    expect(balance).toBe(0);
  });

  it("événement journée entière en lecture seule, sans lien interne", () => {
    const item = fiscal("2026-11-19", "UPCOMING");

    expect(linkedItemToEvent(item)).toMatchObject({
      id: item.id,
      allDay: true,
      isReadOnly: true,
      type: "LINKED_FISCAL",
    });
    expect(linkedItemHref(item)).toBeNull();
  });

  it("lien externe : seulement une page https d'une échéance fiscale", () => {
    expect(linkedItemExternalUrl(fiscal("2026-11-19", "UPCOMING"))).toBe(
      "https://www.impots.gouv.fr/professionnel/tva",
    );
    for (const infoUrl of [
      "http://www.impots.gouv.fr/professionnel/tva",
      "javascript:alert(1)",
      "pas une adresse",
      null,
    ]) {
      expect(
        linkedItemExternalUrl(fiscal("2026-11-19", "UPCOMING", { infoUrl })),
      ).toBeNull();
    }
    expect(
      linkedItemExternalUrl({
        kind: "INVOICE",
        infoUrl: "https://www.impots.gouv.fr/professionnel/tva",
      }),
    ).toBeNull();
  });

  it("informations manquantes : échéances concernées sans doublon", () => {
    expect(
      fiscalMissingConcerns({
        complete: false,
        missing: [
          { code: "VAT_FREQUENCY", label: "…", concerns: ["TVA"] },
          {
            code: "FISCAL_YEAR_END",
            label: "…",
            concerns: ["Déclaration annuelle de TVA (CA12)", "TVA"],
          },
        ],
      }),
    ).toEqual(["TVA", "Déclaration annuelle de TVA (CA12)"]);
    expect(fiscalMissingConcerns({ complete: true, missing: [] })).toEqual([]);
    expect(fiscalMissingConcerns(null)).toEqual([]);
  });

  it("apparence : libellé, teinte neutre, date passée sans vert ni coche", () => {
    const meta = LINKED_SOURCE_META.FISCAL;

    expect(meta.label).toBe("Fiscal");
    expect(meta.neutralDone).toBe(true);
    expect(meta.doneIcon).toBeTruthy();
    for (const classes of [meta.dot, meta.tint, meta.accent, meta.iconClass]) {
      expect(classes).not.toMatch(/red|emerald|green/);
    }
    expect(linkedStateLabel(fiscal("2026-10-19", "DONE"))).toBe("Date passée");
    expect(linkedStateLabel(fiscal("2026-11-19", "UPCOMING"))).toBe("À venir");
    expect(FISCAL_ACTION_LABELS.DECLARATION_PAYMENT).toBe("Déclarer et payer");
  });
});
