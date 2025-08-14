"use client";

import React from "react";

const TemplateSelector = ({ selectedTemplate, onTemplateChange }) => {
  const templates = [
    {
      id: 'vertical',
      name: 'Vertical Classic',
      description: 'Layout vertical traditionnel',
      preview: '📱'
    },
    {
      id: 'horizontal',
      name: 'Horizontal Classic', 
      description: 'Layout horizontal traditionnel',
      preview: '💻'
    },
    {
      id: 'obama',
      name: 'Obama Style',
      description: 'Style professionnel minimaliste',
      preview: '👔'
    },
    {
      id: 'rangan',
      name: 'Rangan Style',
      description: 'Style moderne avec icônes colorées',
      preview: '🎨'
    },
    {
      id: 'shah',
      name: 'Shah Style',
      description: 'Style corporate avec photo carrée',
      preview: '🏢'
    }
    // {
    //   id: 'custom',
    //   name: 'Éditeur Personnalisé',
    //   description: 'Créez votre signature de A à Z',
    //   preview: '🎯'
    // }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Choisir un template de signature
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => onTemplateChange(template.id)}
            className={`
              relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-md
              ${selectedTemplate === template.id 
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
          >
            {/* Indicateur de sélection */}
            {selectedTemplate === template.id && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            
            {/* Icône du template */}
            <div className="text-3xl mb-3 text-center">
              {template.preview}
            </div>
            
            {/* Nom du template */}
            <h4 className={`font-medium text-center mb-1 ${
              selectedTemplate === template.id ? 'text-blue-700' : 'text-gray-900'
            }`}>
              {template.name}
            </h4>
            
            {/* Description */}
            <p className={`text-sm text-center ${
              selectedTemplate === template.id ? 'text-blue-600' : 'text-gray-500'
            }`}>
              {template.description}
            </p>
          </div>
        ))}
      </div>
      
      {/* Note d'information */}
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <p className="text-sm text-gray-600">
          💡 <strong>Astuce :</strong> Chaque template a son propre style et disposition. 
          Vos informations personnelles s'adapteront automatiquement au design choisi.
        </p>
      </div>
    </div>
  );
};

export default TemplateSelector;
