"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { authClient } from "@/src/lib/auth-client";
import { WorkspaceForm } from "@/src/components/create-workspace/workspace-form";
import { WorkspacePreview } from "@/src/components/create-workspace/workspace-preview";
import { PlanForm } from "@/src/components/create-workspace/plan-form";
import { InviteForm } from "@/src/components/create-workspace/invite-form";
import { ConfirmationForm } from "@/src/components/create-workspace/confirmation-form";

export default function CreateWorkspacePage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  // Restore from sessionStorage on mount
  const STORAGE_KEY = "create-workspace-data";
  const getSavedState = () => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  };
  const savedState = typeof window !== "undefined" ? getSavedState() : null;

  const [step, setStep] = useState(savedState?.step || 1);
  const [companyName, setCompanyName] = useState(savedState?.companyName || "");
  const [companyData, setCompanyData] = useState(savedState?.companyData || null);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(savedState?.selectedPlan || null);
  const [isAnnual, setIsAnnual] = useState(savedState?.isAnnual ?? true);
  const [members, setMembers] = useState(savedState?.members || [{ email: "", role: "member" }, { email: "", role: "member" }]);
  const [logoUrl, setLogoUrl] = useState(savedState?.logoUrl || null);

  // Persist form state to sessionStorage on change
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        step, companyName, companyData, selectedPlan, isAnnual, members, logoUrl,
      }));
    } catch { /* ignore quota errors */ }
  }, [step, companyName, companyData, selectedPlan, isAnnual, members, logoUrl]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth/login");
    }
  }, [isPending, session, router]);

  // Show nothing while checking auth
  if (isPending || !session) {
    return null;
  }

  const progressWidth =
    step === 1 ? "25%" : step === 2 ? "50%" : step === 3 ? "75%" : "100%";

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="w-full h-0.5 bg-background">
        <div className="h-full bg-foreground transition-all duration-500" style={{ width: progressWidth }} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
      <img src="/newbiLetter.png" alt="Newbi" className="h-6 mb-6 dark:invert" />
      <div className="relative w-full max-w-6xl h-[85vh] rounded-3xl border border-border bg-card overflow-hidden">
        {/* Back button */}
        <button
          onClick={handleBack}
          className="absolute top-4 left-4 z-10 flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
          {/* Left side — Form */}
          {step === 1 ? (
            <WorkspaceForm
              companyName={companyName}
              setCompanyName={setCompanyName}
              setCompanyData={setCompanyData}
              logoUrl={logoUrl}
              setLogoUrl={setLogoUrl}
              onNameFocus={() => setIsNameFocused(true)}
              onNameBlur={() => setIsNameFocused(false)}
              onContinue={() => setStep(2)}
            />
          ) : step === 2 ? (
            <PlanForm
              selectedPlan={selectedPlan}
              setSelectedPlan={setSelectedPlan}
              isAnnual={isAnnual}
              setIsAnnual={setIsAnnual}
              onContinue={() => setStep(3)}
            />
          ) : step === 3 ? (
            <InviteForm
              members={members}
              setMembers={setMembers}
              selectedPlan={selectedPlan}
              onContinue={() => setStep(4)}
              onSkip={() => setStep(4)}
            />
          ) : (
            <ConfirmationForm
              companyName={companyName}
              companyData={companyData}
              selectedPlan={selectedPlan}
              isAnnual={isAnnual}
              members={members}
              logoUrl={logoUrl}
            />
          )}

          {/* Right side — Unified preview */}
          <div className="hidden lg:block bg-muted border-l border-border rounded-r-3xl overflow-hidden">
            <WorkspacePreview
              step={step}
              isNameFocused={isNameFocused}
              companyName={companyName}
              members={members}
              selectedPlan={selectedPlan}
              logoUrl={logoUrl}
            />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
