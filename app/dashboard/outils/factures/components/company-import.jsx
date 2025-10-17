"use client";

import { useState, useEffect } from "react";

// Fonction de formatage de l'IBAN avec espaces
const formatIban = (iban) => {
  if (!iban) return "";
  
  // Supprimer tous les espaces existants et convertir en majuscules
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();
  
  // Ajouter un espace tous les 4 caractères
  return cleanIban.replace(/(.{4})/g, '$1 ').trim();
};
import { Building, Upload, Check, AlertCircle, LoaderCircle } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import { Alert, AlertDescription } from "@/src/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { toast } from "@/src/components/ui/sonner";

// Mock company data - In real app, this would come from GraphQL
const MOCK_COMPANY_INFO = {
  id: "company_1",
  name: "Ma Société SARL",
  address: {
    street: "123 Rue de la République",
    postalCode: "75001",
    city: "Paris",
    country: "France",
  },
  email: "contact@masociete.fr",
  phone: "+33 1 23 45 67 89",
  siret: "12345678901234",
  vatNumber: "FR12345678901",
  website: "https://masociete.fr",
  bankDetails: {
    bankName: "Banque Populaire",
    iban: "FR14 2004 1010 0505 0001 3M02 606",
    bic: "CCBPFRPPXXX",
  },
  logo: null,
};

export default function CompanyImport({
  onImport,
  currentCompanyInfo,
  className,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [companyData, setCompanyData] = useState(null);

  // Load company data when dialog opens
  useEffect(() => {
    if (isOpen && !companyData) {
      loadCompanyData();
    }
  }, [isOpen]);

  const loadCompanyData = async () => {
    setLoading(true);
    try {
      // In real app, this would be a GraphQL query to get company info
      await new Promise((resolve) => setTimeout(resolve, 500));
      setCompanyData(MOCK_COMPANY_INFO);
    } catch (error) {
      toast.error("Erreur lors du chargement des informations entreprise");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (!companyData) return;

    const importedInfo = {
      name: companyData.name,
      address: companyData.address,
      email: companyData.email,
      phone: companyData.phone,
      siret: companyData.siret,
      vatNumber: companyData.vatNumber,
      website: companyData.website,
      bankDetails: companyData.bankDetails,
      logo: companyData.logo,
    };

    onImport?.(importedInfo);
    setIsOpen(false);
    toast.success("Informations entreprise importées avec succès");
  };

  const hasCurrentInfo =
    currentCompanyInfo && Object.keys(currentCompanyInfo).length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={`gap-2 ${className}`}>
          <Building className="h-4 w-4" />
          Importer infos entreprise
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Importer les informations entreprise
          </DialogTitle>
          <DialogDescription>
            Importez automatiquement les informations de votre entreprise dans
            cette facture.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoaderCircle className="h-6 w-6 animate-spin mr-2" />
            <span>Chargement des informations...</span>
          </div>
        ) : companyData ? (
          <div className="space-y-6">
            {hasCurrentInfo && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Cette facture contient déjà des informations entreprise.
                  L'import les remplacera.
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Informations à importer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Company Basic Info */}
                <div>
                  <h4 className="font-medium mb-2">Informations générales</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Nom :</span>
                      <p className="font-medium">{companyData.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email :</span>
                      <p className="font-medium">{companyData.email}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Téléphone :</span>
                      <p className="font-medium">{companyData.phone}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Site web :</span>
                      <p className="font-medium">{companyData.website}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Address */}
                <div>
                  <h4 className="font-medium mb-2">Adresse</h4>
                  <div className="text-sm">
                    <p>{companyData.address.street}</p>
                    <p>
                      {companyData.address.postalCode}{" "}
                      {companyData.address.city}
                    </p>
                    <p>{companyData.address.country}</p>
                  </div>
                </div>

                <Separator />

                {/* Legal Info */}
                <div>
                  <h4 className="font-medium mb-2">Informations légales</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">SIRET :</span>
                      <p className="font-medium">{companyData.siret}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">N° TVA :</span>
                      <p className="font-medium">{companyData.vatNumber}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Bank Details */}
                {companyData.bankDetails && (
                  <div>
                    <h4 className="font-medium mb-2">Informations bancaires</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Banque :</span>
                        <p className="font-medium">
                          {companyData.bankDetails.bankName}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">IBAN :</span>
                        <p className="font-medium font-mono text-xs">
                          {formatIban(companyData.bankDetails.iban)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">BIC :</span>
                        <p className="font-medium">
                          {companyData.bankDetails.bic}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleImport} className="gap-2">
                <Check className="h-4 w-4" />
                Importer ces informations
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Aucune information entreprise configurée
            </p>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Fermer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Quick import button for existing company info
export function QuickCompanyImport({ onImport, className }) {
  const [loading, setLoading] = useState(false);

  const handleQuickImport = async () => {
    setLoading(true);
    try {
      // In real app, this would fetch the default company info
      await new Promise((resolve) => setTimeout(resolve, 300));

      onImport?.(MOCK_COMPANY_INFO);
      toast.success("Informations entreprise importées");
    } catch (error) {
      toast.error("Erreur lors de l'import");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleQuickImport}
      disabled={loading}
      className={`gap-2 ${className}`}
    >
      {loading ? (
        <LoaderCircle className="h-4 w-4 animate-spin" />
      ) : (
        <Upload className="h-4 w-4" />
      )}
      Import rapide
    </Button>
  );
}

// Hook for company data management
export function useCompanyImport() {
  const [companyInfo, setCompanyInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadCompanyInfo = async () => {
    setLoading(true);
    try {
      // In real app, this would be a GraphQL query
      await new Promise((resolve) => setTimeout(resolve, 500));
      setCompanyInfo(MOCK_COMPANY_INFO);
      return MOCK_COMPANY_INFO;
    } finally {
      setLoading(false);
    }
  };

  const importCompanyInfo = (invoiceData, companyData) => {
    return {
      ...invoiceData,
      companyInfo: {
        name: companyData.name,
        address: companyData.address,
        email: companyData.email,
        phone: companyData.phone,
        siret: companyData.siret,
        vatNumber: companyData.vatNumber,
        website: companyData.website,
        bankDetails: companyData.bankDetails,
        logo: companyData.logo,
      },
    };
  };

  const hasCompanyInfo = (invoiceData) => {
    return (
      invoiceData?.companyInfo &&
      Object.keys(invoiceData.companyInfo).length > 0
    );
  };

  return {
    companyInfo,
    loading,
    loadCompanyInfo,
    importCompanyInfo,
    hasCompanyInfo,
  };
}
