'use client';

import { useState, useMemo } from 'react';
import { useDebouncedValue } from '@/src/hooks/useDebouncedValue';
import { useQuery } from '@apollo/client';
import { GET_COMMUNITY_SUGGESTIONS } from '../../graphql/queries/communitySuggestion';
import { SuggestionCard } from './suggestion-card';
import { SuggestionSkeleton } from './suggestion-skeleton';
import { EmptyState } from './empty-state';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { CheckCircle2, Search, Filter } from 'lucide-react';

export function ValidatedTab() {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

  const { data, loading, refetch } = useQuery(GET_COMMUNITY_SUGGESTIONS, {
    variables: {
      status: 'validated',
      sortBy: 'recent'
    },
    fetchPolicy: 'cache-and-network'
  });

  const suggestions = data?.getCommunitySuggestions || [];

  // Filtrage côté client par type et recherche
  const filteredSuggestions = useMemo(() => {
    let filtered = suggestions;

    // Filtre par type
    if (filter !== 'all') {
      filtered = filtered.filter(s => s.type === filter);
    }

    // Filtre par recherche
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.title.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [suggestions, filter, debouncedSearchQuery]);

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
        icon={CheckCircle2}
        title="Aucune fonctionnalité validée"
        description="Les suggestions validées par la communauté apparaîtront ici."
      />
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header fixe avec recherche et filtre */}
      <div className="sticky top-0 bg-background z-10 space-y-3 pt-2 pb-4 border-b mb-4">
        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une fonctionnalité validée..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filtre et compteur */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {filteredSuggestions.length} {filteredSuggestions.length > 1 ? 'résultats' : 'résultat'}
          </p>
          
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="idea">Idées</SelectItem>
              <SelectItem value="bug">Bugs</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Liste des suggestions scrollable */}
      {filteredSuggestions.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Aucun résultat"
          description="Aucune fonctionnalité ne correspond à votre recherche."
        />
      ) : (
        <div className="space-y-3 pb-6">
          {filteredSuggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onUpdate={refetch}
              isValidated
            />
          ))}
        </div>
      )}
    </div>
  );
}
