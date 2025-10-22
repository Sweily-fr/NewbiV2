"use client";

import { FileText, Download, Eye, LoaderCircle, AlertCircle } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { useStripeInvoices } from "@/src/hooks/useStripeInvoices";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import { Separator } from "@/src/components/ui/separator";

export default function FacturationSection() {
  const { invoices, loading, error, refetch, viewInvoice, downloadInvoice } =
    useStripeInvoices();

  const { subscription, isActive } = useSubscription();

  const getStatusBadge = (status) => {
    switch (status) {
      case "paid":
        return (
          <Badge
            variant="secondary"
            className="bg-green-50 text-green-700 text-xs border-green-200"
          >
            Payée
          </Badge>
        );
      case "open":
        return (
          <Badge
            variant="secondary"
            className="bg-orange-50 text-orange-700 text-xs border-orange-200"
          >
            En attente
          </Badge>
        );
      case "void":
        return (
          <Badge
            variant="secondary"
            className="bg-red-50 text-red-700 text-xs border-red-200"
          >
            Annulée
          </Badge>
        );
      case "draft":
        return (
          <Badge
            variant="secondary"
            className="bg-gray-50 text-gray-700 text-xs border-gray-200"
          >
            Brouillon
          </Badge>
        );
      case "uncollectible":
        return (
          <Badge
            variant="secondary"
            className="bg-red-50 text-red-700 text-xs border-red-200"
          >
            Irrécupérable
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-xs">
            {status}
          </Badge>
        );
    }
  };

  const handleViewInvoice = (invoiceId) => {
    viewInvoice(invoiceId);
  };

  const handleDownloadInvoice = (invoiceId) => {
    downloadInvoice(invoiceId);
  };

  // Affichage si pas d'abonnement
  if (!isActive() && !loading) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-medium mb-1">Facturation</h2>
          <Separator />
        </div>

        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun abonnement actif
          </h3>
          <p className="text-sm text-gray-500">
            Vous devez avoir un abonnement pro pour voir vos factures.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium mb-1">Facturation</h2>
          <Separator />
        </div>

        {/* Bouton de rafraîchissement */}
        <Button
          variant="outline"
          size="sm"
          onClick={refetch}
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <LoaderCircle className="h-4 w-4" />
          )}
          Actualiser
        </Button>
      </div>

      {/* Informations sur l'abonnement */}
      {/* {subscription && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="font-medium text-blue-900">
              Abonnement {subscription.plan} actif
            </span>
          </div>
          <p className="text-sm text-blue-700">
            Statut:{" "}
            {subscription.status === "trialing"
              ? "Période d'essai"
              : subscription.status === "active"
                ? "Actif"
                : subscription.status}
          </p>
          {subscription.periodEnd && (
            <p className="text-sm text-blue-700">
              Prochaine facturation:{" "}
              {new Date(subscription.periodEnd).toLocaleDateString("fr-FR")}
            </p>
          )}
        </div>
      )} */}

      {/* Factures Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-base font-medium mb-4">
            Factures
            {/* Factures {invoices.length > 0 && `(${invoices.length})`} */}
          </h3>

          {/* État de chargement */}
          {loading && (
            <div className="space-y-3">
              {/* Skeleton pour 3 factures */}
              {[1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-[#2c2c2c]"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3">
                        {/* Skeleton pour la date */}
                        <div className="h-4 bg-gray-200 dark:bg-[#292929] rounded animate-pulse w-24"></div>
                        {/* Skeleton pour le badge de statut */}
                        <div className="h-5 bg-gray-200 dark:bg-[#292929] rounded-full animate-pulse w-16"></div>
                      </div>
                      {/* Skeleton pour la description et montant */}
                      <div className="h-3 bg-gray-200 dark:bg-[#292929] rounded animate-pulse w-48"></div>
                      {/* Skeleton pour la période */}
                      <div className="h-3 bg-gray-200 dark:bg-[#292929] rounded animate-pulse w-32"></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Skeleton pour le bouton "Voir" */}
                    <div className="h-8 bg-gray-200 dark:bg-[#292929] rounded animate-pulse w-16"></div>
                    {/* Skeleton pour le bouton "PDF" */}
                    <div className="h-8 bg-gray-200 dark:bg-[#292929] rounded animate-pulse w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Gestion d'erreur */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="font-medium text-red-900">Erreur</span>
              </div>
              <p className="text-sm text-red-700 mb-3">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={refetch}
                className="text-red-700 border-red-300 hover:bg-red-50"
              >
                Réessayer
              </Button>
            </div>
          )}

          {/* Liste des factures */}
          {!loading && !error && (
            <div className="space-y-3">
              {invoices.map((facture) => (
                <div
                  key={facture.id}
                  className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-[#2c2c2c]"
                >
                  <div className="flex items-center gap-4">
                    {/* <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div> */}

                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-200">
                          {facture.date}
                        </span>
                        {/* {getStatusBadge(facture.status)} */}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {facture.description || `Facture ${facture.number}`} •{" "}
                        {facture.amount}
                      </div>
                      {facture.periodStart && facture.periodEnd && (
                        <div className="text-xs text-gray-400">
                          Période:{" "}
                          {new Date(facture.periodStart).toLocaleDateString(
                            "fr-FR"
                          )}{" "}
                          -{" "}
                          {new Date(facture.periodEnd).toLocaleDateString(
                            "fr-FR"
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewInvoice(facture.stripeInvoiceId)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Eye className="h-4 w-4" />
                      Voir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleDownloadInvoice(facture.stripeInvoiceId)
                      }
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="h-4 w-4" />
                      PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* État vide */}
          {!loading && !error && invoices.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Aucune facture
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Vos factures Stripe apparaîtront ici une fois générées.
              </p>
              {isActive() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refetch}
                  className="flex items-center gap-2"
                >
                  <LoaderCircle className="h-4 w-4" />
                  Actualiser
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
