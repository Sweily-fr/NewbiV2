"use client";

import React from "react";

export function WorkspaceTypeStep({ workspaceType, onTypeSelect }) {
  return (
    <div className="w-full max-w-3xl space-y-6 sm:space-y-8">
      <h2 className="text-xl sm:text-2xl font-medium text-gray-900 dark:text-white">
        À quoi servira cet espace de travail ?
      </h2>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => onTypeSelect("work")}
          className={`px-6 sm:px-8 py-3 rounded-lg text-sm font-medium transition-all ${
            workspaceType === "work"
              ? "bg-black dark:bg-white text-white dark:text-black"
              : "bg-white dark:bg-[#000] text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-[#171717] hover:border-gray-400 dark:hover:border-gray-600"
          }`}
        >
          Travail
        </button>

        <button
          onClick={() => onTypeSelect("personal")}
          className={`px-6 sm:px-8 py-3 rounded-lg text-sm font-medium transition-all ${
            workspaceType === "personal"
              ? "bg-black dark:bg-white text-white dark:text-black"
              : "bg-white dark:bg-[#000] text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-[#171717] hover:border-gray-400 dark:hover:border-gray-600"
          }`}
        >
          Personnel
        </button>
      </div>
    </div>
  );
}
