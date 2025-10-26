import {
  Info,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  AlertCircle,
} from "lucide-react";

type CalloutType =
  | "info"
  | "warning"
  | "success"
  | "tip"
  | "danger"
  | "neutral";

interface CalloutProps {
  type?: CalloutType;
  children: React.ReactNode;
  noMargin?: boolean;
}

const calloutStyles = {
  info: {
    container:
      "border-[#5a50ff]/20 bg-[#5a50ff]/5 text-[#5a50ff] dark:border-[#5a50ff]/30 dark:bg-[#5a50ff]/5 dark:text-[#8b85ff]",
    icon: "fill-[#5a50ff]/20 stroke-[#5a50ff] dark:fill-[#5a50ff]/20 dark:stroke-[#8b85ff]",
    Icon: Info,
  },
  warning: {
    container:
      "border-amber-500/20 bg-amber-50/50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/5 dark:text-amber-200",
    icon: "fill-amber-500 stroke-white dark:fill-amber-200/20 dark:stroke-amber-200",
    Icon: AlertTriangle,
  },
  success: {
    container:
      "border-emerald-500/20 bg-emerald-50/50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/5 dark:text-emerald-200",
    icon: "fill-emerald-500 stroke-white dark:fill-emerald-200/20 dark:stroke-emerald-200",
    Icon: CheckCircle,
  },
  tip: {
    container:
      "border-blue-500/20 bg-blue-50/50 text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/5 dark:text-blue-200",
    icon: "fill-blue-500 stroke-white dark:fill-blue-200/20 dark:stroke-blue-200",
    Icon: Lightbulb,
  },
  danger: {
    container:
      "border-red-500/20 bg-red-50/50 text-red-900 dark:border-red-500/30 dark:bg-red-500/5 dark:text-red-200",
    icon: "fill-red-500 stroke-white dark:fill-red-200/20 dark:stroke-red-200",
    Icon: AlertCircle,
  },
  neutral: {
    container:
      "border-zinc-200 bg-zinc-50 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100",
    icon: "fill-zinc-200 stroke-zinc-600 dark:fill-zinc-700 dark:stroke-zinc-400",
    Icon: Info,
  },
};

export function Callout({
  type = "info",
  children,
  noMargin = false,
}: CalloutProps) {
  const styles = calloutStyles[type];
  const Icon = styles.Icon;

  return (
    <div
      className={`flex gap-2.5 rounded-2xl border p-4 text-sm/6 ${styles.container}`}
    >
      <Icon className={`mt-1 h-4 w-4 flex-none ${styles.icon}`} />
      <div className="[&>:first-child]:mt-0 [&>:last-child]:mb-0">
        {children}
      </div>
    </div>
  );
}
