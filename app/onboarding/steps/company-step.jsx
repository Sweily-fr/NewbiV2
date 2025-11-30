"use client";

import { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Search,
  Building,
  LoaderCircle,
  ExternalLink,
  Badge as BadgeIcon,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { toast } from "@/src/components/ui/sonner";
import { searchCompanies, convertCompanyToClient } from "@/src/utils/api-gouv";
import { useActiveOrganization } from "@/src/lib/organization-client";

export default function CompanyStep({
  formData,
  updateFormData,
  onNext,
  onBack,
  onSkip,
  onComplete,
}) {
  const { organization } = useActiveOrganization();
  const [companyQuery, setCompanyQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [siretError, setSiretError] = useState("");

  // Debounce de la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(companyQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [companyQuery]);

  // Recherche d'entreprises via API Gouv Data
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setCompanies([]);
      return;
    }

    const searchApiGouv = async () => {
      setLoadingCompanies(true);
      try {
        const results = await searchCompanies(debouncedQuery, 5);
        setCompanies(results);
      } catch (error) {
        toast.error("Erreur lors de la recherche d'entreprises");
        setCompanies([]);
      } finally {
        setLoadingCompanies(false);
      }
    };

    searchApiGouv();
  }, [debouncedQuery]);

  // Fonction pour sélectionner une entreprise
  const handleCompanySelect = (company) => {
    try {
      const clientData = convertCompanyToClient(company);

      // Mettre à jour le formData avec les données de l'entreprise
      updateFormData({
        companyName: clientData.name,
        companyEmail: "", // À compléter manuellement
        siret: clientData.siret,
        addressStreet: clientData.address?.street || "",
        addressCity: clientData.address?.city || "",
        addressZipCode: clientData.address?.postalCode || "",
        addressCountry: clientData.address?.country || "France",
      });

      // Afficher le formulaire pré-rempli
      setShowManualForm(true);
      setCompanyQuery("");
      setCompanies([]);

      toast.success(`Entreprise "${company.name}" importée`);
    } catch (error) {
      toast.error("Erreur lors de l'import de l'entreprise");
    }
  };

  // Vérifier si le SIRET existe déjà
  const checkSiretExists = async (siret) => {
    if (!siret || siret.length < 9) {
      setSiretError("");
      return false;
    }

    // Vérifier si c'est le SIRET de l'organisation actuelle
    if (organization?.siret === siret) {
      setSiretError("Ce SIRET est déjà enregistré pour votre organisation");
      return true;
    }

    setSiretError("");
    return false;
  };

  // Vérifier le SIRET quand il change
  useEffect(() => {
    if (formData.siret) {
      checkSiretExists(formData.siret);
    }
  }, [formData.siret, organization]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation minimale
    if (!formData.companyName || !formData.companyEmail) {
      toast.error(
        "Veuillez renseigner au moins le nom et l'email de votre entreprise"
      );
      return;
    }

    // Vérifier le SIRET
    if (formData.siret) {
      const siretExists = await checkSiretExists(formData.siret);
      if (siretExists) {
        toast.error("Ce SIRET est déjà utilisé");
        return;
      }
    }

    // Appeler onComplete au lieu de onNext (pas d'étape 3)
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-medium text-foreground">
          Informations de votre entreprise
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Renseignez vos informations pour créer des factures et devis. Vous
          pourrez également le faire plus tard si vous préférez.
        </p>
      </div>

      {!showManualForm ? (
        // Interface de recherche
        <div className="space-y-6 min-h-[400px]">
          <div className="space-y-3">
            <Label htmlFor="company-search" className="text-sm font-normal">
              Rechercher votre entreprise
            </Label>
            <div className="relative mt-2">
              <Input
                id="company-search"
                value={companyQuery}
                onChange={(e) => setCompanyQuery(e.target.value)}
                placeholder="Nom d'entreprise, SIRET, SIREN..."
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              Base de données officielle des entreprises françaises
            </p>
          </div>

          {/* Résultats de recherche */}
          {loadingCompanies && (
            <div className="flex items-center justify-center p-8">
              <LoaderCircle className="h-6 w-6 animate-spin mr-2" />
              <span className="text-sm">Recherche en cours...</span>
            </div>
          )}

          {companies.length > 0 && (
            <div className="space-y-3">
              {companies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => handleCompanySelect(company)}
                  className="w-full p-4 border rounded-xl hover:border-[#5A50FF] hover:bg-[#5A50FF]/5 transition-all text-left group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-900 group-hover:bg-[#5A50FF] transition-colors">
                      <Building className="h-4 w-4 text-gray-600 dark:text-gray-400 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {company.name}
                        </h4>
                        {company.isActive && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-green-50 text-green-700 border-green-200"
                          >
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">
                          <strong>SIRET:</strong> {company.siret}
                        </p>
                        {company.address && (
                          <p className="text-xs text-muted-foreground truncate">
                            {company.address}, {company.postalCode}{" "}
                            {company.city}
                          </p>
                        )}
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {companyQuery && !loadingCompanies && companies.length === 0 && (
            <div className="text-center p-8 text-muted-foreground">
              <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                Aucune entreprise trouvée pour "{companyQuery}"
              </p>
              <p className="text-xs mt-1">
                Essayez avec un nom d'entreprise ou un SIRET
              </p>
            </div>
          )}

          {/* Bouton pour saisie manuelle */}
          <div className="pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowManualForm(true)}
              className="w-full"
            >
              Saisir les informations manuellement
            </Button>
          </div>

          {/* Boutons de navigation */}
          <div className="flex items-center justify-between pt-4">
            <Button type="button" variant="secondary" onClick={onBack}>
              Retour
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" onClick={onSkip}>
                Ignorer
              </Button>
              <Button onClick={() => setShowManualForm(true)}>Continuer</Button>
            </div>
          </div>
        </div>
      ) : (
        // Formulaire manuel
        <form onSubmit={handleSubmit} className="space-y-4 min-h-[400px]">
          {/* Nom et Email côte à côte */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nom de l'entreprise *</Label>
              <Input
                id="companyName"
                type="text"
                placeholder="Nom de votre entreprise"
                value={formData.companyName || ""}
                onChange={(e) =>
                  updateFormData({ companyName: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyEmail">Email professionnel *</Label>
              <Input
                id="companyEmail"
                type="email"
                placeholder="contact@entreprise.com"
                value={formData.companyEmail || ""}
                onChange={(e) =>
                  updateFormData({ companyEmail: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="siret">SIRET</Label>
            <Input
              id="siret"
              type="text"
              placeholder="123 456 789 00012"
              value={formData.siret || ""}
              onChange={(e) => updateFormData({ siret: e.target.value })}
              className={siretError ? "border-red-500" : ""}
              disabled={!!siretError}
            />
            {siretError && (
              <div className="flex items-center gap-2 text-sm text-red-500">
                <AlertCircle className="h-4 w-4" />
                <span>{siretError}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressStreet">Adresse</Label>
            <Input
              id="addressStreet"
              type="text"
              placeholder="Rue"
              value={formData.addressStreet || ""}
              onChange={(e) =>
                updateFormData({ addressStreet: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="addressZipCode">Code postal</Label>
              <Input
                id="addressZipCode"
                type="text"
                placeholder="75001"
                value={formData.addressZipCode || ""}
                onChange={(e) =>
                  updateFormData({ addressZipCode: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressCity">Ville</Label>
              <Input
                id="addressCity"
                type="text"
                placeholder="Paris"
                value={formData.addressCity || ""}
                onChange={(e) =>
                  updateFormData({ addressCity: e.target.value })
                }
              />
            </div>
          </div>

          {/* Bouton pour revenir à la recherche */}
          <div className="pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowManualForm(false);
                setCompanyQuery("");
              }}
              className="text-xs"
            >
              ← Revenir à la recherche
            </Button>
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button type="button" variant="secondary" onClick={onBack}>
              Retour
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" onClick={onSkip}>
                Ignorer
              </Button>
              <Button type="submit" disabled={!!siretError}>
                Accéder au dashboard
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
