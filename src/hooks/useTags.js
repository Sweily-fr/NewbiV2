import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

export function useTags() {
  const { id: boardId } = useParams();
  const [allTags, setAllTags] = useState([]);
  const [existingTags, setExistingTags] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Récupérer tous les tags existants du tableau
  useEffect(() => {
    const fetchAllTags = async () => {
      if (!boardId) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/boards/${boardId}/tags`);
        if (response.ok) {
          const data = await response.json();
          setAllTags(data);
        }
      } catch (error) {
        console.error('Error fetching tags:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllTags();
  }, [boardId]);

  // Récupérer les tags existants des tâches
  useEffect(() => {
    const fetchExistingTags = async () => {
      if (!boardId) return;
      
      try {
        const response = await fetch(`/api/boards/${boardId}/tasks`);
        if (response.ok) {
          const tasks = await response.json();
          const tags = new Set();
          
          tasks.forEach(task => {
            if (task.tags && Array.isArray(task.tags)) {
              task.tags.forEach(tag => {
                if (tag && tag.name) {
                  tags.add(JSON.stringify(tag));
                }
              });
            }
          });
          
          setExistingTags(Array.from(tags).map(tag => JSON.parse(tag)));
        }
      } catch (error) {
        console.error('Error fetching existing tags:', error);
      }
    };

    fetchExistingTags();
  }, [boardId]);

  const getFilteredTags = useCallback((searchTerm = '', excludeTags = []) => {
    if (!searchTerm.trim()) return [];
    
    const searchLower = searchTerm.toLowerCase();
    
    return allTags
      .filter(tag => {
        if (!tag || !tag.name) return false;
        
        const matchesSearch = tag.name.toLowerCase().includes(searchLower);
        
        // Vérifier si le tag est déjà sélectionné
        const isExcluded = excludeTags.some(t => {
          if (!t) return false;
          const tagName = typeof t === 'string' ? t : t.name;
          return tagName && tagName.toLowerCase() === tag.name.toLowerCase();
        });
        
        return matchesSearch && !isExcluded;
      })
      .slice(0, 5); // Limiter à 5 suggestions
  }, [allTags]);

  // Fonction pour obtenir les tags suggérés en fonction de la recherche
  const getSuggestedTags = useCallback((searchTerm = '', excludeTags = []) => {
    if (!searchTerm.trim()) {
      // Si pas de recherche, retourner les tags existants (limités à 10)
      return existingTags
        .filter(tag => {
          if (!tag || !tag.name) return false;
          return !excludeTags.some(t => 
            (typeof t === 'string' ? t : t.name) === tag.name
          );
        })
        .slice(0, 10);
    }
    
    // Si recherche, filtrer les tags existants
    const searchLower = searchTerm.toLowerCase();
    return existingTags
      .filter(tag => {
        if (!tag || !tag.name) return false;
        
        const matchesSearch = tag.name.toLowerCase().includes(searchLower);
        const isExcluded = excludeTags.some(t => 
          (typeof t === 'string' ? t : t.name) === tag.name
        );
        
        return matchesSearch && !isExcluded;
      })
      .slice(0, 10);
  }, [existingTags]);

  return { 
    allTags, 
    existingTags,
    isLoading, 
    getFilteredTags,
    getSuggestedTags 
  };
}
