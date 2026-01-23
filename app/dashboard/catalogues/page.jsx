"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/src/components/ui/button-group";
import { Plus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import TableProduct from "./components/table-product";
import ProductModal from "./components/product-modal";
import ProductImportDialog from "./components/product-import-dialog";
import ProductExportButton from "./components/product-export-button";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { useProducts } from "@/src/hooks/useProducts";

function CataloguesContent() {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Récupérer les produits pour l'export
  const { products: allProducts, refetch } = useProducts(1, 100, "");

  // Fonction pour ouvrir le dialogue depuis le bouton
  const handleOpenProductDialog = () => {
    setDialogOpen(true);
  };

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:flex md:flex-col md:h-[calc(100vh-64px)] overflow-hidden">
        {/* Header - Aligné comme Factures */}
        <div className="flex items-start justify-between px-4 sm:px-6 pt-4 sm:pt-6">
          <div>
            <h1 className="text-2xl font-medium mb-2">Gestion du Catalogue</h1>
          </div>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <ProductImportDialog
                      onImportComplete={refetch}
                      iconOnly
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-[#202020] text-white border-0"
                >
                  <p>Importer des produits</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <ProductExportButton products={allProducts} iconOnly />
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-[#202020] text-white border-0"
                >
                  <p>Exporter des produits</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <ButtonGroup>
              <Button
                onClick={handleOpenProductDialog}
                className="cursor-pointer font-normal bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                Ajouter un produit
              </Button>
              <ButtonGroupSeparator />
              <Button
                onClick={handleOpenProductDialog}
                size="icon"
                className="cursor-pointer bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                <Plus size={16} aria-hidden="true" />
              </Button>
            </ButtonGroup>
          </div>
        </div>

        {/* Table - Pleine largeur */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <TableProduct
            handleAddProduct={handleOpenProductDialog}
            hideHeaderButtons={true}
          />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col h-[calc(100vh-64px)] overflow-hidden">
        {/* Header mobile */}
        <div className="px-4 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-medium mb-2">Catalogue</h1>
              <p className="text-muted-foreground text-sm">
                Gérez vos produits et services
              </p>
            </div>
          </div>
        </div>

        {/* Table - Pleine largeur */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <TableProduct handleAddProduct={handleOpenProductDialog} />
        </div>

        {/* Bouton flottant mobile */}
        <Button
          onClick={handleOpenProductDialog}
          className="fixed bottom-6 bg-[#5a50ff] right-6 h-14 w-14 rounded-full shadow-lg z-50 md:hidden"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Modal unique pour desktop et mobile */}
      <ProductModal open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}

export default function Catalogues() {
  return (
    <ProRouteGuard pageName="Catalogues" requirePaidSubscription={false}>
      <CataloguesContent />
    </ProRouteGuard>
  );
}
