"use client";
import { useState } from "react";
import FormSettings from "./formSettings";
import CompanyInfo from "./companyForm";
import { SettingsSidebar } from "@/src/components/settings-sidebar";
import { Separator } from "@/src/components/ui/separator";
import AdressInfo from "./adressInfo";
import BankForm from "./bankForm";
import LegalForm from "./legalForm";
import SecurityView from "./securityView";
// Composants pour chaque vue
const EntrepriseView = () => (
  <div>
    <CompanyInfo />
  </div>
);

const AdresseView = () => (
  <div>
    <AdressInfo />
  </div>
);

const CoordonneesBancairesView = () => (
  <div>
    <BankForm />
  </div>
);

const InformationsLegalesView = () => (
  <div>
    <LegalForm />
  </div>
);
const SecurityViews = () => (
  <div>
    <SecurityView />
  </div>
);

export default function Settings() {
  const [activeTab, setActiveTab] = useState("entreprise");

  // Fonction pour rendre la vue appropriée en fonction de l'onglet actif
  const renderActiveView = () => {
    switch (activeTab) {
      case "entreprise":
        return <EntrepriseView />;
      case "adresse":
        return <AdresseView />;
      case "coordonnees-bancaires":
        return <CoordonneesBancairesView />;
      case "informations-legales":
        return <InformationsLegalesView />;
      case "security":
        return <SecurityViews />;
      default:
        return <EntrepriseView />;
    }
  };

  return (
    <div className="flex gap-6 p-8">
      <div className="w-64 pt-6">
        <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      <Separator orientation="vertical" className="h-full w-px bg-border" />
      <div className="flex-1 pt-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Titre de la section</h1>
          <p className="text-sm text-muted-foreground">
            Sous-titre de la section
          </p>
          <Separator className="h-full w-px bg-border mb-6 mt-6" />
        </div>
        {renderActiveView()}
      </div>
    </div>
  );
}
