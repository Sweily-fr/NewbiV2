"use client";

import React, { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import { Settings, Trash2 } from "lucide-react";

export function PersonnesSection() {
  // Données simulées pour les rôles
  const [roles] = useState([
    { id: "owner", name: "Owner", permissions: ["all"], isDefault: true },
    {
      id: "admin",
      name: "Admin",
      permissions: ["manage_users", "manage_content"],
      isDefault: true,
    },
    {
      id: "member",
      name: "Member",
      permissions: ["view_content"],
      isDefault: true,
    },
  ]);

  return (
    <div className="space-y-16">
      <div>
        <h2 className="text-lg font-medium mb-1 hidden md:block">Personnes</h2>
        <Separator className="hidden md:block" />

        {/* Section Rôles et permissions */}
        <div className="space-y-6 mt-4 md:mt-8">
          {/* Titre section Rôles */}
          <div>
            <h3 className="text-base font-medium mb-2">Rôles et permissions</h3>
            <Separator />
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-normal mb-1">Gestion des rôles</h4>
              <p className="text-xs text-gray-400">
                Créez et gérez les rôles personnalisés pour vos membres
              </p>
            </div>
          </div>

          {/* Liste des rôles */}
          <div className="space-y-3">
            {roles.map((role) => (
              <div
                key={role.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Badge variant={role.isDefault ? "default" : "secondary"}>
                    {role.name}
                  </Badge>
                  <span className="text-xs text-gray-400">
                    {role.permissions.length} permission(s)
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                  {!role.isDefault && (
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline" className="w-full">
            Créer un nouveau rôle
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PersonnesSection;
