'use client';

import { Component } from 'react';
import { Alert, AlertDescription } from '@/src/components/ui/alert';
import { Button } from '@/src/components/ui/button';
import { AlertTriangleIcon, RefreshCwIcon } from 'lucide-react';

class SubscriptionErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Erreur dans le système d\'abonnement:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert className="border-red-200 bg-red-50 mb-6">
          <AlertTriangleIcon className="h-4 w-4 text-red-600" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <span className="font-medium text-red-800">
                Erreur de chargement de l'abonnement
              </span>
              <p className="text-sm text-red-700 mt-1">
                Une erreur s'est produite lors du chargement des informations d'abonnement.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="border-red-300 text-red-700 hover:bg-red-100 ml-4"
            >
              <RefreshCwIcon className="w-4 h-4 mr-1" />
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

export { SubscriptionErrorBoundary };
