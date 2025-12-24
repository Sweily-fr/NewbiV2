/**
 * Signature verticale - Disposition centrée avec photo en haut
 * Basée sur le design fourni avec photo ronde, nom, poste, contact et réseaux sociaux
 * Supporte le réordonnancement des éléments via elementsOrder
 */

"use client";

import React from "react";
import ProfileImage from "../signature-parts/ProfileImage";
import PersonalInfo from "../signature-parts/PersonalInfo";
import ContactInfo from "../signature-parts/ContactInfo";
import HorizontalSeparator from "../signature-parts/HorizontalSeparator";
import CompanyLogo from "../signature-parts/CompanyLogo";
import SocialNetworks from "../signature-parts/SocialNetworks";
import { getSpacing } from "../../utils/spacing-helper";
import { getIndividualPaddingStyles } from "../../utils/padding-helper";
import "@/src/styles/signature-text-selection.css";
import "./signature-preview.css";

// Ordre par défaut des éléments
const DEFAULT_ORDER = ["photo", "fullName", "position", "company", "separator", "contact", "logo", "social"];

const VerticalSignature = ({
  signatureData,
  handleFieldChange,
  handleImageChange,
  validatePhone,
  validateEmail,
  validateUrl,
  logoSrc,
}) => {
  const spacings = signatureData.spacings ?? {};
  
  // Récupérer l'ordre des éléments ou utiliser l'ordre par défaut
  const elementsOrder = signatureData.elementsOrder?.length > 0 
    ? signatureData.elementsOrder 
    : DEFAULT_ORDER;

  // Fonction pour rendre un élément selon son type
  const renderElement = (elementId, index) => {
    const isLast = index === elementsOrder.length - 1;
    
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
                textAlign: "center",
                display: "block",
              }}
            >
              <div style={{ margin: "0 auto", width: "fit-content" }}>
                <ProfileImage
                  photoSrc={signatureData.photo}
                  size={signatureData.imageSize || 120}
                  shape={signatureData.imageShape || "round"}
                  onImageChange={(imageUrl) => handleImageChange("photo", imageUrl)}
                  isEditable={true}
                  spacing={0}
                  wrapInTd={false}
                  signatureData={signatureData}
                />
              </div>
            </td>
          </tr>
        );

      case "fullName":
        return (
          <PersonalInfo
            key={elementId}
            fullName={signatureData.fullName}
            position={null} // On ne rend que le nom ici
            companyName={null}
            onFieldChange={handleFieldChange}
            typography={signatureData.typography || {}}
            fontFamily={signatureData.fontFamily || "Arial, sans-serif"}
            fontSize={signatureData.fontSize || {}}
            colors={signatureData.colors || {}}
            primaryColor={signatureData.primaryColor || "#171717"}
            spacings={spacings}
            signatureData={signatureData}
            nameAlignment="center"
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
            nameAlignment="center"
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
            nameAlignment="center"
            showOnlyCompany={true}
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
            colSpan={1}
            signatureData={signatureData}
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
            centered={true}
          />
        );

      case "logo":
        if (!logoSrc || signatureData.logoVisible === false) return null;
        return (
          <CompanyLogo
            key={elementId}
            logoSrc={logoSrc}
            size={signatureData.logoSize || 80}
            spacing={getSpacing(signatureData, spacings.logoBottom, spacings.global || 8)}
            alignment="center"
            signatureData={signatureData}
          />
        );

      case "social":
        return (
          <SocialNetworks
            key={elementId}
            socialNetworks={signatureData.socialNetworks || {}}
            customSocialIcons={signatureData.customSocialIcons || {}}
            size={signatureData.socialSize || 28}
            globalColor={signatureData.socialGlobalColor}
            socialColors={signatureData.socialColors || {}}
            spacing={getSpacing(signatureData, spacings.logoToSocial, 16)}
            iconSpacing={12}
            colSpan={1}
            centered={true}
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
        maxWidth: "400px",
        margin: "0 auto",
        tableLayout: "auto",
      }}
    >
      <tbody>
        {elementsOrder.map((elementId, index) => renderElement(elementId, index))}
      </tbody>
    </table>
  );

  return (
    <div
      className="signature-preview-container"
      style={{
        fontFamily: signatureData.fontFamily || "Arial, sans-serif",
        width: "auto",
        maxWidth: "400px",
        margin: "0 auto",
      }}
    >
      {tableContent}
    </div>
  );
};

export default VerticalSignature;
