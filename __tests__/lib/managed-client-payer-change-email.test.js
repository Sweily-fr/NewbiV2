// @vitest-environment node
//
// E-mail au client quand le payeur de son abonnement change : un texte par
// situation, sans icône ni tiret cadratin, et jamais de ponctuation ou de
// dernier mot seul en début ou fin de ligne.
import { describe, it, expect } from "vitest";
import {
  managedClientPayerChange,
  managedClientPayerChangeContent,
} from "@/src/lib/email-templates/organization/managed-client-payer-change";

const KINDS = [
  "takeover_now",
  "takeover_renewal",
  "takeover_unpaid",
  "takeover_trial",
  "takeover_start",
  "takeover_pending",
  "takeover_resumed",
  "handback_scheduled",
  "handback_restored",
  "handback_trial",
  "handback_now",
];

const base = {
  managerName: "Compta <Dupont>",
  companyName: "Boulangerie Martin",
  effectiveAt: new Date("2026-11-12T10:00:00Z"),
  trialEndsAt: new Date("2026-11-20T10:00:00Z"),
  nextChargeAt: new Date("2026-11-30T10:00:00Z"),
  refundAmount: 3266,
  url: "https://www.newbi.fr/dashboard?parametres=subscription",
};

describe("e-mail de changement de payeur", () => {
  it.each(KINDS)("%s : objet, titre et texte propres", (kind) => {
    const content = managedClientPayerChangeContent({ ...base, kind });
    const html = managedClientPayerChange({ ...base, kind });
    expect(content.subject).toContain("Compta <Dupont>");
    expect(content.paragraphs.length).toBeGreaterThan(0);
    // Noms saisis par le cabinet échappés dans le HTML
    expect(html).not.toContain("<Dupont>");
    expect(html).toContain("Compta &lt;Dupont&gt;");
    // Ni tiret cadratin ni « : » seul en début de ligne
    expect(html).not.toMatch(/\u2014/);
    expect(html).not.toMatch(/ :/);
    expect(html).toContain("Voir mon abonnement");
    expect(html).toContain(base.url);
  });

  it("dates en toutes lettres et remboursement en euros", () => {
    const renewal = managedClientPayerChange({
      ...base,
      kind: "takeover_renewal",
    });
    expect(renewal).toContain("12 novembre 2026");
    const now = managedClientPayerChange({ ...base, kind: "takeover_now" });
    expect(now).toContain("32,66");
    const noRefund = managedClientPayerChangeContent({
      ...base,
      kind: "takeover_now",
      refundAmount: 0,
    });
    expect(noRefund.paragraphs.join(" ")).not.toContain("remboursée");
  });

  it("le dernier mot de chaque paragraphe reste avec le précédent", () => {
    const html = managedClientPayerChange({
      ...base,
      kind: "handback_scheduled",
    });
    expect(html).toMatch(
      /<span style="white-space: nowrap;">[^<]* [^<]*<\/span>\s*<\/p>/,
    );
  });
});
