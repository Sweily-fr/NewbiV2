"use client";

import { useState } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/src/components/ui/drawer";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  CreditCardIcon,
  BanknoteIcon,
  BuildingIcon,
  FileTextIcon,
  DownloadIcon,
  EditIcon,
  TrashIcon,
  XIcon,
} from "lucide-react";

const paymentMethodIcons = {
  CARD: CreditCardIcon,
  CASH: BanknoteIcon,
  TRANSFER: BuildingIcon,
  CHECK: FileTextIcon,
};

const paymentMethodLabels = {
  CARD: "Carte",
  CASH: "Espèces",
  TRANSFER: "Virement",
  CHECK: "Chèque",
};

export function TransactionDetailDrawer({
  transaction,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}) {
  if (!transaction) return null;

  const isIncome = transaction.type === "INCOME";
  const PaymentIcon =
    paymentMethodIcons[transaction.paymentMethod] || FileTextIcon;

  const formatDate = (dateInput, includeTime = false) => {
    console.log("formatDate input:", dateInput, typeof dateInput);
    
    if (!dateInput) return "Date non disponible";
    
    let date;
    
    // Gérer différents types d'entrée
    if (typeof dateInput === 'string') {
      // Cas spécial pour les chaînes vides ou "Invalid Date"
      if (dateInput === '' || dateInput === 'Invalid Date') {
        return "Date non disponible";
      }
      
      // Si c'est une date au format YYYY-MM-DD, ajouter une heure pour éviter les problèmes de timezone
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        date = new Date(dateInput + 'T12:00:00.000Z');
      } 
      // Si c'est un timestamp en string
      else if (/^\d{10,13}$/.test(dateInput)) {
        date = new Date(parseInt(dateInput));
      }
      // Autres formats de string
      else {
        date = new Date(dateInput);
      }
    } 
    // Si c'est un nombre (timestamp)
    else if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    }
    // Si c'est déjà un objet Date
    else if (dateInput instanceof Date) {
      date = dateInput;
    }
    // Autres cas
    else {
      console.log("Type de date non supporté:", typeof dateInput, dateInput);
      return "Format de date non supporté";
    }
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      console.log("Date invalide après parsing:", dateInput, "->", date);
      return "Date invalide";
    }
    
    // Formater selon les besoins
    if (includeTime) {
      const dateStr = date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      
      const timeStr = date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      
      return `${dateStr} ${timeStr}`;
    } else {
      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
  };

  const formatAmount = (amount) => {
    const sign = isIncome ? "+" : "-";
    return `${sign}${Math.abs(amount).toFixed(2)} €`;
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent
        className="w-[620px] max-w-[620px]"
        style={{ width: "620px", maxWidth: "620px", minWidth: "620px" }}
      >
        {/* Header */}
        <DrawerHeader className="flex flex-row items-center justify-between p-6 border-b space-y-0">
          <DrawerTitle className="text-lg font-medium m-0 p-0 flex-shrink-0">
            Détails de la transaction
          </DrawerTitle>
          <div className="flex-shrink-0">
            <DrawerClose asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <XIcon className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-120px)]">
          {/* Amount */}
          <div className="mb-6">
            <div className="text-3xl font-medium">
              {formatAmount(transaction.amount)}
            </div>
          </div>

          {/* Transaction Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">ID Client</span>
              <span className="text-sm font-medium">{transaction.id}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Facture</span>
              <span className="text-sm font-medium">
                #{Math.floor(Math.random() * 100000)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Type de transaction</span>
              <span className="text-sm font-medium">
                {transaction.category}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Statut</span>
              <Badge
                className={`${
                  isIncome
                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                    : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                }`}
              >
                {isIncome ? "Approuvé" : "Traité"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Données du compte</span>
              <div className="flex items-center space-x-2">
                <PaymentIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium">
                  •••• {String(Math.abs(transaction.amount)).slice(-4)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Date</span>
              <span className="text-sm font-medium">
                {formatDate(transaction.date, true)}
              </span>
            </div>

            <div className="pt-2">
              <Button
                variant="link"
                className="h-auto p-0 text-blue-600 hover:text-blue-700"
              >
                Plus de détails
              </Button>
            </div>
          </div>

          {/* Fichiers épinglés */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Fichiers épinglés</h3>
              <span className="text-xs">({transaction.files?.length || 0})</span>
            </div>

            {transaction.files && transaction.files.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {transaction.files.map((file, index) => {
                  // Déterminer le type de fichier et l'icône
                  const isImage = file.mimetype?.startsWith('image/');
                  const isPdf = file.mimetype === 'application/pdf';
                  const fileExtension = file.filename?.split('.').pop()?.toLowerCase() || 'pdf';
                  
                  // Couleur et icône selon le type
                  const iconBgColor = isPdf ? 'bg-red-100' : isImage ? 'bg-blue-100' : 'bg-gray-100';
                  const iconColor = isPdf ? 'text-red-600' : isImage ? 'text-blue-600' : 'text-gray-600';
                  
                  // Fonction pour formater la taille du fichier
                  const formatFileSize = (bytes) => {
                    if (!bytes) return 'Taille inconnue';
                    if (bytes < 1024) return `${bytes} B`;
                    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
                    return `${Math.round(bytes / (1024 * 1024))} MB`;
                  };
                  
                  // Fonction pour télécharger le fichier
                  const handleDownload = () => {
                    try {
                      const link = document.createElement('a');
                      link.href = file.url;
                      link.download = file.originalFilename || file.filename || `fichier-${index + 1}.${fileExtension}`;
                      link.target = '_blank';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } catch (error) {
                      console.error('Erreur lors du téléchargement:', error);
                    }
                  };
                  
                  return (
                    <div key={file.id || index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 ${iconBgColor} rounded flex items-center justify-center`}>
                          <FileTextIcon className={`h-5 w-5 ${iconColor}`} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate" title={file.originalFilename || file.filename}>
                          {file.originalFilename || file.filename || `Fichier ${index + 1}`}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{formatFileSize(file.size)}</span>
                          {file.ocrProcessed && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              OCR traité
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                        onClick={handleDownload}
                        title="Télécharger le fichier"
                      >
                        <DownloadIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <FileTextIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Aucun fichier attaché</p>
              </div>
            )}
          </div>

          {/* Informations du fournisseur */}
          {(transaction.vendor || transaction.ocrMetadata) && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-medium">Informations du fournisseur</h3>

              <div className="space-y-2">
                {(transaction.vendor || transaction.ocrMetadata?.vendorName) && (
                  <div className="flex justify-between">
                    <span className="text-sm">Nom du fournisseur</span>
                    <span className="text-sm font-medium">
                      {transaction.vendor || transaction.ocrMetadata?.vendorName}
                    </span>
                  </div>
                )}

                {transaction.ocrMetadata?.vendorAddress && (
                  <div className="flex justify-between">
                    <span className="text-sm">Adresse</span>
                    <span className="text-sm text-right max-w-48 truncate" title={transaction.ocrMetadata.vendorAddress}>
                      {transaction.ocrMetadata.vendorAddress}
                    </span>
                  </div>
                )}

                {(transaction.vendorVatNumber || transaction.ocrMetadata?.vendorVatNumber) && (
                  <div className="flex justify-between">
                    <span className="text-sm">Numéro SIRET/TVA</span>
                    <span className="text-sm font-medium">
                      {transaction.vendorVatNumber || transaction.ocrMetadata?.vendorVatNumber}
                    </span>
                  </div>
                )}

                {(transaction.invoiceNumber || transaction.ocrMetadata?.invoiceNumber) && (
                  <div className="flex justify-between">
                    <span className="text-sm">Numéro de facture</span>
                    <span className="text-sm font-medium">
                      {transaction.invoiceNumber || transaction.ocrMetadata?.invoiceNumber}
                    </span>
                  </div>
                )}

                {transaction.ocrMetadata?.invoiceDate && (
                  <div className="flex justify-between">
                    <span className="text-sm">Date de facture</span>
                    <span className="text-sm">
                      {formatDate(transaction.ocrMetadata.invoiceDate, false)}
                    </span>
                  </div>
                )}

                {transaction.ocrMetadata?.confidenceScore && (
                  <div className="flex justify-between">
                    <span className="text-sm">Confiance OCR</span>
                    <span className="text-sm">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        transaction.ocrMetadata.confidenceScore > 0.8 
                          ? 'bg-green-100 text-green-800' 
                          : transaction.ocrMetadata.confidenceScore > 0.6 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {Math.round(transaction.ocrMetadata.confidenceScore * 100)}%
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shipping Information */}
          {transaction.description && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-medium">
                Informations de transaction
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Description</span>
                  <span className="text-sm text-right max-w-48 truncate">
                    {transaction.description}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm">Catégorie</span>
                  <span className="text-sm">{transaction.category}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm">Moyen de paiement</span>
                  <span className="text-sm">
                    {paymentMethodLabels[transaction.paymentMethod]}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm">Référence</span>
                  <span className="text-sm font-mono">
                    TXN-{transaction.id}
                  </span>
                </div>

                {transaction.hasAttachment && (
                  <div className="flex justify-between">
                    <span className="text-sm">Pièce jointe</span>
                    <Button
                      variant="link"
                      className="h-auto p-0 text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Voir le reçu
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DrawerFooter>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 cursor-pointer "
              onClick={() => onEdit?.(transaction)}
            >
              <EditIcon className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            <Button
              size="sm"
              className="flex-1 cursor-pointer"
              onClick={() => onDelete?.(transaction)}
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
