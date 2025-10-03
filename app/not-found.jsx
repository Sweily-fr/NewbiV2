"use client";

import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { ArrowLeft, Home, Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Illustration minimaliste */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          
          {/* Titre principal */}
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">
            Page introuvable
          </h1>
          
          {/* Description */}
          <p className="text-gray-600 text-sm leading-relaxed mb-8">
            La page que vous recherchez n'existe pas ou a été déplacée. 
            Vérifiez l'URL ou retournez à l'accueil.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {/* Bouton principal - Retour à l'accueil */}
          <Button 
            asChild
            className="w-full h-10 bg-black hover:bg-gray-800 text-white font-medium"
          >
            <Link href="/dashboard">
              <Home className="w-4 h-4 mr-2" />
              Retour au tableau de bord
            </Link>
          </Button>

          {/* Bouton secondaire - Retour en arrière */}
          <Button 
            variant="ghost"
            onClick={() => router.back()}
            className="w-full h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour en arrière
          </Button>
        </div>

        {/* Code d'erreur discret */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <p className="text-xs text-gray-400 font-mono">
            Erreur 404
          </p>
        </div>
      </div>
    </div>
  );
}
