import { describe, it, expect } from "vitest";
import {
  addMinutesToInput,
  buildRegistrationPayload,
  orderedPaymentMethods,
  registrationValidationOutcome,
  returnRequestFromParams,
  centsToEurosInput,
  checkInOutcome,
  compactCents,
  dueOnSiteLabel,
  eurosToCents,
  eventDepositAmount,
  eventNeedsOnlinePayment,
  eventOrderAmounts,
  eventPaymentMode,
  eventPaymentNotice,
  eventPaymentShortLabel,
  registrationDueOnSite,
  registrationPaymentLine,
  registrationSubmitLabel,
  eventFormErrors,
  eventFormToInput,
  eventImageError,
  eventPriceLabel,
  eventScheduleLabel,
  eventTypeToForm,
  isoToZonedInput,
  nextReturnPollDelay,
  unconfirmedRegistrationMessage,
  parseTicketCode,
  quantityChoices,
  registrationsCsvFileName,
  seatsLabel,
  seatsLeftLabel,
  zonedInputToIso,
} from "@/src/utils/booking-events";

const TOKEN = "AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-abcde"; // 43 caractères

describe("euros et centimes", () => {
  it("convertit la saisie en centimes entiers", () => {
    expect(eurosToCents("15")).toBe(1500);
    expect(eurosToCents("15,5")).toBe(1550);
    expect(eurosToCents("15.50")).toBe(1550);
    expect(eurosToCents("0,50")).toBe(50);
    expect(eurosToCents("1 500,00 €")).toBe(150000);
    expect(eurosToCents("19,99")).toBe(1999);
    expect(eurosToCents("0,1")).toBe(10);
  });
  it("vide = gratuit, saisie illisible = NaN", () => {
    expect(eurosToCents("")).toBe(0);
    expect(eurosToCents(null)).toBe(0);
    expect(eurosToCents("abc")).toBeNaN();
    expect(eurosToCents("12,345")).toBeNaN();
    expect(eurosToCents("-5")).toBeNaN();
  });
  it("évite les erreurs d'arrondi des flottants", () => {
    // 0.29 * 100 = 28.999999999999996 en flottant
    expect(eurosToCents("0,29")).toBe(29);
    expect(eurosToCents("1,15")).toBe(115);
  });
  it("centimes → champ et libellé", () => {
    expect(centsToEurosInput(1500)).toBe("15");
    expect(centsToEurosInput(1550)).toBe("15,50");
    expect(centsToEurosInput(5)).toBe("0,05");
    expect(centsToEurosInput(0)).toBe("");
    expect(centsToEurosInput(null)).toBe("");
    expect(eventPriceLabel(null)).toBe("Gratuit");
    expect(eventPriceLabel({ amount: 0, currency: "EUR" })).toBe("Gratuit");
    expect(eventPriceLabel({ amount: 1500, currency: "EUR" })).toMatch(
      /^15,00\s€$/,
    );
  });
});

