"use client";

import React, { createContext, useContext } from "react";
import { useBetterAuthJWT } from "@/src/hooks/useBetterAuthJWT";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const authData = useBetterAuthJWT();

  return (
    <AuthContext.Provider value={authData}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
