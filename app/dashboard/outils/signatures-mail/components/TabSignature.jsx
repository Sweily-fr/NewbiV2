import { ScanEye, LayoutDashboard, Palette, Columns3Cog } from "lucide-react";

import { ScrollArea, ScrollBar } from "@/src/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";

// Import du composant LayoutTab pour l'onglet 1
import LayoutTab from "./layout-tab/layout-tab";
import LayoutTabTypography from "./tab-typography/layout-tab";
import LayoutTabImg from "./layout-img/layout-tab";
import SignatureManager from "./SignatureManager";
// import { LayoutTab } from "./layout-tab";
// import { LayoutTabTypography } from "./tab-typography/layout-tab";

export function TabSignature() {
  return (
    <Tabs defaultValue="tab-1" className="w-full">
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
          <TabsTrigger value="tab-4" className="group">
            <Columns3Cog size={16} aria-hidden="true" />
          </TabsTrigger>
        </TabsList>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      <TabsContent value="tab-1" className="w-full max-h-[calc(100vh-200px)] overflow-y-auto">
        <LayoutTab />
      </TabsContent>
      <TabsContent value="tab-2" className="w-full max-h-[calc(100vh-200px)] overflow-y-auto">
        <LayoutTabTypography />
      </TabsContent>
      <TabsContent value="tab-3" className="w-full max-h-[calc(100vh-200px)] overflow-y-auto">
        <LayoutTabImg />
      </TabsContent>
      <TabsContent value="tab-4" className="w-full max-h-[calc(100vh-200px)] overflow-y-auto">
        <SignatureManager />
      </TabsContent>
    </Tabs>
  );
}
