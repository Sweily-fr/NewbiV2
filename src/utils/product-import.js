/**
 * Parse un fichier CSV et retourne les données
 * @param {File} file - Fichier CSV
 * @returns {Promise<Array>} - Données parsées
 */
export async function parseCSV(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          reject(new Error("Le fichier CSV est vide ou ne contient pas de données."));
          return;
        }
        
        // Première ligne = en-têtes
        const headers = lines[0].split(';').map(h => h.trim().replace(/^"|"$/g, ''));
        
        // Mapper les en-têtes aux champs attendus
        const headerMap = {
          "Nom": "name",
          "Référence": "reference",
          "Catégorie": "category",
          "Prix unitaire HT (€)": "unitPrice",
          "Taux TVA (%)": "vatRate",
          "Unité": "unit",
          "Description": "description"
        };
        
        // Vérifier que les colonnes obligatoires sont présentes
        const requiredHeaders = ["Nom", "Prix unitaire HT (€)", "Taux TVA (%)", "Unité"];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
          reject(new Error(`Colonnes manquantes dans le fichier CSV : ${missingHeaders.join(", ")}`));
          return;
        }
        
        // Parser les lignes de données
        const products = [];
        const errors = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line.trim()) continue;
          
          // Parser la ligne en tenant compte des guillemets
          const values = parseCSVLine(line);
          
          if (values.length !== headers.length) {
            errors.push(`Ligne ${i + 1}: Nombre de colonnes incorrect (${values.length} au lieu de ${headers.length})`);
            continue;
          }
          
          const product = {};
          let hasError = false;
          
          headers.forEach((header, index) => {
            const fieldName = headerMap[header];
            if (fieldName) {
              const value = values[index].trim();
              
              // Validation et conversion
              if (fieldName === "name") {
                if (!value || value.length < 2) {
                  errors.push(`Ligne ${i + 1}: Le nom doit contenir au moins 2 caractères`);
                  hasError = true;
                  return;
                }
                product[fieldName] = value;
              } else if (fieldName === "unitPrice" || fieldName === "vatRate") {
                const numValue = parseFloat(value.replace(',', '.'));
                if (isNaN(numValue) || numValue < 0) {
                  errors.push(`Ligne ${i + 1}: ${header} doit être un nombre positif`);
                  hasError = true;
                  return;
                }
                product[fieldName] = numValue;
              } else if (fieldName === "unit") {
                if (!value) {
                  errors.push(`Ligne ${i + 1}: L'unité est obligatoire`);
                  hasError = true;
                  return;
                }
                product[fieldName] = value;
              } else {
                product[fieldName] = value;
              }
            }
          });
          
          if (!hasError) {
            products.push(product);
          }
        }
        
        if (errors.length > 0) {
          reject(new Error(`Erreurs de validation :\n${errors.join('\n')}`));
          return;
        }
        
        if (products.length === 0) {
          reject(new Error("Aucun produit valide trouvé dans le fichier."));
          return;
        }
        
        resolve(products);
      } catch (error) {
        reject(new Error(`Erreur lors du parsing du CSV : ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Erreur lors de la lecture du fichier."));
    };
    
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Parse une ligne CSV en tenant compte des guillemets
 * @param {String} line - Ligne CSV
 * @returns {Array} - Valeurs parsées
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Double quote = escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ';' && !inQuotes) {
      // Separator outside quotes
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last value
  values.push(current);
  
  return values.map(v => v.trim().replace(/^"|"$/g, ''));
}

/**
 * Parse un fichier Excel (HTML table) et retourne les données
 * @param {File} file - Fichier Excel
 * @returns {Promise<Array>} - Données parsées
 */
export async function parseExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        
        // Créer un parser DOM
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        
        // Trouver le tableau
        const table = doc.querySelector('table');
        if (!table) {
          reject(new Error("Aucun tableau trouvé dans le fichier Excel."));
          return;
        }
        
        // Extraire les en-têtes
        const headerRow = table.querySelector('thead tr') || table.querySelector('tr');
        if (!headerRow) {
          reject(new Error("Aucune ligne d'en-tête trouvée dans le tableau."));
          return;
        }
        
        const headers = Array.from(headerRow.querySelectorAll('th, td'))
          .map(cell => cell.textContent.trim());
        
        // Mapper les en-têtes aux champs attendus
        const headerMap = {
          "Nom": "name",
          "Référence": "reference",
          "Catégorie": "category",
          "Prix unitaire HT (€)": "unitPrice",
          "Taux TVA (%)": "vatRate",
          "Unité": "unit",
          "Description": "description"
        };
        
        // Vérifier que les colonnes obligatoires sont présentes
        const requiredHeaders = ["Nom", "Prix unitaire HT (€)", "Taux TVA (%)", "Unité"];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
          reject(new Error(`Colonnes manquantes dans le fichier Excel : ${missingHeaders.join(", ")}`));
          return;
        }
        
        // Extraire les lignes de données
        const tbody = table.querySelector('tbody') || table;
        const dataRows = Array.from(tbody.querySelectorAll('tr')).slice(
          table.querySelector('thead') ? 0 : 1
        );
        
        const products = [];
        const errors = [];
        
        dataRows.forEach((row, index) => {
          const cells = Array.from(row.querySelectorAll('td'));
          if (cells.length === 0) return;
          
          const product = {};
          let hasError = false;
          
          headers.forEach((header, cellIndex) => {
            const fieldName = headerMap[header];
            if (fieldName && cells[cellIndex]) {
              const value = cells[cellIndex].textContent.trim();
              
              // Validation et conversion
              if (fieldName === "name") {
                if (!value || value.length < 2) {
                  errors.push(`Ligne ${index + 2}: Le nom doit contenir au moins 2 caractères`);
                  hasError = true;
                  return;
                }
                product[fieldName] = value;
              } else if (fieldName === "unitPrice" || fieldName === "vatRate") {
                const numValue = parseFloat(value.replace(',', '.'));
                if (isNaN(numValue) || numValue < 0) {
                  errors.push(`Ligne ${index + 2}: ${header} doit être un nombre positif`);
                  hasError = true;
                  return;
                }
                product[fieldName] = numValue;
              } else if (fieldName === "unit") {
                if (!value) {
                  errors.push(`Ligne ${index + 2}: L'unité est obligatoire`);
                  hasError = true;
                  return;
                }
                product[fieldName] = value;
              } else {
                product[fieldName] = value;
              }
            }
          });
          
          if (!hasError && Object.keys(product).length > 0) {
            products.push(product);
          }
        });
        
        if (errors.length > 0) {
          reject(new Error(`Erreurs de validation :\n${errors.join('\n')}`));
          return;
        }
        
        if (products.length === 0) {
          reject(new Error("Aucun produit valide trouvé dans le fichier."));
          return;
        }
        
        resolve(products);
      } catch (error) {
        reject(new Error(`Erreur lors du parsing du fichier Excel : ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Erreur lors de la lecture du fichier."));
    };
    
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Valide un fichier avant l'import
 * @param {File} file - Fichier à valider
 * @returns {Object} - Résultat de la validation
 */
export function validateFile(file) {
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!file) {
    return { valid: false, error: "Aucun fichier sélectionné." };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: "Le fichier est trop volumineux (max 5MB)." };
  }
  
  const extension = file.name.split('.').pop().toLowerCase();
  if (!['csv', 'xls', 'xlsx'].includes(extension)) {
    return { valid: false, error: "Format de fichier non supporté. Utilisez CSV ou Excel." };
  }
  
  return { valid: true };
}
