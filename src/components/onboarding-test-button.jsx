"use client"

import { useState } from "react"
import { Button } from "@/src/components/ui/button"
import { Sparkles } from "lucide-react"
import OnboardingModal from "@/src/components/onboarding-modal"

/**
 * Bouton de test pour l'onboarding - visible en développement et staging
 * Permet de tester le modal d'onboarding sans avoir à réinitialiser la base de données
 */
export default function OnboardingTestButton() {
  const [isOpen, setIsOpen] = useState(false)

  // Afficher en développement et staging uniquement
  const isDevOrStaging = process.env.NODE_ENV === "development" || 
                         process.env.NEXT_PUBLIC_ENV === "staging"

  if (!isDevOrStaging) {
    return null
  }

  const handleComplete = () => {
    console.log("✅ Onboarding test complété")
    setIsOpen(false)
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="shadow-lg gap-2"
          size="lg"
        >
          <Sparkles className="w-5 h-5" />
          Tester Onboarding
        </Button>
      </div>

      <OnboardingModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onComplete={handleComplete}
      />
    </>
  )
}
