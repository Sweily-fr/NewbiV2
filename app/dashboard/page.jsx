"use client";

import { ChartAreaInteractive } from "@/src/components/chart-area-interactive";
import { ChartRadarGridCircle } from "@/src/components/chart-radar-grid-circle";
import { ChartBarMultiple } from "@/src/components/ui/bar-charts";
import Comp333 from "@/src/components/comp-333";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  CloudUpload,
  FileCheck2,
  Download,
  FileClock,
  Zap,
  Monitor,
  Target,
  Scale,
} from "lucide-react";
import { useUser } from "@/src/lib/auth/hooks";
import { redirect } from "next/navigation";

export default function Dashboard() {
  const { session } = useUser();
  const expenseChartConfig = {
    visitors: {
      label: "Visitors",
    },
    desktop: {
      label: "Montant",
      color: "#2a7eff", // Rouge pour les dépenses
    },
    mobile: {
      label: "Nombre de transactions",
      color: "#2a7eff", // Rouge plus foncé
    },
  };

  const recentTransactions = [
    {
      id: 1,
      name: "Mammouth AI",
      type: "Paiement par carte",
      amount: -12.0,
      date: "18 juil. 2025",
      icon: Zap,
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      id: 2,
      name: "Jitter (SnackThis SAS)",
      type: "Prélèvement",
      amount: -19.0,
      date: "18 juil. 2025",
      icon: Monitor,
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-600",
    },
    {
      id: 3,
      name: "A WAY OUT",
      type: "Virement",
      amount: 750.0,
      date: "17 juil. 2025",
      icon: Target,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      id: 4,
      name: "ORDYAL",
      type: "Virement instantané",
      amount: -770.4,
      date: "15 juil. 2025",
      icon: Scale,
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      id: 5,
      name: "A WAY OUT",
      type: "Virement",
      amount: 750.0,
      date: "1 juil. 2025",
      icon: Target,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
  ];
  // Configuration des couleurs pour les graphiques
  const expenseChartConfigs = {
    visitors: {
      label: "Visitors",
    },
    desktop: {
      label: "Montant",
      color: "#ef4444", // Rouge pour les dépenses
    },
    mobile: {
      label: "Nombre de transactions",
      color: "#dc2626", // Rouge plus foncé
    },
  };

  const incomeChartConfig = {
    visitors: {
      label: "Visitors",
    },
    desktop: {
      label: "Montant",
      color: "#22c55e", // Vert pour les revenus
    },
    mobile: {
      label: "Nombre de transactions",
      color: "#16a34a", // Vert plus foncé
    },
  };

  // Calculer le montant total des transactions
  const totalAmount = recentTransactions.reduce(
    (sum, transaction) => sum + transaction.amount,
    0
  );

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 p-6">
      <div className="w-full mb-6">
        <p className="text-2xl font-semibold">Bonjour {session?.user?.name},</p>
      </div>
      <div className="flex flex-col gap-3 w-full">
        <Comp333
          className="w-full"
          placeholder="Rechercher des transactions ou lancer une action"
          commandPlaceholder="Rechercher des transactions ou lancer une action"
        />
        <div className="flex gap-3 w-full">
          <Button
            className="cursor-pointer"
            variant="outline"
            size="sm"
            asChild
          >
            <a href="/dashboard/outils/gestion-depenses">
              <CloudUpload />
              Créer une transaction
            </a>
          </Button>
          <Button
            className="cursor-pointer"
            variant="outline"
            size="sm"
            asChild
          >
            <a href="/dashboard/outils/factures/new">
              <FileCheck2 />
              Créer une facture
            </a>
          </Button>
          <Button
            className="cursor-pointer"
            variant="outline"
            size="sm"
            asChild
          >
            <a href="/dashboard/outils/gestion-depenses">
              <Download />
              Importer des reçus
            </a>
          </Button>
          <Button
            className="cursor-pointer"
            variant="outline"
            size="sm"
            asChild
          >
            <a href="/dashboard/outils/devis/new">
              <FileClock />
              Créer un devis
            </a>
          </Button>
          <Button
            className="cursor-pointer"
            variant="outline"
            size="sm"
            asChild
          >
            <a href="/dashboard/outils/factures/new">
              <Download />
              Importer des factures
            </a>
          </Button>
        </div>
      </div>
      <div className="flex gap-6 w-full mt-4">
        <ChartAreaInteractive
          className="shadow-xs w-1/2"
          title="Soldes"
          description={`${totalAmount >= 0 ? "+" : ""}${totalAmount.toFixed(2)} €`}
          height="250px"
          config={expenseChartConfig}
          hideMobileCurve={true}
        />
        <Card className="shadow-xs w-1/2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">
                Dernières transactions
              </CardTitle>
              <button
                onClick={() => redirect("/dashboard/outils/gestion-depenses")}
                className="text-sm cursor-pointer text-muted-foreground hover:text-foreground border-b border-transparent hover:border-current transition-colors"
              >
                Afficher tout
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentTransactions.map((transaction) => {
              const IconComponent = transaction.icon;
              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 ${transaction.bgColor} rounded-full flex items-center justify-center`}
                    >
                      <IconComponent
                        className={`h-4 w-4 ${transaction.iconColor}`}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{transaction.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-medium text-sm ${
                        transaction.amount > 0 ? "text-green-600" : ""
                      }`}
                    >
                      {transaction.amount > 0 ? "+" : ""}
                      {transaction.amount.toFixed(2)} €
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.date}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
      <div className="flex gap-6 w-full">
        <ChartAreaInteractive
          title="Entrées"
          description={`${totalAmount >= 0 ? "+" : ""}${totalAmount.toFixed(2)} €`}
          height="250px"
          className="shadow-xs w-1/2"
          config={incomeChartConfig}
          hideMobileCurve={true}
        />
        <ChartAreaInteractive
          title="Sorties"
          description={`${totalAmount >= 0 ? "+" : ""}${totalAmount.toFixed(2)} €`}
          height="250px"
          className="shadow-xs w-1/2"
          config={expenseChartConfigs}
          hideMobileCurve={true}
        />
        {/* <ChartRadarGridCircle className="shadow-xs" />
        <ChartBarMultiple className="shadow-xs" /> */}
        {/* <ChartRadarGridCircle /> */}
      </div>
    </div>
  );
}
