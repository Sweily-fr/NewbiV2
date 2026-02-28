"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Plus, Upload, Settings2 } from "lucide-react";
import TableProduct from "./components/table-product";
import ProductModal from "./components/product-modal";
import ProductImportDialog from "./components/product-import-dialog";
import ProductExportButton from "./components/product-export-button";
import ProductCustomFieldsManager from "./components/product-custom-fields-manager";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { useProducts } from "@/src/hooks/useProducts";

function CataloguesContent() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [customFieldsOpen, setCustomFieldsOpen] = useState(false);

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
            <Button
              variant="outline"
              onClick={() => setCustomFieldsOpen(true)}
              className="cursor-pointer"
            >
              <Settings2 size={14} strokeWidth={1.5} />
              Champs
            </Button>
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(true)}
              className="cursor-pointer"
            >
              <Upload size={14} strokeWidth={1.5} />
              Importer
            </Button>
            <ProductExportButton products={allProducts} iconOnly={false} />
            <Button
              variant="primary"
              onClick={handleOpenProductDialog}
              className="cursor-pointer"
            >
              <Plus size={14} strokeWidth={2} aria-hidden="true" />
              Ajouter un produit
            </Button>
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
      <ProductImportDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />
      <ProductCustomFieldsManager open={customFieldsOpen} onOpenChange={setCustomFieldsOpen} />
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
