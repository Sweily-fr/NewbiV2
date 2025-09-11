import React from "react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  CreditCard,
  CheckCircle,
  DollarSign,
  Shield,
  ExternalLink,
  XCircle,
} from "lucide-react";
import { useStripeConnect } from "@/src/hooks/useStripeConnect";

const StripeConnectOnboarding = ({
  isOpen,
  onClose,
  userId,
  userEmail,
  onSuccess,
}) => {
  const {
    isConnected,
    canReceivePayments,
    accountStatus,
    isLoading,
    error,
    connectStripe,
    openStripeDashboard,
    checkAndUpdateAccountStatus,
    clearError,
  } = useStripeConnect(userId);

  const handleConnect = async () => {
    if (userEmail) {
      await connectStripe(userEmail);
      if (onSuccess) {
        onSuccess();
      }
    }
  };

  const handleClose = () => {
    clearError();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg pointer-events-auto">
        <DialogHeader className="text-center pb-6">
          {/* <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#635BFF] to-[#5A54E5] rounded-2xl flex items-center justify-center mb-4">
            <CreditCard className="h-8 w-8 text-white" />
          </div> */}
          <DialogTitle className="text-xl font-semibold">
            {isConnected ? "Stripe Connect" : "Activer les paiements"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
            {isConnected
              ? "Gérez votre compte et vos paiements"
              : "Connectez Stripe pour recevoir des paiements sécurisés"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Statut du compte connecté */}
          {isConnected && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-green-100 rounded-xl">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-1">
                    Compte connecté
                  </h3>
                  <p className="text-sm text-green-700 mb-2">
                    {canReceivePayments
                      ? "✓ Prêt à recevoir des paiements"
                      : "⚠️ Configuration requise"}
                  </p>
                  {!canReceivePayments && (
                    <p className="text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-full inline-block">
                      Complétez votre profil Stripe
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200/50 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-1 bg-red-100 rounded-lg">
                  <XCircle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-red-900 text-sm">Erreur</p>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Avantages pour les nouveaux utilisateurs */}
          {!isConnected && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-[#FAFAFA] dark:bg-gray-800/50 rounded-xl">
                <div className="p-2 bg-blue-100 dark:bg-blue-800/50 rounded-lg">
                  <Shield className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Paiements sécurisés</h4>
                  <p className="text-xs text-muted-foreground">
                    Conformité PCI DSS et protection anti-fraude
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-[#FAFAFA] dark:bg-gray-800/50 rounded-xl">
                <div className="p-2 bg-green-100 dark:bg-green-800/50 rounded-lg">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">
                    Virements automatiques
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Recevez vos paiements directement sur votre compte
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-[#FAFAFA] dark:bg-gray-800/50 rounded-xl">
                <div className="p-2 bg-purple-100 dark:bg-purple-800/50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Configuration rapide</h4>
                  <p className="text-xs text-muted-foreground">
                    Processus guidé en quelques minutes
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {isConnected ? (
              <>
                <Button
                  onClick={checkAndUpdateAccountStatus}
                  variant="outline"
                  disabled={isLoading}
                  className="border-blue-200 hover:bg-blue-50 text-blue-600 transition-colors"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-2"></div>
                      Vérification...
                    </>
                  ) : (
                    "Vérifier le statut"
                  )}
                </Button>
                <Button
                  onClick={openStripeDashboard}
                  className="flex-1 bg-gradient-to-r from-[#635BFF] to-[#5A54E5] hover:from-[#5A54E5] hover:to-[#4F46E5] text-white shadow-lg shadow-[#635BFF]/25 transition-all duration-200"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {canReceivePayments
                    ? "Tableau de bord"
                    : "Finaliser la config"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Fermer
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleConnect}
                  disabled={isLoading || !userEmail}
                  className="flex-1 cursor-pointer bg-gradient-to-r from-[#635BFF] to-[#5A54E5] hover:from-[#5A54E5] hover:to-[#4F46E5] text-white shadow-lg shadow-[#635BFF]/25 disabled:opacity-50 disabled:shadow-none transition-all duration-200"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Connexion...
                    </>
                  ) : (
                    "Connecter Stripe"
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="cursor-pointer"
                  onClick={handleClose}
                >
                  Annuler
                </Button>
              </>
            )}
          </div>

          {/* Note légale */}
          {!isConnected && (
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              En continuant, vous acceptez les{" "}
              <a
                href="https://stripe.com/connect-account/legal"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#635BFF] hover:underline font-medium"
              >
                conditions de Stripe Connect
              </a>
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StripeConnectOnboarding;
