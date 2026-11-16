import { describe, it, expect } from "vitest";
import {
  audienceExclusions,
  campaignCompletion,
  campaignDateLabel,
  campaignRates,
  canDeleteStatus,
  checkLink,
  countChecks,
  defaultCampaignName,
  formatCount,
  formatPercent,
  formatScore,
  isReportStatus,
  isValidEmail,
  parseEmailList,
  quotaSummary,
  recipientActivity,
  recipientLastActivity,
  scoreTone,
  sendProgress,
  sortChecks,
  statusLabel,
} from "@/src/utils/email-campaigns";

const NBSP = " ";
// Espace des milliers de fr-FR (fine insécable)
const thousands = (text) => text.replace(/\s/g, " ");

describe("statuts", () => {
  it("donne le libellé et sépare brouillons et rapports", () => {
    expect(statusLabel("SENT")).toBe("Envoyée");
    expect(isReportStatus("DRAFT")).toBe(false);
    expect(isReportStatus("SCHEDULED")).toBe(false);
    expect(isReportStatus("PAUSED")).toBe(true);
    expect(canDeleteStatus("SENDING")).toBe(false);
    expect(canDeleteStatus("SENT")).toBe(true);
  });
});

describe("nombres", () => {
  it("formate les nombres et pourcentages en français", () => {
    expect(thousands(formatCount(1240))).toBe("1 240");
    expect(formatPercent(0.4256)).toBe(`42,6${NBSP}%`);
    expect(formatPercent(1)).toBe(`100${NBSP}%`);
    expect(formatPercent(null)).toBe(null);
    expect(formatScore(7.74)).toBe("7,5");
  });

  it("calcule les taux sur les e-mails partis moins les rejets, simulés compris", () => {
    const rates = campaignRates({
      sent: 80,
      simulated: 20,
      bounced: 10,
      opened: 45,
      clicked: 9,
      unsubscribed: 1,
      complained: 0,
    });
    expect(rates.sent).toBe(100);
    expect(rates.reached).toBe(90);
    expect(rates.openRate).toBeCloseTo(0.5);
    expect(rates.clickRate).toBeCloseTo(0.1);
    expect(rates.clickToOpenRate).toBeCloseTo(0.2);
    expect(rates.bounceRate).toBeCloseTo(0.1);
  });

  it("aucun taux tant que rien n'est parti", () => {
    expect(campaignRates({}).openRate).toBe(null);
    expect(campaignRates(null).clickRate).toBe(null);
  });

  it("mesure l'avancement de l'envoi", () => {
    expect(
      sendProgress({ recipients: 200, sent: 90, simulated: 10, failed: 0 }),
    ).toEqual({ total: 200, processed: 100, remaining: 100, ratio: 0.5 });
    expect(sendProgress({ recipients: 0 }).ratio).toBe(0);
  });
});

describe("dates", () => {
  const now = new Date("2026-11-16T10:00:00Z");

  it("affiche la date utile selon le statut, à l'heure de Paris", () => {
    expect(
      campaignDateLabel(
        { status: "SCHEDULED", scheduledAt: "2026-11-20T08:00:00.000Z" },
        now,
      ),
    ).toBe("Prévue le 20 nov. à 09:00");
    expect(
      campaignDateLabel(
        { status: "SENT", completedAt: "2026-07-01T12:30:00.000Z" },
        now,
      ),
    ).toBe("Envoyée le 1 juil. à 14:30");
    expect(
      campaignDateLabel(
        { status: "DRAFT", updatedAt: "2026-11-16T10:00:00Z" },
        now,
      ),
    ).toBe("Modifiée le 16 nov. à 11:00");
  });

  it("ajoute l'année quand ce n'est pas l'année en cours", () => {
    expect(
      campaignDateLabel(
        { status: "SENT", completedAt: "2025-12-31T23:30:00.000Z" },
        now,
      ),
    ).toBe("Envoyée le 1 janv. à 00:30");
    expect(
      campaignDateLabel(
        { status: "CANCELED", completedAt: "2025-03-10T09:00:00.000Z" },
        now,
      ),
    ).toBe("Annulée le 10 mars 2025 à 10:00");
  });

  it("propose un nom daté pour une nouvelle campagne", () => {
    expect(defaultCampaignName(new Date("2026-11-16T10:00:00Z"))).toBe(
      "Campagne du 16 novembre",
    );
  });
});

