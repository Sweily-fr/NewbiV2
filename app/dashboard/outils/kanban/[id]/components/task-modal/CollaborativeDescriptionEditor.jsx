"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
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
  WifiOff,
} from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/src/components/ui/tooltip";
import { getJWTToken } from "@/src/lib/apolloClient";
import {
  collabDocumentName,
  cursorColorFor,
  getCollabWsUrl,
} from "./collabConfig";

// Même barre d'outils que l'ancien éditeur, exprimée en commandes TipTap
const TOOLBAR = [
  { icon: Bold, tooltip: "Gras", active: "bold", run: (c) => c.toggleBold() },
  {
    icon: Italic,
    tooltip: "Italique",
    active: "italic",
    run: (c) => c.toggleItalic(),
  },
  {
    icon: Underline,
    tooltip: "Souligné",
    active: "underline",
    run: (c) => c.toggleUnderline(),
  },
  {
    icon: List,
    tooltip: "Liste à puces",
    active: "bulletList",
    run: (c) => c.toggleBulletList(),
  },
  {
    icon: ListOrdered,
    tooltip: "Liste numérotée",
    active: "orderedList",
    run: (c) => c.toggleOrderedList(),
  },
  {
    icon: Quote,
    tooltip: "Citation",
    active: "blockquote",
    run: (c) => c.toggleBlockquote(),
  },
  {
    icon: Code,
    tooltip: "Code",
    active: "codeBlock",
    run: (c) => c.toggleCodeBlock(),
  },
  { icon: Link, tooltip: "Lien", active: "link", run: null },
];

// Au-delà de ce délai sans synchronisation, on considère le serveur collab
// injoignable et on repasse sur l'éditeur classique (voir TaskDescriptionField).
const SYNC_TIMEOUT_MS = 6000;

/**
 * Éditeur de description partagé en temps réel (Yjs + Hocuspocus) : chaque
 * frappe est fusionnée avec celles des autres membres, leurs curseurs sont
 * affichés avec leur nom. La persistance (HTML dans task.description) est
 * faite côté serveur, pas par l'auto-save du formulaire.
 *
 * Props identiques à DescriptionEditor (value/onChange servent seulement au
 * repli), plus taskId et user { name, image }.
 */
