"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Check,
  Copy,
  ExternalLink,
  LoaderCircle,
  Lock,
  Pencil,
  Plus,
  Trash2,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { toast } from "@/src/components/ui/sonner";
import { Switch } from "@/src/components/ui/switch";
import { useDocumentShares } from "@/src/hooks/useDocumentShares";

const EMPTY_FORM = {
  id: null,
  name: "",
  password: "",
  removePassword: false,
  hadPassword: false,
  expiresOn: "",
};

const toDateInput = (value) =>
  value ? format(new Date(value), "yyyy-MM-dd") : "";

// Fin de la journée choisie : le lien marche encore le jour affiché
const endOfDay = (day) => new Date(`${day}T23:59:59`).toISOString();

function shareStatus(share) {
  if (!share.isFolderAvailable) {
    return { label: "Dossier fermé", tone: "text-amber-700 bg-amber-50" };
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
    `${share.totalViews} consultation${share.totalViews > 1 ? "s" : ""}`,
    `${share.totalDownloads} téléchargement${share.totalDownloads > 1 ? "s" : ""}`,
  ];
  if (share.lastViewedAt) {
    parts.push(
      `vu le ${format(new Date(share.lastViewedAt), "d MMM yyyy", { locale: fr })}`,
    );
  }
  if (share.expiresAt) {
    parts.push(
      `expire le ${format(new Date(share.expiresAt), "d MMM yyyy", { locale: fr })}`,
    );
  }
  return parts.join(" · ");
}

/**
 * Liens clients d'un dossier : une URL à envoyer au client, qui voit le
 * dossier et ses sous-dossiers sans compte.
 */
export default function ShareFolderDialog({
  folder,
  open,
  onOpenChange,
  isReadOnly,
}) {
  const { shares, loading, saving, createShare, updateShare, deleteShare } =
    useDocumentShares();
  const folderShares = shares.filter((share) => share.folderId === folder?.id);

  const [form, setForm] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [shareToDelete, setShareToDelete] = useState(null);

  const closeForm = () => setForm(null);
  const updateForm = (changes) => setForm((prev) => ({ ...prev, ...changes }));

  const runWithToast = async (action, successMessage) => {
    try {
      await action();
      if (successMessage) toast.success(successMessage);
      return true;
    } catch (error) {
      toast.error(error.message || "Une erreur est survenue");
      return false;
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

  const submitForm = async (event) => {
    event.preventDefault();
    const expiresAt = form.expiresOn ? endOfDay(form.expiresOn) : null;

    if (!form.id) {
      const saved = await runWithToast(
        () =>
          createShare({
            folderId: folder.id,
            name: form.name,
            password: form.password || undefined,
            expiresAt: expiresAt || undefined,
          }),
        "Lien créé",
      );
      if (saved) closeForm();
      return;
    }

    const input = { name: form.name, expiresAt };
    if (form.removePassword) input.password = null;
    else if (form.password) input.password = form.password;
    const saved = await runWithToast(
      () => updateShare(form.id, input),
      "Lien modifié",
    );
    if (saved) closeForm();
  };

  const confirmDelete = async () => {
    const { id } = shareToDelete;
    setShareToDelete(null);
    await runWithToast(() => deleteShare(id), "Lien supprimé");
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
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Partager « {folder?.name} » au client</DialogTitle>
            <DialogDescription>
              Le client ouvre le lien sans créer de compte. Il voit et
              télécharge ce dossier et ses sous-dossiers, y compris ce que vous
              y ajoutez ensuite, automatisations comprises. Les sous-dossiers
              privés restent masqués.
            </DialogDescription>
          </DialogHeader>

          {form ? (
            <form onSubmit={submitForm} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="share-name">Nom du lien</Label>
                <Input
                  id="share-name"
                  placeholder="Ex. : Client Dupont"
                  maxLength={100}
                  value={form.name}
                  onChange={(e) => updateForm({ name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="share-password">
                  {form.hadPassword
                    ? "Nouveau mot de passe"
                    : "Mot de passe (facultatif)"}
                </Label>
                <Input
                  id="share-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder={
                    form.hadPassword
                      ? "Laisser vide pour le conserver"
                      : "6 caractères minimum"
                  }
                  disabled={form.removePassword}
                  value={form.password}
                  onChange={(e) => updateForm({ password: e.target.value })}
                />
                {form.hadPassword && (
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Switch
                      checked={form.removePassword}
                      onCheckedChange={(checked) =>
                        updateForm({ removePassword: checked, password: "" })
                      }
                    />
                    Retirer le mot de passe
                  </label>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="share-expiry">
                  Date d&apos;expiration (facultatif)
                </Label>
                <Input
                  id="share-expiry"
                  type="date"
                  min={format(new Date(), "yyyy-MM-dd")}
                  value={form.expiresOn}
                  onChange={(e) => updateForm({ expiresOn: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeForm}>
                  Annuler
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && (
                    <LoaderCircle className="size-4 mr-2 animate-spin" />
                  )}
                  {form.id ? "Enregistrer" : "Créer le lien"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {loading && (
                <div className="flex justify-center py-6">
                  <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {!loading && folderShares.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Aucun lien pour ce dossier.
                </p>
              )}

              {folderShares.map((share) => {
                const status = shareStatus(share);
                return (
                  <div
                    key={share.id}
                    className="rounded-lg border p-3 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {share.name || "Lien client"}
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
                        aria-label="Lien actif"
                        checked={share.isActive}
                        disabled={isReadOnly && !share.isActive}
                        onCheckedChange={(checked) =>
                          runWithToast(() =>
                            updateShare(share.id, { isActive: checked }),
                          )
                        }
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Input
                        readOnly
                        aria-label="Adresse du lien"
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

                    <div className="flex items-center gap-1">
                      <p className="text-xs text-muted-foreground flex-1 min-w-0">
                        {shareSummary(share)}
                      </p>
                      {!isReadOnly && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 shrink-0"
                          aria-label="Modifier le lien"
                          onClick={() =>
                            setForm({
                              ...EMPTY_FORM,
                              id: share.id,
                              name: share.name,
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
                        aria-label="Supprimer le lien"
                        onClick={() => setShareToDelete(share)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              {!isReadOnly && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    setForm({ ...EMPTY_FORM, name: folder?.name || "" })
                  }
                >
                  <Plus className="size-4 mr-2" />
                  Nouveau lien
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(shareToDelete)}
        onOpenChange={(next) => !next && setShareToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce lien ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le client n&apos;aura plus accès aux documents par cette adresse.
              Les documents restent dans votre dossier.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
