import React, { useState, useRef, Fragment, useMemo, useCallback } from "react";
import {
  MoreHorizontal,
  Calendar,
  ChevronDown,
  ChevronRight,
  Plus,
  Flag,
  MessageSquare,
  Paperclip,
  MoreVertical,
  GripVertical,
  AlignLeft,
  Clock,
  Users,
  UserRoundPlus,
  X,
  Search,
  Check,
  Pencil,
  Trash2,
  CopyPlus,
  ArrowRightLeft,
  Ellipsis,
  Settings,
  ChevronsDownUp,
  CheckCheck,
  CornerDownLeft,
  Tag,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/src/components/ui/dropdown-menu";
import { Badge } from "@/src/components/ui/badge";
import { UserAvatar } from "@/src/components/ui/user-avatar";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Input } from "@/src/components/ui/input";
import { useAssignedMembersInfo } from "@/src/hooks/useAssignedMembersInfo";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { Calendar as CalendarComponent } from "@/src/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MemberSelector } from "./MemberSelector";
import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";
import { toast } from "sonner";

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function DescriptionHoverPopover({ description }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <span
          className="cursor-pointer text-muted-foreground/40 hover:text-muted-foreground transition-colors flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <AlignLeft className="h-3 w-3" />
        </span>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-3"
        side="top"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-1">
          <h4 className="font-medium text-sm">Description</h4>
          {/<[a-z][\s\S]*>/i.test(description) ? (
            <div
              className="text-sm text-muted-foreground break-words line-clamp-8 [&_b]:font-bold [&_i]:italic [&_u]:underline [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words line-clamp-8">
              {description}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Composant pour sélectionner les membres assignés avec un bouton de mise à jour
 */
const MembersPopover = React.memo(function MembersPopover({
  task,
  membersInfo,
  members,
  updateTask,
  workspaceId,
  isTrigger,
  popoverOpenRef,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [popoverSide, setPopoverSide] = useState("bottom");
  const triggerRef = useRef(null);

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (open) {
      setSearchQuery("");
      if (popoverOpenRef) popoverOpenRef.current = true;
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPopoverSide(
          window.innerHeight - rect.bottom < 300 ? "top" : "bottom",
        );
      }
    } else {
      if (popoverOpenRef) {
        setTimeout(() => {
          popoverOpenRef.current = false;
        }, 100);
      }
    }
  };

  const toggleMember = (memberId) => {
    const current = task.assignedMembers || [];
    const newMembers = current.includes(memberId)
      ? current.filter((id) => id !== memberId)
      : [...current, memberId];
    updateTask({
      variables: {
        input: { id: task.id, assignedMembers: newMembers },
        workspaceId,
      },
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild ref={triggerRef}>
        {isTrigger ? (
          <div
            className="flex -space-x-2 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            {task.assignedMembers.slice(0, 3).map((memberId, idx) => {
              const memberInfo = membersInfo.find((m) => m.id === memberId);
              return (
                <div key={memberId} className="relative group/avatar">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <UserAvatar
                          src={memberInfo?.image}
                          name={memberInfo?.name || memberId}
                          size="xs"
                          className="border border-background ring-1 ring-border/10 hover:ring-primary/50 transition-all"
                          style={{ zIndex: task.assignedMembers.length - idx }}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="text-[10px] px-2 py-1"
                    >
                      {memberInfo?.name || memberId}
                    </TooltipContent>
                  </Tooltip>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMember(memberId);
                    }}
                    className="absolute -top-1.5 -right-0.5 w-3.5 h-3.5 bg-muted-foreground border border-white rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer"
                    title="Supprimer l'assignation"
                  >
                    <X className="w-2 h-2 text-white stroke-[3]" />
                  </button>
                </div>
              );
            })}
            {task.assignedMembers.length > 3 && (
              <div className="w-5 h-5 rounded-full bg-muted/80 border border-background flex items-center justify-center text-[8px] font-semibold text-muted-foreground flex-shrink-0">
                +{task.assignedMembers.length - 3}
              </div>
            )}
          </div>
        ) : (
          <button
            className="cursor-pointer text-muted-foreground/70 hover:text-foreground transition-colors bg-transparent border-0 p-0"
            onClick={(e) => e.stopPropagation()}
            title="Ajouter des membres"
          >
            <UserRoundPlus className="h-4 w-4" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-60 p-0" side={popoverSide} align="start">
        <div className="px-2 pt-2 pb-1.5">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/50" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="h-7 text-xs pl-7 pr-2 bg-muted/30 border-border/50 focus-visible:ring-1 focus-visible:ring-[#5A50FF]/30"
            />
          </div>
        </div>
        <div className="px-2 pb-0.5">
          <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">
            Assigné
          </span>
        </div>
        <div className="p-1.5 pt-0.5 space-y-0.5 max-h-[280px] overflow-y-auto">
          {members
            .filter((m) =>
              m.name?.toLowerCase().includes(searchQuery.toLowerCase()),
            )
            .map((member) => {
              const isSelected = (task.assignedMembers || []).includes(
                member.id,
              );
              return (
                <button
                  key={member.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMember(member.id);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer"
                >
                  <div
                    className={`rounded-full flex-shrink-0 ${isSelected ? "ring-[1.5px] ring-[#5A50FF] ring-offset-1 ring-offset-background" : ""}`}
                  >
                    <UserAvatar
                      src={member.image}
                      name={member.name}
                      size="xs"
                      className="h-5 w-5"
                    />
                  </div>
                  <span className="flex-1 text-left text-xs font-medium truncate">
                    {member.name}
                  </span>
                </button>
              );
            })}
        </div>
      </PopoverContent>
    </Popover>
  );
});

/**
 * Zone de drop pour les colonnes vides
 */
function EmptyColumnDropZone({ columnId }) {
  return (
    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
      Aucune tâche
    </div>
  );
}

/**
 * Zone de drop sur l'en-tête d'une section fermée (data-attribute based)
 */
function CollapsedColumnDropZone({ columnId, children }) {
  return <div data-dnd-list-zone={columnId}>{children}</div>;
}

/**
 * Contenu du popover de status avec recherche
 */
function StatusPopoverContent({
  columns,
  column,
  task,
  moveTask,
  workspaceId,
  onClose,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const filtered = columns.filter((c) =>
    c.title?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <>
      <div className="px-2 pt-2 pb-1.5">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/50" />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="h-7 text-xs pl-7 pr-2 bg-muted/30 border-border/50 focus-visible:ring-1 focus-visible:ring-[#5A50FF]/30"
          />
        </div>
      </div>
      <div className="px-2 pb-0.5">
        <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">
          Status
        </span>
      </div>
      <div className="p-1.5 pt-0.5 space-y-0.5 max-h-[280px] overflow-y-auto">
        {filtered.map((col) => (
          <button
            key={col.id}
            onClick={(e) => {
              e.stopPropagation();
              // Fermer le Popover AVANT le moveTask pour éviter un portal orphelin
              onClose?.();
              moveTask({
                variables: {
                  id: task.id,
                  columnId: col.id,
                  position: 0,
                  workspaceId,
                },
              }).catch((error) => {
                console.error("Erreur lors du déplacement de la tâche:", error);
              });
            }}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors cursor-pointer ${
              col.id === column.id ? "bg-muted/60" : ""
            }`}
          >
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{
                backgroundColor: col.color || "#94a3b8",
                border: `1.5px solid ${col.color || "#94a3b8"}60`,
                outline: `1.5px solid ${col.color || "#94a3b8"}30`,
                outlineOffset: "1.5px",
              }}
            />
            <span className="flex-1 text-left text-xs font-normal">
              {col.title}
            </span>
            {col.id === column.id && (
              <Check className="w-3.5 h-3.5 text-[#5A50FF]" />
            )}
          </button>
        ))}
      </div>
    </>
  );
}

/**
 * Barre d'actions groupées — apparaît quand des tâches sont sélectionnées
 */
function BulkActionBar({
  selectedTaskIds,
  setSelectedTaskIds,
  columns,
  members,
  updateTask,
  moveTask,
  onDeleteTask,
  createTask,
  getTasksByColumn,
  boardId,
  workspaceId,
  listRef,
}) {
  const bulkBarRef = useRef(null);
  const count = selectedTaskIds.size;

  // Centrer la barre par rapport à la zone de contenu (SidebarInset)
  React.useEffect(() => {
    if (count === 0 || !bulkBarRef.current) return;
    const update = () => {
      const inset =
        listRef?.current?.closest('[data-slot="sidebar-inset"]') ||
        listRef?.current?.parentElement;
      if (!inset || !bulkBarRef.current) return;
      const rect = inset.getBoundingClientRect();
      bulkBarRef.current.style.left = `${rect.left + rect.width / 2}px`;
      bulkBarRef.current.style.transform = "translateX(-50%)";
      bulkBarRef.current.style.maxWidth = `${rect.width - 48}px`;
    };
    update();
    const observer = new ResizeObserver(update);
    const inset =
      listRef?.current?.closest('[data-slot="sidebar-inset"]') ||
      listRef?.current?.parentElement;
    if (inset) observer.observe(inset);
    return () => observer.disconnect();
  }, [count, listRef]);

  // Injecter le keyframe une seule fois
  React.useEffect(() => {
    if (document.getElementById("bulkbar-keyframes")) return;
    const style = document.createElement("style");
    style.id = "bulkbar-keyframes";
    style.textContent = `@keyframes bulkbar-enter { from { opacity: 0; bottom: 0; } to { opacity: 1; bottom: 2.5rem; } }`;
    document.head.appendChild(style);
  }, []);

  if (count === 0) return null;

  const selectedIds = Array.from(selectedTaskIds);

  const bulkUpdateField = (field, value) => {
    selectedIds.forEach((taskId) => {
      updateTask({
        variables: {
          input: { id: taskId, [field]: value },
          workspaceId,
        },
      });
    });
  };

  const bulkMove = (columnId) => {
    selectedIds.forEach((taskId) => {
      moveTask({
        variables: { id: taskId, columnId, position: 0, workspaceId },
      });
    });
  };

  const bulkDelete = () => {
    selectedIds.forEach((taskId) => onDeleteTask(taskId));
    setSelectedTaskIds(new Set());
  };

  const bulkAssign = (memberIds) => {
    selectedIds.forEach((taskId) => {
      updateTask({
        variables: {
          input: { id: taskId, assignedMembers: memberIds },
          workspaceId,
        },
      });
    });
  };

  const findTaskById = (taskId) => {
    if (!getTasksByColumn) return null;
    for (const column of columns) {
      const tasks = getTasksByColumn(column.id) || [];
      const found = tasks.find((t) => t.id === taskId);
      if (found) return found;
    }
    return null;
  };

  const bulkDuplicate = async () => {
    if (!createTask || !boardId) return;
    const tasksToDuplicate = selectedIds
      .map((id) => findTaskById(id))
      .filter(Boolean);
    if (tasksToDuplicate.length === 0) return;

    try {
      await Promise.all(
        tasksToDuplicate.map((task) =>
          createTask({
            variables: {
              input: {
                title: `${task.title} (copie)`,
                description: task.description || "",
                priority: task.priority || "",
                startDate: task.startDate || null,
                dueDate: task.dueDate || null,
                columnId: task.columnId,
                boardId,
                position: 0,
                tags: (task.tags || []).map((tag) => ({
                  name: tag.name,
                  className: tag.className || "",
                  bg: tag.bg || "",
                  text: tag.text || "",
                  border: tag.border || "",
                })),
                checklist: (task.checklist || []).map((item) => ({
                  text: item.text,
                  completed: false,
                })),
                assignedMembers: Array.isArray(task.assignedMembers)
                  ? task.assignedMembers.filter(Boolean)
                  : [],
              },
              workspaceId,
            },
          }),
        ),
      );
      toast.success(
        tasksToDuplicate.length === 1
          ? "Tâche dupliquée"
          : `${tasksToDuplicate.length} tâches dupliquées`,
      );
      setSelectedTaskIds(new Set());
    } catch (error) {
      console.error("Erreur lors de la duplication des tâches:", error);
      toast.error("Erreur lors de la duplication");
    }
  };

  return (
    <div
      ref={bulkBarRef}
      className="fixed bottom-10 z-[200]"
      style={{
        animation: "bulkbar-enter 150ms ease-out both",
      }}
    >
      <div
        className="flex items-center text-white rounded-xl p-2 border border-white/10"
        style={{
          backgroundColor: "#202020",
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, .106), 0 4px 6px -4px rgba(0, 0, 0, .106)",
        }}
      >
        {/* Compteur */}
        <div
          className="flex items-center gap-1.5 bg-transparent text-white rounded-md px-2.5 py-1 border border-white/20 cursor-pointer hover:bg-white/10 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedTaskIds(new Set());
          }}
        >
          <span className="text-sm font-medium whitespace-nowrap">
            {count} tâche{count > 1 ? "s" : ""} sélectionnée
            {count > 1 ? "s" : ""}
          </span>
          <div className="p-0.5">
            <X className="h-3 w-3" />
          </div>
        </div>

        {/* Actions — poussées à droite */}
        <div className="flex-1 flex items-center justify-end gap-1 ml-3">
          {/* Assignees */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap"
                style={{ color: "#BEBEBE" }}
              >
                <Users className="h-3.5 w-3.5" />
                Assignés
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0" side="top" align="start">
              <div className="px-2 pt-2 pb-0.5">
                <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">
                  Assigner à
                </span>
              </div>
              <div className="p-1.5 pt-0.5 space-y-0.5 max-h-[280px] overflow-y-auto">
                {members.map((member) => {
                  const memberId = member.userId || member.id;
                  const memberName =
                    member.name || member.user?.name || memberId;
                  const memberImage = member.image || member.user?.image;
                  return (
                    <button
                      key={memberId}
                      onClick={() => bulkAssign([memberId])}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer"
                    >
                      <UserAvatar
                        src={memberImage}
                        name={memberName}
                        size="xs"
                        className="h-5 w-5"
                      />
                      <span className="text-xs font-medium truncate">
                        {memberName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          {/* Date */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap"
                style={{ color: "#BEBEBE" }}
              >
                <Calendar className="h-3.5 w-3.5" />
                Échéance
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" side="top" align="start">
              <CalendarComponent
                mode="single"
                selected={undefined}
                onSelect={(date) => {
                  if (date) {
                    date.setHours(18, 0, 0, 0);
                    bulkUpdateField("dueDate", date.toISOString());
                  }
                }}
                locale={fr}
                fromDate={new Date()}
                className="border-0 p-2 text-xs [--cell-size:--spacing(8)]"
              />
            </PopoverContent>
          </Popover>

          {/* Priorité */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap"
                style={{ color: "#BEBEBE" }}
              >
                <Flag className="h-3.5 w-3.5" />
                Priorité
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0" side="top" align="start">
              <div className="p-1.5 space-y-0.5">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value || "none"}
                    onClick={() => bulkUpdateField("priority", p.value)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer"
                  >
                    <Flag className={`h-3.5 w-3.5 ${p.color} ${p.fill}`} />
                    <span className="text-xs">{p.label}</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Séparateur */}
          <div
            style={{
              width: "1px",
              height: "16px",
              backgroundColor: "rgba(255,255,255,.2)",
              margin: "0 2px",
              flexShrink: 0,
            }}
          />

          {/* Déplacer */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap"
                style={{ color: "#BEBEBE" }}
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
                Déplacer/Ajouter
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-0" side="top" align="start">
              <div className="px-2 pt-2 pb-0.5">
                <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">
                  Déplacer vers
                </span>
              </div>
              <div className="p-1.5 pt-0.5 space-y-0.5">
                {columns.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => bulkMove(col.id)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer"
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: col.color || "#94a3b8" }}
                    />
                    <span className="text-xs">{col.title}</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Dupliquer */}
          <button
            onClick={bulkDuplicate}
            className="flex items-center justify-center p-1.5 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
            style={{ color: "#BEBEBE" }}
            title="Dupliquer"
          >
            <CopyPlus className="h-4 w-4" />
          </button>

          {/* Supprimer */}
          <button
            onClick={bulkDelete}
            className="flex items-center justify-center p-1.5 rounded-md text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
            title="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          {/* Séparateur */}
          <div
            style={{
              width: "1px",
              height: "16px",
              backgroundColor: "rgba(255,255,255,.2)",
              margin: "0 2px",
              flexShrink: 0,
            }}
          />

          {/* Plus */}
          <button
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap"
            style={{ color: "#BEBEBE" }}
            title="Plus d'actions"
          >
            <Ellipsis className="h-4 w-4" />
            Plus
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Wrapper du popover status avec position auto
 */
function StatusPopoverWrapper({
  columns,
  column,
  task,
  moveTask,
  workspaceId,
  popoverOpenRef,
}) {
  const triggerRef = useRef(null);
  const [popoverSide, setPopoverSide] = useState("bottom");
  const [open, setOpen] = useState(false);

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (isOpen) {
          if (popoverOpenRef) popoverOpenRef.current = true;
          if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            setPopoverSide(spaceBelow < 300 ? "top" : "bottom");
          }
        } else {
          if (popoverOpenRef) {
            setTimeout(() => {
              popoverOpenRef.current = false;
            }, 100);
          }
        }
      }}
    >
      <PopoverTrigger asChild ref={triggerRef}>
        <button
          className="px-2 py-1 rounded-md flex-shrink-0 text-xs font-medium border flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
          style={{
            backgroundColor: `${column.color || "#94a3b8"}20`,
            borderColor: `${column.color || "#94a3b8"}20`,
            color: column.color || "#94a3b8",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: column.color || "#94a3b8" }}
          />
          <span>{column.title}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-0" side={popoverSide} align="start">
        <StatusPopoverContent
          columns={columns}
          column={column}
          task={task}
          moveTask={moveTask}
          workspaceId={workspaceId}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}

const PRIORITIES = [
  {
    value: "high",
    label: "Urgent",
    color: "text-red-500",
    fill: "fill-red-500",
  },
  {
    value: "medium",
    label: "Moyen",
    color: "text-yellow-500",
    fill: "fill-yellow-500",
  },
  {
    value: "low",
    label: "Faible",
    color: "text-green-500",
    fill: "fill-green-500",
  },
  {
    value: "",
    label: "Aucune",
    color: "text-[#8D8D8D]",
    fill: "fill-gray-400",
  },
];

/**
 * Wrapper du popover priorité avec position auto et style unifié
 */
function PriorityPopoverWrapper({
  task,
  updateTask,
  workspaceId,
  popoverOpenRef,
  trigger,
}) {
  const triggerRef = useRef(null);
  const [popoverSide, setPopoverSide] = useState("bottom");
  const [isOpen, setIsOpen] = useState(false);

  const currentPriority = task.priority?.toLowerCase() || "";

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) {
          if (popoverOpenRef) popoverOpenRef.current = true;
          if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            setPopoverSide(spaceBelow < 250 ? "top" : "bottom");
          }
        } else {
          if (popoverOpenRef) {
            setTimeout(() => {
              popoverOpenRef.current = false;
            }, 100);
          }
        }
      }}
    >
      <PopoverTrigger asChild ref={triggerRef}>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="w-52 p-0" side={popoverSide} align="start">
        <div className="px-2 pt-2 pb-0.5">
          <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">
            Priorité
          </span>
        </div>
        <div className="p-1.5 pt-0.5 space-y-0.5">
          {PRIORITIES.map((priority) => {
            const isActive =
              (priority.value === "" && !currentPriority) ||
              currentPriority === priority.value;
            return (
              <button
                key={priority.value || "none"}
                onClick={(e) => {
                  e.stopPropagation();
                  updateTask({
                    variables: {
                      input: {
                        id: task.id,
                        priority: priority.value,
                      },
                      workspaceId,
                    },
                  });
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors cursor-pointer ${
                  isActive ? "bg-muted/60" : ""
                }`}
              >
                <Flag
                  className={`h-3.5 w-3.5 ${priority.color} ${priority.fill}`}
                />
                <span className="flex-1 text-left text-xs font-normal">
                  {priority.label}
                </span>
                {isActive && <Check className="w-3.5 h-3.5 text-[#5A50FF]" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Popover d'assignation inline — même style que MembersPopover
 */
function InlineAssignPopover({ members, assignedMembers, setAssignedMembers }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [popoverSide, setPopoverSide] = useState("bottom");
  const triggerRef = useRef(null);

  return (
    <Popover
      onOpenChange={(open) => {
        if (open) {
          setSearchQuery("");
          if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPopoverSide(
              window.innerHeight - rect.bottom < 300 ? "top" : "bottom",
            );
          }
        }
      }}
    >
      <PopoverTrigger asChild ref={triggerRef}>
        <Button
          variant="outline"
          size="sm"
          className={`h-6 p-0 rounded-sm text-muted-foreground hover:text-foreground ${assignedMembers.length > 0 ? "px-1" : "w-6"}`}
          title="Assigner"
        >
          {assignedMembers.length > 0 ? (
            <div className="flex -space-x-1">
              {assignedMembers.slice(0, 3).map((userId) => {
                const member = members.find(
                  (m) => m.userId === userId || m.id === userId,
                );
                return member ? (
                  <UserAvatar
                    key={userId}
                    src={member.image || member.user?.image}
                    name={member.name || member.user?.name}
                    size="xs"
                    className="h-4 w-4 ring-1 ring-background"
                  />
                ) : null;
              })}
              {assignedMembers.length > 3 && (
                <span className="h-4 w-4 rounded-full bg-muted text-[8px] font-medium flex items-center justify-center text-muted-foreground">
                  +{assignedMembers.length - 3}
                </span>
              )}
            </div>
          ) : (
            <Users className="h-3 w-3 text-[#8D8D8D]" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-0" side={popoverSide} align="start">
        <div className="px-2 pt-2 pb-1.5">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/50" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="h-7 text-xs pl-7 pr-2 bg-muted/30 border-border/50 focus-visible:ring-1 focus-visible:ring-[#5A50FF]/30"
            />
          </div>
        </div>
        <div className="px-2 pb-0.5">
          <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">
            Assigné
          </span>
        </div>
        <div className="p-1.5 pt-0.5 space-y-0.5 max-h-[280px] overflow-y-auto">
          {members
            .filter((m) =>
              (m.name || m.user?.name || "")
                .toLowerCase()
                .includes(searchQuery.toLowerCase()),
            )
            .map((member) => {
              const memberId = member.userId || member.id;
              const memberName = member.name || member.user?.name || memberId;
              const memberImage = member.image || member.user?.image;
              const isSelected = assignedMembers.includes(memberId);
              return (
                <button
                  key={memberId}
                  onClick={(e) => {
                    e.stopPropagation();
                    setAssignedMembers((prev) =>
                      isSelected
                        ? prev.filter((id) => id !== memberId)
                        : [...prev, memberId],
                    );
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer"
                >
                  <div
                    className={`rounded-full flex-shrink-0 ${isSelected ? "ring-[1.5px] ring-[#5A50FF] ring-offset-1 ring-offset-background" : ""}`}
                  >
                    <UserAvatar
                      src={memberImage}
                      name={memberName}
                      size="xs"
                      className="h-5 w-5"
                    />
                  </div>
                  <span className="flex-1 text-left text-xs font-medium truncate">
                    {memberName}
                  </span>
                </button>
              );
            })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Row inline pour ajouter une tâche rapidement
 */
function InlineAddTask({
  columnId,
  boardId,
  columns,
  members,
  createTask,
  workspaceId,
  onCancel,
  onEditTask,
}) {
  const [title, setTitle] = useState("");
  const [assignedMembers, setAssignedMembers] = useState([]);
  const [dueDate, setDueDate] = useState(null);
  const [priority, setPriority] = useState("");
  const inputRef = useRef(null);
  const [saving, setSaving] = useState(false);

  const column = columns.find((c) => c.id === columnId);
  const rowRef = useRef(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Fermer quand on clique à l'extérieur (capture phase pour passer avant Radix)
  React.useEffect(() => {
    function handleClickOutside(e) {
      if (rowRef.current && !rowRef.current.contains(e.target)) {
        if (e.target.closest("[data-radix-popper-content-wrapper]")) return;
        if (rowRef.current.querySelector('[data-state="open"]')) return;
        onCancel();
      }
    }
    document.addEventListener("pointerdown", handleClickOutside, true);
    return () =>
      document.removeEventListener("pointerdown", handleClickOutside, true);
  }, [onCancel]);

  const handleSave = async (openAfter = false) => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      const result = await createTask({
        variables: {
          input: {
            title: title.trim(),
            columnId,
            boardId,
            priority: priority || "",
            dueDate: dueDate ? dueDate.toISOString() : null,
            assignedMembers: assignedMembers
              .map((m) => (typeof m === "string" ? m : m.userId))
              .filter(Boolean),
            tags: [],
            checklist: [],
          },
          workspaceId,
        },
      });
      onCancel();
      if (openAfter && onEditTask && result?.data?.createTask) {
        onEditTask(result.data.createTask);
      }
    } catch {
      setSaving(false);
    }
  };

  return (
    <div
      ref={rowRef}
      className="grid px-4 sm:px-6 py-1.5 items-center bg-muted/30 relative overflow-hidden after:absolute after:bottom-0 after:left-6 after:right-6 after:sm:left-8 after:sm:right-8 after:h-px after:bg-border/60 after:content-['']"
      style={{
        gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr 80px",
        gap: "2rem",
      }}
    >
      {/* Colonne Nom — même structure que TaskRow */}
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          {/* Spacer grip */}
          <div className="h-4 w-4 flex-shrink-0" />
          {/* Spacer checkbox */}
          <div className="h-4 w-4 flex-shrink-0 mr-4" />
          {/* Status dot — même style que les tâches existantes */}
          <div
            className="flex-shrink-0 w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: column?.color || "#94a3b8",
              border: `1.5px solid ${column?.color || "#94a3b8"}60`,
              outline: `1.5px solid ${column?.color || "#94a3b8"}30`,
              outlineOffset: "1.5px",
            }}
          />
          {/* Input nom */}
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSave(e.metaKey || e.ctrlKey);
              }
              if (e.key === "Escape") onCancel();
            }}
            placeholder="Nom de la tâche..."
            className="flex-1 min-w-0 text-sm font-normal text-foreground/90 bg-transparent border-none outline-none caret-[#5A50FF] p-0 m-0 placeholder:text-muted-foreground/40"
          />
        </div>
      </div>

      {/* Colonne Assigné — tous les boutons d'action groupés ici */}
      <div className="flex items-center gap-1.5">
        {/* Assign */}
        <InlineAssignPopover
          members={members}
          assignedMembers={assignedMembers}
          setAssignedMembers={setAssignedMembers}
        />

        {/* Échéance */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-6 p-0 rounded-sm ${dueDate ? "px-1.5 text-foreground" : "w-6 text-muted-foreground hover:text-foreground"}`}
              title="Échéance"
            >
              {dueDate ? (
                <span className="text-xs">
                  {format(dueDate, "dd MMM", { locale: fr })}
                </span>
              ) : (
                <Calendar className="h-3 w-3 text-[#8D8D8D]" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" side="bottom" align="start">
            <CalendarComponent
              mode="single"
              selected={dueDate}
              onSelect={(date) => {
                if (date) {
                  date.setHours(18, 0, 0, 0);
                  setDueDate(date);
                }
              }}
              locale={fr}
              fromDate={new Date()}
              className="border-0 p-2 text-xs [--cell-size:--spacing(8)]"
            />
          </PopoverContent>
        </Popover>

        {/* Priorité */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-6 w-6 p-0 rounded-sm text-muted-foreground hover:text-foreground"
              title="Priorité"
            >
              <Flag
                className={`h-3 w-3 ${
                  priority === "high"
                    ? "text-red-500 fill-red-500"
                    : priority === "medium"
                      ? "text-yellow-500 fill-yellow-500"
                      : priority === "low"
                        ? "text-green-500 fill-green-500"
                        : "text-[#8D8D8D]"
                }`}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-0" side="bottom" align="start">
            <div className="px-2 pt-2 pb-0.5">
              <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">
                Priorité
              </span>
            </div>
            <div className="p-1.5 pt-0.5 space-y-0.5">
              {PRIORITIES.map((p) => {
                const isActive =
                  (p.value === "" && !priority) || priority === p.value;
                return (
                  <button
                    key={p.value || "none"}
                    onClick={() => setPriority(p.value)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors cursor-pointer ${isActive ? "bg-muted/60" : ""}`}
                  >
                    <Flag className={`h-3.5 w-3.5 ${p.color} ${p.fill}`} />
                    <span className="flex-1 text-left text-xs font-normal">
                      {p.label}
                    </span>
                    {isActive && (
                      <Check className="w-3.5 h-3.5 text-[#5A50FF]" />
                    )}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {/* Séparateur */}
        <div
          style={{
            width: "1px",
            height: "16px",
            backgroundColor: "#e6e6e6",
            margin: "0 4px",
            flexShrink: 0,
          }}
        />

        {/* Cancel / Save */}
        <Button
          variant="outline"
          size="sm"
          className="h-6 px-1.5 rounded-sm text-[11px] text-muted-foreground"
          onClick={onCancel}
        >
          Annuler
        </Button>
        <Button
          size="sm"
          className="h-6 px-2 rounded-sm text-[11px] bg-[#5A50FF] hover:bg-[#4a42d4] text-white"
          onClick={handleSave}
          disabled={!title.trim() || saving}
        >
          Créer ↵
        </Button>
      </div>

      {/* Colonnes restantes vides pour garder la grille */}
      <div />
      <div />
      <div />
      <div />
      <div />
    </div>
  );
}

/**
 * Titre éditable inline — clic sur pencil → input, sauvegarde sur Enter ou blur
 */
const TAG_COLORS = [
  { bg: "#EDE9FE", text: "#6D28D9", border: "#DDD6FE" },
  { bg: "#DBEAFE", text: "#1D4ED8", border: "#BFDBFE" },
  { bg: "#DCFCE7", text: "#15803D", border: "#BBF7D0" },
  { bg: "#FEF3C7", text: "#B45309", border: "#FDE68A" },
  { bg: "#FEE2E2", text: "#B91C1C", border: "#FECACA" },
  { bg: "#FCE7F3", text: "#BE185D", border: "#FBCFE8" },
  { bg: "#E0E7FF", text: "#4338CA", border: "#C7D2FE" },
  { bg: "#F3F4F6", text: "#374151", border: "#E5E7EB" },
];

function InlineTagPopover({
  task,
  updateTask,
  workspaceId,
  allBoardTags = [],
}) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const taskTags = task.tags || [];

  const existingTags = useMemo(() => {
    const seen = new Set();
    return allBoardTags.filter((t) => {
      const key = t.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [allBoardTags]);

  const filteredTags = existingTags.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) &&
      !taskTags.some((tt) => tt.name.toLowerCase() === t.name.toLowerCase()),
  );

  const canCreate =
    search.trim() &&
    !existingTags.some(
      (t) => t.name.toLowerCase() === search.trim().toLowerCase(),
    ) &&
    !taskTags.some((t) => t.name.toLowerCase() === search.trim().toLowerCase());

  const getNextColor = () => {
    const usedBgs = new Set(existingTags.map((t) => t.bg));
    return TAG_COLORS.find((c) => !usedBgs.has(c.bg)) || TAG_COLORS[0];
  };

  const addTagToTask = (tag) => {
    const newTags = [
      ...taskTags,
      {
        name: tag.name,
        className: "",
        bg: tag.bg,
        text: tag.text,
        border: tag.border,
      },
    ];
    updateTask({
      variables: {
        input: {
          id: task.id,
          tags: newTags.map((t) => ({
            name: t.name,
            className: t.className || "",
            bg: t.bg,
            text: t.text,
            border: t.border,
          })),
        },
        workspaceId,
      },
    });
  };

  const removeTagFromTask = (tagName) => {
    const newTags = taskTags.filter(
      (t) => t.name.toLowerCase() !== tagName.toLowerCase(),
    );
    updateTask({
      variables: {
        input: {
          id: task.id,
          tags: newTags.map((t) => ({
            name: t.name,
            className: t.className || "",
            bg: t.bg,
            text: t.text,
            border: t.border,
          })),
        },
        workspaceId,
      },
    });
  };

  const createAndAdd = () => {
    const color = getNextColor();
    addTagToTask({ name: search.trim(), ...color });
    setSearch("");
  };

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex-shrink-0 h-5 w-5 p-0 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-background"
          onClick={(e) => e.stopPropagation()}
          title="Ajouter un tag"
        >
          <Tag className="h-3 w-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-0"
        side="bottom"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tags actuels */}
        {taskTags.length > 0 && (
          <div className="flex flex-wrap gap-1 px-3 pt-2.5 pb-1">
            {taskTags.map((tag) => (
              <span
                key={tag.name}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium"
                style={{
                  backgroundColor: tag.bg,
                  color: tag.text,
                  border: `1px solid ${tag.border}`,
                }}
              >
                {tag.name}
                <button
                  onClick={() => removeTagFromTask(tag.name)}
                  className="hover:opacity-70 cursor-pointer"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Search input */}
        <div className="px-3 pt-2 pb-1.5">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canCreate) {
                e.preventDefault();
                createAndAdd();
              }
            }}
            placeholder="Rechercher ou créer..."
            className="w-full bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/40 p-0"
            autoFocus
          />
        </div>

        <div className="border-t border-border/40" />

        {/* Options */}
        <div className="p-1.5 max-h-[200px] overflow-y-auto">
          {filteredTags.length > 0 && (
            <div className="px-1.5 pb-1">
              <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">
                Sélectionner
              </span>
            </div>
          )}
          {filteredTags.map((tag) => (
            <button
              key={tag.name}
              onClick={() => {
                addTagToTask(tag);
                setSearch("");
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer"
            >
              <span
                className="px-2 py-0.5 rounded-md text-[11px] font-medium"
                style={{
                  backgroundColor: tag.bg,
                  color: tag.text,
                  border: `1px solid ${tag.border}`,
                }}
              >
                {tag.name}
              </span>
            </button>
          ))}

          {/* Create new */}
          {canCreate && (
            <button
              onClick={createAndAdd}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer"
            >
              <span className="text-xs text-muted-foreground">Créer</span>
              <span
                className="px-2 py-0.5 rounded-md text-[11px] font-medium"
                style={{
                  backgroundColor: getNextColor().bg,
                  color: getNextColor().text,
                  border: `1px solid ${getNextColor().border}`,
                }}
              >
                {search.trim()}
              </span>
              <kbd className="ml-auto inline-flex items-center justify-center size-4 rounded bg-muted text-[9px] text-muted-foreground">
                <CornerDownLeft className="size-2.5" />
              </kbd>
            </button>
          )}

          {filteredTags.length === 0 && !canCreate && (
            <p className="text-xs text-muted-foreground/50 text-center py-3">
              Aucun tag disponible
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function InlineEditTitle({
  task,
  updateTask,
  workspaceId,
  popoverOpenRef,
  allBoardTags = [],
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(task.title);
  const inputRef = useRef(null);

  const save = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== task.title) {
      updateTask({
        variables: {
          input: { id: task.id, title: trimmed },
          workspaceId,
        },
      });
    } else {
      setValue(task.title);
    }
    setIsEditing(false);
    if (popoverOpenRef)
      setTimeout(() => {
        popoverOpenRef.current = false;
      }, 100);
  }, [value, task.title, task.id, updateTask, workspaceId, popoverOpenRef]);

  const startEditing = (e) => {
    e.stopPropagation();
    if (popoverOpenRef) popoverOpenRef.current = true;
    setValue(task.title);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  if (isEditing) {
    return (
      <div className="flex-1 w-0 min-w-0" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save();
            }
            if (e.key === "Escape") {
              setValue(task.title);
              setIsEditing(false);
            }
          }}
          onBlur={save}
          className="text-sm font-normal text-[#5A50FF] bg-transparent border-none outline-none w-full caret-[#5A50FF] p-0 m-0"
        />
      </div>
    );
  }

  return (
    <div className="flex-1 w-0 flex items-center gap-1 min-w-0 overflow-hidden">
      <p className="text-sm truncate font-normal text-foreground/90 group-hover:text-[#5A50FF] transition-colors max-w-[200px] flex-shrink-0">
        {task.title}
      </p>
      {task.description && (
        <DescriptionHoverPopover description={task.description} />
      )}
      {/* Tags inline — premier tag visible + badge "+N" pour les autres */}
      {task.tags?.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 min-w-0 overflow-hidden flex-shrink-0">
              <span
                className="inline-flex items-center px-1.5 py-0 rounded text-[10px] font-medium max-w-[100px] truncate"
                style={{
                  backgroundColor: task.tags[0].bg,
                  color: task.tags[0].text,
                  border: `1px solid ${task.tags[0].border}`,
                }}
              >
                {task.tags[0].name}
              </span>
              {task.tags.length > 1 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border min-w-[20px]">
                  +{task.tags.length - 1}
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[300px]">
            <div className="flex flex-wrap gap-1">
              {task.tags.map((tag) => (
                <span
                  key={tag.name}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
                  style={{
                    backgroundColor: tag.bg,
                    color: tag.text,
                    border: `1px solid ${tag.border}`,
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      )}
      <Button
        variant="outline"
        size="sm"
        className="flex-shrink-0 h-5 w-5 p-0 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-background"
        onClick={startEditing}
        title="Modifier le nom"
      >
        <Pencil className="h-3 w-3 text-muted-foreground" />
      </Button>
      <InlineTagPopover
        task={task}
        updateTask={updateTask}
        workspaceId={workspaceId}
        allBoardTags={allBoardTags}
      />
    </div>
  );
}

/**
 * Ligne de tâche avec data attributes pour le custom DnD.
 * L'original reste en place, le hook useListDnD gère le clone + indicator.
 */
const TaskRow = React.memo(function TaskRow({
  task,
  column,
  onEditTask,
  index,
  isSelected,
  isPrevSelected,
  popoverOpenRef,
  children,
}) {
  return (
    <div
      data-dnd-list-task={task.id}
      data-dnd-list-column={column.id}
      data-dnd-list-index={index}
      style={{
        gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr 80px",
        gap: "2rem",
        ...(isSelected ? { backgroundColor: "#5A50FF0D" } : {}),
      }}
      className={`grid px-4 sm:px-6 py-1.5 items-center hover:bg-muted/50 cursor-grab active:cursor-grabbing group relative overflow-hidden after:absolute after:bottom-0 after:h-px after:content-[""] ${isSelected ? "after:left-0 after:right-0 after:bg-[#5A50FF]/35" : "after:left-6 after:right-6 after:sm:left-8 after:sm:right-8 after:bg-border/60"} ${isSelected && index > 0 && !isPrevSelected ? 'before:absolute before:top-0 before:left-0 before:right-0 before:h-px before:bg-[#5A50FF]/35 before:content-[""]' : ""}`}
      onClick={(e) => {
        if (
          e.target.closest(
            'button, input, [role="checkbox"], [data-radix-popover-trigger], [data-radix-dropdown-menu-trigger]',
          )
        )
          return;
        if (popoverOpenRef?.current) return;
        onEditTask(task);
      }}
    >
      {children}
    </div>
  );
});

// Badge de priorité — au module level pour être accessible depuis
// TaskListRowContent (qui est lui-même au module level).
function getPriorityBadge(priority) {
  if (!priority || priority.toLowerCase() === "none") return null;

  const isHigh = priority.toLowerCase() === "high";
  const isMedium = priority.toLowerCase() === "medium";

  const label = isHigh ? "Urgent" : isMedium ? "Moyen" : "Faible";
  const flagColor = isHigh
    ? "text-red-500 fill-red-500"
    : isMedium
      ? "text-yellow-500 fill-yellow-500"
      : "text-green-500 fill-green-500";

  return (
    <Badge
      variant="outline"
      className="inline-flex items-center gap-1 py-1 px-2.5 text-xs font-medium rounded-md text-muted-foreground"
    >
      <Flag className={`h-4 w-4 ${flagColor}`} />
      <span className="text-muted-foreground">{label}</span>
    </Badge>
  );
}

/**
 * Contenu d'une row mémorisée (mémo le bloc de 350 lignes de JSX qui était
 * inline dans le map des tasks). C'est LE truc qui fait perdre la fluidité
 * à la vue liste avec 300 tâches : la JSX inline est recréée à chaque render
 * parent, ce qui force React à walker 300 × ~350 JSX nodes même quand rien
 * n'a changé pour la row.
 *
 * Avec memo + props stables (handlers useCallback, isSelected boolean), seuls
 * les rows réellement modifiés re-renderent.
 */
const TaskListRowContent = React.memo(function TaskListRowContent({
  task,
  column,
  columns,
  isSelected,
  onToggleSelect,
  members,
  membersInfo,
  updateTask,
  moveTask,
  workspaceId,
  allBoardTags,
  popoverOpenRef,
  onEditTask,
  onDeleteTask,
}) {
  return (
    <>
      {/* Nom avec drag handle et checkbox */}
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <GripVertical className="h-4 w-4 text-muted-foreground/40 flex-shrink-0 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => {
              if (checked === "indeterminate") return;
              onToggleSelect(task.id, !!checked);
            }}
            className={`flex-shrink-0 h-4 w-4 border-muted-foreground/30 mr-4 transition-opacity ${isSelected ? "opacity-100 border-[#5A50FF] bg-[#5A50FF] text-white data-[state=checked]:bg-[#5A50FF] data-[state=checked]:border-[#5A50FF]" : "opacity-0 group-hover:opacity-100"}`}
            onClick={(e) => e.stopPropagation()}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex-shrink-0 w-2.5 h-2.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor: column.color || "#94a3b8",
                  border: `1.5px solid ${column.color || "#94a3b8"}60`,
                  outline: `1.5px solid ${column.color || "#94a3b8"}30`,
                  outlineOffset: "1.5px",
                }}
                onClick={(e) => e.stopPropagation()}
                title="Changer le status"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {columns.map((col) => (
                <DropdownMenuItem
                  key={col.id}
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await moveTask({
                        variables: {
                          id: task.id,
                          columnId: col.id,
                          position: 0,
                          workspaceId,
                        },
                      });
                    } catch (error) {
                      console.error(
                        "Erreur lors du déplacement de la tâche:",
                        error,
                      );
                    }
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: col.color || "#94a3b8" }}
                  />
                  <span>{col.title}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <InlineEditTitle
            task={task}
            updateTask={updateTask}
            workspaceId={workspaceId}
            popoverOpenRef={popoverOpenRef}
            allBoardTags={allBoardTags}
          />
        </div>
      </div>

      {/* Assignée */}
      <div className="flex items-center gap-0.5 min-w-0">
        {task.assignedMembers && task.assignedMembers.length > 0 ? (
          <MembersPopover
            task={task}
            membersInfo={membersInfo}
            members={members}
            updateTask={updateTask}
            workspaceId={workspaceId}
            isTrigger={true}
            popoverOpenRef={popoverOpenRef}
          />
        ) : (
          <MembersPopover
            task={task}
            membersInfo={membersInfo}
            members={members}
            updateTask={updateTask}
            workspaceId={workspaceId}
            isTrigger={false}
            popoverOpenRef={popoverOpenRef}
          />
        )}
      </div>

      {/* Status */}
      <div className="flex items-center gap-1 min-w-0">
        <StatusPopoverWrapper
          columns={columns}
          column={column}
          task={task}
          moveTask={moveTask}
          workspaceId={workspaceId}
          popoverOpenRef={popoverOpenRef}
        />
      </div>

      {/* Date d'échéance */}
      <div className="flex items-center gap-1.5 text-xs min-w-0">
        {task.dueDate ? (
          <div className="relative group/date inline-flex items-center">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-muted/60 hover:ring-1 hover:ring-border transition-all cursor-pointer bg-transparent border-0 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="truncate font-normal text-foreground/70">
                    {formatDate(task.dueDate)}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" side="top" align="start">
                <div className="flex flex-col">
                  <div className="border-b p-2">
                    <CalendarComponent
                      mode="single"
                      selected={
                        task.dueDate ? new Date(task.dueDate) : undefined
                      }
                      onSelect={async (date) => {
                        if (date) {
                          try {
                            const existingDate = new Date(task.dueDate);
                            date.setHours(
                              existingDate.getHours(),
                              existingDate.getMinutes(),
                              0,
                              0,
                            );
                            await updateTask({
                              variables: {
                                input: {
                                  id: task.id,
                                  dueDate: date.toISOString(),
                                },
                                workspaceId,
                              },
                            });
                          } catch (error) {
                            console.error(
                              "Erreur lors de la mise à jour de la date:",
                              error,
                            );
                          }
                        }
                      }}
                      initialFocus
                      locale={fr}
                      fromDate={new Date()}
                      className="border-0 p-2 text-xs [--cell-size:--spacing(8)]"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await updateTask({
                    variables: {
                      input: { id: task.id, dueDate: null },
                      workspaceId,
                    },
                  });
                } catch (error) {
                  console.error(
                    "Erreur lors de la suppression de la date:",
                    error,
                  );
                }
              }}
              className="absolute -top-1.5 -right-2 w-3.5 h-3.5 bg-muted-foreground border border-white rounded-full flex items-center justify-center opacity-0 group-hover/date:opacity-100 transition-opacity cursor-pointer"
              title="Supprimer la date"
            >
              <X className="w-2 h-2 text-white stroke-[3]" />
            </button>
          </div>
        ) : (
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="cursor-pointer text-muted-foreground/70 hover:text-foreground transition-colors"
                onClick={(e) => e.stopPropagation()}
                title="Ajouter une date d'échéance"
              >
                <Calendar className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" side="top" align="start">
              <div className="flex flex-col">
                <div className="border-b p-2">
                  <CalendarComponent
                    mode="single"
                    selected={undefined}
                    onSelect={async (date) => {
                      if (date) {
                        try {
                          date.setHours(18, 0, 0, 0);
                          await updateTask({
                            variables: {
                              input: {
                                id: task.id,
                                dueDate: date.toISOString(),
                              },
                              workspaceId,
                            },
                          });
                        } catch (error) {
                          console.error(
                            "Erreur lors de la mise à jour de la date:",
                            error,
                          );
                        }
                      }
                    }}
                    initialFocus
                    locale={fr}
                    fromDate={new Date()}
                    className="border-0 p-2 text-xs [--cell-size:--spacing(8)]"
                  />
                </div>
                <div className="p-4 flex items-center gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Clock className="h-4 w-4 text-gray-500" />
                    </div>
                    <Input
                      type="time"
                      defaultValue="18:00"
                      className="pl-10 appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-datetime-edit-ampm-field]:hidden"
                      step="300"
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Priorité */}
      <div className="flex items-center gap-1 min-w-0">
        <PriorityPopoverWrapper
          task={task}
          updateTask={updateTask}
          workspaceId={workspaceId}
          popoverOpenRef={popoverOpenRef}
          trigger={
            <button
              className="bg-transparent border-0 p-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              {task.priority ? (
                getPriorityBadge(task.priority)
              ) : (
                <Badge
                  variant="outline"
                  className="inline-flex items-center gap-1 py-1 px-2.5 text-xs font-medium rounded-md text-muted-foreground"
                >
                  <Flag className="h-4 w-4 text-[#8D8D8D] fill-gray-400" />
                  <span className="text-muted-foreground">-</span>
                </Badge>
              )}
            </button>
          }
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted/50"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEditTask(task);
              }}
            >
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDeleteTask(task.id);
              }}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
});

/**
 * Composant pour afficher le Kanban en vue Liste (comme ClickUp)
 */
export function KanbanListView({
  columns,
  getTasksByColumn,
  filterTasks,
  onEditTask,
  onDeleteTask,
  onAddTask,
  onEditColumn,
  onDeleteColumn,
  members = [],
  selectedTaskIds,
  setSelectedTaskIds,
  moveTask,
  updateTask,
  createTask,
  boardId,
  workspaceId,
}) {
  const { isReadOnly, isOwner } = useSubscriptionAccess();
  const readOnlyTooltip = isReadOnly
    ? isOwner
      ? "Mode lecture seule · Renouvelez votre abonnement"
      : "Mode lecture seule · Contactez l'administrateur"
    : undefined;
  const [collapsedColumns, setCollapsedColumns] = useState(new Set());
  const [expandedEmptyColumns, setExpandedEmptyColumns] = useState(new Set());
  const [inlineAddColumnId, setInlineAddColumnId] = useState(null);
  const [isAnyPopoverOpen, setIsAnyPopoverOpen] = useState(false);
  const popoverOpenRef = useRef(false);
  const listRef = useRef(null);

  // Détecter automatiquement quand un popover Radix s'ouvre/ferme
  React.useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    const observer = new MutationObserver(() => {
      const hasOpen = !!container.querySelector('[data-state="open"]');
      setIsAnyPopoverOpen(hasOpen);
      popoverOpenRef.current = hasOpen;
    });
    observer.observe(container, {
      attributes: true,
      subtree: true,
      attributeFilter: ["data-state"],
    });
    return () => observer.disconnect();
  }, []);

  // Fonction wrapper pour récupérer les tâches filtrées
  const getFilteredTasksByColumn = useCallback(
    (columnId) => {
      const tasks = getTasksByColumn(columnId);
      return filterTasks ? filterTasks(tasks) : tasks;
    },
    [getTasksByColumn, filterTasks],
  );

  // Récupérer tous les IDs de membres de toutes les tâches
  const allMemberIds = useMemo(() => {
    const ids = new Set();
    columns.forEach((column) => {
      const tasks = getFilteredTasksByColumn(column.id);
      tasks.forEach((task) => {
        if (task.assignedMembers && Array.isArray(task.assignedMembers)) {
          task.assignedMembers.forEach((id) => ids.add(id));
        }
      });
    });
    return Array.from(ids);
  }, [columns, getFilteredTasksByColumn]);

  // Récupérer tous les tags du board
  const allBoardTags = useMemo(() => {
    const tags = [];
    columns.forEach((column) => {
      const tasks = getFilteredTasksByColumn(column.id);
      tasks.forEach((task) => {
        (task.tags || []).forEach((tag) => tags.push(tag));
      });
    });
    return tags;
  }, [columns, getFilteredTasksByColumn]);

  // Récupérer les infos complètes de tous les membres
  const { members: membersInfo } = useAssignedMembersInfo(allMemberIds);

  // Handler stable pour toggle de sélection — passé à TaskListRowContent
  // pour qu'on n'ait pas besoin de passer le Set selectedTaskIds (qui change
  // de réf à chaque sélection) au composant memoized.
  const handleToggleSelect = useCallback(
    (taskId, checked) => {
      setSelectedTaskIds((prev) => {
        const next = new Set(prev);
        if (checked) next.add(taskId);
        else next.delete(taskId);
        return next;
      });
    },
    [setSelectedTaskIds],
  );

  // Fonction pour récupérer un membre par son ID
  const getMemberById = (memberId) => {
    return members.find((m) => m.userId === memberId || m.id === memberId);
  };

  const toggleColumn = (columnId) => {
    const tasks = getFilteredTasksByColumn(columnId);
    if (tasks.length === 0) {
      // Pour les colonnes vides, gérer via expandedEmptyColumns
      setExpandedEmptyColumns((prev) => {
        const next = new Set(prev);
        if (next.has(columnId)) {
          next.delete(columnId);
        } else {
          next.add(columnId);
        }
        return next;
      });
    } else {
      setCollapsedColumns((prev) => {
        const next = new Set(prev);
        if (next.has(columnId)) {
          next.delete(columnId);
        } else {
          next.add(columnId);
        }
        return next;
      });
    }
  };

  // Ouvrir automatiquement une section quand on drag dessus
  const openColumnOnDrag = (columnId) => {
    setCollapsedColumns((prev) => {
      const next = new Set(prev);
      next.delete(columnId);
      return next;
    });
    setExpandedEmptyColumns((prev) => {
      const next = new Set(prev);
      next.add(columnId);
      return next;
    });
  };

  // Fonction pour vérifier si une section doit être fermée par défaut
  const isColumnCollapsedByDefault = (columnId) => {
    const tasks = getFilteredTasksByColumn(columnId);
    return tasks.length === 0;
  };

  // formatDate hoisté au module level

  // (getPriorityBadge déplacé au module level pour être accessible depuis
  // TaskListRowContent qui est au même niveau)

  const getPriorityLabel = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "High";
      case "medium":
        return "Medium";
      case "low":
        return "Low";
      default:
        return "";
    }
  };

  return (
    <div
      ref={listRef}
      className="relative space-y-4 bg-background pb-24 md:pb-12 lg:pb-16"
    >
      {/* Overlay transparent quand un popover est ouvert — bloque les clics parasites */}
      {isAnyPopoverOpen && <div className="fixed inset-0 z-[99]" />}
      {columns.map((column, columnIndex) => {
        const tasks = getFilteredTasksByColumn(column.id);
        const isCollapsed =
          collapsedColumns.has(column.id) ||
          (tasks.length === 0 &&
            !expandedEmptyColumns.has(column.id) &&
            inlineAddColumnId !== column.id);
        const allColumnsCollapsed =
          columns.length > 0 &&
          columns.every((c) => {
            const colTasks = getFilteredTasksByColumn(c.id);
            return (
              collapsedColumns.has(c.id) ||
              (colTasks.length === 0 &&
                !expandedEmptyColumns.has(c.id) &&
                inlineAddColumnId !== c.id)
            );
          });

        return (
          <div key={column.id} className="space-y-0">
            {/* En-tête de colonne pliable avec zone de drop si fermée */}
            {isCollapsed ? (
              <>
                <CollapsedColumnDropZone columnId={column.id}>
                  <div
                    className="flex items-center gap-3 py-2 px-4 sm:px-6 bg-muted/10 hover:bg-muted/20 cursor-pointer transition-colors group"
                    onClick={() => toggleColumn(column.id)}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                    >
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <div className="flex items-center gap-2 flex-1">
                      <div
                        className="px-2 py-1 rounded-md flex-shrink-0 text-xs font-medium border flex items-center gap-1"
                        style={{
                          backgroundColor: `${column.color || "#94a3b8"}20`,
                          borderColor: `${column.color || "#94a3b8"}20`,
                          color: column.color || "#94a3b8",
                        }}
                      >
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: column.color || "#94a3b8" }}
                        />
                        <span>{column.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-xs text-muted-foreground/60 font-medium"
                          style={{ color: column.color || "#94a3b8" }}
                        >
                          {tasks.length}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-52">
                            <DropdownMenuLabel className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                              Options du groupe
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditColumn?.(column);
                              }}
                              className="gap-2"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Renommer
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditColumn?.(column);
                              }}
                              className="gap-2"
                            >
                              <Settings className="h-3.5 w-3.5" />
                              Modifier le status
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleColumn(column.id);
                              }}
                              className="gap-2"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                              {isCollapsed
                                ? "Déplier le groupe"
                                : "Replier le groupe"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                const tasks = getFilteredTasksByColumn(
                                  column.id,
                                );
                                const newSelected = new Set(selectedTaskIds);
                                tasks.forEach((t) => newSelected.add(t.id));
                                setSelectedTaskIds(newSelected);
                              }}
                              className="gap-2"
                            >
                              <CheckCheck className="h-3.5 w-3.5" />
                              Tout sélectionner
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                if (allColumnsCollapsed) {
                                  setCollapsedColumns(new Set());
                                  setExpandedEmptyColumns(
                                    new Set(columns.map((c) => c.id)),
                                  );
                                } else {
                                  const allCollapsed = new Set(
                                    columns.map((c) => c.id),
                                  );
                                  setCollapsedColumns(allCollapsed);
                                  setExpandedEmptyColumns(new Set());
                                }
                              }}
                              className="gap-2"
                            >
                              <ChevronsDownUp className="h-3.5 w-3.5" />
                              {allColumnsCollapsed
                                ? "Déplier tous les groupes"
                                : "Replier tous les groupes"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteColumn?.(column);
                              }}
                              className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-600" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInlineAddColumnId(column.id);
                          }}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                          title={readOnlyTooltip || "Ajouter une tâche"}
                          disabled={isReadOnly}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CollapsedColumnDropZone>
                {inlineAddColumnId === column.id && (
                  <InlineAddTask
                    columnId={column.id}
                    boardId={boardId}
                    columns={columns}
                    members={members}
                    createTask={createTask}
                    workspaceId={workspaceId}
                    onCancel={() => setInlineAddColumnId(null)}
                    onEditTask={onEditTask}
                  />
                )}
              </>
            ) : (
              <>
                {/* Bloc sticky : header groupe + titres colonnes */}
                <div className="sticky top-6 z-[20] bg-background">
                  {/* En-tête de section cliquable */}
                  <div
                    className="flex items-center gap-3 py-2 px-4 sm:px-6 bg-muted/5 hover:bg-muted/10 cursor-pointer transition-all group"
                    onClick={() => toggleColumn(column.id)}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-muted/50 rounded transition-colors"
                    >
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </Button>
                    <div className="flex items-center gap-2 flex-1">
                      <div
                        className="px-2 py-1 rounded-md flex-shrink-0 text-xs font-medium border flex items-center gap-1"
                        style={{
                          backgroundColor: `${column.color || "#94a3b8"}20`,
                          borderColor: `${column.color || "#94a3b8"}20`,
                          color: column.color || "#94a3b8",
                        }}
                      >
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: column.color || "#94a3b8" }}
                        />
                        <span>{column.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-xs text-muted-foreground/60 font-medium"
                          style={{ color: column.color || "#94a3b8" }}
                        >
                          {tasks.length}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-52">
                            <DropdownMenuLabel className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                              Options du groupe
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditColumn?.(column);
                              }}
                              className="gap-2"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Renommer
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditColumn?.(column);
                              }}
                              className="gap-2"
                            >
                              <Settings className="h-3.5 w-3.5" />
                              Modifier le status
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleColumn(column.id);
                              }}
                              className="gap-2"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                              {isCollapsed
                                ? "Déplier le groupe"
                                : "Replier le groupe"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                const tasks = getFilteredTasksByColumn(
                                  column.id,
                                );
                                const newSelected = new Set(selectedTaskIds);
                                tasks.forEach((t) => newSelected.add(t.id));
                                setSelectedTaskIds(newSelected);
                              }}
                              className="gap-2"
                            >
                              <CheckCheck className="h-3.5 w-3.5" />
                              Tout sélectionner
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                if (allColumnsCollapsed) {
                                  setCollapsedColumns(new Set());
                                  setExpandedEmptyColumns(
                                    new Set(columns.map((c) => c.id)),
                                  );
                                } else {
                                  const allCollapsed = new Set(
                                    columns.map((c) => c.id),
                                  );
                                  setCollapsedColumns(allCollapsed);
                                  setExpandedEmptyColumns(new Set());
                                }
                              }}
                              className="gap-2"
                            >
                              <ChevronsDownUp className="h-3.5 w-3.5" />
                              {allColumnsCollapsed
                                ? "Déplier tous les groupes"
                                : "Replier tous les groupes"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteColumn?.(column);
                              }}
                              className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-600" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInlineAddColumnId(column.id);
                          }}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                          title={readOnlyTooltip || "Ajouter une tâche"}
                          disabled={isReadOnly}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {/* Header de section avec colonnes — dans le bloc sticky */}
                  <div
                    className="grid px-4 sm:px-6 py-2 text-xs font-medium text-muted-foreground/70 tracking-wide relative after:absolute after:bottom-0 after:left-6 after:right-6 sm:after:left-8 sm:after:right-8 after:h-px after:bg-border/60 after:content-['']"
                    style={{
                      gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr 80px",
                      gap: "2rem",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 opacity-0" />
                      Nom
                    </div>
                    <div className="flex items-center">Assigné à</div>
                    <div className="flex items-center">Status</div>
                    <div className="flex items-center">Échéance</div>
                    <div className="flex items-center">Priorité</div>
                    <div className="flex items-center justify-center">
                      Actions
                    </div>
                  </div>
                </div>
                {/* Conteneur avec scroll pour le tableau */}
                <div className="w-full overflow-x-auto scrollbar-hide">
                  <div className="w-max min-w-full">
                    {/* Liste des tâches */}
                    <div
                      data-dnd-list-zone={column.id}
                      data-dnd-list-zone-color={column.color || "#5A50FF"}
                      style={{
                        minHeight: tasks.length === 0 ? "80px" : "auto",
                      }}
                    >
                      {tasks.length === 0 ? (
                        <EmptyColumnDropZone columnId={column.id} />
                      ) : (
                        tasks.map((task, taskIndex) => (
                          <TaskRow
                            key={task.id}
                            task={task}
                            column={column}
                            onEditTask={onEditTask}
                            index={taskIndex}
                            isSelected={selectedTaskIds.has(task.id)}
                            isPrevSelected={
                              taskIndex > 0 &&
                              selectedTaskIds.has(tasks[taskIndex - 1].id)
                            }
                            popoverOpenRef={popoverOpenRef}
                          >
                            <TaskListRowContent
                              task={task}
                              column={column}
                              columns={columns}
                              isSelected={selectedTaskIds.has(task.id)}
                              onToggleSelect={handleToggleSelect}
                              members={members}
                              membersInfo={membersInfo}
                              updateTask={updateTask}
                              moveTask={moveTask}
                              workspaceId={workspaceId}
                              allBoardTags={allBoardTags}
                              popoverOpenRef={popoverOpenRef}
                              onEditTask={onEditTask}
                              onDeleteTask={onDeleteTask}
                            />
                            {/* LEGACY-INLINE-START — bloc remplacé par TaskListRowContent ci-dessus, gardé temporairement pour preuve mais désactivé via condition false */}
                            {false && (
                              <>
                                {/* Nom avec drag handle et checkbox */}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-3">
                                    {/* Drag handle visible au hover */}
                                    <GripVertical className="h-4 w-4 text-muted-foreground/40 flex-shrink-0 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
                                    {/* Checkbox visible au hover ou si cochée */}
                                    <Checkbox
                                      checked={selectedTaskIds.has(task.id)}
                                      onCheckedChange={(checked) => {
                                        const newSelected = new Set(
                                          selectedTaskIds,
                                        );
                                        if (checked === true) {
                                          newSelected.add(task.id);
                                        } else if (checked === false) {
                                          newSelected.delete(task.id);
                                        }
                                        setSelectedTaskIds(newSelected);
                                      }}
                                      className={`flex-shrink-0 h-4 w-4 border-muted-foreground/30 mr-4 transition-opacity ${selectedTaskIds.has(task.id) ? "opacity-100 border-[#5A50FF] bg-[#5A50FF] text-white data-[state=checked]:bg-[#5A50FF] data-[state=checked]:border-[#5A50FF]" : "opacity-0 group-hover:opacity-100"}`}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    {/* Rond de couleur du status */}
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <button
                                          className="flex-shrink-0 w-2.5 h-2.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                                          style={{
                                            backgroundColor:
                                              column.color || "#94a3b8",
                                            border: `1.5px solid ${column.color || "#94a3b8"}60`,
                                            outline: `1.5px solid ${column.color || "#94a3b8"}30`,
                                            outlineOffset: "1.5px",
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                          title="Changer le status"
                                        />
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent
                                        align="start"
                                        className="w-40"
                                      >
                                        {columns.map((col) => (
                                          <DropdownMenuItem
                                            key={col.id}
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              // Déplacer la tâche vers la colonne col.id
                                              try {
                                                await moveTask({
                                                  variables: {
                                                    id: task.id,
                                                    columnId: col.id,
                                                    position: 0,
                                                    workspaceId,
                                                  },
                                                });
                                              } catch (error) {
                                                console.error(
                                                  "Erreur lors du déplacement de la tâche:",
                                                  error,
                                                );
                                              }
                                            }}
                                            className="flex items-center gap-2 cursor-pointer"
                                          >
                                            <div
                                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                              style={{
                                                backgroundColor:
                                                  col.color || "#94a3b8",
                                              }}
                                            />
                                            <span>{col.title}</span>
                                          </DropdownMenuItem>
                                        ))}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                    <InlineEditTitle
                                      task={task}
                                      updateTask={updateTask}
                                      workspaceId={workspaceId}
                                      popoverOpenRef={popoverOpenRef}
                                      allBoardTags={allBoardTags}
                                    />
                                  </div>
                                </div>

                                {/* Assignée */}
                                <div className="flex items-center gap-0.5 min-w-0">
                                  {task.assignedMembers &&
                                  task.assignedMembers.length > 0 ? (
                                    <MembersPopover
                                      task={task}
                                      membersInfo={membersInfo}
                                      members={members}
                                      updateTask={updateTask}
                                      workspaceId={workspaceId}
                                      isTrigger={true}
                                      popoverOpenRef={popoverOpenRef}
                                    />
                                  ) : (
                                    <MembersPopover
                                      task={task}
                                      membersInfo={membersInfo}
                                      members={members}
                                      updateTask={updateTask}
                                      workspaceId={workspaceId}
                                      isTrigger={false}
                                      popoverOpenRef={popoverOpenRef}
                                    />
                                  )}
                                </div>

                                {/* Status */}
                                <div className="flex items-center gap-1 min-w-0">
                                  <StatusPopoverWrapper
                                    columns={columns}
                                    column={column}
                                    task={task}
                                    moveTask={moveTask}
                                    workspaceId={workspaceId}
                                    popoverOpenRef={popoverOpenRef}
                                  />
                                </div>

                                {/* Date d'échéance */}
                                <div className="flex items-center gap-1.5 text-xs min-w-0">
                                  {task.dueDate ? (
                                    <div className="relative group/date inline-flex items-center">
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <button
                                            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-muted/60 hover:ring-1 hover:ring-border transition-all cursor-pointer bg-transparent border-0 p-0"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <span className="truncate font-normal text-foreground/70">
                                              {formatDate(task.dueDate)}
                                            </span>
                                          </button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                          className="w-auto p-0"
                                          side="top"
                                          align="start"
                                        >
                                          <div className="flex flex-col">
                                            <div className="border-b p-2">
                                              <CalendarComponent
                                                mode="single"
                                                selected={
                                                  task.dueDate
                                                    ? new Date(task.dueDate)
                                                    : undefined
                                                }
                                                onSelect={async (date) => {
                                                  if (date) {
                                                    try {
                                                      const existingDate =
                                                        new Date(task.dueDate);
                                                      date.setHours(
                                                        existingDate.getHours(),
                                                        existingDate.getMinutes(),
                                                        0,
                                                        0,
                                                      );
                                                      await updateTask({
                                                        variables: {
                                                          input: {
                                                            id: task.id,
                                                            dueDate:
                                                              date.toISOString(),
                                                          },
                                                          workspaceId,
                                                        },
                                                      });
                                                    } catch (error) {
                                                      console.error(
                                                        "Erreur lors de la mise à jour de la date:",
                                                        error,
                                                      );
                                                    }
                                                  }
                                                }}
                                                initialFocus
                                                locale={fr}
                                                fromDate={new Date()}
                                                className="border-0 p-2 text-xs [--cell-size:--spacing(8)]"
                                              />
                                            </div>
                                          </div>
                                        </PopoverContent>
                                      </Popover>
                                      <button
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          try {
                                            await updateTask({
                                              variables: {
                                                input: {
                                                  id: task.id,
                                                  dueDate: null,
                                                },
                                                workspaceId,
                                              },
                                            });
                                          } catch (error) {
                                            console.error(
                                              "Erreur lors de la suppression de la date:",
                                              error,
                                            );
                                          }
                                        }}
                                        className="absolute -top-1.5 -right-2 w-3.5 h-3.5 bg-muted-foreground border border-white rounded-full flex items-center justify-center opacity-0 group-hover/date:opacity-100 transition-opacity cursor-pointer"
                                        title="Supprimer la date"
                                      >
                                        <X className="w-2 h-2 text-white stroke-[3]" />
                                      </button>
                                    </div>
                                  ) : (
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <button
                                          className="cursor-pointer text-muted-foreground/70 hover:text-foreground transition-colors"
                                          onClick={(e) => e.stopPropagation()}
                                          title="Ajouter une date d'échéance"
                                        >
                                          <Calendar className="h-4 w-4" />
                                        </button>
                                      </PopoverTrigger>
                                      <PopoverContent
                                        className="w-auto p-0"
                                        side="top"
                                        align="start"
                                      >
                                        <div className="flex flex-col">
                                          <div className="border-b p-2">
                                            <CalendarComponent
                                              mode="single"
                                              selected={undefined}
                                              onSelect={async (date) => {
                                                if (date) {
                                                  try {
                                                    date.setHours(18, 0, 0, 0);
                                                    await updateTask({
                                                      variables: {
                                                        input: {
                                                          id: task.id,
                                                          dueDate:
                                                            date.toISOString(),
                                                        },
                                                        workspaceId,
                                                      },
                                                    });
                                                  } catch (error) {
                                                    console.error(
                                                      "Erreur lors de la mise à jour de la date:",
                                                      error,
                                                    );
                                                  }
                                                }
                                              }}
                                              initialFocus
                                              locale={fr}
                                              fromDate={new Date()}
                                              className="border-0 p-2 text-xs [--cell-size:--spacing(8)]"
                                            />
                                          </div>
                                          <div className="p-4 flex items-center gap-2">
                                            <div className="relative flex-1">
                                              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                <Clock className="h-4 w-4 text-gray-500" />
                                              </div>
                                              <Input
                                                type="time"
                                                defaultValue="18:00"
                                                className="pl-10 appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-datetime-edit-ampm-field]:hidden"
                                                step="300"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                  )}
                                </div>

                                {/* Priorité */}
                                <div className="flex items-center gap-1 min-w-0">
                                  <PriorityPopoverWrapper
                                    task={task}
                                    updateTask={updateTask}
                                    workspaceId={workspaceId}
                                    popoverOpenRef={popoverOpenRef}
                                    trigger={
                                      <button
                                        className="bg-transparent border-0 p-0 cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {task.priority ? (
                                          getPriorityBadge(task.priority)
                                        ) : (
                                          <Badge
                                            variant="outline"
                                            className="inline-flex items-center gap-1 py-1 px-2.5 text-xs font-medium rounded-md text-muted-foreground"
                                          >
                                            <Flag className="h-4 w-4 text-[#8D8D8D] fill-gray-400" />
                                            <span className="text-muted-foreground">
                                              -
                                            </span>
                                          </Badge>
                                        )}
                                      </button>
                                    }
                                  />
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-center gap-1">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted/50"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="end"
                                      className="w-40"
                                    >
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onEditTask(task);
                                        }}
                                      >
                                        Modifier
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onDeleteTask(task.id);
                                        }}
                                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                      >
                                        Supprimer
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </>
                            )}
                            {/* LEGACY-INLINE-END */}
                          </TaskRow>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Ajout inline ou bouton "Ajouter une tâche" */}
                {inlineAddColumnId === column.id ? (
                  <InlineAddTask
                    columnId={column.id}
                    boardId={boardId}
                    columns={columns}
                    members={members}
                    createTask={createTask}
                    workspaceId={workspaceId}
                    onCancel={() => setInlineAddColumnId(null)}
                    onEditTask={onEditTask}
                  />
                ) : (
                  <div
                    className={`px-4 sm:px-6 py-1.5 min-h-[36px] flex items-center hover:bg-muted/50 transition-colors group/add ${isReadOnly ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
                    onClick={() =>
                      !isReadOnly && setInlineAddColumnId(column.id)
                    }
                    title={readOnlyTooltip}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 flex-shrink-0" />
                      <div className="h-4 w-4 flex-shrink-0 mr-4" />
                      <div
                        className="flex items-center gap-2 text-sm font-normal"
                        style={{ color: "#646464" }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span className="px-2 py-0.5 rounded-md border border-transparent group-hover/add:border-border/60 group-hover/add:bg-white dark:group-hover/add:bg-background group-hover/add:text-foreground/70 transition-all">
                          Ajouter une tâche
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      {/* Barre d'actions groupées */}
      <BulkActionBar
        selectedTaskIds={selectedTaskIds}
        setSelectedTaskIds={setSelectedTaskIds}
        columns={columns}
        members={members}
        updateTask={updateTask}
        moveTask={moveTask}
        onDeleteTask={onDeleteTask}
        createTask={createTask}
        getTasksByColumn={getFilteredTasksByColumn}
        boardId={boardId}
        workspaceId={workspaceId}
        listRef={listRef}
      />
    </div>
  );
}
