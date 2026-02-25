"use client";

import {
  ChevronDown,
  Copy,
  Search,
  Bell,
  CheckSquare,
  FileText,
  Mail,
  Monitor,
  BarChart3,
  Play,
  Send,
  Link2,
  Users,
  Landmark,
  Building2,
  ArrowUpDown,
  SlidersHorizontal,
  Download,
  Plus,
  Zap,
  UserPlus,
  MessageSquare,
  HelpCircle,
  MoreVertical,
  Check,
} from "lucide-react";
import { Separator } from "@/src/components/ui/separator";
import { PLANS } from "@/src/components/create-workspace/plan-form";

function SkeletonBar({ className = "", style }) {
  return <div className={`bg-[#EEEFF1] rounded-full ${className}`} style={style} />;
}

function NavItem({ icon: Icon, width = "w-14", extra }) {
  return (
    <div className="flex items-center gap-2.5 py-[5px] px-3">
      <Icon className="size-[15px] text-[#5D5E63] shrink-0" />
      <SkeletonBar className={`h-[10px] ${width}`} />
      {extra}
    </div>
  );
}

function TableRow({ nameWidth = "w-20" }) {
  return (
    <div className="flex items-center border-b border-[#f5f5f5] h-[34px]">
      <div className="flex items-center gap-3 w-[220px] px-3 shrink-0">
        <div className="size-[14px] rounded border border-[#EEEFF1] shrink-0" />
        <div className="size-[18px] rounded-full bg-[#EEEFF1] shrink-0" />
        <SkeletonBar className={`h-[10px] ${nameWidth}`} />
      </div>
      <div className="flex-1 flex items-center">
        <div className="flex-1 px-3" />
        <div className="flex-1 px-3" />
        <div className="flex-1 px-3" />
      </div>
    </div>
  );
}

const MEMBER_COLORS = ["#F59E0B", "#EC4899", "#3B82F6", "#10B981"];
const ROW_WIDTHS = ["w-20","w-16","w-24","w-14","w-20","w-18","w-12","w-22","w-16","w-20","w-14","w-24","w-18","w-16","w-20"];

