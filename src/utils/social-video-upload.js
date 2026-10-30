/**
 * Envoi d'une vidéo de post réseaux sociaux, en morceaux.
 *
 * Fonctions pures (sans React ni Apollo) : les appels à l'API sont fournis
 * par l'appelant (`api`), ce qui permet de les simuler dans les tests.
 *
 * Étapes : startSocialVideoUpload (taille des morceaux), envoi des morceaux
 * un par un (2 nouveaux essais chacun), completeSocialVideoUpload, puis
 * suivi de la préparation (socialPostMedia toutes les 2 s) jusqu'à
 * « ready » ou « failed ».
 */

import { getVideoContentType } from "./social-post-rules";

export const VIDEO_POLL_INTERVAL_MS = 2000;
export const VIDEO_CHUNK_RETRIES = 2;
const RETRY_DELAYS_MS = [1000, 3000];
// Préparation la plus longue côté serveur : 2 essais de 15 min au plus
const MAX_PREPARATION_WAIT_MS = 40 * 60 * 1000;
// Suivi interrompu après autant d'échecs de lecture d'affilée
const MAX_POLL_ERRORS = 5;
// Lecture des métadonnées d'un fichier local
const METADATA_TIMEOUT_MS = 15 * 1000;

export const VIDEO_UPLOAD_FAILED_MESSAGE =
  "L'envoi de la vidéo a échoué. Vérifiez votre connexion et réessayez.";
export const VIDEO_PREPARATION_FAILED_MESSAGE =
  "La vidéo n'a pas pu être préparée. Retirez-la et réessayez.";
export const VIDEO_PREPARATION_TIMEOUT_MESSAGE =
  "La préparation de la vidéo prend trop de temps. Retirez-la et réessayez.";

/** Erreur prête à afficher (message français) */
export class SocialVideoError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "SocialVideoError";
  }
}

function abortError() {
  const error = new Error("Envoi de la vidéo annulé");
  error.name = "AbortError";
  return error;
}

/** Envoi annulé par l'utilisateur (vidéo retirée, fenêtre fermée) */
export function isAbortError(error) {
  return error?.name === "AbortError";
}

function throwIfAborted(signal) {
  if (signal?.aborted) throw abortError();
}

/** Attente interrompue par l'annulation */
export function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener?.("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener?.("abort", onAbort, { once: true });
  });
}

async function withRetries(fn, { retries, delays, signal, sleep }) {
  for (let attempt = 0; ; attempt += 1) {
    throwIfAborted(signal);
    try {
      return await fn();
    } catch (error) {
      if (signal?.aborted || isAbortError(error)) throw abortError();
      if (attempt >= retries) throw error;
      await sleep(delays[Math.min(attempt, delays.length - 1)] ?? 0, signal);
    }
  }
}

/**
 * Envoie la vidéo et attend sa préparation.
 *
 * @param {File} file
 * @param {object} api appels à l'API (chacun reçoit aussi `signal`)
 * @param {(input: { fileName: string, size: number, contentType: string, signal?: AbortSignal }) => Promise<{ media: object, chunkSize: number, chunkCount: number }>} api.start
 * @param {(input: { mediaId: string, index: number, chunk: Blob, signal?: AbortSignal }) => Promise<boolean>} api.uploadChunk
 * @param {(input: { mediaId: string, signal?: AbortSignal }) => Promise<object>} api.complete
 * @param {(input: { mediaId: string, signal?: AbortSignal }) => Promise<object|null>} api.fetchMedia
 * @param {object} [options]
 * @param {AbortSignal} [options.signal]
 * @param {(percent: number) => void} [options.onProgress] 0 à 100, pendant l'envoi
 * @param {(media: object) => void} [options.onMedia] média à jour (id, status…)
 * @returns {Promise<object>} le média prêt (status "ready")
 */
