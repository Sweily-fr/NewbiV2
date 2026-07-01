"use client";

import { useState } from "react";
import { useApolloClient } from "@apollo/client";
import { FileSpreadsheet, FileText, Download, Loader2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { toast } from "@/src/components/ui/sonner";
import { GET_CLIENTS } from "@/src/graphql/queries/clients";
import { exportToCSV, exportToExcel } from "@/src/utils/client-export";

// Taille de page utilisée pour récupérer tous les contacts du workspace.
const EXPORT_PAGE_SIZE = 200;

export default function ClientExportButton({ workspaceId, iconOnly = false }) {
  const apolloClient = useApolloClient();
  const [isExporting, setIsExporting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Récupère l'intégralité des contacts du workspace en parcourant les pages.
  const fetchAllClients = async () => {
    const all = [];
    let page = 1;
    let totalPages = 1;

    do {
      const { data } = await apolloClient.query({
        query: GET_CLIENTS,
        variables: { workspaceId, page, limit: EXPORT_PAGE_SIZE },
        fetchPolicy: "network-only",
      });
      const result = data?.clients;
      if (!result) break;
      all.push(...(result.items || []));
      totalPages = result.totalPages || 1;
      page += 1;
    } while (page <= totalPages);

    return all;
  };

  const handleFormatSelect = async (formatType) => {
    if (!workspaceId || isExporting) return;
    setDropdownOpen(false);
    setIsExporting(true);
    const toastId = toast.loading("Préparation de l'export...");

    try {
      const clients = await fetchAllClients();
      if (clients.length === 0) {
        toast.error("Aucun contact à exporter");
        return;
      }

      const result =
        formatType === "csv" ? exportToCSV(clients) : exportToExcel(clients);

      if (result?.success) {
        toast.success(`${clients.length} contact(s) exporté(s)`);
      } else {
        toast.error(result?.error || "Erreur lors de l'export");
      }
    } catch (error) {
      toast.error(error?.message || "Erreur lors de l'export");
    } finally {
      // Le toast de chargement a une durée infinie : on le ferme manuellement.
      toast.dismiss(toastId);
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <DropdownMenuTrigger asChild>
        {iconOnly ? (
          <Button
            variant="outline"
            size="icon"
            className="cursor-pointer"
            disabled={isExporting || !workspaceId}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <Button
            variant="outline"
            className="self-start gap-1.5 cursor-pointer"
            disabled={isExporting || !workspaceId}
          >
            {isExporting ? (
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            ) : (
              <Download size={14} strokeWidth={2} aria-hidden="true" />
            )}
            Exporter
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[220px]">
        <DropdownMenuLabel>Formats standards</DropdownMenuLabel>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => handleFormatSelect("csv")}
        >
          <FileText className="mr-2 h-4 w-4 text-green-500" />
          CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => handleFormatSelect("excel")}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
          Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
