/**
 * Informations personnelles pour les signatures
 * Affiche et permet d'éditer le nom, poste et entreprise
 */

"use client";

import React from "react";
import { InlineEdit } from "@/src/components/ui/inline-edit";
import { getTypographyStyles } from "../../utils/typography-styles";
import { getSpacing } from "../../utils/spacing-helper";
import { getIndividualPaddingStyles } from "../../utils/padding-helper";

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
  // Props pour afficher un seul élément (utilisé avec elementsOrder)
  showOnlyName = false,
  showOnlyPosition = false,
  showOnlyCompany = false,
  // Mode inline : nom et poste sur la même ligne
  inlineNamePosition = false,
}) => {
  // Si un mode "showOnly" est actif, on n'affiche que cet élément
  const showAll = !showOnlyName && !showOnlyPosition && !showOnlyCompany;

  // Mode inline : nom et poste sur la même ligne
  if (inlineNamePosition && fullName) {
    return (
      <tr>
        <td
          colSpan="2"
          style={{
            textAlign: nameAlignment,
            ...(signatureData.detailedSpacing
              ? getIndividualPaddingStyles(signatureData, "name", { bottom: spacings.nameBottom || spacings.global || 4 })
              : { paddingBottom: `${getSpacing(signatureData, spacings.nameBottom, spacings.global || 4)}px` }),
          }}
        >
          <span
            style={{
              ...getTypographyStyles(typography.fullName, {
                fontFamily: fontFamily,
                fontSize: fontSize.name || 14,
                fontWeight: "bold",
                color: primaryColor,
              }),
            }}
          >
            <InlineEdit
              value={fullName}
              onChange={(value) => onFieldChange("fullName", value)}
              placeholder="Nom complet"
              displayClassName="border-0 shadow-none p-0 h-auto"
              inputClassName="border-0 shadow-none p-0 h-auto"
              style={{
                display: "inline",
                width: "auto",
                minWidth: "0",
                height: "auto",
                fontSize: `${typography.fullName?.fontSize || fontSize.name || 14}px`,
                color: typography.fullName?.color || primaryColor,
                fontFamily: typography.fullName?.fontFamily || fontFamily,
                fontWeight: typography.fullName?.fontWeight || "bold",
                fontStyle: typography.fullName?.fontStyle || "normal",
                textDecoration: typography.fullName?.textDecoration || "none",
              }}
            />
          </span>
          {position && (
            <>
              {" "}
              <span
                style={{
                  ...getTypographyStyles(typography.position, {
                    fontFamily: fontFamily,
                    fontSize: fontSize.position || 12,
                    color: colors.position || "#666666",
                  }),
                }}
              >
                <InlineEdit
                  value={position}
                  onChange={(value) => onFieldChange("position", value)}
                  placeholder="Votre poste"
                  displayClassName="border-0 shadow-none p-0 h-auto"
                  inputClassName="border-0 shadow-none p-0 h-auto"
                  style={{
                    display: "inline",
                    width: "auto",
                    minWidth: "0",
                    height: "auto",
                    color: typography.position?.color || colors.position || "#666666",
                    fontSize: `${typography.position?.fontSize || fontSize.position || 12}px`,
                    fontFamily: typography.position?.fontFamily || fontFamily,
                    fontWeight: typography.position?.fontWeight || "normal",
                    fontStyle: typography.position?.fontStyle || "normal",
                    textDecoration: typography.position?.textDecoration || "none",
                  }}
                />
              </span>
            </>
          )}
        </td>
      </tr>
    );
  }

  return (
    <>
      {/* Nom complet */}
      {(showAll || showOnlyName) && fullName && (
      <tr>
        <td
          colSpan="2"
          style={{
            textAlign: nameAlignment,
            // Padding détaillé ou espacement par défaut
            ...(signatureData.detailedSpacing
              ? getIndividualPaddingStyles(signatureData, "name", { bottom: spacings.nameBottom || spacings.global || 8 })
              : { paddingBottom: `${getSpacing(signatureData, spacings.nameBottom, spacings.global || 8)}px` }),
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
                height: "auto",
                lineHeight: "1.2",
                fontSize: `${typography.fullName?.fontSize || fontSize.name || 16}px`,
                color: typography.fullName?.color || primaryColor,
                fontFamily: typography.fullName?.fontFamily || fontFamily,
                fontWeight: typography.fullName?.fontWeight || "normal",
                fontStyle: typography.fullName?.fontStyle || "normal",
                textDecoration: typography.fullName?.textDecoration || "none",
              }}
            />
          </div>
        </td>
      </tr>
      )}

      {/* Poste */}
      {(showAll || showOnlyPosition) && position && (
        <tr>
          <td
            colSpan="2"
            style={{
              ...getTypographyStyles(typography.position, {
                fontFamily: fontFamily,
                fontSize: fontSize.position || 14,
                textAlign: nameAlignment,
              }),
              // Padding détaillé ou espacement par défaut
              ...(signatureData.detailedSpacing
                ? getIndividualPaddingStyles(signatureData, "position", { bottom: spacings.positionBottom || spacings.global })
                : { paddingBottom: `${getSpacing(signatureData, spacings.positionBottom, spacings.global)}px` }),
              whiteSpace: "nowrap",
              textAlign: nameAlignment,
            }}
          >
            <InlineEdit
              value={position}
              onChange={(value) => onFieldChange("position", value)}
              placeholder="Votre poste"
              displayClassName="border-0 shadow-none p-0 h-auto"
              inputClassName="border-0 shadow-none p-0 h-auto"
              style={{
                width: "auto",
                minWidth: "0",
                height: "auto",
                lineHeight: "1.2",
                color: typography.position?.color || colors.position || "#666666",
                fontSize: `${typography.position?.fontSize || fontSize.position || 14}px`,
                fontFamily: typography.position?.fontFamily || fontFamily,
                fontWeight: typography.position?.fontWeight || "normal",
                fontStyle: typography.position?.fontStyle || "normal",
                textDecoration: typography.position?.textDecoration || "none",
              }}
            />
          </td>
        </tr>
      )}

      {/* Nom d'entreprise */}
      {(showAll || showOnlyCompany) && companyName && (
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
              // Padding détaillé ou espacement par défaut
              ...(signatureData.detailedSpacing
                ? getIndividualPaddingStyles(signatureData, "company", { bottom: spacings.companyBottom || spacings.global || 8 })
                : { paddingBottom: `${spacings.companyBottom || spacings.global || 8}px` }),
              textAlign: nameAlignment,
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
                fontStyle: typography.company?.fontStyle || "normal",
                textDecoration: typography.company?.textDecoration || "none",
              }}
            />
          </td>
        </tr>
      )}
    </>
  );
};

export default PersonalInfo;
