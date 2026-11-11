"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { gql, useSubscription } from "@apollo/client";
import { LoaderCircle, Lock, Mail, UserX } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { InputOTP } from "@/src/components/ui/input-otp";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { AccessHeader, AccessScreen } from "./components/access-screen";
import { SharedFiles } from "./components/shared-files";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
).replace(/\/$/, "");

/**
 * Temps réel, comme la page publique d'un tableau kanban : un signal à
 * chaque changement (document ajouté, supprimé, déplacé, accès modifié),
 * sans contenu. La page relit alors ce qu'elle a le droit de voir.
 */
export const PUBLIC_DOCUMENT_SHARE_CHANGED = gql`
  subscription PublicDocumentShareChanged($token: String!, $session: String!) {
    publicDocumentShareChanged(token: $token, session: $session) {
      type
    }
  }
`;

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

function ErrorText({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {children}
    </p>
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
    <AccessScreen workspace={workspace}>
      <AccessHeader icon={Lock} title="Documents protégés">
        {workspace?.name
          ? `${workspace.name} a protégé ces documents par un mot de passe.`
          : "Ces documents sont protégés par un mot de passe."}
      </AccessHeader>
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
        <Button
          variant="primary"
          type="submit"
          className="w-full"
          disabled={busy || !password}
        >
          {busy && <LoaderCircle className="size-4 mr-2 animate-spin" />}
          Continuer
        </Button>
      </form>
    </AccessScreen>
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
      <AccessScreen workspace={workspace}>
        <AccessHeader icon={Mail} title="Accéder aux documents">
          {sharedBy(workspace)} Saisissez votre adresse e-mail pour recevoir un
          code d&apos;accès.
        </AccessHeader>
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
          <Button
            variant="primary"
            type="submit"
            className="w-full"
            disabled={busy || !email}
          >
            {busy && <LoaderCircle className="size-4 mr-2 animate-spin" />}
            Recevoir un code
          </Button>
        </form>
      </AccessScreen>
    );
  }

  return (
    <AccessScreen workspace={workspace}>
      <AccessHeader icon={Mail} title="Vérifiez votre e-mail">
        {info}
      </AccessHeader>
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
          variant="primary"
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
    </AccessScreen>
  );
}

function ProfileStep({ token, session, workspace, onDone }) {
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
    <AccessScreen workspace={workspace}>
      <AccessHeader title="Faisons connaissance">
        Votre nom permet à votre interlocuteur de savoir qui consulte les
        documents.
      </AccessHeader>
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
          variant="primary"
          type="submit"
          className="w-full"
          disabled={busy || (!firstName.trim() && !lastName.trim())}
        >
          Accéder aux documents
        </Button>
      </form>
    </AccessScreen>
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
      <AccessScreen workspace={state.workspace}>
        <AccessHeader icon={UserX} title="Demande envoyée">
          Votre demande d&apos;accès est en attente. Vous recevrez un e-mail dès
          que {state.workspace?.name || "votre interlocuteur"} y aura répondu.
        </AccessHeader>
        {signOut}
      </AccessScreen>
    );
  }

  return (
    <AccessScreen workspace={state.workspace}>
      <AccessHeader icon={UserX} title="Accès retiré">
        {state.accessRequest === "rejected"
          ? "Votre demande précédente n'a pas été acceptée. Vous pouvez en faire une nouvelle."
          : `Votre accès à ces documents a été retiré. Vous pouvez demander à ${state.workspace?.name || "votre interlocuteur"} de le rétablir.`}
      </AccessHeader>
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
        <Button
          variant="primary"
          type="submit"
          className="w-full"
          disabled={busy}
        >
          {busy && <LoaderCircle className="size-4 mr-2 animate-spin" />}
          Demander l&apos;accès
        </Button>
      </form>
      {signOut}
    </AccessScreen>
  );
}

