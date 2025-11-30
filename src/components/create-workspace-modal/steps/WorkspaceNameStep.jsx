"use client";

import React from "react";
import { Input } from "@/src/components/ui/input";

export function WorkspaceNameStep({ workspaceName, onNameChange }) {
  return (
    <div className="w-full max-w-3xl space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-medium text-gray-900 dark:text-white">
        Enfin, comment souhaitez-vous nommer votre espace ?
      </h2>

      <div className="space-y-3">
        <Input
          type="text"
          value={workspaceName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Newbi"
          className="w-full text-base px-4 dark:bg-[#171717] dark:text-white dark:border-gray-700"
          autoFocus
        />
        <p className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400">
          Essayez le nom de votre entreprise ou organisation.
        </p>
      </div>
    </div>
  );
}
