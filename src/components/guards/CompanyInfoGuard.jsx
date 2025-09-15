"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/hooks/useAuth";
import { isCompanyInfoComplete } from "@/src/hooks/useCompanyInfoGuard";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { Building2, AlertCircle, Settings } from "lucide-react";

/**
 * Composant de protection qui vérifie si les informations d'entreprise sont complètes
 * avant d'autoriser l'accès aux fonctionnalités de facturation/devis
 */
export function CompanyInfoGuard({
  children,
  redirectPath = "/dashboard/settings",
  loadingComponent = null,
  title = "Vérification des informations d'entreprise",
  description = "Nous vérifions que vos informations d'entreprise sont complètes...",
}) {
  const { isAuthenticated, isLoading: authLoading, user, session } = useAuth();
  const router = useRouter();
  const [showAlert, setShowAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [companyComplete, setCompanyComplete] = useState(false);

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }

    // Si pas authentifié, on peut soit rediriger soit permettre l'accès limité
    if (!isAuthenticated) {
      console.warn("⚠️ CompanyInfoGuard: Utilisateur non authentifié");
      // Pour l'instant, on permet l'accès pour diagnostiquer
      setIsLoading(false);
      return;
    }

    const company = user?.company;
    const isComplete = isCompanyInfoComplete(company);

    setCompanyComplete(isComplete);
    setIsLoading(false);

    if (!isComplete) {
      setShowAlert(true);
    }
  }, [isAuthenticated, authLoading, user]);

  const handleGoToSettings = () => {
    setShowAlert(false);
    router.push(redirectPath);
  };

  const handleCancel = () => {
    setShowAlert(false);
    // Ne pas rediriger, rester sur la page courante
  };

  if (isLoading) {
    return (
      loadingComponent || (
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          </div>
        </div>
      )
    );
  }

  return (
    <>
      {/* Alerte dialog pour informations d'entreprise manquantes */}
      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div>
                <AlertDialogTitle>Configuration requise</AlertDialogTitle>
              </div>
            </div>
            <AlertDialogDescription className="mt-4">
              Pour utiliser les outils de facturation et de devis, vous devez
              d'abord compléter les informations de votre entreprise.
            </AlertDialogDescription>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-900 mb-2">
                Informations requises :
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>Nom de l'entreprise</li>
                <li>Email de contact</li>
                <li>Adresse complète (rue, ville, code postal, pays)</li>
              </ul>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleGoToSettings}>
              <Settings className="mr-2 h-4 w-4" />
              Configurer maintenant
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Afficher le contenu dans tous les cas, l'alerte informe juste l'utilisateur */}
      {children}
    </>
  );
}
