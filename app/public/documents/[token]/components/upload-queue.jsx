"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CircleAlert, CircleCheck, LoaderCircle, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import { uploadProblem } from "./shared-files-utils";

// Fichiers envoyés en même temps
const CONCURRENCY = 3;

/**
 * Envoi d'un fichier avec sa progression (fetch ne la donne pas) : POST
 * pour un dépôt, PUT pour une nouvelle version. Rejette avec le message de
 * l'API quand elle refuse le fichier.
 */
export function sendFile(url, file, onProgress, method = "POST") {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(method, url);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    request.onload = () => {
      let data = {};
      try {
        data = JSON.parse(request.responseText);
      } catch {
        // Réponse sans corps JSON
      }
      if (request.status >= 200 && request.status < 300 && data.success) {
        resolve(data.document);
      } else {
        reject(new Error(data.message || "Le dépôt a échoué."));
      }
    };
    request.onerror = () =>
      reject(new Error("Connexion interrompue, réessayez."));
    const body = new FormData();
    body.append("file", file);
    request.send(body);
  });
}

let nextId = 0;

/** Envoi d'un fichier, refusé d'avance s'il ne peut pas partir. */
function makeJob(file, changes) {
  const problem = uploadProblem(file);
  nextId += 1;
  return {
    id: nextId,
    file,
    name: file.name,
    method: "POST",
    status: problem ? "error" : "waiting",
    message: problem,
    progress: 0,
    ...changes,
  };
}

/**
 * File des envois du visiteur (dépôts et nouvelles versions) : fichiers
 * contrôlés avant l'envoi, trois à la fois, progression et erreur de
 * chacun. `onUploaded` après chaque fichier arrivé (la page se relit).
 */
export function useUploadQueue({
  uploadUrl,
  replaceUrl,
  onUploaded,
  send = sendFile,
}) {
  const [items, setItems] = useState([]);
  const waiting = useRef([]);
  const active = useRef(0);
  const onUploadedRef = useRef(onUploaded);
  onUploadedRef.current = onUploaded;

  const update = useCallback((id, changes) => {
    setItems((previous) =>
      previous.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );
  }, []);

  const pump = useCallback(() => {
    while (active.current < CONCURRENCY && waiting.current.length > 0) {
      const job = waiting.current.shift();
      active.current += 1;
      update(job.id, { status: "uploading" });
      send(
        job.url,
        job.file,
        (progress) => update(job.id, { progress }),
        job.method,
      )
        .then(() => {
          update(job.id, { status: "done", progress: 1 });
          onUploadedRef.current?.();
        })
        .catch((error) =>
          update(job.id, { status: "error", message: error.message }),
        )
        .finally(() => {
          active.current -= 1;
          pump();
        });
    }
  }, [send, update]);

  const enqueue = useCallback(
    (jobs) => {
      setItems((previous) => [...previous, ...jobs]);
      waiting.current.push(...jobs.filter((job) => job.status === "waiting"));
      pump();
    },
    [pump],
  );

  /** Ajoute des fichiers à déposer dans `folder`. */
  const add = useCallback(
    (files, folder) =>
      enqueue(
        [...files].map((file) =>
          makeJob(file, { detail: folder.name, url: uploadUrl(folder.id) }),
        ),
      ),
    [enqueue, uploadUrl],
  );

  /** Envoie `file` comme nouvelle version de `document` (un des siens). */
  const replace = useCallback(
    (file, document) =>
      enqueue([
        makeJob(file, {
          detail: `Nouvelle version de « ${document.name} »`,
          url: replaceUrl(document.id),
          method: "PUT",
        }),
      ]),
    [enqueue, replaceUrl],
  );

  /** Retire de la liste les envois terminés (réussis ou non). */
  const clear = useCallback(() => {
    setItems((previous) =>
      previous.filter((item) => ["waiting", "uploading"].includes(item.status)),
    );
  }, []);

  const busy = items.some((item) =>
    ["waiting", "uploading"].includes(item.status),
  );

  // Quitter la page couperait les envois en cours
  useEffect(() => {
    if (!busy) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  return { items, add, replace, clear, busy };
}

/** Encart des dépôts en cours, en bas à droite. */
export function UploadPanel({ items, busy, onClose }) {
  if (items.length === 0) return null;
  const done = items.filter((item) => item.status === "done").length;
  const failed = items.filter((item) => item.status === "error").length;
  const title = busy
    ? `Dépôt en cours (${done} sur ${items.length})`
    : failed > 0
      ? `${done} déposé${done > 1 ? "s" : ""}, ${failed} refusé${failed > 1 ? "s" : ""}`
      : `${done} document${done > 1 ? "s" : ""} déposé${done > 1 ? "s" : ""}`;

  return (
    <section
      aria-label="Dépôts"
      aria-live="polite"
      className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-80 z-50 rounded-lg border bg-background shadow-lg"
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b">
        <p className="text-sm font-medium flex-1 min-w-0 truncate">{title}</p>
        <Button
          size="icon"
          variant="ghost"
          className="size-7 shrink-0"
          aria-label="Fermer"
          disabled={busy}
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>
      <ul className="max-h-60 overflow-y-auto divide-y">
        {items.map((item) => (
          <li key={item.id} className="px-3 py-2 space-y-1">
            <div className="flex items-center gap-2">
              {item.status === "done" && (
                <CircleCheck
                  aria-label="Déposé"
                  className="size-4 shrink-0 text-emerald-600"
                />
              )}
              {item.status === "error" && (
                <CircleAlert
                  aria-label="Refusé"
                  className="size-4 shrink-0 text-destructive"
                />
              )}
              {["waiting", "uploading"].includes(item.status) && (
                <LoaderCircle
                  aria-label="En cours"
                  className="size-4 shrink-0 text-muted-foreground animate-spin"
                />
              )}
              <span className="text-sm truncate flex-1 min-w-0">
                {item.name}
              </span>
            </div>
            {item.status === "uploading" && (
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-[width]"
                  style={{ width: `${Math.round(item.progress * 100)}%` }}
                />
              </div>
            )}
            {item.status === "error" && (
              <p className="text-xs text-destructive">{item.message}</p>
            )}
            {item.status !== "error" && (
              <p
                className={cn(
                  "text-xs text-muted-foreground truncate",
                  item.status === "uploading" && "sr-only",
                )}
              >
                {item.status === "waiting" ? "En attente · " : ""}
                {item.detail}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
