"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import JSZip from "jszip";

// Mapping extension → mime type pour les entrées extraites d'un ZIP
// (les entrées JSZip n'exposent pas le mime original, seulement le nom)
const MIME_TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  tiff: "image/tiff",
  heic: "image/heic",
  heif: "image/heif",
  pdf: "application/pdf",
  txt: "text/plain",
};

const IMAGE_EXTS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "svg",
  "tiff",
  "heic",
  "heif",
];

function getExt(name) {
  return (name || "").split(".").pop()?.toLowerCase() || "";
}

function guessMime(name) {
  return MIME_TYPES[getExt(name)] || "application/octet-stream";
}

/**
 * Hook pour prévisualiser le contenu d'un transfert ZIP côté client.
 *
 * Télécharge le ZIP via une URL (typiquement /api/files/preview/...), extrait
 * les entrées avec JSZip, et génère des blob URLs à la demande pour les entrées
 * prévisualisables (images, PDF). Les URLs sont automatiquement révoquées au
 * démontage pour éviter les fuites mémoire.
 *
 * @param {Object} params
 * @param {boolean} params.enabled - Active le hook (si false, aucun fetch)
 * @param {string|null} params.zipUrl - URL pour télécharger le ZIP
 * @param {number} [params.maxSizeBytes] - Taille max auto-load (défaut 150 Mo)
 * @returns {{
 *   loading: boolean,
 *   error: string|null,
 *   entries: Array<{path:string,name:string,ext:string,mimeType:string,size:number,isImage:boolean,isPdf:boolean,isPreviewable:boolean}>,
 *   blobUrls: Record<string,string>,
 *   tooLarge: boolean,
 *   extractBlob: (path:string) => Promise<Blob|null>,
 * }}
 */
export function useZipPreview({
  enabled,
  zipUrl,
  maxSizeBytes = 150 * 1024 * 1024,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [entries, setEntries] = useState([]);
  const [blobUrls, setBlobUrls] = useState({});
  const [tooLarge, setTooLarge] = useState(false);
  const zipInstanceRef = useRef(null);
  const blobUrlCacheRef = useRef(new Map());

  // Nettoyage: révoque toutes les blob URLs créées
  const cleanup = useCallback(() => {
    blobUrlCacheRef.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    });
    blobUrlCacheRef.current.clear();
    zipInstanceRef.current = null;
  }, []);

  // Cleanup au démontage
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  // Reset quand l'URL change
  useEffect(() => {
    cleanup();
    setEntries([]);
    setBlobUrls({});
    setError(null);
    setTooLarge(false);
  }, [zipUrl, cleanup]);

  // Fetch + parse du ZIP
  useEffect(() => {
    if (!enabled || !zipUrl) {
      console.debug("[useZipPreview] skip", { enabled, zipUrl });
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    console.debug("[useZipPreview] fetching zip", zipUrl);

    (async () => {
      try {
        // HEAD d'abord pour connaître la taille et éviter de charger un gros ZIP
        let contentLength = 0;
        try {
          const head = await fetch(zipUrl, { method: "HEAD" });
          if (head.ok) {
            contentLength = parseInt(
              head.headers.get("content-length") || "0",
              10,
            );
          }
        } catch {
          // HEAD peut échouer (CORS, etc.) — on continue sans la taille
        }

        if (contentLength > maxSizeBytes) {
          console.warn("[useZipPreview] zip too large", contentLength);
          if (!cancelled) {
            setTooLarge(true);
            setLoading(false);
          }
          return;
        }

        const res = await fetch(zipUrl);
        console.debug(
          "[useZipPreview] fetch status",
          res.status,
          res.headers.get("content-type"),
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arrayBuffer = await res.arrayBuffer();
        console.debug("[useZipPreview] bytes received", arrayBuffer.byteLength);
        if (cancelled) return;

        const zip = await JSZip.loadAsync(arrayBuffer);
        if (cancelled) return;
        zipInstanceRef.current = zip;

        // Construire la liste des entrées (en ignorant les dossiers)
        const list = [];
        zip.forEach((relativePath, zipObj) => {
          if (zipObj.dir) return;
          // Ignorer les fichiers système macOS
          if (
            relativePath.startsWith("__MACOSX/") ||
            relativePath.endsWith(".DS_Store")
          ) {
            return;
          }
          const name = relativePath.split("/").pop() || relativePath;
          const ext = getExt(name);
          const isImage = IMAGE_EXTS.includes(ext);
          const isPdf = ext === "pdf";
          list.push({
            path: relativePath,
            name,
            ext,
            mimeType: guessMime(name),
            size: zipObj._data?.uncompressedSize || 0,
            isImage,
            isPdf,
            isPreviewable: isImage || isPdf,
          });
        });

        // Tri: prévisualisables d'abord, puis alphabétique
        list.sort((a, b) => {
          if (a.isPreviewable && !b.isPreviewable) return -1;
          if (!a.isPreviewable && b.isPreviewable) return 1;
          return a.name.localeCompare(b.name);
        });

        if (cancelled) return;
        setEntries(list);

        // Pré-générer les blob URLs pour toutes les entrées prévisualisables
        // (c'est synchrone une fois le ZIP parsé, l'extraction est rapide)
        const urlPairs = await Promise.all(
          list
            .filter((e) => e.isPreviewable)
            .map(async (entry) => {
              try {
                const zipObj = zip.file(entry.path);
                if (!zipObj) return null;
                const raw = await zipObj.async("blob");
                const typed = new Blob([raw], { type: entry.mimeType });
                const url = URL.createObjectURL(typed);
                blobUrlCacheRef.current.set(entry.path, url);
                return [entry.path, url];
              } catch (e) {
                console.warn("Erreur extraction entrée ZIP:", entry.path, e);
                return null;
              }
            }),
        );

        if (cancelled) return;
        const urlMap = {};
        urlPairs.forEach((pair) => {
          if (pair) urlMap[pair[0]] = pair[1];
        });
        console.debug(
          "[useZipPreview] entries",
          list.length,
          "previewable blob urls",
          Object.keys(urlMap).length,
        );
        setBlobUrls(urlMap);
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          console.error("[useZipPreview] Erreur lecture ZIP:", err);
          setError(err.message || "Impossible de lire le ZIP");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, zipUrl, maxSizeBytes]);

  // Extraire une entrée en blob (pour téléchargement individuel p.ex.)
  const extractBlob = useCallback(async (path) => {
    if (!zipInstanceRef.current) return null;
    const zipObj = zipInstanceRef.current.file(path);
    if (!zipObj) return null;
    return await zipObj.async("blob");
  }, []);

  return {
    loading,
    error,
    entries,
    blobUrls,
    tooLarge,
    extractBlob,
  };
}
