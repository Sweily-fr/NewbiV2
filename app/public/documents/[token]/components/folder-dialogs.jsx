"use client";

import { useMemo, useState } from "react";
import {
  Files,
  FolderClosed,
  FolderOpen,
  FolderUp,
  LoaderCircle,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";
import { toast } from "@/src/components/ui/sonner";
import { cn } from "@/src/lib/utils";
import {
  FOLDER_NAME_MAX_LENGTH,
  cleanFolderName,
  depositSummary,
  folderChoices,
} from "./shared-files-utils";

/** Dossier de la couleur choisie dans Newbi. */
export function FolderIcon({ folder, open = false, className = "size-4" }) {
  const Icon = open ? FolderOpen : FolderClosed;
  return (
    <Icon
      aria-hidden="true"
      className={cn("shrink-0", className)}
      style={{ color: folder?.color || "currentColor", opacity: 0.75 }}
    />
  );
}

/**
 * Action d'une fenêtre : bouton occupé pendant l'envoi, message de l'API en
 * cas de refus, fenêtre fermée une fois l'action faite.
 */
export function useDialogAction(action, onDone) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = async (...args) => {
    setBusy(true);
    setError("");
    try {
      await action(...args);
      onDone();
    } catch (failure) {
      setError(failure?.message || "Une erreur est survenue");
      setBusy(false);
    }
  };
  return { busy, error, run };
}

function ErrorText({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-sm text-destructive break-words">
      {children}
    </p>
  );
}

/**
 * Dossiers du partage où choisir une destination, dans l'ordre de
 * l'explorateur (sous-dossiers en retrait). `currentId` : marqué « Dossier
 * actuel ».
 */
export function FolderPicker({
  tree,
  value,
  onChange,
  currentId,
  label = "Dossier de destination",
}) {
  const choices = useMemo(() => folderChoices(tree), [tree]);
  return (
    <RadioGroup
      aria-label={label}
      value={value || ""}
      onValueChange={onChange}
      className="gap-0 max-h-72 overflow-y-auto rounded-md border py-1"
    >
      {choices.map(({ folder, depth }) => (
        <label
          key={folder.id}
          className={cn(
            // min-w-0 : un long nom de dossier n'élargit pas la liste
            "flex min-w-0 items-center gap-2 py-2 pr-3 text-sm cursor-pointer hover:bg-accent/50 transition-colors",
            value === folder.id && "bg-accent",
          )}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
        >
          <RadioGroupItem value={folder.id} aria-label={folder.name} />
          <FolderIcon folder={folder} />
          <span className="truncate flex-1 min-w-0">{folder.name}</span>
          {folder.id === currentId && (
            <span className="shrink-0 text-xs text-muted-foreground">
              Dossier actuel
            </span>
          )}
        </label>
      ))}
    </RadioGroup>
  );
}

/**
 * Dépôt depuis l'accueil (plusieurs dossiers partagés, aucun d'ouvert) : le
 * visiteur choisit le dossier qui reçoit ses fichiers ou son dossier.
 *
 * @param {object} props
 * @param {{ folders: string[][], files: object[] }} props.plan ce qu'il
 *   dépose (depositPlan)
 * @param {(folder: object) => Promise<void>} props.onDeposit
 */
