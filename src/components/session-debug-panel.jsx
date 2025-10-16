"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/src/lib/auth-client";
import { useDashboardLayoutContext } from "@/src/contexts/dashboard-layout-context";

/**
 * Panel de debug pour visualiser les sessions Better Auth
 * Affiche le nombre de sessions et permet de tester l'onboarding
 * 
 * À utiliser uniquement en développement
 */
export function SessionDebugPanel() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { sessionCount, isOnboardingOpen, setIsOnboardingOpen } = useDashboardLayoutContext();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const { data } = await authClient.multiSession.listSessions();
        setSessions(data || []);
      } catch (error) {
        console.error("Erreur récupération sessions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  // N'afficher qu'en développement
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-lg border bg-white p-4 shadow-lg">
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-sm font-semibold">🔍 Session Debug</h3>
          <span className="text-xs text-gray-500">Better Auth</span>
        </div>

        {isLoading ? (
          <div className="text-sm text-gray-500">Chargement...</div>
        ) : (
          <>
            {/* Nombre de sessions */}
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">
                Nombre de sessions
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-blue-600">
                  {sessionCount || sessions.length}
                </span>
                <span className="text-xs text-gray-500">
                  session{sessions.length > 1 ? "s" : ""} active{sessions.length > 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* État onboarding */}
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">
                État onboarding
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${
                    isOnboardingOpen ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
                <span className="text-sm">
                  {isOnboardingOpen ? "Ouvert" : "Fermé"}
                </span>
              </div>
            </div>

            {/* Condition d'affichage */}
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">
                Condition d'affichage
              </div>
              <div className="text-xs text-gray-700">
                {sessionCount === 1 ? (
                  <span className="text-green-600">
                    ✅ Première session → Onboarding devrait s'afficher
                  </span>
                ) : (
                  <span className="text-orange-600">
                    ⚠️ {sessionCount} sessions → Onboarding ne s'affiche pas
                  </span>
                )}
              </div>
            </div>

            {/* Liste des sessions */}
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">
                Sessions actives
              </div>
              <div className="max-h-32 space-y-1 overflow-y-auto rounded bg-gray-50 p-2">
                {sessions.map((session, index) => (
                  <div
                    key={session.id}
                    className="text-xs text-gray-600"
                  >
                    <span className="font-mono">#{index + 1}</span>
                    {" - "}
                    <span className="text-gray-400">
                      {new Date(session.expiresAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bouton de test */}
            <button
              onClick={() => setIsOnboardingOpen(!isOnboardingOpen)}
              className="w-full rounded bg-blue-500 px-3 py-2 text-xs font-medium text-white hover:bg-blue-600"
            >
              {isOnboardingOpen ? "Fermer" : "Ouvrir"} l'onboarding
            </button>
          </>
        )}
      </div>
    </div>
  );
}
