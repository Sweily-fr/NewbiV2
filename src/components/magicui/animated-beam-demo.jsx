"use client";
import React, { forwardRef, useRef, useEffect, useId, useState } from "react";
import { cn } from "@/src/lib/utils";
import { AnimatedBeam } from "@/src/components/magicui/animated-beam";
import { motion } from "framer-motion";

const RectangularBeam = ({
  containerRef,
  fromRef,
  toRef,
  duration = 3,
  delay = 0,
  pathColor = "#ffffff",
  pathWidth = 2,
  pathOpacity = 0.3,
  gradientStartColor = "#3b82f6",
  gradientStopColor = "#8b5cf6",
}) => {
  const id = useId();
  const [pathD, setPathD] = useState("");
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updatePath = () => {
      if (containerRef.current && fromRef.current && toRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const rectA = fromRef.current.getBoundingClientRect();
        const rectB = toRef.current.getBoundingClientRect();

        const svgWidth = containerRect.width;
        const svgHeight = containerRect.height;
        setSvgDimensions({ width: svgWidth, height: svgHeight });

        const startX = rectA.left - containerRect.left + rectA.width / 2;
        const startY = rectA.top - containerRect.top + rectA.height / 2;
        const endX = rectB.left - containerRect.left + rectB.width / 2;
        const endY = rectB.top - containerRect.top + rectB.height / 2;

        // Créer des chemins de circuit électronique avec voies séparées - comme un vrai PCB
        const centerRadius = 24; // Rayon approximatif du cercle central
        let d;

        // Déterminer le point d'arrivée et créer des voies séparées pour chaque connexion
        let targetX, targetY;

        if (startX < endX - 50) {
          // Nœud à gauche (User) → voie gauche avec offset vertical
          targetX = endX - centerRadius;
          targetY = endY;
          const offsetY = startY < endY ? -20 : 20; // Offset pour éviter les autres voies
          d = `M ${startX},${startY} L ${startX + 40},${startY} L ${startX + 40},${endY + offsetY} L ${targetX - 20},${endY + offsetY} L ${targetX - 20},${targetY} L ${targetX},${targetY}`;
        } else if (startX > endX + 50) {
          // Nœud à droite (OpenAI) → voie droite avec offset vertical
          targetX = endX + centerRadius;
          targetY = endY;
          const offsetY = startY < endY ? -15 : 15;
          d = `M ${startX},${startY} L ${startX - 40},${startY} L ${startX - 40},${endY + offsetY} L ${targetX + 20},${endY + offsetY} L ${targetX + 20},${targetY} L ${targetX},${targetY}`;
        } else if (startY > endY + 50) {
          // Nœud en bas gauche (Server) → voie bas-gauche
          targetX = endX - centerRadius * 0.7;
          targetY = endY + centerRadius * 0.7;
          d = `M ${startX},${startY} L ${startX},${startY - 30} L ${startX - 25},${startY - 30} L ${startX - 25},${targetY + 15} L ${targetX - 10},${targetY + 15} L ${targetX},${targetY}`;
        } else if (startY > endY + 50) {
          // Nœud en bas droite (Cloud) → voie bas-droite
          targetX = endX + centerRadius * 0.7;
          targetY = endY + centerRadius * 0.7;
          d = `M ${startX},${startY} L ${startX},${startY - 30} L ${startX + 25},${startY - 30} L ${startX + 25},${targetY + 15} L ${targetX + 10},${targetY + 15} L ${targetX},${targetY}`;
        } else {
          // Fallback - connexion directe avec angle droit
          targetX = endX;
          targetY = endY - centerRadius;
          d = `M ${startX},${startY} L ${startX},${targetY - 30} L ${targetX},${targetY - 30} L ${targetX},${targetY}`;
        }
        setPathD(d);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      updatePath();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    updatePath();

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef, fromRef, toRef]);

  return (
    <svg
      fill="none"
      width={svgDimensions.width}
      height={svgDimensions.height}
      xmlns="http://www.w3.org/2000/svg"
      className="pointer-events-none absolute left-0 top-0 transform-gpu"
      viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
    >
      <path
        d={pathD}
        stroke={pathColor}
        strokeWidth={pathWidth}
        strokeOpacity={pathOpacity}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d={pathD}
        strokeWidth={pathWidth}
        stroke={`url(#${id})`}
        strokeOpacity="1"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <defs>
        <motion.linearGradient
          id={id}
          gradientUnits="userSpaceOnUse"
          initial={{
            x1: "0%",
            x2: "0%",
            y1: "0%",
            y2: "0%",
          }}
          animate={{
            x1: ["10%", "110%"],
            x2: ["0%", "100%"],
            y1: ["0%", "0%"],
            y2: ["0%", "0%"],
          }}
          transition={{
            delay,
            duration,
            ease: [0.16, 1, 0.3, 1],
            repeat: Infinity,
            repeatDelay: 10 - duration - delay, // Cycle plus lent pour une animation plus douce
          }}
        >
          <stop stopColor={gradientStartColor} stopOpacity="0"></stop>
          <stop stopColor={gradientStartColor}></stop>
          <stop offset="32.5%" stopColor={gradientStopColor}></stop>
          <stop
            offset="100%"
            stopColor={gradientStopColor}
            stopOpacity="0"
          ></stop>
        </motion.linearGradient>
      </defs>
    </svg>
  );
};

