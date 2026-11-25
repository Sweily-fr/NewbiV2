/**
 * Prospection : statuts, avancement, plage d'envoi, montée progressive,
 * retour de la connexion OAuth et variables envoyées à l'API.
 */
import { describe, it, expect } from "vitest";
import {
  bodyExcerpt,
  bodyText,
  canDeleteSequence,
  cleanMailboxReturnUrl,
  countSequencesByTab,
  defaultSequenceName,
  estimatedDaysLabel,
  estimatedEndLabel,
  filterSequences,
  formatDayMonth,
  formatDays,
  formatEndDate,
  formatSendWindow,
  isLaunched,
  isSimulatedSendMode,
  isLive,
  mailboxAuthorizePath,
  mailboxAuthorizeUrl,
  mailboxSettingsForm,
  mailboxSettingsInput,
  mailboxState,
  newSequenceInput,
  normalizeDays,
  parseDay,
  prospectingCheckTarget,
  prospectingExclusions,
  providerLabel,
  rampUp,
  rampUpHint,
  readMailboxReturn,
  recipientActions,
  recipientFilters,
  recipientHistoryLabel,
  recipientStatusFilter,
  recipientStatusMeta,
  replyRate,
  sentTodayLabel,
  sequenceCompletion,
  sequenceDateLabel,
  sequenceFromListInput,
  sequenceProgress,
  sequenceStatusMeta,
  testSentTitle,
  unsubscribeRate,
  validateMailboxSettings,
} from "@/src/utils/prospecting";

const NBSP = " ";
const NOW = new Date("2026-11-25T10:00:00Z");
const daysAgo = (days) =>
  new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

describe("statuts", () => {
  it("libellés et tons des statuts", () => {
    expect(sequenceStatusMeta("ACTIVE")).toEqual({
      label: "En cours",
      tone: "accent",
    });
    expect(sequenceStatusMeta("CANCELED").label).toBe("Arrêtée");
    expect(recipientStatusMeta("REPLIED")).toEqual({
      label: "A répondu",
      tone: "success",
    });
    expect(sequenceStatusMeta("INCONNU")).toEqual({
      label: "INCONNU",
      tone: "neutral",
    });
  });

  it("brouillon, lancée, en cours ou en pause, supprimable", () => {
    expect(isLaunched("DRAFT")).toBe(false);
    expect(isLaunched("ACTIVE")).toBe(true);
    expect(isLaunched(undefined)).toBe(false);
    expect(isLive("PAUSED")).toBe(true);
    expect(isLive("COMPLETED")).toBe(false);
    expect(canDeleteSequence("DRAFT")).toBe(true);
    expect(canDeleteSequence("COMPLETED")).toBe(true);
    expect(canDeleteSequence("ACTIVE")).toBe(false);
    expect(canDeleteSequence("PAUSED")).toBe(false);
  });

  it("onglets de la liste", () => {
    const sequences = [
      { id: "a", status: "DRAFT" },
      { id: "b", status: "ACTIVE" },
      { id: "c", status: "COMPLETED" },
      { id: "d", status: "CANCELED" },
    ];
    expect(filterSequences(sequences, "done").map((s) => s.id)).toEqual([
      "c",
      "d",
    ]);
    expect(filterSequences(sequences, "all")).toHaveLength(4);
    expect(filterSequences(null, "drafts")).toEqual([]);
    expect(countSequencesByTab(sequences)).toEqual({
      all: 4,
      drafts: 1,
      active: 1,
      paused: 0,
      done: 2,
    });
  });
});

