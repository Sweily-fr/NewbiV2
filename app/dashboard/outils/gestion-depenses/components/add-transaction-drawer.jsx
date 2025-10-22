"use client";

import { useState, useEffect } from "react";
import {
  XIcon,
  Euro,
  Calendar,
  Building,
  Tag,
  CreditCard,
  FileText,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/src/components/ui/drawer";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent } from "@/src/components/ui/card";
import { Separator } from "@/src/components/ui/separator";

export function AddTransactionDrawer({ open, onOpenChange, onSubmit, transaction = null }) {
  const [formData, setFormData] = useState({
    type: "EXPENSE", // Défaut à EXPENSE pour les dépenses
    amount: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    paymentMethod: "CARD",
    vendor: "",
  });

  // Fonction pour mapper les catégories de l'API vers le formulaire
  const mapApiCategoryToForm = (apiCategory) => {
    const categoryMap = {
      OFFICE_SUPPLIES: "bureau",
      TRAVEL: "transport",
      MEALS: "repas",
      EQUIPMENT: "materiel",
      MARKETING: "marketing",
      TRAINING: "formation",
      OTHER: "autre",
      SERVICES: "autre",
      RENT: "autre",
      SALARIES: "autre",
    };
    return categoryMap[apiCategory] || "autre";
  };

  // Fonction pour mapper les méthodes de paiement de l'API vers le formulaire
  const mapApiPaymentMethodToForm = (apiPaymentMethod) => {
    const paymentMethodMap = {
      CREDIT_CARD: "CARD",
      BANK_TRANSFER: "TRANSFER",
      CASH: "CASH",
      CHECK: "CHECK",
      PAYPAL: "TRANSFER",
      OTHER: "TRANSFER",
    };
    return paymentMethodMap[apiPaymentMethod] || "CARD";
  };

  // Pré-remplir le formulaire si une transaction est fournie (mode édition)
  useEffect(() => {
    if (transaction && open) {
      
      // Formater la date pour l'input date (format YYYY-MM-DD)
      let formattedDate = new Date().toISOString().split("T")[0]; // Défaut
      if (transaction.date) {
        
        if (typeof transaction.date === "string") {
          // Si c'est déjà une string, vérifier le format
          if (transaction.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            formattedDate = transaction.date;
          } else {
            // Essayer de parser la date
            const parsedDate = new Date(transaction.date);
            if (!isNaN(parsedDate.getTime())) {
              formattedDate = parsedDate.toISOString().split("T")[0];
            }
          }
        } else {
          // Si c'est un objet Date
          const dateObj = new Date(transaction.date);
          if (!isNaN(dateObj.getTime())) {
            formattedDate = dateObj.toISOString().split("T")[0];
          }
        }
      }
      
      const newFormData = {
        type: transaction.type || "EXPENSE",
        amount: transaction.amount?.toString() || "",
        category: mapApiCategoryToForm(transaction.category) || "",
        date: formattedDate,
        description: transaction.description || "",
        paymentMethod: mapApiPaymentMethodToForm(transaction.paymentMethod) || "CARD",
        vendor: transaction.vendor || "",
      };
      
      setFormData(newFormData);
    }
  }, [transaction, open]);

  // Réinitialiser le formulaire quand le drawer se ferme
  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      // Réinitialiser le formulaire
      setFormData({
        type: "EXPENSE", // Cohérence avec le défaut
        amount: "",
        category: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
        paymentMethod: "CARD",
        vendor: "",
      });
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    onSubmit(formData);
  };

  const handleChange = (field) => (value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isIncome = formData.type === "INCOME";

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} direction="right">
      <DrawerContent
        className="w-full h-full md:w-[620px] md:max-w-[620px] md:min-w-[620px] md:h-auto"
        style={{ width: '100vw', height: '100vh' }}
      >
        <DrawerHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DrawerTitle>
              {transaction ? "Modifier la transaction" : "Ajouter une transaction"}
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <XIcon className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 space-y-4 pb-32 md:pb-4">
            {/* Type de document */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-normal">Type de transaction</span>
              </div>
              <Badge className="bg-[#5b4fff]/30 border-[#5b4fff]/10 text-[#5b4fff] text-[10px] font-normal rounded-sm">
                Transaction manuelle
              </Badge>
            </div>
            <Separator />

            {/* Informations financières */}
            <Card className="shadow-none border-none py-2">
              <CardContent className="px-2 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Euro className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-normal">
                    Informations financières
                  </span>
                </div>
                <div className="space-y-4">
                  {/* Type de transaction */}
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                      Type de transaction
                    </Label>
                    <Select
                      value={formData.type}
                      onValueChange={handleChange("type")}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INCOME">Revenu</SelectItem>
                        <SelectItem value="EXPENSE">Dépense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Montant */}
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                      Montant
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => handleChange("amount")(e.target.value)}
                        className="w-24"
                        placeholder="0.00"
                      />
                      <Select value="EUR" disabled>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Separator />

            {/* Date */}
            <Card className="shadow-none border-none py-2">
              <CardContent className="px-2 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-normal">Date</span>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                    Date de transaction
                  </Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => {
                      handleChange("date")(e.target.value);
                    }}
                    className="w-40"
                    lang="fr-FR"
                  />
                </div>
              </CardContent>
            </Card>
            <Separator />

            {/* Fournisseur */}
            <Card className="shadow-none border-none py-2">
              <CardContent className="px-2 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Building className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-normal">Fournisseur</span>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                    Nom du fournisseur
                  </Label>
                  <Input
                    value={formData.vendor || ""}
                    onChange={(e) => handleChange("vendor")(e.target.value)}
                    placeholder="Nom du fournisseur"
                    className="w-48"
                  />
                </div>
              </CardContent>
            </Card>
            <Separator />

            {/* Classification */}
            <Card className="shadow-none border-none py-2">
              <CardContent className="px-2 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">Classification</span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                      Catégorie
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={handleChange("category")}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bureau">Bureau</SelectItem>
                        <SelectItem value="transport">Transport</SelectItem>
                        <SelectItem value="repas">Repas</SelectItem>
                        <SelectItem value="materiel">Matériel</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="formation">Formation</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                      Moyen de paiement
                    </Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={handleChange("paymentMethod")}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CARD">Carte</SelectItem>
                        <SelectItem value="TRANSFER">Virement</SelectItem>
                        <SelectItem value="CASH">Espèces</SelectItem>
                        <SelectItem value="CHECK">Chèque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="shadow-none border-none py-2">
              <CardContent className="px-2 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-medium">Description</span>
                </div>
                <div className="flex items-start justify-between">
                  <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mt-1">
                    Description
                  </Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      handleChange("description")(e.target.value)
                    }
                    placeholder="Description de la transaction"
                    rows={3}
                    className="flex-1 ml-4"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Fixed footer with buttons */}
        <div className="flex-shrink-0 border-t bg-white p-4">
          <form onSubmit={handleSubmit}>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer font-normal"
                onClick={() => handleOpenChange(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 cursor-pointer font-normal"
              >
                {transaction ? "Modifier la transaction" : "Ajouter la transaction"}
              </Button>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