export function DepositDialog({ plan, tree, onDeposit, onClose }) {
  const [target, setTarget] = useState("");
  const { title, detail, withFolders } = depositSummary(plan);
  const { busy, error, run } = useDialogAction(
    () => onDeposit(tree.folderById.get(target)),
    onClose,
  );
  const Icon = withFolders ? FolderUp : Files;

  const submit = (event) => {
    event.preventDefault();
    if (!tree.folderById.has(target) || busy) return;
    run();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="min-w-0">
          <DialogTitle className="pr-6 break-words">{title}</DialogTitle>
          <DialogDescription>
            Choisissez le dossier de destination.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="min-w-0 space-y-4">
          <div className="flex items-center gap-3 rounded-md border px-3 py-2">
            <Icon
              aria-hidden="true"
              className="size-5 shrink-0 text-muted-foreground"
            />
            <p className="min-w-0 flex-1 text-sm break-words">{detail}</p>
          </div>
          <FolderPicker tree={tree} value={target} onChange={setTarget} />
          <ErrorText>{error}</ErrorText>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onClose}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={busy || !tree.folderById.has(target)}
            >
              {busy && <LoaderCircle className="size-4 mr-2 animate-spin" />}
              Déposer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Dossier du même nom déjà visible dans `parentId` (sauf `exceptId`). */
const nameTaken = (tree, parentId, name, exceptId) =>
  Boolean(name && parentId) &&
  tree
    .subfolders(parentId)
    .some((folder) => folder.id !== exceptId && folder.name === name);

/**
 * Nouveau dossier : dans le dossier ouvert (`parent`), ou depuis l'accueil
 * dans le dossier choisi. Un nom déjà pris à cet endroit est signalé avant
 * l'envoi.
 *
 * @param {object} props
 * @param {object|null} props.parent dossier ouvert, null sur l'accueil
 * @param {(parent: object, name: string) => Promise<void>} props.onCreate
 */
export function NewFolderDialog({ parent, tree, onCreate, onClose }) {
  const [value, setValue] = useState("");
  const [target, setTarget] = useState(parent?.id || "");
  const name = cleanFolderName(value);
  const taken = nameTaken(tree, target, name);
  const ready = Boolean(name) && tree.folderById.has(target) && !taken;
  const { busy, error, run } = useDialogAction(
    () => onCreate(tree.folderById.get(target), name),
    onClose,
  );

  const submit = (event) => {
    event.preventDefault();
    if (!ready || busy) return;
    run();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="min-w-0">
          <DialogTitle>Nouveau dossier</DialogTitle>
          <DialogDescription className="break-words">
            {parent ? (
              <>Il sera créé dans «&nbsp;{parent.name}&nbsp;».</>
            ) : (
              "Choisissez où le créer."
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="min-w-0 space-y-4">
          {/* Enveloppé : le champ annule la marge (m-0) qui espace le reste */}
          <div className="space-y-2">
            <Input
              aria-label="Nom du dossier"
              placeholder="Nom du dossier"
              autoFocus
              maxLength={FOLDER_NAME_MAX_LENGTH}
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
            {taken && (
              <ErrorText>Un dossier porte déjà ce nom à cet endroit.</ErrorText>
            )}
          </div>
          {!parent && (
            <FolderPicker
              tree={tree}
              value={target}
              onChange={setTarget}
              label="Emplacement du nouveau dossier"
            />
          )}
          <ErrorText>{error}</ErrorText>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onClose}
            >
              Annuler
            </Button>
            <Button type="submit" variant="primary" disabled={busy || !ready}>
              {busy && <LoaderCircle className="size-4 mr-2 animate-spin" />}
              Créer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Renommer un dossier créé par le visiteur. */
export function RenameFolderDialog({ folder, tree, onRename, onClose }) {
  const [value, setValue] = useState(folder.name);
  const name = cleanFolderName(value);
  const unchanged = name === folder.name;
  const taken = nameTaken(tree, folder.parentId, name, folder.id);
  const ready = Boolean(name) && !unchanged && !taken;
  const { busy, error, run } = useDialogAction(async () => {
    await onRename(folder, name);
    toast.success("Dossier renommé");
  }, onClose);

  const submit = (event) => {
    event.preventDefault();
    if (!ready || busy) return;
    run();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="min-w-0">
          <DialogTitle>Renommer le dossier</DialogTitle>
          <DialogDescription>
            Votre interlocuteur verra aussi ce nouveau nom.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="min-w-0 space-y-4">
          <div className="space-y-2">
            <Input
              aria-label="Nouveau nom"
              autoFocus
              maxLength={FOLDER_NAME_MAX_LENGTH}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onFocus={(event) => event.target.select()}
            />
            {taken && (
              <ErrorText>Un dossier porte déjà ce nom à cet endroit.</ErrorText>
            )}
          </div>
          <ErrorText>{error}</ErrorText>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onClose}
            >
              Annuler
            </Button>
            <Button type="submit" variant="primary" disabled={busy || !ready}>
              {busy && <LoaderCircle className="size-4 mr-2 animate-spin" />}
              Renommer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