describe("avancement", () => {
  const stats = {
    recipients: 10,
    pending: 4,
    sent: 3,
    simulated: 1,
    replied: 1,
    bounced: 0,
    unsubscribed: 0,
    failed: 1,
    skipped: 0,
  };

  it("traités = tout sauf en attente ; partis = sans échecs ni non-envoyés", () => {
    expect(sequenceProgress(stats)).toEqual({
      total: 10,
      pending: 4,
      processed: 6,
      sent: 5,
      ratio: 0.6,
    });
  });

  it("sans statistiques : rien de traité", () => {
    expect(sequenceProgress(null)).toEqual({
      total: 0,
      pending: 0,
      processed: 0,
      sent: 0,
      ratio: 0,
    });
    // Compteur en avance sur le total : borné
    expect(sequenceProgress({ recipients: 2, pending: 5 }).processed).toBe(0);
  });

  it("taux de réponse et de désinscription sur les messages partis", () => {
    expect(replyRate(stats)).toBeCloseTo(0.2);
    expect(unsubscribeRate({ ...stats, unsubscribed: 1 })).toBeCloseTo(0.2);
    expect(replyRate({ recipients: 3, pending: 3 })).toBeNull();
  });
});

describe("dates", () => {
  it("jour « AAAA-MM-JJ » jamais décalé", () => {
    expect(parseDay("2026-12-05").toISOString()).toBe(
      "2026-12-05T12:00:00.000Z",
    );
    expect(parseDay("05/12/2026")).toBeNull();
    expect(parseDay(null)).toBeNull();
  });

  it("fin prévue en toutes lettres, « 1er » et année si autre", () => {
    expect(formatEndDate("2026-12-05", NOW)).toBe("samedi 5 décembre");
    expect(formatEndDate("2026-12-01", NOW)).toBe("mardi 1er décembre");
    expect(formatEndDate("2026-12-11", NOW)).toBe("vendredi 11 décembre");
    expect(formatEndDate("2027-01-04", NOW)).toBe("lundi 4 janvier 2027");
    expect(estimatedEndLabel("2026-12-05", NOW)).toBe(
      "Fin prévue le samedi 5 décembre",
    );
    expect(estimatedEndLabel(null, NOW)).toBeNull();
  });

  it("jour et mois", () => {
    expect(formatDayMonth("2026-12-01T09:00:00Z", NOW)).toBe("1er décembre");
    expect(formatDayMonth("2027-02-03T09:00:00Z", NOW)).toBe("3 février 2027");
    expect(formatDayMonth(null, NOW)).toBe("");
  });

  it("jours d'envoi prévus", () => {
    expect(estimatedDaysLabel(1)).toBe("1 jour d'envoi");
    expect(estimatedDaysLabel(4)).toBe("4 jours d'envoi");
    expect(estimatedDaysLabel(0)).toBeNull();
    expect(estimatedDaysLabel(null)).toBeNull();
  });

  it("date utile de la liste selon le statut", () => {
    const base = {
      startedAt: "2026-11-20T08:00:00Z",
      updatedAt: "2026-11-22T08:00:00Z",
      completedAt: "2026-11-24T08:00:00Z",
    };
    expect(sequenceDateLabel({ ...base, status: "ACTIVE" }, NOW)).toBe(
      "Lancée le 20 nov. à 09:00",
    );
    expect(sequenceDateLabel({ ...base, status: "PAUSED" }, NOW)).toBe(
      "En pause depuis le 22 nov. à 09:00",
    );
    expect(sequenceDateLabel({ ...base, status: "COMPLETED" }, NOW)).toBe(
      "Terminée le 24 nov. à 09:00",
    );
    expect(sequenceDateLabel({ ...base, status: "CANCELED" }, NOW)).toBe(
      "Arrêtée le 24 nov. à 09:00",
    );
    expect(sequenceDateLabel({ ...base, status: "DRAFT" }, NOW)).toBe(
      "Modifiée le 22 nov. à 09:00",
    );
  });

  it("nom proposé pour une nouvelle prospection", () => {
    expect(defaultSequenceName(NOW)).toBe("Prospection du 25 novembre");
    expect(defaultSequenceName(new Date("2026-12-01T10:00:00Z"))).toBe(
      "Prospection du 1er décembre",
    );
  });
});

