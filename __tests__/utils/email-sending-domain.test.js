import { describe, it, expect } from "vitest";
import {
  CONNECT_EMAIL_SENDING_DOMAIN,
  DISCONNECT_EMAIL_SENDING_DOMAIN,
  GET_EMAIL_CAMPAIGN_SETTINGS,
  GET_EMAIL_SENDING_DOMAIN,
  UPDATE_EMAIL_SENDING_DOMAIN_SENDER,
  VERIFY_EMAIL_SENDING_DOMAIN,
} from "@/src/graphql/emailCampaignQueries";
import {
  SENDING_DOMAIN_ERRORS,
  apiErrorCode,
  checkSenderEmail,
  effectiveSenderEmail,
  emailDomainOf,
  emailLocalPart,
  expiryNotice,
  failedRecords,
  formatCheckTime,
  formatFullDay,
  formatLongDay,
  frenchSpacing,
  hostLabel,
  isExpiredSendingDomain,
  isFreeEmailDomain,
  isReservedSenderDomain,
  pendingDomainNotice,
  recordDisplayName,
  recordStatusMeta,
  senderPanelLinkLabel,
  sendingDomainBadge,
  sendingDomainErrorMessage,
  sendingDomainProblem,
  sendingDomainState,
  suggestedSenderEmail,
  trailingDotReminder,
} from "@/src/utils/email-sending-domain";

const NEWBI = "atelier-martin@envoi.newbi.fr";

// Lignes telles que Resend les renvoie pour un domaine à la racine de sa zone
const records = (status = "NOT_STARTED", overrides = {}) =>
  [
    {
      kind: "DKIM",
      type: "TXT",
      name: "resend._domainkey",
      fqdn: "resend._domainkey.atelier-martin.fr",
      value: "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC",
      priority: null,
    },
    {
      kind: "SPF",
      type: "MX",
      name: "send",
      fqdn: "send.atelier-martin.fr",
      value: "feedback-smtp.eu-west-1.amazonses.com",
      priority: 10,
    },
    {
      kind: "SPF",
      type: "TXT",
      name: "send",
      fqdn: "send.atelier-martin.fr",
      value: "v=spf1 include:amazonses.com ~all",
      priority: null,
    },
    {
      kind: "SPF",
      type: "CNAME",
      name: "rsend",
      fqdn: "rsend.atelier-martin.fr",
      value: "send.forge.rmta.net.",
      priority: null,
    },
  ].map((record, index) => ({
    ...record,
    status: overrides[index] || status,
  }));

const domainOf = (status, recordStatus, overrides) => ({
  id: "d1",
  domain: "atelier-martin.fr",
  fromEmail: "contact@atelier-martin.fr",
  status,
  active: status === "VERIFIED",
  records: records(recordStatus, overrides),
  zone: "atelier-martin.fr",
  dnsProvider: "OVH",
  lastCheckedAt: null,
  verifiedAt: null,
  expiresAt: "2026-11-25T10:00:00.000Z",
  createdAt: "2026-11-18T10:00:00.000Z",
});

const gqlError = (code, message = "Refus") => ({
  message,
  graphQLErrors: [{ message, extensions: { code } }],
});

