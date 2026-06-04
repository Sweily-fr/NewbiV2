"use client";

import React, { useState } from "react";
import { toast } from "@/src/components/ui/sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import { Switch } from "@/src/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import {
  Zap,
  Plus,
  Trash2,
  Loader2,
  CreditCard,
  FileCheck,
  UserPlus,
  Clock,
  ArrowRight,
  Mail,
  Pencil,
} from "lucide-react";
import {
  useClientAutomations,
  useCreateClientAutomation,
  useUpdateClientAutomation,
  useDeleteClientAutomation,
  useToggleClientAutomation,
} from "@/src/hooks/useClientAutomations";
import { useClientLists } from "@/src/hooks/useClientLists";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import {
  useCrmEmailAutomations,
  useCreateCrmEmailAutomation,
  useUpdateCrmEmailAutomation,
  useDeleteCrmEmailAutomation,
  useToggleCrmEmailAutomation,
} from "@/src/hooks/useCrmEmailAutomations";
import { useClientCustomFields } from "@/src/hooks/useClientCustomFields";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import { getPlanLimits } from "@/src/lib/plan-limits";
import { Lock } from "lucide-react";

const TRIGGER_TYPES = [
  {
    value: "FIRST_INVOICE_PAID",
    label: "Première facture payée",
    icon: CreditCard,
  },
  {
    value: "INVOICE_PAID",
    label: "Facture payée",
    icon: CreditCard,
  },
  {
    value: "QUOTE_ACCEPTED",
    label: "Devis accepté",
    icon: FileCheck,
  },
  {
    value: "CLIENT_CREATED",
    label: "Client créé",
    icon: UserPlus,
  },
  {
    value: "INVOICE_OVERDUE",
    label: "Facture en retard",
    icon: Clock,
  },
];

const ACTION_TYPES = [
  {
    value: "MOVE_TO_LIST",
    label: "Déplacer vers",
  },
  {
    value: "ADD_TO_LIST",
    label: "Ajouter à",
  },
  {
    value: "REMOVE_FROM_LIST",
    label: "Retirer de",
  },
];

const EMAIL_TIMING_TYPES = [
  { value: "ON_DATE", label: "Le jour même" },
  { value: "BEFORE_DATE", label: "Avant" },
  { value: "AFTER_DATE", label: "Après" },
];

