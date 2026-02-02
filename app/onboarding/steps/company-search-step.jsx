"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Search, Building2, MapPin, ExternalLink, Loader2, AlertCircle } from "lucide-react";

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
    const timer = setTimeout(() => {
      searchCompanies(searchQuery);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, searchCompanies]);

  const handleSelectCompany = async (company) => {
    // Réinitialiser l'erreur
    setSiretError(null);

    // Extraire les informations de l'entreprise
    const siege = company.siege || {};
    const siret = siege.siret || "";

    if (!siret) {
      setSiretError("Cette entreprise n'a pas de numéro SIRET valide.");
      return;
    }

    // Vérifier si le SIRET est déjà utilisé
    setIsCheckingSiret(true);
    try {
      const response = await fetch(`/api/check-siret?siret=${siret}`);
      const data = await response.json();

      if (!data.available) {
        setSiretError(
          `${data.message} Si vous faites partie de cette entreprise, demandez une invitation à l'administrateur du compte.`
        );
        setIsCheckingSiret(false);
        return;
      }
    } catch (error) {
      console.error("Erreur vérification SIRET:", error);
      // En cas d'erreur, on laisse passer (le webhook vérifiera aussi)
    }
    setIsCheckingSiret(false);

    // SIRET disponible - sélectionner l'entreprise
    setSelectedCompany(company);

    // Mapper le code de forme juridique vers le libellé
    const formeJuridiqueCode = company.nature_juridique || "";
    const formeJuridiqueLibelle = FORME_JURIDIQUE_MAP[formeJuridiqueCode] || formeJuridiqueCode;

    // Mapper le code NAF vers la catégorie d'activité
    const codeNaf = company.activite_principale || "";
    const activityLabel = getActivityLabel(codeNaf);

    updateFormData({
      companyName: company.nom_complet || company.nom_raison_sociale || "",
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

      {/* Message d'erreur SIRET déjà utilisé */}
      {siretError && (
        <div className="flex items-start gap-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-red-800 dark:text-red-200">
              Entreprise déjà enregistrée
            </p>
            <p className="text-red-700 dark:text-red-300 text-xs mt-0.5">
              {siretError}
            </p>
          </div>
        </div>
      )}

      {/* Loader vérification SIRET */}
      {isCheckingSiret && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Vérification de l'entreprise...</span>
        </div>
      )}

      {/* Résultats de recherche */}
      {hasSearched && !isCheckingSiret && (
        <div className="space-y-2 max-h-[320px] overflow-y-auto">
          {searchResults.length > 0
            ? searchResults.map((company) => {
                const siege = company.siege || {};
                const isSelected = selectedCompany?.siren === company.siren;

                return (
                  <button
                    key={company.siren}
                    onClick={() => handleSelectCompany(company)}
                    disabled={isCheckingSiret}
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
        <p className="text-xs text-muted-foreground mt-2">
          L'accès à Newbi est réservé aux entreprises immatriculées.
        </p>
      </div>

      {/* Boutons de navigation */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={onBack}>
          Retour
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!selectedCompany || isCheckingSiret}
        >
          {isCheckingSiret ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Continuer"
          )}
        </Button>
      </div>
    </div>
  );
}
