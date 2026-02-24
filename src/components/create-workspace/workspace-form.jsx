"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Search, Building2, MapPin, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

const FORME_JURIDIQUE_MAP = {
  "1000": "Entrepreneur individuel",
  "5410": "SARL unipersonnelle",
  "5420": "SARL",
  "5498": "SARL à associé unique",
  "5499": "SARL",
  "5510": "SA à conseil d'administration",
  "5520": "SA à directoire",
  "5599": "SA",
  "5610": "SAS",
  "5699": "SAS",
  "5710": "SAS unipersonnelle (SASU)",
  "5720": "SASU",
  "5785": "Société d'exercice libéral par actions simplifiée",
  "5800": "Société civile",
  "6220": "GIE",
  "6317": "Coopérative",
  "6521": "SCI",
  "6541": "SCP",
  "6542": "SCM",
  "9220": "Association déclarée",
  "9222": "Association reconnue d'utilité publique",
  "9300": "Fondation",
};

const getActivityLabel = (codeNaf) => {
  if (!codeNaf) return "";
  const prefix = codeNaf.substring(0, 2);
  const NAF_CATEGORIES = {
    "01": "Agriculture, sylviculture et pêche",
    "10": "Industries alimentaires",
    "13": "Fabrication de textiles",
    "20": "Industrie chimique",
    "25": "Fabrication de produits métalliques",
    "41": "Construction de bâtiments",
    "43": "Travaux de construction spécialisés",
    "45": "Commerce et réparation automobile",
    "46": "Commerce de gros",
    "47": "Commerce de détail",
    "49": "Transports terrestres",
    "55": "Hébergement",
    "56": "Restauration",
    "58": "Édition",
    "62": "Programmation, conseil et autres activités informatiques",
    "63": "Services d'information",
    "64": "Activités des services financiers",
    "66": "Activités auxiliaires de services financiers",
    "68": "Activités immobilières",
    "69": "Activités juridiques et comptables",
    "70": "Activités des sièges sociaux, conseil de gestion",
    "71": "Activités d'architecture et d'ingénierie",
    "72": "Recherche-développement scientifique",
    "73": "Publicité et études de marché",
    "74": "Autres activités spécialisées, scientifiques et techniques",
    "77": "Activités de location et location-bail",
    "78": "Activités liées à l'emploi",
    "79": "Activités des agences de voyage",
    "82": "Activités administratives et autres activités de soutien",
    "85": "Enseignement",
    "86": "Activités pour la santé humaine",
    "90": "Activités créatives, artistiques et de spectacle",
    "93": "Activités sportives, récréatives et de loisirs",
    "94": "Activités des organisations associatives",
    "95": "Réparation d'ordinateurs et de biens personnels",
    "96": "Autres services personnels",
  };
  return NAF_CATEGORIES[prefix] || "";
};

