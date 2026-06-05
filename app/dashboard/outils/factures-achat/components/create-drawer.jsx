"use client";

import { useEffect, useState } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/src/components/ui/drawer";
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Button } from "@/src/components/ui/button";
import { X, Edit3, Upload } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { PurchaseInvoiceDetailDrawer } from "./detail-drawer";
import { PurchaseInvoiceUploadDrawer } from "./upload-drawer";

/**
 * Drawer unifié de création d'une facture d'achat.
 * Combine la saisie manuelle et l'import OCR sous un seul drawer avec des
 * onglets en haut. Les deux flux existants sont réutilisés en mode `embedded`
 * (rendu sans leur propre coquille Drawer). L'onglet "Saisie manuelle" est
 * actif par défaut.
 */
export function PurchaseInvoiceCreateDrawer({
  open,
  onOpenChange,
  initialTab = "manual",
  onCreated,
}) {
  const [tab, setTab] = useState(initialTab);

  // Réaligne l'onglet actif sur celui demandé à chaque (ré)ouverture.
  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent
        className="w-full h-full md:w-[500px] md:max-w-[500px] md:min-w-[500px] md:h-auto"
        style={{ width: "100vw", height: "100vh" }}
      >
        {/* Header + onglets */}
        <DrawerHeader className="px-6 py-4 border-b gap-3">
          <div className="flex flex-row items-center justify-between">
            <DrawerTitle className="text-base font-medium">
              Nouvelle facture d&apos;achat
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">
                <Edit3 className="h-4 w-4" />
                Saisie manuelle
              </TabsTrigger>
              <TabsTrigger value="ocr">
                <Upload className="h-4 w-4" />
                Importer (OCR)
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </DrawerHeader>

        {/* Corps — les deux flux restent montés (état préservé entre onglets),
            seul l'onglet actif est visible. */}
        <div className="flex-1 min-h-0">
          <div className={cn("h-full", tab !== "manual" && "hidden")}>
            <PurchaseInvoiceDetailDrawer
              embedded
              open={open}
              onOpenChange={onOpenChange}
              invoice={null}
              mode="create"
              onSaved={onCreated}
            />
          </div>
          <div className={cn("h-full", tab !== "ocr" && "hidden")}>
            <PurchaseInvoiceUploadDrawer
              embedded
              open={open}
              onOpenChange={onOpenChange}
              onUploaded={onCreated}
            />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
