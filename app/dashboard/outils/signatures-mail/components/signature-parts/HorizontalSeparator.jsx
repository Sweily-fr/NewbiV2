/**
 * Séparateur horizontal pour les signatures
 * Affiche un séparateur horizontal avec espacements personnalisables
 */

const HorizontalSeparator = ({
  enabled = false,
  color = "#e0e0e0",
  width = 1,
  topSpacing = 12,
  bottomSpacing = 12,
  radius = 0,
  colSpan = 2,
}) => {
  if (!enabled) return null;

  return (
    <tr>
      <td
        colSpan={colSpan}
        style={{
          paddingTop: `${topSpacing}px`,
          paddingBottom: `${bottomSpacing}px`,
        }}
      >
        <hr
          style={{
            border: "none",
            borderTop: `${width}px solid ${color}`,
            borderRadius: `${radius}px`,
            margin: 0,
            width: "100%",
          }}
        />
      </td>
    </tr>
  );
};

export default HorizontalSeparator;
