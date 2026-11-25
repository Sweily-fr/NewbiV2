// Campagnes e-mail, suivi des ouvertures et des clics (recommandation CNIL
// sur les pixels de suivi) : fenêtre d'envoi avec la seconde case
// obligatoire quand la campagne suit quelque chose (variable
// trackingConsent), section Suivi (rappel et lien de confidentialité
// contrôlé), pied de l'éditeur qui annonce le suivi.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";

const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock("@/src/components/ui/sonner", () => ({ toast }));

import { SEND_EMAIL_CAMPAIGN } from "@/src/graphql/emailCampaignQueries";
import { SendDialog } from "@/app/dashboard/outils/campagnes-email/components/setup/send-dialog";
import { TrackingSection } from "@/app/dashboard/outils/campagnes-email/components/setup/tracking-section";
import { EmailFooterView } from "@/app/dashboard/outils/campagnes-email/components/email-design/email-blocks";

const STATS = {
  __typename: "EmailCampaignStats",
  recipients: 3,
  sent: 0,
  simulated: 0,
  delivered: 0,
  opened: 0,
  clicked: 0,
  opens: 0,
  clicks: 0,
  bounced: 0,
  complained: 0,
  unsubscribed: 0,
  failed: 0,
};

const campagne = (overrides = {}) => ({
  __typename: "EmailCampaign",
  id: "c1",
  workspaceId: "w1",
  name: "Nouveautés",
  status: "DRAFT",
  subject: "Les nouveautés de l'atelier",
  preheader: "",
  fromName: "Atelier Durand",
  replyTo: "contact@atelier.fr",
  senderEmail: "atelier-durand@envoi.newbi.fr",
  design: { version: 1, blocks: [] },
  audience: {
    __typename: "EmailCampaignAudience",
    mode: "ALL",
    listIds: [],
    excludeListIds: [],
  },
  trackOpens: false,
  trackClicks: false,
  privacyPolicyUrl: "",
  trackingPurgedAt: null,
  scheduledAt: null,
  startedAt: null,
  completedAt: null,
  pausedReason: null,
  createdByName: "Jean Dupont",
  createdAt: "2026-11-25T08:00:00.000Z",
  updatedAt: "2026-11-25T08:00:00.000Z",
  stats: STATS,
  ...overrides,
});

const envoi = (campaign, trackingConsent) => ({
  request: {
    query: SEND_EMAIL_CAMPAIGN,
    variables: {
      workspaceId: "w1",
      id: "c1",
      scheduledAt: null,
      consent: true,
      trackingConsent,
    },
  },
  result: {
    data: { sendEmailCampaign: { ...campaign, status: "SENDING" } },
  },
});

function ouvrirEnvoi(campaign, mocks) {
  const onOpenChange = vi.fn();
  render(
    <MockedProvider mocks={mocks}>
      <SendDialog
        open
        onOpenChange={onOpenChange}
        mode="now"
        workspaceId="w1"
        campaign={campaign}
        audienceCount={{ sendable: 3 }}
        settings={{ quota: { remaining: 100 }, sendMode: "LIVE" }}
      />
    </MockedProvider>,
  );
  return { onOpenChange };
}

