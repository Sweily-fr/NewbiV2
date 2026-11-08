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
  Mail,
  UserX,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { InputOTP } from "@/src/components/ui/input-otp";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { PdfPreview } from "@/src/components/pdf/pdf-preview";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
).replace(/\/$/, "");

/**
 * Stockage du navigateur, toujours protégé : en navigation privée ou avec les
 * données bloquées, il manque et le visiteur s'identifie à chaque visite.
 * - jeton du mot de passe : le temps de l'onglet ;
 * - session visiteur : 30 jours, comme pour un tableau kanban partagé.
 */
const store = (kind) => ({
  get(key) {
    try {
      return window[kind].getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      if (value) window[kind].setItem(key, value);
      else window[kind].removeItem(key);
    } catch {
      // Stockage indisponible
    }
  },
});
const accessStore = store("sessionStorage");
const sessionStore = store("localStorage");
const accessKey = (token) => `document-share-access:${token}`;
const sessionKey = (token) => `document-share-session:${token}`;

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok && data.success !== false, data };
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
      <div className="w-full max-w-sm space-y-4">{children}</div>
    </div>
  );
}

function ScreenHeader({ icon: Icon, title, children }) {
  return (
    <div className="text-center space-y-2">
      {Icon && (
        <div className="flex justify-center">
          <div className="size-12 rounded-full bg-[#5b4fff]/10 flex items-center justify-center">
            <Icon className="size-5 text-[#5b4fff]" />
          </div>
        </div>
      )}
      <h1 className="text-lg font-medium">{title}</h1>
      {children && <p className="text-sm text-muted-foreground">{children}</p>}
    </div>
  );
}

function ErrorText({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {children}
    </p>
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

const sharedBy = (workspace) =>
  workspace?.name ? `Documents partagés par ${workspace.name}.` : null;

function PasswordStep({ token, workspace, onDone }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { ok, data } = await postJson(
        `${API_URL}/api/public-documents/${token}/unlock`,
        { password },
      );
      if (ok) onDone(data.accessToken);
      else setError(data.message || "Une erreur est survenue");
    } catch {
      setError("Connexion impossible. Réessayez.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader icon={Lock} title="Documents protégés">
        {workspace?.name
          ? `${workspace.name} a protégé ces documents par un mot de passe.`
          : "Ces documents sont protégés par un mot de passe."}
      </ScreenHeader>
      <form onSubmit={submit} className="space-y-3">
        <Input
          type="password"
          aria-label="Mot de passe"
          placeholder="Mot de passe"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <ErrorText>{error}</ErrorText>
        <Button type="submit" className="w-full" disabled={busy || !password}>
          {busy && <LoaderCircle className="size-4 mr-2 animate-spin" />}
          Continuer
        </Button>
      </form>
    </Screen>
  );
}

/** E-mail, puis code reçu par e-mail (comme un tableau kanban partagé). */
function IdentifyStep({ token, workspace, access, onDone }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const call = async (path, body) => {
    setBusy(true);
    setError("");
    try {
      return await postJson(`${API_URL}/api/public-documents/${token}${path}`, {
        ...body,
        access,
      });
    } catch {
      return {
        ok: false,
        data: { message: "Connexion impossible. Réessayez." },
      };
    } finally {
      setBusy(false);
    }
  };

  const sendCode = async (event) => {
    event?.preventDefault();
    const { ok, data } = await call("/identify/code", { email });
    if (!ok) {
      setError(data.message || "Une erreur est survenue");
      return;
    }
    setCodeSent(true);
    setCode("");
    setInfo(`Un code à 6 chiffres a été envoyé à ${email.trim()}.`);
  };

  const verify = async (value = code) => {
    if (value.length !== 6) return;
    const { ok, data } = await call("/identify/verify", { email, code: value });
    if (ok) onDone(data.session, data.needsProfile);
    else setError(data.message || "Code incorrect ou expiré");
  };

  if (!codeSent) {
    return (
      <Screen>
        <ScreenHeader icon={Mail} title="Accéder aux documents">
          {sharedBy(workspace)} Saisissez votre adresse e-mail pour recevoir un
          code d&apos;accès.
        </ScreenHeader>
        <form onSubmit={sendCode} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="visitor-email">Adresse e-mail</Label>
            <Input
              id="visitor-email"
              type="email"
              autoComplete="email"
              placeholder="votre@email.com"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" className="w-full" disabled={busy || !email}>
            {busy && <LoaderCircle className="size-4 mr-2 animate-spin" />}
            Recevoir un code
          </Button>
        </form>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader icon={Mail} title="Vérifiez votre e-mail">
        {info}
      </ScreenHeader>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          verify();
        }}
        className="space-y-3"
      >
        <div className="flex justify-center">
          <InputOTP
            value={code}
            onChange={setCode}
            onComplete={verify}
            disabled={busy}
            autoFocus
          />
        </div>
        <ErrorText>{error}</ErrorText>
        <Button
          type="submit"
          className="w-full"
          disabled={busy || code.length !== 6}
        >
          {busy && <LoaderCircle className="size-4 mr-2 animate-spin" />}
          Valider
        </Button>
        <div className="flex justify-between text-sm">
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => {
              setCodeSent(false);
              setError("");
            }}
          >
            Changer d&apos;adresse
          </button>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            disabled={busy}
            onClick={() => sendCode()}
          >
            Renvoyer le code
          </button>
        </div>
      </form>
    </Screen>
  );
}

