/**
 * Block Registry - Unified Container Architecture
 *
 * CONCEPT:
 * - Container: Universal building block that can contain elements OR other containers
 * - Elements: The actual visual widgets (logo, photo, separator, text, etc.)
 * - A container can have: elements (leaf), children (branch), or both
 * - Layout property controls direction: 'horizontal' or 'vertical'
 *
 * HIERARCHY EXAMPLE (Template 1):
 * Container (Signature - root)
 * ├── Container (Ligne principale) - layout: horizontal
 * │   ├── Container (Logo + Réseaux) - elements: [logo, social]
 * │   ├── Container (Séparateur) - elements: [separator]
 * │   └── Container (Nom + Poste) - elements: [name, position]
 * └── Container (Coordonnées) - elements: [phone, website]
 */

// Element types - the actual visual widgets
export const ELEMENT_TYPES = {
  PHOTO: 'photo',
  NAME: 'name',
  POSITION: 'position',
  COMPANY: 'company',
  PHONE: 'phone',
  MOBILE: 'mobile',
  EMAIL: 'email',
  WEBSITE: 'website',
  ADDRESS: 'address',
  SOCIAL_ICONS: 'social-icons',
  LOGO: 'logo',
  TEXT: 'text',
  SEPARATOR_LINE: 'separator-line',
  SPACER: 'spacer',
};

// Default props for each element type
export const ELEMENT_DEFAULTS = {
  [ELEMENT_TYPES.PHOTO]: { width: 60, height: 60, borderRadius: '50%' },
  [ELEMENT_TYPES.NAME]: { fontSize: 14, fontWeight: '700', color: '#171717' },
  [ELEMENT_TYPES.POSITION]: { fontSize: 12, fontWeight: '400', color: '#666666' },
  [ELEMENT_TYPES.COMPANY]: { fontSize: 12, fontWeight: '500', color: '#171717' },
  [ELEMENT_TYPES.PHONE]: { showIcon: true, fontSize: 12, color: '#666666' },
  [ELEMENT_TYPES.MOBILE]: { showIcon: true, fontSize: 12, color: '#666666' },
  [ELEMENT_TYPES.EMAIL]: { showIcon: true, fontSize: 12, color: '#666666' },
  [ELEMENT_TYPES.WEBSITE]: { showIcon: true, fontSize: 12, color: '#666666' },
  [ELEMENT_TYPES.ADDRESS]: { showIcon: true, fontSize: 12, color: '#666666' },
  [ELEMENT_TYPES.SOCIAL_ICONS]: { size: 20, gap: 6, color: 'black', alignment: 'left' },
  [ELEMENT_TYPES.LOGO]: { maxWidth: 100, maxHeight: 32 },
  [ELEMENT_TYPES.TEXT]: { content: 'Texte', fontSize: 12, fontWeight: '400', color: '#171717' },
  [ELEMENT_TYPES.SEPARATOR_LINE]: { orientation: 'horizontal', thickness: 1, color: '#e0e0e0', width: '100%' },
  [ELEMENT_TYPES.SPACER]: { height: 8 },
};

// Widget palette - what users can drag & drop
export const WIDGET_PALETTE = [
  {
    id: 'widget-container',
    label: 'Conteneur',
    description: 'Conteneur vide pour grouper',
    icon: 'LayoutGrid',
    isContainer: true,
    layout: 'vertical',
  },
  {
    id: 'widget-logo',
    label: 'Logo',
    description: "Logo de l'entreprise",
    icon: 'Building2',
    elements: [ELEMENT_TYPES.LOGO],
    layout: 'vertical',
  },
  {
    id: 'widget-photo',
    label: 'Photo',
    description: 'Photo de profil',
    icon: 'User',
    elements: [ELEMENT_TYPES.PHOTO],
    layout: 'vertical',
  },
  {
    id: 'widget-name-position',
    label: 'Nom + Poste',
    description: 'Nom et poste',
    icon: 'UserCircle',
    elements: [ELEMENT_TYPES.NAME, ELEMENT_TYPES.POSITION],
    layout: 'vertical',
  },
  {
    id: 'widget-contact',
    label: 'Coordonnées',
    description: 'Téléphone, email, site',
    icon: 'Phone',
    elements: [ELEMENT_TYPES.PHONE, ELEMENT_TYPES.EMAIL, ELEMENT_TYPES.WEBSITE, ELEMENT_TYPES.ADDRESS],
    layout: 'vertical',
  },
  {
    id: 'widget-social',
    label: 'Réseaux sociaux',
    description: 'Icônes sociales',
    icon: 'Share2',
    elements: [ELEMENT_TYPES.SOCIAL_ICONS],
    layout: 'horizontal',
  },
  {
    id: 'widget-separator',
    label: 'Séparateur',
    description: 'Ligne de séparation',
    icon: 'Minus',
    elements: [ELEMENT_TYPES.SEPARATOR_LINE],
    layout: 'vertical',
  },
  {
    id: 'widget-spacer',
    label: 'Espace',
    description: 'Espace vide',
    icon: 'Space',
    elements: [ELEMENT_TYPES.SPACER],
    layout: 'vertical',
  },
  {
    id: 'widget-text',
    label: 'Texte',
    description: 'Texte personnalisé',
    icon: 'Type',
    elements: [ELEMENT_TYPES.TEXT],
    layout: 'vertical',
  },
];

