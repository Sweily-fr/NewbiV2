import { Info } from "lucide-react";

export function PermissionWarning() {
  return (
    <div className="flex align-item gap-3 mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
      <Info className="h-4 w-4 text-amber-800" />
      <p className="text-xs text-amber-800 dark:text-amber-200">
        Vous n'avez pas la permission de modifier les paramètres de
        l'organisation. Seuls les <span className="font-medium">owners</span> et{" "}
        <span className="font-medium">admins</span> peuvent effectuer ces
        modifications.
      </p>
    </div>
  );
}
