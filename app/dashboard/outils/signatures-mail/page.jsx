"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client";
import { CircleAlert, CopyPlus, Loader2, Monitor, MoreHorizontal, Plus, Star, Trash2 } from "lucide-react";
import { RoleRouteGuard } from "@/src/components/rbac/RBACRouteGuard";
import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";
import { PermissionButton } from "@/src/components/rbac/PermissionButton";
import { usePermissions } from "@/src/hooks/usePermissions";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
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
import {
  CREATE_SIGNATURE_V2,
  DELETE_SIGNATURE_V2,
  DUPLICATE_SIGNATURE_V2,
  SET_DEFAULT_SIGNATURE_V2,
  SIGNATURES_V2,
} from "./_v2/graphql";
import { refusalToast } from "./_v2/errors";
import HtmlFrame from "./_v2/components/HtmlFrame";
import { SignatureListV2Skeleton } from "./_v2/components/signature-v2-skeleton";
import { roleRefusal, VIEWER_CANNOT_CREATE, VIEWER_HINT, VIEWER_TITLE } from "./_v2/roles";

const EDITOR_URL = (id) => `/dashboard/outils/signatures-mail/${id}`;

function SignatureCard({ sig, onOpen, onDuplicate, onSetDefault, onDelete, readOnly }) {
  return (
    <Card className="group overflow-hidden">
      <button
        type="button"
        onClick={onOpen}
        className="block w-full cursor-pointer bg-white text-left"
        aria-label={`Ouvrir ${sig.name}`}
      >
        <div className="relative h-44 overflow-hidden">
          {/* Image seulement : ni ses liens ni le cadre ne sont atteignables
              au clavier ou annoncés */}
          <div className="pointer-events-none absolute left-0 top-0" inert>
            <HtmlFrame
              html={sig.render?.html || ""}
              width={720}
              height={352}
              scale={0.5}
              padding={20}
              title={`Aperçu ${sig.name}`}
            />
          </div>
        </div>
      </button>
      <CardContent className="flex items-center justify-between gap-2 border-t p-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium">{sig.name}</span>
            {sig.isDefault && (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#5a50ff]/10 px-2 py-0.5 text-[10px] font-medium text-[#5a50ff]">
                <Star size={10} className="fill-current" />
                Par défaut
              </span>
            )}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {[sig.identity?.firstName, sig.identity?.lastName].filter(Boolean).join(" ") ||
              "Sans nom"}
            {sig.identity?.jobTitle ? ` · ${sig.identity.jobTitle}` : ""}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="outline" size="sm" className="h-8 text-xs cursor-pointer" onClick={onOpen}>
            Modifier
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 cursor-pointer" aria-label="Actions">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onSetDefault} disabled={sig.isDefault || readOnly}>
                <Star size={14} />
                Définir par défaut
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate} disabled={readOnly}>
                <CopyPlus size={14} />
                Dupliquer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                disabled={readOnly}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 size={14} />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Droit de créer, et donc de modifier ou supprimer, une signature : faux
 * pour un lecteur, qui consulte seulement. Vrai tant que les droits se
 * chargent, pour ne pas montrer l'état d'un lecteur à tout le monde.
 */
function useSignatureWriteAccess() {
  const { hasPermission, isReady } = usePermissions();
  const [canWrite, setCanWrite] = useState(true);
  useEffect(() => {
    if (!isReady) return undefined;
    let active = true;
    hasPermission("signatures", "create").then((allowed) => {
      if (active) setCanWrite(allowed);
    });
    return () => {
      active = false;
    };
  }, [isReady, hasPermission]);
  return canWrite;
}

function SignaturesV2Content() {
  const router = useRouter();
  const { isReadOnly } = useSubscriptionAccess();
  const canWrite = useSignatureWriteAccess();
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const { data, loading, error, refetch: reload } = useQuery(SIGNATURES_V2, {
    fetchPolicy: "cache-and-network",
  });
  const signatures = data?.emailSignaturesV2 || [];
  // Nouvel essai après un échec de chargement (l'état de chargement de la
  // requête ne bouge pas pendant un rechargement : suivi local)
  const [retrying, setRetrying] = useState(false);
  const handleRetry = async () => {
    setRetrying(true);
    try {
      await reload();
    } catch {
      // Le message d'erreur reste affiché
    } finally {
      setRetrying(false);
    }
  };

  const refetch = { refetchQueries: [{ query: SIGNATURES_V2 }] };
  // Un refus de l'API (rôle, abonnement…) doit tomber dans le catch, pas
  // s'afficher comme une réussite
  const refused = { ...refetch, errorPolicy: "none" };
  const [create] = useMutation(CREATE_SIGNATURE_V2, refetch);
  const [duplicate] = useMutation(DUPLICATE_SIGNATURE_V2, refused);
  const [setDefault] = useMutation(SET_DEFAULT_SIGNATURE_V2, refused);
  const [remove] = useMutation(DELETE_SIGNATURE_V2, refused);

  const handleCreate = async () => {
    setCreating(true);
    try {
      // L'API pré-remplit avec le profil du créateur et l'entreprise. Un
      // refus (rôle…) doit tomber dans le catch, pas passer pour une réussite
      const { data: created } = await create({
        variables: { input: { name: "Ma signature" } },
        errorPolicy: "none",
      });
      router.push(`${EDITOR_URL(created.createEmailSignatureV2.id)}?new=1`);
    } catch (err) {
      const reason = roleRefusal(err);
      toast.error("Création impossible", reason ? { description: reason } : undefined);
      setCreating(false);
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const { data: copy } = await duplicate({ variables: { id } });
      toast.success("Signature dupliquée");
      router.push(EDITOR_URL(copy.duplicateEmailSignatureV2.id));
    } catch (err) {
      toast.error("Duplication impossible", refusalToast(err));
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefault({ variables: { id } });
      toast.success("Signature définie par défaut");
    } catch (err) {
      toast.error("Action impossible", refusalToast(err));
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await remove({ variables: { id: toDelete.id } });
      toast.success("Signature supprimée");
    } catch (err) {
      toast.error("Suppression impossible", refusalToast(err));
    } finally {
      setToDelete(null);
    }
  };

  return (
    <>
      {/* Mobile : outil réservé aux grands écrans */}
      <div className="block lg:hidden">
        <div className="flex min-h-screen items-center justify-center p-6">
          <Card className="mx-auto w-full max-w-md">
            <CardContent className="space-y-4 p-8 text-center">
              <Monitor className="mx-auto h-14 w-14 text-primary" />
              <h2 className="text-xl font-semibold">Fonctionnalité sur ordinateur</h2>
              <p className="text-muted-foreground">
                La création de signatures demande un écran plus large. Retrouvez cet outil depuis
                un ordinateur.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="hidden h-[calc(100vh-64px)] flex-col overflow-hidden lg:flex">
        <div className="flex shrink-0 items-center justify-between px-6 pt-6">
          <div>
            <h1 className="text-2xl font-medium">Signatures mail</h1>
            <p className="text-sm text-muted-foreground">
              Une signature propre dans Gmail, Outlook et Apple Mail, en clair comme en sombre.
            </p>
          </div>
          {/* Désactivé et expliqué pour un lecteur ou un abonnement inactif */}
          <PermissionButton
            resource="signatures"
            action="create"
            requiresActiveSubscription
            variant="primary"
            onClick={handleCreate}
            disabled={creating}
            tooltipNoAccess={VIEWER_CANNOT_CREATE}
            className="cursor-pointer"
          >
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Nouvelle signature
          </PermissionButton>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {loading && signatures.length === 0 ? (
            <SignatureListV2Skeleton />
          ) : error && signatures.length === 0 ? (
            // Échec sans liste en cache : surtout pas l'accueil des
            // nouveaux, qui ferait croire les signatures perdues
            <div className="flex h-full flex-col items-center justify-center text-center">
              <CircleAlert className="mb-4 h-12 w-12 text-muted-foreground" />
              <h2 className="text-lg font-medium">Impossible d&apos;afficher vos signatures</h2>
              <p className="mb-4 mt-2 max-w-md text-sm text-muted-foreground">
                Le chargement a échoué. Vos signatures enregistrées ne sont pas perdues :
                vérifiez votre connexion, puis réessayez.
              </p>
              <Button
                variant="outline"
                onClick={handleRetry}
                disabled={retrying}
                className="cursor-pointer"
              >
                {retrying && <Loader2 size={14} className="animate-spin" />}
                Réessayer
              </Button>
            </div>
          ) : signatures.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              {canWrite ? (
                <div className="max-w-md space-y-2">
                  <h2 className="text-lg font-medium">Créez votre première signature</h2>
                  <p className="text-sm text-muted-foreground">
                    Choisissez un modèle, complétez vos coordonnées, puis copiez la signature dans
                    votre messagerie. Vos informations de profil sont pré-remplies.
                  </p>
                </div>
              ) : (
                // Lecteur : la création lui est fermée, autant le dire ici
                <div className="max-w-md space-y-2">
                  <h2 className="text-lg font-medium">{VIEWER_TITLE}</h2>
                  <p className="text-sm text-muted-foreground">{VIEWER_HINT}</p>
                </div>
              )}
              <PermissionButton
                resource="signatures"
                action="create"
                requiresActiveSubscription
                variant="primary"
                onClick={handleCreate}
                disabled={creating}
                tooltipNoAccess={VIEWER_CANNOT_CREATE}
                className="cursor-pointer"
              >
                <Plus size={14} />
                Commencer
              </PermissionButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {signatures.map((sig) => (
                <SignatureCard
                  key={sig.id}
                  sig={sig}
                  // Un lecteur ne peut ni dupliquer, ni changer, ni supprimer
                  readOnly={isReadOnly || !canWrite}
                  onOpen={() => router.push(EDITOR_URL(sig.id))}
                  onDuplicate={() => handleDuplicate(sig.id)}
                  onSetDefault={() => handleSetDefault(sig.id)}
                  onDelete={() => setToDelete(sig)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={Boolean(toDelete)} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {toDelete?.name} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              La signature sera supprimée de Newbi. Si elle est installée dans votre messagerie,
              elle continuera de s&apos;afficher normalement, images comprises. Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700 cursor-pointer"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function SignaturesV2Page() {
  return (
    <RoleRouteGuard
      roles={["owner", "admin", "member", "viewer"]}
      fallbackUrl="/dashboard"
      toastMessage="Vous n'avez pas accès aux signatures de mail. Cette fonctionnalité est réservée aux membres de l'équipe."
      loadingComponent={<SignatureListV2Skeleton />}
    >
      <SignaturesV2Content />
    </RoleRouteGuard>
  );
}
