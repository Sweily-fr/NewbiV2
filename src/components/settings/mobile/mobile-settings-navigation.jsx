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
  const user = session?.user;

  const renderGroup = (groupTabs) =>
    groupTabs.map((tab, index) => {
      const IconComponent = iconMap[tab.icon];
      const isLast = index === groupTabs.length - 1;

      return (
        <React.Fragment key={tab.id}>
          <button
            onClick={() => !tab.disabled && onTabSelect(tab.id)}
            disabled={tab.disabled}
            className={`
              w-full flex items-center justify-between px-4 py-3 text-left transition-colors
              ${tab.disabled ? "opacity-50 cursor-not-allowed" : "active:bg-accent"}
            `}
          >
            <div className="flex items-center gap-3">
              {IconComponent && (
                <IconComponent className="w-5 h-5 text-[#3D3E42]" strokeWidth={1.8} />
              )}
              <span className="text-sm font-normal">
                {tab.label}
              </span>
              {tab.disabled && (
                <span className="px-2 py-0.5 text-[10px] font-normal bg-[#5a50ff]/10 border border-[#5a50ff]/30 text-[#5a50ff] rounded-md">
                  à venir
                </span>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-[#3D3E42]/40" />
          </button>
        </React.Fragment>
      );
    });

  return (
    <div className="h-full overflow-y-auto">
      {/* User Profile — style nav-user */}
      <button
        onClick={() => onTabSelect("user-info")}
        className="w-full px-4 py-4 flex items-center gap-3 text-left active:bg-accent transition-colors"
      >
        <div className="shrink-0">
          <div className="h-12 w-12 rounded-lg overflow-hidden">
            {user?.image || user?.avatar || user?.profilePictureUrl ? (
              <img
                src={user.image || user.avatar || user.profilePictureUrl}
                alt={user?.name || "Utilisateur"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium text-sm">
                {user?.name
                  ? user.name
                      .split(" ")
                      .map((w) => w.charAt(0))
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : "U"}
              </div>
            )}
          </div>
        </div>
        <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
          <span className="truncate font-medium text-foreground">
            {user?.name || "Utilisateur"}
          </span>
          <span className="text-muted-foreground truncate text-xs">
            {user?.email}
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-[#3D3E42]/40 shrink-0" />
      </button>

      {/* Separator */}
      <div className="mx-4 h-px bg-border/50" />

      {/* Espace de travail */}
      <div className="pt-4">
        <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-4 pb-1">
          Espace de travail
        </p>
        {renderGroup(tabs.slice(1, 4))}
      </div>

      {/* Separator */}
      <div className="mx-4 my-2 h-px bg-border/50" />

      {/* Gestion */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-4 pb-1">
          Gestion
        </p>
        {renderGroup(tabs.slice(4, 8))}
      </div>

      {/* Separator */}
      <div className="mx-4 my-2 h-px bg-border/50" />

      {/* Préférences */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-4 pb-1">
          Préférences
        </p>
        {renderGroup(tabs.slice(8))}
      </div>

      {/* Bottom padding */}
      <div className="h-8" />
    </div>
  );
}
