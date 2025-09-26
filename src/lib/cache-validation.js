/**
 * Script de validation du système de cache Apollo Client
 * Vérifie que toutes les configurations sont correctes
 */

import { apolloClient, getApolloClient } from './apolloClient';
import { CACHE_POLICIES, getOptimizedPolicy } from './cache-utils';

/**
 * Valide la configuration du cache Apollo Client
 */
export const validateCacheConfiguration = () => {
  const results = {
    success: true,
    errors: [],
    warnings: [],
    info: [],
  };

  try {
    // 1. Vérifier que le client Apollo est correctement configuré
    if (!apolloClient) {
      results.errors.push('Apollo Client non initialisé');
      results.success = false;
    } else {
      results.info.push('✅ Apollo Client initialisé');
    }

    // 2. Vérifier la configuration du cache
    const cache = apolloClient.cache;
    if (!cache) {
      results.errors.push('Cache Apollo non configuré');
      results.success = false;
    } else {
      results.info.push('✅ Cache Apollo configuré');
      
      // Vérifier les typePolicies
      const typePolicies = cache.policies?.typePolicies;
      if (!typePolicies) {
        results.warnings.push('⚠️ Aucune typePolicy configurée');
      } else {
        results.info.push(`✅ TypePolicies configurées: ${Object.keys(typePolicies).length} types`);
        
        // Vérifier les types importants
        const requiredTypes = ['Query', 'Invoice', 'Quote', 'Client', 'Product'];
        requiredTypes.forEach(type => {
          if (typePolicies[type]) {
            results.info.push(`✅ TypePolicy ${type} configurée`);
          } else {
            results.warnings.push(`⚠️ TypePolicy ${type} manquante`);
          }
        });
      }
    }

    // 3. Vérifier les politiques de cache
    Object.entries(CACHE_POLICIES).forEach(([name, policy]) => {
      if (policy.fetchPolicy && policy.nextFetchPolicy !== undefined) {
        results.info.push(`✅ Politique ${name} configurée`);
      } else {
        results.errors.push(`❌ Politique ${name} mal configurée`);
        results.success = false;
      }
    });

    // 4. Tester les politiques optimisées
    const testCases = [
      { dataType: 'organization', context: 'default' },
      { dataType: 'lists', context: 'table' },
      { dataType: 'forms', context: 'form' },
      { dataType: 'stats', context: 'dashboard' },
    ];

    testCases.forEach(({ dataType, context }) => {
      try {
        const policy = getOptimizedPolicy(dataType, context);
        if (policy.fetchPolicy) {
          results.info.push(`✅ Politique optimisée ${dataType}/${context}: ${policy.fetchPolicy}`);
        } else {
          results.warnings.push(`⚠️ Politique optimisée ${dataType}/${context} incomplète`);
        }
      } catch (error) {
        results.errors.push(`❌ Erreur politique ${dataType}/${context}: ${error.message}`);
        results.success = false;
      }
    });

    // 5. Vérifier les options par défaut
    const defaultOptions = apolloClient.defaultOptions;
    if (defaultOptions) {
      results.info.push('✅ Options par défaut configurées');
      
      if (defaultOptions.watchQuery?.fetchPolicy) {
        results.info.push(`✅ FetchPolicy par défaut: ${defaultOptions.watchQuery.fetchPolicy}`);
      }
      
      if (defaultOptions.mutate?.errorPolicy) {
        results.info.push(`✅ ErrorPolicy mutations: ${defaultOptions.mutate.errorPolicy}`);
      }
    } else {
      results.warnings.push('⚠️ Aucune option par défaut configurée');
    }

    // 6. Vérifier la persistance du cache (côté client uniquement)
    if (typeof window !== 'undefined') {
      try {
        const hasLocalStorage = !!window.localStorage;
        if (hasLocalStorage) {
          results.info.push('✅ LocalStorage disponible pour persistance');
          
          // Vérifier si le cache persistant existe
          const persistedCache = localStorage.getItem('newbi-apollo-cache');
          if (persistedCache) {
            results.info.push('✅ Cache persistant détecté');
            try {
              const parsed = JSON.parse(persistedCache);
              const size = JSON.stringify(parsed).length;
              results.info.push(`✅ Taille cache persistant: ${Math.round(size / 1024)} KB`);
            } catch {
              results.warnings.push('⚠️ Cache persistant corrompu');
            }
          } else {
            results.info.push('ℹ️ Aucun cache persistant (normal au premier démarrage)');
          }
        } else {
          results.warnings.push('⚠️ LocalStorage non disponible');
        }
      } catch (error) {
        results.warnings.push(`⚠️ Erreur vérification persistance: ${error.message}`);
      }
    } else {
      results.info.push('ℹ️ Validation côté serveur (persistance non applicable)');
    }

  } catch (error) {
    results.errors.push(`❌ Erreur générale: ${error.message}`);
    results.success = false;
  }

  return results;
};

/**
 * Teste les performances du cache avec des données simulées
 */
