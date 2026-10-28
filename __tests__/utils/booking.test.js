import { describe, it, expect } from "vitest";
import {
  addDaysToKey,
  bookingListVariables,
  buildBookingPayload,
  dayKeyInZone,
  dayKeyLabel,
  durationLabel,
  embedSnippet,
  googleCalendarUrl,
  groupSlotsByDay,
  intervalsError,
  isPhoneRequired,
  isValidBookingSlug,
  lastBookableDay,
  longDateLabel,
  mapApiFieldErrors,
  monthFetchRange,
  nextIntervalAfter,
  outlookCalendarUrl,
  readableTextColor,
  safeAccentColor,
  slugifyBookingName,
  sortIntervals,
  suggestBookingSlug,
  timeInZone,
  timeZoneLabel,
  timeZoneOffsetLabel,
  validateBookingForm,
} from "@/src/utils/booking";

describe("adresse de la page", () => {
  it("normalise un nom en adresse", () => {
    expect(slugifyBookingName("Élodie Martin")).toBe("elodie-martin");
    expect(slugifyBookingName("  Jean & Fils  ")).toBe("jean-et-fils");
    expect(slugifyBookingName("Cabinet d'Ostéo --- Lyon")).toBe(
      "cabinet-d-osteo-lyon",
    );
  });

  it("rejette ce qui reste trop court et coupe à 40 caractères", () => {
    expect(slugifyBookingName("A")).toBe("");
    expect(slugifyBookingName("!!")).toBe("");
    const long = slugifyBookingName(
      "Agence de communication et de design graphique de la vallée",
    );
    expect(long.length).toBeLessThanOrEqual(40);
    expect(long.endsWith("-")).toBe(false);
    expect(isValidBookingSlug(long)).toBe(true);
  });

  it("valide comme l'API", () => {
    expect(isValidBookingSlug("elodie-martin")).toBe(true);
    expect(isValidBookingSlug("ab")).toBe(false);
    expect(isValidBookingSlug("-elodie")).toBe(false);
    expect(isValidBookingSlug("elodie-")).toBe(false);
    expect(isValidBookingSlug("Elodie")).toBe(false);
    expect(isValidBookingSlug("a".repeat(41))).toBe(false);
  });

  it("propose prénom-nom, sinon l'e-mail, sinon l'entreprise", () => {
    expect(
      suggestBookingSlug({ firstName: "Élodie", lastName: "Martin" }),
    ).toBe("elodie-martin");
    // Nom déjà contenu dans le prénom (compte au nom complet)
    expect(
      suggestBookingSlug({ firstName: "Élodie Martin", lastName: "Martin" }),
    ).toBe("elodie-martin");
    expect(suggestBookingSlug({ email: "contact.pro@exemple.fr" })).toBe(
      "contact-pro",
    );
    expect(suggestBookingSlug({ firstName: "A", company: "Sweily" })).toBe(
      "sweily",
    );
    expect(suggestBookingSlug({})).toBe("");
  });
});

