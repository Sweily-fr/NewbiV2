import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="container mx-auto flex h-[calc(100vh-200px)] flex-col items-center justify-center p-4 text-center">
      <div className="space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        
        <h1 className="text-4xl font-bold tracking-tight">Tableau non trouvé</h1>
        
        <p className="text-muted-foreground max-w-md">
          Le tableau que vous recherchez n'existe pas ou a été supprimé.
        </p>
        
        <div className="pt-4">
          <Button asChild>
            <Link href="/dashboard/outils/kanban" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour aux tableaux
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
