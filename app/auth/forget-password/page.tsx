"use client";

import * as React from "react";

import ForgetPasswordForm from "./forget-passwordForm";

export default function ForgetPassWordPage() {
  return (
    <main>
      <div className="flex h-screen">
        <div className="w-1/2 p-5 flex items-center min-h-screen justify-center">
          <div
            className="flex p-6 items-center justify-center w-full h-full rounded-lg bg-cover bg-center"
            style={{ backgroundImage: "url('/backgroundLogin.png')" }}
          ></div>
        </div>
        <div className="w-1/2 flex items-center justify-center p-32">
          <div className="sm:mx-auto sm:max-w-3xl w-full px-4">
            <h3 className="text-3xl font-semibold text-foreground dark:text-foreground">
              Mot de passe oublié
            </h3>
            <p className="mt-2 text-sm text-muted-foreground dark:text-muted-foreground">
              Entrer votre email pour recevoir un lien de reinitialisation de
              mot de passe
            </p>
            <ForgetPasswordForm />
          </div>
        </div>
      </div>
    </main>
  );
}
