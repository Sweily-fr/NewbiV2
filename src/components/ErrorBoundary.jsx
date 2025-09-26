import React from 'react';
import { toast } from '@/src/components/ui/sonner';
import { getErrorMessage } from '@/src/utils/errorMessages';

/**
 * Composant Error Boundary pour capturer les erreurs React
 * et afficher des messages utilisateur appropriés
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Mettre à jour le state pour afficher l'UI de fallback
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Logger l'erreur pour le debug
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Afficher un message utilisateur approprié
    const userMessage = getErrorMessage(error, this.props.context || 'generic');
    
    toast.error("Une erreur inattendue s'est produite", {
      description: userMessage,
      duration: 5000
    });

    // Callback optionnel pour le parent
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Interface de fallback personnalisée
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Interface de fallback par défaut
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-4">
            <svg
              className="w-16 h-16 text-red-500 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Une erreur s'est produite
          </h2>
          
          <p className="text-gray-600 mb-6 max-w-md">
            Nous nous excusons pour ce désagrément. L'équipe technique a été notifiée.
          </p>
          
          <div className="space-x-4">
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Réessayer
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Recharger la page
            </button>
          </div>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Détails de l'erreur (développement)
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-4 rounded overflow-auto max-w-2xl">
                {this.state.error.toString()}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook pour utiliser ErrorBoundary de manière fonctionnelle
 */
export function useErrorBoundary() {
  const [error, setError] = React.useState(null);
  
  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);
  
  const captureError = React.useCallback((error) => {
    setError(error);
  }, []);
  
  return captureError;
}

/**
 * Composant wrapper pour les sections critiques
 */
export function CriticalErrorBoundary({ children, context = 'generic' }) {
  return (
    <ErrorBoundary
      context={context}
      fallback={(error, retry) => (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-900 mb-2">
            Fonctionnalité temporairement indisponible
          </h3>
          <p className="text-red-700 mb-4">
            Cette section rencontre un problème technique. Veuillez réessayer.
          </p>
          <button
            onClick={retry}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
