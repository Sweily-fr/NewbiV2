"use client";
import React from "react";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";

export function HeroSection() {
  return (
    <>
      <main className="overflow-hidden">
        <section className="lg:min-h-screen flex items-start lg:items-center bg-white pt-44 sm:pt-48 lg:pt-24 mb-6 lg:mb-20 px-4 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-6xl w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="space-y-4 lg:space-y-6 text-center lg:text-left">
                <h1 className="text-balance font-medium text-4xl sm:text-5xl md:text-5xl lg:text-[3.5rem] leading-tight tracking-tight">
                  Votre trésorerie, claire et maîtrisée
                </h1>
                <h2 className="text-base sm:text-lg font-normal tracking-tight text-gray-600 dark:text-gray-300 mb-6 lg:mb-8 max-w-md mx-auto lg:mx-0">
                  Visualisez vos flux,{" "}
                  <strong className="font-medium text-gray-900">anticipez vos besoins</strong>{" "}
                  et prenez les bonnes décisions financières.
                </h2>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 lg:pt-4 justify-center lg:justify-start">
                  <Link href="/auth/signup" className="w-full sm:w-auto">
                    <Button size="lg" className="bg-[#1D1D1B] hover:bg-[#2D2D2B] text-white font-normal text-base rounded-lg px-6 w-full sm:w-auto">
                      Essayer 30 jours offerts
                    </Button>
                  </Link>
                  <Link href="https://meet.brevo.com/sweily/newbi" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="font-normal text-base rounded-lg px-6 w-full sm:w-auto">
                      Demander une démo
                    </Button>
                  </Link>
                </div>
                <p className="text-gray-400 text-xs pt-3 text-center lg:text-left">
                  Plusieurs entreprises nous font déjà confiance · Synchronisation bancaire incluse
                </p>
              </div>
              <div className="hidden lg:flex relative items-end justify-end overflow-visible pt-4">
                <div className="relative w-[1600px] xl:w-[1700px] -mr-96 xl:-mr-[28rem]">
                  <div className="relative">
                    <img src="/lp/tresorerie/tresorerie-hero.png" alt="Dashboard trésorerie Newbi" className="w-full h-auto" />
                    <div className="absolute inset-0 z-10 flex flex-col gap-3 p-6 pl-24 pt-7 pb-7">
                      <div className="bg-white rounded-xl shadow-xs border border-neutral-200 p-4 flex flex-col" style={{ flex: "3" }}>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-neutral-900">Trésorerie</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-green-600 font-medium">+6 766,01 €</span>
                            <div className="text-[10px] text-neutral-400 bg-neutral-50 rounded px-2 py-0.5">Cumul annuel</div>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-1">
                          <div className="flex flex-col justify-between text-[8px] text-neutral-400 py-1 pr-1">
                            <span>12K</span><span>9K</span><span>6K</span><span>3K</span><span>0€</span>
                          </div>
                          <div className="flex-1 relative">
                            <div className="absolute inset-0 flex flex-col justify-between">
                              {[0,1,2,3,4].map(i => (<div key={i} className="border-b border-neutral-100 w-full" />))}
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around px-1 gap-[3px]">
                              {[{h1:35,h2:20},{h1:45,h2:25},{h1:30,h2:15},{h1:55,h2:30},{h1:40,h2:22},{h1:50,h2:28},{h1:60,h2:35},{h1:38,h2:18},{h1:48,h2:26},{h1:42,h2:20},{h1:52,h2:30},{h1:58,h2:32}].map((bar,i) => (
                                <div key={i} className="flex gap-[1px] items-end">
                                  <div className="w-[8px] bg-green-500 rounded-t-sm" style={{"--h":`${bar.h1}px`,height:0,animation:`growBarUp 0.6s ease-out ${1.5+i*0.06}s forwards`}} />
                                  <div className="w-[8px] bg-red-500 rounded-t-sm" style={{"--h":`${bar.h2}px`,height:0,animation:`growBarUp 0.6s ease-out ${1.6+i*0.06}s forwards`}} />
                                </div>
                              ))}
                            </div>
                            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 120" preserveAspectRatio="none">
                              <defs><linearGradient id="treasuryGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#93c5fd" stopOpacity="0.3" /><stop offset="100%" stopColor="#93c5fd" stopOpacity="0" /></linearGradient></defs>
                              <path d="M0,80 C25,75 50,60 75,55 C100,50 125,65 150,45 C175,25 200,30 225,20 C250,15 275,18 300,15 L300,120 L0,120 Z" fill="url(#treasuryGrad)" opacity="0" style={{animation:"areaFade 1s ease-out 0.8s forwards"}} />
                              <path d="M0,80 C25,75 50,60 75,55 C100,50 125,65 150,45 C175,25 200,30 225,20 C250,15 275,18 300,15" fill="none" stroke="#93c5fd" strokeWidth="0.7" strokeDasharray="400" strokeDashoffset="400" style={{animation:"drawLine 1.2s ease-out 0.3s forwards"}} />
                            </svg>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 pt-2 border-t border-neutral-100">
                          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-green-500" /><span className="text-[9px] text-neutral-500">Entrées</span></div>
                          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-red-500" /><span className="text-[9px] text-neutral-500">Sorties</span></div>
                          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-[#93c5fd]" /><span className="text-[9px] text-neutral-500">Trésorerie</span></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-xl shadow-xs border border-neutral-200 p-4 h-[140px] flex flex-col overflow-hidden">
                          <div className="flex items-center justify-between mb-0"><h4 className="text-[10px] font-semibold text-neutral-900">Entrées</h4><span className="text-[8px] text-neutral-400 bg-neutral-50 rounded px-1.5 py-0.5">30j</span></div>
                          <p className="text-[14px] font-bold text-neutral-900 mb-0">12 480,00 €</p>
                          <div className="flex-1 relative -mx-4 -mb-4 flex">
                            <div className="flex flex-col justify-between text-[6px] text-neutral-400 py-1 pl-4 pr-1"><span>15K</span><span>10K</span><span>5K</span><span>0€</span></div>
                            <svg className="flex-1 h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
                              <defs><linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" /><stop offset="100%" stopColor="#22c55e" stopOpacity="0" /></linearGradient></defs>
                              <path d="M0,45 C15,42 25,38 40,30 C55,22 65,35 80,28 C95,21 110,18 125,25 C140,32 155,15 170,12 C185,9 195,14 200,10 L200,60 L0,60 Z" fill="url(#incomeGrad)" opacity="0" style={{animation:"areaFade 0.8s ease-out 1.2s forwards"}} />
                              <path d="M0,45 C15,42 25,38 40,30 C55,22 65,35 80,28 C95,21 110,18 125,25 C140,32 155,15 170,12 C185,9 195,14 200,10" fill="none" stroke="#22c55e" strokeWidth="0.7" strokeDasharray="300" strokeDashoffset="300" style={{animation:"drawLineIncome 1s ease-out 0.8s forwards"}} />
                            </svg>
                          </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-xs border border-neutral-200 p-4 h-[140px] flex flex-col overflow-hidden">
                          <div className="flex items-center justify-between mb-0"><h4 className="text-[10px] font-semibold text-neutral-900">Sorties</h4><span className="text-[8px] text-neutral-400 bg-neutral-50 rounded px-1.5 py-0.5">30j</span></div>
                          <p className="text-[14px] font-bold text-neutral-900 mb-0">8 240,00 €</p>
                          <div className="flex-1 relative -mx-4 -mb-4 flex">
                            <div className="flex flex-col justify-between text-[6px] text-neutral-400 py-1 pl-4 pr-1"><span>10K</span><span>7K</span><span>3K</span><span>0€</span></div>
                            <svg className="flex-1 h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
                              <defs><linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" /><stop offset="100%" stopColor="#ef4444" stopOpacity="0" /></linearGradient></defs>
                              <path d="M0,35 C15,38 30,30 45,25 C60,20 75,32 90,38 C105,44 120,28 135,22 C150,16 165,30 180,35 C190,38 195,32 200,30 L200,60 L0,60 Z" fill="url(#expenseGrad)" opacity="0" style={{animation:"areaFade 0.8s ease-out 1.4s forwards"}} />
                              <path d="M0,35 C15,38 30,30 45,25 C60,20 75,32 90,38 C105,44 120,28 135,22 C150,16 165,30 180,35 C190,38 195,32 200,30" fill="none" stroke="#ef4444" strokeWidth="0.7" strokeDasharray="300" strokeDashoffset="300" style={{animation:"drawLineIncome 1s ease-out 1s forwards"}} />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    <style>{`
                      @keyframes growBarUp { from { height: 0; } to { height: var(--h); } }
                      @keyframes drawLine { from { stroke-dashoffset: 400; } to { stroke-dashoffset: 0; } }
                      @keyframes areaFade { from { opacity: 0; } to { opacity: 1; } }
                      @keyframes drawLineIncome { from { stroke-dashoffset: 300; } to { stroke-dashoffset: 0; } }
                    `}</style>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
