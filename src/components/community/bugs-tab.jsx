'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_COMMUNITY_SUGGESTIONS } from '../../graphql/queries/communitySuggestion';
import { SuggestionCard } from './suggestion-card';
import { SuggestionSkeleton } from './suggestion-skeleton';
import { EmptyState } from './empty-state';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Bug } from 'lucide-react';

export function BugsTab() {
  const [sortBy, setSortBy] = useState('recent');

  const { data, loading, refetch } = useQuery(GET_COMMUNITY_SUGGESTIONS, {
    variables: {
      type: 'bug',
      status: 'pending',
      sortBy
    },
    fetchPolicy: 'cache-and-network'
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
        icon={Bug}
        title="Aucun problème signalé"
        description="Tout fonctionne parfaitement ! Si vous rencontrez un bug, n'hésitez pas à le signaler."
      />
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header fixe avec compteur et filtre */}
      <div className="sticky top-0 bg-background z-10 pt-2 pb-4 border-b mb-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {suggestions.length} {suggestions.length > 1 ? 'problèmes' : 'problème'}
          </p>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Plus récents</SelectItem>
              <SelectItem value="popular">Plus populaires</SelectItem>
              <SelectItem value="validated">Plus validés</SelectItem>
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