function AutomationRow({ automation, lists, onUpdate, onDelete, onToggle }) {
  const [localData, setLocalData] = useState({
    triggerType: automation.triggerType,
    actionType: automation.actionType,
    targetListId: automation.targetList?.id || "",
    isActive: automation.isActive,
  });

  const handleFieldChange = (field, value) => {
    const newData = { ...localData, [field]: value };
    setLocalData(newData);

    onUpdate(automation.id, {
      name: automation.name,
      description: automation.description,
      triggerType: newData.triggerType,
      actionType: newData.actionType,
      targetListId: newData.targetListId,
      isActive: newData.isActive,
    });
  };

  const handleToggle = () => {
    const newIsActive = !localData.isActive;
    setLocalData({ ...localData, isActive: newIsActive });
    onToggle(automation.id);
  };

  return (
    <div className="flex items-center gap-2 py-2">
      <span className="text-sm text-muted-foreground w-12 flex-shrink-0">
        Quand
      </span>

      <Select
        value={localData.triggerType}
        onValueChange={(value) => handleFieldChange("triggerType", value)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="z-[9999]">
          {TRIGGER_TYPES.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />

      <Select
        value={localData.actionType}
        onValueChange={(value) => handleFieldChange("actionType", value)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="z-[9999]">
          {ACTION_TYPES.map((a) => (
            <SelectItem key={a.value} value={a.value}>
              {a.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={localData.targetListId}
        onValueChange={(value) => handleFieldChange("targetListId", value)}
      >
        <SelectTrigger className="flex-1 min-w-[120px]">
          <SelectValue placeholder="Liste..." />
        </SelectTrigger>
        <SelectContent className="z-[9999]">
          {lists.map((list) => (
            <SelectItem key={list.id} value={list.id}>
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: list.color }}
                />
                {list.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Switch
        checked={localData.isActive}
        onCheckedChange={handleToggle}
        className="data-[state=checked]:bg-[#5b50ff] flex-shrink-0"
      />

      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(automation);
        }}
        className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function NewAutomationRow({ lists, onCreate, onCancel, isCreating }) {
  const [formData, setFormData] = useState({
    triggerType: "CLIENT_CREATED",
    actionType: "ADD_TO_LIST",
    targetListId: "",
  });

  const generateName = (triggerType, actionType, targetListId) => {
    const trigger = TRIGGER_TYPES.find((t) => t.value === triggerType);
    const action = ACTION_TYPES.find((a) => a.value === actionType);
    const list = lists.find((l) => l.id === targetListId);
    return `${trigger?.label || "Déclencheur"} → ${action?.label || "Action"} ${list?.name || "Liste"}`;
  };

  const handleCreate = () => {
    if (!formData.targetListId) {
      toast.error("Veuillez sélectionner une liste");
      return;
    }
    onCreate({
      name: generateName(
        formData.triggerType,
        formData.actionType,
        formData.targetListId,
      ),
      description: "",
      triggerType: formData.triggerType,
      actionType: formData.actionType,
      targetListId: formData.targetListId,
      isActive: true,
    });
  };

  return (
    <div className="space-y-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground w-12 flex-shrink-0">
          Quand
        </span>

        <Select
          value={formData.triggerType}
          onValueChange={(value) =>
            setFormData({ ...formData, triggerType: value })
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[9999]">
            {TRIGGER_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />

        <Select
          value={formData.actionType}
          onValueChange={(value) =>
            setFormData({ ...formData, actionType: value })
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[9999]">
            {ACTION_TYPES.map((a) => (
              <SelectItem key={a.value} value={a.value}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={formData.targetListId}
          onValueChange={(value) =>
            setFormData({ ...formData, targetListId: value })
          }
        >
          <SelectTrigger className="flex-1 min-w-[120px]">
            <SelectValue placeholder="Liste..." />
          </SelectTrigger>
          <SelectContent className="z-[9999]">
            {lists.map((list) => (
              <SelectItem key={list.id} value={list.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: list.color }}
                  />
                  {list.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button size="sm" onClick={handleCreate} className="flex-shrink-0">
          Créer
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="h-8 w-8 flex-shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function EmailAutomationRow({ automation, onEdit, onDelete, onToggle }) {
  const [isActive, setIsActive] = useState(automation.isActive);

  const handleToggle = () => {
    const newIsActive = !isActive;
    setIsActive(newIsActive);
    onToggle(automation.id);
  };

  const getTimingLabel = () => {
    const timingType = automation.timing?.type;
    const timing = EMAIL_TIMING_TYPES.find((t) => t.value === timingType);
    if (timingType === "ON_DATE") {
      return timing?.label || "";
    }
    return `${automation.timing?.daysOffset || 0}j ${timing?.label?.toLowerCase() || ""}`;
  };

  return (
    <div className="flex items-center gap-2 py-2">
      <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{automation.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {automation.customField?.name} - {getTimingLabel()} à{" "}
          {automation.timing?.sendHour || 9}h
        </p>
      </div>

      <Switch
        checked={isActive}
        onCheckedChange={handleToggle}
        className="data-[state=checked]:bg-[#5b50ff] flex-shrink-0"
      />

      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(automation);
        }}
        className="h-8 w-8 text-muted-foreground hover:text-[#5b50ff] flex-shrink-0"
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(automation);
        }}
        className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function EmailAutomationForm({
  dateFields,
  automation,
  onSubmit,
  onCancel,
  isSubmitting,
}) {
  const isEditing = !!automation;
  const [formData, setFormData] = useState({
    name: automation?.name || "",
    triggerFieldId: automation?.customFieldId || "",
    timing: automation?.timing?.type || "ON_DATE",
    daysOffset: automation?.timing?.daysOffset || 1,
    sendHour: automation?.timing?.sendHour ?? 9,
    subject: automation?.email?.subject || "",
    body: automation?.email?.body || "",
  });

  const selectedField = dateFields.find(
    (f) => f.id === formData.triggerFieldId,
  );

  const generateName = () => {
    if (!selectedField) return "Nouvelle automatisation email";
    const timing = EMAIL_TIMING_TYPES.find((t) => t.value === formData.timing);
    if (formData.timing === "ON_DATE") {
      return `Email - ${selectedField.name}`;
    }
    return `Email - ${timing?.label} ${formData.daysOffset}j ${selectedField.name}`;
  };

  const handleSubmit = () => {
    if (!formData.triggerFieldId) {
      toast.error("Veuillez sélectionner un champ date");
      return;
    }
    if (!formData.subject.trim()) {
      toast.error("Veuillez saisir un sujet");
      return;
    }
    if (!formData.body.trim()) {
      toast.error("Veuillez saisir un contenu");
      return;
    }
    // Structure conforme au schéma GraphQL
    onSubmit({
      name: formData.name || generateName(),
      customFieldId: formData.triggerFieldId,
      timing: {
        type: formData.timing,
        daysOffset: formData.timing === "ON_DATE" ? 0 : formData.daysOffset,
        sendHour: formData.sendHour,
      },
      email: {
        subject: formData.subject,
        body: formData.body,
      },
      isActive: automation?.isActive ?? true,
    });
  };

  return (
    <div className="mt-3 rounded-lg border bg-muted/30 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Mail className="w-4 h-4 text-[#5b50ff] flex-shrink-0" />
        <span className="text-sm font-medium">
          {isEditing
            ? "Modifier l'automatisation email"
            : "Nouvelle automatisation email"}
        </span>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          Champ date déclencheur
        </label>
        <Select
          value={formData.triggerFieldId}
          onValueChange={(value) =>
            setFormData({ ...formData, triggerFieldId: value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sélectionner un champ date..." />
          </SelectTrigger>
          <SelectContent className="z-[9999]">
            {dateFields.map((field) => (
              <SelectItem key={field.id} value={field.id}>
                {field.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          Quand envoyer
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={formData.timing}
            onValueChange={(value) =>
              setFormData({ ...formData, timing: value })
            }
          >
            <SelectTrigger className="w-[160px] flex-shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[9999]">
              {EMAIL_TIMING_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {formData.timing !== "ON_DATE" && (
            <div className="flex items-center gap-2 flex-shrink-0 border rounded-md px-3 h-9 bg-background">
              <input
                type="number"
                min="1"
                max="365"
                value={formData.daysOffset}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    daysOffset: parseInt(e.target.value) || 1,
                  })
                }
                className="w-10 text-center text-sm bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                jour{formData.daysOffset > 1 ? "s" : ""}
              </span>
            </div>
          )}

          <span className="text-sm text-muted-foreground flex-shrink-0">à</span>

          <Select
            value={formData.sendHour.toString()}
            onValueChange={(value) =>
              setFormData({ ...formData, sendHour: parseInt(value) })
            }
          >
            <SelectTrigger className="w-[90px] flex-shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[9999] max-h-48">
              {Array.from({ length: 24 }, (_, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {i}h00
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          Sujet de l'email
        </label>
        <Input
          placeholder="Ex: Rappel - {customFieldName}"
          value={formData.subject}
          onChange={(e) =>
            setFormData({ ...formData, subject: e.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          Contenu de l'email
        </label>
        <textarea
          placeholder="Bonjour {clientName},..."
          value={formData.body}
          onChange={(e) => setFormData({ ...formData, body: e.target.value })}
          className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <p className="text-[11px] text-muted-foreground">
          Variables disponibles :{" "}
          <code className="text-[10px]">{"{clientName}"}</code>,{" "}
          <code className="text-[10px]">{"{clientEmail}"}</code>,{" "}
          <code className="text-[10px]">{"{customFieldValue}"}</code>
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Annuler
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Enregistrer" : "Créer"}
        </Button>
      </div>
    </div>
  );
}

export default function AutomationsPopover({ trigger }) {
  const { workspaceId } = useWorkspace();
  const { subscription } = useSubscription();
  const planLimits = getPlanLimits(subscription?.plan);
  const canUseClientAutomations = planLimits.clientAutomations;
  const canUseEmailAutomations = planLimits.crmEmailAutomations;

  const {
    automations,
    loading: automationsLoading,
    refetch,
  } = useClientAutomations(workspaceId);
  const { lists, loading: listsLoading } = useClientLists(workspaceId);
  const { automations: emailAutomations, refetch: refetchEmailAutomations } =
    useCrmEmailAutomations(workspaceId);
  const { fields: customFields } = useClientCustomFields(workspaceId);
  const { createAutomation } = useCreateClientAutomation();
  const { updateAutomation } = useUpdateClientAutomation();
  const { deleteAutomation } = useDeleteClientAutomation();
  const { toggleAutomation } = useToggleClientAutomation();
  const { createAutomation: createEmailAutomation, loading: creatingEmail } =
    useCreateCrmEmailAutomation();
  const { updateAutomation: updateEmailAutomation, loading: updatingEmail } =
    useUpdateCrmEmailAutomation();
  const { deleteAutomation: deleteEmailAutomation } =
    useDeleteCrmEmailAutomation();
  const { toggleAutomation: toggleEmailAutomation } =
    useToggleCrmEmailAutomation();

  const [isOpen, setIsOpen] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showNewEmailForm, setShowNewEmailForm] = useState(false);
  const [editingEmailAutomation, setEditingEmailAutomation] = useState(null);
  const [deletingAutomation, setDeletingAutomation] = useState(null);
  const [deletingEmailAutomation, setDeletingEmailAutomation] = useState(null);

  // Filtrer les champs de type DATE pour les automatisations email
  const dateFields = customFields.filter((f) => f.fieldType === "DATE");

  const handleCreate = async (input) => {
    setShowNewForm(false);
    try {
      await createAutomation(workspaceId, input);
      refetch();
    } catch (error) {
      toast.error("Erreur lors de la création");
    }
  };

  const handleUpdate = (id, input) => {
    updateAutomation(workspaceId, id, input).catch(() => {
      toast.error("Erreur lors de la modification");
      refetch();
    });
  };

  const handleDelete = async () => {
    setDeletingAutomation(null);
    try {
      await deleteAutomation(workspaceId, deletingAutomation.id);
      refetch();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleToggle = (id) => {
    toggleAutomation(workspaceId, id)
      .then(() => refetch())
      .catch(() => {
        toast.error("Erreur lors du basculement");
        refetch();
      });
  };

  // Handlers pour les automatisations email
  const handleCreateEmail = async (input) => {
    setShowNewEmailForm(false);
    try {
      await createEmailAutomation(workspaceId, input);
      refetchEmailAutomations();
      toast.success("Automatisation email créée");
    } catch (error) {
      toast.error("Erreur lors de la création");
    }
  };

  const handleUpdateEmail = async (input) => {
    const id = editingEmailAutomation?.id;
    if (!id) return;
    try {
      await updateEmailAutomation(workspaceId, id, input);
      setEditingEmailAutomation(null);
      refetchEmailAutomations();
      toast.success("Automatisation email modifiée");
    } catch (error) {
      toast.error("Erreur lors de la modification");
    }
  };

  const handleDeleteEmail = async () => {
    setDeletingEmailAutomation(null);
    try {
      await deleteEmailAutomation(workspaceId, deletingEmailAutomation.id);
      refetchEmailAutomations();
      toast.success("Automatisation email supprimée");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleToggleEmail = (id) => {
    toggleEmailAutomation(workspaceId, id)
      .then(() => refetchEmailAutomations())
      .catch(() => {
        toast.error("Erreur lors du basculement");
        refetchEmailAutomations();
      });
  };

  const isLoading = automationsLoading && automations.length === 0;
  const activeListCount = automations.filter((a) => a.isActive).length;
  const activeEmailCount = emailAutomations.filter((a) => a.isActive).length;
  const activeCount = activeListCount + activeEmailCount;

  return (
    <>
      <Popover
        open={isOpen || !!deletingAutomation || !!deletingEmailAutomation}
        onOpenChange={(open) => {
          if (!deletingAutomation && !deletingEmailAutomation) {
            setIsOpen(open);
          }
        }}
      >
        <PopoverTrigger asChild>
          {trigger || (
            <Button variant="outline" size="icon" className="relative">
              <Zap
                className={activeCount > 0 ? "text-[#5b50ff]" : ""}
                style={{ width: "14px", height: "14px" }}
              />
              {activeCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-white text-[#5b50ff] text-[10px] font-semibold shadow-sm border">
                  {activeCount}
                </span>
              )}
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[720px] p-0">
          {!canUseClientAutomations ? (
            /* Freelance: no automations at all */
            <div className="p-6 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <h4 className="font-medium">Automatisations</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Les automatisations clients sont disponibles à partir du plan
                PME.
              </p>
              <p className="text-xs text-muted-foreground">
                Passez à un plan supérieur pour automatiser la gestion de vos
                listes et emails clients.
              </p>
            </div>
          ) : (
            <Tabs defaultValue="lists" className="w-full">
              {/* Header avec tabs */}
              <div className="p-4 border-b">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4" style={{ color: "#5b50ff" }} />
                  <h4 className="font-medium">Automatisations</h4>
                </div>
                <TabsList className="w-full">
                  <TabsTrigger value="lists" className="flex-1 gap-2">
                    <ArrowRight className="w-3 h-3" />
                    Listes
                    {activeListCount > 0 && (
                      <Badge variant="secondary" className="text-xs ml-1">
                        {activeListCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="emails"
                    className="flex-1 gap-2"
                    disabled={!canUseEmailAutomations}
                  >
                    <Mail className="w-3 h-3" />
                    Emails
                    {canUseEmailAutomations && activeEmailCount > 0 && (
                      <Badge variant="secondary" className="text-xs ml-1">
                        {activeEmailCount}
                      </Badge>
                    )}
                    {!canUseEmailAutomations && (
                      <Lock className="w-3 h-3 text-muted-foreground" />
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Onglet Automatisations Listes */}
              <TabsContent value="lists" className="m-0">
                <p className="text-xs text-muted-foreground px-4 pt-3">
                  Déplacez automatiquement vos contacts entre les listes
                </p>
                <div className="p-4 space-y-1 max-h-[300px] overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : automations.length === 0 && !showNewForm ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Aucune automatisation. Cliquez sur "Ajouter" pour
                      commencer.
                    </p>
                  ) : (
                    <>
                      {automations.map((automation) => (
                        <AutomationRow
                          key={automation.id}
                          automation={automation}
                          lists={lists}
                          onUpdate={handleUpdate}
                          onDelete={setDeletingAutomation}
                          onToggle={handleToggle}
                        />
                      ))}
                    </>
                  )}

                  {showNewForm && (
                    <NewAutomationRow
                      lists={lists}
                      onCreate={handleCreate}
                      onCancel={() => setShowNewForm(false)}
                    />
                  )}
                </div>

                <div className="p-4 border-t">
                  {!showNewForm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewForm(true)}
                      className="w-full justify-start text-muted-foreground"
                      disabled={lists.length === 0}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter une automatisation
                    </Button>
                  )}

                  {lists.length === 0 && (
                    <p className="text-xs text-amber-600 mt-2">
                      Créez d'abord des listes pour configurer des
                      automatisations.
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* Onglet Automatisations Email */}
              <TabsContent value="emails" className="m-0">
                {!canUseEmailAutomations ? (
                  <div className="p-6 text-center space-y-2">
                    <Lock className="w-5 h-5 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Les automatisations email sont disponibles avec le plan
                      Entreprise.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Passez au plan Entreprise pour envoyer des emails
                      automatiques basés sur vos champs personnalisés.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground px-4 pt-3">
                      Envoyez des emails automatiques basés sur des dates
                    </p>
                    <div className="p-4 space-y-1 max-h-[300px] overflow-y-auto">
                      {emailAutomations.length === 0 && !showNewEmailForm ? (
                        <p className="text-sm text-muted-foreground text-center py-6">
                          Aucune automatisation email. Cliquez sur "Ajouter"
                          pour commencer.
                        </p>
                      ) : (
                        <>
                          {emailAutomations.map((automation) =>
                            editingEmailAutomation?.id === automation.id ? (
                              <EmailAutomationForm
                                key={automation.id}
                                dateFields={dateFields}
                                automation={editingEmailAutomation}
                                onSubmit={handleUpdateEmail}
                                onCancel={() => setEditingEmailAutomation(null)}
                                isSubmitting={updatingEmail}
                              />
                            ) : (
                              <EmailAutomationRow
                                key={automation.id}
                                automation={automation}
                                onEdit={(a) => {
                                  setShowNewEmailForm(false);
                                  setEditingEmailAutomation(a);
                                }}
                                onDelete={setDeletingEmailAutomation}
                                onToggle={handleToggleEmail}
                              />
                            ),
                          )}
                        </>
                      )}

                      {showNewEmailForm && (
                        <EmailAutomationForm
                          dateFields={dateFields}
                          onSubmit={handleCreateEmail}
                          onCancel={() => setShowNewEmailForm(false)}
                          isSubmitting={creatingEmail}
                        />
                      )}
                    </div>

                    <div className="p-4 border-t">
                      {!showNewEmailForm && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingEmailAutomation(null);
                            setShowNewEmailForm(true);
                          }}
                          className="w-full justify-start text-muted-foreground"
                          disabled={dateFields.length === 0}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Ajouter une automatisation email
                        </Button>
                      )}

                      {dateFields.length === 0 && (
                        <p className="text-xs text-amber-600 mt-2">
                          Créez d'abord un champ personnalisé de type "Date"
                          pour configurer des automatisations email.
                        </p>
                      )}
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          )}
        </PopoverContent>
      </Popover>

      <AlertDialog
        open={!!deletingAutomation}
        onOpenChange={() => setDeletingAutomation(null)}
      >
        <AlertDialogContent className="z-[9999]">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'automatisation</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette automatisation ? Cette
              action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deletingEmailAutomation}
        onOpenChange={() => setDeletingEmailAutomation(null)}
      >
        <AlertDialogContent className="z-[9999]">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer l'automatisation email
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette automatisation email ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEmail}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