describe("plage d'envoi", () => {
  it("jours en clair", () => {
    expect(formatDays([1, 2, 3, 4, 5])).toBe("Du lundi au vendredi");
    expect(formatDays([5, 1, 2, 3, 4, 4])).toBe("Du lundi au vendredi");
    expect(formatDays([1, 2, 3, 4, 5, 6, 7])).toBe("Tous les jours");
    expect(formatDays([1, 3, 5])).toBe("Lundi, mercredi et vendredi");
    expect(formatDays([6, 7])).toBe("Samedi et dimanche");
    expect(formatDays([6])).toBe("Le samedi");
    expect(formatDays([])).toBe("Aucun jour");
  });

  it("jours valides, triés, sans doublon", () => {
    expect(normalizeDays([3, "1", 9, 0, 3, 7])).toEqual([1, 3, 7]);
    expect(normalizeDays(null)).toEqual([]);
  });

  it("plage complète, heures avec espace insécable", () => {
    expect(
      formatSendWindow({ days: [1, 2, 3, 4, 5], startHour: 9, endHour: 18 }),
    ).toBe(`Du lundi au vendredi, de 9${NBSP}h à 18${NBSP}h`);
    expect(formatSendWindow(null)).toBe("");
  });
});

describe("boîte d'envoi", () => {
  it("route d'autorisation par fournisseur", () => {
    expect(providerLabel("GOOGLE")).toBe("Gmail");
    expect(providerLabel("MICROSOFT")).toBe("Outlook");
    expect(mailboxAuthorizePath("GOOGLE")).toBe(
      "/mailbox-connect/google/authorize",
    );
    expect(mailboxAuthorizePath("MICROSOFT")).toBe(
      "/mailbox-connect/microsoft/authorize",
    );
    expect(mailboxAuthorizePath("YAHOO")).toBeNull();
    expect(mailboxAuthorizeUrl("http://localhost:4000/", "GOOGLE")).toBe(
      "http://localhost:4000/mailbox-connect/google/authorize",
    );
    expect(mailboxAuthorizeUrl("https://api.newbi.fr", "YAHOO")).toBeNull();
  });

  it("retour de la connexion : réussite, erreur, rien", () => {
    expect(readMailboxReturn(new URLSearchParams("boite=connectee"))).toEqual({
      kind: "connected",
    });
    expect(
      readMailboxReturn(
        new URLSearchParams(
          `boite_erreur=${encodeURIComponent("Accès refusé par Google")}`,
        ),
      ),
    ).toEqual({ kind: "error", message: "Accès refusé par Google" });
    expect(
      readMailboxReturn(new URLSearchParams("boite_erreur=")).message,
    ).toBe("La connexion de la boîte n'a pas abouti.");
    expect(
      readMailboxReturn(new URLSearchParams(`boite_erreur=${"x".repeat(500)}`))
        .message,
    ).toHaveLength(200);
    expect(readMailboxReturn(new URLSearchParams("onglet=1"))).toBeNull();
    expect(readMailboxReturn(null)).toBeNull();
  });

  it("adresse nettoyée des paramètres de retour, les autres gardés", () => {
    expect(
      cleanMailboxReturnUrl(
        "https://www.newbi.fr/dashboard/outils/prospection?boite=connectee&onglet=2#liste",
      ),
    ).toBe("/dashboard/outils/prospection?onglet=2#liste");
    expect(
      cleanMailboxReturnUrl(
        "https://www.newbi.fr/dashboard/outils/prospection?boite_erreur=Refus",
      ),
    ).toBe("/dashboard/outils/prospection");
    expect(cleanMailboxReturnUrl("pas une adresse")).toBeNull();
  });

  it("état de la boîte pour la carte", () => {
    expect(mailboxState(null)).toBe("none");
    expect(mailboxState({ status: "DISCONNECTED" })).toBe("none");
    expect(mailboxState({ status: "EXPIRED" })).toBe("expired");
    expect(mailboxState({ status: "PAUSED" })).toBe("paused");
    expect(mailboxState({ status: "ACTIVE" })).toBe("active");
  });

  it("envois du jour", () => {
    expect(sentTodayLabel({ sentToday: 3, effectiveDailyLimit: 10 })).toBe(
      "3 / 10 envoyés aujourd'hui",
    );
    expect(sentTodayLabel(null)).toBe("");
  });
});

