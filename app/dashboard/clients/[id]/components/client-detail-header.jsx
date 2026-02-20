"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/src/components/ui/tooltip";
import {
  Settings2,
  FileText,
  ClipboardList,
  Mail,
  Trash2,
  Pencil,
  Blocks,
  ShieldOff,
  UserCheck,
  MessageCircle,
} from "lucide-react";

export default function ClientDetailHeader({
  client,
  onEdit,
  onDelete,
}) {
  const router = useRouter();

  const displayName =
    client.type === "INDIVIDUAL" && (client.firstName || client.lastName)
      ? `${client.firstName || ""} ${client.lastName || ""}`.trim()
      : client.name;

  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-[#eeeff1] dark:border-[#232323] flex-shrink-0">
      {/* Left: avatar + name */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="flex-shrink-0 rounded-md flex items-center justify-center w-6 h-6 bg-[#fbfbfb] dark:bg-[#1a1a1a] shadow-[inset_0_0_0_1px_#eeeff1] dark:shadow-[inset_0_0_0_1px_#232323]"
        >
          <Blocks className="h-3.5 w-3.5 text-[#242529] dark:text-foreground" />
        </div>
        <h1 className="text-sm font-medium text-[#242529] dark:text-foreground truncate">{displayName}</h1>
      </div>

      {/* Center: action buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="outline"
          className="hidden sm:inline-flex"
          onClick={() =>
            router.push(`/dashboard/outils/factures/new?clientId=${client.id}`)
          }
        >
          <FileText className="h-3.5 w-3.5" />
          Nouvelle facture
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="hidden sm:inline-flex"
              onClick={() =>
                router.push(`/dashboard/outils/devis/new?clientId=${client.id}`)
              }
            >
              <ClipboardList className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Nouveau devis</TooltipContent>
        </Tooltip>
        {client.email && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="hidden sm:inline-flex"
                onClick={() => (window.location.href = `mailto:${client.email}`)}
              >
                <Mail className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Email</TooltipContent>
          </Tooltip>
        )}

        {/* More dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
            >
              <Settings2 className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={onEdit} className="cursor-pointer gap-2 text-xs">
              <Pencil className="w-3.5 h-3.5" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer gap-2 text-xs">
              <ShieldOff className="w-3.5 h-3.5" />
              Bloquer le contact
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer gap-2 text-xs">
              <UserCheck className="w-3.5 h-3.5" />
              Assigner
            </DropdownMenuItem>
            {client.phone && (
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-xs"
                onClick={() => {
                  navigator.clipboard.writeText(client.phone);
                }}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Copier le numéro sur WhatsApp
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="cursor-pointer gap-2 text-xs text-red-600 focus:text-red-600"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Supprimer définitivement
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </div>
  );
}
