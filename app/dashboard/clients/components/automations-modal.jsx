'use client';

import React, { useState, useEffect } from 'react';
import { toast } from '@/src/components/ui/sonner';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Badge } from '@/src/components/ui/badge';
import { Switch } from '@/src/components/ui/switch';
import { Textarea } from '@/src/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
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
  Edit2,
  ArrowRight,
  CreditCard,
  FileCheck,
  UserPlus,
  Clock,
  MoreHorizontal,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import {
  useClientAutomations,
  useCreateClientAutomation,
  useUpdateClientAutomation,
  useDeleteClientAutomation,
  useToggleClientAutomation,
} from '@/src/hooks/useClientAutomations';
import { useClientLists } from '@/src/hooks/useClientLists';
import { useWorkspace } from '@/src/hooks/useWorkspace';

// Configuration des déclencheurs disponibles
const TRIGGER_TYPES = [
  {
    value: 'FIRST_INVOICE_PAID',
    label: 'Première facture payée',
    description: 'Se déclenche quand un client paie sa première facture',
    icon: CreditCard,
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    value: 'INVOICE_PAID',
    label: 'Facture payée',
    description: 'Se déclenche à chaque paiement de facture',
    icon: CreditCard,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    value: 'QUOTE_ACCEPTED',
    label: 'Devis accepté',
    description: 'Se déclenche quand un devis est accepté',
    icon: FileCheck,
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  },
  {
    value: 'CLIENT_CREATED',
    label: 'Client créé',
    description: 'Se déclenche à la création d\'un nouveau client',
    icon: UserPlus,
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
  {
    value: 'INVOICE_OVERDUE',
    label: 'Facture en retard',
    description: 'Se déclenche quand une facture dépasse son échéance',
    icon: Clock,
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
];

// Configuration des actions disponibles
const ACTION_TYPES = [
  {
    value: 'MOVE_TO_LIST',
    label: 'Déplacer vers une liste',
    description: 'Retire le client des autres listes et l\'ajoute à la liste cible',
  },
  {
    value: 'ADD_TO_LIST',
    label: 'Ajouter à une liste',
    description: 'Ajoute le client à la liste cible sans le retirer des autres',
  },
  {
    value: 'REMOVE_FROM_LIST',
    label: 'Retirer d\'une liste',
    description: 'Retire le client de la liste cible',
  },
];

// Configuration des étapes du wizard
const WIZARD_STEPS = [
  { id: 1, title: 'Informations', description: 'Nom et description', icon: Zap },
  { id: 2, title: 'Déclencheur', description: 'Quand déclencher', icon: CreditCard },
  { id: 3, title: 'Action', description: 'Que faire', icon: ArrowRight },
  { id: 4, title: 'Confirmation', description: 'Résumé', icon: Check },
];

function StepSidebar({ currentStep, steps, onStepClick }) {
  return (
    <div className="w-56 flex-shrink-0 border-r pr-4 flex flex-col">
      <div className="flex-1 space-y-1">
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => isCompleted && onStepClick(step.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : isCompleted
                  ? 'hover:bg-muted cursor-pointer text-foreground'
                  : 'text-muted-foreground cursor-default'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium">{step.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AutomationForm({ automation, lists, onSave, onCancel, isLoading }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: automation?.name || '',
    description: automation?.description || '',
    triggerType: automation?.triggerType || '',
    actionType: automation?.actionType || 'MOVE_TO_LIST',
    sourceListId: automation?.sourceList?.id || '',
    targetListId: automation?.targetList?.id || '',
    triggerConfig: {
      minAmount: automation?.triggerConfig?.minAmount || null,
      daysOverdue: automation?.triggerConfig?.daysOverdue || 30,
    },
    isActive: automation?.isActive ?? true,
  });

  const selectedTrigger = TRIGGER_TYPES.find(t => t.value === formData.triggerType);
  const selectedAction = ACTION_TYPES.find(a => a.value === formData.actionType);
  const targetList = lists.find(l => l.id === formData.targetListId);

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.name.trim()) {
          toast.error('Le nom est requis');
          return false;
        }
        return true;
      case 2:
        if (!formData.triggerType) {
          toast.error('Veuillez sélectionner un déclencheur');
          return false;
        }
        return true;
      case 3:
        if (!formData.targetListId) {
          toast.error('Veuillez sélectionner une liste cible');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, WIZARD_STEPS.length));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    const input = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      triggerType: formData.triggerType,
      actionType: formData.actionType,
      targetListId: formData.targetListId,
      isActive: formData.isActive,
    };

    if (formData.sourceListId && formData.sourceListId !== 'all') {
      input.sourceListId = formData.sourceListId;
    }

    if (formData.triggerType === 'INVOICE_OVERDUE') {
      input.triggerConfig = {
        daysOverdue: parseInt(formData.triggerConfig.daysOverdue) || 30,
      };
    }

    if (formData.triggerConfig.minAmount) {
      input.triggerConfig = {
        ...input.triggerConfig,
        minAmount: parseFloat(formData.triggerConfig.minAmount),
      };
    }

    onSave(input);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l'automatisation *</Label>
              <Input
                id="name"
                className="w-full"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Nouveaux clients payants"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                className="w-full"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez ce que fait cette automatisation..."
                rows={3}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Déclencheur *</Label>
              <Select
                value={formData.triggerType}
                onValueChange={(value) => setFormData({ ...formData, triggerType: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un déclencheur" />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map((trigger) => {
                    const Icon = trigger.icon;
                    return (
                      <SelectItem key={trigger.value} value={trigger.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span>{trigger.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {selectedTrigger && (
                <p className="text-xs text-muted-foreground">{selectedTrigger.description}</p>
              )}
            </div>

            {formData.triggerType === 'INVOICE_OVERDUE' && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="daysOverdue">Nombre de jours de retard</Label>
                <Input
                  id="daysOverdue"
                  className="w-full"
                  type="number"
                  min="1"
                  value={formData.triggerConfig.daysOverdue}
                  onChange={(e) => setFormData({
                    ...formData,
                    triggerConfig: { ...formData.triggerConfig, daysOverdue: e.target.value }
                  })}
                />
              </div>
            )}

            {(formData.triggerType === 'INVOICE_PAID' || formData.triggerType === 'FIRST_INVOICE_PAID') && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="minAmount">Montant minimum (optionnel)</Label>
                <Input
                  id="minAmount"
                  className="w-full"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.triggerConfig.minAmount || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    triggerConfig: { ...formData.triggerConfig, minAmount: e.target.value }
                  })}
                  placeholder="Ex: 100.00"
                />
                <p className="text-xs text-muted-foreground">
                  L'automatisation ne se déclenchera que si le montant est supérieur ou égal à cette valeur
                </p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Action *</Label>
              <Select
                value={formData.actionType}
                onValueChange={(value) => setFormData({ ...formData, actionType: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner une action" />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedAction && (
                <p className="text-xs text-muted-foreground">{selectedAction.description}</p>
              )}
            </div>

            {formData.actionType === 'MOVE_TO_LIST' && (
              <div className="space-y-2">
                <Label>Liste source (optionnel)</Label>
                <Select
                  value={formData.sourceListId}
                  onValueChange={(value) => setFormData({ ...formData, sourceListId: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Toutes les listes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les listes</SelectItem>
                    {lists.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: list.color }}
                          />
                          {list.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Si spécifié, seuls les clients de cette liste seront déplacés
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Liste cible *</Label>
              <Select
                value={formData.targetListId}
                onValueChange={(value) => setFormData({ ...formData, targetListId: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner une liste" />
                </SelectTrigger>
                <SelectContent>
                  {lists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: list.color }}
                        />
                        {list.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <Label>Automatisation active</Label>
                <p className="text-xs text-muted-foreground">
                  Désactivez pour mettre en pause sans supprimer
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                className="data-[state=checked]:bg-[#5b50ff]"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="flex flex-col h-full">
            {/* Description si présente */}
            {formData.description && (
              <p className="text-sm text-muted-foreground mb-4 flex-shrink-0">{formData.description}</p>
            )}

            {/* Timeline verticale - scrollable */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col items-center gap-0 pt-2">
                {/* Étape 1: Déclencheur */}
                <div className="w-full max-w-sm">
                  {/* Badge collé à la carte */}
                  <div className="flex justify-center">
                    <Badge 
                      className="text-xs px-3 py-1" 
                      style={{ backgroundColor: '#5b50ff', color: 'white', borderRadius: '4px 4px 0 0' }}
                    >
                      Déclencheur
                    </Badge>
                  </div>
                  <Card className="border shadow-sm relative rounded-lg">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="p-2 rounded-md" style={{ backgroundColor: '#5b50ff20' }}>
                      <Zap className="w-4 h-4" style={{ color: '#5b50ff' }} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{selectedTrigger?.label}</p>
                      <p className="text-xs text-muted-foreground">{selectedTrigger?.description}</p>
                    </div>
                  </CardContent>
                  {/* Point violet en bas de la carte */}
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: '#5b50ff' }} />
                </Card>
              </div>

              {/* Ligne pointillée entre carte 1 et 2 */}
              <div className="h-6 border-l-2 border-dashed" style={{ borderColor: '#5b50ff50' }} />

              {/* Étape 2: Action */}
              <div className="w-full max-w-sm">
                <Card className="border shadow-sm relative">
                  {/* Point violet en haut de la carte */}
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: '#5b50ff' }} />
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="p-2 rounded-md bg-orange-100 dark:bg-orange-900/30">
                      <ArrowRight className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{selectedAction?.label}</p>
                      <p className="text-xs text-muted-foreground">{selectedAction?.description}</p>
                    </div>
                  </CardContent>
                  {/* Point violet en bas de la carte */}
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: '#5b50ff' }} />
                </Card>
              </div>

              {/* Ligne pointillée entre carte 2 et 3 */}
              <div className="h-6 border-l-2 border-dashed" style={{ borderColor: '#5b50ff50' }} />

              {/* Étape 3: Liste cible */}
              <div className="w-full max-w-sm pb-4">
                <Card className="border shadow-sm relative">
                  {/* Point violet en haut de la carte */}
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: '#5b50ff' }} />
                  <CardContent className="p-3 flex items-center gap-3">
                    <div 
                      className="p-2 rounded-md"
                      style={{ backgroundColor: `${targetList?.color}20` || '#10b98120' }}
                    >
                      <UserPlus className="w-4 h-4" style={{ color: targetList?.color || '#10b981' }} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{targetList?.name}</p>
                      <p className="text-xs text-muted-foreground">Liste de destination</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              </div>
            </div>

            {/* Statut - fixe en bas */}
            <div className="flex items-center justify-center gap-2 pt-4 flex-shrink-0 bg-background">
              <span className="text-sm text-muted-foreground">Statut :</span>
              <Badge 
                variant={formData.isActive ? 'default' : 'secondary'}
                style={formData.isActive ? { backgroundColor: '#5b50ff' } : {}}
              >
                {formData.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handleStepClick = (stepId) => {
    if (stepId < currentStep) {
      setCurrentStep(stepId);
    }
  };

  return (
    <div className="flex flex-col h-[450px]">
      <div className="flex flex-1 min-h-0">
        {/* Sidebar gauche */}
        <StepSidebar 
          currentStep={currentStep} 
          steps={WIZARD_STEPS} 
          onStepClick={handleStepClick}
        />

        {/* Contenu principal */}
        <div className="flex-1 pl-6 flex flex-col min-h-0 min-w-0">
          {/* Titre de l'étape */}
          <div className="mb-4 flex-shrink-0">
            <h3 className="text-lg font-semibold">
              {currentStep === 4 && formData.name ? formData.name : WIZARD_STEPS.find(s => s.id === currentStep)?.title}
            </h3>
          </div>

          {/* Contenu de l'étape - scrollable */}
          <div className="flex-1 overflow-y-auto py-1 w-full">
            <div className="px-1 w-full">
              {renderStepContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Footer fixe en bas */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Étape {currentStep} sur {WIZARD_STEPS.length}
          </span>
          <div className="flex gap-1">
            {WIZARD_STEPS.map((step) => (
              <div
                key={step.id}
                className="h-1 w-6 rounded-full transition-colors"
                style={{ 
                  backgroundColor: step.id <= currentStep ? '#5b50ff' : 'transparent',
                  border: step.id > currentStep ? '1px solid #e5e7eb' : 'none'
                }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          {currentStep > 1 && (
            <Button type="button" variant="ghost" onClick={handlePrev}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
          {currentStep < WIZARD_STEPS.length ? (
            <Button type="button" onClick={handleNext}>
              Continuer
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {automation ? 'Modifier' : 'Créer'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function AutomationsTable({ automations, onEdit, onDelete, onToggle }) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead></TableHead>
            <TableHead></TableHead>
            <TableHead></TableHead>
            <TableHead className="text-center">Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {automations.map((automation) => {
            const trigger = TRIGGER_TYPES.find(t => t.value === automation.triggerType);
            const action = ACTION_TYPES.find(a => a.value === automation.actionType);
            const Icon = trigger?.icon || Zap;
            
            return (
              <TableRow key={automation.id} className={!automation.isActive ? 'opacity-60' : ''}>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{automation.name}</p>
                    {automation.description && (
                      <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {automation.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className="inline-flex items-center rounded-md gap-1 px-1.5 py-0.5 text-xs bg-[#5a50ff]/10 text-[#5a50ff] dark:bg-[#5a50ff]/20 dark:text-[#5a50ff] border-0 w-fit"
                  >
                    <Zap className="w-3 h-3" />
                    <span className="font-medium">{trigger?.label}</span>
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{action?.label}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    <div
                      className="w-2 h-2 rounded-full mr-1"
                      style={{ backgroundColor: automation.targetList?.color }}
                    />
                    {automation.targetList?.name}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={automation.isActive}
                    onCheckedChange={() => onToggle(automation.id)}
                    className="data-[state=checked]:bg-[#5b50ff]"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(automation)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(automation)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default function AutomationsModal({ open, onOpenChange }) {
  const { workspaceId } = useWorkspace();
  const { automations, loading: automationsLoading, refetch } = useClientAutomations(workspaceId);
  const { lists, loading: listsLoading } = useClientLists(workspaceId);
  const { createAutomation, loading: createLoading } = useCreateClientAutomation();
  const { updateAutomation, loading: updateLoading } = useUpdateClientAutomation();
  const { deleteAutomation, loading: deleteLoading } = useDeleteClientAutomation();
  const { toggleAutomation } = useToggleClientAutomation();

  const [showForm, setShowForm] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState(null);
  const [deletingAutomation, setDeletingAutomation] = useState(null);

  const handleCreate = async (input) => {
    try {
      await createAutomation(workspaceId, input);
      toast.success('Automatisation créée');
      setShowForm(false);
      refetch();
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  const handleUpdate = async (input) => {
    try {
      await updateAutomation(workspaceId, editingAutomation.id, input);
      toast.success('Automatisation modifiée');
      setEditingAutomation(null);
      refetch();
    } catch (error) {
      toast.error('Erreur lors de la modification');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAutomation(workspaceId, deletingAutomation.id);
      toast.success('Automatisation supprimée');
      setDeletingAutomation(null);
      refetch();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleAutomation(workspaceId, id);
      refetch();
    } catch (error) {
      toast.error('Erreur lors du basculement');
    }
  };

  const isLoading = automationsLoading || listsLoading;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!w-[50vw] !max-w-[50vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" style={{ color: '#5b50ff' }} />
              Automatisations CRM
            </DialogTitle>
            <DialogDescription>
              Automatisez le déplacement de vos contacts entre les listes selon des événements
            </DialogDescription>
          </DialogHeader>

          {showForm || editingAutomation ? (
            <AutomationForm
              automation={editingAutomation}
              lists={lists}
              onSave={editingAutomation ? handleUpdate : handleCreate}
              onCancel={() => {
                setShowForm(false);
                setEditingAutomation(null);
              }}
              isLoading={createLoading || updateLoading}
            />
          ) : (
            <div className="space-y-4">
              {/* Bouton créer */}
              <Button
                onClick={() => setShowForm(true)}
                className="w-full"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle automatisation
              </Button>

              {/* Liste des automatisations */}
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : automations.length === 0 ? (
                <div className="text-center py-8">
                  <Zap className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="font-medium mb-1">Aucune automatisation</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Créez votre première automatisation pour organiser vos contacts automatiquement
                  </p>
                </div>
              ) : (
                <AutomationsTable
                  automations={automations}
                  onEdit={setEditingAutomation}
                  onDelete={setDeletingAutomation}
                  onToggle={handleToggle}
                />
              )}

              {/* Info */}
              {lists.length === 0 && (
                <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                  <CardContent className="pt-4">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Vous devez d'abord créer des listes dans l'onglet "Mes listes" pour pouvoir configurer des automatisations.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!deletingAutomation} onOpenChange={() => setDeletingAutomation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'automatisation</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'automatisation "{deletingAutomation?.name}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
