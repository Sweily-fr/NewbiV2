"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/src/lib/auth-client";
import { Loader2, X, AlertTriangle, UserPlus } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card, CardContent } from "@/src/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useTheme } from "@/src/components/theme-provider";
import { cn } from "@/src/lib/utils";
import { useOrganizationInvitations } from "@/src/hooks/useOrganizationInvitations";
import { toast } from "@/src/components/ui/sonner";

const successSteps = ["welcome", "invite", "theme"];

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState("welcome");
  const [isAnimating, setIsAnimating] = useState(false);
  const hasStartedRef = useRef(false);
  const { theme, setTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(theme || "light");

  // Invite state
  const [inviteEmails, setInviteEmails] = useState([]);
  const [inviteInput, setInviteInput] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [isSendingInvites, setIsSendingInvites] = useState(false);
  const inviteInputRef = useRef(null);
  const { inviteMember } = useOrganizationInvitations();

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const addInviteEmail = (value) => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed || inviteEmails.includes(trimmed)) {
      setInviteInput("");
      return;
    }
    setInviteEmails((prev) => [...prev, trimmed]);
    setInviteInput("");
  };

  const removeInviteEmail = (index) => {
    setInviteEmails((prev) => prev.filter((_, i) => i !== index));
  };

  const handleInviteKeyDown = (e) => {
    if (["Enter", ",", "Tab", " "].includes(e.key)) {
      e.preventDefault();
      if (inviteInput.trim()) addInviteEmail(inviteInput);
    } else if (
      e.key === "Backspace" &&
      !inviteInput &&
      inviteEmails.length > 0
    ) {
      removeInviteEmail(inviteEmails.length - 1);
    }
  };

  const handleInvitePaste = (e) => {
    e.preventDefault();
    const emails = e.clipboardData
      .getData("text")
      .split(/[,;\s\n]+/)
      .filter(Boolean);
    const newEmails = emails
      .map((em) => em.trim().toLowerCase())
      .filter((em) => em && !inviteEmails.includes(em));
    if (newEmails.length > 0)
      setInviteEmails((prev) => [...prev, ...newEmails]);
    setInviteInput("");
  };

  const handleSendInvites = async () => {
    if (inviteInput.trim()) addInviteEmail(inviteInput);
    const validEmails = inviteEmails.filter((em) => EMAIL_REGEX.test(em));
    if (validEmails.length > 0) {
      setIsSendingInvites(true);
      try {
        for (const email of validEmails) {
          await inviteMember({ email, role: inviteRole });
        }
        toast.success(
          `${validEmails.length} invitation${validEmails.length > 1 ? "s" : ""} envoyée${validEmails.length > 1 ? "s" : ""}`,
        );
      } catch {
        toast.error("Erreur lors de l'envoi des invitations");
      }
      setIsSendingInvites(false);
    }
    switchStep("theme");
  };

  const currentDotIndex = successSteps.indexOf(step);

  const switchStep = (next) => {
    setIsAnimating(true);
    setTimeout(() => {
      setStep(next);
      setTimeout(() => setIsAnimating(false), 20);
    }, 150);
  };

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const completeOnboarding = async () => {
      if (!sessionId) {
        setReady(true);
        return;
      }

      const maxAttempts = 15;
      for (let i = 0; i < maxAttempts; i++) {
        try {
          const res = await fetch(
            `/api/verify-checkout-session?session_id=${sessionId}`,
          );
          const data = await res.json();

          if (data.success) {
            // Refresh client session & set the newly created org as active.
            // The Stripe webhook updated sessions in DB but the client still
            // has the old (org-less) session in memory. Without this refresh,
            // the invite step fails with "Aucune organisation trouvée".
            try {
              await authClient.getSession({
                fetchOptions: { cache: "no-store" },
              });
              const { data: orgs } = await authClient.organization.list();
              if (orgs?.length > 0) {
                await authClient.organization.setActive({
                  organizationId: orgs[0].id,
                });
              }
            } catch {}
            setReady(true);
            return;
          }
        } catch {}

        await new Promise((r) => setTimeout(r, 2000));
      }

      setError(
        "Le traitement prend plus de temps que prévu. Veuillez réessayer.",
      );
    };

    completeOnboarding();
  }, [sessionId]);

  const handleGoToDashboard = async () => {
    // Apply selected theme
    setTheme(selectedTheme);

    localStorage.removeItem("active_organization_id");
    localStorage.removeItem("user_role");

    try {
      const { data: organizations } = await authClient.organization.list();
      if (organizations?.length > 0) {
        await authClient.organization.setActive({
          organizationId: organizations[0].id,
        });
      }
    } catch {}

    router.push("/dashboard?welcome=true");
  };

  if (error) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center px-6 bg-background">
        <p className="text-[13px] text-muted-foreground mb-4">{error}</p>
        <Button
          onClick={() => window.location.reload()}
          className="h-9 px-8 bg-[#5A50FF]/90 hover:bg-[#5A50FF] text-white cursor-pointer border-0 [box-shadow:none] rounded-lg"
        >
          Réessayer
        </Button>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center px-4 md:px-6 bg-background">
      {!ready ? (
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      ) : (
        <div
          className="flex flex-col items-center w-full transition-all duration-200 ease-in-out"
          style={{
            opacity: isAnimating ? 0 : 1,
            transform: isAnimating ? "scale(0.97)" : "scale(1)",
          }}
        >
          {/* ─── Step: Welcome ─── */}
          {step === "welcome" && (
            <div className="flex flex-col items-center">
              <img
                src="/newbi-icon.png"
                alt="Newbi"
                className="h-16 w-16 rounded-2xl mb-8"
              />
              <h1
                className="text-3xl md:text-5xl font-medium mb-3 text-center"
                style={{ color: "var(--foreground)" }}
              >
                Bienvenue sur Newbi
              </h1>
              <p className="text-[15px] text-muted-foreground text-center max-w-[420px] mb-8 leading-relaxed">
                Newbi est votre outil de gestion tout-en-un pour piloter votre
                facturation, votre trésorerie et votre activité.
              </p>
              <Button
                onClick={() => switchStep("invite")}
                className="h-11 w-full max-w-[320px] bg-[#5A50FF]/90 hover:bg-[#5A50FF] text-white cursor-pointer border-0 [box-shadow:none] rounded-lg text-[14px]"
              >
                Commencer
              </Button>
            </div>
          )}

          {/* ─── Step: Invite team ─── */}
          {step === "invite" && (
            <div className="flex flex-col items-center w-full">
              <h1
                className="text-xl font-medium mb-2"
                style={{ color: "var(--foreground)" }}
              >
                Invitez votre équipe
              </h1>
              <p className="text-[13px] text-muted-foreground text-center mb-8 max-w-[380px]">
                Plus votre équipe utilise Newbi, plus il devient puissant.
              </p>

              <Card className="border-border bg-background shadow-sm w-full max-w-[640px]">
                <CardContent className="px-6 py-0 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[13px] text-muted-foreground">
                      Envoyer l'invitation à ...
                    </Label>
                    <div
                      onClick={() => inviteInputRef.current?.focus()}
                      className="min-h-[90px] max-h-[160px] overflow-y-auto rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 cursor-text"
                    >
                      <div className="flex flex-wrap gap-1.5">
                        {inviteEmails.map((email, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 rounded-md bg-secondary/80 border border-border/50 px-2.5 py-1 text-sm"
                          >
                            {!EMAIL_REGEX.test(email) && (
                              <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
                            )}
                            <span className="truncate max-w-[200px]">
                              {email}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeInviteEmail(index);
                              }}
                              className="ml-0.5 rounded-sm hover:bg-muted-foreground/20 p-0.5 shrink-0"
                            >
                              <X className="size-3" />
                            </button>
                          </span>
                        ))}
                        <input
                          ref={inviteInputRef}
                          type="text"
                          value={inviteInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.endsWith(",") || val.endsWith(";")) {
                              const em = val.slice(0, -1).trim();
                              if (em) addInviteEmail(em);
                            } else setInviteInput(val);
                          }}
                          onKeyDown={handleInviteKeyDown}
                          onPaste={handleInvitePaste}
                          onBlur={() => {
                            if (inviteInput.trim()) addInviteEmail(inviteInput);
                          }}
                          placeholder={
                            inviteEmails.length === 0 ? "exemple@email.com" : ""
                          }
                          className="flex-1 min-w-[180px] bg-transparent outline-none placeholder:text-muted-foreground py-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[13px] text-muted-foreground">
                      Inviter en tant que
                    </Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger className="w-full rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrateur</SelectItem>
                        <SelectItem value="member">Membre</SelectItem>
                        <SelectItem value="viewer">Lecteur</SelectItem>
                        <SelectItem value="accountant">Comptable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col items-center mt-6">
                <Button
                  onClick={handleSendInvites}
                  disabled={isSendingInvites}
                  className="h-9 px-16 bg-[#5A50FF]/90 hover:bg-[#5A50FF] text-white cursor-pointer border-0 [box-shadow:none] rounded-lg"
                >
                  {isSendingInvites ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Continuer"
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => switchStep("theme")}
                  className="text-[13px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer mt-8"
                >
                  Passer cette étape
                </button>
              </div>
            </div>
          )}

          {/* ─── Step: Theme picker ─── */}
          {step === "theme" && (
            <div className="flex flex-col items-center">
              <h1
                className="text-xl font-medium mb-2"
                style={{ color: "var(--foreground)" }}
              >
                Choisissez votre style
              </h1>
              <p className="text-[13px] text-muted-foreground text-center mb-8">
                Vous pourrez le modifier à tout moment dans les paramètres.
              </p>

              {/* Theme cards */}
              <div className="flex gap-3 md:gap-5 mb-8 w-full max-w-[580px] px-2 md:px-0">
                {/* Light */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTheme("light");
                    setTheme("light");
                  }}
                  className={cn(
                    "flex flex-col items-center rounded-2xl p-5 md:p-8 pb-4 md:pb-5 transition-all cursor-pointer flex-1 md:flex-none md:w-[280px]",
                    selectedTheme === "light"
                      ? "bg-muted"
                      : "bg-muted/50 hover:bg-muted",
                  )}
                >
                  <div
                    className={cn(
                      "w-full rounded-lg overflow-hidden mb-4 shadow-md transition-all",
                      selectedTheme === "light" &&
                        "ring-1 ring-[#5A50FF] ring-offset-2 ring-offset-muted",
                    )}
                  >
                    <div className="bg-white p-2.5">
                      {/* Mini app preview — light */}
                      <div className="flex gap-2">
                        <div className="w-[60px] shrink-0 space-y-1.5 pt-1">
                          <div className="w-4 h-4 rounded bg-[#5A50FF]/20 mb-2" />
                          <div className="w-full h-1.5 bg-[#e8e8ea] rounded" />
                          <div className="w-4/5 h-1.5 bg-[#e8e8ea] rounded" />
                          <div className="w-full h-1.5 bg-[#e8e8ea] rounded" />
                          <div className="w-3/5 h-1.5 bg-[#e8e8ea] rounded" />
                          <div className="w-full h-1.5 bg-[#e8e8ea] rounded" />
                        </div>
                        <div className="flex-1 border-l border-[#eee] pl-2 space-y-1.5 pt-1">
                          <div className="w-full h-1.5 bg-[#f0f0f0] rounded" />
                          <div className="w-full h-1.5 bg-[#f0f0f0] rounded" />
                          <div className="w-4/5 h-1.5 bg-[#f0f0f0] rounded" />
                          <div className="w-full h-1.5 bg-[#f0f0f0] rounded" />
                          <div className="w-3/4 h-1.5 bg-[#f0f0f0] rounded" />
                          <div className="w-full h-1.5 bg-[#f0f0f0] rounded" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="text-[14px] font-medium text-foreground">
                    Clair
                  </span>
                </button>

                {/* Dark */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTheme("dark");
                    setTheme("dark");
                  }}
                  className={cn(
                    "flex flex-col items-center rounded-2xl p-5 md:p-8 pb-4 md:pb-5 transition-all cursor-pointer flex-1 md:flex-none md:w-[280px]",
                    selectedTheme === "dark"
                      ? "bg-[#f0f0f0]"
                      : "bg-[#f6f6f7] hover:bg-[#f0f0f0]",
                  )}
                >
                  <div
                    className={cn(
                      "w-full rounded-lg overflow-hidden mb-4 shadow-md transition-all",
                      selectedTheme === "dark" &&
                        "ring-1 ring-[#5A50FF] ring-offset-2 ring-offset-muted",
                    )}
                  >
                    <div className="bg-[#1a1a1a] p-2.5">
                      {/* Mini app preview — dark */}
                      <div className="flex gap-2">
                        <div className="w-[60px] shrink-0 space-y-1.5 pt-1">
                          <div className="w-4 h-4 rounded bg-[#5A50FF]/40 mb-2" />
                          <div className="w-full h-1.5 bg-[#2a2a2a] rounded" />
                          <div className="w-4/5 h-1.5 bg-[#2a2a2a] rounded" />
                          <div className="w-full h-1.5 bg-[#2a2a2a] rounded" />
                          <div className="w-3/5 h-1.5 bg-[#2a2a2a] rounded" />
                          <div className="w-full h-1.5 bg-[#2a2a2a] rounded" />
                        </div>
                        <div className="flex-1 border-l border-[#2a2a2a] pl-2 space-y-1.5 pt-1">
                          <div className="w-full h-1.5 bg-[#252525] rounded" />
                          <div className="w-full h-1.5 bg-[#252525] rounded" />
                          <div className="w-4/5 h-1.5 bg-[#252525] rounded" />
                          <div className="w-full h-1.5 bg-[#252525] rounded" />
                          <div className="w-3/4 h-1.5 bg-[#252525] rounded" />
                          <div className="w-full h-1.5 bg-[#252525] rounded" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="text-[14px] font-medium text-foreground">
                    Sombre
                  </span>
                </button>
              </div>

              <Button
                onClick={handleGoToDashboard}
                className="h-11 w-full max-w-[320px] bg-[#5A50FF]/90 hover:bg-[#5A50FF] text-white cursor-pointer border-0 [box-shadow:none] rounded-lg text-[14px]"
              >
                Continuer
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Dots */}
      {ready && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
          {successSteps.map((s, i) => (
            <button
              key={s}
              type="button"
              disabled={i >= currentDotIndex}
              onClick={() => {
                if (i < currentDotIndex) switchStep(s);
              }}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === currentDotIndex
                  ? "bg-foreground/70"
                  : i < currentDotIndex
                    ? "bg-foreground/30 cursor-pointer hover:bg-foreground/50"
                    : "bg-foreground/15"
              }`}
            />
          ))}
        </div>
      )}
    </main>
  );
}

export default function OnboardingSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[100dvh] items-center justify-center bg-background">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
