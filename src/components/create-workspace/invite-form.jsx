"use client";

import { UserPlus, Link2, ChevronDown } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";

export function InviteForm({ emails, setEmails, onContinue, onSkip }) {
  const updateEmail = (index, value) => {
    const updated = [...emails];
    updated[index] = value;
    setEmails(updated);
  };

  const addRow = () => {
    setEmails([...emails, ""]);
  };

  return (
    <div className="flex flex-col h-full px-20 py-6">
      <div className="flex flex-col pt-14">
        {/* Title */}
        <h1 className="text-xl font-semibold text-[#46464A] mb-2">
          Collaborez avec votre équipe
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Plus vos coéquipiers utilisent Newbi, plus il devient puissant.
        </p>

        {/* Section label */}
        <p className="text-sm text-[#46464A] mb-4">
          Invitez votre équipe à collaborer
        </p>

        {/* Email rows */}
        <div className="space-y-3 mb-4">
          {emails.map((email, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={email}
                onChange={(e) => updateEmail(index, e.target.value)}
                placeholder="exemple@email.com"
                className="flex-1"
              />
              <Button variant="outline" className="flex items-center gap-1 whitespace-nowrap">
                Membre
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>

        {/* Add more + Copy link */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="filter"
            onClick={addRow}
            className="flex items-center gap-1.5"
          >
            <UserPlus className="size-4" />
            Ajouter
          </Button>
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <Link2 className="size-4" />
            Copier le lien d&apos;invitation
          </button>
        </div>

        {/* Continue button */}
        <Button
          variant="primary"
          className="w-full"
          disabled={!emails.some((e) => e.trim())}
          onClick={onContinue}
        >
          Continuer
        </Button>

        {/* Skip */}
        <button
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors mt-4 mx-auto cursor-pointer"
        >
          Passer pour le moment
        </button>
      </div>

      {/* Legal text at bottom */}
      <div className="mt-auto pt-8 pb-4">
        <p className="text-[11px] text-muted-foreground leading-tight">
          En continuant, vous acceptez nos conditions générales d&apos;utilisation. Vous confirmez que les services Newbi sont destinés à un usage professionnel et que vous avez l&apos;autorité légale pour agir au nom de l&apos;entreprise.
        </p>
      </div>
    </div>
  );
}
