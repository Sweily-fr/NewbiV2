"use client";

import * as React from "react";
import { Typewriter } from "@/src/components/ui/typewriter-text";
import { CircleArrowUp } from "lucide-react";
import ForgetPasswordForm from "./forget-passwordForm";

export default function ForgetPassWordPage() {
  return (
    <main>
      <div className="flex h-screen">
        <div className="w-1/2 p-5 flex items-center min-h-screen justify-center">
          <div
            className="flex p-6 items-center justify-center w-full h-full rounded-lg bg-cover bg-center relative"
            style={{ backgroundImage: "url('/BackgroundAuth.svg')" }}
          >
            <div className="bg-white/80 shadow-md rounded-2xl p-6 w-110 mx-auto">
              <div className="text-lg min-h-[27px] flex items-center justify-between">
                <div className="flex-1">
                  <Typewriter
                    text={[
                      "Créez votre compte en quelques secondes.",
                      "Rejoignez notre communauté.",
                      "Commencez votre aventure dès maintenant.",
                    ]}
                    speed={30}
                    deleteSpeed={30}
                    delay={2000}
                    loop={true}
                    className="font-medium text-left text-[#1C1C1C] text-[15px]"
                  />
                </div>
                <CircleArrowUp className="ml-4 text-[#1C1C1C] flex-shrink-0" />
              </div>
            </div>
            <img
              src="/ni.svg"
              alt="Newbi Logo"
              className="absolute bottom-2 left-3 w-5 h-auto filter brightness-0 invert"
              style={{ opacity: 0.9 }}
            />
          </div>
        </div>
        <div className="w-1/2 flex items-center justify-center p-32">
          <div className="sm:mx-auto sm:max-w-3xl w-full px-4">
            <h3 className="text-3xl font-semibold text-foreground dark:text-foreground">
              Mot de passe oublié
            </h3>
            <p className="mt-2 text-sm text-muted-foreground dark:text-muted-foreground">
              Entrer votre email pour recevoir un lien de reinitialisation{" "}
              <br /> de mot de passe
            </p>
            <ForgetPasswordForm />
          </div>
        </div>
      </div>
    </main>
  );
}
