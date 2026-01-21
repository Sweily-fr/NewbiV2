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
      {/* Layout - Pleine largeur */}
      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
        {/* Header - Aligné comme Signature de mail */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 flex-shrink-0">
          <h1 className="text-2xl font-medium mb-2">Gestion du Catalogue</h1>
          <p className="text-muted-foreground text-sm">
            Gérez efficacement vos produits et services en un seul endroit.
          </p>
        </div>

        {/* Table - Pleine largeur */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <TableProduct handleAddProduct={handleOpenProductDialog} />
        </div>
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
