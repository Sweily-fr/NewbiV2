"use client";
import React, { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Switch } from "@/src/components/ui/switch";
import { X } from "lucide-react";

const CookiePreferencesModal = ({ isOpen, onClose }) => {
  const [preferences, setPreferences] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cookie_consent');
      return saved ? JSON.parse(saved) : {
        necessary: true,
        functional: true,
        analytics: false,
        marketing: false,
      };
    }
    return {
      necessary: true,
      functional: true,
      analytics: false,
      marketing: false,
    };
  });

  const handlePreferenceChange = (key, value) => {
    if (key === 'necessary') return; // Cannot disable necessary cookies
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSavePreferences = () => {
    localStorage.setItem('cookie_consent', JSON.stringify(preferences));
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    onClose();
  };

  const cookieTypes = [
    {
      key: 'necessary',
      name: 'Cookies nécessaires',
      description: 'Ces cookies sont essentiels au fonctionnement du site et ne peuvent pas être désactivés. Ils permettent d\'assurer la sécurité du site et de mémoriser vos préférences de base.',
      note: 'Ces cookies sont nécessaires au fonctionnement du site et ne peuvent pas être désactivés.',
      cookies: [
        {
          name: 'auth_token',
          provider: 'Newbi',
          purpose: 'Authentification et sécurité',
          expiration: 'Session'
        },
        {
          name: 'cookie_consent',
          provider: 'Newbi',
          purpose: 'Stockage des préférences de cookies',
          expiration: '1 an'
        }
      ]
    },
    {
      key: 'functional',
      name: 'Cookies fonctionnels',
      description: 'Ces cookies permettent d\'améliorer les fonctionnalités et la personnalisation de votre expérience sur notre site.',
      cookies: [
        {
          name: 'user_preferences',
          provider: 'Newbi',
          purpose: 'Mémorisation des préférences utilisateur',
          expiration: '6 mois'
        }
      ]
    },
    {
      key: 'analytics',
      name: 'Cookies analytiques',
      description: 'Ces cookies nous aident à comprendre comment vous utilisez notre site pour l\'améliorer.',
      cookies: [
        {
          name: '_ga',
          provider: 'Google Analytics',
          purpose: 'Analyse du trafic et du comportement',
          expiration: '2 ans'
        }
      ]
    },
    {
      key: 'marketing',
      name: 'Cookies marketing',
      description: 'Ces cookies sont utilisés pour vous proposer des publicités personnalisées.',
      cookies: [
        {
          name: 'marketing_id',
          provider: 'Partenaires publicitaires',
          purpose: 'Publicité ciblée',
          expiration: '1 an'
        }
      ]
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl">Préférences de Cookies</CardTitle>
            <CardDescription className="mt-2">
              Dernière mise à jour : 08/05/2025 23:35
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-sm text-gray-600 leading-relaxed">
            <p className="mb-4">
              Ce centre de préférences vous permet de personnaliser l'utilisation des cookies sur notre site. 
              Nous utilisons différents types de cookies pour optimiser votre expérience et nos services. 
              Pour plus d'informations, consultez notre{" "}
              <a href="/politique-de-confidentialite" className="text-blue-600 hover:text-blue-800 underline">
                politique de confidentialité
              </a>.
            </p>
          </div>

          <div className="space-y-6">
            {cookieTypes.map((type) => (
              <div key={type.key} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">{type.name}</h3>
                  <Switch
                    checked={preferences[type.key]}
                    onCheckedChange={(checked) => handlePreferenceChange(type.key, checked)}
                    disabled={type.key === 'necessary'}
                  />
                </div>
                
                <p className="text-sm text-gray-600 mb-4">{type.description}</p>
                
                {type.note && (
                  <p className="text-xs text-blue-600 mb-4">{type.note}</p>
                )}

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Cookies utilisés :</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2 font-medium text-gray-500">NOM</th>
                          <th className="text-left py-2 px-2 font-medium text-gray-500">FOURNISSEUR</th>
                          <th className="text-left py-2 px-2 font-medium text-gray-500">OBJECTIF</th>
                          <th className="text-left py-2 px-2 font-medium text-gray-500">EXPIRATION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {type.cookies.map((cookie, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-2 px-2">{cookie.name}</td>
                            <td className="py-2 px-2">{cookie.provider}</td>
                            <td className="py-2 px-2">{cookie.purpose}</td>
                            <td className="py-2 px-2">{cookie.expiration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 justify-center pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSavePreferences}>
              Sauvegarder mes préférences
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CookiePreferencesModal;
