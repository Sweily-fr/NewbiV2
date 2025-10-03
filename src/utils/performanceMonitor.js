/**
 * Utilitaire de monitoring des performances du système temps réel
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      apiCalls: 0,
      cacheHits: 0,
      averageLatency: 0,
      errorRate: 0,
      activeUsers: 0,
      lastReset: new Date()
    };
    
    this.samples = [];
    this.maxSamples = 100;
  }

  // Enregistrer un appel API
  recordApiCall(latency, fromCache = false) {
    this.metrics.apiCalls++;
    
    if (fromCache) {
      this.metrics.cacheHits++;
    }
    
    // Calculer latence moyenne
    this.samples.push(latency);
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
    
    this.metrics.averageLatency = 
      this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
  }

  // Enregistrer une erreur
  recordError() {
    this.metrics.errorRate = 
      (this.metrics.errorRate * 0.9) + (1 * 0.1); // Moyenne mobile
  }

  // Obtenir les métriques actuelles
  getMetrics() {
    const now = new Date();
    const duration = (now - this.metrics.lastReset) / 1000 / 60; // minutes
    
    return {
      ...this.metrics,
      apiCallsPerMinute: this.metrics.apiCalls / duration,
      cacheHitRate: this.metrics.cacheHits / this.metrics.apiCalls,
      duration: duration
    };
  }

  // Vérifier si migration WebSocket recommandée
  shouldMigrateToWebSocket() {
    const metrics = this.getMetrics();
    
    const conditions = {
      highApiLoad: metrics.apiCallsPerMinute > 50,
      highLatency: metrics.averageLatency > 2000,
      lowCacheRate: metrics.cacheHitRate < 0.3,
      highErrorRate: metrics.errorRate > 0.1
    };
    
    const score = Object.values(conditions).filter(Boolean).length;
    
    return {
      shouldMigrate: score >= 2,
      score,
      conditions,
      recommendation: this.getRecommendation(score)
    };
  }

  getRecommendation(score) {
    if (score >= 3) {
      return "Migration WebSocket fortement recommandée";
    } else if (score >= 2) {
      return "Surveiller les performances, migration à prévoir";
    } else if (score >= 1) {
      return "Optimisations polling possibles";
    } else {
      return "Performances acceptables";
    }
  }

  // Réinitialiser les métriques
  reset() {
    this.metrics = {
      apiCalls: 0,
      cacheHits: 0,
      averageLatency: 0,
      errorRate: 0,
      activeUsers: 0,
      lastReset: new Date()
    };
    this.samples = [];
  }

  // Rapport détaillé
  generateReport() {
    const metrics = this.getMetrics();
    const migration = this.shouldMigrateToWebSocket();
    
    return {
      timestamp: new Date().toISOString(),
      metrics,
      migration,
      recommendations: [
        metrics.cacheHitRate < 0.5 && "Améliorer le cache Apollo",
        metrics.averageLatency > 1000 && "Optimiser les requêtes GraphQL",
        metrics.apiCallsPerMinute > 30 && "Augmenter les intervalles de polling",
        migration.shouldMigrate && "Planifier migration WebSocket"
      ].filter(Boolean)
    };
  }
}

// Instance globale
export const performanceMonitor = new PerformanceMonitor();

// Hook pour utiliser le monitoring
export const usePerformanceMonitoring = () => {
  const recordCall = (latency, fromCache) => {
    performanceMonitor.recordApiCall(latency, fromCache);
  };

  const recordError = () => {
    performanceMonitor.recordError();
  };

  const getReport = () => {
    return performanceMonitor.generateReport();
  };

  return {
    recordCall,
    recordError,
    getReport,
    getMetrics: () => performanceMonitor.getMetrics(),
    shouldMigrate: () => performanceMonitor.shouldMigrateToWebSocket()
  };
};

export default PerformanceMonitor;
