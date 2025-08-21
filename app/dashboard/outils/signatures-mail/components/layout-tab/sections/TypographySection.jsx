"use client";

import React from "react";
import { Label } from "@/src/components/ui/label";
import { Slider } from "@/src/components/ui/slider";
import { Input } from "@/src/components/ui/input";

export default function TypographySection({ signatureData, updateSignatureData }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">Typographie</h2>
      <div className="flex flex-col gap-3 ml-4">
        {/* Police générale */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Police</Label>
          <div className="flex items-center gap-3 w-30">
            <select
              value={signatureData.fontFamily || "Arial"}
              onChange={(e) => updateSignatureData('fontFamily', e.target.value)}
              className="h-8 px-2 text-xs border rounded bg-white flex-1"
            >
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Georgia">Georgia</option>
              <option value="Verdana">Verdana</option>
            </select>
          </div>
        </div>
        
        {/* Taille police nom */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Taille nom</Label>
          <div className="flex items-center gap-3 w-30">
            <Input
              className="h-8 w-12 px-2 py-1"
              type="text"
              inputMode="decimal"
              value={signatureData.fontSize?.name || 16}
              onChange={(e) => {
                const newSize = parseInt(e.target.value) || 16;
                updateSignatureData('fontSize', {
                  ...signatureData.fontSize,
                  name: Math.max(10, Math.min(24, newSize))
                });
              }}
              onBlur={(e) => {
                const newSize = parseInt(e.target.value) || 16;
                updateSignatureData('fontSize', {
                  ...signatureData.fontSize,
                  name: Math.max(10, Math.min(24, newSize))
                });
              }}
              aria-label="Taille de police pour le nom"
              placeholder="16"
            />
            <Slider
              className="grow"
              value={[signatureData.fontSize?.name || 16]}
              onValueChange={(value) => {
                updateSignatureData('fontSize', {
                  ...signatureData.fontSize,
                  name: value[0]
                });
              }}
              min={10}
              max={24}
              step={1}
              aria-label="Taille police nom"
            />
          </div>
        </div>
        
        {/* Taille police poste */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Taille poste</Label>
          <div className="flex items-center gap-3 w-30">
            <Input
              className="h-8 w-12 px-2 py-1"
              type="text"
              inputMode="decimal"
              value={signatureData.fontSize?.position || 14}
              onChange={(e) => {
                const newSize = parseInt(e.target.value) || 14;
                updateSignatureData('fontSize', {
                  ...signatureData.fontSize,
                  position: Math.max(8, Math.min(20, newSize))
                });
              }}
              onBlur={(e) => {
                const newSize = parseInt(e.target.value) || 14;
                updateSignatureData('fontSize', {
                  ...signatureData.fontSize,
                  position: Math.max(8, Math.min(20, newSize))
                });
              }}
              aria-label="Taille de police pour le poste"
              placeholder="14"
            />
            <Slider
              className="grow"
              value={[signatureData.fontSize?.position || 14]}
              onValueChange={(value) => {
                updateSignatureData('fontSize', {
                  ...signatureData.fontSize,
                  position: value[0]
                });
              }}
              min={8}
              max={20}
              step={1}
              aria-label="Taille police poste"
            />
          </div>
        </div>
        
        {/* Taille police contact */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Taille contact</Label>
          <div className="flex items-center gap-3 w-30">
            <Input
              className="h-8 w-12 px-2 py-1"
              type="text"
              inputMode="decimal"
              value={signatureData.fontSize?.contact || 12}
              onChange={(e) => {
                const newSize = parseInt(e.target.value) || 12;
                updateSignatureData('fontSize', {
                  ...signatureData.fontSize,
                  contact: Math.max(8, Math.min(16, newSize))
                });
              }}
              onBlur={(e) => {
                const newSize = parseInt(e.target.value) || 12;
                updateSignatureData('fontSize', {
                  ...signatureData.fontSize,
                  contact: Math.max(8, Math.min(16, newSize))
                });
              }}
              aria-label="Taille de police pour les contacts"
              placeholder="12"
            />
            <Slider
              className="grow"
              value={[signatureData.fontSize?.contact || 12]}
              onValueChange={(value) => {
                updateSignatureData('fontSize', {
                  ...signatureData.fontSize,
                  contact: value[0]
                });
              }}
              min={8}
              max={16}
              step={1}
              aria-label="Taille police contact"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
