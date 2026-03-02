"use client";

import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { cn } from "@/src/lib/utils";

export const PLANS = [
  {
    key: "freelance",
    name: "Freelance",
    monthlyPrice: 17.99,
    annualPrice: 16.19,
    description: "Parfait pour les indépendants et freelances",
    features: [
      "1 utilisateur",
      "1 comptable gratuit",
      "Facturation & Devis",
      "20 reçus OCR/mois",
      "1 compte bancaire",
      "5 Go transfert",
    ],
  },
  {
    key: "pme",
    name: "PME",
    monthlyPrice: 48.99,
    annualPrice: 44.09,
    popular: true,
    description: "Idéal pour les petites et moyennes entreprises",
    features: [
      "Jusqu'à 10 utilisateurs",
      "3 comptables gratuits",
      "Facturation & Devis",
      "OCR illimité",
      "3 comptes bancaires",
      "15 Go transfert",
      "Relances automatiques",
      "Support prioritaire",
    ],
  },
  {
    key: "entreprise",
    name: "Entreprise",
    monthlyPrice: 94.99,
    annualPrice: 85.49,
    description: "Pour les grandes structures avec des besoins avancés",
    features: [
      "Jusqu'à 25 utilisateurs",
      "5 comptables gratuits",
      "Facturation & Devis",
      "OCR illimité",
      "5 comptes bancaires",
      "15 Go transfert",
      "Relances automatiques",
      "Accès API",
    ],
  },
];

const formatPrice = (amount) => amount.toFixed(2).replace(".", ",");

