"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/src/components/ui/collapsible";
import {
  ChevronDown,
  LayoutGrid,
  MessageCircle,
  User,
  Phone,
  Mail,
  Building2,
  Tag,
  MapPin,
  Hash,
  Receipt,
  FileText,
  Banknote,
  Clock,
  CalendarDays,
  List,
  Tags,
  Pencil,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";

const tabTriggerClass =
  "relative rounded-md py-1.5 px-3 text-sm font-normal cursor-pointer gap-1.5 bg-transparent shadow-none text-[#606164] dark:text-muted-foreground hover:shadow-[inset_0_0_0_1px_#EEEFF1] dark:hover:shadow-[inset_0_0_0_1px_#232323] data-[state=active]:text-[#242529] dark:data-[state=active]:text-foreground after:absolute after:inset-x-1 after:-bottom-[9px] after:h-px after:rounded-full data-[state=active]:after:bg-[#242529] dark:data-[state=active]:after:bg-foreground data-[state=active]:bg-[#fbfbfb] dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-[inset_0_0_0_1px_rgb(238,239,241)] dark:data-[state=active]:shadow-[inset_0_0_0_1px_#232323]";

function SidebarSection({ title, defaultOpen = true, children }) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-3 px-5 hover:bg-muted/50 transition-colors cursor-pointer group">
        <span className="text-sm font-medium text-[#242529] dark:text-foreground">{title}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-5 pb-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function InfoRow({ icon: Icon, label, value, valueClassName }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-[7px]">
      <div className="flex items-center gap-2.5 flex-shrink-0">
        {Icon && <Icon className="h-3.5 w-3.5 text-[#505154] dark:text-muted-foreground" />}
        <span className="text-[13px] text-[#505154] dark:text-muted-foreground">{label}</span>
      </div>
      <span className={`text-[13px] text-[#242529] dark:text-foreground text-right max-w-[200px] truncate ${valueClassName || ""}`}>
        {value}
      </span>
    </div>
  );
}

