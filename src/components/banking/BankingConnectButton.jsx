"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Landmark, LoaderCircle, CheckCircle } from "lucide-react";
import { useBankingConnection } from "@/src/hooks/useBankingConnection";
import { useWorkspace } from "@/src/hooks/useWorkspace";

export default function BankingConnectButton() {
  const { workspaceId } = useWorkspace();
  const { isConnected, accountsCount, isLoading, bridgeUserExists, hasAccounts, refreshStatus } =
    useBankingConnection(workspaceId);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (isConnected) return; // Ne pas permettre de reconnecter

    try {
      setIsConnecting(true);
      const response = await fetch("/api/banking-connect/bridge/connect", {
        headers: {
          "x-workspace-id": workspaceId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Rediriger vers l'URL de connexion Bridge
        window.location.href = data.connectUrl;
      } else {
        const error = await response.json();
        console.error(
          "Erreur génération URL:",
          error.error || "Impossible de générer l'URL de connexion"
        );
      }
    } catch (error) {
      console.error("Erreur connexion:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Si déjà connecté, afficher le statut approprié
  if (isConnected) {
    let statusText = "Compte connecté";
    
    if (hasAccounts && accountsCount > 0) {
      statusText = `Connecté (${accountsCount} compte${accountsCount > 1 ? "s" : ""})`;
    } else if (bridgeUserExists && !hasAccounts) {
      statusText = "Compte connecté";
    }
    
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
    <Button
      onClick={handleConnect}
      disabled={isLoading || isConnecting}
      variant="default"
      size="sm"
    >
      {(isLoading || isConnecting) && (
        <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
      )}
      <Landmark className="h-4 w-4 mr-2" />
      Connecter un compte bancaire
    </Button>
  );
}
