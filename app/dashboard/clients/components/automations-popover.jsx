'use client';

import React, { useState } from 'react';
import { toast } from '@/src/components/ui/sonner';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Badge } from '@/src/components/ui/badge';
import { Switch } from '@/src/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/src/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/src/components/ui/alert-dialog';
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
  Settings2,
} from 'lucide-react';
import {
  useClientAutomations,
  useCreateClientAutomation,
  useUpdateClientAutomation,
  useDeleteClientAutomation,
  useToggleClientAutomation,
} from '@/src/hooks/useClientAutomations';
import { useClientLists } from '@/src/hooks/useClientLists';
import { useWorkspace } from '@/src/hooks/useWorkspace';
import { useCrmEmailAutomations } from '@/src/hooks/useCrmEmailAutomations';
import AutomationsModal from './automations-modal';

const TRIGGER_TYPES = [
  {
    value: 'FIRST_INVOICE_PAID',
    label: 'Première facture payée',
    icon: CreditCard,
  },
  {
    value: 'INVOICE_PAID',
    label: 'Facture payée',
    icon: CreditCard,
  },
  {
    value: 'QUOTE_ACCEPTED',
    label: 'Devis accepté',
    icon: FileCheck,
  },
  {
    value: 'CLIENT_CREATED',
    label: 'Client créé',
    icon: UserPlus,
  },
  {
    value: 'INVOICE_OVERDUE',
    label: 'Facture en retard',
    icon: Clock,
  },
];

const ACTION_TYPES = [
  {
    value: 'MOVE_TO_LIST',
    label: 'Déplacer vers',
  },
  {
    value: 'ADD_TO_LIST',
    label: 'Ajouter à',
  },
  {
    value: 'REMOVE_FROM_LIST',
    label: 'Retirer de',
  },
];

function AutomationRow({ automation, lists, onUpdate, onDelete, onToggle }) {
  const [localData, setLocalData] = useState({
    triggerType: automation.triggerType,
    actionType: automation.actionType,
    targetListId: automation.targetList?.id || '',
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
        onValueChange={(value) => handleFieldChange('triggerType', value)}
      >
        <SelectTrigger className="w-[160px]">
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
        onValueChange={(value) => handleFieldChange('actionType', value)}
      >
        <SelectTrigger className="w-[130px]">
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
        onValueChange={(value) => handleFieldChange('targetListId', value)}
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
    triggerType: 'CLIENT_CREATED',
    actionType: 'ADD_TO_LIST',
    targetListId: '',
  });

  const generateName = (triggerType, actionType, targetListId) => {
    const trigger = TRIGGER_TYPES.find(t => t.value === triggerType);
    const action = ACTION_TYPES.find(a => a.value === actionType);
    const list = lists.find(l => l.id === targetListId);
    return `${trigger?.label || 'Déclencheur'} → ${action?.label || 'Action'} ${list?.name || 'Liste'}`;
  };

  const handleCreate = () => {
    if (!formData.targetListId) {
      toast.error('Veuillez sélectionner une liste');
      return;
    }
    onCreate({
      name: generateName(formData.triggerType, formData.actionType, formData.targetListId),
      description: '',
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
          onValueChange={(value) => setFormData({ ...formData, triggerType: value })}
        >
          <SelectTrigger className="w-[160px]">
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
          onValueChange={(value) => setFormData({ ...formData, actionType: value })}
        >
          <SelectTrigger className="w-[130px]">
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
          onValueChange={(value) => setFormData({ ...formData, targetListId: value })}
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

        <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8 flex-shrink-0">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function AutomationsPopover({ trigger }) {
  const { workspaceId } = useWorkspace();
  const { automations, loading: automationsLoading, refetch } = useClientAutomations(workspaceId);
  const { lists, loading: listsLoading } = useClientLists(workspaceId);
  const { automations: emailAutomations } = useCrmEmailAutomations(workspaceId);
  const { createAutomation } = useCreateClientAutomation();
  const { updateAutomation } = useUpdateClientAutomation();
  const { deleteAutomation } = useDeleteClientAutomation();
  const { toggleAutomation } = useToggleClientAutomation();

  const [isOpen, setIsOpen] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [deletingAutomation, setDeletingAutomation] = useState(null);
  const [showFullModal, setShowFullModal] = useState(false);

  const handleCreate = async (input) => {
    setShowNewForm(false);
    try {
      await createAutomation(workspaceId, input);
      refetch();
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  const handleUpdate = (id, input) => {
    updateAutomation(workspaceId, id, input).catch(() => {
      toast.error('Erreur lors de la modification');
      refetch();
    });
  };

  const handleDelete = async () => {
    setDeletingAutomation(null);
    try {
      await deleteAutomation(workspaceId, deletingAutomation.id);
      refetch();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleToggle = (id) => {
    toggleAutomation(workspaceId, id).then(() => refetch()).catch(() => {
      toast.error('Erreur lors du basculement');
      refetch();
    });
  };

  const isLoading = automationsLoading && automations.length === 0;
  const activeListCount = automations.filter(a => a.isActive).length;
  const activeEmailCount = emailAutomations.filter(a => a.isActive).length;
  const activeCount = activeListCount + activeEmailCount;

  return (
    <>
      <Popover open={isOpen || !!deletingAutomation} onOpenChange={(open) => {
        if (!deletingAutomation) {
          setIsOpen(open);
        }
      }}>
        <PopoverTrigger asChild>
          {trigger || (
            <Button
              variant={activeCount > 0 ? "default" : "outline"}
              className="font-normal"
              style={activeCount > 0 ? { backgroundColor: '#5b50ff' } : {}}
            >
              <Zap className="mr-2 h-4 w-4" />
              Automatisations
              {activeCount > 0 && (
                <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                  {activeCount}
                </span>
              )}
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[650px] p-0">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" style={{ color: '#5b50ff' }} />
                <h4 className="font-medium">Automatisations</h4>
              </div>
              <div className="flex items-center gap-2">
                {activeListCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {activeListCount} liste{activeListCount > 1 ? 's' : ''}
                  </Badge>
                )}
                {activeEmailCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {activeEmailCount} email{activeEmailCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Déplacez automatiquement vos contacts entre les listes
            </p>
          </div>

          <div className="p-4 space-y-1 max-h-[350px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : automations.length === 0 && !showNewForm ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Aucune automatisation. Cliquez sur "Ajouter" pour commencer.
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
                Créez d'abord des listes pour configurer des automatisations.
              </p>
            )}

            <div className="border-t mt-3 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  setShowFullModal(true);
                }}
                className="w-full justify-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Automatisations Email
                {activeEmailCount > 0 && (
                  <Badge variant="secondary" className="text-xs ml-1">
                    {activeEmailCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <AutomationsModal 
        open={showFullModal} 
        onOpenChange={setShowFullModal}
      />

      <AlertDialog open={!!deletingAutomation} onOpenChange={() => setDeletingAutomation(null)}>
        <AlertDialogContent className="z-[9999]">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'automatisation</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette automatisation ?
              Cette action est irréversible.
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
    </>
  );
}
