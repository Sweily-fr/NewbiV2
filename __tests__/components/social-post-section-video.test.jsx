import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

// Objets hissés et stables d'un rendu à l'autre (comme le cache Apollo)
const state = vi.hoisted(() => {
  const post = {
    id: "p1",
    taskId: "t1",
    content: "Visite de l'atelier",
    status: "scheduled",
    scheduledFor: "2030-01-15T09:00:00.000Z",
    media: [
      {
        id: "m1",
        kind: "video",
        status: "ready",
        url: "https://api.newbi.fr/social-media/m1.mp4",
        thumbnailUrl: "https://api.newbi.fr/social-media/m1.jpg",
        durationMs: 65_000,
      },
    ],
    targets: [
      {
        accountId: "a-fb",
        platform: "facebook",
        displayName: "Boulangerie Martin",
        status: "pending",
      },
    ],
  };
  const social = {
    enabled: true,
    canEdit: true,
    isReadOnly: false,
    mutations: {},
    openComposer: () => {},
  };
  return { post, social };
});

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

describe("post avec vidéo : fenêtre de la tâche et carte", () => {
  it("vignette avec icône de lecture, lecteur au clic", () => {
    render(<SocialPostSection taskId="t1" />);
    const thumbnail = screen.getByRole("button", {
      name: "Lire la vidéo du post",
    });
    expect(thumbnail.querySelector("img").getAttribute("src")).toBe(
      state.post.media[0].thumbnailUrl,
    );
    expect(screen.getByText("1 min 05")).toBeTruthy();

    fireEvent.click(thumbnail);
    const player = screen.getByLabelText("Vidéo du post");
    expect(player.tagName).toBe("VIDEO");
    expect(player.getAttribute("src")).toBe(state.post.media[0].url);
  });

  it("badge de la carte : post vidéo", () => {
    render(<SocialPostBadge taskId="t1" />);
    expect(
      screen.getByLabelText(/^Post vidéo Facebook programmé le/),
    ).toBeTruthy();
  });
});
