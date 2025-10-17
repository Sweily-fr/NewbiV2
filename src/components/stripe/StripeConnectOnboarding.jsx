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
  CheckCircle2,
  DollarSign,
  Shield,
  ExternalLink,
  AlertCircle,
  LoaderCircle,
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

  // Vérifier automatiquement le statut à l'ouverture du dialog si connecté
  React.useEffect(() => {
    if (isOpen && isConnected && !canReceivePayments) {
      console.log(
        "🔄 Vérification automatique du statut à l'ouverture du dialog..."
      );
      checkAndUpdateAccountStatus();
    }
  }, [isOpen, isConnected, canReceivePayments, checkAndUpdateAccountStatus]);

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
      <DialogContent className="sm:max-w-[480px] pointer-events-auto p-0 gap-0 border-0">
        {/* Header épuré */}
        <DialogHeader className="px-6 pt-6 pb-4 space-y-2">
          <DialogTitle className="text-lg font-medium tracking-tight">
            {isConnected ? "Compte Stripe" : "Activer les paiements"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground font-normal">
            {isConnected
              ? "Gérez votre compte et vos paiements"
              : "Recevez des paiements sécurisés via Stripe"}
          </DialogDescription>
        </DialogHeader>

        {/* Contenu */}
        <div className="px-6 pb-6 space-y-4">
          {/* Statut connecté - Style Notion */}
          {isConnected && (
            <div
              className={`rounded-lg border p-3 ${
                canReceivePayments
                  ? "bg-green-50/50 dark:bg-green-950/20 border-green-200/50 dark:border-green-800/50"
                  : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/50"
              }`}
            >
              <div className="flex items-start gap-3">
                {canReceivePayments ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <LoaderCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0 animate-spin" />
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      canReceivePayments
                        ? "text-green-900 dark:text-green-100"
                        : "text-amber-900 dark:text-amber-100"
                    }`}
                  >
                    {canReceivePayments
                      ? "Prêt à recevoir des paiements"
                      : isLoading
                        ? "Vérification en cours..."
                        : "Configuration incomplète"}
                  </p>
                  {!canReceivePayments && !isLoading && (
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      Complétez votre profil Stripe pour activer les paiements
                    </p>
                  )}
                  {!canReceivePayments && isLoading && (
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      Synchronisation avec Stripe...
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Erreur - Style Notion */}
          {error && (
            <div className="rounded-lg border bg-red-50/50 dark:bg-red-950/20 border-red-200/50 dark:border-red-800/50 p-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-red-900 dark:text-red-100">
                    Une erreur est survenue
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Avantages - Style Notion minimaliste */}
          {!isConnected && (
            <div className="space-y-2">
              <div className="flex items-start gap-3 py-2">
                <Shield className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Paiements sécurisés</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Conformité PCI DSS et protection anti-fraude
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 py-2">
                <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Virements automatiques</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Recevez vos paiements directement sur votre compte
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 py-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Configuration rapide</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Processus guidé en quelques minutes
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions - Style Notion */}
          <div className="flex items-center gap-2 pt-2">
            {isConnected ? (
              <>
                <Button
                  onClick={openStripeDashboard}
                  size="sm"
                  className="flex-1 h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-normal"
                >
                  {canReceivePayments ? (
                    <>
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      Tableau de bord
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      Finaliser la configuration
                    </>
                  )}
                </Button>
                <Button
                  onClick={checkAndUpdateAccountStatus}
                  variant="ghost"
                  size="sm"
                  disabled={isLoading}
                  className="h-9 font-normal"
                >
                  {isLoading ? (
                    <>
                      <LoaderCircle className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Vérification
                    </>
                  ) : (
                    "Vérifier"
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleConnect}
                  disabled={isLoading || !userEmail}
                  size="sm"
                  className="flex-1 cursor-pointer h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-normal"
                >
                  {isLoading ? (
                    <>
                      <LoaderCircle className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Connexion
                    </>
                  ) : (
                    "Connecter Stripe"
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-9 font-normal"
                >
                  Annuler
                </Button>
              </>
            )}
          </div>

          {/* Note légale - Style Notion */}
          {!isConnected && (
            <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
              En continuant, vous acceptez les{" "}
              <a
                href="https://stripe.com/connect-account/legal"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/60 hover:text-foreground underline underline-offset-2 transition-colors"
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
