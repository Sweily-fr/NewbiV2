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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
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
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-medium">Détails de la transaction</h2>
          <DrawerClose asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <XIcon className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </div>

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
                {new Date(transaction.date).toLocaleDateString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "numeric",
                })}{" "}
                {new Date(transaction.date).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}{" "}
                PDT
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
              <span className="text-xs">(2)</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Facture PDF */}
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                    <FileTextIcon className="h-4 w-4 text-red-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    Facture_{transaction.id}.pdf
                  </p>
                  <p className="text-xs text-gray-500">
                    {Math.floor(Math.random() * 500 + 100)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                >
                  <DownloadIcon className="h-4 w-4" />
                </Button>
              </div>

              {/* Reçu image */}
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                    <FileTextIcon className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    Recu_{transaction.category}.jpg
                  </p>
                  <p className="text-xs text-gray-500">
                    {Math.floor(Math.random() * 200 + 50)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                >
                  <DownloadIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Billing Information */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-medium">Informations de facturation</h3>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Adresse</span>
                <span className="text-sm">123 Business Ave</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm">Ville</span>
                <span className="text-sm">Paris</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm">Région</span>
                <span className="text-sm">Ile-de-France</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm">Code postal</span>
                <span className="text-sm">75001</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm">Numéro de téléphone</span>
                <span className="text-sm">+33 1 23 45 67 89</span>
              </div>
            </div>
          </div>

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
