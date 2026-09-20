import Link from "next/link";
import { cn } from "@/src/lib/utils";
import { SIGNUP_HREF, CTA_LABEL, CTA_SUBLABEL } from "./lp-config";

// Bouton CTA unique des LP : label + micro-copie de réassurance.
// `dark` = variante noire (sections claires), `light` = variante blanche
// (sections sombres), sinon violet Newbi.
export default function LpCtaButton({
  label = CTA_LABEL,
  sublabel = CTA_SUBLABEL,
  dark = false,
  light = false,
  className = "",
  ...props
}) {
  return (
    <Link
      href={SIGNUP_HREF}
      className={cn(
        "inline-flex flex-col items-center justify-center rounded-xl px-8 py-3 text-center transition duration-200 active:scale-[0.98]",
        light
          ? "bg-white hover:bg-gray-100 text-[#202020]"
          : dark
            ? "bg-[#202020] hover:bg-[#333333] text-white"
            : "bg-[#5b50FF] hover:bg-[#4a40e6] text-white",
        className,
      )}
      {...props}
    >
      <span className="text-base font-medium leading-tight">{label}</span>
      {sublabel && (
        <span
          className={cn(
            "text-xs font-normal leading-tight mt-0.5",
            light ? "text-[#202020]/60" : "text-white/75",
          )}
        >
          {sublabel}
        </span>
      )}
    </Link>
  );
}
