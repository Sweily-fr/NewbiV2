import { describe, it, expect } from "vitest";
import { newEventTypeId, typeSelectionPatch } from "@/src/utils/event-types";

const RDV = {
  id: "type_rdv",
  name: "Rendez-vous client",
  color: "#3B82F6",
  allDay: false,
};
const SALON = {
  id: "type_salon",
  name: "Salon",
  color: "#F59E0B",
  allDay: true,
};

describe("choix du type d'un événement", () => {
  it("déclaration : titre, description, journée entière et couleur du modèle", () => {
    expect(
      typeSelectionPatch({ selection: { declarationKind: "VAT" } }),
    ).toMatchObject({
      declarationKind: "VAT",
      eventTypeId: null,
      title: "Déclaration de TVA",
      allDay: true,
      color: "#5A50FF",
    });
  });

  it("type de l'espace : son nom, sa couleur, sa journée entière", () => {
    expect(
      typeSelectionPatch({
        selection: { eventType: SALON },
        customTypes: [RDV, SALON],
      }),
    ).toEqual({
      declarationKind: null,
      eventTypeId: "type_salon",
      title: "Salon",
      description: "",
      allDay: true,
      color: "#F59E0B",
    });
    expect(typeSelectionPatch({ selection: { eventType: RDV } }).allDay).toBe(
      false,
    );
  });

  it("passe d'un type à l'autre sans garder le titre du précédent", () => {
    expect(
      typeSelectionPatch({
        selection: { eventType: RDV },
        current: {
          title: "Déclaration de TVA",
          description:
            "Déclarer et payer la TVA dans votre espace professionnel sur impots.gouv.fr.",
        },
        customTypes: [RDV],
      }),
    ).toMatchObject({ title: "Rendez-vous client", description: "" });
    expect(
      typeSelectionPatch({
        selection: {},
        current: { title: "Rendez-vous client" },
        customTypes: [RDV],
      }),
    ).toMatchObject({ declarationKind: null, eventTypeId: null, title: "" });
  });

  it("garde ce que l'utilisateur a écrit", () => {
    const patch = typeSelectionPatch({
      selection: { declarationKind: "URSSAF" },
      current: { title: "Urssaf d'octobre", description: "Penser au relevé" },
    });
    expect(patch).not.toHaveProperty("title");
    expect(patch).not.toHaveProperty("description");
    expect(patch.declarationKind).toBe("URSSAF");
  });

  it("« Événement » ne touche ni à l'heure ni à la couleur", () => {
    const patch = typeSelectionPatch({ selection: {}, current: { title: "" } });
    expect(patch).not.toHaveProperty("allDay");
    expect(patch).not.toHaveProperty("color");
  });

  it("identifiants de type distincts", () => {
    expect(newEventTypeId(1, 0.123456)).toMatch(/^type_/);
    expect(newEventTypeId(1, 0.1)).not.toBe(newEventTypeId(1, 0.2));
  });
});