describe("adresse saisie", () => {
  it("sépare la partie locale et le domaine", () => {
    expect(emailDomainOf(" Contact@Atelier-Martin.FR ")).toBe(
      "atelier-martin.fr",
    );
    expect(emailDomainOf("sans-arobase")).toBe("");
    expect(emailLocalPart("contact@atelier-martin.fr")).toBe("contact");
    expect(emailLocalPart("")).toBe("");
  });

  it("reconnaît les messageries gratuites, déclinaisons par pays comprises", () => {
    for (const domain of [
      "gmail.com",
      "orange.fr",
      "wanadoo.fr",
      "yahoo.fr",
      "yahoo.co.uk",
      "hotmail.com",
      "outlook.fr",
      "live.be",
      "gmx.de",
      "proton.me",
    ]) {
      expect(isFreeEmailDomain(domain)).toBe(true);
    }
    expect(isFreeEmailDomain("atelier-martin.fr")).toBe(false);
    // Un domaine d'entreprise qui commence comme une messagerie n'en est pas une
    expect(isFreeEmailDomain("live.atelier-martin.fr")).toBe(false);
    expect(isFreeEmailDomain("outlook-conseil.fr")).toBe(false);
  });

  it("réserve les domaines de Newbi et leurs sous-domaines", () => {
    expect(isReservedSenderDomain("newbi.fr", NEWBI)).toBe(true);
    expect(isReservedSenderDomain("mail.sweily.fr", NEWBI)).toBe(true);
    expect(isReservedSenderDomain("envoi.newbi.fr", NEWBI)).toBe(true);
    expect(
      isReservedSenderDomain("campagnes.exemple.com", "x@exemple.com"),
    ).toBe(true);
    expect(isReservedSenderDomain("monnewbi.fr", NEWBI)).toBe(false);
    expect(isReservedSenderDomain("", NEWBI)).toBe(false);
  });

  it("explique pourquoi une adresse ne peut pas être connectée", () => {
    expect(checkSenderEmail("  ").code).toBe("EMPTY");
    expect(checkSenderEmail("contact@").code).toBe("INVALID_SENDER_EMAIL");
    expect(checkSenderEmail("camille@gmail.com")).toEqual({
      code: "FREE_EMAIL_PROVIDER",
      message: SENDING_DOMAIN_ERRORS.FREE_EMAIL_PROVIDER,
    });
    expect(
      checkSenderEmail("moi@envoi.newbi.fr", { newbiSenderEmail: NEWBI }).code,
    ).toBe("RESERVED_DOMAIN");
    expect(checkSenderEmail(" Contact@Atelier-Martin.fr ")).toBe(null);
  });

  it("propose l'e-mail de l'entreprise s'il n'est pas sur une messagerie gratuite", () => {
    expect(
      suggestedSenderEmail(["Contact@Atelier-Martin.fr", "autre@x.fr"]),
    ).toBe("contact@atelier-martin.fr");
    expect(
      suggestedSenderEmail(["atelier.martin@gmail.com", "hello@atelier.fr"]),
    ).toBe("hello@atelier.fr");
    expect(suggestedSenderEmail(["atelier.martin@orange.fr", null, ""])).toBe(
      "",
    );
    expect(suggestedSenderEmail(undefined)).toBe("");
  });
});

describe("état affiché du panneau", () => {
  it("aucun domaine, ou domaine retiré faute de validation", () => {
    expect(sendingDomainState(null)).toBe("none");
    const expired = { ...domainOf("EXPIRED", "NOT_STARTED"), records: [] };
    expect(sendingDomainState(expired)).toBe("none");
    expect(isExpiredSendingDomain(expired)).toBe(true);
    expect(sendingDomainBadge(expired)).toBe(null);
  });

  it("en attente tant que rien n'a échoué", () => {
    for (const status of ["NOT_STARTED", "PENDING", "PARTIALLY_VERIFIED"]) {
      expect(sendingDomainState(domainOf(status, "PENDING"))).toBe("pending");
    }
    // Statut inconnu (nouveau statut de Resend) : en attente, jamais validé
    expect(sendingDomainState(domainOf("SOMETHING_NEW", "PENDING"))).toBe(
      "pending",
    );
    expect(sendingDomainBadge(domainOf("PENDING", "PENDING"))).toEqual({
      label: "En attente de validation",
      tone: "warning",
    });
  });

  it("validé seulement au statut VERIFIED", () => {
    expect(sendingDomainState(domainOf("VERIFIED", "VERIFIED"))).toBe(
      "verified",
    );
    expect(sendingDomainBadge(domainOf("VERIFIED", "VERIFIED")).label).toBe(
      "Connecté",
    );
  });

  it("en échec dès qu'une ligne est introuvable, même si le domaine attend encore", () => {
    const partial = domainOf("PENDING", "VERIFIED", { 1: "FAILED" });
    expect(sendingDomainState(partial)).toBe("failed");
    expect(failedRecords(partial).map((record) => record.type)).toEqual(["MX"]);
    expect(sendingDomainBadge(partial)).toEqual({
      label: "Ligne introuvable",
      tone: "danger",
    });
    expect(sendingDomainProblem(partial).title).toBe(
      "1 ligne est introuvable chez votre hébergeur",
    );

    const failed = domainOf("FAILED", "FAILED", { 0: "VERIFIED" });
    expect(sendingDomainBadge(failed).label).toBe("Lignes introuvables");
    expect(sendingDomainProblem(failed).title).toBe(
      "3 lignes sont introuvables chez votre hébergeur",
    );
  });

  it("distingue une vérification interrompue d'une ligne manquante", () => {
    const temporary = domainOf("TEMPORARY_FAILURE", "PENDING");
    expect(sendingDomainState(temporary)).toBe("failed");
    expect(sendingDomainBadge(temporary)).toEqual({
      label: "Vérification interrompue",
      tone: "warning",
    });
    expect(sendingDomainProblem(temporary).title).toBe(
      "La vérification n'a pas pu aboutir",
    );
    // Échec sans détail par ligne
    expect(sendingDomainProblem(domainOf("FAILED", "PENDING")).title).toBe(
      "Votre domaine n'a pas pu être validé",
    );
    expect(sendingDomainProblem(domainOf("PENDING", "PENDING"))).toBe(null);
  });

  it("libelle l'état de chaque ligne", () => {
    expect(recordStatusMeta("VERIFIED")).toEqual({
      label: "Validée",
      tone: "success",
    });
    expect(recordStatusMeta("failed").label).toBe("Introuvable");
    expect(recordStatusMeta("NOT_STARTED").label).toBe("En attente");
    expect(recordStatusMeta(undefined).label).toBe("En attente");
  });
});

