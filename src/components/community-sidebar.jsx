"use client";

import { useState } from "react";
import { Lightbulb, Bug, CheckCircle2, Plus, History } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useQuery } from "@apollo/client";
import {
  GET_COMMUNITY_SUGGESTIONS,
  GET_COMMUNITY_SUGGESTION_STATS,
} from "../graphql/queries/communitySuggestion";
import { IdeasTab } from "./community/ideas-tab";
import { BugsTab } from "./community/bugs-tab";
import { ValidatedTab } from "./community/validated-tab";
import { CreateSuggestionDialog } from "./community/create-suggestion-dialog";
import { ChangelogDialog } from "./community/changelog-dialog";

export function CommunitySidebar({ open, onOpenChange }) {
  const [activeTab, setActiveTab] = useState("ideas");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState("idea");
  const [changelogOpen, setChangelogOpen] = useState(false);

  // Récupérer les statistiques
  const { data: statsData } = useQuery(GET_COMMUNITY_SUGGESTION_STATS, {
    skip: !open,
    fetchPolicy: "cache-and-network",
  });

  const stats = statsData?.getCommunitySuggestionStats || {
    totalIdeas: 0,
    totalBugs: 0,
    totalValidated: 0,
    totalPending: 0,
  };

  const handleCreateClick = () => {
    if (activeTab === "ideas") {
      setCreateType("idea");
    } else if (activeTab === "bugs") {
      setCreateType("bug");
    }
    setCreateDialogOpen(true);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl p-0 flex flex-col"
        >
          <div className="px-6 py-4 border-b">
            <div className="flex items-center gap-2 mb-2">
              <SheetTitle className="text-2xl font-medium">
                Communauté
              </SheetTitle>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setChangelogOpen(true)}
                title="Voir le changelog"
                className="h-8 w-8 p-0 hover:cursor-pointer ml-4"
              >
                <History className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Partagez vos idées, signalez des problèmes et découvrez les
              fonctionnalités validées
            </p>
          </div>

          <div className="flex-1 overflow-hidden">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="h-full flex flex-col"
            >
              <div className="px-6 pb-3">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger
                    value="ideas"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Lightbulb className="h-4 w-4" />
                    <span className="hidden sm:inline font-normal">Idées</span>
                    <Badge variant="secondary" className="ml-1">
                      <span className="font-normal">{stats.totalIdeas}</span>
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="bugs"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Bug className="h-4 w-4" />
                    <span className="hidden sm:inline font-normal">
                      Problèmes
                    </span>
                    <Badge variant="secondary" className="ml-1">
                      <span className="font-normal">{stats.totalBugs}</span>
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="validated"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="hidden sm:inline font-normal">Validé</span>
                    <Badge variant="secondary" className="ml-1">
                      <span className="font-normal">
                        {stats.totalValidated}
                      </span>
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 px-6 overflow-hidden">
                <TabsContent value="ideas" className="mt-0 h-full">
                  <IdeasTab />
                </TabsContent>

                <TabsContent value="bugs" className="mt-0 h-full">
                  <BugsTab />
                </TabsContent>

                <TabsContent value="validated" className="mt-0 h-full">
                  <ValidatedTab />
                </TabsContent>
              </div>

              {activeTab !== "validated" && (
                <div className="px-6 py-4 border-t bg-background">
                  <Button
                    onClick={handleCreateClick}
                    className="w-full cursor-pointer bg-[#5b4eff] hover:bg-[#5b4eff]/90"
                    size="lg"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {activeTab === "ideas"
                      ? "Proposer une idée"
                      : "Signaler un problème"}
                  </Button>
                </div>
              )}
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      <CreateSuggestionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        type={createType}
      />

      <ChangelogDialog open={changelogOpen} onOpenChange={setChangelogOpen} />
    </>
  );
}