// « 3 contacts » avec une espace insécable
const boutonEnvoyer = () =>
  screen.getByRole("button", { name: /Envoyer à 3\scontacts/ });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fenêtre d'envoi", () => {
  it("sans suivi : une seule case, trackingConsent à false", async () => {
    const campaign = campagne();
    const { onOpenChange } = ouvrirEnvoi(campaign, [envoi(campaign, false)]);
    const cases = screen.getAllByRole("checkbox");
    expect(cases).toHaveLength(1);
    expect(screen.queryByText(/Mes destinataires ont accepté/)).toBeNull();
    expect(boutonEnvoyer()).toBeDisabled();
    fireEvent.click(cases[0]);
    expect(boutonEnvoyer()).toBeEnabled();
    fireEvent.click(boutonEnvoyer());
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("suivi actif : seconde case obligatoire, trackingConsent à true", async () => {
    const campaign = campagne({ trackOpens: true, trackClicks: true });
    const { onOpenChange } = ouvrirEnvoi(campaign, [envoi(campaign, true)]);
    const cases = screen.getAllByRole("checkbox");
    expect(cases).toHaveLength(2);
    expect(
      screen.getByText(
        "Mes destinataires ont accepté que je mesure l'ouverture de mes e-mails et les clics sur leurs liens.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/Obligatoire \(CNIL\)/)).toBeInTheDocument();
    fireEvent.click(cases[0]);
    // Accord pour le suivi pas encore donné : envoi bloqué
    expect(boutonEnvoyer()).toBeDisabled();
    fireEvent.click(cases[1]);
    expect(boutonEnvoyer()).toBeEnabled();
    fireEvent.click(boutonEnvoyer());
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(toast.error).not.toHaveBeenCalled();
  });
});

describe("section Suivi", () => {
  it("désactivée : pas de rappel ni de lien de confidentialité", () => {
    render(<TrackingSection campaign={campagne()} canEdit onSave={vi.fn()} />);
    expect(screen.getByText(/Désactivé par défaut/)).toBeInTheDocument();
    expect(
      screen.getByRole("switch", { name: "Suivre les ouvertures" }),
    ).not.toBeChecked();
    expect(screen.queryByText(/La CNIL exige/)).toBeNull();
    expect(
      screen.queryByLabelText("Lien vers votre politique de confidentialité"),
    ).toBeNull();
  });

  it("activée : rappel, lien contrôlé puis enregistré en quittant le champ", async () => {
    const onSave = vi.fn(async () => true);
    render(
      <TrackingSection
        campaign={campagne({ trackOpens: true })}
        canEdit
        onSave={onSave}
      />,
    );
    expect(screen.getByText(/La CNIL exige/)).toBeInTheDocument();
    const champ = screen.getByLabelText(
      "Lien vers votre politique de confidentialité",
    );
    fireEvent.change(champ, { target: { value: "atelier.fr/rgpd" } });
    expect(
      screen.getByText("Adresse invalide : elle doit commencer par https://"),
    ).toBeInTheDocument();
    fireEvent.blur(champ);
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.change(champ, {
      target: { value: " https://atelier.fr/rgpd " },
    });
    fireEvent.blur(champ);
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        { privacyPolicyUrl: "https://atelier.fr/rgpd" },
        { quiet: true },
      ),
    );
  });

  it("campagne partie : réglages en lecture seule", () => {
    render(
      <TrackingSection
        campaign={campagne({ status: "SENT", trackOpens: true })}
        canEdit
        onSave={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("switch", { name: "Suivre les ouvertures" }),
    ).toBeDisabled();
    expect(
      screen.getByLabelText("Lien vers votre politique de confidentialité"),
    ).toBeDisabled();
  });
});

describe("pied de l'e-mail dans l'éditeur", () => {
  it("annonce le suivi actif, comme l'API, avec la politique de confidentialité", () => {
    render(
      <EmailFooterView
        companyName="Atelier Durand"
        trackingNotice={{
          opens: true,
          clicks: false,
          privacyPolicyUrl: "https://atelier.fr/rgpd",
        }}
      />,
    );
    expect(
      screen.getByText(
        /Atelier Durand mesure l'ouverture de cet e-mail\. Pour refuser ce suivi, répondez à cet e-mail\./,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Politique de confidentialité"),
    ).toBeInTheDocument();
  });

  it("sans suivi : aucune phrase", () => {
    render(<EmailFooterView companyName="Atelier Durand" />);
    expect(screen.queryByText(/mesure/)).toBeNull();
    expect(screen.getByText("Se désinscrire")).toBeInTheDocument();
  });
});