describe("dates dans le fuseau de la page", () => {
  it("lit l'heure saisie dans le fuseau de la page", () => {
    // Hiver : Paris = UTC+1
    expect(zonedInputToIso("2026-12-12T19:00", "Europe/Paris")).toBe(
      "2026-12-12T18:00:00.000Z",
    );
    // Été : Paris = UTC+2
    expect(zonedInputToIso("2026-07-01T09:30", "Europe/Paris")).toBe(
      "2026-07-01T07:30:00.000Z",
    );
    expect(zonedInputToIso("2026-12-12T19:00", "America/New_York")).toBe(
      "2026-12-13T00:00:00.000Z",
    );
    expect(zonedInputToIso("2026-12-12T19:00", "UTC")).toBe(
      "2026-12-12T19:00:00.000Z",
    );
  });
  it("encadre les changements d'heure", () => {
    // 29/03/2026 : 03:00 à Paris = 01:00 UTC (passage à l'heure d'été)
    expect(zonedInputToIso("2026-03-29T03:00", "Europe/Paris")).toBe(
      "2026-03-29T01:00:00.000Z",
    );
    expect(zonedInputToIso("2026-03-29T01:59", "Europe/Paris")).toBe(
      "2026-03-29T00:59:00.000Z",
    );
    // 25/10/2026 : 04:00 à Paris = 03:00 UTC (retour à l'heure d'hiver)
    expect(zonedInputToIso("2026-10-25T04:00", "Europe/Paris")).toBe(
      "2026-10-25T03:00:00.000Z",
    );
  });
  it("aller-retour ISO ↔ champ", () => {
    for (const zone of ["Europe/Paris", "America/New_York", "Asia/Tokyo"]) {
      const iso = "2026-12-12T18:00:00.000Z";
      expect(zonedInputToIso(isoToZonedInput(iso, zone), zone)).toBe(iso);
    }
    expect(isoToZonedInput("2026-12-12T23:30:00.000Z", "Europe/Paris")).toBe(
      "2026-12-13T00:30",
    );
    expect(isoToZonedInput(null)).toBe("");
    expect(zonedInputToIso("")).toBeNull();
    expect(zonedInputToIso("12/12/2026 19:00")).toBeNull();
  });
  it("décale une heure saisie", () => {
    expect(addMinutesToInput("2026-12-12T23:00", 120)).toBe("2026-12-13T01:00");
    expect(addMinutesToInput("", 60)).toBe("");
  });
  it("libellé de date d'un événement", () => {
    expect(
      eventScheduleLabel(
        "2026-12-12T18:00:00.000Z",
        "2026-12-12T21:00:00.000Z",
        "Europe/Paris",
      ),
    ).toEqual({ date: "Samedi 12 décembre 2026", time: "19:00 - 22:00" });
    expect(
      eventScheduleLabel(
        "2026-12-12T18:00:00.000Z",
        "2026-12-13T01:00:00.000Z",
        "Europe/Paris",
      ),
    ).toEqual({
      date: "Du samedi 12 décembre 2026 à 19:00",
      time: "au dimanche 13 décembre 2026 à 02:00",
    });
  });
});

describe("analyse du QR code et du numéro saisi", () => {
  it("garde le jeton de l'URL du billet", () => {
    expect(parseTicketCode(`https://www.newbi.fr/rdv/billet/${TOKEN}`)).toEqual(
      { kind: "token", code: TOKEN },
    );
    expect(
      parseTicketCode(`http://localhost:3000/rdv/billet/${TOKEN}?x=1`),
    ).toEqual({ kind: "token", code: TOKEN });
    expect(parseTicketCode(`  ${TOKEN}\n`)).toEqual({
      kind: "token",
      code: TOKEN,
    });
  });
  it("normalise un numéro saisi à la main", () => {
    expect(parseTicketCode("EVT-7K3M9Q")).toEqual({
      kind: "number",
      code: "EVT-7K3M9Q",
    });
    expect(parseTicketCode("evt 7k3m 9q")).toEqual({
      kind: "number",
      code: "EVT-7K3M9Q",
    });
    expect(parseTicketCode("7K3M9Q")).toEqual({
      kind: "number",
      code: "EVT-7K3M9Q",
    });
  });
  it("refuse ce qui n'est pas un billet", () => {
    expect(parseTicketCode("")).toBeNull();
    expect(parseTicketCode("https://exemple.com/promo")).toBeNull();
    expect(parseTicketCode("https://www.newbi.fr/rdv/billet/court")).toBeNull();
    expect(parseTicketCode("Bonjour à tous")).toBeNull();
  });
  it("résultat d'un contrôle : vert, orange, rouge", () => {
    const ticket = {
      number: "EVT-7K3M9Q",
      attendeeName: "Élise Martin",
      checkedInAt: "2026-12-12T18:42:00.000Z",
    };
    expect(checkInOutcome({ result: "VALID", ticket })).toMatchObject({
      tone: "success",
      name: "Élise Martin",
      detail: "Billet EVT-7K3M9Q",
    });
    const already = checkInOutcome(
      { result: "ALREADY_CHECKED_IN", ticket },
      { timeZone: "Europe/Paris" },
    );
    expect(already.tone).toBe("warning");
    expect(already.detail).toContain("le 12/12/2026 à 19:42");
    expect(checkInOutcome({ result: "CANCELLED", ticket }).tone).toBe("error");
    expect(checkInOutcome({ result: "NOT_PAID", ticket }).tone).toBe("error");
    expect(
      checkInOutcome({ result: "OTHER_EVENT", otherEventName: "Gala" }).detail,
    ).toBe("Billet pour « Gala »");
    expect(checkInOutcome(null).title).toBe("Billet inconnu");
  });
});

