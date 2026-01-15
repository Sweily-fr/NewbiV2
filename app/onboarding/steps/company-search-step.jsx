"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Search, Building2, MapPin, ExternalLink, Loader2 } from "lucide-react";

export default function CompanySearchStep({
  formData,
  updateFormData,
  onNext,
  onBack,
  onSkip,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Debounced search
  const searchCompanies = useCallback(async (query) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch(
        `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(query)}&page=1&per_page=10`
      );
      const data = await response.json();

      if (data.results) {
        setSearchResults(data.results);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Erreur lors de la recherche:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      searchCompanies(searchQuery);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, searchCompanies]);

  const handleSelectCompany = (company) => {
    setSelectedCompany(company);

    // Extraire les informations de l'entreprise
    const siege = company.siege || {};

    updateFormData({
      companyName: company.nom_complet || company.nom_raison_sociale || "",
      siret: siege.siret || "",
      siren: company.siren || "",
      legalForm: company.nature_juridique || "",
      addressStreet: siege.adresse || "",
      addressCity: siege.libelle_commune || "",
      addressZipCode: siege.code_postal || "",
      activitySector: company.activite_principale || "",
      hasNoCompany: false,
    });
  };

  const handleContinue = () => {
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-foreground">
          Recherchez votre entreprise
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Trouvez votre entreprise pour pré-remplir automatiquement vos
          informations.
        </p>
      </div>

      {/* Champ de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Nom de l'entreprise, SIRET ou SIREN..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {/* Résultats de recherche */}
      {hasSearched && (
        <div className="space-y-2 max-h-[320px] overflow-y-auto">
          {searchResults.length > 0
            ? searchResults.map((company) => {
                const siege = company.siege || {};
                const isSelected = selectedCompany?.siren === company.siren;

                return (
                  <button
                    key={company.siren}
                    onClick={() => handleSelectCompany(company)}
                    className={`w-full p-4 rounded-xl border transition-all duration-200 text-left ${
                      isSelected
                        ? "border-[#5A50FF] bg-[#5A50FF]/5"
                        : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-950"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          isSelected
                            ? "bg-[#5A50FF]"
                            : "bg-gray-100 dark:bg-gray-900"
                        }`}
                      >
                        <Building2
                          className={`w-4 h-4 ${
                            isSelected
                              ? "text-white"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`text-sm font-medium truncate ${
                            isSelected ? "text-[#5A50FF]" : "text-foreground"
                          }`}
                        >
                          {company.nom_complet || company.nom_raison_sociale}
                        </h3>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">
                            {siege.libelle_commune || "Adresse non disponible"}
                            {siege.code_postal && ` (${siege.code_postal})`}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          SIREN: {company.siren}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-[#5A50FF] mt-1" />
                      )}
                    </div>
                  </button>
                );
              })
            : !isLoading && (
                <div className="text-center py-8 px-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    Aucune entreprise trouvée pour "{searchQuery}"
                  </p>
                  <a
                    href="https://annuaire-entreprises.data.gouv.fr/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-[#5A50FF] hover:underline"
                  >
                    Rechercher sur l'annuaire officiel
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
        </div>
      )}

      {/* Texte informatif */}
      <div className="text-center pt-2">
        <p className="text-xs text-muted-foreground">
          Vous ne trouvez pas votre entreprise ?{" "}
          <a
            href="https://annuaire-entreprises.data.gouv.fr/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#5A50FF] hover:underline inline-flex items-center gap-1"
          >
            Consultez l'annuaire officiel
            <ExternalLink className="w-3 h-3" />
          </a>
        </p>
      </div>

      {/* Boutons de navigation */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onBack}>
            Retour
          </Button>
          <Button variant="ghost" onClick={onSkip}>
            Passer cette étape
          </Button>
        </div>
        <Button onClick={handleContinue} disabled={!selectedCompany}>
          Continuer
        </Button>
      </div>
    </div>
  );
}
