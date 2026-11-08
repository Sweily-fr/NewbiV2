"use client";

import { useMemo, useState } from "react";
import { format, startOfToday } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarIcon,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  FolderClosed,
  LoaderCircle,
  Lock,
  Pencil,
  Plus,
  Trash2,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
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
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Calendar } from "@/src/components/ui/calendar";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { toast } from "@/src/components/ui/sonner";
import { Switch } from "@/src/components/ui/switch";
import { useDocumentShares } from "@/src/hooks/useDocumentShares";
import { apiRefusalMessage } from "@/src/graphql/mutationErrors";
import { cn } from "@/src/lib/utils";

const EMPTY_FORM = {
  id: null,
  name: "",
  folderIds: [],
  password: "",
  removePassword: false,
  hadPassword: false,
  expiresOn: "",
  passwordError: null,
  error: null,
};

// Même règle que l'API : vide, ou 6 à 72 octets (limite de bcrypt)
function passwordProblem(password) {
  if (!password) return null;
  const bytes = new TextEncoder().encode(password).length;
  if (bytes < 6) return "Le mot de passe doit contenir au moins 6 caractères.";
  if (bytes > 72)
    return "Le mot de passe est trop long (72 caractères maximum).";
  return null;
}

const formatDay = (value) =>
  format(new Date(value), "d MMM yyyy", { locale: fr });

const toDateInput = (value) =>
  value ? format(new Date(value), "yyyy-MM-dd") : "";

// Fin de la journée choisie : l'accès marche encore le jour affiché
const endOfDay = (day) => new Date(`${day}T23:59:59`).toISOString();

const plural = (count, word) => `${count} ${word}${count > 1 ? "s" : ""}`;

function shareStatus(share) {
  if (!share.isFolderAvailable) {
    return { label: "Dossiers fermés", tone: "text-amber-700 bg-amber-50" };
  }
  if (!share.isActive) {
    return { label: "Désactivé", tone: "text-muted-foreground bg-muted" };
  }
  if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
    return { label: "Expiré", tone: "text-muted-foreground bg-muted" };
  }
  return { label: "Actif", tone: "text-emerald-700 bg-emerald-50" };
}

function shareSummary(share) {
  const parts = [
    plural(share.visitors.length, "visiteur"),
    plural(share.totalViews, "consultation"),
    plural(share.totalDownloads, "téléchargement"),
  ];
  if (share.expiresAt) parts.push(`expire le ${formatDay(share.expiresAt)}`);
  return parts.join(" · ");
}

/** Dossiers de l'espace en arbre aplati (ordre du menu, avec profondeur). */
function flattenFolders(folders) {
  const byParent = new Map();
  for (const folder of folders) {
    const key = folder.parentId || null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(folder);
  }
  const rows = [];
  const visit = (parentId, depth, closedAbove) => {
    const children = (byParent.get(parentId) || []).sort(
      (a, b) =>
        (a.order ?? 0) - (b.order ?? 0) ||
        (a.name || "").localeCompare(b.name || "", "fr"),
    );
    for (const folder of children) {
      const closed = closedAbove || folder.visibility === "private";
      rows.push({ folder, depth, closed });
      visit(folder.id, depth + 1, closed);
    }
  };
  visit(null, 0, false);
  return rows;
}

/**
 * Arbre des dossiers pour la sélection. Un dossier partagé ouvre déjà tous
 * ses sous-dossiers : la sélection ne garde que les dossiers « racines »
 * (aucun ancêtre coché) et l'affichage coche leurs descendants.
 */
function buildFolderTree(folders) {
  const parentOf = new Map();
  const childrenOf = new Map();
  for (const folder of folders) {
    const parentId = folder.parentId || null;
    parentOf.set(folder.id, parentId);
    if (!childrenOf.has(parentId)) childrenOf.set(parentId, []);
    childrenOf.get(parentId).push(folder.id);
  }
  const ancestors = (id) => {
    const list = [];
    const seen = new Set([id]);
    let current = parentOf.get(id);
    while (current && !seen.has(current)) {
      list.push(current);
      seen.add(current);
      current = parentOf.get(current);
    }
    return list;
  };
  const descendants = (id) => {
    const list = [];
    const stack = [...(childrenOf.get(id) || [])];
    while (stack.length) {
      const next = stack.pop();
      if (list.includes(next)) continue;
      list.push(next);
      stack.push(...(childrenOf.get(next) || []));
    }
    return list;
  };
  return { childrenOf, ancestors, descendants };
}

