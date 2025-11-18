/**
 * Séparateur vertical pour les signatures
 * Affiche un séparateur vertical avec espacements personnalisables
 */

import { getIndividualPaddingStyles } from "../../utils/padding-helper";

const VerticalSeparator = ({
  enabled = false,
  color = "#e0e0e0",
  leftSpacing = 8,
  rightSpacing = 8,
  minHeight = "200px",
  signatureData = {}, 
}) => {
  if (!enabled) return null;

  const { paddingTop: individualPaddingTop, paddingBottom: individualPaddingBottom } = getIndividualPaddingStyles(signatureData);

  const leftSpacingValue = leftSpacing + individualPaddingTop;
  const rightSpacingValue = rightSpacing + individualPaddingBottom;

  return (
    <>
      {/* Séparateur */}
      <td
        style={{
          width: "1px",
          backgroundColor: color,
          borderRadius: "0px",
          lineHeight: "1px",
          verticalAlign: "top",
          height: "100%",
          minHeight: minHeight,
          paddingTop: individualPaddingTop,
          paddingBottom: individualPaddingBottom,
          marginLeft: leftSpacingValue,
          marginRight: rightSpacingValue,
        }}
      >
        &nbsp;
      </td>
    </>
  );
};

export default VerticalSeparator;
