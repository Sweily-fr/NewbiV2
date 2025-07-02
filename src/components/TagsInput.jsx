'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Plus, Search, Tag as TagIcon, CornerDownLeft } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useTags } from '@/src/hooks/useTags';

const TAG_COLORS = [
  { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
  { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200' },
  { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
];

export function getTagColor(index) {
  const color = TAG_COLORS[index % TAG_COLORS.length];
  return {
    className: `${color.bg} ${color.text} ${color.border}`,
    ...color
  };
}

export function TagsInput({ value = [], onChange, className }) {
  const [inputValue, setInputValue] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const suggestionsRef = useRef(null);
  
  const { getFilteredTags, getSuggestedTags } = useTags();
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [existingTags, setExistingTags] = useState([]);
  
  // Mettre à jour les suggestions lorsque la valeur de l'input change
  useEffect(() => {
    if (inputValue.trim().length >= 2) {
      // Afficher les suggestions uniquement si au moins 2 caractères sont saisis
      const filtered = getSuggestedTags(inputValue, value);
      setSuggestedTags(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      // Cacher les suggestions si moins de 2 caractères
      setShowSuggestions(false);
    }
    setFocusedSuggestionIndex(-1);
  }, [inputValue, value, getSuggestedTags]);
  
  // Fermer les suggestions en cliquant en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const addTag = (tagName, existingTag = null) => {
    const trimmedTag = tagName.trim();
    if (!trimmedTag) return;
    
    // Vérifier si le tag existe déjà
    const tagExists = value.some(tag => 
      typeof tag === 'string' ? tag === trimmedTag : tag.name === trimmedTag
    );
    
    if (!tagExists) {
      const newTag = existingTag || {
        name: trimmedTag,
        ...getTagColor(value.length)
      };
      onChange([...value, newTag]);
      setInputValue(''); // S'assure que le champ est vidé après l'ajout
      setShowSuggestions(false);
      inputRef.current?.focus();
    }
  };

  const removeTag = (tagToRemove) => {
    onChange(value.filter(tag => 
      typeof tag === 'string' ? tag !== tagToRemove : tag.name !== tagToRemove
    ));
  };

  const handleKeyDown = (e) => {
    if (showSuggestions && suggestedTags.length > 0) {
      // Navigation dans les suggestions avec les flèches
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedSuggestionIndex(prev => 
          prev < suggestedTags.length - 1 ? prev + 1 : prev
        );
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : 0
        );
        return;
      } else if (e.key === 'Enter' && focusedSuggestionIndex >= 0) {
        e.preventDefault();
        const selectedSuggestion = suggestedTags[focusedSuggestionIndex];
        if (selectedSuggestion) {
          addTag(selectedSuggestion.name, selectedSuggestion);
          setFocusedSuggestionIndex(-1);
        }
        return;
      }
    }

    // Gestion des autres touches
    if (['Enter', 'Tab', ','].includes(e.key)) {
      e.preventDefault();
      if (suggestedTags.length > 0 && focusedSuggestionIndex === -1) {
        // Ajouter la première suggestion si disponible et aucune n'est sélectionnée
        const firstSuggestion = suggestedTags[0];
        addTag(firstSuggestion.name, firstSuggestion);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setFocusedSuggestionIndex(-1);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // Supprimer le dernier tag avec Backspace
      e.preventDefault();
      removeTag(value[value.length - 1]);
    }
  };
  
  const handleSuggestionClick = (tag) => {
    addTag(tag.name, tag);
    setFocusedSuggestionIndex(-1);
  };

  return (
    <div 
      className="relative w-full"
      ref={containerRef}
    >
      <div
        className={cn(
          'flex p-2 border rounded-md',
          'min-h-10 items-center',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          isInputFocused && 'ring-2 ring-ring ring-offset-2',
          className
        )}
        onClick={() => inputRef.current?.focus()}
      >
        <div className="relative flex-1 min-w-[100px]">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent pl-8 pr-8 py-1 outline-none text-sm"
            placeholder={value.length === 0 ? "Rechercher ou ajouter un tag..." : ""}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsInputFocused(true);
              // Ne pas afficher les suggestions au focus, seulement après 2 caractères
              if (inputValue.trim().length >= 2) {
                setShowSuggestions(true);
              }
            }}
            onBlur={() => {
              // Use setTimeout to allow click on suggestions
              setTimeout(() => setIsInputFocused(false), 200);
            }}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground">
            <CornerDownLeft className="h-3.5 w-3.5" />
            <span>Entrée</span>
          </div>
        </div>
      </div>
      
      {/* Selected tags display */}
      {value.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {value.map((tag, index) => {
            const tagName = typeof tag === 'string' ? tag : tag.name;
            const tagColor = typeof tag === 'string' 
              ? getTagColor(index) 
              : { className: `${tag.bg} ${tag.text} ${tag.border}` };
            
            return (
              <div 
                key={index} 
                className={cn(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  'border',
                  tagColor.className
                )}
              >
                {tagName}
                <button
                  type="button"
                  className="ml-1.5 inline-flex items-center justify-center rounded-full h-4 w-4 hover:bg-black/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(tagName);
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Tags suggestions dropdown */}
      {showSuggestions && suggestedTags.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-60 overflow-auto"
          onMouseDown={(e) => e.preventDefault()} // Empêcher le blur de l'input lors du clic
        >
          <div className="p-1">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              {inputValue.trim() ? 'Résultats de la recherche' : 'Tags existants'}
            </div>
            {suggestedTags.map((tag, index) => {
              const tagColor = tag.bg && tag.text && tag.border 
                ? { className: `${tag.bg} ${tag.text} ${tag.border}` }
                : getTagColor(index);
              
              return (
                <button
                  key={tag.name}
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm',
                    'hover:bg-accent hover:text-accent-foreground',
                    'cursor-pointer text-left',
                    'transition-colors',
                    focusedSuggestionIndex === index && 'bg-accent text-accent-foreground'
                  )}
                  onClick={() => handleSuggestionClick(tag)}
                  onMouseEnter={() => setFocusedSuggestionIndex(index)}
                  onMouseLeave={() => setFocusedSuggestionIndex(-1)}
                >
                  <div className={cn(
                    'flex-shrink-0 h-3 w-3 rounded-full',
                    tagColor.bg || 'bg-gray-300'
                  )} />
                  <span className="truncate">{tag.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {value.some(t => (typeof t === 'string' ? t : t.name) === tag.name) 
                      ? 'Sélectionné' 
                      : 'Appuyez sur Entrée'}
                  </span>
                </button>
              );
            })}
            {inputValue.trim() && !suggestedTags.some(t => t.name.toLowerCase() === inputValue.trim().toLowerCase()) && (
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={() => addTag(inputValue)}
              >
                <Plus className="h-4 w-4" />
                <span>Créer "{inputValue}"</span>
              </button>
            )}
          </div>
        </div>
      )}
      {/* Ajout d'un espacement entre les tags et le champ de recherche */}
      <div className="h-2" />
    </div>
  );
}

export function TagsList({ tags = [], className, onRemove }) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {tags.map((tag, index) => {
        const tagName = typeof tag === 'string' ? tag : tag.name;
        const tagColor = typeof tag === 'string' 
          ? getTagColor(index)
          : { className: `${tag.bg} ${tag.text} ${tag.border}` };
          
        return (
          <span 
            key={tagName} 
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
              'border',
              tagColor.className
            )}
          >
            {tagName}
            {onRemove && (
              <button
                type="button"
                className="ml-1 inline-flex items-center justify-center rounded-full h-3 w-3 hover:bg-black/10"
                onClick={() => onRemove(tagName)}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
}
