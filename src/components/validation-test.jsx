"use client";

import { useState } from "react";
import { validateField, VALIDATION_PATTERNS } from "@/src/lib/validation";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

/**
 * Composant de test pour valider la synchronisation des regex frontend/backend
 * À utiliser uniquement en développement pour tester les validations
 */
export default function ValidationTest() {
  const [testValues, setTestValues] = useState({
    street: "",
    city: "",
    postalCode: "",
    country: "",
    siret: "",
    vatNumber: "",
    email: "",
    phone: "",
  });

  const [validationResults, setValidationResults] = useState({});

  const handleInputChange = (field, value) => {
    setTestValues(prev => ({ ...prev, [field]: value }));
    
    // Valider en temps réel
    const validation = validateField(value, field, false);
    setValidationResults(prev => ({
      ...prev,
      [field]: validation
    }));
  };

  const testFields = [
    { key: "street", label: "Adresse (3-100 car.)", placeholder: "123 Rue de la Paix" },
    { key: "city", label: "Ville (2-50 car.)", placeholder: "Paris" },
    { key: "postalCode", label: "Code postal (FR)", placeholder: "75001" },
    { key: "country", label: "Pays (2-50 car.)", placeholder: "France" },
    { key: "siret", label: "SIRET (14 chiffres)", placeholder: "12345678901234" },
    { key: "vatNumber", label: "TVA (EU)", placeholder: "FR12345678901" },
    { key: "email", label: "Email", placeholder: "test@example.com" },
    { key: "phone", label: "Téléphone (FR)", placeholder: "+33 6 12 34 56 78" },
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Test de Validation - Synchronisation Frontend/Backend</CardTitle>
        <p className="text-sm text-muted-foreground">
          Testez les regex synchronisées avec le backend (validators.js)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testFields.map(({ key, label, placeholder }) => {
            const validation = validationResults[key];
            const pattern = VALIDATION_PATTERNS[key];
            
            return (
              <div key={key} className="space-y-2">
                <Label className="text-sm font-medium">{label}</Label>
                <Input
                  placeholder={placeholder}
                  value={testValues[key]}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  className={validation && !validation.isValid ? "border-red-500" : ""}
                />
                
                {/* Affichage du pattern regex */}
                <div className="text-xs text-muted-foreground font-mono bg-gray-50 p-2 rounded">
                  {pattern?.pattern.toString()}
                </div>
                
                {/* Résultat de validation */}
                {validation && (
                  <div className={`text-xs p-2 rounded ${
                    validation.isValid 
                      ? "text-green-600 bg-green-50"
                      : "text-red-700 bg-red-50"
                  }`}>
                    {validation.isValid ? "✅ Valide" : `❌ ${validation.message}`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Changements appliqués :</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Adresse :</strong> 3-100 caractères (au lieu de 2-200)</li>
            <li>• <strong>Ville :</strong> 2-50 caractères (au lieu de 2-100)</li>
            <li>• <strong>Code postal :</strong> Format français strict (01000-98999)</li>
            <li>• <strong>Pays :</strong> Support des points et caractères étendus</li>
            <li>• <strong>SIRET :</strong> \d au lieu de [0-9] pour cohérence</li>
            <li>• <strong>TVA :</strong> 2-12 caractères (au lieu de 2-13)</li>
          </ul>
        </div>
        
        <div className="mt-4 p-4 bg-red-50 rounded-lg">
          <h3 className="font-medium text-red-900 mb-2">Tests d'exemples invalides :</h3>
          <div className="text-sm text-red-800 space-y-1">
            <div><strong>Adresse :</strong> "7/9 jojo" → ❌ (caractères / interdits)</div>
            <div><strong>Ville :</strong> "P@ris" → ❌ (caractères @ interdits)</div>
            <div><strong>Code postal :</strong> "00001" → ❌ (ne commence pas par 01-98)</div>
            <div><strong>Code postal :</strong> "99001" → ❌ (ne commence pas par 01-98)</div>
            <div><strong>SIRET :</strong> "1234567890123A" → ❌ (contient une lettre)</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
