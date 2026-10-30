import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

// Objets renvoyés par les simulations : hissés et STABLES d'un rendu à
// l'autre (un objet recréé à chaque rendu relance les effets de la fenêtre
// sans fin, comme le cache Apollo ne le fait jamais)
const social = vi.hoisted(() => ({ value: null }));
const metadata = vi.hoisted(() => ({
  current: { durationMs: 45_000, width: 1080, height: 1920 },
}));
const upload = vi.hoisted(() => ({ handlers: null }));
const mutations = vi.hoisted(() => ({
  upload: vi.fn(),
  uploadVideo: vi.fn(),
  schedule: vi.fn(),
  update: vi.fn(),
}));
const creator = vi.hoisted(() => {
  const base = {
    nickname: "Studio Nord",
    username: "studionord",
    canPostMore: true,
    commentDisabled: false,
    duetDisabled: false,
    stitchDisabled: false,
    maxVideoPostDurationSec: 600,
    privacyLevels: [{ value: "PUBLIC_TO_EVERYONE", label: "Tout le monde" }],
  };
  const open = { info: base, loading: false, error: null, refetch: () => {} };
  const locked = {
    info: { ...base, duetDisabled: true, stitchDisabled: true },
    loading: false,
    error: null,
    refetch: () => {},
  };
  return { open, locked, current: open };
});

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
  useTikTokCreatorInfo: () => creator.current,
}));
vi.mock("@/src/utils/social-video-upload", async (importOriginal) => ({
  ...(await importOriginal()),
  // Le <video> hors écran ne lit rien dans happy-dom
  readVideoMetadata: () => Promise.resolve(metadata.current),
}));
vi.mock("@/src/components/ui/sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { SocialPostModal } from "@/app/dashboard/outils/kanban/[id]/components/social/SocialPostModal";

const ACCOUNTS = {
  facebook: {
    id: "a-fb",
    platform: "facebook",
    displayName: "Boulangerie Martin",
    status: "active",
  },
  twitter: {
    id: "a-x",
    platform: "twitter",
    username: "boulangerie",
    status: "active",
  },
  tiktok: {
    id: "a-tt",
    platform: "tiktok",
    username: "studionord",
    displayName: "Studio Nord",
    status: "active",
  },
};

const READY_MEDIA = {
  id: "m1",
  kind: "video",
  status: "ready",
  url: "https://api.newbi.fr/social-media/m1.mp4",
  thumbnailUrl: "https://api.newbi.fr/social-media/m1.jpg",
  width: 1080,
  height: 1920,
  durationMs: 45_000,
  size: 20 * 1024 * 1024,
  contentType: "video/mp4",
};

function setAccount(platform) {
  social.value = {
    boardId: "b1",
    workspaceId: "w1",
    columns: [{ id: "c1", title: "Idées" }],
    mutations,
    status: {
      enabled: true,
      canManageAccounts: true,
      canSchedule: true,
      platforms: [platform],
      xPostQuota: null,
      accounts: [ACCOUNTS[platform]],
    },
  };
}

const videoFile = () =>
  new File([new Uint8Array(64)], "atelier.mov", { type: "video/quicktime" });

async function chooseVideo() {
  fireEvent.change(screen.getByTestId("social-post-video-input"), {
    target: { files: [videoFile()] },
  });
  await screen.findByText("Envoi 0 %");
}

const submitButton = () =>
  screen.getByRole("button", { name: /Programmer le post/ });

beforeEach(() => {
  vi.clearAllMocks();
  metadata.current = { durationMs: 45_000, width: 1080, height: 1920 };
  creator.current = creator.open;
  upload.handlers = null;
  mutations.uploadVideo.mockImplementation(
    (file, { onProgress, onMedia, signal }) =>
      new Promise((resolve, reject) => {
        upload.handlers = { onProgress, onMedia, resolve, reject, signal };
        onMedia({ id: "m1", kind: "video", status: "uploading" });
        onProgress(0);
      }),
  );
  mutations.schedule.mockResolvedValue({
    post: { id: "p1", status: "scheduled", scheduledFor: null },
  });
  if (!URL.createObjectURL) URL.createObjectURL = () => "blob:local";
  setAccount("facebook");
});

describe("fenêtre de programmation : vidéo", () => {
  it("photos ou vidéo : deux boutons", () => {
    render(<SocialPostModal open onClose={vi.fn()} post={null} />);
    expect(screen.getByText("Photos ou vidéo")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Ajouter des photos/ }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Ajouter une vidéo/ }),
    ).toBeTruthy();
    expect(
      screen.getByTestId("social-post-video-input").getAttribute("accept"),
    ).toBe("video/mp4,video/quicktime,video/x-m4v,video/webm");
  });

  it("envoi, préparation puis lecteur ; le bouton attend la vidéo prête", async () => {
    render(<SocialPostModal open onClose={vi.fn()} post={null} />);
    await chooseVideo();

    // Photos exclues tant qu'il y a une vidéo
    expect(
      screen
        .getByRole("button", { name: /Ajouter des photos/ })
        .getAttribute("aria-disabled"),
    ).toBe("true");
    expect(
      screen.getByRole("button", { name: /Remplacer la vidéo/ }),
    ).toBeTruthy();
    expect(submitButton().disabled).toBe(true);

    act(() => upload.handlers.onProgress(45));
    expect(screen.getByText("Envoi 45 %")).toBeTruthy();
    expect(screen.getByText("Envoi de la vidéo : 45 %")).toBeTruthy();

    act(() =>
      upload.handlers.onMedia({
        id: "m1",
        kind: "video",
        status: "processing",
      }),
    );
    expect(screen.getAllByText("Préparation de la vidéo…").length).toBe(2);
    expect(submitButton().disabled).toBe(true);

    await act(async () => upload.handlers.resolve(READY_MEDIA));
    const player = screen.getByLabelText("Vidéo du post");
    expect(player.tagName).toBe("VIDEO");
    expect(player.getAttribute("src")).toBe(READY_MEDIA.url);
    expect(player.getAttribute("poster")).toBe(READY_MEDIA.thumbnailUrl);
    expect(screen.getByText("Vidéo de 45 s")).toBeTruthy();
    expect(submitButton().disabled).toBe(false);

    await act(async () => fireEvent.click(submitButton()));
    expect(mutations.schedule).toHaveBeenCalledWith(
      expect.objectContaining({ mediaIds: ["m1"], content: "" }),
    );
  });

  it("annuler l'envoi retire la vidéo et interrompt l'envoi", async () => {
    render(<SocialPostModal open onClose={vi.fn()} post={null} />);
    await chooseVideo();
    fireEvent.click(screen.getByRole("button", { name: "Annuler l'envoi" }));
    expect(upload.handlers.signal.aborted).toBe(true);
    expect(screen.queryByText(/Envoi \d+ %/)).toBeNull();
    expect(
      screen.getByRole("button", { name: /Ajouter une vidéo/ }),
    ).toBeTruthy();
  });

  it("préparation en échec : message du serveur", async () => {
    render(<SocialPostModal open onClose={vi.fn()} post={null} />);
    await chooseVideo();
    const { SocialVideoError } =
      await import("@/src/utils/social-video-upload");
    await act(async () =>
      upload.handlers.reject(
        new SocialVideoError("Vidéo illisible ou endommagée."),
      ),
    );
    expect(screen.getByText("Vidéo non préparée")).toBeTruthy();
    expect(
      screen.getAllByText("Vidéo illisible ou endommagée.").length,
    ).toBeGreaterThan(0);
  });

  it("X : vidéo trop longue signalée dès l'ajout", async () => {
    setAccount("twitter");
    metadata.current = { durationMs: 185_000, width: 1920, height: 1080 };
    render(<SocialPostModal open onClose={vi.fn()} post={null} />);
    await chooseVideo();
    expect(
      screen.getByText(
        "X accepte des vidéos de 2 min 20 au maximum (cette vidéo dure 3 min 05).",
      ),
    ).toBeTruthy();
  });

  it("vidéo de plus de 10 minutes : refusée avant l'envoi", async () => {
    const { toast } = await import("@/src/components/ui/sonner");
    metadata.current = { durationMs: 750_000, width: 1920, height: 1080 };
    render(<SocialPostModal open onClose={vi.fn()} post={null} />);
    fireEvent.change(screen.getByTestId("social-post-video-input"), {
      target: { files: [videoFile()] },
    });
    await vi.waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "La vidéo doit durer 10 minutes au maximum (elle dure 12 min 30).",
      ),
    );
    expect(mutations.uploadVideo).not.toHaveBeenCalled();
  });

  it("TikTok : duos et collages pour une vidéo, envoyés au serveur", async () => {
    setAccount("tiktok");
    render(<SocialPostModal open onClose={vi.fn()} post={null} />);
    // Photo : pas de duos ni de collages
    expect(screen.queryByText("Autoriser les duos")).toBeNull();

    await chooseVideo();
    const duet = screen.getByRole("switch", { name: /Autoriser les duos/ });
    const stitch = screen.getByRole("switch", {
      name: /Autoriser les collages \(Stitch\)/,
    });
    // Non cochés au départ (consignes TikTok)
    expect(duet.getAttribute("aria-checked")).toBe("false");
    expect(stitch.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(duet);
    expect(duet.getAttribute("aria-checked")).toBe("true");
  });

  it("TikTok : duos et collages grisés quand le créateur les a coupés", async () => {
    setAccount("tiktok");
    creator.current = creator.locked;
    render(<SocialPostModal open onClose={vi.fn()} post={null} />);
    await chooseVideo();
    expect(
      screen.getByRole("switch", { name: /Autoriser les duos/ }).disabled,
    ).toBe(true);
    expect(
      screen.getByRole("switch", { name: /Autoriser les collages/ }).disabled,
    ).toBe(true);
    expect(
      screen.getByText("Les duos sont désactivés sur ce compte TikTok."),
    ).toBeTruthy();
  });

  it("modification d'un post avec vidéo : lecteur, puis retrait", () => {
    const post = {
      id: "p1",
      taskId: "t1",
      content: "Visite de l'atelier",
      scheduledFor: "2030-01-15T09:00:00.000Z",
      media: [READY_MEDIA],
      targets: [{ accountId: "a-fb", platform: "facebook", status: "pending" }],
      tiktokSettings: null,
    };
    render(<SocialPostModal open onClose={vi.fn()} post={post} />);
    expect(screen.getByLabelText("Vidéo du post").getAttribute("src")).toBe(
      READY_MEDIA.url,
    );
    expect(
      screen.getByLabelText("Aperçu de la vidéo").getAttribute("src"),
    ).toBe(READY_MEDIA.url);

    fireEvent.click(screen.getByRole("button", { name: "Retirer la vidéo" }));
    expect(screen.queryByLabelText("Vidéo du post")).toBeNull();
    expect(
      screen.getByRole("button", { name: /Ajouter une vidéo/ }),
    ).toBeTruthy();
  });
});
