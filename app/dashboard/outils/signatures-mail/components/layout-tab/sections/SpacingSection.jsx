"use client";

import React from "react";
import { Label } from "@/src/components/ui/label";
import { Slider } from "@/src/components/ui/slider";
import { Input } from "@/src/components/ui/input";
import { Switch } from "@/src/components/ui/switch";

export default function SpacingSection({ signatureData, updateSignatureData }) {
  // Gestion des espacements
  const handleSpacingChange = (spacingKey, value) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.max(0, Math.min(30, numValue)); // Entre 0 et 30px
    updateSignatureData('spacings', {
      ...signatureData.spacings,
      [spacingKey]: clampedValue
    });
  };

  // Fonction spéciale pour l'espacement global
  const handleGlobalSpacingChange = (value) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.max(0, Math.min(30, numValue));
    
    // Applique l'espacement global à tous les espacements pour les deux layouts
    const updated = {
      ...signatureData.spacings,
      global: clampedValue,
      photoBottom: clampedValue,
      logoBottom: clampedValue,
      nameBottom: clampedValue,
      positionBottom: clampedValue,
      companyBottom: clampedValue,
      contactBottom: clampedValue,
      phoneToMobile: clampedValue,
      mobileToEmail: clampedValue,
      emailToWebsite: clampedValue,
      websiteToAddress: clampedValue,
      separatorTop: clampedValue,
      separatorBottom: clampedValue,
    };
    
    updateSignatureData('spacings', updated);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Espacements</h2>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Détaillé</Label>
          <div className="relative inline-flex items-center">
            <Switch
              checked={signatureData.detailedSpacing || false}
              onCheckedChange={(checked) => updateSignatureData('detailedSpacing', checked)}
            />
          </div>
        </div>
      </div>
      
      <div className="flex flex-col gap-3 ml-4">
        {!signatureData.detailedSpacing ? (
          // Mode espacement global
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Espacement global</Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={signatureData.spacings?.global || 12}
                onChange={(e) => handleGlobalSpacingChange(e.target.value)}
                onBlur={(e) => handleGlobalSpacingChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleGlobalSpacingChange(e.target.value);
                  }
                }}
                aria-label="Espacement global"
                placeholder="12"
              />
              <Slider
                className="grow"
                value={[signatureData.spacings?.global || 12]}
                onValueChange={(value) => handleGlobalSpacingChange(value[0])}
                min={0}
                max={30}
                step={2}
                aria-label="Espacement global"
              />
            </div>
          </div>
        ) : (
          // Mode espacement détaillé
          <div className="flex flex-col gap-3 ml-4">
          {/* Espacement sous la photo - disponible pour les deux layouts */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              {signatureData.layout === 'vertical' ? 'Sous photo' : 'Image profil → Information'}
            </Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={signatureData.spacings?.photoBottom || 12}
                onChange={(e) => handleSpacingChange('photoBottom', e.target.value)}
                onBlur={(e) => handleSpacingChange('photoBottom', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSpacingChange('photoBottom', e.target.value);
                  }
                }}
                min={0}
                max={30}
                aria-label="Espacement photo"
                placeholder="12"
              />
              <Slider
                className="grow"
                value={[signatureData.spacings?.photoBottom || 12]}
                onValueChange={(value) => handleSpacingChange('photoBottom', value[0])}
                min={0}
                max={30}
                step={2}
                aria-label="Espacement photo"
              />
            </div>
          </div>
          
          {/* Espacement sous le logo - uniquement pour layout vertical */}
          {signatureData.layout === 'vertical' && (
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              Sous logo
            </Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={signatureData.spacings?.logoBottom || 12}
                onChange={(e) => handleSpacingChange('logoBottom', e.target.value)}
                onBlur={(e) => handleSpacingChange('logoBottom', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSpacingChange('logoBottom', e.target.value);
                  }
                }}
                min={0}
                max={30}
                aria-label="Espacement logo"
                placeholder="12"
              />
              <Slider
                className="grow"
                value={[signatureData.spacings?.logoBottom || 12]}
                onValueChange={(value) => handleSpacingChange('logoBottom', value[0])}
                min={0}
                max={30}
                step={2}
                aria-label="Espacement logo"
              />
            </div>
          </div>
          )}
          
          {/* Espacement sous le nom - disponible pour les deux layouts */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              {signatureData.layout === 'vertical' ? 'Sous nom' : 'Nom → Poste'}
            </Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={signatureData.spacings?.nameBottom || 8}
                onChange={(e) => handleSpacingChange('nameBottom', e.target.value)}
                onBlur={(e) => handleSpacingChange('nameBottom', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSpacingChange('nameBottom', e.target.value);
                  }
                }}
                min={0}
                max={30}
                aria-label="Espacement nom"
                placeholder="8"
              />
              <Slider
                className="grow"
                value={[signatureData.spacings?.nameBottom || 8]}
                onValueChange={(value) => handleSpacingChange('nameBottom', value[0])}
                min={0}
                max={30}
                step={2}
                aria-label="Espacement nom"
              />
            </div>
          </div>
          
          {/* Espacement sous le poste - disponible pour les deux layouts */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              {signatureData.layout === 'vertical' ? 'Sous poste' : 'Poste → Entreprise'}
            </Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={signatureData.spacings?.positionBottom || 8}
                onChange={(e) => handleSpacingChange('positionBottom', e.target.value)}
                onBlur={(e) => handleSpacingChange('positionBottom', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSpacingChange('positionBottom', e.target.value);
                  }
                }}
                min={0}
                max={30}
                aria-label="Espacement poste"
                placeholder="8"
              />
              <Slider
                className="grow"
                value={[signatureData.spacings?.positionBottom || 8]}
                onValueChange={(value) => handleSpacingChange('positionBottom', value[0])}
                min={0}
                max={30}
                step={2}
                aria-label="Espacement poste"
              />
            </div>
          </div>
          
          {/* Espacement sous l'entreprise - disponible pour les deux layouts */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              {signatureData.layout === 'vertical' ? 'Sous entreprise' : 'Entreprise → Contact'}
            </Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={signatureData.spacings?.companyBottom || 8}
                onChange={(e) => handleSpacingChange('companyBottom', e.target.value)}
                onBlur={(e) => handleSpacingChange('companyBottom', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSpacingChange('companyBottom', e.target.value);
                  }
                }}
                min={0}
                max={30}
                aria-label="Espacement entreprise"
                placeholder="8"
              />
              <Slider
                className="grow"
                value={[signatureData.spacings?.companyBottom || 8]}
                onValueChange={(value) => handleSpacingChange('companyBottom', value[0])}
                min={0}
                max={30}
                step={2}
                aria-label="Espacement entreprise"
              />
            </div>
          </div>
          
          {/* Espacement entre téléphone et mobile - disponible pour les deux layouts */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Téléphone → Téléphone 2</Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={signatureData.spacings?.phoneToMobile || 4}
                onChange={(e) => handleSpacingChange('phoneToMobile', e.target.value)}
                onBlur={(e) => handleSpacingChange('phoneToMobile', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSpacingChange('phoneToMobile', e.target.value);
                  }
                }}
                min={0}
                max={20}
                aria-label="Espacement téléphone vers mobile"
                placeholder="4"
              />
              <Slider
                className="grow"
                value={[signatureData.spacings?.phoneToMobile || 4]}
                onValueChange={(value) => handleSpacingChange('phoneToMobile', value[0])}
                min={0}
                max={20}
                step={1}
                aria-label="Espacement téléphone vers mobile"
              />
            </div>
          </div>
          
          {/* Espacement entre mobile et email - disponible pour les deux layouts */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Mobile → Email</Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={signatureData.spacings?.mobileToEmail || 4}
                onChange={(e) => handleSpacingChange('mobileToEmail', e.target.value)}
                onBlur={(e) => handleSpacingChange('mobileToEmail', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSpacingChange('mobileToEmail', e.target.value);
                  }
                }}
                min={0}
                max={20}
                aria-label="Espacement mobile vers email"
                placeholder="4"
              />
              <Slider
                className="grow"
                value={[signatureData.spacings?.mobileToEmail || 4]}
                onValueChange={(value) => handleSpacingChange('mobileToEmail', value[0])}
                min={0}
                max={20}
                step={1}
                aria-label="Espacement mobile vers email"
              />
            </div>
          </div>
          
          {/* Espacement entre email et site web - disponible pour les deux layouts */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Email → Site web</Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={signatureData.spacings?.emailToWebsite || 4}
                onChange={(e) => handleSpacingChange('emailToWebsite', e.target.value)}
                onBlur={(e) => handleSpacingChange('emailToWebsite', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSpacingChange('emailToWebsite', e.target.value);
                  }
                }}
                min={0}
                max={20}
                aria-label="Espacement email vers site web"
                placeholder="4"
              />
              <Slider
                className="grow"
                value={[signatureData.spacings?.emailToWebsite || 4]}
                onValueChange={(value) => handleSpacingChange('emailToWebsite', value[0])}
                min={0}
                max={20}
                step={1}
                aria-label="Espacement email vers site web"
              />
            </div>
          </div>
          
          {/* Espacement entre site web et adresse - disponible pour les deux layouts */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Site web → Adresse</Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={signatureData.spacings?.websiteToAddress || 4}
                onChange={(e) => handleSpacingChange('websiteToAddress', e.target.value)}
                onBlur={(e) => handleSpacingChange('websiteToAddress', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSpacingChange('websiteToAddress', e.target.value);
                  }
                }}
                min={0}
                max={20}
                aria-label="Espacement site web vers adresse"
                placeholder="4"
              />
              <Slider
                className="grow"
                value={[signatureData.spacings?.websiteToAddress || 4]}
                onValueChange={(value) => handleSpacingChange('websiteToAddress', value[0])}
                min={0}
                max={20}
                step={1}
                aria-label="Espacement site web vers adresse"
              />
            </div>
          </div>
          
          {/* Espacement entre les contacts - disponible pour les deux layouts */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Entre contacts</Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={signatureData.spacings?.contactBottom || 6}
                onChange={(e) => handleSpacingChange('contactBottom', e.target.value)}
                onBlur={(e) => handleSpacingChange('contactBottom', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSpacingChange('contactBottom', e.target.value);
                  }
                }}
                min={0}
                max={30}
                aria-label="Espacement entre contacts"
                placeholder="6"
              />
              <Slider
                className="grow"
                value={[signatureData.spacings?.contactBottom || 6]}
                onValueChange={(value) => handleSpacingChange('contactBottom', value[0])}
                min={0}
                max={30}
                step={2}
                aria-label="Espacement entre contacts"
              />
            </div>
          </div>
          
          {/* Espacement au-dessus du séparateur */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Avant séparateur</Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={signatureData.spacings?.separatorTop || 12}
                onChange={(e) => handleSpacingChange('separatorTop', e.target.value)}
                min={0}
                max={30}

                aria-label="Espacement avant le séparateur"
                placeholder="12"
              />
              <Slider
                className="grow"
                value={[signatureData.spacings?.separatorTop || 12]}
                onValueChange={(value) => handleSpacingChange('separatorTop', value[0])}
                min={0}
                max={30}
                step={2}
                aria-label="Espacement avant séparateur"
              />
            </div>
          </div>
          
          {/* Espacement logo entreprise -> logo réseaux sociaux */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Logo entreprise → Logo réseaux sociaux</Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={signatureData.spacings?.separatorBottom || 12}
                onChange={(e) => handleSpacingChange('separatorBottom', e.target.value)}
                min={0}
                max={30}

                aria-label="Espacement logo entreprise vers réseaux sociaux"
                placeholder="12"
              />
              <Slider
                className="grow"
                value={[signatureData.spacings?.separatorBottom || 12]}
                onValueChange={(value) => handleSpacingChange('separatorBottom', value[0])}
                min={0}
                max={30}
                step={2}
                aria-label="Espacement logo vers réseaux"
              />
            </div>
          </div>
          
          </div>
        )}
      </div>
    </div>
  );
}
