'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { toast } from '@/src/components/ui/sonner';
import { Button } from '@/src/components/ui/button';
import { Switch } from '@/src/components/ui/switch';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Badge } from '@/src/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/src/components/ui/popover';
import {
  Zap,
  Trash2,
  ArrowRight,
  Loader2,
  Tag,
  Plus,
  Play,
} from 'lucide-react';
import { useWorkspace } from '@/src/hooks/useWorkspace';
import { useSharedFolders } from '@/src/hooks/useSharedDocuments';
import { useApolloClient } from '@apollo/client';
import {
  useDocumentAutomations,
  useCreateDocumentAutomation,
  useUpdateDocumentAutomation,
  useDeleteDocumentAutomation,
  useToggleDocumentAutomation,
  useRunDocumentAutomation,
  GET_AUTOMATION_PROGRESS,
} from '@/src/hooks/useDocumentAutomations';

const TRIGGER_OPTIONS = [
  // Factures
  { value: 'INVOICE_DRAFT', label: 'Facture brouillon', group: 'Facture' },
  { value: 'INVOICE_SENT', label: 'Facture en attente', group: 'Facture' },
  { value: 'INVOICE_PAID', label: 'Facture terminée', group: 'Facture' },
  { value: 'INVOICE_OVERDUE', label: 'Facture en retard', group: 'Facture' },
  { value: 'INVOICE_CANCELED', label: 'Facture refusée', group: 'Facture' },
  { value: 'INVOICE_IMPORTED', label: 'Facture importée', group: 'Facture' },
  // Devis
  { value: 'QUOTE_DRAFT', label: 'Devis brouillon', group: 'Devis' },
  { value: 'QUOTE_SENT', label: 'Devis en attente', group: 'Devis' },
  { value: 'QUOTE_ACCEPTED', label: 'Devis accepté', group: 'Devis' },
  { value: 'QUOTE_CANCELED', label: 'Devis refusé', group: 'Devis' },
  { value: 'QUOTE_IMPORTED', label: 'Devis importé', group: 'Devis' },
  // Avoir
  { value: 'CREDIT_NOTE_CREATED', label: 'Avoir créé', group: 'Avoir' },
  // Bon de commande
  { value: 'PURCHASE_ORDER_DRAFT', label: 'BC brouillon', group: 'Bon de commande' },
  { value: 'PURCHASE_ORDER_CONFIRMED', label: 'BC confirmé', group: 'Bon de commande' },
  { value: 'PURCHASE_ORDER_IN_PROGRESS', label: 'BC en cours', group: 'Bon de commande' },
  { value: 'PURCHASE_ORDER_DELIVERED', label: 'BC livré', group: 'Bon de commande' },
  { value: 'PURCHASE_ORDER_CANCELED', label: 'BC annulé', group: 'Bon de commande' },
  // Facture d'achat
  { value: 'PURCHASE_INVOICE_TO_PROCESS', label: "Fact. achat à traiter", group: "Facture d'achat" },
  { value: 'PURCHASE_INVOICE_TO_PAY', label: "Fact. achat à payer", group: "Facture d'achat" },
  { value: 'PURCHASE_INVOICE_PENDING', label: "Fact. achat en attente", group: "Facture d'achat" },
  { value: 'PURCHASE_INVOICE_PAID', label: "Fact. achat payée", group: "Facture d'achat" },
  { value: 'PURCHASE_INVOICE_OVERDUE', label: "Fact. achat en retard", group: "Facture d'achat" },
  { value: 'PURCHASE_INVOICE_ARCHIVED', label: "Fact. achat archivée", group: "Facture d'achat" },
  // Transaction
  { value: 'TRANSACTION_RECEIPT', label: 'Justificatif de transaction', group: 'Transaction' },
];

const SUBFOLDER_PATTERNS = [
  { value: '{year}', label: 'Année (2026)' },
  { value: '{month}', label: 'Mois (01)' },
  { value: '{year}/{month}', label: 'Année/Mois' },
  { value: '{clientName}', label: 'Nom du client' },
  { value: '{year}/{clientName}', label: 'Année/Client' },
];

// Retourne le label complet pour un trigger
function getTriggerFullLabel(value) {
  const opt = TRIGGER_OPTIONS.find(t => t.value === value);
  return opt?.label || value;
}