export default function ClientDetailSidebar({ client, invoices = [], onEdit }) {
  const [showMore, setShowMore] = useState(false);

  const displayName =
    client.type === "INDIVIDUAL" && (client.firstName || client.lastName)
      ? `${client.firstName || ""} ${client.lastName || ""}`.trim()
      : client.name;

  const address = client.address;
  const formattedAddress = useMemo(() => {
    if (!address) return null;
    const parts = [
      address.street,
      [address.postalCode, address.city].filter(Boolean).join(" "),
      address.country,
    ].filter(Boolean);
    return parts.join(", ");
  }, [address]);

  const clientInvoices = useMemo(
    () => invoices.filter((inv) => inv.client?.id === client.id),
    [invoices, client.id]
  );

  const invoiceStats = useMemo(() => {
    const total = clientInvoices.reduce(
      (sum, inv) => sum + (inv.finalTotalTTC || inv.totalTTC || 0),
      0
    );
    const pending = clientInvoices
      .filter((inv) => inv.status === "PENDING")
      .reduce(
        (sum, inv) => sum + (inv.finalTotalTTC || inv.totalTTC || 0),
        0
      );
    return { count: clientInvoices.length, total, pending };
  }, [clientInvoices]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);

  const createdDate = useMemo(() => {
    if (!client.createdAt) return null;
    try {
      return format(new Date(client.createdAt), "d MMM yyyy, HH:mm", { locale: fr });
    } catch {
      return null;
    }
  }, [client.createdAt]);

  const commentsCount = client?.comments?.length || 0;

  return (
    <div className="w-[460px] border-l border-[#eeeff1] dark:border-[#232323] hidden lg:flex flex-col flex-shrink-0 overflow-hidden sidebar-tabs">
      <style>{`
        .sidebar-tabs [data-slot="tabs-trigger"][data-state="active"] {
          text-shadow: 0.015em 0 currentColor, -0.015em 0 currentColor;
        }
      `}</style>
      <Tabs defaultValue="details" className="flex flex-col flex-1 min-h-0">
        <div className="flex-shrink-0 border-b border-[#eeeff1] dark:border-[#232323] pt-2 pb-[9px]">
          <TabsList className="h-auto rounded-none bg-transparent p-0 w-full justify-start px-4 gap-1.5">
            <TabsTrigger value="details" className={tabTriggerClass}>
              <LayoutGrid className="h-3.5 w-3.5" />
              Détails
            </TabsTrigger>
            <TabsTrigger value="comments" className={tabTriggerClass}>
              <MessageCircle className="h-3.5 w-3.5" />
              Commentaires
              {commentsCount > 0 && (
                <span className="text-[10px] leading-none bg-gray-100 dark:bg-gray-800 text-muted-foreground rounded px-1 py-0.5">
                  {commentsCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="details"
          className="flex-1 min-h-0 mt-0 overflow-y-auto data-[state=inactive]:hidden"
        >
          {/* Contact information */}
          <div className="flex items-center justify-between px-5 pt-3">
            <span className="text-sm font-medium text-[#242529] dark:text-foreground">Informations</span>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 cursor-pointer font-normal text-xs h-7"
              onClick={onEdit}
            >
              <Pencil className="h-3 w-3" />
              Modifier
            </Button>
          </div>
          <SidebarSection title="Informations de contact" defaultOpen>
            <div className="space-y-0">
              <InfoRow icon={User} label="Nom complet" value={displayName} />
              <InfoRow icon={Phone} label="Téléphone" value={client.phone} />
              <InfoRow icon={Mail} label="Email" value={client.email} />
              {client.type === "COMPANY" && (
                <InfoRow icon={Building2} label="Entreprise" value={client.name} />
              )}
              <div className="flex items-center justify-between py-[7px]">
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <Tag className="h-3.5 w-3.5 text-[#505154] dark:text-muted-foreground" />
                  <span className="text-[13px] text-[#505154] dark:text-muted-foreground">Type</span>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
                    client.type === "COMPANY"
                      ? "bg-[#5a50ff]/10 text-[#5a50ff] dark:bg-[#5a50ff]/20 dark:text-[#5a50ff]"
                      : "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                  }`}
                >
                  {client.type === "COMPANY" ? (
                    <Building2 className="w-3 h-3" />
                  ) : (
                    <User className="w-3 h-3" />
                  )}
                  {client.type === "COMPANY" ? "Entreprise" : "Particulier"}
                </span>
              </div>
              {showMore && (
                <>
                  <InfoRow icon={MapPin} label="Adresse" value={formattedAddress} />
                  <InfoRow icon={Hash} label="SIRET" value={client.siret} />
                  <InfoRow icon={Receipt} label="N° TVA" value={client.vatNumber} />
                </>
              )}
            </div>
            <button
              onClick={() => setShowMore(!showMore)}
              className="text-[13px] text-[#5a50ff] hover:underline mt-3 cursor-pointer"
            >
              {showMore ? "Voir moins" : "Voir plus"} {showMore ? "↑" : "↓"}
            </button>
          </SidebarSection>

          <div className="border-t border-[#eeeff1] dark:border-[#232323]" />

          {/* Facturation */}
          <SidebarSection title="Facturation" defaultOpen>
            <div className="space-y-0">
              <InfoRow
                icon={FileText}
                label="Factures"
                value={invoiceStats.count.toString()}
              />
              <InfoRow
                icon={Banknote}
                label="Total facturé"
                value={formatCurrency(invoiceStats.total)}
              />
              <InfoRow
                icon={Clock}
                label="En attente"
                value={formatCurrency(invoiceStats.pending)}
              />
            </div>
          </SidebarSection>

          <div className="border-t border-[#eeeff1] dark:border-[#232323]" />

          {/* Détails */}
          <SidebarSection title="Détails" defaultOpen>
            <div className="space-y-0">
              <InfoRow icon={CalendarDays} label="Contact ajouté" value={createdDate} />
              {client.lists && client.lists.length > 0 && (
                <div className="flex items-center justify-between py-[7px]">
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <List className="h-3.5 w-3.5 text-[#505154] dark:text-muted-foreground" />
                    <span className="text-[13px] text-[#505154] dark:text-muted-foreground">Listes</span>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                    {client.lists.map((list) => (
                      <span key={list.id || list.name} className="text-[13px] text-[#242529] dark:text-foreground">
                        {list.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {client.tags && client.tags.length > 0 && (
                <div className="flex items-center justify-between py-[7px]">
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <Tags className="h-3.5 w-3.5 text-[#505154] dark:text-muted-foreground" />
                    <span className="text-[13px] text-[#505154] dark:text-muted-foreground">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                    {client.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs font-normal">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SidebarSection>
        </TabsContent>

        <TabsContent
          value="comments"
          className="flex-1 min-h-0 mt-0 overflow-y-auto data-[state=inactive]:hidden"
        >
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Aucun commentaire pour le moment
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
