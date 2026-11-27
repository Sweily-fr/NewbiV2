import { describe, it, expect } from "vitest";
import { Kind, parse } from "graphql";
import {
  GET_EMAIL_CAMPAIGN_LINK_TARGETS,
  GET_EMAIL_CAMPAIGN_SIGNATURES,
} from "@/src/graphql/emailCampaignQueries";
import {
  BLOCK_LABELS,
  BLOCK_TYPES,
  DEFAULT_PADDING,
  addBlock,
  blockWithDefaults,
  createBlock,
  defaultSignatureId,
  normalizeDesign,
  signatureIdOf,
  signatureIdsOf,
} from "@/src/utils/email-campaign-design";
import {
  CUSTOM_LINK,
  eventDateLabel,
  findLinkTarget,
  groupLinkTargets,
  linkTargetLabel,
} from "@/src/utils/email-campaign-links";
import { checkTarget } from "@/src/utils/email-campaigns";
import {
  SENDING_DOMAIN_ERRORS,
  checkSenderEmail,
  freeEmailExplanation,
  freeEmailProviderName,
} from "@/src/utils/email-sending-domain";

const ID = "65a1b2c3d4e5f6a7b8c9d0e2";
const OTHER = "65a1b2c3d4e5f6a7b8c9d0e3";

describe("bloc Signature", () => {
  it("fait partie des blocs, avec ses valeurs par défaut", () => {
    expect(BLOCK_TYPES).toContain("signature");
    expect(BLOCK_LABELS.signature).toBe("Signature");
    const block = createBlock("signature");
    expect(block).toMatchObject({
      type: "signature",
      signatureId: "",
      align: "left",
      padding: DEFAULT_PADDING.signature,
    });
    expect(createBlock("signature", { signatureId: ID }).signatureId).toBe(ID);
  });

  it("identifiant contrôlé comme par l'API", () => {
    expect(signatureIdOf(` ${ID.toUpperCase()} `)).toBe(ID);
    expect(signatureIdOf("pas-un-id")).toBe("");
    expect(signatureIdOf(null)).toBe("");
    expect(
      blockWithDefaults({ id: "s", type: "signature", signatureId: "x" }),
    ).toMatchObject({ signatureId: "", align: "left" });
    expect(
      blockWithDefaults({ id: "s", type: "signature", align: "nulle-part" })
        .align,
    ).toBe("left");
  });

  it("identifiants choisis dans un contenu, sans doublon ni bloc vide", () => {
    const content = normalizeDesign({
      blocks: [
        { id: "a", type: "signature", signatureId: ID },
        { id: "b", type: "signature", signatureId: ID.toUpperCase() },
        { id: "c", type: "signature", signatureId: OTHER },
        { id: "d", type: "signature", signatureId: "" },
        { id: "e", type: "text", html: "<p>x</p>" },
      ],
    });
    expect(signatureIdsOf(content)).toEqual([ID, OTHER]);
    expect(signatureIdsOf(null)).toEqual([]);
  });

  it("ajout : signature proposée d'office, contenu existant inchangé", () => {
    const before = normalizeDesign({
      blocks: [{ id: "t", type: "text", html: "<p>Bonjour</p>" }],
    });
    const snapshot = JSON.stringify(before);
    const { design, block } = addBlock(before, "signature", "t", {
      signatureId: ID,
    });
    expect(design.blocks.map((item) => item.type)).toEqual([
      "text",
      "signature",
    ]);
    expect(block.signatureId).toBe(ID);
    expect(JSON.stringify(before)).toBe(snapshot);
    expect(design.blocks[0]).toBe(before.blocks[0]);
  });

  it("signature introuvable signalée avant l'envoi : corrigée dans l'éditeur", () => {
    expect(checkTarget("signature_missing")).toEqual({ editor: true });
  });

  it("signature proposée : la principale de l'utilisateur, sinon la première", () => {
    expect(
      defaultSignatureId([
        { id: "1", mine: true, isDefault: false },
        { id: "2", mine: true, isDefault: true },
      ]),
    ).toBe("2");
    expect(
      defaultSignatureId([
        { id: "9", mine: false, isDefault: true },
        { id: "1", mine: true, isDefault: false },
      ]),
    ).toBe("1");
    expect(defaultSignatureId([{ id: "9", mine: false }])).toBe("");
    expect(defaultSignatureId(undefined)).toBe("");
  });
});

