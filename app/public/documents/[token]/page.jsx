"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ChevronRight,
  Download,
  Eye,
  File as FileIcon,
  FolderClosed,
  LoaderCircle,
  Lock,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { PdfPreview } from "@/src/components/pdf/pdf-preview";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
).replace(/\/$/, "");

// Le jeton remis après le mot de passe évite de le redemander au rechargement
const accessStorageKey = (token) => `document-share-access:${token}`;

function readStoredAccess(token) {
  try {
    return sessionStorage.getItem(accessStorageKey(token));
  } catch {
    return null;
  }
}

function storeAccess(token, value) {
  try {
    sessionStorage.setItem(accessStorageKey(token), value);
  } catch {
    // Stockage indisponible : le mot de passe sera redemandé au rechargement
  }
}

function formatFileSize(bytes) {
  if (!bytes) return "0 o";
  const units = ["o", "Ko", "Mo", "Go"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** index;
  return `${index === 0 ? value : value.toFixed(1).replace(".", ",")} ${units[index]}`;
}

/** Forme d'aperçu d'un document, null s'il se télécharge seulement. */
function previewKind(document) {
  const type = (document.mimeType || "").toLowerCase();
  if (type === "application/pdf" || /\.pdf$/i.test(document.name)) return "pdf";
  if (
    [
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/webp",
      "image/heic",
      "image/heif",
    ].includes(type)
  ) {
    return "image";
  }
  if (
    ["video/mp4", "video/webm", "video/quicktime", "video/ogg"].includes(type)
  ) {
    return "video";
  }
  if (type.startsWith("audio/")) return "audio";
  return null;
}

function Screen({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-3">{children}</div>
    </div>
  );
}

function WorkspaceIdentity({ workspace }) {
  if (!workspace?.name && !workspace?.logo) return null;
  return (
    <div className="flex items-center gap-3 min-w-0">
      {workspace.logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={workspace.logo}
          alt=""
          className="h-9 w-9 rounded-md object-contain shrink-0"
        />
      )}
      {workspace.name && (
        <span className="font-medium truncate">{workspace.name}</span>
      )}
    </div>
  );
}

