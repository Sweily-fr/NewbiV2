import { describe, it, expect } from "vitest";
import { throwIfMutationErrors } from "@/src/graphql/mutationErrors";
import { getErrorMessage } from "@/src/utils/errorMessages";

describe("throwIfMutationErrors", () => {
  it("ne fait rien quand la mutation a réussi", () => {
    expect(() =>
      throwIfMutationErrors({ data: { updateQuote: { id: "1" } } }),
    ).not.toThrow();
    expect(() => throwIfMutationErrors(undefined)).not.toThrow();
  });

  // errorPolicy "all" : un refus de l'API arrive dans `errors`, sans rejet.
  // Il doit être relancé avec son code pour que l'éditeur affiche le message
  // de l'API au lieu de s'arrêter sans rien dire.
  it("relance le refus de l'API avec un message affichable", () => {
    const result = {
      data: { updateQuote: null },
      errors: [
        {
          message:
            "Les notes de bas de page contiennent des caractères non autorisés",
          extensions: { code: "VALIDATION_ERROR" },
        },
      ],
    };

    let thrown;
    try {
      throwIfMutationErrors(result);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(Error);
    expect(getErrorMessage(thrown, "quote")).toBe(
      "Les notes de bas de page contiennent des caractères non autorisés",
    );
  });
});
