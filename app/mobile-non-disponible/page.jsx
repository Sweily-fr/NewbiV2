import Link from "next/link";
import { Monitor } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export const metadata = {
  title: "Disponible sur ordinateur — Newbi",
  robots: { index: false, follow: false },
};

function AppleLogo({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  );
}

function AndroidLogo({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4483-.9993.9993-.9993c.5511 0 .9993.4483.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4483.9993.9993 0 .5511-.4483.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 0 0-.1521-.5676.416.416 0 0 0-.5676.1521l-2.0223 3.503C15.5902 8.2439 13.8533 7.8508 12 7.8508s-3.5902.3931-5.1367 1.0989L4.841 5.4467a.4161.4161 0 0 0-.5677-.1521.4157.4157 0 0 0-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3435-4.1021-2.6892-7.5743-6.1185-9.4396" />
    </svg>
  );
}

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
            Connectez-vous depuis un ordinateur pour accéder à votre espace de
            travail.
          </p>
        </div>

        {/* Application mobile à venir */}
        <div className="mb-8 rounded-xl border border-gray-100 bg-gray-50 px-6 py-5">
          <p className="text-sm font-medium text-gray-900 mb-4">
            L'application mobile arrive bientôt
          </p>
          <div className="flex items-center justify-center gap-8">
            <div className="flex items-center gap-2 text-gray-500">
              <AppleLogo className="w-5 h-5" />
              <span className="text-sm">iOS</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <AndroidLogo className="w-5 h-5" />
              <span className="text-sm">Android</span>
            </div>
          </div>
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
