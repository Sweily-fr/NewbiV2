"use client";

import { Button } from "@/src/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function CompletionStep({ formData, onComplete, onBack }) {
  const hasName = formData.name && formData.lastName;
  const userName = hasName ? `${formData.name}` : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-medium text-foreground">
          Tout est prêt{userName ? `, ${userName}` : ""} ! 🎉
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Votre espace Newbi est configuré. Vous pouvez maintenant accéder à
          tous vos outils.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
          <span className="text-sm">
            Créez vos factures et devis en quelques clics
          </span>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
          <span className="text-sm">Suivez votre trésorerie en temps réel</span>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
          <span className="text-sm">Gérez vos projets avec le Kanban</span>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
          <span className="text-sm">
            Transférez des fichiers en toute sécurité
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={onBack}>
          Retour
        </Button>
        <Button onClick={onComplete}>Accéder à mon espace</Button>
      </div>
    </div>
  );
}
