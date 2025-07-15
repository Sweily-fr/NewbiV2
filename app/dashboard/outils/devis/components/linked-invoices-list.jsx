'use client';

import React from 'react';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Trash2, FileText, Euro } from 'lucide-react';
import { useDeleteLinkedInvoice } from '@/src/graphql/invoiceQueries';

// Fonction utilitaire pour formater les montants
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount || 0);
};

const LinkedInvoicesList = ({ quote, onInvoiceDeleted, onCreateLinkedInvoice, isLoading }) => {
  const { deleteLinkedInvoice, loading: deleteLoading } = useDeleteLinkedInvoice();

  const handleDeleteInvoice = async (invoiceId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette facture liée ?')) {
      try {
        await deleteLinkedInvoice(invoiceId);
        if (onInvoiceDeleted) {
          onInvoiceDeleted();
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      DRAFT: { label: 'Brouillon', variant: 'secondary' },
      PENDING: { label: 'En attente', variant: 'default' },
      COMPLETED: { label: 'Terminée', variant: 'success' },
      CANCELED: { label: 'Annulée', variant: 'destructive' }
    };

    const config = statusConfig[status] || { label: status, variant: 'default' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (!quote?.linkedInvoices || quote.linkedInvoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4" />
            Factures liées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aucune facture liée à ce devis.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalInvoiced = quote.linkedInvoices.reduce((sum, invoice) => {
    console.log(`Facture ${invoice.number}: ${invoice.finalTotalTTC}€ (isDeposit: ${invoice.isDeposit})`);
    return sum + (invoice.finalTotalTTC || 0);
  }, 0);
  const remainingAmount = (quote.finalTotalTTC || 0) - totalInvoiced;
  
  console.log(`Résumé financier - Total devis: ${quote.finalTotalTTC}€, Déjà facturé: ${totalInvoiced}€, Reste: ${remainingAmount}€`);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4" />
          Factures liées ({quote.linkedInvoices.length}/3)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Résumé financier */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Montant total du devis:</span>
            <span className="font-medium">{formatCurrency(quote.finalTotalTTC || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Déjà facturé:</span>
            <span className="font-medium">{formatCurrency(totalInvoiced)}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-muted-foreground">Reste à facturer:</span>
            <span className="font-medium text-primary">{formatCurrency(remainingAmount)}</span>
          </div>
        </div>

        {/* Liste des factures */}
        <div className="space-y-3">
          {quote.linkedInvoices.map((invoice) => (
            <div key={invoice.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{invoice.number}</span>
                  {invoice.isDeposit && (
                    <Badge variant="outline" className="text-xs">
                      Acompte
                    </Badge>
                  )}
                </div>
                {getStatusBadge(invoice.status)}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Euro className="h-3 w-3" />
                  <span>{formatCurrency(invoice.finalTotalTTC || 0)}</span>
                </div>
                
                {invoice.status === 'DRAFT' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteInvoice(invoice.id)}
                    disabled={deleteLoading}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          

        </div>
      </CardContent>
    </Card>
  );
};

export default LinkedInvoicesList;
