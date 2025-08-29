"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Blog() {
  const router = useRouter();

  useEffect(() => {
    // Redirection immédiate vers la page d'accueil
    router.replace("/");
  }, [router]);

  // Affichage temporaire pendant la redirection
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-gray-600">Redirection en cours...</p>
      </div>
    </div>
  );
}
