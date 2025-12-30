"use client";

import { Building2, Calculator } from "lucide-react";
import { useSidebar } from "@/src/components/ui/sidebar";
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { useAccountingView } from "@/src/contexts/accounting-view-context";

/**
 * Composant de tabs pour switcher entre la vue Comptable et Entreprise
 * Affiché uniquement pour les organisations de type "accounting_firm"
 */
export function SidebarViewTabs() {
  const { state: sidebarState } = useSidebar();
  const isCollapsed = sidebarState === "collapsed";
  const { activeView, setActiveView } = useAccountingView();

  const handleViewChange = (view) => {
    setActiveView(view);
  };

  const tabs = [
    {
      id: "business",
      label: "Entreprise",
      icon: Building2,
      description: "Vue gestion d'entreprise",
    },
    {
      id: "accounting",
      label: "Comptabilité",
      icon: Calculator,
      description: "Vue cabinet comptable",
    },
  ];

  // Version rétrécie : afficher uniquement les icônes
  if (isCollapsed) {
    return (
      <div className="px-1">
        <Tabs defaultValue={activeView} onValueChange={handleViewChange}>
          <TabsList className="flex flex-col h-auto w-full bg-sidebar-accent/50 p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="w-full justify-center px-2 py-2 data-[state=active]:bg-sidebar"
                  title={tab.label}
                >
                  <Icon className="h-4 w-4" />
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>
    );
  }

  // Version normale : afficher les tabs complets avec shadcn/ui
  return (
    <div className="px-2">
      <Tabs defaultValue={activeView} onValueChange={handleViewChange}>
        <TabsList className="w-full bg-[#F0F0F0]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex-1 gap-1.5 data-[state=active]:bg-sidebar cursor-pointer"
                title={tab.description}
              >
                {/* <Icon className="h-3.5 w-3.5" /> */}
                <span className="text-xs">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
}
