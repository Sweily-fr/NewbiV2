import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { toast } from "@/src/utils/debouncedToast";
import {
  useMutation,
  useLazyQuery,
  useApolloClient,
  gql,
} from "@apollo/client";
import {
  CREATE_TASK,
  UPDATE_TASK,
  DELETE_TASK,
  MOVE_TASK,
  ADD_COMMENT,
  GET_BOARD,
  GET_TASK_DETAILS,
  START_TIMER,
} from "@/src/graphql/kanbanQueries";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { computeAutoSaveSignature } from "./taskFormSignature";
import { isDescriptionHandledByCollab } from "../components/task-modal/collabConfig";
import { perfMark } from "@/src/utils/kanbanPerf";
import {
  useTaskFieldMutations,
  isServerChecklistId,
  newChecklistItemId,
  cleanTagInput,
} from "./useTaskFieldMutations";

// Listes de la tâche ouverte, relues dans le cache (calques optimistes
// compris) pour réaligner le modal une fois les modifications envoyées
const TASK_LISTS_FRAGMENT = gql`
  fragment TaskModalLists on Task {
    assignedMembers
    tags {
      name
      className
      bg
      text
      border
    }
    checklist {
      id
      text
      completed
    }
  }
`;

const UPLOAD_TASK_IMAGE = gql`
  mutation UploadTaskImage(
    $taskId: ID!
    $file: Upload!
    $imageType: String
    $workspaceId: ID
  ) {
    uploadTaskImage(
      taskId: $taskId
      file: $file
      imageType: $imageType
      workspaceId: $workspaceId
    ) {
      success
      image {
        id
        key
        url
        fileName
        fileSize
        contentType
        uploadedBy
        uploadedAt
      }
      message
    }
  }
`;

// Au niveau module pour ne PAS être recréé à chaque render du hook
// (sinon les useCallback qui en dépendent voient une nouvelle référence)
const INITIAL_TASK_FORM = Object.freeze({
  title: "",
  description: "",
  status: "TODO",
  priority: "",
  startDate: "",
  dueDate: "",
  tags: [],
  checklist: [],
  assignedMembers: [],
  linkedTasks: [],
  images: [],
  newTag: "",
  newChecklistItem: "",
  pendingComments: [],
  pendingFiles: [],
  timeTracking: null,
});

// ── Fusion temps réel sans perdre la frappe ──────────────────────────────
// Quand un autre membre modifie la tâche ouverte (déplacement de colonne,
// tag…), on ne peut pas écraser tout le formulaire : la collègue en train
// d'écrire une description perdrait son texte. On garde donc en mémoire la
// dernière valeur connue du serveur pour chaque champ synchronisable ; un
// champ local différent de cette valeur est « sale » (en cours d'édition) et
// conserve sa valeur locale, les autres prennent la valeur distante.
const SYNCED_SCALAR_FIELDS = [
  "title",
  "description",
  "status",
  "priority",
  "startDate",
  "dueDate",
  "columnId",
];
// Comparaison texte + état (les éléments sans id serveur reçoivent un id local)
const checklistKey = (list) =>
  Array.isArray(list)
    ? list.map((i) => `${i?.text || ""}:${i?.completed ? 1 : 0}`).join("|")
    : "";
const normalizeChecklist = (list) =>
  list.map((item, index) => ({
    id: item?.id || `checklist-item-${index}-${Date.now()}`,
    text: item?.text || "",
    completed: Boolean(item?.completed),
  }));

// Instantané « côté serveur » des champs synchronisables d'un formulaire.
// Membres, tags et checklist n'en font plus partie : ils sont envoyés
// élément par élément dès le clic (voir taskFieldOps), jamais par l'auto-save.
const serverSnapshotOf = (form) => ({
  title: form.title ?? "",
  description: form.description ?? "",
  status: form.status ?? "",
  priority: form.priority ?? "",
  startDate: form.startDate ?? "",
  dueDate: form.dueDate ?? "",
  columnId: form.columnId ?? "",
});

