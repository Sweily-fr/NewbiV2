"use client";

import { useState, useEffect } from "react";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import {
  Landmark,
  LoaderCircle,
  CheckCircle,
  Search,
  Building2,
} from "lucide-react";
import { useBankingConnection } from "@/src/hooks/useBankingConnection";
import { useWorkspace } from "@/src/hooks/useWorkspace";

export default function BankingConnectButton() {
  const { workspaceId } = useWorkspace();
  const {
    isConnected,
    accountsCount,
    hasAccounts,
    isLoading,
    isLoadingInstitutions,
    institutions,
    error,
    connectBank,
    fetchInstitutions,
  } = useBankingConnection(workspaceId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Charger les institutions quand le modal s'ouvre
  useEffect(() => {
    if (isModalOpen && institutions.length === 0) {
      fetchInstitutions("FR");
    }
  }, [isModalOpen]);

  // Filtrer les institutions par recherche
  const filteredInstitutions = institutions.filter((inst) =>
    inst.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
  );

  const handleOpenModal = () => {
    if (!isConnected) {
      setIsModalOpen(true);
    }
  };

  const handleSelectInstitution = async (institution) => {
    setSelectedInstitution(institution);
    setIsConnecting(true);
    await connectBank(institution.id);
    setIsConnecting(false);
  };

  // Si déjà connecté, afficher le statut
  if (isConnected) {
    const statusText =
      hasAccounts && accountsCount > 0
        ? `Connecté (${accountsCount} compte${accountsCount > 1 ? "s" : ""})`
        : "Compte connecté";

    return (
      <Button
        disabled
        variant="outline"
        size="sm"
        className="text-green-600 border-green-200 bg-green-50"
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        {statusText}
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={handleOpenModal}
        disabled={isLoading}
        variant="default"
        size="sm"
      >
        {isLoading && <LoaderCircle className="h-4 w-4 animate-spin mr-2" />}
        <Landmark className="h-4 w-4 mr-2" />
        Connecter un compte bancaire
      </Button>

      {/* Modal de sélection de banque */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connecter votre banque</DialogTitle>
            <DialogDescription>
              Sélectionnez votre banque pour synchroniser vos comptes
            </DialogDescription>
          </DialogHeader>

          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une banque..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Liste des banques */}
          <ScrollArea className="h-[300px] pr-4">
            {isLoadingInstitutions ? (
              <div className="flex items-center justify-center py-8">
                <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Chargement des banques...
                </span>
              </div>
            ) : filteredInstitutions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery
                  ? "Aucune banque trouvée"
                  : "Aucune banque disponible"}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredInstitutions.map((institution) => (
                  <button
                    key={institution.id}
                    onClick={() => handleSelectInstitution(institution)}
                    disabled={isConnecting}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {institution.logo ? (
                      <img
                        src={institution.logo}
                        alt={institution.name}
                        className="h-8 w-8 object-contain rounded"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">{institution.name}</p>
                      {institution.bic && (
                        <p className="text-xs text-muted-foreground">
                          {institution.bic}
                        </p>
                      )}
                    </div>
                    {isConnecting &&
                      selectedInstitution?.id === institution.id && (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