describe("montée progressive", () => {
  it("10 la première semaine, 20 la deuxième, puis la limite choisie", () => {
    expect(rampUp(daysAgo(2), 30, NOW)).toMatchObject({
      active: true,
      cap: 10,
      limit: 10,
    });
    expect(rampUp(daysAgo(9), 30, NOW)).toMatchObject({
      active: true,
      cap: 20,
      limit: 20,
    });
    expect(rampUp(daysAgo(20), 30, NOW)).toEqual({
      active: false,
      cap: null,
      limit: 30,
    });
    expect(rampUp(null, 30, NOW).active).toBe(false);
  });

  it("phrase seulement si la montée bride la limite", () => {
    const connectedAt = "2026-11-24T10:00:00Z";
    expect(rampUpHint(connectedAt, 30, NOW)).toBe(
      "Montée progressive : 10 e-⁠mails par jour au plus jusqu'au 30 novembre, puis 20 jusqu'au 7 décembre.",
    );
    expect(rampUpHint(connectedAt, 15, NOW)).toBe(
      "Montée progressive : 10 e-⁠mails par jour au plus jusqu'au 30 novembre.",
    );
    expect(rampUpHint(connectedAt, 10, NOW)).toBeNull();
    expect(rampUpHint("2026-11-15T10:00:00Z", 30, NOW)).toBe(
      "Montée progressive : 20 e-⁠mails par jour au plus jusqu'au 28 novembre.",
    );
    expect(rampUpHint("2026-11-01T10:00:00Z", 30, NOW)).toBeNull();
  });
});

describe("réglages de la boîte", () => {
  it("formulaire : valeurs de la boîte, sinon par défaut", () => {
    expect(mailboxSettingsForm(null, { defaultDailyLimit: 30 })).toEqual({
      dailyLimit: "30",
      days: [1, 2, 3, 4, 5],
      startHour: 9,
      endHour: 18,
      signatureId: "none",
    });
    expect(
      mailboxSettingsForm({
        dailyLimit: 20,
        sendWindow: { days: [2, 1], startHour: 8, endHour: 12 },
        signatureId: "sig-1",
      }),
    ).toEqual({
      dailyLimit: "20",
      days: [1, 2],
      startHour: 8,
      endHour: 12,
      signatureId: "sig-1",
    });
  });

  it("contrôles de saisie", () => {
    const form = {
      dailyLimit: "30",
      days: [1, 2],
      startHour: 9,
      endHour: 18,
    };
    expect(validateMailboxSettings(form, { maxDailyLimit: 50 })).toEqual({});
    expect(
      validateMailboxSettings(
        { ...form, dailyLimit: "3" },
        { maxDailyLimit: 50 },
      ).dailyLimit,
    ).toBe("Entre 5 et 50 e-mails par jour.");
    expect(
      validateMailboxSettings(
        { ...form, dailyLimit: "60" },
        { maxDailyLimit: 50 },
      ).dailyLimit,
    ).toBeTruthy();
    expect(
      validateMailboxSettings({ ...form, dailyLimit: "12,5" }).dailyLimit,
    ).toBeTruthy();
    expect(validateMailboxSettings({ ...form, days: [] }).days).toBe(
      "Choisissez au moins un jour.",
    );
    expect(
      validateMailboxSettings({ ...form, startHour: 18, endHour: 9 }).hours,
    ).toBe("L'heure de fin doit venir après l'heure de début.");
  });

  it("variables de updateProspectingMailbox", () => {
    expect(
      mailboxSettingsInput({
        dailyLimit: " 25 ",
        days: [5, 1, 1],
        startHour: "8",
        endHour: "17",
        signatureId: "none",
      }),
    ).toEqual({
      dailyLimit: 25,
      sendWindow: { days: [1, 5], startHour: 8, endHour: 17 },
      signatureId: null,
    });
    expect(
      mailboxSettingsInput({
        dailyLimit: "30",
        days: [1],
        startHour: 9,
        endHour: 18,
        signatureId: "sig-1",
      }).signatureId,
    ).toBe("sig-1");
  });
});

