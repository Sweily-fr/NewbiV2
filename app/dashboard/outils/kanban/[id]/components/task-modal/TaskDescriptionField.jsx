"use client";

import {
  forwardRef,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useState,
} from "react";
import { DescriptionEditor } from "./DescriptionEditor";
import { isCollabDescriptionEnabled, markCollabFallback } from "./collabConfig";

// Éditeur collaboratif (TipTap + ProseMirror + Yjs + Hocuspocus, ~170 kB gz)
// chargé à la demande : importé statiquement, il alourdissait l'ouverture de
// chaque tableau alors qu'il ne sert qu'à l'ouverture d'une tâche.
// preloadCollaborativeDescriptionEditor() le télécharge en avance.
const loadCollaborativeEditor = () =>
  import("./CollaborativeDescriptionEditor");

// Chunk introuvable (réseau coupé, déploiement entre-temps) : on signale
// l'indisponibilité comme une panne du serveur collab, l'éditeur classique
// prend le relais.
function CollaborativeEditorLoadFailed({ onUnavailable }) {
  useEffect(() => {
    onUnavailable?.("chunk");
  }, [onUnavailable]);
  return null;
}

const CollaborativeDescriptionEditor = lazy(() =>
  loadCollaborativeEditor()
    .then((m) => ({ default: m.CollaborativeDescriptionEditor }))
    .catch(() => ({ default: CollaborativeEditorLoadFailed })),
);

export function preloadCollaborativeDescriptionEditor() {
  if (!isCollabDescriptionEnabled()) return;
  loadCollaborativeEditor().catch(() => {});
}

// Cadre de l'éditeur pendant le téléchargement du chunk (même gabarit que
// CollaborativeDescriptionEditor, sans contenu éditable pour ne rien perdre).
function DescriptionEditorPlaceholder() {
  return (
    <div className="flex flex-col rounded-xl border border-[#eeeff1] dark:border-[#232323] bg-white dark:bg-[#1a1a1a] shadow-xs overflow-hidden min-w-0">
      <div className="h-[41px] border-b border-[#eeeff1] dark:border-[#232323]" />
      <div className="px-4 py-3 min-h-[100px]">
        <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Choisit l'éditeur de description : collaboratif (lettre par lettre) quand le
 * drapeau est actif et que la tâche existe, sinon l'éditeur classique. Si le
 * serveur collab est injoignable, on retombe sur l'éditeur classique pour la
 * durée d'ouverture de la modale (l'auto-save reprend alors la main).
 */
export const TaskDescriptionField = forwardRef(function TaskDescriptionField(
  { taskId, user, ...editorProps },
  ref,
) {
  const [unavailable, setUnavailable] = useState(false);
  const onUnavailable = useCallback((reason) => {
    console.warn(
      `[Collab] Édition partagée indisponible (${reason}), éditeur classique`,
    );
    setUnavailable(true);
  }, []);

  if (isCollabDescriptionEnabled() && taskId && !unavailable) {
    return (
      <Suspense fallback={<DescriptionEditorPlaceholder />}>
        <CollaborativeDescriptionEditor
          ref={ref}
          taskId={taskId}
          user={user}
          onFocus={editorProps.onFocus}
          onBlur={editorProps.onBlur}
          placeholder={editorProps.placeholder}
          readOnly={editorProps.readOnly}
          onUnavailable={onUnavailable}
        />
      </Suspense>
    );
  }
  return <DescriptionEditor ref={ref} {...editorProps} />;
});
