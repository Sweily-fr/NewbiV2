"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApolloClient, useMutation } from "@apollo/client";
import {
  ArrowLeft,
  Check,
  Copy,
  ChevronRight,
  LayoutTemplate,
  Loader2,
  MailCheck,
  MoreHorizontal,
  Move,
  Palette,
  PenLine,
  Redo2,
  Send,
  Undo2,
  Star,
  Trash2,
  CopyPlus,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  TabsNew,
  TabsNewContent,
  TabsNewList,
  TabsNewTrigger,
} from "@/src/components/ui/tabs-new";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { toast } from "@/src/components/ui/sonner";
import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";
import { useSignatureV2 } from "../hooks/useSignatureV2";
import {
  DELETE_SIGNATURE_V2,
  DUPLICATE_SIGNATURE_V2,
  RENDER_SIGNATURE_V2,
  SEND_SIGNATURE_V2_TEST,
  SET_DEFAULT_SIGNATURE_V2,
  SIGNATURES_V2,
  toInput,
} from "../graphql";
import { SignatureEditorV2Skeleton } from "./signature-v2-skeleton";
import TemplateGallery from "./TemplateGallery";
import EditorTour from "./EditorTour";
import ContentPanel from "./ContentPanel";
import StylePanel from "./StylePanel";
import SignaturePreview from "./SignaturePreview";
import ElementPanel, { FIELD_ELEMENT } from "./ElementPanel";
import { GmailSize } from "./controls";
import {
  BLOCK_OF,
  COLUMN_WIDTH,
  ELEMENT_ITEMS,
  deleteFor,
  fontSizePatch,
  mainPiece,
  mergedRow,
  partHasWidth,
  selectUp,
  selectionChain,
  shownItems,
} from "../slots";
import {
  ItemPanel,
  LevelHeader,
  SlotPanel,
  ancestorsOf,
  selectionLabel,
} from "./LevelPanels";
import InstallDialog, { copySignatureHtml } from "./InstallDialog";
import ConfirmRemoveImage, { useRemoveSignatureImage } from "./ConfirmRemoveImage";

const LIST_URL = "/dashboard/outils/signatures-mail";

/**
 * Bord du bloc sélectionné dans l'aperçu : largeur réglable à la souris,
 * suivie en direct. `kind` : image carrée, image, trait, bouton, icônes ou
 * texte (« wrap », qui revient à la ligne).
 */
const RESIZE = {
  photo: { kind: "square", min: 40, max: 160 },
  logo: { kind: "image", min: 40, max: 300 },
  accent: { kind: "bar", min: 8, max: 240 },
  banner: { kind: "image", min: 120, max: 640 },
  social: { kind: "icons", min: 16, max: 40 },
  cta: { kind: "button", min: 80, max: 640 },
  name: { kind: "wrap", min: 40, max: 640 },
  jobTitle: { kind: "wrap", min: 40, max: 640 },
  company: { kind: "wrap", min: 40, max: 640 },
  tagline: { kind: "wrap", min: 40, max: 640 },
  contact: { kind: "wrap", min: 80, max: 640 },
  disclaimer: { kind: "wrap", min: 80, max: 640 },
  // Traits libres : leur longueur
  rule1: { kind: "bar", min: 16, max: 640 },
  rule2: { kind: "bar", min: 16, max: 640 },
  rule3: { kind: "bar", min: 16, max: 640 },
};

/** Textes dont le coin du cadre, dans l'aperçu, règle la taille. */
const FONT = { min: 9, max: 36 };
const FONT_ELEMENTS = new Set([
  "name",
  "jobTitle",
  "company",
  "tagline",
  "contact",
  "cta",
  "disclaimer",
]);

/** Textes modifiables dans l'aperçu (data-sig-edit) → champ de la signature. */
const TEXT_FIELDS = {
  firstName: ["identity", "firstName"],
  lastName: ["identity", "lastName"],
  jobTitle: ["identity", "jobTitle"],
  department: ["identity", "department"],
  company: ["identity", "company"],
  tagline: ["identity", "tagline"],
  phone: ["contact", "phone"],
  mobile: ["contact", "mobile"],
  email: ["contact", "email"],
  website: ["contact", "website"],
  address: ["contact", "address"],
  ctaLabel: ["cta", "label"],
  disclaimer: ["disclaimer", "text"],
};

