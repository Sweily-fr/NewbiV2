"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import InvoiceForm from "./components/invoice-form";
import InvoicePreview from "./components/invoice-preview";
import { toast } from "sonner";

// Test data for invoice
const INITIAL_INVOICE_DATA = {
  id: null,
  number: null,
  status: "DRAFT",
  type: "INVOICE",
  issueDate: new Date().toISOString().split('T')[0],
  dueDate: null,
  executionDate: null,
  purchaseOrderNumber: "",
  paymentMethod: "BANK_TRANSFER",
  client: null,
  companyInfo: null,
  items: [
    {
      description: "",
      quantity: 1,
      unitPrice: 0,
      taxRate: 20,
      total: 0
    }
  ],
  discount: 0,
  discountType: "PERCENTAGE",
  headerNotes: "",
  footerNotes: "",
  termsAndConditions: "",
  customFields: {}
};

export default function InvoiceTestPage() {
  const [invoiceData, setInvoiceData] = useState(INITIAL_INVOICE_DATA);
  const [activeTab, setActiveTab] = useState("form");

  const handleSave = async (data) => {
    try {
      console.log("Saving invoice:", data);
      setInvoiceData(data);
      toast.success("Facture sauvegardée avec succès");
      return { success: true, data };
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
      throw error;
    }
  };

  const handleSubmit = async (data) => {
    try {
      console.log("Submitting invoice:", data);
      const updatedData = { ...data, status: "SENT" };
      setInvoiceData(updatedData);
      toast.success("Facture envoyée avec succès");
      return { success: true, data: updatedData };
    } catch (error) {
      toast.error("Erreur lors de l'envoi");
      throw error;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Test des Fonctionnalités Avancées</h1>
          <p className="text-muted-foreground">
            Page de test pour valider les nouvelles fonctionnalités de l'outil factures
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <Card>
        <CardHeader>
          <div className="flex space-x-1">
            <Button
              variant={activeTab === "form" ? "default" : "outline"}
              onClick={() => setActiveTab("form")}
            >
              Formulaire & Éditeur
            </Button>
            <Button
              variant={activeTab === "preview" ? "default" : "outline"}
              onClick={() => setActiveTab("preview")}
            >
              Aperçu & PDF
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Content */}
      {activeTab === "form" && (
        <Card>
          <CardHeader>
            <CardTitle>Test du Formulaire avec Fonctionnalités Avancées</CardTitle>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>✅ Sélection de client avec recherche et auto-complétion</p>
              <p>✅ Import automatique des informations entreprise</p>
              <p>✅ Auto-complétion des produits dans les articles</p>
              <p>✅ Validation et gestion des erreurs</p>
            </div>
          </CardHeader>
          <CardContent>
            <InvoiceForm
              data={invoiceData}
              onSave={handleSave}
              onSubmit={handleSubmit}
              mode="create"
            />
          </CardContent>
        </Card>
      )}

      {activeTab === "preview" && (
        <Card>
          <CardHeader>
            <CardTitle>Test de l'Aperçu et Génération PDF</CardTitle>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>✅ Aperçu en temps réel de la facture</p>
              <p>✅ Génération PDF avec jsPDF et html2canvas</p>
              <p>✅ Téléchargement et prévisualisation PDF</p>
              <p>✅ Mise en forme professionnelle</p>
            </div>
          </CardHeader>
          <CardContent>
            <InvoicePreview 
              data={invoiceData} 
              enablePDF={true}
              className="w-full"
            />
          </CardContent>
        </Card>
      )}

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>Données de Test (Debug)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-60">
            {JSON.stringify(invoiceData, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
