"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/src/components/ui/collapsible";
import {
  ChevronDown,
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
  Type,
  AlignLeft,
  Calendar,
  CheckSquare,
  CheckCircle,
  Link,
  ShieldOff,
  MessageSquare,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { useClientCustomFields } from "@/src/hooks/useClientCustomFields";
import { useClientListsByClient } from "@/src/hooks/useClientLists";

function SidebarSection({ title, defaultOpen = true, children }) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-3 px-5 hover:bg-muted/50 transition-colors cursor-pointer group">
        <span className="text-sm font-medium text-[#242529] dark:text-foreground">
          {title}
        </span>
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
        {Icon && (
          <Icon className="h-3.5 w-3.5 text-[#505154] dark:text-muted-foreground" />
        )}
        <span className="text-[13px] text-[#505154] dark:text-muted-foreground">
          {label}
        </span>
      </div>
      <span
        className={`text-[13px] text-[#242529] dark:text-foreground text-right max-w-[200px] truncate ${valueClassName || ""}`}
      >
        {value}
      </span>
    </div>
  );
}

const CUSTOM_FIELD_ICONS = {
  TEXT: Type,
  TEXTAREA: AlignLeft,
  NUMBER: Hash,
  DATE: Calendar,
  SELECT: ChevronDown,
  MULTISELECT: CheckSquare,
  CHECKBOX: CheckCircle,
  URL: Link,
  EMAIL: Mail,
  PHONE: Phone,
};

function formatCustomFieldValue(field, value) {
  if (value === null || value === undefined || value === "") return null;

  switch (field.fieldType) {
    case "CHECKBOX":
      return value === true || value === "true" ? "Oui" : "Non";
    case "DATE": {
      try {
        const [year, month, day] = String(value).split("-").map(Number);
        if (!year || !month || !day) return String(value);
        return format(new Date(year, month - 1, day), "d MMM yyyy", {
          locale: fr,
        });
      } catch {
        return String(value);
      }
    }
    case "SELECT": {
      const option = field.options?.find((o) => o.value === value);
      return option?.label || String(value);
    }
    case "MULTISELECT": {
      let values = value;
      if (typeof value === "string") {
        try {
          values = JSON.parse(value);
        } catch {
          values = [value];
        }
      }
      if (!Array.isArray(values) || values.length === 0) return null;
      return values;
    }
    default:
      return String(value);
  }
}

