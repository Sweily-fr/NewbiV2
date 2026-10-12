import { describe, it, expect, afterEach } from "vitest";
import {
  formatCalendarDate,
  formatLocalDate,
  toCalendarDate,
} from "@/src/utils/dateFormatter";

/**
 * Lecture des dates de documents en fuseau négatif (DOM-TOM).
 *
 * L'API stocke une date saisie « 2026-10-11 » à minuit UTC et la renvoie en
 * timestamp ms (chaîne de chiffres, sérialisation GraphQL String d'une Date)
 * ou en ISO (factures d'achat, dernière date d'émission). Les éditeurs
 * relisaient cette date en heure locale : en Martinique (UTC-4), minuit UTC
 * tombe la veille à 20 h et chaque réenregistrement reculait la date d'un jour.
 *
 * process.env.TZ est relu par Node à chaque changement (pool « forks » de
 * Vitest : un processus par fichier de test).
 */

const ORIGINAL_TZ = process.env.TZ;

const setTimezone = (tz) => {
  process.env.TZ = tz;
};

afterEach(() => {
  if (ORIGINAL_TZ === undefined) delete process.env.TZ;
  else process.env.TZ = ORIGINAL_TZ;
});

// Ce que fait l'API : Mongoose caste « YYYY-MM-DD » en minuit UTC, puis
// GraphQL sérialise la Date en String via valueOf() (timestamp ms)
const storeAndServe = (yyyyMmDd) => String(new Date(yyyyMmDd).getTime());

describe("formatCalendarDate / toCalendarDate en fuseau négatif (Martinique)", () => {
  it("le fuseau simulé est bien UTC-4", () => {
    setTimezone("America/Martinique");
    expect(new Date("2026-10-11T00:00:00.000Z").getTimezoneOffset()).toBe(240);
  });

  it("reproduit le défaut : la lecture locale recule d'un jour à chaque aller-retour", () => {
    setTimezone("America/Martinique");
    let issueDate = "2026-10-11";
    for (let i = 0; i < 3; i++) {
      issueDate = formatLocalDate(
        new Date(parseInt(storeAndServe(issueDate), 10)),
      );
    }
    expect(issueDate).toBe("2026-10-08");
  });

  it("la date reste stable après plusieurs réenregistrements", () => {
    setTimezone("America/Martinique");
    let issueDate = "2026-10-11";
    for (let i = 0; i < 5; i++) {
      issueDate = toCalendarDate(storeAndServe(issueDate));
    }
    expect(issueDate).toBe("2026-10-11");
  });

  it("lit un minuit UTC par ses composantes UTC, quel que soit le format", () => {
    setTimezone("America/Martinique");
    const ms = new Date("2026-01-01T00:00:00.000Z").getTime();
    expect(toCalendarDate(String(ms))).toBe("2026-01-01");
    expect(toCalendarDate(ms)).toBe("2026-01-01");
    expect(toCalendarDate("2026-01-01T00:00:00.000Z")).toBe("2026-01-01");
    expect(toCalendarDate(new Date(ms))).toBe("2026-01-01");
    expect(formatCalendarDate(new Date(ms))).toBe("2026-01-01");
  });

  it("garde la lecture locale pour un instant qui n'est pas minuit UTC", () => {
    setTimezone("America/Martinique");
    // issueDate: new Date() posé par l'API à 21 h en Martinique (01:00 UTC le lendemain)
    expect(toCalendarDate("2026-10-12T01:00:00.000Z")).toBe("2026-10-11");
    // Minuit local martiniquais envoyé en ISO (date de paiement des achats)
    expect(toCalendarDate(new Date("2026-10-11T00:00:00").toISOString())).toBe(
      "2026-10-11",
    );
  });

  it("garde une chaîne YYYY-MM-DD telle quelle et rejette le vide ou l'invalide", () => {
    setTimezone("America/Martinique");
    expect(toCalendarDate("2026-10-11")).toBe("2026-10-11");
    expect(toCalendarDate(null)).toBeNull();
    expect(toCalendarDate(undefined)).toBeNull();
    expect(toCalendarDate("")).toBeNull();
    expect(toCalendarDate("pas une date")).toBeNull();
  });

  it("Guyane (UTC-3) : même stabilité", () => {
    setTimezone("America/Cayenne");
    expect(toCalendarDate(storeAndServe("2026-03-31"))).toBe("2026-03-31");
  });
});

describe("formatCalendarDate / toCalendarDate en métropole (comportement inchangé)", () => {
  const samples = [
    // Minuit UTC (date saisie), hiver et été
    "2026-01-15T00:00:00.000Z",
    "2026-07-15T00:00:00.000Z",
    // Minuit local Paris envoyé en ISO (ancien format / date de paiement)
    "2026-01-14T23:00:00.000Z",
    "2026-07-14T22:00:00.000Z",
    // Instants posés par l'API (new Date()), dont juste après minuit Paris
    "2026-10-10T22:30:00.000Z",
    "2026-10-11T13:45:12.345Z",
  ];

  it.each(samples)("%s : identique à la lecture locale", (iso) => {
    setTimezone("Europe/Paris");
    const date = new Date(iso);
    expect(formatCalendarDate(date)).toBe(formatLocalDate(date));
    expect(toCalendarDate(String(date.getTime()))).toBe(formatLocalDate(date));
    expect(toCalendarDate(iso)).toBe(formatLocalDate(date));
  });

  it("la Réunion (UTC+4) : identique à la lecture locale", () => {
    setTimezone("Indian/Reunion");
    const date = new Date("2026-10-11T00:00:00.000Z");
    expect(formatCalendarDate(date)).toBe(formatLocalDate(date));
    expect(formatCalendarDate(date)).toBe("2026-10-11");
  });
});
