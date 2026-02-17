"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@apollo/client";
import { Button } from "@/src/components/ui/button";
import { UserAvatar } from "@/src/components/ui/user-avatar";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/src/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Trash2,
  Edit2,
  CornerDownLeft,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useSession } from "@/src/lib/auth-client";
import {
  useAddClientNote,
  useUpdateClientNote,
  useDeleteClientNote,
} from "@/src/graphql/clientQueries";
import { GET_ORGANIZATION_MEMBERS } from "@/src/graphql/kanbanQueries";

const toolbarItems = [
  { icon: Bold, tooltip: "Gras", command: "bold" },
  { icon: Italic, tooltip: "Italique", command: "italic" },
  { icon: Underline, tooltip: "Souligné", command: "underline" },
  { icon: List, tooltip: "Liste à puces", command: "insertUnorderedList" },
  { icon: ListOrdered, tooltip: "Liste numérotée", command: "insertOrderedList" },
  { icon: Quote, tooltip: "Citation", command: "formatBlock", value: "blockquote" },
  { icon: Code, tooltip: "Code", command: "formatBlock", value: "pre" },
  { icon: Link, tooltip: "Lien", command: "createLink" },
];

function formatNoteDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffH = (now - date) / (1000 * 60 * 60);

  if (diffH < 24) return format(date, "'Aujourd''hui à' HH:mm", { locale: fr });
  if (diffH < 48) return format(date, "'Hier à' HH:mm", { locale: fr });
  return format(date, "d MMM yyyy 'à' HH:mm", { locale: fr });
}

// Get the text before the cursor in a contentEditable
function getTextBeforeCursor() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return "";
  const range = selection.getRangeAt(0).cloneRange();
  range.collapse(true);
  // Get the text node content before cursor
  const node = range.startContainer;
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent.substring(0, range.startOffset);
  }
  return "";
}

