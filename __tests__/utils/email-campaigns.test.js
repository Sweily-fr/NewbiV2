import { describe, it, expect } from "vitest";
import {
  audienceExclusions,
  campaignCompletion,
  campaignDateLabel,
  campaignRates,
  canDeleteStatus,
  checkLink,
  checkTarget,
  countChecks,
  defaultCampaignName,
  formatCount,
  formatPercent,
  formatScore,
  isCampaignTracked,
  isReportStatus,
  isValidEmail,
  parseEmailList,
  privacyPolicyUrlError,
  quotaSummary,
  recipientActivity,
  recipientFiltersFor,
  recipientLastActivity,
  recipientTracking,
  scoreTone,
  sendProgress,
  sortChecks,
  statusLabel,
  trackingConsentOrigin,
  trackingGrantMessage,
  trackingNoticeSentence,
  trackingRates,
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

  it("prospects générés écartés, avec où leur écrire si la Prospection est ouverte", () => {
    expect(audienceExclusions({ total: 4, sendable: 3, prospects: 1 })).toEqual(
      [{ key: "prospects", count: 1, label: "prospect généré" }],
    );
    expect(
      audienceExclusions(
        { total: 10, sendable: 7, prospects: 3 },
        { prospectsHint: true },
      ),
    ).toEqual([
      {
        key: "prospects",
        count: 3,
        label: "prospects générés",
        hint: "à contacter depuis votre boîte, avec la Prospection",
      },
    ]);
    // Compteur absent (API plus ancienne) ou nul : rien
    expect(
      audienceExclusions(
        { total: 2, sendable: 1, noEmail: 1 },
        { prospectsHint: true },
      ),
    ).toEqual([{ key: "noEmail", count: 1, label: "sans adresse e-mail" }]);
    expect(
      audienceExclusions({ total: 2, sendable: 2, prospects: null }),
    ).toEqual([]);
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

  it("envoie chaque contrôle de l'API là où il se corrige", () => {
    expect(checkTarget("subject_length")).toEqual({ section: "objet" });
    expect(checkTarget("preheader")).toEqual({ section: "objet" });
    expect(checkTarget("reply_to")).toEqual({ section: "expediteur" });
    expect(checkTarget("audience_quota")).toEqual({ section: "destinataires" });
    expect(checkTarget("links_shortener")).toEqual({ editor: true });
    expect(checkTarget("variables_first_name")).toEqual({ editor: true });
    expect(checkTarget("legal_address")).toEqual({ settings: true });
    expect(checkTarget("sender_domain_dmarc")).toBe(null);
    expect(checkTarget(undefined)).toBe(null);
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

describe("suivi des ouvertures et des clics", () => {
  it("campagne suivie si l'un des deux est actif", () => {
    expect(isCampaignTracked({ trackOpens: false, trackClicks: false })).toBe(
      false,
    );
    expect(isCampaignTracked({ trackOpens: true })).toBe(true);
    expect(isCampaignTracked({ trackClicks: true })).toBe(true);
    expect(isCampaignTracked(null)).toBe(false);
  });

  it("phrase du pied identique à celle de l'API (destinataire suivi)", () => {
    expect(
      trackingNoticeSentence("Atelier Durand", { opens: true, clicks: true }),
    ).toBe(
      "Atelier Durand mesure l'ouverture de cet e-mail et les clics sur ses liens, avec votre accord.",
    );
    expect(trackingNoticeSentence("Atelier", { opens: true })).toBe(
      "Atelier mesure l'ouverture de cet e-mail, avec votre accord.",
    );
    expect(trackingNoticeSentence("", { clicks: true })).toBe(
      "l'expéditeur mesure les clics sur les liens de cet e-mail, avec votre accord.",
    );
    expect(trackingNoticeSentence("Atelier", {})).toBe(null);
    expect(trackingNoticeSentence("Atelier")).toBe(null);
  });

  it("lien de politique de confidentialité : adresse web ou vide", () => {
    expect(privacyPolicyUrlError("")).toBe(null);
    expect(privacyPolicyUrlError("   ")).toBe(null);
    expect(privacyPolicyUrlError(" https://atelier.fr/rgpd ")).toBe(null);
    for (const invalid of [
      "atelier.fr/rgpd",
      "javascript:alert(1)",
      "mailto:rgpd@atelier.fr",
      "https://localhost",
    ]) {
      expect(privacyPolicyUrlError(invalid), invalid).toBe(
        "Adresse invalide : elle doit commencer par https://",
      );
    }
  });
});

describe("rapport : ouvertures et clics seulement s'ils ont été suivis", () => {
  const values = (campaign) =>
    recipientFiltersFor(campaign).map((f) => f.value);

  it("suivi complet : tous les filtres", () => {
    const campaign = { trackOpens: true, trackClicks: true };
    expect(recipientTracking(campaign)).toEqual({
      opens: true,
      clicks: true,
      purged: false,
    });
    expect(values(campaign)).toEqual([
      "ALL",
      "OPENED",
      "CLICKED",
      "NOT_OPENED",
      "BOUNCED",
      "UNSUBSCRIBED",
      "FAILED",
    ]);
  });

  it("sans suivi : ni filtres ni colonnes d'ouvertures et de clics", () => {
    const campaign = { trackOpens: false, trackClicks: false };
    expect(recipientTracking(campaign)).toEqual({
      opens: false,
      clicks: false,
      purged: false,
    });
    expect(values(campaign)).toEqual([
      "ALL",
      "BOUNCED",
      "UNSUBSCRIBED",
      "FAILED",
    ]);
    expect(values({ trackClicks: true })).toEqual([
      "ALL",
      "CLICKED",
      "BOUNCED",
      "UNSUBSCRIBED",
      "FAILED",
    ]);
  });

  it("détail effacé après 13 mois : plus de filtres d'activité", () => {
    const campaign = {
      trackOpens: true,
      trackClicks: true,
      trackingPurgedAt: "2027-12-26T02:30:00.000Z",
    };
    expect(recipientTracking(campaign)).toEqual({
      opens: false,
      clicks: false,
      purged: true,
    });
    expect(values(campaign)).toEqual([
      "ALL",
      "BOUNCED",
      "UNSUBSCRIBED",
      "FAILED",
    ]);
  });
});

describe("rapport : taux sur les contacts suivis", () => {
  const stats = {
    sent: 100,
    simulated: 0,
    bounced: 10,
    opened: 12,
    clicked: 4,
  };

  it("campagne lancée avec les accords : base = contacts suivis au lancement", () => {
    const rates = trackingRates({ trackedRecipients: 40, stats });
    expect(rates.perContact).toBe(true);
    expect(rates.base).toBe(40);
    expect(rates.openRate).toBeCloseTo(0.3);
    expect(rates.clickRate).toBeCloseTo(0.1);
  });

  it("campagne lancée avant (trackedRecipients null) : base = e-mails remis", () => {
    const rates = trackingRates({ trackedRecipients: null, stats });
    expect(rates.perContact).toBe(false);
    expect(rates.base).toBe(campaignRates(stats).reached);
    expect(rates.base).toBe(90);
    expect(rates.openRate).toBeCloseTo(12 / 90);
    // Champ absent (ancienne réponse) : même chose
    expect(trackingRates({ stats }).base).toBe(90);
  });

  it("aucun contact suivi : pas de taux", () => {
    const rates = trackingRates({ trackedRecipients: 0, stats });
    expect(rates.perContact).toBe(true);
    expect(rates.base).toBe(0);
    expect(rates.openRate).toBe(null);
    expect(rates.clickRate).toBe(null);
    expect(trackingRates(null).openRate).toBe(null);
  });
});

describe("accords de suivi", () => {
  it("origine : choix du contact ou saisie de l'espace", () => {
    expect(trackingConsentOrigin({ source: "CONTACT" })).toBe(
      "Choix du contact",
    );
    expect(
      trackingConsentOrigin({ source: "SENDER", decidedByName: "Jean Dupont" }),
    ).toBe("Saisi par Jean Dupont");
    expect(
      trackingConsentOrigin({ source: "SENDER", decidedByName: null }),
    ).toBe("Saisi par un membre de l'espace");
  });

  // plural() lie le nombre au mot par une espace insécable
  it("ajout réussi : nombre d'accords enregistrés", () => {
    expect(trackingGrantMessage({ granted: 3, skipped: [] })).toEqual({
      ok: true,
      title: `3${NBSP}accords enregistrés`,
      description:
        "Ces adresses pourront être suivies dans vos prochaines campagnes.",
    });
    expect(trackingGrantMessage({ granted: 1, skipped: [] }).title).toBe(
      `1${NBSP}accord enregistré`,
    );
  });

  it("adresses écartées : saisie illisible puis refus de l'API, avec la raison", () => {
    const message = trackingGrantMessage(
      {
        granted: 1,
        skipped: [
          { email: "refus@exemple.fr", reason: "CONTACT_REFUSED" },
          { email: "a@b", reason: "INVALID" },
        ],
      },
      ["jean@"],
    );
    expect(message.ok).toBe(true);
    expect(message.title).toBe(`1${NBSP}accord enregistré`);
    expect(message.description).toBe(
      [
        `3${NBSP}adresses écartées :`,
        "jean@ (adresse invalide)",
        "refus@exemple.fr (refus du contact, lui seul peut changer d'avis)",
        "a@b (adresse invalide)",
      ].join("\n"),
    );
  });

  it("aucun accord : échec, liste limitée à 10 adresses", () => {
    const skipped = Array.from({ length: 12 }, (_, index) => ({
      email: `contact${index}@exemple.fr`,
      reason: "CONTACT_REFUSED",
    }));
    const message = trackingGrantMessage({ granted: 0, skipped });
    expect(message.ok).toBe(false);
    expect(message.title).toBe("Aucun accord enregistré");
    const lines = message.description.split("\n");
    expect(lines[0]).toBe(`12${NBSP}adresses écartées :`);
    expect(lines).toHaveLength(12);
    expect(lines[1]).toBe(
      "contact0@exemple.fr (refus du contact, lui seul peut changer d'avis)",
    );
    expect(lines.at(-1)).toBe(`et 2${NBSP}autres`);
    expect(trackingGrantMessage({ granted: 0, skipped: [] }).description).toBe(
      null,
    );
  });
});
