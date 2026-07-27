"use client";

import { createContext, useContext, useMemo, useState } from "react";

const AccountingViewContext = createContext({
  activeView: "business",
  setActiveView: () => {},
});

export function AccountingViewProvider({ children }) {
  const [activeView, setActiveView] = useState("business");

  // Provider monté au-dessus de tout le dashboard : la value doit rester
  // stable tant que activeView ne change pas.
  const value = useMemo(() => ({ activeView, setActiveView }), [activeView]);

  return (
    <AccountingViewContext.Provider value={value}>
      {children}
    </AccountingViewContext.Provider>
  );
}

export function useAccountingView() {
  const context = useContext(AccountingViewContext);
  if (!context) {
    throw new Error(
      "useAccountingView must be used within AccountingViewProvider",
    );
  }
  return context;
}
