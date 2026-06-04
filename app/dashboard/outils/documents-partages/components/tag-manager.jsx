"use client";

/**
 * TagManager — gestion du registre de tags du workspace.
 *
 * Liste tous les tags (avec nombre d'utilisations), permet de les renommer, d'en
 * changer la couleur et de les supprimer. Les renommages / suppressions sont
 * propagés sur tous les documents côté backend.
 */

import * as React from "react";
import {
  Pencil,
  Trash2,
  Check,
  X,
  LoaderCircle,
  Tag as TagIcon,
} from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { cn } from "@/src/lib/utils";
import {
  useDocumentTags,
  useUpdateDocumentTag,
  useDeleteDocumentTag,
} from "@/src/hooks/useSharedDocuments";
import { TAG_PALETTE as PALETTE } from "./tag-selector";

function TagRow({ tag, onRename, onRecolor, onDelete }) {
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(tag.name);
  const [busy, setBusy] = React.useState(false);

  const saveName = async () => {
    const clean = name.trim();
    if (!clean || clean === tag.name) {
      setEditing(false);
      setName(tag.name);
      return;
    }
    setBusy(true);
    try {
      await onRename(clean);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2 py-1.5">
      {/* Pastille couleur cliquable */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="h-4 w-4 rounded-full shrink-0 ring-offset-2 hover:ring-2 ring-ring transition"
            style={{ backgroundColor: tag.color }}
            aria-label="Changer la couleur"
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="grid grid-cols-4 gap-1.5">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onRecolor(c)}
                className={cn(
                  "h-6 w-6 rounded-full transition hover:scale-110",
                  tag.color === c && "ring-2 ring-offset-2 ring-ring",
                )}
                style={{ backgroundColor: c }}
                aria-label={`Couleur ${c}`}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {editing ? (
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveName();
            if (e.key === "Escape") {
              setEditing(false);
              setName(tag.name);
            }
          }}
          className="h-7 text-sm flex-1"
          autoFocus
          disabled={busy}
        />
      ) : (
        <span className="flex-1 min-w-0">
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium max-w-full truncate"
            style={{
              backgroundColor: `${tag.color}14`,
              color: tag.color,
            }}
          >
            {tag.name}
          </span>
        </span>
      )}

      <span className="text-xs text-muted-foreground tabular-nums">
        {tag.usageCount}
      </span>

      {editing ? (
        <>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={saveName}
            disabled={busy}
          >
            {busy ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => {
              setEditing(false);
              setName(tag.name);
            }}
            disabled={busy}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </>
      ) : (
        <>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setEditing(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </>
      )}
    </div>
  );
}

export function TagManager({ trigger }) {
  const { tags } = useDocumentTags();
  const { updateTag } = useUpdateDocumentTag();
  const { deleteTag } = useDeleteDocumentTag();

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <TagIcon className="h-3.5 w-3.5" />
            Gérer les tags
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gérer les tags</DialogTitle>
          <DialogDescription>
            Renommez, recolorez ou supprimez les tags. Les changements sont
            appliqués à tous les documents.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[50vh] overflow-y-auto divide-y">
          {tags.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Aucun tag pour le moment
            </p>
          ) : (
            tags.map((tag) => (
              <TagRow
                key={tag.id}
                tag={tag}
                onRename={(name) => updateTag(tag.id, { name })}
                onRecolor={(color) => updateTag(tag.id, { color })}
                onDelete={() => deleteTag(tag.id)}
              />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TagManager;