function ProfileStep({ token, session, onDone }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await postJson(`${API_URL}/api/public-documents/${token}/profile`, {
        session,
        firstName,
        lastName,
      });
    } finally {
      setBusy(false);
      onDone();
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Faisons connaissance">
        Votre nom permet à votre interlocuteur de savoir qui consulte les
        documents.
      </ScreenHeader>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="visitor-first-name">Prénom</Label>
            <Input
              id="visitor-first-name"
              autoComplete="given-name"
              maxLength={60}
              autoFocus
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="visitor-last-name">Nom</Label>
            <Input
              id="visitor-last-name"
              autoComplete="family-name"
              maxLength={60}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={busy || (!firstName.trim() && !lastName.trim())}
        >
          Accéder aux documents
        </Button>
      </form>
    </Screen>
  );
}

function BannedStep({ token, session, state, onSignOut, onRequested }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { ok, data } = await postJson(
        `${API_URL}/api/public-documents/${token}/access-request`,
        { session, message },
      );
      if (ok) onRequested();
      else setError(data.message || "Une erreur est survenue");
    } catch {
      setError("Connexion impossible. Réessayez.");
    } finally {
      setBusy(false);
    }
  };

  const signOut = (
    <button
      type="button"
      className="block mx-auto text-sm text-muted-foreground hover:text-foreground"
      onClick={onSignOut}
    >
      Utiliser une autre adresse
    </button>
  );

  if (state.accessRequest === "pending") {
    return (
      <Screen>
        <ScreenHeader icon={UserX} title="Demande envoyée">
          Votre demande d&apos;accès est en attente. Vous recevrez un e-mail dès
          que {state.workspace?.name || "votre interlocuteur"} y aura répondu.
        </ScreenHeader>
        {signOut}
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader icon={UserX} title="Accès retiré">
        {state.accessRequest === "rejected"
          ? "Votre demande précédente n'a pas été acceptée. Vous pouvez en faire une nouvelle."
          : `Votre accès à ces documents a été retiré. Vous pouvez demander à ${state.workspace?.name || "votre interlocuteur"} de le rétablir.`}
      </ScreenHeader>
      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="access-message">Message (facultatif)</Label>
          <Textarea
            id="access-message"
            maxLength={500}
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <ErrorText>{error}</ErrorText>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <LoaderCircle className="size-4 mr-2 animate-spin" />}
          Demander l&apos;accès
        </Button>
      </form>
      {signOut}
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

// Plusieurs dossiers partagés : accueil commun qui les liste
const HOME = "__accueil__";

function SharedFiles({ token, session, content, onSignOut }) {
  const { folders, documents, rootFolderIds, workspace, visitor } = content;
  const hasHome = rootFolderIds.length > 1;
  const [currentId, setCurrentId] = useState(hasHome ? HOME : rootFolderIds[0]);
  const [previewed, setPreviewed] = useState(null);

  const folderById = useMemo(
    () => new Map(folders.map((folder) => [folder.id, folder])),
    [folders],
  );
  const roots = new Set(rootFolderIds);
  const homeLabel = content.name || "Documents";

  const breadcrumb = useMemo(() => {
    const path = [];
    let folder = folderById.get(currentId);
    while (folder) {
      path.unshift({ id: folder.id, name: folder.name });
      folder = roots.has(folder.id) ? null : folderById.get(folder.parentId);
    }
    return hasHome ? [{ id: HOME, name: homeLabel }, ...path] : path;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, folderById, hasHome, homeLabel]);

  const byOrder = (a, b) =>
    a.order - b.order || a.name.localeCompare(b.name, "fr");
  const subfolders =
    currentId === HOME
      ? rootFolderIds.map((id) => folderById.get(id)).filter(Boolean)
      : folders.filter((folder) => folder.parentId === currentId).sort(byOrder);
  const files = documents.filter((document) => document.folderId === currentId);

  const sessionQuery = `?session=${encodeURIComponent(session)}`;
  const fileUrl = (document, kind) =>
    `${API_URL}/api/public-documents/${token}/files/${document.id}/${kind}${sessionQuery}`;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <WorkspaceIdentity workspace={workspace} />
          <div className="flex items-center gap-2 shrink-0">
            {documents.length > 0 && (
              <Button size="sm" asChild>
                <a
                  href={`${API_URL}/api/public-documents/${token}/download-all${sessionQuery}`}
                >
                  <Download className="size-4 sm:mr-2" />
                  <span className="hidden sm:inline">Tout télécharger</span>
                </a>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6">
        <nav
          aria-label="Dossiers"
          className="flex items-center flex-wrap gap-1 text-sm mb-4"
        >
          {breadcrumb.map((item, index) => {
            const isLast = index === breadcrumb.length - 1;
            return (
              <span key={item.id} className="flex items-center gap-1 min-w-0">
                {index > 0 && (
                  <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
                )}
                {isLast ? (
                  <h1 className="text-lg font-medium truncate">{item.name}</h1>
                ) : (
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground truncate"
                    onClick={() => setCurrentId(item.id)}
                  >
                    {item.name}
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

      <footer className="py-4 text-center text-xs text-muted-foreground space-y-1">
        <p>
          Connecté en tant que {visitor?.email}.{" "}
          <button
            type="button"
            className="underline hover:text-foreground"
            onClick={onSignOut}
          >
            Se déconnecter
          </button>
        </p>
        <p>Partagé avec Newbi</p>
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

  const load = useCallback(async () => {
    setState({ status: "loading" });
    const session = sessionStore.get(sessionKey(token));
    const access = accessStore.get(accessKey(token));
    const query = new URLSearchParams();
    if (session) query.set("session", session);
    if (access) query.set("access", access);
    try {
      const response = await fetch(
        `${API_URL}/api/public-documents/${token}?${query}`,
      );
      if (response.status === 404 || response.status === 410) {
        setState({ status: "closed" });
        return;
      }
      const data = await response.json();
      if (!response.ok) {
        setState({ status: "error" });
        return;
      }
      // Session refusée (expirée, mot de passe changé) : on l'oublie
      if (session && ["password", "identify"].includes(data.status)) {
        sessionStore.set(sessionKey(token), null);
      }
      setState({ ...data, session, access });
    } catch {
      setState({ status: "error" });
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const signOut = () => {
    sessionStore.set(sessionKey(token), null);
    load();
  };

  switch (state.status) {
    case "loading":
      return (
        <Screen>
          <div className="flex justify-center">
            <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
          </div>
        </Screen>
      );
    case "closed":
      return (
        <Screen>
          <ScreenHeader title="Ce lien n'est plus disponible">
            Il a expiré ou a été désactivé. Demandez un nouveau lien à votre
            interlocuteur.
          </ScreenHeader>
        </Screen>
      );
    case "password":
      return (
        <PasswordStep
          token={token}
          workspace={state.workspace}
          onDone={(accessToken) => {
            accessStore.set(accessKey(token), accessToken);
            load();
          }}
        />
      );
    case "identify":
      return (
        <IdentifyStep
          token={token}
          workspace={state.workspace}
          access={state.access}
          onDone={(session, needsProfile) => {
            sessionStore.set(sessionKey(token), session);
            if (needsProfile) setState({ status: "profile", session });
            else load();
          }}
        />
      );
    case "profile":
      return (
        <ProfileStep token={token} session={state.session} onDone={load} />
      );
    case "banned":
      return (
        <BannedStep
          token={token}
          session={state.session}
          state={state}
          onSignOut={signOut}
          onRequested={load}
        />
      );
    case "ready":
      return (
        <SharedFiles
          token={token}
          session={state.session}
          content={state}
          onSignOut={signOut}
        />
      );
    default:
      return (
        <Screen>
          <ScreenHeader title="Chargement impossible">
            Vérifiez votre connexion et réessayez.
          </ScreenHeader>
          <Button variant="outline" className="w-full" onClick={load}>
            Réessayer
          </Button>
        </Screen>
      );
  }
}
