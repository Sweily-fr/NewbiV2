import { ScanEye, LayoutDashboard, Palette, Columns3Cog } from "lucide-react";

import { ScrollArea, ScrollBar } from "@/src/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { Button } from "@/src/components/ui/button";

// Import du composant LayoutTab pour l'onglet 1
import LayoutTab from "./layout-tab/layout-tab";
import LayoutTabTypography from "./tab-typography/layout-tab";
import LayoutTabImg from "./layout-img/layout-tab";
import SignatureManager from "./SignatureManager";
// import { LayoutTab } from "./layout-tab";
// import { LayoutTabTypography } from "./tab-typography/layout-tab";

export function TabSignature() {
  return (
    <div className="flex flex-col h-full">
      <Tabs defaultValue="tab-1" className="flex flex-col h-full">
        {/* Header fixe avec les onglets */}
        <div className="flex-shrink-0 p-5 pb-0">
          <ScrollArea className="w-full">
            <TabsList className="mb-3 w-full">
              <TabsTrigger value="tab-1">
                <LayoutDashboard size={16} aria-hidden="true" />
              </TabsTrigger>
              <TabsTrigger value="tab-2" className="group">
                <Palette size={16} aria-hidden="true" />
              </TabsTrigger>
              <TabsTrigger value="tab-3" className="group">
                <ScanEye size={16} aria-hidden="true" />
              </TabsTrigger>
              {/* <TabsTrigger value="tab-4" className="group">
                <Columns3Cog size={16} aria-hidden="true" />
              </TabsTrigger> */}
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto px-5 max-h-[calc(100vh-9.5rem)]">
          <TabsContent value="tab-1" className="w-full mt-0">
            <LayoutTab />
          </TabsContent>
          <TabsContent value="tab-2" className="w-full mt-0">
            <LayoutTabTypography />
          </TabsContent>
          <TabsContent value="tab-3" className="w-full mt-0">
            <LayoutTabImg />
          </TabsContent>
          <TabsContent value="tab-4" className="w-full mt-0">
            <SignatureManager />
          </TabsContent>
        </div>
      </Tabs>

      {/* Footer fixe avec les boutons */}
      <div className="flex-shrink-0 py-4 mx-4 border-t">
        <div className="flex justify-between">
          <Button variant="outline" className="cursor-pointer">
            Annuler
          </Button>
          <Button className="cursor-pointer">Sauvegarder</Button>
        </div>
      </div>
    </div>
  );
}
