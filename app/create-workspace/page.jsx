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
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState("");
  const [companyData, setCompanyData] = useState(null);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isAnnual, setIsAnnual] = useState(false);
  const [emails, setEmails] = useState(["", ""]);

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
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col">
      {/* Progress bar */}
      <div className="w-full h-0.5 bg-[#FDFDFD]">
        <div className="h-full bg-[#242529] transition-all duration-500" style={{ width: progressWidth }} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
      <img src="/newbiLetter.png" alt="Newbi" className="h-6 mb-6" />
      <div className="relative w-full max-w-6xl h-[85vh] rounded-3xl border border-[#EEEFF1] bg-white overflow-hidden">
        {/* Back button */}
        <button
          onClick={handleBack}
          className="absolute top-4 left-4 z-10 flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[#F5F5F5] transition-colors cursor-pointer"
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
              emails={emails}
              setEmails={setEmails}
              onContinue={() => setStep(4)}
              onSkip={() => setStep(4)}
            />
          ) : (
            <ConfirmationForm
              companyName={companyName}
              companyData={companyData}
              selectedPlan={selectedPlan}
              isAnnual={isAnnual}
              emails={emails}
            />
          )}

          {/* Right side — Unified preview */}
          <div className="hidden lg:block bg-[#FBFBFB] border-l border-[#EEEFF1] rounded-r-3xl overflow-hidden">
            <WorkspacePreview
              step={step}
              isNameFocused={isNameFocused}
              companyName={companyName}
              emails={emails}
              selectedPlan={selectedPlan}
            />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
