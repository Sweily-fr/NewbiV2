import React from 'react';
import { AlertTriangle, XCircle, Info, CheckCircle } from 'lucide-react';
import { getErrorMessage } from '@/src/utils/errorMessages';

/**
 * Composant pour afficher des messages d'erreur utilisateur conviviaux
 */
export function ErrorMessage({ 
  error, 
  context = 'generic', 
  variant = 'error',
  showIcon = true,
  className = '',
  onDismiss = null
}) {
  if (!error) return null;

  const message = typeof error === 'string' ? error : getErrorMessage(error, context);
  
  const variants = {
    error: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: XCircle,
      iconColor: 'text-red-500'
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      icon: AlertTriangle,
      iconColor: 'text-yellow-500'
    },
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: Info,
      iconColor: 'text-blue-500'
    },
    success: {
      container: 'bg-green-50 border-green-200 text-green-800',
      icon: CheckCircle,
      iconColor: 'text-green-500'
    }
  };

  const config = variants[variant];
  const Icon = config.icon;

  return (
    <div className={`border rounded-lg p-4 ${config.container} ${className}`}>
      <div className="flex items-start">
        {showIcon && (
          <Icon className={`w-5 h-5 ${config.iconColor} mt-0.5 mr-3 flex-shrink-0`} />
        )}
        
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`ml-3 flex-shrink-0 ${config.iconColor} hover:opacity-75`}
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Composant pour afficher des erreurs de validation de formulaire
 */
export function FormErrorMessage({ errors, fieldName, context = 'validation' }) {
  if (!errors || !fieldName || !errors[fieldName]) return null;

  const error = errors[fieldName];
  const message = typeof error === 'string' ? error : error.message;

  return (
    <div className="mt-1">
      <p className="text-sm text-red-600 flex items-center">
        <XCircle className="w-4 h-4 mr-1 flex-shrink-0" />
        {getErrorMessage(message, context)}
      </p>
    </div>
  );
}

/**
 * Composant pour afficher plusieurs erreurs de validation
 */
export function FormErrorSummary({ errors, context = 'validation', className = '' }) {
  if (!errors || typeof errors !== 'object' || Object.keys(errors).length === 0) {
    return null;
  }

  const errorEntries = Object.entries(errors);

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <XCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 mb-2">
            Veuillez corriger les erreurs suivantes :
          </h3>
          <ul className="text-sm text-red-700 space-y-1">
            {errorEntries.map(([field, error]) => {
              const message = typeof error === 'string' ? error : error.message;
              const fieldLabel = getFieldDisplayName(field);
              return (
                <li key={field} className="flex items-start">
                  <span className="font-medium mr-2">{fieldLabel}:</span>
                  <span>{getErrorMessage(message, context)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Composant pour les erreurs de chargement de données
 */
export function LoadingErrorMessage({ 
  error, 
  onRetry = null, 
  context = 'generic',
  className = '' 
}) {
  const message = getErrorMessage(error, context);

  return (
    <div className={`text-center py-8 ${className}`}>
      <div className="mb-4">
        <XCircle className="w-12 h-12 text-red-500 mx-auto" />
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Impossible de charger les données
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {message}
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Réessayer
        </button>
      )}
    </div>
  );
}

/**
 * Composant pour les erreurs de connexion réseau
 */
export function NetworkErrorMessage({ onRetry = null, className = '' }) {
  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800 mb-1">
            Problème de connexion
          </h3>
          <p className="text-sm text-yellow-700 mb-3">
            Vérifiez votre connexion internet et réessayez.
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200 transition-colors"
            >
              Réessayer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Composant pour les messages d'information
 */
export function InfoMessage({ 
  message, 
  title = null, 
  variant = 'info',
  className = '',
  onDismiss = null
}) {
  return (
    <ErrorMessage
      error={message}
      variant={variant}
      className={className}
      onDismiss={onDismiss}
    />
  );
}

/**
 * Convertit les noms de champs techniques en libellés utilisateur
 */
function getFieldDisplayName(fieldName) {
  const fieldNames = {
    email: "Email",
    name: "Nom",
    firstName: "Prénom", 
    lastName: "Nom de famille",
    phone: "Téléphone",
    siret: "SIRET",
    vatNumber: "Numéro de TVA",
    address: "Adresse",
    city: "Ville",
    postalCode: "Code postal",
    country: "Pays",
    companyName: "Nom de l'entreprise",
    legalForm: "Forme juridique",
    activityCategory: "Catégorie d'activité",
    fiscalRegime: "Régime fiscal",
    password: "Mot de passe",
    confirmPassword: "Confirmation du mot de passe",
    amount: "Montant",
    date: "Date",
    description: "Description",
    quantity: "Quantité",
    unitPrice: "Prix unitaire"
  };

  return fieldNames[fieldName] || fieldName;
}
