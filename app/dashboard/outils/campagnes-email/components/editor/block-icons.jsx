import {
  Heading1,
  Image,
  LayoutPanelLeft,
  MoveVertical,
  Pilcrow,
  RectangleHorizontal,
  SeparatorHorizontal,
  Share2,
} from "lucide-react";

/** Icône de chaque type de bloc (palette, panneau de réglages). */
export const BLOCK_ICONS = {
  heading: Heading1,
  text: Pilcrow,
  button: RectangleHorizontal,
  image: Image,
  imageText: LayoutPanelLeft,
  divider: SeparatorHorizontal,
  spacer: MoveVertical,
  social: Share2,
};

/** Description courte de chaque bloc (infobulle de la palette). */
export const BLOCK_HINTS = {
  heading: "Un titre en gros caractères",
  text: "Un paragraphe, avec gras, liens et listes",
  button: "Un lien bien visible vers votre site",
  image: "Une photo ou une illustration",
  imageText: "Une image et un texte côte à côte",
  divider: "Une ligne pour séparer deux parties",
  spacer: "Un espace vide réglable",
  social: "Les liens vers vos réseaux",
};