function PasswordScreen({ token, workspace, onUnlocked }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setChecking(true);
    setError("");
    try {
      const response = await fetch(
        `${API_URL}/api/public-documents/${token}/unlock`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success) {
        onUnlocked(data.accessToken);
        return;
      }
      setError(data.message || "Une erreur est survenue");
    } catch {
      setError("Connexion impossible. Réessayez.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <Screen>
      <div className="flex justify-center">
        <div className="size-12 rounded-full bg-[#5b4fff]/10 flex items-center justify-center">
          <Lock className="size-5 text-[#5b4fff]" />
        </div>
      </div>
      <h1 className="text-lg font-medium">Documents protégés</h1>
      <p className="text-sm text-muted-foreground">
        {workspace?.name
          ? `${workspace.name} a protégé ces documents par un mot de passe.`
          : "Ces documents sont protégés par un mot de passe."}
      </p>
      <form onSubmit={submit} className="space-y-3 pt-2 text-left">
        <Input
          type="password"
          aria-label="Mot de passe"
          placeholder="Mot de passe"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={checking || !password}
        >
          {checking && <LoaderCircle className="size-4 mr-2 animate-spin" />}
          Accéder aux documents
        </Button>
      </form>
    </Screen>
  );
}

function PreviewDialog({ document, previewUrl, downloadUrl, onClose }) {
  const kind = document ? previewKind(document) : null;
  return (
    <Dialog
      open={Boolean(document)}
      onOpenChange={(next) => !next && onClose()}
    >
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 pr-8">
          <DialogTitle className="text-base truncate flex-1 min-w-0">
            {document?.name}
          </DialogTitle>
          <Button size="sm" variant="outline" className="shrink-0" asChild>
            <a href={downloadUrl}>
              <Download className="size-4 mr-2" />
              Télécharger
            </a>
          </Button>
        </div>
        <div className="flex justify-center min-h-40">
          {kind === "pdf" && (
            <div className="w-full">
              <PdfPreview
                src={previewUrl}
                fallback={
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aperçu indisponible. Téléchargez le document pour le
                    consulter.
                  </p>
                }
              />
            </div>
          )}
          {kind === "image" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={document.name}
              className="max-h-[75vh] object-contain"
            />
          )}
          {kind === "video" && (
            <video src={previewUrl} controls className="max-h-[75vh] w-full" />
          )}
          {kind === "audio" && (
            <audio src={previewUrl} controls className="w-full self-center" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SharedFiles({ token, access, content }) {
  const { folders, documents, rootFolderId, workspace } = content;
  const [currentId, setCurrentId] = useState(rootFolderId);
  const [previewed, setPreviewed] = useState(null);

  const folderById = useMemo(
    () => new Map(folders.map((folder) => [folder.id, folder])),
    [folders],
  );

  const breadcrumb = useMemo(() => {
    const path = [];
    let folder = folderById.get(currentId);
    while (folder) {
      path.unshift(folder);
      folder =
        folder.id === rootFolderId ? null : folderById.get(folder.parentId);
    }
    return path;
  }, [currentId, folderById, rootFolderId]);

  const subfolders = folders
    .filter((folder) => folder.parentId === currentId)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "fr"));
  const files = documents.filter((document) => document.folderId === currentId);

  const accessQuery = access ? `?access=${encodeURIComponent(access)}` : "";
  const fileUrl = (document, kind) =>
    `${API_URL}/api/public-documents/${token}/files/${document.id}/${kind}${accessQuery}`;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <WorkspaceIdentity workspace={workspace} />
          {documents.length > 0 && (
            <Button size="sm" className="shrink-0" asChild>
              <a
                href={`${API_URL}/api/public-documents/${token}/download-all${accessQuery}`}
              >
                <Download className="size-4 sm:mr-2" />
                <span className="hidden sm:inline">Tout télécharger</span>
              </a>
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6">
        <nav
          aria-label="Dossiers"
          className="flex items-center flex-wrap gap-1 text-sm mb-4"
        >
          {breadcrumb.map((folder, index) => {
            const isLast = index === breadcrumb.length - 1;
            return (
              <span key={folder.id} className="flex items-center gap-1 min-w-0">
                {index > 0 && (
                  <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
                )}
                {isLast ? (
                  <h1 className="text-lg font-medium truncate">
                    {folder.name}
                  </h1>
                ) : (
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground truncate"
                    onClick={() => setCurrentId(folder.id)}
                  >
                    {folder.name}
                  </button>
                )}
              </span>
            );
          })}
        </nav>

        {subfolders.length === 0 && files.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-16">
            Ce dossier est vide.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {subfolders.map((folder) => (
              <li key={folder.id}>
                <button
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm hover:bg-muted/50"
                  onClick={() => setCurrentId(folder.id)}
                >
                  <FolderClosed className="size-4 text-muted-foreground shrink-0" />
                  <span className="truncate flex-1 min-w-0 font-medium">
                    {folder.name}
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                </button>
              </li>
            ))}
            {files.map((document) => (
              <li
                key={document.id}
                className="flex items-center gap-3 px-4 py-3 text-sm"
              >
                <FileIcon className="size-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="truncate">{document.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(document.fileSize)}
                    {document.createdAt &&
                      ` · ${format(new Date(document.createdAt), "d MMM yyyy", { locale: fr })}`}
                  </p>
                </div>
                {previewKind(document) && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 shrink-0"
                    aria-label={`Voir ${document.name}`}
                    onClick={() => setPreviewed(document)}
                  >
                    <Eye className="size-4" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 shrink-0"
                  aria-label={`Télécharger ${document.name}`}
                  asChild
                >
                  <a href={fileUrl(document, "download")}>
                    <Download className="size-4" />
                  </a>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </main>

      <footer className="py-4 text-center text-xs text-muted-foreground">
        Partagé avec Newbi
      </footer>

      <PreviewDialog
        document={previewed}
        previewUrl={previewed ? fileUrl(previewed, "preview") : undefined}
        downloadUrl={previewed ? fileUrl(previewed, "download") : undefined}
        onClose={() => setPreviewed(null)}
      />
    </div>
  );
}

export default function PublicDocumentsPage({ params }) {
  const { token } = use(params);
  const [state, setState] = useState({ status: "loading" });

  const load = useCallback(
    async (access) => {
      setState({ status: "loading" });
      const query = access ? `?access=${encodeURIComponent(access)}` : "";
      try {
        const response = await fetch(
          `${API_URL}/api/public-documents/${token}${query}`,
        );
        if (response.status === 404 || response.status === 410) {
          setState({ status: "closed" });
          return;
        }
        const data = await response.json();
        if (!response.ok) {
          setState({ status: "error" });
        } else if (data.requiresPassword) {
          setState({ status: "password", workspace: data.workspace });
        } else {
          setState({ status: "ready", access, content: data });
        }
      } catch {
        setState({ status: "error" });
      }
    },
    [token],
  );

  useEffect(() => {
    load(readStoredAccess(token));
  }, [load, token]);

  if (state.status === "loading") {
    return (
      <Screen>
        <div className="flex justify-center">
          <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
        </div>
      </Screen>
    );
  }

  if (state.status === "closed") {
    return (
      <Screen>
        <h1 className="text-lg font-medium">
          Ce lien n&apos;est plus disponible
        </h1>
        <p className="text-sm text-muted-foreground">
          Il a expiré ou a été désactivé. Demandez un nouveau lien à votre
          interlocuteur.
        </p>
      </Screen>
    );
  }

  if (state.status === "error") {
    return (
      <Screen>
        <h1 className="text-lg font-medium">Chargement impossible</h1>
        <p className="text-sm text-muted-foreground">
          Vérifiez votre connexion et réessayez.
        </p>
        <Button variant="outline" onClick={() => load(readStoredAccess(token))}>
          Réessayer
        </Button>
      </Screen>
    );
  }

  if (state.status === "password") {
    return (
      <PasswordScreen
        token={token}
        workspace={state.workspace}
        onUnlocked={(accessToken) => {
          storeAccess(token, accessToken);
          load(accessToken);
        }}
      />
    );
  }

  return (
    <SharedFiles token={token} access={state.access} content={state.content} />
  );
}