function CubeIcon() {
  return (
    <div className="relative shrink-0 w-10 h-10 rounded-lg border border-border overflow-hidden">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0"><g clipPath="url(#clip0_sub_bg)"><rect width="40" height="40" fill="#FFFFFF"></rect><path d="M40 15.9494L0 15.9494" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="0.5" strokeMiterlimit="10" strokeDasharray="1 1"></path><path d="M40 24.0506H0" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="0.5" strokeMiterlimit="10" strokeDasharray="1 1"></path><path d="M12.9114 -4.17233e-07L12.9114 40" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="0.5" strokeMiterlimit="10" strokeDasharray="1 1"></path><path d="M27.0886 0L27.0886 40" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="0.5" strokeMiterlimit="10" strokeDasharray="1 1"></path><path d="M34.1423 -0.000732422V39.9993" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="0.5" strokeMiterlimit="10"></path><path d="M5.85938 -0.000732422V39.9993" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="0.5" strokeMiterlimit="10"></path><path d="M0.000976562 5.8577H40.001" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="0.5" strokeMiterlimit="10"></path><path d="M0.000976562 34.4206H40.001" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="0.5" strokeMiterlimit="10"></path></g><defs><clipPath id="clip0_sub_bg"><rect width="40" height="40" fill="#FFFFFF"></rect></clipPath></defs></svg>
      <svg width="30" height="25" viewBox="0 0 30 25" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"><path d="M7.99852 4.00541L14.0745 0.533435C14.3858 0.355535 14.768 0.355535 15.0793 0.533435L21.1553 4.00541C21.4708 4.1857 21.6655 4.52124 21.6655 4.88464V11.8106C21.6655 12.174 21.4708 12.5095 21.1553 12.6898L15.0793 16.1618C14.768 16.3397 14.3858 16.3397 14.0745 16.1618L7.99852 12.6898C7.683 12.5095 7.48828 12.174 7.48828 11.8106V4.88464C7.48828 4.52124 7.683 4.1857 7.99852 4.00541Z" fill="#FFFFFF" stroke="#CDCFD1" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M14.577 8.34722L7.70996 4.42317M14.577 8.34722L21.4765 4.40466M14.577 8.34722V16.1953" stroke="#CDCFD1" strokeWidth="0.506329" strokeLinecap="round" strokeLinejoin="round"></path><path d="M15.0874 8.0557L21.1633 4.58373C21.4747 4.40583 21.8569 4.40583 22.1682 4.58373L28.2441 8.0557C28.5596 8.236 28.7544 8.57153 28.7544 8.93493V15.8609C28.7544 16.2243 28.5596 16.5598 28.2441 16.7401L22.1682 20.2121C21.8569 20.39 21.4747 20.39 21.1633 20.2121L15.0874 16.7401C14.7719 16.5598 14.5771 16.2243 14.5771 15.8609V8.93493C14.5771 8.57153 14.7719 8.236 15.0874 8.0557Z" fill="#EEEDFF" stroke="#5A50FF" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"></path><path opacity="0.4" d="M21.6659 12.3976L14.7988 8.47358M21.6659 12.3976L28.5654 8.45508M21.6659 12.3976V20.2457" stroke="#5A50FF" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M0.910142 8.0557L6.98609 4.58373C7.29742 4.40583 7.67961 4.40583 7.99093 4.58373L14.0669 8.0557C14.3824 8.236 14.5771 8.57153 14.5771 8.93493V15.8609C14.5771 16.2243 14.3824 16.5598 14.0669 16.7401L7.99093 20.2121C7.67961 20.39 7.29741 20.39 6.98609 20.2121L0.910141 16.7401C0.594622 16.5598 0.399902 16.2243 0.399902 15.8609V8.93493C0.399902 8.57153 0.594623 8.236 0.910142 8.0557Z" fill="#EEEDFF" stroke="#5A50FF" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"></path><path opacity="0.4" d="M7.48867 12.3976L0.621582 8.47358M7.48867 12.3976L14.3881 8.45508M7.48867 12.3976V20.2457" stroke="#5A50FF" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M7.99852 12.1061L14.0745 8.63414C14.3858 8.45624 14.768 8.45624 15.0793 8.63414L21.1553 12.1061C21.4708 12.2864 21.6655 12.6219 21.6655 12.9853V19.9113C21.6655 20.2747 21.4708 20.6102 21.1553 20.7905L15.0793 24.2625C14.768 24.4404 14.3858 24.4404 14.0745 24.2625L7.99852 20.7905C7.683 20.6102 7.48828 20.2747 7.48828 19.9113V12.9853C7.48828 12.6219 7.683 12.2864 7.99852 12.1061Z" fill="#EEEDFF" stroke="#5A50FF" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"></path><path opacity="0.4" d="M14.5766 16.4482L7.70947 12.5241M14.5766 16.4482L21.476 12.5056M14.5766 16.4482V24.2963" stroke="#5A50FF" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
    </div>
  );
}

export function PlanForm({ selectedPlan, setSelectedPlan, isAnnual, setIsAnnual, onContinue }) {
  return (
    <div className="flex flex-col h-full px-20 py-6">
      <div className="flex flex-col pt-14">
        <h1 className="text-xl font-semibold text-foreground mb-2">
          Choisissez votre abonnement
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Sélectionnez le plan adapté à vos besoins. Vous pourrez le modifier à tout moment.
        </p>

        {/* Toggle Annuel / Mensuel */}
        <div className="inline-flex items-center self-start rounded-lg border border-border p-0.5 text-xs mb-6">
          <button
            type="button"
            onClick={() => setIsAnnual(true)}
            className={cn(
              "px-2.5 py-1 rounded-md cursor-pointer transition-colors flex items-center gap-1.5",
              isAnnual ? "bg-card font-medium shadow-sm" : "text-muted-foreground"
            )}
          >
            Annuel
            <span className="text-[10px] text-[#5A50FF] bg-[#5A50FF]/10 rounded px-1 py-0.5 font-medium">-10%</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAnnual(false)}
            className={cn(
              "px-2.5 py-1 rounded-md cursor-pointer transition-colors",
              !isAnnual ? "bg-card font-medium shadow-sm" : "text-muted-foreground"
            )}
          >
            Mensuel
          </button>
        </div>

        {/* Plan cards */}
        <div className="space-y-3">
          {PLANS.map((plan) => {
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            const isSelected = selectedPlan === plan.key;

            return (
              <div
                key={plan.key}
                onClick={() => setSelectedPlan(plan.key)}
                className={cn(
                  "rounded-xl border p-3 cursor-pointer transition-all",
                  isSelected
                    ? "border-[#5A50FF] ring-[2px] ring-[#5A50FF]/20"
                    : "border-border hover:border-muted-foreground/30"
                )}
              >
                {plan.popular && (
                  <div className="mb-2">
                    <Badge className="bg-[#5A50FF]/10 text-[#5A50FF] text-[10px] font-medium border border-[#5A50FF]/20 px-1.5 py-0">
                      Populaire
                    </Badge>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <CubeIcon />
                  <div>
                    <span className="text-sm font-semibold">{plan.name}</span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>
                        {formatPrice(price)} €/mois
                        {isAnnual ? ", facturé annuellement" : ", facturé mensuellement"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Continue button */}
        <div className="mt-8">
          <Button
            variant="primary"
            className="w-full"
            disabled={!selectedPlan}
            onClick={onContinue}
          >
            Continuer
          </Button>
        </div>

      </div>
    </div>
  );
}
