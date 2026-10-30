import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { GET_SOCIAL_PUBLISHING_STATUS } from "@/src/graphql/socialPublishingQueries";

const connect = vi.hoisted(() => vi.fn());

// État réel (requête simulée au format du contrat) ; connexion simulée
vi.mock("@/src/hooks/useSocialPublishing", async (importOriginal) => ({
  ...(await importOriginal()),
  useConnectSocialAccount: () => ({ connect, connecting: null }),
}));
vi.mock("@/src/components/ui/sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { SocialAccountsPanel } from "@/src/components/settings/social-accounts-panel";

const caps = (overrides = {}) => ({
  __typename: "SocialAccountCapabilities",
  stories: false,
  sounds: false,
  drafts: false,
  draftsNeedReconnect: false,
  ...overrides,
});
const account = (fields) => ({
  __typename: "SocialAccount",
  displayName: null,
  avatarUrl: null,
  status: "active",
  connectedAt: "2026-10-30T08:00:00.000Z",
  connector: null,
  capabilities: caps(),
  ...fields,
});
const connector = (key, platform, label, description = null) => ({
  __typename: "SocialConnector",
  key,
  platform,
  label,
  description,
});

const STATUS_MOCK = {
  request: {
    query: GET_SOCIAL_PUBLISHING_STATUS,
    variables: { workspaceId: "w1" },
  },
  result: {
    data: {
      socialPublishingStatus: {
        __typename: "SocialPublishingStatus",
        enabled: true,
        platforms: ["instagram", "linkedin", "tiktok"],
        canManageAccounts: true,
        canSchedule: true,
        accounts: [
          account({
            id: "a-igfb",
            platform: "instagram",
            username: "atelier.nord",
            connector: "facebook",
            capabilities: caps({ stories: true, sounds: true }),
          }),
          account({
            id: "a-ttb",
            platform: "tiktok",
            username: "studionord",
            status: "needs_reconnect",
            connector: "business",
          }),
        ],
        connectors: [
          connector("instagram", "instagram", "Instagram"),
          connector(
            "instagram_facebook",
            "instagram",
            "Instagram via Facebook",
            "Permet d'ajouter un son tendance aux Reels",
          ),
          connector("linkedin", "linkedin", "LinkedIn"),
          connector("tiktok", "tiktok", "TikTok"),
          connector(
            "tiktok_business",
            "tiktok",
            "TikTok Business",
            "Permet d'ajouter un son tendance",
          ),
        ],
        xPostQuota: null,
      },
    },
  },
};

function renderPanel() {
  return render(
    <MockedProvider mocks={[STATUS_MOCK]}>
      <SocialAccountsPanel workspaceId="w1" canManage isReadOnly={false} />
    </MockedProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("paramètres : connexion des comptes par connecteur", () => {
  it("deux choix pour Instagram et TikTok, avec leur aide", async () => {
    renderPanel();
    expect(await screen.findByText("Instagram via Facebook")).toBeTruthy();
    expect(
      screen.getByText(
        "Permet d'ajouter un son tendance aux Reels. Le compte doit être relié à une Page Facebook.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("TikTok Business")).toBeTruthy();
    expect(screen.getByText("Permet d'ajouter un son tendance.")).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Ajouter un compte : Instagram via Facebook",
      }),
    );
    expect(connect).toHaveBeenCalledWith(
      "instagram",
      expect.stringContaining("?openSettings=true&settingsTab=applications"),
      expect.objectContaining({ connector: "instagram_facebook" }),
    );
  });

  it("un seul connecteur : bouton comme avant", async () => {
    renderPanel();
    await screen.findByText("Instagram via Facebook");
    fireEvent.click(screen.getByRole("button", { name: "Connecter" }));
    expect(connect).toHaveBeenCalledWith(
      "linkedin",
      expect.any(String),
      expect.objectContaining({ connector: "linkedin" }),
    );
  });

  it("mention du mode de connexion et reconnexion par le même chemin", async () => {
    renderPanel();
    const instagram = (
      await screen.findByText("atelier.nord", { exact: false })
    ).closest("div.rounded-lg");
    expect(within(instagram).getByText("via Facebook")).toBeTruthy();

    const tiktok = screen.getByText("@studionord").closest("div.rounded-lg");
    expect(within(tiktok).getByText("Business")).toBeTruthy();
    fireEvent.click(
      within(tiktok).getByRole("button", { name: /Reconnecter/ }),
    );
    expect(connect).toHaveBeenCalledWith(
      "tiktok",
      expect.any(String),
      expect.objectContaining({ connector: "tiktok_business" }),
    );
  });
});