describe("créneaux dans le fuseau de l'invité", () => {
  const slots = [
    { start: "2026-11-04T08:30:00.000Z", end: "2026-11-04T09:00:00.000Z" },
    { start: "2026-11-03T23:30:00.000Z", end: "2026-11-04T00:00:00.000Z" },
    { start: "2026-11-03T08:00:00.000Z", end: "2026-11-03T08:30:00.000Z" },
  ];

  it("range par jour local, heures triées (Paris)", () => {
    const byDay = groupSlotsByDay(slots, "Europe/Paris");
    expect(Object.keys(byDay)).toEqual(["2026-11-03", "2026-11-04"]);
    expect(byDay["2026-11-03"].map((s) => s.time)).toEqual(["09:00"]);
    // 23 h 30 UTC = 0 h 30 le lendemain à Paris
    expect(byDay["2026-11-04"].map((s) => s.time)).toEqual(["00:30", "09:30"]);
    expect(byDay["2026-11-04"][0].start).toBe("2026-11-03T23:30:00.000Z");
  });

  it("le même créneau tombe la veille à New York", () => {
    const byDay = groupSlotsByDay(slots, "America/New_York");
    expect(byDay["2026-11-03"].map((s) => s.time)).toEqual(["03:00", "18:30"]);
    expect(byDay["2026-11-04"].map((s) => s.time)).toEqual(["03:30"]);
  });

  it("suit les changements d'heure (25/10/2026 et 29/03/2026)", () => {
    expect(timeInZone("2026-10-24T08:00:00Z", "Europe/Paris")).toBe("10:00");
    expect(timeInZone("2026-10-25T08:00:00Z", "Europe/Paris")).toBe("09:00");
    expect(timeInZone("2026-03-28T08:00:00Z", "Europe/Paris")).toBe("09:00");
    expect(timeInZone("2026-03-29T08:00:00Z", "Europe/Paris")).toBe("10:00");
    expect(dayKeyInZone("2026-10-25T22:30:00Z", "Europe/Paris")).toBe(
      "2026-10-25",
    );
    expect(dayKeyInZone("2026-10-25T23:30:00Z", "Europe/Paris")).toBe(
      "2026-10-26",
    );
  });

  it("aucun créneau : objet vide", () => {
    expect(groupSlotsByDay([], "Europe/Paris")).toEqual({});
    expect(groupSlotsByDay(null, "Europe/Paris")).toEqual({});
  });
});

describe("plage demandée pour un mois", () => {
  it("le mois plus un jour de chaque côté, borné par aujourd'hui", () => {
    expect(
      monthFetchRange("2026-11", {
        today: "2026-11-10",
        lastDay: "2027-01-09",
      }),
    ).toEqual({ from: "2026-11-10", to: "2026-12-01" });
    expect(
      monthFetchRange("2026-12", {
        today: "2026-11-10",
        lastDay: "2027-01-09",
      }),
    ).toEqual({ from: "2026-11-30", to: "2027-01-01" });
  });

  it("bornée par le dernier jour réservable, jamais plus de 42 jours", () => {
    expect(
      monthFetchRange("2027-01", {
        today: "2026-11-10",
        lastDay: "2027-01-09",
      }),
    ).toEqual({ from: "2026-12-31", to: "2027-01-09" });
    const range = monthFetchRange("2028-02", { today: "2028-01-01" });
    expect(range).toEqual({ from: "2028-01-31", to: "2028-03-01" });
  });

  it("mois entièrement passé ou hors horizon : rien à demander", () => {
    expect(monthFetchRange("2026-10", { today: "2026-11-10" })).toBeNull();
    expect(
      monthFetchRange("2027-03", {
        today: "2026-11-10",
        lastDay: "2027-01-09",
      }),
    ).toBeNull();
  });

  it("dernier jour réservable dans le fuseau de la page", () => {
    // 23 h 30 UTC le 31/12 = déjà le 1er janvier à Paris
    expect(
      lastBookableDay(new Date("2026-12-31T23:30:00Z"), {
        timeZone: "Europe/Paris",
        maxDaysAhead: 60,
      }),
    ).toBe(addDaysToKey("2027-01-01", 60));
    expect(addDaysToKey("2027-01-01", 60)).toBe("2027-03-02");
  });
});

