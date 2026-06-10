"use client";

import * as React from "react";
import ForgetPasswordForm from "./forget-passwordForm";
import Link from "next/link";

export default function ForgetPassWordPage() {
  return (
    <main
      className="relative flex min-h-[100dvh] flex-col items-center justify-center px-6 py-12"
      style={{ backgroundColor: "rgb(251, 251, 252)" }}
    >
      {/* Content */}
      <div className="flex flex-col items-center w-full">
        <img
          src="/newbi-icon.png"
          alt="Newbi"
          className="h-10 w-10 rounded-xl mb-6"
        />
        <h1 className="text-xl font-medium mb-2" style={{ color: "#2f2f31" }}>
          Mot de passe oublié
        </h1>
        <p className="text-[13px] text-muted-foreground mb-8 text-center max-w-[320px]">
          Entrez votre email pour recevoir un lien de réinitialisation de mot de
          passe.
        </p>

        <div className="w-full max-w-[320px]">
          <ForgetPasswordForm />
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/auth/login"
            className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    </main>
  );
}
