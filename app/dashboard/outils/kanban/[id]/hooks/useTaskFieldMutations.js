import { useMemo } from "react";
import { gql, useApolloClient } from "@apollo/client";
import { toast } from "@/src/utils/debouncedToast";
import {
  ASSIGN_TASK_MEMBER,
  UNASSIGN_TASK_MEMBER,
  ADD_TASK_TAG,
  REMOVE_TASK_TAG,
  ADD_CHECKLIST_ITEM,
  UPDATE_CHECKLIST_ITEM,
  REMOVE_CHECKLIST_ITEM,
} from "@/src/graphql/kanbanQueries";

// ── Membres, tags et checklist : un élément à la fois ──────────────────────
// updateTask remplaçait le tableau complet : deux personnes qui modifiaient
// la même tâche en même temps s'écrasaient. Ces mutations n'envoient que
// l'élément ajouté / retiré / modifié.
//
// - Affichage immédiat : calque optimiste du cache Apollo sur l'entité Task
//   (cartes, liste, Gantt), rejoué par Apollo au-dessus de l'état serveur
//   tant que la mutation est en cours, retiré à la réponse (ou à l'erreur :
//   retour à la vérité serveur).
// - Ordre garanti par tâche : les requêtes d'une même tâche partent l'une
//   après l'autre (ajouter puis cocher un élément, assigner puis retirer un
//   membre d'un double clic), sinon le serveur pourrait les traiter dans le
//   désordre.

const MEMBERS_FRAGMENT = gql`
  fragment TaskFieldOpsMembers on Task {
    assignedMembers
  }
`;
const TAGS_FRAGMENT = gql`
  fragment TaskFieldOpsTags on Task {
    tags {
      name
      className
      bg
      text
      border
    }
  }
`;
const CHECKLIST_FRAGMENT = gql`
  fragment TaskFieldOpsChecklist on Task {
    checklist {
      id
      text
      completed
    }
  }
`;

const OBJECT_ID_PATTERN = /^[0-9a-f]{24}$/i;

/** Identifiant d'élément de checklist connu du serveur (ObjectId). */
export const isServerChecklistId = (id) =>
  typeof id === "string" && OBJECT_ID_PATTERN.test(id);

/**
 * Identifiant d'un nouvel élément de checklist, généré localement au format
 * ObjectId (horodatage + aléa) : l'élément s'affiche et se coche tout de
 * suite, l'API garde cet id.
 */
export const newChecklistItemId = () => {
  const seconds = Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, "0");
  const bytes = new Uint8Array(8);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  const random = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
  return `${seconds}${random.join("")}`.slice(0, 24);
};

/** Tag au format TagInput (sans __typename, couleurs vides par défaut). */
export const cleanTagInput = (tag) => ({
  name: String(tag?.name || "").trim(),
  className: tag?.className || "",
  bg: tag?.bg || "",
  text: tag?.text || "",
  border: tag?.border || "",
});

const sameName = (a, b) =>
  String(a || "").toLowerCase() === String(b || "").toLowerCase();

// File d'attente par tâche, partagée par tous les composants (carte, liste,
// modal) : une seule requête à la fois par tâche
const queues = new Map();
const enqueue = (taskId, send) => {
  const previous = queues.get(taskId) || Promise.resolve();
  const next = previous.catch(() => {}).then(send);
  queues.set(taskId, next);
  next
    .catch(() => {})
    .finally(() => {
      if (queues.get(taskId) === next) queues.delete(taskId);
    });
  return next;
};

let layerCounter = 0;

/**
 * Mutations atomiques liées à un client Apollo et un espace.
 * Chaque fonction renvoie une promesse de la tâche renvoyée par l'API
 * (champ modifié seulement) et rejette en cas d'erreur (toast affiché).
 */
