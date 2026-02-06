"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { Input } from "@/src/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Clock, Euro, Check, Search, Filter, X, Users } from "lucide-react";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

const formatTime = (seconds) => {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;
  if (hours >= 1) {
    return `${hours}h${minutes.toString().padStart(2, "0")}`;
  }
  return `${minutes}m${secs.toString().padStart(2, "0")}s`;
};

const getBillableHours = (totalSeconds, roundingOption) => {
  const hours = totalSeconds / 3600;
  if (roundingOption === "up") return Math.ceil(hours);
  if (roundingOption === "down") return Math.floor(hours);
  return hours;
};

export function ConvertToInvoiceModal({ open, onOpenChange, tasks, onConvert, getEffectiveSeconds, columns = [], members = [] }) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMemberId, setFilterMemberId] = useState(null);
  const [filterColumnId, setFilterColumnId] = useState(null);

  // Colonnes qui contiennent au moins une tâche facturable
  const availableColumns = useMemo(() => {
    const columnIds = new Set(tasks.map((t) => t.columnId));
    return columns.filter((c) => columnIds.has(c.id));
  }, [tasks, columns]);

  // Membres assignés à au moins une tâche facturable
  const availableMembers = useMemo(() => {
    const memberIds = new Set();
    tasks.forEach((t) => {
      if (Array.isArray(t.assignedMembers)) {
        t.assignedMembers.forEach((id) => memberIds.add(id));
      }
    });
    return (members || []).filter((m) => memberIds.has(m.id));
  }, [tasks, members]);

  // Filtrage des tâches
  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => t.title?.toLowerCase().includes(q));
    }
    if (filterColumnId) {
      result = result.filter((t) => t.columnId === filterColumnId);
    }
    if (filterMemberId) {
      result = result.filter(
        (t) => Array.isArray(t.assignedMembers) && t.assignedMembers.includes(filterMemberId)
      );
    }
    return result;
  }, [tasks, searchQuery, filterColumnId, filterMemberId]);

  const allFiltered = filteredTasks.length > 0 && filteredTasks.every((t) => selectedIds.has(t.id));

  const toggleTask = useCallback((taskId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (allFiltered) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredTasks.forEach((t) => next.delete(t.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredTasks.forEach((t) => next.add(t.id));
        return next;
      });
    }
  }, [allFiltered, filteredTasks]);

  const selectedTotal = useMemo(() => {
    return tasks
      .filter((t) => selectedIds.has(t.id))
      .reduce((sum, task) => {
        const tt = task.timeTracking;
        const effectiveSeconds = getEffectiveSeconds(tt);
        const billableHours = getBillableHours(effectiveSeconds, tt.roundingOption);
        return sum + billableHours * tt.hourlyRate;
      }, 0);
  }, [tasks, selectedIds, getEffectiveSeconds]);

  const handleConvert = useCallback(() => {
    const selected = tasks.filter((t) => selectedIds.has(t.id));
    onConvert(selected);
    setSelectedIds(new Set());
  }, [tasks, selectedIds, onConvert]);

  const handleOpenChange = useCallback(
    (value) => {
      if (!value) {
        setSelectedIds(new Set());
        setSearchQuery("");
        setFilterMemberId(null);
        setFilterColumnId(null);
      }
      onOpenChange(value);
    },
    [onOpenChange]
  );

  const activeFiltersCount = (filterMemberId ? 1 : 0) + (filterColumnId ? 1 : 0);
  const selectedColumn = availableColumns.find((c) => c.id === filterColumnId);
  const selectedMember = availableMembers.find((m) => m.id === filterMemberId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg p-4 sm:p-6 max-h-[90dvh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Convertir en facture
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 min-h-0 flex flex-col">
          {/* Recherche + Filtres */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Rechercher une tâche..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9 h-8 text-sm"
              />
              <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3">
                <Search size={14} aria-hidden="true" />
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 end-0 flex items-center pe-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Filtre par status (colonne) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className={`h-8 gap-1.5 text-xs flex-1 sm:flex-none ${filterColumnId ? "border-[#5b50ff]/40 bg-[#5b50ff]/5 text-[#5b50ff]" : ""}`}>
                    <Filter size={14} className="shrink-0" />
                    <span className="truncate max-w-[80px] sm:max-w-none">{selectedColumn ? selectedColumn.title : "Status"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setFilterColumnId(null)} className="cursor-pointer text-sm">
                    Tous les status
                  </DropdownMenuItem>
                  {availableColumns.map((col) => (
                    <DropdownMenuItem
                      key={col.id}
                      onClick={() => setFilterColumnId(col.id)}
                      className="cursor-pointer text-sm gap-2"
                    >
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: col.color || "#94a3b8" }} />
                      {col.title}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Filtre par personne */}
              {availableMembers.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className={`h-8 gap-1.5 text-xs flex-1 sm:flex-none ${filterMemberId ? "border-[#5b50ff]/40 bg-[#5b50ff]/5 text-[#5b50ff]" : ""}`}>
                      <Users size={14} className="shrink-0" />
                      <span className="truncate max-w-[80px] sm:max-w-none">{selectedMember ? (selectedMember.name || selectedMember.email) : "Personne"}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setFilterMemberId(null)} className="cursor-pointer text-sm">
                      Toutes les personnes
                    </DropdownMenuItem>
                    {availableMembers.map((member) => (
                      <DropdownMenuItem
                        key={member.id}
                        onClick={() => setFilterMemberId(member.id)}
                        className="cursor-pointer text-sm gap-2"
                      >
                        {member.image ? (
                          <img src={member.image} alt={member.name || member.email} className="w-4 h-4 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-medium shrink-0">
                            {(member.name || member.email).charAt(0).toUpperCase()}
                          </div>
                        )}
                        {member.name || member.email}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Filtres actifs */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {filterColumnId && selectedColumn && (
                <Badge variant="secondary" className="gap-1 text-xs pr-1">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: selectedColumn.color || "#94a3b8" }} />
                  <span className="truncate max-w-[120px]">{selectedColumn.title}</span>
                  <button onClick={() => setFilterColumnId(null)} className="ml-0.5 hover:text-foreground shrink-0">
                    <X size={12} />
                  </button>
                </Badge>
              )}
              {filterMemberId && selectedMember && (
                <Badge variant="secondary" className="gap-1 text-xs pr-1">
                  <span className="truncate max-w-[120px]">{selectedMember.name || selectedMember.email}</span>
                  <button onClick={() => setFilterMemberId(null)} className="ml-0.5 hover:text-foreground shrink-0">
                    <X size={12} />
                  </button>
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-muted-foreground">
              {filteredTasks.length} tâche{filteredTasks.length > 1 ? "s" : ""} facturable{filteredTasks.length > 1 ? "s" : ""}
            </span>
            <Button variant="ghost" size="sm" onClick={toggleAll} className="h-7 text-xs text-[#5b50ff] hover:text-[#5b50ff] hover:bg-[#5b50ff]/10">
              {allFiltered ? "Tout désélectionner" : "Tout sélectionner"}
            </Button>
          </div>

          {/* Liste des tâches - max ~3 visibles, flex-1 sur mobile pour remplir */}
          <ScrollArea className="max-h-[180px] sm:max-h-[228px] min-h-0 flex-1">
            <div className="space-y-2 pr-3">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  Aucune tâche trouvée
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const tt = task.timeTracking;
                  const effectiveSeconds = getEffectiveSeconds(tt);
                  const billableHours = getBillableHours(effectiveSeconds, tt.roundingOption);
                  const price = billableHours * tt.hourlyRate;
                  const isSelected = selectedIds.has(task.id);

                  return (
                    <div
                      key={task.id}
                      className={`flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? "border-[#5b50ff]/40 bg-[#5b50ff]/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                      onClick={() => toggleTask(task.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleTask(task.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium truncate">{task.title}</p>
                        <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 shrink-0" />
                            {formatTime(effectiveSeconds)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground">
                            <Euro className="h-3 w-3 shrink-0" />
                            {tt.hourlyRate}€/h
                          </span>
                          {tt.roundingOption && tt.roundingOption !== "none" && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1 hidden sm:inline-flex">
                              arrondi {tt.roundingOption === "up" ? "sup." : "inf."}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">
                        {formatCurrency(price)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-xs sm:text-sm text-muted-foreground">
                {selectedIds.size} sélectionnée{selectedIds.size > 1 ? "s" : ""}
              </span>
              <span className="text-sm sm:text-base font-semibold">{formatCurrency(selectedTotal)}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleConvert} disabled={selectedIds.size === 0} className="gap-2">
            <Check className="h-4 w-4" />
            Créer la facture
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
