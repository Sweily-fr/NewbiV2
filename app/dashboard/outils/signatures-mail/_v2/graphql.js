import { gql } from "@apollo/client";
import { cleanSlots } from "./slots";

/**
 * Requêtes et mutations des signatures de mail v2.
 * Le HTML n'est jamais produit côté front : `render` et
 * `renderEmailSignatureV2` renvoient toujours le HTML du générateur unique
 * de l'API, identique pour l'aperçu, la copie et le téléchargement.
 */

/** Éléments de texte réglables un par un (clic dans l'aperçu). */
export const TEXT_ELEMENTS = [
  "name",
  "firstName",
  "lastName",
  "jobTitle",
  "company",
  "tagline",
  "contact",
  // Chaque ligne de coordonnées, par-dessus le style des coordonnées
  "phone",
  "mobile",
  "email",
  "website",
  "address",
  "cta",
  "disclaimer",
];

const TEXT_STYLE = "fontFamily fontSize color bold italic uppercase";
const ELEMENT_STYLES = TEXT_ELEMENTS.map((k) => `${k} { ${TEXT_STYLE} }`).join("\n");

/** Champs du style, communs aux signatures et aux modèles enregistrés. */
const STYLE_FIELDS = `
    fontFamily
    fontSize
    primaryColor
    textColor
    mutedColor
    photoShape
    photoSize
    logoWidth
    iconStyle
    iconColorMode
    iconColor
    iconSize
    showContactIcons
    separatorColor
    spacing
    align
    frame
    frameColor
    radius
    photoBorder
    photoBorderColor
    identityZone
    photoPosition
    photoValign
    photoColumn
    divider
    accent
    identityStyle
    titleStyle
    contactStyle
    socialPosition
    logoPosition
    footerStrip
    footerPair
    outside
    textOrder
    slots {
      header
      visual
      text
      side
      footer
      outside
    }
    visualSide
    visualFill
    headerPhoto
    headerFill
    nameLayout
    socialRows
    accentLength
    accentThickness
    dividerThickness
    dividerLength
    frameThickness
    frameWidth
    frameBarLength
    contactIconSize
    contactIconMode
    contactIconColor
    blocks
    columns
    rules
    dividerSpace
    elements {
      ${ELEMENT_STYLES}
    }
`;

export const SIGNATURE_V2_FIELDS = gql`
  fragment SignatureV2Fields on EmailSignatureV2 {
    id
    name
    isDefault
    templateId
    savedTemplateId
    identity {
      firstName
      lastName
      jobTitle
      department
      company
      tagline
    }
    contact {
      email
      phone
      mobile
      website
      address
    }
    social {
      network
      url
    }
    images {
      photo {
        url
        width
        height
      }
      logo {
        url
        width
        height
      }
      banner {
        url
        width
        height
      }
    }
    cta {
      enabled
      label
      url
      backgroundColor
      textColor
    }
    banner {
      enabled
      url
      alt
    }
    disclaimer {
      enabled
      text
    }
    style {
      ${STYLE_FIELDS}
    }
    memberUserId
    updatedAt
  }
`;

export const RENDER_FIELDS = gql`
  fragment RenderV2Fields on SignatureRenderV2 {
    html
    previewHtml
    text
    chars
    warnings
    lines {
      accentLength
      accentThickness
      dividerThickness
      frameThickness
      photoMax
      iconMax
    }
    elements {
      ${ELEMENT_STYLES}
    }
  }
`;

export const SIGNATURES_V2 = gql`
  query SignaturesV2 {
    emailSignaturesV2 {
      ...SignatureV2Fields
      render {
        html
      }
    }
  }
  ${SIGNATURE_V2_FIELDS}
`;

export const SIGNATURE_V2 = gql`
  query SignatureV2($id: ID!) {
    emailSignatureV2(id: $id) {
      ...SignatureV2Fields
      render {
        ...RenderV2Fields
      }
    }
  }
  ${SIGNATURE_V2_FIELDS}
  ${RENDER_FIELDS}
`;

export const SIGNATURE_CATALOG_V2 = gql`
  query SignatureCatalogV2 {
    signatureCatalogV2 {
      templates {
        id
        name
        description
        inGallery
        supports {
          photo
          logo
          align
          frame
        }
        defaults
        preset {
          fontFamily
          fontSize
          photoShape
          photoSize
          logoWidth
          iconStyle
          iconSize
          spacing
          showContactIcons
        }
      }
      networks {
        id
        label
        brandColor
        host
      }
      fonts {
        id
        label
        stack
      }
      gmailMaxChars
    }
  }
`;

export const RENDER_SIGNATURE_V2 = gql`
  query RenderSignatureV2($id: ID, $input: EmailSignatureV2Input!) {
    renderEmailSignatureV2(id: $id, input: $input) {
      ...RenderV2Fields
    }
  }
  ${RENDER_FIELDS}
`;

export const RENDER_TEMPLATE_V2 = gql`
  query RenderTemplateV2(
    $templateId: String!
    $style: SignatureStyleV2Input
    $id: ID
  ) {
    renderSignatureTemplateV2(templateId: $templateId, style: $style, id: $id) {
      html
    }
  }
`;

/**
 * Vignette d'un modèle enregistré : la signature en cours (images comprises
 * grâce à `id`) avec le style du modèle.
 */
