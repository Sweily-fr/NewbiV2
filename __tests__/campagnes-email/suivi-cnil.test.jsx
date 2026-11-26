// Campagnes e-mail, suivi des ouvertures et des clics (recommandation CNIL
// sur les pixels de suivi), accord par contact : fenêtre d'envoi (une seule
// case, ligne « Suivi » du résumé, plus de variable trackingConsent),
// section Suivi (contacts suivis, lien de confidentialité contrôlé), pied de
// l'éditeur (phrase et « Gérer mes préférences »), rapport (taux sur les
// contacts suivis, « Non suivi » par destinataire).
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";

const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock("@/src/components/ui/sonner", () => ({ toast }));
// Rapport : tous les droits, abonnement actif
vi.mock("@/src/hooks/useMyPermissions", () => ({
  useMyPermissions: () => ({ isReady: true, canDo: () => true }),
}));
vi.mock("@/src/hooks/useSubscriptionAccess", () => ({
  useSubscriptionAccess: () => ({ isReadOnly: false, isOwner: true }),
}));

import {
  GET_EMAIL_CAMPAIGN_LINK_STATS,
  GET_EMAIL_CAMPAIGN_RECIPIENTS,
  SEND_EMAIL_CAMPAIGN,
} from "@/src/graphql/emailCampaignQueries";
import { SendDialog } from "@/app/dashboard/outils/campagnes-email/components/setup/send-dialog";
import { TrackingSection } from "@/app/dashboard/outils/campagnes-email/components/setup/tracking-section";
import { EmailFooterView } from "@/app/dashboard/outils/campagnes-email/components/email-design/email-blocks";
import { CampaignReport } from "@/app/dashboard/outils/campagnes-email/components/report/campaign-report";

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
  trackedRecipients: null,
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

// Plus de variable trackingConsent : l'API applique les accords par contact
const envoi = (campaign) => ({
  request: {
    query: SEND_EMAIL_CAMPAIGN,
    variables: {
      workspaceId: "w1",
      id: "c1",
      scheduledAt: null,
      consent: true,
    },
  },
  result: {
    data: { sendEmailCampaign: { ...campaign, status: "SENDING" } },
  },
});

