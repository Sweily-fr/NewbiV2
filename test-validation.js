// Test rapide de validation pour vérifier le comportement
import { validateField, VALIDATION_PATTERNS } from './src/lib/validation.js';

console.log('🧪 Test de validation des adresses');
console.log('================================');

const testCases = [
  { field: 'street', value: '7/9 jojo', expected: false },
  { field: 'street', value: '123 Rue de la Paix', expected: true },
  { field: 'street', value: '7 bis, avenue des Champs', expected: true },
  { field: 'city', value: 'P@ris', expected: false },
  { field: 'city', value: 'Paris', expected: true },
  { field: 'city', value: 'Saint-Étienne', expected: true },
  { field: 'postalCode', value: '00001', expected: false },
  { field: 'postalCode', value: '99001', expected: false },
  { field: 'postalCode', value: '75001', expected: true },
  { field: 'postalCode', value: '01000', expected: true },
  { field: 'country', value: 'France', expected: true },
  { field: 'country', value: 'États-Unis', expected: true },
];

testCases.forEach(({ field, value, expected }) => {
  const result = validateField(value, field, true);
  const status = result.isValid === expected ? '✅' : '❌';
  const pattern = VALIDATION_PATTERNS[field]?.pattern.toString();
  
  console.log(`${status} ${field}: "${value}" → ${result.isValid ? 'VALIDE' : 'INVALIDE'}`);
  if (!result.isValid) {
    console.log(`   Message: ${result.message}`);
  }
  if (result.isValid !== expected) {
    console.log(`   ⚠️  ATTENDU: ${expected ? 'VALIDE' : 'INVALIDE'}`);
    console.log(`   📝 Pattern: ${pattern}`);
  }
  console.log('');
});

console.log('🎯 Test spécifique: "7/9 jojo" doit être rejeté');
const streetTest = validateField('7/9 jojo', 'street', true);
console.log(`Résultat: ${streetTest.isValid ? '❌ ACCEPTÉ (ERREUR!)' : '✅ REJETÉ (CORRECT)'}`);
if (!streetTest.isValid) {
  console.log(`Message d'erreur: "${streetTest.message}"`);
}