export const RENDER_SAVED_TEMPLATE_V2 = gql`
  query RenderSavedTemplateV2($id: ID, $input: EmailSignatureV2Input!) {
    renderEmailSignatureV2(id: $id, input: $input) {
      html
    }
  }
`;

/** Modèles enregistrés de l'espace (« Vos modèles »). */
export const SIGNATURE_TEMPLATES_V2 = gql`
  query SignatureTemplatesV2 {
    emailSignatureTemplatesV2 {
      id
      name
      templateId
      mine
      canDelete
      style {
        ${STYLE_FIELDS}
      }
    }
  }
`;

export const SAVE_SIGNATURE_TEMPLATE_V2 = gql`
  mutation SaveSignatureTemplateV2($input: SignatureSavedTemplateV2Input!) {
    saveEmailSignatureTemplateV2(input: $input) {
      id
      name
    }
  }
`;

export const DELETE_SIGNATURE_TEMPLATE_V2 = gql`
  mutation DeleteSignatureTemplateV2($id: ID!) {
    deleteEmailSignatureTemplateV2(id: $id)
  }
`;

export const SEND_SIGNATURE_V2_TEST = gql`
  mutation SendSignatureV2Test($id: ID!) {
    sendEmailSignatureV2Test(id: $id)
  }
`;

export const SIGNATURE_MEMBERS_V2 = gql`
  query SignatureMembersV2 {
    signatureMembersV2 {
      userId
      name
      email
      image
      isMe
    }
  }
`;

export const CREATE_SIGNATURE_V2 = gql`
  mutation CreateSignatureV2($input: EmailSignatureV2Input!, $memberUserId: ID) {
    createEmailSignatureV2(input: $input, memberUserId: $memberUserId) {
      ...SignatureV2Fields
    }
  }
  ${SIGNATURE_V2_FIELDS}
`;

export const UPDATE_SIGNATURE_V2 = gql`
  mutation UpdateSignatureV2($id: ID!, $input: EmailSignatureV2Input!) {
    updateEmailSignatureV2(id: $id, input: $input) {
      ...SignatureV2Fields
    }
  }
  ${SIGNATURE_V2_FIELDS}
`;

export const APPLY_MEMBER_SIGNATURE_V2 = gql`
  mutation ApplyMemberSignatureV2($id: ID!, $memberUserId: ID!) {
    applyMemberToEmailSignatureV2(id: $id, memberUserId: $memberUserId) {
      ...SignatureV2Fields
    }
  }
  ${SIGNATURE_V2_FIELDS}
`;

export const DELETE_SIGNATURE_V2 = gql`
  mutation DeleteSignatureV2($id: ID!) {
    deleteEmailSignatureV2(id: $id)
  }
`;

export const DUPLICATE_SIGNATURE_V2 = gql`
  mutation DuplicateSignatureV2($id: ID!) {
    duplicateEmailSignatureV2(id: $id) {
      ...SignatureV2Fields
    }
  }
  ${SIGNATURE_V2_FIELDS}
`;

export const SET_DEFAULT_SIGNATURE_V2 = gql`
  mutation SetDefaultSignatureV2($id: ID!) {
    setDefaultEmailSignatureV2(id: $id) {
      id
      isDefault
    }
  }
`;

export const UPLOAD_SIGNATURE_V2_IMAGE = gql`
  mutation UploadSignatureV2Image($id: ID!, $kind: SignatureImageKindV2!, $file: Upload!) {
    uploadEmailSignatureV2Image(id: $id, kind: $kind, file: $file) {
      ...SignatureV2Fields
    }
  }
  ${SIGNATURE_V2_FIELDS}
`;

export const REMOVE_SIGNATURE_V2_IMAGE = gql`
  mutation RemoveSignatureV2Image($id: ID!, $kind: SignatureImageKindV2!) {
    removeEmailSignatureV2Image(id: $id, kind: $kind) {
      ...SignatureV2Fields
    }
  }
  ${SIGNATURE_V2_FIELDS}
`;

const OMIT = new Set(["__typename"]);
const strip = (obj) =>
  Object.fromEntries(
    Object.entries(obj || {}).filter(([k, v]) => !OMIT.has(k) && v !== undefined),
  );

/** Réglages par élément sans les champs GraphQL techniques ni les vides. */
export function cleanElements(elements) {
  const out = {};
  for (const key of TEXT_ELEMENTS) {
    const e = strip(elements?.[key]);
    const kept = Object.fromEntries(Object.entries(e).filter(([, v]) => v !== null));
    if (Object.keys(kept).length > 0) out[key] = kept;
  }
  return out;
}

/** Style (forme du fragment) en entrée de mutation. */
export function toStyleInput(style) {
  return {
    ...strip(style),
    elements: cleanElements(style?.elements),
    ...(style?.slots ? { slots: cleanSlots(style.slots) } : {}),
  };
}

/** Convertit une signature (forme du fragment) en entrée de mutation. */
export function toInput(sig) {
  if (!sig) return {};
  return {
    name: sig.name,
    templateId: sig.templateId,
    // Modèle d'équipe appliqué (null : le modèle intégré)
    savedTemplateId: sig.savedTemplateId ?? null,
    identity: strip(sig.identity),
    contact: strip(sig.contact),
    social: (sig.social || []).map((s) => ({ network: s.network, url: s.url })),
    cta: strip(sig.cta),
    banner: strip(sig.banner),
    disclaimer: strip(sig.disclaimer),
    style: toStyleInput(sig.style),
  };
}
