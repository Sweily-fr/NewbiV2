"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import {
  Type,
  User,
  Building2,
  Minus,
  Space,
  Share2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Plus,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { WIDGET_TYPES, WIDGET_PALETTE, createWidget } from "../../utils/widget-registry";

// Icon mapping
const ICONS = {
  Type: Type,
  User: User,
  Building2: Building2,
  Minus: Minus,
  Space: Space,
  Share2: Share2,
  Phone: Phone,
  Mail: Mail,
  Globe: Globe,
  MapPin: MapPin,
};

/**
 * Draggable widget item in the palette
 */
function PaletteItem({ type, label, icon, description, onAdd }) {
  const IconComponent = ICONS[icon] || Plus;

  return (
    <button
      onClick={() => onAdd(type)}
      className={cn(
        "flex items-center gap-3 w-full p-3 rounded-lg",
        "bg-neutral-50 dark:bg-neutral-900",
        "hover:bg-neutral-100 dark:hover:bg-neutral-800",
        "border border-neutral-200 dark:border-neutral-800",
        "transition-colors cursor-pointer",
        "text-left"
      )}
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-md bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
        <IconComponent className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {label}
        </div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
          {description}
        </div>
      </div>
      <Plus className="w-4 h-4 text-neutral-400 flex-shrink-0" />
    </button>
  );
}

/**
 * Quick add buttons for common fields
 */
function QuickAddSection({ onAddField, signatureData }) {
  const fields = [
    { id: "fullName", label: "Nom", icon: User, hasValue: !!signatureData?.fullName },
    { id: "position", label: "Poste", icon: Type, hasValue: !!signatureData?.position },
    { id: "phone", label: "Tél", icon: Phone, hasValue: !!signatureData?.phone },
    { id: "email", label: "Email", icon: Mail, hasValue: !!signatureData?.email },
    { id: "website", label: "Site", icon: Globe, hasValue: !!signatureData?.website },
    { id: "address", label: "Adresse", icon: MapPin, hasValue: !!signatureData?.address },
  ];

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
        Ajout rapide
      </h4>
      <div className="flex flex-wrap gap-2">
        {fields.map((field) => {
          const Icon = field.icon;
          return (
            <button
              key={field.id}
              onClick={() => onAddField(field.id)}
              disabled={!field.hasValue}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium",
                "border transition-colors",
                field.hasValue
                  ? "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                  : "bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-400 cursor-not-allowed"
              )}
            >
              <Icon className="w-3 h-3" />
              {field.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * WidgetPalette - Sidebar panel showing available widgets
 */
export default function WidgetPalette({ onAddWidget, signatureData }) {
  const handleAdd = (type) => {
    const widget = createWidget(type);
    if (widget) {
      onAddWidget(widget);
    }
  };

  const handleAddField = (fieldId) => {
    let widget;

    switch (fieldId) {
      case "fullName":
        widget = createWidget(WIDGET_TYPES.TEXT, {
          field: "fullName",
          fontSize: 16,
          fontWeight: "700",
          color: "#171717",
        });
        break;
      case "position":
        widget = createWidget(WIDGET_TYPES.TEXT, {
          field: "position",
          fontSize: 14,
          fontWeight: "400",
          color: "#666666",
        });
        break;
      case "phone":
      case "mobile":
      case "email":
      case "website":
      case "address":
        widget = createWidget(WIDGET_TYPES.CONTACT_ROW, {
          field: fieldId,
          showIcon: true,
        });
        break;
      default:
        return;
    }

    if (widget) {
      onAddWidget(widget);
    }
  };

  // Group widgets by category
  const contentWidgets = WIDGET_PALETTE.filter((w) => w.category === "content");
  const layoutWidgets = WIDGET_PALETTE.filter((w) => w.category === "layout");
  const mediaWidgets = WIDGET_PALETTE.filter((w) => w.category === "media");

  return (
    <div className="space-y-6">
      {/* Quick add section */}
      <QuickAddSection onAddField={handleAddField} signatureData={signatureData} />

      {/* Content widgets */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          Contenu
        </h4>
        <div className="space-y-2">
          {contentWidgets.map((item) => (
            <PaletteItem
              key={item.type}
              type={item.type}
              label={item.label}
              icon={item.icon}
              description={item.description}
              onAdd={handleAdd}
            />
          ))}
        </div>
      </div>

      {/* Media widgets */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          Médias
        </h4>
        <div className="space-y-2">
          {mediaWidgets.map((item) => (
            <PaletteItem
              key={item.type}
              type={item.type}
              label={item.label}
              icon={item.icon}
              description={item.description}
              onAdd={handleAdd}
            />
          ))}
        </div>
      </div>

      {/* Layout widgets */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          Mise en page
        </h4>
        <div className="space-y-2">
          {layoutWidgets.map((item) => (
            <PaletteItem
              key={item.type}
              type={item.type}
              label={item.label}
              icon={item.icon}
              description={item.description}
              onAdd={handleAdd}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
