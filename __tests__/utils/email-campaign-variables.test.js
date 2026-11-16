import { describe, it, expect } from "vitest";
import {
  DEFAULT_VARIABLES,
  designTexts,
  exampleValues,
  fillVariables,
  insertAtCursor,
  parseVariables,
  unknownDesignVariables,
  unknownVariables,
  variableToken,
  variablesWithoutFallback,
} from "@/src/utils/email-campaign-variables";

describe("repérage des variables", () => {
  it("trouve les variables, leur repli et leur position", () => {
    expect(
      parseVariables("Bonjour {{prenom|cher client}}, {{ ville }}"),
    ).toEqual([
      {
        raw: "{{prenom|cher client}}",
        key: "prenom",
        fallback: "cher client",
        index: 8,
      },
      { raw: "{{ ville }}", key: "ville", fallback: null, index: 32 },
    ]);
  });

  it("ignore les accolades simples et les textes vides", () => {
    expect(parseVariables("{prenom} et {{}}")).toEqual([]);
    expect(parseVariables(null)).toEqual([]);
  });

  it("signale les variables inconnues une seule fois, sans tenir compte de la casse", () => {
    expect(
      unknownVariables("{{prenon}} {{PRENOM}} {{prenon}} {{societe}}"),
    ).toEqual(["prenon", "societe"]);
    expect(unknownVariables("{{prenom}} {{nom_complet}}")).toEqual([]);
  });

  it("accepte la liste de variables renvoyée par l'API", () => {
    const variables = [{ key: "code_client", label: "Code", example: "C12" }];
    expect(unknownVariables("{{code_client}} {{prenom}}", variables)).toEqual([
      "prenom",
    ]);
  });

  it("liste les variables employées sans repli", () => {
    expect(
      variablesWithoutFallback("{{prenom}} {{prenom|Bonjour}} {{ville}}"),
    ).toEqual(["prenom", "ville"]);
  });
});

describe("insertion", () => {
  it("écrit le jeton avec ou sans repli, sans caractère qui le casserait", () => {
    expect(variableToken("prenom")).toBe("{{prenom}}");
    expect(variableToken("prenom", " Bonjour ")).toBe("{{prenom|Bonjour}}");
    expect(variableToken("prenom", "a|b}")).toBe("{{prenom|ab}}");
  });

  it("insère au curseur en remplaçant la sélection", () => {
    expect(insertAtCursor("Bonjour !", "{{prenom}}", 8, 8)).toEqual({
      text: "Bonjour {{prenom}}!",
      caret: 18,
    });
    expect(insertAtCursor("Bonjour XXX", "{{prenom}}", 8, 11)).toEqual({
      text: "Bonjour {{prenom}}",
      caret: 18,
    });
  });

  it("ajoute une espace si le texte précédent est collé, insère à la fin sans position", () => {
    expect(insertAtCursor("Bonjour", "{{prenom}}").text).toBe(
      "Bonjour {{prenom}}",
    );
    expect(insertAtCursor("", "{{prenom}}").text).toBe("{{prenom}}");
    expect(insertAtCursor("(", "{{prenom}}", 1, 1).text).toBe("({{prenom}}");
  });
});

describe("remplacement", () => {
  it("remplace par la valeur, sinon par le repli, sinon par rien", () => {
    expect(
      fillVariables("Bonjour {{prenom|à vous}}, {{ville}}", { prenom: "Léa" }),
    ).toBe("Bonjour Léa, ");
    expect(fillVariables("Bonjour {{prenom|à vous}}", { prenom: "  " })).toBe(
      "Bonjour à vous",
    );
  });

  it("laisse une variable inconnue visible", () => {
    expect(fillVariables("{{prenon}}", { prenon: "x" })).toBe("{{prenon}}");
  });

  it("donne les valeurs d'exemple", () => {
    expect(exampleValues().prenom).toBe(
      DEFAULT_VARIABLES.find((v) => v.key === "prenom").example,
    );
    expect(fillVariables("{{nom_complet}}", exampleValues())).toBe(
      "Camille Martin",
    );
  });
});

describe("variables du contenu", () => {
  it("parcourt les textes riches et les boutons", () => {
    const design = {
      blocks: [
        { type: "text", html: "<p>Bonjour {{prenon}}</p>" },
        { type: "button", label: "Voir {{ville}}", url: "https://x.fr/{{id}}" },
        { type: "imageText", html: "<p>a</p>", buttonLabel: "{{societe}}" },
        { type: "spacer" },
      ],
    };
    expect(designTexts(design)).toHaveLength(4);
    // L'adresse du bouton n'est jamais personnalisée : {{id}} n'est pas lu
    expect(unknownDesignVariables(design)).toEqual(["prenon", "societe"]);
  });
});
