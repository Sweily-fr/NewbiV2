"use client"

import { useState, useEffect } from "react"
import { ArrowRightIcon, Building2, Package, ShoppingCart, Users, Wrench, Sparkles } from "lucide-react"
import { cn } from "@/src/lib/utils"
import { Button } from "@/src/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog"

const onboardingSteps = [
  {
    id: 1,
    title: "Bienvenue sur Newbi",
    description: "Découvrez la plateforme de gestion d'entreprise qui simplifie votre quotidien. Newbi vous accompagne dans la gestion de vos factures, devis, clients et bien plus encore.",
    icon: Sparkles,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  {
    id: 2,
    title: "Paramètres entreprise",
    description: "Configurez les informations de votre entreprise : nom, adresse, SIRET, coordonnées bancaires. Ces données seront utilisées automatiquement dans vos documents.",
    icon: Building2,
    color: "text-green-500",
    bgColor: "bg-green-50",
  },
  {
    id: 3,
    title: "Catalogue",
    description: "Créez votre catalogue de produits et services. Définissez vos prix, descriptions et catégories pour gagner du temps lors de la création de devis et factures.",
    icon: Package,
    color: "text-purple-500",
    bgColor: "bg-purple-50",
  },
  {
    id: 4,
    title: "Produits",
    description: "Gérez facilement vos produits et services. Organisez votre offre commerciale et suivez vos performances pour optimiser votre activité.",
    icon: ShoppingCart,
    color: "text-orange-500",
    bgColor: "bg-orange-50",
  },
  {
    id: 5,
    title: "Communauté",
    description: "Rejoignez la communauté Newbi ! Échangez avec d'autres entrepreneurs, partagez vos expériences et bénéficiez de conseils d'experts.",
    icon: Users,
    color: "text-pink-500",
    bgColor: "bg-pink-50",
  },
  {
    id: 6,
    title: "Les outils",
    description: "Explorez tous les outils disponibles : factures, devis, gestion clients, signatures de mail, et bien plus. Tout ce dont vous avez besoin pour votre entreprise.",
    icon: Wrench,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50",
  },
]

export default function OnboardingModal({ isOpen, onClose, onComplete }) {
  const [step, setStep] = useState(1)
  const totalSteps = onboardingSteps.length
  const currentStep = onboardingSteps.find(s => s.id === step)

  const handleContinue = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      // Dernière étape - terminer l'onboarding
      onComplete()
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  // Reset step when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1)
    }
  }, [isOpen])

  if (!currentStep) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="gap-0 p-0 max-w-3xl w-[95vw] sm:w-[90vw] md:w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto [&>button:last-child]:text-white">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 md:pt-8 pb-3 sm:pb-4 md:pb-6 border-b">
          <div className="space-y-2 sm:space-y-3">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-xl sm:text-2xl md:text-3xl">🚀</span>
              Bienvenue sur Newbi
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed">
              La plateforme tout-en-un pour gérer votre entreprise simplement. 
              Factures, devis, clients, paiements... Tout ce dont vous avez besoin pour développer votre activité.
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-4 sm:space-y-5 md:space-y-6 px-4 sm:px-6 md:px-8 pt-4 sm:pt-5 md:pt-6 pb-4 sm:pb-5 md:pb-6">
          <DialogHeader className="text-center">
            <DialogTitle className="text-base sm:text-lg md:text-xl font-semibold">
              {currentStep.title}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm md:text-base leading-relaxed mt-2">
              {currentStep.description}
            </DialogDescription>
          </DialogHeader>

          {/* Progress Dots - Mobile/Tablet centered */}
          <div className="flex justify-center space-x-2 py-2 md:hidden">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  index + 1 === step 
                    ? "bg-primary scale-125" 
                    : index + 1 < step 
                      ? "bg-primary opacity-60" 
                      : "bg-gray-300"
                )}
              />
            ))}
          </div>

          {/* Desktop Layout: Progress Dots left, Buttons right */}
          <div className="hidden md:flex justify-between items-center gap-4">
            {/* Progress Dots - Desktop left */}
            <div className="flex space-x-2">
              {onboardingSteps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-200",
                    index + 1 === step 
                      ? "bg-primary scale-125" 
                      : index + 1 < step 
                        ? "bg-primary opacity-60" 
                        : "bg-gray-300"
                  )}
                />
              ))}
            </div>

            {/* Action Buttons - Desktop right */}
            <div className="flex items-center gap-3">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={handleSkip}
                className="text-gray-500 hover:text-gray-700"
              >
                Passer
              </Button>
              
              <Button
                className="group min-w-[120px]"
                type="button"
                onClick={handleContinue}
              >
                {step < totalSteps ? (
                  <>
                    Suivant
                    <ArrowRightIcon
                      className="-me-1 ml-1 opacity-60 transition-transform group-hover:translate-x-0.5"
                      size={16}
                      aria-hidden="true"
                    />
                  </>
                ) : (
                  "Commencer"
                )}
              </Button>
            </div>
          </div>

          {/* Mobile/Tablet Buttons */}
          <div className="flex flex-col-reverse gap-2 md:hidden">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={handleSkip}
              className="w-full text-gray-500 hover:text-gray-700"
            >
              Passer
            </Button>
            
            <Button
              className="group w-full"
              type="button"
              onClick={handleContinue}
            >
              {step < totalSteps ? (
                <>
                  Suivant
                  <ArrowRightIcon
                    className="-me-1 ml-1 opacity-60 transition-transform group-hover:translate-x-0.5"
                    size={16}
                    aria-hidden="true"
                  />
                </>
              ) : (
                "Commencer"
              )}
            </Button>
          </div>

          {/* Step Counter */}
          <div className="text-center text-xs sm:text-sm text-gray-500 pt-1">
            Étape {step} sur {totalSteps}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