export function WorkspacePreview({ step = 1, isNameFocused = false, companyName = "", members = [], selectedPlan = null, logoUrl = null }) {
  const displayName = companyName?.trim() || "Workspace";
  const firstLetter = displayName[0]?.toUpperCase() || "A";
  const filledEmails = members.filter((m) => m.email.trim()).map((m) => m.email);

  // Transform based on step and focus state
  let transform;
  if (step === 1 && !isNameFocused) {
    transform = "translate(70px, 60px) scale(1.02)";
  } else if (step === 1 && isNameFocused) {
    transform = "translate(60px, 55px) scale(1.08)";
  } else if (step === 2 && !selectedPlan) {
    transform = "translate(90px, -200px) scale(1)";
  } else if (step === 2 && selectedPlan) {
    transform = "translate(90px, -170px) scale(1)";
  } else if (step === 3) {
    transform = "translate(-450px, 80px) scale(0.92)";
  } else {
    // Step 4 — confirmation (same as step 1)
    transform = "translate(70px, 60px) scale(1.02)";
  }

  return (
    <div className="relative h-full pt-10 pl-4 overflow-hidden">
      {/* Single unified app mockup */}
      <div
        className="bg-white rounded-2xl shadow-[0_4px_40px_rgba(0,0,0,0.08)] origin-top-left transition-all duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ transform, width: 1000, minHeight: 900 }}
      >
        <div className="flex h-full">

          {/* ================================ */}
          {/* SIDEBAR                          */}
          {/* ================================ */}
          <div className="w-[195px] border-r border-[#f0f0f0] shrink-0 flex flex-col bg-[#FAFAFA] rounded-l-2xl">

            {/* ZONE A — Header (highlight on focus) */}
            <div
              className={`px-4 pt-4 pb-9 transition-all duration-300 ${
                isNameFocused && step === 1
                  ? "shadow-[0_0_0_9.5px_rgba(90,80,255,0.2),inset_0_0_0_1.5px_#5A50FF] rounded-2xl relative z-10 bg-white"
                  : "rounded-tl-2xl"
              }`}
            >
              {/* Identity row */}
              <div className="flex items-center gap-2 mb-3">
                <div className="size-7 rounded-md bg-[#EEEFF1] flex items-center justify-center shrink-0 overflow-hidden">
                  {logoUrl ? (
                    <img src={logoUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <span className="text-gray-500 text-xs font-semibold">{firstLetter}</span>
                  )}
                </div>
                <span className="text-sm font-semibold text-gray-800 truncate max-w-[80px]">
                  {displayName}
                </span>
                <ChevronDown className="size-3 text-[#5D5E63] shrink-0" />
                <div className="ml-auto">
                  <Copy className="size-3.5 text-[#5D5E63]" />
                </div>
              </div>

              {/* Search bar */}
              <div className="flex items-center gap-1.5 bg-white border border-[#EEEFF1] rounded-lg px-2 py-1.5">
                <div className="size-5 rounded border border-[#ddd] flex items-center justify-center shrink-0">
                  <span className="text-[9px] text-gray-500 font-medium">K</span>
                </div>
                <SkeletonBar className="h-[10px] flex-1" />
                <span className="text-[8px] text-gray-400 bg-white border border-[#e0e0e0] rounded px-1 py-0.5 shrink-0">⌘K</span>
                <Search className="size-3.5 text-[#5D5E63] shrink-0" />
                <span className="text-[8px] text-gray-400 bg-white border border-[#e0e0e0] rounded px-1 py-0.5 shrink-0">/</span>
              </div>
            </div>

            <Separator />

            {/* ZONE B — Navigation */}
            <div className="py-2 space-y-1">
              <NavItem icon={Bell} width="w-14" />
              <NavItem icon={CheckSquare} width="w-12" />
              <NavItem icon={FileText} width="w-10" />
              <NavItem icon={Copy} width="w-12" />
              <NavItem icon={Mail} width="w-16" />
              <NavItem icon={Monitor} width="w-14" />
              <NavItem icon={BarChart3} width="w-12" />

              {/* Item with chevron */}
              <div className="flex items-center gap-2.5 py-[5px] px-3">
                <Play className="size-[15px] text-[#5D5E63] shrink-0" />
                <SkeletonBar className="h-[10px] w-12" />
                <ChevronDown className="size-3 text-[#5D5E63]" />
              </div>

              {/* Indented sub-items */}
              <div className="ml-5 border-l border-[#f0f0f0] pl-1">
                <NavItem icon={Send} width="w-12" />
                <NavItem icon={Link2} width="w-10" />
              </div>

              {/* Expandable */}
              <div className="flex items-center gap-2.5 py-[5px] px-3">
                <ChevronDown className="size-[15px] text-[#5D5E63] shrink-0" />
                <SkeletonBar className="h-[10px] w-10" />
              </div>
            </div>

            {/* ZONE C — Objects/Collections */}
            <div className="py-2 border-t border-[#f0f0f0]">
              <div className="flex items-center gap-2.5 py-[5px] px-3">
                <div className="size-5 rounded bg-emerald-500 flex items-center justify-center shrink-0">
                  <Landmark className="size-3 text-white" />
                </div>
                <span className="text-[11px] text-gray-600">Transactions</span>
              </div>
              <div className="flex items-center gap-2.5 py-[5px] px-3">
                <div className="size-5 rounded bg-blue-500 flex items-center justify-center shrink-0">
                  <Building2 className="size-3 text-white" />
                </div>
                <SkeletonBar className="h-[10px] w-16" />
              </div>
            </div>
          </div>

          {/* ================================ */}
          {/* CONTENT AREA                     */}
          {/* ================================ */}
          <div className="flex-1 flex flex-col min-w-0">

            {/* People tab header + avatars */}
            <div className="flex items-center justify-between px-4 pt-4 pb-4">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#5A50FF]/10 rounded-md">
                <div className="size-3.5 rounded-full bg-[#5A50FF]" />
                <span className="text-xs font-medium text-[#5A50FF]">Factures</span>
              </div>

              <div className="flex items-center gap-2">
                {step === 3 && filledEmails.length > 0 && (
                  <div className="flex -space-x-2 mr-1">
                    {filledEmails.map((email, i) => (
                      <div
                        key={i}
                        className="size-6 rounded-full flex items-center justify-center text-white text-[9px] font-semibold border-2 border-white"
                        style={{ backgroundColor: MEMBER_COLORS[i % MEMBER_COLORS.length] }}
                      >
                        {email.trim()[0]?.toUpperCase()}
                      </div>
                    ))}
                  </div>
                )}
                <div className="size-6 rounded-full bg-gradient-to-b from-[#d0d0d0] to-[#b0b0b0] border-2 border-white" />
                <MessageSquare className="size-4 text-gray-400" />
                <HelpCircle className="size-4 text-gray-400" />
                <MoreVertical className="size-4 text-gray-400" />
              </div>
            </div>

            {/* Toolbar: import + add button */}
            <div className="flex items-center justify-between px-4 pb-4">
              <div className="flex items-center gap-2 border border-[#EEEFF1] rounded-lg px-3 py-1.5">
                <Download className="size-4 text-gray-500" />
                <SkeletonBar className="h-[10px] w-16" />
              </div>
              <div className="flex items-center gap-2 bg-[#5A50FF] border border-[#5A50FF] rounded-lg px-3 py-1.5">
                <Plus className="size-4 text-white" />
                <div className="size-4 rounded-full bg-white/30" />
                <SkeletonBar className="h-[10px] w-16" style={{ background: "rgba(255,255,255,0.4)" }} />
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-2 border-b border-[#f0f0f0] px-4 pb-3">
              <div className="flex items-center gap-2 bg-[#fbfbfb] rounded-lg px-3 py-1.5" style={{ outline: "1px dashed rgba(0,0,0,0.2)", outlineOffset: "-1px" }}>
                <Zap className="size-4 text-[rgba(0,0,0,0.55)]" />
              </div>
              <div className="flex items-center gap-2 border border-[#EEEFF1] rounded-lg px-3 py-1.5">
                <Mail className="size-4 text-gray-400" />
                <SkeletonBar className="h-[10px] w-14" />
              </div>
              <div className="flex items-center gap-2 border border-[#EEEFF1] rounded-lg px-3 py-1.5">
                <UserPlus className="size-4 text-gray-400" />
                <SkeletonBar className="h-[10px] w-14" />
              </div>
            </div>

            {/* Table with vertical column lines */}
            <div className="relative flex-1">
              {/* Vertical column dividers */}
              <div className="absolute top-0 bottom-0 left-[220px] w-px bg-[#f0f0f0]" />
              <div className="absolute top-0 bottom-0 w-px bg-[#f0f0f0]" style={{ left: "calc(220px + (100% - 220px) / 3)" }} />
              <div className="absolute top-0 bottom-0 w-px bg-[#f0f0f0]" style={{ left: "calc(220px + (100% - 220px) * 2 / 3)" }} />

              {/* Table header */}
              <div className="flex items-center border-b border-[#f0f0f0] h-[34px]">
                <div className="flex items-center gap-3 w-[220px] px-3 shrink-0">
                  <div className="size-[14px] rounded border border-[#d0d0d0] shrink-0" />
                  <SkeletonBar className="h-[10px] w-16" />
                  <ArrowUpDown className="size-3 text-gray-400" />
                </div>
                <div className="flex-1 flex items-center">
                  <div className="flex-1 flex items-center gap-2 px-3">
                    <Mail className="size-3 text-gray-400" />
                    <SkeletonBar className="h-[10px] w-10" />
                  </div>
                  <div className="flex-1 flex items-center gap-2 px-3">
                    <SkeletonBar className="h-[10px] w-12" />
                  </div>
                  <div className="flex-1 flex items-center gap-2 px-3">
                    <SkeletonBar className="h-[10px] w-14" />
                  </div>
                </div>
              </div>

              {/* Table rows */}
              {step === 3 && filledEmails.length > 0 ? (
                <>
                  {filledEmails.flatMap((email, i) => {
                    const color = MEMBER_COLORS[i % MEMBER_COLORS.length];
                    const name = email.split("@")[0];
                    const truncated = name.length > 8 ? name.slice(0, 7) + "..." : name;
                    return [
                      <div key={i} className="flex items-stretch border-b border-[#f5f5f5] h-[34px]">
                        <div className="flex items-center gap-3 w-[220px] px-3 shrink-0">
                          <div className="size-[14px] rounded border border-[#EEEFF1] shrink-0" />
                          <div className="size-[18px] rounded-full bg-[#EEEFF1] shrink-0" />
                          <SkeletonBar className="h-[10px] w-16" />
                        </div>
                        <div className="flex-1 flex items-stretch">
                          <div className="flex-1" />
                          <div className="flex-1 relative border" style={{ borderColor: color }}>
                            <span
                              className="absolute -top-3 right-1 text-[10px] font-semibold px-1.5 py-0.5 rounded text-white"
                              style={{ backgroundColor: color }}
                            >
                              {truncated}
                            </span>
                          </div>
                          <div className="flex-1" />
                        </div>
                      </div>,
                      <div key={`spacer-${i}`} className="border-b border-[#f5f5f5] h-[34px]" />,
                    ];
                  })}
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={`empty-${i}`} className="border-b border-[#f5f5f5] h-[34px]" />
                  ))}
                </>
              ) : (
                ROW_WIDTHS.map((w, i) => <TableRow key={i} nameWidth={w} />)
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-6 px-3 py-2 border-t border-[#f0f0f0] mt-auto">
              <SkeletonBar className="h-[10px] w-12" />
              <SkeletonBar className="h-[10px] w-12" />
              <SkeletonBar className="h-[10px] w-12" />
              <SkeletonBar className="h-[10px] w-12" />
              <SkeletonBar className="h-[10px] w-12" />
            </div>
          </div>
        </div>
      </div>

      {/* Plan features dialog */}
      {step === 2 && selectedPlan && (() => {
        const plan = PLANS.find((p) => p.key === selectedPlan);
        if (!plan) return null;
        const cardPosition = {
          freelance: { bottom: 280, left: 64 },
          pme: { bottom: 180, left: 64 },
          entreprise: { bottom: 80, left: 64 },
        }[selectedPlan] || { bottom: 180, left: 64 };
        return (
          <div
            key={selectedPlan}
            className="absolute w-[380px] bg-white rounded-3xl p-5 shadow-[0_0_0_1.5px_#5A50FF,0_0_0_9.5px_rgba(90,80,255,0.2),0_8px_30px_rgba(0,0,0,0.08)] z-20"
            style={{
              bottom: cardPosition.bottom,
              left: cardPosition.left,
              animation: "planCardIn 450ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
            }}
          >
            <style>{`
              @keyframes planCardIn {
                0% { opacity: 0; transform: scale(0.5); }
                50% { opacity: 0.8; transform: scale(1.03); }
                100% { opacity: 1; transform: scale(1); }
              }
            `}</style>
            <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-[#f0f0f0]">
              <div className="relative shrink-0 w-8 h-8 rounded-lg border border-gray-200 overflow-hidden">
                <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0"><g clipPath="url(#clip0_dialog_bg)"><rect width="40" height="40" fill="#FFFFFF"></rect><path d="M40 15.9494L0 15.9494" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="0.5" strokeMiterlimit="10" strokeDasharray="1 1"></path><path d="M40 24.0506H0" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="0.5" strokeMiterlimit="10" strokeDasharray="1 1"></path><path d="M12.9114 -4.17233e-07L12.9114 40" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="0.5" strokeMiterlimit="10" strokeDasharray="1 1"></path><path d="M27.0886 0L27.0886 40" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="0.5" strokeMiterlimit="10" strokeDasharray="1 1"></path><path d="M34.1423 -0.000732422V39.9993" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="0.5" strokeMiterlimit="10"></path><path d="M5.85938 -0.000732422V39.9993" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="0.5" strokeMiterlimit="10"></path><path d="M0.000976562 5.8577H40.001" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="0.5" strokeMiterlimit="10"></path><path d="M0.000976562 34.4206H40.001" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="0.5" strokeMiterlimit="10"></path></g><defs><clipPath id="clip0_dialog_bg"><rect width="40" height="40" fill="#FFFFFF"></rect></clipPath></defs></svg>
                <svg width="24" height="20" viewBox="0 0 30 25" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"><path d="M7.99852 4.00541L14.0745 0.533435C14.3858 0.355535 14.768 0.355535 15.0793 0.533435L21.1553 4.00541C21.4708 4.1857 21.6655 4.52124 21.6655 4.88464V11.8106C21.6655 12.174 21.4708 12.5095 21.1553 12.6898L15.0793 16.1618C14.768 16.3397 14.3858 16.3397 14.0745 16.1618L7.99852 12.6898C7.683 12.5095 7.48828 12.174 7.48828 11.8106V4.88464C7.48828 4.52124 7.683 4.1857 7.99852 4.00541Z" fill="#FFFFFF" stroke="#CDCFD1" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M14.577 8.34722L7.70996 4.42317M14.577 8.34722L21.4765 4.40466M14.577 8.34722V16.1953" stroke="#CDCFD1" strokeWidth="0.506329" strokeLinecap="round" strokeLinejoin="round"></path><path d="M15.0874 8.0557L21.1633 4.58373C21.4747 4.40583 21.8569 4.40583 22.1682 4.58373L28.2441 8.0557C28.5596 8.236 28.7544 8.57153 28.7544 8.93493V15.8609C28.7544 16.2243 28.5596 16.5598 28.2441 16.7401L22.1682 20.2121C21.8569 20.39 21.4747 20.39 21.1633 20.2121L15.0874 16.7401C14.7719 16.5598 14.5771 16.2243 14.5771 15.8609V8.93493C14.5771 8.57153 14.7719 8.236 15.0874 8.0557Z" fill="#EEEDFF" stroke="#5A50FF" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"></path><path opacity="0.4" d="M21.6659 12.3976L14.7988 8.47358M21.6659 12.3976L28.5654 8.45508M21.6659 12.3976V20.2457" stroke="#5A50FF" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M0.910142 8.0557L6.98609 4.58373C7.29742 4.40583 7.67961 4.40583 7.99093 4.58373L14.0669 8.0557C14.3824 8.236 14.5771 8.57153 14.5771 8.93493V15.8609C14.5771 16.2243 14.3824 16.5598 14.0669 16.7401L7.99093 20.2121C7.67961 20.39 7.29741 20.39 6.98609 20.2121L0.910141 16.7401C0.594622 16.5598 0.399902 16.2243 0.399902 15.8609V8.93493C0.399902 8.57153 0.594623 8.236 0.910142 8.0557Z" fill="#EEEDFF" stroke="#5A50FF" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"></path><path opacity="0.4" d="M7.48867 12.3976L0.621582 8.47358M7.48867 12.3976L14.3881 8.45508M7.48867 12.3976V20.2457" stroke="#5A50FF" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M7.99852 12.1061L14.0745 8.63414C14.3858 8.45624 14.768 8.45624 15.0793 8.63414L21.1553 12.1061C21.4708 12.2864 21.6655 12.6219 21.6655 12.9853V19.9113C21.6655 20.2747 21.4708 20.6102 21.1553 20.7905L15.0793 24.2625C14.768 24.4404 14.3858 24.4404 14.0745 24.2625L7.99852 20.7905C7.683 20.6102 7.48828 20.2747 7.48828 19.9113V12.9853C7.48828 12.6219 7.683 12.2864 7.99852 12.1061Z" fill="#EEEDFF" stroke="#5A50FF" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"></path><path opacity="0.4" d="M14.5766 16.4482L7.70947 12.5241M14.5766 16.4482L21.476 12.5056M14.5766 16.4482V24.2963" stroke="#5A50FF" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
              </div>
              <span className="text-sm font-semibold text-[#46464A]">{plan.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <div className="size-5 rounded-md bg-[#f0f0f0] flex items-center justify-center shrink-0">
                    <Check className="size-3 text-[#5D5E63]" />
                  </div>
                  <span className="text-xs text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Bottom fade gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#FBFBFB] to-transparent pointer-events-none" />
    </div>
  );
}
