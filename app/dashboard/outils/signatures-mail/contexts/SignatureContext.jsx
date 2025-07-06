/**
 * Context pour la gestion globale de l'état des signatures email
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Actions pour le reducer
const SIGNATURE_ACTIONS = {
  SET_PERSONAL_INFO: 'SET_PERSONAL_INFO',
  SET_COMPANY_INFO: 'SET_COMPANY_INFO',
  SET_SOCIAL_NETWORKS: 'SET_SOCIAL_NETWORKS',
  SET_APPEARANCE: 'SET_APPEARANCE',
  SET_CURRENT_STEP: 'SET_CURRENT_STEP',
  RESET_SIGNATURE: 'RESET_SIGNATURE',
  LOAD_SIGNATURE: 'LOAD_SIGNATURE',
  SET_SIGNATURE_NAME: 'SET_SIGNATURE_NAME',
};

// État initial de la signature
const initialState = {
  currentStep: 1,
  signatureName: '',
  personalInfo: {
    firstName: '',
    lastName: '',
    position: '',
    phone: '',
    email: '',
    profileImage: null,
  },
  companyInfo: {
    companyName: '',
    address: '',
    city: '',
    postalCode: '',
    website: '',
    logo: null,
  },
  socialNetworks: {
    linkedin: '',
    facebook: '',
    instagram: '',
    twitter: '',
    showSocialIcons: true,
  },
  appearance: {
    primaryColor: '#2563eb',
    secondaryColor: '#64748b',
    fontFamily: 'Arial, sans-serif',
    fontSize: '14px',
    layout: 'horizontal', // horizontal, vertical
  },
};

// Reducer pour gérer les actions
function signatureReducer(state, action) {
  switch (action.type) {
    case SIGNATURE_ACTIONS.SET_PERSONAL_INFO:
      return {
        ...state,
        personalInfo: { ...state.personalInfo, ...action.payload },
      };
    case SIGNATURE_ACTIONS.SET_COMPANY_INFO:
      return {
        ...state,
        companyInfo: { ...state.companyInfo, ...action.payload },
      };
    case SIGNATURE_ACTIONS.SET_SOCIAL_NETWORKS:
      return {
        ...state,
        socialNetworks: { ...state.socialNetworks, ...action.payload },
      };
    case SIGNATURE_ACTIONS.SET_APPEARANCE:
      return {
        ...state,
        appearance: { ...state.appearance, ...action.payload },
      };
    case SIGNATURE_ACTIONS.SET_CURRENT_STEP:
      return {
        ...state,
        currentStep: action.payload,
      };
    case SIGNATURE_ACTIONS.SET_SIGNATURE_NAME:
      return {
        ...state,
        signatureName: action.payload,
      };
    case SIGNATURE_ACTIONS.LOAD_SIGNATURE:
      return {
        ...state,
        ...action.payload,
      };
    case SIGNATURE_ACTIONS.RESET_SIGNATURE:
      return initialState;
    default:
      return state;
  }
}

// Context
const SignatureContext = createContext();

// Provider
export function SignatureProvider({ children }) {
  const [state, dispatch] = useReducer(signatureReducer, initialState);

  // Sauvegarde automatique dans localStorage
  useEffect(() => {
    const autoSave = setTimeout(() => {
      localStorage.setItem('signature-draft', JSON.stringify(state));
    }, 1000);

    return () => clearTimeout(autoSave);
  }, [state]);

  // Actions
  const actions = {
    setPersonalInfo: (data) => 
      dispatch({ type: SIGNATURE_ACTIONS.SET_PERSONAL_INFO, payload: data }),
    
    setCompanyInfo: (data) => 
      dispatch({ type: SIGNATURE_ACTIONS.SET_COMPANY_INFO, payload: data }),
    
    setSocialNetworks: (data) => 
      dispatch({ type: SIGNATURE_ACTIONS.SET_SOCIAL_NETWORKS, payload: data }),
    
    setAppearance: (data) => 
      dispatch({ type: SIGNATURE_ACTIONS.SET_APPEARANCE, payload: data }),
    
    setCurrentStep: (step) => 
      dispatch({ type: SIGNATURE_ACTIONS.SET_CURRENT_STEP, payload: step }),
    
    setSignatureName: (name) => 
      dispatch({ type: SIGNATURE_ACTIONS.SET_SIGNATURE_NAME, payload: name }),
    
    loadSignature: (signatureData) => 
      dispatch({ type: SIGNATURE_ACTIONS.LOAD_SIGNATURE, payload: signatureData }),
    
    resetSignature: () => 
      dispatch({ type: SIGNATURE_ACTIONS.RESET_SIGNATURE }),
    
    // Charger le brouillon depuis localStorage
    loadDraft: () => {
      const draft = localStorage.getItem('signature-draft');
      if (draft) {
        dispatch({ type: SIGNATURE_ACTIONS.LOAD_SIGNATURE, payload: JSON.parse(draft) });
      }
    },
    
    // Sauvegarder la signature
    saveSignature: async () => {
      // Ici vous pouvez implémenter la sauvegarde en BDD
      const signatureData = {
        ...state,
        id: Date.now(), // ID temporaire
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Sauvegarder dans localStorage pour l'exemple
      const savedSignatures = JSON.parse(localStorage.getItem('saved-signatures') || '[]');
      savedSignatures.push(signatureData);
      localStorage.setItem('saved-signatures', JSON.stringify(savedSignatures));
      
      return signatureData;
    },
  };

  const value = {
    ...state,
    ...actions,
  };

  return (
    <SignatureContext.Provider value={value}>
      {children}
    </SignatureContext.Provider>
  );
}

// Hook personnalisé pour utiliser le context
export function useSignature() {
  const context = useContext(SignatureContext);
  if (!context) {
    throw new Error('useSignature must be used within a SignatureProvider');
  }
  return context;
}

export { SIGNATURE_ACTIONS };
