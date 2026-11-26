import { describe, expect, it } from "vitest";
import { timeOptions } from "@/app/dashboard/outils/rendez-vous/components/date-time-fields";

describe("timeOptions (heures de la prise de rendez-vous)", () => {
  it("quarts d'heure de 00:00 à 23:45", () => {
    const options = timeOptions();
    expect(options[0]).toBe("00:00");
    expect(options.at(-1)).toBe("23:45");
    expect(options).toHaveLength(96);
  });

  it("24:00 proposé pour une fin de plage", () => {
    expect(timeOptions({ endOfDay: true }).at(-1)).toBe("24:00");
  });

  it("une heure déjà enregistrée hors du pas reste dans la liste, à sa place", () => {
    const options = timeOptions({ extra: ["09:05"] });
    expect(options).toContain("09:05");
    expect(options.indexOf("09:05")).toBe(options.indexOf("09:00") + 1);
  });

  it("une valeur vide ou mal formée n'est pas ajoutée", () => {
    expect(timeOptions({ extra: ["", null, "9h"] })).toHaveLength(96);
  });
});
