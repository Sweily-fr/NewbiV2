import { CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Paiement reçu",
};

export default function InvoicePaymentSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="mb-2 text-xl font-semibold text-gray-900">
          Paiement reçu
        </h1>
        <p className="text-sm text-gray-500">
          Merci, votre paiement a bien été enregistré. Un reçu vous sera envoyé
          par votre prestataire.
        </p>
      </div>
    </div>
  );
}
