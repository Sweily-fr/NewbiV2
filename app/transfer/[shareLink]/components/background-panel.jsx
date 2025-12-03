"use client";

import { Typewriter } from "@/src/components/ui/typewriter-text";
import { CircleArrowUp } from "lucide-react";

export function BackgroundPanel({ backgroundImage }) {
  return (
    <div className="hidden lg:flex w-1/2 p-3 items-center min-h-screen justify-center">
      <div
        className="flex p-6 items-center justify-center w-full h-full rounded-lg bg-cover bg-center relative"
        style={{ backgroundImage: `url('${backgroundImage}')` }}
      >
        <div className="bg-white/80 shadow-md rounded-2xl p-6 w-110 mx-auto">
          <div className="text-lg min-h-[27px] flex items-center justify-between">
            <div className="flex-1">
              <Typewriter
                text={[
                  "Téléchargez vos fichiers en toute sécurité.",
                  "Partagez facilement avec vos collaborateurs.",
                  "Accédez à vos documents où que vous soyez.",
                ]}
                speed={20}
                deleteSpeed={15}
                delay={800}
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
          className="absolute bottom-2 right-3 w-5 h-auto filter brightness-0 invert"
          style={{ opacity: 0.9 }}
        />
      </div>
    </div>
  );
}
