import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

// Objets hissés et STABLES d'un rendu à l'autre (comme le cache Apollo)
const social = vi.hoisted(() => ({ value: null }));
const mutations = vi.hoisted(() => ({
  upload: vi.fn(),
  uploadVideo: vi.fn(),
  schedule: vi.fn(),
  update: vi.fn(),
}));

vi.mock(
  "@/app/dashboard/outils/kanban/[id]/components/social/SocialPostsProvider",
  () => ({ useSocialPublishing: () => social.value }),
);
vi.mock("@/src/hooks/useSocialPublishing", async (importOriginal) => ({
  ...(await importOriginal()),
  useConnectSocialAccount: () => ({ connect: vi.fn(), connecting: null }),
}));
vi.mock("@/src/components/ui/sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { SocialPostModal } from "@/app/dashboard/outils/kanban/[id]/components/social/SocialPostModal";

const caps = (overrides = {}) => ({
  stories: false,
  sounds: false,
  drafts: false,
  draftsNeedReconnect: false,
  ...overrides,
});
const INSTAGRAM = {
  id: "a-ig",
  platform: "instagram",
  username: "boulangerie.martin",
  status: "active",
  connector: null,
  capabilities: caps({ stories: true }),
};
const FACEBOOK = {
  id: "a-fb",
  platform: "facebook",
  displayName: "Boulangerie Martin",
  status: "active",
  connector: null,
  capabilities: caps({ stories: true }),
};

function setAccounts(accounts) {
  social.value = {
    boardId: "b1",
    workspaceId: "w1",
    columns: [{ id: "c1", title: "Idées" }],
    mutations,
    status: {
      enabled: true,
      canManageAccounts: true,
      canSchedule: true,
      platforms: [...new Set(accounts.map((a) => a.platform))],
      xPostQuota: null,
      accounts,
    },
  };
}

const formatGroup = (label) =>
  screen.getByRole("radiogroup", { name: `Format ${label}` });
const chooseStory = (label) =>
  fireEvent.click(
    within(formatGroup(label)).getByRole("radio", { name: "Story" }),
  );

async function addPhotos(sizes) {
  sizes.forEach(([width, height], index) => {
    mutations.upload.mockResolvedValueOnce({
      id: `m${index + 1}`,
      url: `https://api.newbi.fr/social-media/m${index + 1}.jpg`,
      width,
      height,
    });
  });
  const files = sizes.map(
    (_, index) =>
      new File([new Uint8Array(8)], `photo-${index + 1}.jpg`, {
        type: "image/jpeg",
      }),
  );
  await act(async () => {
    fireEvent.change(screen.getByTestId("social-post-photo-input"), {
      target: { files },
    });
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mutations.schedule.mockResolvedValue({
    post: { id: "p1", status: "scheduled", scheduledFor: null },
  });
  if (!URL.createObjectURL) URL.createObjectURL = () => "blob:local";
  setAccounts([INSTAGRAM, FACEBOOK]);
});

describe("fenêtre de programmation : stories", () => {
  it("choix Publication / Story pour Instagram et Facebook seulement", () => {
    render(<SocialPostModal open onClose={vi.fn()} post={null} />);
    // Aucun réseau choisi : pas de section Format
    expect(screen.queryByText("Format")).toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: /boulangerie\.martin/ }),
    );
    expect(screen.getByText("Format")).toBeTruthy();
    const instagram = formatGroup("Instagram");
    expect(
      within(instagram)
        .getByRole("radio", { name: "Publication" })
        .getAttribute("aria-checked"),
    ).toBe("true");
    expect(
      screen.queryByRole("radiogroup", { name: "Format Facebook" }),
    ).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Boulangerie Martin/ }));
    expect(formatGroup("Facebook")).toBeTruthy();
  });

  it("en story : conseils, compteur du réseau masqué, réglages envoyés", async () => {
    render(<SocialPostModal open onClose={vi.fn()} post={null} />);
    fireEvent.click(
      screen.getByRole("button", { name: /boulangerie\.martin/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Boulangerie Martin/ }));
    fireEvent.change(screen.getByLabelText("Texte"), {
      target: { value: "Nouveautés" },
    });
    expect(screen.getByText("10 / 2200 (Instagram)")).toBeTruthy();

    chooseStory("Instagram");
    // Instagram en story : seul Facebook compte le texte
    expect(screen.getByText("10 / 63206 (Facebook)")).toBeTruthy();
    expect(
      screen.getByText("Le texte n'apparaît pas dans une story."),
    ).toBeTruthy();
    // Une story exige un média (affiché dès le choix)
    expect(
      screen.getAllByText("Une story Instagram exige une photo ou une vidéo.")
        .length,
    ).toBeGreaterThan(0);

    chooseStory("Facebook");
    expect(screen.queryByText(/\/ 63206/)).toBeNull();

    // Deux photos, dont une carrée : plusieurs stories, 9:16 conseillé
    await addPhotos([
      [1080, 1920],
      [1080, 1080],
    ]);
    expect(
      screen.getByText(
        "Plusieurs photos donnent plusieurs stories à la suite.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Format vertical 9:16 conseillé.")).toBeTruthy();
    // Le format carré n'est pas une erreur en story
    expect(screen.queryByText(/trop allongée/)).toBeNull();
    expect(
      screen.getByText("Instagram (story) et Facebook (story)"),
    ).toBeTruthy();

    await act(async () =>
      fireEvent.click(
        screen.getByRole("button", { name: /Programmer le post/ }),
      ),
    );
    expect(mutations.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        accountIds: ["a-ig", "a-fb"],
        mediaIds: ["m1", "m2"],
        instagramSettings: { format: "story", sound: null },
        facebookSettings: { format: "story" },
      }),
    );
  });

  it("publication par défaut : format « post » envoyé pour les réseaux visés", async () => {
    setAccounts([FACEBOOK]);
    render(<SocialPostModal open onClose={vi.fn()} post={null} />);
    fireEvent.change(screen.getByLabelText("Texte"), {
      target: { value: "Bonjour" },
    });
    await act(async () =>
      fireEvent.click(
        screen.getByRole("button", { name: /Programmer le post/ }),
      ),
    );
    const input = mutations.schedule.mock.calls[0][0];
    expect(input.facebookSettings).toEqual({ format: "post" });
    expect(input).not.toHaveProperty("instagramSettings");
  });

  it("comptes sans story (Zernio) : choix grisé et expliqué", () => {
    setAccounts([{ ...INSTAGRAM, capabilities: caps() }]);
    render(<SocialPostModal open onClose={vi.fn()} post={null} />);
    const story = within(formatGroup("Instagram")).getByRole("radio", {
      name: "Story",
    });
    expect(story.disabled).toBe(true);
    expect(
      screen.getByText(
        "Les stories ne sont disponibles que pour les comptes connectés directement.",
      ),
    ).toBeTruthy();
  });

  it("modification d'une story : format repris du post", () => {
    const post = {
      id: "p1",
      taskId: "t1",
      content: "",
      scheduledFor: "2030-01-15T09:00:00.000Z",
      media: [
        {
          id: "m1",
          kind: "image",
          status: "ready",
          url: "https://api.newbi.fr/social-media/m1.jpg",
          width: 1080,
          height: 1920,
        },
      ],
      targets: [
        { accountId: "a-ig", platform: "instagram", status: "pending" },
      ],
      instagramSettings: { format: "story", sound: null },
      tiktokSettings: null,
    };
    render(<SocialPostModal open onClose={vi.fn()} post={post} />);
    expect(
      within(formatGroup("Instagram"))
        .getByRole("radio", { name: "Story" })
        .getAttribute("aria-checked"),
    ).toBe("true");
  });
});
