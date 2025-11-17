/**
 * Signature verticale - Disposition centrée avec photo en haut
 * Basée sur le design fourni avec photo ronde, nom, poste, contact et réseaux sociaux
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
import "@/src/styles/signature-text-selection.css";
import "./signature-preview.css";

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
        {/* Photo de profil (centrée en haut) */}
        {signatureData.photo && signatureData.photoVisible !== false && (
          <tr>
            <td
              style={{
                paddingBottom: `${getSpacing(signatureData, spacings.photoBottom, 16)}px`,
                textAlign: "center",
                display: "block",
              }}
            >
              <div style={{ margin: "0 auto", width: "fit-content" }}>
                <ProfileImage
                  photoSrc={signatureData.photo}
                  size={signatureData.imageSize || 120}
                  shape={signatureData.imageShape || "round"}
                  onImageChange={(imageUrl) =>
                    handleImageChange("photo", imageUrl)
                  }
                  isEditable={true}
                  spacing={0}
                  wrapInTd={false}
                />
              </div>
            </td>
          </tr>
        )}

        {/* Informations personnelles (centrées) */}
        <PersonalInfo
          fullName={signatureData.fullName}
          position={signatureData.position}
          companyName={signatureData.companyName}
          onFieldChange={handleFieldChange}
          typography={signatureData.typography || {}}
          fontFamily={signatureData.fontFamily || "Arial, sans-serif"}
          fontSize={signatureData.fontSize || {}}
          colors={signatureData.colors || {}}
          primaryColor={signatureData.primaryColor || "#171717"}
          spacings={spacings}
          nameAlignment="center"
        />

        {/* Séparateur horizontal (optionnel) */}
        <HorizontalSeparator
          enabled={signatureData.separatorHorizontalEnabled}
          color={signatureData.colors?.separatorHorizontal || "#e0e0e0"}
          width={signatureData.separatorHorizontalWidth || 1}
          topSpacing={getSpacing(signatureData, spacings.separatorTop, 12)}
          bottomSpacing={getSpacing(signatureData, spacings.separatorBottom, 12)}
          radius={0}
          colSpan={1}
        />

        {/* Informations de contact (centrées) */}
        <ContactInfo
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

        {/* Logo entreprise (centré) */}
        {logoSrc && signatureData.logoVisible !== false && (
          <tr>
            <td
              style={{
                paddingTop: `${getSpacing(signatureData, spacings.logoBottom, 16)}px`,
                textAlign: "center",
              }}
            >
              <img
                src={logoSrc}
                alt="Logo entreprise"
                style={{
                  width: `${signatureData.logoSize || 80}px`,
                  height: "auto",
                  maxHeight: `${signatureData.logoSize || 80}px`,
                  objectFit: "contain",
                  display: "block",
                  margin: "0 auto",
                }}
              />
            </td>
          </tr>
        )}

        {/* Réseaux sociaux (centrés) */}
        <SocialNetworks
          socialNetworks={signatureData.socialNetworks || {}}
          customSocialIcons={signatureData.customSocialIcons || {}}
          size={signatureData.socialSize || 28}
          globalColor={signatureData.socialGlobalColor}
          socialColors={signatureData.socialColors || {}}
          spacing={getSpacing(signatureData, spacings.logoToSocial, 16)}
          iconSpacing={12}
          colSpan={1}
          centered={true}
        />
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
