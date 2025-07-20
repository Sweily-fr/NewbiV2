"use client";

import { useState } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/src/components/ui/drawer";
import { Input } from "@/src/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Badge } from "@/src/components/ui/badge";

export function AddTransactionDrawer({ open, onOpenChange, onSubmit }) {
  const [formData, setFormData] = useState({
    type: "EXPENSE",
    amount: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    paymentMethod: "CARD",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field) => (value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isIncome = formData.type === "INCOME";

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent>
        <DrawerHeader>
          <div className="flex items-center justify-between">
            <DrawerTitle>Ajouter une transaction</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <XIcon className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="flex-1 px-4 pb-4 space-y-6">
          {/* Type et Montant */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge
                variant={isIncome ? "default" : "destructive"}
                className="flex items-center gap-1"
              >
                {isIncome ? (
                  <>
                    <span className="text-green-600">+</span>
                    <span>Entrée</span>
                  </>
                ) : (
                  <>
                    <span className="text-red-600">-</span>
                    <span>Sortie</span>
                  </>
                )}
              </Badge>
              <Select
                value={formData.type}
                onValueChange={handleChange("type")}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOME">Entrée</SelectItem>
                  <SelectItem value="EXPENSE">Sortie</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="amount">Montant</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleChange("amount")(e.target.value)}
                className="w-full"
                placeholder="0.00 €"
              />
            </div>
          </div>

          {/* Catégorie */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="category">Catégorie</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => handleChange("category")(e.target.value)}
              placeholder="Sélectionner une catégorie"
            />
          </div>

          {/* Date */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleChange("date")(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description")(e.target.value)}
              placeholder="Description de la transaction..."
              className="min-h-[80px]"
            />
          </div>

          {/* Moyen de paiement */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="paymentMethod">Moyen de paiement</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={handleChange("paymentMethod")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner un moyen de paiement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CARD">Carte bancaire</SelectItem>
                <SelectItem value="CASH">Espèces</SelectItem>
                <SelectItem value="TRANSFER">Virement</SelectItem>
                <SelectItem value="CHECK">Chèque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              Ajouter
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
