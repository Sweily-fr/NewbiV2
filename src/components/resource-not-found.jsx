"use client";

import { AlertCircle, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { useRouter } from "next/navigation";

/**
 * Composant pour afficher un message quand une ressource n'existe pas
 * (typiquement après un changement d'organisation)
 */
export function ResourceNotFound({
  resourceType = "ressource",
  resourceName = "cette ressource",
  listUrl,
  homeUrl = "/dashboard/outils",
  message,
}) {
  const router = useRouter();

  const defaultMessage = `${resourceName} n'existe pas ou n'est pas accessible dans cette organisation.`;

  return (
    <div className="flex items-center justify-center min-h-[90vh] p-6">
      <Card className="max-w-lg w-full shadow-none border-none bg-transparent">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-[#5a50ff]/10 dark:bg-[#5a50ff]/10 p-4">
              <AlertCircle className="h-6 w-6 text-[#5a50ff]/600" />
            </div>
          </div>
          <CardTitle className="text-xl">{resourceName} introuvable</CardTitle>
          <CardDescription className="text-sm mt-2">
            {message || defaultMessage}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>💡 Astuce :</strong> Vous avez peut-être changé
              d'organisation. Les données sont isolées par organisation pour
              votre sécurité.
            </p>
          </div> */}

          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium">Que faire ?</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Vérifiez que vous êtes dans la bonne organisation</li>
              <li>
                Retournez à la liste pour voir les {resourceType}s disponibles
              </li>
              <li>Créez un nouveau {resourceType} si nécessaire</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          {listUrl && (
            <Button
              className="w-full cursor-pointer"
              onClick={() => router.push(listUrl)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la liste des {resourceType}
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full cursor-pointer"
            onClick={() => router.push(homeUrl)}
          >
            <Home className="mr-2 h-4 w-4" />
            Retour aux outils
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