function MentionDropdown({ members, query, onSelect, position }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return members.filter((m) => {
      const displayName = m.name || m.email || "";
      return displayName.toLowerCase().includes(q) || (m.email || "").toLowerCase().includes(q);
    });
  }, [members, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && filtered.length > 0) {
        e.preventDefault();
        onSelect(filtered[selectedIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onSelect(null);
      }
    };
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [filtered, selectedIndex, onSelect]);

  if (filtered.length === 0) return null;

  return createPortal(
    <div
      ref={listRef}
      className="fixed z-[9999] bg-white dark:bg-[#1a1a1a] border border-[#eeeff1] dark:border-[#232323] rounded-lg shadow-lg py-1 w-64 max-h-48 overflow-y-auto"
      style={{ top: position?.top ?? 0, left: position?.left ?? 0 }}
    >
      {filtered.map((member, index) => (
        <button
          key={member.id}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onSelect(member)}
          className={`flex items-center gap-2.5 w-full px-3 py-2 text-left text-sm transition-colors cursor-pointer ${
            index === selectedIndex ? "bg-[#f8f9fa] dark:bg-[#303030]" : "hover:bg-[#f8f9fa] dark:hover:bg-[#303030]"
          }`}
        >
          <UserAvatar
            src={member.image}
            name={member.name || member.email}
            size="xs"
            className="rounded-full flex-shrink-0"
            fallbackClassName="bg-gray-100 text-gray-500 rounded-full text-[10px]"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-medium text-[#242529] dark:text-foreground truncate">
              {member.name || member.email}
            </span>
            {member.name && member.email && (
              <span className="text-xs text-muted-foreground truncate">
                {member.email}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>,
    document.body
  );
}

function NoteComposer({ onSubmit, disabled, initialContent = "", members = [] }) {
  const editorRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(!initialContent);
  const [mentionState, setMentionState] = useState(null); // { query, position }

  useEffect(() => {
    if (editorRef.current && initialContent) {
      editorRef.current.innerHTML = initialContent;
      setIsEmpty(false);
    }
  }, [initialContent]);

  const checkEmpty = useCallback(() => {
    if (!editorRef.current) return;
    const text = editorRef.current.textContent || "";
    setIsEmpty(text.trim().length === 0);
  }, []);

  const checkForMention = useCallback(() => {
    const textBefore = getTextBeforeCursor();
    // Find the last @ that's either at start or preceded by a space
    const match = textBefore.match(/(?:^|\s)@(\w*)$/);
    if (match) {
      const query = match[1];
      // Get caret position for dropdown placement
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setMentionState({
          query,
          position: {
            top: rect.bottom + 4,
            left: rect.left,
          },
        });
      }
    } else {
      setMentionState(null);
    }
  }, []);

  const insertMention = useCallback((member) => {
    if (!member) {
      setMentionState(null);
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const node = range.startContainer;

    if (node.nodeType === Node.TEXT_NODE) {
      const textBefore = node.textContent.substring(0, range.startOffset);
      const match = textBefore.match(/(?:^|\s)@(\w*)$/);
      if (match) {
        const atStart = textBefore.length - match[0].length;
        const keepSpace = match[0].startsWith(" ") ? 1 : 0;

        // Delete the @query text
        const deleteRange = document.createRange();
        deleteRange.setStart(node, atStart + keepSpace);
        deleteRange.setEnd(node, range.startOffset);
        deleteRange.deleteContents();

        // Insert the mention span
        const displayName = member.name || member.email;
        const mentionSpan = document.createElement("span");
        mentionSpan.contentEditable = "false";
        mentionSpan.className = "inline-flex items-center gap-1 bg-[#5a50ff]/10 text-[#5a50ff] rounded px-1.5 py-0.5 text-xs font-medium mx-0.5 align-baseline";
        mentionSpan.dataset.mentionId = member.id;
        mentionSpan.dataset.mentionName = displayName;
        mentionSpan.textContent = `@${displayName}`;

        // Insert mention + trailing space
        const insertRange = selection.getRangeAt(0);
        insertRange.insertNode(mentionSpan);

        // Add a space after mention
        const space = document.createTextNode("\u00A0");
        mentionSpan.parentNode.insertBefore(space, mentionSpan.nextSibling);

        // Move cursor after the space
        const newRange = document.createRange();
        newRange.setStartAfter(space);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    }

    setMentionState(null);
    checkEmpty();
  }, [checkEmpty]);

  const applyFormat = useCallback((item) => {
    if (item.command === "createLink") {
      const url = prompt("URL du lien :");
      if (url) document.execCommand("createLink", false, url);
    } else if (item.value) {
      document.execCommand(item.command, false, item.value);
    } else {
      document.execCommand(item.command, false, null);
    }
    editorRef.current?.focus();
  }, []);

  const handleKeyDown = (e) => {
    // Let mention dropdown handle arrow keys and enter
    if (mentionState && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === "Escape")) {
      return;
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = () => {
    checkEmpty();
    checkForMention();
  };

  const handleSubmit = () => {
    if (!editorRef.current || isEmpty || disabled) return;
    const html = editorRef.current.innerHTML;
    onSubmit(html);
    editorRef.current.innerHTML = "";
    setIsEmpty(true);
    setMentionState(null);
  };

  const handleClear = () => {
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
      setIsEmpty(true);
      setMentionState(null);
      editorRef.current.focus();
    }
  };

  return (
    <div
      className="flex flex-col rounded-xl border border-[#eeeff1] dark:border-[#232323] bg-white dark:bg-[#1a1a1a] shadow-xs cursor-text"
      onClick={() => editorRef.current?.focus()}
    >
      {/* Formatting toolbar */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#eeeff1] dark:border-[#232323]">
        <div className="flex items-center gap-0.5">
          {toolbarItems.map((item, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation();
                    applyFormat(item);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[#606164] dark:text-muted-foreground hover:bg-[#f8f9fa] dark:hover:bg-[#232323] hover:text-[#242529] dark:hover:text-foreground transition-colors"
                >
                  <item.icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{item.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-md text-[#606164] hover:bg-red-50 hover:text-red-500 transition-colors"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Effacer</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Rich text editor */}
      <div className="relative px-4 py-3 min-h-[80px]">
        {isEmpty && (
          <span className="absolute top-3 left-4 text-sm text-muted-foreground pointer-events-none">
            Ajouter une note...
          </span>
        )}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onBlur={() => {
            checkEmpty();
            // Delay closing mention dropdown to allow click
            setTimeout(() => setMentionState(null), 200);
          }}
          onKeyDown={handleKeyDown}
          className="w-full text-sm text-foreground focus:outline-none min-h-[56px] [&_b]:font-bold [&_i]:italic [&_u]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-[#eeeff1] dark:border-[#232323] [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_pre]:bg-[#f8f9fa] [&_pre]:rounded [&_pre]:px-2 [&_pre]:py-1 [&_pre]:font-mono [&_pre]:text-xs [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-[#5a50ff] [&_a]:underline"
        />

      </div>

      {/* Mention dropdown (portal) */}
      {mentionState && members.length > 0 && (
        <MentionDropdown
          members={members}
          query={mentionState.query}
          position={mentionState.position}
          onSelect={insertMention}
        />
      )}

      {/* Send bar */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-[#eeeff1] dark:border-[#232323]">
        <span className="text-xs text-muted-foreground">
          Cmd/Ctrl + Entrée
        </span>
        <Button
          size="sm"
          disabled={isEmpty || disabled}
          onClick={handleSubmit}
          className="h-7 gap-1.5 text-xs cursor-pointer bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 disabled:opacity-40"
        >
          Envoyer
          <CornerDownLeft className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export default function ClientNotesTab({ client, workspaceId, onClientUpdate }) {
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const { data: session } = useSession();

  const { addNote, loading: addingNote } = useAddClientNote(workspaceId);
  const { updateNote, loading: updatingNote } = useUpdateClientNote(workspaceId);
  const { deleteNote, loading: deletingNote } = useDeleteClientNote(workspaceId);

  // Fetch workspace members for @mentions
  const { data: membersData } = useQuery(GET_ORGANIZATION_MEMBERS, {
    variables: { workspaceId },
    skip: !workspaceId,
  });
  const members = membersData?.organizationMembers || [];

  const notes = useMemo(() => {
    return [...(client?.notes || [])].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [client?.notes]);

  const handleAddNote = async (html) => {
    if (!html.trim() || !client?.id) return;
    try {
      const updatedClient = await addNote(client.id, html);
      onClientUpdate?.(updatedClient);
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  const handleUpdateNote = async (noteId, html) => {
    if (!html.trim() || !client?.id) return;
    try {
      const updatedClient = await updateNote(client.id, noteId, html);
      setEditingNoteId(null);
      onClientUpdate?.(updatedClient);
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!client?.id) return;
    try {
      const updatedClient = await deleteNote(client.id, noteId);
      onClientUpdate?.(updatedClient);
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const isHtml = (str) => /<[a-z][\s\S]*>/i.test(str);

  return (
    <div className="flex flex-col h-full">
      {/* Note composer */}
      <div className="px-4 sm:px-6 py-4 border-b border-[#eeeff1] dark:border-[#232323] flex-shrink-0">
        <NoteComposer
          onSubmit={handleAddNote}
          disabled={addingNote}
          members={members}
        />
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            Aucune note pour ce contact
          </p>
        ) : (
          <div className="divide-y divide-[#eeeff1]">
            {notes.map((note) => (
              <div key={note.id} className="px-4 sm:px-6 py-4 group/note">
                <div className="flex gap-3">
                  <UserAvatar
                    src={note.userImage}
                    name={note.userName}
                    size="xs"
                    className="rounded-full flex-shrink-0"
                    fallbackClassName="bg-gray-100 text-gray-500 rounded-full text-[10px]"
                  />
                  <div className="flex-1 min-w-0">
                    {editingNoteId === note.id ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{note.userName}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatNoteDate(note.createdAt)}
                          </span>
                        </div>
                        <NoteComposer
                          initialContent={note.content}
                          onSubmit={(html) => handleUpdateNote(note.id, html)}
                          disabled={updatingNote}
                          members={members}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => setEditingNoteId(null)}
                        >
                          Annuler
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{note.userName}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatNoteDate(note.createdAt)}
                            </span>
                          </div>
                          {note.userId === session?.user?.id && (
                            <div className="flex gap-1 opacity-0 group-hover/note:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-[#5a50ff]"
                                onClick={() => setEditingNoteId(note.id)}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <AlertDialog
                                open={noteToDelete === note.id}
                                onOpenChange={(open) => !open && setNoteToDelete(null)}
                              >
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                    onClick={() => setNoteToDelete(note.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogTitle>Supprimer la note</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Êtes-vous sûr de vouloir supprimer cette note ? Cette action
                                    ne peut pas être annulée.
                                  </AlertDialogDescription>
                                  <div className="flex gap-2 justify-end">
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => {
                                        handleDeleteNote(note.id);
                                        setNoteToDelete(null);
                                      }}
                                      disabled={deletingNote}
                                      className="bg-destructive text-white hover:bg-destructive/90"
                                    >
                                      Supprimer
                                    </AlertDialogAction>
                                  </div>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </div>
                        {isHtml(note.content) ? (
                          <div
                            className="text-sm mt-1.5 leading-relaxed [&_b]:font-bold [&_i]:italic [&_u]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-[#eeeff1] dark:border-[#232323] [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_pre]:bg-[#f8f9fa] [&_pre]:rounded [&_pre]:px-2 [&_pre]:py-1 [&_pre]:font-mono [&_pre]:text-xs [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-[#5a50ff] [&_a]:underline [&_[data-mention-id]]:bg-[#5a50ff]/10 [&_[data-mention-id]]:text-[#5a50ff] [&_[data-mention-id]]:rounded [&_[data-mention-id]]:px-1.5 [&_[data-mention-id]]:py-0.5 [&_[data-mention-id]]:text-xs [&_[data-mention-id]]:font-medium"
                            dangerouslySetInnerHTML={{ __html: note.content }}
                          />
                        ) : (
                          <p className="text-sm whitespace-pre-wrap mt-1.5 leading-relaxed">
                            {note.content}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
