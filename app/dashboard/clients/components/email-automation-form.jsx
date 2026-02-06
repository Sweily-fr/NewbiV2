'use client';

import React, { useState } from 'react';
import { toast } from '@/src/components/ui/sonner';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Badge } from '@/src/components/ui/badge';
import { Switch } from '@/src/components/ui/switch';
import { Textarea } from '@/src/components/ui/textarea';
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
} from '@/src/components/ui/card';
import {
  Mail,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Send,
} from 'lucide-react';

// Configuration des types de timing
const TIMING_TYPES = [
  {
    value: 'ON_DATE',
    label: 'Le jour même',
    description: 'Envoyer l\'email le jour de la date',
  },
  {
    value: 'BEFORE_DATE',
    label: 'Avant la date',
    description: 'Envoyer l\'email X jours avant la date',
  },
  {
    value: 'AFTER_DATE',
    label: 'Après la date',
    description: 'Envoyer l\'email X jours après la date',
  },
];

// Configuration des étapes du wizard
const WIZARD_STEPS = [
  { id: 1, title: 'Informations', description: 'Nom et description', icon: Mail },
  { id: 2, title: 'Déclencheur', description: 'Champ date et timing', icon: Calendar },
  { id: 3, title: 'Email', description: 'Contenu de l\'email', icon: Send },
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

export default function EmailAutomationForm({ 
  automation, 
  dateFields, 
  onSave, 
  onCancel, 
  isLoading 
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: automation?.name || '',
    description: automation?.description || '',
    customFieldId: automation?.customFieldId || '',
    timing: {
      type: automation?.timing?.type || 'ON_DATE',
      daysOffset: automation?.timing?.daysOffset || 0,
      sendHour: automation?.timing?.sendHour || 9,
    },
    email: {
      fromName: automation?.email?.fromName || '',
      fromEmail: automation?.email?.fromEmail || '',
      replyTo: automation?.email?.replyTo || '',
      subject: automation?.email?.subject || 'Rappel - {customFieldName}',
      body: automation?.email?.body || `Bonjour {clientName},

Nous vous rappelons que la date de {customFieldName} est prévue pour le {customFieldValue}.

Cordialement,
{companyName}`,
    },
    isActive: automation?.isActive ?? true,
  });

  const selectedField = dateFields.find(f => f.id === formData.customFieldId);
  const selectedTiming = TIMING_TYPES.find(t => t.value === formData.timing.type);

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.name.trim()) {
          toast.error('Le nom est requis');
          return false;
        }
        return true;
      case 2:
        if (!formData.customFieldId) {
          toast.error('Veuillez sélectionner un champ date');
          return false;
        }
        return true;
      case 3:
        if (!formData.email.subject.trim()) {
          toast.error('L\'objet de l\'email est requis');
          return false;
        }
        if (!formData.email.body.trim()) {
          toast.error('Le corps de l\'email est requis');
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
      customFieldId: formData.customFieldId,
      timing: {
        type: formData.timing.type,
        daysOffset: parseInt(formData.timing.daysOffset) || 0,
        sendHour: parseInt(formData.timing.sendHour) || 9,
      },
      email: {
        fromName: formData.email.fromName.trim(),
        fromEmail: formData.email.fromEmail.trim(),
        replyTo: formData.email.replyTo.trim(),
        subject: formData.email.subject.trim(),
        body: formData.email.body.trim(),
      },
      isActive: formData.isActive,
    };

    onSave(input);
  };

  const getTimingDescription = () => {
    const { type, daysOffset, sendHour } = formData.timing;
    let desc = '';
    
    switch (type) {
      case 'ON_DATE':
        desc = 'Le jour même';
        break;
      case 'BEFORE_DATE':
        desc = `${daysOffset} jour${daysOffset > 1 ? 's' : ''} avant`;
        break;
      case 'AFTER_DATE':
        desc = `${daysOffset} jour${daysOffset > 1 ? 's' : ''} après`;
        break;
    }
    
    return `${desc} à ${sendHour}h00`;
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
                placeholder="Ex: Rappel anniversaire client"
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
              <Label>Champ date *</Label>
              <Select
                value={formData.customFieldId}
                onValueChange={(value) => setFormData({ ...formData, customFieldId: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un champ date" />
                </SelectTrigger>
                <SelectContent>
                  {dateFields.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Aucun champ de type Date disponible
                    </div>
                  ) : (
                    dateFields.map((field) => (
                      <SelectItem key={field.id} value={field.id}>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{field.name}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {dateFields.length === 0 && (
                <p className="text-xs text-amber-600">
                  Vous devez d'abord créer un champ personnalisé de type "Date" dans les paramètres des champs.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Quand envoyer l'email *</Label>

              {formData.timing.type === 'ON_DATE' ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <Select
                    value={formData.timing.type}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      timing: { ...formData.timing, type: value }
                    })}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMING_TYPES.map((timing) => (
                        <SelectItem key={timing.value} value={timing.value}>
                          {timing.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">à</span>
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    value={formData.timing.sendHour}
                    onChange={(e) => {
                      const hour = parseInt(e.target.value, 10);
                      if (!isNaN(hour) && hour >= 0 && hour <= 23) {
                        setFormData({
                          ...formData,
                          timing: { ...formData.timing, sendHour: hour }
                        });
                      }
                    }}
                    className="w-16 text-center"
                  />
                  <span className="text-sm text-muted-foreground">h00</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={formData.timing.daysOffset}
                    onChange={(e) => setFormData({
                      ...formData,
                      timing: { ...formData.timing, daysOffset: e.target.value }
                    })}
                    className="w-16 text-center flex-shrink-0"
                  />
                  <span className="text-sm text-muted-foreground flex-shrink-0 whitespace-nowrap">
                    jour{formData.timing.daysOffset > 1 ? 's' : ''}
                  </span>
                  <Select
                    value={formData.timing.type}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      timing: { ...formData.timing, type: value }
                    })}
                  >
                    <SelectTrigger className="w-[130px] flex-shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMING_TYPES.map((timing) => (
                        <SelectItem key={timing.value} value={timing.value}>
                          {timing.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground flex-shrink-0">à</span>
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    value={formData.timing.sendHour}
                    onChange={(e) => {
                      const hour = parseInt(e.target.value, 10);
                      if (!isNaN(hour) && hour >= 0 && hour <= 23) {
                        setFormData({
                          ...formData,
                          timing: { ...formData.timing, sendHour: hour }
                        });
                      }
                    }}
                    className="w-16 text-center flex-shrink-0"
                  />
                  <span className="text-sm text-muted-foreground flex-shrink-0">h00</span>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                {formData.timing.type === 'ON_DATE'
                  ? 'L\'email sera envoyé le jour même de la date du champ personnalisé'
                  : formData.timing.type === 'BEFORE_DATE'
                  ? `L'email sera envoyé ${formData.timing.daysOffset || 0} jour${formData.timing.daysOffset > 1 ? 's' : ''} avant la date du champ personnalisé`
                  : `L'email sera envoyé ${formData.timing.daysOffset || 0} jour${formData.timing.daysOffset > 1 ? 's' : ''} après la date du champ personnalisé`}
                {' '}(fuseau horaire Paris)
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="p-3 bg-[#5b50ff]/10 border border-[#5b50ff]/20 rounded-lg">
              <p className="text-xs text-[#5b50ff]">
                Variables disponibles: {'{clientName}'}, {'{clientFirstName}'}, {'{clientLastName}'}, {'{clientEmail}'}, {'{customFieldName}'}, {'{customFieldValue}'}, {'{companyName}'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromName">Nom de l'expéditeur</Label>
                <Input
                  id="fromName"
                  value={formData.email.fromName}
                  onChange={(e) => setFormData({
                    ...formData,
                    email: { ...formData.email, fromName: e.target.value }
                  })}
                  placeholder="Mon Entreprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromEmail">Email expéditeur</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  value={formData.email.fromEmail}
                  onChange={(e) => setFormData({
                    ...formData,
                    email: { ...formData.email, fromEmail: e.target.value }
                  })}
                  placeholder="contact@entreprise.fr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="replyTo">Email de réponse (optionnel)</Label>
              <Input
                id="replyTo"
                type="email"
                value={formData.email.replyTo}
                onChange={(e) => setFormData({
                  ...formData,
                  email: { ...formData.email, replyTo: e.target.value }
                })}
                placeholder="reponse@entreprise.fr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Objet de l'email *</Label>
              <Input
                id="subject"
                value={formData.email.subject}
                onChange={(e) => setFormData({
                  ...formData,
                  email: { ...formData.email, subject: e.target.value }
                })}
                placeholder="Rappel - {customFieldName}"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Corps de l'email *</Label>
              <Textarea
                id="body"
                rows={8}
                value={formData.email.body}
                onChange={(e) => setFormData({
                  ...formData,
                  email: { ...formData.email, body: e.target.value }
                })}
                placeholder="Bonjour {clientName},..."
                className="font-mono text-sm"
              />
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
            {formData.description && (
              <p className="text-sm text-muted-foreground mb-4 flex-shrink-0">{formData.description}</p>
            )}

            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col items-center gap-0 pt-2">
                {/* Étape 1: Champ date */}
                <div className="w-full max-w-sm">
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
                        <Calendar className="w-4 h-4" style={{ color: '#5b50ff' }} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{selectedField?.name || 'Champ date'}</p>
                        <p className="text-xs text-muted-foreground">{getTimingDescription()}</p>
                      </div>
                    </CardContent>
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: '#5b50ff' }} />
                  </Card>
                </div>

                <div className="h-6 border-l-2 border-dashed" style={{ borderColor: '#5b50ff50' }} />

                {/* Étape 2: Email */}
                <div className="w-full max-w-sm pb-4">
                  <Card className="border shadow-sm relative">
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: '#5b50ff' }} />
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30">
                        <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Envoi d'email</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {formData.email.subject}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

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
    <div className="flex flex-col h-[500px]">
      <div className="flex flex-1 min-h-0">
        <StepSidebar 
          currentStep={currentStep} 
          steps={WIZARD_STEPS} 
          onStepClick={handleStepClick}
        />

        <div className="flex-1 pl-6 flex flex-col min-h-0 min-w-0">
          <div className="mb-4 flex-shrink-0">
            <h3 className="text-lg font-semibold">
              {currentStep === 4 && formData.name ? formData.name : WIZARD_STEPS.find(s => s.id === currentStep)?.title}
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto py-1 w-full">
            <div className="px-1 w-full">
              {renderStepContent()}
            </div>
          </div>
        </div>
      </div>

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
