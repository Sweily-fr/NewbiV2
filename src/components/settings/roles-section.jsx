"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { KeyRound, Plus, RotateCcw, Trash2, Users } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Badge } from "@/src/components/ui/badge";
import { Callout } from "@/src/components/ui/callout";
import { Separator } from "@/src/components/ui/separator";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { toast } from "@/src/components/ui/sonner";
import { RolePermissionsTable } from "@/src/components/settings/role-permissions-table";
import { useMyPermissions } from "@/src/hooks/useMyPermissions";
import { useOrganizationRoles } from "@/src/hooks/useOrganizationRoles";
import {
  CREATE_ORGANIZATION_ROLE,
  DELETE_ORGANIZATION_ROLE,
  GET_ROLE_CATALOG,
  RESET_ORGANIZATION_ROLE,
  UPDATE_ORGANIZATION_ROLE,
} from "@/src/graphql/organizationRoleQueries";

// Grille vide : aucune action sur aucune page
function emptyActions(catalog) {
  return Object.fromEntries(catalog.modules.map((m) => [m.key, []]));
}

function RoleEditorDialog({
  open,
  onOpenChange,
  role,
  catalog,
  roles,
  canEdit,
  onChanged,
}) {
  const isCreation = !role;
  const isPredefined = Boolean(role?.predefined);
  const readOnly = !canEdit || (role && !role.editable);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [actions, setActions] = useState({});
  const [baseRole, setBaseRole] = useState("viewer");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [createRole, { loading: creating }] = useMutation(
    CREATE_ORGANIZATION_ROLE,
  );
  const [updateRole, { loading: updating }] = useMutation(
    UPDATE_ORGANIZATION_ROLE,
  );
  const [resetRole, { loading: resetting }] = useMutation(
    RESET_ORGANIZATION_ROLE,
  );
  const [deleteRole, { loading: deleting }] = useMutation(
    DELETE_ORGANIZATION_ROLE,
  );
  const busy = creating || updating || resetting || deleting;

  useEffect(() => {
    if (!open || !catalog) return;
    if (role) {
      setName(role.name);
      setDescription(role.description || "");
      setActions({ ...emptyActions(catalog), ...role.actions });
    } else {
      const base = roles.find((r) => r.key === "viewer");
      setName("");
      setDescription("");
      setBaseRole("viewer");
      setActions({ ...emptyActions(catalog), ...(base?.actions || {}) });
    }
  }, [open, role, catalog, roles]);

  const applyBaseRole = (key) => {
    setBaseRole(key);
    const base = roles.find((r) => r.key === key);
    setActions({ ...emptyActions(catalog), ...(base?.actions || {}) });
  };

  const handleSave = async () => {
    try {
      if (isCreation) {
        await createRole({
          variables: { input: { name, description, actions } },
        });
        toast.success(`Rôle « ${name.trim()} » créé`);
      } else {
        await updateRole({
          variables: {
            key: role.key,
            input: isPredefined ? { actions } : { name, description, actions },
          },
        });
        toast.success("Droits enregistrés");
      }
      onChanged();
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.message || "Impossible d'enregistrer le rôle");
    }
  };

  const handleReset = async () => {
    try {
      const { data } = await resetRole({ variables: { key: role.key } });
      setActions({
        ...emptyActions(catalog),
        ...data.resetOrganizationRole.actions,
      });
      toast.success("Droits par défaut rétablis");
      onChanged();
    } catch (error) {
      toast.error(error?.message || "Impossible de rétablir les droits");
    }
  };

  const handleDelete = async () => {
    try {
      const { data } = await deleteRole({ variables: { key: role.key } });
      const moved =
        data.deleteOrganizationRole.reassignedMembers +
        data.deleteOrganizationRole.reassignedInvitations;
      toast.success(
        moved > 0
          ? `Rôle supprimé. ${moved} personne${moved > 1 ? "s passent" : " passe"} en Membre.`
          : "Rôle supprimé",
      );
      setConfirmDelete(false);
      onChanged();
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.message || "Impossible de supprimer le rôle");
    }
  };

  if (!catalog) return null;
  const affected = (role?.memberCount || 0) + (role?.invitationCount || 0);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[760px] p-0 gap-0 max-h-[88vh] flex flex-col overflow-hidden">
          <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/60">
            <DialogTitle className="text-sm font-medium flex items-center gap-2">
              <KeyRound className="size-4" />
              {isCreation
                ? "Nouveau rôle"
                : readOnly
                  ? role.name
                  : `Modifier « ${role.name} »`}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Dépliez une section puis une page pour cocher ses actions une à
              une. Sans « Voir », la page n'apparaît pas du tout ; cocher une
              autre action ajoute « Voir ».
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {role?.key === "owner" && (
              <Callout type="info" noMargin>
                <p>
                  Le super admin a tous les droits. Ils ne sont pas modifiables.
                </p>
              </Callout>
            )}

            {!isPredefined && (
              <div className="grid gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="role-name"
                    className="text-sm text-muted-foreground"
                  >
                    Nom du rôle
                  </label>
                  <Input
                    id="role-name"
                    value={name}
                    maxLength={40}
                    disabled={readOnly}
                    placeholder="Ex. Commercial, Assistant administratif"
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="role-description"
                    className="text-sm text-muted-foreground"
                  >
                    Description (facultatif)
                  </label>
                  <Textarea
                    id="role-description"
                    value={description}
                    maxLength={200}
                    rows={2}
                    disabled={readOnly}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                {isCreation && (
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted-foreground">
                      Partir des droits de
                    </label>
                    <Select value={baseRole} onValueChange={applyBaseRole}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles
                          .filter((r) => r.key !== "owner")
                          .map((r) => (
                            <SelectItem key={r.key} value={r.key}>
                              {r.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {isPredefined && role.description && (
              <p className="text-sm text-muted-foreground">
                {role.description}
              </p>
            )}

            <RolePermissionsTable
              catalog={catalog}
              actions={actions}
              disabled={readOnly || busy}
              onChange={setActions}
            />
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-border/60 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              {!readOnly && isPredefined && role.customized && (
                <Button
                  type="button"
                  variant="ghost"
                  className="cursor-pointer gap-2"
                  disabled={busy}
                  onClick={handleReset}
                >
                  <RotateCcw className="size-4" />
                  Droits par défaut
                </Button>
              )}
              {!readOnly && role && !isPredefined && (
                <Button
                  type="button"
                  variant="ghost"
                  className="cursor-pointer gap-2 text-red-600 hover:text-red-700"
                  disabled={busy}
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="size-4" />
                  Supprimer
                </Button>
              )}
            </div>
            <div className="flex gap-2 sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                className="cursor-pointer"
                onClick={() => onOpenChange(false)}
              >
                {readOnly ? "Fermer" : "Annuler"}
              </Button>
              {!readOnly && (
                <Button
                  type="button"
                  variant="primary"
                  className="cursor-pointer"
                  disabled={busy || (!isPredefined && !name.trim())}
                  onClick={handleSave}
                >
                  {isCreation ? "Créer le rôle" : "Enregistrer"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer le rôle « {role?.name} »
            </AlertDialogTitle>
            <AlertDialogDescription>
              {affected > 0
                ? `${affected} personne${affected > 1 ? "s ont" : " a"} ce rôle (membres et invitations en attente). ${affected > 1 ? "Elles passeront" : "Elle passera"} en Membre, avec un accès en lecture seule.`
                : "Aucun membre n'a ce rôle."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function RolesSection() {
  const { isOwner } = useMyPermissions();
  const { data: catalogData } = useQuery(GET_ROLE_CATALOG, {
    fetchPolicy: "cache-first",
  });
  const { roles, loading, refetch } = useOrganizationRoles();
  const [editor, setEditor] = useState({ open: false, roleKey: null });

  const catalog = catalogData?.roleCatalog || null;
  const editedRole = useMemo(
    () => roles.find((r) => r.key === editor.roleKey) || null,
    [roles, editor.roleKey],
  );

  const openRole = (key) => setEditor({ open: true, roleKey: key });

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h2 className="text-lg font-medium mb-1 hidden md:block">Rôles</h2>
        <p className="text-sm text-muted-foreground mb-4 hidden md:block">
          Choisissez ce que chaque rôle peut voir et modifier dans l'espace.
        </p>
        <Separator className="hidden md:block bg-[#eeeff1] dark:bg-[#232323]" />
      </div>

      {!isOwner && (
        <Callout type="info" noMargin>
          <p>Seul le super admin peut créer ou modifier les rôles.</p>
        </Callout>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {roles.length > 0
            ? `${roles.length} rôle${roles.length > 1 ? "s" : ""}`
            : ""}
        </p>
        {isOwner && (
          <Button
            type="button"
            className="cursor-pointer gap-2 bg-[#5b4fff] hover:bg-[#5b4fff]/90 dark:text-white"
            disabled={!catalog}
            onClick={() => openRole(null)}
          >
            <Plus className="size-4" />
            Créer un rôle
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-[#2c2c2c] divide-y divide-gray-200 dark:divide-[#2c2c2c]">
        {loading && roles.length === 0
          ? [1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-64" />
              </div>
            ))
          : roles.map((role) => {
              const people = role.memberCount + role.invitationCount;
              return (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => openRole(role.key)}
                  className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-muted/40 cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{role.name}</span>
                      {!role.predefined && (
                        <Badge
                          variant="outline"
                          className="font-normal text-[10px] px-1.5 py-0 bg-[#5b4fff]/10 border-[#5b4fff]/30 text-[#5b4fff]"
                        >
                          Personnalisé
                        </Badge>
                      )}
                      {role.customized && (
                        <Badge
                          variant="outline"
                          className="font-normal text-[10px] px-1.5 py-0"
                        >
                          Droits modifiés
                        </Badge>
                      )}
                    </div>
                    {role.description && (
                      <p className="text-xs text-muted-foreground">
                        {role.description}
                      </p>
                    )}
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="size-3.5" />
                    {people}
                  </span>
                  <span className="shrink-0 text-xs text-[#5b4fff]">
                    {isOwner && role.editable ? "Modifier" : "Voir"}
                  </span>
                </button>
              );
            })}
      </div>

      <RoleEditorDialog
        open={editor.open}
        onOpenChange={(open) => setEditor((prev) => ({ ...prev, open }))}
        role={editedRole}
        catalog={catalog}
        roles={roles}
        canEdit={isOwner}
        onChanged={() => refetch()}
      />
    </div>
  );
}