export default function ClientDetailSidebar({
  client,
  invoices = [],
  workspaceId,
  onEdit,
}) {
  const [showMore, setShowMore] = useState(false);
  const { fields: customFieldDefs } = useClientCustomFields(workspaceId);
  const { lists: clientLists } = useClientListsByClient(
    workspaceId,
    client?.id,
  );

  const customFieldsDisplay = useMemo(() => {
    if (!client?.customFields?.length || !customFieldDefs?.length) return [];
    return client.customFields
      .map((cf) => {
        const fieldDef = customFieldDefs.find((f) => f.id === cf.fieldId);
        if (!fieldDef || !fieldDef.isActive) return null;
        const formatted = formatCustomFieldValue(fieldDef, cf.value);
        if (formatted === null) return null;
        return { fieldDef, value: formatted };
      })
      .filter(Boolean)
      .sort((a, b) => (a.fieldDef.order ?? 0) - (b.fieldDef.order ?? 0));
  }, [client?.customFields, customFieldDefs]);

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
    [invoices, client.id],
  );

  const invoiceStats = useMemo(() => {
    const total = clientInvoices.reduce(
      (sum, inv) => sum + (inv.finalTotalTTC || inv.totalTTC || 0),
      0,
    );
    const pending = clientInvoices
      .filter((inv) => inv.status === "PENDING")
      .reduce((sum, inv) => sum + (inv.finalTotalTTC || inv.totalTTC || 0), 0);
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
      return format(new Date(client.createdAt), "d MMM yyyy, HH:mm", {
        locale: fr,
      });
    } catch {
      return null;
    }
  }, [client.createdAt]);

  const blockedDate = useMemo(() => {
    if (!client.blockedAt) return null;
    try {
      return format(new Date(client.blockedAt), "d MMM yyyy, HH:mm", {
        locale: fr,
      });
    } catch {
      return null;
    }
  }, [client.blockedAt]);

  return (
    <div className="w-[460px] border-l border-[#eeeff1] dark:border-[#232323] hidden lg:flex flex-col flex-shrink-0 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Contact information */}
        <div className="flex items-center justify-between px-5 pt-3">
          <span className="text-sm font-medium text-[#242529] dark:text-foreground">
            Détails
          </span>
          <Button variant="outline" onClick={onEdit}>
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
              <InfoRow
                icon={Building2}
                label="Entreprise"
                value={client.name}
              />
            )}
            <div className="flex items-center justify-between py-[7px]">
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <Tag className="h-3.5 w-3.5 text-[#505154] dark:text-muted-foreground" />
                <span className="text-[13px] text-[#505154] dark:text-muted-foreground">
                  Type
                </span>
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
                <InfoRow
                  icon={MapPin}
                  label="Adresse"
                  value={formattedAddress}
                />
                <InfoRow icon={Hash} label="SIRET" value={client.siret} />
                <InfoRow
                  icon={Receipt}
                  label="N° TVA"
                  value={client.vatNumber}
                />
                {customFieldsDisplay.map(({ fieldDef, value }) => {
                  const FieldIcon =
                    CUSTOM_FIELD_ICONS[fieldDef.fieldType] || Type;
                  return fieldDef.fieldType === "MULTISELECT" &&
                    Array.isArray(value) ? (
                    <div
                      key={fieldDef.id}
                      className="flex items-center justify-between py-[7px]"
                    >
                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        <FieldIcon className="h-3.5 w-3.5 text-[#505154] dark:text-muted-foreground" />
                        <span className="text-[13px] text-[#505154] dark:text-muted-foreground">
                          {fieldDef.name}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                        {value.map((val) => {
                          const option = fieldDef.options?.find(
                            (o) => o.value === val,
                          );
                          return (
                            <Badge
                              key={val}
                              variant="outline"
                              className="text-xs font-normal"
                            >
                              {option?.label || val}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  ) : fieldDef.fieldType === "URL" ? (
                    <div
                      key={fieldDef.id}
                      className="flex items-center justify-between py-[7px]"
                    >
                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        <FieldIcon className="h-3.5 w-3.5 text-[#505154] dark:text-muted-foreground" />
                        <span className="text-[13px] text-[#505154] dark:text-muted-foreground">
                          {fieldDef.name}
                        </span>
                      </div>
                      <a
                        href={
                          String(value).startsWith("http")
                            ? value
                            : `https://${value}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] text-[#5a50ff] hover:underline text-right max-w-[200px] truncate"
                      >
                        {value}
                      </a>
                    </div>
                  ) : (
                    <InfoRow
                      key={fieldDef.id}
                      icon={FieldIcon}
                      label={fieldDef.name}
                      value={value}
                    />
                  );
                })}
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

        {client.isBlocked && (
          <>
            <div className="border-t border-[#eeeff1] dark:border-[#232323]" />
            <SidebarSection title="Blocage" defaultOpen>
              <div className="space-y-0">
                <div className="flex items-center justify-between py-[7px]">
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <ShieldOff className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                    <span className="text-[13px] text-[#505154] dark:text-muted-foreground">
                      Statut
                    </span>
                  </div>
                  <span className="inline-flex items-center rounded-md bg-red-50 dark:bg-red-950 px-2 py-0.5 text-[11px] font-medium text-red-600 dark:text-red-400 ring-1 ring-inset ring-red-200 dark:ring-red-900">
                    Bloqué
                  </span>
                </div>
                {blockedDate && (
                  <InfoRow
                    icon={CalendarDays}
                    label="Bloqué le"
                    value={blockedDate}
                  />
                )}
                {client.blockedReason && (
                  <div className="py-[7px]">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-[#505154] dark:text-muted-foreground" />
                      <span className="text-[13px] text-[#505154] dark:text-muted-foreground">
                        Raison
                      </span>
                    </div>
                    <p className="text-[13px] text-[#242529] dark:text-foreground whitespace-pre-wrap leading-relaxed pl-6">
                      {client.blockedReason}
                    </p>
                  </div>
                )}
              </div>
            </SidebarSection>
          </>
        )}

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
            <InfoRow
              icon={CalendarDays}
              label="Contact ajouté"
              value={createdDate}
            />
            {clientLists && clientLists.length > 0 && (
              <div className="flex items-start justify-between py-[7px]">
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <List className="h-3.5 w-3.5 text-[#505154] dark:text-muted-foreground" />
                  <span className="text-[13px] text-[#505154] dark:text-muted-foreground">
                    Listes
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 justify-end max-w-[260px]">
                  {clientLists.map((list) => (
                    <Badge
                      key={list.id}
                      variant="outline"
                      className="text-xs font-normal"
                      style={
                        list.color
                          ? {
                              borderColor: `${list.color}40`,
                              color: list.color,
                              backgroundColor: `${list.color}10`,
                            }
                          : undefined
                      }
                    >
                      {list.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {client.tags && client.tags.length > 0 && (
              <div className="flex items-center justify-between py-[7px]">
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <Tags className="h-3.5 w-3.5 text-[#505154] dark:text-muted-foreground" />
                  <span className="text-[13px] text-[#505154] dark:text-muted-foreground">
                    Tags
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                  {client.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-xs font-normal"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SidebarSection>
      </div>
    </div>
  );
}
