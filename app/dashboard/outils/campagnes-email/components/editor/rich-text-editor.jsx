"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Strikethrough,
  Underline,
  Unlink,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { cn } from "@/src/lib/utils";
import { checkLink } from "@/src/utils/email-campaigns";
import { RICH_CLASS } from "../email-design/email-blocks";
import { VariableMenu } from "../variable-menu";

/** Variables ({{prenom}}…) en pastille pendant la saisie. */
const VariableHighlight = Extension.create({
  name: "campaignVariableHighlight",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("campaignVariableHighlight"),
        props: {
          decorations(state) {
            const decorations = [];
            state.doc.descendants((node, position) => {
              if (!node.isText) return;
              const pattern = /\{\{[^{}]*\}\}/g;
              let match = pattern.exec(node.text);
              while (match) {
                decorations.push(
                  Decoration.inline(
                    position + match.index,
                    position + match.index + match[0].length,
                    { class: "ec-var" },
                  ),
                );
                match = pattern.exec(node.text);
              }
            });
            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});

/** Invite grisée dans un texte vide (premier paragraphe). */
const EmptyPlaceholder = Extension.create({
  name: "campaignEmptyPlaceholder",
  addOptions() {
    return { text: "" };
  },
  addProseMirrorPlugins() {
    const { text } = this.options;
    return [
      new Plugin({
        key: new PluginKey("campaignEmptyPlaceholder"),
        props: {
          decorations(state) {
            const { doc } = state;
            const first = doc.firstChild;
            if (
              doc.childCount !== 1 ||
              !first?.isTextblock ||
              first.content.size !== 0
            ) {
              return null;
            }
            return DecorationSet.create(doc, [
              Decoration.node(0, first.nodeSize, {
                class: "ec-empty",
                "data-placeholder": text,
              }),
            ]);
          },
        },
      }),
    ];
  },
});

function ToolbarButton({ active, label, onClick, children, disabled }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      // Le texte garde sa sélection : le clic ne prend pas le focus
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex size-7 cursor-pointer items-center justify-center rounded-md text-[#3f4046] transition-colors hover:bg-[#f1f1f3] disabled:opacity-40 dark:text-white/80 dark:hover:bg-white/10",
        active &&
          "bg-[#5a50ff]/10 text-[#4a41e0] hover:bg-[#5a50ff]/15 dark:bg-[#8b7fff]/20 dark:text-[#c9c3ff]",
      )}
    >
      {children}
    </button>
  );
}

function LinkButton({ editor, active }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const check = checkLink(url, { required: true });

  const apply = (event) => {
    event?.preventDefault();
    if (check.level === "error") return;
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url.trim() })
      .run();
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setUrl(editor.getAttributes("link").href || "https://");
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Lien"
          title="Lien"
          aria-pressed={active}
          onMouseDown={(event) => event.preventDefault()}
          className={cn(
            "flex size-7 cursor-pointer items-center justify-center rounded-md text-[#3f4046] transition-colors hover:bg-[#f1f1f3] dark:text-white/80 dark:hover:bg-white/10",
            active &&
              "bg-[#5a50ff]/10 text-[#4a41e0] dark:bg-[#8b7fff]/20 dark:text-[#c9c3ff]",
          )}
        >
          <Link2 className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[320px] p-3"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <form onSubmit={apply} className="flex flex-col gap-2">
          <label
            htmlFor="rich-link"
            className="text-xs font-medium text-black/55 dark:text-white/55"
          >
            Adresse du lien
          </label>
          <div className="flex gap-2">
            <Input
              id="rich-link"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://www.exemple.fr"
              autoComplete="off"
              autoFocus
            />
            <Button
              type="submit"
              variant="primary"
              disabled={check.level === "error"}
            >
              Appliquer
            </Button>
          </div>
          {check.message && url.trim() && url.trim() !== "https://" && (
            <p
              className={cn(
                "text-xs",
                check.level === "error"
                  ? "text-red-600 dark:text-red-400"
                  : "text-amber-700 dark:text-amber-400",
              )}
            >
              {check.message}
            </p>
          )}
          {active && (
            <button
              type="button"
              onClick={() => {
                editor
                  .chain()
                  .focus()
                  .extendMarkRange("link")
                  .unsetLink()
                  .run();
                setOpen(false);
              }}
              className="flex w-fit cursor-pointer items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <Unlink className="size-3.5" aria-hidden />
              Retirer le lien
            </button>
          )}
        </form>
      </PopoverContent>
    </Popover>
  );
}