describe("places", () => {
  it("libellés", () => {
    expect(seatsLabel({ seatsTaken: 12, capacity: 50 })).toBe("12 / 50 places");
    expect(seatsLabel({ seatsTaken: 1, capacity: null })).toBe("1 place prise");
    expect(seatsLeftLabel(0)).toBe("Complet");
    expect(seatsLeftLabel(1)).toBe("Dernière place");
    expect(seatsLeftLabel(7)).toBe("7 places restantes");
    expect(seatsLeftLabel(null)).toBeNull();
  });
  it("quantités proposées", () => {
    expect(quantityChoices(5, null)).toEqual([1, 2, 3, 4, 5]);
    expect(quantityChoices(5, 2)).toEqual([1, 2]);
    expect(quantityChoices(5, 0)).toEqual([]);
  });
  it("nom du fichier d'export", () => {
    expect(registrationsCsvFileName("Soirée de lancement !")).toBe(
      "inscrits-soiree-de-lancement.csv",
    );
    expect(registrationsCsvFileName("")).toBe("inscrits-evenement.csv");
  });
});

describe("formulaire d'événement", () => {
  const now = new Date("2026-11-26T12:00:00.000Z");
  const valid = {
    ...eventTypeToForm(null),
    name: "Soirée de lancement",
    slug: "soiree-de-lancement",
    startAt: "2026-12-12T19:00",
    endAt: "2026-12-12T22:00",
    locationKind: "IN_PERSON",
    locationValue: "12 rue de la Paix, 75002 Paris",
    priceText: "15,50",
    capacity: 50,
  };

  it("valeurs par défaut d'un nouvel événement", () => {
    const form = eventTypeToForm(null);
    expect(form.maxPerOrder).toBe(5);
    expect(form.capacity).toBeNull();
    expect(form.priceText).toBe("");
    expect(form.locationKind).toBe("IN_PERSON");
  });

  it("formulaire valide → input en centimes et en UTC", () => {
    expect(
      eventFormErrors(valid, {
        timeZone: "Europe/Paris",
        isCreation: true,
        now,
      }),
    ).toEqual({});
    const input = eventFormToInput(valid, {
      timeZone: "Europe/Paris",
      isCreation: true,
    });
    expect(input).toMatchObject({
      kind: "EVENT",
      name: "Soirée de lancement",
      startAt: "2026-12-12T18:00:00.000Z",
      endAt: "2026-12-12T21:00:00.000Z",
      registrationClosesAt: null,
      capacity: 50,
      maxPerOrder: 5,
      price: { amount: 1550, currency: "EUR" },
      location: { kind: "IN_PERSON", value: "12 rue de la Paix, 75002 Paris" },
      coverImageUrl: null,
      imageUrl: null,
    });
  });

  it("modification : prix envoyé seulement s'il change", () => {
    const same = eventFormToInput(
      { ...valid, priceText: "15,50" },
      { timeZone: "Europe/Paris", initialPriceCents: 1550 },
    );
    expect(same).not.toHaveProperty("price");
    const changed = eventFormToInput(
      { ...valid, priceText: "20" },
      { timeZone: "Europe/Paris", initialPriceCents: 1550 },
    );
    expect(changed.price).toEqual({ amount: 2000, currency: "EUR" });
    const madeFree = eventFormToInput(
      { ...valid, priceText: "" },
      { timeZone: "Europe/Paris", initialPriceCents: 1550 },
    );
    expect(madeFree.price).toBeNull();
    const stillFree = eventFormToInput(
      { ...valid, priceText: "" },
      { timeZone: "Europe/Paris", initialPriceCents: null },
    );
    expect(stillFree).not.toHaveProperty("price");
  });

  it("gratuit : prix null ; modification : pas de kind", () => {
    const input = eventFormToInput(
      { ...valid, priceText: "" },
      { timeZone: "Europe/Paris", initialPriceCents: 1500 },
    );
    expect(input.price).toBeNull();
    expect(input).not.toHaveProperty("kind");
  });

  it("refuse les incohérences", () => {
    const errors = eventFormErrors(
      {
        ...valid,
        name: " ",
        startAt: "2026-11-01T10:00",
        endAt: "2026-10-31T10:00",
        priceText: "0,20",
        capacity: 0,
        maxPerOrder: 11,
        locationValue: "",
      },
      { timeZone: "Europe/Paris", isCreation: true, now },
    );
    expect(Object.keys(errors).sort()).toEqual(
      [
        "capacity",
        "endAt",
        "locationValue",
        "maxPerOrder",
        "name",
        "price",
        "startAt",
      ].sort(),
    );
    expect(
      eventFormErrors(
        { ...valid, registrationClosesAt: "2026-12-12T20:00" },
        { timeZone: "Europe/Paris", now },
      ).registrationClosesAt,
    ).toBeDefined();
    expect(
      eventFormErrors({ ...valid, capacity: 10 }, { seatsTaken: 12, now })
        .capacity,
    ).toBe("Déjà 12 places prises");
    expect(
      eventFormErrors(
        { ...valid, locationKind: "CUSTOM_LINK", locationValue: "http://x.fr" },
        { now },
      ).locationValue,
    ).toBeDefined();
  });

  it("relit un événement existant dans le fuseau de la page", () => {
    const form = eventTypeToForm(
      {
        name: "Gala",
        slug: "gala",
        kind: "EVENT",
        startAt: "2026-12-12T18:00:00.000Z",
        endAt: "2026-12-12T21:00:00.000Z",
        registrationClosesAt: "2026-12-12T18:00:00.000Z",
        price: { amount: 2000, currency: "EUR" },
        capacity: 80,
        maxPerOrder: 4,
        location: { kind: "CUSTOM_LINK", value: "https://zoom.us/j/1" },
      },
      { timeZone: "Europe/Paris" },
    );
    expect(form).toMatchObject({
      startAt: "2026-12-12T19:00",
      endAt: "2026-12-12T22:00",
      registrationClosesAt: "",
      priceText: "20",
      capacity: 80,
      maxPerOrder: 4,
      locationKind: "CUSTOM_LINK",
    });
  });

  it("contrôle des images", () => {
    expect(eventImageError({ type: "image/png", size: 1000 })).toBeNull();
    expect(eventImageError({ type: "image/gif", size: 1000 })).toMatch(
      /Format/,
    );
    expect(
      eventImageError({ type: "image/jpeg", size: 6 * 1024 * 1024 }),
    ).toMatch(/5 Mo/);
  });
});