/** Garde seulement les dossiers dont aucun ancêtre n'est déjà choisi. */
export function collapseFolderSelection(folders, selected) {
  const { ancestors } = buildFolderTree(folders);
  const set = new Set(selected);
  return selected.filter((id) => !ancestors(id).some((a) => set.has(a)));
}

/**
 * Cocher un dossier coche ses sous-dossiers. Décocher un sous-dossier d'un
 * dossier coché décoche ce dossier et garde ses autres sous-dossiers.
 */
export function toggleFolderSelection(folders, selected, id, checked, closed) {
  const { childrenOf, ancestors, descendants } = buildFolderTree(folders);
  const below = new Set(descendants(id));
  const set = new Set(selected.filter((value) => !below.has(value)));

  if (checked) {
    set.add(id);
    return collapseFolderSelection(folders, [...set]);
  }
  if (set.has(id)) {
    set.delete(id);
    return [...set];
  }
  // Couvert par un ancêtre : on le remplace par les branches voisines
  const path = [...ancestors(id)].reverse(); // racine d'abord
  const coverIndex = path.findIndex((a) => set.has(a));
  if (coverIndex === -1) return [...set];
  const chain = [...path.slice(coverIndex), id];
  set.delete(chain[0]);
  for (let i = 0; i < chain.length - 1; i += 1) {
    for (const child of childrenOf.get(chain[i]) || []) {
      if (child !== chain[i + 1] && !closed.has(child)) set.add(child);
    }
  }
  return [...set];
}