export const CollaborativeDescriptionEditor = forwardRef(
  function CollaborativeDescriptionEditor(
    {
      taskId,
      user,
      onFocus: onFocusProp,
      onBlur: onBlurProp,
      onUnavailable,
      placeholder = "Ajouter une description...",
    },
    ref,
  ) {
    const [synced, setSynced] = useState(false);
    const [status, setStatus] = useState("connecting");
    const unavailableRef = useRef(false);

    // Un document et un provider par tâche ouverte
    const { ydoc, provider } = useMemo(() => {
      const doc = new Y.Doc();
      const prov = new HocuspocusProvider({
        url: getCollabWsUrl(),
        name: collabDocumentName(taskId),
        document: doc,
        token: async () => (await getJWTToken()) || "",
        onSynced: () => setSynced(true),
        onStatus: ({ status: s }) => setStatus(s),
        onAuthenticationFailed: () => {
          if (unavailableRef.current) return;
          unavailableRef.current = true;
          onUnavailable?.("auth");
        },
      });
      return { ydoc: doc, provider: prov };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [taskId]);

    useEffect(
      () => () => {
        provider.destroy();
        ydoc.destroy();
      },
      [provider, ydoc],
    );

    // Serveur injoignable : repli sur l'éditeur classique
    useEffect(() => {
      if (synced) return undefined;
      const timer = setTimeout(() => {
        if (synced || unavailableRef.current) return;
        unavailableRef.current = true;
        onUnavailable?.("timeout");
      }, SYNC_TIMEOUT_MS);
      return () => clearTimeout(timer);
    }, [synced, onUnavailable]);

    const editor = useEditor(
      {
        immediatelyRender: false,
        extensions: [
          // L'annulation est gérée par Yjs (Collaboration), pas par l'éditeur
          StarterKit.configure({ undoRedo: false }),
          Collaboration.configure({ document: ydoc }),
          CollaborationCaret.configure({
            provider,
            user: {
              name: user?.name || "Membre",
              color: cursorColorFor(user?.name),
            },
          }),
        ],
        editable: false,
        onFocus: () => onFocusProp?.(),
        onBlur: () => onBlurProp?.(),
        editorProps: {
          attributes: {
            class:
              "w-full max-w-full text-sm text-foreground focus:outline-none min-h-[80px] whitespace-pre-wrap [&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic [&_u]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-[#eeeff1] [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_pre]:bg-[#f8f9fa] [&_pre]:rounded [&_pre]:px-2 [&_pre]:py-1 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:whitespace-pre-wrap [&_pre]:overflow-x-auto [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li>p]:inline [&_a]:text-[#5a50ff] [&_a]:underline",
            style: "overflow-wrap: anywhere; word-break: break-word;",
          },
        },
      },
      [ydoc, provider],
    );

    // Éditable seulement une fois le document reçu du serveur : sinon on
    // taperait dans un document vide qui écraserait le contenu à la fusion.
    useEffect(() => {
      if (editor) editor.setEditable(synced);
    }, [editor, synced]);

    // L'ancien éditeur exposait commit() pour forcer la propagation avant une
    // sauvegarde : ici le serveur persiste lui-même, rien à faire.
    useImperativeHandle(ref, () => ({ commit: () => {} }), []);

    const isEmpty = !editor || editor.isEmpty;

    const applyLink = () => {
      if (!editor) return;
      const previous = editor.getAttributes("link").href;
      const url = window.prompt("URL du lien", previous || "https://");
      if (url === null) return;
      if (url === "" || url === "https://") {
        editor.chain().focus().extendMarkRange("link").unsetLink().run();
        return;
      }
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    };

    return (
      <div
        className="flex flex-col rounded-xl border border-[#eeeff1] dark:border-[#232323] bg-white dark:bg-[#1a1a1a] shadow-xs cursor-text overflow-hidden min-w-0"
        onClick={() => editor?.commands.focus()}
      >
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#eeeff1] dark:border-[#232323]">
          <div className="flex items-center gap-0.5">
            {TOOLBAR.map((item) => {
              const isActive = editor?.isActive(item.active);
              return (
                <Tooltip key={item.tooltip}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      disabled={!synced}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!editor) return;
                        if (item.run) item.run(editor.chain().focus()).run();
                        else applyLink();
                      }}
                      className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors disabled:opacity-40 ${isActive ? "bg-[#5a50ff]/10 text-[#5a50ff] dark:bg-[#5a50ff]/20 dark:text-[#7c74ff]" : "text-[#606164] dark:text-muted-foreground hover:bg-[#f8f9fa] dark:hover:bg-[#232323] hover:text-[#242529] dark:hover:text-foreground"}`}
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
          <div className="flex items-center gap-1">
            {synced && status !== "connected" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex h-7 w-7 items-center justify-center text-amber-500">
                    <WifiOff className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>
                    Reconnexion en cours, vos modifications seront synchronisées
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  disabled={!synced}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[#606164] hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation();
                    editor?.chain().focus().clearContent().run();
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
        </div>

        <div className="relative px-4 py-3 min-h-[100px] max-h-[200px] overflow-y-auto overflow-x-hidden">
          {!synced && (
            <span className="absolute top-3 left-4 text-sm text-muted-foreground/60 pointer-events-none">
              Connexion à l'édition partagée…
            </span>
          )}
          {synced && isEmpty && (
            <span className="absolute top-3 left-4 text-sm text-muted-foreground pointer-events-none">
              {placeholder}
            </span>
          )}
          <EditorContent editor={editor} />
        </div>
      </div>
    );
  },
);
