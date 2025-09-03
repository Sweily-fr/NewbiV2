"use client";

import React, { useState } from "react";
import { Label } from "@/src/components/ui/label";
import { Slider } from "@/src/components/ui/slider";
import { Input } from "@/src/components/ui/input";
import { ChevronDown, ChevronRight } from "lucide-react";

const fontOptions = [
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: 'Calibri, sans-serif', label: 'Calibri' },
  { value: 'Tahoma, sans-serif', label: 'Tahoma' }
];

const fieldLabels = {
  firstName: 'Prénom',
  lastName: 'Nom',
  position: 'Poste',
  company: 'Entreprise',
  email: 'Email',
  phone: 'Téléphone',
  mobile: 'Mobile',
  website: 'Site web',
  address: 'Adresse'
};

function FieldTypographyControls({ fieldKey, fieldLabel, typography, updateTypography }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const fieldTypo = typography?.[fieldKey] || {};

  const updateField = (property, value) => {
    updateTypography({
      ...typography,
      [fieldKey]: {
        ...fieldTypo,
        [property]: value
      }
    });
  };

  return (
    <div className="border rounded-lg p-3 bg-gray-50/50">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Label className="text-sm font-medium">{fieldLabel}</Label>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground">
            {fieldTypo.fontFamily?.split(',')[0] || 'Arial'} • {fieldTypo.fontSize || 12}px
          </div>
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-3 space-y-3">
          {/* Police */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Police</Label>
            <select
              value={fieldTypo.fontFamily || 'Arial, sans-serif'}
              onChange={(e) => updateField('fontFamily', e.target.value)}
              className="h-8 px-2 text-xs border rounded bg-white w-32"
            >
              {fontOptions.map(font => (
                <option key={font.value} value={font.value}>{font.label}</option>
              ))}
            </select>
          </div>
          
          {/* Taille */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Taille</Label>
            <div className="flex items-center gap-2">
              <Input
                className="h-8 w-12 px-2 py-1 text-xs"
                type="number"
                value={fieldTypo.fontSize || 12}
                onChange={(e) => updateField('fontSize', parseInt(e.target.value) || 12)}
                min={8}
                max={32}
              />
              <Slider
                className="w-16"
                value={[fieldTypo.fontSize || 12]}
                onValueChange={(value) => updateField('fontSize', value[0])}
                min={8}
                max={32}
                step={1}
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
          </div>
          
          {/* Couleur */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Couleur</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={fieldTypo.color || '#000000'}
                onChange={(e) => updateField('color', e.target.value)}
                className="w-8 h-8 rounded border cursor-pointer"
              />
              <Input
                className="h-8 w-20 px-2 py-1 text-xs font-mono"
                value={fieldTypo.color || '#000000'}
                onChange={(e) => updateField('color', e.target.value)}
                placeholder="#000000"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TypographySection({ signatureData, updateSignatureData }) {
  const updateTypography = (newTypography) => {
    updateSignatureData('typography', newTypography);
  };

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">Typographie</h2>
      <div className="flex flex-col gap-3">
        {Object.entries(fieldLabels).map(([fieldKey, fieldLabel]) => (
          <FieldTypographyControls
            key={fieldKey}
            fieldKey={fieldKey}
            fieldLabel={fieldLabel}
            typography={signatureData.typography}
            updateTypography={updateTypography}
          />
        ))}
      </div>
    </div>
  );
}
