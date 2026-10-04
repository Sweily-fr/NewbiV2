"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  layoutCustomized,
  shownItems,
  templateChanges,
  templateLayout,
  templateReference,
} from "../slots";
import HtmlFrame from "./HtmlFrame";
import { Row, Section } from "./controls";
import {
  IdentityZoneControl,
  PhotoLayoutControls,
  TextAlignControl,
} from "./LayoutControls";

/** Vignette : marge autour de la signature, dans l'aperçu (px). */
const THUMB_PADDING = 16;
/** Échelle maximale : une signature étroite n'est pas grossie au-delà. */
const THUMB_MAX_SCALE = 0.75;
/** Hauteurs de vignette (px) ; au-delà du plafond, un fondu en bas. */
const THUMB_MIN_HEIGHT = 72;
const THUMB_MAX_HEIGHT = 320;
/**
 * Largeur de mise en page de l'aperçu, au moins : plus que la plus large
 * signature (720 px et ses marges), pour qu'elle s'y étale comme dans un
 * e-mail, sans retour à la ligne.
 */
const LAYOUT_WIDTH = 800;

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
  // La signature entière dans la largeur de la tuile : sa taille, mesurée
  // dans l'aperçu, donne l'échelle (0,75 au plus) et la hauteur de la
  // vignette. Squelette jusqu'à la première mesure.
  const boxRef = useRef(null);
  const [boxWidth, setBoxWidth] = useState(0);
  const [size, setSize] = useState(null);
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return undefined;
    const observer = new ResizeObserver(([entry]) =>
      setBoxWidth(Math.floor(entry.contentRect.width)),
    );
    observer.observe(box);
    return () => observer.disconnect();
  }, []);
  const ready = Boolean(size && boxWidth);
  const scale = ready
    ? Math.min(
        THUMB_MAX_SCALE,
        boxWidth / Math.max(1, size.width + 2 * THUMB_PADDING),
      )
    : 0.5;
  const fullHeight = ready ? Math.ceil(size.height * scale) : 0;
  const height = ready
    ? Math.max(THUMB_MIN_HEIGHT, Math.min(THUMB_MAX_HEIGHT, fullHeight))
    : 150;
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
          ref={boxRef}
          className="relative overflow-hidden bg-white"
          style={{ height, width: "100%" }}
        >
          {!(loading && !html) && (
            // Image seulement : ni ses liens ni le cadre ne sont atteignables
            // au clavier ou annoncés, un seul arrêt par tuile
            <div
              className={cn(
                "pointer-events-none absolute left-0 top-0",
                !ready && "opacity-0",
              )}
              inert
            >
              <HtmlFrame
                html={html}
                width={Math.max(
                  LAYOUT_WIDTH,
                  ready ? Math.ceil(boxWidth / scale) : 0,
                )}
                height={ready ? size.height : 600}
                scale={scale}
                padding={THUMB_PADDING}
                title={`Modèle ${name}`}
                onSize={setSize}
              />
            </div>
          )}
          {!ready && <Skeleton className="absolute inset-3" />}
          {/* Signature plus haute que la vignette : fondu en bas */}
          {fullHeight > THUMB_MAX_HEIGHT && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" />
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

function SavedTemplateCard({
  template,
  content,
  sigId,
  selected,
  onSelect,
  onDelete,
}) {
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
      selected={selected}
      onSelect={onSelect}
      // Corbeille pour son auteur, le propriétaire ou un administrateur
      onDelete={template.canDelete ? onDelete : null}
    />
  );
}

/**
 * Couleurs de l'utilisateur pour les vignettes : la palette d'un modèle
 * l'emporte (Newbi), sinon ce sont les siennes, comme à l'application.
 */
const THUMB_COLORS = ["primaryColor", "textColor", "mutedColor"];

