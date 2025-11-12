/**
 * Séparateur vertical pour les signatures
 * Affiche un séparateur vertical avec espacements personnalisables
 */

const VerticalSeparator = ({
  enabled = false,
  color = "#e0e0e0",
  leftSpacing = 8,
  rightSpacing = 8,
  minHeight = "200px",
}) => {
  if (!enabled) return null;

  return (
    <>
      {/* Espacement gauche */}
      <td style={{ width: `${leftSpacing}px` }}>&nbsp;</td>

      {/* Séparateur */}
      <td
        style={{
          width: "1px",
          backgroundColor: color,
          borderRadius: "0px",
          padding: "0px",
          fontSize: "1px",
          lineHeight: "1px",
          verticalAlign: "top",
          height: "100%",
          minHeight: minHeight,
        }}
      >
        &nbsp;
      </td>

      {/* Espacement droit */}
      <td style={{ width: `${rightSpacing}px` }}>&nbsp;</td>
    </>
  );
};

export default VerticalSeparator;