function ouvrirEnvoi(
  campaign,
  mocks,
  audienceCount = { sendable: 3, trackingGranted: 1 },
) {
  const onOpenChange = vi.fn();
  render(
    <MockedProvider mocks={mocks}>
      <SendDialog
        open
        onOpenChange={onOpenChange}
        mode="now"
        workspaceId="w1"
        campaign={campaign}
        audienceCount={audienceCount}
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
  it("sans suivi : une case, pas de ligne Suivi, envoi sans trackingConsent", async () => {
    const campaign = campagne();
    const { onOpenChange } = ouvrirEnvoi(campaign, [envoi(campaign)]);
    const cases = screen.getAllByRole("checkbox");
    expect(cases).toHaveLength(1);
    expect(screen.queryByText("Suivi")).toBeNull();
    expect(boutonEnvoyer()).toBeDisabled();
    fireEvent.click(cases[0]);
    expect(boutonEnvoyer()).toBeEnabled();
    fireEvent.click(boutonEnvoyer());
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("suivi actif : plus de seconde case, résumé « 1 contact sur 3 »", async () => {
    const campaign = campagne({ trackOpens: true, trackClicks: true });
    const { onOpenChange } = ouvrirEnvoi(campaign, [envoi(campaign)]);
    const cases = screen.getAllByRole("checkbox");
    expect(cases).toHaveLength(1);
    expect(screen.queryByText(/Mes destinataires ont accepté/)).toBeNull();
    expect(screen.queryByText(/Obligatoire \(CNIL\)/)).toBeNull();
    expect(screen.getByText("Suivi")).toBeInTheDocument();
    expect(screen.getByText(/^1\scontact sur 3$/)).toBeInTheDocument();
    fireEvent.click(cases[0]);
    expect(boutonEnvoyer()).toBeEnabled();
    fireEvent.click(boutonEnvoyer());
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("suivi actif sans aucun accord : envoi sans suivi annoncé, jamais bloqué", () => {
    const campaign = campagne({ trackOpens: true });
    ouvrirEnvoi(campaign, [], { sendable: 3, trackingGranted: 0 });
    expect(
      screen.getByText("Aucun contact n'a accepté : envoi sans suivi"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox"));
    expect(boutonEnvoyer()).toBeEnabled();
  });
});

function rendreSuivi(props = {}) {
  render(
    <MockedProvider mocks={[]}>
      <TrackingSection
        campaign={campagne()}
        canEdit
        onSave={vi.fn()}
        workspaceId="w1"
        audienceCount={{ sendable: 3, trackingGranted: 1 }}
        canEditConsents
        {...props}
      />
    </MockedProvider>,
  );
}

// Texte de l'encadré, espaces insécables remplacées
const encadre = () =>
  screen.getByText(/Le suivi ne s'applique/).textContent.replace(/\s+/g, " ");

describe("section Suivi", () => {
  it("désactivée : ni explication, ni accords, ni lien de confidentialité", () => {
    rendreSuivi();
    expect(screen.getByText(/Désactivé par défaut/)).toBeInTheDocument();
    expect(
      screen.getByRole("switch", { name: "Suivre les ouvertures" }),
    ).not.toBeChecked();
    expect(screen.queryByText(/Le suivi ne s'applique/)).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Gérer les accords" }),
    ).toBeNull();
    expect(
      screen.queryByLabelText("Lien vers votre politique de confidentialité"),
    ).toBeNull();
  });

  it("activée : contacts suivis sur les destinataires, préférences, effacement", () => {
    rendreSuivi({ campaign: campagne({ trackOpens: true }) });
    expect(encadre()).toBe(
      "Le suivi ne s'applique qu'aux contacts qui l'ont accepté : 1 sur 3 destinataires de cette campagne. Les autres reçoivent le même e-mail, sans suivi. Chaque e-mail contient un lien « Gérer mes préférences » pour accepter ou refuser ; un refus efface ce qui a déjà été enregistré. Le détail par destinataire est effacé au bout de 13 mois.",
    );
    expect(screen.queryByText(/La CNIL exige/)).toBeNull();
    expect(
      screen.getByRole("button", { name: "Gérer les accords" }),
    ).toBeInTheDocument();
  });

  it("décompte pas encore chargé : phrase sans nombre", () => {
    rendreSuivi({
      campaign: campagne({ trackClicks: true }),
      audienceCount: null,
    });
    expect(encadre()).toMatch(
      /^Le suivi ne s'applique qu'aux contacts qui l'ont accepté\. Les autres reçoivent/,
    );
  });

  it("lien de confidentialité contrôlé puis enregistré en quittant le champ", async () => {
    const onSave = vi.fn(async () => true);
    rendreSuivi({ campaign: campagne({ trackOpens: true }), onSave });
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

  it("campagne partie : réglages en lecture seule, accords toujours consultables", () => {
    rendreSuivi({ campaign: campagne({ status: "SENT", trackOpens: true }) });
    expect(
      screen.getByRole("switch", { name: "Suivre les ouvertures" }),
    ).toBeDisabled();
    expect(
      screen.getByLabelText("Lien vers votre politique de confidentialité"),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Gérer les accords" }),
    ).toBeEnabled();
  });
});

describe("pied de l'e-mail dans l'éditeur", () => {
  it("campagne suivie : phrase avec l'accord, confidentialité, préférences et désinscription", () => {
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
        /^Atelier Durand mesure l'ouverture de cet e-mail, avec votre accord\.$/,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/répondez à cet e-mail/)).toBeNull();
    expect(
      screen.getByText("Politique de confidentialité"),
    ).toBeInTheDocument();
    // Dernière ligne, comme l'API : « Gérer mes préférences · Se désinscrire »
    const preferences = screen.getByText("Gérer mes préférences");
    expect(preferences.parentElement.textContent).toBe(
      "Gérer mes préférences · Se désinscrire",
    );
    expect(screen.getByText("Se désinscrire")).toBeInTheDocument();
  });

  it("clics seulement : phrase adaptée, préférences proposées", () => {
    render(
      <EmailFooterView
        companyName="Atelier Durand"
        trackingNotice={{ opens: false, clicks: true }}
      />,
    );
    expect(
      screen.getByText(
        "Atelier Durand mesure les clics sur les liens de cet e-mail, avec votre accord.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Politique de confidentialité")).toBeNull();
    expect(screen.getByText("Gérer mes préférences")).toBeInTheDocument();
  });

  it("sans suivi : ni phrase ni préférences, désinscription seule", () => {
    render(<EmailFooterView companyName="Atelier Durand" />);
    expect(screen.queryByText(/mesure/)).toBeNull();
    expect(screen.queryByText(/Gérer mes préférences/)).toBeNull();
    expect(screen.getByText("Se désinscrire")).toBeInTheDocument();
  });
});

const destinataire = (overrides = {}) => ({
  __typename: "EmailCampaignRecipient",
  id: "r1",
  email: "lea@exemple.fr",
  name: "Léa Martin",
  clientId: "k1",
  status: "DELIVERED",
  sentAt: "2026-11-25T09:00:00.000Z",
  deliveredAt: "2026-11-25T09:01:00.000Z",
  openedAt: null,
  clickedAt: null,
  bouncedAt: null,
  complainedAt: null,
  unsubscribedAt: null,
  openCount: 0,
  clickCount: 0,
  tracked: true,
  error: null,
  ...overrides,
});

const rapportMocks = (recipients) => [
  {
    request: {
      query: GET_EMAIL_CAMPAIGN_LINK_STATS,
      variables: { workspaceId: "w1", campaignId: "c1" },
    },
    result: { data: { emailCampaignLinkStats: [] } },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
  {
    request: {
      query: GET_EMAIL_CAMPAIGN_RECIPIENTS,
      variables: {
        workspaceId: "w1",
        campaignId: "c1",
        filter: "ALL",
        search: null,
        page: 1,
        limit: 50,
      },
    },
    result: {
      data: {
        emailCampaignRecipients: {
          __typename: "EmailCampaignRecipientPage",
          items: recipients,
          total: recipients.length,
          page: 1,
          limit: 50,
        },
      },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
];

// 100 partis, 5 rejetés : 95 remis
const STATS_ENVOYEE = {
  ...STATS,
  recipients: 100,
  sent: 100,
  delivered: 95,
  bounced: 5,
  opened: 12,
  opens: 15,
  clicked: 4,
  clicks: 5,
};

function ouvrirRapport(overrides, recipients = []) {
  render(
    <MockedProvider mocks={rapportMocks(recipients)}>
      <CampaignReport
        workspaceId="w1"
        settings={{}}
        campaign={campagne({
          status: "SENT",
          trackOpens: true,
          trackClicks: true,
          startedAt: "2026-11-25T09:00:00.000Z",
          completedAt: "2026-11-25T09:30:00.000Z",
          stats: STATS_ENVOYEE,
          ...overrides,
        })}
      />
    </MockedProvider>,
  );
}

const tuile = (label) => screen.getByText(label).closest("div");

describe("rapport : ouvertures et clics des contacts suivis", () => {
  it("lancée avec les accords : taux sur les contacts suivis, « Non suivi » pour les autres", async () => {
    ouvrirRapport({ trackedRecipients: 40 }, [
      destinataire({
        openCount: 2,
        clickCount: 1,
        openedAt: "2026-11-25T10:00:00.000Z",
        clickedAt: "2026-11-25T10:05:00.000Z",
      }),
      destinataire({
        id: "r2",
        email: "paul@exemple.fr",
        name: "Paul Petit",
        tracked: false,
      }),
    ]);
    // 12 ouvreurs sur 40 contacts suivis, 4 cliqueurs sur 40
    const ouvertures = tuile("Ouvertures uniques");
    expect(within(ouvertures).getByText(/^30\s%$/)).toBeInTheDocument();
    expect(
      within(ouvertures).getByText(
        /^12 sur 40\scontacts suivis · 15\souvertures$/,
      ),
    ).toBeInTheDocument();
    const clics = tuile("Clics uniques");
    expect(within(clics).getByText(/^10\s%$/)).toBeInTheDocument();
    expect(
      within(clics).getByText(/^4 sur 40\scontacts suivis · 5\sclics$/),
    ).toBeInTheDocument();

    const paul = (await screen.findByText("paul@exemple.fr")).closest("tr");
    expect(within(paul).getAllByText("Non suivi")).toHaveLength(2);
    const lea = screen.getByText("lea@exemple.fr").closest("tr");
    expect(within(lea).queryByText("Non suivi")).toBeNull();
    expect(within(lea).getByText("2")).toBeInTheDocument();
  });

  it("aucun contact suivi au lancement : rien n'a été mesuré", () => {
    ouvrirRapport({ trackedRecipients: 0 });
    const ouvertures = tuile("Ouvertures uniques");
    expect(within(ouvertures).getByText("Non suivies")).toBeInTheDocument();
    expect(
      within(ouvertures).getByText("Aucun contact suivi"),
    ).toBeInTheDocument();
    const clics = tuile("Clics uniques");
    expect(within(clics).getByText("Non suivis")).toBeInTheDocument();
    expect(within(clics).getByText("Aucun contact suivi")).toBeInTheDocument();
  });

  it("lancée avant les accords (trackedRecipients null) : taux sur les e-mails remis", () => {
    ouvrirRapport({ trackedRecipients: null });
    const ouvertures = tuile("Ouvertures uniques");
    // 12 sur 95 remis
    expect(within(ouvertures).getByText(/^12,6\s%$/)).toBeInTheDocument();
    expect(
      within(ouvertures).getByText(/^12\scontacts · 15\souvertures$/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/contacts suivis/)).toBeNull();
  });
});
