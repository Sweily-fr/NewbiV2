/**
 * Widget Registry - Defines all available widget types for the modular signature editor
 * Each widget type has a unique ID, default props, and rendering configuration
 */

// Widget type constants
export const WIDGET_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  LOGO: 'logo',
  SEPARATOR: 'separator',
  SPACER: 'spacer',
  SOCIAL_ICONS: 'social-icons',
  CONTACT_INFO: 'contact-info',
  CONTACT_ROW: 'contact-row',
};

// Widget categories for the palette
export const WIDGET_CATEGORIES = {
  CONTENT: 'content',
  LAYOUT: 'layout',
  MEDIA: 'media',
};

// Default props for each widget type
export const WIDGET_DEFAULTS = {
  [WIDGET_TYPES.TEXT]: {
    content: 'Texte',
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Arial, sans-serif',
    color: '#171717',
    textAlign: 'left',
    lineHeight: 1.4,
    editable: true,
    field: null, // Can be linked to a field like 'fullName', 'position', etc.
  },
  [WIDGET_TYPES.IMAGE]: {
    src: null,
    width: 70,
    height: 70,
    borderRadius: '50%',
    objectFit: 'cover',
    field: 'photo', // Links to signatureData.photo
  },
  [WIDGET_TYPES.LOGO]: {
    src: null,
    width: 100,
    height: 'auto',
    maxHeight: 50,
    objectFit: 'contain',
    field: 'logo', // Links to signatureData.logo
  },
  [WIDGET_TYPES.SEPARATOR]: {
    orientation: 'horizontal', // 'horizontal' or 'vertical'
    thickness: 1,
    color: '#e0e0e0',
    length: '100%', // Can be percentage or pixels
    borderRadius: 0,
  },
  [WIDGET_TYPES.SPACER]: {
    height: 16,
    width: '100%',
  },
  [WIDGET_TYPES.SOCIAL_ICONS]: {
    icons: ['facebook', 'linkedin', 'x'],
    size: 20,
    gap: 8,
    color: 'black', // 'black', 'blue', 'pink', etc.
    alignment: 'left', // 'left', 'center', 'right'
  },
  [WIDGET_TYPES.CONTACT_INFO]: {
    fields: ['phone', 'email', 'website'],
    showIcons: true,
    iconSize: 14,
    fontSize: 12,
    color: '#666666',
    gap: 4,
  },
  [WIDGET_TYPES.CONTACT_ROW]: {
    field: 'phone', // 'phone', 'mobile', 'email', 'website', 'address'
    showIcon: true,
    iconSize: 14,
    fontSize: 12,
    color: '#666666',
    prefix: '', // e.g., 'T.' for telephone
  },
};

// Widget palette configuration
export const WIDGET_PALETTE = [
  {
    type: WIDGET_TYPES.TEXT,
    category: WIDGET_CATEGORIES.CONTENT,
    label: 'Texte',
    icon: 'Type',
    description: 'Ajouter un bloc de texte',
  },
  {
    type: WIDGET_TYPES.IMAGE,
    category: WIDGET_CATEGORIES.MEDIA,
    label: 'Photo',
    icon: 'User',
    description: 'Photo de profil',
  },
  {
    type: WIDGET_TYPES.LOGO,
    category: WIDGET_CATEGORIES.MEDIA,
    label: 'Logo',
    icon: 'Building2',
    description: 'Logo entreprise',
  },
  {
    type: WIDGET_TYPES.SEPARATOR,
    category: WIDGET_CATEGORIES.LAYOUT,
    label: 'Séparateur',
    icon: 'Minus',
    description: 'Ligne de séparation',
  },
  {
    type: WIDGET_TYPES.SPACER,
    category: WIDGET_CATEGORIES.LAYOUT,
    label: 'Espace',
    icon: 'Space',
    description: 'Espace vide',
  },
  {
    type: WIDGET_TYPES.SOCIAL_ICONS,
    category: WIDGET_CATEGORIES.CONTENT,
    label: 'Réseaux sociaux',
    icon: 'Share2',
    description: 'Icônes réseaux sociaux',
  },
  {
    type: WIDGET_TYPES.CONTACT_ROW,
    category: WIDGET_CATEGORIES.CONTENT,
    label: 'Contact',
    icon: 'Phone',
    description: 'Ligne de contact',
  },
];

// Create a new widget instance with unique ID
export function createWidget(type, customProps = {}) {
  const defaults = WIDGET_DEFAULTS[type];
  if (!defaults) {
    console.error(`Unknown widget type: ${type}`);
    return null;
  }

  return {
    id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    props: {
      ...defaults,
      ...customProps,
    },
  };
}

