/**
 * Logo d'entreprise pour les signatures
 * Affiche le logo avec taille personnalisable
 */

import { getIndividualPaddingStyles } from "../../utils/padding-helper";

const CompanyLogo = ({ logoSrc, size = 60, spacing = 8, alignment = "left", signatureData = {} }) => {
  if (!logoSrc) return null;

  const imageStyle = {
    width: `${size}px`,
    height: "auto",
    objectFit: "contain",
    display: "block",
    margin:
      alignment === "center"
        ? "0 auto"
        : alignment === "right"
        ? "0 0 0 auto"
        : "0",
  };

  return (
    <tr>
      <td
        colSpan="2"
        style={{
          // Padding détaillé ou espacement par défaut
          ...(signatureData.detailedSpacing
            ? getIndividualPaddingStyles(signatureData, "logo", { top: spacing })
            : { paddingTop: `${spacing}px` }),
          textAlign: alignment,
        }}
      >
        <img src={logoSrc} alt="Logo entreprise" style={imageStyle} />
      </td>
    </tr>
  );
};

export default CompanyLogo;