describe("inscription publique", () => {
  it("corps de l'inscription", () => {
    expect(
      buildRegistrationPayload(
        {
          firstName: " Élise ",
          lastName: "Martin",
          email: " Elise@Exemple.FR ",
          phone: "",
        },
        { quantity: 2, timezone: "Europe/Paris", provider: "stripe" },
      ),
    ).toEqual({
      buyer: {
        firstName: "Élise",
        lastName: "Martin",
        email: "elise@exemple.fr",
        phone: null,
      },
      quantity: 2,
      timezone: "Europe/Paris",
      provider: "stripe",
      turnstileToken: "",
      website: "",
    });
    expect(
      buildRegistrationPayload(
        { firstName: "A", lastName: "B", email: "a@b.fr" },
        { quantity: 1, timezone: "UTC" },
      ),
    ).not.toHaveProperty("provider");
  });
  it("refus de l'API", () => {
    expect(
      registrationValidationOutcome({
        email: "Adresse e-mail invalide",
        quantity: "Choisissez entre 1 et 3 places.",
      }),
    ).toEqual({
      inputs: {
        email: "Adresse e-mail invalide",
        quantity: "Choisissez entre 1 et 3 places.",
      },
      message: "Certaines informations sont à corriger.",
    });
    expect(
      registrationValidationOutcome({ turnstileToken: "Vérification échouée" })
        .message,
    ).toBe("Vérification échouée");
  });
  it("moyens de paiement dans l'ordre", () => {
    expect(orderedPaymentMethods(["paypal", "stripe", "x"])).toEqual([
      "stripe",
      "paypal",
    ]);
  });
  it("retour du paiement", () => {
    expect(
      returnRequestFromParams(
        new URLSearchParams("rt=abc&provider=stripe&session_id=cs_1"),
      ),
    ).toEqual({
      returnToken: "abc",
      provider: "stripe",
      sessionId: "cs_1",
      orderId: null,
      canceled: false,
    });
    expect(
      returnRequestFromParams({
        rt: "abc",
        provider: "paypal",
        token: "ORDER1",
        PayerID: "P",
      }),
    ).toMatchObject({ orderId: "ORDER1", sessionId: null });
    expect(returnRequestFromParams({ rt: "abc", canceled: "1" }).canceled).toBe(
      true,
    );
    expect(returnRequestFromParams({})).toBeNull();
  });
});

