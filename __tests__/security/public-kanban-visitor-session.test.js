import { describe, it, expect } from "vitest";
import {
  GET_PUBLIC_BOARD,
  ADD_EXTERNAL_COMMENT,
  UPDATE_VISITOR_PROFILE,
  UPLOAD_VISITOR_IMAGE,
  UPLOAD_EXTERNAL_COMMENT_IMAGE,
  REQUEST_ACCESS,
  PUBLIC_TASK_UPDATED_SUBSCRIPTION,
  AUTHENTICATE_INVITED_USER,
  REQUEST_INVITED_EMAIL_CODE,
} from "@/src/graphql/kanbanQueries";

// Arguments passés au champ racine d'une opération
const rootArguments = (document) => {
  const operation = document.definitions.find(
    (d) => d.kind === "OperationDefinition",
  );
  const field = operation.selectionSet.selections[0];
  return field.arguments.map((a) => a.name.value);
};

const rootSelections = (document) => {
  const operation = document.definitions.find(
    (d) => d.kind === "OperationDefinition",
  );
  return operation.selectionSet.selections[0].selectionSet.selections.map(
    (s) => s.name.value,
  );
};

// L'identité d'un visiteur d'un tableau partagé est sa session (adresse
// prouvée par code), plus jamais l'e-mail qu'il déclare
describe("Page visiteur d'un tableau partagé : session visiteur", () => {
  it.each([
    ["getPublicBoard", GET_PUBLIC_BOARD],
    ["addExternalComment", ADD_EXTERNAL_COMMENT],
    ["updateVisitorProfile", UPDATE_VISITOR_PROFILE],
    ["uploadVisitorImage", UPLOAD_VISITOR_IMAGE],
    ["uploadExternalCommentImage", UPLOAD_EXTERNAL_COMMENT_IMAGE],
    ["requestAccess", REQUEST_ACCESS],
    ["publicTaskUpdated", PUBLIC_TASK_UPDATED_SUBSCRIPTION],
  ])("%s envoie la session, pas d'e-mail déclaré", (_, document) => {
    const args = rootArguments(document);
    expect(args).toContain("sessionToken");
    expect(args).not.toContain("email");
    expect(args).not.toContain("visitorEmail");
  });

  it("getPublicBoard sait quand l'adresse doit être confirmée", () => {
    expect(rootSelections(GET_PUBLIC_BOARD)).toContain(
      "requiresVisitorSession",
    );
  });

  it("la connexion passe par un code envoyé par e-mail", () => {
    expect(rootArguments(REQUEST_INVITED_EMAIL_CODE)).toEqual([
      "token",
      "email",
    ]);
    expect(rootSelections(AUTHENTICATE_INVITED_USER)).toEqual(
      expect.arrayContaining(["sessionToken", "requiresEmailCode"]),
    );
  });
});