describe("bouton : « Lien vers »", () => {
  const targets = [
    {
      id: "p1",
      kind: "BOOKING_PAGE",
      label: "Atelier Durand",
      pageId: "p1",
      pageTitle: "Atelier Durand",
      url: "https://www.newbi.fr/rdv/atelier-durand",
      startAt: null,
    },
    {
      id: "t1",
      kind: "APPOINTMENT_TYPE",
      label: "Appel découverte",
      pageId: "p1",
      pageTitle: "Atelier Durand",
      url: "https://www.newbi.fr/rdv/atelier-durand/decouverte",
      startAt: null,
    },
    {
      id: "e1",
      kind: "EVENT",
      label: "Atelier de janvier",
      pageId: "p1",
      pageTitle: "Atelier Durand",
      url: "https://www.newbi.fr/rdv/atelier-durand/atelier-janvier",
      startAt: "2027-01-15T09:00:00.000Z",
    },
    {
      id: "p2",
      kind: "BOOKING_PAGE",
      label: "Paul Martin",
      pageId: "p2",
      pageTitle: "Paul Martin",
      url: "https://www.newbi.fr/rdv/paul-martin",
      startAt: null,
    },
  ];

  it("libellés clairs, date de l'événement à l'heure de Paris", () => {
    expect(targets.map(linkTargetLabel)).toEqual([
      "Page de prise de rendez-vous",
      "Rendez-vous « Appel découverte »",
      "Événement « Atelier de janvier », 15 janv. 2027",
      "Page de prise de rendez-vous",
    ]);
    expect(eventDateLabel("2026-12-31T23:30:00.000Z")).toBe("1 janv. 2027");
    expect(eventDateLabel("pas une date")).toBe("");
    expect(eventDateLabel(null)).toBe("");
  });

  it("groupés par page, dans l'ordre de l'API", () => {
    const groups = groupLinkTargets(targets);
    expect(groups.map((group) => [group.title, group.targets.length])).toEqual([
      ["Atelier Durand", 3],
      ["Paul Martin", 1],
    ]);
    expect(groupLinkTargets(undefined)).toEqual([]);
    expect(groupLinkTargets([{ id: "x" }])).toEqual([]);
  });

  it("retrouve la destination d'une adresse, saisie ou choisie", () => {
    expect(
      findLinkTarget(
        targets,
        "https://www.newbi.fr/rdv/atelier-durand/decouverte/",
      )?.id,
    ).toBe("t1");
    expect(
      findLinkTarget(targets, " HTTPS://www.newbi.fr/rdv/paul-martin ")?.id,
    ).toBe("p2");
    expect(findLinkTarget(targets, "https://www.exemple.fr")).toBeNull();
    expect(findLinkTarget(targets, "")).toBeNull();
    expect(findLinkTarget([], targets[0].url)).toBeNull();
    expect(CUSTOM_LINK).toBe("custom");
  });
});

