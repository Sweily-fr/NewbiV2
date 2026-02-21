"use client";

import { useState, useMemo, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";
import { UserAvatar } from "@/src/components/ui/user-avatar";
import { Button } from "@/src/components/ui/button";
import { Send, Loader2 } from "lucide-react";

// Get the text before the cursor in a contentEditable
function getTextBeforeCursor() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return "";
  const range = selection.getRangeAt(0).cloneRange();
  range.collapse(true);
  const node = range.startContainer;
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent.substring(0, range.startOffset);
  }
  return "";
}

/**
 * MentionDropdown — rendered inline (no portal) so clicking it does NOT blur the editor.
 */
function MentionDropdown({ members, query, onSelect }) {
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

  return (
    <div
      ref={listRef}
      className="absolute bottom-full left-0 mb-1 z-[9999] bg-white dark:bg-[#1a1a1a] border border-[#eeeff1] dark:border-[#232323] rounded-lg shadow-lg py-1 w-64 max-h-48 overflow-y-auto"
    >
      {filtered.map((member, index) => (
        <button
          key={member.id}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(member);
          }}
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
    </div>
  );
}

/**
 * MentionCommentInput - A lightweight contentEditable editor with @mention support.
 * Includes a built-in send button.
 */
export const MentionCommentInput = forwardRef(function MentionCommentInput(
  { members = [], onSubmit, placeholder = "Ajouter un commentaire...", disabled = false, loading = false, onDrop, onPaste, onDragOver, onDragLeave, isDragOver = false, children },
  ref
) {
  const editorRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [mentionState, setMentionState] = useState(null);

  const checkEmpty = useCallback(() => {
    if (!editorRef.current) return;
    const text = editorRef.current.textContent || "";
    setIsEmpty(text.trim().length === 0);
  }, []);

  const checkForMention = useCallback(() => {
    const textBefore = getTextBeforeCursor();
    const match = textBefore.match(/(?:^|\s)@(\w*)$/);
    if (match) {
      const query = match[1];
      setMentionState({ query });
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

        const deleteRange = document.createRange();
        deleteRange.setStart(node, atStart + keepSpace);
        deleteRange.setEnd(node, range.startOffset);
        deleteRange.deleteContents();

        const displayName = member.name || member.email;
        const mentionSpan = document.createElement("span");
        mentionSpan.contentEditable = "false";
        mentionSpan.className = "inline-flex items-center gap-1 bg-[#5a50ff]/10 text-[#5a50ff] rounded px-1.5 py-0.5 text-xs font-medium mx-0.5 align-baseline";
        mentionSpan.dataset.mentionId = member.id;
        mentionSpan.dataset.mentionName = displayName;
        mentionSpan.textContent = `@${displayName}`;

        const currentRange = window.getSelection().getRangeAt(0);
        currentRange.insertNode(mentionSpan);

        const space = document.createTextNode("\u00A0");
        mentionSpan.parentNode.insertBefore(space, mentionSpan.nextSibling);

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

  const handleKeyDown = (e) => {
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

  const handleSubmit = useCallback(() => {
    if (!editorRef.current || disabled) return;
    const text = editorRef.current.textContent?.trim() || "";
    if (text.length === 0) return;

    const html = editorRef.current.innerHTML;

    // Extract mentioned user IDs from data-mention-id attributes
    const mentionedUserIds = [];
    const spans = editorRef.current.querySelectorAll("[data-mention-id]");
    spans.forEach((span) => {
      const id = span.dataset.mentionId;
      if (id && !mentionedUserIds.includes(id)) {
        mentionedUserIds.push(id);
      }
    });

    onSubmit?.(text, mentionedUserIds, html);
    editorRef.current.innerHTML = "";
    setIsEmpty(true);
    setMentionState(null);
  }, [disabled, onSubmit]);

  // Expose submit to parent via ref
  useImperativeHandle(ref, () => ({
    submit: handleSubmit,
  }), [handleSubmit]);

  return (
    <div className="relative">
      {/* Dropdown rendered ABOVE the editor, inside the same DOM tree */}
      {mentionState && members.length > 0 && (
        <MentionDropdown
          members={members}
          query={mentionState.query}
          onSelect={insertMention}
        />
      )}

      <div
        className={`relative transition-all ${isDragOver ? 'ring-2 ring-primary ring-offset-2 rounded-md' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div
          className="relative min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm cursor-text"
          onClick={() => editorRef.current?.focus()}
        >
          {isEmpty && (
            <span className="absolute top-2 left-3 text-sm text-muted-foreground pointer-events-none">
              {isDragOver ? "Déposez vos images ici..." : placeholder}
            </span>
          )}
          <div
            ref={editorRef}
            contentEditable={!disabled}
            onInput={handleInput}
            onBlur={() => {
              checkEmpty();
              setTimeout(() => setMentionState(null), 200);
            }}
            onKeyDown={handleKeyDown}
            onPaste={onPaste}
            className="w-full text-sm text-foreground focus:outline-none min-h-[56px] [&_[data-mention-id]]:bg-[#5a50ff]/10 [&_[data-mention-id]]:text-[#5a50ff] [&_[data-mention-id]]:rounded [&_[data-mention-id]]:px-1.5 [&_[data-mention-id]]:py-0.5 [&_[data-mention-id]]:text-xs [&_[data-mention-id]]:font-medium"
          />
          {isDragOver && (
            <div className="absolute inset-0 bg-primary/10 rounded-md flex items-center justify-center pointer-events-none">
              <div className="text-primary font-medium text-sm flex items-center gap-2">
                Déposez vos images ici
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Children slot (for pending images, file picker, etc.) */}
      {children}

      {/* Footer with hints + send button */}
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-muted-foreground">
          @ pour mentionner · Cmd/Ctrl + Entrée
        </span>
        <Button
          size="sm"
          disabled={isEmpty || disabled || loading}
          onMouseDown={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          {loading ? (
            <>
              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
              Envoi...
            </>
          ) : (
            <>
              <Send className="h-3 w-3 mr-2" />
              Envoyer
            </>
          )}
        </Button>
      </div>
    </div>
  );
});

// Re-export MentionDropdown for external use if needed
export { MentionDropdown };

/**
 * Renders comment content with styled mentions.
 */
export function CommentContent({ content }) {
  if (!content) return null;

  const isHtml = /<[a-z][\s\S]*>/i.test(content);

  if (isHtml) {
    return (
      <div
        className="text-[14px] whitespace-pre-wrap [&_[data-mention-id]]:bg-[#5a50ff]/10 [&_[data-mention-id]]:text-[#5a50ff] [&_[data-mention-id]]:rounded [&_[data-mention-id]]:px-1.5 [&_[data-mention-id]]:py-0.5 [&_[data-mention-id]]:text-xs [&_[data-mention-id]]:font-medium"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return <p className="text-[14px] whitespace-pre-wrap">{content}</p>;
}
