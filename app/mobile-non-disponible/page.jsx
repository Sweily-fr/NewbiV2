import Link from "next/link";
import { Monitor } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export const metadata = {
  title: "Disponible sur ordinateur — Newbi",
  robots: { index: false, follow: false },
};

export default function MobileNonDisponible() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <Monitor className="w-10 h-10 text-gray-400" />
          </div>

          <h1 className="text-2xl font-semibold text-gray-900 mb-3">
            Newbi est disponible sur ordinateur
          </h1>

          <p className="text-gray-600 text-sm leading-relaxed mb-8">
            L'application Newbi n'est pas encore optimisée pour mobile.
            Connectez-vous depuis un ordinateur pour accéder à votre espace de
            travail.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            asChild
            className="w-full h-10 bg-black hover:bg-gray-800 text-white font-medium"
          >
            <Link href="/">Retour à l'accueil</Link>
          </Button>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100">
          <p className="text-xs text-gray-600">
            Les liens de partage de fichiers restent accessibles depuis votre
            mobile.
          </p>
        </div>
      </div>
    </div>
  );
}
