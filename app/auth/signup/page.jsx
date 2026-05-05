"use client";

import * as React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
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
import { signIn } from "../../../src/lib/auth-client";
import RegisterForm from "./registerForm";
import Link from "next/link";
import { toast } from "@/src/components/ui/sonner";
import SEOHead from "@/src/components/seo/seo-head";
import { JsonLd } from "@/src/components/seo/seo-metadata";
import { useAuthSEO } from "@/src/hooks/use-seo";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Building2,
  MapPin,
  Loader2,
  AlertCircle,
  Check,
  Gift,
  X,
  AlertTriangle,
} from "lucide-react";
import { useSession, performLogout } from "@/src/lib/auth-client";
import { getOnboardingStep, parseOnboardingData } from "@/src/lib/onboarding";

const GoogleIcon = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      fill="currentColor"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="currentColor"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="currentColor"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="currentColor"
    />
  </svg>
);

// Views: "signup" → "email" → "workspace"
export default function SignUpPage() {
  const seoData = {
    ...useAuthSEO("signup"),
    robots: "noindex,nofollow",
  };

  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const userEmail = session?.user?.email;

  // View is derived from session state — no localStorage dependency
  // "null" means "not yet determined" (session still loading)
  const [view, setView] = useState(null);
  const [sessionHydrated, setSessionHydrated] = useState(false);

  // Determine the initial view once the session resolves
  useEffect(() => {
    if (sessionPending) return;

    // Already hydrated — don't override user navigation
    if (sessionHydrated) return;

    if (!session?.user) {
      // Not authenticated → show signup form
      setView("signup");
    } else {
      const step = getOnboardingStep(session.user);
      if (step === "completed") {
        // Onboarding done — shouldn't be on this page, redirect to dashboard
        router.replace("/dashboard");
        return;
      }
      // Authenticated with incomplete onboarding → resume at the right step
      setView(step);
    }
    setSessionHydrated(true);
  }, [sessionPending, session, sessionHydrated, router]);

  const [isAnnual, setIsAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [inviteEmails, setInviteEmails] = useState([]);
  const [inviteInput, setInviteInput] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const inviteInputRef = useRef(null);

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
    if (
      e.key === "Enter" ||
      e.key === "," ||
      e.key === "Tab" ||
      e.key === " "
    ) {
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
    const pasted = e.clipboardData.getData("text");
    const emails = pasted.split(/[,;\s\n]+/).filter(Boolean);
    const newEmails = emails
      .map((em) => em.trim().toLowerCase())
      .filter((em) => em && !inviteEmails.includes(em));
    if (newEmails.length > 0)
      setInviteEmails((prev) => [...prev, ...newEmails]);
    setInviteInput("");
  };

  const [isAnimating, setIsAnimating] = useState(false);
  const [isSavingStep, setIsSavingStep] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isCheckingSiret, setIsCheckingSiret] = useState(false);
  const [siretError, setSiretError] = useState(null);
  const [billingCountry, setBillingCountry] = useState("FR");
  const contentRef = useRef(null);

  // Persist onboarding step + data to DB via API, then refetch session
  const { refetch: refetchSession } = useSession();
  const updateOnboardingStep = useCallback(
    async (step, data) => {
      setIsSavingStep(true);
      try {
        const res = await fetch("/api/onboarding/step", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ step, data: data || undefined }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error("❌ [ONBOARDING] PATCH failed:", err);
          toast.error("Erreur lors de la sauvegarde, veuillez réessayer");
          return false;
        }
        // Re-sync session so other tabs / next reload see the new step
        await refetchSession();
        return true;
      } catch (error) {
        console.error("❌ [ONBOARDING] Network error:", error);
        toast.error("Erreur de connexion");
        return false;
      } finally {
        setIsSavingStep(false);
      }
    },
    [refetchSession],
  );

  // Hydrate form fields from saved onboardingData when session is ready
  useEffect(() => {
    if (!session?.user) return;
    const saved = parseOnboardingData(session.user.onboardingData);
    if (!saved) return;

    // Restore company data (workspace step)
    if (saved.companyName && !companyData) {
      setCompanyData({
        companyName: saved.companyName,
        siret: saved.siret || "",
        siren: saved.siren || "",
        legalForm: saved.legalForm || "",
        addressStreet: saved.addressStreet || "",
        addressCity: saved.addressCity || "",
        addressZipCode: saved.addressZipCode || "",
        addressCountry: saved.addressCountry || "France",
      });
      setCompanyName(saved.companyName);
      if (saved.billingCountry) setBillingCountry(saved.billingCountry);
    }

    // Restore plan selection (plan step)
    if (saved.selectedPlan && !selectedPlan) {
      setSelectedPlan(saved.selectedPlan);
    }
    if (saved.isAnnual !== undefined) {
      setIsAnnual(saved.isAnnual);
    }
    // Run once when session loads — not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.onboardingData]);

  // Company search debounce
  useEffect(() => {
    if (view !== "workspace" || selectedCompany) return;
    if (!companyName || companyName.length < 3) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      setHasSearched(true);
      try {
        const res = await fetch(
          `/api/search-companies?q=${encodeURIComponent(companyName)}&limite=8`,
          { signal: controller.signal },
        );
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch (err) {
        if (err.name !== "AbortError") setSearchResults([]);
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [companyName, selectedCompany, view]);

  const handleSelectCompany = async (company) => {
    setSiretError(null);
    const siege = company.siege || {};
    const siret = siege.siret || "";
    if (!siret) {
      setSiretError("Cette entreprise n'a pas de numéro SIRET valide.");
      return;
    }
    setIsCheckingSiret(true);
    try {
      const res = await fetch(`/api/check-siret?siret=${siret}`);
      const data = await res.json();
      if (!data.available) {
        setSiretError(
          `${data.message} Demandez une invitation à l'administrateur.`,
        );
        setIsCheckingSiret(false);
        return;
      }
    } catch {}
    setIsCheckingSiret(false);
    setSelectedCompany(company);
    setCompanyName(company.nom_complet || company.nom_raison_sociale || "");
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleCompanyInputChange = (e) => {
    setCompanyName(e.target.value);
    if (selectedCompany) {
      setSelectedCompany(null);
      setSiretError(null);
    }
  };

  const switchView = (nextView) => {
    setIsAnimating(true);
    setTimeout(() => {
      setView(nextView);
      setTimeout(() => setIsAnimating(false), 20);
    }, 150);
  };

  // Called by RegisterForm after successful signup
  // No PATCH needed — user.create hook already set onboardingStep: "workspace"
  const handleSignupSuccess = () => {
    switchView("workspace");
  };

  const FORME_JURIDIQUE_MAP = {
    1000: "Entrepreneur individuel",
    5410: "SARL unipersonnelle",
    5420: "SARL",
    5498: "SARL à associé unique",
    5499: "SARL",
    5510: "SA à conseil d'administration",
    5610: "SAS",
    5699: "SAS",
    5710: "SAS unipersonnelle (SASU)",
    5720: "SASU",
    6521: "SCI",
    9220: "Association déclarée",
  };

  const handleWorkspaceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCompany || isSavingStep) return;
    const siege = selectedCompany.siege || {};
    const newCompanyData = {
      companyName,
      siret: siege.siret || "",
      siren: selectedCompany.siren || "",
      legalForm: FORME_JURIDIQUE_MAP[selectedCompany.nature_juridique] || "",
      addressStreet: siege.adresse || "",
      addressCity: siege.libelle_commune || "",
      addressZipCode: siege.code_postal || "",
      addressCountry: billingCountry === "FR" ? "France" : billingCountry,
    };
    setCompanyData(newCompanyData);

    const ok = await updateOnboardingStep("plan", {
      ...newCompanyData,
      billingCountry,
    });
    if (ok) switchView("plan");
  };

  const handleSelectPlan = async (planKey) => {
    if (isSavingStep) return;
    setSelectedPlan(planKey);

    const ok = await updateOnboardingStep("recap", {
      selectedPlan: planKey,
      isAnnual,
    });
    if (ok) switchView("recap");
  };

  const handlePayment = async () => {
    if (!selectedPlan) return;
    setLoadingPlan(selectedPlan);
    try {
      const response = await fetch("/api/create-org-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationData: {
            name: companyData?.companyName || companyName,
            type: "onboarding",
            planName: selectedPlan,
            isAnnual,
            ...companyData,
          },
        }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Erreur lors de la création de l'abonnement");
        setLoadingPlan(null);
      }
    } catch {
      toast.error("Erreur de connexion");
      setLoadingPlan(null);
    }
  };

  const signInWithProvider = async (provider) => {
    try {
      localStorage.removeItem("user-cache");
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("subscription-")) localStorage.removeItem(key);
      });
    } catch {}

    await signIn.social(
      { provider, callbackURL: "/dashboard" },
      {
        onSuccess: () => {},
        onError: () => {
          toast.error(`Erreur lors de la connexion avec ${provider}`);
        },
      },
    );
  };

  const plans = [
    {
      key: "freelance",
      name: "Freelance",
      monthlyPrice: 17.99,
      annualPrice: 16.19,
      description: "Pour les indépendants",
      features: [
        "1 utilisateur",
        "Facturation & Devis",
        "Relances automatiques",
        "E-signature (3/mois)",
        "Scan OCR (50/mois)",
        "Gestion de trésorerie",
        "CRM client",
        "1 comptable gratuit",
      ],
    },
    {
      key: "pme",
      name: "TPE",
      monthlyPrice: 48.99,
      annualPrice: 44.09,
      featured: true,
      description: "Pour les petites entreprises",
      features: [
        "Jusqu'à 10 utilisateurs",
        "Facturation & Devis",
        "Relances automatiques",
        "E-signature (20/mois)",
        "Scan OCR illimité",
        "Gestion de trésorerie",
        "CRM client",
        "3 comptables gratuits",
        "Support prioritaire",
      ],
    },
    {
      key: "entreprise",
      name: "Entreprise",
      monthlyPrice: 94.99,
      annualPrice: 85.49,
      description: "Pour les grandes structures",
      features: [
        "Jusqu'à 25 utilisateurs",
        "Facturation & Devis",
        "E-signature illimitée",
        "Scan OCR illimité",
        "Gestion de trésorerie",
        "CRM client",
        "5 comptables gratuits",
        "Support prioritaire",
        "Automatisations illimitées",
      ],
    },
  ];

  // ─── Title per view ───
  const titles = {
    signup: "Créez votre compte",
    email: "Quelle est votre adresse email ?",
    workspace: "Créez votre espace de travail",
    plan: "Choisissez votre abonnement",
    recap: "Lancez votre essai gratuit",
  };

  const steps = ["signup", "email", "workspace", "plan", "recap"];
  const dotSteps = ["workspace", "plan", "recap"];
  const currentStepIndex = steps.indexOf(view);
  const currentDotIndex = dotSteps.indexOf(view);
  const showDots = currentDotIndex >= 0;

  // Show nothing while session is loading — prevents flash of signup view
  if (view === null) {
    return (
      <main
        className="flex min-h-[100dvh] items-center justify-center"
        style={{ backgroundColor: "rgb(251, 251, 252)" }}
      >
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <>
      <SEOHead {...seoData} />
      <JsonLd jsonLd={seoData.jsonLd} />
      <main
        className={`relative flex min-h-[100dvh] flex-col items-center px-4 md:px-6 overflow-x-hidden ${view === "plan" ? "justify-start py-16 md:justify-center md:py-0" : "justify-center"}`}
        style={{ backgroundColor: "rgb(251, 251, 252)" }}
      >
        {/* Logo — hidden on workspace/plan views */}
        {view !== "workspace" && view !== "plan" && view !== "recap" && (
          <div className="absolute top-0 left-0 right-0 flex justify-center pt-20 md:pt-46">
            <img
              src="/newbi-icon.png"
              alt="Newbi"
              className="h-10 w-10 rounded-xl"
            />
          </div>
        )}

        {/* Header: logout + email (workspace & plan views) */}
        {(view === "workspace" || view === "plan" || view === "recap") && (
          <>
            <button
              type="button"
              onClick={performLogout}
              className="absolute top-4 left-4 md:top-6 md:left-6 text-[12px] md:text-[13px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Se déconnecter
            </button>
            {userEmail && (
              <div className="absolute top-4 right-4 md:top-6 md:right-6 text-right hidden md:block">
                <p className="text-[11px] text-muted-foreground">
                  Connecté en tant que
                </p>
                <p className="text-[13px] text-foreground">{userEmail}</p>
              </div>
            )}
          </>
        )}

        {/* Animated content */}
        <div
          ref={contentRef}
          className="flex flex-col items-center w-full transition-all duration-200 ease-in-out"
          style={{
            opacity: isAnimating ? 0 : 1,
            transform: isAnimating ? "scale(0.97)" : "scale(1)",
          }}
        >
          {/* Title */}
          <h1
            className={`font-medium text-center ${view === "recap" ? "text-2xl md:text-3xl mb-3" : "text-lg md:text-xl mb-1"}`}
            style={{ color: "#2f2f31" }}
          >
            {titles[view]}
          </h1>

          {/* Subtitle for workspace view */}
          {view === "workspace" && (
            <p className="text-[13px] text-muted-foreground mb-8 text-center max-w-[380px] mx-auto">
              Les espaces de travail sont des environnements partagés où votre
              équipe peut collaborer sur vos projets.
            </p>
          )}

          {view !== "workspace" && view !== "recap" && view !== "plan" && (
            <div className="mb-6" />
          )}

          {/* ─── View: Signup (Google + Email buttons) ─── */}
          {view === "signup" && (
            <div className="w-full max-w-[320px] space-y-4">
              <Button
                className="w-full h-11 bg-[#5A50FF]/90 hover:bg-[#5A50FF] text-white cursor-pointer border-0 [box-shadow:none] rounded-lg"
                onClick={() => signInWithProvider("google")}
              >
                <GoogleIcon className="size-4 mr-2" aria-hidden />
                Continuer avec Google
              </Button>
              <Button
                variant="outline"
                className="w-full h-11 cursor-pointer bg-white rounded-lg"
                onClick={() => switchView("email")}
              >
                Continuer avec l'email
              </Button>
            </div>
          )}

          {/* ─── View: Email form ─── */}
          {view === "email" && (
            <div className="w-full max-w-[320px]">
              <RegisterForm onSuccess={handleSignupSuccess} />
            </div>
          )}

          {/* ─── View: Workspace creation ─── */}
          {view === "workspace" && (
            <form
              onSubmit={handleWorkspaceSubmit}
              className="w-full max-w-[640px]"
            >
              <Card className="border-border bg-white shadow-sm">
                <CardContent className="px-6 py-0 space-y-5">
                  {/* Company search */}
                  <div className="relative space-y-1.5">
                    <Label className="text-[13px] text-muted-foreground">
                      Recherchez votre entreprise
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        value={companyName}
                        onChange={handleCompanyInputChange}
                        placeholder="Nom de l'entreprise, SIRET ou SIREN..."
                        className="h-11 rounded-lg pl-10"
                        autoFocus
                      />
                      {isSearching && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin" />
                      )}
                    </div>

                    {selectedCompany && (
                      <p className="text-[13px] text-muted-foreground mt-2">
                        {selectedCompany.nom_complet ||
                          selectedCompany.nom_raison_sociale}
                        <span className="text-muted-foreground/50"> · </span>
                        <span className="text-muted-foreground/60">
                          {selectedCompany.siren}
                        </span>
                        {selectedCompany.siege?.libelle_commune && (
                          <>
                            <span className="text-muted-foreground/50">
                              {" "}
                              ·{" "}
                            </span>
                            <span className="text-muted-foreground/60">
                              {selectedCompany.siege.libelle_commune}
                            </span>
                          </>
                        )}
                      </p>
                    )}

                    {siretError && (
                      <p className="text-xs mt-1" style={{ color: "#e1243a" }}>
                        {siretError}
                      </p>
                    )}

                    {isCheckingSiret && (
                      <div className="flex items-center gap-2 py-2 mt-1">
                        <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Vérification de l'entreprise...
                        </span>
                      </div>
                    )}

                    {hasSearched && !selectedCompany && !isCheckingSiret && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-border bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="max-h-[240px] overflow-y-auto p-1">
                          {searchResults.length > 0
                            ? searchResults.map((company) => {
                                const siege = company.siege || {};
                                return (
                                  <button
                                    key={company.siren}
                                    type="button"
                                    onClick={() => handleSelectCompany(company)}
                                    disabled={isCheckingSiret}
                                    className="flex w-full flex-col items-start gap-1 rounded-lg p-2.5 text-left text-sm hover:bg-muted/50 cursor-pointer transition-colors"
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <span className="font-medium text-[13px] truncate">
                                        {company.nom_complet ||
                                          company.nom_raison_sociale}
                                      </span>
                                      <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
                                        {company.siren}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                      <MapPin className="size-3 shrink-0" />
                                      <span className="truncate">
                                        {siege.libelle_commune ||
                                          "Adresse non disponible"}
                                        {siege.code_postal &&
                                          ` (${siege.code_postal})`}
                                      </span>
                                    </div>
                                  </button>
                                );
                              })
                            : !isSearching && (
                                <div className="p-4 text-center text-[13px] text-muted-foreground">
                                  Aucune entreprise trouvée
                                </div>
                              )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Workspace URL */}
                  <div className="space-y-1.5">
                    <Label className="text-[13px] text-muted-foreground">
                      Identifiant de l'espace
                    </Label>
                    <Input
                      value={`app.newbi.io/${
                        companyName
                          ?.trim()
                          .toLowerCase()
                          .replace(/[^a-z0-9\s-]/g, "")
                          .replace(/\s+/g, "-")
                          .replace(/-+/g, "-") || "mon-espace"
                      }`}
                      readOnly
                      className="h-11 rounded-lg text-muted-foreground"
                    />
                  </div>

                  {/* Billing country — inline like Linear */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[13px] text-muted-foreground">
                      Pays de facturation
                    </span>
                    <Select
                      value={billingCountry}
                      onValueChange={setBillingCountry}
                    >
                      <SelectTrigger className="h-8 w-auto rounded-lg border-border px-3 text-[13px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FR">France</SelectItem>
                        <SelectItem value="BE">Belgique</SelectItem>
                        <SelectItem value="CH">Suisse</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="LU">Luxembourg</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-center mt-6">
                <Button
                  type="submit"
                  disabled={!selectedCompany || isSavingStep}
                  className="h-9 px-16 bg-[#5A50FF]/90 hover:bg-[#5A50FF] text-white cursor-pointer border-0 [box-shadow:none] rounded-lg disabled:opacity-40"
                >
                  {isSavingStep ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Continuer"
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* ─── View: Plan selection ─── */}
          {view === "plan" && (
            <div className="w-full max-w-3xl mt-12 md:mt-0">
              {/* Subtitle + trial */}
              <p className="text-[13px] text-muted-foreground text-center mb-2">
                30 jours d'essai gratuit, sans engagement
              </p>

              {/* Toggle */}
              <div className="flex justify-center mb-8">
                <div className="flex rounded-full bg-muted p-1">
                  <button
                    type="button"
                    onClick={() => setIsAnnual(false)}
                    className={`relative px-4 py-1.5 text-[13px] font-medium rounded-full transition-colors ${!isAnnual ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    <span className="relative z-10">Mensuel</span>
                    {!isAnnual && (
                      <span className="absolute inset-0 z-0 rounded-full bg-background shadow-sm" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAnnual(true)}
                    className={`relative px-4 py-1.5 text-[13px] font-medium rounded-full transition-colors flex items-center gap-1.5 ${isAnnual ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    <span className="relative z-10">Annuel</span>
                    <span className="relative z-10 text-[11px] bg-[#5A50FF] text-white px-1.5 py-0.5 rounded-full">
                      -10%
                    </span>
                    {isAnnual && (
                      <span className="absolute inset-0 z-0 rounded-full bg-background shadow-sm" />
                    )}
                  </button>
                </div>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-4 md:flex-row md:items-stretch md:justify-center md:gap-0">
                {plans.map((plan, idx) => (
                  <div
                    key={plan.key}
                    className={`flex flex-col border p-5 md:p-6 transition-all md:flex-1 w-full ${
                      plan.featured
                        ? "rounded-xl shadow-sm md:shadow-lg md:z-10 md:-my-4 md:py-8 bg-[#5A50FF]/90 text-white border-[#5A50FF]/90 order-first md:order-none"
                        : idx === 0
                          ? "rounded-xl md:rounded-r-none md:border-r-0 bg-white border-border shadow-xs"
                          : "rounded-xl md:rounded-l-none md:border-l-0 bg-white border-border shadow-xs"
                    }`}
                  >
                    {/* Header */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className={`text-[15px] font-semibold ${plan.featured ? "text-white" : "text-foreground"}`}
                        >
                          {plan.name}
                        </h3>
                        {plan.featured && (
                          <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">
                            Populaire
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-[12px] ${plan.featured ? "text-white/70" : "text-muted-foreground"}`}
                      >
                        {plan.description}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-0.5 mb-5">
                      <span
                        className={`text-2xl font-semibold ${plan.featured ? "text-white" : "text-foreground"}`}
                      >
                        {(isAnnual ? plan.annualPrice : plan.monthlyPrice)
                          .toFixed(2)
                          .replace(".", ",")}
                        €
                      </span>
                      <span
                        className={`text-[12px] ${plan.featured ? "text-white/60" : "text-muted-foreground"}`}
                      >
                        /mois
                      </span>
                    </div>

                    {/* Features */}
                    <div className="flex-1 space-y-2 mb-6">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Check
                            className={`size-3.5 shrink-0 ${plan.featured ? "text-white" : "text-[#5A50FF]"}`}
                          />
                          <span
                            className={`text-[12px] ${plan.featured ? "text-white/80" : "text-muted-foreground"}`}
                          >
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <Button
                      onClick={() => handleSelectPlan(plan.key)}
                      disabled={loadingPlan !== null || isSavingStep}
                      className={`w-full h-10 rounded-lg cursor-pointer ${
                        plan.featured
                          ? "bg-white text-[#5A50FF] hover:bg-white/90"
                          : "bg-[#202020] hover:bg-[#303030] text-white"
                      }`}
                    >
                      {loadingPlan === plan.key ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        "Choisir ce plan"
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── View: Recap ─── */}
          {view === "recap" &&
            (() => {
              const plan = plans.find((p) => p.key === selectedPlan);
              const price = plan
                ? isAnnual
                  ? plan.annualPrice
                  : plan.monthlyPrice
                : 0;
              return (
                <div className="w-full max-w-[420px]">
                  {/* Subtitle */}
                  <p className="text-[14px] text-muted-foreground text-center mb-10 leading-relaxed">
                    Profitez de 30 jours pour explorer toutes les
                    fonctionnalités de Newbi. Aucun engagement, résiliable à
                    tout moment.
                  </p>

                  {/* Recap lines */}
                  <div className="space-y-4 mb-10">
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] text-foreground">
                        Plan {plan?.name}
                      </span>
                      <span className="text-[14px] text-foreground font-medium">
                        {price.toFixed(2).replace(".", ",")}€
                        <span className="text-muted-foreground font-normal">
                          /mois
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] text-foreground">
                        Facturation
                      </span>
                      <span className="text-[14px] text-muted-foreground">
                        {isAnnual ? "Annuelle" : "Mensuelle"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] text-foreground">
                        Aujourd'hui
                      </span>
                      <span className="text-[14px] text-foreground font-medium">
                        0,00€
                      </span>
                    </div>
                    <div className="border-t border-border/40" />
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] text-foreground font-medium">
                        Après l'essai
                      </span>
                      <span className="text-[14px] text-foreground font-medium">
                        {isAnnual
                          ? `${(price * 12).toFixed(2).replace(".", ",")}€/an`
                          : `${price.toFixed(2).replace(".", ",")}€/mois`}
                      </span>
                    </div>
                  </div>

                  {/* CTA */}
                  <Button
                    onClick={handlePayment}
                    disabled={loadingPlan !== null}
                    className="w-full h-11 bg-[#5A50FF]/90 hover:bg-[#5A50FF] text-white cursor-pointer border-0 [box-shadow:none] rounded-lg text-[14px]"
                  >
                    {loadingPlan ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Démarrer l'essai gratuit"
                    )}
                  </Button>

                  <p className="text-[11px] text-muted-foreground/50 mt-4 text-center">
                    Paiement sécurisé via Stripe. Résiliable en un clic.
                  </p>
                </div>
              );
            })()}

          {/* ─── Footer ─── */}
          <div
            className={`text-center space-y-4 max-w-[320px] ${view === "email" ? "mt-4" : "mt-8"}`}
          >
            {view === "signup" && (
              <>
                <p className="text-[13px] text-muted-foreground">
                  En vous inscrivant, vous acceptez nos{" "}
                  <Link
                    href="/mentions-legales"
                    className="text-foreground hover:underline"
                  >
                    Conditions générales
                  </Link>{" "}
                  et notre{" "}
                  <Link
                    href="/politique-confidentialite"
                    className="text-foreground hover:underline"
                  >
                    Politique de confidentialité
                  </Link>
                  .
                </p>
                <p className="text-[13px] text-muted-foreground">
                  Vous avez déjà un compte ?{" "}
                  <Link
                    href="/auth/login"
                    className="text-foreground font-medium hover:underline"
                  >
                    Se connecter
                  </Link>
                </p>
              </>
            )}
            {view === "email" && (
              <button
                type="button"
                onClick={() => switchView("signup")}
                className="text-[13px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Retour à l'inscription
              </button>
            )}
          </div>
        </div>

        {/* Step dots indicator — only shown from workspace step onwards */}
        {showDots && (
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
            {dotSteps.map((step, i) => (
              <button
                key={step}
                type="button"
                disabled={i >= currentDotIndex}
                onClick={async () => {
                  if (i < currentDotIndex && !isSavingStep) {
                    const ok = await updateOnboardingStep(step);
                    if (ok) switchView(step);
                  }
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
    </>
  );
}
