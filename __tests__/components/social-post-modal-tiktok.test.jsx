import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const social = vi.hoisted(() => ({ value: null }));
const creatorInfo = vi.hoisted(() => ({
  info: {
    nickname: "Studio Nord",
    username: "studionord",
    canPostMore: true,
    commentDisabled: false,
    privacyLevels: [
      { value: "PUBLIC_TO_EVERYONE", label: "Tout le monde" },
      { value: "SELF_ONLY", label: "Moi uniquement" },
    ],
  },
  loading: false,
  error: null,
  refetch: () => {},
}));

vi.mock(
  "@/app/dashboard/outils/kanban/[id]/components/social/SocialPostsProvider",
  () => ({ useSocialPublishing: () => social.value }),
);
vi.mock("@/src/hooks/useSocialPublishing", async (importOriginal) => ({
  ...(await importOriginal()),
  useConnectSocialAccount: () => ({
    connect: vi.fn(),
    connecting: null,
  }),
  // Même objet à chaque rendu, comme le cache Apollo
  useTikTokCreatorInfo: () => creatorInfo,
}));
vi.mock("@/src/components/ui/sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { SocialPostModal } from "@/app/dashboard/outils/kanban/[id]/components/social/SocialPostModal";

beforeEach(() => {
  social.value = {
    boardId: "b1",
    workspaceId: "w1",
    columns: [{ id: "c1", title: "Idées" }],
    mutations: {},
    status: {
      enabled: true,
      canManageAccounts: true,
      canSchedule: true,
      platforms: ["tiktok"],
      xPostQuota: null,
      accounts: [
        {
          id: "a-tt",
          platform: "tiktok",
          username: "studionord",
          displayName: "Studio Nord",
          status: "active",
        },
      ],
    },
  };
});

describe("fenêtre de programmation : écran TikTok", () => {
  it("affiche le compte, la confidentialité à choisir et la déclaration", () => {
    render(<SocialPostModal open onClose={vi.fn()} post={null} />);

    expect(screen.getByText("Options TikTok")).toBeTruthy();
    expect(
      screen.getByText(/Publication sur le compte TikTok/).textContent,
    ).toContain("Studio Nord (@studionord)");
    expect(screen.getByText("Qui peut voir ce post")).toBeTruthy();
    // Aucune visibilité choisie d'office
    expect(screen.getByText("Choisir")).toBeTruthy();
    expect(screen.getByText(/En publiant, vous acceptez/)).toBeTruthy();
  });

  it("divulgation commerciale : options et étiquette", () => {
    render(<SocialPostModal open onClose={vi.fn()} post={null} />);

    fireEvent.click(
      screen.getByRole("switch", { name: /Divulguer le contenu commercial/ }),
    );
    expect(screen.getByText("Votre marque")).toBeTruthy();
    expect(screen.getByText("Contenu de marque")).toBeTruthy();

    fireEvent.click(screen.getByRole("checkbox", { name: /Votre marque/ }));
    expect(screen.getByText(/Contenu promotionnel/)).toBeTruthy();
  });
});