describe("libellés", () => {
  it("décalage horaire selon la saison", () => {
    expect(timeZoneOffsetLabel("Europe/Paris", new Date("2026-07-01"))).toBe(
      "UTC+2",
    );
    expect(timeZoneOffsetLabel("Europe/Paris", new Date("2026-12-01"))).toBe(
      "UTC+1",
    );
    expect(timeZoneOffsetLabel("Asia/Kolkata", new Date("2026-12-01"))).toBe(
      "UTC+5:30",
    );
    expect(timeZoneOffsetLabel("UTC", new Date("2026-12-01"))).toBe("UTC");
    expect(timeZoneLabel("America/New_York", new Date("2026-12-01"))).toBe(
      "New York (UTC-5)",
    );
  });

  it("durées", () => {
    expect(durationLabel(15)).toBe("15 min");
    expect(durationLabel(60)).toBe("1 h");
    expect(durationLabel(90)).toBe("1 h 30");
    expect(durationLabel(125)).toBe("2 h 05");
  });

  it("dates longues en français", () => {
    expect(longDateLabel("2026-11-03T08:00:00Z", "Europe/Paris")).toBe(
      "Mardi 3 novembre 2026",
    );
    expect(dayKeyLabel("2026-11-03")).toBe("Mardi 3 novembre");
  });
});

describe("couleur d'accent", () => {
  it("rejette une valeur douteuse", () => {
    expect(safeAccentColor("#12ab34")).toBe("#12ab34");
    expect(safeAccentColor("red")).toBe("#5a50ff");
    expect(safeAccentColor("#fff")).toBe("#5a50ff");
    expect(safeAccentColor("url(javascript:alert(1))")).toBe("#5a50ff");
  });

  it("texte blanc sur foncé, encre sur clair", () => {
    expect(readableTextColor("#5a50ff")).toBe("#ffffff");
    expect(readableTextColor("#202020")).toBe("#ffffff");
    expect(readableTextColor("#ffd400")).toBe("#171717");
    expect(readableTextColor("#a7f3d0")).toBe("#171717");
  });
});

describe("formulaire de réservation", () => {
  const valid = {
    firstName: "Élodie",
    lastName: "Martin",
    email: "Elodie.Martin@Exemple.fr",
    phone: "",
    message: "",
  };

  it("champs requis", () => {
    expect(validateBookingForm({})).toEqual({
      firstName: "Indiquez votre prénom",
      lastName: "Indiquez votre nom",
      email: "Indiquez votre adresse e-mail",
    });
    expect(validateBookingForm(valid)).toEqual({});
  });

  it("téléphone obligatoire seulement si demandé, toujours vérifié", () => {
    expect(validateBookingForm(valid, { phoneRequired: true }).phone).toBe(
      "Indiquez votre numéro de téléphone",
    );
    expect(
      validateBookingForm(
        { ...valid, phone: "+33 6 12 34 56 78" },
        {
          phoneRequired: true,
        },
      ),
    ).toEqual({});
    expect(validateBookingForm({ ...valid, phone: "abc" }).phone).toBe(
      "Numéro de téléphone invalide",
    );
    expect(
      isPhoneRequired({ requirePhone: false, locationKind: "PHONE" }),
    ).toBe(true);
    expect(
      isPhoneRequired({ requirePhone: false, locationKind: "GOOGLE_MEET" }),
    ).toBe(false);
  });

  it("e-mail et message", () => {
    expect(validateBookingForm({ ...valid, email: "elodie@" }).email).toBe(
      "Adresse e-mail invalide",
    );
    expect(
      validateBookingForm({ ...valid, message: "x".repeat(2001) }).message,
    ).toBe("2000 caractères au maximum");
  });

  it("corps envoyé à l'API", () => {
    expect(
      buildBookingPayload(
        { ...valid, firstName: "  Élodie ", message: " Bonjour " },
        {
          start: "2026-11-03T08:00:00.000Z",
          timezone: "Europe/Paris",
          turnstileToken: "jeton",
        },
      ),
    ).toEqual({
      start: "2026-11-03T08:00:00.000Z",
      guest: {
        firstName: "Élodie",
        lastName: "Martin",
        email: "elodie.martin@exemple.fr",
        phone: null,
        message: "Bonjour",
      },
      timezone: "Europe/Paris",
      turnstileToken: "jeton",
      website: "",
    });
  });

  it("erreurs de champ de l'API", () => {
    expect(
      mapApiFieldErrors({ "guest.email": "Adresse refusée", phone: "" }),
    ).toEqual({ email: "Adresse refusée", phone: "Valeur invalide" });
    expect(mapApiFieldErrors(null)).toEqual({});
  });
});

