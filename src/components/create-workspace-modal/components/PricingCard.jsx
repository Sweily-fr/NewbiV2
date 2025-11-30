"use client";

import React from "react";
import { CircleCheck } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";

export function PricingCard({
  planKey,
  name,
  monthlyPrice,
  annualPrice,
  annualTotal,
  description,
  features,
  featured = false,
  selected = false,
  isAnnual = false,
  onSelect,
}) {
  const visibleFeatures = features.slice(0, 3);
  const hiddenFeatures = features.slice(3);

  return (
    <div
      className={`flex flex-col rounded-lg border p-6 text-left transition-all ${
        selected
          ? "border-[#5b50fe] shadow-lg ring-2 ring-[#5b50fe]/20 dark:bg-[#252525]"
          : selected !== null
            ? "border-gray-200 dark:border-[#313131]/90 opacity-50 dark:bg-[#252525]"
            : featured
              ? "border-[#5b50fe] shadow-lg ring-1 ring-[#5b50fe]/10 dark:bg-[#252525]"
              : "border-gray-200 dark:border-[#313131]/90 dark:bg-[#252525]"
      }`}
    >
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2">
          <Badge
            variant={featured ? "default" : "secondary"}
            className={featured ? "bg-[#5b50fe] text-xs" : "text-xs"}
          >
            <span className="font-normal">{name}</span>
          </Badge>
          {featured && (
            <span className="rounded-full bg-[#5b50fe]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#5b50fe]">
              Le plus populaire
            </span>
          )}
        </div>
        <h4 className="mb-1 mt-3 text-xl font-medium text-[#5b50fe]">
          {isAnnual ? annualPrice : monthlyPrice}
        </h4>
        {isAnnual && (
          <p className="text-[10px] text-muted-foreground">
            {annualTotal} facturé annuellement
          </p>
        )}
        <p className="text-[10px] text-muted-foreground">{description}</p>
      </div>

      {/* Divider */}
      <div className="my-3 border-t border-gray-200 dark:border-[#313131]/90" />

      {/* Features */}
      <ul className="space-y-2 mb-4 flex-grow">
        {visibleFeatures.map((feature, index) => (
          <li key={index} className="flex items-center text-xs">
            <CircleCheck className="mr-2 h-4 w-4 text-[#5b50fe] flex-shrink-0" />
            <span className="text-muted-foreground">{feature}</span>
          </li>
        ))}
        {hiddenFeatures.length > 0 && (
          <li className="flex items-center text-xs">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="flex items-center text-[#5b50fe] hover:text-[#4a3fe8] transition-colors">
                    <CircleCheck className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="font-medium">
                      Et {hiddenFeatures.length} autres...
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs p-3">
                  <ul className="space-y-1.5">
                    {hiddenFeatures.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-xs">
                        <CircleCheck className="mr-2 h-3 w-3 text-[#5b50fe] flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </li>
        )}
      </ul>

      {/* Button */}
      <div className="mt-auto pt-2">
        <Button
          size="sm"
          className={`w-full h-9 text-sm ${
            featured ? "bg-[#5b50fe] hover:bg-[#4a3fe8]" : ""
          }`}
          variant={featured ? "default" : "secondary"}
          onClick={() => onSelect(planKey)}
        >
          Choisir {name}
        </Button>
      </div>
    </div>
  );
}
