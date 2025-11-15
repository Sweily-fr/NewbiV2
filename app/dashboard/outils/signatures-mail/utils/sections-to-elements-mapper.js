/**
 * Mapper sectionsOrder vers un ordre d'affichage pour les composants React
 */

export function mapSectionsToDisplayOrder(sectionsOrder, signatureData) {
  if (!sectionsOrder || sectionsOrder.length === 0) {
    console.log("📋 [MAPPER] Pas de sectionsOrder, retour null");
    return null; // Utiliser l'ordre par défaut
  }

  console.log("📋 [MAPPER] Mapping de", sectionsOrder.length, "blocs");

  // Extraire tous les items dans l'ordre des blocs et colonnes
  const orderedItems = [];
  
  sectionsOrder.forEach((block, blockIndex) => {
    block.columns.forEach((column, colIndex) => {
      console.log(`  📦 [MAPPER] Bloc ${blockIndex + 1}, Colonne ${colIndex + 1}:`, column.items.length, "items");
      column.items.forEach((item, itemIndex) => {
        console.log(`    🔍 [MAPPER] Item ${itemIndex + 1}:`, {
          field: item.field,
          type: item.type,
          label: item.label,
          textContent: item.textContent?.substring(0, 30)
        });
        
        // Si l'item a un champ 'field', l'utiliser directement
        if (item.field) {
          console.log(`    ✅ [MAPPER] Item ${itemIndex + 1} mappé via field:`, item.field);
          orderedItems.push({
            field: item.field,
            type: item.type,
            id: item.field,
            label: item.label,
            visible: true,
          });
        } else {
          // Fallback: essayer de deviner le champ
          console.log(`    🔄 [MAPPER] Item ${itemIndex + 1} essai fallback...`);
          const fieldMapping = mapItemToField(item, signatureData);
          if (fieldMapping) {
            console.log(`    ✅ [MAPPER] Item ${itemIndex + 1} mappé via fallback:`, fieldMapping.field);
            orderedItems.push(fieldMapping);
          } else {
            console.log(`    ❌ [MAPPER] Item ${itemIndex + 1} non mappé:`, item.type, item.label);
          }
        }
      });
    });
  });

  console.log("📋 [MAPPER] Total mappé:", orderedItems.length, "items");
  return orderedItems;
}

function mapItemToField(item, signatureData) {
  const { type, label, textContent } = item;

  // Photo de profil
  if (type === "media" && (label === "Photo de profil" || label === "Image")) {
    if (signatureData.photo) {
      return { field: "photo", type: "media" };
    }
  }

  // Nom complet
  if (type === "personal" && signatureData.fullName && textContent.includes(signatureData.fullName)) {
    return { field: "fullName", type: "personal" };
  }

  // Poste
  if (type === "personal" && signatureData.position && textContent.includes(signatureData.position)) {
    return { field: "position", type: "personal" };
  }

  // Téléphone
  if (type === "contact" && signatureData.phone && textContent.includes(signatureData.phone)) {
    return { field: "phone", type: "contact" };
  }

  // Mobile
  if (type === "contact" && signatureData.mobile && textContent.includes(signatureData.mobile)) {
    return { field: "mobile", type: "contact" };
  }

  // Email
  if (type === "contact" && signatureData.email && textContent.includes(signatureData.email)) {
    return { field: "email", type: "contact" };
  }

  // Site web
  if (type === "contact" && signatureData.website && textContent.includes(signatureData.website)) {
    return { field: "website", type: "contact" };
  }

  // Adresse
  if (type === "contact" && signatureData.address && textContent.includes(signatureData.address.substring(0, 20))) {
    return { field: "address", type: "contact" };
  }

  // Logo
  if (type === "media" && label === "Logo entreprise") {
    if (signatureData.logo) {
      return { field: "logo", type: "media" };
    }
  }

  return null;
}
