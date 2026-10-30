import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Objets hissés et stables d'un rendu à l'autre (comme le cache Apollo)
const state = vi.hoisted(() => ({
  post: null,
  social: {
    enabled: true,
    canEdit: true,
    isReadOnly: false,
    mutations: {},
    openComposer: () => {},
  },
}));

vi.mock(
  "@/app/dashboard/outils/kanban/[id]/components/social/SocialPostsProvider",
  () => ({
    useSocialPublishing: () => state.social,
    useTaskSocialPost: () => state.post,
  }),
);
vi.mock("@/src/components/ui/sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { SocialPostSection } from "@/app/dashboard/outils/kanban/[id]/components/social/SocialPostSection";
import { SocialPostBadge } from "@/app/dashboard/outils/kanban/[id]/components/social/SocialPostBadge";

const PUBLISHED_POST = {
  id: "p1",
  taskId: "t1",
  content: "Nouveautés",
  status: "published",
  scheduledFor: "2026-10-30T09:00:00.000Z",
  media: [],
  targets: [
    {
      accountId: "a-ig",
      platform: "instagram",
      username: "atelier.nord",
      status: "published",
      platformPostUrl: "https://www.instagram.com/stories/atelier.nord/1",
      deliveredAs: null,
      storyCount: 3,
    },
    {
      accountId: "a-fb",
      platform: "facebook",
      displayName: "Atelier Nord",
      status: "published",
      platformPostUrl: null,
      deliveredAs: null,
      storyCount: 0,
    },
    {
      accountId: "a-tt",
      platform: "tiktok",
      username: "studionord",
      status: "published",
      platformPostUrl: null,
      deliveredAs: "draft",
      storyCount: 0,
    },
  ],
  instagramSettings: { format: "story", sound: null },
  facebookSettings: { format: "post" },
  tiktokSettings: {
    mode: "direct",
    sound: {
      id: "s1",
      title: "Espresso",
      artist: "Sabrina Carpenter",
      coverUrl: null,
      volume: 80,
      videoVolume: 50,
    },
  },
};

beforeEach(() => {
  state.post = PUBLISHED_POST;
});

describe("post avec stories, son et brouillon TikTok : tâche et carte", () => {
  it("cible en brouillon, nombre de stories publiées, son choisi", () => {
    render(<SocialPostSection taskId="t1" />);
    expect(screen.getByText("Envoyé en brouillon TikTok")).toBeTruthy();
    expect(screen.getByText("3 stories")).toBeTruthy();
    // Facebook en publication : pas de mention
    expect(screen.queryByText("Story")).toBeNull();
    expect(screen.getAllByText("Publié")).toHaveLength(3);
    expect(screen.getByText(/Son TikTok/).textContent).toBe(
      "Son TikTok : Espresso · Sabrina Carpenter",
    );
    // Lien seulement pour la story Instagram (un brouillon n'en a pas)
    expect(screen.getAllByRole("link", { name: /Voir le post/ })).toHaveLength(
      1,
    );
  });

  it("story programmée : mention « Story »", () => {
    state.post = {
      ...PUBLISHED_POST,
      status: "scheduled",
      scheduledFor: "2030-01-15T09:00:00.000Z",
      targets: [
        {
          accountId: "a-ig",
          platform: "instagram",
          username: "atelier.nord",
          status: "pending",
          storyCount: 0,
        },
      ],
    };
    render(<SocialPostSection taskId="t1" />);
    expect(screen.getByText("Story")).toBeTruthy();
    // Son TikTok gardé mais TikTok non visé : pas affiché
    expect(screen.queryByText(/Son TikTok/)).toBeNull();
  });

  it("badge : réseaux en story et post envoyé seulement en brouillon", () => {
    const { unmount } = render(<SocialPostBadge taskId="t1" />);
    expect(
      screen.getByLabelText(
        "Post Instagram (story), Facebook et TikTok : publié",
      ),
    ).toBeTruthy();
    unmount();

    state.post = {
      ...PUBLISHED_POST,
      targets: [PUBLISHED_POST.targets[2]],
    };
    render(<SocialPostBadge taskId="t1" />);
    expect(screen.getByText("Envoyé en brouillon TikTok")).toBeTruthy();
    expect(
      screen.getByLabelText("Post TikTok : envoyé en brouillon TikTok"),
    ).toBeTruthy();
  });
});