// Pré-calcul des groupes (statique, jamais de re-render)
const TRIGGER_GROUPS = (() => {
  const groups = [];
  let currentGroup = null;
  for (const opt of TRIGGER_OPTIONS) {
    if (!currentGroup || currentGroup.label !== opt.group) {
      currentGroup = { label: opt.group, items: [] };
      groups.push(currentGroup);
    }
    currentGroup.items.push(opt);
  }
  return groups;
})();

const GROUPED_TRIGGER_OPTIONS = TRIGGER_GROUPS.map((g) => (
  <SelectGroup key={g.label}>
    <SelectLabel className="text-xs text-muted-foreground font-semibold">{g.label}</SelectLabel>
    {g.items.map((t) => (
      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
    ))}
  </SelectGroup>
));

// Construit une liste plate ordonnée en arbre avec profondeur et guides
function buildFolderTree(folders) {
  const result = [];
  const childrenMap = {};

  folders.forEach((f) => {
    const pid = f.parentId || 'root';
    if (!childrenMap[pid]) childrenMap[pid] = [];
    childrenMap[pid].push(f);
  });

  Object.values(childrenMap).forEach((children) => {
    children.sort((a, b) => (a.order || 0) - (b.order || 0));
  });

  function traverse(parentId, depth, ancestorHasMore) {
    const children = childrenMap[parentId] || [];
    children.forEach((folder, index) => {
      const isLast = index === children.length - 1;
      result.push({
        ...folder,
        depth,
        isLast,
        guides: [...ancestorHasMore],
      });
      traverse(folder.id, depth + 1, [...ancestorHasMore, !isLast]);
    });
  }

  traverse('root', 0, []);
  return result;
}

// Génère le préfixe arborescence : │  ├─ └─
function getTreePrefix(guides, isLast) {
  let prefix = '';
  for (let i = 0; i < guides.length; i++) {
    if (i === guides.length - 1) {
      prefix += isLast ? '└─ ' : '├─ ';
    } else {
      prefix += guides[i] ? '│  ' : '   ';
    }
  }
  return prefix;
}

