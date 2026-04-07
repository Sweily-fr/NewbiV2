import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Trash2,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
} from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/src/components/ui/tooltip";

const descriptionToolbarItems = [
  { icon: Bold, tooltip: "Gras", command: "bold" },
  { icon: Italic, tooltip: "Italique", command: "italic" },
  { icon: Underline, tooltip: "Souligné", command: "underline" },
  { icon: List, tooltip: "Liste à puces", command: "insertUnorderedList" },
  {
    icon: ListOrdered,
    tooltip: "Liste numérotée",
    command: "insertOrderedList",
  },
  {
    icon: Quote,
    tooltip: "Citation",
    command: "formatBlock",
    value: "blockquote",
  },
  { icon: Code, tooltip: "Code", command: "formatBlock", value: "pre" },
  { icon: Link, tooltip: "Lien", command: "createLink" },
];

export function DescriptionEditor({
  value,
  onChange,
  onFocus: onFocusProp,
  onBlur: onBlurProp,
  placeholder = "Ajouter une description...",
}) {
  const editorRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(!value);
  const lastSavedRef = useRef(null);
  const [activeFormats, setActiveFormats] = useState({});

  const updateActiveFormats = useCallback(() => {
    const formats = {};
    descriptionToolbarItems.forEach((item) => {
      if (item.command === "createLink") {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          let node = selection.anchorNode;
          while (node && node !== editorRef.current) {
            if (node.nodeName === "A") {
              formats["createLink"] = true;
              break;
            }
            node = node.parentNode;
          }
        }
      } else if (item.command === "formatBlock") {
        const val = document.queryCommandValue("formatBlock");
        if (val && val.toLowerCase() === item.value?.toLowerCase()) {
          formats[item.command + "-" + item.value] = true;
        }
      } else {
        try {
          if (document.queryCommandState(item.command))
            formats[item.command] = true;
        } catch (_) {}
      }
    });
    setActiveFormats(formats);
  }, []);

  useEffect(() => {
    const handleSelectionChange = () => {
      if (
        editorRef.current?.contains(document.activeElement) ||
        editorRef.current?.contains(window.getSelection()?.anchorNode)
      ) {
        updateActiveFormats();
      }
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", handleSelectionChange);
  }, [updateActiveFormats]);

  useEffect(() => {
    if (editorRef.current && value !== lastSavedRef.current) {
      editorRef.current.innerHTML = value || "";
      lastSavedRef.current = value || "";
      const text = editorRef.current.textContent || "";
      setIsEmpty(text.trim().length === 0);
    }
  }, [value]);

  // Read current editor content without triggering onChange
  const getCurrentValue = useCallback(() => {
    if (!editorRef.current) return "";
    const html = editorRef.current.innerHTML;
    const text = editorRef.current.textContent || "";
    return text.trim().length === 0 ? "" : html;
  }, []);

  // Only update visual state (placeholder) on each keystroke — no onChange
  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    const text = editorRef.current.textContent || "";
    setIsEmpty(text.trim().length === 0);
  }, []);

  const handleFocus = useCallback(() => {
    onFocusProp?.();
  }, [onFocusProp]);

  // Propagate to parent only on blur (user leaves the editor)
  const handleBlur = useCallback(() => {
    const newValue = getCurrentValue();
    if (newValue !== lastSavedRef.current) {
      lastSavedRef.current = newValue;
      onChange(newValue);
    }
    onBlurProp?.();
  }, [getCurrentValue, onChange, onBlurProp]);

  const applyFormat = useCallback(
    (item) => {
      if (item.command === "createLink") {
        const url = prompt("URL du lien :");
        if (url) document.execCommand("createLink", false, url);
      } else if (item.value) {
        document.execCommand(item.command, false, item.value);
      } else {
        document.execCommand(item.command, false, null);
      }
      editorRef.current?.focus();
      handleInput();
      setTimeout(updateActiveFormats, 0);
    },
    [handleInput, updateActiveFormats],
  );

  const handleClear = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
      setIsEmpty(true);
      lastSavedRef.current = "";
      onChange("");
      editorRef.current.focus();
    }
  }, [onChange]);

  return (
    <div
      className="flex flex-col rounded-xl border border-[#eeeff1] dark:border-[#232323] bg-white dark:bg-[#1a1a1a] shadow-xs cursor-text overflow-hidden min-w-0"
      onClick={() => editorRef.current?.focus()}
    >
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#eeeff1] dark:border-[#232323]">
        <div className="flex items-center gap-0.5">
          {descriptionToolbarItems.map((item, index) => {
            const isActive =
              item.command === "createLink"
                ? activeFormats["createLink"]
                : item.command === "formatBlock"
                  ? activeFormats[item.command + "-" + item.value]
                  : activeFormats[item.command];
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.stopPropagation();
                      applyFormat(item);
                    }}
                    className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${isActive ? "bg-[#5a50ff]/10 text-[#5a50ff] dark:bg-[#5a50ff]/20 dark:text-[#7c74ff]" : "text-[#606164] dark:text-muted-foreground hover:bg-[#f8f9fa] dark:hover:bg-[#232323] hover:text-[#242529] dark:hover:text-foreground"}`}
                  >
                    <item.icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{item.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
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

      <div className="relative px-4 py-3 min-h-[100px] max-h-[200px] overflow-y-auto overflow-x-hidden">
        {isEmpty && (
          <span className="absolute top-3 left-4 text-sm text-muted-foreground pointer-events-none">
            {placeholder}
          </span>
        )}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
          className="w-full max-w-full text-sm text-foreground focus:outline-none min-h-[80px] whitespace-pre-wrap [&_b]:font-bold [&_i]:italic [&_u]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-[#eeeff1] [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_pre]:bg-[#f8f9fa] [&_pre]:rounded [&_pre]:px-2 [&_pre]:py-1 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:whitespace-pre-wrap [&_pre]:overflow-x-auto [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-[#5a50ff] [&_a]:underline"
        />
      </div>
    </div>
  );
}
