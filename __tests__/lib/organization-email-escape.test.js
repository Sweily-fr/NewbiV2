import { describe, it, expect } from "vitest";
import { organizationInvitation } from "@/src/lib/email-templates/organization/invitation";
import { memberJoinedConfirmation } from "@/src/lib/email-templates/organization/member-joined-confirmation";
import { memberJoinedNotificationInviter } from "@/src/lib/email-templates/organization/member-joined-inviter";
import { memberJoinedNotificationOwner } from "@/src/lib/email-templates/organization/member-joined-owner";

// Noms saisis librement (espace, invitant, membre) et enregistrés tels quels :
// ils doivent apparaître comme du texte dans les e-mails, jamais comme du HTML.
const LIEN = '<a href="https://exemple.invalid/x">Accepter</a>';
const IMAGE = "<img src=x onerror=alert(1)>";

const donnees = {
  organization: { name: `Espace ${LIEN}` },
  inviter: { user: { name: `Inviteur ${IMAGE}`, email: "inviteur@e2e.test" } },
  member: {
    role: "member",
    user: { name: `Membre ${IMAGE}`, email: `membre${IMAGE}@e2e.test` },
  },
};

const GABARITS = [
  [
    "invitation",
    () =>
      organizationInvitation(
        donnees,
        "https://www.newbi.fr/accept-invitation/abc?org=x&email=y",
      ),
  ],
  ["bienvenue du nouveau membre", () => memberJoinedConfirmation(donnees)],
  [
    "invitation acceptée (invitant)",
    () => memberJoinedNotificationInviter(donnees),
  ],
  [
    "nouveau membre (propriétaire)",
    () => memberJoinedNotificationOwner(donnees),
  ],
];

describe("E-mails d'espace : noms échappés", () => {
  it.each(GABARITS)("%s : aucun lien ni image injectés", (_nom, rendu) => {
    const html = rendu();
    expect(html).not.toContain('exemple.invalid/x">');
    expect(html).not.toMatch(/<a href="https:\/\/exemple\.invalid/);
    expect(html).not.toMatch(/<img src=x/);
    expect(html).not.toContain("onerror=alert(1)>");
  });

  it.each(GABARITS)(
    "%s : les noms restent lisibles (échappés)",
    (_nom, rendu) => {
      const html = rendu();
      expect(html).toMatch(/&lt;(a href|img src)/);
    },
  );

  it("invitation : le lien d'acceptation reste l'adresse du site", () => {
    const html = organizationInvitation(
      donnees,
      "https://www.newbi.fr/accept-invitation/abc?org=x&email=y",
    );
    expect(html).toContain(
      'href="https://www.newbi.fr/accept-invitation/abc?org=x&amp;email=y"',
    );
  });

  it("noms ordinaires : inchangés (accents, apostrophe affichée)", () => {
    const html = memberJoinedNotificationOwner({
      organization: { name: "Atelier Lumière" },
      member: {
        role: "admin",
        user: { name: "Zoé Martin", email: "zoe@e2e.test" },
      },
    });
    expect(html).toContain("Zoé Martin a rejoint Atelier Lumière");
  });
});