// Select de dossier avec arborescence
function FolderTreeSelect({ folders, value, onValueChange, placeholder }) {
  const treeItems = useMemo(() => buildFolderTree(folders), [folders]);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[200px] [&_[data-tree-guide]]:hidden">
        <SelectValue placeholder={placeholder || 'Dossier...'} />
      </SelectTrigger>
      <SelectContent>
        {treeItems.map((f) => (
          <SelectItem key={f.id} value={f.id}>
            <div className="flex items-center gap-1.5">
              {f.depth > 0 && (
                <span data-tree-guide="" className="text-muted-foreground font-mono text-xs whitespace-pre flex-shrink-0">
                  {getTreePrefix(f.guides, f.isLast)}
                </span>
              )}
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: f.color || '#6366f1' }} />
              <span className="truncate">{f.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Popover pour les réglages avancés d'une automatisation
function SettingsPopover({ config, onSave }) {
  const [open, setOpen] = useState(false);
  const [createSubfolder, setCreateSubfolder] = useState(config?.createSubfolder || false);
  const [subfolderPattern, setSubfolderPattern] = useState(config?.subfolderPattern || '{year}');
  const [documentNaming, setDocumentNaming] = useState(config?.documentNaming || '{documentType}-{number}-{clientName}');
  const [tags, setTags] = useState(config?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const handleSave = () => {
    onSave({
      createSubfolder,
      subfolderPattern,
      documentNaming,
      tags,
      documentStatus: 'classified',
    });
    setOpen(false);
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs" style={{ color: '#5b50ff' }}>
          Options avancées
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <p className="text-sm font-medium">Options avancées</p>

          {/* Sous-dossier */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Sous-dossier auto</Label>
              <Switch
                checked={createSubfolder}
                onCheckedChange={setCreateSubfolder}
                className="data-[state=checked]:bg-[#5b50ff] scale-90"
              />
            </div>
            {createSubfolder && (
              <Select value={subfolderPattern} onValueChange={setSubfolderPattern}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[99]">
                  {SUBFOLDER_PATTERNS.map((p) => (
                    <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Nommage */}
          <div className="space-y-1.5">
            <Label className="text-xs">Nommage du fichier</Label>
            <Input
              value={documentNaming}
              onChange={(e) => setDocumentNaming(e.target.value)}
              className="h-8 text-xs font-mono"
              placeholder="{documentType}-{number}-{clientName}"
            />
            <div className="flex gap-1 flex-wrap">
              {['{documentType}', '{number}', '{clientName}'].map((v) => (
                <Badge
                  key={v}
                  variant="secondary"
                  className="text-[10px] cursor-pointer px-1 py-0"
                  onClick={() => setDocumentNaming(documentNaming + v)}
                >
                  {v}
                </Badge>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label className="text-xs">Tags auto</Label>
            <div className="flex gap-1">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Ajouter..."
                className="h-8 text-xs flex-1"
              />
              <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={handleAddTag}>
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px] gap-0.5 px-1.5 py-0">
                    <Tag className="w-2.5 h-2.5" />
                    {tag}
                    <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))} className="ml-0.5 hover:text-destructive">&times;</button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button onClick={handleSave} size="sm" className="w-full">
            Enregistrer
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function DocumentAutomationsModal({ open, onOpenChange, onDocumentsChanged }) {
  const { workspaceId } = useWorkspace();
  const client = useApolloClient();
  const { automations, loading: automationsLoading, refetch } = useDocumentAutomations(workspaceId);
  const { folders, loading: foldersLoading } = useSharedFolders();
  const hasLoadedOnce = useRef(false);
  if (!automationsLoading && !foldersLoading) hasLoadedOnce.current = true;
  const { createAutomation, loading: createLoading } = useCreateDocumentAutomation();
  const { updateAutomation } = useUpdateDocumentAutomation();
  const { deleteAutomation } = useDeleteDocumentAutomation();
  const { toggleAutomation } = useToggleDocumentAutomation();
  const { runAutomation } = useRunDocumentAutomation();

  const [runningId, setRunningId] = useState(null);
  const [progress, setProgress] = useState(null); // { current, total }
  const pollRef = useRef(null);

  // New automation row state
  const [showNewRow, setShowNewRow] = useState(false);
  const [newTrigger, setNewTrigger] = useState('');
  const [newFolderId, setNewFolderId] = useState('');
  const [newActionConfig, setNewActionConfig] = useState({});

  const handleCreate = async () => {
    if (!newTrigger || !newFolderId) {
      toast.error('Sélectionnez un déclencheur et un dossier');
      return;
    }
    try {
      const triggerLabel = getTriggerFullLabel(newTrigger);
      const folderName = folders.find(f => f.id === newFolderId)?.name || 'Dossier';
      const created = await createAutomation(workspaceId, {
        name: `${triggerLabel} → ${folderName}`,
        triggerType: newTrigger,
        actionConfig: {
          targetFolderId: newFolderId,
          ...newActionConfig,
        },
      });
      toast.success('Automatisation créée');
      setNewTrigger('');
      setNewFolderId('');
      setNewActionConfig({});
      setShowNewRow(false);
      refetch();

      // Lancer immédiatement le traitement rétroactif
      if (created?.id) {
        processExistingDocuments(created.id);
      }
    } catch {
      toast.error('Erreur lors de la création');
    }
  };

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback((automationId) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await client.query({
          query: GET_AUTOMATION_PROGRESS,
          variables: { workspaceId, automationId },
          fetchPolicy: 'no-cache',
        });
        if (data?.documentAutomationProgress) {
          setProgress(data.documentAutomationProgress);
        }
      } catch {
        // Ignorer les erreurs de polling
      }
    }, 1500);
  }, [client, workspaceId, stopPolling]);

  const processExistingDocuments = async (automationId) => {
    try {
      setRunningId(automationId);
      setProgress(null);

      // Lancer le polling de progression en parallèle
      startPolling(automationId);

      // Un seul appel backend qui fait tout le traitement
      const result = await runAutomation(workspaceId, automationId);

      const { successCount, failCount, status, message } = result;

      if (status === 'NO_DOCUMENTS') {
        toast.info('Aucun document existant à traiter');
      } else if (status === 'COMPLETED') {
        toast.success(message || `${successCount} document(s) traité(s)`);
      } else if (status === 'PARTIAL') {
        toast.warning(message || `${successCount} succès, ${failCount} échec(s)`);
      } else if (status === 'FAILED') {
        toast.error(message || 'Échec du traitement');
      } else {
        toast.info(message || 'Traitement terminé');
      }

      refetch();
      if (status !== 'NO_DOCUMENTS') onDocumentsChanged?.();
    } catch (err) {
      const gqlMessage = err?.graphQLErrors?.[0]?.message || err?.message;
      toast.error(gqlMessage || 'Erreur lors du traitement');
    } finally {
      stopPolling();
      setRunningId(null);
      setProgress(null);
    }
  };

  const handleUpdateTrigger = async (id, triggerType) => {
    try {
      const automation = automations.find(a => a.id === id);
      const triggerLabel = getTriggerFullLabel(triggerType);
      const folderName = automation?.actionConfig?.targetFolder?.name || 'Dossier';
      await updateAutomation(workspaceId, id, {
        name: `${triggerLabel} → ${folderName}`,
        triggerType,
      });
      refetch();
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleUpdateFolder = async (id, targetFolderId) => {
    try {
      const automation = automations.find(a => a.id === id);
      const currentConfig = automation?.actionConfig || {};
      const triggerLabel = getTriggerFullLabel(automation?.triggerType);
      const folderName = folders.find(f => f.id === targetFolderId)?.name || 'Dossier';
      await updateAutomation(workspaceId, id, {
        name: `${triggerLabel} → ${folderName}`,
        actionConfig: {
          targetFolderId,
          createSubfolder: currentConfig.createSubfolder,
          subfolderPattern: currentConfig.subfolderPattern,
          documentNaming: currentConfig.documentNaming,
          tags: currentConfig.tags,
          documentStatus: currentConfig.documentStatus,
        },
      });
      refetch();
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleUpdateAdvanced = async (id, input) => {
    try {
      await updateAutomation(workspaceId, id, input);
      toast.success('Options mises à jour');
      refetch();
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleAutomation(workspaceId, id);
      refetch();
    } catch {
      toast.error('Erreur lors du basculement');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAutomation(workspaceId, id);
      toast.success('Automatisation supprimée');
      refetch();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const isLoading = !hasLoadedOnce.current && (automationsLoading || foldersLoading);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" style={{ color: '#5b50ff' }} />
            Automatisations
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Importez automatiquement vos documents dans les dossiers partagés
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Existing automations */}
            {automations.map((automation) => (
              <div key={automation.id} className="flex items-center gap-2 min-w-0">
                <span className="text-sm text-muted-foreground flex-shrink-0">Quand</span>
                <Select
                  value={automation.triggerType}
                  onValueChange={(value) => handleUpdateTrigger(automation.id, value)}
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GROUPED_TRIGGER_OPTIONS}
                  </SelectContent>
                </Select>

                <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />

                <span className="text-sm text-muted-foreground flex-shrink-0">dans</span>

                <FolderTreeSelect
                  folders={folders}
                  value={automation.actionConfig?.targetFolderId}
                  onValueChange={(value) => handleUpdateFolder(automation.id, value)}
                />

                <SettingsPopover
                  config={automation.actionConfig}
                  onSave={(advancedConfig) => handleUpdateAdvanced(automation.id, {
                    actionConfig: {
                      targetFolderId: automation.actionConfig?.targetFolderId,
                      ...advancedConfig,
                    },
                  })}
                />

                <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                  {runningId === automation.id ? (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {progress ? `${progress.current}/${progress.total}` : 'Traitement...'}
                    </span>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-[#5b50ff]"
                      onClick={() => processExistingDocuments(automation.id)}
                      disabled={runningId !== null}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}

                  {automation.stats?.totalExecutions > 0 && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {automation.stats.totalExecutions}x
                    </span>
                  )}

                  <Switch
                    checked={automation.isActive}
                    onCheckedChange={() => handleToggle(automation.id)}
                    className="data-[state=checked]:bg-[#5b50ff]"
                  />

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(automation.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {/* New automation row (visible when adding) */}
            {showNewRow && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground flex-shrink-0">Quand</span>
                <Select value={newTrigger} onValueChange={setNewTrigger}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Déclencheur..." />
                  </SelectTrigger>
                  <SelectContent>
                    {GROUPED_TRIGGER_OPTIONS}
                  </SelectContent>
                </Select>

                <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />

                <span className="text-sm text-muted-foreground flex-shrink-0">dans</span>

                <FolderTreeSelect
                  folders={folders}
                  value={newFolderId}
                  onValueChange={setNewFolderId}
                  placeholder="Dossier..."
                />

                <SettingsPopover
                  config={newActionConfig}
                  onSave={(advancedConfig) => setNewActionConfig(advancedConfig)}
                />

                <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                  <Button
                    onClick={handleCreate}
                    disabled={createLoading || !newTrigger || !newFolderId}
                    size="sm"
                  >
                    {createLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Créer'}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => { setShowNewRow(false); setNewTrigger(''); setNewFolderId(''); setNewActionConfig({}); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {!isLoading && (
          <div className="border-t pt-3 -mb-3">
            <Button
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => setShowNewRow(true)}
              disabled={showNewRow}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une automatisation
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