describe("lignes DNS", () => {
  it("donne le nom relatif à la zone, ou le nom complet", () => {
    const [dkim] = records();
    expect(recordDisplayName(dkim)).toBe("resend._domainkey");
    expect(recordDisplayName(dkim, { full: true })).toBe(
      "resend._domainkey.atelier-martin.fr",
    );
    expect(recordDisplayName({ name: "", fqdn: "atelier-martin.fr" })).toBe(
      "@",
    );
    expect(
      recordDisplayName(
        { name: "@", fqdn: "atelier-martin.fr" },
        { full: true },
      ),
    ).toBe("atelier-martin.fr");
  });

  it("nomme l'hébergeur détecté, sinon reste générique", () => {
    expect(hostLabel("OVH")).toBe("OVH");
    expect(hostLabel(null)).toBe("votre hébergeur de domaine");
    expect(hostLabel("  ")).toBe("votre hébergeur de domaine");
  });

  it("rappelle le point final des cibles MX et CNAME qui n'en ont pas", () => {
    expect(trailingDotReminder(records(), "OVH")).toEqual({
      ovh: true,
      example: "feedback-smtp.eu-west-1.amazonses.com.",
    });
    expect(trailingDotReminder(records(), null).ovh).toBe(false);
    // Toutes les cibles ont déjà leur point : pas de rappel
    const dotted = records().map((record) =>
      record.type === "MX" ? { ...record, value: `${record.value}.` } : record,
    );
    expect(trailingDotReminder(dotted, "OVH")).toBe(null);
    expect(trailingDotReminder([], "OVH")).toBe(null);
  });
});

describe("dates", () => {
  it("formate le jour de retrait et l'heure de vérification (heure de Paris)", () => {
    expect(formatLongDay("2026-11-25T10:00:00.000Z")).toBe(
      "mercredi 25 novembre",
    );
    expect(formatLongDay(null)).toBe("");
    const now = new Date("2026-11-18T16:00:00.000Z");
    expect(formatCheckTime("2026-11-18T13:32:00.000Z", now)).toBe(
      "aujourd'hui à 14:32",
    );
    expect(formatCheckTime("2026-11-17T13:32:00.000Z", now)).toBe(
      "17 nov. à 14:32",
    );
    expect(formatCheckTime(undefined, now)).toBe("");
  });

  it("écrit la date de validation en toutes lettres", () => {
    expect(formatFullDay("2026-11-16T09:30:00.000Z")).toBe("16 novembre 2026");
    expect(formatFullDay("pas une date")).toBe("");
  });

  it("annonce le retrait automatique d'un domaine non validé", () => {
    expect(expiryNotice("2026-11-25T10:00:00.000Z")).toBe(
      "Sans validation d'ici le mercredi 25 novembre, le domaine sera retiré automatiquement\u00a0: il suffira de le connecter de nouveau.",
    );
    expect(expiryNotice(null)).toBe(null);
  });
});

