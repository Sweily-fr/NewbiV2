"use client";

import { useState } from 'react';
import { Cloud, HardDrive, Info } from 'lucide-react';

const StorageSelector = ({ selectedStorage, onStorageChange, disabled = false }) => {
  const [showInfo, setShowInfo] = useState(false);

  const storageOptions = [
    {
      id: 'local',
      name: 'Stockage Local',
      description: 'Fichiers stockés sur le serveur local',
      icon: HardDrive,
      pros: ['Accès rapide', 'Contrôle total'],
      cons: ['Limite de stockage', 'Pas de CDN'],
      recommended: false
    },
    {
      id: 'r2',
      name: 'Cloudflare R2',
      description: 'Stockage cloud haute performance',
      icon: Cloud,
      pros: ['Stockage illimité', 'CDN global', 'Haute disponibilité', 'Sécurisé'],
      cons: ['Coût par GB'],
      recommended: true
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Type de stockage
        </h3>
        <button
          type="button"
          onClick={() => setShowInfo(!showInfo)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Info className="h-5 w-5" />
        </button>
      </div>

      {showInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-medium mb-2">Informations sur les types de stockage :</p>
          <ul className="space-y-1 text-blue-700">
            <li>• <strong>Stockage Local :</strong> Fichiers stockés directement sur le serveur</li>
            <li>• <strong>Cloudflare R2 :</strong> Stockage cloud avec distribution mondiale et haute performance</li>
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {storageOptions.map((option) => {
          const IconComponent = option.icon;
          const isSelected = selectedStorage === option.id;
          
          return (
            <div
              key={option.id}
              className={`relative rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !disabled && onStorageChange(option.id)}
            >
              {option.recommended && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  Recommandé
                </div>
              )}
              
              <div className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`p-2 rounded-lg ${
                    isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className={`font-medium ${
                      isSelected ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {option.name}
                    </h4>
                    <p className={`text-sm ${
                      isSelected ? 'text-blue-700' : 'text-gray-600'
                    }`}>
                      {option.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-medium text-green-700 mb-1">Avantages :</p>
                    <ul className="text-xs text-green-600 space-y-1">
                      {option.pros.map((pro, index) => (
                        <li key={index}>• {pro}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {option.cons.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-orange-700 mb-1">Inconvénients :</p>
                      <ul className="text-xs text-orange-600 space-y-1">
                        {option.cons.map((con, index) => (
                          <li key={index}>• {con}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {isSelected && (
                  <div className="mt-3 flex items-center text-blue-600">
                    <div className="h-2 w-2 bg-blue-600 rounded-full mr-2"></div>
                    <span className="text-xs font-medium">Sélectionné</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedStorage === 'r2' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Cloud className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900 mb-1">
                Cloudflare R2 activé
              </h4>
              <p className="text-sm text-green-700">
                Vos fichiers seront stockés sur Cloudflare R2 avec une structure organisée par date et transfert.
              </p>
              <p className="text-xs text-green-600 mt-2">
                Structure : <code>prod/YYYY/MM/DD/t_&lt;transfer_id&gt;/f_&lt;file_id&gt;_&lt;nom_fichier&gt;</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedStorage === 'local' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <HardDrive className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900 mb-1">
                Stockage local activé
              </h4>
              <p className="text-sm text-yellow-700">
                Vos fichiers seront stockés localement sur le serveur dans le dossier uploads.
              </p>
              <p className="text-xs text-yellow-600 mt-2">
                Limite recommandée : 100GB par transfert
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorageSelector;
