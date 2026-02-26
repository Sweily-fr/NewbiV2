"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Search, Building2, MapPin, Loader2, AlertCircle } from "lucide-react";

// Mapping des codes de forme juridique vers les libellés
const FORME_JURIDIQUE_MAP = {
  "1000": "Entrepreneur individuel",
  "5410": "SARL unipersonnelle",
  "5420": "SARL",
  "5498": "SARL à associé unique",
  "5499": "SARL",
  "5510": "SA à conseil d'administration",
  "5520": "SA à directoire",
  "5530": "SA à participation ouvrière",
  "5531": "SA coopérative",
  "5532": "SA coopérative de production",
  "5560": "SA à participation ouvrière",
  "5599": "SA",
  "5610": "SAS",
  "5699": "SAS",
  "5710": "SAS unipersonnelle (SASU)",
  "5720": "SASU",
  "5785": "Société d'exercice libéral par actions simplifiée",
  "5800": "Société civile",
  "6100": "Caisse d'épargne",
  "6210": "GEIE",
  "6220": "GIE",
  "6316": "CUMA",
  "6317": "Coopérative",
  "6411": "Mutuelle",
  "6521": "SCI",
  "6532": "SCI de construction-vente",
  "6533": "SCI d'attribution",
  "6534": "SCI coopérative",
  "6540": "Société civile foncière",
  "6541": "SCP",
  "6542": "SCM",
  "6543": "SCPI",
  "6544": "SCF",
  "6551": "Société civile",
  "7111": "Autorité constitutionnelle",
  "7112": "Autorité administrative ou publique",
  "8110": "Régime général de la Sécurité sociale",
  "9210": "Association non déclarée",
  "9220": "Association déclarée",
  "9221": "Association de droit local",
  "9222": "Association reconnue d'utilité publique",
  "9223": "Association déclarée d'insertion par l'économique",
  "9230": "Association déclarée",
  "9240": "Congrégation",
  "9260": "Association de droit local",
  "9300": "Fondation",
};

// Mapping simplifié des codes NAF vers les catégories d'activité
const getActivityLabel = (codeNaf) => {
  if (!codeNaf) return "";

  const prefix = codeNaf.substring(0, 2);
  const NAF_CATEGORIES = {
    "01": "Agriculture, sylviculture et pêche",
    "02": "Agriculture, sylviculture et pêche",
    "03": "Agriculture, sylviculture et pêche",
    "05": "Industries extractives",
    "06": "Industries extractives",
    "07": "Industries extractives",
    "08": "Industries extractives",
    "09": "Industries extractives",
    "10": "Industries alimentaires",
    "11": "Fabrication de boissons",
    "12": "Fabrication de produits à base de tabac",
    "13": "Fabrication de textiles",
    "14": "Industrie de l'habillement",
    "15": "Industrie du cuir et de la chaussure",
    "16": "Travail du bois",
    "17": "Industrie du papier et du carton",
    "18": "Imprimerie",
    "19": "Cokéfaction et raffinage",
    "20": "Industrie chimique",
    "21": "Industrie pharmaceutique",
    "22": "Fabrication de produits en caoutchouc et plastique",
    "23": "Fabrication d'autres produits minéraux non métalliques",
    "24": "Métallurgie",
    "25": "Fabrication de produits métalliques",
    "26": "Fabrication de produits informatiques et électroniques",
    "27": "Fabrication d'équipements électriques",
    "28": "Fabrication de machines et équipements",
    "29": "Industrie automobile",
    "30": "Fabrication d'autres matériels de transport",
    "31": "Fabrication de meubles",
    "32": "Autres industries manufacturières",
    "33": "Réparation et installation de machines",
    "35": "Production et distribution d'électricité, gaz, vapeur",
    "36": "Captage, traitement et distribution d'eau",
    "37": "Collecte et traitement des eaux usées",
    "38": "Collecte et traitement des déchets",
    "39": "Dépollution et autres services de gestion des déchets",
    "41": "Construction de bâtiments",
    "42": "Génie civil",
    "43": "Travaux de construction spécialisés",
    "45": "Commerce et réparation automobile",
    "46": "Commerce de gros",
    "47": "Commerce de détail",
    "49": "Transports terrestres",
    "50": "Transports par eau",
    "51": "Transports aériens",
    "52": "Entreposage et services auxiliaires des transports",
    "53": "Activités de poste et de courrier",
    "55": "Hébergement",
    "56": "Restauration",
    "58": "Édition",
    "59": "Production de films, vidéos et programmes TV",
    "60": "Programmation et diffusion",
    "61": "Télécommunications",
    "62": "Programmation, conseil et autres activités informatiques",
    "63": "Services d'information",
    "64": "Activités des services financiers",
    "65": "Assurance",
    "66": "Activités auxiliaires de services financiers",
    "68": "Activités immobilières",
    "69": "Activités juridiques et comptables",
    "70": "Activités des sièges sociaux, conseil de gestion",
    "71": "Activités d'architecture et d'ingénierie",
    "72": "Recherche-développement scientifique",
    "73": "Publicité et études de marché",
    "74": "Autres activités spécialisées, scientifiques et techniques",
    "75": "Activités vétérinaires",
    "77": "Activités de location et location-bail",
    "78": "Activités liées à l'emploi",
    "79": "Activités des agences de voyage",
    "80": "Enquêtes et sécurité",
    "81": "Services relatifs aux bâtiments et aménagement paysager",
    "82": "Activités administratives et autres activités de soutien",
    "84": "Administration publique et défense",
    "85": "Enseignement",
    "86": "Activités pour la santé humaine",
    "87": "Hébergement médico-social et social",
    "88": "Action sociale sans hébergement",
    "90": "Activités créatives, artistiques et de spectacle",
    "91": "Bibliothèques, archives, musées",
    "92": "Organisation de jeux de hasard et d'argent",
    "93": "Activités sportives, récréatives et de loisirs",
    "94": "Activités des organisations associatives",
    "95": "Réparation d'ordinateurs et de biens personnels",
    "96": "Autres services personnels",
    "97": "Activités des ménages en tant qu'employeurs",
    "98": "Activités indifférenciées des ménages",
    "99": "Activités des organisations extraterritoriales",
  };

  return NAF_CATEGORIES[prefix] || "";
};

