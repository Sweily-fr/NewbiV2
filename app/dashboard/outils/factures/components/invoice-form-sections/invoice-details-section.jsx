"use client";

import { Clock, CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Button } from "@/src/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Calendar } from "@/src/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/src/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/src/lib/utils";

const PAYMENT_TERMS_SUGGESTIONS = [
  { value: 0, label: "Paiement à réception" },
  { value: 15, label: "15 jours" },
  { value: 30, label: "30 jours" },
  { value: 45, label: "45 jours" },
  { value: 60, label: "60 jours" }
];

export default function InvoiceDetailsSection({ data, updateField, canEdit }) {
  return (
    <Card className="shadow-none p-2 border-none">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Informations de la facture
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-0">
        {/* Facture d'acompte */}
        <div className="flex items-center space-x-3">
          <Checkbox
            id="deposit-invoice"
            checked={data.isDepositInvoice || false}
            onCheckedChange={(checked) => updateField("isDepositInvoice", checked)}
            disabled={!canEdit}
            className="h-5 w-5 rounded-md border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="deposit-invoice"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Facture d'acompte
            </Label>
            <p className="text-xs text-muted-foreground">
              Cochez si cette facture correspond à un acompte
            </p>
          </div>
        </div>

        {/* Préfixe et numéro de facture */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="invoice-prefix" className="text-sm font-medium text-gray-900">
              Préfixe de facture
            </Label>
            <div className="relative">
              <Input
                id="invoice-prefix"
                value={data.prefix || "F-"}
                onChange={(e) => updateField("prefix", e.target.value)}
                placeholder="F-"
                disabled={!canEdit}
                className="h-10 rounded-lg border-gray-300 bg-white px-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="invoice-number" className="text-sm font-medium text-gray-900">
              Numéro de facture
            </Label>
            <div className="relative">
              <Input
                id="invoice-number"
                value={data.number || ""}
                onChange={(e) => updateField("number", e.target.value)}
                placeholder="202501-001"
                disabled={!canEdit}
                className="h-10 rounded-lg border-gray-300 bg-white px-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        {/* Référence devis */}
        <div className="space-y-2">
          <Label htmlFor="quote-reference" className="text-sm font-medium text-gray-900">
            Référence devis
          </Label>
          <div className="relative">
            <Input
              id="quote-reference"
              value={data.quoteReference || ""}
              onChange={(e) => updateField("quoteReference", e.target.value)}
              placeholder="DEV-2025-001"
              disabled={!canEdit}
              className="h-10 rounded-lg border-gray-300 bg-white px-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <p className="text-xs text-gray-500">
            Référence du devis associé à cette facture (optionnel)
          </p>
        </div>

        {/* Dates */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900">
                Date d'émission
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={!canEdit}
                    className={cn(
                      "w-full justify-start text-left font-normal h-10 rounded-lg border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                      !data.issueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data.issueDate ? (
                      format(new Date(data.issueDate), "PPP", { locale: fr })
                    ) : (
                      <span>Choisir une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={data.issueDate ? new Date(data.issueDate) : undefined}
                    onSelect={(date) => updateField("issueDate", date?.toISOString().split('T')[0])}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900">
                Date d'exécution
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={!canEdit}
                    className={cn(
                      "w-full justify-start text-left font-normal h-10 rounded-lg border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                      !data.executionDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data.executionDate ? (
                      format(new Date(data.executionDate), "PPP", { locale: fr })
                    ) : (
                      <span>Choisir une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={data.executionDate ? new Date(data.executionDate) : undefined}
                    onSelect={(date) => updateField("executionDate", date?.toISOString().split('T')[0])}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-900">
              Date d'échéance
            </Label>
            <div className="grid grid-cols-2 gap-2 w-full">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={!canEdit}
                    className={cn(
                      "w-full justify-start text-left font-normal h-10 rounded-lg border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                      !data.dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data.dueDate ? (
                      format(new Date(data.dueDate), "PPP", { locale: fr })
                    ) : (
                      <span>Choisir une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={data.dueDate ? new Date(data.dueDate) : undefined}
                    onSelect={(date) => updateField("dueDate", date?.toISOString().split('T')[0])}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
              <Select
                onValueChange={(value) => {
                  const days = parseInt(value);
                  const issueDate = new Date(data.issueDate || new Date());
                  const dueDate = new Date(issueDate);
                  dueDate.setDate(dueDate.getDate() + days);
                  updateField("dueDate", dueDate.toISOString().split('T')[0]);
                }}
                disabled={!canEdit}
              >
                <SelectTrigger className="h-10 rounded-lg border-gray-300 bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 w-full">
                  <SelectValue placeholder="+" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TERMS_SUGGESTIONS.map((term) => (
                    <SelectItem key={term.value} value={term.value.toString()}>
                      {term.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-gray-500">
              Utilisez le sélecteur "+" pour ajouter des jours automatiquement
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
