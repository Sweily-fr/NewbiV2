import { useState, useCallback, useRef } from "react";
import * as React from "react";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Edit2,
  Trash2,
  Paperclip,
  X,
  ZoomIn,
  Loader2,
  Flag,
  Check,
  Square,
  Plus,
  Play,
} from "lucide-react";
import {
  MentionCommentInput,
  CommentContent,
} from "@/src/components/ui/mention-input";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { UserAvatar } from "@/src/components/ui/user-avatar";
import { ClaudeWorkingIndicator } from "@/src/components/ui/claude-working-indicator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useMutation, useQuery, gql } from "@apollo/client";
import {
  ADD_COMMENT,
  UPDATE_COMMENT,
  DELETE_COMMENT,
  GET_ORGANIZATION_MEMBERS,
} from "@/src/graphql/kanbanQueries";
import { useSession } from "@/src/lib/auth-client";
import { useAssignedMembersInfo } from "@/src/hooks/useAssignedMembersInfo";

const TAG_COLORS = [
  { bg: "#DBEAFE", text: "#1D4ED8", border: "#BFDBFE" },
  { bg: "#DCFCE7", text: "#15803D", border: "#BBF7D0" },
  { bg: "#FEF3C7", text: "#B45309", border: "#FDE68A" },
  { bg: "#FEE2E2", text: "#B91C1C", border: "#FECACA" },
  { bg: "#EDE9FE", text: "#6D28D9", border: "#DDD6FE" },
  { bg: "#FCE7F3", text: "#BE185D", border: "#FBCFE8" },
  { bg: "#CFFAFE", text: "#0E7490", border: "#A5F3FC" },
  { bg: "#FFEDD5", text: "#C2410C", border: "#FED7AA" },
];

function resolveTagColors(tag) {
  const name = tag?.name || "";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
  return { ...tag, bg: c.bg, text: c.text, border: c.border };
}

function isVideoAttachment(attachment) {
  return (attachment?.contentType || "").startsWith("video/");
}

