"use client";

import { forwardRef, useCallback, useState } from "react";
import { DescriptionEditor } from "./DescriptionEditor";
import { CollaborativeDescriptionEditor } from "./CollaborativeDescriptionEditor";
import { isCollabDescriptionEnabled, markCollabFallback } from "./collabConfig";

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
      <CollaborativeDescriptionEditor
        ref={ref}
        taskId={taskId}
        user={user}
        onFocus={editorProps.onFocus}
        onBlur={editorProps.onBlur}
        placeholder={editorProps.placeholder}
        onUnavailable={onUnavailable}
      />
    );
  }
  return <DescriptionEditor ref={ref} {...editorProps} />;
});