export async function uploadSocialVideo(
  file,
  api,
  {
    signal,
    onProgress,
    onMedia,
    sleep = wait,
    now = () => Date.now(),
    pollIntervalMs = VIDEO_POLL_INTERVAL_MS,
    retries = VIDEO_CHUNK_RETRIES,
    retryDelaysMs = RETRY_DELAYS_MS,
    maxWaitMs = MAX_PREPARATION_WAIT_MS,
  } = {},
) {
  throwIfAborted(signal);
  const contentType = getVideoContentType(file) || file.type || "video/mp4";
  const retry = (fn) =>
    withRetries(fn, { retries, delays: retryDelaysMs, signal, sleep });

  // 1. Ouverture de l'envoi (pas de nouvel essai : l'API refuse ici un
  // format ou un poids, réessayer n'y changerait rien)
  const started = await api.start({
    fileName: file.name || "video",
    size: file.size,
    contentType,
    signal,
  });
  throwIfAborted(signal);
  const mediaId = started?.media?.id;
  const chunkSize = Number(started?.chunkSize);
  const chunkCount = Number(started?.chunkCount);
  if (!mediaId || !(chunkSize > 0) || !(chunkCount > 0)) {
    throw new SocialVideoError(VIDEO_UPLOAD_FAILED_MESSAGE);
  }
  onMedia?.(started.media);
  onProgress?.(0);

  // 2. Les morceaux, un par un
  for (let index = 0; index < chunkCount; index += 1) {
    const chunk = file.slice(
      index * chunkSize,
      Math.min(file.size, (index + 1) * chunkSize),
    );
    await retry(() => api.uploadChunk({ mediaId, index, chunk, signal }));
    onProgress?.(Math.round(((index + 1) / chunkCount) * 100));
  }

  // 3. Assemblage : la préparation démarre côté serveur
  let media = await retry(() => api.complete({ mediaId, signal }));
  throwIfAborted(signal);
  if (!media) throw new SocialVideoError(VIDEO_UPLOAD_FAILED_MESSAGE);
  onMedia?.(media);

  // 4. Suivi de la préparation
  const startedAt = now();
  let pollErrors = 0;
  while (media.status !== "ready") {
    if (media.status === "failed") {
      throw new SocialVideoError(
        media.errorMessage || VIDEO_PREPARATION_FAILED_MESSAGE,
      );
    }
    if (now() - startedAt > maxWaitMs) {
      throw new SocialVideoError(VIDEO_PREPARATION_TIMEOUT_MESSAGE);
    }
    await sleep(pollIntervalMs, signal);
    try {
      const next = await api.fetchMedia({ mediaId, signal });
      throwIfAborted(signal);
      if (!next) throw new Error("Média introuvable");
      pollErrors = 0;
      media = next;
      onMedia?.(media);
    } catch (error) {
      if (signal?.aborted || isAbortError(error)) throw abortError();
      pollErrors += 1;
      if (pollErrors >= MAX_POLL_ERRORS) {
        throw new SocialVideoError(VIDEO_PREPARATION_FAILED_MESSAGE, {
          cause: error,
        });
      }
    }
  }
  return media;
}

/**
 * Durée et dimensions d'une vidéo locale, lues par un <video> hors écran
 * (événement loadedmetadata). null si le navigateur ne sait pas la lire
 * (ex. format non pris en charge) : le serveur contrôlera.
 * @param {string} url adresse locale (URL.createObjectURL)
 * @returns {Promise<{ durationMs: number|null, width: number|null, height: number|null } | null>}
 */
export function readVideoMetadata(
  url,
  { timeoutMs = METADATA_TIMEOUT_MS } = {},
) {
  return new Promise((resolve) => {
    if (typeof document === "undefined" || !url) {
      resolve(null);
      return;
    }
    const video = document.createElement("video");
    let done = false;
    const finish = (value) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      video.removeAttribute("src");
      try {
        video.load();
      } catch {
        // Élément déjà libéré
      }
      resolve(value);
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    video.preload = "metadata";
    video.muted = true;
    video.onloadedmetadata = () => {
      const seconds = video.duration;
      finish({
        // WebM sans durée dans l'en-tête : Infinity
        durationMs:
          Number.isFinite(seconds) && seconds > 0
            ? Math.round(seconds * 1000)
            : null,
        width: video.videoWidth || null,
        height: video.videoHeight || null,
      });
    };
    video.onerror = () => finish(null);
    video.src = url;
  });
}
