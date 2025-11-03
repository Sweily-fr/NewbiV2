"use client";

import { useState, useEffect } from "react";
import { usePermissions } from "@/src/hooks/usePermissions";
import {
  PermissionGate,
  PermissionButton,
  OwnerOnly,
  AdminOnly,
  MemberOnly,
  AccountantOnly,
} from "@/src/components/rbac";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";

export default function TestRBACPage() {
  const {
    getUserRole,
    canView,
    canCreate,
    canEdit,
    canDelete,
    isOwner,
    isAdmin,
    isMember,
    isAccountant,
  } = usePermissions();

  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    const loadPermissions = async () => {
      const userRole = getUserRole();
      setRole(userRole);

      // Tester différentes permissions
      const perms = {
        invoices: {
          view: await canView("invoices"),
          create: await canCreate("invoices"),
          edit: await canEdit("invoices"),
          delete: await canDelete("invoices"),
        },
        expenses: {
          view: await canView("expenses"),
          create: await canCreate("expenses"),
          edit: await canEdit("expenses"),
          delete: await canDelete("expenses"),
        },
        team: {
          view: await canView("team"),
        },
        billing: {
          view: await canView("billing"),
        },
      };

      setPermissions(perms);
    };

    loadPermissions();
  }, [getUserRole, canView, canCreate, canEdit, canDelete]);

  const getRoleBadge = () => {
    if (isOwner()) return <Badge className="bg-purple-500">Owner</Badge>;
    if (isAdmin()) return <Badge className="bg-blue-500">Admin</Badge>;
    if (isMember()) return <Badge className="bg-green-500">Member</Badge>;
    if (isAccountant()) return <Badge className="bg-orange-500">Accountant</Badge>;
    return <Badge variant="secondary">Aucun rôle</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Test du Système RBAC</h1>
          <p className="text-muted-foreground">
            Testez les permissions selon votre rôle
          </p>
        </div>
        {getRoleBadge()}
      </div>

      <Separator />

      {/* Informations sur le rôle */}
      <Card>
        <CardHeader>
          <CardTitle>Votre Rôle</CardTitle>
          <CardDescription>
            Informations sur votre rôle dans l'organisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>
              <strong>Rôle actuel :</strong> {role || "Chargement..."}
            </p>
            <div className="flex gap-2 mt-4">
              <Badge variant={isOwner() ? "default" : "outline"}>
                {isOwner() ? "✅" : "❌"} Owner
              </Badge>
              <Badge variant={isAdmin() ? "default" : "outline"}>
                {isAdmin() ? "✅" : "❌"} Admin
              </Badge>
              <Badge variant={isMember() ? "default" : "outline"}>
                {isMember() ? "✅" : "❌"} Member
              </Badge>
              <Badge variant={isAccountant() ? "default" : "outline"}>
                {isAccountant() ? "✅" : "❌"} Accountant
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test des permissions sur les factures */}
      <Card>
        <CardHeader>
          <CardTitle>Permissions - Factures</CardTitle>
          <CardDescription>
            Testez vos permissions sur les factures
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-2">Permissions détectées :</p>
              <div className="space-y-1">
                <p className="text-sm">
                  Voir : {permissions.invoices?.view ? "✅" : "❌"}
                </p>
                <p className="text-sm">
                  Créer : {permissions.invoices?.create ? "✅" : "❌"}
                </p>
                <p className="text-sm">
                  Modifier : {permissions.invoices?.edit ? "✅" : "❌"}
                </p>
                <p className="text-sm">
                  Supprimer : {permissions.invoices?.delete ? "✅" : "❌"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Boutons conditionnels :</p>
              <div className="space-y-2">
                <PermissionButton
                  resource="invoices"
                  action="create"
                  onClick={() => alert("Créer une facture")}
                  className="w-full"
                >
                  Créer une facture
                </PermissionButton>

                <PermissionButton
                  resource="invoices"
                  action="edit"
                  onClick={() => alert("Modifier une facture")}
                  className="w-full"
                  variant="secondary"
                >
                  Modifier une facture
                </PermissionButton>

                <PermissionButton
                  resource="invoices"
                  action="delete"
                  onClick={() => alert("Supprimer une facture")}
                  className="w-full"
                  variant="destructive"
                >
                  Supprimer une facture
                </PermissionButton>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test des composants conditionnels */}
      <Card>
        <CardHeader>
          <CardTitle>Composants Conditionnels</CardTitle>
          <CardDescription>
            Ces sections s'affichent selon votre rôle
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* PermissionGate */}
          <div>
            <h3 className="font-semibold mb-2">PermissionGate (Factures - Créer)</h3>
            <PermissionGate
              resource="invoices"
              action="create"
              fallback={
                <p className="text-sm text-muted-foreground">
                  ❌ Vous n'avez pas la permission de créer des factures
                </p>
              }
            >
              <div className="p-4 bg-green-50 border border-green-200 rounded">
                ✅ Vous pouvez créer des factures !
              </div>
            </PermissionGate>
          </div>

          <Separator />

          {/* OwnerOnly */}
          <div>
            <h3 className="font-semibold mb-2">OwnerOnly</h3>
            <OwnerOnly
              fallback={
                <p className="text-sm text-muted-foreground">
                  ❌ Réservé aux owners
                </p>
              }
            >
              <div className="p-4 bg-purple-50 border border-purple-200 rounded">
                👑 Section réservée aux Owners
              </div>
            </OwnerOnly>
          </div>

          <Separator />

          {/* AdminOnly */}
          <div>
            <h3 className="font-semibold mb-2">AdminOnly</h3>
            <AdminOnly
              fallback={
                <p className="text-sm text-muted-foreground">
                  ❌ Réservé aux owners et admins
                </p>
              }
            >
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                🔧 Section réservée aux Owners et Admins
              </div>
            </AdminOnly>
          </div>

          <Separator />

          {/* MemberOnly */}
          <div>
            <h3 className="font-semibold mb-2">MemberOnly</h3>
            <MemberOnly
              fallback={
                <p className="text-sm text-muted-foreground">
                  ❌ Réservé aux members
                </p>
              }
            >
              <div className="p-4 bg-green-50 border border-green-200 rounded">
                👤 Section réservée aux Members
              </div>
            </MemberOnly>
          </div>

          <Separator />

          {/* AccountantOnly */}
          <div>
            <h3 className="font-semibold mb-2">AccountantOnly</h3>
            <AccountantOnly
              fallback={
                <p className="text-sm text-muted-foreground">
                  ❌ Réservé aux comptables
                </p>
              }
            >
              <div className="p-4 bg-orange-50 border border-orange-200 rounded">
                📊 Section réservée aux Comptables
              </div>
            </AccountantOnly>
          </div>
        </CardContent>
      </Card>

      {/* Test des permissions sur les dépenses */}
      <Card>
        <CardHeader>
          <CardTitle>Permissions - Dépenses</CardTitle>
          <CardDescription>
            Testez vos permissions sur les dépenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-sm">
              Voir : {permissions.expenses?.view ? "✅" : "❌"}
            </p>
            <p className="text-sm">
              Créer : {permissions.expenses?.create ? "✅" : "❌"}
            </p>
            <p className="text-sm">
              Modifier : {permissions.expenses?.edit ? "✅" : "❌"}
            </p>
            <p className="text-sm">
              Supprimer : {permissions.expenses?.delete ? "✅" : "❌"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Test des autres permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Autres Permissions</CardTitle>
          <CardDescription>
            Permissions sur les autres ressources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium mb-2">Équipe</p>
              <p className="text-sm">
                Voir : {permissions.team?.view ? "✅" : "❌"}
              </p>
            </div>
            <div>
              <p className="font-medium mb-2">Facturation</p>
              <p className="text-sm">
                Voir : {permissions.billing?.view ? "✅" : "❌"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions de Test</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Vérifiez votre rôle actuel en haut de la page</li>
            <li>Observez quelles sections s'affichent selon votre rôle</li>
            <li>Testez les boutons - ils doivent être désactivés si vous n'avez pas la permission</li>
            <li>
              Pour tester avec un autre rôle, demandez à un admin de modifier votre rôle dans
              l'organisation
            </li>
            <li>Rechargez la page après changement de rôle</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
