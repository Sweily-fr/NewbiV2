"use client";

import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { CheckCircleIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export function SubscriptionStatus({ variant = "badge", className = "" }) {
  const router = useRouter();
  const { loading } = useSubscription();

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-6 w-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // Version badge simple
  if (variant === "badge") {
    return (
      <Badge
        variant="outline"
        className={`bg-green-50 text-green-600 border-green-200 ${className}`}
      >
        <CheckCircleIcon className="w-3 h-3 mr-1" />
        Pro
      </Badge>
    );
  }

  // Version détaillée avec bouton
  if (variant === "detailed") {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <Badge
          variant="outline"
          className="bg-green-50 text-green-600 border-green-200"
        >
          <CheckCircleIcon className="w-3 h-3 mr-1" />
          Plan Pro
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard")}
        >
          Gérer
        </Button>
      </div>
    );
  }

  return null;
}
