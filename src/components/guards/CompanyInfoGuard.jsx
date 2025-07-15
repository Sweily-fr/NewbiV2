"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/src/lib/auth-client";
import { isCompanyInfoComplete } from "@/src/hooks/useCompanyInfoGuard";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
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
  description = "Nous vérifions que vos informations d'entreprise sont complètes..."
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showAlert, setShowAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [companyComplete, setCompanyComplete] = useState(false);

  useEffect(() => {
    console.log('🔐 CompanyInfoGuard - État de session:', {
      status,
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      timestamp: new Date().toISOString()
    });

    if (status === "loading") {
      console.log('⏳ CompanyInfoGuard: Session en cours de chargement...');
      setIsLoading(true);
      return;
    }

    // Si pas de session après le chargement, rediriger vers login
    if (status === "unauthenticated" || !session?.user) {
      console.warn('CompanyInfoGuard: Session non authentifiée, redirection vers login');
      router.push("/auth/login");
      return;
    }

    // Si la session est authentifiée mais pas encore complètement chargée
    if (status === "authenticated" && !session.user) {
      console.warn('CompanyInfoGuard: Session authentifiée mais utilisateur non chargé, attente...');
      setIsLoading(true);
      return;
    }

    const company = session.user.company;
    const isComplete = isCompanyInfoComplete(company);
    
    console.log('🏢 Vérification informations entreprise:', {
      hasCompany: !!company,
      name: company?.name,
      email: company?.email,
      address: company?.address,
      isComplete
    });

    setCompanyComplete(isComplete);
    setIsLoading(false);

    if (!isComplete) {
      setShowAlert(true);
    }
  }, [session, status, router]);

  const handleGoToSettings = () => {
    setShowAlert(false);
    router.push(redirectPath);
  };

  const handleCancel = () => {
    setShowAlert(false);
    router.push("/dashboard/outils"); // Rediriger vers la page des outils
  };

  if (isLoading) {
    return loadingComponent || (
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
              Pour utiliser les outils de facturation et de devis, vous devez d'abord compléter les informations de votre entreprise.
            </AlertDialogDescription>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-900 mb-2">Informations requises :</p>
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

      {/* Si les informations sont complètes, afficher le contenu protégé */}
      {companyComplete && children}
    </>
  );
}