describe("vérification du retour de paiement", () => {
  it("ralentit puis s'arrête après trois minutes", () => {
    expect(nextReturnPollDelay(1, 0)).toBe(3000);
    expect(nextReturnPollDelay(2, 3000)).toBe(6000);
    expect(nextReturnPollDelay(3, 9000)).toBe(10000);
    expect(nextReturnPollDelay(4, 19000)).toBe(15000);
    expect(nextReturnPollDelay(10, 160000)).toBe(15000);
    expect(nextReturnPollDelay(11, 170000)).toBeNull();
  });
});

describe("messages d'une inscription non confirmée", () => {
  it("un message juste par cas", () => {
    expect(
      unconfirmedRegistrationMessage({
        registration: { status: "EXPIRED" },
        paymentStatus: "paid",
        refundStatus: "REFUNDED",
      }).title,
    ).toBe("Paiement remboursé");
    const manual = unconfirmedRegistrationMessage({
      registration: { status: "CANCELLED", refundStatus: "MANUAL" },
      paymentStatus: "paid",
      organizerName: "Studio Lumière",
    });
    expect(manual.title).toBe("Paiement reçu, inscription non confirmée");
    expect(manual.text).toContain("Contactez Studio Lumière");
    expect(manual.text).not.toContain("non effectué");
    expect(
      unconfirmedRegistrationMessage({
        registration: { status: "EXPIRED" },
        paymentStatus: "unpaid",
        canceledByPayer: true,
      }).title,
    ).toBe("Paiement annulé");
    expect(
      unconfirmedRegistrationMessage({
        registration: { status: "EXPIRED" },
        paymentStatus: "unpaid",
      }).title,
    ).toBe("Paiement non effectué");
    expect(
      unconfirmedRegistrationMessage({
        registration: { status: "CANCELLED", refundStatus: "NONE" },
      }).title,
    ).toBe("Inscription annulée");
    expect(
      unconfirmedRegistrationMessage({ paymentStatus: "pending" }).restart,
    ).toBe(false);
  });
});

