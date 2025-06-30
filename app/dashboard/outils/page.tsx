"use client";
import { SectionCards } from "@/src/components/section-cards";
import { Input } from "@/src/components/ui/input";
import { Search } from "lucide-react";

export default function Outils() {
  return (
    <div className="flex flex-col py-4 md:py-6 p-6">
      <div className="w-full">
        {/* <Search />
        <Input name="search" placeholder="Search&hellip;" aria-label="Search" /> */}
        <SectionCards />
      </div>
    </div>
  );
}
