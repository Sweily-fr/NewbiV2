import { ToggleGroup, ToggleGroupItem } from "@/src/components/ui/toggle-group";
import { AlignLeftIcon, AlignCenterIcon, AlignRightIcon } from "lucide-react";

/**
 * Composant de sélection d'alignement dynamique et personnalisable
 * @param {Object} props - Les propriétés du composant
 * @param {Array} props.items - Tableau d'objets contenant les éléments à afficher
 * @param {string} props.defaultValue - Valeur sélectionnée par défaut
 * @param {function} props.onValueChange - Fonction appelée lors du changement de valeur
 * @param {string} props.className - Classes CSS additionnelles
 * @param {string} props.size - Taille des icônes ("sm", "md", "lg")
 * @param {string} props.variant - Variante du ToggleGroup
 * @returns {JSX.Element} Composant de sélection d'alignement
 */
export default function AlignmentSelector({
  items = [
    { value: "left", icon: AlignLeftIcon },
    { value: "center", icon: AlignCenterIcon },
    { value: "right", icon: AlignRightIcon },
  ],
  defaultValue,
  onValueChange,
  className = "",
  size = "md",
  variant = "outline",
}) {
  // Définir les tailles d'icônes en fonction du paramètre size
  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const iconSize = iconSizes[size] || iconSizes.md;

  return (
    <ToggleGroup 
      variant={variant} 
      className={`inline-flex ${className}`} 
      type="single"
      defaultValue={defaultValue}
      onValueChange={onValueChange}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <ToggleGroupItem key={item.value} value={item.value} className={item.className}>
            {Icon && <Icon className={iconSize} />}
            {item.label && <span className="ml-1">{item.label}</span>}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