describe("saisie", () => {
  it("valide une adresse e-mail", () => {
    expect(isValidEmail("dylan@sweily.fr")).toBe(true);
    expect(isValidEmail(" dylan@sweily.fr ")).toBe(true);
    expect(isValidEmail("dylan@sweily")).toBe(false);
    expect(isValidEmail("dylan sweily.fr")).toBe(false);
  });

  it("découpe une liste d'adresses, sans doublon", () => {
    expect(parseEmailList("A@x.fr, b@y.fr;a@x.fr\nnope  c@z.io")).toEqual({
      valid: ["a@x.fr", "b@y.fr", "c@z.io"],
      invalid: ["nope"],
    });
  });

  it("contrôle les liens comme la vérification avant envoi", () => {
    expect(checkLink("https://www.newbi.fr/tarifs").level).toBe(null);
    expect(checkLink("mailto:contact@newbi.fr").level).toBe(null);
    expect(checkLink("", { required: true }).level).toBe("error");
    expect(checkLink("https://", { required: true }).level).toBe("error");
    expect(checkLink("").level).toBe(null);
    expect(checkLink("www.newbi.fr").level).toBe("error");
    expect(checkLink("https://bit.ly/abc").level).toBe("error");
    expect(checkLink("http://192.168.1.4/promo").level).toBe("error");
    expect(checkLink("http://newbi.fr").level).toBe("warning");
  });
});

describe("destinataires", () => {
  it("liste les exclusions non nulles avec leur libellé", () => {
    expect(
      audienceExclusions({
        total: 50,
        sendable: 40,
        noEmail: 5,
        invalidEmail: 1,
        blocked: 0,
        suppressed: 2,
        duplicates: 2,
        excludedByList: 0,
      }),
    ).toEqual([
      { key: "noEmail", count: 5, label: "sans adresse e-mail" },
      { key: "invalidEmail", count: 1, label: "adresse invalide" },
      { key: "suppressed", count: 2, label: "désinscrits ou exclus" },
      { key: "duplicates", count: 2, label: "doublons" },
    ]);
    expect(audienceExclusions(null)).toEqual([]);
  });

  it("retient l'activité la plus parlante d'un destinataire", () => {
    expect(
      recipientActivity({ status: "DELIVERED", openedAt: "x", clickedAt: "y" })
        .label,
    ).toBe("A cliqué");
    expect(recipientActivity({ status: "DELIVERED", openCount: 2 }).label).toBe(
      "A ouvert",
    );
    expect(
      recipientActivity({ status: "SENT", unsubscribedAt: "z", clickedAt: "y" })
        .label,
    ).toBe("Désinscrit");
    expect(recipientActivity({ status: "BOUNCED" }).label).toBe("Rejeté");
    expect(recipientActivity({ status: "SIMULATED" }).label).toBe("Simulé");
  });

  it("donne la date de la dernière activité", () => {
    expect(
      recipientLastActivity({
        sentAt: "2026-11-01T10:00:00Z",
        openedAt: "2026-11-02T10:00:00Z",
      }).toISOString(),
    ).toBe("2026-11-02T10:00:00.000Z");
    expect(recipientLastActivity({})).toBe(null);
  });
});

describe("vérification avant envoi", () => {
  const checks = [
    { id: "a", level: "OK" },
    { id: "b", level: "WARNING" },
    { id: "c", level: "ERROR" },
    { id: "d", level: "INFO" },
    { id: "e", level: "WARNING" },
  ];

  it("trie du plus grave au moins grave en gardant l'ordre de l'API", () => {
    expect(sortChecks(checks).map((check) => check.id)).toEqual([
      "c",
      "b",
      "e",
      "d",
      "a",
    ]);
  });

  it("compte les contrôles par niveau et colore la note", () => {
    expect(countChecks(checks)).toEqual({
      ERROR: 1,
      WARNING: 2,
      INFO: 1,
      OK: 1,
    });
    expect(scoreTone(9)).toBe("good");
    expect(scoreTone(6.5)).toBe("fair");
    expect(scoreTone(2)).toBe("poor");
  });
});

describe("étapes de la campagne", () => {
  it("dit ce qui est complet", () => {
    expect(
      campaignCompletion({
        fromName: "Sweily",
        replyTo: "contact@sweily.fr",
        audience: { mode: "LISTS", listIds: [] },
        subject: " ",
        design: { blocks: [{ id: "1", type: "text" }] },
      }),
    ).toEqual({ sender: true, audience: false, subject: false, content: true });
    expect(
      campaignCompletion({ audience: { mode: "ALL", listIds: [] } }).audience,
    ).toBe(true);
  });

  it("résume le quota du mois", () => {
    const summary = quotaSummary({
      plan: "pme",
      monthlyLimit: 2500,
      usedThisMonth: 2100,
      remaining: 400,
    });
    expect(thousands(summary.label)).toBe("2 100 / 2 500 e-mails ce mois-ci");
    expect(summary.tone).toBe("warning");
    expect(summary.remaining).toBe(400);
    expect(quotaSummary(null)).toBe(null);
  });
});
