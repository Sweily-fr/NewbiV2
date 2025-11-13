/**
 * Informations personnelles pour les signatures
 * Affiche et permet d'éditer le nom, poste et entreprise
 */

"use client";

import React from "react";
import { InlineEdit } from "@/src/components/ui/inline-edit";
import { getTypographyStyles } from "../../utils/typography-styles";
import { getSpacing } from "../../utils/spacing-helper";

const PersonalInfo = ({
  fullName,
  position,
  companyName,
  onFieldChange,
  typography = {},
  fontFamily = "Arial, sans-serif",
  fontSize = {},
  colors = {},
  primaryColor = "#171717",
  spacings = {},
  signatureData = {},
  nameAlignment = "left",
}) => {
  return (
    <>
      {/* Nom complet */}
      <tr>
        <td
          colSpan="2"
          style={{
            textAlign: nameAlignment,
            paddingBottom: `${getSpacing(signatureData, spacings.nameBottom, 8)}px`,
          }}
        >
          <div
            style={{
              ...getTypographyStyles(typography.fullName, {
                fontFamily: fontFamily,
                fontSize: fontSize.name || 16,
                fontWeight: "bold",
                color: primaryColor,
              }),
              lineHeight: "1.2",
            }}
          >
            <InlineEdit
              value={fullName}
              onChange={(value) => onFieldChange("fullName", value)}
              placeholder="Nom complet"
              displayClassName="border-0 shadow-none p-0 h-auto"
              inputClassName="border-0 shadow-none p-0 h-auto"
              style={{
                width: "auto",
                minWidth: "0",
                height: "1em",
                lineHeight: "1em",
                fontSize: `${typography.fullName?.fontSize || fontSize.name || 16}px`,
                color: typography.fullName?.color || primaryColor,
                fontFamily: typography.fullName?.fontFamily || fontFamily,
                fontWeight: typography.fullName?.fontWeight || "normal",
              }}
            />
          </div>
        </td>
      </tr>

      {/* Poste */}
      {position && (
        <tr>
          <td
            colSpan="2"
            style={{
              ...getTypographyStyles(typography.position, {
                fontFamily: fontFamily,
                fontSize: fontSize.position || 14,
                color: colors.position || "#666666",
              }),
              paddingBottom: `${getSpacing(signatureData, spacings.positionBottom, 8)}px`,
              whiteSpace: "nowrap",
            }}
          >
            <InlineEdit
              value={position}
              onChange={(value) => onFieldChange("position", value)}
              placeholder="Votre poste"
              displayClassName="text-sm border-0 shadow-none p-0 h-auto"
              inputClassName="text-sm border-0 shadow-none p-0 h-auto"
              style={{
                color: typography.position?.color || colors.position || "#666666",
                fontSize: `${typography.position?.fontSize || fontSize.position || 14}px`,
                fontFamily: typography.position?.fontFamily || fontFamily,
                fontWeight: typography.position?.fontWeight || "normal",
              }}
            />
          </td>
        </tr>
      )}

      {/* Nom d'entreprise */}
      {companyName && (
        <tr>
          <td
            colSpan="2"
            style={{
              ...getTypographyStyles(typography.company, {
                fontFamily: fontFamily,
                fontSize: fontSize.company || 14,
                fontWeight: "bold",
                color: primaryColor,
              }),
              paddingBottom: `${spacings.companyBottom ?? 12}px`,
            }}
          >
            <InlineEdit
              value={companyName}
              onChange={(value) => onFieldChange("companyName", value)}
              placeholder="Nom de l'entreprise"
              displayClassName="text-sm font-bold"
              inputClassName="text-sm font-bold border-0 shadow-none p-1 h-auto"
              style={{
                color: typography.company?.color || primaryColor,
                fontSize: `${typography.company?.fontSize || fontSize.company || 14}px`,
                fontFamily: typography.company?.fontFamily || fontFamily,
                fontWeight: typography.company?.fontWeight || "bold",
              }}
            />
          </td>
        </tr>
      )}
    </>
  );
};

export default PersonalInfo;