export default function PublicDocumentsPage({ params }) {
  const { token } = use(params);
  const [state, setState] = useState({ status: "loading" });

  const load = useCallback(async () => {
    // L'entreprise reste affichée pendant le chargement (pas de clignotement)
    setState((previous) => ({
      status: "loading",
      workspace: previous.workspace,
    }));
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

  /**
   * Relecture sans écran de chargement (temps réel, après un dépôt) : la
   * page reste sur le dossier ouvert. Hors ligne, l'affichage est gardé.
   */
  const refresh = useCallback(async () => {
    const session = sessionStore.get(sessionKey(token));
    const access = accessStore.get(accessKey(token));
    const query = new URLSearchParams({ refresh: "1" });
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
      if (!response.ok) return;
      const data = await response.json();
      if (session && ["password", "identify"].includes(data.status)) {
        sessionStore.set(sessionKey(token), null);
      }
      setState({ ...data, session, access });
    } catch {
      // Hors ligne : la prochaine relecture rattrapera
    }
  }, [token]);

  // Plusieurs signaux rapprochés (dépôt de dix fichiers) : une relecture
  const refreshTimer = useRef(null);
  const scheduleRefresh = useCallback(() => {
    clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(refresh, 400);
  }, [refresh]);
  useEffect(() => () => clearTimeout(refreshTimer.current), []);

  const isReady = state.status === "ready" && Boolean(state.session);
  useSubscription(PUBLIC_DOCUMENT_SHARE_CHANGED, {
    variables: { token, session: state.session || "" },
    skip: !isReady,
    onData: scheduleRefresh,
    // Connexion perdue : les relectures au retour sur la page compensent
    onError: () => {},
  });

  // Retour sur l'onglet ou sur le réseau : rattraper ce qui a pu être manqué
  useEffect(() => {
    if (!isReady) return undefined;
    const onVisible = () => {
      if (document.visibilityState === "visible") scheduleRefresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", scheduleRefresh);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", scheduleRefresh);
    };
  }, [isReady, scheduleRefresh]);

  const signOut = () => {
    sessionStore.set(sessionKey(token), null);
    load();
  };

  switch (state.status) {
    case "loading":
      return (
        <AccessScreen workspace={state.workspace}>
          <div className="flex justify-center">
            <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
          </div>
        </AccessScreen>
      );
    case "closed":
      return (
        <AccessScreen>
          <AccessHeader title="Ce lien n'est plus disponible">
            Il a expiré ou a été désactivé. Demandez un nouveau lien à votre
            interlocuteur.
          </AccessHeader>
        </AccessScreen>
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
            if (needsProfile) {
              setState({
                status: "profile",
                session,
                workspace: state.workspace,
              });
            } else load();
          }}
        />
      );
    case "profile":
      return (
        <ProfileStep
          token={token}
          session={state.session}
          workspace={state.workspace}
          onDone={load}
        />
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
    case "ready": {
      const sessionQuery = `?session=${encodeURIComponent(state.session)}`;
      const base = `${API_URL}/api/public-documents/${token}`;
      return (
        <SharedFiles
          content={state}
          fileUrl={(document, kind) =>
            `${base}/files/${document.id}/${kind}${sessionQuery}`
          }
          downloadAllUrl={`${base}/download-all${sessionQuery}`}
          uploadUrl={(folderId) =>
            `${base}/folders/${folderId}/files${sessionQuery}`
          }
          onDelete={async (document) => {
            const response = await fetch(
              `${base}/files/${document.id}${sessionQuery}`,
              { method: "DELETE" },
            );
            const data = await response.json().catch(() => ({}));
            if (!response.ok || data.success === false) {
              throw new Error(data.message || "Suppression impossible");
            }
            scheduleRefresh();
          }}
          onChanged={scheduleRefresh}
          onSignOut={signOut}
        />
      );
    }
    default:
      return (
        <AccessScreen>
          <AccessHeader title="Chargement impossible">
            Vérifiez votre connexion et réessayez.
          </AccessHeader>
          <Button variant="outline" className="w-full" onClick={load}>
            Réessayer
          </Button>
        </AccessScreen>
      );
  }
}
