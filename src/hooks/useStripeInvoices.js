"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/src/lib/auth-client";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import { toast } from "sonner";

export function useStripeInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { data: session } = authClient.useSession();
  const { subscription, isActive } = useSubscription();

  const fetchStripeInvoices = async () => {
    // Vérifier si l'utilisateur est connecté et a un abonnement avec customer ID
    if (!session?.user || !subscription?.stripeCustomerId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Appel à l'API pour récupérer les factures Stripe avec le customer ID
      const response = await fetch(`/api/stripe/invoices?customerId=${encodeURIComponent(subscription.stripeCustomerId)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        // Transformer les données Stripe en format utilisable
        const formattedInvoices = data.invoices.map((invoice) => ({
          id: invoice.id,
          date: new Date(invoice.created * 1000).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          status: invoice.status,
          amount: `${(invoice.amount_paid / 100).toFixed(2)} €`,
          type: getInvoiceTypeLabel(invoice.status),
          stripeInvoiceId: invoice.id,
          hostedInvoiceUrl: invoice.hosted_invoice_url,
          invoicePdf: invoice.invoice_pdf,
          description: invoice.description || `Facture ${invoice.number}`,
          number: invoice.number,
          currency: invoice.currency?.toUpperCase() || "EUR",
          amountDue: invoice.amount_due / 100,
          amountPaid: invoice.amount_paid / 100,
          subtotal: invoice.subtotal / 100,
          tax: invoice.tax / 100,
          periodStart: invoice.period_start
            ? new Date(invoice.period_start * 1000)
            : null,
          periodEnd: invoice.period_end
            ? new Date(invoice.period_end * 1000)
            : null,
        }));

        setInvoices(formattedInvoices);
      } else {
        throw new Error(
          data.message || "Erreur lors de la récupération des factures"
        );
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des factures Stripe:", err);
      setError(err.message);
      toast.error("Impossible de charger les factures");
    } finally {
      setLoading(false);
    }
  };

  const getInvoiceTypeLabel = (status) => {
    switch (status) {
      case "paid":
        return "Payée";
      case "open":
        return "En attente";
      case "draft":
        return "Brouillon";
      case "void":
        return "Annulée";
      case "uncollectible":
        return "Irrécupérable";
      default:
        return "Inconnue";
    }
  };

  const downloadInvoice = async (invoiceId) => {
    try {
      const invoice = invoices.find((inv) => inv.stripeInvoiceId === invoiceId);
      if (!invoice) {
        throw new Error("Facture non trouvée");
      }

      if (invoice.invoicePdf) {
        // Ouvrir le PDF dans un nouvel onglet
        window.open(invoice.invoicePdf, "_blank");
      } else if (invoice.hostedInvoiceUrl) {
        // Ouvrir la page hébergée Stripe
        window.open(invoice.hostedInvoiceUrl, "_blank");
      } else {
        throw new Error("Aucun lien de téléchargement disponible");
      }
    } catch (err) {
      console.error("Erreur lors du téléchargement:", err);
      toast.error("Impossible de télécharger la facture");
    }
  };

  const viewInvoice = async (invoiceId) => {
    try {
      const invoice = invoices.find((inv) => inv.stripeInvoiceId === invoiceId);
      if (!invoice) {
        throw new Error("Facture non trouvée");
      }

      if (invoice.hostedInvoiceUrl) {
        // Ouvrir la page hébergée Stripe
        window.open(invoice.hostedInvoiceUrl, "_blank");
      } else if (invoice.invoicePdf) {
        // Ouvrir le PDF dans un nouvel onglet
        window.open(invoice.invoicePdf, "_blank");
      } else {
        throw new Error("Aucun lien de visualisation disponible");
      }
    } catch (err) {
      console.error("Erreur lors de la visualisation:", err);
      toast.error("Impossible d'afficher la facture");
    }
  };

  const refetch = () => {
    fetchStripeInvoices();
  };

  useEffect(() => {
    fetchStripeInvoices();
  }, [session?.user, subscription?.stripeCustomerId]);

  return {
    invoices,
    loading,
    error,
    refetch,
    downloadInvoice,
    viewInvoice,
  };
}
