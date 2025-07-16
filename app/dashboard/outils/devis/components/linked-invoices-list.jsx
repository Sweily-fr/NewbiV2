'use client';

import React, { useState, useOptimistic, useTransition, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/src/components/ui/alert-dialog';
import { Trash2, FileText, Euro } from 'lucide-react';
import { useDeleteLinkedInvoice } from '@/src/graphql/invoiceQueries';
import { toast } from 'sonner';

// Fonction utilitaire pour formater les montants
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount || 0);
};

const LinkedInvoicesList = ({ quote, onInvoiceDeleted, onCreateLinkedInvoice, isLoading }) => {
  const { deleteLinkedInvoice } = useDeleteLinkedInvoice();
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [isPending, startTransition] = useTransition();

  // Utiliser useOptimistic pour une mise à jour optimiste des factures
  const [optimisticInvoices, deleteOptimisticInvoice] = useOptimistic(
    quote?.linkedInvoices || [],
    (currentInvoices, invoiceIdToDelete) => {
      console.log('useOptimistic reducer - Suppression de:', invoiceIdToDelete);
      console.log('Factures actuelles:', currentInvoices.map(inv => inv.id));
      const filtered = currentInvoices.filter(invoice => invoice.id !== invoiceIdToDelete);
      console.log('Factures après filtrage:', filtered.map(inv => inv.id));
      return filtered;
    }
  );
  
  // Solution de fallback avec useState pour comparaison
  const [deletedInvoiceIds, setDeletedInvoiceIds] = useState(new Set());
  const fallbackInvoices = (quote?.linkedInvoices || []).filter(invoice => !deletedInvoiceIds.has(invoice.id));
  
  console.log('Rendu - quote.linkedInvoices:', quote?.linkedInvoices?.map(inv => inv.id));
  console.log('Rendu - optimisticInvoices:', optimisticInvoices.map(inv => inv.id));
  console.log('Rendu - fallbackInvoices:', fallbackInvoices.map(inv => inv.id));
  console.log('Rendu - deletedInvoiceIds:', Array.from(deletedInvoiceIds));

  const handleDeleteInvoice = async (invoiceId) => {
    console.log('handleDeleteInvoice - Début suppression de:', invoiceId);
    
    // Suppression immédiate de l'affichage (double approche pour diagnostiquer)
    startTransition(() => {
      console.log('startTransition - Appel deleteOptimisticInvoice avec:', invoiceId);
      deleteOptimisticInvoice(invoiceId);
    });
    
    // Fallback avec useState
    setDeletedInvoiceIds(prev => {
      const newSet = new Set(prev);
      newSet.add(invoiceId);
      console.log('useState fallback - Ajout de:', invoiceId, 'Set:', Array.from(newSet));
      return newSet;
    });
    
    try {
      console.log('Appel API deleteLinkedInvoice pour:', invoiceId);
      await deleteLinkedInvoice(invoiceId);
      console.log('API deleteLinkedInvoice réussie pour:', invoiceId);
      toast.success('Facture supprimée avec succès');
      
      // Notifier le parent pour mettre à jour les boutons d'action
      if (onInvoiceDeleted) {
        console.log('Appel onInvoiceDeleted');
        onInvoiceDeleted();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      // En cas d'erreur, useOptimistic se synchronisera automatiquement avec les données du serveur
      toast.error('Erreur lors de la suppression de la facture');
    }
    
    // Fermer le dialog
    setInvoiceToDelete(null);
  };
  
  const confirmDelete = (invoice) => {
    console.log('confirmDelete - Facture sélectionnée:', {
      id: invoice.id,
      number: invoice.number,
      status: invoice.status
    });
    setInvoiceToDelete(invoice);
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

  // Utiliser fallbackInvoices pour diagnostiquer
  const displayInvoices = fallbackInvoices.length > 0 ? fallbackInvoices : optimisticInvoices;
  console.log('displayInvoices choisi:', displayInvoices.map(inv => inv.id));
  
  if (!quote?.linkedInvoices || displayInvoices.length === 0) {
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

  const totalInvoiced = displayInvoices.reduce((sum, invoice) => {
    return sum + (invoice.finalTotalTTC || 0);
  }, 0);
  const remainingAmount = (quote.finalTotalTTC || 0) - totalInvoiced;
  
  // Indicateur visuel pendant la transition
  const isDeleting = isPending;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4" />
            Factures liées ({displayInvoices.length}/3)
            {isDeleting && (
              <span className="text-xs text-muted-foreground animate-pulse">
                (Suppression en cours...)
              </span>
            )}
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
          {displayInvoices.map((invoice) => (
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
                    onClick={() => confirmDelete(invoice)}
                    disabled={isDeleting}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive disabled:opacity-50"
                    title={isDeleting ? 'Suppression en cours...' : 'Supprimer la facture'}
                  >
                    <Trash2 className={`h-3 w-3 ${isDeleting ? 'animate-pulse' : ''}`} />
                  </Button>
                )}
              </div>
            </div>
          ))}
          

        </div>
      </CardContent>
      </Card>
      
      {/* AlertDialog pour confirmer la suppression */}
      <AlertDialog open={!!invoiceToDelete} onOpenChange={() => setInvoiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la facture liée</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la facture <strong>{invoiceToDelete?.number}</strong> ?
              <br />
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setInvoiceToDelete(null)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                console.log('AlertDialog - Clic Supprimer, invoiceToDelete:', {
                  invoice: invoiceToDelete,
                  id: invoiceToDelete?.id
                });
                handleDeleteInvoice(invoiceToDelete?.id);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default LinkedInvoicesList;