/**
 * Generate unique ID for containers
 */
function generateId(prefix = 'container') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new element with unique ID
 */
export function createElement(elementType, customProps = {}) {
  const elementId = `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const defaultProps = ELEMENT_DEFAULTS[elementType] || {};

  return {
    id: elementId,
    type: elementType,
    props: {
      ...defaultProps,
      ...customProps,
    },
  };
}

/**
 * Create a container - the UNIFIED building block
 * Can contain elements (leaf) or children containers (branch) or both
 *
 * Style properties:
 * - layout: 'vertical' | 'horizontal' - direction of elements
 * - alignment: 'start' | 'center' | 'end' - alignment of elements
 * - padding: number - padding in pixels (0-32)
 * - gap: number - gap between elements in pixels (0-16)
 */
export function createContainer(config = {}) {
  const {
    elements = [],
    children = [],
    layout = 'vertical',
    label = 'Conteneur',
    alignment = 'start',
    padding = 12,
    gap = 12,
  } = config;

  const containerId = generateId('container');

  // Create elements with unique IDs
  const containerElements = elements.map((elementConfig) => {
    if (typeof elementConfig === 'string') {
      return createElement(elementConfig);
    } else if (elementConfig.type) {
      return createElement(elementConfig.type, elementConfig.props || {});
    }
    return elementConfig;
  });

  const container = {
    id: containerId,
    type: 'container',
    label,
    layout,
    alignment,
    padding,
    gap,
  };

  // Only add elements array if there are elements
  if (containerElements.length > 0) {
    container.elements = containerElements;
  }

  // Only add children array if there are children
  if (children.length > 0) {
    container.children = children;
  }

  return container;
}

/**
 * Create a container from a widget definition
 * Used when dropping a widget from the palette
 */
export function createContainerFromWidget(widgetId, customProps = {}) {
  const widget = WIDGET_PALETTE.find(w => w.id === widgetId);
  if (!widget) {
    console.error(`Unknown widget: ${widgetId}`);
    return null;
  }

  // If it's an empty container widget
  if (widget.isContainer) {
    return createContainer({
      layout: customProps.layout || widget.layout,
      label: customProps.label || 'Nouveau conteneur',
      children: [],
    });
  }

  // Build elements config from widget
  const elementsConfig = widget.elements.map(elementType => ({
    type: elementType,
    props: customProps.elementProps?.[elementType] || {},
  }));

  return createContainer({
    elements: elementsConfig,
    layout: customProps.layout || widget.layout,
    label: widget.label,
  });
}

/**
 * Create a root container for the signature
 * This wraps all content and is selectable/configurable
 */
export function createRootContainer(children = [], label = 'Signature', layout = 'vertical') {
  return {
    id: generateId('root'),
    type: 'container',
    label,
    layout,
    children,
    isRoot: true, // Marker to identify root container
  };
}

/**
 * Get default signature structure for a template
 * Returns a single root container with nested structure
 */
export function getDefaultBlocksForTemplate(templateId) {
  switch (templateId) {
    case 'template1':
      // Template 1: [Logo + Social] | Separator | [Name + Position] horizontally, then Contact below
      return createRootContainer([
        // First child: horizontal row with 3 containers
        createContainer({
          label: 'Ligne principale',
          layout: 'horizontal',
          children: [
            createContainer({
              label: 'Logo + Réseaux',
              layout: 'vertical',
              elements: [
                { type: ELEMENT_TYPES.LOGO, props: { maxHeight: 32 } },
                { type: ELEMENT_TYPES.SOCIAL_ICONS, props: { size: 20, alignment: 'center' } },
              ],
            }),
            createContainer({
              label: 'Séparateur',
              layout: 'vertical',
              elements: [
                { type: ELEMENT_TYPES.SEPARATOR_LINE, props: { orientation: 'vertical', thickness: 1, color: '#e0e0e0' } },
              ],
            }),
            createContainer({
              label: 'Nom + Poste',
              layout: 'vertical',
              elements: [
                { type: ELEMENT_TYPES.NAME, props: { fontSize: 14, fontWeight: '700' } },
                { type: ELEMENT_TYPES.POSITION, props: { fontSize: 12, color: '#666666' } },
              ],
            }),
          ],
        }),
        // Second child: contact container
        createContainer({
          label: 'Coordonnées',
          layout: 'vertical',
          elements: [
            { type: ELEMENT_TYPES.PHONE, props: { showIcon: false, fontSize: 11 } },
            { type: ELEMENT_TYPES.WEBSITE, props: { showIcon: false, fontSize: 11 } },
          ],
        }),
      ], 'Signature');

    case 'template2':
      // Template 2: Logo > Name+Position (horizontal) > Contact (horizontal) > Social - all vertical
      return createRootContainer([
        createContainer({
          label: 'Logo',
          layout: 'vertical',
          elements: [
            { type: ELEMENT_TYPES.LOGO, props: { maxHeight: 32 } },
          ],
        }),
        createContainer({
          label: 'Nom + Poste',
          layout: 'horizontal',
          elements: [
            { type: ELEMENT_TYPES.NAME, props: { fontSize: 14, fontWeight: '700', color: '#171717' } },
            { type: ELEMENT_TYPES.POSITION, props: { fontSize: 12, fontWeight: '400', color: '#5A50FF' } },
          ],
        }),
        createContainer({
          label: 'Coordonnées',
          layout: 'horizontal',
          elements: [
            { type: ELEMENT_TYPES.PHONE, props: { showIcon: false, fontSize: 11, color: '#666666' } },
            { type: ELEMENT_TYPES.WEBSITE, props: { showIcon: false, fontSize: 11, color: '#666666' } },
          ],
        }),
        createContainer({
          label: 'Réseaux sociaux',
          layout: 'horizontal',
          elements: [
            { type: ELEMENT_TYPES.SOCIAL_ICONS, props: { size: 20, gap: 6, alignment: 'left' } },
          ],
        }),
      ], 'Signature');

    case 'template3':
      // Template 3: Two columns - [Logo + Name + Position + Contact] | [Photo + Social]
      return createRootContainer([
        createContainer({
          label: 'Colonnes',
          layout: 'horizontal',
          children: [
            createContainer({
              label: 'Infos',
              layout: 'vertical',
              elements: [
                { type: ELEMENT_TYPES.LOGO, props: { maxHeight: 32 } },
                { type: ELEMENT_TYPES.NAME, props: { fontSize: 14, fontWeight: '700', color: '#171717' } },
                { type: ELEMENT_TYPES.POSITION, props: { fontSize: 12, fontWeight: '400', color: '#5A50FF' } },
                { type: ELEMENT_TYPES.PHONE, props: { showIcon: false, fontSize: 11, color: '#666666' } },
                { type: ELEMENT_TYPES.WEBSITE, props: { showIcon: false, fontSize: 11, color: '#666666' } },
              ],
            }),
            createContainer({
              label: 'Photo + Réseaux',
              layout: 'vertical',
              elements: [
                { type: ELEMENT_TYPES.PHOTO, props: { width: 60, height: 60, borderRadius: '50%' } },
                { type: ELEMENT_TYPES.SOCIAL_ICONS, props: { size: 16, gap: 6, alignment: 'center' } },
              ],
            }),
          ],
        }),
      ], 'Signature');

    case 'template4':
      // Template 4: [Photo + Social] | Separator | [Name + Position] then Contact, then Logo
      return createRootContainer([
        createContainer({
          label: 'Ligne principale',
          layout: 'horizontal',
          children: [
            createContainer({
              label: 'Photo + Réseaux',
              layout: 'vertical',
              elements: [
                { type: ELEMENT_TYPES.PHOTO, props: { width: 60, height: 60 } },
                { type: ELEMENT_TYPES.SOCIAL_ICONS, props: { size: 16, alignment: 'center' } },
              ],
            }),
            createContainer({
              label: 'Séparateur',
              layout: 'vertical',
              elements: [
                { type: ELEMENT_TYPES.SEPARATOR_LINE, props: { orientation: 'vertical', thickness: 1, color: '#e0e0e0' } },
              ],
            }),
            createContainer({
              label: 'Nom + Poste',
              layout: 'vertical',
              elements: [
                { type: ELEMENT_TYPES.NAME, props: { fontSize: 14, fontWeight: '700' } },
                { type: ELEMENT_TYPES.POSITION, props: { fontSize: 12, color: '#5A50FF' } },
              ],
            }),
          ],
        }),
        createContainer({
          label: 'Coordonnées',
          layout: 'vertical',
          elements: [
            { type: ELEMENT_TYPES.PHONE, props: { showIcon: false, fontSize: 11 } },
          ],
        }),
        createContainer({
          label: 'Logo',
          layout: 'vertical',
          elements: [
            { type: ELEMENT_TYPES.LOGO, props: { maxHeight: 20 } },
          ],
        }),
      ], 'Signature');

    case 'template5':
      // Template 5: [Photo + Name/Position] > Separator > [Logo + Social]
      return createRootContainer([
        createContainer({
          label: 'En-tête',
          layout: 'horizontal',
          children: [
            createContainer({
              label: 'Photo',
              layout: 'vertical',
              elements: [
                { type: ELEMENT_TYPES.PHOTO, props: { width: 50, height: 50 } },
              ],
            }),
            createContainer({
              label: 'Nom + Poste',
              layout: 'vertical',
              elements: [
                { type: ELEMENT_TYPES.NAME, props: { fontSize: 14, fontWeight: '700' } },
                { type: ELEMENT_TYPES.POSITION, props: { fontSize: 12, color: '#5A50FF' } },
              ],
            }),
          ],
        }),
        createContainer({
          label: 'Séparateur',
          layout: 'vertical',
          elements: [
            { type: ELEMENT_TYPES.SEPARATOR_LINE, props: { orientation: 'horizontal', thickness: 1, color: '#e0e0e0', width: '100%' } },
          ],
        }),
        createContainer({
          label: 'Pied',
          layout: 'horizontal',
          children: [
            createContainer({
              label: 'Logo',
              layout: 'vertical',
              elements: [
                { type: ELEMENT_TYPES.LOGO, props: { maxHeight: 25 } },
              ],
            }),
            createContainer({
              label: 'Réseaux sociaux',
              layout: 'horizontal',
              elements: [
                { type: ELEMENT_TYPES.SOCIAL_ICONS, props: { size: 18, alignment: 'right' } },
              ],
            }),
          ],
        }),
      ], 'Signature');

    case 'template6':
      // Template 6: Centered vertical - Logo > Name > Position > Contact > Social
      return createRootContainer([
        createContainer({
          label: 'Logo',
          layout: 'vertical',
          elements: [
            { type: ELEMENT_TYPES.LOGO, props: { maxHeight: 32 } },
          ],
        }),
        createContainer({
          label: 'Nom + Poste',
          layout: 'vertical',
          elements: [
            { type: ELEMENT_TYPES.NAME, props: { fontSize: 14, fontWeight: '700', color: '#5A50FF' } },
            { type: ELEMENT_TYPES.POSITION, props: { fontSize: 12, color: '#5A50FF' } },
          ],
        }),
        createContainer({
          label: 'Coordonnées',
          layout: 'vertical',
          elements: [
            { type: ELEMENT_TYPES.PHONE, props: { showIcon: false, fontSize: 11 } },
            { type: ELEMENT_TYPES.WEBSITE, props: { showIcon: false, fontSize: 11 } },
          ],
        }),
        createContainer({
          label: 'Réseaux sociaux',
          layout: 'horizontal',
          elements: [
            { type: ELEMENT_TYPES.SOCIAL_ICONS, props: { size: 20, alignment: 'center' } },
          ],
        }),
      ], 'Signature');

    default:
      // Default: Simple vertical layout
      return createRootContainer([
        createContainer({
          label: 'Logo',
          layout: 'vertical',
          elements: [{ type: ELEMENT_TYPES.LOGO }],
        }),
        createContainer({
          label: 'Nom + Poste',
          layout: 'vertical',
          elements: [
            { type: ELEMENT_TYPES.NAME },
            { type: ELEMENT_TYPES.POSITION },
          ],
        }),
        createContainer({
          label: 'Coordonnées',
          layout: 'vertical',
          elements: [
            { type: ELEMENT_TYPES.PHONE },
            { type: ELEMENT_TYPES.EMAIL },
            { type: ELEMENT_TYPES.WEBSITE },
          ],
        }),
        createContainer({
          label: 'Réseaux sociaux',
          layout: 'horizontal',
          elements: [{ type: ELEMENT_TYPES.SOCIAL_ICONS }],
        }),
      ], 'Signature');
  }
}

// ============================================
// UTILITY FUNCTIONS FOR RECURSIVE OPERATIONS
// ============================================

/**
 * Find a container by ID recursively
 */
export function findContainerById(container, containerId) {
  if (!container) return null;
  if (container.id === containerId) return container;

  if (container.children) {
    for (const child of container.children) {
      const found = findContainerById(child, containerId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Find parent container of a given container ID
 */
export function findParentContainer(root, containerId) {
  if (!root || !root.children) return null;

  for (const child of root.children) {
    if (child.id === containerId) return root;
    if (child.children) {
      const found = findParentContainer(child, containerId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Update a container recursively
 */
export function updateContainerById(container, containerId, updates) {
  if (!container) return container;

  if (container.id === containerId) {
    return { ...container, ...updates };
  }

  if (container.children) {
    return {
      ...container,
      children: container.children.map(child =>
        updateContainerById(child, containerId, updates)
      ),
    };
  }

  return container;
}

/**
 * Delete a container recursively
 */
export function deleteContainerById(container, containerId) {
  if (!container) return container;
  if (container.id === containerId) return null;

  if (container.children) {
    const newChildren = container.children
      .map(child => deleteContainerById(child, containerId))
      .filter(Boolean);

    return {
      ...container,
      children: newChildren,
    };
  }

  return container;
}

/**
 * Add a child container to a parent container
 */
export function addChildToContainer(root, parentId, newChild, position = 'end') {
  if (!root) return root;

  if (root.id === parentId) {
    const children = root.children || [];
    const newChildren = position === 'start'
      ? [newChild, ...children]
      : [...children, newChild];
    return { ...root, children: newChildren };
  }

  if (root.children) {
    return {
      ...root,
      children: root.children.map(child =>
        addChildToContainer(child, parentId, newChild, position)
      ),
    };
  }

  return root;
}

/**
 * Get depth level of a container (for UI indentation)
 */
export function getContainerDepth(root, containerId, depth = 0) {
  if (!root) return -1;
  if (root.id === containerId) return depth;

  if (root.children) {
    for (const child of root.children) {
      const found = getContainerDepth(child, containerId, depth + 1);
      if (found !== -1) return found;
    }
  }
  return -1;
}

// ============================================
// BACKWARD COMPATIBILITY
// ============================================

export const BLOCK_TYPES = {
  CONTAINER: 'container',
};

// Old createRow function - now creates a container with children
export function createRow(children = [], label = 'Ligne') {
  return createContainer({
    label,
    layout: 'horizontal',
    children,
  });
}

// Old createBlock function
export function createBlock(widgetIdOrType, customProps = {}) {
  const typeToWidgetMap = {
    'logo': 'widget-logo',
    'photo': 'widget-photo',
    'separator': 'widget-separator',
    'spacer': 'widget-spacer',
    'social': 'widget-social',
    'contact': 'widget-contact',
    'tagline': 'widget-text',
    'name-position': 'widget-name-position',
    'container': 'widget-container',
  };

  const widgetId = typeToWidgetMap[widgetIdOrType] || widgetIdOrType;
  return createContainerFromWidget(widgetId, customProps);
}

export const BLOCK_PALETTE = WIDGET_PALETTE;
