'use client'

import { useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/src/components/ui/button'

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="container mx-auto flex h-[calc(100vh-200px)] flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur de chargement du tableau</AlertTitle>
          <AlertDescription>
            {error.message || "Une erreur est survenue lors du chargement du tableau. Veuillez réessayer."}
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => reset()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </Button>
          <Button asChild variant="ghost">
            <a href="/dashboard/outils/kanban">
              Retour aux tableaux
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
