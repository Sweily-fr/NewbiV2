"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/src/components/ui/dialog';
import { Landmark, Loader2, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { useBridge } from '@/src/hooks/useBridge';
import { toast } from 'sonner';

/**
 * Composant pour connecter un compte bancaire via Bridge
 */
export const BridgeConnectButton = ({ 
  variant = "default", 
  size = "sm",
  className = "",
  children,
  onSuccess,
  onError 
}) => {
  const [showDialog, setShowDialog] = useState(false);
  const [bridgeScriptLoaded, setBridgeScriptLoaded] = useState(false);
  
  const {
    bridgeUserId,
    isConnected,
    loading,
    isConnecting,
    isDisconnecting,
    error,
    createBridgeUser,
    disconnectBridge,
    initializeBridgeConnection,
  } = useBridge();

  // Bridge API ne nécessite pas de script CDN, utilisation directe de l'API REST
  useEffect(() => {
    setBridgeScriptLoaded(true);
  }, []);

  /**
   * Gère le clic sur le bouton de connexion
   */
  const handleConnect = async () => {
    try {
      // Vérifier que Bridge est disponible
      if (!bridgeScriptLoaded) {
        toast.error('Le widget Bridge n\'est pas encore chargé, veuillez réessayer');
        return;
      }

      // Afficher la boîte de dialogue de préparation
      setShowDialog(true);

      // Créer ou récupérer l'utilisateur Bridge
      const bridgeId = await createBridgeUser();
      
      if (!bridgeId) {
        setShowDialog(false);
        return;
      }

      // Fermer la boîte de dialogue et initialiser la connexion Bridge
      setShowDialog(false);
      
      // Petit délai pour une transition fluide
      setTimeout(async () => {
        await initializeBridgeConnection(
          {
            context: 'connect_bank_account',
            capabilities: ['aggregation'],
            types_de_comptes: ['paiement']
          },
          (data) => {
            console.log('✅ Session Bridge créée:', data);
            if (onSuccess) onSuccess(data);
          },
          (error) => {
            console.error('❌ Erreur session Bridge:', error);
            if (onError) onError(error);
          }
        );
      }, 300);

    } catch (error) {
      console.error('❌ Erreur lors de la connexion:', error);
      toast.error('Erreur lors de la connexion bancaire');
      setShowDialog(false);
    }
  };

  /**
   * Gère la déconnexion
   */
  const handleDisconnect = async () => {
    const success = await disconnectBridge();
    if (success && onSuccess) {
      onSuccess({ type: 'disconnect' });
    }
  };

  // Affichage du bouton selon l'état de connexion
  if (isConnected) {
    return (
      <Button
        variant="outline"
        size={size}
        className={className}
        disabled={true} // Désactivé - pas de déconnexion depuis le dashboard
      >
        <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
        Compte connecté
      </Button>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleConnect}
        disabled={loading || isConnecting || !bridgeScriptLoaded}
      >
        {loading || isConnecting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Landmark className="mr-2 h-4 w-4" />
        )}
        {children || "Connecter un compte bancaire"}
      </Button>

      {/* Dialog de préparation */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Connexion sécurisée avec Bridge
            </DialogTitle>
            <DialogDescription className="space-y-3">
              <p>
                Nous utilisons Bridge, une solution certifiée et sécurisée, 
                pour connecter votre compte bancaire.
              </p>
              
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Connexion chiffrée et sécurisée</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Vos identifiants ne sont jamais stockés</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Conforme aux réglementations bancaires</span>
              </div>
              
              {isConnecting && (
                <div className="flex items-center gap-2 text-sm text-blue-600 mt-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Préparation de la connexion...</span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Affichage des erreurs */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 mt-2">
          <AlertCircle className="h-4 w-4" />
          <span>Erreur de connexion Bridge</span>
        </div>
      )}
    </>
  );
};

export default BridgeConnectButton;
