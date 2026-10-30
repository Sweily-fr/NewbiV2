import { describe, it, expect, vi } from "vitest";
import {
  SocialVideoError,
  VIDEO_PREPARATION_TIMEOUT_MESSAGE,
  isAbortError,
  uploadSocialVideo,
} from "@/src/utils/social-video-upload";

// Fichier de 20 octets envoyé en morceaux de 8 : 8 + 8 + 4
const makeFile = () =>
  new File([new Uint8Array(20).map((_, i) => i)], "clip.mov", {
    type: "video/quicktime",
  });
const noSleep = () => Promise.resolve();

function makeApi({ statuses = ["ready"], chunkFailures = {} } = {}) {
  const received = [];
  const polls = [...statuses];
  const api = {
    start: vi.fn(async () => ({
      media: { id: "m1", kind: "video", status: "uploading" },
      chunkSize: 8,
      chunkCount: 3,
    })),
    uploadChunk: vi.fn(async ({ index, chunk }) => {
      if (chunkFailures[index] > 0) {
        chunkFailures[index] -= 1;
        throw new Error("Failed to fetch");
      }
      received.push({ index, size: chunk.size });
      return true;
    }),
    complete: vi.fn(async () => ({
      id: "m1",
      kind: "video",
      status: "processing",
    })),
    fetchMedia: vi.fn(async () => {
      const status = polls.length > 1 ? polls.shift() : polls[0];
      return status === "ready"
        ? {
            id: "m1",
            kind: "video",
            status: "ready",
            url: "https://api.newbi.fr/social-media/m1.mp4",
            thumbnailUrl: "https://api.newbi.fr/social-media/m1.jpg",
            durationMs: 12_000,
          }
        : {
            id: "m1",
            kind: "video",
            status,
            errorMessage:
              status === "failed" ? "Vidéo illisible ou endommagée." : null,
          };
    }),
  };
  return { api, received };
}

describe("uploadSocialVideo", () => {
  it("envoie les morceaux dans l'ordre, puis attend la préparation", async () => {
    const { api, received } = makeApi({
      statuses: ["processing", "processing", "ready"],
    });
    const progress = [];
    const statuses = [];
    const media = await uploadSocialVideo(makeFile(), api, {
      sleep: noSleep,
      onProgress: (p) => progress.push(p),
      onMedia: (m) => statuses.push(m.status),
    });

    expect(api.start).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: "clip.mov",
        size: 20,
        contentType: "video/quicktime",
      }),
    );
    expect(received).toEqual([
      { index: 0, size: 8 },
      { index: 1, size: 8 },
      { index: 2, size: 4 },
    ]);
    expect(progress).toEqual([0, 33, 67, 100]);
    expect(api.complete).toHaveBeenCalledTimes(1);
    expect(api.fetchMedia).toHaveBeenCalledTimes(3);
    expect(statuses).toEqual([
      "uploading",
      "processing",
      "processing",
      "processing",
      "ready",
    ]);
    expect(media.url).toBe("https://api.newbi.fr/social-media/m1.mp4");
  });

  it("2 nouveaux essais par morceau, puis abandon", async () => {
    const ok = makeApi({ chunkFailures: { 1: 2 } });
    await expect(
      uploadSocialVideo(makeFile(), ok.api, { sleep: noSleep }),
    ).resolves.toMatchObject({ status: "ready" });
    // Morceau 1 : 2 échecs puis réussite
    expect(ok.api.uploadChunk).toHaveBeenCalledTimes(5);

    const ko = makeApi({ chunkFailures: { 0: 3 } });
    await expect(
      uploadSocialVideo(makeFile(), ko.api, { sleep: noSleep }),
    ).rejects.toThrow("Failed to fetch");
    expect(ko.api.uploadChunk).toHaveBeenCalledTimes(3);
    expect(ko.api.complete).not.toHaveBeenCalled();
  });

  it("préparation en échec : message du serveur", async () => {
    const { api } = makeApi({ statuses: ["failed"] });
    const error = await uploadSocialVideo(makeFile(), api, {
      sleep: noSleep,
    }).catch((e) => e);
    expect(error).toBeInstanceOf(SocialVideoError);
    expect(error.message).toBe("Vidéo illisible ou endommagée.");
  });

  it("préparation trop longue : abandon avec un message clair", async () => {
    const { api } = makeApi({ statuses: ["processing"] });
    let clock = 0;
    const error = await uploadSocialVideo(makeFile(), api, {
      sleep: async () => {
        clock += 60_000;
      },
      now: () => clock,
      maxWaitMs: 5 * 60_000,
    }).catch((e) => e);
    expect(error.message).toBe(VIDEO_PREPARATION_TIMEOUT_MESSAGE);
  });

  it("annulation : plus aucun envoi, erreur AbortError", async () => {
    const { api } = makeApi();
    const controller = new AbortController();
    api.uploadChunk.mockImplementation(async ({ index }) => {
      if (index === 0) controller.abort();
      return true;
    });
    const error = await uploadSocialVideo(makeFile(), api, {
      sleep: noSleep,
      signal: controller.signal,
    }).catch((e) => e);
    expect(isAbortError(error)).toBe(true);
    expect(api.uploadChunk).toHaveBeenCalledTimes(1);
    expect(api.complete).not.toHaveBeenCalled();
  });

  it("refus à l'ouverture (format, poids) : pas de nouvel essai", async () => {
    const { api } = makeApi();
    api.start.mockRejectedValue(new Error("La vidéo dépasse 500 Mo."));
    await expect(
      uploadSocialVideo(makeFile(), api, { sleep: noSleep }),
    ).rejects.toThrow("La vidéo dépasse 500 Mo.");
    expect(api.start).toHaveBeenCalledTimes(1);
    expect(api.uploadChunk).not.toHaveBeenCalled();
  });
});
