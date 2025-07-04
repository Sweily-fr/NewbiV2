"use client";
import { SectionCards } from "@/src/components/section-cards";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { Badge } from "@/src/components/ui/badge";
import { InputLoader } from "@/src/components/ui/input";

export default function Outils() {
  return (
    <div className="flex flex-col p-6 md:py-6">
      <h1 className="text-2xl font-semibold mb-6">Outils</h1>
      <div className="flex flex-col gap-10 w-full">
        <div className="flex items-center justify-between gap-4 w-full">
          <Tabs
            defaultValue="outline"
            className="flex-1 flex-col justify-start gap-6"
          >
            <TabsList className="bg-[#5B4FFF]/5 **:data-[slot=badge]:bg-[#5B4FFF]/10 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
              <TabsTrigger value="outline">Tout</TabsTrigger>
              <TabsTrigger value="past-performance">
                Financier <Badge variant="secondary">3</Badge>
              </TabsTrigger>
              <TabsTrigger value="key-personnel">
                Marketing <Badge variant="secondary">2</Badge>
              </TabsTrigger>
              <TabsTrigger value="focus-documents">
                Automatisation <Badge variant="secondary">2</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex-shrink-0">
            <InputLoader
              placeholder="Rechercher des outils"
              className="w-[300px]"
            />
          </div>
        </div>
        <SectionCards />
      </div>
    </div>
  );
}
