"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export default function AuthLayout({ children }) {
  return (
    <div className="auth-layout relative">
      <Link href="/">
        <Button
          variant="outline"
          size="sm"
          className="absolute top-4 left-4 z-10 gap-2 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Retour</span>
        </Button>
      </Link>
      {children}
    </div>
  );
}
