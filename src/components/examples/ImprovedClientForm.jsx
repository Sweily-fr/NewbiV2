import React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateClient } from '@/src/hooks/useClients';
import { useErrorHandler } from '@/src/hooks/useErrorHandler';
import { ErrorMessage, FormErrorMessage, FormErrorSummary } from '@/src/components/ErrorMessage';
import ErrorBoundary from '@/src/components/ErrorBoundary';
import { toast } from '@/src/components/ui/sonner';

/**
 * Exemple d'utilisation du nouveau système de gestion d'erreur
 * dans un formulaire de création de client
 */
function ImprovedClientForm({ onSuccess, onCancel }) {
  const { handleFormError } = useErrorHandler();
  const { createClient, loading } = useCreateClient();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors
  } = useForm();

  const onSubmit = async (data) => {
    try {
      clearErrors();
      
      const result = await createClient(data);
      
      toast.success('Client créé avec succès');
      onSuccess?.(result);
      
    } catch (error) {
      // Le système centralisé gère automatiquement l'affichage des erreurs
      // mais on peut aussi gérer les erreurs de validation spécifiques
      
      if (error.graphQLErrors) {
        error.graphQLErrors.forEach((gqlError) => {
          if (gqlError.extensions?.field) {
            // Erreur sur un champ spécifique
            setError(gqlError.extensions.field, {
              type: 'server',
              message: gqlError.message
            });
          }
        });
      }
      
      // Gestion centralisée pour l'affichage toast
      handleFormError(error, 'client');
    }
  };

  return (
    <ErrorBoundary context="client">
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-6">Nouveau Client</h2>
        
        {/* Résumé des erreurs de validation */}
        <FormErrorSummary 
          errors={errors} 
          context="client"
          className="mb-4"
        />
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom *
            </label>
            <input
              {...register('name', { 
                required: 'Le nom est obligatoire',
                minLength: {
                  value: 2,
                  message: 'Le nom doit contenir au moins 2 caractères'
                }
              })}
              type="text"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nom du client"
            />
            <FormErrorMessage errors={errors} fieldName="name" />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              {...register('email', { 
                required: 'L\'email est obligatoire',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Format d\'email invalide'
                }
              })}
              type="email"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="email@exemple.com"
            />
            <FormErrorMessage errors={errors} fieldName="email" />
          </div>

          {/* Type de client */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de client
            </label>
            <select
              {...register('type', { required: 'Veuillez sélectionner un type' })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.type ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Sélectionnez un type</option>
              <option value="INDIVIDUAL">Particulier</option>
              <option value="COMPANY">Entreprise</option>
            </select>
            <FormErrorMessage errors={errors} fieldName="type" />
          </div>

          {/* SIRET (conditionnel pour les entreprises) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SIRET
            </label>
            <input
              {...register('siret', {
                pattern: {
                  value: /^[0-9]{14}$/,
                  message: 'Le SIRET doit contenir exactement 14 chiffres'
                }
              })}
              type="text"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.siret ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="12345678901234"
              maxLength={14}
            />
            <FormErrorMessage errors={errors} fieldName="siret" />
          </div>

          {/* Téléphone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <input
              {...register('phone', {
                pattern: {
                  value: /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
                  message: 'Format de téléphone invalide'
                }
              })}
              type="tel"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="01 23 45 67 89"
            />
            <FormErrorMessage errors={errors} fieldName="phone" />
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              disabled={isSubmitting || loading}
            >
              Annuler
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {(isSubmitting || loading) && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isSubmitting || loading ? 'Création...' : 'Créer le client'}
            </button>
          </div>
        </form>
      </div>
    </ErrorBoundary>
  );
}

/**
 * Exemple d'utilisation avec gestion d'erreur de chargement
 */
function ClientFormWithLoadingError() {
  const [showForm, setShowForm] = React.useState(false);
  const [error, setError] = React.useState(null);

  const handleShowForm = async () => {
    try {
      // Simulation d'une vérification préalable qui pourrait échouer
      await checkUserPermissions();
      setShowForm(true);
    } catch (error) {
      setError(error);
    }
  };

  if (error) {
    return (
      <ErrorMessage
        error={error}
        context="client"
        variant="error"
        className="max-w-md mx-auto"
        onDismiss={() => setError(null)}
      />
    );
  }

  if (!showForm) {
    return (
      <div className="text-center">
        <button
          onClick={handleShowForm}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Nouveau Client
        </button>
      </div>
    );
  }

  return (
    <ImprovedClientForm
      onSuccess={() => {
        setShowForm(false);
        toast.success('Client créé avec succès !');
      }}
      onCancel={() => setShowForm(false)}
    />
  );
}

// Fonction simulée
async function checkUserPermissions() {
  // Simulation d'une erreur de permissions
  if (Math.random() > 0.8) {
    throw new Error('COMPANY_INFO_INCOMPLETE');
  }
  return true;
}

export default ImprovedClientForm;
export { ClientFormWithLoadingError };
