import Link from 'next/link'
import { Button } from '@/src/components/ui/button'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="container mx-auto flex h-[calc(100vh-200px)] flex-col items-center justify-center p-4 text-center">
      <div className="space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
          <AlertCircle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
        </div>
        
        <h1 className="text-4xl font-bold tracking-tight">Tâche non trouvée</h1>
        
        <p className="text-muted-foreground max-w-md">
          La tâche que vous recherchez n'existe pas ou a été déplacée.
        </p>
        
        <div className="pt-4 flex justify-center gap-4">
          <Button asChild>
            <Link href="/dashboard/outils/kanban" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour aux tableaux
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/outils/kanban" className="gap-2">
              Voir toutes les tâches
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
