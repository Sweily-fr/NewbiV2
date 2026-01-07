"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { ProSubscriptionOverlay } from "@/src/components/pro-subscription-overlay";
import { BankSyncOverlay } from "@/src/components/bank-sync-overlay";
import { Play, RotateCcw, Landmark } from "lucide-react";

export default function TestAnimationPro() {
  const [showOverlay, setShowOverlay] = useState(false);
  const [showBankSync, setShowBankSync] = useState(false);
  const [animationCount, setAnimationCount] = useState(0);

  const handleTriggerAnimation = () => {
    setShowOverlay(true);
    setAnimationCount((prev) => prev + 1);
  };

  const handleTriggerBankSync = () => {
    setShowBankSync(true);
    setAnimationCount((prev) => prev + 1);

    // Simuler la durée de la synchronisation (3 secondes)
    setTimeout(() => {
      setShowBankSync(false);
      console.log("✅ Synchronisation bancaire terminée");
    }, 3000);
  };

  const handleAnimationComplete = () => {
    setShowOverlay(false);
    console.log("✅ Animation Pro terminée");
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Contenu de test simulant le dashboard */}
      <div className="p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Test Animation Pro
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Page de test pour l'animation de confirmation d'abonnement Pro
            </p>
          </div>

          {/* Contrôles */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Contrôles
            </h2>

            <div className="flex flex-wrap gap-4">
              <Button
                onClick={handleTriggerAnimation}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Animation Pro
              </Button>

              <Button
                onClick={handleTriggerBankSync}
                className="bg-[#5a50ff] hover:bg-[#4a3ecc]"
              >
                <Landmark className="w-4 h-4 mr-2" />
                Sync Bancaire
              </Button>

              <Button variant="outline" onClick={() => setAnimationCount(0)}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Réinitialiser
              </Button>
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400">
              Nombre d'animations jouées :{" "}
              <span className="font-mono font-bold">{animationCount}</span>
            </div>
          </div>

          {/* Simulation du contenu dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Carte 1 - Solde
              </h3>
              <div className="text-3xl font-bold text-green-600">
                12 450,00 €
              </div>
              <p className="text-sm text-gray-500 mt-2">Solde actuel</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Carte 2 - Transactions
              </h3>
              <div className="text-3xl font-bold text-blue-600">47</div>
              <p className="text-sm text-gray-500 mt-2">Ce mois-ci</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Carte 3 - Factures
              </h3>
              <div className="text-3xl font-bold text-purple-600">8</div>
              <p className="text-sm text-gray-500 mt-2">En attente</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Carte 4 - Revenus
              </h3>
              <div className="text-3xl font-bold text-amber-600">+15,3%</div>
              <p className="text-sm text-gray-500 mt-2">vs mois dernier</p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
              📋 Instructions de test
            </h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li>
                • <strong>Animation Pro</strong> : Checkmark animé avec cercle
                dégradé (~3s)
              </li>
              <li>
                • <strong>Sync Bancaire</strong> : Loader circulaire avec
                message de synchronisation
              </li>
              <li>
                • Les overlays se ferment automatiquement avec un fade out
              </li>
              <li>• Le contenu du dashboard reste visible en arrière-plan</li>
              <li>• Testez plusieurs fois pour vérifier la fluidité</li>
            </ul>
          </div>

          {/* Comportement attendu */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-3">
              🎯 Comportement attendu en production
            </h3>
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                  Animation Pro :
                </p>
                <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-200 ml-4">
                  <li>
                    • Après paiement Stripe → /dashboard?payment_success=true
                  </li>
                  <li>• Animation checkmark (~3s) → fade out</li>
                  <li>• Le PricingModal n'est PAS déclenché</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                  Sync Bancaire :
                </p>
                <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-200 ml-4">
                  <li>• Après connexion Bridge → /dashboard?item_id=xxx</li>
                  <li>• Loader circulaire pendant la sync des transactions</li>
                  <li>• Fermeture automatique après sync complète</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlays d'animation */}
      <ProSubscriptionOverlay
        isVisible={showOverlay}
        onComplete={handleAnimationComplete}
      />

      <BankSyncOverlay isVisible={showBankSync} />
    </div>
  );
}
