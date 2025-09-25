"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Plus } from "lucide-react";
import TableProduct from "./components/table-product";
import ProductModal from "./components/product-modal";
import { ProRouteGuard } from "@/src/components/pro-route-guard";

function CataloguesContent() {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fonction pour ouvrir le dialogue depuis le bouton dans TableProduct
  const handleOpenProductDialog = () => {
    setDialogOpen(true);
  };

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:block space-y-6 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium mb-2">Gestion du Catalogue</h1>
            <p className="text-muted-foreground text-sm">
              Gérez efficacement vos produits et services en un seul endroit.
            </p>
          </div>
        </div>
        <TableProduct handleAddProduct={handleOpenProductDialog} />
        <ProductModal open={dialogOpen} onOpenChange={setDialogOpen} />
      </div>

      {/* Mobile Layout - Style Notion */}
      <div className="md:hidden">
        {/* Header - Style Notion sur mobile */}
        <div className="px-4 py-6">
          <div>
            <h1 className="text-2xl font-medium mb-2">Catalogue</h1>
            <p className="text-muted-foreground text-sm">
              Gérez efficacement vos produits et services en un seul endroit.
            </p>
          </div>
        </div>

        {/* Table */}
        <TableProduct handleAddProduct={handleOpenProductDialog} />
        <ProductModal open={dialogOpen} onOpenChange={setDialogOpen} />

        {/* Bouton flottant mobile */}
        <Button
          onClick={handleOpenProductDialog}
          className="fixed bottom-6 bg-[#5a50ff] right-6 h-14 w-14 rounded-full shadow-lg z-50 md:hidden"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </>
  );
}

export default function Catalogues() {
  return (
    <ProRouteGuard pageName="Catalogues">
      <CataloguesContent />
    </ProRouteGuard>
  );
}
