"use client";

import {
  MessageSquare,
  HelpCircle,
  MoreVertical,
  Download,
  Plus,
  Zap,
  Mail,
  UserPlus,
} from "lucide-react";

function SkeletonBar({ className = "" }) {
  return <div className={`bg-[#EEEFF1] rounded-full ${className}`} />;
}

const MEMBER_COLORS = ["#F59E0B", "#EC4899", "#3B82F6", "#10B981"];

export function InvitePreview({ emails = [] }) {
  const filledEmails = emails.filter((e) => e.trim());

  return (
    <div className="relative h-full pt-36 pl-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-[0_4px_40px_rgba(0,0,0,0.08)] min-h-full transform scale-[0.82] origin-top-right">
        {/* Top bar — avatars + icons */}
        <div className="flex items-center justify-end gap-2 px-5 pt-5 pb-4">
          {/* Member avatars */}
          <div className="flex -space-x-2 mr-1">
            {filledEmails.map((email, i) => (
              <div
                key={i}
                className="size-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold border-2 border-white"
                style={{ backgroundColor: MEMBER_COLORS[i % MEMBER_COLORS.length] }}
              >
                {email.trim()[0]?.toUpperCase() || "?"}
              </div>
            ))}
            {/* Default avatar */}
            <div className="size-7 rounded-full bg-[#EEEFF1] border-2 border-white overflow-hidden">
              <div className="size-full bg-gradient-to-b from-[#d0d0d0] to-[#b0b0b0] rounded-full" />
            </div>
          </div>
          <MessageSquare className="size-4 text-gray-400" />
          <HelpCircle className="size-4 text-gray-400" />
          <MoreVertical className="size-4 text-gray-400" />
        </div>

        {/* Action bar — import + add button */}
        <div className="flex items-center justify-between px-5 pb-5">
          <div className="flex items-center gap-2 border border-[#EEEFF1] rounded-lg px-3 py-2">
            <Download className="size-4 text-gray-500" />
            <SkeletonBar className="h-3 w-16" />
          </div>
          <div className="flex items-center gap-2 bg-[#5A50FF] rounded-lg px-4 py-2">
            <Plus className="size-4 text-white" />
            <div className="size-5 rounded-full bg-white/30" />
            <SkeletonBar className="h-3 w-16 !bg-white/40" />
          </div>
        </div>

        {/* Table */}
        <div className="px-5">
          {/* Table header */}
          <div className="grid grid-cols-3 border-b border-[#EEEFF1] pb-3 mb-1">
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-gray-400" />
            </div>
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-gray-400" />
              <SkeletonBar className="h-3 w-16" />
            </div>
            <div className="flex items-center gap-2">
              <UserPlus className="size-4 text-gray-400" />
              <SkeletonBar className="h-3 w-16" />
            </div>
          </div>

          {/* Table rows */}
          {filledEmails.map((email, i) => {
            const color = MEMBER_COLORS[i % MEMBER_COLORS.length];
            const truncated = email.length > 10 ? email.slice(0, 9) + "..." : email;
            return (
              <div key={i} className="grid grid-cols-3 border-b border-[#EEEFF1]">
                <div className="py-3" />
                <div className="py-3 pr-4">
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded"
                      style={{ color }}
                    >
                      {truncated}
                    </span>
                    <div
                      className="w-full h-8 rounded border"
                      style={{ borderColor: color }}
                    />
                  </div>
                </div>
                <div className="py-3" />
              </div>
            );
          })}

          {/* Empty rows */}
          {Array.from({ length: 8 - filledEmails.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="grid grid-cols-3 border-b border-[#EEEFF1] h-12"
            >
              <div />
              <div />
              <div />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom fade gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#FBFBFB] to-transparent pointer-events-none" />
    </div>
  );
}