export const createTaskFieldMutations = (client, workspaceId) => {
  const run = (taskId, { mutation, variables, fragment, optimistic }) => {
    const cache = client.cache;
    const entityId = cache.identify({ __typename: "Task", id: taskId });
    const layerId = `task-field-op-${(layerCounter += 1)}`;
    let layered = false;
    if (entityId && fragment && optimistic) {
      cache.recordOptimisticTransaction((proxy) => {
        let current = null;
        try {
          current = proxy.readFragment({ id: entityId, fragment });
        } catch {
          current = null;
        }
        // Champ absent du cache : pas d'affichage anticipé, la réponse
        // mettra l'entité à jour
        if (!current) return;
        proxy.writeFragment({
          id: entityId,
          fragment,
          data: { __typename: "Task", ...optimistic(current) },
        });
      }, layerId);
      layered = true;
    }

    return enqueue(taskId, async () => {
      const result = await client.mutate({
        mutation,
        variables: { ...variables, taskId, workspaceId },
        errorPolicy: "none",
      });
      return result?.data ? Object.values(result.data)[0] : null;
    })
      .catch((error) => {
        toast.error("Erreur lors de la modification de la tâche");
        throw error;
      })
      .finally(() => {
        if (layered) cache.removeOptimistic(layerId);
      });
  };

  return {
    /** Assigne (assign = true) ou retire un membre. */
    setMember: (taskId, memberId, assign) =>
      run(taskId, {
        mutation: assign ? ASSIGN_TASK_MEMBER : UNASSIGN_TASK_MEMBER,
        variables: { memberId },
        fragment: MEMBERS_FRAGMENT,
        optimistic: ({ assignedMembers }) => {
          const current = (assignedMembers || []).filter(
            (id) => id !== memberId,
          );
          return {
            assignedMembers: assign ? [...current, memberId] : current,
          };
        },
      }),

    addTag: (taskId, tag) => {
      const clean = cleanTagInput(tag);
      return run(taskId, {
        mutation: ADD_TASK_TAG,
        variables: { tag: clean },
        fragment: TAGS_FRAGMENT,
        optimistic: ({ tags }) => ({
          tags: (tags || []).some((t) => sameName(t.name, clean.name))
            ? tags
            : [...(tags || []), { __typename: "Tag", ...clean }],
        }),
      });
    },

    removeTag: (taskId, tagName) =>
      run(taskId, {
        mutation: REMOVE_TASK_TAG,
        variables: { tagName },
        fragment: TAGS_FRAGMENT,
        optimistic: ({ tags }) => ({
          tags: (tags || []).filter((t) => !sameName(t.name, tagName)),
        }),
      }),

    /** item : { id (newChecklistItemId), text, completed } */
    addChecklistItem: (taskId, item) =>
      run(taskId, {
        mutation: ADD_CHECKLIST_ITEM,
        variables: {
          itemId: item.id,
          text: item.text,
          completed: Boolean(item.completed),
        },
        fragment: CHECKLIST_FRAGMENT,
        optimistic: ({ checklist }) => ({
          checklist: (checklist || []).some((i) => i.id === item.id)
            ? checklist
            : [
                ...(checklist || []),
                {
                  __typename: "ChecklistItem",
                  id: item.id,
                  text: item.text,
                  completed: Boolean(item.completed),
                },
              ],
        }),
      }),

    /** changes : { text?, completed? } */
    updateChecklistItem: (taskId, itemId, changes) =>
      run(taskId, {
        mutation: UPDATE_CHECKLIST_ITEM,
        variables: { itemId, ...changes },
        fragment: CHECKLIST_FRAGMENT,
        optimistic: ({ checklist }) => ({
          checklist: (checklist || []).map((i) =>
            i.id === itemId ? { ...i, ...changes } : i,
          ),
        }),
      }),

    removeChecklistItem: (taskId, itemId) =>
      run(taskId, {
        mutation: REMOVE_CHECKLIST_ITEM,
        variables: { itemId },
        fragment: CHECKLIST_FRAGMENT,
        optimistic: ({ checklist }) => ({
          checklist: (checklist || []).filter((i) => i.id !== itemId),
        }),
      }),
  };
};

/**
 * Mutations atomiques membres / tags / checklist pour un espace.
 * @param {string} workspaceId
 */
export function useTaskFieldMutations(workspaceId) {
  const client = useApolloClient();
  return useMemo(
    () => createTaskFieldMutations(client, workspaceId),
    [client, workspaceId],
  );
}
