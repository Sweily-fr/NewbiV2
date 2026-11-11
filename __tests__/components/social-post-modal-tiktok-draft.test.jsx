import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

// Objets hissés et STABLES d'un rendu à l'autre (comme le cache Apollo)
const social = vi.hoisted(() => ({ value: null }));
const connect = vi.hoisted(() => vi.fn());
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
    // Compte TikTok qui ne propose pas « Tout le monde »
    privacyLevels: [
      { value: "FOLLOWER_OF_CREATOR", label: "Abonnés" },
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
  useConnectSocialAccount: () => ({ connect, connecting: null }),
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
const tiktokAccount = (overrides = {}) => ({
  id: "a-tt",
  platform: "tiktok",
  username: "studionord",
  displayName: "Studio Nord",
  status: "active",
  connector: null,
  capabilities: caps({ drafts: true }),
  ...overrides,
});

function setAccount(account) {
  social.value = {
    boardId: "b1",
    workspaceId: "w1",
    columns: [{ id: "c1", title: "Idées" }],
    mutations,
    status: {
      enabled: true,
      canManageAccounts: true,
      canSchedule: true,
      platforms: ["tiktok"],
      xPostQuota: null,
      accounts: [account],
    },
  };
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
  await act(async () =>
    upload.handlers.resolve({
      id: "m1",
      kind: "video",
      status: "ready",
      url: "https://api.newbi.fr/social-media/m1.mp4",
      width: 1080,
      height: 1920,
      durationMs: 30_000,
      size: 10 * 1000 * 1000,
    }),
  );
}

const modeRadio = (name) => screen.getByRole("radio", { name });
const submit = () =>
  act(async () =>
    fireEvent.click(screen.getByRole("button", { name: /Programmer le post/ })),
  );

beforeEach(() => {
  vi.clearAllMocks();
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
  setAccount(tiktokAccount());
});

describe("fenêtre de programmation : brouillon TikTok", () => {
  it("publication directe par défaut, brouillon au choix", () => {
    render(<SocialPostModal open onClose={vi.fn()} post={null} />);
    expect(modeRadio("Publier directement").getAttribute("aria-checked")).toBe(
      "true",
    );
    expect(screen.getByText("Qui peut voir ce post")).toBeTruthy();
    expect(screen.getByText(/En publiant, vous acceptez/)).toBeTruthy();

    fireEvent.click(modeRadio("Envoyer en brouillon"));
    // TikTok demande tout dans l'appli : plus rien à choisir ici
    expect(screen.queryByText("Qui peut voir ce post")).toBeNull();
    expect(screen.queryByText("Autoriser les commentaires")).toBeNull();
    expect(screen.queryByText("Divulguer le contenu commercial")).toBeNull();
    expect(screen.queryByText(/En publiant, vous acceptez/)).toBeNull();
    expect(
      screen.getByText(
        "Vous recevrez une notification dans l'appli TikTok pour terminer la publication (son, texte, confidentialité).",
      ),
    ).toBeTruthy();
    expect(
      screen.queryByText(/Le texte n'est pas transmis pour une vidéo/),
    ).toBeNull();
  });

  it("vidéo en brouillon : texte non transmis, réglages minimaux envoyés", async () => {
    render(<SocialPostModal open onClose={vi.fn()} post={null} />);
    fireEvent.click(modeRadio("Envoyer en brouillon"));
    await addReadyVideo();
    expect(
      screen.getByText(
        "Le texte n'est pas transmis pour une vidéo en brouillon : vous l'écrirez dans TikTok.",
      ),
    ).toBeTruthy();
    // Pas de limite de texte pour TikTok : le texte ne part pas
    fireEvent.change(screen.getByLabelText("Texte"), {
      target: { value: "a".repeat(2300) },
    });
    expect(screen.queryByText(/\/ 2200/)).toBeNull();

    await submit();
    expect(mutations.schedule.mock.calls[0][0].tiktokSettings).toEqual({
      mode: "draft",
    });
  });

  it("compte connecté avant les brouillons : option grisée et reconnexion", () => {
    setAccount(
      tiktokAccount({ capabilities: caps({ draftsNeedReconnect: true }) }),
    );
    render(<SocialPostModal open onClose={vi.fn()} post={null} />);
    expect(modeRadio("Envoyer en brouillon").disabled).toBe(true);
    expect(
      screen.getByText(
        "Reconnectez votre compte TikTok pour envoyer en brouillon.",
      ),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Reconnecter" }));
    expect(connect).toHaveBeenCalledWith(
      "tiktok",
      expect.stringContaining("socialPost=new"),
      expect.objectContaining({ connector: "tiktok" }),
    );
  });

  it("compte sans brouillon possible : pas de choix de mode", () => {
    setAccount(tiktokAccount({ capabilities: caps() }));
    render(<SocialPostModal open onClose={vi.fn()} post={null} />);
    expect(
      screen.queryByRole("radio", { name: "Envoyer en brouillon" }),
    ).toBeNull();
  });

  it("modification d'un brouillon : mode repris du post", () => {
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
      targets: [{ accountId: "a-tt", platform: "tiktok", status: "pending" }],
      tiktokSettings: { mode: "draft", privacyLevel: null, sound: null },
    };
    render(<SocialPostModal open onClose={vi.fn()} post={post} />);
    expect(modeRadio("Envoyer en brouillon").getAttribute("aria-checked")).toBe(
      "true",
    );
  });
});

describe("fenêtre de programmation : TikTok Business", () => {
  it("vidéo publiée directement : toujours publique", async () => {
    setAccount(
      tiktokAccount({
        id: "a-ttb",
        connector: "business",
        capabilities: caps({ sounds: true, drafts: true }),
      }),
    );
    render(<SocialPostModal open onClose={vi.fn()} post={null} />);
    await addReadyVideo();
    expect(
      screen.getByText(
        "Avec un compte TikTok Business, une vidéo est toujours publique.",
      ),
    ).toBeTruthy();
    const privacy = screen.getByRole("combobox", {
      name: "Qui peut voir ce post",
    });
    expect(privacy.disabled).toBe(true);
    expect(privacy.textContent).toContain("Tout le monde");

    await submit();
    expect(mutations.schedule.mock.calls[0][0].tiktokSettings).toEqual(
      expect.objectContaining({
        mode: "direct",
        privacyLevel: "PUBLIC_TO_EVERYONE",
        allowDuet: false,
        allowStitch: false,
        consentGiven: true,
        sound: null,
      }),
    );
  });
});