export const useKanbanTasks = (boardId, board) => {
  const { workspaceId } = useWorkspace();
  const apolloClient = useApolloClient();
  const initialTaskForm = INITIAL_TASK_FORM;

  const [taskForm, setTaskForm] = useState(initialTaskForm);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedColumnId, setSelectedColumnId] = useState(null);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);

  // Ref pour éviter les mises à jour en boucle
  const lastUpdateRef = useRef(null);

  // Ref pour l'état initial du formulaire (utilisé par l'auto-save dans TaskModal)
  const initialFormRef = useRef(null);

  // Dernière valeur connue du serveur pour les champs synchronisables de la
  // tâche ouverte (cf. SYNCED_SCALAR_FIELDS) : sert à distinguer une
  // modification locale en cours d'une valeur simplement périmée.
  const serverFormRef = useRef(null);
  // Signature du dernier formulaire envoyé par l'auto-save : si le serveur
  // renvoie une valeur différente de ce qu'on lui a envoyé (champ normalisé :
  // espace en fin de titre, date reformatée…), le champ resterait « sale »
  // et l'auto-save repartirait à chaque resynchronisation, à l'infini.
  const lastSentSignatureRef = useRef(null);
  // Modifications de membres / tags / checklist en cours sur la tâche ouverte
  const pendingListOpsRef = useRef(0);
  // Dernier formulaire rendu (diff de la checklist, doublons de tags)
  const taskFormRef = useRef(taskForm);
  taskFormRef.current = taskForm;

  // Lazy query pour charger les détails d'une tâche (comments, activity, timeTracking.entries)
  // Chargé uniquement quand on ouvre le modal de détail.
  // Apollo 3.14 : on n'utilise plus onCompleted (déprécié, cause des doubles renders)
  // mais un useEffect réagissant à `data` (pattern recommandé).
  const [
    fetchTaskDetails,
    { data: taskDetailsData, loading: taskDetailsLoading },
  ] = useLazyQuery(GET_TASK_DETAILS, {
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    notifyOnNetworkStatusChange: false,
  });

  // Ref pour dédupliquer les résultats : clé id-updatedAt, pour ne réinjecter
  // comments/activity que quand la tâche a réellement changé côté serveur
  // (updatedAt est sélectionné par GET_TASK_DETAILS). L'ancien garde sur le
  // seul id jetait TOUS les refetchs après le premier chargement → les
  // commentaires du modal (dont les réponses 🤖 de Claude) n'apparaissaient
  // qu'après un refresh de la page.
  const lastTaskDetailsIdRef = useRef(null);

  // Applique un résultat de GET_TASK_DETAILS au formulaire du modal.
  // ⚠️ Depuis Apollo 3.14, le `data` réactif de useLazyQuery ne se met plus
  // à jour lors des ré-exécutions : les résultats n'arrivent que via la
  // PROMESSE de la fonction d'exécution. Chaque appel de fetchTaskDetails
  // doit donc chaîner .then(applyTaskDetails) — l'effet sur taskDetailsData
  // ci-dessous ne couvre que le premier chargement.
  const applyTaskDetails = useCallback((task) => {
    if (!task?.id) return;
    // La clé de dédup inclut les compteurs : un événement de subscription
    // fusionne l'updatedAt frais dans le cache AVANT que la réponse réseau
    // n'apporte les nouveaux commentaires — une clé id-updatedAt seule
    // consommerait la clé sur la vue périmée et rejetterait la fraîche.
    const detailsKey = [
      task.id,
      task.updatedAt || "",
      task.comments?.length ?? 0,
      task.activity?.length ?? 0,
      task.timeTracking?.entries?.length ?? 0,
    ].join("-");
    if (lastTaskDetailsIdRef.current === detailsKey) return;
    perfMark("fetchTaskDetails data received", {
      comments: task.comments?.length ?? 0,
      activity: task.activity?.length ?? 0,
    });
    lastTaskDetailsIdRef.current = detailsKey;
    setTaskForm((prev) => {
      // Ne pas écraser si on a changé de tâche entre-temps
      if (prev?.id && prev.id !== task.id) return prev;
      const updated = {
        ...prev,
        comments: Array.isArray(task.comments) ? task.comments : [],
        activity: Array.isArray(task.activity) ? task.activity : [],
        claudeWorkingSince: task.claudeWorkingSince ?? null,
        claudeCodingSince: task.claudeCodingSince ?? null,
        timeTracking: prev.timeTracking
          ? {
              ...prev.timeTracking,
              entries: task.timeTracking?.entries || [],
            }
          : task.timeTracking,
      };
      initialFormRef.current = computeAutoSaveSignature(updated);
      return updated;
    });
  }, []);

  useEffect(() => {
    applyTaskDetails(taskDetailsData?.task);
  }, [taskDetailsData, applyTaskDetails]);

  // Extraire uniquement la tâche en cours d'édition du board (évite de dépendre de board?.tasks entier)
  const editingTaskFromBoard = useMemo(() => {
    if (!isEditTaskOpen || !editingTask?.id || !board?.tasks) return null;
    return board.tasks.find((t) => t.id === editingTask.id) || null;
  }, [board?.tasks, editingTask?.id, isEditTaskOpen]);

  // Ref pour savoir si c'est l'utilisateur local qui a déclenché la dernière mutation
  const localMutationRef = useRef(false);

  // Garde-fou : si la tâche ouverte change d'updatedAt en rafale (deux
  // sources qui se répondent), on cesse de resynchroniser plutôt que de
  // boucler jusqu'au « Maximum update depth exceeded », et on trace les
  // valeurs pour trouver la source.
  const syncBurstRef = useRef([]);

  // Synchroniser les données temps réel quand la tâche est mise à jour via subscription
  // Quand updatedAt change, synchroniser taskForm avec les données du board ET refetch les détails
  useEffect(() => {
    if (!editingTaskFromBoard) return;

    const updateKey = `${editingTaskFromBoard.id}-${editingTaskFromBoard.updatedAt}`;
    if (lastUpdateRef.current === updateKey) return;

    const now = Date.now();
    syncBurstRef.current = syncBurstRef.current
      .filter((e) => now - e.at < 3000)
      .concat({ at: now, key: updateKey });
    if (syncBurstRef.current.length > 12) {
      console.warn(
        "[Kanban] Resynchronisation de la tâche en rafale, ignorée :",
        syncBurstRef.current.slice(-6).map((e) => e.key),
      );
      lastUpdateRef.current = updateKey;
      return;
    }

    // Premier rendu après ouverture du modal : ne pas refetch (déjà fait dans openEditTaskModal)
    if (!lastUpdateRef.current) {
      lastUpdateRef.current = updateKey;
      return;
    }

    lastUpdateRef.current = updateKey;

    // Si c'est une mutation locale, on ne synchronise pas le form (l'utilisateur a déjà les bonnes données)
    if (localMutationRef.current) {
      localMutationRef.current = false;
      // Le serveur reflète désormais nos valeurs : mettre l'instantané à jour
      setTaskForm((prev) => {
        serverFormRef.current = serverSnapshotOf(prev);
        return prev;
      });
    } else {
      // Mise à jour d'un autre utilisateur → fusionner sans écraser ce que
      // l'utilisateur est en train d'écrire (voir SYNCED_SCALAR_FIELDS).
      setTaskForm((prev) => {
        const remote = editingTaskFromBoard;
        const serverPrev = serverFormRef.current || serverSnapshotOf(prev);

        // Valeurs distantes, avec repli sur le local quand le serveur ne
        // renvoie rien (même sémantique que l'ancienne resynchronisation)
        const serverNext = {
          title: remote.title ?? prev.title,
          description: remote.description ?? prev.description,
          status: remote.status ?? prev.status,
          priority: remote.priority
            ? remote.priority.toLowerCase()
            : prev.priority,
          startDate: remote.startDate ?? prev.startDate,
          dueDate: remote.dueDate ?? prev.dueDate,
          columnId: remote.columnId ?? prev.columnId,
        };
        const remoteTags = Array.isArray(remote.tags) ? remote.tags : prev.tags;
        const remoteChecklist = Array.isArray(remote.checklist)
          ? normalizeChecklist(remote.checklist)
          : prev.checklist;

        const synced = { ...prev };
        for (const field of SYNCED_SCALAR_FIELDS) {
          const local = prev[field] ?? "";
          const dirty = local !== (serverPrev[field] ?? "");
          synced[field] = dirty ? prev[field] : serverNext[field];
        }
        // Membres, tags, checklist : modifiés élément par élément (mutations
        // atomiques), jamais « sales ». Tant qu'une modification locale est
        // en cours, on garde l'affichage local (réaligné sur le cache à la
        // dernière réponse) ; sinon la valeur du board, qui contient aussi
        // les changements des autres membres.
        const listsBusy = pendingListOpsRef.current > 0;
        synced.tags = listsBusy ? prev.tags : remoteTags;
        synced.checklist = listsBusy ? prev.checklist : remoteChecklist;

        Object.assign(synced, {
          assignedMembers:
            !listsBusy && Array.isArray(remote.assignedMembers)
              ? remote.assignedMembers
              : prev.assignedMembers,
          // Les liens sont posés des deux côtés côté serveur : un écho peut
          // venir de la tâche d'en face, on prend donc la valeur du board.
          linkedTasks: Array.isArray(remote.linkedTasks)
            ? remote.linkedTasks
            : prev.linkedTasks,
          images: Array.isArray(remote.images) ? remote.images : prev.images,
          timeTracking: remote.timeTracking ?? prev.timeTracking,
          // null = Claude a répondu (marqueur effacé) : on prend la valeur du
          // board telle quelle, sans repli sur l'ancienne
          claudeWorkingSince: remote.claudeWorkingSince ?? null,
          claudeCodingSince: remote.claudeCodingSince ?? null,
          updatedAt: remote.updatedAt ?? prev.updatedAt,
        });

        // La signature de référence de l'auto-save = ce que le serveur a
        // réellement. Les champs sales restent différents → ils seront
        // sauvegardés (au blur pour un champ texte), sans jamais être perdus.
        const pureServerForm = {
          ...synced,
          ...serverNext,
          tags: remoteTags,
          checklist: remoteChecklist,
        };
        const syncedSignature = computeAutoSaveSignature(synced);
        initialFormRef.current =
          syncedSignature === lastSentSignatureRef.current
            ? // Déjà envoyé tel quel : le serveur a eu le dernier mot, on
              // ne le renvoie pas en boucle
              syncedSignature
            : computeAutoSaveSignature(pureServerForm);
        serverFormRef.current = serverSnapshotOf(pureServerForm);

        // Rien de visible n'a changé (écho de notre propre état, événement
        // répété) : garder la même référence pour ne pas re-rendre.
        const unchanged = Object.keys(synced).every((k) =>
          k === "checklist"
            ? checklistKey(synced.checklist) === checklistKey(prev.checklist)
            : synced[k] === prev[k],
        );
        return unchanged ? prev : synced;
      });
    }

    // Refetch les détails (comments, activity, timeTracking.entries) depuis le serveur.
    // network-only : nextFetchPolicy est cache-first, sans ça les ré-exécutions
    // servent le cache et les commentaires fraîchement postés n'arrivent jamais.
    // Le résultat DOIT être appliqué via la promesse (Apollo 3.14 ne met plus
    // à jour le data réactif de useLazyQuery sur les ré-exécutions).
    fetchTaskDetails({
      variables: { id: editingTaskFromBoard.id, workspaceId },
      fetchPolicy: "network-only",
    })
      .then((result) => applyTaskDetails(result?.data?.task))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    editingTaskFromBoard?.id,
    editingTaskFromBoard?.updatedAt,
    fetchTaskDetails,
    workspaceId,
  ]);

  // Filet de sécurité temps réel : tant que le modal est ouvert (et l'onglet
  // visible), re-synchroniser les détails (commentaires, activité, loader
  // Claude) toutes les 30s. Couvre les cas où le WebSocket est mort en
  // silence (connexion établie sans JWT valide, coupure réseau, proxy) — la
  // réinjection étant dédupliquée par id-updatedAt, un poll sans changement
  // ne provoque aucun re-render.
  useEffect(() => {
    if (!isEditTaskOpen || !editingTask?.id) return undefined;
    const interval = setInterval(() => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState !== "visible"
      )
        return;
      fetchTaskDetails({
        variables: { id: editingTask.id, workspaceId },
        fetchPolicy: "network-only",
      })
        .then((result) => applyTaskDetails(result?.data?.task))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [
    isEditTaskOpen,
    editingTask?.id,
    fetchTaskDetails,
    applyTaskDetails,
    workspaceId,
  ]);

  // Ref pour savoir si le timer local tournait lors de la création
  const timerWasRunningRef = useRef(false);

  // Task mutations
  const [addComment] = useMutation(ADD_COMMENT);
  const [uploadTaskImageMutation] = useMutation(UPLOAD_TASK_IMAGE);
  const [startTimerMutation] = useMutation(START_TIMER);

  const [createTask, { loading: createTaskLoading }] = useMutation(
    CREATE_TASK,
    {
      update(cache, { data }) {
        if (!data?.createTask) return;
        const newTask = data.createTask;
        try {
          const cacheData = cache.readQuery({
            query: GET_BOARD,
            variables: { id: boardId, workspaceId },
          });
          if (cacheData?.board) {
            // Vérifier que la tâche n'existe pas déjà dans le cache
            const taskExists = (cacheData.board.tasks || []).some(
              (t) => t.id === newTask.id,
            );
            if (!taskExists) {
              // Incrémenter la position des tâches existantes dans la même colonne
              const updatedTasks = (cacheData.board.tasks || []).map((t) => {
                if (
                  t.columnId === newTask.columnId &&
                  t.position !== undefined &&
                  t.position >= (newTask.position ?? 0)
                ) {
                  return { ...t, position: t.position + 1 };
                }
                return t;
              });
              cache.writeQuery({
                query: GET_BOARD,
                variables: { id: boardId, workspaceId },
                data: {
                  board: {
                    ...cacheData.board,
                    tasks: [newTask, ...updatedTasks],
                  },
                },
              });
            }
          }
        } catch (error) {
          console.error("❌ [CreateTask] Erreur mise à jour cache:", error);
        }
      },
      onCompleted: async (data) => {
        // Si des commentaires sont en attente, les créer maintenant
        if (
          taskForm.pendingComments &&
          taskForm.pendingComments.length > 0 &&
          data?.createTask?.id
        ) {
          try {
            for (const comment of taskForm.pendingComments) {
              await addComment({
                variables: {
                  taskId: data.createTask.id,
                  input: { content: comment.content },
                  workspaceId,
                },
              });
            }
          } catch (error) {
            console.error("Erreur lors de l'ajout des commentaires:", error);
            toast.error(
              "Tâche créée mais erreur lors de l'ajout des commentaires",
            );
          }
        }

        // Upload des fichiers en attente
        if (taskForm.pendingFiles?.length > 0 && data?.createTask?.id) {
          try {
            for (const file of taskForm.pendingFiles) {
              await uploadTaskImageMutation({
                variables: {
                  taskId: data.createTask.id,
                  file,
                  imageType: "description",
                  workspaceId,
                },
              });
            }
          } catch (error) {
            console.error("Erreur upload fichiers:", error);
            toast.error(
              "Tâche créée mais erreur lors de l'upload des fichiers",
            );
          }
        }

        // Si le timer local tournait, lancer le timer serveur sur la tâche créée
        if (timerWasRunningRef.current && data?.createTask?.id) {
          try {
            await startTimerMutation({
              variables: { taskId: data.createTask.id, workspaceId },
            });
          } catch (error) {
            console.error("Erreur démarrage timer:", error);
          }
          timerWasRunningRef.current = false;
        }

        setTaskForm(initialTaskForm);
        setSelectedColumnId(null);
        setIsAddTaskOpen(false);
      },
      onError: () => {
        toast.error("Erreur lors de la création de la tâche");
      },
    },
  );

  const [updateTask, { loading: updateTaskLoading }] = useMutation(
    UPDATE_TASK,
    {
      onCompleted: () => {
        // Auto-save : ne pas fermer le dialog ni réinitialiser le formulaire
        // La subscription temps réel met à jour les données
      },
      onError: () => {
        toast.error("Erreur lors de la modification de la tâche");
      },
    },
  );

  const [deleteTask, { loading: deleteTaskLoading }] = useMutation(
    DELETE_TASK,
    {
      onCompleted: () => {
        // Plus de toast ici - la subscription temps réel s'en charge
        // Plus besoin de refetch() - la subscription s'en charge
      },
      onError: () => {
        toast.error("Erreur lors de la suppression de la tâche");
      },
    },
  );

  const [moveTask] = useMutation(MOVE_TASK, {
    // Mise à jour optimiste : la colonne/position de la tâche déplacée sont
    // appliquées immédiatement dans le cache normalisé (board ET liste lisent
    // la même entité Task). Évite que l'UI « revienne en arrière » quand
    // l'override local du board expire avant la réponse serveur.
    optimisticResponse: (vars) => ({
      moveTask: {
        __typename: "Task",
        id: vars.id,
        columnId: vars.columnId,
        position: vars.position,
        updatedAt: new Date().toISOString(),
      },
    }),
    onCompleted: () => {
      // Plus de toast ici - la subscription temps réel s'en charge
      // Plus besoin de refetch() - la subscription s'en charge
    },
    onError: () => {
      toast.error("Erreur lors du déplacement de la tâche");
    },
  });

  // Task form handlers
  const handleTaskFormChange = (field, value) => {
    setTaskForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Tag color palette with Tailwind classes
  const tagColorPalette = [
    { bg: "bg-red-100", text: "text-red-800", border: "border-red-300" },
    { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300" },
    { bg: "bg-green-100", text: "text-green-800", border: "border-green-300" },
    {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      border: "border-yellow-300",
    },
    {
      bg: "bg-purple-100",
      text: "text-purple-800",
      border: "border-purple-300",
    },
    { bg: "bg-pink-100", text: "text-pink-800", border: "border-pink-300" },
    {
      bg: "bg-indigo-100",
      text: "text-indigo-800",
      border: "border-indigo-300",
    },
    {
      bg: "bg-orange-100",
      text: "text-orange-800",
      border: "border-orange-300",
    },
    { bg: "bg-teal-100", text: "text-teal-800", border: "border-teal-300" },
    { bg: "bg-cyan-100", text: "text-cyan-800", border: "border-cyan-300" },
  ];

  // Get all existing tags from the board
  const getAllBoardTags = (boardData) => {
    if (!boardData?.tasks) return [];
    return boardData.tasks.flatMap((task) => task.tags || []);
  };

  // Find next available color for a new tag
  const getNextAvailableColor = (existingTags) => {
    const usedColors = new Set(existingTags.map((tag) => tag.bg));
    const availableColor = tagColorPalette.find(
      (color) => !usedColors.has(color.bg),
    );
    return (
      availableColor || {
        bg: "bg-gray-100",
        text: "text-gray-800",
        border: "border-gray-300",
      }
    );
  };

  // Tag handlers
  const addTag = () => {
    const newTagName = taskForm.newTag.trim();
    if (!newTagName) return;

    // Check if tag already exists in the current task
    if (
      taskForm.tags.some(
        (tag) => tag.name.toLowerCase() === newTagName.toLowerCase(),
      )
    ) {
      toast.error("Ce tag existe déjà dans cette tâche");
      return;
    }

    // Get all tags from the board if available
    const boardTags = board ? getAllBoardTags(board) : [];

    // Check if tag exists in the board with different casing
    const existingTag = boardTags.find(
      (tag) => tag.name.toLowerCase() === newTagName.toLowerCase(),
    );

    if (existingTag) {
      // If tag exists with different casing, use the existing tag's properties
      setTaskForm((prev) => ({
        ...prev,
        tags: [...prev.tags, { ...existingTag }],
        newTag: "",
      }));
      return;
    }

    // If it's a new tag, find the next available color
    const newColor = getNextAvailableColor(boardTags);

    const newTag = {
      name: newTagName,
      className: "",
      bg: newColor.bg,
      text: newColor.text,
      border: newColor.border,
    };

    setTaskForm((prev) => ({
      ...prev,
      tags: [...prev.tags, newTag],
      newTag: "",
    }));
  };

  const removeTag = (tagName) => {
    setTaskForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag.name !== tagName),
    }));
  };

  // Checklist handlers
  const addChecklistItem = () => {
    if (taskForm.newChecklistItem.trim()) {
      setTaskForm((prev) => ({
        ...prev,
        checklist: [
          ...prev.checklist,
          {
            id: `temp-${Date.now()}-${Math.random()}`, // ID temporaire unique
            text: taskForm.newChecklistItem.trim(),
            completed: false,
          },
        ],
        newChecklistItem: "",
      }));
    }
  };

  const toggleChecklistItem = (index) => {
    const updatedChecklist = [...taskForm.checklist];
    updatedChecklist[index] = {
      ...updatedChecklist[index],
      completed: !updatedChecklist[index].completed,
    };
    setTaskForm((prev) => ({
      ...prev,
      checklist: updatedChecklist,
    }));
  };

  const removeChecklistItem = (index) => {
    const updatedChecklist = [...taskForm.checklist];
    updatedChecklist.splice(index, 1);
    setTaskForm((prev) => ({
      ...prev,
      checklist: updatedChecklist,
    }));
  };

  // Task CRUD operations
  // Helper to clean tag objects by removing __typename
  const cleanTags = (tags) => {
    return tags.map((tag) => ({
      name: tag.name,
      className: tag.className || "",
      bg: tag.bg || "",
      text: tag.text || "",
      border: tag.border || "",
    }));
  };

  const handleCreateTask = async () => {
    if (!taskForm.title.trim()) {
      toast.error("Le titre de la tâche est requis");
      return;
    }

    // Validate tags before submission
    const allBoardTags = board ? getAllBoardTags(board) : [];
    const tagNames = new Set();

    for (const tag of taskForm.tags) {
      const normalizedTagName = tag.name.toLowerCase();

      // Check for duplicate tags in the current task
      if (tagNames.has(normalizedTagName)) {
        toast.error(`Le tag "${tag.name}" est en double dans cette tâche`);
        return;
      }
      tagNames.add(normalizedTagName);

      // Check if tag exists in the board with different casing
      const existingTag = allBoardTags.find(
        (t) =>
          t.name.toLowerCase() === normalizedTagName &&
          (t.bg !== tag.bg || t.text !== tag.text || t.border !== tag.border),
      );

      if (existingTag) {
        // Update the tag to use the existing tag's properties
        tag.bg = existingTag.bg;
        tag.text = existingTag.text;
        tag.border = existingTag.border;
      }
    }

    if (!taskForm.columnId) {
      toast.error("Veuillez sélectionner une colonne pour cette tâche");
      return;
    }

    try {
      // Sauvegarder si le timer local tourne pour le relancer côté serveur après création
      timerWasRunningRef.current = !!taskForm.timeTracking?.isRunning;

      // Envoyer seulement les userId (tableau simple d'IDs), filtrer les nulls
      const assignedMembers = Array.isArray(taskForm.assignedMembers)
        ? taskForm.assignedMembers
            .map((member) =>
              typeof member === "string" ? member : member?.userId,
            )
            .filter(Boolean)
        : [];

      await createTask({
        variables: {
          input: {
            title: taskForm.title,
            description: taskForm.description,
            priority:
              taskForm.priority.toLowerCase() === "none"
                ? ""
                : taskForm.priority.toLowerCase(),
            startDate: taskForm.startDate || null,
            dueDate: taskForm.dueDate || null,
            columnId: taskForm.columnId,
            boardId,
            position: 0,
            tags: cleanTags(taskForm.tags),
            checklist: taskForm.checklist.map((item) => ({
              id: item.id || undefined,
              text: item.text,
              completed: item.completed || false,
            })),
            assignedMembers: assignedMembers,
            linkedTaskIds: (taskForm.linkedTasks || [])
              .map((t) => t?.id)
              .filter(Boolean),
            ...(taskForm.timeTracking &&
            (taskForm.timeTracking.totalSeconds > 0 ||
              taskForm.timeTracking.hourlyRate ||
              taskForm.timeTracking.isRunning)
              ? (() => {
                  // Calculer le temps total final, incluant le temps en cours si le timer tourne
                  let finalTotalSeconds =
                    taskForm.timeTracking.totalSeconds || 0;
                  if (
                    taskForm.timeTracking.isRunning &&
                    taskForm.timeTracking.currentStartTime
                  ) {
                    const elapsed = Math.floor(
                      (Date.now() - taskForm.timeTracking.currentStartTime) /
                        1000,
                    );
                    finalTotalSeconds += elapsed;
                  }
                  return {
                    timeTracking: {
                      totalSeconds: finalTotalSeconds,
                      hourlyRate: taskForm.timeTracking.hourlyRate || null,
                      roundingOption:
                        taskForm.timeTracking.roundingOption || "none",
                    },
                  };
                })()
              : {}),
          },
          workspaceId,
        },
      });
    } catch {
      toast.error("Une erreur est survenue lors de la création de la tâche");
    }
  };

  const handleUpdateTask = async () => {
    if (!taskForm.title.trim()) {
      toast.error("Le titre de la tâche est requis");
      return;
    }

    lastSentSignatureRef.current = computeAutoSaveSignature(taskForm);
    try {
      // NOTE: `assignedMembers` est volontairement EXCLU du payload d'auto-save
      // (assignTaskMember / unassignTaskMember via taskFieldOps). L'inclure
      // renvoyait un état périmé qui écrasait une assignation récente et
      // envoyait l'e-mail d'assignation à la mauvaise personne.
      const input = {
        id: editingTask.id,
        title: taskForm.title,
        // En édition collaborative, la description est persistée par le
        // serveur collab (Yjs) : l'envoyer ici écraserait la version partagée
        // avec un HTML en retard.
        ...(isDescriptionHandledByCollab(editingTask.id)
          ? {}
          : { description: taskForm.description }),
        priority:
          taskForm.priority.toLowerCase() === "none"
            ? ""
            : taskForm.priority.toLowerCase(),
        startDate: taskForm.startDate || null,
        dueDate: taskForm.dueDate || null,
        columnId: taskForm.columnId,
        // Ni tags ni checklist : envoyés élément par élément dès le clic
        // (taskFieldOps). Renvoyer ici les tableaux complets du formulaire
        // écraserait les modifications faites en même temps par un collègue.
      };

      await updateTask({
        variables: {
          input,
          workspaceId,
        },
      });
    } catch (error) {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    }
  };

  // ── Membres, tags et checklist de la tâche ouverte ─────────────────────
  // Envoyés élément par élément dès le clic (mutations atomiques) : deux
  // personnes qui modifient la tâche en même temps ne s'écrasent plus. Le
  // formulaire est mis à jour tout de suite, puis réaligné sur le cache (état
  // serveur + modifications encore en cours) quand la dernière réponse
  // arrive, erreur comprise.
  const fieldMutations = useTaskFieldMutations(workspaceId);
  const editingTaskId = editingTask?.id || null;

  const alignListsWithCache = useCallback(
    (taskId) => {
      let lists = null;
      try {
        lists = apolloClient.cache.readFragment(
          {
            id: apolloClient.cache.identify({ __typename: "Task", id: taskId }),
            fragment: TASK_LISTS_FRAGMENT,
          },
          true,
        );
      } catch {
        lists = null;
      }
      if (!lists) return;
      setTaskForm((prev) => {
        if (prev?.id !== taskId) return prev;
        return {
          ...prev,
          assignedMembers: lists.assignedMembers || [],
          tags: lists.tags || [],
          checklist: normalizeChecklist(lists.checklist || []),
        };
      });
    },
    [apolloClient],
  );

  const runTaskListOp = useCallback(
    (taskId, send) => {
      pendingListOpsRef.current += 1;
      Promise.resolve()
        .then(send)
        .catch(() => {
          // toast déjà affiché ; le réalignement ci-dessous rétablit l'état
        })
        .finally(() => {
          pendingListOpsRef.current -= 1;
          if (pendingListOpsRef.current === 0) alignListsWithCache(taskId);
        });
    },
    [alignListsWithCache],
  );

  const taskFieldOps = useMemo(() => {
    if (!editingTaskId) return null;
    const taskId = editingTaskId;

    const removeTagNow = (tagName) => {
      setTaskForm((prev) => ({
        ...prev,
        tags: (prev.tags || []).filter(
          (t) => (t?.name || "").toLowerCase() !== tagName.toLowerCase(),
        ),
      }));
      runTaskListOp(taskId, () => fieldMutations.removeTag(taskId, tagName));
    };

    return {
      // assign : décidé par l'appelant (état local à jour même entre deux
      // clics rapides, avant le re-render)
      setMember: (memberId, assign) => {
        setTaskForm((prev) => {
          const current = (prev.assignedMembers || []).filter(
            (id) => id !== memberId,
          );
          return {
            ...prev,
            assignedMembers: assign ? [...current, memberId] : current,
          };
        });
        runTaskListOp(taskId, () =>
          fieldMutations.setMember(taskId, memberId, assign),
        );
      },

      addTag: (tag) => {
        const clean = cleanTagInput(tag);
        if (!clean.name) return;
        const exists = (taskFormRef.current?.tags || []).some(
          (t) => (t?.name || "").toLowerCase() === clean.name.toLowerCase(),
        );
        if (exists) return;
        setTaskForm((prev) => ({
          ...prev,
          tags: [...(prev.tags || []), clean],
        }));
        runTaskListOp(taskId, () => fieldMutations.addTag(taskId, clean));
      },

      removeTag: removeTagNow,

      clearTags: () => {
        (taskFormRef.current?.tags || []).forEach((t) => {
          if (t?.name) removeTagNow(t.name);
        });
      },

      // Liste complète renvoyée par le composant Checklist : on en déduit
      // l'élément ajouté, modifié ou supprimé
      changeChecklist: (nextItems) => {
        const prevItems = taskFormRef.current?.checklist || [];
        const prevById = new Map(prevItems.map((item) => [item.id, item]));
        const nextIds = new Set(nextItems.map((item) => item.id));
        const sends = [];
        // Élément sans id serveur (API pas encore à jour, donnée ancienne) :
        // impossible de le cibler, on retombe sur l'envoi de la liste
        // complète
        let needsFullList = false;

        const next = nextItems.map((item) => {
          const before = prevById.get(item.id);
          if (!before) {
            const created = {
              id: newChecklistItemId(),
              text: item.text,
              completed: Boolean(item.completed),
            };
            sends.push(() => fieldMutations.addChecklistItem(taskId, created));
            return created;
          }
          const changes = {};
          if ((before.text || "") !== (item.text || "")) {
            changes.text = item.text;
          }
          if (Boolean(before.completed) !== Boolean(item.completed)) {
            changes.completed = Boolean(item.completed);
          }
          if (Object.keys(changes).length > 0) {
            if (isServerChecklistId(item.id)) {
              sends.push(() =>
                fieldMutations.updateChecklistItem(taskId, item.id, changes),
              );
            } else {
              needsFullList = true;
            }
          }
          return item;
        });
        prevItems.forEach((item) => {
          if (nextIds.has(item.id)) return;
          if (isServerChecklistId(item.id)) {
            sends.push(() =>
              fieldMutations.removeChecklistItem(taskId, item.id),
            );
          } else {
            needsFullList = true;
          }
        });

        setTaskForm((prev) => ({ ...prev, checklist: next }));
        if (needsFullList) {
          runTaskListOp(taskId, () =>
            updateTask({
              variables: {
                input: {
                  id: taskId,
                  checklist: next.map((item) => ({
                    id: isServerChecklistId(item.id) ? item.id : undefined,
                    text: item.text,
                    completed: Boolean(item.completed),
                  })),
                },
                workspaceId,
              },
            }),
          );
          return;
        }
        sends.forEach((send) => runTaskListOp(taskId, send));
      },
    };
  }, [editingTaskId, fieldMutations, runTaskListOp, updateTask, workspaceId]);

  const handleDeleteTask = useCallback(
    async (taskId) => {
      try {
        await deleteTask({ variables: { id: taskId, workspaceId } });
      } catch {
        // Erreur silencieuse
      }
    },
    [deleteTask, workspaceId],
  );

  // Task modal handlers — wrappés useCallback pour stabilité référentielle
  // (sinon les memo de KanbanColumnSimple bail à chaque render, ce qui
  // force le walk des 300 TaskCard pour rien).
  const openAddTaskModal = useCallback((columnId, options = {}) => {
    setSelectedColumnId(columnId);
    setTaskForm({
      ...initialTaskForm,
      status: "TODO",
      priority: "",
      columnId: columnId,
      startDate: options.startDate || "",
      dueDate: options.dueDate || "",
    });
    setIsAddTaskOpen(true);
  }, []);

  // Fermeture du modal : on flippe isOpen IMMÉDIATEMENT (déclenche le unmount
  // Radix en parallèle) puis on défère le reset du form au tick suivant.
  // Avant : 3 state setters batched → React render avec form vide AVANT le
  // unmount, ce qui rajoute du travail dans le frame qui ferme.
  // Après : 1 setter urgent (close) + cleanup différé → fermeture instantanée.
  const closeAddTaskModal = useCallback(() => {
    setIsAddTaskOpen(false);
    setTimeout(() => {
      setEditingTask(null);
      setTaskForm(INITIAL_TASK_FORM);
    }, 0);
  }, []);

  const closeEditTaskModal = useCallback(() => {
    setIsEditTaskOpen(false);
    setTimeout(() => {
      setEditingTask(null);
      setTaskForm(INITIAL_TASK_FORM);
    }, 0);
  }, []);

  const openEditTaskModal = useCallback(
    (task) => {
      if (!task) return;
      perfMark("useKanbanTasks.openEditTaskModal start");

      // Reset le ref de suivi pour éviter un refetch immédiat
      lastUpdateRef.current = null;

      setEditingTask(task);
      setIsEditTaskOpen(true);

      // Déterminer si c'est une création ou une édition
      const taskId = task?.id || task?._id;
      const isCreating = !taskId || taskId === null;

      // Lire les détails (comments, activity, timeTracking.entries) depuis le
      // cache Apollo SYNCHRONIQUEMENT — si la tâche a été prefetched (hover /
      // mousedown / précédente ouverture), on a déjà tout en mémoire et on
      // peut seed le form pour que le modal s'ouvre AVEC les commentaires
      // visibles dès la première frame (au lieu d'attendre un cycle de
      // render pour que onCompleted/useEffect remplisse).
      let cachedDetails = null;
      if (!isCreating && taskId) {
        try {
          cachedDetails = apolloClient.readQuery({
            query: GET_TASK_DETAILS,
            variables: { id: taskId, workspaceId },
          });
        } catch {
          // cache miss, on remplira via fetchTaskDetails
        }
      }
      const cachedTask = cachedDetails?.task;

      // Ne pas inclure le champ id si c'est une création
      const formData = {
        ...initialTaskForm,
        title: task?.title || "",
        description: task?.description || "",
        status: task?.status || "TODO",
        priority: task?.priority ? task.priority.toLowerCase() : "",
        startDate: task?.startDate || "",
        dueDate: task?.dueDate || "",
        columnId: task?.columnId || task?.column?.id || "",
        tags: Array.isArray(task?.tags) ? task.tags : [],
        checklist: Array.isArray(task?.checklist)
          ? task.checklist.map((item, index) => ({
              id: item?.id || `checklist-item-${index}-${Date.now()}`,
              text: item?.text || "",
              completed: Boolean(item?.completed),
            }))
          : [],
        assignedMembers: Array.isArray(task?.assignedMembers)
          ? task.assignedMembers
          : [],
        linkedTasks: Array.isArray(task?.linkedTasks) ? task.linkedTasks : [],
        // Seed depuis le cache si dispo, sinon vide (rempli par fetchTaskDetails)
        comments: Array.isArray(cachedTask?.comments)
          ? cachedTask.comments
          : [],
        activity: Array.isArray(cachedTask?.activity)
          ? cachedTask.activity
          : [],
        images: Array.isArray(task?.images) ? task.images : [],
        timeTracking: cachedTask?.timeTracking || task?.timeTracking || null,
        userId: task?.userId,
        createdAt: task?.createdAt,
        updatedAt: task?.updatedAt,
        pendingComments: [],
      };

      // Ajouter l'id seulement si c'est une édition
      if (!isCreating) {
        formData.id = taskId;
      }

      serverFormRef.current = serverSnapshotOf(formData);
      setTaskForm(formData);
      perfMark("useKanbanTasks.openEditTaskModal end (state setters queued)");

      // Charger les détails (comments, activity, timeTracking.entries) en arrière-plan
      if (!isCreating && taskId) {
        perfMark("fetchTaskDetails call");
        // Réinitialiser la dédup pour que l'ouverture réinjecte toujours
        lastTaskDetailsIdRef.current = null;
        fetchTaskDetails({
          variables: { id: taskId, workspaceId },
        })
          .then((result) => applyTaskDetails(result?.data?.task))
          .catch(() => {});
      }
    },
    [apolloClient, workspaceId, fetchTaskDetails, applyTaskDetails],
  );

  // Gestion des commentaires en attente (pour la création de tâche)
  const addPendingComment = (content) => {
    if (!content.trim()) return;

    setTaskForm((prev) => ({
      ...prev,
      pendingComments: [
        ...prev.pendingComments,
        {
          id: `pending-${Date.now()}-${Math.random()}`,
          content: content.trim(),
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  };

  const removePendingComment = (commentId) => {
    setTaskForm((prev) => ({
      ...prev,
      pendingComments: prev.pendingComments.filter((c) => c.id !== commentId),
    }));
  };

  const updatePendingComment = (commentId, newContent) => {
    setTaskForm((prev) => ({
      ...prev,
      pendingComments: prev.pendingComments.map((c) =>
        c.id === commentId ? { ...c, content: newContent } : c,
      ),
    }));
  };

  return {
    // State
    taskForm,
    editingTask,
    selectedColumnId,
    isAddTaskOpen,
    isEditTaskOpen,
    loading: createTaskLoading || updateTaskLoading || deleteTaskLoading,
    taskDetailsLoading,

    // Refs
    initialFormRef,
    localMutationRef,

    // Setters
    setTaskForm,
    setEditingTask,
    setSelectedColumnId,
    setIsAddTaskOpen,
    setIsEditTaskOpen,

    // Handlers
    handleTaskFormChange,
    handleCreateTask,
    handleUpdateTask,
    handleDeleteTask,
    openAddTaskModal,
    openEditTaskModal,
    closeAddTaskModal,
    closeEditTaskModal,
    addTag,
    removeTag,
    addChecklistItem,
    toggleChecklistItem,
    removeChecklistItem,
    addPendingComment,
    removePendingComment,
    updatePendingComment,
    moveTask,
    updateTask,
    createTask,
    // Membres / tags / checklist de la tâche ouverte (null en création)
    taskFieldOps,
  };
};