const Circle = forwardRef(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
        className
      )}
    >
      {children}
    </div>
  );
});
Circle.displayName = "Circle";

export default function AnimatedBeamDemo() {
  const containerRef = useRef(null);
  const div1Ref = useRef(null); // User
  const div2Ref = useRef(null); // OpenAI
  const div3Ref = useRef(null); // Server
  const div4Ref = useRef(null); // Cloud
  const div5Ref = useRef(null); // Database (centre)

  return (
    <div
      className="relative flex w-full max-w-[550px] items-center justify-center overflow-hidden p-10"
      ref={containerRef}
    >
      <div className="flex size-full flex-col items-stretch justify-between gap-20">
        <div className="flex flex-row justify-between">
          <Circle ref={div1Ref}>
            <Icons.user />
          </Circle>
          <Circle ref={div2Ref}>
            <Icons.openai />
          </Circle>
        </div>
        <div className="flex flex-row items-center justify-center">
          <Circle ref={div5Ref} className="bg-white">
            <img src="/ni.svg" alt="Newbi Logo" className="w-6 h-6" />
          </Circle>
        </div>
        <div className="flex flex-row justify-between">
          <Circle ref={div3Ref}>
            <Icons.server />
          </Circle>
          <Circle ref={div4Ref}>
            <Icons.cloud />
          </Circle>
        </div>
      </div>

      {/* Connexions en étoile - tous les nœuds connectés au centre */}

      {/* User vers Database */}
      <RectangularBeam
        duration={8}
        delay={0}
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div5Ref}
        pathColor="#ffffff"
        pathWidth={2}
        pathOpacity={0.3}
        gradientStartColor="#3b82f6"
        gradientStopColor="#8b5cf6"
      />

      {/* OpenAI vers Database */}
      <RectangularBeam
        duration={8}
        delay={1.5}
        containerRef={containerRef}
        fromRef={div2Ref}
        toRef={div5Ref}
        pathColor="#ffffff"
        pathWidth={2}
        pathOpacity={0.3}
        gradientStartColor="#10b981"
        gradientStopColor="#3b82f6"
      />

      {/* Server vers Database */}
      <RectangularBeam
        duration={8}
        delay={3}
        containerRef={containerRef}
        fromRef={div3Ref}
        toRef={div5Ref}
        pathColor="#ffffff"
        pathWidth={2}
        pathOpacity={0.3}
        gradientStartColor="#f59e0b"
        gradientStopColor="#10b981"
      />

      {/* Cloud vers Database */}
      <RectangularBeam
        duration={8}
        delay={4.5}
        containerRef={containerRef}
        fromRef={div4Ref}
        toRef={div5Ref}
        pathColor="#ffffff"
        pathWidth={2}
        pathOpacity={0.3}
        gradientStartColor="#ec4899"
        gradientStopColor="#f59e0b"
      />
    </div>
  );
}

const Icons = {
  openai: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
    >
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
    </svg>
  ),
  user: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  database: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
    </svg>
  ),
  server: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
      <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
      <line x1="6" x2="6.01" y1="6" y2="6" />
      <line x1="6" x2="6.01" y1="18" y2="18" />
    </svg>
  ),
  cloud: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </svg>
  ),
};
