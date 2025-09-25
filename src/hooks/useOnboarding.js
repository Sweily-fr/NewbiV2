import { useState, useEffect } from 'react'
import { useSession } from '@/src/lib/auth-client'
import { updateOrganization } from '@/src/lib/organization-client'
import { toast } from 'sonner'

export function useOnboarding() {
  const { data: session } = useSession()
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Vérifier si l'onboarding doit être affiché
  useEffect(() => {
    if (session?.user?.organization) {
      const organization = session.user.organization
      const isOwner = session.user.role === 'owner'
      const hasCompletedOnboarding = organization.hasCompletedOnboarding
      
      // Afficher l'onboarding si :
      // - L'utilisateur est owner de l'organisation
      // - L'onboarding n'a pas été complété
      if (isOwner && !hasCompletedOnboarding) {
        setIsOnboardingOpen(true)
      }
    }
  }, [session])

  const completeOnboarding = async () => {
    if (!session?.user?.organization?.id) {
      toast.error("Erreur lors de la finalisation de l'onboarding")
      return
    }

    setIsLoading(true)
    
    try {
      await updateOrganization(session.user.organization.id, {
        hasCompletedOnboarding: true,
        onboardingStep: 6, // Dernière étape
      })

      setIsOnboardingOpen(false)
      toast.success("Bienvenue sur Newbi ! 🎉")
      
      // Optionnel : recharger la session pour mettre à jour les données
      window.location.reload()
      
    } catch (error) {
      console.error('Erreur lors de la finalisation de l\'onboarding:', error)
      toast.error("Erreur lors de la finalisation de l'onboarding")
    } finally {
      setIsLoading(false)
    }
  }

  const skipOnboarding = async () => {
    await completeOnboarding()
  }

  return {
    isOnboardingOpen,
    setIsOnboardingOpen,
    completeOnboarding,
    skipOnboarding,
    isLoading,
    shouldShowOnboarding: session?.user?.role === 'owner' && !session?.user?.organization?.hasCompletedOnboarding,
  }
}
