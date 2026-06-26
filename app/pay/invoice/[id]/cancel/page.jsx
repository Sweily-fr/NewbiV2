import { XCircle } from "lucide-react";

export const metadata = {
  title: "Paiement annulé",
};

export default async function InvoicePaymentCancelPage({ params }) {
  const { id } = await params;
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/").replace(
    /\/$/,
    "",
  );
  const retryUrl = `${apiBase}/pay/invoice/${id}`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <XCircle className="h-8 w-8 text-amber-600" />
        </div>
        <h1 className="mb-2 text-xl font-semibold text-gray-900">
          Paiement annulé
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          Votre paiement n'a pas été finalisé. Vous pouvez réessayer à tout
          moment.
        </p>
        <a
          href={retryUrl}
          className="inline-block rounded-md bg-gray-900 px-5 py-3 text-sm font-medium text-white"
        >
          Réessayer le paiement
        </a>
      </div>
    </div>
  );
}
