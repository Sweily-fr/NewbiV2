"use client";

import React from "react";
import { Lightbulb } from "lucide-react";
import MultipleSelector from "@/src/components/ui/multiselect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import { Callout } from "@/src/components/ui/callout";

export function InviteMembersStep({
  invitedEmails,
  membersWithRoles,
  onEmailsChange,
  onRoleChange,
}) {
  return (
    <div className="w-full max-w-3xl space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-medium text-gray-900 dark:text-white">
          Invitez des personnes dans votre espace :
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Tapez l'email puis appuyez sur{" "}
          <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-gray-100 dark:bg-[#252525] border border-gray-300 dark:border-[#313131] rounded">
            Entrée
          </kbd>{" "}
          pour ajouter des utilisateurs et leur appliquer un rôle.
        </p>
      </div>

      <div className="space-y-3">
        <MultipleSelector
          value={invitedEmails}
          onChange={onEmailsChange}
          placeholder="Entrez des adresses email"
          creatable
          hidePlaceholderWhenSelected
          emptyIndicator={
            <p className="text-center text-sm text-muted-foreground">
              Aucun résultat trouvé
            </p>
          }
          className="dark:bg-[#171717] dark:border-gray-700"
        />

        {membersWithRoles.length > 0 && (
          <div className="space-y-2 mt-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Attribuer des rôles :
            </p>
            {membersWithRoles.map((member, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#313131]/90"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {member.label.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {member.label}
                  </span>
                </div>
                <Select
                  value={member.role}
                  onValueChange={(value) => onRoleChange(index, value)}
                >
                  <SelectTrigger className="w-[140px] h-8 text-xs dark:bg-[#171717] dark:border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Propriétaire</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                    <SelectItem value="member">Membre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}

        <Callout
          icon={Lightbulb}
          variant="info"
          className="mt-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50"
        >
          <p>
            Ne travaillez pas seul - Invitez votre équipe pour commencer 200%
            plus vite.
          </p>
        </Callout>
      </div>
    </div>
  );
}