// Affiche une pièce jointe de commentaire (image ou vidéo) avec aperçu plein écran
function CommentAttachment({ attachment }) {
  const isVideo = isVideoAttachment(attachment);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="relative cursor-pointer group overflow-hidden rounded-md border border-border hover:border-primary/50 transition-colors bg-black">
          {isVideo ? (
            <>
              <video
                src={attachment.url}
                className="w-full h-20 object-cover"
                muted
                playsInline
                preload="metadata"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <div className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center">
                  <Play className="h-3.5 w-3.5 text-black fill-black ml-0.5" />
                </div>
              </div>
            </>
          ) : (
            <>
              <img
                src={attachment.url}
                alt={attachment.fileName}
                className="w-full h-20 object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </>
          )}
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black">
        <VisuallyHidden>
          <DialogTitle>
            {isVideo ? "Lecture de la vidéo" : "Aperçu de l'image"}
          </DialogTitle>
        </VisuallyHidden>
        {isVideo ? (
          <video
            src={attachment.url}
            className="w-full h-auto max-h-[80vh]"
            controls
            autoPlay
            playsInline
          />
        ) : (
          <img
            src={attachment.url}
            alt={attachment.fileName}
            className="w-full h-auto max-h-[80vh] object-contain"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

const TaskActivityComponent = ({
  task: initialTask,
  workspaceId,
  currentUser,
  boardMembers = [],
  columns = [],
  onTaskUpdate,
}) => {
  const [task, setTask] = useState(initialTask);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [pendingImages, setPendingImages] = useState([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const { data: session } = useSession();

  // Gestion du drag-and-drop sur le textarea
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files).filter(
      (file) =>
        file.type.startsWith("image/") || file.type.startsWith("video/"),
    );

    if (files.length > 0) {
      const newImages = files.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setPendingImages((prev) => [...prev, ...newImages]);
    }
  }, []);

  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles = [];
    for (const item of items) {
      if (
        item.type.startsWith("image/") ||
        item.type.startsWith("video/")
      ) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push({
            file,
            preview: URL.createObjectURL(file),
          });
        }
      }
    }

    if (imageFiles.length > 0) {
      setPendingImages((prev) => [...prev, ...imageFiles]);
    }
  }, []);

  // Récupérer les membres de l'organisation directement via GraphQL (même procédé que MemberSelector)
  const { data: membersData } = useQuery(GET_ORGANIZATION_MEMBERS, {
    variables: { workspaceId },
    skip: !workspaceId,
  });

  React.useEffect(() => {
    setTask(initialTask);
  }, [initialTask]);

  // Récupérer les IDs des utilisateurs des commentaires et activités
  const allUserIds = React.useMemo(() => {
    const ids = new Set();
    if (task?.comments) {
      task.comments.forEach((c) => c.userId && ids.add(c.userId));
    }
    if (task?.activity) {
      task.activity.forEach((a) => a.userId && ids.add(a.userId));
    }
    // Ajouter aussi l'utilisateur actuel
    if (session?.user?.id) {
      ids.add(session.user.id);
    }
    return Array.from(ids);
  }, [task?.comments, task?.activity, session?.user?.id]);

  // Récupérer les infos complètes des utilisateurs (avec avatars)
  const { members: usersInfo } = useAssignedMembersInfo(allUserIds);

  const enrichUserData = (item) => {
    // Si on a déjà le nom et l'image, retourner l'item
    if (item.userName && !item.userName.includes("@") && item.userImage) {
      return item;
    }

    // Chercher dans usersInfo d'abord (qui a les avatars depuis la collection user)
    const userInfo = usersInfo.find((u) => u.id === item.userId);
    if (userInfo) {
      return {
        ...item,
        userName: userInfo.name || item.userName,
        userImage: userInfo.image || item.userImage,
      };
    }

    // Fallback sur l'utilisateur actuel
    if (session?.user && item.userId === session.user.id) {
      return {
        ...item,
        userName: session.user.name || session.user.email,
        userImage: session.user.image || null,
      };
    }

    return item;
  };

  // Mutation pour uploader les images de commentaires
  const UPLOAD_COMMENT_IMAGE = gql`
    mutation UploadCommentImage(
      $taskId: ID!
      $commentId: ID!
      $file: Upload!
      $workspaceId: ID
    ) {
      uploadCommentImage(
        taskId: $taskId
        commentId: $commentId
        file: $file
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

  const [uploadCommentImage] = useMutation(UPLOAD_COMMENT_IMAGE);

  // Ref pour bloquer le onCompleted quand on upload des images avec le commentaire
  const skipCommentUpdateRef = useRef(false);

  const [addComment, { loading: addingComment }] = useMutation(ADD_COMMENT, {
    onCompleted: (data) => {
      if (skipCommentUpdateRef.current) return; // On attend la fin des uploads
      if (data?.addComment) {
        setTask(data.addComment);
        if (onTaskUpdate) {
          onTaskUpdate((prev) => ({
            ...prev,
            comments: data.addComment.comments,
            activity: data.addComment.activity,
          }));
        }
      }
    },
  });

  const [updateComment, { loading: updatingComment }] = useMutation(
    UPDATE_COMMENT,
    {
      onCompleted: (data) => {
        if (data?.updateComment) {
          setTask(data.updateComment);
        }
      },
    },
  );

  const [deleteComment, { loading: deletingComment }] = useMutation(
    DELETE_COMMENT,
    {
      onCompleted: (data) => {
        if (data?.deleteComment) {
          setTask(data.deleteComment);
        }
      },
    },
  );

  const handleAddComment = async (
    contentOverride,
    mentionedUserIds = [],
    htmlContent,
  ) => {
    const commentText = contentOverride !== undefined ? contentOverride : "";
    // Permettre l'envoi si texte OU images
    if (!commentText.trim() && pendingImages.length === 0) return;

    const taskId = task.id || task._id;

    if (!taskId) {
      console.error("No task ID found!", task);
      return;
    }

    const hasImages = pendingImages.length > 0;

    try {
      setIsUploadingImage(true);

      // Bloquer le onCompleted si on a des images (on veut tout afficher d'un coup)
      if (hasImages) {
        skipCommentUpdateRef.current = true;
      }

      // Utiliser le HTML si des mentions sont présentes, sinon le texte brut
      const contentToSend =
        mentionedUserIds.length > 0 && htmlContent
          ? htmlContent
          : commentText.trim() || "";

      // 1. Créer le commentaire (contenu vide autorisé si images présentes)
      const commentInput = { content: contentToSend };
      if (mentionedUserIds.length > 0) {
        commentInput.mentionedUserIds = mentionedUserIds;
      }

      console.log(
        "[Mention Debug] commentInput envoyé:",
        JSON.stringify(commentInput, null, 2),
      );

      const result = await addComment({
        variables: {
          taskId,
          input: commentInput,
          workspaceId,
        },
      });

      // 2. Si des images, les uploader en parallèle puis tout afficher d'un coup
      if (hasImages && result.data?.addComment?.comments) {
        const taskData = result.data.addComment;
        const comments = taskData.comments;
        const newCommentData = comments[comments.length - 1];

        if (newCommentData?.id) {
          // Uploader toutes les images en parallèle
          const uploadPromises = pendingImages.map((img) =>
            uploadCommentImage({
              variables: {
                taskId,
                commentId: newCommentData.id,
                file: img.file,
                workspaceId,
              },
            })
              .then((res) => {
                URL.revokeObjectURL(img.preview);
                return res.data?.uploadCommentImage?.success
                  ? res.data.uploadCommentImage.image
                  : null;
              })
              .catch((err) => {
                console.error("Error uploading comment image:", err);
                URL.revokeObjectURL(img.preview);
                return null;
              }),
          );

          const uploadedImages = (await Promise.all(uploadPromises)).filter(
            Boolean,
          );

          // Mise à jour unique : commentaire + images en même temps
          const finalComments = taskData.comments.map((c) => {
            if (c.id === newCommentData.id) {
              return { ...c, images: [...(c.images || []), ...uploadedImages] };
            }
            return c;
          });
          const finalTask = { ...taskData, comments: finalComments };
          setTask(finalTask);
          if (onTaskUpdate) {
            onTaskUpdate((prev) => ({
              ...prev,
              comments: finalComments,
              activity: taskData.activity,
            }));
          }
        }
      }

      // 3. Nettoyer
      setPendingImages([]);
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      skipCommentUpdateRef.current = false;
      setIsUploadingImage(false);
    }
  };

  const handleUpdateComment = async (
    commentId,
    content,
    mentionedUserIds = [],
    htmlContent,
  ) => {
    if (!content?.trim()) return;

    const taskId = task.id || task._id;
    if (!taskId) return;

    // Use HTML if mentions are present, otherwise plain text
    const contentToSend =
      mentionedUserIds.length > 0 && htmlContent ? htmlContent : content.trim();

    try {
      await updateComment({
        variables: {
          taskId,
          commentId,
          content: contentToSend,
          mentionedUserIds:
            mentionedUserIds.length > 0 ? mentionedUserIds : undefined,
          workspaceId,
        },
      });
      setEditingCommentId(null);
      setEditingContent("");
    } catch (error) {
      console.error("Error updating comment:", error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    const taskId = task.id || task._id;
    if (!taskId) return;

    try {
      await deleteComment({
        variables: {
          taskId,
          commentId,
          workspaceId,
        },
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();

    // Comparer les jours calendaires (pas les heures écoulées)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dateDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );

    if (dateDay.getTime() === today.getTime()) {
      return format(date, "'Aujourd''hui à' HH:mm", { locale: fr });
    } else if (dateDay.getTime() === yesterday.getTime()) {
      return format(date, "'Hier à' HH:mm", { locale: fr });
    } else {
      return format(date, "d MMM 'à' HH:mm", { locale: fr });
    }
  };

  const PRIORITY_MAP = {
    high: { label: "Urgent", color: "text-red-500 fill-red-500" },
    medium: { label: "Moyen", color: "text-yellow-500 fill-yellow-500" },
    low: { label: "Faible", color: "text-green-500 fill-green-500" },
    "": { label: "Aucune", color: "text-gray-400 fill-gray-400" },
  };

  const getActivityDisplay = (activity) => {
    let text = "";
    let details = null;
    let moveDetails = null;
    let priorityDetails = null;
    let memberDetails = null;
    let checklistDetails = null;
    let tagDetails = null;

    const cap = (str) =>
      str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
    const result = () => ({
      text: cap(text),
      details: cap(details),
      moveDetails,
      priorityDetails,
      memberDetails,
      checklistDetails,
      tagDetails,
    });

    // Déplacement de tâche
    if (activity.type === "moved") {
      text = "A déplacé la tâche :";
      if (columns.length > 0) {
        const oldColumn = columns.find((col) => col.id === activity.oldValue);
        const newColumn = columns.find((col) => col.id === activity.newValue);
        if (oldColumn && newColumn) {
          moveDetails = {
            from: { title: oldColumn.title, color: oldColumn.color },
            to: { title: newColumn.title, color: newColumn.color },
          };
        }
      }
      return result();
    }

    // Priorité modifiée
    if (activity.type === "priority_changed") {
      text = "A modifié la priorité :";
      const oldPriority = PRIORITY_MAP[activity.oldValue] || PRIORITY_MAP[""];
      const newPriority = PRIORITY_MAP[activity.newValue] || PRIORITY_MAP[""];
      priorityDetails = {
        from: { label: oldPriority.label, color: oldPriority.color },
        to: { label: newPriority.label, color: newPriority.color },
      };
      return result();
    }

    // Assignation / désassignation de membres
    if (activity.type === "assigned" || activity.type === "unassigned") {
      // Extraire les IDs des membres (tableau ou chaîne séparée par des virgules pour les anciennes données)
      const rawValue =
        activity.type === "assigned" ? activity.newValue : activity.oldValue;
      let memberIds = [];
      if (Array.isArray(rawValue)) {
        memberIds = rawValue;
      } else if (typeof rawValue === "string" && rawValue.length > 0) {
        memberIds = rawValue
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      // Résoudre les membres depuis boardMembers
      const members =
        boardMembers.length > 0
          ? memberIds
              .map((id) => {
                const member = boardMembers.find(
                  (m) => m.userId === id || m.id === id,
                );
                return member
                  ? { name: member.name, image: member.image }
                  : null;
              })
              .filter(Boolean)
          : [];

      if (members.length > 0) {
        text = activity.type === "assigned" ? "A assigné :" : "A désassigné :";
        memberDetails = members;
      } else {
        text =
          activity.type === "assigned"
            ? "A assigné des membres"
            : "A désassigné des membres";
      }
      return result();
    }

    // Création de tâche
    if (activity.type === "created") {
      text = "A créé la tâche";
      return result();
    }

    // Timer
    if (activity.type === "timer_started") {
      text = "A lancé le timer";
      return result();
    }
    if (activity.type === "timer_stopped") {
      text = "A arrêté le timer";
      // Extraire la durée depuis la description backend (ex: "a arrêté le timer (5m 30s)")
      const durationMatch = activity.description?.match(/\(([^)]+)\)/);
      if (durationMatch) {
        details = durationMatch[1];
      }
      return result();
    }
    if (activity.type === "timer_reset") {
      text = "A réinitialisé le timer";
      return result();
    }
    if (activity.type === "manual_time_added") {
      text = activity.description || "A ajouté du temps manuellement";
      // Capitaliser la première lettre
      text = text.charAt(0).toUpperCase() + text.slice(1);
      return result();
    }

    // Complétion / réouverture
    if (activity.type === "completed") {
      text = "A terminé la tâche";
      return result();
    }
    if (activity.type === "reopened") {
      text = "A réouvert la tâche";
      return result();
    }

    // Autres activités (updated) — parser la description pour séparer verbe et détails
    const desc = activity.description || "";

    // Images — activité dédiée avec field === 'images'
    if (activity.field === "images") {
      const added = Array.isArray(activity.newValue) ? activity.newValue : [];
      const removed = Array.isArray(activity.oldValue) ? activity.oldValue : [];
      const count = added.length || removed.length || 1;
      if (added.length > 0) {
        text = `A ajouté ${count} image${count > 1 ? "s" : ""}`;
      } else {
        text = `A supprimé ${count} image${count > 1 ? "s" : ""}`;
      }
      return result();
    }

    // Tags — activité dédiée avec field === 'tags'
    if (activity.field === "tags") {
      const addedTags = Array.isArray(activity.newValue)
        ? activity.newValue
        : [];
      const removedTags = Array.isArray(activity.oldValue)
        ? activity.oldValue
        : [];

      if (addedTags.length > 0 && removedTags.length === 0) {
        text =
          addedTags.length > 1 ? "A ajouté les tags :" : "A ajouté le tag :";
      } else if (removedTags.length > 0 && addedTags.length === 0) {
        text =
          removedTags.length > 1
            ? "A supprimé les tags :"
            : "A supprimé le tag :";
      } else if (addedTags.length > 0 && removedTags.length > 0) {
        text = "A modifié les tags :";
      } else {
        // Fallback pour les anciennes données sans newValue/oldValue
        text = cap(desc);
        return result();
      }

      tagDetails = {
        added: addedTags,
        removed: removedTags,
      };
      return result();
    }

    // Checklist — activité dédiée avec field === 'checklist'
    if (activity.field === "checklist" && desc) {
      // Parser les différentes parties de la description
      // Format : "a ajouté l'élément : X" / "a supprimé l'élément : X" / "a coché l'élément : X" / "a décoché l'élément : X"
      // Peut contenir plusieurs parties séparées par " et "
      const clParts = desc.split(/\s+et\s+a\s+/i);
      const items = [];
      // Toujours splitter sur ";;" pour ne pas casser le texte utilisateur
      // qui peut contenir des virgules (ex: "salut,test"). Si ";;" absent
      // (ancien format ou item unique), on retourne le texte tel quel.
      const splitChecklistItems = (str) => {
        if (str.includes(";;")) {
          return str
            .split(";;")
            .map((s) => s.trim())
            .filter(Boolean);
        }
        const trimmed = str.trim();
        return trimmed ? [trimmed] : [];
      };

      const parseChecklistPart = (part) => {
        // IMPORTANT : décoché AVANT coché, sinon "coché" matche aussi dans "décoché"
        const uncheckMatch = part.match(
          /^a?\s*décoché\s+(?:les?\s+éléments?|l'élément)\s*:\s*(.+)/i,
        );
        if (uncheckMatch) {
          splitChecklistItems(uncheckMatch[1]).forEach((name) => {
            items.push({ name, type: "unchecked" });
          });
          return;
        }
        const checkMatch = part.match(
          /^a?\s*coché\s+(?:les?\s+éléments?|l'élément)\s*:\s*(.+)/i,
        );
        if (checkMatch) {
          splitChecklistItems(checkMatch[1]).forEach((name) => {
            items.push({ name, type: "checked" });
          });
          return;
        }
        const addMatch = part.match(
          /^a?\s*ajouté\s+(?:les?\s+éléments?|l'élément)\s*:\s*(.+)/i,
        );
        if (addMatch) {
          splitChecklistItems(addMatch[1]).forEach((name) => {
            items.push({ name, type: "added" });
          });
          return;
        }
        const removeMatch = part.match(
          /^a?\s*supprimé\s+(?:les?\s+éléments?|l'élément)\s*:\s*(.+)/i,
        );
        if (removeMatch) {
          splitChecklistItems(removeMatch[1]).forEach((name) => {
            items.push({ name, type: "removed" });
          });
        }
      };
      clParts.forEach(parseChecklistPart);

      if (items.length > 0) {
        text = "A modifié la checklist :";
        checklistDetails = items;
        return result();
      }
    }

    // Nettoyer les détails : supprimer les préfixes "ajouté le/les tag(s)" des anciens formats
    const cleanTagDetails = (raw) => {
      return raw
        .replace(/^ajouté\s+(les?\s+tags?\s+)?/i, "")
        .replace(/^supprimé\s+(les?\s+tags?\s+)?/i, "")
        .replace(/\s+et\s+/g, ", ")
        .trim();
    };

    // Patterns : "a modifié ...", "a ajouté ...", "a supprimé ..."
    const verbPatterns = [
      // Tags avec ":" (nouveau format)
      {
        match: /^a modifié les tags\s*:\s*(.+)$/i,
        verb: "A modifié les tags :",
        clean: true,
      },
      {
        match: /^a ajouté (les tags|le tag)\s*:\s*(.+)$/i,
        verb: null,
        build: (m) => ({ verb: `A ajouté ${m[1]} :`, detail: m[2] }),
      },
      {
        match: /^a supprimé (les tags|le tag)\s*:\s*(.+)$/i,
        verb: null,
        build: (m) => ({ verb: `A supprimé ${m[1]} :`, detail: m[2] }),
      },
      // Tags sans ":" (ancien format)
      {
        match: /^a ajouté (les tags|le tag)\s+(.+)$/i,
        verb: null,
        build: (m) => ({ verb: `A ajouté ${m[1]} :`, detail: m[2] }),
      },
      {
        match: /^a supprimé (les tags|le tag)\s+(.+)$/i,
        verb: null,
        build: (m) => ({ verb: `A supprimé ${m[1]} :`, detail: m[2] }),
      },
      // Ancien format "a modifié ajouté le/les tag(s) X Y"
      {
        match: /^a modifié\s+(ajouté\s+(?:les?\s+tags?\s+)?.+)$/i,
        verb: "A modifié les tags :",
        clean: true,
      },
      {
        match: /^a modifié\s+(supprimé\s+(?:les?\s+tags?\s+)?.+)$/i,
        verb: "A modifié les tags :",
        clean: true,
      },
      // Générique
      { match: /^a modifié\s+(.+)$/i, verb: "A modifié :" },
      { match: /^a ajouté\s+(.+)$/i, verb: "A ajouté :" },
      { match: /^a supprimé\s+(.+)$/i, verb: "A supprimé :" },
    ];

    for (const pattern of verbPatterns) {
      const m = desc.match(pattern.match);
      if (m) {
        if (pattern.build) {
          const built = pattern.build(m);
          text = built.verb;
          details = built.detail;
        } else {
          text = pattern.verb;
          details = pattern.clean ? cleanTagDetails(m[1]) : m[1];
        }
        return result();
      }
    }

    // Fallback
    text = desc || `A modifié ${activity.field || "la tâche"}`;
    return result();
  };

  // Recalculer les commentaires et activités enrichis quand usersInfo change
  const comments = React.useMemo(() => {
    return [...(task.comments || [])]
      .map(enrichUserData)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [task?.comments, usersInfo, session?.user]);

  const activities = React.useMemo(() => {
    return [...(task.activity || [])]
      .filter((a) => a.type !== "comment_added")
      .map(enrichUserData)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [task?.activity, usersInfo, session?.user]);

  const allActivity = React.useMemo(() => {
    return [
      ...comments.map((c) => ({ ...c, _kind: "comment" })),
      ...activities.map((a) => ({ ...a, _kind: "activity" })),
    ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [comments, activities]);

  // Auto-scroll vers le bas pour voir les dernières activités
  React.useEffect(() => {
    requestAnimationFrame(() => {
      const el = scrollContainerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, [allActivity.length, comments.length, activities.length]);

  const scrollToBottom = React.useCallback(() => {
    requestAnimationFrame(() => {
      const el = scrollContainerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0">
      <Tabs
        defaultValue="all"
        className="flex flex-col h-full min-h-0"
        onValueChange={scrollToBottom}
      >
        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-y-auto pl-2 px-4 py-4"
        >
          <TabsContent value="all" className="space-y-2.5 mt-0">
            {allActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucune activité
              </p>
            ) : (
              <>
                {allActivity.map((item, index) => {
                  const display =
                    item._kind === "activity" ? getActivityDisplay(item) : null;
                  return (
                    <div
                      key={`${item._kind}-${item.id || index}`}
                      className="flex gap-3"
                    >
                      {item._kind === "comment" ? (
                        <div className="bg-background rounded-lg p-2.5 flex-1 border border-border/60">
                          <div className="flex gap-2.5">
                            <UserAvatar
                              src={item.userImage}
                              name={item.userName}
                              size="xs"
                              className="h-6 w-6 flex-shrink-0 mt-0.5"
                            />
                            <div className="flex-1 space-y-2">
                              {editingCommentId === item.id ? (
                                <>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium">
                                      {item.userName}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground/60">
                                      {formatDate(item.createdAt)}
                                    </span>
                                  </div>
                                  <MentionCommentInput
                                    members={
                                      membersData?.organizationMembers || []
                                    }
                                    onSubmit={(text, mentionedUserIds, html) =>
                                      handleUpdateComment(
                                        item.id,
                                        text,
                                        mentionedUserIds,
                                        html,
                                      )
                                    }
                                    placeholder="Modifier le commentaire..."
                                    disabled={updatingComment}
                                    loading={updatingComment}
                                    initialContent={item.content}
                                    editMode
                                    onCancel={() => {
                                      setEditingCommentId(null);
                                      setEditingContent("");
                                    }}
                                  />
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium">
                                        {item.userName}
                                      </span>
                                      <span className="text-[11px] text-muted-foreground/60">
                                        {formatDate(item.createdAt)}
                                      </span>
                                    </div>
                                    <div className="flex gap-1">
                                      {item.userId === session?.user?.id && (
                                        <Button
                                          size="xs"
                                          variant="ghost"
                                          className="h-7 w-7 p-0 text-muted-foreground"
                                          style={{ "--hover-color": "#5b50FF" }}
                                          onMouseEnter={(e) =>
                                            (e.currentTarget.style.color =
                                              "#5b50FF")
                                          }
                                          onMouseLeave={(e) =>
                                            (e.currentTarget.style.color = "")
                                          }
                                          onClick={() => {
                                            setEditingCommentId(item.id);
                                            setEditingContent(item.content);
                                          }}
                                        >
                                          <Edit2 className="h-3.5 w-3.5" />
                                        </Button>
                                      )}
                                      <AlertDialog
                                        open={commentToDelete === item.id}
                                        onOpenChange={(open) =>
                                          !open && setCommentToDelete(null)
                                        }
                                      >
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            size="xs"
                                            variant="ghost"
                                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                            onClick={() =>
                                              setCommentToDelete(item.id)
                                            }
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogTitle>
                                            Supprimer le commentaire
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Êtes-vous sûr de vouloir supprimer
                                            ce commentaire ? Cette action ne
                                            peut pas être annulée.
                                          </AlertDialogDescription>
                                          <div className="flex gap-2 justify-end">
                                            <AlertDialogCancel>
                                              Annuler
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() => {
                                                handleDeleteComment(item.id);
                                                setCommentToDelete(null);
                                              }}
                                              disabled={deletingComment}
                                              className="bg-destructive text-white hover:bg-destructive/90"
                                            >
                                              Supprimer
                                            </AlertDialogAction>
                                          </div>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  </div>
                                  {item.content && (
                                    <CommentContent content={item.content} />
                                  )}
                                  {/* Affichage des pièces jointes du commentaire dans le fil "Tout" */}
                                  {item.images && item.images.length > 0 && (
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                      {item.images.map((image) => (
                                        <CommentAttachment
                                          key={image.id}
                                          attachment={image}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`flex gap-3 flex-1 ${display && !display.details && !display.moveDetails && !display.priorityDetails && !display.memberDetails && !display.checklistDetails && !display.tagDetails ? "items-center" : ""}`}
                        >
                          <UserAvatar
                            src={item.userImage}
                            name={item.userName}
                            size="xs"
                            className={`flex-shrink-0 ${display && !display.details && !display.moveDetails && !display.priorityDetails && !display.memberDetails && !display.checklistDetails && !display.tagDetails ? "" : "mt-0.5"}`}
                          />
                          <div className="flex-1 min-w-0">
                            {display ? (
                              <div>
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-[13px]">
                                    <span className="font-medium whitespace-nowrap">
                                      {item.userName}
                                    </span>{" "}
                                    <span className="text-muted-foreground">
                                      {display.text}
                                    </span>
                                  </p>
                                  <span className="text-[13px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                                    {formatDate(item.createdAt)}
                                  </span>
                                </div>
                                {display.details && (
                                  <p className="text-[13px] text-foreground mt-0.5">
                                    {display.details}
                                  </p>
                                )}
                                {display.memberDetails && (
                                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    {display.memberDetails.map(
                                      (member, idx) => (
                                        <div
                                          key={idx}
                                          className="flex items-center gap-1.5 bg-muted/50 rounded-full pl-1 pr-2.5 py-0.5 border border-border"
                                        >
                                          <UserAvatar
                                            src={member.image}
                                            name={member.name}
                                            size="xs"
                                          />
                                          <span className="text-[12px] font-medium">
                                            {member.name}
                                          </span>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}
                                {display.tagDetails && (
                                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                    {display.tagDetails.added.map(
                                      (rawTag, idx) => {
                                        const tag = resolveTagColors(rawTag);
                                        return (
                                          <span
                                            key={`add-${idx}`}
                                            title={tag.name}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                                            style={{
                                              backgroundColor: tag.bg,
                                              color: tag.text,
                                              border: `1px solid ${tag.border}`,
                                            }}
                                          >
                                            <Plus className="w-3 h-3" />
                                            {tag.name?.length > 30
                                              ? tag.name.slice(0, 30) + "…"
                                              : tag.name}
                                          </span>
                                        );
                                      },
                                    )}
                                    {display.tagDetails.removed.map(
                                      (rawTag, idx) => {
                                        const tag = resolveTagColors(rawTag);
                                        return (
                                          <span
                                            key={`rem-${idx}`}
                                            title={tag.name}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium line-through opacity-60"
                                            style={{
                                              backgroundColor: tag.bg,
                                              color: tag.text,
                                              border: `1px solid ${tag.border}`,
                                            }}
                                          >
                                            <X className="w-3 h-3" />
                                            {tag.name?.length > 30
                                              ? tag.name.slice(0, 30) + "…"
                                              : tag.name}
                                          </span>
                                        );
                                      },
                                    )}
                                  </div>
                                )}
                                {display.checklistDetails && (
                                  <div className="flex flex-col gap-1 mt-1.5">
                                    {display.checklistDetails.map(
                                      (item, idx) => (
                                        <div
                                          key={idx}
                                          className="flex items-center gap-1.5"
                                        >
                                          {item.type === "checked" && (
                                            <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                                          )}
                                          {item.type === "unchecked" && (
                                            <Square className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                                          )}
                                          {item.type === "removed" && (
                                            <X className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                                          )}
                                          {item.type === "added" && (
                                            <Plus className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                          )}
                                          <span
                                            className={`text-[12px] ${item.type === "removed" ? "line-through text-muted-foreground" : "text-foreground"}`}
                                          >
                                            {item.name}
                                          </span>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}
                                {display.moveDetails && (
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <div
                                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                      style={{
                                        backgroundColor:
                                          display.moveDetails.from.color,
                                      }}
                                    />
                                    <span className="text-[13px] text-foreground">
                                      {display.moveDetails.from.title}
                                    </span>
                                    <span className="text-muted-foreground text-[13px]">
                                      →
                                    </span>
                                    <div
                                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                      style={{
                                        backgroundColor:
                                          display.moveDetails.to.color,
                                      }}
                                    />
                                    <span className="text-[13px] text-foreground">
                                      {display.moveDetails.to.title}
                                    </span>
                                  </div>
                                )}
                                {display.priorityDetails && (
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <Flag
                                      className={`w-3.5 h-3.5 flex-shrink-0 ${display.priorityDetails.from.color}`}
                                    />
                                    <span className="text-[13px] text-foreground">
                                      {display.priorityDetails.from.label}
                                    </span>
                                    <span className="text-muted-foreground text-[13px]">
                                      →
                                    </span>
                                    <Flag
                                      className={`w-3.5 h-3.5 flex-shrink-0 ${display.priorityDetails.to.color}`}
                                    />
                                    <span className="text-[13px] text-foreground">
                                      {display.priorityDetails.to.label}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
            <ClaudeWorkingIndicator
              claudeWorkingSince={task?.claudeWorkingSince}
              className="pt-1"
            />
          </TabsContent>

          <TabsContent value="comments" className="space-y-2.5 mt-3">
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucun commentaire
              </p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-background rounded-lg p-2.5 border border-border/60"
                >
                  <div className="flex gap-2.5">
                    <UserAvatar
                      src={comment.userImage}
                      name={comment.userName}
                      size="xs"
                      className="flex-shrink-0 mt-0.5"
                    />
                    <div className="flex-1 space-y-2">
                      {editingCommentId === comment.id ? (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">
                              {comment.userName}
                            </span>
                            <span className="text-[11px] text-muted-foreground/60">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <MentionCommentInput
                            members={membersData?.organizationMembers || []}
                            onSubmit={(text, mentionedUserIds, html) =>
                              handleUpdateComment(
                                comment.id,
                                text,
                                mentionedUserIds,
                                html,
                              )
                            }
                            placeholder="Modifier le commentaire..."
                            disabled={updatingComment}
                            loading={updatingComment}
                            initialContent={comment.content}
                            editMode
                            onCancel={() => {
                              setEditingCommentId(null);
                              setEditingContent("");
                            }}
                          />
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium">
                                {comment.userName}
                              </span>
                              <span className="text-[11px] text-muted-foreground/60">
                                {formatDate(comment.createdAt)}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              {comment.userId === session?.user?.id && (
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-muted-foreground"
                                  style={{ "--hover-color": "#5b50FF" }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.color = "#5b50FF")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.color = "")
                                  }
                                  onClick={() => {
                                    setEditingCommentId(comment.id);
                                    setEditingContent(comment.content);
                                  }}
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <AlertDialog
                                open={commentToDelete === comment.id}
                                onOpenChange={(open) =>
                                  !open && setCommentToDelete(null)
                                }
                              >
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                    onClick={() =>
                                      setCommentToDelete(comment.id)
                                    }
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogTitle>
                                    Supprimer le commentaire
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Êtes-vous sûr de vouloir supprimer ce
                                    commentaire ? Cette action ne peut pas être
                                    annulée.
                                  </AlertDialogDescription>
                                  <div className="flex gap-2 justify-end">
                                    <AlertDialogCancel>
                                      Annuler
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => {
                                        handleDeleteComment(comment.id);
                                        setCommentToDelete(null);
                                      }}
                                      disabled={deletingComment}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Supprimer
                                    </AlertDialogAction>
                                  </div>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                          {comment.content && (
                            <CommentContent content={comment.content} />
                          )}
                          {/* Affichage des pièces jointes du commentaire */}
                          {comment.images && comment.images.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              {comment.images.map((image) => (
                                <CommentAttachment
                                  key={image.id}
                                  attachment={image}
                                />
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <ClaudeWorkingIndicator
              claudeWorkingSince={task?.claudeWorkingSince}
              className="pt-1"
            />
          </TabsContent>

          <TabsContent value="activity" className="space-y-2.5 mt-3">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucune activité
              </p>
            ) : (
              <>
                {activities.map((activity, index) => {
                  const display = getActivityDisplay(activity);
                  const hasExtraDetails =
                    display.details ||
                    display.moveDetails ||
                    display.priorityDetails ||
                    display.memberDetails ||
                    display.checklistDetails ||
                    display.tagDetails;
                  return (
                    <div
                      key={activity.id || index}
                      className={`flex gap-3 ${!hasExtraDetails ? "items-center" : ""}`}
                    >
                      <UserAvatar
                        src={activity.userImage}
                        name={activity.userName}
                        size="xs"
                        className={`flex-shrink-0 ${hasExtraDetails ? "mt-0.5" : ""}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[13px]">
                              <span className="font-medium whitespace-nowrap">
                                {activity.userName}
                              </span>{" "}
                              <span className="text-muted-foreground">
                                {display.text}
                              </span>
                            </p>
                            <span className="text-[13px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                              {formatDate(activity.createdAt)}
                            </span>
                          </div>
                          {display.details && (
                            <p className="text-[13px] text-foreground mt-0.5">
                              {display.details}
                            </p>
                          )}
                          {display.memberDetails && (
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              {display.memberDetails.map((member, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-1.5 bg-muted/50 rounded-full pl-1 pr-2.5 py-0.5 border border-border"
                                >
                                  <UserAvatar
                                    src={member.image}
                                    name={member.name}
                                    size="xs"
                                  />
                                  <span className="text-[12px] font-medium">
                                    {member.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          {display.tagDetails && (
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              {display.tagDetails.added.map((rawTag, idx) => {
                                const tag = resolveTagColors(rawTag);
                                return (
                                  <span
                                    key={`add-${idx}`}
                                    title={tag.name}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                                    style={{
                                      backgroundColor: tag.bg,
                                      color: tag.text,
                                      border: `1px solid ${tag.border}`,
                                    }}
                                  >
                                    <Plus className="w-3 h-3" />
                                    {tag.name?.length > 30
                                      ? tag.name.slice(0, 30) + "…"
                                      : tag.name}
                                  </span>
                                );
                              })}
                              {display.tagDetails.removed.map((rawTag, idx) => {
                                const tag = resolveTagColors(rawTag);
                                return (
                                  <span
                                    key={`rem-${idx}`}
                                    title={tag.name}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium line-through opacity-60"
                                    style={{
                                      backgroundColor: tag.bg,
                                      color: tag.text,
                                      border: `1px solid ${tag.border}`,
                                    }}
                                  >
                                    <X className="w-3 h-3" />
                                    {tag.name?.length > 30
                                      ? tag.name.slice(0, 30) + "…"
                                      : tag.name}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                          {display.checklistDetails && (
                            <div className="flex flex-col gap-1 mt-1.5">
                              {display.checklistDetails.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-1.5"
                                >
                                  {item.type === "checked" && (
                                    <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                                  )}
                                  {item.type === "unchecked" && (
                                    <Square className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                                  )}
                                  {item.type === "removed" && (
                                    <X className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                                  )}
                                  {item.type === "added" && (
                                    <Plus className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                  )}
                                  <span
                                    className={`text-[12px] ${item.type === "removed" ? "line-through text-muted-foreground" : "text-foreground"}`}
                                  >
                                    {item.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          {display.moveDetails && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <div
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{
                                  backgroundColor:
                                    display.moveDetails.from.color,
                                }}
                              />
                              <span className="text-[13px] text-foreground">
                                {display.moveDetails.from.title}
                              </span>
                              <span className="text-muted-foreground text-[13px]">
                                →
                              </span>
                              <div
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{
                                  backgroundColor: display.moveDetails.to.color,
                                }}
                              />
                              <span className="text-[13px] text-foreground">
                                {display.moveDetails.to.title}
                              </span>
                            </div>
                          )}
                          {display.priorityDetails && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <Flag
                                className={`w-3.5 h-3.5 flex-shrink-0 ${display.priorityDetails.from.color}`}
                              />
                              <span className="text-[13px] text-foreground">
                                {display.priorityDetails.from.label}
                              </span>
                              <span className="text-muted-foreground text-[13px]">
                                →
                              </span>
                              <Flag
                                className={`w-3.5 h-3.5 flex-shrink-0 ${display.priorityDetails.to.color}`}
                              />
                              <span className="text-[13px] text-foreground">
                                {display.priorityDetails.to.label}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </TabsContent>
        </div>

        {/* Tabs juste au-dessus du textarea */}
        <TabsList className="grid w-full grid-cols-3 bg-transparent rounded-none h-auto px-3 pt-3 pb-0 border-t border-border">
          <TabsTrigger
            value="all"
            className="text-xs rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent cursor-pointer"
          >
            Tout ({allActivity.length})
          </TabsTrigger>
          <TabsTrigger
            value="comments"
            className="text-xs rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent cursor-pointer"
          >
            Commentaires ({comments.length})
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="text-xs rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent cursor-pointer"
          >
            Activité ({activities.length})
          </TabsTrigger>
        </TabsList>

        {/* Zone de saisie de commentaire - Sticky en bas */}
        <div className="pb-3 pl-3 pr-3 pt-1 flex-shrink-0">
          <MentionCommentInput
            members={membersData?.organizationMembers || []}
            onSubmit={handleAddComment}
            placeholder="Ajouter un commentaire..."
            disabled={isUploadingImage || addingComment}
            loading={addingComment || isUploadingImage}
            allowEmpty={pendingImages.length > 0}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onPaste={handlePaste}
            isDragOver={isDragOver}
            toolbarSlot={
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-muted/50 transition-colors cursor-pointer disabled:opacity-30"
                style={{ color: "#8D8D8D" }}
              >
                {isUploadingImage ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Paperclip className="h-3.5 w-3.5" />
                )}
              </button>
            }
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                const newImages = files.map((file) => ({
                  file,
                  preview: URL.createObjectURL(file),
                }));
                setPendingImages((prev) => [...prev, ...newImages]);
                e.target.value = "";
              }}
              className="hidden"
            />
            {/* Images en attente */}
            {pendingImages.length > 0 && (
              <div className="flex flex-wrap gap-2 pb-2">
                {pendingImages.map((img, index) => (
                  <div key={index} className="relative group">
                    {img.file.type?.startsWith("video/") ? (
                      <div className="relative w-12 h-12 rounded-md border border-border overflow-hidden bg-black">
                        <video
                          src={img.preview}
                          className={`w-full h-full object-cover ${isUploadingImage ? "opacity-50" : ""}`}
                          muted
                          playsInline
                          preload="metadata"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play className="h-4 w-4 text-white fill-white drop-shadow" />
                        </div>
                      </div>
                    ) : (
                      <img
                        src={img.preview}
                        alt={img.file.name}
                        className={`w-12 h-12 object-cover rounded-md border border-border ${isUploadingImage ? "opacity-50" : ""}`}
                      />
                    )}
                    {!isUploadingImage && (
                      <button
                        onClick={() => {
                          setPendingImages((prev) =>
                            prev.filter((_, i) => i !== index),
                          );
                          URL.revokeObjectURL(img.preview);
                        }}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-black border border-gray-200 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </MentionCommentInput>
        </div>
      </Tabs>
    </div>
  );
};

export const TaskActivity = React.memo(
  TaskActivityComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.task?.id === nextProps.task?.id &&
      prevProps.task?.comments === nextProps.task?.comments &&
      prevProps.task?.activity === nextProps.task?.activity &&
      prevProps.task?.claudeWorkingSince === nextProps.task?.claudeWorkingSince &&
      prevProps.boardMembers === nextProps.boardMembers &&
      prevProps.columns === nextProps.columns
    );
  },
);