describe("brouillon", () => {
  it("nouvelle prospection : nom du jour et signature de la boîte", () => {
    expect(newSequenceInput({ now: NOW })).toEqual({
      name: "Prospection du 25 novembre",
    });
    expect(newSequenceInput({ signatureId: "sig-1", now: NOW })).toEqual({
      name: "Prospection du 25 novembre",
      signatureId: "sig-1",
    });
  });

  it("brouillon pour les prospects d'une liste", () => {
    expect(
      sequenceFromListInput({
        listId: "liste-1",
        listName: "  Menuisiers Lyon  ",
        signatureId: "sig-1",
        now: NOW,
      }),
    ).toEqual({
      name: "Menuisiers Lyon",
      audience: { mode: "LISTS", listIds: ["liste-1"], excludeListIds: [] },
      signatureId: "sig-1",
    });
    expect(
      sequenceFromListInput({ listId: "liste-1", listName: "", now: NOW }).name,
    ).toBe("Prospection du 25 novembre");
    expect(
      sequenceFromListInput({ listId: "l", listName: "x".repeat(150) }).name,
    ).toHaveLength(120);
  });

  it("texte et extrait du message", () => {
    const html =
      "<p>Bonjour {{prenom}},</p><p>Je suis menuisier&nbsp;à Lyon &amp; environs.</p><ul><li>Un</li><li>Deux</li></ul>";
    expect(bodyText(html)).toBe(
      "Bonjour {{prenom}}, Je suis menuisier à Lyon & environs. Un Deux",
    );
    expect(bodyExcerpt(html, 20)).toBe("Bonjour {{prenom}},…");
    expect(bodyText("<p></p>")).toBe("");
  });

  it("étapes complètes", () => {
    expect(
      sequenceCompletion({
        mailbox: { status: "ACTIVE" },
        audience: { mode: "LISTS", listIds: [] },
        subject: "Question",
        body: "<p></p>",
      }),
    ).toEqual({ mailbox: true, audience: false, message: false });
    expect(
      sequenceCompletion({
        mailbox: { status: "EXPIRED" },
        audience: { mode: "ALL", listIds: [] },
        subject: "Question",
        body: "<p>Bonjour</p>",
      }),
    ).toEqual({ mailbox: false, audience: true, message: true });
    // Boîte suspendue par le coupe-circuit : le lancement la réactive
    expect(sequenceCompletion({ mailbox: { status: "PAUSED" } }).mailbox).toBe(
      true,
    );
  });
});