export const testCachePerformance = async () => {
  const results = {
    success: true,
    errors: [],
    timings: {},
  };

  try {
    // Test 1: Écriture dans le cache
    const startWrite = performance.now();
    
    const testData = {
      __typename: 'TestEntity',
      id: 'test-1',
      name: 'Test Cache Performance',
      data: new Array(1000).fill('test').join(''),
    };

    apolloClient.cache.writeQuery({
      query: {
        kind: 'Document',
        definitions: [{
          kind: 'OperationDefinition',
          operation: 'query',
          name: { kind: 'Name', value: 'TestQuery' },
          selectionSet: {
            kind: 'SelectionSet',
            selections: [{
              kind: 'Field',
              name: { kind: 'Name', value: 'testEntity' },
              selectionSet: {
                kind: 'SelectionSet',
                selections: [
                  { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                  { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                  { kind: 'Field', name: { kind: 'Name', value: 'data' } },
                ]
              }
            }]
          }
        }]
      },
      data: { testEntity: testData },
    });

    const writeTime = performance.now() - startWrite;
    results.timings.write = writeTime;

    // Test 2: Lecture depuis le cache
    const startRead = performance.now();
    
    const cachedData = apolloClient.cache.readQuery({
      query: {
        kind: 'Document',
        definitions: [{
          kind: 'OperationDefinition',
          operation: 'query',
          name: { kind: 'Name', value: 'TestQuery' },
          selectionSet: {
            kind: 'SelectionSet',
            selections: [{
              kind: 'Field',
              name: { kind: 'Name', value: 'testEntity' },
              selectionSet: {
                kind: 'SelectionSet',
                selections: [
                  { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                  { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                  { kind: 'Field', name: { kind: 'Name', value: 'data' } },
                ]
              }
            }]
          }
        }]
      },
    });

    const readTime = performance.now() - startRead;
    results.timings.read = readTime;

    if (!cachedData || cachedData.testEntity.id !== 'test-1') {
      results.errors.push('❌ Données non trouvées dans le cache');
      results.success = false;
    }

    // Test 3: Taille du cache
    const startSize = performance.now();
    const cacheData = apolloClient.cache.extract();
    const cacheSize = JSON.stringify(cacheData).length;
    const sizeTime = performance.now() - startSize;
    
    results.timings.size = sizeTime;
    results.timings.cacheSize = cacheSize;

    // Nettoyer les données de test
    apolloClient.cache.evict({ fieldName: 'testEntity' });
    apolloClient.cache.gc();

  } catch (error) {
    results.errors.push(`❌ Erreur test performance: ${error.message}`);
    results.success = false;
  }

  return results;
};

/**
 * Affiche un rapport de validation complet
 */
export const generateValidationReport = async () => {
  console.log('🔍 === VALIDATION DU SYSTÈME DE CACHE APOLLO CLIENT ===\n');

  // 1. Validation de la configuration
  console.log('📋 Configuration:');
  const configResults = validateCacheConfiguration();
  
  configResults.info.forEach(info => console.log(`  ${info}`));
  configResults.warnings.forEach(warning => console.log(`  ${warning}`));
  configResults.errors.forEach(error => console.log(`  ${error}`));
  
  console.log(`\n📊 Résultat configuration: ${configResults.success ? '✅ SUCCÈS' : '❌ ÉCHEC'}\n`);

  // 2. Test de performance
  console.log('⚡ Performance:');
  const perfResults = await testCachePerformance();
  
  if (perfResults.success) {
    console.log(`  ✅ Écriture cache: ${perfResults.timings.write.toFixed(2)}ms`);
    console.log(`  ✅ Lecture cache: ${perfResults.timings.read.toFixed(2)}ms`);
    console.log(`  ✅ Extraction cache: ${perfResults.timings.size.toFixed(2)}ms`);
    console.log(`  ✅ Taille cache: ${Math.round(perfResults.timings.cacheSize / 1024)}KB`);
  } else {
    perfResults.errors.forEach(error => console.log(`  ${error}`));
  }
  
  console.log(`\n📊 Résultat performance: ${perfResults.success ? '✅ SUCCÈS' : '❌ ÉCHEC'}\n`);

  // 3. Recommandations
  console.log('💡 Recommandations:');
  
  if (perfResults.timings?.write > 10) {
    console.log('  ⚠️ Écriture cache lente (>10ms) - Réduire la taille des données');
  }
  
  if (perfResults.timings?.read > 5) {
    console.log('  ⚠️ Lecture cache lente (>5ms) - Optimiser les requêtes');
  }
  
  if (perfResults.timings?.cacheSize > 1024 * 1024) {
    console.log('  ⚠️ Cache volumineux (>1MB) - Considérer le nettoyage automatique');
  }
  
  if (configResults.warnings.length === 0 && perfResults.success) {
    console.log('  🎉 Configuration optimale détectée !');
  }

  console.log('\n🏁 === FIN DE LA VALIDATION ===');
  
  return {
    configuration: configResults,
    performance: perfResults,
    overall: configResults.success && perfResults.success,
  };
};

// Export pour utilisation dans d'autres fichiers
export default {
  validateCacheConfiguration,
  testCachePerformance,
  generateValidationReport,
};
