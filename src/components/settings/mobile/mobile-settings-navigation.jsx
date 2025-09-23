"use client";

import React from "react";
import {
  Building2,
  CreditCard,
  FileText,
  Shield,
  Settings,
  Settings2,
  Bell,
  Users,
  Crown,
  User,
  ChevronRight,
} from "lucide-react";

const iconMap = {
  User,
  Building2,
  CreditCard,
  FileText,
  Settings,
  Settings2,
  Bell,
  Users,
  Crown,
  Shield,
};

export default function MobileSettingsNavigation({
  tabs,
  activeTab,
  onTabSelect,
  session,
}) {
  return (
    <div className="h-full overflow-y-auto bg-gray-100 dark:bg-[#0A0A0A]">
      {/* User Profile Section */}
      <div className="bg-white dark:bg-[#171717] mx-4 mt-4 rounded-xl shadow-sm">
        <button
          onClick={() => onTabSelect("user-info")}
          className="w-full p-4 flex items-center justify-between text-left transition-colors hover:bg-gray-50 dark:hover:bg-[#0A0A0A] active:bg-gray-100 dark:active:bg-[#0A0A0A] rounded-xl"
        >
          <div className="flex items-center gap-3">
            {session?.user?.avatar || session?.user?.profilePictureUrl ? (
              <img
                src={session.user.avatar || session.user.profilePictureUrl}
                alt={session?.user?.name || "Utilisateur"}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-[#5b4eff] rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {session?.user?.name || "Utilisateur"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Mon compte
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-300" />
        </button>
      </div>

      {/* Settings Groups */}
      <div className="mt-6 space-y-6">
        {/* Espace de travail */}
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 px-4">
            Espace de travail
          </p>
          <div className="bg-white dark:bg-[#171717] mx-4 rounded-xl shadow-sm overflow-hidden">
            {tabs.slice(1, 4).map((tab, index) => {
              const IconComponent = iconMap[tab.icon];
              const isLast = index === 2;

              return (
                <button
                  key={tab.id}
                  onClick={() => onTabSelect(tab.id)}
                  className={`
                    w-full flex items-center justify-between p-4 text-left transition-colors
                    hover:bg-gray-50 dark:hover:bg-[#0A0A0A] active:bg-gray-100 dark:active:bg-[#0A0A0A]
                    ${!isLast ? "border-b border-gray-100 dark:border-gray-700" : ""}
                  `}
                >
                  <div className="flex items-center gap-3">
                    {IconComponent && (
                      <IconComponent className="h-4 w-4 dark:text-white" />
                    )}
                    <span className="text-gray-900 dark:text-white font-normal text-sm">
                      {tab.label}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-300" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Gestion */}
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 px-4">
            Gestion
          </p>
          <div className="bg-white dark:bg-[#171717] mx-4 rounded-xl shadow-sm overflow-hidden">
            {tabs.slice(4, 8).map((tab, index) => {
              const IconComponent = iconMap[tab.icon];
              const isLast = index === 3;

              return (
                <button
                  key={tab.id}
                  onClick={() => onTabSelect(tab.id)}
                  className={`
                    w-full flex items-center justify-between p-4 text-left transition-colors
                    hover:bg-gray-50 dark:hover:bg-[#0A0A0A] active:bg-gray-100 dark:active:bg-[#0A0A0A]
                    ${!isLast ? "border-b border-gray-100 dark:border-gray-700" : ""}
                  `}
                >
                  <div className="flex items-center gap-3">
                    {IconComponent && (
                      <IconComponent className="h-4 w-4 dark:text-white" />
                    )}
                    <span className="text-gray-900 dark:text-white font-normal text-sm">
                      {tab.label}
                    </span>
                    {tab.id === "personnes" && (
                      <span className="px-2 py-0.5 text-xs font-normal bg-[#5b4eff]/60 text-white rounded-full">
                        À venir
                      </span>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-300" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Préférences */}
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 px-4">
            Préférences
          </p>
          <div className="bg-white dark:bg-[#171717] mx-4 rounded-xl shadow-sm overflow-hidden">
            {tabs.slice(8).map((tab, index) => {
              const IconComponent = iconMap[tab.icon];
              const isLast = index === tabs.slice(8).length - 1;

              return (
                <button
                  key={tab.id}
                  onClick={() => onTabSelect(tab.id)}
                  className={`
                    w-full flex items-center justify-between p-4 text-left transition-colors
                    hover:bg-gray-50 dark:hover:bg-[#0A0A0A] active:bg-gray-100 dark:active:bg-[#0A0A0A]
                    ${!isLast ? "border-b border-gray-100 dark:border-gray-700" : ""}
                  `}
                >
                  <div className="flex items-center gap-3">
                    {IconComponent && (
                      <IconComponent className="h-4 w-4 dark:text-white" />
                    )}
                    <span className="text-gray-900 dark:text-white font-normal text-sm">
                      {tab.label}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-300" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom padding */}
      <div className="h-8"></div>
    </div>
  );
}