/** « a, b et c ». */
const listing = (items) =>
  items.length > 1
    ? `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`
    : items[0] || "";

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
  // Modèle en attente de confirmation (disposition personnalisée, retour
  // au modèle) : gardé pendant la fermeture, le texte ne change pas en
  // plein fondu
  const [pending, setPending] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const askConfirm = (request) => {
    setPending(request);
    setConfirmOpen(true);
  };
  // Enregistrement d'un modèle (nom saisi) et suppression à confirmer
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [toDelete, setToDelete] = useState(null);

  const {
    data: savedData,
    loading: savedLoading,
    refetch: refetchSaved,
  } = useQuery(SIGNATURE_TEMPLATES_V2, { fetchPolicy: "cache-and-network" });
  const saved = savedData?.emailSignatureTemplatesV2 || [];
  // Modèle de référence : le modèle d'équipe appliqué s'il existe encore,
  // sinon le modèle intégré (coché, et celui auquel on revient)
  const current = templateReference(
    sig,
    all,
    savedData || !savedLoading ? saved : null,
  );
  const isCurrent = (t, isSaved) =>
    Boolean(current) &&
    current.id === t.id &&
    Boolean(current.saved) === isSaved;
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
  // à la présence d'une photo. Plus aucun modèle d'équipe n'est suivi.
  const apply = (t) => {
    const preset = Object.fromEntries(
      Object.entries(templateLayout(t.defaults, sig) || t.preset || {}).filter(
        ([key, value]) =>
          key !== "__typename" && value !== null && value !== undefined,
      ),
    );
    update({ templateId: t.id, savedTemplateId: null, style: preset });
    applied(t.name);
  };

  // Modèle enregistré : tout son style, couleurs comprises, tel quel (ses
  // largeurs vont avec ses places) ; la signature le suit désormais
  const applySaved = (t) => {
    // eslint-disable-next-line no-unused-vars
    const { __typename, ...style } = t.style;
    update(
      {
        templateId: t.templateId,
        savedTemplateId: t.id,
        style: templateLayout(style, sig),
      },
      { asIs: true },
    );
    applied(t.name);
  };

  const choose = (t, isSaved = false) => {
    // Modèle de la signature : un retour, confirmé en nommant ce qu'il
    // remet, ou rien à faire s'il est déjà suivi
    if (isCurrent(t, isSaved)) {
      const changes = templateChanges(sig, current);
      if (changes.length === 0) {
        toast.info(`Votre signature suit déjà le modèle ${t.name}`);
        return;
      }
      askConfirm({ template: t, saved: isSaved, changes });
      return;
    }
    if (layoutCustomized(sig, current)) {
      askConfirm({ template: t, saved: isSaved });
    } else if (isSaved) applySaved(t);
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
      const { data } = await saveTemplate({
        variables: {
          input: {
            name: trimmedName,
            templateId: sig.templateId,
            style: toStyleInput(sig.style),
          },
        },
      });
      setSaveOpen(false);
      // Un modèle remplacé ne change aucune signature d'elle-même
      if (replacing) {
        toast.success(`Modèle « ${trimmedName} » mis à jour`, {
          description:
            "Les autres signatures qui l'utilisent gardent l'ancienne version.",
        });
      } else {
        toast.success(`Modèle « ${trimmedName} » enregistré`);
      }
      refetchSaved();
      // Cette signature est désormais ce modèle : il est coché, et c'est à
      // lui qu'elle revient
      const savedId = data?.saveEmailSignatureTemplateV2?.id;
      if (savedId && savedId !== sig.savedTemplateId) {
        update({ savedTemplateId: savedId });
      }
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
      // La signature qui le suivait revient au modèle intégré comme
      // référence (sa mise en forme ne change pas)
      if (t.id === sig.savedTemplateId) update({ savedTemplateId: null });
    } catch (err) {
      toast.error(
        err?.graphQLErrors?.[0]?.message || "Suppression impossible",
      );
    }
  };

  // Dispositions toutes faites : les vignettes de Style › Disposition,
  // montrées dès l'onglet Modèle (une signature neuve s'ouvre ici)
  const setStyle = (patch) => update({ style: patch });
  const shown = shownItems(sig);
  const hasPhoto = Boolean(sig.images?.photo?.url);

  const target = pending?.template;
  // Retour au modèle de la signature (ce qu'il remet est nommé)
  const returning = Boolean(pending?.changes);
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
              selected={isCurrent(t, false)}
              sigId={sig.id}
              onSelect={() => choose(t)}
            />
          ))}
        </div>
      </Section>

      <Section
        title="Disposition"
        description="Photo au-dessus, nom dans un bandeau ou dans une colonne de couleur, en un clic : vos couleurs et votre police sont gardées."
      >
        <IdentityZoneControl st={sig.style} setStyle={setStyle} />
        {hasPhoto ? (
          <PhotoLayoutControls st={sig.style} setStyle={setStyle} shown={shown} />
        ) : (
          <TextAlignControl st={sig.style} setStyle={setStyle} shown={shown} />
        )}
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
                selected={isCurrent(t, true)}
                onSelect={() => choose(t, true)}
                onDelete={() => setToDelete(t)}
              />
            ))}
          </div>
        )}
      </Section>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {returning
                ? `Revenir au modèle ${target?.name} ?`
                : `Appliquer le modèle ${target?.name} ?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {returning
                ? `Cela remet ${listing(pending.changes)} comme dans le modèle. Vos textes et vos images sont conservés, et vous pourrez annuler.`
                : "Vous avez personnalisé la disposition (éléments déplacés, largeurs, espaces ou traits sur mesure). Elle sera remplacée par celle du modèle, couleurs comprises. Vos textes et vos images sont conservés, et vous pourrez annuler."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              {returning ? "Garder mes réglages" : "Garder ma disposition"}
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer"
              onClick={() => {
                setConfirmOpen(false);
                if (!pending) return;
                if (pending.saved) applySaved(pending.template);
                else apply(pending.template);
              }}
            >
              {returning ? "Revenir au modèle" : "Appliquer le modèle"}
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
              {toDelete && !toDelete.mine
                ? "Il a été enregistré par un autre membre de l'équipe. "
                : ""}
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
                  ? `Remplacera votre modèle « ${trimmedName} ». Les signatures qui l'utilisent déjà ne changeront pas : chacun devra l'appliquer à nouveau, puis réinstaller sa signature.`
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