/** Barre flottante au-dessus du bloc de texte sélectionné. */
function RichToolbar({ editor, variables, allowLists }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current.isActive("bold"),
      italic: current.isActive("italic"),
      underline: current.isActive("underline"),
      strike: current.isActive("strike"),
      link: current.isActive("link"),
      bulletList: current.isActive("bulletList"),
      orderedList: current.isActive("orderedList"),
    }),
  });
  const run = (command) => () => command(editor.chain().focus()).run();
  return (
    <div
      role="toolbar"
      aria-label="Mise en forme du texte"
      className="flex items-center gap-0.5 rounded-xl border border-[#e6e7ea] bg-white p-1 shadow-[0_4px_16px_rgba(15,23,42,0.08),0_1px_3px_rgba(15,23,42,0.06)] dark:border-[#2E2E32] dark:bg-[#1c1c1f]"
      onClick={(event) => event.stopPropagation()}
    >
      <ToolbarButton
        label="Gras"
        active={state.bold}
        onClick={run((c) => c.toggleBold())}
      >
        <Bold className="size-3.5" strokeWidth={2.5} />
      </ToolbarButton>
      <ToolbarButton
        label="Italique"
        active={state.italic}
        onClick={run((c) => c.toggleItalic())}
      >
        <Italic className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Souligné"
        active={state.underline}
        onClick={run((c) => c.toggleUnderline())}
      >
        <Underline className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Barré"
        active={state.strike}
        onClick={run((c) => c.toggleStrike())}
      >
        <Strikethrough className="size-3.5" />
      </ToolbarButton>
      <span
        className="mx-1 h-4 w-px bg-[#e6e7ea] dark:bg-white/10"
        aria-hidden
      />
      <LinkButton editor={editor} active={state.link} />
      {allowLists && (
        <>
          <ToolbarButton
            label="Liste à puces"
            active={state.bulletList}
            onClick={run((c) => c.toggleBulletList())}
          >
            <List className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton
            label="Liste numérotée"
            active={state.orderedList}
            onClick={run((c) => c.toggleOrderedList())}
          >
            <ListOrdered className="size-3.5" />
          </ToolbarButton>
        </>
      )}
      <span
        className="mx-1 h-4 w-px bg-[#e6e7ea] dark:bg-white/10"
        aria-hidden
      />
      <VariableMenu
        variables={variables}
        align="start"
        onInsert={(token) => editor.chain().focus().insertContent(token).run()}
        triggerProps={{ onMouseDown: (event) => event.preventDefault() }}
      />
    </div>
  );
}

const sameHtml = (a, b) =>
  String(a || "").replace(/<p><\/p>$/, "") ===
  String(b || "").replace(/<p><\/p>$/, "");

/**
 * Texte riche d'un bloc modifié sur place, à l'identique du rendu (mêmes
 * styles que la toile). Rend le contenu éditable et sa barre flottante, à
 * placer séparément. `onChange(html)` à chaque frappe ; un HTML changé
 * d'ailleurs (Annuler) remplace le contenu sans émettre de modification.
 */
export function useRichTextEditor({
  html,
  onChange,
  variables,
  allowLists = true,
  placeholder = "Écrivez votre texte",
  className,
}) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        dropcursor: false,
        gapcursor: false,
        trailingNode: false,
        bulletList: allowLists ? {} : false,
        orderedList: allowLists ? {} : false,
        listItem: allowLists ? {} : false,
        listKeymap: allowLists ? {} : false,
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          protocols: ["http", "https", "mailto", "tel"],
          HTMLAttributes: { target: null, rel: null, class: null },
        },
      }),
      VariableHighlight,
      EmptyPlaceholder.configure({ text: placeholder }),
    ],
    content: html || "<p></p>",
    editorProps: {
      attributes: {
        class: cn(
          RICH_CLASS,
          "min-h-[1.4em] cursor-text outline-none [&_.ec-empty]:before:pointer-events-none [&_.ec-empty]:before:float-left [&_.ec-empty]:before:h-0 [&_.ec-empty]:before:opacity-40 [&_.ec-empty]:before:content-[attr(data-placeholder)]",
          className,
        ),
        "aria-label": placeholder,
        role: "textbox",
        "aria-multiline": "true",
      },
    },
    onUpdate: ({ editor: current }) => {
      onChangeRef.current(current.isEmpty ? "" : current.getHTML());
    },
  });

  // Contenu remplacé de l'extérieur (Annuler, Rétablir)
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const current = editor.isEmpty ? "" : editor.getHTML();
    if (!sameHtml(current, html)) {
      editor.commands.setContent(html || "<p></p>", { emitUpdate: false });
    }
  }, [editor, html]);

  return {
    editor,
    content: <EditorContent editor={editor} />,
    toolbar: editor ? (
      <RichToolbar
        editor={editor}
        variables={variables}
        allowLists={allowLists}
      />
    ) : null,
  };
}
