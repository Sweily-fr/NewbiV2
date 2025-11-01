"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_COMMUNITY_SUGGESTIONS } from "../../graphql/queries/communitySuggestion";
import { SuggestionCard } from "./suggestion-card";
import { SuggestionSkeleton } from "./suggestion-skeleton";
import { EmptyState } from "./empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Lightbulb } from "lucide-react";

export function IdeasTab() {
  const [sortBy, setSortBy] = useState("recent");

  const { data, loading, refetch } = useQuery(GET_COMMUNITY_SUGGESTIONS, {
    variables: {
      type: "idea",
      status: "pending",
      sortBy,
    },
    fetchPolicy: "cache-and-network",
  });

  const suggestions = data?.getCommunitySuggestions || [];

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <SuggestionSkeleton />
        <SuggestionSkeleton />
        <SuggestionSkeleton />
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <EmptyState
        icon={Lightbulb}
        title="Aucune idée pour le moment"
        description="Soyez le premier à proposer une amélioration !"
      />
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header fixe avec compteur et filtre */}
      <div className="sticky top-0 bg-background z-10 pt-2 pb-4 border-b mb-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {suggestions.length} {suggestions.length > 1 ? "idées" : "idée"}
          </p>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Plus récentes</SelectItem>
              <SelectItem value="popular">Plus populaires</SelectItem>
              <SelectItem value="validated">Plus validées</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Liste des suggestions scrollable */}
      <div className="space-y-3 pb-6">
        {suggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onUpdate={refetch}
          />
        ))}
      </div>
    </div>
  );
}
