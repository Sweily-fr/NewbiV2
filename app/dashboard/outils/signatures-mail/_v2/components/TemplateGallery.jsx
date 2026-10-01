"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { BookmarkPlus, Check, LayoutTemplate, Trash2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { toast } from "@/src/components/ui/sonner";
import {
  DELETE_SIGNATURE_TEMPLATE_V2,
  RENDER_SAVED_TEMPLATE_V2,
  RENDER_TEMPLATE_V2,
  SAVE_SIGNATURE_TEMPLATE_V2,
  SIGNATURE_TEMPLATES_V2,
  toInput,
  toStyleInput,
} from "../graphql";
import { layoutCustomized, templateLayout } from "../slots";
import HtmlFrame from "./HtmlFrame";
import { Row, Section } from "./controls";

const THUMB_WIDTH = 560;
const THUMB_HEIGHT = 300;

/** Carte d'un modèle : vignette, nom, description ; suppression à part. */
function TemplateTile({
  html,
  loading,
  name,
  description,
  selected = false,
  onSelect,
  onDelete,
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "relative w-full overflow-hidden rounded-xl border text-left shadow-xs transition-[border-color,box-shadow] cursor-pointer",
          selected ? "border-ring" : "border-input hover:border-ring/60",
        )}
        aria-pressed={selected}
      >
        <div
          className="relative overflow-hidden bg-white"
          style={{ height: THUMB_HEIGHT * 0.5, width: "100%" }}
        >
          {loading && !html ? (
            <Skeleton className="absolute inset-3" />
          ) : (
            <div className="pointer-events-none absolute left-0 top-0">
              <HtmlFrame
                html={html}
                width={THUMB_WIDTH}
                height={THUMB_HEIGHT}
                scale={0.5}
                padding={16}
                title={`Modèle ${name}`}
              />
            </div>
          )}
        </div>
        <div
          className={cn(
            "border-t px-3 py-2.5 transition-colors",
            selected ? "bg-accent" : "bg-background",
          )}
        >
          <div className="flex items-center gap-1.5 text-sm font-medium">
            {selected && <Check size={14} aria-hidden="true" />}
            {name}
          </div>
          {description && (
            <div className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </div>
          )}
        </div>
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Supprimer le modèle ${name}`}
          title="Supprimer ce modèle"
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md border bg-background text-muted-foreground opacity-0 shadow-xs transition-opacity hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100 cursor-pointer"
        >
          <Trash2 size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function TemplateCard({ template, style, sigId, selected, onSelect }) {
  // Rendu avec les informations de la signature (nom, photo, logo…) :
  // rafraîchi à chaque ouverture de l'onglet
  const { data, loading } = useQuery(RENDER_TEMPLATE_V2, {
    variables: { templateId: template.id, style, id: sigId },
    fetchPolicy: "cache-and-network",
  });
  return (
    <TemplateTile
      html={data?.renderSignatureTemplateV2?.html}
      loading={loading}
      name={template.name}
      description={template.description}
      selected={selected}
      onSelect={onSelect}
    />
  );
}

function SavedTemplateCard({ template, content, sigId, onSelect, onDelete }) {
  // La signature en cours (textes, images) avec le style du modèle
  const input = useMemo(
    () => ({
      ...content,
      templateId: template.templateId,
      style: toStyleInput(template.style),
    }),
    [content, template],
  );
  const { data, loading } = useQuery(RENDER_SAVED_TEMPLATE_V2, {
    variables: { id: sigId, input },
    fetchPolicy: "cache-and-network",
  });
  return (
    <TemplateTile
      html={data?.renderEmailSignatureV2?.html}
      loading={loading}
      name={template.name}
      onSelect={onSelect}
      onDelete={template.mine ? onDelete : null}
    />
  );
}

/**
 * Couleurs de l'utilisateur pour les vignettes : la palette d'un modèle
 * l'emporte (Newbi), sinon ce sont les siennes, comme à l'application.
 */
const THUMB_COLORS = ["primaryColor", "textColor", "mutedColor"];

/**
 * Galerie des modèles, rendus par l'API avec les informations de la
 * signature (ou des données d'exemple tant qu'elle n'a pas de nom), pour
 * choisir en connaissance de cause : le modèle Newbi, puis les modèles
 * enregistrés par l'équipe (« Vos modèles »).
 */
export default function TemplateGallery({ sig, update, catalog, onUndo }) {
  // Seuls les modèles proposés (les autres ne servent qu'aux signatures
  // qui les utilisent encore)
  const all = catalog?.templates || [];
  const templates = all.filter((t) => t.inGallery !== false);
  const current = all.find((t) => t.id === sig.templateId);
  // Modèle en attente de confirmation (disposition personnalisée)
  const [pending, setPending] = useState(null);
  // Enregistrement d'un modèle (nom saisi) et suppression à confirmer
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [toDelete, setToDelete] = useState(null);

  const { data: savedData, refetch: refetchSaved } = useQuery(
    SIGNATURE_TEMPLATES_V2,
    { fetchPolicy: "cache-and-network" },
  );
  const saved = savedData?.emailSignatureTemplatesV2 || [];
  const [saveTemplate, { loading: savingTemplate }] = useMutation(
    SAVE_SIGNATURE_TEMPLATE_V2,
  );
  const [deleteTemplate] = useMutation(DELETE_SIGNATURE_TEMPLATE_V2);

  const applied = (name) =>
    toast.document(`Modèle ${name} appliqué`, {
      fallbackIcon: LayoutTemplate,
      ...(onUndo
        ? { action: { label: "Annuler", onClick: () => onUndo() } }
        : {}),
      duration: 6000,
    });

  // Le modèle apporte sa disposition, sa typographie, ses finitions
  // (traits, icônes) et sa palette s'il en a une (Newbi : neutre), adaptées
  // à la présence d'une photo.
  const apply = (t) => {
    const preset = Object.fromEntries(
      Object.entries(templateLayout(t.defaults, sig) || t.preset || {}).filter(
        ([key, value]) =>
          key !== "__typename" && value !== null && value !== undefined,
      ),
    );
    update({ templateId: t.id, style: preset });
    applied(t.name);
  };

  // Modèle enregistré : tout son style, couleurs comprises, tel quel (ses
  // largeurs vont avec ses places)
  const applySaved = (t) => {
    // eslint-disable-next-line no-unused-vars
    const { __typename, ...style } = t.style;
    update(
      { templateId: t.templateId, style: templateLayout(style, sig) },
      { asIs: true },
    );
    applied(t.name);
  };

  const choose = (t, isSaved = false) => {
    const customized = layoutCustomized(sig, current);
    if (!isSaved && t.id === sig.templateId && !customized) return;
    if (customized) setPending({ template: t, saved: isSaved });
    else if (isSaved) applySaved(t);
    else apply(t);
  };

  // Les vignettes du modèle n'utilisent que les couleurs principales : les
  // autres réglages ne doivent pas relancer leur rendu à chaque changement
  const style = Object.fromEntries(
    THUMB_COLORS.filter((key) => sig.style?.[key]).map((key) => [
      key,
      sig.style[key],
    ]),
  );
  // Vignettes de « Vos modèles » : les textes de la signature, sans
  // bannière ni mention (identiques d'un modèle à l'autre)
  const content = useMemo(() => {
    const { identity, contact, social, cta } = toInput({
      identity: sig.identity,
      contact: sig.contact,
      social: sig.social,
      cta: sig.cta,
    });
    return {
      identity,
      contact,
      social,
      cta,
      banner: { enabled: false },
      disclaimer: { enabled: false },
    };
  }, [sig.identity, sig.contact, sig.social, sig.cta]);

  const mineNames = saved.filter((t) => t.mine).map((t) => t.name);
  const trimmedName = saveName.replace(/\s+/g, " ").trim();
  const replacing = mineNames.includes(trimmedName);

  const openSave = () => {
    setSaveName(sig.name || "");
    setSaveOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!trimmedName || savingTemplate) return;
    try {
      await saveTemplate({
        variables: {
          input: {
            name: trimmedName,
            templateId: sig.templateId,
            style: toStyleInput(sig.style),
          },
        },
      });
      setSaveOpen(false);
      toast.success(`Modèle « ${trimmedName} » enregistré`);
      refetchSaved();
    } catch (err) {
      toast.error(
        err?.graphQLErrors?.[0]?.message ||
          "Enregistrement du modèle impossible pour l'instant",
      );
    }
  };

  const remove = async () => {
    const t = toDelete;
    setToDelete(null);
    if (!t) return;
    try {
      await deleteTemplate({ variables: { id: t.id } });
      toast.success(`Modèle « ${t.name} » supprimé`);
      refetchSaved();
    } catch (err) {
      toast.error(
        err?.graphQLErrors?.[0]?.message || "Suppression impossible",
      );
    }
  };

  const target = pending?.template;
  return (
    <div className="space-y-8">
      <Section
        title={templates.length > 1 ? "Modèles" : "Modèle"}
        description="Il apporte sa disposition, sa typographie et ses couleurs. Vos textes et vos images sont conservés."
      >
        <div className="grid grid-cols-1 gap-4">
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              style={style}
              selected={sig.templateId === t.id}
              sigId={sig.id}
              onSelect={() => choose(t)}
            />
          ))}
        </div>
      </Section>

      <Section
        title="Vos modèles"
        description="Votre mise en forme, couleurs comprises, à réutiliser pour d'autres signatures. Proposés à toute votre équipe."
      >
        <Button
          type="button"
          variant="outline"
          className="w-full cursor-pointer"
          onClick={openSave}
        >
          <BookmarkPlus className="h-4 w-4" aria-hidden="true" />
          Enregistrer cette signature comme modèle
        </Button>
        {saved.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {saved.map((t) => (
              <SavedTemplateCard
                key={t.id}
                template={t}
                content={content}
                sigId={sig.id}
                onSelect={() => choose(t, true)}
                onDelete={() => setToDelete(t)}
              />
            ))}
          </div>
        )}
      </Section>

      <AlertDialog
        open={Boolean(pending)}
        onOpenChange={(open) => !open && setPending(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {!pending?.saved && target?.id === sig.templateId
                ? `Revenir au modèle ${target?.name} ?`
                : `Appliquer le modèle ${target?.name} ?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Vous avez personnalisé la disposition (éléments déplacés,
              largeurs, espaces ou traits sur mesure). Elle sera remplacée par
              celle du modèle, couleurs comprises. Vos textes et vos images
              sont conservés, et vous pourrez annuler.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Garder ma disposition
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer"
              onClick={() => {
                const p = pending;
                setPending(null);
                if (!p) return;
                if (p.saved) applySaved(p.template);
                else apply(p.template);
              }}
            >
              Appliquer le modèle
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer le modèle « {toDelete?.name} » ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Il ne sera plus proposé à votre équipe. Les signatures qui
              l&apos;utilisent gardent leur mise en forme.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Garder
            </AlertDialogCancel>
            <AlertDialogAction className="cursor-pointer" onClick={remove}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={save} className="space-y-5">
            <DialogHeader>
              <DialogTitle>Enregistrer comme modèle</DialogTitle>
              <DialogDescription>
                La disposition, la typographie et les couleurs de cette
                signature, sans ses textes ni ses images. Le modèle est
                proposé à toute votre équipe.
              </DialogDescription>
            </DialogHeader>
            <Row
              label="Nom du modèle"
              htmlFor="sig-template-name"
              hint={
                replacing
                  ? `Remplacera votre modèle « ${trimmedName} ».`
                  : null
              }
            >
              <Input
                id="sig-template-name"
                value={saveName}
                maxLength={60}
                autoFocus
                placeholder="Équipe commerciale"
                onChange={(e) => setSaveName(e.target.value)}
              />
            </Row>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={() => setSaveOpen(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={!trimmedName || savingTemplate}
              >
                {replacing ? "Remplacer" : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
