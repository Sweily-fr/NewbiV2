// Édition collaborative (lettre par lettre) de la description des tâches.
//
// Activée par NEXT_PUBLIC_COLLAB_EDITOR=true (variable de build Vercel) : on
// peut revenir à l'ancien éditeur sans toucher au code. L'URL du serveur
// collab dérive de celle du WebSocket GraphQL (même hôte, chemin /collab).
export const isCollabDescriptionEnabled = () =>
  process.env.NEXT_PUBLIC_COLLAB_EDITOR === "true";

export const getCollabWsUrl = () => {
  const explicit = process.env.NEXT_PUBLIC_COLLAB_WS_URL;
  if (explicit) return explicit;
  const graphqlWs =
    process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000/graphql";
  return graphqlWs.replace(/\/graphql\/?$/, "/collab");
};

export const collabDocumentName = (taskId) => `kanban-task:${taskId}`;

// Couleur du curseur : même palette que les avatars (UserAvatar), en hex
// puisque le curseur est stylé en inline par l'extension TipTap.
const CURSOR_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
];
export const cursorColorFor = (name) => {
  if (!name) return "#6b7280";
  const sum = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return CURSOR_COLORS[sum % CURSOR_COLORS.length];
};
