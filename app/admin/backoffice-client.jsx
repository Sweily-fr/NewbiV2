"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";

const PAGE_SIZE = 25;

function formatDate(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

async function api(path, options = {}) {
  const res = await fetch(`/api/backoffice/${path}`, {
    credentials: "include",
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Erreur ${res.status}`);
  }
  return data;
}

export default function BackofficeClient({ adminEmail }) {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Utilisateur en cours de suppression
  const [target, setTarget] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  // Incrémenté après chaque purge pour rafraîchir la liste des sauvegardes
  const [backupsRefresh, setBackupsRefresh] = useState(0);

  const loadUsers = useCallback(async (searchValue, pageValue) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(pageValue),
        limit: String(PAGE_SIZE),
      });
      if (searchValue) params.set("search", searchValue);
      const result = await api(`users?${params}`);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers(query, page);
  }, [query, page, loadUsers]);

  const openDelete = async (user) => {
    setTarget(user);
    setPreview(null);
    setConfirmEmail("");
    setDeleteResult(null);
    setDeleteError(null);
    setPreviewLoading(true);
    try {
      const result = await api(`users/${user.id}/preview`);
      setPreview(result);
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closeDialog = () => {
    if (deleting) return;
    const purged = Boolean(deleteResult);
    setTarget(null);
    setPreview(null);
    setDeleteResult(null);
    setDeleteError(null);
    if (purged) {
      loadUsers(query, page);
      setBackupsRefresh((v) => v + 1);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const result = await api(`users/${target.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmEmail }),
      });
      setDeleteResult(result.summary);
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Back-office utilisateurs</h1>
        <p className="text-sm text-muted-foreground">
          Connecté en tant que {adminEmail}. La suppression est totale et
          définitive : base de données, fichiers R2, abonnement Stripe et
          connexion Bridge. À réserver aux comptes de test.
        </p>
      </div>

      <form
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setQuery(search.trim());
        }}
      >
        <Input
          placeholder="Rechercher par email ou nom"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button type="submit" variant="outline">
          Rechercher
        </Button>
      </form>

      {error && (
        <p className="mb-4 text-sm text-destructive">Erreur : {error}</p>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Inscrit le</TableHead>
              <TableHead>Organisations</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : !data?.users?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm">
                  Aucun utilisateur trouvé
                </TableCell>
              </TableRow>
            ) : (
              data.users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.email}
                    {user.isBackofficeAdmin && (
                      <Badge variant="secondary" className="ml-2">
                        admin
                      </Badge>
                    )}
                    {!user.emailVerified && (
                      <Badge variant="outline" className="ml-2">
                        non vérifié
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{user.name || "-"}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {user.organizations.join(", ") || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={user.isBackofficeAdmin}
                      onClick={() => openDelete(user)}
                    >
                      Supprimer
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span>
            {data.total} utilisateurs, page {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      <Dialog
        open={Boolean(target)}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          {deleteResult ? (
            <>
              <DialogHeader>
                <DialogTitle>Utilisateur supprimé</DialogTitle>
                <DialogDescription>
                  {deleteResult.user.email} a été purgé.
                </DialogDescription>
              </DialogHeader>
              <SummaryView summary={deleteResult} />
              <DialogFooter>
                <Button onClick={closeDialog}>Fermer</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Supprimer {target?.email}</DialogTitle>
                <DialogDescription>
                  Suppression totale et irréversible de l'utilisateur et de
                  toutes ses données.
                </DialogDescription>
              </DialogHeader>

              {previewLoading ? (
                <p className="py-4 text-sm">Analyse des données...</p>
              ) : preview ? (
                <PreviewView preview={preview} />
              ) : null}

              {deleteError && (
                <p className="text-sm text-destructive">
                  Erreur : {deleteError}
                </p>
              )}

              {preview && (
                <div className="space-y-2">
                  <p className="text-sm">
                    Pour confirmer, saisis l'email du compte :
                  </p>
                  <Input
                    placeholder={target?.email}
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={closeDialog}
                  disabled={deleting}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  disabled={
                    deleting ||
                    !preview ||
                    confirmEmail.trim().toLowerCase() !==
                      (target?.email || "").toLowerCase()
                  }
                  onClick={confirmDelete}
                >
                  {deleting
                    ? "Suppression en cours..."
                    : "Supprimer définitivement"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <BackupsSection
        refresh={backupsRefresh}
        onRestored={() => loadUsers(query, page)}
      />
    </div>
  );
}

function BackupsSection({ refresh, onRestored }) {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sauvegarde sélectionnée pour une action ("restore" ou "delete")
  const [action, setAction] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionResult, setActionResult] = useState(null);
  const [actionError, setActionError] = useState(null);

  const loadBackups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api("backups");
      setBackups(result.backups || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBackups();
  }, [refresh, loadBackups]);

  const closeAction = () => {
    if (busy) return;
    const done = Boolean(actionResult);
    setAction(null);
    setActionResult(null);
    setActionError(null);
    if (done) {
      loadBackups();
      if (onRestored) onRestored();
    }
  };

  const runAction = async () => {
    setBusy(true);
    setActionError(null);
    try {
      const result =
        action.type === "restore"
          ? await api(`backups/${action.backup.id}/restore`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({}),
            })
          : await api(`backups/${action.backup.id}`, { method: "DELETE" });
      setActionResult(result.summary);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-12">
      <h2 className="mb-1 text-xl font-semibold">Sauvegardes</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Chaque purge crée une sauvegarde restaurable (documents en base et
        fichiers R2). Stripe et Bridge ne sont pas restaurables : un abonnement
        annulé doit être recréé à la main.
      </p>

      {error && (
        <p className="mb-4 text-sm text-destructive">Erreur : {error}</p>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur purgé</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Contenu</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-sm">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : backups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-sm">
                  Aucune sauvegarde
                </TableCell>
              </TableRow>
            ) : (
              backups.map((backup) => (
                <TableRow key={backup.id}>
                  <TableCell className="font-medium">
                    {backup.targetEmail}
                  </TableCell>
                  <TableCell>{formatDate(backup.createdAt)}</TableCell>
                  <TableCell>
                    {backup.mongoCount} documents, {backup.r2Count} fichiers
                  </TableCell>
                  <TableCell>
                    {backup.status === "restored" ? (
                      <Badge variant="secondary">
                        restaurée le {formatDate(backup.restoredAt)}
                      </Badge>
                    ) : (
                      <Badge variant="outline">disponible</Badge>
                    )}
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAction({ type: "restore", backup })}
                    >
                      Restaurer
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setAction({ type: "delete", backup })}
                    >
                      Supprimer
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={Boolean(action)}
        onOpenChange={(open) => !open && closeAction()}
      >
        <DialogContent className="sm:max-w-md">
          {actionResult ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {action?.type === "restore"
                    ? "Restauration terminée"
                    : "Sauvegarde supprimée"}
                </DialogTitle>
              </DialogHeader>
              {action?.type === "restore" ? (
                <div className="space-y-2 text-sm">
                  <p>
                    {Object.values(actionResult.mongoRestored || {}).reduce(
                      (s, c) => s + c,
                      0,
                    )}{" "}
                    document(s) réinséré(s), {actionResult.mongoSkipped || 0}{" "}
                    doublon(s) ignoré(s), {actionResult.r2Restored || 0}{" "}
                    fichier(s) R2 restauré(s).
                  </p>
                  <p className="text-muted-foreground">
                    L'utilisateur devra se reconnecter. Abonnement Stripe et
                    connexion Bridge à recréer si besoin.
                  </p>
                  {actionResult.errors?.length > 0 && (
                    <p className="text-destructive">
                      {actionResult.errors.length} erreur(s) partielle(s), voir
                      les logs serveur.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm">
                  Archive et corbeille R2 supprimées définitivement.
                </p>
              )}
              <DialogFooter>
                <Button onClick={closeAction}>Fermer</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>
                  {action?.type === "restore"
                    ? `Restaurer ${action?.backup.targetEmail} ?`
                    : "Supprimer cette sauvegarde ?"}
                </DialogTitle>
                <DialogDescription>
                  {action?.type === "restore"
                    ? "Les documents et fichiers seront remis en place (les données déjà présentes sont conservées). Stripe et Bridge ne sont pas restaurés."
                    : `Toute restauration de ${action?.backup.targetEmail} deviendra impossible. Action définitive.`}
                </DialogDescription>
              </DialogHeader>
              {actionError && (
                <p className="text-sm text-destructive">
                  Erreur : {actionError}
                </p>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={closeAction} disabled={busy}>
                  Annuler
                </Button>
                <Button
                  variant={
                    action?.type === "restore" ? "default" : "destructive"
                  }
                  onClick={runAction}
                  disabled={busy}
                >
                  {busy
                    ? "En cours..."
                    : action?.type === "restore"
                      ? "Restaurer"
                      : "Supprimer définitivement"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CountList({ entries }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 text-sm">
      {entries.map(([name, count]) => (
        <li key={name} className="flex justify-between border-b py-0.5">
          <span className="truncate pr-2">{name}</span>
          <span className="font-medium">{count}</span>
        </li>
      ))}
    </ul>
  );
}

function PreviewView({ preview }) {
  const mongoEntries = Object.entries(preview.mongo || {}).sort(
    (a, b) => b[1] - a[1],
  );
  const r2Entries = Object.entries(preview.r2 || {}).sort(
    (a, b) => b[1] - a[1],
  );
  const subs = preview.external?.stripeSubscriptions || [];

  return (
    <div className="space-y-4">
      {preview.warnings?.length > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          {preview.warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
        </div>
      )}

      {preview.organizations?.length > 0 && (
        <div>
          <p className="mb-1 text-sm font-medium">Organisations</p>
          <ul className="text-sm">
            {preview.organizations.map((org) => (
              <li key={org.organizationId}>
                {org.name} ({org.role})
                {org.fullPurge
                  ? " : sera supprimée"
                  : ` : conservée (${org.otherMembers} autre(s) membre(s))`}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="mb-1 text-sm font-medium">
          Documents en base ({mongoEntries.reduce((s, [, c]) => s + c, 0)})
        </p>
        <CountList entries={mongoEntries} />
      </div>

      {r2Entries.length > 0 && (
        <div>
          <p className="mb-1 text-sm font-medium">
            Fichiers R2 ({r2Entries.reduce((s, [, c]) => s + c, 0)})
          </p>
          <CountList entries={r2Entries} />
        </div>
      )}

      {(subs.length > 0 || preview.external?.bridge) && (
        <div>
          <p className="mb-1 text-sm font-medium">Ressources externes</p>
          <ul className="text-sm">
            {subs.map((s) => (
              <li key={s.stripeSubscriptionId || s.plan}>
                Abonnement Stripe {s.plan} ({s.status}) : sera annulé
              </li>
            ))}
            {preview.external?.bridge && (
              <li>Utilisateur Bridge : sera supprimé</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function SummaryView({ summary }) {
  const mongoEntries = Object.entries(summary.mongo || {}).sort(
    (a, b) => b[1] - a[1],
  );
  const r2Entries = Object.entries(summary.r2 || {}).sort(
    (a, b) => b[1] - a[1],
  );

  return (
    <div className="space-y-4">
      {summary.backupId && (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
          Sauvegarde créée ({summary.backup?.mongoCount || 0} documents,{" "}
          {summary.backup?.r2Count || 0} fichiers) : restauration possible
          depuis la section Sauvegardes en bas de page.
        </div>
      )}
      {summary.errors?.length > 0 && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm">
          <p className="mb-1 font-medium">
            Erreurs partielles ({summary.errors.length}) :
          </p>
          {summary.errors.map((e) => (
            <p key={e} className="truncate">
              {e}
            </p>
          ))}
        </div>
      )}
      <div>
        <p className="mb-1 text-sm font-medium">
          Documents supprimés ({mongoEntries.reduce((s, [, c]) => s + c, 0)})
        </p>
        <CountList entries={mongoEntries} />
      </div>
      {r2Entries.length > 0 && (
        <div>
          <p className="mb-1 text-sm font-medium">
            Fichiers R2 supprimés ({r2Entries.reduce((s, [, c]) => s + c, 0)})
          </p>
          <CountList entries={r2Entries} />
        </div>
      )}
      <p className="text-sm">
        Stripe : {summary.stripe?.subscriptionsCancelled || 0} abonnement(s)
        annulé(s), {summary.stripe?.customersDeleted || 0} customer(s)
        supprimé(s). Bridge : {summary.bridge?.usersDeleted || 0}
        {" utilisateur(s) supprimé(s)."}
      </p>
    </div>
  );
}
