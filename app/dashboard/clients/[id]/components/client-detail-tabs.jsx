"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import {
  Activity,
  StickyNote,
  FileText,
  ClipboardList,
  Package,
} from "lucide-react";
import ClientActivityTab from "./client-activity-tab";
import ClientNotesTab from "./client-notes-tab";
import ClientInvoicesTab from "./client-invoices-tab";
import ClientQuotesTab from "./client-quotes-tab";
import ClientPurchaseOrdersTab from "./client-purchase-orders-tab";

const tabTriggerClass =
  "relative rounded-md py-1.5 px-3 text-sm font-normal cursor-pointer gap-1.5 bg-transparent shadow-none text-[#606164] dark:text-muted-foreground hover:shadow-[inset_0_0_0_1px_#EEEFF1] dark:hover:shadow-[inset_0_0_0_1px_#232323] data-[state=active]:text-[#242529] dark:data-[state=active]:text-foreground after:absolute after:inset-x-1 after:-bottom-[9px] after:h-px after:rounded-full data-[state=active]:after:bg-[#242529] dark:data-[state=active]:after:bg-foreground data-[state=active]:bg-[#fbfbfb] dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-[inset_0_0_0_1px_rgb(238,239,241)] dark:data-[state=active]:shadow-[inset_0_0_0_1px_#232323]";


export default function ClientDetailTabs({
  client,
  invoices = [],
  quotes = [],
  purchaseOrders = [],
  workspaceId,
  onClientUpdate,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const validTabs = ["activity", "notes", "invoices", "quotes", "purchaseorders"];
  const tabParam = searchParams.get("tab");
  const activeTab = validTabs.includes(tabParam) ? tabParam : "activity";

  const setActiveTab = (tab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "activity") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const query = params.toString();
    router.replace(`?${query}`, { scroll: false });
  };

  const clientInvoicesCount = useMemo(
    () => invoices.filter((inv) => inv.client?.id === client.id).length,
    [invoices, client.id]
  );

  const clientQuotesCount = useMemo(
    () => quotes.filter((q) => q.client?.id === client.id).length,
    [quotes, client.id]
  );

  const clientPurchaseOrdersCount = useMemo(
    () => purchaseOrders.filter((po) => po.client?.id === client.id).length,
    [purchaseOrders, client.id]
  );

  const notesCount = client?.notes?.length || 0;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0 client-detail-tabs">
      <style>{`
        .client-detail-tabs [data-slot="tabs-trigger"][data-state="active"] {
          text-shadow: 0.015em 0 currentColor, -0.015em 0 currentColor;
        }
      `}</style>
      <div className="flex-shrink-0 border-b border-[#eeeff1] dark:border-[#232323] pt-2 pb-[9px]">
        <TabsList className="h-auto rounded-none bg-transparent p-0 w-full justify-start px-4 sm:px-6 gap-1.5">
          <TabsTrigger value="activity" className={tabTriggerClass}>
            <Activity className="h-3.5 w-3.5" />
            Activité
          </TabsTrigger>
          <TabsTrigger value="notes" className={tabTriggerClass}>
            <StickyNote className="h-3.5 w-3.5" />
            Notes
            {notesCount > 0 && (
              <span className="text-[10px] leading-none bg-gray-100 dark:bg-gray-800 text-muted-foreground rounded px-1 py-0.5">
                {notesCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="invoices" className={tabTriggerClass}>
            <FileText className="h-3.5 w-3.5" />
            Factures
            {clientInvoicesCount > 0 && (
              <span className="text-[10px] leading-none bg-gray-100 dark:bg-gray-800 text-muted-foreground rounded px-1 py-0.5">
                {clientInvoicesCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="quotes" className={tabTriggerClass}>
            <ClipboardList className="h-3.5 w-3.5" />
            Devis
            {clientQuotesCount > 0 && (
              <span className="text-[10px] leading-none bg-gray-100 dark:bg-gray-800 text-muted-foreground rounded px-1 py-0.5">
                {clientQuotesCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="purchaseorders" className={tabTriggerClass}>
            <Package className="h-3.5 w-3.5" />
            Bons de commande
            {clientPurchaseOrdersCount > 0 && (
              <span className="text-[10px] leading-none bg-gray-100 dark:bg-gray-800 text-muted-foreground rounded px-1 py-0.5">
                {clientPurchaseOrdersCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent
        value="activity"
        className="flex-1 min-h-0 mt-0 overflow-hidden data-[state=inactive]:hidden"
      >
        <ClientActivityTab client={client} />
      </TabsContent>

      <TabsContent
        value="notes"
        className="flex-1 min-h-0 mt-0 overflow-hidden data-[state=inactive]:hidden"
      >
        <ClientNotesTab
          client={client}
          workspaceId={workspaceId}
          onClientUpdate={onClientUpdate}
        />
      </TabsContent>

      <TabsContent
        value="invoices"
        className="flex-1 min-h-0 mt-0 overflow-auto data-[state=inactive]:hidden"
      >
        <ClientInvoicesTab invoices={invoices} clientId={client.id} />
      </TabsContent>

      <TabsContent
        value="quotes"
        className="flex-1 min-h-0 mt-0 overflow-auto data-[state=inactive]:hidden"
      >
        <ClientQuotesTab quotes={quotes} clientId={client.id} />
      </TabsContent>

      <TabsContent
        value="purchaseorders"
        className="flex-1 min-h-0 mt-0 overflow-auto data-[state=inactive]:hidden"
      >
        <ClientPurchaseOrdersTab purchaseOrders={purchaseOrders} clientId={client.id} />
      </TabsContent>
    </Tabs>
  );
}
