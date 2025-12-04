"use client";

import { Button } from "@/src/components/ui/button";
import { CreditCard, Shield, Lock, CheckCircle } from "lucide-react";

export function PaymentModal({ amount, currency, onPay, isProcessing }) {
  // Calcul de la commission Stripe (environ 2.9% + 0.30€)
  const stripeCommission = (amount * 0.029 + 0.3).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Fond flou */}
      <div className="absolute inset-0 backdrop-blur-sm bg-black/40" />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          {/* Icône */}
          {/* <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-[#5a50ff]/10 rounded-full flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[#5a50ff]" />
            </div>
          </div> */}

          {/* Titre */}
          <h2 className="text-xl font-medium text-center text-gray-900 mb-2">
            Paiement requis
          </h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            Pour accéder aux fichiers de ce transfert
          </p>

          {/* Montant */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">Montant</span>
              <span className="text-2xl font-semibold text-gray-900">
                {amount} {currency}
              </span>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Frais de transaction inclus</span>
                <span>{stripeCommission} €</span>
              </div>
            </div>
          </div>

          {/* Sécurité */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-normal text-gray-800">
                  Paiement sécurisé
                </p>
                <p className="text-xs text-gray-500">Chiffrement SSL 256-bit</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center flex-shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-normal text-gray-800">
                  Stripe Connect
                </p>
                <p className="text-xs text-gray-500">
                  Paiement traité par Stripe
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-normal text-gray-800">
                  Accès immédiat
                </p>
                <p className="text-xs text-gray-500">
                  Téléchargement après paiement
                </p>
              </div>
            </div>
          </div>

          {/* Bouton */}
          <Button
            onClick={onPay}
            disabled={isProcessing}
            className="w-full bg-[#5a50ff] hover:bg-[#5a50ff]/90 font-normal"
          >
            {isProcessing ? "Redirection..." : `Payer ${amount} ${currency}`}
          </Button>

          {/* Footer */}
          <p className="text-xs text-gray-400 text-center mt-4">
            En cliquant sur Payer, vous serez redirigé vers Stripe
          </p>
        </div>
      </div>
    </div>
  );
}
