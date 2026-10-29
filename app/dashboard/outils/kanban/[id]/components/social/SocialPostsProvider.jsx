"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  POLL_INTERVAL_MS,
  shouldPollSocialPosts,
  useBoardSocialPosts,
  useSocialPostMutations,
  useSocialPublishingStatus,
} from "@/src/hooks/useSocialPublishing";

// Chargée à la première ouverture : rien de plus à télécharger pour un
// tableau qui ne programme pas de post
const SocialPostModal = dynamic(
  () => import("./SocialPostModal").then((m) => m.SocialPostModal),
  { ssr: false },
);

const noopSubscribe = () => () => {};

/**
 * Posts par carte, lus par chaque badge via useSyncExternalStore : seuls les
 * badges dont le post change re-rendent (pas les 300 cartes du tableau).
 * Les posts viennent du cache Apollo, normalisés par id : un post inchangé
 * garde sa référence d'une requête à l'autre.
 */
function createPostsStore() {
  let byTask = new Map();
  const listeners = new Set();
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    get(taskId) {
      return (taskId && byTask.get(String(taskId))) || null;
    },
    setPosts(posts) {
      const next = new Map();
      for (const post of posts || []) {
        if (post?.taskId) next.set(String(post.taskId), post);
      }
      let changed = next.size !== byTask.size;
      if (!changed) {
        for (const [taskId, post] of next) {
          if (byTask.get(taskId) !== post) {
            changed = true;
            break;
          }
        }
      }
      byTask = next;
      if (changed) listeners.forEach((l) => l());
    },
  };
}

const SocialPostsStoreContext = createContext(null);
const SocialPublishingContext = createContext(null);

/** Post réseaux sociaux lié à une carte (null sinon) */
export function useTaskSocialPost(taskId) {
  const store = useContext(SocialPostsStoreContext);
  const getSnapshot = useCallback(
    () => (store ? store.get(taskId) : null),
    [store, taskId],
  );
  return useSyncExternalStore(
    store ? store.subscribe : noopSubscribe,
    getSnapshot,
    () => null,
  );
}

/** Fonctionnalité, droits et actions (null hors de la page du tableau) */
export function useSocialPublishing() {
  return useContext(SocialPublishingContext);
}

/**
 * Monté par la page du tableau : état de la fonctionnalité, posts du
 * tableau, fenêtre de programmation (création et modification).
 */
export function SocialPostsProvider({
  boardId,
  workspaceId,
  columns,
  canCreate = true,
  canEdit = true,
  isReadOnly = false,
  children,
}) {
  const status = useSocialPublishingStatus(workspaceId);
  const enabled = status.enabled;

  const { posts, startPolling, stopPolling } = useBoardSocialPosts({
    boardId,
    workspaceId,
    enabled,
  });

  const store = useMemo(createPostsStore, [boardId]);
  useEffect(() => {
    store.setPosts(enabled ? posts : []);
  }, [store, posts, enabled]);

  // Rafraîchissement : seulement quand une publication approche ou est en
  // cours. Réévalué chaque minute tant qu'un post est programmé.
  const postsRef = useRef(posts);
  postsRef.current = posts;
  useEffect(() => {
    if (!enabled) return undefined;
    let polling = false;
    const apply = () => {
      const needed = shouldPollSocialPosts(postsRef.current, new Date());
      if (needed && !polling) startPolling(POLL_INTERVAL_MS);
      if (!needed && polling) stopPolling();
      polling = needed;
    };
    apply();
    const hasPending = posts.some(
      (p) => p.status === "scheduled" || p.status === "publishing",
    );
    const timer = hasPending ? setInterval(apply, 60 * 1000) : null;
    return () => {
      if (timer) clearInterval(timer);
      if (polling) stopPolling();
    };
  }, [enabled, posts, startPolling, stopPolling]);

  const mutations = useSocialPostMutations({ boardId, workspaceId });

  // Fenêtre de programmation : { open, post (modification), restoreDraft }
  const [composer, setComposer] = useState({
    open: false,
    post: null,
    restoreDraft: false,
  });
  const [composerMounted, setComposerMounted] = useState(false);
  const openComposer = useCallback((options = {}) => {
    setComposerMounted(true);
    setComposer({
      open: true,
      post: options.post || null,
      restoreDraft: !!options.restoreDraft,
    });
  }, []);
  const closeComposer = useCallback(() => {
    setComposer((prev) => ({ ...prev, open: false }));
  }, []);

  const canSchedule = enabled && canCreate && status.canSchedule;

  // Retour d'une connexion lancée depuis la fenêtre (?socialPost=new) : on
  // la rouvre avec le brouillon, puis on nettoie l'adresse
  const searchParams = useSearchParams();
  const wantsComposer = searchParams?.get("socialPost") === "new";
  useEffect(() => {
    if (!wantsComposer || !status.loaded) return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("socialPost");
      window.history.replaceState(null, "", url.pathname + url.search);
    } catch {
      // Adresse non modifiable : sans conséquence
    }
    if (canSchedule && !isReadOnly) openComposer({ restoreDraft: true });
  }, [wantsComposer, status.loaded, canSchedule, isReadOnly, openComposer]);

  const value = useMemo(
    () => ({
      enabled,
      status,
      boardId,
      workspaceId,
      columns: columns || [],
      canSchedule,
      canEdit: enabled && canEdit,
      isReadOnly,
      mutations,
      openComposer,
    }),
    [
      enabled,
      status,
      boardId,
      workspaceId,
      columns,
      canSchedule,
      canEdit,
      isReadOnly,
      mutations,
      openComposer,
    ],
  );

  return (
    <SocialPublishingContext.Provider value={value}>
      <SocialPostsStoreContext.Provider value={store}>
        {children}
        {enabled && composerMounted && (
          <SocialPostModal
            open={composer.open}
            onClose={closeComposer}
            post={composer.post}
            restoreDraft={composer.restoreDraft}
          />
        )}
      </SocialPostsStoreContext.Provider>
    </SocialPublishingContext.Provider>
  );
}

/**
 * Bouton « Programmer un post » de la barre d'onglets. Masqué si la
 * fonctionnalité est désactivée ou si le rôle ne permet pas de créer.
 * Icône seule sur mobile.
 */
export function ScheduleSocialPostButton({ disabled, title }) {
  const social = useSocialPublishing();
  if (!social?.canSchedule) return null;
  return (
    <Button
      variant="outline"
      className="cursor-pointer"
      onClick={() => social.openComposer()}
      disabled={disabled}
      title={title || "Programmer un post sur les réseaux sociaux"}
      aria-label="Programmer un post"
    >
      <Send size={14} strokeWidth={2} aria-hidden="true" />
      <span className="hidden sm:inline">Programmer un post</span>
    </Button>
  );
}
