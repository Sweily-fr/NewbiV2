"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "@/src/components/ui/sonner";

export function PasswordModal({ transferId, onPasswordVerified }) {
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyPassword = async () => {
    if (!passwordInput.trim()) {
      toast.error("Veuillez entrer un mot de passe");
      return;
    }

    setIsVerifying(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${apiUrl}/api/transfers/verify-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transferId,
          password: passwordInput,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Accès autorisé");
        onPasswordVerified();
      } else {
        toast.error("Mot de passe incorrect");
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du mot de passe:", error);
      toast.error("Erreur lors de la vérification");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Fond flou */}
      <div className="absolute inset-0 backdrop-blur-sm bg-black/40" />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          {/* Icône */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-[#5b4fff]/10 rounded-full flex items-center justify-center">
              <Lock className="w-5 h-5 text-[#5b4fff]" />
            </div>
          </div>

          {/* Titre */}
          <h2 className="text-lg font-medium text-center text-gray-900 mb-2">
            Transfert protégé
          </h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            Entrez le mot de passe pour accéder aux fichiers
          </p>

          {/* Input */}
          <div className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Mot de passe"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    verifyPassword();
                  }
                }}
                // className="pr-10 h-11 bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-[#5b4fff]/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Button
              onClick={verifyPassword}
              disabled={isVerifying}
              className="w-full bg-[#5b4fff] hover:bg-[#5b4fff]/90 font-medium"
            >
              {isVerifying ? "Vérification..." : "Accéder"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