export default function CompanySearchStep({
  formData,
  updateFormData,
  onNext,
  onBack,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isCheckingSiret, setIsCheckingSiret] = useState(false);
  const [siretError, setSiretError] = useState(null);

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
    if (selectedCompany) return;
    const timer = setTimeout(() => {
      searchCompanies(searchQuery);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, searchCompanies, selectedCompany]);

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

      if (response.ok) {
        const data = await response.json();
        if (data.available === false) {
          setSiretError(
            `${data.message || "Ce numéro SIRET est déjà associé à un compte existant sur Newbi."} Si vous faites partie de cette entreprise, demandez une invitation à l'administrateur du compte.`
          );
          setIsCheckingSiret(false);
          return;
        }
      }
      // Si 401 ou autre erreur serveur, on laisse passer (le webhook vérifiera)
    } catch (error) {
      console.error("Erreur vérification SIRET:", error);
    }
    setIsCheckingSiret(false);

    const name = company.nom_complet || company.nom_raison_sociale || "";
    setSelectedCompany(company);
    setSearchQuery(name);
    setSearchResults([]);
    setHasSearched(false);

    const formeJuridiqueCode = company.nature_juridique || "";
    const formeJuridiqueLibelle = FORME_JURIDIQUE_MAP[formeJuridiqueCode] || formeJuridiqueCode;
    const codeNaf = company.activite_principale || "";
    const activityLabel = getActivityLabel(codeNaf);

    updateFormData({
      companyName: name,
      siret: siret,
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
    setSearchQuery(value);
    if (selectedCompany) {
      setSelectedCompany(null);
    }
  };

  const showResults = hasSearched && !selectedCompany && !isCheckingSiret;

  return (
    <div className="flex flex-col">
      <h1 className="text-xl font-semibold text-[#46464A] mb-10">
        Recherchez votre entreprise
      </h1>

      {/* Company search field */}
      <div className="relative space-y-1.5">
        <Label htmlFor="company-search" className="text-[13px] text-muted-foreground">
          Nom de l&apos;entreprise, SIRET ou SIREN
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            id="company-search"
            value={searchQuery}
            onChange={handleInputChange}
            placeholder="Rechercher..."
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
                      Aucune entreprise trouvée pour &quot;{searchQuery}&quot;
                    </div>
                  )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-10">
        <Button variant="ghost" onClick={onBack}>
          Retour
        </Button>
        <Button
          variant="primary"
          onClick={onNext}
          disabled={!selectedCompany || isCheckingSiret}
        >
          {isCheckingSiret ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Continuer"
          )}
        </Button>
      </div>
    </div>
  );
}
