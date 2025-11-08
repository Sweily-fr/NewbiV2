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
  Calendar,
  CreditCard,
  Banknote,
  Building2,
  FileText,
  Download,
  Edit,
  Trash2,
  X,
  User,
  Tag,
  Receipt,
  ExternalLink,
} from "lucide-react";
import {
  formatDateToFrench,
  formatDateTimeToFrench,
} from "@/src/utils/dateFormatter";
import { findMerchant } from "@/lib/merchants-config";
import { getCategoryConfig } from "@/lib/category-icons-config";

const paymentMethodIcons = {
  CARD: CreditCard,
  CREDIT_CARD: CreditCard,
  CASH: Banknote,
  TRANSFER: Building2,
  CHECK: FileText,
};

const paymentMethodLabels = {
  CARD: "Carte bancaire",
  CREDIT_CARD: "Carte bancaire",
  CASH: "Espèces",
  TRANSFER: "Virement",
  CHECK: "Chèque",
};

const statusLabels = {
  PAID: "Payée",
  PENDING: "En attente",
  DRAFT: "Brouillon",
  CANCELLED: "Annulée",
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
    paymentMethodIcons[transaction.paymentMethod] || CreditCard;

  // Trouver le marchand
  const merchant = findMerchant(
    transaction.vendor || transaction.description || transaction.title
  );

  // Obtenir la config de la catégorie
  const categoryConfig = getCategoryConfig(transaction.category);
  const CategoryIcon = categoryConfig.icon;

  // Utiliser les fonctions utilitaires pour formater les dates
  const formatDate = (dateInput, includeTime = false) => {
    if (!dateInput) return "Non spécifiée";

    // Gérer le format MongoDB
    if (typeof dateInput === "object" && dateInput.$date) {
      dateInput = dateInput.$date;
    }

    if (includeTime) {
      return formatDateTimeToFrench(dateInput);
    } else {
      return formatDateToFrench(dateInput);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent
        className="w-full h-full md:w-[500px] md:max-w-[500px] md:min-w-[500px] md:h-auto"
        style={{ width: "100vw", height: "100vh" }}
      >
        {/* Header */}
        <DrawerHeader className="flex flex-row items-center justify-between px-6 py-4 border-b space-y-0">
          <DrawerTitle className="text-base font-medium">
            Détails de la dépense
          </DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Montant principal */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${categoryConfig.color}15` }}
                >
                  <CategoryIcon
                    className="h-5 w-5"
                    style={{ color: categoryConfig.color }}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground font-normal">
                    {categoryConfig.label}
                  </p>
                  <p className="text-2xl font-medium">
                    {formatAmount(transaction.amount)}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Fournisseur avec logo */}
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                Fournisseur
              </p>
              <div className="flex items-center gap-3">
                {merchant?.logo ? (
                  <div className="h-10 w-10 rounded-full overflow-hidden border bg-white flex-shrink-0">
                    <img
                      src={merchant.logo}
                      alt={merchant.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.parentElement.innerHTML = `<div class="h-full w-full flex items-center justify-center bg-muted"><span class="text-xs font-medium text-muted-foreground">${merchant.name.charAt(0)}</span></div>`;
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {transaction.vendor ||
                      merchant?.name ||
                      transaction.title ||
                      "Fournisseur non spécifié"}
                  </p>
                  {transaction.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {transaction.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Informations de transaction */}
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                Informations
              </p>

              {/* Date */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-normal text-muted-foreground">
                    Date
                  </span>
                </div>
                <span className="text-sm font-normal">
                  {formatDate(transaction.date)}
                </span>
              </div>

              {/* Moyen de paiement */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PaymentIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-normal text-muted-foreground">
                    Paiement
                  </span>
                </div>
                <span className="text-sm font-normal">
                  {paymentMethodLabels[transaction.paymentMethod] ||
                    "Non spécifié"}
                </span>
              </div>

              {/* Statut */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-normal text-muted-foreground">
                    Statut
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="font-normal border-[#5A50FF]/20 bg-[#5A50FF]/5 text-[#5A50FF]"
                >
                  {statusLabels[transaction.status] || transaction.status}
                </Badge>
              </div>

              {/* Type de dépense */}
              {transaction.expenseType && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-normal text-muted-foreground">
                      Type
                    </span>
                  </div>
                  <span className="text-sm font-normal">
                    {transaction.expenseType === "ORGANIZATION"
                      ? "Organisation"
                      : "Personnel"}
                  </span>
                </div>
              )}

              {/* Utilisateur créateur */}
              {transaction.createdBy && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-normal text-muted-foreground">
                      Créé par
                    </span>
                  </div>
                  <span className="text-sm font-medium">
                    {transaction.createdBy.name ||
                      transaction.createdBy.email ||
                      "Utilisateur"}
                  </span>
                </div>
              )}
            </div>

            {/* Fichiers joints */}
            {transaction.files && transaction.files.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                      Fichiers joints
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {transaction.files.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {transaction.files.map((file, index) => {
                      const isImage = file.mimetype?.startsWith("image/");
                      const isPdf = file.mimetype === "application/pdf";

                      const formatFileSize = (bytes) => {
                        if (!bytes) return "";
                        if (bytes < 1024) return `${bytes} B`;
                        if (bytes < 1024 * 1024)
                          return `${Math.round(bytes / 1024)} KB`;
                        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                      };

                      const handleDownload = () => {
                        const link = document.createElement("a");
                        link.href = file.url;
                        link.download =
                          file.originalFilename ||
                          file.filename ||
                          `fichier-${index + 1}`;
                        link.target = "_blank";
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      };

                      return (
                        <div
                          key={file.id || index}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors group"
                        >
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-gray-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-normal truncate">
                              {file.originalFilename ||
                                file.filename ||
                                `Fichier ${index + 1}`}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(file.size)}
                              </span>
                              {file.ocrProcessed && (
                                <Badge
                                  variant="outline"
                                  className="text-xs font-normal border-green-200 bg-green-50 text-green-700"
                                >
                                  OCR
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={handleDownload}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Métadonnées OCR */}
            {transaction.ocrMetadata && (
              <>
                <Separator />
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                    Données OCR
                  </p>

                  <div className="space-y-3 p-3 rounded-lg bg-muted/30">
                    {transaction.ocrMetadata.invoiceNumber && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-normal text-muted-foreground">
                          N° facture
                        </span>
                        <span className="text-xs font-medium">
                          {transaction.ocrMetadata.invoiceNumber}
                        </span>
                      </div>
                    )}

                    {transaction.ocrMetadata.vendorAddress && (
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-normal text-muted-foreground">
                          Adresse
                        </span>
                        <span className="text-xs font-medium text-right max-w-[200px]">
                          {transaction.ocrMetadata.vendorAddress}
                        </span>
                      </div>
                    )}

                    {transaction.ocrMetadata.confidenceScore && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-normal text-muted-foreground">
                          Confiance
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs font-normal ${
                            transaction.ocrMetadata.confidenceScore > 0.8
                              ? "border-green-200 bg-green-50 text-green-700"
                              : transaction.ocrMetadata.confidenceScore > 0.6
                                ? "border-yellow-200 bg-yellow-50 text-yellow-700"
                                : "border-red-200 bg-red-50 text-red-700"
                          }`}
                        >
                          {Math.round(
                            transaction.ocrMetadata.confidenceScore * 100
                          )}
                          %
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Notes */}
            {transaction.notes && transaction.notes !== "[EXPENSE]" && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                    Notes
                  </p>
                  <p className="text-sm font-normal text-foreground">
                    {transaction.notes}
                  </p>
                </div>
              </>
            )}

            {/* Dates de création/modification */}
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-normal text-muted-foreground">
                  Créée le
                </span>
                <span className="text-xs font-normal">
                  {formatDate(transaction.createdAt, true)}
                </span>
              </div>
              {transaction.updatedAt &&
                transaction.updatedAt !== transaction.createdAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-normal text-muted-foreground">
                      Modifiée le
                    </span>
                    <span className="text-xs font-normal">
                      {formatDate(transaction.updatedAt, true)}
                    </span>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <DrawerFooter className="border-t px-6 py-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 font-normal"
              onClick={() => onEdit?.(transaction)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            <Button
              variant="outline"
              className="flex-1 font-normal text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onDelete?.(transaction)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