describe("destinataires", () => {
  it("exclusions non nulles, au singulier ou au pluriel", () => {
    expect(
      prospectingExclusions({
        individuals: 2,
        recentlyContacted: 1,
        noEmail: 0,
        duplicates: 3,
      }),
    ).toEqual([
      {
        key: "individuals",
        count: 2,
        label: "fiches de particuliers",
      },
      {
        key: "recentlyContacted",
        count: 1,
        label: "déjà prospecté depuis moins de 30 jours",
      },
      { key: "duplicates", count: 3, label: "doublons" },
    ]);
    expect(prospectingExclusions(null)).toEqual([]);
  });

  it("filtres : Tous, ceux qui ont des destinataires, et le filtre choisi", () => {
    const stats = { recipients: 8, pending: 2, sent: 5, replied: 1 };
    expect(
      recipientFilters(stats).map((filter) => [filter.value, filter.count]),
    ).toEqual([
      ["ALL", 8],
      ["PENDING", 2],
      ["SENT", 5],
      ["REPLIED", 1],
    ]);
    expect(
      recipientFilters(stats, "FAILED").map((filter) => filter.value),
    ).toContain("FAILED");
    expect(recipientStatusFilter("ALL")).toBeNull();
    expect(recipientStatusFilter("SENT")).toBe("SENT");
  });

  it("actions possibles sur un destinataire", () => {
    expect(recipientActions({ status: "SENT" })).toEqual({
      replied: true,
      doNotContact: true,
    });
    expect(recipientActions({ status: "PENDING" })).toEqual({
      replied: false,
      doNotContact: true,
    });
    expect(recipientActions({ status: "REPLIED" }).replied).toBe(false);
    expect(recipientActions({ status: "UNSUBSCRIBED" })).toEqual({
      replied: false,
      doNotContact: false,
    });
    // Déjà écarté (désinscrit, déjà prospecté, ne plus contacter)
    expect(recipientActions({ status: "SKIPPED" })).toEqual({
      replied: false,
      doNotContact: false,
    });
  });
});

describe("historique d'un contact", () => {
  it("dates d'envoi, de réponse ou de désinscription, sinon l'état", () => {
    expect(
      recipientHistoryLabel(
        {
          status: "REPLIED",
          sentAt: "2026-11-20T08:00:00Z",
          repliedAt: "2026-11-21T09:15:00Z",
        },
        NOW,
      ),
    ).toBe("Envoyé le 20 nov. à 09:00 · réponse le 21 nov. à 10:15");
    expect(
      recipientHistoryLabel(
        { status: "UNSUBSCRIBED", unsubscribedAt: "2026-11-22T08:00:00Z" },
        NOW,
      ),
    ).toBe("Désinscrit le 22 nov. à 09:00");
    expect(recipientHistoryLabel({ status: "PENDING" }, NOW)).toBe(
      "En attente d'envoi",
    );
    expect(recipientHistoryLabel({ status: "SKIPPED" }, NOW)).toBe(
      "Non envoyé",
    );
    expect(recipientHistoryLabel(null)).toBe("");
  });
});

describe("mode d'envoi du serveur", () => {
  it("simulé ou restreint : tout sauf LIVE", () => {
    expect(isSimulatedSendMode("LIVE")).toBe(false);
    expect(isSimulatedSendMode("SIMULATION")).toBe(true);
    expect(isSimulatedSendMode("RESTRICTED")).toBe(true);
    expect(isSimulatedSendMode(undefined)).toBe(false);
  });

  it("titre du message après un test", () => {
    expect(testSentTitle("LIVE")).toBe("E-mail de test envoyé");
    expect(testSentTitle("RESTRICTED")).toBe(
      "E-mail de test envoyé (ou simulé selon l'environnement)",
    );
  });
});

describe("vérification", () => {
  it("lien de correction selon l'identifiant ou la catégorie", () => {
    expect(prospectingCheckTarget({ id: "mailbox_expired" })).toEqual({
      section: "boite",
    });
    expect(prospectingCheckTarget({ id: "subject_empty" })).toEqual({
      section: "message",
    });
    expect(prospectingCheckTarget({ id: "variables_first_name" })).toEqual({
      section: "message",
    });
    expect(prospectingCheckTarget({ id: "audience_empty" })).toEqual({
      section: "destinataires",
    });
    expect(prospectingCheckTarget({ id: "legal_address" })).toEqual({
      settings: true,
    });
    expect(prospectingCheckTarget({ id: "x_1", category: "audience" })).toEqual(
      { section: "destinataires" },
    );
    expect(prospectingCheckTarget({ id: "duration" })).toBeNull();
    expect(prospectingCheckTarget(null)).toBeNull();
  });
});