// Predefined widget configurations for different fields
export const FIELD_WIDGETS = {
  fullName: {
    type: WIDGET_TYPES.TEXT,
    props: {
      field: 'fullName',
      fontSize: 16,
      fontWeight: '700',
      color: '#171717',
      editable: true,
    },
  },
  position: {
    type: WIDGET_TYPES.TEXT,
    props: {
      field: 'position',
      fontSize: 14,
      fontWeight: '400',
      color: '#666666',
      editable: true,
    },
  },
  company: {
    type: WIDGET_TYPES.TEXT,
    props: {
      field: 'companyName',
      fontSize: 14,
      fontWeight: '500',
      color: '#171717',
      editable: true,
    },
  },
  phone: {
    type: WIDGET_TYPES.CONTACT_ROW,
    props: {
      field: 'phone',
      showIcon: true,
      prefix: '',
    },
  },
  mobile: {
    type: WIDGET_TYPES.CONTACT_ROW,
    props: {
      field: 'mobile',
      showIcon: true,
      prefix: '',
    },
  },
  email: {
    type: WIDGET_TYPES.CONTACT_ROW,
    props: {
      field: 'email',
      showIcon: true,
      prefix: '',
    },
  },
  website: {
    type: WIDGET_TYPES.CONTACT_ROW,
    props: {
      field: 'website',
      showIcon: true,
      prefix: '',
    },
  },
  address: {
    type: WIDGET_TYPES.CONTACT_ROW,
    props: {
      field: 'address',
      showIcon: true,
      prefix: '',
    },
  },
};

// Template presets converted to widget configurations
export const TEMPLATE_WIDGET_PRESETS = {
  template1: {
    layout: 'horizontal',
    columns: [
      {
        id: 'left',
        width: 'auto',
        widgets: [
          createWidget(WIDGET_TYPES.LOGO, { field: 'logo' }),
          createWidget(WIDGET_TYPES.SOCIAL_ICONS, { alignment: 'center', size: 20 }),
        ],
      },
      {
        id: 'separator',
        width: 'auto',
        widgets: [
          createWidget(WIDGET_TYPES.SEPARATOR, { orientation: 'vertical', length: '70px' }),
        ],
      },
      {
        id: 'right',
        width: 'auto',
        widgets: [
          createWidget(WIDGET_TYPES.TEXT, { field: 'fullName', fontSize: 14, fontWeight: '700' }),
          createWidget(WIDGET_TYPES.TEXT, { field: 'position', fontSize: 12, color: '#666666' }),
          createWidget(WIDGET_TYPES.CONTACT_ROW, { field: 'phone', showIcon: false }),
          createWidget(WIDGET_TYPES.CONTACT_ROW, { field: 'website', showIcon: false }),
        ],
      },
    ],
  },
  template2: {
    layout: 'vertical',
    widgets: [
      createWidget(WIDGET_TYPES.LOGO, { field: 'logo' }),
      createWidget(WIDGET_TYPES.TEXT, { field: 'fullName', fontSize: 14, fontWeight: '700' }),
      createWidget(WIDGET_TYPES.TEXT, { field: 'position', fontSize: 12, color: '#5A50FF' }),
      createWidget(WIDGET_TYPES.CONTACT_ROW, { field: 'phone', showIcon: false }),
      createWidget(WIDGET_TYPES.CONTACT_ROW, { field: 'website', showIcon: false }),
      createWidget(WIDGET_TYPES.SOCIAL_ICONS, { alignment: 'left', size: 20 }),
    ],
  },
  template3: {
    layout: 'horizontal',
    columns: [
      {
        id: 'left',
        width: 'auto',
        widgets: [
          createWidget(WIDGET_TYPES.LOGO, { field: 'logo' }),
          createWidget(WIDGET_TYPES.TEXT, { field: 'fullName', fontSize: 14, fontWeight: '700' }),
          createWidget(WIDGET_TYPES.TEXT, { field: 'position', fontSize: 12, color: '#5A50FF' }),
          createWidget(WIDGET_TYPES.CONTACT_ROW, { field: 'phone', showIcon: false, prefix: 'T.' }),
          createWidget(WIDGET_TYPES.CONTACT_ROW, { field: 'website', showIcon: false }),
        ],
      },
      {
        id: 'right',
        width: 'auto',
        widgets: [
          createWidget(WIDGET_TYPES.IMAGE, { field: 'photo', width: 60, height: 60 }),
          createWidget(WIDGET_TYPES.SOCIAL_ICONS, { alignment: 'center', size: 16 }),
        ],
      },
    ],
  },
};