function SaveStatus({ status }) {
  const map = {
    idle: null,
    dirty: {
      label: "Modifications en cours…",
      className: "text-muted-foreground",
    },
    saving: { label: "Enregistrement…", className: "text-muted-foreground" },
    saved: { label: "Enregistré", className: "text-emerald-600" },
    error: { label: "Non enregistré", className: "text-red-600" },
  };
  const s = map[status];
  if (!s) return null;
  return (
    <span className={`flex items-center gap-1 text-xs ${s.className}`}>
      {status === "saving" && <Loader2 size={12} className="animate-spin" />}
      {status === "saved" && <Check size={12} />}
      {s.label}
    </span>
  );
}

export default function SignatureEditor({ id }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNew = searchParams?.get("new") === "1";
  const { isReadOnly } = useSubscriptionAccess();

  const {
    sig,
    update,
    replace,
    flush,
    undo,
    redo,
    canUndo,
    canRedo,
    status,
    loading,
    error,
    catalog,
    initialRender,
  } = useSignatureV2(id);

  // Annuler / rétablir au clavier (⌘Z, ⇧⌘Z, Ctrl+Y) hors des champs de
  // saisie, qui gardent leur propre annulation
  useEffect(() => {
    const onKey = (e) => {
      const k = (e.key || "").toLowerCase();
      if (isReadOnly) return;
      if (!(e.metaKey || e.ctrlKey) || (k !== "z" && k !== "y")) return;
      const t = e.target;
      if (t?.closest?.("input, textarea, [contenteditable]")) return;
      e.preventDefault();
      if (k === "y" || e.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, isReadOnly]);

  const [tab, setTabState] = useState(isNew ? "template" : "content");
  // Chaque onglet s'ouvre en haut de sa liste de réglages
  const panelRef = useRef(null);
  const setTab = useCallback((next) => {
    setTabState(next);
    requestAnimationFrame(() => {
      const viewport = panelRef.current?.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (viewport) viewport.scrollTop = 0;
    });
  }, []);
  // Sélection dans l'aperçu (son panneau remplace les onglets), du plus
  // précis au plus large : une partie (prénom, une ligne de coordonnées),
  // un élément, une colonne, toute la signature.
  const [selected, setSelected] = useState(null);
  const element = selected?.level === "element" ? selected.key : null;
  const select = useCallback((next) => setSelected(next), []);
  const [render, setRender] = useState(initialRender);
  const [installOpen, setInstallOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialRender && !render) setRender(initialRender);
  }, [initialRender, render]);

  const onRender = useCallback((r) => setRender(r), []);

  // Texte modifié directement dans l'aperçu : même enregistrement qu'une
  // saisie dans le panneau
  const onTextInput = useCallback(
    (field, value) => {
      const path = TEXT_FIELDS[field];
      if (path) update({ [path[0]]: { [path[1]]: value } });
    },
    [update],
  );

  // Élément déposé sur une ligne de l'aperçu : nouvel emplacement, avec
  // de quoi revenir en arrière tout de suite
  const onStylePatch = useCallback(
    (patch) => {
      update({ style: patch });
      toast.document("Élément déplacé", {
        fallbackIcon: Move,
        action: { label: "Annuler", onClick: () => undo() },
        duration: 5000,
      });
    },
    [update, undo],
  );
  const onHistory = useCallback(
    (isRedo) => (isRedo ? redo() : undo()),
    [undo, redo],
  );

  // Clic dans l'aperçu : la partie la plus précise, dont le panneau s'ouvre
  // avec le champ cliqué amené et focalisé (sauf texte modifié en place) ;
  // ⌘ + clic (Ctrl + clic) : le niveau au-dessus de la sélection.
  const onFieldClick = useCallback(
    (field, { edit = false, item = null, up = false } = {}) => {
      const st = sig?.style;
      const shown = shownItems(sig);
      const part = BLOCK_OF[item]
        ? item
        : BLOCK_OF[field]
          ? field
          : (ELEMENT_ITEMS[FIELD_ELEMENT[field]] || [])[0] || null;
      if (up) {
        setSelected((current) => selectUp(current, part, st, shown));
        return;
      }
      if (!part) return;
      setSelected(selectionChain(part, st, shown)[0]);
      // Lecture seule : rien à saisir, le panneau n'est qu'affiché
      if (edit || !field || isReadOnly) return;
      const focus = (attempt = 0) => {
        const el = document.getElementById(`sig-field-${field}`);
        if (el) {
          el.scrollIntoView({ block: "center", behavior: "smooth" });
          if (typeof el.focus === "function") el.focus({ preventScroll: true });
          if (typeof el.select === "function") el.select();
        } else if (attempt < 10) {
          setTimeout(() => focus(attempt + 1), 60);
        }
      };
      setTimeout(() => focus(), 30);
    },
    [sig, isReadOnly],
  );

  // Sélection dessinée dans l'aperçu : chaque niveau a un bord qui règle
  // sa largeur. Élément : la taille qui lui est réservée, bornée par le
  // modèle (photo, icônes), le coin d'un texte règle ses caractères.
  // Partie : sa largeur (ligne de coordonnées, prénom ou nom seul sur sa
  // ligne) et ses caractères. Colonne : sa largeur ; en-tête et bas : celle
  // de la signature. Signature : sa largeur, la taille du texte.
  const st0 = sig?.style;
  const level = selected?.level || null;
  const key = selected?.key || null;
  const blockWidth = (element && st0?.blocks?.[element]?.width) || 0;
  const photoMax = render?.lines?.photoMax || 160;
  const iconMax = render?.lines?.iconMax || 40;
  const iconSize = Math.min(st0?.iconSize || 22, iconMax);
  const baseFont = st0?.fontSize || 13;
  const fontSize =
    (element && render?.elements?.[element]?.fontSize) || baseFont;
  const itemFont =
    (level === "item" &&
      (render?.elements?.[key]?.fontSize ||
        render?.elements?.[BLOCK_OF[key]]?.fontSize)) ||
    baseFont;
  const frameWidth = st0?.frameWidth || 0;
  const partWidth =
    level === "item" && partHasWidth(sig, key)
      ? {
          width: st0?.blocks?.[key]?.width || 0,
          line: BLOCK_OF[key] === "contact",
        }
      : null;
  const partWidthKey = partWidth ? `${partWidth.width}-${partWidth.line}` : "";
  const columnWidth = (level === "slot" && st0?.columns?.[key]) || 0;
  const contactIcons = st0?.contactStyle === "icons";
  // Élément réparti en morceaux : ses réglages ne valent que pour le
  // principal, que le cadre entoure
  const mainKey =
    element === "name" || element === "contact"
      ? (mainPiece(st0, shownItems(sig), element) || []).join()
      : "";
  // Sur la ligne d'un autre élément : sa largeur se règle sur lui
  const rowCarrier =
    element && (mergedRow(sig, element) || [element])[0] !== element;
  const selection = useMemo(() => {
    if (!level) return null;
    const signatureWidth = isReadOnly
      ? null
      : { kind: "frame", min: 240, max: 720, width: frameWidth };
    if (level === "signature") {
      return {
        level,
        whole: true,
        resize: signatureWidth,
        font: isReadOnly ? null : { min: 11, max: 18, size: baseFont },
      };
    }
    if (level === "slot") {
      const c = COLUMN_WIDTH[key];
      return {
        level,
        slot: key,
        resize: c
          ? isReadOnly
            ? null
            : { kind: "column", min: c.min, max: c.max, width: columnWidth }
          : key === "header" || key === "footer"
            ? signatureWidth
            : null,
        font: null,
      };
    }
    if (level === "item") {
      const [pw, pl] = partWidthKey.split("-");
      return {
        level,
        items: [key],
        resize:
          partWidthKey && !isReadOnly
            ? {
                kind: "wrap",
                min: 40,
                max: 640,
                width: Number(pw) || 0,
                line: pl === "true",
              }
            : null,
        font: isReadOnly ? null : { ...FONT, size: itemFont },
      };
    }
    const base = !isReadOnly && !rowCarrier && RESIZE[key];
    let resize = null;
    if (base && key === "photo") {
      resize = { ...base, max: Math.min(base.max, photoMax) };
    } else if (base && key === "social") {
      resize = { ...base, max: iconMax, size: iconSize };
    } else if (base) {
      resize = { ...base, width: blockWidth };
    }
    return {
      level,
      items: ELEMENT_ITEMS[key] || [key],
      // Le séparateur vertical se règle mais ne se déplace pas
      nograb: key === "divider",
      main: mainKey ? mainKey.split(",") : null,
      resize,
      font:
        !isReadOnly && FONT_ELEMENTS.has(key)
          ? { ...FONT, size: fontSize, icons: key === "contact" && contactIcons }
          : null,
    };
  }, [
    level,
    key,
    isReadOnly,
    blockWidth,
    photoMax,
    iconMax,
    iconSize,
    fontSize,
    itemFont,
    baseFont,
    frameWidth,
    partWidthKey,
    columnWidth,
    contactIcons,
    mainKey,
    rowCarrier,
  ]);
  const clamp = (v, min, max) => Math.max(min, Math.min(max, Math.round(v)));
  // Bord tiré dans l'aperçu : largeur du cadre, d'une colonne, ou réglage
  // de l'élément
  const onResize = useCallback(
    (width) => {
      if (!sig || !level) return;
      const st = sig.style;
      if (
        level === "signature" ||
        (level === "slot" && (key === "header" || key === "footer"))
      ) {
        update({ style: { frameWidth: clamp(width, 240, 720) } });
        return;
      }
      // Largeur d'un texte : 0 = automatique (tiré jusqu'à sa largeur
      // naturelle), le réglage est alors retiré
      const withWidth = (blocks, k, value) => {
        // eslint-disable-next-line no-unused-vars
        const { width: _w, ...rest } = blocks[k] || {};
        const next = value ? { ...rest, width: value } : rest;
        const all = { ...blocks };
        if (Object.keys(next).length > 0) all[k] = next;
        else delete all[k];
        return all;
      };
      if (level === "item") {
        update({
          style: {
            blocks: withWidth(
              st.blocks || {},
              key,
              width ? clamp(width, 40, 640) : 0,
            ),
          },
        });
        return;
      }
      if (level === "slot") {
        const c = COLUMN_WIDTH[key];
        if (!c) return;
        update({
          style: {
            columns: { ...(st.columns || {}), [key]: clamp(width, c.min, c.max) },
          },
        });
        return;
      }
      if (!element || !RESIZE[element]) return;
      const { min, max } = RESIZE[element];
      if (!width && RESIZE[element].kind === "wrap") {
        update({ style: { blocks: withWidth(st.blocks || {}, element, 0) } });
        return;
      }
      const value = clamp(width, min, max);
      let patch;
      if (element === "photo") patch = { photoSize: value };
      else if (element === "social") patch = { iconSize: value };
      else if (element === "logo") patch = { logoWidth: value };
      else if (element === "accent") patch = { accentLength: value };
      else if (st.rules?.[element]) {
        patch = {
          rules: {
            ...st.rules,
            [element]: { ...st.rules[element], length: value },
          },
        };
      }
      else {
        patch = { blocks: withWidth(st.blocks || {}, element, value) };
      }
      update({ style: patch });
    },
    [level, key, element, sig, update],
  );
  // Coin tiré dans l'aperçu : taille des caractères. Signature : la taille
  // de base, les éléments réglés à part suivent. Élément : ses parties
  // réglées à part suivent, les icônes des coordonnées aussi. Partie : elle
  // seule.
  const onFont = useCallback(
    (size) => {
      if (!sig || !level) return;
      const style = sig.style;
      const all = style.elements || {};
      if (level === "signature") {
        const value = clamp(size, 11, 18);
        const factor = value / baseFont;
        const elements = Object.fromEntries(
          Object.entries(all).map(([k, e]) => [
            k,
            e?.fontSize
              ? { ...e, fontSize: clamp(e.fontSize * factor, FONT.min, FONT.max) }
              : e,
          ]),
        );
        update({ style: { fontSize: value, elements } });
        return;
      }
      if (level === "item") {
        const value = clamp(size, FONT.min, FONT.max);
        update({
          style: {
            elements: { ...all, [key]: { ...(all[key] || {}), fontSize: value } },
          },
        });
        return;
      }
      if (!element || !FONT_ELEMENTS.has(element)) return;
      // Même règle que le curseur « Taille » du panneau
      const value = clamp(size, FONT.min, FONT.max);
      update({ style: fontSizePatch(style, element, value, fontSize) });
    },
    [level, key, element, sig, update, fontSize, baseFont],
  );
  const onEscape = useCallback(() => setSelected(null), []);

  // Suppr (⌫) sur une sélection : un texte est vidé, le bouton, la bannière
  // et la mention sont masqués, un trait est retiré ; « Annuler » revient en
  // arrière. Photo et logo, hors historique, sont d'abord confirmés (même
  // confirmation que le lien « Retirer » des champs d'image).
  const [confirmImage, setConfirmImage] = useState(null);
  const [confirmImageOpen, setConfirmImageOpen] = useState(false);
  const removeImage = useRemoveSignatureImage(id);
  const deleteSelected = useCallback(() => {
    if (isReadOnly) return;
    const what = deleteFor(sig, selected);
    if (!what) return;
    if (what.image) {
      setConfirmImage(what.image);
      setConfirmImageOpen(true);
      return;
    }
    const label = selectionLabel(selected, sig?.style);
    update(what.update);
    setSelected(null);
    toast.document(`Retiré : ${label}`, {
      fallbackIcon: Trash2,
      action: { label: "Annuler", onClick: () => undo() },
      duration: 6000,
    });
  }, [isReadOnly, sig, selected, update, undo]);
  const confirmRemoveImage = async () => {
    const updated = await removeImage(confirmImage === "photo" ? "PHOTO" : "LOGO");
    if (updated) {
      replace(updated);
      setSelected(null);
    }
  };
  // Même touche, focus hors de l'aperçu (page, pas un champ ni le panneau)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      if (!selected || isReadOnly) return;
      const t = e.target;
      const onPage =
        t === document.body ||
        t === document.documentElement ||
        t?.closest?.("[data-tour='preview']");
      if (!onPage || t?.closest?.("input, textarea, select, [contenteditable]")) {
        return;
      }
      e.preventDefault();
      deleteSelected();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, isReadOnly, deleteSelected]);

  // Depuis un réglage sans objet (« Ajouter une photo »…) : onglet Contenu,
  // puis le champ concerné
  const goToField = useCallback((field) => {
    setSelected(null);
    setTab("content");
    const focus = (attempt = 0) => {
      const el = document.getElementById(`sig-field-${field}`);
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        if (typeof el.focus === "function") el.focus({ preventScroll: true });
      } else if (attempt < 10) {
        setTimeout(() => focus(attempt + 1), 60);
      }
    };
    setTimeout(() => focus(), 30);
  }, []);

  // E-mail de test : la saisie en cours est d'abord enregistrée
  const [sendTest, { loading: testing }] = useMutation(SEND_SIGNATURE_V2_TEST);
  const handleTest = async () => {
    try {
      await flush();
      const { data } = await sendTest({ variables: { id } });
      toast.success(
        `E-mail de test envoyé à ${data?.sendEmailSignatureV2Test || "votre adresse"}`,
      );
    } catch (err) {
      toast.error(
        err?.graphQLErrors?.[0]?.message || "L'e-mail de test n'a pas pu être envoyé",
      );
    }
  };

  const [duplicate] = useMutation(DUPLICATE_SIGNATURE_V2, {
    refetchQueries: [{ query: SIGNATURES_V2 }],
  });
  const [setDefault] = useMutation(SET_DEFAULT_SIGNATURE_V2, {
    refetchQueries: [{ query: SIGNATURES_V2 }],
  });
  const [remove] = useMutation(DELETE_SIGNATURE_V2, {
    refetchQueries: [{ query: SIGNATURES_V2 }],
  });

  const template =
    catalog?.templates?.find((t) => t.id === sig?.templateId) || null;
  const client = useApolloClient();

  const handleCopy = async () => {
    await flush();
    // Rendu à jour : l'aperçu peut avoir un temps de retard sur la frappe
    let fresh = render;
    try {
      const { data } = await client.query({
        query: RENDER_SIGNATURE_V2,
        variables: { id, input: toInput(sig) },
        fetchPolicy: "no-cache",
      });
      fresh = data?.renderEmailSignatureV2 || render;
    } catch {
      // À défaut, le dernier rendu affiché
    }
    const ok = await copySignatureHtml(fresh?.html, fresh?.text);
    if (ok) {
      setCopied(true);
      toast.success("Signature copiée, collez-la dans votre client mail");
      setTimeout(() => setCopied(false), 2500);
    } else {
      toast.error(
        "Copie impossible, utilisez « Installer » puis le téléchargement HTML",
      );
    }
  };

  const handleBack = async () => {
    // Une modification pas encore enregistrée ne se perd pas en partant
    if ((await flush()) === false) {
      toast.error(
        "Vos dernières modifications ne sont pas encore enregistrées : réessayez dans un instant",
      );
      return;
    }
    router.push(LIST_URL);
  };

  const handleDuplicate = async () => {
    await flush();
    try {
      const { data } = await duplicate({ variables: { id } });
      toast.success("Signature dupliquée");
      router.push(`${LIST_URL}/${data.duplicateEmailSignatureV2.id}`);
    } catch {
      toast.error("Duplication impossible");
    }
  };

  const handleSetDefault = async () => {
    try {
      await setDefault({ variables: { id } });
      replace({ isDefault: true });
      toast.success("Signature définie par défaut");
    } catch {
      toast.error("Action impossible");
    }
  };

  const handleDelete = async () => {
    try {
      await remove({ variables: { id } });
      toast.success("Signature supprimée");
      router.push(LIST_URL);
    } catch {
      toast.error("Suppression impossible");
    }
  };

  if (error) {
    return (
      <div className="flex h-[calc(100vh-64px)] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-muted-foreground">
          {"Cette signature est introuvable ou n'est plus accessible."}
        </p>
        <Button
          variant="outline"
          onClick={() => router.push(LIST_URL)}
          className="cursor-pointer"
        >
          <ArrowLeft size={14} />
          Retour aux signatures
        </Button>
      </div>
    );
  }

  if (loading || !sig) return <SignatureEditorV2Skeleton />;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white dark:bg-neutral-950">
      {/* Panneau gauche, au style des éditeurs de documents */}
      <aside
        ref={panelRef}
        className="flex w-[420px] shrink-0 flex-col border-r border-[#EEEFF1] dark:border-[#232323]"
      >
        <div className="px-6 pb-4 pt-5">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="-ml-2 h-8 w-8 shrink-0 cursor-pointer"
              onClick={handleBack}
              aria-label="Retour aux signatures"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Input
              value={sig.name}
              onChange={(e) => update({ name: e.target.value })}
              maxLength={120}
              className="h-10 min-w-0 flex-1 border-transparent px-2 text-xl font-medium shadow-none hover:border-[#e6e7ea] focus:border-[#D1D3D8] dark:border-transparent dark:hover:border-[#2E2E32] dark:focus:border-[#44444A]"
              aria-label="Nom de la signature"
              disabled={isReadOnly}
            />
          </div>
          {/* Ligne toujours présente : l'état d'enregistrement qui apparaît
              et disparaît ne fait pas bouger les onglets */}
          <div className="flex h-5 items-center gap-3 pl-9">
            <SaveStatus status={status} />
            {sig.isDefault && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star size={11} className="fill-current" />
                Par défaut
              </span>
            )}
          </div>
        </div>

        {selected ? (
          <ScrollArea
            key={`${selected.level}-${selected.key || ""}`}
            className="min-h-0 flex-1 border-t border-[#EEEFF1] dark:border-[#232323]"
          >
            {/* Lecture seule : l'en-tête (retour, niveaux) reste utilisable,
                les réglages sont seulement affichés */}
            <div className="px-6 pt-6">
              <LevelHeader
                selected={selected}
                st={sig.style}
                ancestors={ancestorsOf(selected, sig)}
                onSelect={select}
                onClose={() => setSelected(null)}
              />
            </div>
            <div
              className={`space-y-8 px-6 pb-6 pt-8 ${isReadOnly ? "pointer-events-none opacity-60" : ""}`}
              inert={isReadOnly}
            >
              {selected.level === "element" && (
                <ElementPanel
                  element={selected.key}
                  id={id}
                  sig={sig}
                  update={update}
                  replace={replace}
                  catalog={catalog}
                  resolved={render?.elements}
                  lines={render?.lines}
                  onSelect={select}
                />
              )}
              {selected.level === "item" && (
                <ItemPanel
                  item={selected.key}
                  sig={sig}
                  update={update}
                  resolved={render?.elements}
                  catalog={catalog}
                />
              )}
              {selected.level === "slot" && (
                <SlotPanel
                  slot={selected.key}
                  sig={sig}
                  update={update}
                  lines={render?.lines}
                  onSelect={select}
                />
              )}
              {selected.level === "signature" && (
                <StylePanel
                  sig={sig}
                  update={update}
                  catalog={catalog}
                  template={template}
                  lines={render?.lines}
                  onGoTo={goToField}
                  onSelect={select}
                />
              )}
            </div>
          </ScrollArea>
        ) : (
          <TabsNew
            value={tab}
            onValueChange={setTab}
            className="min-h-0 flex-1"
          >
            <TabsNewList>
              {/* Toujours là, même avec un seul modèle proposé : on y
                  enregistre et réutilise ses propres modèles */}
              <TabsNewTrigger value="template">
                <LayoutTemplate className="h-3.5 w-3.5" />
                Modèle
              </TabsNewTrigger>
              <TabsNewTrigger value="content">
                <PenLine className="h-3.5 w-3.5" />
                Contenu
              </TabsNewTrigger>
              <TabsNewTrigger value="style">
                <Palette className="h-3.5 w-3.5" />
                Style
              </TabsNewTrigger>
            </TabsNewList>
            <ScrollArea className="min-h-0 flex-1">
              <div
                className={`px-6 py-6 ${isReadOnly ? "pointer-events-none opacity-60" : ""}`}
                // Lecture seule : ni souris ni clavier (onglets, champs)
                inert={isReadOnly}
              >
                <TabsNewContent value="template">
                  <TemplateGallery
                    sig={sig}
                    update={update}
                    catalog={catalog}
                    onUndo={undo}
                  />
                </TabsNewContent>
                <TabsNewContent value="content">
                  <ContentPanel
                    id={id}
                    sig={sig}
                    update={update}
                    replace={replace}
                    flush={flush}
                    catalog={catalog}
                    template={template}
                  />
                </TabsNewContent>
                <TabsNewContent value="style">
                  <StylePanel
                    sig={sig}
                    update={update}
                    catalog={catalog}
                    template={template}
                    lines={render?.lines}
                    onGoTo={goToField}
                    onSelect={select}
                  />
                </TabsNewContent>
              </div>
            </ScrollArea>
          </TabsNew>
        )}
      </aside>

      {/* Aperçu */}
      <main className="flex min-w-0 flex-1 flex-col bg-neutral-50 dark:bg-neutral-900">
        <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-6 py-3 dark:border-neutral-800">
          <div className="min-w-0">
            <h1 className="sr-only">{sig.name}</h1>
            {template && (
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setTab("template");
                }}
                className="group inline-flex items-center gap-1.5 rounded-md px-2 py-1 -ml-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
              >
                <LayoutTemplate size={14} />
                Modèle <span className="font-medium text-foreground">{template.name}</span>
                <span className="inline-flex items-center text-xs text-[#5b4fff] opacity-0 transition-opacity group-hover:opacity-100">
                  Changer
                  <ChevronRight size={12} />
                </span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="mr-1 flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 cursor-pointer"
                onClick={undo}
                disabled={!canUndo || isReadOnly}
                aria-label="Annuler"
                title="Annuler (⌘Z)"
              >
                <Undo2 size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 cursor-pointer"
                onClick={redo}
                disabled={!canRedo || isReadOnly}
                aria-label="Rétablir"
                title="Rétablir (⇧⌘Z)"
              >
                <Redo2 size={16} />
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={handleCopy}
              disabled={!render?.html}
              className="cursor-pointer"
              title="Copier la signature pour la coller dans les réglages de votre messagerie"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copiée" : "Copier"}
            </Button>
            <div data-tour="actions" className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={!render?.html || testing}
                className="cursor-pointer"
                title="Recevoir la signature dans votre boîte mail pour la vérifier"
              >
                {testing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <MailCheck size={14} />
                )}
                M&apos;envoyer un test
              </Button>
              <Button
                variant="primary"
                onClick={() => setInstallOpen(true)}
                disabled={!render?.html}
                className="cursor-pointer"
              >
                <Send size={14} />
                Installer dans ma messagerie
              </Button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 cursor-pointer"
                  aria-label="Plus d'actions"
                >
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleSetDefault}
                  disabled={sig.isDefault || isReadOnly}
                >
                  <Star size={14} />
                  Définir par défaut
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDuplicate}
                  disabled={isReadOnly}
                >
                  <CopyPlus size={14} />
                  Dupliquer
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setConfirmDelete(true)}
                  disabled={isReadOnly}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 size={14} />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="min-h-0 flex-1 p-6">
          <div data-tour="preview" className="mx-auto h-full max-w-3xl">
            <SignaturePreview
              id={id}
              sig={sig}
              initialRender={initialRender}
              onRender={onRender}
              onFieldClick={onFieldClick}
              onTextInput={isReadOnly ? undefined : onTextInput}
              onStylePatch={onStylePatch}
              onHistory={isReadOnly ? undefined : onHistory}
              selection={selection}
              onResize={onResize}
              onFont={isReadOnly ? undefined : onFont}
              onEscape={onEscape}
              onDelete={deleteSelected}
              readOnly={isReadOnly}
            />
          </div>
        </div>

        {(render?.warnings?.length > 0 || render?.chars > 0) && (
          <div className="flex items-center justify-between gap-4 border-t border-neutral-200 px-6 py-2 text-xs dark:border-neutral-800">
            <div className="min-w-0 truncate text-amber-700 dark:text-amber-300">
              {/* L'alerte de taille Gmail est portée par la jauge */}
              {render?.warnings?.find((w) => !w.includes("Gmail")) || ""}
            </div>
            {render?.chars > 0 && (
              <GmailSize
                chars={render.chars}
                max={catalog?.gmailMaxChars || 10000}
              />
            )}
          </div>
        )}
      </main>

      {!isReadOnly && (
        <EditorTour
          steps={[
            {
              target: "preview",
              title: "Cliquez sur un élément pour le modifier",
              body: "Un texte se change directement dans l'aperçu. Ses réglages s'ouvrent à gauche. ⌘ + clic (Ctrl + clic) sélectionne le niveau au-dessus : l'élément entier, sa colonne, puis toute la signature.",
            },
            {
              target: "preview",
              title: "Déplacez et élargissez",
              body: "Cliquez sur un élément : sa poignée ⠿ apparaît, tirez-la pour le déplacer. Tirez le bord de son cadre pour l'élargir, ou son coin pour agrandir le texte.",
            },
            {
              target: "actions",
              title: "Vérifiez, puis installez",
              body: "Envoyez-vous un e-mail de test pour la voir dans votre messagerie, puis installez-la dans Gmail, Outlook ou Apple Mail.",
            },
          ]}
        />
      )}

      <InstallDialog
        open={installOpen}
        onOpenChange={setInstallOpen}
        render={render}
        name={sig.name}
        gmailMaxChars={catalog?.gmailMaxChars || 10000}
      />

      <ConfirmRemoveImage
        kind={confirmImage === "photo" ? "PHOTO" : "LOGO"}
        open={confirmImageOpen}
        onOpenChange={setConfirmImageOpen}
        onConfirm={confirmRemoveImage}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette signature ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {sig.name} » sera supprimée de Newbi. Si elle est installée dans
              votre messagerie, elle continuera de s&apos;afficher normalement,
              images comprises. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700 cursor-pointer"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