describe("adresse Gmail, Orange, Outlook ou Yahoo", () => {
  it("nomme la messagerie", () => {
    expect(freeEmailProviderName("gmail.com")).toBe("Gmail");
    expect(freeEmailProviderName("googlemail.com")).toBe("Gmail");
    expect(freeEmailProviderName("hotmail.fr")).toBe("Outlook");
    expect(freeEmailProviderName("outlook.com")).toBe("Outlook");
    expect(freeEmailProviderName("live.fr")).toBe("Outlook");
    expect(freeEmailProviderName("yahoo.fr")).toBe("Yahoo");
    expect(freeEmailProviderName("orange.fr")).toBe("Orange");
    expect(freeEmailProviderName("wanadoo.fr")).toBe("Orange");
    expect(freeEmailProviderName("icloud.com")).toBe("iCloud");
    expect(freeEmailProviderName("gmx.de")).toBeNull();
    expect(freeEmailProviderName("atelier-durand.fr")).toBeNull();
  });

  it("explique au lieu d'afficher une erreur, avec l'adresse Newbi de l'espace", () => {
    const explanation = freeEmailExplanation("joaquim.other@gmail.com", {
      newbiSenderEmail: "holany-courcier@envoi.newbi.fr",
    });
    expect(explanation.title).toBe("Pas besoin de connecter une adresse Gmail");
    expect(
      `${explanation.before}${explanation.newbiSenderEmail}${explanation.after}`,
    ).toBe(
      "Vos campagnes partent déjà de holany-courcier@envoi.newbi.fr, avec le nom de votre entreprise, et les réponses de vos contacts arrivent sur votre adresse : vous la choisissez dans « Adresse de réponse » de chaque campagne. Connecter un domaine sert seulement à envoyer depuis une adresse à votre nom de domaine (ex. contact@votre-entreprise.fr).",
    );
    expect(freeEmailExplanation("moi@gmx.de").title).toBe(
      "Pas besoin de connecter cette adresse",
    );
    expect(freeEmailExplanation("moi@gmx.de").newbiSenderEmail).toBe(
      "l'adresse Newbi de votre espace",
    );
    expect(freeEmailExplanation("contact@atelier-durand.fr")).toBeNull();
    expect(freeEmailExplanation("")).toBeNull();
    // Le refus garde son code : l'adresse ne se connecte toujours pas
    expect(checkSenderEmail("moi@gmail.com")?.code).toBe("FREE_EMAIL_PROVIDER");
  });

  it("aucun tiret cadratin ni ancien message d'impossibilité", () => {
    const texts = [
      SENDING_DOMAIN_ERRORS.FREE_EMAIL_PROVIDER,
      JSON.stringify(freeEmailExplanation("a@orange.fr")),
    ];
    for (const text of texts) {
      expect(text).not.toContain("—");
      expect(text).not.toContain("ne peuvent pas être connectées");
    }
    expect(SENDING_DOMAIN_ERRORS.FREE_EMAIL_PROVIDER).toMatch(
      /^Pas besoin de connecter une adresse Gmail, Orange, Outlook ou Yahoo/,
    );
  });
});

describe("documents GraphQL des signatures et des liens", () => {
  const operationOf = (document) => {
    const ast = typeof document === "string" ? parse(document) : document;
    const operation = ast.definitions.find(
      (definition) => definition.kind === Kind.OPERATION_DEFINITION,
    );
    const root = operation.selectionSet.selections[0];
    return {
      variables: operation.variableDefinitions.map(
        (v) => v.variable.name.value,
      ),
      root: root.name.value,
      fields: root.selectionSet.selections.map((field) => field.name.value),
    };
  };

  it("signatures : identifiants déjà choisis, HTML rendu", () => {
    expect(operationOf(GET_EMAIL_CAMPAIGN_SIGNATURES)).toEqual({
      variables: ["workspaceId", "ids"],
      root: "emailCampaignSignatures",
      fields: ["id", "name", "isDefault", "mine", "html"],
    });
  });

  it("destinations : page, libellé, adresse publique et date", () => {
    expect(operationOf(GET_EMAIL_CAMPAIGN_LINK_TARGETS)).toEqual({
      variables: ["workspaceId"],
      root: "emailCampaignLinkTargets",
      fields: ["id", "kind", "label", "pageId", "pageTitle", "url", "startAt"],
    });
  });
});