describe("acompte et paiement sur place", () => {
  const price = { amount: 2000, currency: "EUR" };
  const base = {
    ...eventTypeToForm(null),
    name: "Soirée de lancement",
    slug: "soiree-de-lancement",
    startAt: "2026-12-12T19:00",
    endAt: "2026-12-12T22:00",
    locationKind: "IN_PERSON",
    locationValue: "12 rue de la Paix, 75002 Paris",
    priceText: "20",
  };
  const errorsOf = (form) =>
    eventFormErrors(form, { timeZone: "Europe/Paris" });
  const nbsp = (text) => text.replace(/[\u00a0\u202f]/g, " ");

  it("mode effectif : gratuit = null, champ absent = ONLINE", () => {
    expect(
      eventPaymentMode({ price: null, paymentMode: "ON_SITE" }),
    ).toBeNull();
    expect(eventPaymentMode({ price })).toBe("ONLINE");
    expect(eventPaymentMode({ price, paymentMode: "DEPOSIT" })).toBe("DEPOSIT");
    expect(eventPaymentMode({ price, paymentMode: "BIZARRE" })).toBe("ONLINE");
  });

  it("acompte lu seulement en DEPOSIT et s'il est inférieur au prix", () => {
    expect(
      eventDepositAmount({ price, paymentMode: "DEPOSIT", depositAmount: 500 }),
    ).toBe(500);
    expect(
      eventDepositAmount({ price, paymentMode: "ONLINE", depositAmount: 500 }),
    ).toBe(0);
    expect(
      eventDepositAmount({
        price,
        paymentMode: "DEPOSIT",
        depositAmount: 2000,
      }),
    ).toBe(0);
  });

  it("montants d'une commande selon le mode", () => {
    expect(eventOrderAmounts({ price }, 2)).toEqual({
      mode: "ONLINE",
      total: 4000,
      online: 4000,
      onSite: 0,
    });
    expect(
      eventOrderAmounts(
        { price, paymentMode: "DEPOSIT", depositAmount: 500 },
        2,
      ),
    ).toEqual({
      mode: "DEPOSIT",
      total: 4000,
      online: 1000,
      onSite: 3000,
    });
    expect(eventOrderAmounts({ price, paymentMode: "ON_SITE" }, 3)).toEqual({
      mode: "ON_SITE",
      total: 6000,
      online: 0,
      onSite: 6000,
    });
    expect(eventOrderAmounts({ price: null }, 2).total).toBe(0);
    expect(eventNeedsOnlinePayment({ price, paymentMode: "ON_SITE" })).toBe(
      false,
    );
    expect(
      eventNeedsOnlinePayment({
        price,
        paymentMode: "DEPOSIT",
        depositAmount: 500,
      }),
    ).toBe(true);
    expect(eventNeedsOnlinePayment({ price: null })).toBe(false);
  });

  it("libellés : carte, page publique, bouton", () => {
    expect(nbsp(compactCents(500))).toBe("5 €");
    expect(nbsp(compactCents(550))).toBe("5,50 €");
    expect(
      nbsp(
        eventPaymentShortLabel({
          price,
          paymentMode: "DEPOSIT",
          depositAmount: 500,
        }),
      ),
    ).toBe("acompte 5 €");
    expect(eventPaymentShortLabel({ price, paymentMode: "ON_SITE" })).toBe(
      "sur place",
    );
    expect(eventPaymentShortLabel({ price })).toBeNull();
    expect(eventPaymentNotice({ price, paymentMode: "ON_SITE" })).toBe(
      "Paiement sur place le jour de l'événement",
    );
    expect(
      nbsp(
        eventPaymentNotice({
          price,
          paymentMode: "DEPOSIT",
          depositAmount: 500,
        }),
      ),
    ).toBe(
      "Acompte de 5,00 € par place à la réservation, reste 15,00 € sur place",
    );
    expect(eventPaymentNotice({ price })).toBeNull();
    expect(nbsp(registrationSubmitLabel({ price }, 2))).toBe("Payer 40,00 €");
    expect(
      nbsp(
        registrationSubmitLabel(
          { price, paymentMode: "DEPOSIT", depositAmount: 500 },
          2,
        ),
      ),
    ).toBe("Payer l'acompte 10,00 €");
    expect(registrationSubmitLabel({ price, paymentMode: "ON_SITE" }, 1)).toBe(
      "Je m'inscris",
    );
    expect(registrationSubmitLabel({ price, paymentMode: "ON_SITE" }, 3)).toBe(
      "Réserver 3 places",
    );
    expect(registrationSubmitLabel({ price: null }, 1)).toBe("Je m'inscris");
  });

  it("ligne de paiement d'une inscription, comme les e-mails", () => {
    const confirmed = { status: "CONFIRMED", currency: "EUR", amount: 2000 };
    expect(
      nbsp(
        registrationPaymentLine({
          ...confirmed,
          paymentMode: "ONLINE",
          amountOnline: 2000,
          amountDueOnSite: 0,
        }),
      ),
    ).toBe("Payé en ligne : 20,00 €");
    expect(
      nbsp(
        registrationPaymentLine({
          ...confirmed,
          paymentMode: "DEPOSIT",
          amountOnline: 500,
          amountDueOnSite: 1500,
        }),
      ),
    ).toBe("Acompte payé : 5,00 €. Reste à régler sur place : 15,00 €");
    expect(
      nbsp(
        registrationPaymentLine({
          ...confirmed,
          paymentMode: "ON_SITE",
          amountOnline: 0,
          amountDueOnSite: 2000,
        }),
      ),
    ).toBe("À régler sur place : 20,00 €");
    expect(
      nbsp(
        registrationPaymentLine({
          ...confirmed,
          paymentMode: "ON_SITE",
          amountOnline: 0,
          amountDueOnSite: 2000,
          onSitePaidAt: "2026-12-12T19:00:00.000Z",
        }),
      ),
    ).toBe("Réglé sur place : 20,00 €");
    expect(registrationPaymentLine({ ...confirmed, amount: 0 })).toBe(
      "Gratuit",
    );
    // Inscription d'avant le choix du mode : repli sur « payé en ligne »
    expect(
      nbsp(
        registrationPaymentLine({ ...confirmed, paymentProvider: "stripe" }),
      ),
    ).toBe("Payé en ligne : 20,00 €");
    expect(
      nbsp(
        registrationPaymentLine({
          status: "PENDING_PAYMENT",
          currency: "EUR",
          amount: 2000,
          paymentMode: "DEPOSIT",
          amountOnline: 500,
          amountDueOnSite: 1500,
        }),
      ),
    ).toBe(
      "Acompte à payer en ligne : 5,00 €. Reste à régler sur place : 15,00 €",
    );
  });

  it("acompte réglé : « Reste réglé sur place »", () => {
    expect(
      nbsp(
        registrationPaymentLine({
          status: "CONFIRMED",
          currency: "EUR",
          amount: 2000,
          paymentMode: "DEPOSIT",
          amountOnline: 500,
          amountDueOnSite: 1500,
          onSitePaidAt: "2026-12-12T19:00:00.000Z",
        }),
      ),
    ).toBe("Acompte payé : 5,00 €. Reste réglé sur place : 15,00 €");
  });

  it("reste dû : nul une fois réglé sur place", () => {
    const registration = {
      status: "CONFIRMED",
      amount: 2000,
      paymentMode: "ON_SITE",
      amountDueOnSite: 2000,
    };
    expect(registrationDueOnSite(registration)).toBe(2000);
    expect(
      registrationDueOnSite({
        ...registration,
        onSitePaidAt: "2026-12-12T19:00:00.000Z",
      }),
    ).toBe(0);
    expect(
      registrationDueOnSite({
        status: "CONFIRMED",
        amount: 2000,
        paymentProvider: "stripe",
      }),
    ).toBe(0);
  });

  it("contrôle : le reste dû accompagne un billet valable", () => {
    const registration = {
      id: "r1",
      status: "CONFIRMED",
      amount: 1500,
      currency: "EUR",
      paymentMode: "DEPOSIT",
      amountOnline: 500,
      amountDueOnSite: 1000,
    };
    const outcome = checkInOutcome({
      result: "VALID",
      ticket: { number: "EVT-1" },
      registration,
    });
    expect(outcome).toMatchObject({
      tone: "success",
      dueOnSite: 1000,
      registrationId: "r1",
    });
    expect(nbsp(dueOnSiteLabel(1000, "EUR"))).toBe(
      "Reste à régler sur place : 10,00 €",
    );
    expect(
      checkInOutcome({
        result: "VALID",
        registration: { ...registration, onSitePaidAt: "2026-12-12" },
      }),
    ).not.toHaveProperty("dueOnSite");
    expect(
      checkInOutcome({ result: "CANCELLED", registration }),
    ).not.toHaveProperty("dueOnSite");
  });

  it("formulaire : mode lu du type, acompte en euros", () => {
    const form = eventTypeToForm({
      price,
      paymentMode: "DEPOSIT",
      depositAmount: 550,
    });
    expect(form.paymentMode).toBe("DEPOSIT");
    expect(form.depositText).toBe("5,50");
    expect(eventTypeToForm({ price }).paymentMode).toBe("ONLINE");
    expect(eventTypeToForm(null).depositText).toBe("");
  });

  it("validation : acompte obligatoire, inférieur au prix", () => {
    expect(
      errorsOf({ ...base, paymentMode: "DEPOSIT", depositText: "" }).deposit,
    ).toBe("Indiquez le montant de l'acompte");
    expect(
      errorsOf({ ...base, paymentMode: "DEPOSIT", depositText: "20" }).deposit,
    ).toBe("L'acompte doit être inférieur au prix par place");
    expect(
      errorsOf({ ...base, paymentMode: "DEPOSIT", depositText: "25" }).deposit,
    ).toBeDefined();
    expect(
      errorsOf({ ...base, paymentMode: "DEPOSIT", depositText: "abc" }).deposit,
    ).toMatch(/invalide/);
    expect(
      errorsOf({ ...base, paymentMode: "DEPOSIT", depositText: "0,20" })
        .deposit,
    ).toBe("0,50 € minimum");
    expect(
      errorsOf({ ...base, paymentMode: "DEPOSIT", depositText: "5" }),
    ).toEqual({});
    expect(
      errorsOf({ ...base, paymentMode: "ON_SITE", depositText: "abc" }),
    ).toEqual({});
    // Gratuit : mode et acompte ignorés
    expect(
      errorsOf({
        ...base,
        priceText: "",
        paymentMode: "DEPOSIT",
        depositText: "",
      }),
    ).toEqual({});
  });

  it("création : prix, mode et acompte envoyés en centimes", () => {
    const opts = { timeZone: "Europe/Paris", isCreation: true };
    expect(
      eventFormToInput(
        { ...base, paymentMode: "DEPOSIT", depositText: "5,50" },
        opts,
      ),
    ).toMatchObject({
      price: { amount: 2000, currency: "EUR" },
      paymentMode: "DEPOSIT",
      depositAmount: 550,
    });
    expect(
      eventFormToInput(
        { ...base, paymentMode: "ON_SITE", depositText: "5" },
        opts,
      ),
    ).toMatchObject({
      paymentMode: "ON_SITE",
      depositAmount: null,
    });
    expect(
      eventFormToInput(
        { ...base, priceText: "", paymentMode: "ON_SITE" },
        opts,
      ),
    ).toMatchObject({
      price: null,
      paymentMode: null,
      depositAmount: null,
    });
  });

  it("modification : prix, mode et acompte envoyés ensemble, seulement s'ils changent", () => {
    const initial = {
      timeZone: "Europe/Paris",
      initialPriceCents: 2000,
      initialPaymentMode: "DEPOSIT",
      initialDepositAmount: 500,
    };
    const same = eventFormToInput(
      { ...base, paymentMode: "DEPOSIT", depositText: "5" },
      initial,
    );
    expect(same).not.toHaveProperty("price");
    expect(same).not.toHaveProperty("paymentMode");
    expect(same).not.toHaveProperty("depositAmount");

    const deposit = eventFormToInput(
      { ...base, paymentMode: "DEPOSIT", depositText: "8" },
      initial,
    );
    expect(deposit).toMatchObject({
      price: { amount: 2000 },
      paymentMode: "DEPOSIT",
      depositAmount: 800,
    });

    const onSite = eventFormToInput(
      { ...base, paymentMode: "ON_SITE", depositText: "5" },
      initial,
    );
    expect(onSite).toMatchObject({
      paymentMode: "ON_SITE",
      depositAmount: null,
    });

    // Type d'avant le choix du mode (champ absent) : ONLINE, rien n'est envoyé
    const legacy = eventFormToInput(
      { ...eventTypeToForm({ price }), ...base },
      { timeZone: "Europe/Paris", initialPriceCents: 2000 },
    );
    expect(legacy).not.toHaveProperty("paymentMode");
    expect(legacy).not.toHaveProperty("price");

    const madeFree = eventFormToInput(
      { ...base, priceText: "", paymentMode: "DEPOSIT" },
      initial,
    );
    expect(madeFree).toMatchObject({
      price: null,
      paymentMode: null,
      depositAmount: null,
    });
  });
});
