"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@apollo/client";
import {
  ArrowLeft,
  Check,
  Copy,
  Loader2,
  MoreHorizontal,
  Send,
  Star,
  Trash2,
  CopyPlus,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
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
  SET_DEFAULT_SIGNATURE_V2,
  SIGNATURES_V2,
} from "../graphql";
import { SignatureEditorV2Skeleton } from "./signature-v2-skeleton";
import TemplateGallery from "./TemplateGallery";
import ContentPanel from "./ContentPanel";
import StylePanel from "./StylePanel";
import ExtrasPanel from "./ExtrasPanel";
import SignaturePreview from "./SignaturePreview";
import ElementPanel, { FIELD_ELEMENT } from "./ElementPanel";
import InstallDialog, { copySignatureHtml } from "./InstallDialog";

const LIST_URL = "/dashboard/outils/signatures-mail";

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
    status,
    loading,
    error,
    catalog,
    initialRender,
  } = useSignatureV2(id);

  const [tab, setTab] = useState(isNew ? "template" : "content");
  // Élément cliqué dans l'aperçu : son panneau remplace les onglets
  const [element, setElement] = useState(null);
  const [render, setRender] = useState(initialRender);
  const [installOpen, setInstallOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialRender && !render) setRender(initialRender);
  }, [initialRender, render]);

  const onRender = useCallback((r) => setRender(r), []);

  // Clic sur un élément de l'aperçu : on ouvre son panneau (contenu et
  // mise en forme) puis on amène et focalise le champ cliqué.
  const onFieldClick = useCallback((field) => {
    const target = FIELD_ELEMENT[field];
    if (!target) return;
    setElement(target);
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
  }, []);

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

  const handleCopy = async () => {
    await flush();
    const ok = await copySignatureHtml(render?.html, render?.text);
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
    await flush();
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
      {/* Panneau gauche */}
      <aside className="flex w-[380px] shrink-0 flex-col border-r border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2 px-3 pt-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 cursor-pointer"
            onClick={handleBack}
            aria-label="Retour aux signatures"
          >
            <ArrowLeft size={16} />
          </Button>
          <Input
            value={sig.name}
            onChange={(e) => update({ name: e.target.value })}
            maxLength={120}
            className="h-8 border-transparent bg-transparent px-2 text-sm font-medium shadow-none hover:border-neutral-200 focus:border-neutral-300 dark:hover:border-neutral-700"
            aria-label="Nom de la signature"
            disabled={isReadOnly}
          />
        </div>
        <div className="flex items-center justify-between px-5 pb-2 pt-1">
          <SaveStatus status={status} />
          {sig.isDefault && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Star size={11} className="fill-current" />
              Par défaut
            </span>
          )}
        </div>

        {element ? (
          <ScrollArea className="min-h-0 flex-1">
            <div
              className={`px-4 py-3 ${isReadOnly ? "pointer-events-none opacity-60" : ""}`}
            >
              <ElementPanel
                element={element}
                id={id}
                sig={sig}
                update={update}
                replace={replace}
                catalog={catalog}
                resolved={render?.elements}
                onClose={() => setElement(null)}
              />
            </div>
          </ScrollArea>
        ) : (
          <Tabs
            value={tab}
            onValueChange={setTab}
            className="flex min-h-0 flex-1 flex-col"
          >
            <TabsList className="mx-3 grid grid-cols-4">
              <TabsTrigger value="template" className="text-xs">
                Modèle
              </TabsTrigger>
              <TabsTrigger value="content" className="text-xs">
                Contenu
              </TabsTrigger>
              <TabsTrigger value="style" className="text-xs">
                Style
              </TabsTrigger>
              <TabsTrigger value="extras" className="text-xs">
                Extras
              </TabsTrigger>
            </TabsList>
            <ScrollArea className="min-h-0 flex-1">
              <div
                className={`px-4 py-4 ${isReadOnly ? "pointer-events-none opacity-60" : ""}`}
              >
                <TabsContent value="template" className="mt-0">
                  <TemplateGallery
                    sig={sig}
                    update={update}
                    catalog={catalog}
                  />
                </TabsContent>
                <TabsContent value="content" className="mt-0">
                  <ContentPanel
                    id={id}
                    sig={sig}
                    update={update}
                    replace={replace}
                    flush={flush}
                    catalog={catalog}
                    template={template}
                  />
                </TabsContent>
                <TabsContent value="style" className="mt-0">
                  <StylePanel
                    sig={sig}
                    update={update}
                    catalog={catalog}
                    template={template}
                  />
                </TabsContent>
                <TabsContent value="extras" className="mt-0">
                  <ExtrasPanel sig={sig} update={update} />
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        )}
      </aside>

      {/* Aperçu */}
      <main className="flex min-w-0 flex-1 flex-col bg-neutral-50 dark:bg-neutral-900">
        <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-6 py-3 dark:border-neutral-800">
          <div className="min-w-0">
            <h1 className="truncate text-base font-medium">{sig.name}</h1>
            {template && (
              <p className="text-xs text-muted-foreground">
                Modèle {template.name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleCopy}
              disabled={!render?.html}
              className="cursor-pointer"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copiée" : "Copier"}
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
          <div className="mx-auto h-full max-w-3xl">
            <SignaturePreview
              id={id}
              sig={sig}
              initialRender={initialRender}
              onRender={onRender}
              onFieldClick={onFieldClick}
            />
          </div>
        </div>

        {(render?.warnings?.length > 0 || render?.chars > 0) && (
          <div className="flex items-center justify-between gap-4 border-t border-neutral-200 px-6 py-2 text-xs dark:border-neutral-800">
            <div className="min-w-0 truncate text-amber-700 dark:text-amber-300">
              {render?.warnings?.[0] || ""}
            </div>
            <div
              className={
                render?.chars > (catalog?.gmailMaxChars || 10000)
                  ? "shrink-0 text-red-600"
                  : "shrink-0 text-muted-foreground"
              }
            >
              {render?.chars?.toLocaleString("fr-FR")} /{" "}
              {(catalog?.gmailMaxChars || 10000).toLocaleString("fr-FR")}{" "}
              caractères (Gmail)
            </div>
          </div>
        )}
      </main>

      <InstallDialog
        open={installOpen}
        onOpenChange={setInstallOpen}
        render={render}
        name={sig.name}
        gmailMaxChars={catalog?.gmailMaxChars || 10000}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette signature ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {sig.name} » et ses images seront supprimées. Cette action est
              irréversible.
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