export function WorkspaceForm({
  companyName,
  setCompanyName,
  setCompanyData,
  onNameFocus,
  onNameBlur,
  onContinue,
}) {
  const fileInputRef = useRef(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isCheckingSiret, setIsCheckingSiret] = useState(false);
  const [siretError, setSiretError] = useState(null);

  const fallbackLetter = companyName?.trim()?.[0]?.toUpperCase() || "A";

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
        `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(query)}&page=1&per_page=8`
      );
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error("Erreur lors de la recherche:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    if (selectedCompany) return;
    const timer = setTimeout(() => {
      searchCompanies(companyName);
    }, 400);
    return () => clearTimeout(timer);
  }, [companyName, searchCompanies, selectedCompany]);

  const handleSelectCompany = async (company) => {
    setSiretError(null);

    const siege = company.siege || {};
    const siret = siege.siret || "";

    if (!siret) {
      setSiretError("Cette entreprise n'a pas de numéro SIRET valide.");
      return;
    }

    setIsCheckingSiret(true);
    try {
      const response = await fetch(`/api/check-siret?siret=${siret}`);
      const data = await response.json();

      if (!data.available) {
        setSiretError(
          `${data.message} Si vous faites partie de cette entreprise, demandez une invitation à l'administrateur.`
        );
        setIsCheckingSiret(false);
        return;
      }
    } catch (error) {
      console.error("Erreur vérification SIRET:", error);
    }
    setIsCheckingSiret(false);

    const name = company.nom_complet || company.nom_raison_sociale || "";
    setSelectedCompany(company);
    setCompanyName(name);
    setSearchResults([]);
    setHasSearched(false);

    const formeJuridiqueCode = company.nature_juridique || "";
    const formeJuridiqueLibelle = FORME_JURIDIQUE_MAP[formeJuridiqueCode] || formeJuridiqueCode;
    const codeNaf = company.activite_principale || "";
    const activityLabel = getActivityLabel(codeNaf);

    setCompanyData({
      companyName: name,
      siret,
      siren: company.siren || "",
      legalForm: formeJuridiqueLibelle,
      addressStreet: siege.adresse || "",
      addressCity: siege.libelle_commune || "",
      addressZipCode: siege.code_postal || "",
      addressCountry: "France",
      activitySector: codeNaf,
      activityCategory: activityLabel,
    });
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setCompanyName(value);
    if (selectedCompany) {
      setSelectedCompany(null);
      setCompanyData(null);
    }
  };

  const showResults = hasSearched && !selectedCompany && !isCheckingSiret;

  return (
    <div className="flex flex-col h-full px-20 py-6">
      <div className="flex flex-col pt-14">
        <h1 className="text-xl font-semibold text-[#46464A] mb-10">
          Créer votre espace de travail
        </h1>

        {/* Logo section */}
        <div className="flex items-center gap-5 mb-10">
          <Avatar
            className="size-14 cursor-pointer rounded-xl border border-dashed border-[#EEEFF1]"
            onClick={() => fileInputRef.current?.click()}
          >
            <AvatarFallback className="bg-[#FBFBFB] text-[#999] text-3xl font-medium rounded-xl">
              {fallbackLetter}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Logo de l&apos;entreprise
            </p>
            <p className="text-[13px] text-muted-foreground mt-1 leading-snug">
              PNG, JPG ou GIF. 10 Mo max.
              <br />
              Taille recommandée : 400x400px.
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif"
            className="hidden"
          />
        </div>

        {/* Company search field */}
        <div className="relative space-y-1.5 mb-5">
          <Label htmlFor="company-name" className="text-[13px] text-muted-foreground">
            Recherchez votre entreprise
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="company-name"
              value={companyName}
              onChange={handleInputChange}
              onFocus={onNameFocus}
              onBlur={onNameBlur}
              placeholder="Nom de l'entreprise, SIRET ou SIREN..."
              className="pl-10"
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin" />
            )}
          </div>

          {/* Selected company info */}
          {selectedCompany && (
            <div className="flex items-center gap-2.5 rounded-lg border border-[#5A50FF]/20 bg-[#5A50FF]/5 px-3 py-2 mt-1">
              <div className="p-1.5 rounded-md bg-[#5A50FF]">
                <Building2 className="size-3.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#46464A] truncate">
                  {selectedCompany.nom_complet || selectedCompany.nom_raison_sociale}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  SIREN: {selectedCompany.siren}
                  {selectedCompany.siege?.libelle_commune && ` · ${selectedCompany.siege.libelle_commune}`}
                </p>
              </div>
            </div>
          )}

          {/* SIRET error */}
          {siretError && (
            <div className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 mt-1">
              <AlertCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{siretError}</p>
            </div>
          )}

          {/* SIRET checking loader */}
          {isCheckingSiret && (
            <div className="flex items-center gap-2 py-2 mt-1">
              <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Vérification de l&apos;entreprise...</span>
            </div>
          )}

          {/* Search results dropdown */}
          {showResults && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-[#e6e7ea] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="max-h-[280px] overflow-y-auto p-1">
                {searchResults.length > 0
                  ? searchResults.map((company) => {
                      const siege = company.siege || {};
                      return (
                        <button
                          key={company.siren}
                          onClick={() => handleSelectCompany(company)}
                          disabled={isCheckingSiret}
                          className="flex w-full flex-col items-start gap-1 rounded-md p-2.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium text-sm truncate">
                              {company.nom_complet || company.nom_raison_sociale}
                            </span>
                            <span className="text-xs text-muted-foreground shrink-0 ml-2">
                              {company.siren}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3 shrink-0" />
                            <span className="truncate">
                              {siege.libelle_commune || "Adresse non disponible"}
                              {siege.code_postal && ` (${siege.code_postal})`}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  : !isLoading && (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Aucune entreprise trouvée pour &quot;{companyName}&quot;
                      </div>
                    )}
              </div>
            </div>
          )}
        </div>

        {/* Workspace handle field */}
        <div className="space-y-1.5 mb-5">
          <Label htmlFor="workspace-slug" className="text-[13px] text-muted-foreground">
            Identifiant de l&apos;espace
          </Label>
          <Input
            id="workspace-slug"
            value={`app.newbi.io/${companyName?.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-") || "my-workspace"}`}
            readOnly
          />
        </div>

        {/* Billing country field */}
        <div className="space-y-1.5">
          <Label className="text-[13px] text-muted-foreground">
            Pays de facturation
          </Label>
          <Select defaultValue="FR">
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un pays" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FR">France</SelectItem>
              <SelectItem value="BE">Belgique</SelectItem>
              <SelectItem value="CH">Suisse</SelectItem>
              <SelectItem value="CA">Canada</SelectItem>
              <SelectItem value="LU">Luxembourg</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Continue button */}
      <div className="mt-auto pb-6">
        <Button
          variant="primary"
          className="w-full"
          disabled={!selectedCompany}
          onClick={onContinue}
        >
          Continuer
        </Button>
      </div>
    </div>
  );
}
