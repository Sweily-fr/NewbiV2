"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/src/components/ui/input";
import { Loader2, MapPin, Search } from "lucide-react";

/**
 * Recherche d'une entreprise au registre (même source que l'inscription).
 * `onSelect` reçoit l'entreprise brute renvoyée par /api/search-companies.
 */
export function CompanyRegistrySearch({ onSelect, disabled = false }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      setHasSearched(true);
      try {
        const res = await fetch(
          `/api/search-companies?q=${encodeURIComponent(q)}&limite=8`,
          { signal: controller.signal },
        );
        const data = await res.json();
        setResults(data.results || []);
      } catch (err) {
        if (err.name !== "AbortError") setResults([]);
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleSelect = (company) => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
    onSelect(company);
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <Input
        id="company-registry-search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Nom de l'entreprise, SIRET ou SIREN..."
        className="w-full pl-10"
        disabled={disabled}
        autoComplete="off"
      />
      {isSearching && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin" />
      )}

      {hasSearched && !isSearching && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-border bg-popover shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="max-h-[240px] overflow-y-auto p-1">
            {results.length > 0 ? (
              results.map((company) => {
                const siege = company.siege || {};
                return (
                  <button
                    key={company.siren}
                    type="button"
                    onClick={() => handleSelect(company)}
                    className="flex w-full flex-col items-start gap-1 rounded-lg p-2.5 text-left text-sm hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium text-[13px] truncate">
                        {company.nom_complet || company.nom_raison_sociale}
                      </span>
                      <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
                        {company.siren}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="size-3 shrink-0" />
                      <span className="truncate">
                        {siege.libelle_commune || "Adresse non disponible"}
                        {siege.code_postal && ` (${siege.code_postal})`}
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-[13px] text-muted-foreground">
                Aucune entreprise trouvée
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