describe("expéditeur d'une campagne", () => {
  const settings = {
    senderEmail: "contact@atelier-martin.fr",
    newbiSenderEmail: NEWBI,
  };

  it("suit l'adresse de l'espace pour un brouillon, l'adresse figée ensuite", () => {
    expect(
      effectiveSenderEmail(
        { status: "DRAFT", senderEmail: "ancienne@envoi.newbi.fr" },
        settings,
      ),
    ).toBe("contact@atelier-martin.fr");
    expect(
      effectiveSenderEmail({ status: "SENT", senderEmail: NEWBI }, settings),
    ).toBe(NEWBI);
    expect(
      effectiveSenderEmail({ status: "DRAFT", senderEmail: NEWBI }, null),
    ).toBe(NEWBI);
  });

  it("prévient tant que le domaine n'est pas validé", () => {
    const pending = pendingDomainNotice({
      ...settings,
      senderEmail: NEWBI,
      sendingDomain: domainOf("PENDING", "PENDING"),
    });
    expect(pending).toMatchObject({
      domain: "atelier-martin.fr",
      fallbackEmail: NEWBI,
      validating: true,
    });
    expect(pending.text).toBe(
      `Votre domaine atelier-martin.fr est en cours de validation\u00a0: en attendant, vos campagnes partent de ${NEWBI}.`,
    );
    const failed = pendingDomainNotice({
      ...settings,
      sendingDomain: domainOf("FAILED", "FAILED"),
    });
    expect(failed.validating).toBe(false);
    expect(failed.text).toContain("n'est pas encore validé");
    expect(
      pendingDomainNotice({
        ...settings,
        sendingDomain: domainOf("VERIFIED", "VERIFIED"),
      }),
    ).toBe(null);
    expect(pendingDomainNotice({ ...settings, sendingDomain: null })).toBe(
      null,
    );
  });

  it("adapte le lien vers le panneau à l'état du domaine", () => {
    expect(senderPanelLinkLabel(null)).toBe("Envoyer depuis votre adresse");
    expect(senderPanelLinkLabel(domainOf("PENDING", "PENDING"))).toBe(
      "Suivre la validation",
    );
    expect(senderPanelLinkLabel(domainOf("FAILED", "FAILED"))).toBe(
      "Voir ce qui manque",
    );
    expect(senderPanelLinkLabel(domainOf("VERIFIED", "VERIFIED"))).toBe(
      "Gérer l'adresse d'envoi",
    );
  });
});

describe("refus de l'API", () => {
  it("lit le code de l'erreur GraphQL", () => {
    expect(apiErrorCode(gqlError("FREE_EMAIL_PROVIDER"))).toBe(
      "FREE_EMAIL_PROVIDER",
    );
    expect(apiErrorCode({ errors: [{ extensions: { code: "X" } }] })).toBe("X");
    expect(apiErrorCode(new Error("boum"))).toBe(null);
  });

  it("traduit chaque code du contrat en message clair", () => {
    for (const code of [
      "INVALID_SENDER_EMAIL",
      "FREE_EMAIL_PROVIDER",
      "RESERVED_DOMAIN",
      "DOMAIN_ALREADY_CONNECTED",
      "SENDING_DOMAIN_EXISTS",
      "SENDING_DOMAIN_IN_USE",
    ]) {
      expect(sendingDomainErrorMessage(gqlError(code, "technique"))).toBe(
        SENDING_DOMAIN_ERRORS[code],
      );
    }
    // Jamais le nom de l'autre espace
    expect(
      sendingDomainErrorMessage(gqlError("DOMAIN_ALREADY_CONNECTED")),
    ).not.toMatch(/espace « /);
  });

  it("adapte l'indisponibilité de Resend à l'action", () => {
    const error = gqlError("SENDING_DOMAIN_UNAVAILABLE");
    expect(sendingDomainErrorMessage(error, "connect")).toBe(
      "Impossible de connecter un domaine pour le moment. Notre équipe a été prévenue.",
    );
    expect(sendingDomainErrorMessage(error, "verify")).toBe(
      "Impossible de vérifier votre domaine pour le moment. Notre équipe a été prévenue.",
    );
    expect(sendingDomainErrorMessage(error, "disconnect")).toMatch(
      /^Impossible de déconnecter/,
    );
  });

  it("garde le message d'un autre refus métier, jamais celui d'une erreur technique", () => {
    expect(
      sendingDomainErrorMessage(
        gqlError(
          "VALIDATION_ERROR",
          "Erreur lors de la vérification des permissions: Gardez le domaine atelier-martin.fr.",
        ),
        "update",
      ),
    ).toBe("Gardez le domaine atelier-martin.fr.");
    expect(
      sendingDomainErrorMessage(
        gqlError("INTERNAL_ERROR", "Cannot read properties of undefined"),
        "verify",
      ),
    ).toBe(
      "La vérification n'a pas pu être lancée. Réessayez dans quelques instants.",
    );
    expect(sendingDomainErrorMessage({ networkError: new Error("x") })).toMatch(
      /^Connexion impossible/,
    );
    expect(sendingDomainErrorMessage(new Error("boum"), "update")).toBe(
      "L'adresse n'a pas pu être modifiée. Réessayez dans quelques instants.",
    );
    expect(sendingDomainErrorMessage(null)).toBe(null);
  });

  it("colle la ponctuation double au mot qui précède", () => {
    expect(frenchSpacing("Attention : point ; question ? oui !")).toBe(
      "Attention\u00a0: point\u00a0; question\u00a0? oui\u00a0!",
    );
    expect(frenchSpacing(null)).toBe("");
  });

  it("aucun message ne contient de tiret cadratin ni de ponctuation sécable", () => {
    const texts = [
      ...Object.values(SENDING_DOMAIN_ERRORS),
      sendingDomainErrorMessage(gqlError("SENDING_DOMAIN_UNAVAILABLE")),
      expiryNotice("2026-11-25T10:00:00.000Z"),
      sendingDomainProblem(domainOf("FAILED", "FAILED")).text,
      sendingDomainProblem(domainOf("TEMPORARY_FAILURE", "PENDING")).text,
    ];
    for (const text of texts) {
      expect(text).not.toContain("—");
      expect(text).not.toMatch(/ [:;?!]/);
    }
  });
});

