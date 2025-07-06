/**
 * Composant indicateur d'étapes pour le processus de création de signature
 */

import React from 'react';
import { Check } from 'lucide-react';
import { useSignature } from '@/src/contexts/SignatureContext';

const steps = [
  { id: 1, title: 'Informations personnelles', description: 'Nom, prénom, poste' },
  { id: 2, title: 'Entreprise', description: 'Logo, adresse, site web' },
  { id: 3, title: 'Réseaux sociaux', description: 'LinkedIn, Facebook, etc.' },
  { id: 4, title: 'Apparence', description: 'Couleurs, police, mise en page' },
];

export function StepIndicator() {
  const { currentStep, setCurrentStep } = useSignature();

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            {/* Cercle de l'étape */}
            <div className="relative flex items-center">
              <button
                onClick={() => setCurrentStep(step.id)}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200
                  ${currentStep === step.id 
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100' 
                    : currentStep > step.id
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }
                `}
              >
                {currentStep > step.id ? (
                  <Check className="w-5 h-5" />
                ) : (
                  step.id
                )}
              </button>
              
              {/* Texte de l'étape */}
              <div className="absolute top-12 left-1/2 transform -translate-x-1/2 text-center min-w-max">
                <div className={`text-sm font-medium ${
                  currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {step.title}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {step.description}
                </div>
              </div>
            </div>

            {/* Ligne de connexion */}
            {index < steps.length - 1 && (
              <div className={`
                flex-1 h-0.5 mx-4 transition-all duration-300
                ${currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'}
              `} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
