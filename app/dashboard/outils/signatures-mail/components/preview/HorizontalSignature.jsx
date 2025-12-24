/**
 * Signature horizontal - VERSION REFACTORISÉE
 * Utilise les mêmes composants modulaires
 * Supporte le réordonnancement des éléments via horizontalLayout
 */

"use client";

import React from "react";
import ProfileImage from "../signature-parts/ProfileImage";
import PersonalInfo from "../signature-parts/PersonalInfo";
import ContactInfo from "../signature-parts/ContactInfo";
import VerticalSeparator from "../signature-parts/VerticalSeparator";
import HorizontalSeparator from "../signature-parts/HorizontalSeparator";
import CompanyLogo from "../signature-parts/CompanyLogo";
import SocialNetworks from "../signature-parts/SocialNetworks";
import { getSpacing } from "../../utils/spacing-helper";
import { getIndividualPaddingStyles } from "../../utils/padding-helper";
import "@/src/styles/signature-text-selection.css";
import "./signature-preview.css";

// Layout par défaut
const DEFAULT_HORIZONTAL_LAYOUT = {
  leftColumn: ["photo", "fullName", "position", "company"],
  rightColumn: ["contact"],
  bottomRow: ["separator", "logo", "social"],
};

const HorizontalSignature = ({
  signatureData,
  handleFieldChange,
  handleImageChange,
  validatePhone,
  validateEmail,
  validateUrl,
  logoSrc,
}) => {
  const spacings = signatureData.spacings ?? {};
  
  // Récupérer le layout ou utiliser le layout par défaut
  const layout = signatureData.horizontalLayout || DEFAULT_HORIZONTAL_LAYOUT;
  const leftColumn = layout.leftColumn || DEFAULT_HORIZONTAL_LAYOUT.leftColumn;
  const rightColumn = layout.rightColumn || DEFAULT_HORIZONTAL_LAYOUT.rightColumn;
  const bottomRow = layout.bottomRow || DEFAULT_HORIZONTAL_LAYOUT.bottomRow;

  // Fonction pour rendre un élément selon son type
  const renderElement = (elementId, isInColumn = true) => {
    switch (elementId) {
      case "photo":
        if (!signatureData.photo || signatureData.photoVisible === false) return null;
        return (
          <tr key={elementId}>
            <td
              style={{
                ...(signatureData.detailedSpacing
                  ? getIndividualPaddingStyles(signatureData, "photo", { bottom: spacings.global || 8 })
                  : { paddingBottom: `${getSpacing(signatureData, spacings.photoBottom, spacings.global || 8)}px` }),
              }}
            >
              <ProfileImage
                photoSrc={signatureData.photo}
                size={signatureData.imageSize || 70}
                shape={signatureData.imageShape || "round"}
                onImageChange={(imageUrl) => handleImageChange("photo", imageUrl)}
                isEditable={true}
                spacing={0}
                wrapInTd={false}
                signatureData={signatureData}
              />
            </td>
          </tr>
        );

      case "fullName":
        return (
          <PersonalInfo
            key={elementId}
            fullName={signatureData.fullName}
            position={null}
            companyName={null}
            onFieldChange={handleFieldChange}
            typography={signatureData.typography || {}}
            fontFamily={signatureData.fontFamily || "Arial, sans-serif"}
            fontSize={signatureData.fontSize || {}}
            colors={signatureData.colors || {}}
            primaryColor={signatureData.primaryColor || "#171717"}
            spacings={spacings}
            signatureData={signatureData}
            nameAlignment={signatureData.nameAlignment || "left"}
            showOnlyName={true}
          />
        );

      case "position":
        if (!signatureData.position) return null;
        return (
          <PersonalInfo
            key={elementId}
            fullName={null}
            position={signatureData.position}
            companyName={null}
            onFieldChange={handleFieldChange}
            typography={signatureData.typography || {}}
            fontFamily={signatureData.fontFamily || "Arial, sans-serif"}
            fontSize={signatureData.fontSize || {}}
            colors={signatureData.colors || {}}
            primaryColor={signatureData.primaryColor || "#171717"}
            spacings={spacings}
            signatureData={signatureData}
            nameAlignment={signatureData.nameAlignment || "left"}
            showOnlyPosition={true}
          />
        );

      case "company":
        if (!signatureData.companyName) return null;
        return (
          <PersonalInfo
            key={elementId}
            fullName={null}
            position={null}
            companyName={signatureData.companyName}
            onFieldChange={handleFieldChange}
            typography={signatureData.typography || {}}
            fontFamily={signatureData.fontFamily || "Arial, sans-serif"}
            fontSize={signatureData.fontSize || {}}
            colors={signatureData.colors || {}}
            primaryColor={signatureData.primaryColor || "#171717"}
            spacings={spacings}
            signatureData={signatureData}
            nameAlignment={signatureData.nameAlignment || "left"}
            showOnlyCompany={true}
          />
        );

      case "contact":
        return (
          <ContactInfo
            key={elementId}
            phone={signatureData.phone}
            mobile={signatureData.mobile}
            email={signatureData.email}
            website={signatureData.website}
            address={signatureData.address}
            onFieldChange={handleFieldChange}
            validators={{
              validatePhone,
              validateEmail,
              validateUrl,
            }}
            typography={signatureData.typography || {}}
            fontFamily={signatureData.fontFamily || "Arial, sans-serif"}
            fontSize={signatureData.fontSize || {}}
            colors={signatureData.colors || {}}
            primaryColor={signatureData.primaryColor || "#171717"}
            spacings={spacings}
            signatureData={signatureData}
            iconSize={signatureData.iconSize || 16}
            showIcons={{
              phone: signatureData.showPhoneIcon ?? true,
              mobile: signatureData.showMobileIcon ?? true,
              email: signatureData.showEmailIcon ?? true,
              website: signatureData.showWebsiteIcon ?? true,
              address: signatureData.showAddressIcon ?? true,
            }}
          />
        );

      case "separator":
        return (
          <HorizontalSeparator
            key={elementId}
            enabled={signatureData.separatorHorizontalEnabled}
            color={signatureData.colors?.separatorHorizontal || "#e0e0e0"}
            width={signatureData.separatorHorizontalWidth || 1}
            topSpacing={getSpacing(signatureData, spacings.separatorTop, spacings.global || 8)}
            bottomSpacing={getSpacing(signatureData, spacings.separatorBottom, spacings.global || 8)}
            radius={0}
            colSpan={signatureData.separatorVerticalEnabled ? 5 : 2}
            signatureData={signatureData}
          />
        );

      case "logo":
        if (!logoSrc || signatureData.logoVisible === false) return null;
        return (
          <CompanyLogo
            key={elementId}
            logoSrc={logoSrc}
            size={signatureData.logoSize || 60}
            spacing={getSpacing(signatureData, spacings.logoBottom, spacings.global || 8)}
            alignment="left"
            signatureData={signatureData}
          />
        );

      case "social":
        return (
          <SocialNetworks
            key={elementId}
            socialNetworks={signatureData.socialNetworks || {}}
            customSocialIcons={signatureData.customSocialIcons || {}}
            size={signatureData.socialSize || 24}
            globalColor={signatureData.socialGlobalColor}
            socialColors={signatureData.socialColors || {}}
            spacing={getSpacing(signatureData, spacings.logoToSocial, 15)}
            iconSpacing={8}
            colSpan={signatureData.separatorVerticalEnabled ? 5 : 2}
            signatureData={signatureData}
          />
        );

      default:
        return null;
    }
  };

  const tableContent = (
    <table
      cellPadding="0"
      cellSpacing="0"
      border="0"
      style={{
        borderCollapse: "collapse",
        width: "auto",
        maxWidth: "600px",
        tableLayout: "auto",
      }}
    >
      <tbody>
        <tr>
          {/* Colonne gauche */}
          <td
            style={{
              verticalAlign: "top",
              ...(signatureData.separatorVerticalEnabled && {
                paddingRight: `${getSpacing(signatureData, spacings.global, 12)}px`,
              }),
            }}
          >
            <table
              cellPadding="0"
              cellSpacing="0"
              border="0"
              style={{
                borderCollapse: "collapse",
                width: "auto",
              }}
            >
              <tbody>
                {leftColumn.map((elementId) => renderElement(elementId, true))}
              </tbody>
            </table>
          </td>

          {/* Séparateur vertical */}
          <VerticalSeparator
            signatureData={signatureData}
            enabled={signatureData.separatorVerticalEnabled}
            color={signatureData.colors?.separatorVertical || "#e0e0e0"}
            width={signatureData.separatorVerticalWidth || 1}
            leftSpacing={getSpacing(signatureData, spacings.global, 12)}
            rightSpacing={getSpacing(signatureData, spacings.global, 12)}
            minHeight="200px"
          />

          {/* Colonne droite */}
          <td
            style={{
              verticalAlign: signatureData.contactAlignment || "top",
              ...(signatureData.separatorVerticalEnabled && {
                paddingLeft: `${getSpacing(signatureData, spacings.global, 12)}px`,
              }),
            }}
          >
            <table
              cellPadding="0"
              cellSpacing="0"
              border="0"
              style={{
                borderCollapse: "collapse",
                width: "auto",
              }}
            >
              <tbody>
                {rightColumn.map((elementId) => renderElement(elementId, true))}
              </tbody>
            </table>
          </td>
        </tr>

        {/* Zone du bas (pleine largeur) */}
        {bottomRow.map((elementId) => renderElement(elementId, false))}
      </tbody>
    </table>
  );

  return (
    <div
      className="signature-preview-container"
      style={{
        fontFamily: signatureData.fontFamily || "Arial, sans-serif",
        width: "auto",
        maxWidth: "600px",
      }}
    >
      {tableContent}
    </div>
  );
};

export default HorizontalSignature;
