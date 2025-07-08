"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/src/lib/utils";

export const LogoMarquee = ({ 
  logos = [], 
  className,
  direction = "left",
  speed = 25,
  pauseOnHover = true
}) => {
  return (
    <div className={cn("w-full overflow-hidden py-6", className)}>
      <motion.div
        className="flex items-center gap-8"
        animate={{
          x: direction === "left" ? [0, -1000] : [-1000, 0]
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: speed,
            ease: "linear",
          }
        }}
        whileHover={pauseOnHover ? { animationPlayState: "paused" } : {}}
      >
        {logos.map((logo, index) => (
          <div key={index} className="flex items-center justify-center px-6">
            {logo}
          </div>
        ))}
        {logos.map((logo, index) => (
          <div key={`repeat-${index}`} className="flex items-center justify-center px-6">
            {logo}
          </div>
        ))}
      </motion.div>
    </div>
  );
};
