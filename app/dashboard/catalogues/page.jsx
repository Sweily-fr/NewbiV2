"use client";

import { useState } from "react";
import TableProduct from "./components/table-product";
import ProductModal from "./components/product-modal";

export default function Catalogues() {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fonction pour ouvrir le dialogue depuis le bouton dans TableProduct
  const handleOpenProductDialog = () => {
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
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
  );
}
