"use client";

import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/src/components/ui/sidebar";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Textarea } from "@/src/components/ui/textarea";
import { User, Building2, Palette, Share2, Settings } from "lucide-react";
import { TabSignature } from "@/app/dashboard/outils/signatures-mail/components/preview/TabSignature";

const ConfigSection = ({ title, icon: Icon, children, isActive = false }) => (
  <div
    className={`space-y-3 p-4 rounded-lg border ${isActive ? "bg-blue-50 border-blue-200" : "bg-white"}`}
  >
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-gray-600" />
      <h3 className="font-medium text-sm">{title}</h3>
    </div>
    {children}
  </div>
);

export function SignatureSidebar({
  signatureData,
  updateSignatureData,
  editingSignatureId,
  ...props
}) {
  return (
    <Sidebar
      side="right"
      collapsible="none"
      className="w-80 h-screen"
      {...props}
    >
      <SidebarContent className="p-0 h-full overflow-hidden">
        <TabSignature existingSignatureId={editingSignatureId} />
      </SidebarContent>
    </Sidebar>
  );
}
