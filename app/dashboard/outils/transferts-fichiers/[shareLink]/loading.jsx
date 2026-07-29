import { LoaderCircle } from "lucide-react";

// La page de consultation d'un transfert charge ses données en network-only
// (lien signé) : on affiche le même spinner centré que la page elle-même,
// au lieu d'hériter du skeleton de la LISTE des transferts.
export default function TransferDetailLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