function FolderPicker({ folders, selected, onChange }) {
  const rows = useMemo(() => flattenFolders(folders), [folders]);
  const tree = useMemo(() => buildFolderTree(folders), [folders]);
  const closed = useMemo(
    () => new Set(rows.filter((row) => row.closed).map((row) => row.folder.id)),
    [rows],
  );
  const selectedSet = new Set(selected);
  const isChecked = (id) =>
    !closed.has(id) &&
    (selectedSet.has(id) || tree.ancestors(id).some((a) => selectedSet.has(a)));
  const isPartial = (id) =>
    tree.descendants(id).some((d) => selectedSet.has(d) && !closed.has(d));

  const toggle = (id, checked) =>
    onChange(toggleFolderSelection(folders, selected, id, checked, closed));

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Créez d&apos;abord un dossier à partager.
      </p>
    );
  }
  return (
    <div className="max-h-52 overflow-y-auto rounded-md border p-1">
      {rows.map(({ folder, depth, closed: isClosed }) => {
        const id = `access-folder-${folder.id}`;
        const checked = isChecked(folder.id);
        const state = checked
          ? true
          : isPartial(folder.id)
            ? "indeterminate"
            : false;
        return (
          <label
            key={folder.id}
            htmlFor={id}
            className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm ${
              isClosed ? "opacity-50" : "hover:bg-muted/60 cursor-pointer"
            }`}
            style={{ paddingLeft: 8 + depth * 16 }}
            title={
              isClosed ? "Dossier privé : il ne peut pas être partagé" : ""
            }
          >
            <Checkbox
              id={id}
              disabled={isClosed}
              checked={state}
              onCheckedChange={() => toggle(folder.id, !checked)}
            />
            <FolderClosed className="size-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">{folder.name}</span>
            {isClosed && (
              <Lock className="size-3 text-muted-foreground shrink-0 ml-auto" />
            )}
          </label>
        );
      })}
    </div>
  );
}

/** Même calendrier que le reste de la plateforme (factures, devis…). */
function ExpiryPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const today = startOfToday();
  return (
    <div className="flex items-center gap-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="access-expiry"
            type="button"
            variant="outline"
            className={cn(
              "flex-1 justify-start text-left font-normal",
              !value && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="size-3.5 text-muted-foreground" />
            {value ? formatDay(`${value}T12:00:00`) : "Aucune date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            locale={fr}
            selected={value ? new Date(`${value}T12:00:00`) : undefined}
            defaultMonth={value ? new Date(`${value}T12:00:00`) : today}
            disabled={{ before: today }}
            onSelect={(date) => {
              if (!date) return;
              onChange(format(date, "yyyy-MM-dd"));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {value && (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-9 shrink-0"
          aria-label="Retirer la date d'expiration"
          onClick={() => onChange("")}
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}

function VisitorsSection({ share, isOpen, onToggle, onRevoke, onUnban }) {
  if (share.visitors.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Personne n&apos;a encore ouvert cet accès.
      </p>
    );
  }
  return (
    <div>
      <button
        type="button"
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <ChevronDown className="size-3.5" />
        ) : (
          <ChevronRight className="size-3.5" />
        )}
        Visiteurs ({share.visitors.length})
      </button>
      {isOpen && (
        <ul className="mt-2 space-y-1.5">
          {share.visitors.map((visitor) => (
            <li
              key={visitor.email}
              className="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1.5"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">
                  {visitor.name || visitor.email}
                  {visitor.isBanned && (
                    <span className="ml-2 text-xs text-destructive">
                      Accès retiré
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {visitor.name ? `${visitor.email} · ` : ""}
                  {plural(visitor.visitCount, "visite")} ·{" "}
                  {plural(visitor.downloadCount, "téléchargement")}
                  {visitor.lastVisitAt &&
                    ` · vu le ${formatDay(visitor.lastVisitAt)}`}
                </p>
              </div>
              {visitor.isBanned ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 shrink-0"
                  onClick={() => onUnban(visitor)}
                >
                  <UserCheck className="size-3.5 mr-1.5" />
                  Rétablir
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 shrink-0 text-destructive"
                  onClick={() => onRevoke(visitor)}
                >
                  <UserX className="size-3.5 mr-1.5" />
                  Retirer l&apos;accès
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RequestsSection({ share, isReadOnly, onApprove, onReject }) {
  if (share.accessRequests.length === 0) return null;
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50/60 p-2 space-y-2">
      <p className="text-xs font-medium text-amber-800">
        Demandes d&apos;accès ({share.accessRequests.length})
      </p>
      {share.accessRequests.map((request) => (
        <div key={request.id} className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{request.name || request.email}</p>
            {request.name && (
              <p className="text-xs text-muted-foreground truncate">
                {request.email}
              </p>
            )}
            {request.message && (
              <p className="text-xs text-muted-foreground mt-0.5 break-words">
                « {request.message} »
              </p>
            )}
          </div>
          {!isReadOnly && (
            <div className="flex gap-1 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-7"
                onClick={() => onReject(request)}
              >
                Refuser
              </Button>
              <Button
                size="sm"
                className="h-7"
                onClick={() => onApprove(request)}
              >
                Approuver
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Accès clients : une adresse à envoyer au client, qui ouvre sans compte les
 * dossiers choisis. Comme pour un tableau kanban partagé, le client prouve
 * son adresse e-mail par un code, et on peut lui retirer l'accès.
 */
export default function ClientAccessDialog({
  open,
  onOpenChange,
  folders,
  initialFolderId,
  isReadOnly,
}) {
  const {
    shares,
    loading,
    saving,
    createShare,
    updateShare,
    revokeShare,
    deleteShare,
    revokeVisitor,
    unbanVisitor,
    approveRequest,
    rejectRequest,
  } = useDocumentShares({ poll: open });

  const [form, setForm] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [openVisitors, setOpenVisitors] = useState({});
  const [confirm, setConfirm] = useState(null);

  // Ouvert depuis un dossier : ses accès d'abord
  const orderedShares = useMemo(() => {
    if (!initialFolderId) return shares;
    const has = (share) => share.folderIds.includes(initialFolderId);
    return [...shares.filter(has), ...shares.filter((s) => !has(s))];
  }, [shares, initialFolderId]);

  const closeForm = () => setForm(null);
  const updateForm = (changes) => setForm((prev) => ({ ...prev, ...changes }));

  const runWithToast = async (action, successMessage) => {
    try {
      await action();
      if (successMessage) toast.success(successMessage);
      return true;
    } catch (error) {
      toast.error(apiRefusalMessage(error) || "Une erreur est survenue");
      return false;
    }
  };

  // Le formulaire reste ouvert sur un refus : le message s'affiche dedans
  const saveForm = async (action, successMessage) => {
    try {
      await action();
      toast.success(successMessage);
      closeForm();
    } catch (error) {
      updateForm({
        error: apiRefusalMessage(error) || "Une erreur est survenue",
      });
    }
  };

  const copyLink = async (share) => {
    try {
      await navigator.clipboard.writeText(share.shareUrl);
      setCopiedId(share.id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success("Lien copié");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  const openNewForm = () => {
    const folder = folders.find((f) => f.id === initialFolderId);
    setForm({
      ...EMPTY_FORM,
      name: folder?.name || "",
      folderIds:
        folder && folder.visibility !== "private" ? [initialFolderId] : [],
    });
  };

  const submitForm = async (event) => {
    event.preventDefault();
    const folderIds = collapseFolderSelection(folders, form.folderIds);
    if (folderIds.length === 0) {
      toast.error("Choisissez au moins un dossier");
      return;
    }
    const passwordError = passwordProblem(
      form.removePassword ? "" : form.password,
    );
    if (passwordError) {
      updateForm({ passwordError, error: null });
      return;
    }
    const expiresAt = form.expiresOn ? endOfDay(form.expiresOn) : null;

    if (!form.id) {
      await saveForm(
        () =>
          createShare({
            folderIds,
            name: form.name,
            password: form.password || undefined,
            expiresAt: expiresAt || undefined,
          }),
        "Accès créé",
      );
      return;
    }

    const input = { name: form.name, folderIds, expiresAt };
    if (form.removePassword) input.password = null;
    else if (form.password) input.password = form.password;
    await saveForm(() => updateShare(form.id, input), "Accès modifié");
  };

  const confirmAction = async () => {
    const { kind, share, visitor } = confirm;
    setConfirm(null);
    if (kind === "delete") {
      await runWithToast(() => deleteShare(share.id), "Accès supprimé");
    } else {
      await runWithToast(
        () => revokeVisitor(share.id, visitor.email),
        "Accès retiré",
      );
    }
  };

  const confirmTexts =
    confirm?.kind === "delete"
      ? {
          title: "Supprimer cet accès ?",
          description:
            "Plus personne ne pourra ouvrir les documents par cette adresse. Les documents restent dans vos dossiers.",
          action: "Supprimer",
        }
      : {
          title: `Retirer l'accès de ${confirm?.visitor?.name || confirm?.visitor?.email} ?`,
          description:
            "Cette personne ne pourra plus consulter les documents, même avec le lien. Elle pourra vous demander à retrouver l'accès.",
          action: "Retirer l'accès",
        };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) closeForm();
          onOpenChange(next);
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0 gap-0 flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b">
            <DialogTitle>
              {form
                ? form.id
                  ? "Modifier l'accès client"
                  : "Nouvel accès client"
                : "Accès clients"}
            </DialogTitle>
            <DialogDescription>
              Le client confirme son e-mail par un code et voit les dossiers
              choisis, avec tout ce que vous y ajoutez ensuite. Les dossiers
              privés restent masqués.
            </DialogDescription>
          </DialogHeader>

          {form ? (
            <form
              key="form"
              onSubmit={submitForm}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="access-name">Nom de l&apos;accès</Label>
                  <Input
                    id="access-name"
                    placeholder="Ex. : Client Dupont"
                    maxLength={100}
                    value={form.name}
                    onChange={(e) => updateForm({ name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Dossiers partagés</Label>
                  <FolderPicker
                    folders={folders}
                    selected={form.folderIds}
                    onChange={(folderIds) => updateForm({ folderIds })}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
                  <div className="space-y-1.5">
                    <Label htmlFor="access-password">
                      {form.hadPassword
                        ? "Nouveau mot de passe"
                        : "Mot de passe (facultatif)"}
                    </Label>
                    <Input
                      id="access-password"
                      type="password"
                      autoComplete="new-password"
                      placeholder={
                        form.hadPassword
                          ? "Laisser vide pour le conserver"
                          : "6 caractères minimum"
                      }
                      disabled={form.removePassword}
                      value={form.password}
                      aria-invalid={Boolean(form.passwordError)}
                      aria-describedby={
                        form.passwordError ? "access-password-error" : undefined
                      }
                      onChange={(e) =>
                        updateForm({
                          password: e.target.value,
                          passwordError: null,
                          error: null,
                        })
                      }
                    />
                    {form.passwordError && (
                      <p
                        id="access-password-error"
                        className="text-xs text-destructive"
                      >
                        {form.passwordError}
                      </p>
                    )}
                    {form.hadPassword && (
                      <label className="flex items-center gap-2 pt-2 text-sm text-muted-foreground cursor-pointer">
                        <Switch
                          aria-label="Retirer le mot de passe"
                          checked={form.removePassword}
                          onCheckedChange={(checked) =>
                            updateForm({
                              removePassword: checked,
                              password: "",
                              passwordError: null,
                              error: null,
                            })
                          }
                        />
                        Retirer le mot de passe
                      </label>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="access-expiry">
                      Date d&apos;expiration (facultatif)
                    </Label>
                    <ExpiryPicker
                      value={form.expiresOn}
                      onChange={(expiresOn) => updateForm({ expiresOn })}
                    />
                  </div>
                </div>
              </div>
              {form.error && (
                <p
                  role="alert"
                  className="shrink-0 border-t px-6 py-2 text-sm text-destructive"
                >
                  {form.error}
                </p>
              )}
              <div className="shrink-0 flex justify-end gap-2 border-t px-6 py-3">
                <Button type="button" variant="outline" onClick={closeForm}>
                  Annuler
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && (
                    <LoaderCircle className="size-4 mr-2 animate-spin" />
                  )}
                  {form.id ? "Enregistrer" : "Créer l'accès"}
                </Button>
              </div>
            </form>
          ) : (
            <>
              <div
                key="list"
                className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-3"
              >
                {loading && (
                  <div className="flex justify-center py-6">
                    <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
                  </div>
                )}

                {!loading && orderedShares.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Aucun accès client pour le moment.
                  </p>
                )}

                {orderedShares.map((share) => {
                  const status = shareStatus(share);
                  return (
                    <div
                      key={share.id}
                      className="rounded-lg border p-3 space-y-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {share.name || "Accès client"}
                        </span>
                        {share.hasPassword && (
                          <Lock
                            className="size-3.5 text-muted-foreground shrink-0"
                            aria-label="Protégé par mot de passe"
                          />
                        )}
                        <Badge
                          variant="secondary"
                          className={`ml-auto shrink-0 ${status.tone}`}
                        >
                          {status.label}
                        </Badge>
                        <Switch
                          aria-label="Accès actif"
                          checked={share.isActive}
                          disabled={isReadOnly && !share.isActive}
                          onCheckedChange={(checked) =>
                            runWithToast(() =>
                              checked
                                ? updateShare(share.id, { isActive: true })
                                : revokeShare(share.id),
                            )
                          }
                        />
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {share.folders.map((folder) => (
                          <span
                            key={folder.id}
                            className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs ${
                              folder.available
                                ? ""
                                : "text-amber-700 border-amber-200 line-through"
                            }`}
                            title={
                              folder.available
                                ? undefined
                                : "Dossier privé ou à la corbeille : le client ne le voit plus"
                            }
                          >
                            <FolderClosed className="size-3" />
                            {folder.name}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Input
                          readOnly
                          aria-label="Adresse de l'accès"
                          value={share.shareUrl}
                          className="h-8 text-xs"
                          onFocus={(e) => e.target.select()}
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          className="size-8 shrink-0"
                          aria-label="Copier le lien"
                          onClick={() => copyLink(share)}
                        >
                          {copiedId === share.id ? (
                            <Check className="size-3.5" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="size-8 shrink-0"
                          aria-label="Ouvrir le lien"
                          asChild
                        >
                          <a
                            href={share.shareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        </Button>
                      </div>

                      <RequestsSection
                        share={share}
                        isReadOnly={isReadOnly}
                        onApprove={(request) =>
                          runWithToast(
                            () => approveRequest(share.id, request.id),
                            "Demande approuvée",
                          )
                        }
                        onReject={(request) =>
                          runWithToast(
                            () => rejectRequest(share.id, request.id),
                            "Demande refusée",
                          )
                        }
                      />

                      <VisitorsSection
                        share={share}
                        isOpen={Boolean(openVisitors[share.id])}
                        onToggle={() =>
                          setOpenVisitors((prev) => ({
                            ...prev,
                            [share.id]: !prev[share.id],
                          }))
                        }
                        onRevoke={(visitor) =>
                          setConfirm({ kind: "visitor", share, visitor })
                        }
                        onUnban={(visitor) =>
                          runWithToast(
                            () => unbanVisitor(share.id, visitor.email),
                            "Accès rétabli",
                          )
                        }
                      />

                      <div className="flex items-center gap-1">
                        <p className="text-xs text-muted-foreground flex-1 min-w-0">
                          {shareSummary(share)}
                        </p>
                        {!isReadOnly && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 shrink-0"
                            aria-label="Modifier l'accès"
                            onClick={() =>
                              setForm({
                                ...EMPTY_FORM,
                                id: share.id,
                                name: share.name,
                                folderIds: collapseFolderSelection(
                                  folders,
                                  share.folderIds,
                                ),
                                hadPassword: share.hasPassword,
                                expiresOn: toDateInput(share.expiresAt),
                              })
                            }
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 shrink-0 text-destructive"
                          aria-label="Supprimer l'accès"
                          onClick={() => setConfirm({ kind: "delete", share })}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {!isReadOnly && (
                <div className="shrink-0 border-t px-6 py-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={openNewForm}
                  >
                    <Plus className="size-4 mr-2" />
                    Nouvel accès client
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(confirm)}
        onOpenChange={(next) => !next && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTexts.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTexts.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction}>
              {confirmTexts.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
