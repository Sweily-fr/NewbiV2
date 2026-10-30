import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { GraphQLError } from "graphql";
import { GET_SOCIAL_TRENDING_SOUNDS } from "@/src/graphql/socialPublishingQueries";

// Objets hissés et STABLES d'un rendu à l'autre (comme le cache Apollo)
const social = vi.hoisted(() => ({ value: null }));
const upload = vi.hoisted(() => ({ handlers: null }));
const mutations = vi.hoisted(() => ({
  upload: vi.fn(),
  uploadVideo: vi.fn(),
  schedule: vi.fn(),
  update: vi.fn(),
}));
const creator = vi.hoisted(() => ({
  info: {
    nickname: "Studio Nord",
    username: "studionord",
    canPostMore: true,
    commentDisabled: false,
    duetDisabled: false,
    stitchDisabled: false,
    maxVideoPostDurationSec: 600,
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
// Les sons passent par la vraie requête (MockedProvider) ; le reste est simulé
vi.mock("@/src/hooks/useSocialPublishing", async (importOriginal) => ({
  ...(await importOriginal()),
  useConnectSocialAccount: () => ({ connect: vi.fn(), connecting: null }),
  useTikTokCreatorInfo: () => creator,
}));
vi.mock("@/src/utils/social-video-upload", async (importOriginal) => ({
  ...(await importOriginal()),
  readVideoMetadata: () =>
    Promise.resolve({ durationMs: 30_000, width: 1080, height: 1920 }),
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
const ACCOUNTS = {
  igFacebook: {
    id: "a-igfb",
    platform: "instagram",
    username: "atelier.nord",
    status: "active",
    connector: "facebook",
    capabilities: caps({ stories: true, sounds: true }),
  },
  igLogin: {
    id: "a-ig",
    platform: "instagram",
    username: "atelier.sud",
    status: "active",
    connector: null,
    capabilities: caps({ stories: true }),
  },
  tiktokBusiness: {
    id: "a-ttb",
    platform: "tiktok",
    username: "studionord",
    displayName: "Studio Nord",
    status: "active",
    connector: "business",
    capabilities: caps({ sounds: true, drafts: true }),
  },
};

const READY_VIDEO = {
  id: "m1",
  kind: "video",
  status: "ready",
  url: "https://api.newbi.fr/social-media/m1.mp4",
  thumbnailUrl: "https://api.newbi.fr/social-media/m1.jpg",
  width: 1080,
  height: 1920,
  durationMs: 30_000,
  size: 10 * 1000 * 1000,
  contentType: "video/mp4",
};

const sound = (id, title, artist, extra = {}) => ({
  __typename: "SocialSound",
  id,
  title,
  artist,
  coverUrl: `https://scontent.cdninstagram.com/${id}.jpg`,
  previewUrl: `https://scontent.fbcdn.net/${id}.m4a`,
  durationMs: 95_000,
  rank: null,
  kind: "music",
  ...extra,
});

const soundsMock = (variables, sounds) => ({
  request: { query: GET_SOCIAL_TRENDING_SOUNDS, variables },
  result: { data: { socialTrendingSounds: sounds } },
});

const INSTAGRAM_TRENDS = soundsMock(
  { accountId: "a-igfb", kind: "music", workspaceId: "w1" },
  [
    sound("ig-1", "Midnight City", "M83"),
    // Sans extrait : pas de bouton d'écoute
    sound("ig-2", "Golden Hour", "JVKE", { previewUrl: null }),
  ],
);
const INSTAGRAM_SEARCH = soundsMock(
  { accountId: "a-igfb", search: "daft", kind: "music", workspaceId: "w1" },
  [sound("ig-3", "One More Time", "Daft Punk")],
);

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

function renderModal(mocks) {
  return render(
    <MockedProvider mocks={mocks}>
      <SocialPostModal open onClose={vi.fn()} post={null} />
    </MockedProvider>,
  );
}

async function addReadyVideo() {
  fireEvent.change(screen.getByTestId("social-post-video-input"), {
    target: {
      files: [
        new File([new Uint8Array(64)], "atelier.mp4", { type: "video/mp4" }),
      ],
    },
  });
  await screen.findByText("Envoi 0 %");
  await act(async () => upload.handlers.resolve(READY_VIDEO));
}

const submit = () =>
  act(async () =>
    fireEvent.click(screen.getByRole("button", { name: /Programmer le post/ })),
  );

const originalPlay = window.HTMLMediaElement.prototype.play;
const originalPause = window.HTMLMediaElement.prototype.pause;

beforeEach(() => {
  vi.clearAllMocks();
  upload.handlers = null;
  mutations.uploadVideo.mockImplementation(
    (file, { onProgress, onMedia }) =>
      new Promise((resolve, reject) => {
        upload.handlers = { resolve, reject };
        onMedia({ id: "m1", kind: "video", status: "uploading" });
        onProgress(0);
      }),
  );
  mutations.schedule.mockResolvedValue({
    post: { id: "p1", status: "scheduled", scheduledFor: null },
  });
  if (!URL.createObjectURL) URL.createObjectURL = () => "blob:local";
  window.HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
  window.HTMLMediaElement.prototype.pause = vi.fn();
});

afterEach(() => {
  window.HTMLMediaElement.prototype.play = originalPlay;
  window.HTMLMediaElement.prototype.pause = originalPause;
});

describe("fenêtre de programmation : son tendance Instagram", () => {
  it("section Son pour un Reel d'un compte connecté via Facebook seulement", async () => {
    setAccounts([ACCOUNTS.igLogin]);
    renderModal([]);
    await addReadyVideo();
    // Instagram Login : pas de son possible
    expect(screen.queryByText("Choisir un son")).toBeNull();
  });

  it("tendances, recherche, choix, volumes puis envoi", async () => {
    setAccounts([ACCOUNTS.igFacebook, ACCOUNTS.igLogin]);
    renderModal([INSTAGRAM_TRENDS, INSTAGRAM_SEARCH]);
    fireEvent.click(screen.getByRole("button", { name: /atelier\.nord/ }));
    fireEvent.click(screen.getByRole("button", { name: /atelier\.sud/ }));
    // Mention du mode de connexion sur le compte
    expect(screen.getByText("via Facebook")).toBeTruthy();
    // Photos ou rien : pas encore de son
    expect(screen.queryByText("Choisir un son")).toBeNull();

    await addReadyVideo();
    expect(screen.getByText("Son tendance Instagram")).toBeTruthy();
    // Un des deux comptes publiera sans son
    expect(
      screen.getByText(
        "Le son sera ajouté uniquement aux comptes connectés via Facebook.",
      ),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Choisir un son" }));
    const dialog = await screen.findByRole("dialog", {
      name: "Choisir un son Instagram",
    });
    expect(await within(dialog).findByText("Midnight City")).toBeTruthy();
    expect(within(dialog).getByText("M83")).toBeTruthy();
    expect(within(dialog).getAllByText("1 min 35")).toHaveLength(2);
    // Extrait à écouter seulement quand le réseau en donne un
    expect(
      within(dialog).getByRole("button", {
        name: "Écouter un extrait de « Midnight City »",
      }),
    ).toBeTruthy();
    expect(
      within(dialog).queryByRole("button", {
        name: "Écouter un extrait de « Golden Hour »",
      }),
    ).toBeNull();
    expect(within(dialog).getByRole("radio", { name: "Musique" })).toBeTruthy();
    expect(
      within(dialog).getByRole("radio", { name: "Sons originaux" }),
    ).toBeTruthy();

    // Recherche (délai de 300 ms)
    fireEvent.change(within(dialog).getByLabelText("Rechercher un son"), {
      target: { value: "daft" },
    });
    expect(await within(dialog).findByText("One More Time")).toBeTruthy();
    fireEvent.click(
      within(dialog).getByRole("button", {
        name: "Choisir « One More Time » de Daft Punk",
      }),
    );

    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Choisir un son Instagram" }),
      ).toBeNull(),
    );
    expect(screen.getByText("One More Time")).toBeTruthy();
    expect(screen.getByText("Daft Punk")).toBeTruthy();
    expect(
      screen
        .getByRole("slider", { name: "Volume de la musique" })
        .getAttribute("aria-valuenow"),
    ).toBe("80");
    expect(
      screen
        .getByRole("slider", { name: "Son de la vidéo" })
        .getAttribute("aria-valuenow"),
    ).toBe("50");
    expect(
      screen.getByText(
        "Instagram n'affiche pas d'aperçu du Reel avec le son : il est ajouté à la publication.",
      ),
    ).toBeTruthy();

    // Volume de la musique baissé au clavier
    const music = screen.getByRole("slider", { name: "Volume de la musique" });
    fireEvent.keyDown(music, { key: "ArrowLeft" });
    expect(music.getAttribute("aria-valuenow")).toBe("79");

    await submit();
    expect(mutations.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        instagramSettings: {
          format: "post",
          sound: {
            id: "ig-3",
            title: "One More Time",
            artist: "Daft Punk",
            coverUrl: "https://scontent.cdninstagram.com/ig-3.jpg",
            volume: 79,
            videoVolume: 50,
          },
        },
      }),
    );
  });

  it("son retiré au passage en story", async () => {
    setAccounts([ACCOUNTS.igFacebook]);
    renderModal([INSTAGRAM_TRENDS]);
    await addReadyVideo();
    fireEvent.click(screen.getByRole("button", { name: "Choisir un son" }));
    const dialog = await screen.findByRole("dialog", {
      name: "Choisir un son Instagram",
    });
    fireEvent.click(
      await within(dialog).findByRole("button", {
        name: "Choisir « Midnight City » de M83",
      }),
    );
    await screen.findByRole("button", { name: "Retirer" });

    fireEvent.click(
      within(
        screen.getByRole("radiogroup", { name: "Format Instagram" }),
      ).getByRole("radio", { name: "Story" }),
    );
    expect(screen.queryByText("Midnight City")).toBeNull();
    // Retour en publication : le son ne revient pas
    fireEvent.click(
      within(
        screen.getByRole("radiogroup", { name: "Format Instagram" }),
      ).getByRole("radio", { name: "Publication" }),
    );
    expect(screen.queryByText("Midnight City")).toBeNull();
    expect(screen.getByRole("button", { name: "Choisir un son" })).toBeTruthy();

    await submit();
    expect(mutations.schedule.mock.calls[0][0].instagramSettings).toEqual({
      format: "post",
      sound: null,
    });
  });

  it("écoute d'un extrait : un seul à la fois, bouton retiré si illisible", async () => {
    setAccounts([ACCOUNTS.igFacebook]);
    renderModal([INSTAGRAM_TRENDS]);
    await addReadyVideo();
    fireEvent.click(screen.getByRole("button", { name: "Choisir un son" }));
    const dialog = await screen.findByRole("dialog", {
      name: "Choisir un son Instagram",
    });
    const play = await within(dialog).findByRole("button", {
      name: "Écouter un extrait de « Midnight City »",
    });
    await act(async () => fireEvent.click(play));
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
    const stop = within(dialog).getByRole("button", {
      name: "Arrêter l'extrait",
    });
    expect(stop.getAttribute("aria-pressed")).toBe("true");

    // Lecture en échec (adresse expirée) : plus de bouton, pas d'erreur
    act(() => {
      fireEvent.error(dialog.querySelector("audio"));
    });
    expect(
      within(dialog).queryByRole("button", { name: /extrait/ }),
    ).toBeNull();
    expect(within(dialog).getByText("Midnight City")).toBeTruthy();
  });

  it("erreur de chargement : message et nouvel essai", async () => {
    setAccounts([ACCOUNTS.igFacebook]);
    renderModal([
      {
        request: {
          query: GET_SOCIAL_TRENDING_SOUNDS,
          variables: { accountId: "a-igfb", kind: "music", workspaceId: "w1" },
        },
        result: {
          errors: [
            new GraphQLError(
              "Reconnectez ce compte Instagram pour charger les sons.",
            ),
          ],
        },
      },
    ]);
    await addReadyVideo();
    fireEvent.click(screen.getByRole("button", { name: "Choisir un son" }));
    const dialog = await screen.findByRole("dialog", {
      name: "Choisir un son Instagram",
    });
    expect(
      await within(dialog).findByText(
        "Reconnectez ce compte Instagram pour charger les sons.",
      ),
    ).toBeTruthy();
    expect(
      within(dialog).getByRole("button", { name: "Réessayer" }),
    ).toBeTruthy();
  });
});

describe("fenêtre de programmation : son tendance TikTok Business", () => {
  it("photos : son sans volume de la vidéo, envoyé avec les réglages TikTok", async () => {
    setAccounts([ACCOUNTS.tiktokBusiness]);
    renderModal([
      soundsMock({ accountId: "a-ttb", workspaceId: "w1" }, [
        sound("7300000000000000001", "Espresso", "Sabrina Carpenter", {
          rank: 1,
          kind: null,
          coverUrl: "https://p16-sign.tiktokcdn.com/espresso.jpg",
          previewUrl: "https://sf16.ibyteimg.com/espresso.mp3",
        }),
      ]),
    ]);
    expect(screen.getByText("Business")).toBeTruthy();
    mutations.upload.mockResolvedValueOnce({
      id: "m1",
      url: "https://api.newbi.fr/social-media/m1.jpg",
      width: 1080,
      height: 1920,
    });
    await act(async () => {
      fireEvent.change(screen.getByTestId("social-post-photo-input"), {
        target: {
          files: [
            new File([new Uint8Array(8)], "vitrine.jpg", {
              type: "image/jpeg",
            }),
          ],
        },
      });
    });

    expect(screen.getByText("Son tendance TikTok")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Choisir un son" }));
    const dialog = await screen.findByRole("dialog", {
      name: "Choisir un son TikTok",
    });
    // Pas de recherche pour TikTok (tendances seulement)
    expect(within(dialog).queryByLabelText("Rechercher un son")).toBeNull();
    fireEvent.click(
      await within(dialog).findByRole("button", {
        name: "Choisir « Espresso » de Sabrina Carpenter",
      }),
    );
    await screen.findByRole("button", { name: "Retirer" });
    expect(
      screen.getByRole("slider", { name: "Volume de la musique" }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("slider", { name: "Son de la vidéo" }),
    ).toBeNull();

    // Confidentialité choisie (photos : libre)
    fireEvent.click(
      screen.getByRole("combobox", { name: "Qui peut voir ce post" }),
    );
    fireEvent.click(
      await screen.findByRole("option", { name: "Tout le monde" }),
    );

    await submit();
    expect(mutations.schedule.mock.calls[0][0].tiktokSettings).toEqual(
      expect.objectContaining({
        mode: "direct",
        privacyLevel: "PUBLIC_TO_EVERYONE",
        consentGiven: true,
        sound: {
          id: "7300000000000000001",
          title: "Espresso",
          artist: "Sabrina Carpenter",
          coverUrl: "https://p16-sign.tiktokcdn.com/espresso.jpg",
          volume: 80,
          videoVolume: 50,
        },
      }),
    );
  });
});
