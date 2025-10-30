"use client";

import React from "react";
import { Label } from "@/src/components/ui/label";
import { Slider } from "@/src/components/ui/slider";
import { Input } from "@/src/components/ui/input";
import { Switch } from "@/src/components/ui/switch";

export default function SpacingSection({ signatureData, updateSignatureData }) {
  // Gestion des espacements
  const handleSpacingChange = (spacingKey, value) => {
    if (value === "" || value === null) {
      updateSignatureData("spacings", {
        ...signatureData.spacings,
        [spacingKey]: 1,
      });
      return;
    }
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1) {
      updateSignatureData("spacings", {
        ...signatureData.spacings,
        [spacingKey]: numValue,
      });
    }
  };

  // Fonction spéciale pour l'espacement global
  const handleGlobalSpacingChange = (value) => {
    if (value === "" || value === null) {
      const clampedValue = 1;
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
        verticalSeparatorLeft: 4,
        verticalSeparatorRight: clampedValue,
      };
      updateSignatureData("spacings", updated);
      return;
    }
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1) {
      const clampedValue = numValue;
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
        verticalSeparatorLeft: 4,
        verticalSeparatorRight: clampedValue,
      };
      updateSignatureData("spacings", updated);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Espacements</h2>
        {/* <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Détaillé</Label>
          <div className="relative inline-flex items-center">
            <Switch
              className="ml-4 flex-shrink-0 scale-75 data-[state=checked]:!bg-[#5b4eff]"
              checked={signatureData.detailedSpacing || false}
              onCheckedChange={(checked) =>
                updateSignatureData("detailedSpacing", checked)
              }
            />
          </div>
        </div> */}
      </div>

      <div className="flex flex-col gap-3">
        {!signatureData.detailedSpacing ? (
          // Mode espacement global
          <div className="flex items-center justify-between ml-4">
            <Label className="text-xs text-muted-foreground">
              Espacement global
            </Label>
            <div className="flex items-center gap-2 w-48">
              <button
                onClick={() => handleGlobalSpacingChange(12)}
                className="h-8 w-8 flex items-center justify-center rounded-md bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 hover:border-blue-300 transition-all shadow-sm hover:shadow-md flex-shrink-0"
                title="Réinitialiser à 12"
              >
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <Input
                className="h-8 px-2 py-1 min-w-12"
                style={{ width: `${Math.max(48, (signatureData.spacings?.global?.toString().length || 2) * 8 + 16)}px` }}
                type="text"
                inputMode="decimal"
                value={signatureData.spacings?.global ?? 12}
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
                className="grow h-4"
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
                Img profil → Information
              </Label>
              <div className="flex items-center gap-3 w-30">
                <Input
                  className="h-8 w-16 px-2 py-1"
                  type="text"
                  inputMode="decimal"
                  value={signatureData.spacings?.nameSpacing ?? 12}
                  onChange={(e) =>
                    handleSpacingChange("nameSpacing", e.target.value)
                  }
                  onBlur={(e) =>
                    handleSpacingChange("nameSpacing", e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSpacingChange("nameSpacing", e.target.value);
                    }
                  }}
                  min={0}
                  max={30}
                  aria-label="Espacement photo vers informations"
                  placeholder="12"
                />
                <Slider
                  className="grow h-4"
                  value={[signatureData.spacings?.nameSpacing ?? 12]}
                  onValueChange={(value) =>
                    handleSpacingChange("nameSpacing", value[0])
                  }
                  min={0}
                  max={30}
                  step={2}
                  aria-label="Espacement photo vers informations"
                />
              </div>
            </div>

            {/* Espacement sous le logo - uniquement pour layout vertical */}
            {signatureData.layout === "vertical" && (
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  Sous logo
                </Label>
                <div className="flex items-center gap-3 w-30">
                  <Input
                    className="h-8 w-16 px-2 py-1"
                    type="text"
                    inputMode="decimal"
                    value={signatureData.spacings?.logoBottom ?? 12}
                    onChange={(e) =>
                      handleSpacingChange("logoBottom", e.target.value)
                    }
                    onBlur={(e) =>
                      handleSpacingChange("logoBottom", e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSpacingChange("logoBottom", e.target.value);
                      }
                    }}
                    min={0}
                    max={30}
                    aria-label="Espacement logo"
                    placeholder="12"
                  />
                  <Slider
                    className="grow h-4"
                    value={[signatureData.spacings?.logoBottom ?? 12]}
                    onValueChange={(value) =>
                      handleSpacingChange("logoBottom", value[0])
                    }
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
                {signatureData.layout === "vertical"
                  ? "Sous nom"
                  : "Nom → Poste"}
              </Label>
              <div className="flex items-center gap-3 w-30">
                <Input
                  className="h-8 w-16 px-2 py-1"
                  type="text"
                  inputMode="decimal"
                  value={signatureData.spacings?.nameBottom ?? 8}
                  onChange={(e) =>
                    handleSpacingChange("nameBottom", e.target.value)
                  }
                  onBlur={(e) =>
                    handleSpacingChange("nameBottom", e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSpacingChange("nameBottom", e.target.value);
                    }
                  }}
                  min={0}
                  max={30}
                  aria-label="Espacement nom"
                  placeholder="8"
                />
                <Slider
                  className="grow h-4"
                  value={[signatureData.spacings?.nameBottom ?? 8]}
                  onValueChange={(value) =>
                    handleSpacingChange("nameBottom", value[0])
                  }
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
                {signatureData.layout === "vertical"
                  ? "Sous poste"
                  : "Poste → Entreprise"}
              </Label>
              <div className="flex items-center gap-3 w-30">
                <Input
                  className="h-8 w-16 px-2 py-1"
                  type="text"
                  inputMode="decimal"
                  value={signatureData.spacings?.positionBottom ?? 8}
                  onChange={(e) =>
                    handleSpacingChange("positionBottom", e.target.value)
                  }
                  onBlur={(e) =>
                    handleSpacingChange("positionBottom", e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSpacingChange("positionBottom", e.target.value);
                    }
                  }}
                  min={0}
                  max={30}
                  aria-label="Espacement poste"
                  placeholder="8"
                />
                <Slider
                  className="grow h-4"
                  value={[signatureData.spacings?.positionBottom ?? 8]}
                  onValueChange={(value) =>
                    handleSpacingChange("positionBottom", value[0])
                  }
                  min={0}
                  max={30}
                  step={2}
                  aria-label="Espacement poste"
                />
              </div>
            </div>

            {/* Espacement entre téléphone et mobile - disponible pour les deux layouts */}
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Téléphone → Téléphone 2
              </Label>
              <div className="flex items-center gap-3 w-30">
                <Input
                  className="h-8 w-16 px-2 py-1"
                  type="text"
                  inputMode="decimal"
                  value={signatureData.spacings?.phoneToMobile ?? 4}
                  onChange={(e) =>
                    handleSpacingChange("phoneToMobile", e.target.value)
                  }
                  onBlur={(e) =>
                    handleSpacingChange("phoneToMobile", e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSpacingChange("phoneToMobile", e.target.value);
                    }
                  }}
                  min={0}
                  max={20}
                  aria-label="Espacement téléphone vers mobile"
                  placeholder="4"
                />
                <Slider
                  className="grow h-4"
                  value={[signatureData.spacings?.phoneToMobile ?? 4]}
                  onValueChange={(value) =>
                    handleSpacingChange("phoneToMobile", value[0])
                  }
                  min={0}
                  max={20}
                  step={1}
                  aria-label="Espacement téléphone vers mobile"
                />
              </div>
            </div>

            {/* Espacement entre mobile et email - disponible pour les deux layouts */}
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Mobile → Email
              </Label>
              <div className="flex items-center gap-3 w-30">
                <Input
                  className="h-8 w-16 px-2 py-1"
                  type="text"
                  inputMode="decimal"
                  value={signatureData.spacings?.mobileToEmail ?? 4}
                  onChange={(e) =>
                    handleSpacingChange("mobileToEmail", e.target.value)
                  }
                  onBlur={(e) =>
                    handleSpacingChange("mobileToEmail", e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSpacingChange("mobileToEmail", e.target.value);
                    }
                  }}
                  min={0}
                  max={20}
                  aria-label="Espacement mobile vers email"
                  placeholder="4"
                />
                <Slider
                  className="grow h-4"
                  value={[signatureData.spacings?.mobileToEmail ?? 4]}
                  onValueChange={(value) =>
                    handleSpacingChange("mobileToEmail", value[0])
                  }
                  min={0}
                  max={20}
                  step={1}
                  aria-label="Espacement mobile vers email"
                />
              </div>
            </div>

            {/* Espacement entre email et site web - disponible pour les deux layouts */}
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Email → Site web
              </Label>
              <div className="flex items-center gap-3 w-30">
                <Input
                  className="h-8 w-16 px-2 py-1"
                  type="text"
                  inputMode="decimal"
                  value={signatureData.spacings?.emailToWebsite ?? 4}
                  onChange={(e) =>
                    handleSpacingChange("emailToWebsite", e.target.value)
                  }
                  onBlur={(e) =>
                    handleSpacingChange("emailToWebsite", e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSpacingChange("emailToWebsite", e.target.value);
                    }
                  }}
                  min={0}
                  max={20}
                  aria-label="Espacement email vers site web"
                  placeholder="4"
                />
                <Slider
                  className="grow h-4"
                  value={[signatureData.spacings?.emailToWebsite ?? 4]}
                  onValueChange={(value) =>
                    handleSpacingChange("emailToWebsite", value[0])
                  }
                  min={0}
                  max={20}
                  step={1}
                  aria-label="Espacement email vers site web"
                />
              </div>
            </div>

            {/* Espacement entre site web et adresse - disponible pour les deux layouts */}
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Site web → Adresse
              </Label>
              <div className="flex items-center gap-3 w-30">
                <Input
                  className="h-8 w-16 px-2 py-1"
                  type="text"
                  inputMode="decimal"
                  value={signatureData.spacings?.websiteToAddress ?? 4}
                  onChange={(e) =>
                    handleSpacingChange("websiteToAddress", e.target.value)
                  }
                  onBlur={(e) =>
                    handleSpacingChange("websiteToAddress", e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSpacingChange("websiteToAddress", e.target.value);
                    }
                  }}
                  min={0}
                  max={20}
                  aria-label="Espacement site web vers adresse"
                  placeholder="4"
                />
                <Slider
                  className="grow h-4"
                  value={[signatureData.spacings?.websiteToAddress ?? 4]}
                  onValueChange={(value) =>
                    handleSpacingChange("websiteToAddress", value[0])
                  }
                  min={0}
                  max={20}
                  step={1}
                  aria-label="Espacement site web vers adresse"
                />
              </div>
            </div>

            {/* Espacement avant séparateur */}
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Avant séparateur
              </Label>
              <div className="flex items-center gap-3 w-30">
                <Input
                  className="h-8 w-16 px-2 py-1"
                  type="text"
                  inputMode="decimal"
                  value={signatureData.spacings?.separatorTop ?? 12}
                  onChange={(e) =>
                    handleSpacingChange("separatorTop", e.target.value)
                  }
                  onBlur={(e) =>
                    handleSpacingChange("separatorTop", e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSpacingChange("separatorTop", e.target.value);
                    }
                  }}
                  min={0}
                  max={30}
                  aria-label="Espacement avant le séparateur"
                  placeholder="12"
                />
                <Slider
                  className="grow h-4"
                  value={[signatureData.spacings?.separatorTop ?? 12]}
                  onValueChange={(value) =>
                    handleSpacingChange("separatorTop", value[0])
                  }
                  min={0}
                  max={30}
                  step={2}
                  aria-label="Espacement avant séparateur"
                />
              </div>
            </div>

            {/* Espacement après séparateur */}
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Après séparateur
              </Label>
              <div className="flex items-center gap-3 w-30">
                <Input
                  className="h-8 w-16 px-2 py-1"
                  type="text"
                  inputMode="decimal"
                  value={signatureData.spacings?.separatorBottom ?? 12}
                  onChange={(e) =>
                    handleSpacingChange("separatorBottom", e.target.value)
                  }
                  onBlur={(e) =>
                    handleSpacingChange("separatorBottom", e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSpacingChange("separatorBottom", e.target.value);
                    }
                  }}
                  min={0}
                  max={30}
                  aria-label="Espacement après séparateur"
                  placeholder="12"
                />
                <Slider
                  className="grow h-4"
                  value={[signatureData.spacings?.separatorBottom ?? 12]}
                  onValueChange={(value) =>
                    handleSpacingChange("separatorBottom", value[0])
                  }
                  min={0}
                  max={30}
                  step={2}
                  aria-label="Espacement après séparateur"
                />
              </div>
            </div>

            {/* Espacement logo entreprise → logo réseaux sociaux (horizontal uniquement) */}
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Logo entreprise → Logo réseaux sociaux
              </Label>
              <div className="flex items-center gap-3 w-30">
                <Input
                  className="h-8 w-16 px-2 py-1"
                  type="text"
                  inputMode="decimal"
                  value={signatureData.spacings?.logoToSocial ?? 12}
                  onChange={(e) =>
                    handleSpacingChange("logoToSocial", e.target.value)
                  }
                  onBlur={(e) =>
                    handleSpacingChange("logoToSocial", e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSpacingChange("logoToSocial", e.target.value);
                    }
                  }}
                  min={0}
                  max={30}
                  aria-label="Espacement horizontal logo vers réseaux sociaux"
                  placeholder="12"
                />
                <Slider
                  className="grow h-4"
                  value={[signatureData.spacings?.logoToSocial ?? 12]}
                  onValueChange={(value) =>
                    handleSpacingChange("logoToSocial", value[0])
                  }
                  min={0}
                  max={30}
                  step={2}
                  aria-label="Espacement horizontal logo vers réseaux"
                />
              </div>
            </div>

            {/* Espacements du séparateur vertical (horizontal layout uniquement) */}
            {signatureData.layout === "horizontal" &&
              signatureData.verticalSeparator?.enabled && (
                <>
                  {/* Espacement gauche du séparateur vertical */}
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">
                      Séparateur vertical - Gauche
                    </Label>
                    <div className="flex items-center gap-3 w-30">
                      <Input
                        className="h-8 w-16 px-2 py-1"
                        type="text"
                        inputMode="decimal"
                        value={
                          signatureData.spacings?.verticalSeparatorLeft ?? 22
                        }
                        onChange={(e) =>
                          handleSpacingChange(
                            "verticalSeparatorLeft",
                            e.target.value
                          )
                        }
                        onBlur={(e) =>
                          handleSpacingChange(
                            "verticalSeparatorLeft",
                            e.target.value
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSpacingChange(
                              "verticalSeparatorLeft",
                              e.target.value
                            );
                          }
                        }}
                        min={0}
                        max={30}
                        aria-label="Espacement gauche séparateur vertical"
                        placeholder="22"
                      />
                      <Slider
                        className="grow h-4"
                        value={[
                          signatureData.spacings?.verticalSeparatorLeft ?? 22,
                        ]}
                        onValueChange={(value) =>
                          handleSpacingChange("verticalSeparatorLeft", value[0])
                        }
                        min={0}
                        max={30}
                        step={2}
                        aria-label="Espacement gauche séparateur vertical"
                      />
                    </div>
                  </div>

                  {/* Espacement droite du séparateur vertical */}
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">
                      Séparateur vertical - Droite
                    </Label>
                    <div className="flex items-center gap-3 w-30">
                      <Input
                        className="h-8 w-16 px-2 py-1"
                        type="text"
                        inputMode="decimal"
                        value={
                          signatureData.spacings?.verticalSeparatorRight ?? 22
                        }
                        onChange={(e) =>
                          handleSpacingChange(
                            "verticalSeparatorRight",
                            e.target.value
                          )
                        }
                        onBlur={(e) =>
                          handleSpacingChange(
                            "verticalSeparatorRight",
                            e.target.value
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSpacingChange(
                              "verticalSeparatorRight",
                              e.target.value
                            );
                          }
                        }}
                        min={0}
                        max={30}
                        aria-label="Espacement droite séparateur vertical"
                        placeholder="22"
                      />
                      <Slider
                        className="grow h-4"
                        value={[
                          signatureData.spacings?.verticalSeparatorRight ?? 22,
                        ]}
                        onValueChange={(value) =>
                          handleSpacingChange(
                            "verticalSeparatorRight",
                            value[0]
                          )
                        }
                        min={0}
                        max={30}
                        step={2}
                        aria-label="Espacement droite séparateur vertical"
                      />
                    </div>
                  </div>
                </>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
