"use client";

import { createContext, useContext, useState } from "react";

const AccountingViewContext = createContext({
  activeView: "business",
  setActiveView: () => {},
});

export function AccountingViewProvider({ children }) {
  const [activeView, setActiveView] = useState("business");

  return (
    <AccountingViewContext.Provider value={{ activeView, setActiveView }}>
      {children}
    </AccountingViewContext.Provider>
  );
}

export function useAccountingView() {
  const context = useContext(AccountingViewContext);
  if (!context) {
    throw new Error(
      "useAccountingView must be used within AccountingViewProvider"
    );
  }
  return context;
}