describe("ajout à un agenda", () => {
  const event = {
    title: "Rendez-vous de 30 min avec Élodie Martin",
    start: "2026-11-03T08:00:00.000Z",
    end: "2026-11-03T08:30:00.000Z",
    details: "Lien : https://meet.google.com/abc-defg-hij",
    location: "https://meet.google.com/abc-defg-hij",
  };

  it("Google Agenda", () => {
    const url = new URL(googleCalendarUrl(event));
    expect(url.origin).toBe("https://calendar.google.com");
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
    expect(url.searchParams.get("text")).toBe(event.title);
    expect(url.searchParams.get("dates")).toBe(
      "20261103T080000Z/20261103T083000Z",
    );
    expect(url.searchParams.get("location")).toBe(event.location);
  });

  it("Outlook", () => {
    const url = new URL(outlookCalendarUrl(event));
    expect(url.hostname).toBe("outlook.live.com");
    expect(url.searchParams.get("rru")).toBe("addevent");
    expect(url.searchParams.get("subject")).toBe(event.title);
    expect(url.searchParams.get("startdt")).toBe("2026-11-03T08:00:00.000Z");
    expect(url.searchParams.get("enddt")).toBe("2026-11-03T08:30:00.000Z");
    expect(url.searchParams.get("body")).toBe(event.details);
  });

  it("sans lieu ni détails : paramètres absents", () => {
    const url = new URL(
      googleCalendarUrl({ ...event, details: "", location: "" }),
    );
    expect(url.searchParams.has("details")).toBe(false);
    expect(url.searchParams.has("location")).toBe(false);
  });
});

describe("tableau de bord", () => {
  it("onglets de la liste des réservations", () => {
    expect(bookingListVariables("upcoming")).toEqual({
      scope: "upcoming",
      status: "CONFIRMED",
    });
    expect(bookingListVariables("past")).toEqual({
      scope: "past",
      status: "CONFIRMED",
    });
    expect(bookingListVariables("cancelled")).toEqual({
      scope: "all",
      status: "CANCELLED",
    });
  });

  it("plages d'une journée", () => {
    expect(
      intervalsError([
        { start: "09:00", end: "12:00" },
        { start: "14:00", end: "18:00" },
      ]),
    ).toBeNull();
    expect(intervalsError([{ start: "12:00", end: "09:00" }])).toBe(
      "La fin doit être après le début",
    );
    expect(
      intervalsError([
        { start: "14:00", end: "18:00" },
        { start: "09:00", end: "14:30" },
      ]),
    ).toBe("Les plages se chevauchent");
    expect(intervalsError([{ start: "9h", end: "12:00" }])).toBe(
      "Heure invalide",
    );
    expect(
      sortIntervals([
        { start: "14:00", end: "18:00", extra: 1 },
        { start: "09:00", end: "12:00" },
      ]),
    ).toEqual([
      { start: "09:00", end: "12:00" },
      { start: "14:00", end: "18:00" },
    ]);
    expect(nextIntervalAfter([])).toEqual({ start: "09:00", end: "17:00" });
    expect(nextIntervalAfter([{ start: "09:00", end: "12:00" }])).toEqual({
      start: "13:00",
      end: "14:00",
    });
    expect(nextIntervalAfter([{ start: "20:00", end: "23:00" }])).toEqual({
      start: "22:00",
      end: "23:00",
    });
  });

  it("code d'intégration", () => {
    expect(embedSnippet("https://www.newbi.fr/rdv/elodie-martin")).toContain(
      'src="https://www.newbi.fr/rdv/elodie-martin?embed=1"',
    );
  });
});
