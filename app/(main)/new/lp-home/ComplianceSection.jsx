"use client";
import React from "react";
import Link from "next/link";

export default function ComplianceSection() {
  return (
    <div className="w-full">
      <div className="w-full border-y border-x bg-gray-100 dark:bg-neutral-900 px-8 py-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left side - Content */}
        <div>
          <h2 className="text-gray-950 dark:text-neutral-100 text-2xl font-normal tracking-tight md:text-3xl lg:text-4xl text-left">
            Facturation électronique conforme aux normes françaises
          </h2>
          <p className="text-sm font-normal tracking-tight text-gray-600 dark:text-gray-300 md:text-sm lg:text-base mt-4 text-left">
            Newbi est conforme à la réglementation française sur la facturation
            électronique. Générez des factures aux normes, avec TVA, mentions
            légales obligatoires et numérotation automatique.
          </p>
          <Link
            href="/auth/signup"
            className="rounded-xl px-6 py-2 text-center text-sm font-medium transition duration-150 active:scale-[0.98] sm:text-base bg-[#202020] text-white hover:bg-[#333333] dark:bg-white dark:text-black mt-4 mb-8 inline-block w-full md:w-auto"
          >
            Essayer gratuitement
          </Link>
        </div>

        {/* Right side - Animated SVG Component */}
        <div className="relative flex h-full w-full items-center justify-between">
          {/* Left Card - Tasks */}
          <div className="relative h-70 w-60 -translate-x-2 rounded-2xl border-t border-gray-300 bg-white p-4 shadow-2xl md:translate-x-0 dark:border-neutral-700 dark:bg-neutral-900">
            <div className="absolute -top-4 -right-4 flex h-14 w-14 items-center justify-center rounded-lg bg-white shadow-xl">
              <div className="absolute inset-0 z-10 m-auto h-full w-full rounded-lg border border-gray-200 bg-white bg-[image:repeating-linear-gradient(315deg,_rgb(229_231_235)_0,_rgb(229_231_235)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] dark:bg-neutral-900"></div>
              <svg
                width="13"
                height="13"
                viewBox="0 0 13 13"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="relative z-20 h-8 w-8"
              >
                <mask
                  id="mask0_557_586"
                  maskUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="13"
                  height="13"
                  style={{ maskType: "luminance" }}
                >
                  <path
                    d="M12.6081 0.5H0.5V12.5H12.6081V0.5Z"
                    fill="white"
                  ></path>
                </mask>
                <g mask="url(#mask0_557_586)">
                  <path
                    d="M5.14399 4.86798V3.72797C5.14399 3.63196 5.18002 3.55994 5.26398 3.51197L7.55605 2.19199C7.86804 2.012 8.24006 1.92804 8.62401 1.92804C10.064 1.92804 10.976 3.04406 10.976 4.23202C10.976 4.316 10.976 4.41201 10.964 4.50802L8.58799 3.11599C8.44401 3.03201 8.29996 3.03201 8.15598 3.11599L5.14399 4.86798ZM10.496 9.30801V6.58396C10.496 6.41589 10.4239 6.29592 10.28 6.21194L7.26799 4.45995L8.25199 3.89591C8.33597 3.84797 8.408 3.84797 8.49198 3.89591L10.784 5.21591C11.4441 5.59996 11.888 6.41589 11.888 7.20787C11.888 8.11984 11.3481 8.95986 10.496 9.30791V9.30801ZM4.43599 6.90803L3.45199 6.33206C3.36804 6.28409 3.332 6.21207 3.332 6.11605V3.47608C3.332 2.19209 4.316 1.22002 5.64803 1.22002C6.15209 1.22002 6.61999 1.38809 7.01609 1.68805L4.6521 3.05612C4.50814 3.14008 4.43612 3.26007 4.43612 3.42811V6.90813L4.43599 6.90803ZM6.55402 8.13199L5.14399 7.34002V5.66008L6.55402 4.86811L7.96395 5.66008V7.34002L6.55402 8.13199ZM7.46001 11.7801C6.95597 11.7801 6.48807 11.612 6.09197 11.312L8.45594 9.94398C8.59992 9.86002 8.67195 9.74003 8.67195 9.57197V6.09197L9.668 6.66794C9.75196 6.71588 9.788 6.78791 9.788 6.88392V9.5239C9.788 10.8079 8.79194 11.78 7.46001 11.78V11.7801ZM4.61599 9.10406L2.32392 7.78406C1.66387 7.40002 1.21992 6.58408 1.21992 5.79211C1.21992 4.86811 1.77193 4.04012 2.62388 3.69209V6.42807C2.62388 6.59611 2.69593 6.71611 2.83989 6.80006L5.83995 8.54002L4.85595 9.10406C4.77199 9.15201 4.69994 9.15201 4.61599 9.10406ZM4.48406 11.0721C3.12805 11.0721 2.13202 10.052 2.13202 8.79204C2.13202 8.69603 2.14405 8.60002 2.15598 8.50401L4.51997 9.87205C4.66393 9.95604 4.80801 9.95604 4.95196 9.87205L7.96395 8.13212V9.2721C7.96395 9.36814 7.92794 9.44016 7.84396 9.48811L5.55192 10.8081C5.2399 10.9881 4.86788 11.0721 4.48394 11.0721H4.48406ZM7.46001 12.5C8.91204 12.5 10.124 11.468 10.4001 10.1C11.7441 9.75196 12.6081 8.49196 12.6081 7.20799C12.6081 6.36795 12.2481 5.55202 11.6001 4.96399C11.6601 4.71197 11.6961 4.45995 11.6961 4.20806C11.6961 2.49208 10.3041 1.20799 8.69603 1.20799C8.37211 1.20799 8.06009 1.25594 7.74807 1.364C7.20799 0.835977 6.46399 0.5 5.64803 0.5C4.19603 0.5 2.98409 1.53194 2.70799 2.89998C1.364 3.24802 0.5 4.50802 0.5 5.79198C0.5 6.63203 0.859961 7.44796 1.50798 8.03598C1.44798 8.288 1.41197 8.54002 1.41197 8.79192C1.41197 10.5079 2.804 11.792 4.41201 11.792C4.73596 11.792 5.04797 11.744 5.35999 11.636C5.89995 12.164 6.64395 12.5 7.46001 12.5Z"
                    fill="currentColor"
                  ></path>
                </g>
              </svg>
            </div>
            <div className="mt-12 flex items-center gap-2">
              <svg
                width="14"
                height="15"
                viewBox="0 0 14 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.6665 2.7915H2.33317C1.68884 2.7915 1.1665 3.31384 1.1665 3.95817V10.9582C1.1665 11.6025 1.68884 12.1248 2.33317 12.1248H11.6665C12.3108 12.1248 12.8332 11.6025 12.8332 10.9582V3.95817C12.8332 3.31384 12.3108 2.7915 11.6665 2.7915Z"
                  stroke="currentColor"
                  strokeWidth="1.16667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
                <path
                  d="M3.5 5.125H3.50583"
                  stroke="currentColor"
                  strokeWidth="1.16667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
                <path
                  d="M5.8335 5.125H5.83933"
                  stroke="currentColor"
                  strokeWidth="1.16667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
                <path
                  d="M8.1665 5.125H8.17234"
                  stroke="currentColor"
                  strokeWidth="1.16667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
              <span className="text-gray-950 text-sm font-medium dark:text-neutral-200">
                Factures
              </span>
            </div>
            <div className="h-[1px] w-full mt-2 bg-gray-200 dark:bg-neutral-700"></div>
            <div className="mt-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-950 text-[10px] leading-loose font-normal md:text-xs dark:text-neutral-200">
                  Générez des factures conformes aux normes françaises
                </span>
              </div>
            </div>
            <div className="mt-2 flex flex-col">
              <div
                className="mt-2 h-4 w-full rounded-full bg-gray-200 dark:bg-neutral-800"
                style={{ width: "65%" }}
              ></div>
              <div
                className="mt-2 h-4 w-full rounded-full bg-gray-200 dark:bg-neutral-800"
                style={{ width: "75%" }}
              ></div>
            </div>
          </div>

          {/* Connection Line */}
          <div className="absolute inset-x-0 z-30 hidden items-center justify-center md:flex">
            <div className="size-3 rounded-full border-2 border-blue-500 bg-white dark:bg-neutral-800"></div>
            <div className="h-[2px] w-38 bg-blue-500"></div>
            <div className="size-3 rounded-full border-2 border-blue-500 bg-white dark:bg-neutral-800"></div>
          </div>

          {/* Right Card - Integrations */}
          <div className="relative h-70 w-60 translate-x-10 rounded-2xl border-t border-gray-300 bg-white p-4 shadow-2xl md:translate-x-0 dark:border-neutral-700 dark:bg-neutral-900">
            <div className="absolute -top-4 -left-4 flex h-14 w-14 items-center justify-center rounded-lg bg-white shadow-xl dark:bg-neutral-800">
              <div className="absolute inset-0 z-10 m-auto h-full w-full rounded-lg border border-gray-200 bg-white bg-[image:repeating-linear-gradient(315deg,_rgb(229_231_235)_0,_rgb(229_231_235)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] dark:bg-neutral-900"></div>
              <svg
                width="20"
                height="24"
                viewBox="0 0 20 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="relative z-20 h-8 w-8"
              >
                <path
                  d="M0 4.5C0 3.11929 1.11929 2 2.5 2H7.5C8.88071 2 10 3.11929 10 4.5V9.40959C10.0001 9.4396 10.0002 9.46975 10.0002 9.50001C10.0002 10.8787 11.1162 11.9968 12.4942 12C12.4961 12 12.4981 12 12.5 12H17.5C18.8807 12 20 13.1193 20 14.5V19.5C20 20.8807 18.8807 22 17.5 22H12.5C11.1193 22 10 20.8807 10 19.5V14.5C10 14.4931 10 14.4861 10.0001 14.4792C9.98891 13.1081 8.87394 12 7.50017 12C7.4937 12 7.48725 12 7.48079 12H2.5C1.11929 12 0 10.8807 0 9.5V4.5Z"
                  fill="currentColor"
                ></path>
              </svg>
            </div>
            <div className="mt-12 flex items-center gap-2">
              <svg
                width="14"
                height="15"
                viewBox="0 0 14 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="dark:text-neutral-200"
              >
                <path
                  d="M11.6665 2.7915H2.33317C1.68884 2.7915 1.1665 3.31384 1.1665 3.95817V10.9582C1.1665 11.6025 1.68884 12.1248 2.33317 12.1248H11.6665C12.3108 12.1248 12.8332 11.6025 12.8332 10.9582V3.95817C12.8332 3.31384 12.3108 2.7915 11.6665 2.7915Z"
                  stroke="currentColor"
                  strokeWidth="1.16667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
                <path
                  d="M3.5 5.125H3.50583"
                  stroke="currentColor"
                  strokeWidth="1.16667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
                <path
                  d="M5.8335 5.125H5.83933"
                  stroke="currentColor"
                  strokeWidth="1.16667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
                <path
                  d="M8.1665 5.125H8.17234"
                  stroke="currentColor"
                  strokeWidth="1.16667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
              <span className="text-gray-950 text-xs font-medium md:text-sm dark:text-neutral-200">
                Conformité
              </span>
              <span className="text-gray-950 rounded-lg border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200">
                100%
              </span>
            </div>
            <div className="h-[1px] w-full mt-2 bg-gray-200 dark:bg-neutral-700"></div>
            <div className="mt-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-950 text-xs font-medium md:text-sm dark:text-neutral-200">
                  TVA & Mentions légales
                </span>
              </div>
              <div className="rounded-sm border border-blue-500 bg-blue-50 px-2 py-0.5 text-xs text-blue-500">
                Conforme
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-950 text-xs font-medium md:text-sm dark:text-neutral-200">
                  Numérotation auto
                </span>
              </div>
              <div className="rounded-sm border border-blue-500 bg-blue-50 px-2 py-0.5 text-xs text-blue-500">
                Actif
              </div>
            </div>
            <div className="mt-2 flex flex-col">
              <div
                className="mt-2 h-4 w-full rounded-full bg-gray-200 dark:bg-neutral-800"
                style={{ width: "85%" }}
              ></div>
              <div
                className="mt-2 h-4 w-full rounded-full bg-gray-200 dark:bg-neutral-800"
                style={{ width: "92%" }}
              ></div>
              <div
                className="mt-2 h-4 w-full rounded-full bg-gray-200 dark:bg-neutral-800"
                style={{ width: "78%" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