// Champs demandés par une opération (fragments dépliés) : « racine.champ »
function selectedPaths(document) {
  const fragments = Object.fromEntries(
    document.definitions
      .filter((definition) => definition.kind === "FragmentDefinition")
      .map((definition) => [definition.name.value, definition]),
  );
  const operation = document.definitions.find(
    (definition) => definition.kind === "OperationDefinition",
  );
  const paths = [];
  const walk = (selectionSet, prefix) => {
    for (const selection of selectionSet?.selections || []) {
      if (selection.kind === "FragmentSpread") {
        walk(fragments[selection.name.value].selectionSet, prefix);
      } else if (selection.kind === "Field") {
        const path = prefix
          ? `${prefix}.${selection.name.value}`
          : selection.name.value;
        paths.push(path);
        walk(selection.selectionSet, path);
      }
    }
  };
  walk(operation.selectionSet, "");
  return {
    name: operation.name.value,
    type: operation.operation,
    variables: operation.variableDefinitions.map(
      (variable) => variable.variable.name.value,
    ),
    paths,
  };
}

const DOMAIN_FIELDS = [
  "id",
  "domain",
  "fromEmail",
  "status",
  "active",
  "records.kind",
  "records.type",
  "records.name",
  "records.fqdn",
  "records.value",
  "records.priority",
  "records.status",
  "zone",
  "dnsProvider",
  "lastCheckedAt",
  "verifiedAt",
  "expiresAt",
  "createdAt",
];

describe("documents GraphQL du contrat", () => {
  it("lit les nouveaux réglages d'envoi avec le domaine connecté", () => {
    const { paths } = selectedPaths(GET_EMAIL_CAMPAIGN_SETTINGS);
    for (const field of [
      "senderEmail",
      "newbiSenderEmail",
      "canManageSendingDomain",
      ...DOMAIN_FIELDS.map((field) => `sendingDomain.${field}`),
    ]) {
      expect(paths).toContain(`emailCampaignSettings.${field}`);
    }
  });

  it("déclare la requête et les quatre mutations du domaine", () => {
    const expected = [
      [
        GET_EMAIL_SENDING_DOMAIN,
        "query",
        "emailSendingDomain",
        ["workspaceId"],
      ],
      [
        CONNECT_EMAIL_SENDING_DOMAIN,
        "mutation",
        "connectEmailSendingDomain",
        ["workspaceId", "fromEmail"],
      ],
      [
        VERIFY_EMAIL_SENDING_DOMAIN,
        "mutation",
        "verifyEmailSendingDomain",
        ["workspaceId"],
      ],
      [
        UPDATE_EMAIL_SENDING_DOMAIN_SENDER,
        "mutation",
        "updateEmailSendingDomainSender",
        ["workspaceId", "fromEmail"],
      ],
    ];
    for (const [document, type, root, variables] of expected) {
      const operation = selectedPaths(document);
      expect(operation.type).toBe(type);
      expect(operation.variables).toEqual(variables);
      for (const field of DOMAIN_FIELDS) {
        expect(operation.paths).toContain(`${root}.${field}`);
      }
    }
    const disconnect = selectedPaths(DISCONNECT_EMAIL_SENDING_DOMAIN);
    expect(disconnect.type).toBe("mutation");
    expect(disconnect.variables).toEqual(["workspaceId"]);
    expect(disconnect.paths).toEqual(["disconnectEmailSendingDomain"]);
  });
});
