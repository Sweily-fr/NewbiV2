"use client";

import { createContext, useContext, useMemo } from "react";

// Scénario de prévision actif sur la page Prévision. Un scénario est un calque
// posé sur Base : tout ce qui est ajouté, masqué ou supprimé pendant qu'il est
// actif ne concerne que ce scénario. Les hooks de prévision lisent ce contexte
// pour transmettre scenarioId à l'API ; hors provider (ex. page Analytiques)
// ils travaillent sur Base.
const ForecastScenarioContext = createContext({
  scenarioId: null,
  scenario: null,
  isScenario: false,
  scenarioName: "Base",
});

export function ForecastScenarioProvider({ scenarioId, scenario, children }) {
  const value = useMemo(
    () => ({
      scenarioId: scenarioId || null,
      scenario: scenario || null,
      isScenario: Boolean(scenarioId),
      scenarioName: scenario?.name || "Base",
    }),
    [scenarioId, scenario],
  );
  return (
    <ForecastScenarioContext.Provider value={value}>
      {children}
    </ForecastScenarioContext.Provider>
  );
}

export function useForecastScenario() {
  return useContext(ForecastScenarioContext);
}
